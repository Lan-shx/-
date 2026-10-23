import {chromium} from './qa-tools/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const checks=[];
try{
 await page.goto('http://127.0.0.1:8765/');
 await page.waitForSelector('[data-cmo-view="matrix"]',{timeout:120000});
 const base=await page.evaluate(()=>({n:rows.length,scope:filtered.length,view:journeyView,majors:bundle.taxonomy.majors.length,roles:bundle.taxonomy.occupations.length}));
 assert.equal(base.n,69465);assert.equal(base.view,'explorer');assert.equal(base.majors,18);assert.equal(base.roles,30);checks.push({name:'default explorer and preserved taxonomy',...base});
 await page.locator('[data-cmo-view="matrix"]').click();
 const cell=page.locator('[data-cmo-cell]').filter({hasNotText:'—'}).first();await cell.waitFor();
 const role=await cell.getAttribute('data-role'),city=await cell.getAttribute('data-city');
 const before=await page.evaluate(()=>JSON.stringify(state.filters));
 const expected=await page.evaluate(({role,city})=>filtered.filter(r=>r.occupation===role&&r.workCities.includes(city)).length,{role,city});
 await cell.click();assert.equal(await page.evaluate(()=>JSON.stringify(state.filters)),before);
 const detail=page.locator('#cmo-selection[data-record-count]');
 assert.equal(Number(await detail.first().getAttribute('data-record-count')),expected);
 await page.locator('[data-cmo-drill]').first().click();
 assert.equal(await page.evaluate(()=>filtered.length),expected);
 assert(await page.evaluate(({role,city})=>state.filters.occupations.includes(role)&&state.filters.cities.includes(city),{role,city}));
 checks.push({name:'local matrix selection then exact drilldown',role,city,expected});
 await page.evaluate(()=>applyFilters(defaultFilters()));
 // Filter dimensions stay consistent with the original evidence engine across modules.
 const major=await page.evaluate(()=>bundle.taxonomy.majors.find(m=>m.occs.length&&m.occs.length<15)?.name||bundle.taxonomy.majors[0].name);
 await page.locator('#market-major').selectOption(major);
 assert(await page.evaluate(()=>{const ids=bundle.taxonomy.majors.find(m=>m.name===state.filters.major).occs;return JSON.stringify(state.filters.occupations)===JSON.stringify(ids)&&filtered.every(r=>ids.includes(r.occupation))}));
 const majorFilters=await page.evaluate(()=>JSON.stringify(state.filters));
 await page.evaluate(()=>goJourney('discover'));assert.equal(await page.evaluate(()=>JSON.stringify(state.filters)),majorFilters);
 await page.evaluate(()=>goJourney('compare'));assert.equal(await page.evaluate(()=>JSON.stringify(state.filters)),majorFilters);
 checks.push({name:'major mapping and shared range preserved',major});
 await page.evaluate(()=>{applyFilters(defaultFilters());goJourney('snapshot')});
 await page.locator('[data-cmo-display]').first().click();
 const displayFilters=await page.evaluate(()=>JSON.stringify(state.filters));
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>JSON.stringify(state.filters)),displayFilters);
 checks.push({name:'display exit preserves filters'});
 assert.deepEqual(errors,[]);
 const manifest=await fs.readFile('dist/jobs.json');assert.equal(crypto.createHash('sha256').update(manifest).digest('hex'),'46e403b28bc457a69cd4593b7fdfe653ccc5837212e661972bc554d330599cf5');
 const data=JSON.parse(manifest);for(const c of data.chunks){assert.equal(crypto.createHash('sha256').update(await fs.readFile('dist/'+c.jsonPath)).digest('hex'),c.sha256)}
 checks.push({name:'immutable complete historical data',rowCount:data.rowCount,chunks:data.chunks.length});
 await fs.writeFile('qa-feature-contract.json',JSON.stringify({passed:true,checks,errors},null,2));console.log(JSON.stringify({passed:true,checks}));
}finally{await browser.close()}
