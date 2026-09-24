/* DADASHMODE V7 · desktop control panel (dock button "V7" + drawer). Tabs: game · subtitles · phones/QR · case code · chroma · log/tests.
   Everything here is DOM (never recorded). The game tab uses the SAME controller renderer as the phones (role LOCAL). */
'use strict';
(function(){
const DM=window.DM5;if(!DM||!DM.drawer){console.warn('[V7] DM5 missing, panel disabled');return}
const faN=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function dl(name,text,type='text/plain'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type+';charset=utf-8'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
function boot(){if(!window.V7||!V7.S)return setTimeout(boot,300);
 const d=DM.drawer('v7','DADASHMODE V7 · بانک زمان',[['game','🎮 بازی'],['subs','💬 زیرنویس'],['phone','📱 گوشی'],['lock','🔐 رمز کیف'],['chroma','🎬 کروما'],['log','🧾 گزارش/تست']]);
 d.el.classList.add('v7drawer');
 DM.dockButton('v7','V7 کنترل',()=>d.toggle(),'v7dock');
 DM.dockButton('v7ck','استودیو کروما',()=>window.V7Chroma&&V7Chroma.open(),'v7dock ck');
 const send=(a,p)=>{const r=V7.exec(a,p,{role:'LOCAL',src:'desk'});if(r&&r.ok===false)V7.toast(r.msg);tick(true)};
 let box=null;
 function tick(force){if(!d.isOpen())return;if(d.tab==='game'){if(!box||!d.body.contains(box)){d.body.innerHTML='<div class="v7ctl desk"></div>';box=d.body.firstChild;box.__sig=null}V7Ctl.render(box,V7.snapshot('LOCAL'),send,{})}}
 setInterval(()=>tick(),200);V7.on('change',()=>tick(true));
 const T={};
 T.game=()=>{box=null;tick(true)};
 T.subs=()=>{const x=V7.S().subs;const sel=(k,opts)=>`<select data-sk="${k}">${opts.map(([v,l])=>`<option value="${v}" ${String(x[k])===String(v)?'selected':''}>${l}</option>`).join('')}</select>`;
  const rng=(k,a,b,s,l)=>`<label class="v7lab"><span>${l}: <b>${faN(x[k])}</b></span><input type="range" data-sk="${k}" min="${a}" max="${b}" step="${s}" value="${x[k]}"></label>`;
  d.body.innerHTML=`<div class="dm5-card"><h4>زیرنویس روی ویدیو (§۹.۳)</h4><div class="dm5-row"><button class="dm5-btn ${x.on?'ok':''}" data-sa="toggle">${x.on?'روشن ● (C)':'خاموش ○ (C)'}</button>
   ${['main','shorts','rehearsal','off','clean'].map(p=>`<button class="dm5-btn ${x.preset===p?'pri':''}" data-sp="${p}">${{main:'ویدیوی اصلی',shorts:'شورتس',rehearsal:'تمرین',off:'خاموش',clean:'ضبط تمیز'}[p]}</button>`).join('')}</div>
   <p class="dm5-muted">«ضبط تمیز»: زیرنویس روی ویدیو ضبط نمی‌شود ولی فایل SRT/VTT کامل ساخته می‌شود.</p></div>
   <div class="dm5-card">${rng('cps',8,25,1,'سرعت (کاراکتر/ثانیه) [ ]')}${rng('size',24,96,2,'اندازه − =')}${rng('offset',-2,2,.1,'آفست ثانیه Shift+[ ]')}${rng('bgA',0,1,.05,'شفافیت کادر')}
   <div class="dm5-row">حالت ${sel('mode',[['all','کامل'],['word','کلمه‌به‌کلمه'],['typewriter','تایپی'],['karaoke','کارائوکه']])} جای ${sel('pos',[['bottom','پایین'],['top','بالا'],['custom','وسط‌پایین (شورتس)']])} خط ${sel('lines',[[1,'۱'],[2,'۲']])} پس‌زمینه ${sel('bg',[['none','بدون'],['shadow','سایه'],['box','کادر']])}</div></div>
   <div class="dm5-card"><h4>گوینده‌ها</h4><div class="dm5-row">${[['host','جِمنای (بنفش)'],['E',V7.name('E')+' (قرمز)'],['M',V7.name('M')+' (سبز)'],['app','اعلان اپ (طلایی)']].map(([k,l])=>`<label><input type="checkbox" data-spk="${k}" ${x.speakers[k]!==false?'checked':''}> ${esc(l)}</label>`).join(' ')}</div></div>
   <div class="dm5-card"><h4>آزمایش و خروجی</h4><div class="dm5-row"><input class="dm5-in" id="v7subTest" value="الیاس ۴ متر رو انتخاب کرد: گل! +۲۰ ثانیه" style="flex:1"><button class="dm5-btn" data-sa="test">نمایش</button></div>
   <div class="dm5-row"><button class="dm5-btn" data-sa="srtLive">SRT ضبط‌شده (${faN((V7.subLog||[]).length)} خط)</button><button class="dm5-btn" data-sa="vttLive">VTT ضبط‌شده</button><button class="dm5-btn" data-sa="srtPlan">SRT از فیلم‌نامه</button><button class="dm5-btn" data-sa="clearLog">پاک کردن ضبط</button></div></div>`};
 T.phone=async()=>{const S=window.V7Sync;if(!S){d.body.innerHTML='<p>ماژول همگام‌سازی بار نشد.</p>';return}const lan=await S.lan();const host=lan&&lan.ips&&lan.ips[0]?lan.ips[0]+':'+lan.port:location.host;
  const roles=[['DIRECTOR','🎬 کارگردان'],['PLAYER_E','▲ '+V7.name('E')],['PLAYER_M','● '+V7.name('M')],['JUDGE','⚖️ داور'],['MONITOR','🖥 مانیتور']];
  d.body.innerHTML=`<div class="dm5-card"><h4>حالت گوشی · اتاق <b>${esc(S.room||'…')}</b> · پین <b>${esc(S.pin||'…')}</b></h4><div class="dm5-row"><span class="dm5-pill ${S.online?'grn':'red'}">${S.online?'سرور وصل':'سرور قطع'}</span><button class="dm5-btn" data-ph="pin">پین جدید</button><button class="dm5-btn" data-ph="re">اتصال دوباره</button></div>
   ${S.lastErr?`<p class="dm5-muted">⚠️ ${esc(S.lastErr)}</p>`:''}<p class="dm5-muted">گوشی و کامپیوتر روی یک وای‌فای. QR نقش را اسکن کنید. کامپیوتر منبع حقیقت است؛ هر فرمان گوشی با نقش و زمان کامپیوتر در گزارش ثبت می‌شود.</p></div>
   <div class="v7qrgrid">${roles.map(([r,l])=>{const u=S.remoteURL(r,host);let svg='';try{svg=V7QR.toSVG(u,4,3)}catch(e){svg='<p>QR خیلی بلند</p>'}return `<div class="dm5-card v7qr"><h4>${esc(l)}</h4>${svg}<input class="dm5-in" readonly value="${esc(u)}" onclick="this.select()"></div>`}).join('')}</div>
   <div class="dm5-card"><h4>دستگاه‌های وصل</h4><ul class="dm5-list">${(S.roster||[]).map(c=>`<li><b>${esc(c.role)}</b><span class="grow dm5-muted">${esc(c.ua)}</span></li>`).join('')||'<li class="dm5-muted">هیچ گوشی‌ای وصل نیست</li>'}</ul></div>`};
 T.lock=()=>{const s=V7.S();d.body.innerHTML=`<div class="dm5-card"><h4>رمز واقعی کیف طلایی (۳ رقم)</h4><p class="dm5-muted">فقط از همین کامپیوتر؛ هرگز روی شبکه ارسال نمی‌شود. کد ۱ و ۲ = رقم اول و دوم، کد ۳ = جواب معما (رقم سوم). مهر SHA-256 قبل از فینال ثبت می‌شود و در رونمایی تطبیق داده می‌شود.</p>
  <div class="dm5-row"><input class="dm5-in" id="v7lock" type="password" inputmode="numeric" maxlength="3" placeholder="مثلاً ۷۳۹"><button class="dm5-btn pri" data-lk="set">مهر کن</button></div>
  ${s.lock.seal?`<p>🔒 مهر فعلی: <b dir="ltr">${esc(s.lock.seal)}</b></p>`:'<p class="dm5-muted">هنوز مهر نشده</p>'}</div>`};
 T.chroma=()=>{d.body.innerHTML=`<div class="dm5-card"><h4>استودیو کروما (WebGL)</h4><p class="dm5-muted">کی‌یر ۳×۳ CbCr با Similarity/Smoothness/Spill، حذف هاله، جمع کردن مات، برش مات، لایت‌رپ، ترکیب در فضای خطی، بلوم، گرید سینمایی، گرین فیلم، وینیت، لترباکس و ضبط مستقل.</p><button class="dm5-btn pri" data-ck="1">باز کردن استودیو</button></div>
  <div class="dm5-card"><h4>دو حالت رایج</h4><p class="dm5-muted">۱) پیش‌زمینه = دوربین جلوی پردهٔ سبز، پس‌زمینه = گرافیک اپ. ۲) اپ را در حالت کرومای v5 بگذارید؛ پیش‌زمینه = خروجی اپ، پس‌زمینه = فیلم میدان.</p></div>`};
 T.log=()=>{const s=V7.S();d.body.innerHTML=`<div class="dm5-card"><div class="dm5-row"><button class="dm5-btn" data-lg="csv">CSV گزارش V7</button><button class="dm5-btn" data-lg="ep">JSON قسمت V7</button><button class="dm5-btn" data-lg="load">بارگذاری قسمت V7 در پروژه</button><button class="dm5-btn warn" data-lg="reset">ریست وضعیت V7</button><button class="dm5-btn ok" data-lg="test">اجرای تست‌های پذیرش</button></div><pre class="v7pre" id="v7test"></pre></div>
  <div class="dm5-card"><h4>گزارش رویداد (${faN(s.log.length)})</h4><pre class="v7pre">${esc(s.log.slice(-200).reverse().join('\n'))}</pre></div>`};
 d.render=()=>{box=null;(T[d.tab]||T.game)()};
 d.el.addEventListener('input',e=>{const k=e.target.dataset.sk;if(k&&e.target.type==='range'){V7.exec('subs.set',{k,v:+e.target.value},{role:'LOCAL',src:'desk'});const b=e.target.parentElement.querySelector('b');if(b)b.textContent=faN(V7.S().subs[k])}});
 d.el.addEventListener('change',e=>{const k=e.target.dataset.sk;if(k&&e.target.tagName==='SELECT'){let v=e.target.value;if(k==='lines')v=+v;V7.exec('subs.set',{k,v},{role:'LOCAL',src:'desk'})}const sp=e.target.dataset.spk;if(sp)V7.exec('subs.set',{k:'sp.'+sp,v:e.target.checked},{role:'LOCAL',src:'desk'})});
 d.el.addEventListener('click',async e=>{const t=e.target.closest('button');if(!t)return;const ds=t.dataset;
  if(ds.sa){if(ds.sa==='toggle')V7.exec('subs.toggle',{},{role:'LOCAL'});if(ds.sa==='test')V7.cue(d.body.querySelector('#v7subTest').value,'app');
   const base=(V7.subLog||[])[0];const rel=c=>({s:(c.s-base.s)/1000,e:((c.e||Date.now())-base.s)/1000,text:c.text,speaker:c.speaker==='host'?'Gemini':c.speaker});
   if(ds.sa==='srtLive'){if(!base)return V7.toast('هنوز زیرنویسی ضبط نشده');dl('dadashmode-v7-live.srt',V7.E.toSRT(V7.subLog.map(rel)))}
   if(ds.sa==='vttLive'){if(!base)return V7.toast('هنوز زیرنویسی ضبط نشده');dl('dadashmode-v7-live.vtt',V7.E.toVTT(V7.subLog.map(rel)),'text/vtt')}
   if(ds.sa==='srtPlan'){const cps=V7.S().subs.cps;let t=0;const cues=[];(DM.P().segments||[]).forEach(sg=>(sg.lines||[]).forEach(l=>{const dd=V7.E.subDuration(l.text,cps);cues.push({s:t,e:t+dd,text:V7.E.wrapLines(l.text,42,2).join('\n')});t+=dd+.4}));dl('dadashmode-v7-script.srt',V7.E.toSRT(cues))}
   if(ds.sa==='clearLog')V7.subLog=[];if(ds.sa!=='test')d.render();return}
  if(ds.sp){V7.exec('subs.preset',{name:ds.sp},{role:'LOCAL'});d.render();return}
  if(ds.ph){if(ds.ph==='pin')await V7Sync.newPin();if(ds.ph==='re')V7Sync.connect();setTimeout(()=>d.render(),500);return}
  if(ds.lk){const el=d.body.querySelector('#v7lock');const c=DM.en(el.value.trim());try{const seal=await V7.setLock(c);el.value='';V7.toast('مهر شد: '+seal);d.render()}catch(err){V7.toast(err.message)}return}
  if(ds.ck){V7Chroma.open();return}
  if(ds.lg){if(ds.lg==='csv')dl('dadashmode-v7-log.csv','\ufeff'+V7.csv(),'text/csv');if(ds.lg==='ep')dl('ep1-time-bank-v7.json',JSON.stringify(V7.v7Episode(),null,1),'application/json');
   if(ds.lg==='load'){if(!confirm('قسمت V7 جایگزین سگمنت‌های پروژهٔ فعلی شود؟ (نسخهٔ فعلی در تاریخچهٔ نسخه‌ها می‌ماند)'))return;try{const ep=V7.v7Episode();const P0=DM.P();try{typeof snapshotVersion==='function'&&snapshotVersion('قبل از V7')}catch(_){}Object.assign(P0,{segments:ep.segments,startBank:45,theme:ep.theme,brief:ep.brief,name:ep.name});DM.save();try{renderAll()}catch(_){location.reload()}V7.toast('قسمت V7 بارگذاری شد')}catch(err){V7.toast(err.message)}}
   if(ds.lg==='reset'&&confirm('وضعیت V7 ریست شود؟'))V7.exec('ep.reset',{},{role:'LOCAL'});if(ds.lg==='test'){d.body.querySelector('#v7test').textContent=selfTest()}if(ds.lg!=='test')d.render()}});
 V7.on('qr',()=>{d.open();d.tab='phone';d.el.querySelectorAll('.dm5-tabs button').forEach(x=>x.classList.toggle('on',x.dataset.tab==='phone'));d.render()});
 V7.on('log',()=>{if(d.isOpen()&&d.tab==='log'){}});
}
/* in-app acceptance checks (§9.7 numbers) — pure engine, no bank writes */
function selfTest(){const E=V7.E;const out=[];const ok=(c,m)=>out.push((c?'✔ ':'✘ ')+m);
 ok(E.r2Value('L3')>E.r2Value('L2')&&E.r2Value('L2')>E.r2Value('L1'),'فاصله: دورتر = امتیاز بیشتر (۵/۱۰/۲۰)');
 ok(E.r3Result({E:{T:46.8,status:'final',penalty:0},M:{T:31.4,status:'final',penalty:0}}).awards.M===15,'ساندویچ: ۳۱٫۴ در برابر ۴۶٫۸ → +۱۵');
 ok(E.r3Result({E:{T:30.6,status:'final',penalty:0},M:{T:30,status:'final',penalty:0}}).awards.E===5,'ساندویچ: اختلاف زیر ۱ → هر دو +۵');
 ok(E.gapCap({E:60,M:25}).apply,'سقف فاصله ۳۰ فعال می‌شود');ok(!E.gapCap({E:55,M:25}).apply,'فاصلهٔ دقیقاً ۳۰ → بدون تغییر');
 ok(E.riskOptions('M',{E:70,M:40}).includes(30)&&!E.riskOptions('E',{E:70,M:40}).includes(30),'همه‌چی ۳۰ فقط برای نفر عقب ۱۵+');
 ok(E.memCheck([1,0,1,0,1,0,1,0],[1,0,1,0,1,0,1,1])===7,'حافظه: «۷ از ۸»');
 ok(typeof draw==='function'&&window.__v7draw===1,'قلاب رسم V7 روی بوم ضبط فعال است');
 ok(!!window.V7Stage&&!!window.V7Ctl&&!!window.V7QR,'ماژول‌های گرافیک/کنترلر/QR بار شده‌اند');
 try{const svg=V7QR.toSVG('http://192.168.1.10:8787/remote.html#room=ABCDE&pin=1234&role=PLAYER_E');ok(svg.includes('<svg'),'QR آفلاین ساخته می‌شود')}catch(e){ok(false,'QR: '+e.message)}
 return out.join('\n')}
if(DM.whenReady)DM.whenReady(['P'],()=>setTimeout(boot,300));
})();
