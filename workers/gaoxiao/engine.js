// Quick-play rules derived from the v0.5 web prototype. Pure, seeded and server-authoritative.
// The exact scope of this online variant is published alongside the game (docs/gaoxiao-online.md).
export const ERAS = ['1990s','2000s','2010s','2020s','2030s','2040s'];
export const DISCIPLINES = ['文','法','理','农','医','商','传统工科','新工科'];
const REGULAR = new Set(['文','法','农','商']);
const RESOURCES = ['money','science','policy'];
const ICON = {money:'💰',science:'🔬',policy:'🏛'};
const EVENT_POOLS = [[1,3,7,11],[13,14,20,22],[26,27,31,34],[38,40,45,47],[49,53,54,60],[61,63,65,67]];
const card = (d,type,id) => d[type].find(c=>c.id===id);
export const schoolOf = (d,p) => card(d,'school',p.schoolId);
const faculty = (d,f) => card(d,'faculty',f.cardId);
const has = (d,p,discipline) => p.campus.some(f=>faculty(d,f).discipline===discipline);
const named = (d,p,name) => schoolOf(d,p).name===name;
const count = (d,p,discipline) => p.campus.filter(f=>faculty(d,f).discipline===discipline).length;
function check(ok,message) { if (!ok) throw Object.assign(new Error(message),{status:400}); }
function rand(s) { let t=s.rng += 0x6D2B79F5; t=Math.imul(t ^ t>>>15,t|1); t ^= t + Math.imul(t ^ t>>>7,t|61); s.rng >>>= 0; return ((t ^ t>>>14)>>>0)/4294967296; }
function shuffled(s,items) { const a=[...items]; for(let i=a.length-1;i>0;i--) {const j=Math.floor(rand(s)*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }
function log(s,text) { s.logs.unshift(`[${ERAS[s.era]}] ${text}`); s.logs=s.logs.slice(0,100); }
export function capacity(d,p) { return ({'浙江大学':7,'吉林大学':8,'中国科学技术大学':5,'上海财经大学':4})[schoolOf(d,p).name] || 6; }
function makeFaculty(s,d,p,c) { return {id:`f${++s.serial}`,cardId:c.id,core:schoolOf(d,p).core.includes(c.discipline),certified:false,bonus:0,talents:[]}; }
function available(d,s,c) { return c.level<3 && (c.discipline!=='新工科' || s.era>=2); }
function ownedFaculty(s) { return new Set(s.players.flatMap(p=>p.campus.map(f=>f.cardId))); }
function fillMarket(s,d,type,force=false) {
  const target=type==='faculty'?6:3;
  if(force) s.market[type]=[];
  const owned=type==='faculty'?ownedFaculty(s):new Set(s.players.flatMap(p=>p.campus.flatMap(f=>f.talents)));
  const candidates=d[type].filter(c=>!owned.has(c.id) && !s.market[type].includes(c.id) &&
    (type==='faculty'?available(d,s,c):c.id.startsWith('L') || (s.era>=1&&c.id.startsWith('Y')) || (s.era>=2&&c.id.startsWith('A'))));
  s.market[type].push(...shuffled(s,candidates).slice(0,Math.max(0,target-s.market[type].length)).map(c=>c.id));
}
export function createGame(d,roster,size=4,seed=1) {
  check(Number.isInteger(size)&&size>=3&&size<=6,'人数须为 3–6。');
  check(roster.length>0 && roster.length<=size,'真人人数无效。');
  check(new Set(roster.map(p=>p.playerId)).size===roster.length,'真人身份重复。');
  const s={rules:'quick-v1',rng:seed>>>0,serial:0,version:1,era:0,phase:'filing',turn:0,order:[],ended:false,
    players:[],projects:[],events:[],market:{faculty:[],talent:[]},logs:[],transfers:[],results:[]};
  const used=new Set();
  const choices=shuffled(s,d.school);
  for(let i=0;i<size;i++) {
    const r=roster[i];
    let school=r && card(d,'school',r.schoolId);
    if(!school || used.has(school.id)) school=choices.find(c=>!used.has(c.id));
    used.add(school.id);
    const p={id:r?.playerId || `ai-${i}`,name:r?.name || `AI · ${['远见','求索','知行','经纬','启明','笃行'][i]}`,
      schoolId:school.id,human:!!r,auto:!r,left:false,money:school.startMoney,science:2,policy:2,students:4,
      prestige:school.startPrestige,target:school.target,campus:[],ap:4,filed:false,thinktank:false,
      bids:{},merged:false,transferUsed:false,expedited:0,retained:false,style:['balanced','builder','researcher','governance'][i%4]};
    if(school.name==='香港科技大学') p.money+=3;
    s.players.push(p);
    for(const m of school.start.matchAll(/(传统工科|新工科|文|法|理|农|医|商)(Ⅰ|Ⅱ|Ⅲ)/g)) {
      const level=({'Ⅰ':1,'Ⅱ':2,'Ⅲ':3})[m[2]];
      const owned=ownedFaculty(s);
      const c=d.faculty.find(c=>c.discipline===m[1]&&c.level===level&&!owned.has(c.id));
      check(c,'初始院系牌不足。'); p.campus.push(makeFaculty(s,d,p,c));
    }
    if(r && school.id!==r.schoolId) log(s,`${p.name} 所选高校已被同桌选择，已分配 ${school.name}。`);
  }
  beginEra(s,d);
  log(s,`${roster.length} 位真人与 ${size-roster.length} 位 AI 入桌。AI 与真人使用相同规则。`);
  return s;
}
function event(s,id) { return s.events.includes(`E${String(id).padStart(2,'0')}`); }
function talentFactor(d,p,f,t) { const discipline=faculty(d,f).discipline; return named(d,p,'北京大学') || t.discipline.split(/[、/]/).includes(discipline) || (t.discipline==='新工科'&&discipline==='传统工科') ? 1 : 0.5; }
export function strength(s,d,p,f) {
  const c=faculty(d,f);
  let n=c.strength+Number(f.core)+Number(f.certified)+f.bonus;
  for(const id of f.talents) { const t=card(d,'talent',id); n+=Math.floor(t.strength*talentFactor(d,p,f,t)); }
  if(named(d,p,'南京大学')&&c.level===3) n++;
  if(event(s,31)&&['文','法','商'].includes(c.discipline)) n--;
  if(event(s,45)&&c.discipline==='商') n--;
  if(event(s,61)&&c.discipline==='文') n++;
  if(s.transfers.some(t=>t.facultyId===f.id&&!t.done)) n--;
  return Math.max(0,n);
}
function output(s,d,p,f,withEvents=true) {
  const c=faculty(d,f), out={...c.output};
  const main=Object.keys(c.output)[0];
  for(const id of f.talents) {
    const t=card(d,'talent',id);
    if(!id.startsWith('A')) out[main]=(out[main]||0)+Math.floor(talentFactor(d,p,f,t));
  }
  if(withEvents) {
    if((event(s,1)&&c.discipline==='商')||(event(s,13)&&['商','法'].includes(c.discipline))) out[main]++;
    if(event(s,26)&&c.discipline==='传统工科') out[main]+=2;
    if(event(s,38)&&['新工科','传统工科'].includes(c.discipline)) out.money=(out.money||0)+1;
    if(event(s,49)&&['理','新工科'].includes(c.discipline)) out[main]+=2;
    if(event(s,63)&&['农','医'].includes(c.discipline)) out[main]+=2;
  }
  if(s.transfers.some(t=>t.facultyId===f.id&&!t.done)) for(const key of Object.keys(out)) out[key]=Math.floor(out[key]/2);
  return out;
}
function produce(s,d,p,f,withEvents=true) { const out=output(s,d,p,f,withEvents); for(const key of Object.keys(out)) p[key]+=out[key]; }
function budget(s,d) {
  for(const p of s.players) {
    p.money+=(schoolOf(d,p).region.includes('港澳')?5:3)+p.campus.filter(f=>f.certified).length;
    p.campus.forEach(f=>produce(s,d,p,f,false));
    // Quick-play assigns student bonuses automatically to distinct highest-output faculties.
    const targets=[...p.campus].sort((a,b)=>Object.values(output(s,d,p,b,false)).reduce((x,y)=>x+y,0)-Object.values(output(s,d,p,a,false)).reduce((x,y)=>x+y,0));
    for(const f of targets.slice(0,Math.min(3,Math.floor(p.students/3)))) p[Object.keys(faculty(d,f).output)[0]]++;
    if(s.era===1&&named(d,p,'香港科技大学')) {p.money+=6;p.students+=2;}
  }
  for(const t of s.transfers.filter(t=>!t.done)) {
    t.progress++;
    if(t.progress>=t.target) finishTransfer(s,d,t);
    else if(s.era-t.era>=2) {
      t.done=true;
      const buyer=s.players.find(p=>p.id===t.buyer),seller=s.players.find(p=>p.id===t.seller);
      const refund=Math.floor(t.price/2);buyer.money+=refund;seller.money+=t.price-refund;
      log(s,`调档流拍，${buyer.name} 收回 ${refund}💰。`);
    }
  }
}
function finishTransfer(s,d,t) {
  const buyer=s.players.find(p=>p.id===t.buyer),seller=s.players.find(p=>p.id===t.seller);
  const f=seller.campus.find(f=>f.id===t.facultyId);
  if(!f) {t.done=true;buyer.money+=t.price;return;}
  check(buyer.campus.length<capacity(d,buyer),'接收院系时空间不足。');
  seller.campus.splice(seller.campus.indexOf(f),1);f.core=false;buyer.campus.push(f);seller.money+=t.price;t.done=true;
  if(named(d,buyer,'上海交通大学')) buyer.prestige++;
  log(s,`${buyer.name} 从 ${seller.name} 调入 ${faculty(d,f).name}。`);
}
function applyEvents(s,d) {
  for(const id of s.events) {
    const n=Number(id.slice(1));log(s,`时代事件：${card(d,'event',id).name}。`);
    if(n===11 || n===34) {evaluate(s,d,n===11?1:2);continue;}
    const ranks=[...s.players].sort((a,b)=>b.prestige-a.prestige);
    const minPrestige=Math.min(...s.players.map(p=>p.prestige));
    const maxScience=Math.max(...s.players.map(p=>p.science));
    const maxEng=Math.max(...s.players.map(p=>count(d,p,'传统工科')));
    const median=(ranks[Math.floor((ranks.length-1)/2)].prestige+ranks[Math.floor(ranks.length/2)].prestige)/2;
    for(const p of s.players) {
      const before={money:p.money,science:p.science,policy:p.policy,students:p.students,prestige:p.prestige};
      if(n===1) p.money++;
      if(n===3) for(const f of [...p.campus].sort((a,b)=>strength(s,d,p,b)-strength(s,d,p,a)).slice(0,p.prestige===minPrestige?2:1)) f.bonus++;
      if(n===7) { const f=p.campus.find(f=>faculty(d,f).discipline==='商'); if(f) p.money+=output(s,d,p,f).money||0; else p.money=Math.max(0,p.money-1); }
      if(n===13&&schoolOf(d,p).region.includes('港澳')) p.money+=2;
      if(n===14) {p.money+=p.prestige>=median?2:1;if(p.prestige<median)p.policy++;}
      if(n===20&&p.science===maxScience) {if(p.science>=3)p.science-=3;else p.prestige=Math.max(0,p.prestige-2);}
      if(n===22) {p.students+=2;p.money=Math.max(0,p.money-1);}
      if(n===27&&maxEng>0) {if(count(d,p,'传统工科')===maxEng)p.prestige+=2;else if(has(d,p,'传统工科'))p.money++;}
      if(n===40&&/中西部|东北/.test(schoolOf(d,p).region)) p.students+=2;
      if(n===45&&!has(d,p,'新工科')) p.students=Math.max(0,p.students-1);
      if(n===53) {const f=p.campus.find(f=>['文','法'].includes(faculty(d,f).discipline));if(f)f.bonus++;else p.policy++;}
      if(n===54) p.students=Math.max(0,p.students-Math.max(0,2-count(d,p,'文')-count(d,p,'法')));
      if(n===65) {p.prestige+=ranks.indexOf(p)<2?2:1;if(ranks.indexOf(p)>=2)p.money++;}
      if(!p.catchup && schoolOf(d,p).tier==='蓄力档' && card(d,'event',id).tone==='🟢' &&
         (schoolOf(d,p).core.some(c=>card(d,'event',id).range.includes(c)) || card(d,'event',id).range.includes(schoolOf(d,p).region))) {
        for(const key of Object.keys(before)) p[key]+=Math.max(0,p[key]-before[key]);p.catchup=true;
      }
    }
  }
}
function beginEra(s,d) {
  s.events=[];s.phase='filing';
  for(const p of s.players) {p.ap=4;p.filed=false;p.thinktank=false;p.bids={};p.merged=false;p.transferUsed=false;p.expedited=0;p.retained=false;p.catchup=false;}
  budget(s,d);
  s.events=shuffled(s,EVENT_POOLS[s.era]).slice(0,s.era===0?1:2).map(n=>`E${String(n).padStart(2,'0')}`);
  applyEvents(s,d);
  const lanes=['基础科学','工程技术','生命资源','人文治理',...(s.players.length>=5?['交叉战略']:[])];
  s.projects=lanes.map(lane=>({id:shuffled(s,d.project.filter(p=>p.era===ERAS[s.era]&&p.lane===lane))[0].id}));
  if(event(s,49)) s.projects[0]={id:'P41'};
  for(const pr of s.projects) {
    const c=card(d,'project',pr.id);
    pr.pool=c.pool+(event(s,53)&&[...c.main,...c.support].some(x=>['文','法'].includes(x))?2:0);
  }
  fillMarket(s,d,'faculty',true);fillMarket(s,d,'talent',true);
  s.order=[...s.players].sort((a,b)=>b.students-a.students || a.prestige-b.prestige).map(p=>p.id);
  s.turn=0;
  log(s,'预算已发放。先依次免费申报，再轮流使用 4 AP。');
  checkVictory(s,d);
}
export function activePlayer(s) {
  if(s.ended) return null;
  if(s.offer) return s.players.find(p=>p.id===s.offer.seller);
  return s.players.find(p=>p.id===s.order[s.turn]);
}
export function projectMatch(d,p,pr) {
  const ds=p.campus.map(f=>faculty(d,f).discipline);
  return pr.main.some(x=>ds.includes(x))?'main':pr.support.some(x=>ds.includes(x))?'support':'none';
}
export function rates(d,p,pr) {
  if(projectMatch(d,p,pr)==='none') return {money:3};
  const r={};const map={'💰':'money','🔬':'science','🏛':'policy'};
  for(const m of pr.contribution.matchAll(/(\d+)(💰|🔬|🏛)\s*=\s*1点/gu)) r[map[m[2]]]=Number(m[1]);
  return r;
}
function bidPoints(s,d,p,pr) {
  const bid=p.bids[pr.id];if(!bid)return 0;
  let fixed=0;
  if(projectMatch(d,p,pr)!=='none') {
    if(named(d,p,'中国科学技术大学')&&bid.points>=4)fixed+=2;
    if(schoolOf(d,p).mechanicTag.includes('M2')&&/航天|国防/.test(pr.tags)&&projectMatch(d,p,pr)==='main'&&Object.keys(p.bids).find(id=>/航天|国防/.test(card(d,'project',id).tags))===pr.id) fixed++;
  }
  return bid.points+Math.min(2,fixed);
}
function payLabel(cost) { return Object.entries(cost).filter(([,v])=>v>0).map(([k,v])=>`${v}${ICON[k]}`).join(' + ') || '免费'; }
function canPay(p,cost) {return Object.entries(cost).every(([key,n])=>p[key]>=n);}
function slotCount(d,p,f) {return faculty(d,f).slots+(named(d,p,'香港中文大学')&&faculty(d,f).discipline==='文'?1:0);}
function reservedSlots(s,p) {return s.transfers.filter(t=>!t.done&&t.buyer===p.id).length;}
function nextFaculty(s,d,f,level) {const owned=ownedFaculty(s);return d.faculty.find(c=>c.discipline===faculty(d,f).discipline&&c.level===level&&!owned.has(c.id));}

export function legalActions(s,d,playerId) {
  const p=activePlayer(s);
  if(!p||p.id!==playerId||s.ended)return [];
  const actions=[];
  const add=(type,label,detail={})=>actions.push({id:`${type}:${actions.length}`,type,label,...detail});
  if(s.offer) {
    add('accept',`同意调档 · 收取 ${s.offer.price}💰（到账时结清）`);
    add('decline','拒绝调档');return actions;
  }
  if(s.phase==='filing' || p.ap>0) {
    const zeroMatch=s.projects.every(pr=>projectMatch(d,p,card(d,'project',pr.id))==='none');
    for(const pr of s.projects) {
      const c=card(d,'project',pr.id),match=projectMatch(d,p,c);
      if(s.phase==='filing'&&match==='none'&&!zeroMatch)continue;
      if(!p.bids[c.id]&&Object.keys(p.bids).length>=2)continue;
      for(const [res,rate] of Object.entries(rates(d,p,c))) {
        const choices=[...new Set([1,2,4,Math.min(8,Math.floor(p[res]/rate))])].filter(n=>n>0&&n*rate<=p[res]);
        for(const units of choices) add('bid',`${s.phase==='filing'?'免费首报':p.bids[c.id]?'追加':'申报'} ${c.name} · ${units*rate}${ICON[res]} → ${units} 点`,{projectId:c.id,res,units,cost:{[res]:units*rate}});
      }
    }
  }
  if(s.phase==='filing') {add('pass','放弃本次免费申报');return actions;}
  if(!p.thinktank&&p.policy>0&&p.campus.filter(f=>REGULAR.has(faculty(d,f).discipline)).length>=2) {
    for(let n=1;n<=Math.min(2,p.policy);n++)add('thinktank',`智库通道 · ${n}🏛 → ${n}⭐（每时代一次，免 AP）`,{units:n,cost:{policy:n}});
  }
  if(p.ap>0) {
    const room=capacity(d,p)-p.campus.length-reservedSlots(s,p);
    if(room>0) for(const id of s.market.faculty) {
      const c=card(d,'faculty',id),cost={money:c.cost};
      if(canPay(p,cost))add('build',`建设 ${c.name} · ${payLabel(cost)}`,{cardId:id,cost});
    }
    for(const f of p.campus) {
      const c=faculty(d,f);
      if(s.transfers.some(t=>!t.done&&t.facultyId===f.id))continue;
      if(c.level<3) {
        const next=nextFaculty(s,d,f,c.level+1);
        const money=c.level===1?2:3,science=event(s,47)?0:c.level===1?2:4;
        const policy=REGULAR.has(c.discipline)?Math.max(0,science-p.science):0;
        const cost={money,science:science-policy,policy};
        if(next&&canPay(p,cost)) add('upgrade',`升级 ${c.name} → ${['','Ⅰ','Ⅱ','Ⅲ'][c.level+1]}级 · ${payLabel(cost)}`,{facultyId:f.id,cardId:next.id,cost});
      }
      if(c.discipline==='传统工科'&&s.era>=2) for(const id of s.market.faculty) {
        const next=card(d,'faculty',id),cost={money:Math.ceil(next.cost/2)};
        if(next.discipline==='新工科'&&next.level===c.level&&canPay(p,cost))add('transform',`转型 ${c.name} → ${next.name} · ${payLabel(cost)}`,{facultyId:f.id,cardId:id,cost});
      }
    }
    const researchCount=event(s,60)||event(s,61)?3:2;
    // All choices of up to N faculties are available; output is never invented by the AI.
    const combinations=(start,chosen)=>{
      if(chosen.length) add('research',`科研攻关 · ${chosen.map(f=>faculty(d,f).name).join('、')}`,{facultyIds:chosen.map(f=>f.id)});
      if(chosen.length<researchCount)for(let i=start;i<p.campus.length;i++)combinations(i+1,[...chosen,p.campus[i]]);
    };combinations(0,[]);
    const admissionCost=event(s,31)&&p.campus.some(f=>['文','法','商'].includes(faculty(d,f).discipline))?1:event(s,67)&&!p.campus.some(f=>faculty(d,f).level===3)?4:2;
    if(p.money>=admissionCost)add('admissions',`招生宣传 · ${admissionCost}💰 → 1🎓`,{cost:{money:admissionCost}});
    for(const id of s.market.talent) {
      const t=card(d,'talent',id),cost={money:Math.min(p.money,t.cost),science:Math.max(0,t.cost-p.money)};
      if(!canPay(p,cost))continue;
      for(const f of p.campus) if(f.talents.length<slotCount(d,p,f)&&!s.transfers.some(t=>!t.done&&t.facultyId===f.id))
        add('talent',`招募 ${t.name} → ${faculty(d,f).name} · ${payLabel(cost)}`,{cardId:id,facultyId:f.id,cost});
    }
    if(!p.transferUsed&&room>0&&p.policy>=2&&!named(d,p,'南京大学')) {
      for(const other of s.players.filter(x=>x.id!==p.id))for(const f of other.campus) {
        if(f.core||s.transfers.some(t=>!t.done&&t.facultyId===f.id))continue;
        const price=Math.max(2,(faculty(d,f).cost||8)+f.talents.reduce((sum,id)=>sum+card(d,'talent',id).cost,0));
        if(p.money>=price)add('offer',`向 ${other.name} 协商调入 ${faculty(d,f).name} · ${price}💰 + 2🏛`,{seller:other.id,facultyId:f.id,price,cost:{money:price,policy:2}});
      }
    }
    for(const t of s.transfers.filter(t=>!t.done)) {
      if(t.buyer===p.id&&p.expedited<2&&p.money>=2)add('expedite','加急调档 · 2💰 → +1 刻度',{transferId:t.id,cost:{money:2}});
      if(t.seller===p.id&&!p.retained&&t.progress>0) {
        if(p.prestige>=1)add('retain','挽留院系 · 1⭐ → −1 刻度',{transferId:t.id,cost:{prestige:1}});
        if(p.students>=2)add('retain','挽留院系 · 2🎓 → −1 刻度',{transferId:t.id,cost:{students:2}});
      }
    }
  }
  add('pass','结束本时代的行动');
  return actions;
}
export function applyAction(s,d,playerId,actionId) {
  const p=activePlayer(s);
  check(p?.id===playerId,'还没有轮到你。');
  const action=legalActions(s,d,playerId).find(a=>a.id===actionId);
  check(action,'该行动已不可用，请刷新局面。');
  execute(s,d,p,action);
  s.version++;
  checkVictory(s,d);
  return s;
}
function execute(s,d,p,a) {
  if(a.type==='accept'||a.type==='decline') {
    const offer=s.offer;delete s.offer;
    const buyer=s.players.find(x=>x.id===offer.buyer);
    if(a.type==='accept') {
      buyer.money-=offer.price;buyer.policy-=2;buyer.ap--;buyer.transferUsed=true;
      s.transfers.push({id:`t${++s.serial}`,buyer:buyer.id,seller:p.id,facultyId:offer.facultyId,price:offer.price,progress:0,target:named(d,buyer,'上海交通大学')?2:3,era:s.era,done:false});
      log(s,`${p.name} 同意 ${buyer.name} 的调档提议，价款暂存，完成后支付。`);
      advanceTurn(s,d);
    } else {buyer.transferUsed=true;log(s,`${p.name} 拒绝调档；${buyer.name} 保留 AP 与资源，本时代不能再次发起。`);}
    return;
  }
  if(a.type==='offer') {
    s.offer={buyer:p.id,seller:a.seller,facultyId:a.facultyId,price:a.price};
    log(s,`${p.name} 发起调档协商，等待对方回应。`);return;
  }
  for(const [key,value] of Object.entries(a.cost||{}))p[key]-=value;
  const f=p.campus.find(f=>f.id===a.facultyId);
  if(a.type==='bid') {
    const b=p.bids[a.projectId] ||= {points:0,paid:{money:0,science:0,policy:0},at:0};
    b.points+=a.units;b.paid[a.res]+=a.cost[a.res];b.at=++s.serial;
  } else if(a.type==='build') {
    const c=card(d,'faculty',a.cardId),first=c.discipline==='新工科'&&!has(d,p,'新工科');
    p.campus.push(makeFaculty(s,d,p,c));if(first)p.students++;
    s.market.faculty=s.market.faculty.filter(id=>id!==c.id);fillMarket(s,d,'faculty');
  } else if(a.type==='upgrade'||a.type==='transform') {
    const c=card(d,'faculty',a.cardId);
    const first=c.discipline==='新工科'&&!has(d,p,'新工科');
    f.cardId=c.id;
    if(a.type==='transform')f.core=false;
    if(a.type==='upgrade'&&c.level===3)p.prestige+=2;
    if(first)p.students++;
    s.market.faculty=s.market.faculty.filter(id=>id!==c.id);fillMarket(s,d,'faculty');
  } else if(a.type==='research') {
    p.campus.filter(f=>a.facultyIds.includes(f.id)).forEach(f=>produce(s,d,p,f));
  } else if(a.type==='admissions')p.students++;
  else if(a.type==='thinktank') {p.prestige+=a.units;p.thinktank=true;}
  else if(a.type==='talent') {
    f.talents.push(a.cardId);if(a.cardId.startsWith('A'))p.prestige+=Math.floor(2*talentFactor(d,p,f,card(d,'talent',a.cardId)));
    s.market.talent=s.market.talent.filter(id=>id!==a.cardId);fillMarket(s,d,'talent');
  } else if(a.type==='expedite') {
    const t=s.transfers.find(t=>t.id===a.transferId);t.progress++;p.expedited++;if(t.progress>=t.target)finishTransfer(s,d,t);
  } else if(a.type==='retain') {s.transfers.find(t=>t.id===a.transferId).progress--;p.retained=true;}
  log(s,`${p.name}：${a.label}。`);
  if(checkVictory(s,d))return;
  if(a.type==='thinktank')return;
  if(s.phase==='filing')p.filed=true;
  else if(a.type==='pass')p.ap=0;
  else p.ap--;
  advanceTurn(s,d);
}
function advanceTurn(s,d) {
  if(s.ended)return;
  for(let n=1;n<=s.order.length;n++) {
    const idx=(s.turn+n)%s.order.length,p=s.players.find(p=>p.id===s.order[idx]);
    if(s.phase==='filing'?!p.filed:p.ap>0) {s.turn=idx;return;}
  }
  if(s.phase==='filing') {s.phase='action';s.turn=0;log(s,'免费申报窗口关闭。开始轮流行动，每人 4 AP。');return;}
  settleProjects(s,d);
  if(checkVictory(s,d))return;
  if([1,3,5].includes(s.era))evaluate(s,d);
  if(checkVictory(s,d))return;
  if(s.era===5) {finishGame(s,d,false);return;}
  s.era++;beginEra(s,d);
}
export function settleProjects(s,d) {
  for(const pr of [...s.projects].sort((a,b)=>a.id.localeCompare(b.id))) {
    const c=card(d,'project',pr.id);
    const level=(p,disc)=>Math.max(0,...p.campus.filter(f=>disc.includes(faculty(d,f).discipline)).map(f=>faculty(d,f).level));
    const ranked=s.players.filter(p=>p.bids[c.id]).sort((a,b)=>bidPoints(s,d,b,c)-bidPoints(s,d,a,c)||level(b,c.main)-level(a,c.main)||level(b,c.support)-level(a,c.support)||b.students-a.students||a.bids[c.id].at-b.bids[c.id].at);
    if(!ranked.length)continue;
    const pool=ranked.length===1?Math.ceil(pr.pool/2):pr.pool;
    const first=ranked.length===1?pool:Math.ceil(pool*bidPoints(s,d,ranked[0],c)/(bidPoints(s,d,ranked[0],c)+bidPoints(s,d,ranked[1],c)));
    ranked[0].prestige+=first;if(ranked[1])ranked[1].prestige+=pool-first;
    // Published quick-play rule: common project rewards, avoiding partial interpretation of prose effects.
    if(projectMatch(d,ranked[0],c)==='main') {
      const f=ranked[0].campus.filter(f=>c.main.includes(faculty(d,f).discipline)).sort((a,b)=>strength(s,d,ranked[0],b)-strength(s,d,ranked[0],a))[0];f.bonus++;
    } else if(projectMatch(d,ranked[0],c)==='support')ranked[0].science++;
    if(ranked[1])ranked[1].policy++;
    for(const p of ranked.slice(2))for(const res of RESOURCES)p[res]+=Math.floor(p.bids[c.id].paid[res]/2);
    log(s,`${c.name} 结算：${ranked[0].name} +${first}⭐${ranked[1]?`；${ranked[1].name} +${pool-first}⭐`: '（独家参与，声望池减半）'}。`);
    if(checkVictory(s,d))return;
  }
}
export function evaluate(s,d,mini=0) {
  const ranks=new Map(s.players.map(p=>[p.id,{first:0,top:[]}]));
  for(const discipline of DISCIPLINES) {
    const score=p=>p.campus.filter(f=>faculty(d,f).discipline===discipline).reduce((sum,f)=>sum+strength(s,d,p,f),0);
    const entries=s.players.filter(p=>has(d,p,discipline)).map(p=>({p,score:score(p)})).sort((a,b)=>b.score-a.score||b.p.students-a.p.students);
    if(entries.length<2)continue;
    for(const entry of entries) {
      const position=1+entries.filter(e=>e.score>entry.score).length;
      if(position>2)continue;
      if(position===1)ranks.get(entry.p.id).first++;
      ranks.get(entry.p.id).top.push(discipline);
      const major=!REGULAR.has(discipline)||(named(d,entry.p,'中国人民大学')&&['文','法'].includes(discipline));
      entry.p.prestige+=mini?(position===1?mini:0):position===1?(major?5:4):(major?3:2);
    }
    if(mini!==1) {const p=entries[0].p;const f=p.campus.find(f=>faculty(d,f).discipline===discipline&&!f.certified);if(f)f.certified=true;}
  }
  if(!mini) {
    const max=Math.max(...[...ranks.values()].map(r=>r.first));
    for(const p of s.players) {
      const r=ranks.get(p.id),ds=[...new Set(p.campus.map(f=>faculty(d,f).discipline))];
      const comprehensive=max>0&&r.first===max;
      if(comprehensive)p.prestige+=3;
      else if(ds.length>0&&ds.length<=3&&ds.every(x=>r.top.includes(x)))p.prestige+=named(d,p,'南京大学')?5:3;
      if(r.top.includes('文')&&r.top.includes('法'))p.prestige+=named(d,p,'香港中文大学')?5:3;
      if(p.campus.some(f=>faculty(d,f).discipline==='文'&&faculty(d,f).level>=2))p.prestige++;
      if(r.top.some(x=>REGULAR.has(x))&&r.top.some(x=>!REGULAR.has(x))) {
        if(named(d,p,'北京大学'))p.prestige++;
        if(named(d,p,'武汉大学'))p.prestige+=2;
      }
    }
  }
  log(s,mini?'迷你评估完成。':'学科评估完成：竞争门类计分、认证和三项附加奖已发放。');
}
function checkVictory(s,d) { if(s.ended)return true;if(s.players.some(p=>p.prestige>=p.target)){finishGame(s,d,true);return true;}return false; }
function finishGame(s,d,immediate) {
  if(!immediate) {
    const gain=p=>p.prestige-schoolOf(d,p).startPrestige;
    const max=Math.max(...s.players.map(gain));
    for(const p of s.players)if(gain(p)===max&&schoolOf(d,p).tier==='蓄力档')p.prestige+=3;
  }
  const certifications=p=>p.campus.filter(f=>f.certified).length;
  const level3=p=>p.campus.filter(f=>faculty(d,f).level===3).length;
  const ranked=[...s.players].sort((a,b)=>(b.prestige-b.target)-(a.prestige-a.target)||
    (immediate?b.students-a.students:b.prestige-a.prestige)||certifications(b)-certifications(a)||(!immediate?level3(b)-level3(a):0)||b.money-a.money);
  s.ended=true;s.phase='ended';s.winner=ranked[0].id;s.results=ranked.map(p=>({id:p.id,name:p.name,schoolId:p.schoolId,prestige:p.prestige,target:p.target,achievement:p.prestige-p.target}));
  log(s,`${immediate?'登顶胜利':'2050 终局'}：${ranked[0].name} 获胜。相对成就 ${ranked[0].prestige-ranked[0].target}。`);
}

// Heuristic planner: scores legal moves from visible resources, current bids and campus.
// It never reads the RNG, unseen decks, private credentials or future events.
export function chooseAI(s,d,playerId) {
  const p=activePlayer(s),actions=legalActions(s,d,playerId);
  check(p&&actions.length,'没有合法 AI 行动。');
  const remaining=6-s.era;
  const incomeValue=out=>(out.money||0)*(p.money<5?1.5:0.65)+(out.science||0)*(p.science<3?1.3:0.55)+(out.policy||0)*(p.policy<3?1:0.35);
  const resourceValue={money:p.money<4?0.85:0.25,science:p.science<3?0.75:0.25,policy:p.policy<3?0.7:0.25};
  const costValue=a=>Object.entries(a.cost||{}).reduce((sum,[key,n])=>sum+n*(resourceValue[key]||0.6),0);
  const scores=actions.map(a=>{
    let value=-100;
    if(a.type==='pass')value=-1;
    if(a.type==='thinktank')value=a.units*3.4-costValue(a);
    if(a.type==='research')value=a.facultyIds.reduce((sum,id)=>sum+incomeValue(output(s,d,p,p.campus.find(f=>f.id===id))),0)*1.4*(remaining>1?1:0.5);
    if(a.type==='build') {
      const c=card(d,'faculty',a.cardId),core=schoolOf(d,p).core.includes(c.discipline);
      const competitors=s.players.filter(x=>x.id!==p.id&&has(d,x,c.discipline)).length;
      value=incomeValue(c.output)*(remaining-0.5)*0.8+(competitors?2.7:0.6)+(core?0.8:0)-costValue(a);
      if(p.style==='builder')value+=0.7;
    }
    if(a.type==='upgrade'||a.type==='transform') {
      const f=p.campus.find(f=>f.id===a.facultyId),old=faculty(d,f),next=card(d,'faculty',a.cardId);
      const mine=p.campus.filter(f=>faculty(d,f).discipline===old.discipline).reduce((sum,f)=>sum+strength(s,d,p,f),0);
      const others=s.players.filter(x=>x.id!==p.id).map(x=>x.campus.filter(f=>faculty(d,f).discipline===old.discipline).reduce((sum,f)=>sum+strength(s,d,x,f),0));
      const delta=next.strength-old.strength;
      const overtake=others.some(n=>n>=mine&&n<=mine+delta);
      value=(incomeValue(next.output)-incomeValue(old.output))*remaining*0.65+delta*(s.era%2?1.2:0.7)+(overtake?3:0)+(next.level===3?2:0)-costValue(a);
    }
    if(a.type==='admissions')value=(p.students%3===2?remaining*1.1:0.5)+(s.players.some(x=>x.id!==p.id&&x.students===p.students+1)?0.5:0)-costValue(a);
    if(a.type==='talent') {
      const t=card(d,'talent',a.cardId),f=p.campus.find(f=>f.id===a.facultyId),factor=talentFactor(d,p,f,t);
      value=(t.strength*(s.era%2?1.2:0.8)+(t.id.startsWith('A')?2:remaining*0.85))*factor-costValue(a);
    }
    if(a.type==='bid') {
      const c=card(d,'project',a.projectId),pr=s.projects.find(x=>x.id===c.id);
      const old=bidPoints(s,d,p,c),total=old+a.units;
      const others=s.players.filter(x=>x.id!==p.id).map(x=>bidPoints(s,d,x,c)).filter(n=>n>0).sort((a,b)=>b-a);
      const expected=points=>!points?0:!others.length?Math.ceil(pr.pool/2):points>=others[0]?Math.ceil(pr.pool*points/(points+others[0])):(!others[1]||points>=others[1])?pr.pool-Math.ceil(pr.pool*others[0]/(points+others[0])):0;
      value=(expected(total)-expected(old))*2.7+(total>=(others[0]||1)&&projectMatch(d,p,c)==='main'?1.4:0)-costValue(a);
      if(s.phase==='filing')value+=1;
      if(old&&expected(total)===expected(old))value-=1.5;
      if(p.style==='researcher')value+=0.4;
    }
    if(a.type==='offer')value=remaining>2?1.5-costValue(a)*0.5:-2;
    if(a.type==='accept') {
      const f=p.campus.find(f=>f.id===s.offer.facultyId);
      value=s.offer.price-incomeValue(output(s,d,p,f))*remaining*0.9-(f.certified?2:0);
    }
    if(a.type==='decline')value=0;
    if(a.type==='expedite')value=remaining>1?4-costValue(a):1-costValue(a);
    if(a.type==='retain')value=0.4-costValue(a);
    return {a,value};
  });
  scores.sort((a,b)=>b.value-a.value||a.a.id.localeCompare(b.a.id));
  return scores[0].a;
}
export function publicView(s,d,playerId) {
  const players=s.players.map(p=>({...p,school:schoolOf(d,p).name,tier:schoolOf(d,p).tier,
    campus:p.campus.map(f=>({...f,card:faculty(d,f),strength:strength(s,d,p,f),talentNames:f.talents.map(id=>card(d,'talent',id).name)}))}));
  return {rules:s.rules,version:s.version,era:s.era,eraName:ERAS[s.era],phase:s.phase,ended:s.ended,me:playerId,
    active:activePlayer(s)?.id||null,players,results:s.results,winner:s.winner||null,logs:s.logs,
    offer:s.offer||null,transfers:s.transfers.filter(t=>!t.done),
    events:s.events.map(id=>card(d,'event',id)),
    projects:s.projects.map(pr=>({...card(d,'project',pr.id),pool:pr.pool,bids:s.players.map(p=>({id:p.id,name:p.name,points:bidPoints(s,d,p,card(d,'project',pr.id))}))})),
    market:{faculty:s.market.faculty.map(id=>card(d,'faculty',id)),talent:s.market.talent.map(id=>card(d,'talent',id))},
    actions:legalActions(s,d,playerId).map(({id,type,label})=>({id,type,label}))};
}
