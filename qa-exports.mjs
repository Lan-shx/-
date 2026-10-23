import {chromium} from './qa-tools/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));const checks=[];
try{
 await page.goto('http://127.0.0.1:8765/#snapshot/map');await page.waitForSelector('#cmo-svg-map svg',{timeout:120000});
 const svgDownload=page.waitForEvent('download');await page.locator('.export-menu summary').click();await page.locator('[data-export="svg"]').click();const svgPath=path.resolve('qa-downloads/qa-map.svg');await (await svgDownload).saveAs(svgPath);
 const svg=await fs.readFile(svgPath,'utf8');assert(svg.includes('cmo-provinces'));assert(/<style|fill=/.test(svg));
 const svgPage=await context.newPage();await svgPage.goto(pathToFileURL(svgPath).href);const styles=await svgPage.evaluate(()=>{const p=document.querySelector('.cmo-provinces path');return{paths:document.querySelectorAll('path').length,fill:getComputedStyle(p).fill,stroke:getComputedStyle(p).stroke}});assert(styles.paths>=34);assert.notEqual(styles.fill,'rgb(0, 0, 0)');assert.notEqual(styles.stroke,'none');await svgPage.close();checks.push({name:'standalone styled geographical SVG',...styles});
 const offlineDownload=page.waitForEvent('download',{timeout:120000});await page.evaluate(()=>exportOffline());const htmlPath=path.resolve('qa-downloads/qa-offline.html');await (await offlineDownload).saveAs(htmlPath);
 const html=await fs.readFile(htmlPath,'utf8');assert(html.includes('__CMO_GEO__'));assert(html.includes('__CAREER_DATA__'));
 await context.setOffline(true);const offline=await context.newPage();offline.on('pageerror',e=>errors.push('offline:'+e.message));await offline.goto(pathToFileURL(htmlPath).href,{timeout:120000});await offline.waitForSelector('[data-cmo-view="matrix"]',{timeout:120000});await offline.waitForSelector('#cmo-svg-map svg',{timeout:120000});
 assert.equal(await offline.locator('script[src],link[rel="stylesheet"]').count(),0);assert.equal(await offline.evaluate(()=>rows.length),69465);await offline.locator('[data-cmo-view="matrix"]').click();assert(await offline.locator('[data-cmo-cell]').count()>0);await offline.locator('[data-cmo-cell]').first().click();assert(await offline.locator('[data-cmo-drill]').isVisible());checks.push({name:'full HTML works with network disconnected',rowCount:69465,bytes:Buffer.byteLength(html)});
 assert.deepEqual(errors,[]);await fs.writeFile('qa-exports.json',JSON.stringify({passed:true,checks,errors},null,2));console.log(JSON.stringify({passed:true,checks}));
}finally{await browser.close()}
