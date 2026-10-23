import {chromium} from './qa-tools/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

const baselineCommit='6bb8c374dce7b7e3866ee4eb1deaeb01ea55361b';
const baselineSource=execFileSync('git',['show',baselineCommit+':public/city-filters.js'],{encoding:'utf8'});
const output=path.resolve('qa-downloads/jobs-render-visibility');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const report={baselineCommit,browser:browser.version(),viewport:{width:1440,height:1000},routes:[],jobs:[],events:[],errors:[]};
const pages=[];
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

async function open(version){
 const page=await browser.newPage({viewport:report.viewport,acceptDownloads:true});
 page.on('pageerror',e=>report.errors.push(version+': '+e.message));
 if(version==='baseline')await page.route('**/city-filters.js',r=>r.fulfill({body:baselineSource,contentType:'text/javascript'}));
 await page.goto('http://127.0.0.1:8765/index.html#snapshot/map');
 await page.waitForSelector('#v2-map-svg',{timeout:120000});
 assert.equal(await page.evaluate(()=>rows.length),69465);pages.push(page);return page;
}

async function trace(page,action='render'){
 return page.evaluate(action=>{
  const jobs=renderJobs,sorted=sortedJobs,find=rows.find;let depth=0;
  const counts={entries:0,sortedJobs:0,listFind:0};
  const observer=new MutationObserver(()=>{});observer.observe($('job-rows'),{childList:true,subtree:true});
  renderJobs=function(...a){counts.entries++;depth++;try{return jobs(...a)}finally{depth--}};
  sortedJobs=function(...a){counts.sortedJobs++;return sorted(...a)};
  rows.find=function(...a){if(depth)counts.listFind++;return find.apply(this,a)};
  try{
   if(action==='render')render();
   else if(action==='favorite')decisionRoot.querySelector('[data-save]').click();
   else if(action==='detail-save')$('detail-content').querySelector('[data-save]').click();
   else if(action==='uncompare')$('info-content').querySelector('[data-uncompare]').click();
   else if(action==='clear-compare')$('clear-compare').click();
   const mutations=observer.takeRecords();
   return{counts,mutations:mutations.length,addedNodes:mutations.reduce((n,r)=>n+r.addedNodes.length,0),view:journeyView,tab:workbench.tab,visible:!!document.querySelector('.jobs-panel').getClientRects().length,filteredIds:filtered.map(r=>r.id),filters:JSON.stringify(state.filters),selected:[...state.selected],saved:[...saved],cards:decisionRoot.querySelectorAll('[data-save]').length,stats:document.querySelector('.workbench-stats')?.innerHTML||'',list:journeyView==='jobs'?document.querySelector('.jobs-panel').innerHTML:null,page:state.page};
  }finally{renderJobs=jobs;sortedJobs=sorted;rows.find=find;observer.disconnect();}
 },action);
}
function semantic(t){const {counts,mutations,addedNodes,page,...rest}=t;return rest;}
async function compareTrace(baseline,current,label,action='render'){
 const before=await trace(baseline,action),after=await trace(current,action);
 assert.deepEqual(semantic(after),semantic(before),label);
 if(after.view==='jobs'){
  assert.equal(after.counts.sortedJobs,before.counts.sortedJobs);
  assert.equal(after.counts.listFind,before.counts.listFind);
  assert.equal(after.page,before.page);
 }else{
  assert.equal(after.counts.sortedJobs,0,label+' must skip sorting');
  assert.equal(after.counts.listFind,0,label+' must skip enhancement lookups');
  assert.equal(after.mutations,0,label+' must leave hidden list DOM untouched');
 }
 return{label,baseline:before.counts,current:after.counts,baselineMutations:before.mutations,currentMutations:after.mutations,sha256:hash(semantic(after))};
}

async function configureJobs(page,c){
 await page.evaluate(c=>{
  goJourney('jobs');state.filters={...defaultFilters(),...c.filters};state.sort=c.sort||'updated';state.page=c.page||1;
  state.favorites=!!c.favorites;saved=c.favorites?new Set(rows.filter(r=>r.workCities.length).slice(0,12).map(r=>r.id)):new Set();state.selected.clear();
 },c);
}
async function freshList(page){
 return page.evaluate(()=>{
  const expected=sortedJobs(),start=(state.page-1)*10,ids=[...$('job-rows').querySelectorAll('[data-detail]')].map(e=>e.dataset.detail);
  return{view:journeyView,page:state.page,ids,expected:expected.slice(start,start+10).map(r=>r.id),n:filtered.length,cities:state.filters.cities,visible:!!document.querySelector('.jobs-panel').getClientRects().length,info:$('page-info').textContent,badge:$('compare-count').textContent,selected:state.selected.size};
 });
}
async function navigationChecks(page){
 await page.evaluate(()=>{goJourney('map');applyFilters({...defaultFilters(),cities:['北京']});goJourney('jobs');$('job-sort').value='salary-desc';$('job-sort').dispatchEvent(new Event('change'));$('next').click();});
 let actual=await freshList(page);assert.deepEqual(actual.ids,actual.expected);assert.equal(actual.page,2);
 await page.evaluate(()=>{goJourney('map');applyFilters({...defaultFilters(),cities:['上海']})});
 await page.goBack();await page.waitForFunction(()=>journeyView==='jobs');
 actual=await freshList(page);assert(actual.visible);assert.equal(actual.page,1);assert.deepEqual(actual.ids,actual.expected);assert.deepEqual(actual.cities,['上海']);
 await page.goForward();await page.waitForFunction(()=>journeyView==='explorer');
 await page.evaluate(()=>{goJourney('jobs');state.selected=new Set(filtered.slice(0,2).map(r=>r.id));renderJobs();showCompare()});
 assert.equal(await page.locator('#info-content .compare-card').count(),2);
 await page.locator('#info-dialog .close-dialog').click();
 await page.evaluate(()=>{state.page=2;renderJobs();$('query-input').value='上海会计';CareerQueryUI.parse();if(CareerQueryUI.state.plan.errors.length||CareerQueryUI.state.plan.unknown.length)throw Error('Unexpected query parse failure');CareerQueryUI.apply();CareerQueryUI.undo();});
 actual=await freshList(page);assert.equal(actual.view,'jobs');assert.equal(actual.page,2);assert.deepEqual(actual.ids,actual.expected);
 return ['sort and next-page events','filter change on hidden page','browser back/forward','fresh row IDs on return','two-job comparison','query undo restores jobs and page'];
}
async function importFixture(page,variant){
 const header=['岗位','公司','城市','原始链接','月薪下限','月薪上限'];
 const data=Array.from({length:variant===1?12:3},(_,i)=>['visibility-'+variant+'-'+i,'visibility-company-'+variant,variant===1?'北京':'上海','https://example.test/visibility/'+variant+'/'+i,10000+i*100,12000+i*100]);
 await page.evaluate(()=>{if($('info-dialog').open)$('info-dialog').close();if($('detail-dialog').open)$('detail-dialog').close();goJourney('map')});
 await page.locator('#import-file').setInputFiles({name:'visibility-'+variant+'.csv',mimeType:'text/csv',buffer:Buffer.from([header,...data].map(r=>r.join(',')).join('\r\n'))});
 await page.waitForSelector('#apply-staged-import');await page.locator('#apply-staged-import').click();
 await page.waitForFunction(variant=>rows.length===(variant===1?12:3)&&rows.every(r=>r.company==='visibility-company-'+variant),variant);
 await page.evaluate(()=>goJourney('jobs'));const actual=await freshList(page);assert.deepEqual(actual.ids,actual.expected);assert.equal(actual.n,data.length);return actual;
}
async function exportChecks(page){
 await page.evaluate(()=>{goJourney('map');applyFilters(defaultFilters())});
 const csvDownload=page.waitForEvent('download');await page.evaluate(()=>exportCSV());
 const csvPath=path.join(output,'hidden-page.csv');await (await csvDownload).saveAs(csvPath);
 const csv=await fs.readFile(csvPath,'utf8');assert(csv.includes('visibility-company-2'));assert.equal(csv.trim().split(/\r?\n/).length,4);
 await page.emulateMedia({media:'print'});assert(!(await page.locator('.jobs-panel').isVisible()));
 await page.evaluate(()=>goJourney('jobs'));
 assert(await page.locator('.jobs-panel').isVisible());assert.equal(await page.locator('#job-rows [data-detail]').count(),3);
 await page.emulateMedia({media:'screen'});
 const offlineDownload=page.waitForEvent('download',{timeout:120000});await page.evaluate(()=>exportOffline());
 const offlinePath=path.join(output,'visibility-offline.html');await (await offlineDownload).saveAs(offlinePath);
 const offline=await browser.newPage();offline.on('pageerror',e=>report.errors.push('offline: '+e.message));
 await offline.goto('file:///'+offlinePath.replaceAll('\\','/'));await offline.waitForSelector('#v2-map-svg',{timeout:120000});
 assert.equal(await offline.locator('#job-rows').evaluate(el=>el.children.length),0);
 await offline.evaluate(()=>goJourney('jobs'));const actual=await freshList(offline);assert.equal(actual.n,3);assert.deepEqual(actual.ids,actual.expected);assert(actual.visible);await offline.close();
 return ['CSV uses current filtered data while list is hidden','job table print visibility','offline map starts without job DOM','offline jobs route renders fresh rows'];
}
function timing(ms){const a=[...ms].sort((a,b)=>a-b);return{samplesMs:ms,medianMs:(a[9]+a[10])/2,p95Ms:a[18]};}

try{
 const baseline=await open('baseline'),current=await open('current');
 const manifest=await fs.readFile('public/jobs.json');report.dataset={rows:69465,manifestSha256:createHash('sha256').update(manifest).digest('hex')};
 for(const route of ['map','analysis/demand','analysis/salary','analysis/opportunity','analysis/profile','analysis/matrix','discover','cities','requirements','compare','favorites','methods/overview','methods/manage','methods/preferences','methods/methods','trends','assistant','jobs','plan','advanced']){
  for(const page of pages)await page.evaluate(route=>goJourney(route),route);
  report.routes.push(await compareTrace(baseline,current,route));console.log('PASS route',route);
 }
 for(const c of [{name:'updated',sort:'updated'},{name:'salary-desc',sort:'salary-desc'},{name:'salary-asc',sort:'salary-asc'},{name:'source-order',sort:'default'},{name:'second-page',page:2},{name:'last-page-clamp',page:999999},{name:'empty',filters:{query:'__visibility_empty_47f__'}},{name:'city',filters:{cities:['北京']}},{name:'unknown-city',filters:{includeUnknownCity:true}},{name:'favorites',favorites:true}]){
  for(const page of pages)await configureJobs(page,c);
  report.jobs.push(await compareTrace(baseline,current,c.name));console.log('PASS jobs',c.name);
 }
 for(const action of ['favorite','detail-save','uncompare','clear-compare']){
  for(const page of pages)await page.evaluate(action=>{
   state.filters=defaultFilters();state.favorites=false;saved=new Set();state.selected.clear();
   if(action==='favorite'){saved.add(rows.find(r=>r.workCities.length).id);goJourney('favorites');}
   else {goJourney('jobs');state.selected=new Set(filtered.slice(0,2).map(r=>r.id));renderJobs();goJourney('map');if(action==='detail-save')showDetail(filtered[0].id);if(action==='uncompare')showCompare();}
  },action);
  report.events.push(await compareTrace(baseline,current,action,action));
  for(const page of pages)await page.evaluate(()=>{if($('detail-dialog').open)$('detail-dialog').close();if($('info-dialog').open)$('info-dialog').close();goJourney('jobs')});
  assert.deepEqual(await freshList(current),await freshList(baseline));console.log('PASS event',action);
 }
 const baseNavigation=await navigationChecks(baseline),currentNavigation=await navigationChecks(current);assert.deepEqual(currentNavigation,baseNavigation);report.navigation=currentNavigation;
 // No counting or DOM observers are active during timing. Alternate version order.
 report.performance={warmups:3,iterations:20,measurement:'Synchronous render() only; includes current sort updated; excludes later layout/paint; nearest-rank P95.',routes:{}};
 for(const route of ['map','analysis/demand','analysis/matrix','jobs']){
  for(const page of pages)await page.evaluate(route=>{if($('info-dialog').open)$('info-dialog').close();state.filters=defaultFilters();v2.modes={};state.sort='updated';state.favorites=false;goJourney(route)},route);
  const sample=page=>page.evaluate(()=>{const t=performance.now();render();return performance.now()-t});
  for(let i=0;i<3;i++)for(const page of pages)await sample(page);
  const a=[],b=[];for(let i=0;i<20;i++)for(const page of(i%2?[...pages].reverse():pages))(page===baseline?a:b).push(await sample(page));
  report.performance.routes[route]={baseline:timing(a),current:timing(b)};console.log('TIMING',route,JSON.stringify(report.performance.routes[route]));
 }
 for(const variant of [1,2]){const before=await importFixture(baseline,variant),after=await importFixture(current,variant);assert.deepEqual(after,before);console.log('PASS CSV replacement',variant);}
 report.exports=await exportChecks(current);
 assert.deepEqual(report.errors,[]);report.passed=true;await fs.writeFile(path.join(output,'results.json'),JSON.stringify(report,null,2));console.log('PASS list visibility; report:',output);
}finally{await Promise.all(pages.map(p=>p.close()));await browser.close();}
