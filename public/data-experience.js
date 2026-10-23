(function(){
'use strict';
let checked=false,chartOptionsOpen=false,manifest=null;
const status=$('load-status');
function loading(title,message,error=false){
 status.hidden=false;status.setAttribute('role',error?'alert':'status');
 status.innerHTML='<h1>'+title+'</h1><p id="data-load-message">'+message+'</p>'+(error?'<button id="data-load-retry" class="primary">重新载入数据</button>':'<progress id="data-load-progress" aria-label="招聘数据载入进度"></progress>')+'<p class="data-load-note">这是历史招聘样本；完成载入后再展示统计，不会把未载入的记录当成零。</p>';
 if(error)$('data-load-retry').onclick=()=>location.reload();
}
function isImported(){return rows.length&&rows[0].source==='本次导入'&&rows.every(r=>r.source==='本次导入');}
function banner(){
 if(!bundle||!rows.length)return;
 let host=$('data-status-summary');if(!host){host=document.createElement('aside');host.id='data-status-summary';host.setAttribute('aria-label','数据状态与时间');const anchor=$('journey-market-tabs')||$('journey-mobile-nav');if(anchor)anchor.after(host);else decisionRoot.before(host);}
 const imported=isImported(),coverage=bundle.sampling||{};
 host.innerHTML='<div><strong>'+esc(imported?'本次导入数据':checked?'历史样本已校验':'历史样本已载入')+'</strong><span>'+fmt(rows.length)+' 条记录</span><span>'+esc(imported?'未对导入来源独立核验':'底座整理 '+(bundle.collectedAt||'未披露'))+'</span></div><details><summary>数据时间与来源</summary><p>'+(imported?'当前使用本浏览器导入的记录，原样本覆盖期不适用于这批数据。':'样本纳入日期窗口：'+esc(coverage.dateFrom||'未披露')+' 至 '+esc(coverage.dateTo||'未披露')+'（原始发布或维护日期至少一项命中窗口）。底座整理日期：'+esc(bundle.collectedAt||'未披露')+'。')+'</p><p>本次页面载入已完成，不表示招聘数据刚刚更新。历史便利样本不代表全市场，岗位是否仍在招须核对原页。</p><button class="text-button" data-v2-route="methods/methods">核对来源与统计口径</button></details>';
}
window.DataExperience={
 start(){document.body.dataset.dataState='loading';loading('正在载入职业市场样本','先读取数据说明，再核对招聘记录；完成后即可开始探索。');},
 manifest(data){manifest=data;const count=data.rowCount||data.rows?.length||0;const p=$('data-load-message');if(p)p.textContent='正在载入 '+fmt(count)+' 条历史招聘记录。';},
 progress(loaded,total){const p=$('data-load-message'),bar=$('data-load-progress');if(p)p.textContent='已载入并核对 '+fmt(loaded)+' / '+fmt(total)+' 条记录';if(bar){bar.max=total;bar.value=loaded;}},
 verified(value){checked=value;},
 ready(){document.body.dataset.dataState='ready';status.hidden=true;banner();},
 failed(error){document.body.dataset.dataState='error';const message=error.name==='AbortError'?'数据请求超时。请检查网络后重试。':/integrity|Incomplete|Invalid|SyntaxError/.test(error.message||error.name)?'数据文件未通过完整性检查，本次不展示部分统计。请重新载入。':'数据暂时无法载入。请检查网络后重试。';loading('数据尚未载入',message,true);},
 state(){return {phase:document.body.dataset.dataState,checked,coverage:manifest?.sampling||null};}
};
const oldAnalysis=v2Analysis;
v2Analysis=function(){
 oldAnalysis();const finding=$('analysis-finding'),panel=$('workbench-tabpanel');if(!finding||!panel)return;finding.textContent=finding.textContent.replace('机会排在','招聘记录数排在').replace('机会排名','招聘记录数量排序');
 const summary=document.createElement('section');summary.id='analysis-summary';summary.setAttribute('aria-label','关键发现与下一步');
 summary.innerHTML='<h2>先看当前样本的发现</h2><div class="analysis-summary-actions"><button class="button" data-v2-route="jobs">核对真实岗位</button><button class="button" data-journey-ask>让助手解释</button><button class="text-button" data-data-open-query>用一句话调整范围</button></div>';
 summary.firstElementChild.after(finding);const stats=panel.querySelector('.workbench-stats');if(stats)stats.before(summary);else panel.prepend(summary);
 const foot=panel.querySelector('.workbench-analysis-foot');if(foot){const availability=foot.querySelector('details');if(availability)summary.append(availability);foot.remove();}
 const controls=panel.querySelector('.workbench-controls');if(controls){const details=document.createElement('details');details.id='analysis-chart-options';details.open=chartOptionsOpen;details.innerHTML='<summary>调整图表与展示</summary>';controls.before(details);details.append(controls);details.ontoggle=()=>chartOptionsOpen=details.open;}
};
const oldRender=render;
render=function(){oldRender();if(!bundle)return;banner();if(journeyView==='analysis'&&$('analysis-summary'))decisionRoot.querySelector('.journey-next')?.remove();};
document.addEventListener('click',e=>{if(e.target.closest('[data-data-open-query]')){$('query-details').open=true;$('query-input').focus();$('query-workbench').scrollIntoView({block:'start',behavior:'smooth'});}});
})();
