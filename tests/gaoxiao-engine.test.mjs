import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createGame,activePlayer,legalActions,applyAction,chooseAI,publicView,capacity,settleProjects,evaluate,rates,projectMatch} from '../workers/gaoxiao/engine.js';
const d=JSON.parse(fs.readFileSync(new URL('../public/assets/games/gaoxiao-fengyun/cards.json',import.meta.url))).decks;
const game=(size=4,seed=42)=>createGame(d,[{playerId:'human',schoolId:'S21',name:'测试校长'}],size,seed);
function turn(s,fn) {const p=activePlayer(s),a=legalActions(s,d,p.id).find(fn);assert.ok(a);applyAction(s,d,p.id,a.id);return p;}
function actionsPhase(s) {while(s.phase==='filing')turn(s,a=>a.type==='pass');}

test('336 cards parse; project qualification and rates are present for all 60 projects',()=>{
  assert.deepEqual(Object.fromEntries(Object.entries(d).map(([k,v])=>[k,v.length])),{school:48,faculty:96,talent:36,event:72,project:60,policy:24});
  for(const c of d.project){assert.ok(c.main.length);assert.ok(c.support.length);assert.ok(c.pool>=4&&c.pool<=8);assert.ok(c.era);}
});
test('seeded setup is reproducible, unique faculties, unique seats and 4/5 project lanes',()=>{
  assert.deepEqual(game(4),game(4));
  for(const size of [3,4,5,6]){const s=game(size);assert.equal(s.players.length,size);assert.equal(s.projects.length,size>=5?5:4);assert.equal(s.players.filter(p=>p.human).length,1);assert.equal(new Set(s.players.map(p=>p.schoolId)).size,size);}
});
test('wrong player and unknown action cannot change state',()=>{
  const s=game(),before=structuredClone(s),p=activePlayer(s);
  assert.throws(()=>applyAction(s,d,'outsider','research:1'));assert.deepEqual(s,before);
  assert.throws(()=>applyAction(s,d,p.id,'infinite-money'));assert.deepEqual(s,before);
});
test('free filing is separate from 4 AP; a skipped filing cannot be reclaimed',()=>{
  const s=game();const p=turn(s,a=>a.type==='bid');assert.equal(p.ap,4);assert.equal(p.filed,true);
  while(s.phase==='filing')turn(s,a=>a.type==='pass');
  assert.ok(s.players.every(p=>p.ap===4));assert.ok(legalActions(s,d,activePlayer(s).id).filter(a=>a.type==='bid').every(a=>!a.label.includes('免费')));
});
test('no-match social fallback is free only when ALL projects fail to match',()=>{
  const s=game(),p=activePlayer(s);p.campus=[{id:'f-test',cardId:'BUS01',core:true,certified:false,bonus:0,talents:[]}];
  s.projects=[{id:'P01',pool:6}];
  let bids=legalActions(s,d,p.id).filter(a=>a.type==='bid');assert.ok(bids.length);assert.ok(bids.every(a=>a.res==='money'&&a.cost.money===a.units*3));
  s.projects.push({id:'P08',pool:5});bids=legalActions(s,d,p.id).filter(a=>a.type==='bid');assert.ok(bids.every(a=>a.projectId==='P08'));
});
test('each player may bid on at most two projects and cannot spend unavailable resources',()=>{
  const s=game();actionsPhase(s);const p=activePlayer(s);
  p.bids={[s.projects[0].id]:{points:1,paid:{money:0,science:1,policy:0},at:1},[s.projects[1].id]:{points:1,paid:{money:0,science:1,policy:0},at:2}};
  assert.ok(legalActions(s,d,p.id).filter(a=>a.type==='bid').every(a=>Object.keys(p.bids).includes(a.projectId)));
  p.money=0;p.science=0;p.policy=0;assert.ok(!legalActions(s,d,p.id).some(a=>a.cost&&Object.values(a.cost).some(v=>v>0)));
});
test('project pool uses integer proportional split, single bidder halves, lower bids refund per-resource',()=>{
  const s=game(),[a,b,c]=s.players;s.projects=[{id:'P01',pool:7}];s.players.forEach(p=>{p.bids={};p.prestige=0;});
  a.bids.P01={points:4,paid:{money:0,science:4,policy:0},at:1};b.bids.P01={points:3,paid:{money:0,science:3,policy:0},at:2};c.bids.P01={points:1,paid:{money:3,science:1,policy:0},at:3};
  const money=c.money,science=c.science;settleProjects(s,d);assert.equal(a.prestige,4);assert.equal(b.prestige,3);assert.equal(c.money,money+1);assert.equal(c.science,science);
  a.prestige=0;b.bids={};c.bids={};settleProjects(s,d);assert.equal(a.prestige,4);
});
test('uncontested disciplines do not farm evaluation prestige; tied first share high rewards',()=>{
  const s=game(3);s.events=[];s.players.forEach((p,i)=>{p.prestige=0;p.campus=[{id:`f${i}`,cardId:['W01','SCI01','BUS01'][i],core:false,certified:false,bonus:0,talents:[]}];});
  evaluate(s,d);assert.ok(s.players.every(p=>p.prestige===0));
  s.players[1].campus[0].cardId='W02';evaluate(s,d);assert.equal(s.players[0].prestige,7);assert.equal(s.players[1].prestige,7);assert.equal(s.players.flatMap(p=>p.campus).filter(f=>f.certified).length,1);
});
test('regular disciplines can pay upgrade science with policy; thinktank is once per era',()=>{
  const s=game();actionsPhase(s);const p=activePlayer(s);p.campus=[{id:'f-test',cardId:'W01',core:false,certified:false,bonus:0,talents:[]},{id:'f2',cardId:'F01',core:false,certified:false,bonus:0,talents:[]}];p.science=0;p.policy=5;p.money=5;
  const upgrade=legalActions(s,d,p.id).find(a=>a.type==='upgrade');assert.equal(upgrade.cost.policy,2);
  const a=legalActions(s,d,p.id).find(a=>a.type==='thinktank'&&a.units===1);applyAction(s,d,p.id,a.id);assert.equal(p.ap,4);assert.ok(!legalActions(s,d,p.id).some(a=>a.type==='thinktank'));
});
test('trade requires consent, rejection leaves resources untouched, acceptance escrows and reserves space',()=>{
  const s=game();actionsPhase(s);const buyer=activePlayer(s),seller=s.players.find(p=>p.id!==buyer.id);
  buyer.money=50;buyer.policy=10;buyer.campus=buyer.campus.slice(0,1);seller.campus[0].core=false;
  let offer=legalActions(s,d,buyer.id).find(a=>a.type==='offer'&&a.seller===seller.id);assert.ok(offer);
  const funds=buyer.money;applyAction(s,d,buyer.id,offer.id);assert.equal(activePlayer(s).id,seller.id);assert.equal(buyer.money,funds);
  turn(s,a=>a.type==='decline');assert.equal(activePlayer(s).id,buyer.id);assert.equal(buyer.ap,4);assert.equal(buyer.money,funds);
  buyer.transferUsed=false;offer=legalActions(s,d,buyer.id).find(a=>a.type==='offer'&&a.seller===seller.id);applyAction(s,d,buyer.id,offer.id);turn(s,a=>a.type==='accept');assert.equal(buyer.ap,3);assert.equal(s.transfers.length,1);assert.equal(buyer.money,funds-offer.price);assert.ok(seller.campus.some(f=>f.id===offer.facultyId));
});
test('public view hides random seed and future decks; AI does not depend on hidden RNG',()=>{
  const s=game(),p=activePlayer(s),copy=structuredClone(s);copy.rng=999;
  assert.deepEqual(chooseAI(s,d,p.id),chooseAI(copy,d,p.id));
  const v=publicView(s,d,p.id);assert.equal(v.rng,undefined);assert.equal(v.order,undefined);assert.equal(v.decks,undefined);
});
test('192 seeded full games cover all 48 schools and 3–6 seats, terminate, preserve resource/slot invariants',()=>{
  let moves=0;
  for(let school=0;school<48;school++)for(const size of [3,4,5,6]) {
    const s=createGame(d,[{playerId:'human',schoolId:d.school[school].id,name:'校长'}],size,school*23+size);
    let n=0;
    while(!s.ended&&n++<350) {
      const p=activePlayer(s),a=chooseAI(s,d,p.id);applyAction(s,d,p.id,a.id);moves++;
      for(const p of s.players){for(const r of ['money','science','policy','students','prestige','ap'])assert.ok(Number.isInteger(p[r])&&p[r]>=0,`${school}/${size}: ${r}=${p[r]}`);assert.ok(p.ap<=4);assert.ok(Object.keys(p.bids).length<=2);assert.ok(p.campus.length<=capacity(d,p));}
      const ids=s.players.flatMap(p=>p.campus.map(f=>f.cardId));assert.equal(new Set(ids).size,ids.length);
    }
    assert.ok(s.ended,`${school}/${size}: stuck at ${s.phase}`);assert.equal(s.results.length,size);assert.equal(legalActions(s,d,s.players[0].id).length,0);
  }
  console.log(`Completed 192 games, ${moves} legal moves.`);
});
