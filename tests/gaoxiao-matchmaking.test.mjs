import test from 'node:test';
import assert from 'node:assert/strict';
import {joinQueue,cancelQueue,advanceQueue,queueView} from '../workers/gaoxiao/matchmaking.js';
const player=n=>({playerId:`p${n}`,name:`玩家${n}`,schoolId:'S21'});
test('simultaneous humans share one room; remaining seats are left for AI',()=>{
  const q=[];joinQueue(q,player(1),0);joinQueue(q,player(2),100);q.forEach(t=>t.seenAt=19000);
  advanceQueue(q,4,19999,20000,()=> 'room');assert.equal(q[0].roomId,null);
  advanceQueue(q,4,20000,20000,()=> 'room');assert.equal(q[0].roomId,q[1].roomId);assert.equal(q[0].roster.length,2);
});
test('full room starts immediately and overflow becomes a second batch',()=>{
  const q=[];let id=0;for(let i=0;i<7;i++)joinQueue(q,player(i),i);
  advanceQueue(q,3,10,20000,()=>`r${++id}`);assert.equal(new Set(q.slice(0,6).map(t=>t.roomId)).size,2);assert.equal(q[6].roomId,null);
});
test('joining twice is idempotent; refresh preserves wait deadline',()=>{
  const q=[];joinQueue(q,player(1),0);joinQueue(q,player(1),1000);assert.equal(q.length,1);assert.equal(q[0].joinedAt,0);assert.equal(queueView(q,'p1',4,20000,1000).deadline,20000);
});
test('cancel and abandoned tab do not become phantom human seats',()=>{
  const q=[];joinQueue(q,player(1),0);joinQueue(q,player(2),100);assert.deepEqual(cancelQueue(q,'p1'),{cancelled:true});
  advanceQueue(q,4,20100,20000,()=> 'r');assert.equal(q.length,0);
});
test('cancel after assignment returns room for explicit leave instead of cancelling somebody else',()=>{
  const q=[];for(let i=0;i<3;i++)joinQueue(q,player(i),0);advanceQueue(q,3,1,20000,()=> 'r');assert.deepEqual(cancelQueue(q,'p0'),{roomId:'r'});assert.equal(q.length,3);
});
test('assignment survives repeated alarms and always reuses the exact roster',()=>{
  const q=[];for(let i=0;i<3;i++)joinQueue(q,player(i),0);advanceQueue(q,3,1,20000,()=> 'r');const snapshot=structuredClone(q);
  advanceQueue(q,3,21000,20000,()=> 'bad');assert.deepEqual(q,snapshot);
});
