import assert from 'node:assert/strict';import {setTimeout as delay} from 'node:timers/promises';
const base='http://127.0.0.1:8794/api/gaoxiao';let token;
async function api(path,body){const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{...(token?{Authorization:`Bearer ${token}`} : {}),'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const j=await r.json();assert.equal(r.status,200,JSON.stringify(j));return j;}
token=(await api('/session',{})).token;const match=await api('/practice',{name:'Human-QA',schoolId:'S48',size:4});let v=await api(`/room/${match.roomId}/state`);assert.equal(v.started,false);const before=v.version;
await delay(3000);v=await api(`/room/${match.roomId}/state`);assert.equal(v.version,before);assert.equal(v.started,false);
v=await api(`/room/${match.roomId}/ready`,{});assert.ok(v.deadline-v.serverNow<5000,'Must use short-timeout isolated Worker');const until=Date.now()+8000;
while(v.active!==v.me&&Date.now()<until){await delay(200);v=await api(`/room/${match.roomId}/state`);}assert.equal(v.active,v.me);const version=v.version;
await delay(4500);v=await api(`/room/${match.roomId}/state`);assert.equal(v.version,version);assert.equal(v.players.find(p=>p.id===v.me).human,true);assert.equal(v.players.find(p=>p.id===v.me).auto,false);
const a=v.actions.find(a=>a.type==='bid');v=await api(`/room/${match.roomId}/action`,{version:v.version,requestId:crypto.randomUUID(),actionId:a.id});assert.equal(v.players.find(p=>p.id===v.me).auto,false);await api(`/room/${match.roomId}/leave`,{practice:true,size:4});
console.log(JSON.stringify({passed:true,evidence:['AI game stayed in readiness until explicit player confirmation.','Human turn survived multiple expired countdowns with no auto takeover.','Human action succeeded after a long thinking pause.']}));
