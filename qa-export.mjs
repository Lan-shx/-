import {chromium} from './qa-tools/node_modules/playwright/index.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({acceptDownloads:true});await page.goto('http://127.0.0.1:8765/');await page.waitForSelector('#analysis:not([hidden])');
await page.evaluate(()=>applyFilters({...defaultFilters(),cities:['深圳','杭州'],occupations:['16']}));
mkdirSync('qa-downloads',{recursive:true});const expected=await page.evaluate(()=>({base:rows.length,filtered:filtered.length}));
for(const type of ['csv','base-csv']){await page.locator('.export-menu>summary').click();const download=page.waitForEvent('download');await page.locator(`[data-export="${type}"]`).click();await(await download).saveAs(`qa-downloads/${type}.csv`)}
writeFileSync('qa-downloads/export-expected.json',JSON.stringify(expected));await browser.close();console.log(JSON.stringify(expected));
