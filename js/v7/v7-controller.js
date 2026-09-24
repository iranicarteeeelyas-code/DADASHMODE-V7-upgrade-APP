/* DADASHMODE V7 · shared controller renderer. Same code draws the desktop V7 panel and every phone role.
   render(root, snap, send, opts): structural HTML is rebuilt only when it changes; live numbers (timers, banks)
   are patched in place through [data-v] so inputs keep focus and the UI never flickers. */
'use strict';
(function(root){
const faN=n=>String(n??'').replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const s1=v=>faN((Math.round((+v||0)*10)/10).toFixed(1));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CARDS={HINT:{fa:'ذره‌بین',c:'blue',d:'یک بار کمک'},SHIELD:{fa:'سپر',c:'blue',d:'قرمز را خنثی کن'},GLOVES:{fa:'دستکش بوکس',c:'red',d:'حافظه با دستکش'},SPICY:{fa:'معمای تند',c:'red',d:'معمای سخت‌تر'},MIRROR:{fa:'آینه',c:'gold',d:'قرمز برگردد'}};
const GEM_FA={r3Rule:'قانون ساندویچ',r3Empty:'دهان خالی',r3NotYet:'هنوز نه',r3After:'بعد از دوئل',r3Dnf:'تمام نکرد',r3Dq:'حذف',bankOpen:'بانک باز شد',colors:'رنگ کارت‌ها',r4Rule:'قانون چسب',r4Back:'برگرد',glueWin:'برد چالش',glueUnsure:'نامشخص',shop:'فروشگاه',shield:'سپر',mirror:'آینه',idle:'منتظر',memWrong:'حافظه غلط',riddleOk:'معما درست',riddleNo:'معما غلط',caseBadge:'نشان',caseEnv:'پاکت',punish:'مجازات',justice:'عدالت',noNumber:'عدد نمی‌گم',review:'بازبینی'};
const b=(label,a,p={},cls='',dis=false,title='')=>`<button class="v7b ${cls}" data-a="${a}" data-p='${esc(JSON.stringify(p))}' ${dis?'disabled':''} ${title?`title="${esc(title)}"`:''}>${label}</button>`;
const v=(key,val)=>`<b data-v="${key}">${val}</b>`;
const sec=(title,body,cls='')=>`<section class="v7sec ${cls}"><h4>${title}</h4>${body}</section>`;
const row=(...x)=>`<div class="v7row">${x.join('')}</div>`;
const pl=(snap,k)=>`<span class="v7pl" style="--pc:${snap.colors[k]}">${esc(snap.names[k])}</span>`;
function head(snap,opts){const lat=opts.latency!=null?`<i class="v7lat ${opts.latency<150?'ok':'bad'}">${faN(Math.round(opts.latency))}ms</i>`:'';const role={DIRECTOR:'کارگردان',LOCAL:'کارگردان',PLAYER_E:'بازیکن',PLAYER_M:'بازیکن',JUDGE:'داور',MONITOR:'مانیتور'}[snap.role]||snap.role;
 return `<header class="v7head"><div class="v7st"><small>${role}${opts.offline?' · <em>قطع</em>':''}</small><strong>${esc(snap.stateFa)}</strong></div>${lat}
 <div class="v7banks">${['E','M'].map(k=>`<div class="v7bank ${snap.leader===k?'lead':''}" style="--pc:${snap.colors[k]}"><span>${esc(snap.names[k])}</span>${v('bank'+k,s1(snap.banks[k]))}</div>`).join('')}</div></header>`}
/* ---------- per-state director blocks ---------- */
const D={};
D.READY=s=>sec('شروع',row(b('▶ شروع قسمت (بانک ۴۵ | ۴۵)','ep.start',{},'big gold')));
D.R1=s=>sec('راند ۱ · برج لیوان',row(...['E','M'].map(k=>b(`${esc(s.names[k])} برد +۱۰`,'r1.win',{p:k},'big pc',false))).replace(/class="v7b big pc"/g,'class="v7b big"')+row(...['E','M'].map(k=>b(`هیچ‌کس · ${esc(s.names[k])} بلندتر +۵`,'r1.levels',{p:k}))));
D.R2=s=>sec('راند ۲ · فاصله (دورتر = بیشتر)',['E','M'].map(k=>{const d=s.r2[k];const L={L1:'۲ متر +۵',L2:'۳ متر +۱۰',L3:'۴ متر +۲۰'};const locked=d.throws.length>0;
 return `<div class="v7pcard" style="--pc:${s.colors[k]}">${pl(s,k)}${row(...Object.keys(L).map(l=>b(L[l],'r2.lock',{p:k,line:l},d.line===l?'on':'',locked)))}${row(b('✔ گل','r2.throw',{p:k,hit:true},'ok',!d.line||d.scored||d.throws.length>=3),b('✘ نخورد','r2.throw',{p:k,hit:false},'bad',!d.line||d.scored||d.throws.length>=3))}<div class="v7dots">${[0,1,2].map(i=>`<i class="${d.throws[i]===undefined?'':d.throws[i]?'hit':'miss'}"></i>`).join('')}</div></div>`}).join(''));
function r3card(s,k,judge){const x=s.r3[k];const lab={idle:'آماده',eating:'در حال خوردن',provisional:'دهان پر · ساعت ایستاد',final:'✔ دهان خالی',dnf:'تمام نکرد (۶۰)',dq:'حذف'}[x.status]||x.status;
 return `<div class="v7pcard st-${x.status}" style="--pc:${s.colors[k]}">${pl(s,k)}<div class="v7big">${v('r3'+k,s1(x.clock))}</div><small>${lab}${x.swallowLeft!=null?' · قورت '+v('sw'+k,faN(Math.ceil(x.swallowLeft))):''}${x.penalty?' · جریمه +'+faN(x.penalty):''}</small>
 ${row(b('✋ دهان پر','r3.mouth',{p:k},'big warn',x.status!=='eating'),b('😮 دهان خالی','r3.empty',{p:k},'big ok',x.status!=='provisional'))}${judge?'':row(b('+۳ جریمه','r3.penalty',{p:k}),b('حذف','r3.dq',{p:k},'bad'),b('ویرایش زمان','r3.edit',{p:k},'',false,'نیاز به دلیل'))}</div>`}
D.R3_SANDWICH=s=>sec('راند ۳ · دوئل ساندویچ',row(b('▶ شروع (۶۰)','r3.start',{},'gold',s.r3.started&&!s.r3.applied),b('🛑 «قرمز» توقف ایمنی','r3.safety',{},'bad big'))+`<div class="v7two">${r3card(s,'E')}${r3card(s,'M')}</div>`+
 (s.r3.needPick?row(...['E','M'].map(k=>b(`هیچ‌کس تمام نکرد → ${esc(s.names[k])} کمتر گذاشت +۵`,'r3.pick',{who:k},'gold'))):'')+row(b('اعمال نتیجه','r3.apply',{},'ok',!!s.r3.applied))+(s.r3.applied?`<p class="v7note">✔ ${esc(s.r3.applied.reason||'')}</p>`:''));
D.TWIST_BANKOPEN=s=>sec('پیچش · بانک باز شد',row(b('▶ پخش پیچش (۶ ثانیه)','twist.play',{},'big gold')));
function r4card(s,k,role){const r=s.r4;const f=r.finish[k],ok=r.valid[k];const lock=r.lock[k];const canCh=r.first&&r.first!==k&&ok&&!r.challenge;
 const me=role==='PLAYER_'+k;const dir=role==='DIRECTOR'||role==='LOCAL';const judge=role==='JUDGE';
 return `<div class="v7pcard" style="--pc:${s.colors[k]}">${pl(s,k)}<div class="v7big">${ok?'✔ معتبر':f!=null?'تمام؟':lock>0?'قفل '+v('lk'+k,faN(Math.ceil(lock))):'در حال ساخت'}</div>
 ${(dir||me)?row(b('✅ تمام','r4.finish',{p:k},'huge ok',f!=null||lock>0||!r.started)):''}${(dir||judge)?row(b('✔ معتبر','r4.valid',{p:k},'ok',f==null||ok),b('✘ غلط (لغو + قفل ۵)','r4.wrong',{p:k},'bad',f==null||ok)):''}${(dir||me)&&canCh?row(b('⚖️ چالش چسب','r4.challenge',{p:k},'gold big')):''}</div>`}
D.R4_GLUE=(s,role)=>{const r=s.r4;const mm=Math.floor(r.remain/60),ss=Math.floor(r.remain%60);const ch=r.challenge;
 return sec('راند ۴ · دستکش، پازل و چسب',row(b('▶ شروع (۱۸۰)','r4.start',{},'gold',r.started&&!r.applied),`<div class="v7clock">${v('r4c',faN(mm)+':'+faN(String(ss).padStart(2,'0')))}</div>`)+`<div class="v7two">${r4card(s,'E',role)}${r4card(s,'M',role)}</div>`+
 (ch&&!ch.outcome?sec('نتیجهٔ چالش ('+esc(s.names[ch.by])+')',row(...['E','M'].map(k=>b(esc(s.names[k])+' برد','r4.challengeResult',{outcome:k},'big')),b('نامشخص','r4.challengeResult',{outcome:'unclear'}))):'')+
 (role==='JUDGE'?'':row(b('اعمال نتیجه','r4.apply',{},'ok',!!r.applied),...(!r.first?['E','M'].map(k=>b(`هیچ‌کس → ${esc(s.names[k])} +۵`,'r4.fallback',{who:k})):[])))+(r.applied?`<p class="v7note">✔ ${esc(r.applied.reason||'')}</p>`:''))};
D.REVEAL=s=>sec('رونمایی بانک · سقف فاصله ۳۰',row(b('▶ رونمایی','reveal.run',{},'big gold',!!s.reveal))+(s.reveal?`<p class="v7note">فاصله ${faN(s.reveal.cap.gap)} ${s.reveal.cap.apply?'→ سقف اعمال شد':'→ بدون تغییر'}</p>`:''));
function shopGrid(s,k,canPick){const picks=s.shop.picks[k];const sub=s.shop.submitted[k];
 return `<div class="v7cards">${Object.keys(CARDS).map(c=>{const C=CARDS[c];const mine=picks&&picks.includes(c);const why=s.shop.why[k][c];const pr=s.shop.price[k][c];
  return `<button class="v7card c-${C.c} ${mine?'on':''}" data-a="${mine?'shop.unpick':'shop.pick'}" data-p='${esc(JSON.stringify({p:k,card:c}))}' ${(!canPick||sub||(!mine&&why))?'disabled':''}><b>${C.fa}</b><span>${faN(pr)}s</span><small>${mine?'✔ انتخاب شد':esc(why||C.d)}</small></button>`}).join('')}</div>`}
D.SHOP=(s,role)=>{const o=s.shop.order;
 if(s.shop.revealed)return sec('رونمایی شد',`<ul class="v7ev">${s.shop.events.map(e=>`<li>${esc((CARDS[e.card]||{fa:e.card}).fa)} · ${esc(e.buyer?s.names[e.buyer]:'')}${e.target&&e.target!==e.buyer?' → '+esc(s.names[e.target]):''} · ${({ACTIVE:'فعال',BLOCKED:'خنثی با سپر',BOUNCED:'برگشت با آینه',BURNED:'سوخت'})[e.label]||esc(e.label)}</li>`).join('')}</ul>`+row(b('ادامه → شوت ریسک','state.go',{s:'RISK'},'gold')));
 return sec('فروشگاه کارت · اول '+esc(s.names[o[0]]),['E','M'].map(k=>`<div class="v7pcard" style="--pc:${s.colors[k]}">${pl(s,k)} <small>${s.shop.submitted[k]?'● ثبت شد':'انتخاب: '+faN(s.shop.counts[k])+' کارت (مخفی)'}</small>
  ${role==='DIRECTOR'||role==='LOCAL'?`<details><summary>انتخاب به‌جای بازیکن (بدون گوشی)</summary>${shopGrid(Object.assign({},s,{shop:Object.assign({},s.shop,{picks:{E:[],M:[]}})}),k,true)}</details>`:''}
  ${row(b('ثبت نهایی','shop.submit',{p:k},'ok',s.shop.submitted[k]))}</div>`).join('')+row(b('▶ رونمایی هم‌زمان','shop.reveal',{},'big gold',!(s.shop.submitted.E&&s.shop.submitted.M)),b('رونمایی اجباری','shop.reveal',{force:true},'bad')))};
D.SHOP_REVEAL=D.SHOP;
D.RISK=(s,role)=>sec('شوت ریسک · اول '+esc(s.names[s.risk.order[0]]),['E','M'].map(k=>`<div class="v7pcard" style="--pc:${s.colors[k]}">${pl(s,k)}
 ${row(...[0,10,20,30].map(x=>b(x===30?'همه‌چی ۳۰':'شرط '+faN(x),'risk.stake',{p:k,stake:x},s.risk.stake[k]===x?'on':'',s.risk.stake[k]!=null||!s.risk.options[k].includes(x))))}
 ${role==='DIRECTOR'||role==='LOCAL'?row(b('✔ داخل مربع','risk.hit',{p:k,hit:true},'ok',s.risk.stake[k]==null||s.risk.result[k]!=null),b('✘ بیرون','risk.hit',{p:k,hit:false},'bad',s.risk.stake[k]==null||s.risk.result[k]!=null)):''}</div>`).join('')+row(b('ادامه → فینال','state.go',{s:'VAULT_ARMED'},'gold')));
D.VAULT_ARMED=s=>sec('آماده‌سازی فینال',`<p class="v7note">${s.vault.sealed?'🔒 رمز کیف مهر شد · SEAL '+esc(s.vault.seal):'⚠️ اول رمز واقعی کیف را در پنل کامپیوتر وارد کنید (تب رمز کیف)'}</p>`+row(b('آماده‌سازی (قرعهٔ هدف/حافظه/معما)','vault.arm',{},'gold',!s.vault.sealed),b('▶ شروع دونده: '+(s.vault.order&&s.vault.order.length?esc(s.names[s.vault.order[0]]):'—'),'vault.start',{},'big ok',!s.vault.armed))+(s.vault.target?`<p class="v7note">هدف نقاشی (فقط کارگردان): <b>${esc(s.vault.target)}</b></p>`:''));
function vaultRun(s,role){const k=s.vault.runner;const r=k&&s.vault.runs[k];if(!r)return sec('فینال',row(b('▶ دونده بعدی','vault.start',{},'big ok',!s.vault.armed)));const dir=role==='DIRECTOR'||role==='LOCAL';
 let st='';if(r.station===1)st=sec('ایستگاه ۱ · نقاشی کور',(dir&&s.vault.target?`<p class="v7note">هدف: <b>${esc(s.vault.target)}</b></p>`:'')+row(b('نمایش دوبارهٔ هدف','vault.showTarget'),`<input class="v7in" id="v7guess" placeholder="حدس یک‌کلمه‌ای">`,b('بررسی حدس','vault.guess',{},'',false,'','#v7guess'))+row(b('✔ درست','vault.guess',{ok:true},'ok big'),b('✘ غلط → برگهٔ نو','vault.guess',{ok:false},'bad')));
 if(r.station===2)st=sec('ایستگاه ۲ · اتاق حافظه ('+({idle:'آماده',show:'نمایش',lock:'قفل ۸',input:'ورود',done:'✔'}[r.mem]||r.mem)+')',row(b('▶ نمایش ۵ ثانیه','vault.memShow',{},'gold',r.mem!=='idle'),b('🔎 ذره‌بین','vault.hint',{},'',r.hintUsed),b('دستکش گیر کرد (−۵)','vault.stuckGloves'))+`<div class="v7cups">${(r.input||[]).map((x,i)=>b(x?'▲':'▼','vault.toggle',{i},x?'on':'',r.mem!=='input')).join('')}</div>`+row(b('✔ بررسی','vault.check',{},'big ok',r.mem!=='input')));
 if(r.station===3)st=sec('ایستگاه ۳ · معما'+(r.riddleLock>0?' · قفل '+v('rl',faN(Math.ceil(r.riddleLock))):''),(s.vault.riddle?`<p class="v7riddle">${esc(s.vault.riddle)}</p>`:'')+`<div class="v7pad">${[1,2,3,4,5,6,7,8,9,0].map(d=>b(faN(d),'vault.answer',{d},'big',r.riddleLock>0)).join('')}</div>`+row(b('🔎 ذره‌بین','vault.hint',{},'',r.hintUsed)));
 if(r.station===4)st=sec('رمز کیف'+(r.codeLock>0?' · قفل '+v('cl',faN(Math.ceil(r.codeLock))):''),row(`<input class="v7in" id="v7code" inputmode="numeric" maxlength="3" placeholder="۳ رقم">`,b('باز کن','vault.code',{},'big gold',r.codeLock>0,'','#v7code')));
 return sec(`دونده: ${esc(s.names[k])} · ${v('vl',s1(r.left))} ثانیه`,row(b(r.state==='paused'?'▶ ادامه':'⏸ مکث','vault.pause'),b('کدها: '+faN(r.codes)+'/۳','noop',{},'',true)),'')+st+(s.vault.runs.E&&s.vault.runs.M&&s.vault.runs.E.state==='done'&&s.vault.runs.M.state==='done'?row(b('▶ کیف طلایی','cas.open',{},'big gold')):(r.state==='done'?row(b('▶ دونده بعدی','vault.start',{},'big ok')):''))}
D.RUN1=vaultRun;D.RUN2=vaultRun;
D.CASE=s=>sec('کیف طلایی',row(b('باز کردن (برنده خودکار)','cas.open',{},'gold big',!!s.cas.winner),...['E','M'].map(k=>b('برنده: '+esc(s.names[k]),'cas.open',{winner:k},'',!!s.cas.winner)))+row(...[1,2,3].map(n=>b('لایهٔ '+faN(n),'cas.layer',{n},s.cas.layer===n?'on':'',!s.cas.winner)))+
 (s.cas.layer>=2?sec('پاکت سرنوشت',`<div class="v7fate">${s.fate.map((f,i)=>b(faN(i+1),'cas.fate',{i},'',false,f)).join('')}</div>`+(s.cas.fate?`<p class="v7note">${esc(s.cas.fate)}</p>`:'')):'')+
 (s.cas.layer>=3?sec('لقمهٔ مرموز · بازنده ۲ جعبه',row(...[1,2,3,4,5,6].map(n=>b(faN(n),'cas.bite',{n},s.cas.bites.picks.includes(n)?'on':'',s.cas.bites.revealed||s.cas.bites.picks.length>=2)))+row(b('رونمایی هر ۶','cas.biteReveal',{},'gold',s.cas.bites.revealed))):''));
D.CASE_L1=D.CASE;D.CASE_L2=D.CASE;D.CASE_L3=D.CASE;
D.END=s=>sec('پایان',`<p class="v7note">قسمت بعد: دفاع از تاج.</p>`);
function subsBlock(s){const x=s.subs;return sec('زیرنویس',row(b(x.on?'روشن ●':'خاموش ○','subs.toggle',{},x.on?'on':''),b('سرعت −','subs.set',{k:'cps',v:x.cps-1}),`<span class="v7tag">${v('cps',faN(x.cps))} cps</span>`,b('سرعت +','subs.set',{k:'cps',v:x.cps+1}))+
 row(...[['all','کامل'],['word','کلمه‌به‌کلمه'],['typewriter','تایپی'],['karaoke','کارائوکه']].map(([m,l])=>b(l,'subs.set',{k:'mode',v:m},x.mode===m?'on':''))),'compact')}
function gemBlock(s){return `<details class="v7sec compact"><summary>جملات جِمنای (TTS + زیرنویس)</summary><div class="v7gem">${s.gem.map(k=>b(GEM_FA[k]||k,'gem.say',{key:k},'sm')).join('')}</div></details>`}
function nav(s){return `<nav class="v7nav">${b('◀ قبلی','state.prev')}<select class="v7sel" data-a="state.go">${s.states.map(x=>`<option value="${x}" ${x===s.state?'selected':''}>${x}</option>`).join('')}</select>${b('بعدی ▶','state.next',{},'gold')}</nav>`}
/* ---------- role views ---------- */
function body(snap,opts){const role=snap.role;const st=snap.state;
 if(role==='DIRECTOR'||role==='LOCAL')return nav(snap)+(D[st]?D[st](snap,role):'')+subsBlock(snap)+gemBlock(snap)+(snap.next?`<p class="v7next">خط بعد: ${esc(snap.next)}</p>`:'');
 if(role==='PLAYER_E'||role==='PLAYER_M'){const k=role.slice(-1);let x='';
  if(st==='R4_GLUE')x=r4card(snap,k,role);
  else if(st==='SHOP')x=sec(snap.shop.submitted[k]?'● ثبت شد · منتظر رونمایی':(snap.shop.order[0]===k||snap.shop.submitted[snap.shop.order[0]]?'کارت‌هایت را مخفیانه انتخاب کن':'اول '+esc(snap.names[snap.shop.order[0]])+' انتخاب می‌کند'),shopGrid(snap,k,true)+row(b('ثبت نهایی','shop.submit',{p:k},'huge ok',snap.shop.submitted[k])));
  else if(st==='RISK')x=sec('شرط علنی',row(...snap.risk.options[k].map(o=>b(o===30?'همه‌چی ۳۰':'شرط '+faN(o),'risk.stake',{p:k,stake:o},'huge '+(snap.risk.stake[k]===o?'on':''),snap.risk.stake[k]!=null))));
  else x=`<div class="v7wait">منتظر مرحلهٔ بعد…<br><small>${esc(snap.stateFa)}</small></div>`;
  return x}
 if(role==='JUDGE'){if(st==='R3_SANDWICH')return `<div class="v7two">${r3card(snap,'E',true)}${r3card(snap,'M',true)}</div>`;if(st==='R4_GLUE')return D.R4_GLUE(snap,'JUDGE');if(st==='RUN1'||st==='RUN2')return vaultRun(snap,'JUDGE');return `<div class="v7wait">داور · منتظر</div>`+row(b(snap.subs.on?'زیرنویس روشن':'زیرنویس خاموش','subs.toggle'))}
 return `<div class="v7mon"><div class="v7big">${esc(snap.stateFa)}</div>${snap.next?`<p class="v7next">${esc(snap.next)}</p>`:''}</div>`}
function dyn(snap){const o={bankE:s1(snap.banks.E),bankM:s1(snap.banks.M),cps:faN(snap.subs.cps)};
 ['E','M'].forEach(k=>{const x=snap.r3[k];o['r3'+k]=s1(x.clock);if(x.swallowLeft!=null)o['sw'+k]=faN(Math.ceil(x.swallowLeft));o['lk'+k]=faN(Math.ceil(snap.r4.lock[k]))});
 const r=snap.r4.remain;o.r4c=faN(Math.floor(r/60))+':'+faN(String(Math.floor(r%60)).padStart(2,'0'));const k=snap.vault.runner;const run=k&&snap.vault.runs[k];if(run){o.vl=s1(run.left);o.rl=faN(Math.ceil(run.riddleLock));o.cl=faN(Math.ceil(run.codeLock))}return o}
function render(rootEl,snap,send,opts={}){if(!rootEl||!snap)return;const html=head(snap,opts)+`<div class="v7body">${body(snap,opts)}</div>`;const sig=html.replace(/<b data-v="([^"]+)">[^<]*<\/b>/g,'<b data-v="$1"></b>').replace(/<i class="v7lat[^<]*<\/i>/,'');
 if(rootEl.__sig!==sig){const act=document.activeElement;const keep=act&&act.id&&rootEl.contains(act)?{id:act.id,val:act.value}:null;rootEl.innerHTML=html;rootEl.__sig=sig;if(keep){const el=rootEl.querySelector('#'+keep.id);if(el){el.value=keep.val;el.focus()}}}
 else{const d=dyn(snap);rootEl.querySelectorAll('[data-v]').forEach(el=>{const x=d[el.dataset.v];if(x!=null&&el.textContent!==x)el.textContent=x});const l=rootEl.querySelector('.v7lat');if(l&&opts.latency!=null){l.textContent=faN(Math.round(opts.latency))+'ms';l.className='v7lat '+(opts.latency<150?'ok':'bad')}}
 if(!rootEl.__bound){rootEl.__bound=1;
  rootEl.addEventListener('click',e=>{const bt=e.target.closest('[data-a]');if(!bt||bt.tagName==='SELECT'||bt.disabled)return;let p={};try{p=JSON.parse(bt.dataset.p||'{}')}catch(_){}
   const a=bt.dataset.a;if(a==='noop')return;const inp=bt.getAttribute('data-in');
   if(a==='vault.guess'&&!('ok' in p)){const el=rootEl.querySelector('#v7guess');if(!el||!el.value.trim())return;p.word=el.value.trim();el.value=''}
   if(a==='vault.code'){const el=rootEl.querySelector('#v7code');const c=(el&&el.value||'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d));if(!/^\d{3}$/.test(c))return;p.code=c;el.value=''}
   if(a==='r3.edit'){const T=prompt('زمان جدید (ثانیه):');if(!T)return;const reason=prompt('دلیل EDIT (الزامی):');if(!reason)return;p.T=+T;p.reason=reason}
   if(navigator.vibrate)try{navigator.vibrate(18)}catch(_){}bt.classList.add('pressed');setTimeout(()=>bt.classList.remove('pressed'),160);rootEl.__send(a,p)});
  rootEl.addEventListener('change',e=>{const sl=e.target.closest('select[data-a]');if(sl)rootEl.__send(sl.dataset.a,{s:sl.value})})}
 rootEl.__send=send}
root.V7Ctl={render,faN,CARDS};
})(typeof self!=='undefined'?self:this);
