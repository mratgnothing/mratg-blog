const API='/api/gaoxiao', KEY='gxf-online-v1';
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const typeNames={school:'高校',faculty:'院系',talent:'人才',event:'事件',project:'国家工程',policy:'政策'};
const actionNames={bid:'申报 / 追加工程',research:'科研攻关',build:'建设院系',upgrade:'升级院系',transform:'工科转型',talent:'招募人才',admissions:'招生宣传',thinktank:'智库通道',offer:'协商调档',accept:'回复调档',decline:'拒绝调档',expedite:'加急调档',retain:'挽留院系'};
let session={}, data, cards=[], view=null, queue=null, timer, busy=false, pollBusy=false, stopped=false, serverOffset=0, archiveLimit=24;
let selectedMode='human', animationTimer, wasLocked=false;
try { session=JSON.parse(localStorage.getItem(KEY)||'{}'); } catch { session={}; }
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(session));}catch{error('浏览器禁止保存数据；关闭页面后将无法恢复本次会话。');}};
function error(message='') {$('game-error').textContent=message;$('game-error').hidden=!message;}
function mode(name) {for(const id of ['lobby','queue','room'])$(id).hidden=id!==name;$('lobby-hero').hidden=name==='room';document.querySelector('.gxf-online').classList.toggle('in-room',name==='room');}
function selectMode(value){selectedMode=value;for(const m of ['human','ai']){$('mode-'+m).classList.toggle('selected',m===value);$('mode-'+m).setAttribute('aria-pressed',String(m===value));}$('match').hidden=value==='ai';$('practice').hidden=value!=='ai';$('mode-help').textContent=value==='ai'?'你亲自操作自己的高校，AI 只担任对手。':'真人优先匹配，空位由 AI 补齐。';}
async function api(path,body) {
  const controller=new AbortController(),abort=setTimeout(()=>controller.abort(),12000);
  try {
    const r=await fetch(API+path,{method:body===undefined?'GET':'POST',headers:{...(session.token?{Authorization:`Bearer ${session.token}`} : {}),...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:controller.signal});
    const content=await r.text();let result;
    try {result=JSON.parse(content);}catch{throw new Error('游戏服务尚未连接，请稍后重试。');}
    if(!r.ok){const err=new Error(result.error||'连接失败，请重试。');err.status=r.status;throw err;}return result;
  } catch(e) { if(e.name==='AbortError')throw new Error('连接超时，正在等待重连。请勿重复开局。');throw e; }
  finally {clearTimeout(abort);}
}
function countdown() {
  const now=Date.now()+serverOffset;
  if(queue)$('queue-timer').textContent=`${Math.max(0,Math.ceil((queue.deadline-now)/1000))} 秒`;
  if(view){
    const locked=!view.started||now<view.readyAt;
    const seconds=Math.max(0,Math.ceil((view.deadline-now)/1000));
    $('turn-timer').textContent=view.ended?'本局结束':!view.started?'准备阶段':now<view.readyAt?'正在发牌':view.practice&&view.active===view.me?'自由思考':`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
    if(wasLocked&&!locked)renderActions();wasLocked=locked;
  }
}
async function start(practice=false) {
  if(busy||!$('match-form').reportValidity())return;
  busy=true;$('match').disabled=true;$('practice').disabled=true;error();
  session.name=$('nickname').value.trim();session.schoolId=$('school').value;session.size=Number($('table-size').value);session.practice=practice;
  try {
    if(!session.token)session.token=(await api('/session',{})).token;
    session.waiting=true;save();
    const result=await api(practice?'/practice':'/match',{name:session.name,schoolId:session.schoolId,size:session.size});
    await acceptQueue(result);schedule(500);
  } catch(e) {
    error(e.message);
    // The server may have accepted a timed-out POST. Poll the saved ticket instead of creating another game.
    if(!e.status){mode('queue');$('queue-summary').textContent='正在确认匹配结果…';schedule(1500);}
    else {session.waiting=false;save();}
  } finally {busy=false;$('match').disabled=false;$('practice').disabled=false;if(view)renderActions();}
}
async function acceptQueue(result) {
  if(result.status==='matched') {
    session.roomId=result.roomId;session.waiting=false;queue=null;save();await getRoom();
  } else if(result.status==='waiting') {
    queue=result;serverOffset=result.serverNow-Date.now();mode('queue');
    $('queue-summary').textContent=`已找到 ${result.humans} 位真人 / ${result.size} 个席位`;
    $('queue-names').textContent=result.names.join(' · ');countdown();
  } else if(result.status==='expired') {
    session.waiting=false;queue=null;save();mode('lobby');error(result.message);
  }
}
async function getRoom() {
  const next=await api(`/room/${session.roomId}/state?size=${session.size}`);
  receive(next);
}
function receive(next) {
  if(view && view.roomId===next.roomId && next.version<view.version)return;
  const me=next.players.find(p=>p.id===next.me);
  if(!me?.human){error('你的真人席位未正确恢复，请重新连接。');return;}
  const previous=view;
  serverOffset=next.serverNow-Date.now();
  const changed=!view||view.version!==next.version||view.roomId!==next.roomId;
  view=next;mode('room');
  if(changed){renderRoom();animateUpdate(previous,next);}countdown();
}
function animateUpdate(previous,next){
  const reduced=session.motion===false||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const newEra=next.started&&(!previous?.started||previous.era!==next.era);
  if(newEra&&!next.ended&&!reduced&&next.readyAt>Date.now()+serverOffset){
    $('transition-year').textContent=next.eraName;
    $('transition-title').textContent=previous?.started?'新的十年，新的机遇':'你的大学，从这里开始';
    $('era-transition').hidden=false;clearTimeout(animationTimer);
    animationTimer=setTimeout(()=>{$('era-transition').hidden=true;renderActions();},Math.min(3800,next.readyAt-Date.now()-serverOffset));
  }
  if(!reduced){
    const selectors=newEra?'#projects .gxf-item, #events .gxf-item, #faculty-market .gxf-item, #talent-market .gxf-item':null;
    if(selectors)document.querySelectorAll(selectors).forEach((el,i)=>{el.style.setProperty('--deal-delay',`${i*70}ms`);el.classList.add('deal-in');});
    const prevMe=previous?.players.find(p=>p.id===next.me),me=next.players.find(p=>p.id===next.me);
    if(prevMe)for(const f of me.campus)if(!prevMe.campus.some(x=>x.id===f.id&&x.cardId===f.cardId)){const el=document.querySelector(`[data-campus-id="${f.id}"]`);el?.classList.add('deal-in');}
    if(prevMe&&['money','science','policy','students','prestige'].some(k=>prevMe[k]!==me[k]))$('my-resources').classList.add('resource-change');
    if(previous?.active!==next.active)document.querySelector('.gxf-player.active')?.classList.add('seat-change');
  }
}
function schedule(ms=1500) {clearTimeout(timer);if(!stopped)timer=setTimeout(poll,ms);}
async function poll() {
  if(pollBusy||busy){schedule();return;}
  pollBusy=true;
  try {
    if(session.roomId)await getRoom();
    else if(session.waiting)await acceptQueue(await api(`/match?size=${session.size}&practice=${!!session.practice}`));
    else return;
    error();
  } catch(e) {
    error(e.message);
    if([401,403,404,410].includes(e.status)) {
      delete session.roomId;session.waiting=false;view=null;queue=null;save();mode('lobby');
    }
  } finally {pollBusy=false;if(session.waiting||session.roomId&&!view?.ended)schedule();}
}
async function cancelMatch() {
  if(busy)return;busy=true;$('cancel-match').disabled=true;
  try {
    const result=await api('/match/cancel',{size:session.size,practice:!!session.practice});
    if(result.roomId){await acceptQueue({status:'matched',roomId:result.roomId});schedule();}
    else {session.waiting=false;queue=null;save();mode('lobby');clearTimeout(timer);error();}
  }catch(e){error(e.message);}finally{busy=false;$('cancel-match').disabled=false;}
}
function resourceText(c) {return Object.entries(c.output||{}).map(([k,n])=>`${n}${({money:'💰',science:'🔬',policy:'🏛'})[k]}`).join(' + ');}
function item(c,body='',className='') {return `<article class="gxf-item ${className}"><span class="gxf-tag">${esc(c.id)} · ${esc(typeNames[c.type])}</span><h3>${esc(c.name)}</h3>${body}<button data-detail="${esc(c.type)}:${esc(c.id)}">查看牌面</button></article>`;}
function cardButtons(c,type){return `<div class="card-actions">${type?`<button class="card-play" data-select-type="${esc(type)}" data-select-name="${esc(c.name)}">${({bid:'选择申报',build:'建设',talent:'招募',upgrade:'升级'})[type]||'选择'}</button>`:''}<button data-detail="${esc(c.type)}:${esc(c.id)}">详情</button></div>`;}
function renderRoom() {
  const me=view.players.find(p=>p.id===view.me),active=view.players.find(p=>p.id===view.active);
  $('room-code').textContent=`${view.practice?'AI 对战':'真人匹配'} · ${view.players.filter(p=>p.human).length} 位真人 · 房间 ${view.roomId.slice(0,8)}`;
  $('room-title').textContent=`${view.eraName} · ${view.ended?'校史终章':!view.started?'入席准备':view.offer?'调档协商':view.phase==='filing'?'初始申报':'行动阶段'}`;
  $('turn-status').textContent=view.ended?'本局已结束。':!view.started?'先确认准备，再一起开启这场对局。':view.active===view.me?'轮到你了。你的高校，由你亲自决策。':`等待 ${active?.name} · ${active?.school} ${active?.human&&!active.left?'思考中':'正在行动'}…`;
  $('resume').hidden=!me.auto||me.left||view.ended;
  $('era-track').innerHTML=['1990s','2000s','2010s','2020s','2030s','2040s'].map((era,i)=>`<div class="era-stop ${i===view.era?'current':i<view.era?'past':''}" ${i===view.era?'aria-current="step"':''}>${era}<small>${['科研重建','高速发展','创新转型','科技浪潮','前沿探索','未来大学'][i]}</small></div>`).join('');
  $('ready-panel').hidden=view.started||view.ended;
  $('ready-button').disabled=busy||view.ready?.includes(view.me);
  $('ready-button').textContent=view.ready?.includes(view.me)?'已准备，等待同桌校长':'准备好了，开始对局';
  $('ready-copy').textContent=`你的席位：${me.name} · ${me.school}（真人）。${view.practice?'你可以自由思考，AI 不会替你操作。':`已准备 ${view.ready?.length||0} / ${view.players.filter(p=>p.human&&!p.left).length} 位真人。`}`;
  $('players').innerHTML=view.players.filter(p=>p.id!==view.me).map(p=>`<article class="gxf-player ${p.id===view.active?'active':''}" data-player="${esc(p.id)}"><header><b>${esc(p.name)}</b><span>${p.human?(p.left?'真人已离席':'真人玩家'):'AI 玩家'}</span></header><h3>${esc(p.school)}</h3><div class="score">${p.prestige} <small>声望 / 目标 ${p.target}</small></div><div class="gxf-resources"><span>${p.money}💰</span><span>${p.science}🔬</span><span>${p.students}🎓</span><span>${p.policy}🏛</span></div><p>${p.ap} AP · ${p.campus.length} 院系 · 相对成就 ${p.prestige-p.target}</p><details><summary>查看校园</summary><p>${p.campus.map(f=>`${esc(f.card.name)}（强度 ${f.strength}）`).join('<br>')}</p></details></article>`).join('');
  $('events').innerHTML=view.events.map(c=>item(c,`<p>${esc(c.body)}</p>`)).join('');
  $('projects').innerHTML=view.projects.map(c=>`<article class="gxf-item project"><span class="gxf-tag">${esc(c.id)} / ${esc(c.lane)}</span><h3>${esc(c.name)}</h3><div class="project-pool">${c.pool}<small>声望池</small></div><p>主导 ${esc(c.main.join(' / '))}<br>协同 ${esc(c.support.join(' / '))}</p><div class="project-rates">${esc(c.contribution.split('｜')[0])}</div>${c.bids.filter(b=>b.points).map(b=>`<div class="bid-line ${b.id===view.me?'mine':''}"><span>${b.id===view.me?'你':esc(b.name)}</span><b>${b.points} 点</b></div>`).join('')||'<div class="bid-empty">暂无出资 · 等待申报</div>'}${cardButtons(c,'bid')}</article>`).join('');
  $('my-school-title').textContent=`${me.school} · 我的校园`;
  document.querySelector('.my-desk').classList.toggle('is-your-turn',view.active===view.me);
  document.querySelector('.human-badge').textContent=`${me.name} · 你 · 真人`;
  $('my-resources').innerHTML=[['money','经费'],['science','学术'],['students','生源'],['policy','政策'],['prestige','声望']].map(([key,label])=>`<div class="my-resource ${key}"><b>${me[key]}</b><span>${label}${key==='prestige'?` / ${me.target}`:''}</span></div>`).join('');
  $('campus').innerHTML=me.campus.map(f=>`<article class="gxf-item faculty" data-campus-id="${esc(f.id)}"><span class="gxf-tag">${esc(f.card.discipline)} / ${esc(f.card.levelLabel)}级 · ${f.core?'核心院系':'非核心'}${f.certified?' · 认证':''}</span><h3>${esc(f.card.name)}</h3><p>强度 ${f.strength} · 基础产出 ${resourceText(f.card)}<br>人才 ${esc(f.talentNames.join('、'))||'暂无'}</p>${cardButtons(f.card,f.card.level<3?'upgrade':null)}</article>`).join('');
  $('faculty-market').innerHTML=view.market.faculty.map(c=>`<article class="gxf-item faculty"><span class="gxf-tag">${esc(c.discipline)} / ${c.levelLabel}</span><h3>${esc(c.name)}</h3><p>${c.cost}💰 · 强度 ${c.strength}<br>${resourceText(c)}</p>${cardButtons(c,'build')}</article>`).join('');
  $('talent-market').innerHTML=view.market.talent.map(c=>`<article class="gxf-item talent"><span class="gxf-tag">${esc(c.discipline)}</span><h3>${esc(c.name)}</h3><p>${c.cost} 资源 · 强度 +${c.strength}</p>${cardButtons(c,'talent')}</article>`).join('');
  $('transfers-panel').hidden=!view.transfers.length;
  $('transfers').innerHTML=view.transfers.map(t=>`<p>${esc(view.players.find(p=>p.id===t.seller)?.name)} → ${esc(view.players.find(p=>p.id===t.buyer)?.name)}：${t.progress}/${t.target} 刻度 · ${t.price}💰 暂存中</p>`).join('');
  $('game-log').innerHTML=view.logs.map(t=>`<li>${esc(t)}</li>`).join('');
  $('last-move').textContent=view.logs[0]||'大家已经入席，等待开局。';
  $('ap-dots').innerHTML=Array.from({length:4},(_,i)=>`<i class="${i<me.ap?'available':''}"></i>`).join('')+`<span>${me.ap} / 4 AP</span>`;
  $('results').hidden=!view.ended;
  if(view.ended)$('result-table').innerHTML=`<table><thead><tr><th>名次</th><th>校长 / 高校</th><th>声望</th><th>相对成就</th></tr></thead><tbody>${view.results.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}<br>${esc(data.decks.school.find(s=>s.id===r.schoolId)?.name)}</td><td>${r.prestige} / ${r.target}</td><td>${r.achievement}</td></tr>`).join('')}</tbody></table>`;
  $('action-panel').hidden=view.ended;renderActions();
}
function renderActions() {
  $('ready-button').disabled=busy||view.ready?.includes(view.me);
  const previous=$('action-type').value;
  const types=[...new Set(view.actions.filter(a=>a.type!=='pass').map(a=>a.type))];
  $('action-type').innerHTML=types.map(t=>`<option value="${esc(t)}">${esc(actionNames[t]||t)}</option>`).join('')||'<option value="">等待其他玩家</option>';
  if(types.includes(previous))$('action-type').value=previous;
  $('action-hint').textContent=view.phase==='filing'?'免费机会仅限当前窗口；投入后仍有 4 AP。':'每次执行 1 个行动，然后轮到下一位校长。';
  const pass=view.actions.find(a=>a.type==='pass');$('pass').textContent=pass?.label||'结束本时代的行动';$('pass').disabled=!pass||busy||!view.started||Date.now()+serverOffset<view.readyAt||view.players.find(p=>p.id===view.me)?.left;
  renderChoices();
}
function renderChoices() {
  const previous=$('action-choice').value;
  const actions=view?.actions.filter(a=>a.type===$('action-type').value)||[];
  $('action-choice').innerHTML=actions.map(a=>`<option value="${esc(a.id)}">${esc(a.label)}</option>`).join('')||'<option value="">当前没有可执行行动</option>';
  if(actions.some(a=>a.id===previous))$('action-choice').value=previous;
  $('action-description').textContent=actions.find(a=>a.id===$('action-choice').value)?.label||'等待轮到你后，会显示可执行的行动。';
  const auto=!view?.started||Date.now()+serverOffset<view?.readyAt||view?.players.find(p=>p.id===view.me)?.left;
  $('execute').disabled=!actions.length||busy||auto;$('action-type').disabled=!actions.length||busy||auto;$('action-choice').disabled=!actions.length||busy||auto;
}
async function act(actionId) {
  if(busy||!actionId)return;busy=true;renderActions();error();
  try {
    receive(await api(`/room/${session.roomId}/action`,{size:session.size,actionId,version:view.version,requestId:crypto.randomUUID()}));
  }catch(e){error(e.message);try{await getRoom();}catch{}}finally{busy=false;renderActions();schedule(500);}
}
async function leave() {
  if(busy)return;busy=true;$('confirm-leave').disabled=true;
  try {
    await api(`/room/${session.roomId}/leave`,{size:session.size,practice:!!session.practice});
    $('leave-dialog').close();delete session.roomId;session.waiting=false;save();view=null;queue=null;mode('lobby');error();clearTimeout(timer);
  }catch(e){error(e.message);}finally{busy=false;$('confirm-leave').disabled=false;}
}
function renderArchive() {
  const type=$('archive-type').value,q=$('archive-search').value.trim().toLowerCase();
  const found=cards.filter(c=>(type==='all'||c.type===type)&&(!q||JSON.stringify(c).toLowerCase().includes(q)));
  $('archive-count').textContent=`共 ${found.length} 张 · 已显示 ${Math.min(archiveLimit,found.length)} 张`;
  $('archive-grid').innerHTML=found.slice(0,archiveLimit).map(c=>`<button data-detail="${c.type}:${esc(c.id)}"><small>${esc(typeNames[c.type])} / ${esc(c.id)}</small><b>${esc(c.name)}</b><small>${esc(c.tier||c.discipline||c.era||c.category||'')} ${esc(c.levelLabel||c.lane||'')}</small></button>`).join('');
  $('more-cards').hidden=found.length<=archiveLimit;
}
function detail(type,id) {
  const c=cards.find(c=>c.type===type&&c.id===id);if(!c)return;
  $('card-detail').innerHTML=`<p class="gxf-eyebrow">${esc(typeNames[type])} · ${esc(id)}</p><h2>${esc(c.name)}</h2><p>${esc(c.body)}</p>${type==='school'?`<p>核心：${esc(c.core.join('、'))}<br>开局：${esc(c.start)}<br>胜利线：${c.target}</p>`:''}${type==='project'?`<p>牵头：${esc(c.leader)}<br>参与：${esc(c.participant)}</p>`:''}<p class="gxf-muted">以上为实体规则原文。线上快速对战的实际效果以开局须知和行动面板为准。</p>`;
  $('card-dialog').showModal();
}
function previewSchool() {const c=data?.decks.school.find(s=>s.id===$('school').value);$('school-preview').textContent=c?`${c.tier} · 核心：${c.core.join(' / ')} · 开局 ${c.start} · 胜利线 ${c.target}⭐`:'';}
$('match-form').addEventListener('submit',e=>{e.preventDefault();start(selectedMode==='ai');});$('practice').addEventListener('click',()=>start(true));
$('cancel-match').addEventListener('click',cancelMatch);$('action-type').addEventListener('change',renderChoices);$('action-choice').addEventListener('change',()=>{$('action-description').textContent=view.actions.find(a=>a.id===$('action-choice').value)?.label||'';});
$('execute').addEventListener('click',()=>act($('action-choice').value));$('pass').addEventListener('click',()=>act(view?.actions.find(a=>a.type==='pass')?.id));
$('resume').addEventListener('click',async()=>{if(busy)return;busy=true;try{receive(await api(`/room/${session.roomId}/resume`,{size:session.size}));error();}catch(e){error(e.message);}finally{busy=false;renderActions();schedule();}});
$('leave-room').addEventListener('click',()=>$('leave-dialog').showModal());$('keep-playing').addEventListener('click',()=>$('leave-dialog').close());$('confirm-leave').addEventListener('click',leave);$('play-again').addEventListener('click',leave);
$('school').addEventListener('change',previewSchool);
$('mode-human').addEventListener('click',()=>selectMode('human'));$('mode-ai').addEventListener('click',()=>selectMode('ai'));
$('faculty-tab').addEventListener('click',()=>marketTab('faculty'));$('talent-tab').addEventListener('click',()=>marketTab('talent'));
function marketTab(type){for(const t of ['faculty','talent']){$(t+'-market').hidden=t!==type;$(t+'-tab').setAttribute('aria-pressed',String(t===type));}}
$('ready-button').addEventListener('click',async()=>{if(busy)return;busy=true;$('ready-button').disabled=true;try{receive(await api(`/room/${session.roomId}/ready`,{size:session.size}));error();}catch(e){error(e.message);}finally{busy=false;if(view){$('ready-button').disabled=view.ready?.includes(view.me);renderActions();}schedule(300);}});
$('motion-toggle').addEventListener('click',()=>{session.motion=session.motion===false;save();setMotion();});
function setMotion(){document.querySelector('.gxf-online').classList.toggle('no-motion',session.motion===false);$('motion-toggle').textContent=`动画：${session.motion===false?'关':'开'}`;$('motion-toggle').setAttribute('aria-pressed',String(session.motion===false));if(session.motion===false)$('era-transition').hidden=true;}

for(const id of ['archive-type','archive-search'])$(id).addEventListener('input',()=>{archiveLimit=24;renderArchive();});
$('more-cards').addEventListener('click',()=>{archiveLimit+=24;renderArchive();});$('close-card').addEventListener('click',()=>$('card-dialog').close());
document.querySelector('.gxf-online').addEventListener('click',e=>{const button=e.target.closest('[data-detail]');if(button)detail(...button.dataset.detail.split(':'));
  const play=e.target.closest('[data-select-type]');
  const jump=e.target.closest('[data-jump]');if(jump)$(jump.dataset.jump).scrollIntoView({block:'start',behavior:session.motion===false?'instant':'smooth'});
  if(play&&view){const a=view.actions.find(a=>a.type===play.dataset.selectType&&a.label.includes(play.dataset.selectName));
    if(!view.started){error('请先点击「准备好了」，再开始对局。');$('ready-panel').scrollIntoView({block:'center',behavior:'smooth'});return;}
    if(!a){error(view.active!==view.me?'还没轮到你，先观察一下场上局势。':'当前资源不足或不满足资格；请查看校务决策中的合法行动。');return;}
    error();$('action-type').value=a.type;renderChoices();$('action-choice').value=a.id;$('action-description').textContent=a.label;$('action-panel').scrollIntoView({block:'center',behavior:session.motion===false?'instant':'smooth'});$('execute').focus({preventScroll:true});
  }});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&(session.waiting||session.roomId))schedule(0);});
window.addEventListener('pagehide',()=>{stopped=true;clearTimeout(timer);});
window.addEventListener('pageshow',()=>{stopped=false;if(session.waiting||session.roomId)schedule(0);});
setInterval(countdown,1000);
async function init() {
  try {
    const r=await fetch('/assets/games/gaoxiao-fengyun/cards.json');if(!r.ok)throw new Error('牌库暂时无法加载，请刷新页面。');data=await r.json();cards=Object.values(data.decks).flat();
    $('school').innerHTML=data.decks.school.map(c=>`<option value="${c.id}">${esc(c.name)} · ${esc(c.tier)}</option>`).join('');
    $('nickname').value=session.name||'';$('school').value=session.schoolId||'S21';$('table-size').value=String(session.size||4);previewSchool();renderArchive();selectMode(session.practice?'ai':'human');setMotion();
    try {await api('/health');$('service-status').textContent='游戏服务已连接 · 策略 AI 随时就位';}catch{$('service-status').textContent='游戏服务暂时无法连接，可以先查阅卡牌，或点击匹配重试。';}
    $('match').disabled=false;$('practice').disabled=false;
    if(session.roomId||session.waiting){mode(session.roomId?'room':'queue');schedule(0);}
  }catch(e){error(e.message);}
}
init();
