(function(){
  'use strict';
  const clone=v2Clone;
  const queryState={plan:null,undo:null,last:null,cache:null,cacheRows:null,busy:false};
  let identityRows=null,identityValue='';
  const importedData=()=>rows.length>0&&rows.every(r=>r.source==='本次导入');
  function dataIdentity(){if(identityRows===rows)return identityValue;identityRows=rows;if(!importedData())return identityValue=bundle.sampling?.poolSha256||bundle.collectedAt;let hash=2166136261;const text=JSON.stringify(rows);for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);return identityValue='import-'+rows.length+'-'+(hash>>>0).toString(16);}
  const originalMatches=matches;
  matches=function(r,f){
    if(f.nlExperienceUnlimited&&!/经验不限|不限经验|经验不要求|无经验要求|^不限$/.test(r.experience||''))return false;
    if(f.nlExperience){const m=String(r.experience||'').match(/(\d+)\s*(?:[-–至到]\s*\d+)?\s*年/);if(!m||Number(m[1])<f.nlExperience.low||Number(m[1])>f.nlExperience.high)return false;}
    if(f.nlIntern&&!/实习/.test([r.title,r.employmentType,r.hiringChannel,r.experience].join(' ')))return false;
    if(f.nlGraduate&&!/应届|校招|校园招聘|毕业生/.test([r.title,r.hiringChannel,r.experience].join(' ')))return false;
    if(f.nlSalaryStrict==='lower'&&(!validSalary(r)||r.salaryMin<=Number(f.salaryLow)))return false;
    if(f.nlSalaryStrict==='upper'&&(!validSalary(r)||r.salaryMax>=Number(f.salaryHigh)))return false;
    for(const [key,values]of Object.entries(f.nlExclude||{})){
      const actual=key==='cities'?[...(r.workCities||[]),...(r.cityGroups||[])]:key==='skills'?r.skills||[]:[String(r[dims[key]?.[1]]||'')];
      if(values.some(v=>actual.includes(v)))return false;
    }
    return originalMatches(r,f);
  };
  // The legacy form has no controls for these additional predicates; preserve them.
  const oldReadForm=readForm;
  readForm=function(){const f=oldReadForm();for(const k of ['nlExclude','nlIntern','nlGraduate','nlSalaryStrict','nlExperience','nlExperienceUnlimited'])if(state.filters[k]!==undefined)f[k]=clone(state.filters[k]);return f;};
  const panel=document.createElement('section');panel.id='query-workbench';panel.setAttribute('aria-label','一句话查询');scopeBar.after(panel);
  panel.innerHTML=`<details id="query-details"><summary><span>一句话查询</span><small id="query-summary">输入城市、职业或想比较的问题</small></summary><div class="query-body"><form id="query-plan-form"><label for="query-input">想研究什么？</label><div class="query-input-row"><input id="query-input" maxlength="300" autocomplete="off" placeholder="比较深圳和杭州的数据分析薪资"><button class="primary" id="query-parse" type="submit">解析条件</button></div><div class="query-options"><label>查询范围<select id="query-mode"><option value="new">重新查询</option><option value="applied">修改当前已应用范围</option><option value="draft">修改当前待应用条件</option></select></label><span>本机规则识别 · 历史招聘样本</span></div></form><div class="query-examples" aria-label="示例问句">${['比较深圳和杭州的数据分析薪资','找上海月薪1万以上的会计岗位','广州供应链岗位主要要求哪些技能','市场营销专业有哪些相关方向'].map(t=>`<button class="text-button" data-query-example="${esc(t)}">${esc(t)}</button>`).join('')}</div><div id="query-preview" aria-live="polite"></div><div id="query-answer" aria-live="polite"></div></div></details>`;
  function context(){
    if(queryState.cacheRows!==rows){
      const options={};for(const key of ['cities','occupations','educations','experiences','hiringTypes','hiringChannels','skills','industries','sources'])options[key]=opts(key).filter(o=>!['未披露','不限','其他','其他大陆城市'].includes(o.label));
      queryState.cache={options,majors:bundle.taxonomy.majors,coverageEnd:importedData()?null:bundle.sampling?.dateTo};queryState.cacheRows=rows;
    }
    const mode=$('query-mode').value;return {...queryState.cache,today:deadlineCutoff(),base:mode==='new'?defaultFilters():clone(mode==='draft'?v2State().draft:state.filters)};
  }
  const targetNames={jobs:'岗位证据',salary:'指标分析 · 薪资分析',requirements:'指标分析 · 岗位画像',compare:'对比分析',explore:'职业探索'};
  const scalarLabels={query:'岗位 / 技能关键词',company:'企业关键词',major:'专业映射',salaryLow:'月薪下限（元）',salaryHigh:'月薪上限（元）',dateFrom:'开始日期',dateTo:'结束日期'};
  function fieldName(key,value){return key==='occupations'?cmoName(value):value;}
  function conditionRows(f){
    const result=[];
    for(const key of Object.keys(dims))if(f[key]?.length)result.push([dims[key][0],f[key].map(v=>fieldName(key,v)).join('、')]);
    for(const [key,name]of Object.entries(scalarLabels))if(f[key]!==''&&f[key]!=null)result.push([name,String(f[key])]);
    for(const [key,list]of Object.entries(f.nlExclude||{}))if(list.length)result.push(['排除'+(CareerQuery.labels[key]||key),list.map(v=>fieldName(key,v)).join('、')]);
    for(const [k,n]of [['nlIntern','明示实习'],['nlGraduate','明示应届 / 校招'],['entryOnly','明示应届 / 实习'],['salaryOnly','有效月薪已披露'],['majorRequired','企业明示专业要求'],['includeUnknownCity','包含城市未明确记录']])if(f[k])result.push([n,'是']);
    result.push(['截止状态',f.jobStatus==='current'?'未明确截止，需核对原页':f.jobStatus==='expired'?'已明确截止':'全部历史记录']);
    if(f.dateFrom||f.dateTo)result.push(['日期口径',(f.dateField==='publishedAt'?'发布日期':'更新日期')+(f.keepUnknownDate?' · 保留日期未知':' · 排除日期未知')]);
    if(f.salaryLow!==''||f.salaryHigh!=='')result.push(['薪资匹配',({contained:'完整薪资区间满足边界',overlap:'薪资区间有重叠',midpoint:'区间中点在范围内'})[f.salaryMode]+(f.nlSalaryStrict?' · 严格'+(f.nlSalaryStrict==='lower'?'高于下限':'低于上限'):'')]);
    if(f.nlExperience)result.push(['企业最低经验',f.nlExperience.low+'–'+f.nlExperience.high+'年']);if(f.nlExperienceUnlimited)result.push(['经验','原文明示经验不限']);
    if(f.skills?.length)result.push(['技能关系',f.skillMode==='all'?'全部满足':'任一满足']);
    return result;
  }
  function editsHTML(f){
    const arrays=Object.keys(dims).filter(k=>f[k]?.length).map(key=>`<label>${esc(dims[key][0])}<input data-query-array="${key}" value="${esc(f[key].map(v=>fieldName(key,v)).join('、'))}" aria-label="修改${esc(dims[key][0])}"></label>`).join('');
    const exclusions=Object.entries(f.nlExclude||{}).map(([key,list])=>`<label>排除${esc(CareerQuery.labels[key]||key)}<input data-query-exclude="${key}" value="${esc(list.map(v=>fieldName(key,v)).join('、'))}"></label>`).join('');
    return `<details class="query-edit"><summary>修改识别条件</summary><p>多选用“、”分隔；名称须与站内选项一致。留空即可清除此项。</p><div class="query-edit-grid">${arrays}${exclusions}${f.nlExperience?`<label>企业最低经验下界（年）<input type="number" min="0" max="60" id="query-exp-low" value="${f.nlExperience.low}"></label><label>企业最低经验上界（年）<input type="number" min="0" max="60" id="query-exp-high" value="${f.nlExperience.high}"></label>`:''}${Object.entries(scalarLabels).filter(([k])=>k!=='major').map(([k,n])=>`<label>${n}<input data-query-field="${k}" type="${k.startsWith('salary')?'number':k.startsWith('date')?'date':'text'}" ${k.startsWith('salary')?'min="0"':''} value="${esc(f[k]||'')}"></label>`).join('')}<label>薪资匹配<select data-query-field="salaryMode">${[['contained','整个区间满足边界'],['overlap','与目标区间有重叠'],['midpoint','区间中点位于范围内']].map(([v,n])=>`<option value="${v}" ${f.salaryMode===v?'selected':''}>${n}</option>`).join('')}</select></label><label>日期字段<select data-query-field="dateField"><option value="updatedAt" ${f.dateField==='updatedAt'?'selected':''}>更新日期</option><option value="publishedAt" ${f.dateField==='publishedAt'?'selected':''}>发布日期</option></select></label><label>技能关系<select data-query-field="skillMode"><option value="any" ${f.skillMode==='any'?'selected':''}>任一技能</option><option value="all" ${f.skillMode==='all'?'selected':''}>全部技能</option></select></label><label>截止状态<select data-query-field="jobStatus">${[['all','全部历史记录'],['current','未明确截止，需核对原页'],['expired','已明确截止']].map(([v,n])=>`<option value="${v}" ${f.jobStatus===v?'selected':''}>${n}</option>`).join('')}</select></label>${[['nlExperienceUnlimited','原文明示经验不限'],['nlIntern','明示实习'],['nlGraduate','明示应届 / 校招'],['entryOnly','应届 / 实习'],['keepUnknownDate','保留日期未知'],['includeUnknownCity','包含城市未知'],['salaryOnly','仅有效月薪'],['majorRequired','企业明示专业要求']].map(([k,n])=>`<label class="query-check"><input type="checkbox" data-query-boolean="${k}" ${f[k]?'checked':''}>${n}</label>`).join('')}</div></details>`;
  }
  function preview(){const p=queryState.plan;if(!p)return;
    $('query-preview').innerHTML=`<div class="query-preview-head"><strong>核对后应用</strong><span>将打开：${targetNames[p.intent]}</span></div>${p.errors.length?`<ul class="query-errors">${p.errors.map(e=>`<li>${esc(e)}</li>`).join('')}</ul>`:''}<dl class="query-conditions">${conditionRows(p.filters).map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><p class="query-muted">本次变更：${esc(p.changes.join('、')||'仅分析任务')}。上方列出执行时的完整范围。</p>${p.notes.map(n=>`<p class="query-muted">${esc(n)}</p>`).join('')}${p.unknown.length?`<label class="query-unknown"><input id="query-ignore" type="checkbox">我确认忽略未识别内容：<b>${esc(p.unknown.join('、'))}</b></label><p class="query-muted">忽略后不会按这些内容筛选；也可以修改问句重新解析。</p>`:''}${editsHTML(p.filters)}<div class="query-actions"><button type="button" class="primary" id="query-apply" ${p.errors.length||p.unknown.length?'disabled':''}>应用查询</button><button type="button" class="text-button" id="query-cancel">取消预览</button></div><p id="query-validation" role="status"></p>`;
    $('query-ignore')?.addEventListener('change',()=>{$('query-apply').disabled=p.errors.length>0||!$('query-ignore').checked;});
    $('query-cancel').onclick=()=>{queryState.plan=null;$('query-preview').innerHTML='';};$('query-apply').onclick=apply;
  }
  function parse(){if(!bundle){$('query-preview').textContent='数据正在加载，请稍后重试；输入已保留。';return;}queryState.plan=CareerQuery.parse($('query-input').value,context());queryState.plan.dataRef=rows;queryState.plan.scopeRef=JSON.stringify({filters:state.filters,draft:v2State().draft});queryState.plan.mode=$('query-mode').value;$('query-summary').textContent='待应用 · '+queryState.plan.input;preview();}
  function snapshot(){return {filters:clone(state.filters),modes:clone(v2.modes),shared:clone(workbench.shared),view:journeyView,tab:workbench.tab,sections:clone(workbench.sections),focus:clone(v2.focus),objects:clone(v2.objects),comparison:v2Comparison(),cities:[...cmo.cities],industries:[...cmo.industries],directions:[...directionIDs],selection:clone(cmo.selection),career:workbench.career,careerDetail:workbench.careerDetail,page:state.page,favorites:state.favorites};}
  function editedFilters(p){const f=clone(p.filters),errors=[];
    document.querySelectorAll('[data-query-boolean]').forEach(el=>f[el.dataset.queryBoolean]=el.checked);
    document.querySelectorAll('[data-query-field]').forEach(el=>f[el.dataset.queryField]=el.value.trim());
    for(const el of document.querySelectorAll('[data-query-array],[data-query-exclude]')){const key=el.dataset.queryArray||el.dataset.queryExclude;const options=queryState.cache.options[key]||opts(key);const values=[];for(const label of el.value.split(/[、,，]/).map(x=>x.trim()).filter(Boolean)){const o=options.find(x=>x.label===label);if(!o)errors.push('无法识别'+dims[key][0]+'：'+label);else values.push(String(o.value));}if(el.dataset.queryExclude){f.nlExclude||={};f.nlExclude[key]=values;}else{if(key==='occupations'&&JSON.stringify(values)!==JSON.stringify(f[key]))f.major='';f[key]=values;}}
    for(const [key,values]of Object.entries(f.nlExclude||{}))if(values.some(v=>f[key]?.includes(v)))errors.push('包含与排除条件冲突：'+(CareerQuery.labels[key]||key));
    if(f.salaryLow!==''&&f.salaryHigh!==''&&Number(f.salaryLow)>Number(f.salaryHigh))errors.push('月薪下限不能高于上限。');
    if([f.salaryLow,f.salaryHigh].some(x=>x!==''&&(!Number.isFinite(Number(x))||Number(x)<0)))errors.push('月薪必须是非负数字。');
    if(f.dateFrom&&f.dateTo&&f.dateFrom>f.dateTo)errors.push('开始日期不能晚于结束日期。');
    if($('query-exp-low')){const lo=$('query-exp-low').value,hi=$('query-exp-high').value;if(lo===''&&hi==='')delete f.nlExperience;else if(lo===''||hi===''||Number(lo)<0||Number(hi)>60||Number(lo)>Number(hi))errors.push('经验年限范围无效；清空两项可取消此条件。');else f.nlExperience={low:Number(lo),high:Number(hi)};}if(f.nlExperience&&f.nlExperienceUnlimited)errors.push('经验不限和指定年限不能同时应用。');
    if(f.salaryMode!=='contained')delete f.nlSalaryStrict;
    return {f,errors};
  }
  function apply(){const p=queryState.plan;if(!p||queryState.busy)return;
    if(p.dataRef!==rows){$('query-validation').textContent='数据已发生变化，请重新解析。';return;}
    if(p.mode!=='new'&&p.scopeRef!==JSON.stringify({filters:state.filters,draft:v2State().draft})){$('query-validation').textContent='当前范围已变化，请重新解析后应用。';return;}
    const {f,errors}=editedFilters(p);let axisKey={city:'cities',occupation:'occupations',industry:'industries'}[p.axis];
    if(p.intent==='compare'&&(!axisKey||f[axisKey].length<2||f[axisKey].length>3))errors.push('比较需保留2–3个同维度对象。');
    if(errors.length){$('query-validation').textContent=errors.join(' ');return;}
    queryState.undo=snapshot();queryState.busy=true;
    try{
      const target=p.intent==='compare'?'compare':p.intent==='explore'?'discover':p.intent==='jobs'?'jobs':'analysis';
      // Establish the destination before applying, to avoid a saved mode overwriting the query.
      goJourney(target);if(p.intent==='salary')workbench.tab='salary';if(p.intent==='requirements'){workbench.tab='profile';workbench.sections.profile={...sectionDefaults.profile,group:/技能/.test(p.input)?'skills':/学历/.test(p.input)?'education':'experience',limit:10,stat:'p50',numbers:true};}
      if(p.intent==='compare'){cmo.compareAxis=p.axis;cmo.structure=/薪资|工资|月薪/.test(p.input)?'salary':/技能/.test(p.input)?'skills':'experience';const set=p.axis==='city'?cmo.cities:p.axis==='occupation'?directionIDs:cmo.industries;set.clear();f[axisKey].forEach(x=>set.add(x));}
      if(applyFilters(f)===false)throw Error('筛选条件未通过校验。');
      queryState.last={input:p.input,version:p.version,filters:clone(f),intent:p.intent,dataVersion:dataIdentity(),coverageEnd:importedData()?null:bundle.sampling?.dateTo};
      queryState.lastRows=rows;queryState.plan=null;$('query-preview').innerHTML='';answer();$('query-summary').textContent='已应用 · '+p.input;
    }catch(error){$('query-validation')&&($('query-validation').textContent=error.message);undo();}finally{queryState.busy=false;}
  }
  function answer(){const last=queryState.last;if(!last)return;const rs=rows.filter(r=>matches(r,state.filters)),s=rs.filter(validSalary).map(midpoint);const summary=s.length>=10?'月薪区间中点中位数 '+money(median(s)):'薪资样本少于10条，不显示中位数';
    $('query-answer').innerHTML=`<strong>已应用的查询结果</strong><p class="query-muted">${esc(last.input)}</p><p>${fmt(rs.length)} 条历史招聘记录 · ${fmt(s.length)} 条有效月薪样本${last.intent==='compare'?'。各组统计见下方同口径对比。':' · '+summary+'。'}</p><p class="query-muted">${importedData()?'当前会话导入数据，未经本站采集核验。':esc(bundle.sampling?.dateFrom||'')+' 至 '+esc(bundle.sampling?.dateTo||bundle.collectedAt||'')+' 的历史样本，不代表当前在招或全市场。'}${!rs.length?'可展开查询，逐项放宽条件；无样本不表示没有机会。':''}</p><div class="query-actions"><button class="button" id="query-evidence">查看岗位证据</button><button class="button" id="query-save">收藏本次查询</button>${queryState.undo?'<button class="text-button" id="query-undo">撤销本次查询</button>':''}</div>`;
    $('query-evidence').onclick=()=>goJourney('jobs');$('query-undo')&&($('query-undo').onclick=undo);$('query-save').onclick=()=>{const before=v2.collection.length;v2Save(last.intent==='compare'?'对比':'分析');if(v2.collection.length>before){const item=v2.collection[0];item.name=last.input;item.query=clone(last);try{localStorage.setItem('career-v2-collection',JSON.stringify(v2.collection));toast('已收藏查询条件与数据版本。');}catch{toast('本机存储失败，可导出收藏备份。');}}};
  }
  function undo(){const s=queryState.undo;if(!s)return;state.filters=clone(s.filters);v2.modes=clone(s.modes);workbench.shared=clone(s.shared);journeyView=s.view;workbench.tab=s.tab;workbench.sections=clone(s.sections);v2.focus=clone(s.focus);v2.objects=clone(s.objects);cmo.compareAxis=s.comparison.axis;cmo.structure=s.comparison.structure;cmo.cities=new Set(s.cities);cmo.industries=new Set(s.industries);directionIDs=new Set(s.directions);cmo.selection=clone(s.selection);workbench.career=s.career;workbench.careerDetail=s.careerDetail;state.page=s.page;state.favorites=s.favorites;history.replaceState(null,'','#'+(s.view==='explorer'?'snapshot/map':s.view));queryState.undo=null;queryState.last=null;render();$('query-answer').textContent='已恢复查询前的页面、筛选与比较对象。';$('query-summary').textContent='输入城市、职业或想比较的问题';}
  const priorRender=render;render=function(){priorRender();if(queryState.last&&queryState.lastRows!==rows)queryState.undo=null;if(queryState.last&&(queryState.lastRows!==rows||JSON.stringify(state.filters)!==JSON.stringify(queryState.last.filters))){$('query-answer').innerHTML='<p>筛选已修改，先前查询结果已失效。请重新解析，或撤销本次查询。</p>'+(queryState.undo?'<button class="text-button" id="query-undo">撤销本次查询</button>':'');$('query-undo')&&($('query-undo').onclick=undo);$('query-summary').textContent='筛选已修改';}const extra=Object.entries(state.filters.nlExclude||{}).filter(([,v])=>v.length).map(([k,v])=>'排除'+(CareerQuery.labels[k]||k)+' '+v.map(x=>fieldName(k,x)).join('、'));if(state.filters.nlExperience)extra.push('企业最低经验 '+state.filters.nlExperience.low+'–'+state.filters.nlExperience.high+'年');if(state.filters.nlExperienceUnlimited)extra.push('原文明示经验不限');if(state.filters.nlIntern)extra.push('明示实习');if(state.filters.nlGraduate)extra.push('明示应届');panel.dataset.extra=extra.join('；');if(extra.length&&!$('query-details').open)$('query-summary').textContent=extra.join('；');};
  $('query-plan-form').onsubmit=e=>{e.preventDefault();parse();};
  $('query-input').oninput=()=>{queryState.plan=null;$('query-preview').innerHTML='';};$('query-mode').onchange=()=>{queryState.plan=null;$('query-preview').innerHTML='';};
  panel.addEventListener('click',e=>{const b=e.target.closest('[data-query-example]');if(b){$('query-input').value=b.dataset.queryExample;parse();}});
  document.addEventListener('click',e=>{const b=e.target.closest('[data-v2-restore]');if(!b)return;const item=v2.collection.find(x=>x.id===b.dataset.v2Restore);if(item?.query){queryState.undo=null;queryState.lastRows=rows;const target=item.query.intent==='compare'?'compare':item.query.intent==='explore'?'discover':item.query.intent==='jobs'?'jobs':'analysis';goJourney(target);if(item.query.intent==='salary')workbench.tab='salary';if(item.query.intent==='requirements'){workbench.tab='profile';workbench.sections.profile={...sectionDefaults.profile,group:/技能/.test(item.query.input)?'skills':/学历/.test(item.query.input)?'education':'experience',limit:10,stat:'p50',numbers:true};}applyFilters(clone(item.filters));$('query-details').open=true;$('query-input').value=item.query.input;queryState.last=clone(item.query);queryState.last.filters=clone(state.filters);answer();if(item.query.dataVersion!==dataIdentity())$('query-answer').insertAdjacentHTML('afterbegin','<p class="query-warning">数据版本已变化，当前结果已重新计算。</p>');}});
  window.CareerQueryUI={context,parse,apply,undo,state:queryState,conditionRows};
})();
