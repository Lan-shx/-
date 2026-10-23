import {chromium} from './qa-tools/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({viewport:{width:1440,height:1050},acceptDownloads:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8765/');await page.waitForSelector('#analysis:not([hidden])');
assert(await page.evaluate(()=>filtered.length===rows.filter(r=>r.country==='中国'&&r.workCities.length).length));
assert(await page.evaluate(()=>opts('cities').every(o=>bundle.geography.majorCities.includes(o.value)||o.value==='其他大陆城市')));
assert.equal(await page.locator('[name="country"] option').count(),1);
assert.deepEqual(await page.evaluate(()=>['大学本科','大学专科','中等专科','职业高中','普通高中','未披露'].map(educationLevelFor)),['本科','大专','中专 / 中技 / 职高','中专 / 中技 / 职高','高中','未披露']);
// Select through the actual form. Both groups survive top-N and minimum-sample controls.
await page.locator('#city-picker>summary').click();
for(const city of ['深圳','杭州'])await page.locator(`[data-multi="cities"][value="${city}"]`).check();
await page.getByRole('button',{name:'应用筛选',exact:true}).click();
await page.locator('[data-module="S01"]').click();
assert(await page.evaluate(()=>filtered.every(r=>r.cityGroups.includes('深圳')||r.cityGroups.includes('杭州'))));
for(const type of ['rank','box','cdf','heat']){
 await page.locator('#chart-type').selectOption(type);
 const text=await page.locator('#charts').innerText();assert(text.includes('深圳')&&text.includes('杭州'),type);
}
await page.locator('#chart-type').selectOption('box');
await page.evaluate(()=>{scene().top=1;scene().min=100000;renderCharts()});
assert.deepEqual(await page.evaluate(()=>sortedGroups('city').map(g=>g.name)),['深圳','杭州']);
assert(await page.locator('#charts').innerText().then(t=>t.includes('深圳')&&t.includes('杭州')));
// A zero-result selected city is retained instead of replaced by a province or dropped.
await page.evaluate(()=>{applyFilters({...defaultFilters(),cities:['深圳','杭州'],query:'__no_matching_job__'});renderCharts()});
assert.deepEqual(await page.evaluate(()=>sortedGroups('city').map(g=>[g.name,g.n])),[['深圳',0],['杭州',0]]);
assert(await page.locator('#charts').innerText().then(t=>t.includes('深圳')&&t.includes('杭州')));
await page.locator('#reset').click();await page.locator('#reset-module').click();
// Unknown geography is explicit, and never leaks into city charts.
await page.evaluate(()=>applyFilters({...defaultFilters(),includeUnknownCity:true}));
assert.equal(await page.evaluate(()=>filtered.length),await page.evaluate(()=>rows.length));
assert(await page.evaluate(()=>groups(filtered,'city').every(g=>g.name!=='城市未明确'&&!/省$|自治区$/.test(g.name))));
// Date unknowns still obey the other filters; normalized degree and work type are independent.
for(const key of ['educations','hiringTypes','hiringChannels','sources']){
 const result=await page.evaluate(key=>{const field=dims[key][1];const value=opts(key).find(o=>o.n>0).value;applyFilters({...defaultFilters(),includeUnknownCity:true,[key]:[value],dateField:'publishedAt',dateFrom:'2025-10-03',keepUnknownDate:true});return {n:filtered.length,valid:filtered.every(r=>String(r[field])===value)}} ,key);
 assert(result.n>0&&result.valid,key);
}
// Deadline semantics are checked using controlled copies of actual source rows.
assert(await page.evaluate(()=>{const r=rows.find(r=>r.workCities.length);return matches({...r,expiresAt:'2025-01-01'},{...defaultFilters(),jobStatus:'expired'})&&!matches({...r,expiresAt:'2025-01-01'},{...defaultFilters(),jobStatus:'current'})&&matches({...r,expiresAt:null},{...defaultFilters(),jobStatus:'current'})}));
await page.locator('#reset').click();
for(const id of ['S00','S01','S02','S03','S04','S05','S06','S07','S08','S09','S10']){await page.locator(`[data-module="${id}"]`).click();assert(await page.locator('.echart svg').count()>0,id)}
await page.evaluate(()=>{state.filters.query='__stale__';scene().occupation='16';ask('深圳和杭州的数据分析岗位薪资如何')});
assert.deepEqual(await page.evaluate(()=>({cities:state.filters.cities,query:state.filters.query,module:state.module,occupation:scene().occupation})),{cities:['深圳','杭州'],query:'',module:'S01',occupation:''});
await page.locator('#reset').click();await page.locator('[data-detail]').first().click();assert(await page.locator('#detail-content').innerText().then(t=>t.includes('城市证据')&&t.includes('截止日期')));await page.locator('#detail-dialog .close-dialog').click();
await page.locator('[data-module="S00"]').click();await page.screenshot({path:'qa-cities-desktop.png',fullPage:true});
mkdirSync('qa-downloads',{recursive:true});await page.locator('.export-menu>summary').click();const download=page.waitForEvent('download');await page.locator('[data-export="offline"]').click();await(await download).saveAs('qa-downloads/cities-offline.html');
const offline=await browser.newPage();offline.on('pageerror',e=>errors.push(e.message));await offline.route('http**/*',r=>r.abort());await offline.goto('file:///'+process.cwd().replaceAll('\\','/')+'/qa-downloads/cities-offline.html');await offline.waitForSelector('#analysis:not([hidden])');assert.equal(await offline.evaluate(()=>rows.length),await page.evaluate(()=>rows.length));assert(await offline.locator('.echart svg').count()>0);await offline.close();
await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:'qa-cities-mobile.png',fullPage:true});
assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,count:await page.evaluate(()=>rows.length),checks:'city identity, Shenzhen/Hangzhou, zero/small groups, unknown geography, degree/work/channel/date filters, deadlines, 11 modules, offline and responsive',errors}));await browser.close();
