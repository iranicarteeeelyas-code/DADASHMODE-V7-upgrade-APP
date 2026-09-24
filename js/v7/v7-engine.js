/* DADASHMODE V7 · pure game engine (no DOM). Source of truth for every number = Director Book V7 §1.3.
   Runs in the browser (window.V7E) and in Node (module.exports) so the acceptance tests in tests/ run headless.
   Nothing here touches the bank directly: it only RETURNS awards; the host applies them through award(). */
(function(root,factory){const E=factory();if(typeof module!=='undefined'&&module.exports)module.exports=E;else root.V7E=E})(typeof self!=='undefined'?self:this,function(){
'use strict';
const CFG={
 start:45,
 r1:{win:10,fallback:5},
 r2:{lines:{L1:{m:2,sec:5},L2:{m:3,sec:10},L3:{m:4,sec:20}},throws:3},
 r3:{limit:60,swallow:30,floor:3,cap:20,tieBand:1,tieBonus:5,dqFinished:10,dqNotFinished:5,penalty:3,safetyBoth:5,noneBonus:5},
 r4:{limit:180,reward:15,fallback:5,chWin:10,chFirst:5,chLose:-5,wrongLock:5,finalizeAfter:20},
 gapCap:30,
 shop:{max:2,maxRed:1,tax:5,floor:20,cards:{
  HINT:{cost:10,color:'blue',fa:'ذره‌بین',line:'یک بار کمک'},
  SHIELD:{cost:5,color:'blue',fa:'سپر',line:'قرمز را خنثی کن'},
  GLOVES:{cost:15,color:'red',fa:'دستکش بوکس',line:'حافظه با دستکش'},
  SPICY:{cost:10,color:'red',fa:'معمای تند',line:'معمای سخت‌تر'},
  MIRROR:{cost:20,color:'gold',fa:'آینه',line:'قرمز برگردد'}},
  order:['HINT','SHIELD','GLOVES','SPICY','MIRROR']},
 risk:{stakes:[0,10,20],allin:30,allinGap:15,floor:20},
 vault:{targetShow:5,codeShow:3,memShow:5,memLock:8,memWrong:-3,riddleLock:5,codeLock:5,hintShow:3,gloveStuck:60,gloveStuckPenalty:-5}
};
const PL=['E','M'];
const other=p=>p==='E'?'M':'E';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/* round half away from zero to whole seconds (book: «گرد به ثانیهٔ کامل») */
const roundSec=x=>Math.sign(x)*Math.round(Math.abs(x)+1e-9);

/* ---------------- R1 ---------------- */
function r1Result({winner=null,levels=null}){ // winner 'E'|'M'|null · levels {E:n,M:n} full levels when nobody finished
 if(winner)return{awards:{[winner]:CFG.r1.win,[other(winner)]:0},reason:'اولین برج سالم'};
 if(levels&&levels.E!==levels.M){const w=levels.E>levels.M?'E':'M';return{awards:{[w]:CFG.r1.fallback,[other(w)]:0},reason:'طبقهٔ کامل بیشتر'}}
 return{awards:{E:0,M:0},reason:'برابر: هیچ'}}

/* ---------------- R2 · farther line = MORE seconds ---------------- */
function r2Value(line){const L=CFG.r2.lines[line];if(!L)throw new Error('bad line '+line);return L.sec}
function r2Throw(state,hit){ // state {line,throws:[],scored}
 if(!state.line)return{error:'اول خط را قفل کنید'};
 if(state.scored)return{error:'گل زده شده؛ بقیهٔ پرتاب‌ها حذف شد'};
 if(state.throws.length>=CFG.r2.throws)return{error:'پرتاب‌ها تمام شده'};
 state.throws.push(hit?1:0);if(hit){state.scored=true;return{award:r2Value(state.line)}}return{award:0}}

/* ---------------- R3 · speed sandwich ---------------- */
function r3NewPlayer(){return{T:null,status:'idle',penalty:0,mouthAt:null}} // status idle|eating|provisional|final|dnf|dq
function r3Effective(p){if(p.status==='dq')return null;if(p.status==='final')return Math.min(CFG.r3.limit,p.T+p.penalty);return CFG.r3.limit}
function r3Result(s){ // s={E:player,M:player,safetyStop:bool}
 if(s.safetyStop)return{awards:{E:CFG.r3.safetyBoth,M:CFG.r3.safetyBoth},reason:'توقف ایمنی «قرمز» · هر دو +۵',kind:'safety'};
 const E=s.E,M=s.M;
 if(E.status==='dq'||M.status==='dq'){
  if(E.status==='dq'&&M.status==='dq')return{awards:{E:0,M:0},reason:'هر دو رد صلاحیت',kind:'dq'};
  const q=E.status==='dq'?'E':'M',o=other(q);const fin=s[o].status==='final';
  return{awards:{[o]:fin?CFG.r3.dqFinished:CFG.r3.dqNotFinished,[q]:0},reason:'رد صلاحیت (برگشت غذا)',kind:'dq'}}
 const fE=E.status==='final',fM=M.status==='final';
 if(!fE&&!fM)return{needPick:true,awards:{E:0,M:0},reason:'هیچ‌کس تمام نکرد · کارگردان: کمتر باقی گذاشت',kind:'none'};
 const tE=r3Effective(E),tM=r3Effective(M);const diff=Math.abs(tE-tM);
 if(diff<CFG.r3.tieBand)return{awards:{E:CFG.r3.tieBonus,M:CFG.r3.tieBonus},reason:'تساوی نفس‌گیر (زیر ۱ ثانیه)',diff,kind:'tie'};
 const w=tE<tM?'E':'M';const v=clamp(roundSec(diff),CFG.r3.floor,CFG.r3.cap);
 return{awards:{[w]:v,[other(w)]:0},winner:w,diff,reason:`اختلاف ${diff.toFixed(1)} ثانیه`,kind:'win'}}
function r3NonePick(who){ // 'E'|'M'|'equal'
 if(who==='equal')return{awards:{E:0,M:0},reason:'برابر: هیچ'};return{awards:{[who]:CFG.r3.noneBonus,[other(who)]:0},reason:'کمتر در بشقاب باقی گذاشت'}}

/* ---------------- R4 · glue puzzle ---------------- */
function r4Result(s){ // s={first:'E'|'M'|null, challenge:null|{by,outcome:'win'|'lose'|'unclear'}, fallback:'E'|'M'|'equal'|null}
 const a={E:0,M:0};
 if(!s.first){if(s.fallback&&s.fallback!=='equal')a[s.fallback]=CFG.r4.fallback;return{awards:a,reason:'هیچ «تمام» معتبری نبود'}}
 const f=s.first,c=s.challenge;
 if(!c||c.outcome==='unclear'){a[f]=CFG.r4.reward;return{awards:a,reason:c?'چالش نامشخص · بدون جریمه':'اولین «تمام» معتبر'}}
 if(c.by===f)throw new Error('challenger must be the second player');
 if(c.outcome==='win'){a[c.by]=CFG.r4.chWin;a[f]=CFG.r4.chFirst;return{awards:a,reason:'چالش چسب موفق'}}
 a[f]=CFG.r4.reward;a[c.by]=CFG.r4.chLose;return{awards:a,reason:'چالش چسب ناموفق'}}
function r4CanChallenge(s,pid){return !!s.first&&s.first!==pid&&!!(s.finished&&s.finished[pid])&&!s.challenge}

/* ---------------- REVEAL · gap cap ---------------- */
function gapCap(banks){const d=banks.E-banks.M;if(Math.abs(d)<=CFG.gapCap)return{apply:false,gap:Math.abs(d)};
 const lead=d>0?'E':'M',trail=other(lead);return{apply:true,gap:Math.abs(d),trailer:trail,delta:(banks[lead]-CFG.gapCap)-banks[trail]}}
function leaderOf(banks){return banks.E===banks.M?null:(banks.E>banks.M?'E':'M')}

/* ---------------- SHOP ---------------- */
function cardPrice(card,pid,banks){const c=CFG.shop.cards[card];if(!c)throw new Error('bad card');const lead=leaderOf(banks);
 const tax=(lead===pid&&(c.color==='red'||c.color==='gold'))?CFG.shop.tax:0;return{cost:c.cost,tax,total:c.cost+tax}}
function shopCheck(picks,pid,card,banks){ // picks={E:[],M:[]}
 const mine=picks[pid]||[];const c=CFG.shop.cards[card];if(!c)return{ok:false,why:'کارت نامعتبر'};
 if(mine.includes(card))return{ok:false,why:'از هر کارت یکی'};
 if(mine.length>=CFG.shop.max)return{ok:false,why:'حداکثر ۲ کارت'};
 if(c.color==='red'&&mine.some(k=>CFG.shop.cards[k].color==='red'))return{ok:false,why:'قرمز پر شد'};
 const spent=mine.reduce((s,k)=>s+cardPrice(k,pid,banks).total,0);
 if(banks[pid]-spent-cardPrice(card,pid,banks).total<CFG.shop.floor)return{ok:false,why:'کف ۲۰'};
 return{ok:true,price:cardPrice(card,pid,banks)}}
/* resolve order (book §4.2): mirror → shield → effect. mirror bounces ONCE. unused shield/mirror burn. cards never steal seconds. */
function shopResolve(picks){const has=(p,k)=>(picks[p]||[]).includes(k);
 const shieldUsed={E:false,M:false},mirrorUsed={E:false,M:false};const events=[];const effects={E:{gloves:false,spicy:false,hint:0},M:{gloves:false,spicy:false,hint:0}};
 for(const p of PL){if(has(p,'HINT'))effects[p].hint=1}
 for(const buyer of PL){for(const card of (picks[buyer]||[])){if(CFG.shop.cards[card].color!=='red')continue;
  let target=other(buyer),bounced=false;
  if(has(target,'MIRROR')&&!mirrorUsed[target]){mirrorUsed[target]=true;bounced=true;events.push({card,buyer,from:target,to:buyer,label:'BOUNCED'});target=buyer}
  if(has(target,'SHIELD')&&!shieldUsed[target]){shieldUsed[target]=true;events.push({card,buyer,target,label:'BLOCKED'});continue}
  effects[target][card==='GLOVES'?'gloves':'spicy']=true;events.push({card,buyer,target,label:'ACTIVE',bounced})}}
 for(const p of PL){if(has(p,'SHIELD')&&!shieldUsed[p])events.push({card:'SHIELD',buyer:p,label:'BURNED'});if(has(p,'MIRROR')&&!mirrorUsed[p])events.push({card:'MIRROR',buyer:p,label:'BURNED'})}
 return{events,effects}}
function shopCharges(picks,banks){const out={E:0,M:0};for(const p of PL)for(const k of (picks[p]||[]))out[p]+=cardPrice(k,p,banks).total;return out}

/* ---------------- RISK SHOT ---------------- */
function riskOptions(pid,banks){const o=other(pid);const opts=CFG.risk.stakes.filter(s=>banks[pid]-s>=CFG.risk.floor);
 if(banks[o]-banks[pid]>=CFG.risk.allinGap&&banks[pid]-CFG.risk.allin>=CFG.risk.floor)opts.push(CFG.risk.allin);return opts}
function riskOrder(banks){const l=leaderOf(banks);return l?[other(l),l]:['M','E']} // tie: Emad first (book §4.3)
function riskResult(stake,hit){return hit?stake:-stake}

/* ---------------- VAULT ---------------- */
function randInt(n,rand){return Math.floor((rand||Math.random)()*n)}
function memPattern(rand){for(let k=0;k<500;k++){const p=Array.from({length:8},()=>randInt(2,rand));const ones=p.reduce((a,b)=>a+b,0);if(ones<3||ones>5)continue;let run=1,ok=true;for(let i=1;i<8;i++){run=p[i]===p[i-1]?run+1:1;if(run>3){ok=false;break}}if(ok)return p}return[1,0,1,1,0,0,1,0]}
function memCheck(pattern,input){let n=0;for(let i=0;i<8;i++)if((+pattern[i])===(+input[i]))n++;return n}
function vaultOrder(banks){return riskOrder(banks)} // trailer runs first
function vaultWinner(runs){ // runs {E:{opened,left,codes},M:{...}}
 const a=runs.E,b=runs.M;if(a.opened&&!b.opened)return'E';if(b.opened&&!a.opened)return'M';
 if(a.opened&&b.opened){if(Math.abs(a.left-b.left)<0.05)return'sudden';return a.left>b.left?'E':'M'}
 if(a.codes!==b.codes)return a.codes>b.codes?'E':'M';return'sudden'}
const norm=s=>String(s||'').trim().replace(/[\u064B-\u065F\u0670]/g,'').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/\u200c/g,'').replace(/\s+/g,'');
function guessOk(target,word){return (target.accept||[target.name]).some(a=>norm(a)===norm(word))}

/* ---------------- LOCK CODE ---------------- */
async function sha256Hex(s){if(typeof crypto!=='undefined'&&crypto.subtle){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
 const nc=require('crypto');return nc.createHash('sha256').update(s).digest('hex')}
async function sealCode(code,salt){if(!/^\d{3}$/.test(String(code)))throw new Error('code must be 3 digits');return (await sha256Hex(String(code)+':'+salt)).slice(0,6).toUpperCase()}
function codeDigits(code){const s=String(code);return{C1:+s[0],C2:+s[1],C3:+s[2]}}
function pickRiddle(bank,digit,rand){const pool=bank.filter(r=>r.answer===digit&&!r.used);if(!pool.length)return null;return pool[randInt(pool.length,rand)]}

/* ---------------- subtitles ---------------- */
function subDuration(text,cps){const n=String(text||'').replace(/\s+/g,' ').length;return clamp(n/Math.max(1,cps),1.5,7)}
function srtTime(s){s=Math.max(0,s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),sec=Math.floor(s%60),ms=Math.round((s%1)*1000)%1000;const p=(n,l=2)=>String(n).padStart(l,'0');return `${p(h)}:${p(m)}:${p(sec)},${p(ms,3)}`}
function toSRT(cues){return cues.map((c,i)=>`${i+1}\n${srtTime(c.s)} --> ${srtTime(c.e)}\n${c.text}\n`).join('\n')}
function toVTT(cues){return 'WEBVTT\n\n'+cues.map((c,i)=>`${i+1}\n${srtTime(c.s).replace(',','.')} --> ${srtTime(c.e).replace(',','.')}${c.speaker?'':''}\n${c.speaker?`<v ${c.speaker}>`:''}${c.text}\n`).join('\n')}
function wrapLines(text,max=42,lines=2){const w=String(text).split(/\s+/).filter(Boolean);const out=[];let cur='';for(const x of w){const t=cur?cur+' '+x:x;if(t.length>max&&cur){out.push(cur);cur=x}else cur=t}if(cur)out.push(cur);
 if(out.length===2){let best=null;for(let i=1;i<w.length;i++){const a=w.slice(0,i).join(' '),b=w.slice(i).join(' ');if(a.length>max||b.length>max)continue;const d=Math.abs(a.length-b.length);if(!best||d<best.d)best={d,l:[a,b]}}if(best)return best.l}
 if(out.length>lines){const head=out.slice(0,lines-1);head.push(out.slice(lines-1).join(' '));return head}return out}

return{CFG,other,clamp,roundSec,r1Result,r2Value,r2Throw,r3NewPlayer,r3Effective,r3Result,r3NonePick,r4Result,r4CanChallenge,gapCap,leaderOf,cardPrice,shopCheck,shopResolve,shopCharges,riskOptions,riskOrder,riskResult,memPattern,memCheck,vaultOrder,vaultWinner,guessOk,norm,sha256Hex,sealCode,codeDigits,pickRiddle,subDuration,srtTime,toSRT,toVTT,wrapLines};
});
