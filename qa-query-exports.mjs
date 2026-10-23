import {chromium} from './qa-tools/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),p=await b.newPage({acceptDownloads:true,viewport:{width:390,height:844}}),errors=[],checks=[];
p.on('pageerror',e=>errors.push(e.message));
try{
 await p.goto('http://127.0.0.1:8765');await p.waitForSelector('#v2-map-points circle',{timeout:120000});
 assert(await p.evaluate(()=>document.querySelector('#sidebar').getBoundingClientRect().right<=1));checks.push('mobile sidebar closed and query visible');
 await p.locator('#query-details>summary').click();await p.locator('#query-input').fill('北京不要销售');await p.locator('#query-parse').click();await p.locator('#query-apply').click();
 const count=await p.evaluate(()=>filtered.length);let d=p.waitForEvent('download');await p.evaluate(()=>exportCSV());let file=await d;await file.saveAs('qa-downloads/query-filtered.csv');const text=await fs.readFile('qa-downloads/query-filtered.csv','utf8');
 const csv=await p.evaluate(t=>parseCSV(t.replace(/^\uFEFF/,'')),text);assert.equal(csv.length-1,count);assert(csv.slice(1).every(r=>r[csv[0].indexOf('职能')]!=='销售 / 商务拓展'));assert(csv[1][csv[0].indexOf('全局筛选')].includes('nlExclude'));checks.push('filtered CSV includes same records and exclusion provenance');
 d=p.waitForEvent('download',{timeout:120000});await p.evaluate(()=>exportOffline());file=await d;await file.saveAs('qa-downloads/query-offline.html');
 const other=await b.newPage();other.on('pageerror',e=>errors.push(e.message));await other.goto('file:///'+process.cwd().replaceAll('\\','/')+'/qa-downloads/query-offline.html');await other.waitForSelector('#v2-map-points circle',{timeout:120000});assert.equal(await other.evaluate(()=>rows.length),69465);await other.locator('#query-details>summary').click();await other.locator('#query-input').fill('比较深圳和杭州的数据分析薪资');await other.locator('#query-parse').click();await other.locator('#query-apply').click();assert.equal(await other.evaluate(()=>journeyView),'compare');await other.close();checks.push('offline HTML embeds new engine and executes comparisons');
 await p.locator('#query-input').fill('上海会计');await p.locator('#query-parse').click();
 const csvImport='岗位,公司,城市,原始链接,薪资原文,月薪下限,月薪上限,经验要求,学历,行业,更新日期\n测试会计,测试企业,北京,https://example.com/query-import,10000–20000元/月,10000,20000,经验不限,本科,测试行业,2026-10-07\n';
 await p.evaluate(async text=>importCSV(new File([text],'query-import.csv',{type:'text/csv'})),csvImport);await p.locator('#apply-staged-import').click();await p.waitForFunction(()=>rows.length===1);await p.locator('#query-apply').click();assert((await p.locator('#query-validation').textContent()).includes('数据已发生变化'));
 await p.locator('#query-input').fill('北京经验不限');await p.locator('#query-parse').click();await p.locator('#query-apply').click();assert.equal(await p.evaluate(()=>filtered.length),1);assert((await p.locator('#query-answer').textContent()).includes('当前会话导入'));assert((await p.evaluate(()=>CareerQueryUI.state.last.dataVersion)).startsWith('import-'));checks.push('import invalidates preview, refreshes dictionary and labels provenance');
 // Tiny real-record fixture validates the new predicate independently of production counts.
 const strict=await p.evaluate(()=>{const base=defaultFilters(),r=rows[0];return {unknown:matches({...r,experience:'未披露'},{...base,nlExperienceUnlimited:true}),unlimited:matches({...r,experience:'经验不限'},{...base,nlExperienceUnlimited:true}),range:matches({...r,experience:'3-5年'},{...base,nlExperience:{low:1,high:3}}),above:matches({...r,experience:'5年以上'},{...base,nlExperience:{low:1,high:3}})};});assert.deepEqual(strict,{unknown:false,unlimited:true,range:true,above:false});checks.push('experience predicates respect unknown and minimum');
 assert.deepEqual(errors,[]);await fs.writeFile('qa-query-exports-results.json',JSON.stringify({passed:true,checks,errors},null,2));console.log('PASS',JSON.stringify(checks));
}finally{await b.close();}
