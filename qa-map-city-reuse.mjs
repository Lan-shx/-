import {chromium} from './qa-tools/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

const baselineCommit='c38920499b11fee19311b54443ec3d9a8ad038e4';
const baselineSource=execFileSync('git',['show',baselineCommit+':public/workbench-v2.js'],{encoding:'utf8'});
const baselineOnly=process.argv.includes('--baseline-only');
const output=path.resolve('qa-downloads/map-city-reuse');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const results={baselineCommit,browser:browser.version(),viewport:{width:1440,height:1000},iterations:20,warmups:3,scenarios:[],errors:[]};
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const pages=[];

async function open(version){
 const page=await browser.newPage({viewport:results.viewport,acceptDownloads:true});
 page.on('pageerror',e=>results.errors.push(version+': '+e.message));
 if(version==='baseline')await page.route('**/workbench-v2.js',route=>route.fulfill({body:baselineSource,contentType:'text/javascript'}));
 await page.goto('http://127.0.0.1:8765/index.html#snapshot/map');
 await page.waitForSelector('#v2-map-svg',{timeout:120000});
 assert.equal(await page.evaluate(()=>rows.length),69465);
 pages.push(page);return page;
}

async function snapshot(page,scenario){
 await page.evaluate(scenario=>{
  state.filters={...defaultFilters(),...scenario.filters};
  journeyView='explorer';cmo.selection=null;v2.metric=scenario.metric||'count';
  Object.assign(v2.map,{x:0,y:0,z:1,select:false});render();
 },scenario);
 await page.waitForSelector('#v2-map-svg');
 return page.evaluate(()=>({
  groups:v2.mapGroups.map(({rows,...g})=>({...g,rowIds:rows.map(r=>r.id)})),
  matched:filtered.length,
  summary:document.querySelector('.v2-kpis').innerHTML,
  rankings:document.querySelector('.v2-rankings').innerHTML,
  table:document.querySelector('.cmo-city-table').innerHTML,
  points:$('v2-map-points').innerHTML,
  svg:mainSVG,
  facts:{multiCity:filtered.filter(r=>r.workCities.length>1).length,unknown:filtered.filter(r=>!r.workCities.length).length},
  countRanking:[...document.querySelectorAll('.v2-ranking:first-child [data-v2-city]')].map(el=>el.dataset.v2City),
  salaryRanking:[...document.querySelectorAll('.v2-ranking:last-child [data-v2-city]')].map(el=>el.dataset.v2City)
 }));
}

function checkSnapshot(value){
 const gs=value.groups;
 assert(gs.every((g,i)=>i===0||gs[i-1].n>=g.n),'shared map groups retain count order');
 assert.deepEqual(value.countRanking,gs.slice(0,6).map(g=>g.name));
 assert.deepEqual(value.salaryRanking,[...gs].sort((a,b)=>(b.p50||0)-(a.p50||0)).filter(g=>g.p50!==null).slice(0,6).map(g=>g.name));
 for(const g of gs)if(g.salaryN<10)assert.deepEqual([g.p25,g.p50,g.p75],[null,null,null]);
}

async function countCalls(page){
 return page.evaluate(()=>{
  const original=v2CityGroups;let calls=0;
  v2CityGroups=function(...args){calls++;return original(...args)};
  try{render();return calls}finally{v2CityGroups=original}
 });
}

async function sample(page){
 // Only the synchronous render call is timed; layout/paint and later map mounting are excluded.
 return page.evaluate(()=>{const start=performance.now();render();return performance.now()-start});
}
function timing(samples){
 const sorted=[...samples].sort((a,b)=>a-b);
 return {samplesMs:samples,medianMs:(sorted[9]+sorted[10])/2,p95Ms:sorted[Math.ceil(sorted.length*.95)-1]};
}

async function importFixture(page,prefix){
 const header=['岗位','公司','城市','原始链接','月薪下限','月薪上限'];
 const data=[];
 for(const [city,n,base] of [['北京',10,10000],['上海',9,30000],['深圳',2,null]]){
  for(let i=0;i<n;i++)data.push([prefix+'岗位'+i,prefix+'公司'+i,city,'https://example.test/'+prefix+'/'+city+'/'+i,base===null?'':base+i*100,base===null?'':base+i*100+2000]);
 }
 const csv=[header,...data].map(row=>row.join(',')).join('\r\n');
 await page.locator('#import-file').setInputFiles({name:prefix+'.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});
 await page.waitForSelector('#apply-staged-import');
 await page.locator('#apply-staged-import').click();
 await page.waitForFunction(()=>rows.length===21);
 await page.waitForSelector('#v2-map-svg');
 assert(await page.evaluate(prefix=>rows.every(r=>r.company.startsWith(prefix)),prefix));
}

async function exportsAndInteraction(page){
 const point=page.locator('[data-v2-map-city]').first();
 const city=await point.getAttribute('data-v2-map-city');
 await point.focus();await page.keyboard.press('Enter');
 assert.equal(await page.evaluate(()=>cmo.selection.city),city);
 const before=await page.evaluate(()=>v2.map.z);
 await page.locator('#v2-zoom-in').click();
 assert(await page.evaluate(()=>v2.map.z)>before);
 await page.locator('#v2-map-reset').click();
 assert.equal(await page.evaluate(()=>v2.map.z),1);
 const svg=await page.evaluate(()=>mainSVG);
 const svgDownload=page.waitForEvent('download');
 // Use the existing shared download helper with the same map SVG payload.
 await page.evaluate(()=>download('map-city-reuse.svg',mainSVG,'image/svg+xml'));
 const savedSvg=path.join(output,'map.svg');await (await svgDownload).saveAs(savedSvg);
 assert.equal(await fs.readFile(savedSvg,'utf8'),svg);
 const csvDownload=page.waitForEvent('download');await page.evaluate(()=>exportCSV());
 const savedCsv=path.join(output,'map.csv');await (await csvDownload).saveAs(savedCsv);
 const csv=await fs.readFile(savedCsv,'utf8');assert(csv.includes('本次导入'));assert(csv.includes('fixture-b'));
 const offlineDownload=page.waitForEvent('download',{timeout:120000});await page.evaluate(()=>exportOffline());
 const savedOffline=path.join(output,'map-offline.html');await (await offlineDownload).saveAs(savedOffline);
 const offline=await browser.newPage();offline.on('pageerror',e=>results.errors.push('offline: '+e.message));
 await offline.goto('file:///'+savedOffline.replaceAll('\\','/'));
 await offline.waitForSelector('#v2-map-svg',{timeout:120000});
 assert.equal(await offline.evaluate(()=>rows.length),21);
 assert.deepEqual(await offline.evaluate(()=>v2.mapGroups.map(g=>[g.name,g.n,g.salaryN,g.p50])),await page.evaluate(()=>v2.mapGroups.map(g=>[g.name,g.n,g.salaryN,g.p50])));
 await offline.close();return ['point keyboard selection','zoom/reset','SVG payload download','CSV export','offline HTML reload'];
}

try{
 const baseline=await open('baseline');
 const current=baselineOnly?null:await open('current');
 const manifest=JSON.parse(await fs.readFile('public/jobs.json','utf8'));
 results.dataset={rowCount:manifest.rowCount,manifestSha256:createHash('sha256').update(await fs.readFile('public/jobs.json')).digest('hex'),chunks:manifest.chunks.map(c=>({path:c.gzipPath,sha256:c.sha256}))};
 const scenarios=[
  {name:'default',filters:{}},
  {name:'salary-map',filters:{},metric:'salary'},
  {name:'explicit-cities',filters:{cities:['北京','上海']}},
  {name:'other-mainland',filters:{cities:['其他大陆城市']}},
  {name:'include-unknown',filters:{includeUnknownCity:true}},
  {name:'empty',filters:{query:'__map_city_reuse_no_matching_job_83fb__'}}
 ];
 for(const scenario of scenarios){
  const before=await snapshot(baseline,scenario);checkSnapshot(before);
  if(current){const after=await snapshot(current,scenario);checkSnapshot(after);assert.deepEqual(after,before,scenario.name);}
  if(scenario.name==='empty')assert.equal(before.groups.length,0);
  if(scenario.name==='include-unknown')assert(before.facts.unknown>0);
  if(scenario.name==='default')assert(before.facts.multiCity>0);
  results.scenarios.push({name:scenario.name,groups:before.groups.length,matched:before.matched,facts:before.facts,sha256:digest(before)});
  console.log('PASS',scenario.name);
 }
 for(const page of pages)await snapshot(page,{filters:{}});
 results.calls={baseline:await countCalls(baseline)};assert.equal(results.calls.baseline,5);
 if(current){results.calls.current=await countCalls(current);assert.equal(results.calls.current,1);}
 // Alternate versions and reverse ordering each round to reduce time/order bias.
 for(let i=0;i<results.warmups;i++)for(const page of pages)await sample(page);
 const beforeTimes=[],afterTimes=[];
 for(let i=0;i<results.iterations;i++){
  for(const page of (i%2?[...pages].reverse():pages)){
   const ms=await sample(page);(page===baseline?beforeTimes:afterTimes).push(ms);
  }
 }
 results.performance={baseline:timing(beforeTimes)};
 if(current)results.performance.current=timing(afterTimes);
 console.log('TIMING',JSON.stringify(results.performance));
 for(const prefix of ['fixture-a','fixture-b']){
  const snapshots=[];
  for(const page of pages){await importFixture(page,prefix);snapshots.push(await snapshot(page,{filters:{}}));}
  snapshots.forEach(checkSnapshot);
  if(current)assert.deepEqual(snapshots[1],snapshots[0],prefix);
  const gs=snapshots[0].groups;
  assert.equal(gs.find(g=>g.name==='北京').salaryN,10);assert.notEqual(gs.find(g=>g.name==='北京').p50,null);
  assert.equal(gs.find(g=>g.name==='上海').salaryN,9);assert.equal(gs.find(g=>g.name==='上海').p50,null);
  assert.equal(gs.find(g=>g.name==='深圳').salaryN,0);
  results.scenarios.push({name:prefix,groups:gs.length,matched:21,sha256:digest(snapshots[0])});
  console.log('PASS CSV replacement',prefix);
 }
 if(current)results.exports=await exportsAndInteraction(current);
 assert.deepEqual(results.errors,[]);results.passed=true;
 await fs.writeFile(path.join(output,baselineOnly?'baseline.json':'results.json'),JSON.stringify(results,null,2));
 console.log('PASS map city reuse; report:',output);
}finally{await Promise.all(pages.map(p=>p.close()));await browser.close();}
