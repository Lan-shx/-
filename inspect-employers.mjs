import {chromium} from './qa-tools/node_modules/playwright/index.mjs';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
for(const [name,url] of [['bytedance','https://jobs.bytedance.com/experienced/position'],['alibaba','https://talent.alibaba.com/position-list'],['yjs','https://q.yingjiesheng.com/jobs/search/']]){
 const page=await browser.newPage();const pending=[];let index=0;
 page.on('response',r=>{if(/\/search\/job\/posts/.test(r.url())&&r.headers()['content-type']?.includes('json'))pending.push((async()=>{try{const d=await r.json();const id=index++;writeFileSync(`raw/${name}-network-${id}.json`,JSON.stringify(d));console.log(name,id,new URL(r.url()).pathname,r.status(),r.request().method())}catch{}})())});
 try{await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(7000);console.log(name,'page', (await page.locator('body').innerText()).slice(0,200));await Promise.all(pending)}catch(e){console.log(name,e.message.slice(0,100))}await page.close();
}await browser.close();
