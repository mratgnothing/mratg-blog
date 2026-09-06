import { DurableObject } from 'cloudflare:workers';
import data from '../../public/assets/games/gaoxiao-fengyun/cards.json';
import { createGame, applyAction, chooseAI, publicView, legalActions, activePlayer } from './engine.js';
import { joinQueue, cancelQueue, advanceQueue, queueView, TICKET_TTL_MS } from './matchmaking.js';

const API = '/api/gaoxiao';
const VERSION = '1.1.0';
const json = (body, status = 200) => Response.json(body?._error ? {error:body._error} : body, {status:body?._error ? body.status : status, headers: {'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'}});
const number = (value, fallback) => value !== null && value !== undefined && Number.isFinite(Number(value)) ? Number(value) : fallback;
function assert(value, message, status = 400) { if (!value) throw Object.assign(new Error(message), {status}); }
function initStore(ctx) { ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL)'); }
function readStore(ctx) { const rows = ctx.storage.sql.exec('SELECT body FROM state WHERE id=1').toArray(); return rows.length ? JSON.parse(rows[0].body) : null; }
function saveStore(ctx, value) { ctx.storage.sql.exec('INSERT INTO state(id,body) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body', JSON.stringify(value)); }

export class Matchmaker extends DurableObject {
  constructor(ctx, env) { super(ctx, env); initStore(ctx); }
  async update(player, size, operation) {
    try { return await this.performUpdate(player,size,operation); }
    catch(error) { if(error.status)return {_error:error.message,status:error.status}; throw error; }
  }
  async performUpdate(player, size, operation) {
    const now = Date.now();
    const saved = readStore(this.ctx) || { queue: [], size, rates: {}, practice: operation === 'practice' };
    const waitMs = saved.practice ? 0 : number(this.env.MATCH_WAIT_MS,20000);
    const q = saved.queue;
    // Remove expired leases before handling retries; a dead ticket cannot be revived into a committed batch.
    advanceQueue(q, size, now, waitMs, () => crypto.randomUUID());
    if (operation === 'join' || operation === 'practice') {
      assert(q.length < 1000 || q.some(t => t.playerId === player.playerId), '匹配大厅繁忙，请稍后再试。', 429);
      if (!q.some(t => t.playerId === player.playerId)) {
        const rate = saved.rates[player.ip] || { at: now, count: 0 };
        if (now - rate.at > 60000) { rate.at = now; rate.count = 0; }
        assert(rate.count < 12, '匹配请求过于频繁，请稍后再试。',429);
        rate.count++; saved.rates[player.ip] = rate;
      }
      joinQueue(q, {playerId: player.playerId, name: player.name, schoolId: player.schoolId}, now);
    } else if (operation === 'poll') {
      const ticket = q.find(t => t.playerId === player.playerId);
      if (ticket) ticket.seenAt = now;
    } else if (operation === 'cancel') {
      const result = cancelQueue(q, player.playerId);
      saveStore(this.ctx, saved);
      if (result.roomId) {
        const ticket = q.find(t => t.playerId === player.playerId);
        await this.env.ROOMS.getByName(ticket.roomId).initialize(ticket.roomId, ticket.roster, size, saved.practice);
      }
      return result;
    } else if (operation === 'release') {
      const ticket = q.find(t => t.playerId === player.playerId);
      assert(!ticket || ticket.roomId === player.roomId, '房间信息已更新，请刷新。',409);
      if (ticket) q.splice(q.indexOf(ticket),1);
    }
    advanceQueue(q, size, now, waitMs, () => crypto.randomUUID());
    saved.rates = Object.fromEntries(Object.entries(saved.rates).filter(([, r]) => now - r.at < 60000));
    saveStore(this.ctx, saved);
    await this.ctx.storage.setAlarm(now + 5000);
    const ticket = q.find(t => t.playerId === player.playerId);
    // Assignment is durable before RPC. Any poll safely retries the same room initialization.
    if (ticket?.roomId) await this.env.ROOMS.getByName(ticket.roomId).initialize(ticket.roomId, ticket.roster, size, saved.practice);
    return queueView(q, player.playerId, size, waitMs, now);
  }
  async alarm() {
    const saved = readStore(this.ctx);
    if (!saved) return;
    const now = Date.now();
    advanceQueue(saved.queue, saved.size, now, saved.practice ? 0 : number(this.env.MATCH_WAIT_MS,20000), () => crypto.randomUUID());
    saveStore(this.ctx, saved);
    if (saved.queue.length) await this.ctx.storage.setAlarm(now + (saved.queue.some(t => !t.roomId) ? 5000 : TICKET_TTL_MS));
    else this.ctx.storage.sql.exec('DELETE FROM state');
  }
}

export class GameRoom extends DurableObject {
  constructor(ctx, env) { super(ctx, env); initStore(ctx); }
  async initialize(roomId, roster, size, practice = false) {
    if (readStore(this.ctx)) return;
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    const game = createGame(data.decks, roster, size, seed);
    const now = Date.now();
    const saved = {roomId, game, practice, started:false, ready:[], seen:{}, readyAt:now, touched: now, expires: now + TICKET_TTL_MS, receipts: [], deadline: now + number(this.env.TURN_MS,300000)};
    saveStore(this.ctx,saved);
    await this.schedule(saved);
  }
  deadline(saved, now) {
    const p = activePlayer(saved.game);
    saved.deadline = saved.game.ended ? now + 3600000 : Math.max(now,saved.readyAt||0) + (p?.human && !p.left ? number(this.env.TURN_MS,300000) : number(this.env.AI_MS,2500));
  }
  async schedule(saved) { await this.ctx.storage.setAlarm(Math.min(saved.deadline, saved.expires)); }
  async request(playerId, operation, body = {}) {
    try { return await this.performRequest(playerId,operation,body); }
    catch(error) { if(error.status)return {_error:error.message,status:error.status}; throw error; }
  }
  async performRequest(playerId, operation, body = {}) {
    const saved = readStore(this.ctx);
    assert(saved, '房间已过期，请重新匹配。',404);
    const p = saved.game.players.find(p => p.id === playerId && p.human);
    assert(p, '你不在这个房间中。',403);
    const now = Date.now();
    assert(now < saved.expires, '房间已过期，请重新匹配。',410);
    saved.seen ||= {}; saved.seen[playerId] = now;
    // Migrate old rooms: human is an identity, never a permanent timeout controller.
    if (saved.started === undefined) saved.started = true;
    saved.ready ||= [];
    if (p.auto && !p.left && !saved.game.ended) {
      p.auto = false; saved.game.version++;
      if (activePlayer(saved.game)?.id === playerId) this.deadline(saved,now);
    }
    if (operation === 'ready') {
      assert(!p.left,'已经退出这场对局。',403);
      if(!saved.ready.includes(playerId)) { saved.ready.push(playerId); saved.game.version++; }
      if(!saved.started && saved.game.players.filter(p=>p.human&&!p.left).every(p=>saved.ready.includes(p.id))) {
        saved.started=true; saved.readyAt=now+number(this.env.ERA_MS,5000);this.deadline(saved,now);
      }
    }
    if (operation === 'action') {
      assert(typeof body.requestId === 'string' && /^[a-zA-Z0-9-]{8,80}$/.test(body.requestId),'请求编号无效。');
      if (!saved.receipts.some(r => r.playerId === playerId && r.id === body.requestId)) {
        assert(!p.left, '已退出对局，不能继续操作。',403);
        assert(saved.started,'请先准备开始对局。',409);
        assert(now >= (saved.readyAt||0),'正在发牌，请稍候。',409);
        assert(body.version === saved.game.version, '局面已更新，请按最新状态行动。',409);
        const era = saved.game.era;
        applyAction(saved.game, data.decks, playerId, body.actionId);
        if(saved.game.era!==era) saved.readyAt=now+number(this.env.ERA_MS,5000);
        saved.receipts.push({playerId,id:body.requestId});
        saved.receipts = saved.receipts.slice(-80);
        this.deadline(saved,now);
      }
    } else if (operation === 'resume') {
      assert(!p.left, '已退出本局，请重新匹配。',403);
      if (p.auto && !saved.game.ended) {
        p.auto = false; saved.game.version++;
        if (activePlayer(saved.game)?.id === playerId) this.deadline(saved,now);
      }
    } else if (operation === 'leave') {
      if (!p.left) {
        p.auto = true; p.left = true; saved.game.version++;
        if (activePlayer(saved.game)?.id === playerId) this.deadline(saved,now);
        if (saved.game.players.filter(p => p.human).every(p => p.left)) saved.expires = now + 60000;
      }
    }
    saved.touched = now;
    saveStore(this.ctx,saved);
    await this.schedule(saved);
    return {...publicView(saved.game,data.decks,playerId), roomId:saved.roomId, practice:!!saved.practice, started:saved.started, ready:saved.ready, readyAt:saved.readyAt||0, deadline:saved.deadline, serverNow:now};
  }
  async alarm() {
    const saved = readStore(this.ctx);
    if (!saved) return;
    const now = Date.now();
    if (now >= saved.expires || (saved.game.ended && now >= saved.deadline)) { this.ctx.storage.sql.exec('DELETE FROM state'); return; }
    if (now >= saved.deadline) {
      if(saved.started === false) {
        if(saved.practice) {saved.deadline=now+number(this.env.TURN_MS,300000);saveStore(this.ctx,saved);await this.schedule(saved);return;}
        saved.started=true;saved.game.version++;saved.readyAt=now+number(this.env.ERA_MS,5000);this.deadline(saved,now);saveStore(this.ctx,saved);await this.schedule(saved);return;
      }
      const p = activePlayer(saved.game);
      if (p?.human && !p.left) {
        p.auto=false;
        if(saved.practice || now-(saved.seen?.[p.id]||0)<30000) {
          this.deadline(saved,now);saveStore(this.ctx,saved);await this.schedule(saved);return;
        }
        saved.game.logs.unshift(`${p.name} 暂时离线，AI 仅代为完成本次行动；回来即可继续操作。`);
      }
      if (p && !saved.game.ended) {
        const era=saved.game.era;
        const action = chooseAI(saved.game,data.decks,p.id);
        applyAction(saved.game,data.decks,p.id,action.id);
        if(saved.game.era!==era)saved.readyAt=now+number(this.env.ERA_MS,5000);
      }
      this.deadline(saved,now);
      saveStore(this.ctx,saved);
    }
    await this.schedule(saved);
  }
}

async function boundedBody(request) {
  assert(Number(request.headers.get('content-length') || 0) <= 4096,'请求过大。',413);
  const reader = request.body?.getReader();
  if (!reader) return {};
  let size = 0; const chunks = [];
  for (;;) {
    const {done,value} = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > 4096) { await reader.cancel(); assert(false,'请求过大。',413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset=0;
  for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes) || '{}'); } catch { assert(false,'请求格式无效。'); }
}
export default {
  async fetch(request,env) {
    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(API,'');
      if (path === '/health' && request.method === 'GET') return json({ok:true,version:VERSION,rules:'quick-v1',matchWaitMs:number(env.MATCH_WAIT_MS,20000)});
      const origin = request.headers.get('origin');
      assert(!origin || origin === url.origin || origin === 'https://mra-t-g-blog.cn' || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin), '来源不被允许。',403);
      assert(['GET','POST'].includes(request.method),'请求方法不被允许。',405);
      if (path === '/session' && request.method === 'POST') return json({token:crypto.randomUUID().replaceAll('-','') + crypto.randomUUID().replaceAll('-','')});
      const token = request.headers.get('Authorization')?.replace(/^Bearer /,'');
      assert(token && /^[a-f0-9]{64}$/.test(token),'会话无效，请重新进入游戏。',401);
      const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)));
      const playerId = [...digest].map(x => x.toString(16).padStart(2,'0')).join('');
      const body = request.method === 'POST' ? await boundedBody(request) : {};
      const size = number(body.size ?? url.searchParams.get('size'),4);
      assert(Number.isInteger(size) && size >= 3 && size <= 6,'桌位数须为 3 到 6。');
      if (path === '/match' || path === '/match/cancel' || path === '/practice') {
        if (path === '/match/cancel') assert(request.method === 'POST','请使用 POST。',405);
        let player = {playerId, ip:request.headers.get('CF-Connecting-IP') || 'local'};
        if (request.method === 'POST' && path !== '/match/cancel') {
          assert(typeof body.name === 'string' && body.name.trim().length > 0 && body.name.trim().length <= 16,'昵称请填写 1–16 个字符。');
          assert(data.decks.school.some(s => s.id === body.schoolId),'请选择有效高校。');
          player = {...player, name:body.name.trim().replace(/[\u0000-\u001f\u007f]/g,''), schoolId:body.schoolId};
          assert(player.name.length > 0, '昵称不能只包含控制字符。');
        }
        if (path === '/practice') {
          assert(request.method === 'POST','请使用 POST。',405);
          // Practice shares queue admission limits but uses its own matching coordinator per player.
          return json(await env.MATCHMAKER.getByName(`practice-${size}-${playerId}`).update(player,size,'practice'));
        }
        const practice = body.practice === true || url.searchParams.get('practice') === 'true';
        const coordinator = env.MATCHMAKER.getByName(practice ? `practice-${size}-${playerId}` : `public-${size}`);
        return json(await coordinator.update(player,size,path.endsWith('/cancel') ? 'cancel' : request.method === 'GET' ? 'poll' : 'join'));
      }
      const room = path.match(/^\/room\/([a-f0-9-]{36})\/(state|action|ready|resume|leave)$/);
      if (room) {
        const [,roomId,operation] = room;
        assert(request.method === (operation === 'state' ? 'GET' : 'POST'),'请求方法不被允许。',405);
        const result = await env.ROOMS.getByName(roomId).request(playerId,operation,body);
        if (operation === 'leave' && !result._error) {
          const practice = body.practice === true;
          await env.MATCHMAKER.getByName(practice ? `practice-${size}-${playerId}` : `public-${size}`).update({playerId,roomId},size,'release');
        }
        return json(result);
      }
      return json({error:'接口不存在。'},404);
    } catch(error) {
      const status = error.status || 500;
      if (status === 500) console.error(JSON.stringify({type:'game_error',message:error.message}));
      return json({error:status === 500 ? '游戏服务暂时不可用，请稍后重试。' : error.message},status);
    }
  }
};
