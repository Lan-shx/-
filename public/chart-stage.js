(function(){
'use strict';
sectionDefaults.demand.view='bubble';
const market=()=>['analysis','explorer','compare'].includes(journeyView);
const action=(label,attrs,icon)=>'<button class="button" '+attrs+'>'+v2Icon(icon)+'<span>'+label+'</span></button>';
function provenance(){return '<details class="chart-provenance"><summary>口径与来源</summary><p>底座整理 '+esc(bundle.collectedAt||'未披露')+' · 历史便利样本，不代表实时在招或全市场。月薪按区间中点统计，n&lt;10 留空。</p><button class="text-button" data-v2-route="methods/methods">数据来源</button><button class="text-button" data-chart-query>一句话查询</button></details>';}
function rail(title,stats,finding){
 const side=document.createElement('aside');side.className='chart-aside';side.setAttribute('aria-label','图表解读与操作');side.innerHTML='<h2>'+v2Icon('chart')+'<span>'+title+'</span></h2>';
 if(stats)side.append(stats);if(finding){const text=document.createElement('div');text.className='chart-finding';text.append(finding);side.append(text);}
 const actions=document.createElement('div');actions.className='chart-actions';actions.innerHTML=action('岗位证据','data-chart-jobs','role')+action('助手解读','data-chart-ask','help');side.append(actions);return side;
}
function analysisStage(){
 const panel=$('workbench-tabpanel');if(!panel)return;const stats=panel.querySelector('.workbench-stats'),finding=$('analysis-finding'),scope=panel.querySelector('.workbench-context');
 if(finding&&sectionState().view==='bubble'&&explorerGroups.length){const shown=explorerGroups,largest=[...shown].sort((a,b)=>b.n-a.n)[0],paid=shown.filter(g=>g.salaryN>=10&&g.p50!==null).sort((a,b)=>b.p50-a.p50)[0];finding.textContent='当前显示组中，'+largest.name+'记录最多（'+fmt(largest.n)+'条）。'+(paid?paid.name+'月薪中位数最高（'+money(paid.p50)+'元，有效 n='+fmt(paid.salaryN)+'）。':'各组有效月薪不足10条，薪资不汇总。');}
 const summary=$('analysis-summary'),plot=panel.querySelector('.workbench-panel')||panel.querySelector('.workbench-empty');if(!plot)return;
 const side=rail('图表解读',stats,finding),stage=document.createElement('div');stage.className='market-stage';panel.prepend(stage);stage.append(plot,side);const tools=document.createElement('div');tools.className='chart-tools';tools.setAttribute('aria-label','图表设置与说明');stage.append(tools);
 if(scope){scope.classList.add('chart-scope');scope.querySelector('button[data-scope-open]')?.remove();side.append(scope);}
 const view=$('analysis-view')?.closest('label');if(view){view.classList.add('chart-view-picker');plot.querySelector('.workbench-panel-heading')?.append(view);view.firstChild.textContent='图形';}
 const settings=$('analysis-chart-options');if(settings){settings.querySelector('summary').textContent='图表设置';tools.append(settings);}
 const caption=document.createElement('p');caption.className='chart-caption';const rs=analysisRecords();caption.textContent=fmt(rs.length)+' 条记录 · 有效月薪 '+fmt(rs.filter(validSalary).length)+' 条 · 历史样本'+(sectionState().view==='bubble'?' · 气泡面积 = 有效月薪样本数':'')+(['bubble','box','distribution','cdf'].includes(sectionState().view)||workbench.tab==='salary'?' · 月薪 n<10 留空':'');plot.append(caption);
 const short=document.createElement('p');short.className='chart-reading';short.textContent=$('explorer-reading')?.textContent||'单元格展示职业与城市的交集，颜色越深表示数值越大。';side.querySelector('.chart-finding')?.after(short);const notes=document.createElement('details');notes.className='chart-provenance';notes.innerHTML='<summary>图形说明</summary>';const reading=$('explorer-reading'),grammar=$('chart-grammar');if(reading)notes.append(reading);if(grammar)notes.append(grammar);plot.querySelectorAll('.workbench-reading').forEach(p=>notes.append(p));tools.append(notes);
 tools.insertAdjacentHTML('beforeend',provenance());summary?.remove();panel.querySelectorAll('.v2-source-note').forEach(n=>n.remove());
 const chart=$('explorer-chart');if(chart){chart.classList.add('stage-chart');if(explorerChart){explorerChart.resize();mainSVG=explorerChart.renderToSVGString();}}
}
function mapStage(){
 decisionRoot.querySelector(':scope>.v2-kpis')?.remove();decisionRoot.querySelector('.v2-source-note')?.remove();
 const region=$('v2-region');if(!region)return;const more=region.querySelector('.chart-provenance');decisionRoot.querySelectorAll('.v2-map-toolbar [data-v2-gap]').forEach(b=>more?.append(b));
 decisionRoot.querySelectorAll('.v2-ranking').forEach((el,i)=>{const rs=decisionRecords(),gs=i===1?directionStats(rs).sort((a,b)=>b.n-a.n):v2CityGroups(rs).filter(g=>i!==2||g.p50!==null).sort((a,b)=>i===2?b.p50-a.p50:b.n-a.n),top=gs[0];el.insertAdjacentHTML('beforeend','<p class="chart-caption">'+(top?esc(top.name)+(i===2?'在当前城市组中月薪中位数最高，'+money(top.p50)+'元，有效 n='+fmt(top.salaryN):'在当前显示范围记录最多，'+fmt(top.n)+'条')+'。仅描述样本。':'当前范围证据不足。')+'</p>');});
}
const originalRegion=v2Region;
v2Region=function(rs){const host=document.createElement('div');host.innerHTML=originalRegion(rs);const side=host.firstElementChild;side.querySelector('.v2-region-gap')?.remove();const gs=v2CityGroups(rs),top=[...gs].sort((a,b)=>v2.metric==='salary'?(b.p50??-1)-(a.p50??-1):b.n-a.n).find(g=>v2.metric!=='salary'||g.p50!==null);const city=cmo.selection?.city,g=city?gs.find(g=>g.name===city):null;
 const text=g?esc(city)+'在当前范围有 '+fmt(g.n)+' 条记录。'+(g.p50!==null?'月薪中位数 '+money(g.p50)+' 元，有效 n='+fmt(g.salaryN)+'。':'有效月薪不足10条，薪资留空。'):top?esc(top.name)+(v2.metric==='salary'?'的样本月薪中位数在当前城市组中最高（'+money(top.p50)+'元，有效 n='+fmt(top.salaryN)+'）。':'的记录数在当前城市组中最多（'+fmt(top.n)+'条）。'):'当前范围没有可展示的城市样本。';
 side.insertAdjacentHTML('afterbegin','<section class="map-reading"><h2>地图解读</h2><p>'+text+'</p><p class="chart-caption">圆面积表示记录数'+(v2.metric==='salary'?'，蓝色深浅表示月薪中位数；灰色为 n&lt;10':'')+'。多城市记录不相加，不代表招聘人数。</p></section>');side.insertAdjacentHTML('beforeend','<details class="chart-provenance map-summary"><summary>当前范围统计</summary>'+v2Summary(rs,gs)+'</details>'+provenance());return side.outerHTML;};
const originalRegionResult=v2RegionResult;v2RegionResult=function(cities){originalRegionResult(cities);$('v2-region')?.insertAdjacentHTML('afterbegin','<h2>地图解读</h2><p class="chart-caption">以下为框选城市的去重记录；区域与单城总数采用不同去重范围，不相加。</p>');};
const oldRender=render;
render=function(){document.body.classList.toggle('market-canvas',market());oldRender();if(!bundle)return;if(journeyView==='analysis')analysisStage();if(journeyView==='explorer')mapStage();if(journeyView==='compare')decisionRoot.querySelector('.journey-steps')?.remove();if(market())decisionRoot.querySelector('.journey-next')?.remove();document.querySelectorAll('.journey-steps').forEach(n=>n.remove());};
function chartContext(){const f=v2Clone(state.filters);let context='';if(journeyView==='analysis'&&v2.focus){if(v2.focus.city)f.cities=[v2.focus.city];if(v2.focus.role){f.occupations=[v2.focus.role];f.major='';}}if(journeyView==='compare'){const c=v2Comparison(),key={city:'cities',occupation:'occupations',industry:'industries'}[c.axis];if(key)f[key]=c.values.slice();if(c.axis==='occupation')f.major='';context=JSON.stringify(c);}return {filters:f,context};}
document.addEventListener('click',e=>{if(e.target.closest('[data-chart-jobs]')){state.filters=chartContext().filters;v2Route('jobs');}if(e.target.closest('[data-chart-ask]')){const ctx=chartContext(),comparison=journeyView==='compare'?v2Comparison():null;const question=comparison?'请比较'+comparison.values.map(id=>comparison.axis==='occupation'?cmoName(id):id).join('与')+'的样本差异与局限。':'请解释当前图表中岗位、薪资和招聘要求的差异，并说明样本局限。';ResearchAssistant.openContext(question,ctx.filters,ctx.context);}if(e.target.closest('[data-chart-query]')){const panel=$('query-workbench');panel.classList.toggle('chart-query-open');$('query-details').open=panel.classList.contains('chart-query-open');if($('query-details').open){$('query-input').focus();panel.scrollIntoView({block:'start'});}}});
})();
