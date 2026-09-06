import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
const base='http://127.0.0.1:8792/api/gaoxiao';
let token;
async function api(path,body){const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{...(token?{Authorization:`Bearer ${token}`} : {}),'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const j=await r.json();assert.equal(r.status,200,JSON.stringify(j));return j;}
token=(await api('/session',{})).token;
const match=await api('/practice',{name:'超时测试',schoolId:'S21',size:3});
let v=await api(`/room/${match.roomId}/state?size=3`);
const before=v.version;
const deadline=Date.now()+12000;
while(!v.players.find(p=>p.id===v.me).auto&&Date.now()<deadline){await delay(250);v=await api(`/room/${match.roomId}/state?size=3`);}
assert.ok(v.players.find(p=>p.id===v.me).auto,'Timeout should enable AI control');assert.ok(v.version>before);
v=await api(`/room/${match.roomId}/resume`,{size:3});assert.equal(v.players.find(p=>p.id===v.me).auto,false);
await api(`/room/${match.roomId}/leave`,{size:3,practice:true});
// Deadline race: cancellation after queue commits must initialize the assigned room.
const waiting=await api('/match',{name:'取消竞争测试',schoolId:'S21',size:6});assert.equal(waiting.status,'waiting');
await delay(1150);
const cancelled=await api('/match/cancel',{size:6});assert.ok(cancelled.roomId);
v=await api(`/room/${cancelled.roomId}/state?size=6`);assert.equal(v.players.length,6);
await api(`/room/${cancelled.roomId}/leave`,{size:6});
console.log(JSON.stringify({passed:true,evidence:['Durable alarm advanced AI without any human actions.','Expired human turn switched to AI; explicit resume returned control.','Cancel at matching deadline returned an initialized, accessible room.']}));
