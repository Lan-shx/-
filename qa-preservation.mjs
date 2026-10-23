import {chromium} from './qa-tools/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));const checks=[];
try{
 await page.goto('http://127.0.0.1:8765');await page.waitForSelector('[data-cmo-view="industry"]',{timeout:120000});
 await page.locator('[data-cmo-view="industry"]').first().click();
 const cell=page.locator('[data-cmo-cell][data-industry]').first();const role=await cell.getAttribute('data-role'),industry=await cell.getAttribute('data-industry');
 const filters=await page.evaluate(()=>JSON.stringify(state.filters));
 const expected=await page.evaluate(({role,industry})=>filtered.filter(r=>r.occupation===role&&r.industry===industry).length,{role,industry});
 await cell.click();assert.equal(await page.evaluate(()=>JSON.stringify(state.filters)),filters);assert.equal(Number(await page.locator('#cmo-selection').getAttribute('data-record-count')),expected);
 await page.locator('[data-cmo-drill]').click();assert.equal(await page.evaluate(()=>filtered.length),expected);checks.push({name:'industry cell exact count and drill',expected,role,industry});
 await page.evaluate(()=>{applyFilters(defaultFilters());goJourney('compare')});
 for(const axis of ['occupation','city','industry']){
  await page.locator(`[data-cmo-compare-axis="${axis}"]`).click();
  const choices=await page.locator('#cmo-compare-add option').evaluateAll(xs=>xs.filter(x=>x.value&&!x.disabled).map(x=>x.value).slice(0,2));
  for(const value of choices)await page.locator('#cmo-compare-add').selectOption(value);
  assert.equal(await page.locator('.cmo-compare-table thead th').count(),3);
  for(const dim of ['experience','salary','industry','scale','skills','education']){
   await page.locator(`[data-cmo-structure="${dim}"]`).click();assert.equal(await page.locator(`[data-cmo-structure="${dim}"]`).getAttribute('aria-pressed'),'true');
  }
  checks.push({name:'comparison all six structures',axis,choices});
 }
 await page.evaluate(()=>{applyFilters(defaultFilters());setModule('S04')});
 await page.waitForSelector('#explorer-chart svg');
 assert.equal(await page.locator('[data-metric]').count(),6);
 await page.locator('[data-metric="salary"]').click();await page.locator('#explorer-change').click();
 for(const view of ['box','distribution','cdf','heat','bubble','bar']){await page.locator('#explorer-view').selectOption(view);await page.waitForSelector('#explorer-chart svg');assert.equal(await page.locator('#explorer-chart svg').count(),1)}
 checks.push({name:'legacy six metrics and six salary charts preserved'});
 await page.evaluate(()=>goJourney('jobs'));
 const save=page.locator('#job-rows [data-save]').first();const id=await save.getAttribute('data-save');await save.click();assert(await page.evaluate(id=>saved.has(id),id));
 const boxes=page.locator('#job-rows input[data-compare]');await boxes.nth(0).check();await boxes.nth(1).check();await page.locator('#compare-open').click();assert(await page.locator('#info-dialog').evaluate(e=>e.open));assert.equal(await page.locator('.compare-card').count(),2);await page.locator('#info-dialog .close-dialog').click();
 checks.push({name:'favorite and two real-job comparison',id});
 await page.evaluate(()=>goJourney('plan'));await page.locator('#plan-notes').fill('QA preservation note');await page.locator('#save-plan').click();assert.equal(await page.evaluate(()=>localStorage.getItem('career-plan-notes')),'QA preservation note');
 const planDownload=page.waitForEvent('download');await page.locator('#export-plan').click();await (await planDownload).saveAs('qa-downloads/qa-plan.md');checks.push({name:'local plan persistence and Markdown export'});
 await page.evaluate(()=>{applyFilters(defaultFilters());goJourney('jobs')});
 const csvDownload=page.waitForEvent('download');await page.evaluate(()=>exportCSV());await (await csvDownload).saveAs('qa-downloads/qa-filtered.csv');
 const configDownload=page.waitForEvent('download');await page.locator('.export-menu summary').click();await page.locator('[data-export="config"]').click();await (await configDownload).saveAs('qa-downloads/qa-config.json');assert((await fs.readFile('qa-downloads/qa-config.json','utf8')).includes('filters'));checks.push({name:'filtered CSV and configuration exports'});
 await page.evaluate(()=>{applyFilters({...defaultFilters(),query:'__QA_NO_MATCH_27651__'});goJourney('snapshot')});assert.equal(await page.evaluate(()=>filtered.length),0);assert(await page.locator('[data-cmo-reset]').isVisible());await page.locator('[data-cmo-reset]').click();assert(await page.evaluate(()=>filtered.length>0));checks.push({name:'filtered-empty recovery'});
 // User CSV replaces only this browser session; the source snapshot on disk stays intact.
 const original=await page.evaluate(()=>rows[0]);const header='岗位,公司,城市,原始链接,薪资原文,月薪下限,月薪上限,经验要求,学历,行业,更新日期';
 const fixture=header+'\nQA测试岗位,QA测试企业,北京,https://example.com/qa-job,10000–20000元/月,10000,20000,经验不限,本科,测试行业,2026-10-06\n';
 await page.evaluate(async fixture=>importCSV(new File([fixture],'qa.csv',{type:'text/csv'})),fixture);assert.equal(await page.evaluate(()=>rows.length),1);assert.equal(await page.evaluate(()=>exploreStats('import',rows).p50),null);checks.push({name:'CSV session import and low salary sample null',originalId:original.id});
 assert.deepEqual(errors,[]);await fs.writeFile('qa-preservation.json',JSON.stringify({passed:true,checks,errors},null,2));console.log(JSON.stringify({passed:true,checks}));
}finally{await browser.close()}
