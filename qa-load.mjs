import {chromium} from './qa-tools/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
for(const fallback of [false,true]){
 const page=await browser.newPage(),requests=[];page.on('request',r=>requests.push(r.url()));if(fallback)await page.addInitScript(()=>delete window.DecompressionStream);
 await page.goto('http://127.0.0.1:8765/');await page.waitForSelector('[data-cmo-view="overview"]',{timeout:120000});
 assert(await page.evaluate(()=>rows.length===bundle.rowCount));assert(requests.some(u=>fallback?/data\/jobs-\d+\.json$/.test(u):u.endsWith('.json.gz')));await page.close();
}
for(const mode of ['missing','tampered']){
 const page=await browser.newPage();await page.route('**/data/jobs-00.json.gz',route=>mode==='missing'?route.abort():route.fulfill({status:200,body:'[]'}));
 await page.goto('http://127.0.0.1:8765/');await page.waitForSelector('#load-status .button');assert(await page.locator('#analysis').isHidden());await page.close();
}
console.log(JSON.stringify({passed:true,checks:'gzip, plain JSON fallback, missing/tampered chunk blocks partial dataset'}));await browser.close();
