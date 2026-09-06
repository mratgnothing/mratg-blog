import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const base=process.env.GXF_API_URL||'http://127.0.0.1:8791/api/gaoxiao';
const clients=[];const evidence=[];
async function request(token,path,body,extraHeaders={}) {
  const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{...(token?{Authorization:`Bearer ${token}`} : {}),...(body===undefined?{}:{'Content-Type':'application/json'}),...extraHeaders},body:body===undefined?undefined:JSON.stringify(body)});
  const json=await r.json();return {status:r.status,body:json};
}
for(let i=0;i<3;i++){const r=await request(null,'/session',{});assert.equal(r.status,200);clients.push({token:r.body.token,name:`API校长${i}`,schoolId:`S${String(i+20).padStart(2,'0')}`});}
const joins=await Promise.all(clients.map(c=>request(c.token,'/match',{name:c.name,schoolId:c.schoolId,size:3})));
assert.ok(joins.every(r=>r.status===200));
const tickets=await Promise.all(clients.map(c=>request(c.token,'/match?size=3')));
const roomId=tickets[0].body.roomId;assert.ok(roomId);assert.ok(tickets.every(r=>r.body.roomId===roomId));
let latest;
for(const c of clients){const r=await request(c.token,`/room/${roomId}/state?size=3`);assert.equal(r.status,200);c.id=r.body.me;latest=r.body;}
assert.ok(latest.players.every(p=>p.human));evidence.push('Concurrent 3-human queue created exactly one all-human room.');
const outsider=(await request(null,'/session',{})).body.token;
assert.equal((await request(outsider,`/room/${roomId}/state?size=3`)).status,403);
assert.equal((await request(null,`/room/${roomId}/state?size=3`)).status,401);
assert.equal((await request(clients[0].token,'/match',{size:3,name:'bad',schoolId:'S21'},{Origin:'https://evil.example'})).status,403);
assert.equal((await request(clients[0].token,'/match',{size:3,name:'x'.repeat(5000),schoolId:'S21'})).status,413);
evidence.push('Non-member, unauthenticated, cross-origin, and oversized requests rejected.');
let current=clients.find(c=>c.id===latest.active);latest=(await request(current.token,`/room/${roomId}/state?size=3`)).body;
const wrong=clients.find(c=>c.id!==latest.active);
assert.equal((await request(wrong.token,`/room/${roomId}/action`,{size:3,version:latest.version,requestId:randomUUID(),actionId:'pass:0'})).status,400);
const action=latest.actions.find(a=>a.type==='bid')||latest.actions.at(-1);
const command={size:3,version:latest.version,requestId:randomUUID(),actionId:action.id};
const result=await request(current.token,`/room/${roomId}/action`,command);assert.equal(result.status,200);
const retry=await request(current.token,`/room/${roomId}/action`,command);assert.equal(retry.status,200);assert.equal(retry.body.version,result.body.version);
assert.equal((await request(current.token,`/room/${roomId}/action`,{...command,requestId:randomUUID()})).status,409);
evidence.push('Duplicate request id did not spend again; stale version and wrong actor rejected.');
latest=result.body;let actions=1;
while(!latest.ended && actions<140){
  current=clients.find(c=>c.id===latest.active);assert.ok(current);
  latest=(await request(current.token,`/room/${roomId}/state?size=3`)).body;
  const pass=latest.actions.find(a=>a.type==='pass');assert.ok(pass);
  const response=await request(current.token,`/room/${roomId}/action`,{size:3,version:latest.version,requestId:randomUUID(),actionId:pass.id});assert.equal(response.status,200,JSON.stringify(response.body));latest=response.body;actions++;
}
assert.ok(latest.ended);assert.equal(latest.results.length,3);evidence.push(`Three human sessions completed six eras through HTTP (${actions} actions).`);
for(const c of clients)assert.equal((await request(c.token,`/room/${roomId}/leave`,{size:3})).status,200);
console.log(JSON.stringify({passed:true,evidence}));
