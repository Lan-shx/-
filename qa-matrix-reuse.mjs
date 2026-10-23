import {chromium} from './qa-tools/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

const baselineCommit='94067e2e0b3d74b07f16375bf15efe70976c7476';
const baselineSource=execFileSync('git',['show',baselineCommit+':public/workbench-layout.js'],{encoding:'utf8'});
const output=path.resolve('qa-downloads/matrix-reuse');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const report={baselineCommit,browser:browser.version(),viewport:{width:1440,height:1000},scenarios:[],errors:[]};
const pages=[];
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

async function open(version){
 const page=await browser.newPage({viewport:report.viewport,acceptDownloads:true});
 page.on('pageerror',e=>report.errors.push(version+': '+e.message));
 if(version==='baseline')await page.route('**/workbench-layout.js',r=>r.fulfill({body:baselineSource,contentType:'text/javascript'}));
 await page.goto('http://127.0.0.1:8765/index.html#analysis/matrix');
 await page.waitForSelector('[data-v2-cell]',{timeout:120000});
 assert.equal(await page.evaluate(()=>rows.length),69465);pages.push(page);return page;
}

async function capture(page,scenario,current){
 return page.evaluate(({scenario,current})=>{
  state.filters={...defaultFilters(),...scenario.filters};state.favorites=false;
  journeyView='analysis';workbench.tab='matrix';v2.focus=scenario.focus||null;
  const s=sectionState();s.metric=scenario.metric||'opportunity';s.numbers=!!scenario.numbers;
  const originals={},counts={},datasets=[];
  const plainGroup=({rows,...g})=>({...g,rowIds:rows.map(r=>r.id)});
  const plain=data=>({roles:data.roles.map(plainGroup),cities:data.cities.map(plainGroup),cells:data.cells.map(row=>row.map(plainGroup))});
  for(const name of ['matches','decisionRecords','matrixData','workbenchMatrixTable']){
   originals[name]=window[name];counts[name]=0;
   window[name]=function(...args){
    counts[name]++;const result=originals[name].apply(this,args);
    if(name==='matrixData'){
     datasets.push(plain(result));
     // Consumers must work with immutable arrays and statistic objects.
     if(current){for(const g of [...result.roles,...result.cities,...result.cells.flat()]){Object.freeze(g.rows);Object.freeze(g);}result.cells.forEach(Object.freeze);Object.freeze(result.roles);Object.freeze(result.cities);Object.freeze(result.cells);Object.freeze(result);}
    }
    return result;
   };
  }
  try{
   render();
   const initial={...counts},initialTableRows=$('explorer-table')?.querySelectorAll('tbody tr').length||0;
   const initialHidden=$('explorer-table')?.hidden??null;
   const button=$('analysis-numbers');
   if(button&&$('explorer-table').hidden)button.click();
   const afterShow={...counts};
   const snapshot={
    matrix:$('analysis-matrix')?.innerHTML||'',table:$('explorer-table')?.innerHTML||'',
    stats:document.querySelector('.workbench-stats')?.innerHTML||'',
    scope:document.querySelector('.workbench-context')?.textContent||'',
    empty:document.querySelector('.workbench-empty')?.textContent||'',
    global:filtered.length,focus:v2.focus,svg:mainSVG,data:datasets[0]||null
   };
   if(button){button.click();button.click();}
   const repeated={...counts};
   if(datasets.length===2&&JSON.stringify(datasets[0])!==JSON.stringify(datasets[1]))throw Error('Baseline matrix/table statistics differ');
   return{snapshot,initial,afterShow,repeated,initialTableRows,initialHidden,totalRows:rows.length};
  }finally{Object.assign(window,originals);}
 },{scenario,current});
}

async function compare(baseline,current,scenario){
 const before=await capture(baseline,scenario,false),after=await capture(current,scenario,true);
 assert.deepEqual(after.snapshot,before.snapshot,scenario.name);
 if(before.snapshot.matrix){
  assert.equal(before.initial.matrixData,2);assert.equal(after.initial.matrixData,1);
  assert.equal(before.initial.decisionRecords,3);assert.equal(after.initial.decisionRecords,1);
  assert.equal(before.initial.matches,before.totalRows*4);assert.equal(after.initial.matches,after.totalRows*2);
  assert.equal(after.initial.workbenchMatrixTable,scenario.numbers?1:0);
  assert.equal(after.initialTableRows,scenario.numbers?before.initialTableRows:0);
  assert.equal(after.afterShow.workbenchMatrixTable,1);
  assert.deepEqual(after.repeated,after.afterShow,'Toggling must not recompute or rebuild');
 }else{assert.equal(after.initial.matrixData,0);}
 report.scenarios.push({name:scenario.name,sha256:hash(after.snapshot),baselineCalls:before.initial,currentCalls:after.initial,global:after.snapshot.global,roles:after.snapshot.data?.roles.length||0,cities:after.snapshot.data?.cities.length||0});
 console.log('PASS',scenario.name);return after.snapshot;
}

async function sample(page){return page.evaluate(()=>{const t=performance.now();render();return performance.now()-t});}
function timing(ms){const sorted=[...ms].sort((a,b)=>a-b);return{samplesMs:ms,medianMs:(sorted[9]+sorted[10])/2,p95Ms:sorted[18]};}

async function importFixture(page,variant){
 const header=['岗位','公司','城市','原始链接','月薪下限','月薪上限','职能'];
 const role=await page.evaluate(()=>bundle.taxonomy.occupations[0].name),data=[];
 // Different second import tests both data identity and changed sample thresholds.
 for(const [city,n,base] of [['北京',variant===1?10:9,10000*variant],['上海',variant===1?9:10,30000],['深圳',2,null]])
  for(let i=0;i<n;i++)data.push(['fixture-'+variant+'-'+i,'fixture-'+variant+'公司',city,'https://example.test/matrix/'+variant+'/'+city+'/'+i,base===null?'':base+i*100,base===null?'':base+i*100+2000,role]);
 await page.evaluate(()=>{v2.focus=null;sectionState().numbers=false;render()});
 await page.locator('#import-file').setInputFiles({name:'matrix-'+variant+'.csv',mimeType:'text/csv',buffer:Buffer.from([header,...data].map(r=>r.join(',')).join('\r\n'))});
 await page.waitForSelector('#apply-staged-import');await page.locator('#apply-staged-import').click();
 await page.waitForFunction(variant=>rows.length===21&&rows.every(r=>r.company==='fixture-'+variant+'公司'),variant);
 await page.waitForSelector('[data-v2-cell]');
}

async function exportChecks(page,snapshot){
 await page.emulateMedia({media:'print'});
 await page.evaluate(()=>{sectionState().numbers=false;render()});
 assert.equal(await page.locator('#explorer-table').evaluate(el=>getComputedStyle(el).display),'none');
 assert.equal(await page.locator('#explorer-table tbody tr').count(),0);
 await page.evaluate(()=>$('analysis-numbers').click());
 assert.notEqual(await page.locator('#explorer-table').evaluate(el=>getComputedStyle(el).display),'none');
 assert.equal(await page.locator('#explorer-table').innerHTML(),snapshot.table);
 await page.emulateMedia({media:'screen'});
 const svg=await page.evaluate(()=>{const old=download;let n=0;download=()=>n++;try{document.querySelector('[data-layout-svg]').click();return{downloads:n,svg:mainSVG,message:$('toast').textContent}}finally{download=old}});
 assert.equal(svg.downloads,0);assert.equal(svg.svg,'');assert(svg.message.includes('没有可导出的SVG'));
 const printCalls=await page.evaluate(()=>{const original=window.print;let n=0;window.print=()=>n++;try{document.querySelector('[data-export="pdf"]').click();return n}finally{window.print=original}});
 assert.equal(printCalls,1);
 const csvDownload=page.waitForEvent('download');
 await page.evaluate(()=>document.querySelector('[data-export="csv"]').click());
 const csvPath=path.join(output,'matrix.csv');await (await csvDownload).saveAs(csvPath);
 const csv=await fs.readFile(csvPath,'utf8');assert(csv.includes('fixture-2'));assert.equal(csv.trim().split(/\r?\n/).length,22);
 const configDownload=page.waitForEvent('download');
 await page.evaluate(()=>{goJourney('methods/manage');document.querySelector('[data-layout-config-export]').click()});
 const configPath=path.join(output,'matrix-config.json');await (await configDownload).saveAs(configPath);
 const config=JSON.parse(await fs.readFile(configPath,'utf8'));assert.equal(config.analysis.tab,'matrix');
 await page.evaluate(()=>goJourney('analysis/demand'));
 await page.locator('body').evaluate(()=>goJourney('methods/manage'));
 const chooser=page.waitForEvent('filechooser');await page.locator('[data-layout-backup-import]').click();await (await chooser).setFiles(configPath);
 await page.waitForFunction(()=>journeyView==='analysis'&&workbench.tab==='matrix');
 assert.equal(await page.locator('#analysis-matrix').innerHTML(),snapshot.matrix);
 const offlineDownload=page.waitForEvent('download',{timeout:120000});await page.evaluate(()=>exportOffline());
 const offlinePath=path.join(output,'matrix-offline.html');await (await offlineDownload).saveAs(offlinePath);
 const offline=await browser.newPage();offline.on('pageerror',e=>report.errors.push('offline: '+e.message));
 await offline.goto('file:///'+offlinePath.replaceAll('\\','/')+'#analysis/matrix');await offline.waitForSelector('[data-v2-cell]',{timeout:120000});
 assert.equal(await offline.evaluate(()=>rows.length),21);
 assert.equal(await offline.locator('#analysis-matrix').innerHTML(),snapshot.matrix);
 await offline.evaluate(()=>$('analysis-numbers').click());
 assert.equal(await offline.locator('#explorer-table').innerHTML(),snapshot.table);
 await offline.close();
 return ['print visibility','PDF print action','unchanged SVG unavailable response','CSV export','analysis config restore','offline matrix and lazy table'];
}

try{
 const baseline=await open('baseline'),current=await open('current');
 const manifest=JSON.parse(await fs.readFile('public/jobs.json','utf8'));
 report.dataset={rowCount:manifest.rowCount,manifestSha256:hash(manifest),chunks:manifest.chunks.map(c=>({path:c.gzipPath,sha256:c.sha256}))};
 const scenarios=[
  {name:'default-hidden',filters:{}},{name:'default-shown',filters:{},numbers:true},
  {name:'salary-hidden',filters:{},metric:'salary'},
  {name:'explicit-cities',filters:{cities:['北京','上海']}},
  {name:'other-mainland',filters:{cities:['其他大陆城市']}},
  {name:'unknown-included',filters:{includeUnknownCity:true}},
  {name:'focused',filters:{},focus:{role:'27',city:'广州'}},
  {name:'empty-focus',filters:{},focus:{role:'__no_such_role__',city:'广州'}},
  {name:'empty-filter',filters:{query:'__matrix_reuse_empty_83af__'}}
 ];
 for(const scenario of scenarios)await compare(baseline,current,scenario);
 for(const page of pages)await page.evaluate(()=>{state.filters=defaultFilters();v2.focus=null;sectionState().metric='opportunity';sectionState().numbers=false;render()});
 for(let i=0;i<3;i++)for(const page of pages)await sample(page);
 const oldTimes=[],newTimes=[];
 for(let i=0;i<20;i++)for(const page of (i%2?[...pages].reverse():pages))(page===baseline?oldTimes:newTimes).push(await sample(page));
 report.performance={warmups:3,iterations:20,baseline:timing(oldTimes),current:timing(newTimes),measurement:'Synchronous render only; alternating versions, nearest-rank P95; no counting wrappers active.'};
 console.log('TIMING',JSON.stringify(report.performance));
 let imported;
 for(const variant of [1,2]){
  for(const page of pages)await importFixture(page,variant);
  imported=await compare(baseline,current,{name:'csv-replacement-'+variant,filters:{}});
  const cells=imported.data.cells.flat(),byCity=Object.fromEntries(imported.data.cities.map((c,i)=>[c.name,imported.data.cells[0][i]]));
  const enough=variant===1?'北京':'上海',insufficient=variant===1?'上海':'北京';
  assert.equal(byCity[enough].salaryN,10);assert.notEqual(byCity[enough].p50,null);
  assert.equal(byCity[insufficient].salaryN,9);assert.equal(byCity[insufficient].p50,null);
  assert(cells.some(c=>c.salaryN===0&&c.p50===null));
 }
 report.exports=await exportChecks(current,imported);
 assert.deepEqual(report.errors,[]);report.passed=true;
 await fs.writeFile(path.join(output,'results.json'),JSON.stringify(report,null,2));
 console.log('PASS matrix reuse; report:',output);
}finally{await Promise.all(pages.map(p=>p.close()));await browser.close();}
