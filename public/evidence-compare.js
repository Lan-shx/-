(function(){
'use strict';
const original=renderJobs;
renderJobs=function(){
 original();$('evidence-compare-bar')?.remove();if(journeyView!=='jobs')return;
 const bar=document.createElement('section');bar.id='evidence-compare-bar';bar.setAttribute('aria-label','岗位比较操作');
 const selected=rows.filter(r=>state.selected.has(r.id));
 bar.innerHTML='<div class="evidence-compare-intro">'+v2Icon('compare')+'<strong>岗位比较</strong><span>'+ (selected.length?'已选 '+selected.length+'/3 个岗位':'在下方点击「加入比较」，选择 2–3 个岗位')+'</span></div><div class="evidence-compare-actions"><button id="evidence-compare-go" class="primary">'+(selected.length>=2?'比较已选岗位（'+selected.length+'/3）':selected.length?'继续选择岗位（1/3）':'打开岗位比较')+'</button>'+(selected.length?'<button class="text-button" data-evidence-clear>清空</button>':'')+'</div>'+(selected.length?'<div class="evidence-selected">'+selected.map(r=>'<button class="button" data-evidence-remove="'+esc(r.id)+'" aria-label="移除比较 '+esc(r.title)+'">'+esc(r.title)+' ×</button>').join('')+'</div>':'');
 document.querySelector('#analysis .jobs-panel').prepend(bar);$('evidence-compare-go').onclick=showCompare;
 $('job-rows').querySelectorAll('input[data-compare]').forEach(input=>{const label=document.createElement('label');label.className='evidence-pick'+(input.checked?' selected':'');input.before(label);label.append(input);label.insertAdjacentHTML('beforeend','<span>'+(input.checked?'已加入':'加入比较')+'</span>');});
};
document.addEventListener('change',e=>{if(!e.target.dataset.compare||journeyView!=='jobs')return;const id=e.target.dataset.compare;renderJobs();document.querySelector('input[data-compare="'+CSS.escape(id)+'"]')?.focus({preventScroll:true});});
document.addEventListener('click',e=>{const b=e.target.closest('[data-evidence-remove],[data-evidence-clear]');if(!b)return;if('evidenceClear'in b.dataset)state.selected.clear();else state.selected.delete(b.dataset.evidenceRemove);renderJobs();});
})();

