const state={data:null,filter:'all',checks:JSON.parse(localStorage.getItem('task-checks-v1')||'{}')};
const $=s=>document.querySelector(s);
const escapeHtml=s=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

async function load(){
  $('#syncStatus').textContent='Atualizando…';
  try{
    const res=await fetch(`./data.json?t=${Date.now()}`,{cache:'no-store'});
    if(!res.ok) throw new Error('Falha ao carregar');
    state.data=await res.json();
    render();
    $('#syncStatus').textContent=`Sincronizado ${new Date(state.data.updatedAt).toLocaleString('pt-BR')}`;
  }catch(e){
    $('#syncStatus').textContent='Sem conexão — mostrando dados salvos';
    $('#taskList').innerHTML='<div class="empty">Não foi possível atualizar os dados agora.</div>';
  }
}

function taskDone(t){return state.checks[`task:${t.id}`] ?? t.done;}
function subDone(t,i){return state.checks[`sub:${t.id}:${i}`] ?? false;}
function persist(){localStorage.setItem('task-checks-v1',JSON.stringify(state.checks));}

function render(){
  const tasks=state.data.tasks;
  const done=tasks.filter(taskDone).length;
  const pct=tasks.length?Math.round(done/tasks.length*100):0;
  $('#doneCount').textContent=done;
  $('#pendingCount').textContent=tasks.length-done;
  $('#progressPct').textContent=`${pct}%`;
  $('#progressBar').style.width=`${pct}%`;

  const filtered=tasks.filter(t=>state.filter==='all'||(state.filter==='done'&&taskDone(t))||(state.filter==='pending'&&!taskDone(t)));
  $('#taskList').innerHTML=filtered.length?filtered.map(taskCard).join(''):'<div class="empty">Nenhuma tarefa neste filtro.</div>';
  $('#activityList').innerHTML=state.data.activity?.length?state.data.activity.map(a=>`<div class="activity"><strong>${escapeHtml(a.title)}</strong><div>${escapeHtml(a.detail||'')}</div><small>${new Date(a.at).toLocaleString('pt-BR')}</small></div>`).join(''):'<div class="empty">Nenhuma atualização automática registrada ainda.</div>';

  document.querySelectorAll('[data-task]').forEach(el=>el.addEventListener('change',()=>{
    state.checks[`task:${el.dataset.task}`]=el.checked;persist();render();
  }));
  document.querySelectorAll('[data-sub]').forEach(el=>el.addEventListener('change',()=>{
    state.checks[`sub:${el.dataset.task}:${el.dataset.sub}`]=el.checked;persist();
  }));
}

function taskCard(t){
  const done=taskDone(t);
  return `<article class="task-card ${done?'done':''}">
    <input class="check" type="checkbox" data-task="${escapeHtml(t.id)}" ${done?'checked':''} aria-label="Marcar ${escapeHtml(t.title)}">
    <div>
      <h3>${escapeHtml(t.title)}</h3>
      <div class="meta"><span class="pill">${escapeHtml(t.category)}</span><span class="pill">Prioridade ${escapeHtml(t.priority)}</span></div>
      <div class="subtasks">${t.subtasks.map((s,i)=>`<label class="subtask"><input type="checkbox" data-task="${escapeHtml(t.id)}" data-sub="${i}" ${subDone(t,i)?'checked':''}><span>${escapeHtml(s)}</span></label>`).join('')}</div>
    </div>
  </article>`;
}

document.querySelectorAll('.chip').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.chip').forEach(b=>b.classList.remove('active'));btn.classList.add('active');state.filter=btn.dataset.filter;render();
}));
$('#refreshBtn').addEventListener('click',load);
load();
setInterval(load,5*60*1000);
