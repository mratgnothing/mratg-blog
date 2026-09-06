import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const url=process.env.GXF_TEST_URL||'http://127.0.0.1:4331/games/gaoxiao-fengyun/';
const out='output/playwright/v2';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const contexts=[];const errors=[];const evidence=[];
async function page(name,size=4,mobile=false) {
  const c=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000}});contexts.push(c);
  const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url);await p.locator('#match:not([disabled])').waitFor();
  await p.locator('#nickname').fill(name);await p.locator('#table-size').selectOption(String(size));return p;
}
const state=p=>p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('gxf-online-v1'));return {roomId:s.roomId,size:s.size,waiting:s.waiting};});
try {
  const a=await page('浏览器甲'),b=await page('浏览器乙',4,true);
  assert.equal(await a.locator('#school option').count(),48);
  await a.screenshot({path:`${out}/desktop-lobby.png`,fullPage:false});
  await b.screenshot({path:`${out}/mobile-lobby.png`,fullPage:false});
  await Promise.all([a.locator('#match').click(),b.locator('#match').click()]);
  await a.locator('#queue:not([hidden])').waitFor();
  await a.waitForFunction(()=>document.querySelector('#queue-summary').textContent.includes('2 位真人'),{},{timeout:10000});
  await a.screenshot({path:`${out}/two-humans-queue.png`});
  await Promise.all([a.locator('#room:not([hidden])').waitFor({timeout:35000}),b.locator('#room:not([hidden])').waitFor({timeout:35000})]);
  const room=(await state(a)).roomId;assert.equal((await state(b)).roomId,room);
  assert.equal(await a.locator('.gxf-player').count(),3);
  assert.equal(await a.locator('.gxf-player header span').filter({hasText:'真人玩家'}).count(),1);
  assert.equal(await a.locator('.gxf-player header span').filter({hasText:'AI 玩家'}).count(),2);
  evidence.push('Two independent browsers: same room, 2 humans + 2 AI.');
  await Promise.all([a,b].map(p=>p.locator('#ready-button:not([disabled])').click()));
  await a.reload();await a.locator('#players .gxf-player').first().waitFor();assert.equal((await state(a)).roomId,room);
  evidence.push('Refresh restored the same room and player.');
  await Promise.all([a,b].map(async p=>{
    await p.locator('#execute:not([disabled])').waitFor({timeout:15000});
    await p.locator('#execute').click();
  }));
  await a.waitForTimeout(1800);await a.screenshot({path:`${out}/desktop-room.png`,fullPage:true});
  await b.screenshot({path:`${out}/mobile-room.png`,fullPage:true});
  assert.ok(await b.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Mobile horizontal overflow');
  evidence.push('Both human clients executed their free filing action; mobile width has no overflow.');
  const c=await page('取消测试',5);await c.locator('#match').click();await c.locator('#queue:not([hidden])').waitFor();await c.locator('#cancel-match').click();await c.locator('#lobby:not([hidden])').waitFor();assert.equal((await state(c)).waiting,false);
  evidence.push('Cancel returned to lobby and cleared the waiting ticket.');
  await c.locator('#mode-ai').click();await c.locator('#practice').click();await c.locator('#room:not([hidden])').waitFor({timeout:10000});assert.equal(await c.locator('.gxf-player').count(),4);assert.equal(await c.locator('.gxf-player header span').filter({hasText:'AI 玩家'}).count(),4);
  evidence.push('AI mode created a 5-seat table with 1 human + 4 AI and waited for explicit readiness.');
  await c.locator('#ready-button:not([disabled])').click();
  await c.locator('#execute:not([disabled])').waitFor({timeout:25000});
  await c.locator('#execute').click();
  await c.locator('#motion-toggle').click();assert.equal(await c.locator('#motion-toggle').getAttribute('aria-pressed'),'true');
  await c.locator('#leave-room').click();await c.locator('#confirm-leave').click();await c.locator('#lobby:not([hidden])').waitFor();
  await c.locator('#archive-search').fill('东南大学');assert.equal(await c.locator('#archive-grid button').count(),1);await c.locator('#archive-grid button').click();await c.locator('#card-dialog[open]').waitFor();assert.ok((await c.locator('#card-detail').textContent()).includes('东南大学'));
  evidence.push('Leave confirmation, archive search, and card details work.');
  for(const p of [a,b]){await p.locator('#leave-room').click();await p.locator('#confirm-leave').click();await p.locator('#lobby:not([hidden])').waitFor();}
  assert.deepEqual(errors,[]);
  await fs.writeFile(`${out}/result.json`,JSON.stringify({passed:true,evidence,errors},null,2));console.log(JSON.stringify({passed:true,evidence,errors}));
} catch(e) {
  for(let i=0;i<contexts.length;i++){const p=contexts[i].pages()[0];if(p)await p.screenshot({path:`${out}/failure-${i}.png`}).catch(()=>{});}
  throw e;
} finally {await browser.close();}
