import {chromium} from './qa-tools/node_modules/playwright/index.mjs';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage();let last=null;const all=new Map();
page.on('response',r=>{if(new URL(r.url()).pathname==='/api/v1/search/job/posts')r.json().then(d=>{if(d.code===0){last=d.data;for(const j of d.data.job_post_list||[])all.set(j.id,j)}}).catch(()=>{})});
await page.goto('https://jobs.bytedance.com/experienced/position',{waitUntil:'domcontentloaded'});await page.waitForTimeout(4000);
const guide=page.locator('.hire-ai-assistant-guide-cn-mask');if(await guide.count()){console.log('guide',await guide.innerText());console.log('guidehtml',(await guide.innerHTML()).slice(-2200));const close=guide.locator('[class*=close],button').first();if(await close.count())await close.click()}
for(const category of ['运营','产品','职能 / 支持','销售','市场']){const el=page.getByText(category,{exact:true}).first();if(await el.count())await el.click();await page.waitForTimeout(1000)}
console.log('filtered',last?.count);console.log('buttons',await page.locator('button').allTextContents());console.log('pagination',await page.locator('[class*="pagination"]').first().innerText().catch(()=>''));
for(let n=0;n<650;n++){
 writeFileSync('bytedance-pool.json',JSON.stringify({rows:[...all.values()],collectedAt:'2026-10-03',source:'https://jobs.bytedance.com/experienced/position'}));
 const next=page.locator('.atsx-pagination-next,.ant-pagination-next,.el-pagination .btn-next,[aria-label="Next Page"],[aria-label="下一页"]');
 if(!await next.count())break;const target=next.first();if(await target.getAttribute('aria-disabled')==='true'||(await target.getAttribute('class')||'').includes('disabled'))break;
 const old=last?.job_post_list?.[0]?.id;await target.click();try{await page.waitForResponse(r=>new URL(r.url()).pathname==='/api/v1/search/job/posts',{timeout:15000})}catch{break}await page.waitForTimeout(800);if(last?.job_post_list?.[0]?.id===old)break;
 if(n%20===0)console.log('pages',n+1,'unique',all.size);
}
console.log('corporate collected',all.size);await browser.close();
