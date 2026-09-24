/* DADASHMODE V7 · runtime core. Loaded AFTER all v5 scripts. Adds only; never deletes v5 behaviour.
   - V7 state machine (Director Book §9.5) READY→…→END, each state enables only its own actions
   - every action goes through V7.exec(action,payload,ctx) → validated → applied via v5 award() (the only bank writer)
     → written to the v5 undeletable journal (kind 'v7') and to the V7 event log (§9.5 format, source device)
   - phone commands arrive through the same exec() with their authenticated role → permissions enforced here
   - draw hook: wraps the v5 global draw() so V7 overlays/subtitles are painted onto the recorded canvas */
'use strict';
(function(){
const E=window.V7E,DATA=window.V7D,DM=window.DM5||{};if(!E||!DATA){console.error('[V7] engine/data missing');return}
const V7=window.V7={version:'7.0.0',E,DATA,moments:[],listeners:{}};
const on=(e,f)=>{(V7.listeners[e]=V7.listeners[e]||[]).push(f)};const emit=(e,d)=>{(V7.listeners[e]||[]).forEach(f=>{try{f(d)}catch(err){console.warn('[V7]',e,err)}})};V7.on=on;V7.emit=emit;
const g$=n=>{try{return eval(n)}catch(e){return undefined}};
const Pp=()=>g$('P'),ST=()=>g$('st');
const faN=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);V7.fa=faN;
const nowMs=()=>Date.now();const other=E.other;
const toast=(m,ms)=>{try{window.toast?toast(m,ms):g$('toast')(m,ms)}catch(e){console.log('[V7]',m)}};V7.toast=toast;
const sfx=(n,...a)=>{try{const AE=g$('AE');if(AE&&AE.ctx&&AE[n])AE[n](...a)}catch(e){}};V7.sfx=sfx;
const saveP=()=>{try{g$('save')()}catch(e){}};

/* ---------------- v5 data upgrades (additive) ---------------- */
function upgradeData(){try{
 Object.assign(GAMES,{sandwich:'دوئل ساندویچ',bankopen:'بانک باز شد',glue:'دستکش، پازل و چسب',shop:'فروشگاه کارت',risk:'شوت ریسک',memory:'اتاق حافظه',case:'کیف طلایی سه‌لایه'});
 Object.assign(GAME_ALIAS,{'ساندویچ':'sandwich','دوئل':'sandwich','چسب':'glue','فروشگاه':'shop','شوت':'risk','حافظه':'memory','پیچش':'bankopen','گاوصندوق':'vault'});
 /* R2 fix: lines are DISTANCES from the basket. farther = more seconds */
 DIST.green.fa='۲ متر';DIST.yellow.fa='۳ متر';DIST.red.fa='۴ متر';
 if(!THEMES.some(t=>t.name==='بانک زمان V7'))THEMES.unshift({name:'بانک زمان V7',bg1:'#050914',bg2:'#0f1f45',accent:'#ffc53d',accent2:'#ff7a1a',ink:'#fffaf0',shade:'#0a1433'});
 const _def=window.defaultEpisode;V7.v5DefaultEpisode=_def;window.defaultEpisode=v7Episode;
}catch(e){console.warn('[V7] data upgrade',e)}}

/* ---------------- V7 episode (Director Book §1.1 timeline, §3–§4 dialogue) ---------------- */
function v7Episode(){const L=(emotion,text,direction='')=>({id:uid(),speaker:'host',emotion,text,direction});
 const S=o=>mkSeg(Object.assign({status:'ok'},o));const G=DATA.GEMINI;
 return{format:'dadashmode-episode/3',name:'داداش‌مود · بانک زمان · قسمت ۱ (V7)',unit:'ثانیه',startBank:45,v7:{enabled:true},
 speakers:[{id:'host',name:'جِمنای (داور)',provider:'gemini',voice:'Leda'}],
 players:[{id:'elias',name:'اِلیاس',color:'#ff2738',symbol:'▲',key:'a'},{id:'emad',name:'عِماد',color:'#00c98d',symbol:'●',key:'l'}],
 theme:{font:'Lalezar',name:'بانک زمان V7',bg1:'#050914',bg2:'#0f1f45',accent:'#ffc53d',accent2:'#ff7a1a',ink:'#fffaf0',shade:'#0a1433'},
 brief:{summary:'دو برادر، یک میز، یک کیف طلایی رمزدار و یک داور هوش مصنوعی. هر ثانیه‌ای که امروز می‌برید، در فینال ساعت شما می‌شود.',tone:'جِمنای: خشک، منصف، باهوش، کم‌حرف. عدد فقط از اپ. با دهان پر سکوت کامل.',characters:['اِلیاس · قرمز · چپ','عِماد · سبز · راست','جِمنای · داور · بنفش'],beats:['بِبَر (R1–R4)','خرج کن (فروشگاه)','ریسک کن (شوت)','بدو (گاوصندوق)'],directorNotes:['هیچ نتیجه‌ای برای جذاب‌تر شدن عوض نمی‌شود','ترتیب مرجع: قانون اعلام‌شده · تروثکم · لاگ اپ · جِمنای','کلمهٔ توقف ایمنی: «قرمز»']},
 segments:[
  S({type:'title',title:'بانک زمان',subtitle:'هر بازی رو ببریم، برای آخر ویدیو زمان می‌گیریم',lines:[L('suspense','سه... دو...'),L('serious','و مَن داوَرَم. پَس تَقَلُّب مَمنوع.')]}),
  S({type:'bank',title:'بانک زمان',subtitle:'هر نفر ۴۵ ثانیه',lines:[L('calm','مَن فَقَط چیزی رو میگَم که میبینَم.'),L('playful','مَن طَرَفِ هیچ‌کَس نیستَم. طَرَفِ قانونَم.')]}),
  S({type:'intro',game:'cup',title:'برج لیوان',subtitle:'راند یک',lines:[L('excited','راندِ یک. دَه لیوان، فَقَط با یِک دَست.')]}),
  S({type:'rules',game:'cup',title:'قوانین برج لیوان',rules:['۱۰ لیوان، ۴-۳-۲-۱','فقط یک دست؛ دست دوم پشت کمر','برج ۲ ثانیه سرپا بماند','اولین برج سالم: +۱۰'],lines:[L('calm','دَه لیوان، هَرَم چهار، سه، دو، یک.'),L('serious','دَستِ دُوُم پُشتِ کَمَر.'),L('suspense','بُرج باید دو ثانیه سالِم بِمونه.'),L('excited','اَوَّلی، دَه ثانیه.')]}),
  S({type:'countdown',title:'آماده‌اید؟'}),
  S({type:'play',game:'cup',title:'برج لیوان',subtitle:'راند یک',duration:30,reward:10,lines:[L('referee','دَستِ دُوُم!'),L('referee','سالِمه... یِک... دو.')]}),
  S({type:'intro',game:'distance',title:'فاصله را خودت انتخاب کن',subtitle:'راند دو',lines:[L('playful','راندِ دو. خَطِّت رو اِنتِخاب کُن. بَعد اَز قُفل، عَوَض نِمیشه.')]}),
  S({type:'rules',game:'distance',title:'قوانین فاصله',rules:['۲ متر +۵ · ۳ متر +۱۰ · ۴ متر +۲۰','هرچه دورتر، امتیاز بیشتر','خط یک بار انتخاب و قفل می‌شود','۳ پرتاب؛ اولین گل ارزش خط را می‌گیرد'],lines:[L('calm','دو مِتر، پَنج ثانیه. سه مِتر، دَه. چهار مِتر، بیست.'),L('serious','هر چی دورتَر، بیشتَر.'),L('referee','اِنتِخاب قُفل شُد.')]}),
  S({type:'play',game:'distance',title:'فاصله را خودت انتخاب کن',subtitle:'راند دو',duration:60,reward:20,lines:[L('referee','گُل.'),L('playful','مَن باد رو نِمیبینَم. پَرتابِت رو دیدَم.')]}),
  S({type:'intro',game:'sandwich',title:'دوئل ساندویچ',subtitle:'راند سه',lines:[L('excited','راندِ سه. دوئلِ ساندویچ. اَوَّلی که قورت بِده، وَقت میبَره.')]}),
  S({type:'rules',game:'sandwich',title:'قوانین دوئل ساندویچ',rules:['دو ساندویچ یکسان · سقف ۶۰ ثانیه','آخرین لقمه = دست‌ها بالا (ساعت می‌ایستد)','۳۰ ثانیه برای قورت + دهان خالی','برنده = اختلاف زمان (کف ۳، سقف ۲۰)','ایمنی: کلمهٔ توقف «قرمز»'],lines:[L('calm','دو ساندویچِ یِکسان. سَقف شَصت ثانیه.'),L('serious',G.r3Rule),L('calm','بَرَنده، اِختِلافِ زَمان رو میگیره.'),L('serious','هر کی بِگه «قِرمِز»، همه چی وایمیسه.')]}),
  S({type:'countdown',title:'سه... دو... یک'}),
  S({type:'play',game:'sandwich',title:'دوئل ساندویچ',subtitle:'راند سه',duration:60,reward:20,lines:[L('referee',G.r3Empty),L('playful',G.r3After),L('playful',G.r3Dnf),L('serious',G.r3Dq)]}),
  S({type:'card',game:'bankopen',title:'بانک باز شد',subtitle:'از الان ثانیه‌ها پول هم هستن',lines:[L('suspense','نه. بانک باز شُد.'),L('calm',G.colors),L('playful','میتونی. وَلی هر چی بِخَری، اَز ساعَتِ فینالِت کَم میشه.')]}),
  S({type:'intro',game:'glue',title:'دستکش، پازل و چسب',subtitle:'راند چهار',lines:[L('excited','راندِ چهار. پازِلِ لوگو، شیش تیکه. چیدَن با دِستکَش، چَسب بی دِستکَش.')]}),
  S({type:'rules',game:'glue',title:'قوانین پازل چسبی',rules:['چیدن ۶ تکه با دستکش','چسب بدون دستکش','دکمهٔ «تمام» خودت','اولین «تمام» معتبر: +۱۵','چالش چسب: موفق ۱۰/۵ · ناموفق −۵'],lines:[L('calm','دِستکَشا رو بِپوشید.'),L('serious',G.r4Rule),L('excited','اَوَّلی که دُکمهٔ تَمام رو بِزَنه، پونزده ثانیه.')]}),
  S({type:'play',game:'glue',title:'دستکش، پازل و چسب',subtitle:'راند چهار',duration:180,reward:15,lines:[L('referee',G.r4Back),L('referee','بَرَندهٔ چَسب...'),L('serious',G.glueUnsure)]}),
  S({type:'bank',title:'رونمایی بانک',subtitle:'سقف فاصله ۳۰ ثانیه',lines:[L('suspense','سی. دَقیقاً روی مَرز. قانون اِعمال نِمیشه.')]}),
  S({type:'rules',game:'shop',title:'فروشگاه کارت',rules:['آبی برای خودت · قرمز برای حریف · طلایی برای شجاع‌ها','حداکثر ۲ کارت، فقط ۱ قرمز','نفر جلو: +۵ مالیات روی قرمز و طلایی','کارت‌ها ثانیه نمی‌دزدند · کف بانک ۲۰'],lines:[L('calm',G.shop),L('serious',G.colors)]}),
  S({type:'play',game:'shop',title:'فروشگاه کارت',subtitle:'خرید مخفی و هم‌زمان',duration:60,reward:0,lines:[L('excited',G.shield),L('excited',G.mirror),L('playful',G.idle)]}),
  S({type:'rules',game:'risk',title:'شوت ریسک',rules:['شرط علنی ۰ / ۱۰ / ۲۰','نفر عقب با ۱۵+ فاصله: همه‌چی ۳۰','توکن داخل مربع = +شرط · بیرون = −شرط','کف بانک ۲۰'],lines:[L('serious','شوتِ ریسک. اَوَّل نَفَرِ عَقَب اِعلام میکُنه.')]}),
  S({type:'play',game:'risk',title:'شوت ریسک',subtitle:'آخرین تصمیم قبل از فینال',duration:60,reward:0,lines:[L('referee','خورد.'),L('referee','نَخورد. دو سانتِ دَردناک.'),L('playful','اوضاع بَرعَکس شُد.')]}),
  S({type:'bank',title:'آماده‌سازی فینال',subtitle:'داور نزدیک‌تر میاد',lines:[L('suspense','داوَر نَزدیک‌تَر میاد.')]}),
  S({type:'intro',game:'vault',title:'گاوصندوق',subtitle:'ساعت تو = بانک تو',lines:[L('epic','ساعَتِ تو، بانکِ توئه. سه کُد، سه رَقَمِ رَمزِ واقِعیِ کیف.')]}),
  S({type:'rules',game:'vault',title:'قانون گاوصندوق',rules:['۱ · نقاشی کور → کد اول','۲ · اتاق حافظه → کد دوم (غلط = −۳)','۳ · معمای خنده‌دار → کد سوم (غلط = قفل ۵)','۴ · سه کد = رمز واقعی کیف طلایی','بیشترین زمان باقی‌مانده برنده است'],lines:[L('calm','نَقاشیِ کور. فَقَط یِه کَلَمه حَدس میزَنَم.'),L('calm','اُتاقِ حافِظه. هَشت لیوان.'),L('playful','مُعَمّای خَنده‌دار. جَوابِش خودِ رَقَمه.'),L('epic','کُد میگیری تا کیف رو باز کُنی.')]}),
  S({type:'countdown',title:'فینال!'}),
  S({type:'play',game:'vault',title:'گاوصندوق',subtitle:'دویدن اول و دوم',duration:120,reward:0,lines:[L('referee','عِینَک.'),L('playful',G.memWrong.replace('{n}','شیش')),L('excited',G.riddleOk),L('serious','گاوصَندوق باز شُد.')]}),
  S({type:'winner',game:'case',title:'کیف طلایی',subtitle:'تاج + پاکت سرنوشت + مجازات',lines:[L('suspense','بَرَندهٔ کیف...'),L('celebrate',G.caseBadge),L('calm',G.caseEnv),L('playful',G.punish),L('serious',G.justice)]}),
  S({type:'card',title:'دفاع از تاج',subtitle:'مجازات قسمت بعد رو شما انتخاب کنید',lines:[L('playful','قِسمَتِ بَعد... دِفاع اَز تاج.')]})
 ]}}
V7.v7Episode=v7Episode;

/* ---------------- state ---------------- */
const STATES=['READY','R1','R2','R3_SANDWICH','TWIST_BANKOPEN','R4_GLUE','REVEAL','SHOP','SHOP_REVEAL','RISK','VAULT_ARMED','RUN1','RUN2','CASE','CASE_L1','CASE_L2','CASE_L3','END'];
const STATE_FA={READY:'آماده',R1:'راند ۱ · برج لیوان',R2:'راند ۲ · فاصله',R3_SANDWICH:'راند ۳ · دوئل ساندویچ',TWIST_BANKOPEN:'پیچش · بانک باز شد',R4_GLUE:'راند ۴ · پازل چسبی',REVEAL:'رونمایی بانک',SHOP:'فروشگاه کارت',SHOP_REVEAL:'رونمایی کارت‌ها',RISK:'شوت ریسک',VAULT_ARMED:'آماده‌سازی فینال',RUN1:'فینال · دویدن اول',RUN2:'فینال · دویدن دوم',CASE:'کیف طلایی',CASE_L1:'لایهٔ ۱ · تاج و نشان',CASE_L2:'لایهٔ ۲ · پاکت سرنوشت',CASE_L3:'لایهٔ ۳ · مجازات',END:'پایان'};
V7.STATES=STATES;V7.STATE_FA=STATE_FA;
function fresh(){return{version:7,enabled:true,state:'READY',t0:null,log:[],
 r2:{E:{line:null,throws:[],scored:false},M:{line:null,throws:[],scored:false}},
 r3:{E:E.r3NewPlayer(),M:E.r3NewPlayer(),t0:null,stopped:false,safetyStop:false,applied:null},
 r4:{t0:null,finish:{E:null,M:null},valid:{E:false,M:false},lockUntil:{E:0,M:0},challenge:null,applied:null},
 reveal:{done:null},shop:{picks:{E:[],M:[]},submitted:{E:false,M:false},revealed:false,events:[],effects:null,charged:false},
 risk:{stake:{E:null,M:null},result:{E:null,M:null}},
 vault:{armed:false,target:null,pattern:null,riddleId:null,order:[],runs:{E:null,M:null},runner:null},
 lock:{seal:null,salt:null,code:null},cas:{winner:null,layer:0,fate:null,bites:{picks:[],revealed:false}},
 subs:{on:true,cps:15,mode:'all',size:52,pos:'bottom',offset:0,lines:2,bg:'shadow',bgA:.55,speakers:{host:true,E:true,M:true,app:true},clean:false,preset:'main'},cues:[]}}
V7.fresh=fresh;
const S=()=>{const p=Pp();if(!p)return null;if(!p.v7||p.v7.version!==7)p.v7=Object.assign(fresh(),p.v7&&p.v7.version===7?p.v7:{});const f=fresh();for(const k in f)if(p.v7[k]===undefined)p.v7[k]=f[k];return p.v7};V7.S=S;
V7.pid=k=>{const p=Pp();return p&&p.players[k==='E'?0:1]?p.players[k==='E'?0:1].id:null};
V7.key=pid=>{const p=Pp();return p&&p.players[0]&&p.players[0].id===pid?'E':'M'};
V7.name=k=>{const p=Pp();const pl=p&&p.players[k==='E'?0:1];return pl?pl.name:k};
V7.color=k=>{const p=Pp();const pl=p&&p.players[k==='E'?0:1];return pl?pl.color:(k==='E'?'#ff2738':'#00c98d')};
V7.banks=()=>{const b={E:0,M:0};try{b.E=bankOf(V7.pid('E'));b.M=bankOf(V7.pid('M'))}catch(e){}return b};
V7.showT=()=>{const s=S();if(!s||!s.t0)return 0;return (nowMs()-s.t0)/1000};
const mmss=sec=>{sec=Math.max(0,sec);const m=Math.floor(sec/60),s=sec-m*60;return String(m).padStart(2,'0')+':'+s.toFixed(1).padStart(4,'0')};V7.mmss=mmss;

/* ---------------- log: v5 journal + V7 event log (§9.5 format) ---------------- */
function log(code,text,src){const s=S();if(!s)return;const line=`${mmss(V7.showT())} ${code}${text?' '+text:''}${src&&src!=='local'?' ('+src+')':''}`;s.log.push(line);if(s.log.length>4000)s.log.shift();
 try{G().journal.push({id:uid(),t:Date.now(),kind:'v7',player:null,delta:0,reason:'V7 · '+code+(text?' '+text:''),seg:curSegIndex()});g$('renderJournal')()}catch(e){}emit('log',line)}
V7.log=log;
function give(k,delta,reason,src){if(!delta)return true;const pid=V7.pid(k);let ev=null;try{ev=award(pid,delta,reason)}catch(e){console.warn(e)}if(!ev){toast('امتیاز ثبت نشد (VAR فعال است؟)');return false}log(`AWARD ${k} ${delta>0?'+':''}${delta}`,`BANK=${V7.banks()[k]} · ${reason}`,src);emit('award',{k,delta,reason});return true}
V7.give=give;
V7.csv=()=>{const s=S();return 'time,event\n'+(s?s.log:[]).map(l=>{const i=l.indexOf(' ');return `${l.slice(0,i)},"${l.slice(i+1).replace(/"/g,'""')}"`}).join('\n')};

/* ---------------- moments (transient animations drawn by v7-stage) ---------------- */
V7.moment=(kind,data={},dur=3)=>{V7.moments.push({kind,data,t0:performance.now()/1000,dur});if(V7.moments.length>24)V7.moments.shift()};

/* ---------------- permissions ---------------- */
const PERM={DIRECTOR:'*',LOCAL:'*',JUDGE:['r3.empty','r3.mouth','r4.valid','r4.wrong','r4.challengeResult','vault.guess','vault.check','vault.toggle','subs.toggle'],
 PLAYER_E:['r4.finish','r4.challenge','shop.pick','shop.unpick','shop.submit','risk.stake'],PLAYER_M:['r4.finish','r4.challenge','shop.pick','shop.unpick','shop.submit','risk.stake'],MONITOR:[]};
const STATE_OF={r1:['R1'],r2:['R2'],r3:['R3_SANDWICH'],twist:['TWIST_BANKOPEN','R3_SANDWICH','R4_GLUE'],r4:['R4_GLUE'],reveal:['REVEAL','R4_GLUE'],shop:['SHOP','SHOP_REVEAL'],risk:['RISK'],vault:['VAULT_ARMED','RUN1','RUN2'],cas:['CASE','CASE_L1','CASE_L2','CASE_L3','RUN2','END']};
const seen=new Set();
function exec(action,p={},ctx={}){const s=S();if(!s)return{ok:false,msg:'پروژه باز نیست'};const role=ctx.role||'LOCAL',src=ctx.src||'local';
 if(ctx.id){if(seen.has(ctx.id))return{ok:true,dup:true,msg:'تکراری'};seen.add(ctx.id);if(seen.size>800)seen.delete(seen.values().next().value)}
 const perm=PERM[role];if(perm!=='*'&&!(perm||[]).includes(action))return{ok:false,msg:'این نقش اجازهٔ این فرمان را ندارد'};
 if(role==='PLAYER_E')p=Object.assign({},p,{p:'E'});if(role==='PLAYER_M')p=Object.assign({},p,{p:'M'});
 const grp=action.split('.')[0];if(STATE_OF[grp]&&!STATE_OF[grp].includes(s.state)&&!ctx.force)return{ok:false,msg:`این فرمان در حالت «${STATE_FA[s.state]}» فعال نیست`};
 const fn=ACT[action];if(!fn)return{ok:false,msg:'فرمان ناشناخته: '+action};
 let r;try{r=fn(p,src,s)||{ok:true}}catch(e){console.error(e);r={ok:false,msg:e.message}}
 if(r.ok!==false){saveP();emit('change',{action,p})}if(r.msg&&ctx.toast!==false&&role==='LOCAL')toast(r.msg);return r}
V7.exec=exec;

/* ---------------- actions ---------------- */
const need=(c,m)=>{if(!c)throw new Error(m)};
const ACT={
 'state.go':({s:to},src,s)=>{need(STATES.includes(to),'حالت نامعتبر');const from=s.state;s.state=to;if(from!==to)V7.moments=[];if(!s.t0)s.t0=nowMs();log('STATE',`${from}→${to}`,src);onEnter(to,src);return{ok:true}},
 'state.next':(p,src,s)=>ACT['state.go']({s:STATES[Math.min(STATES.length-1,STATES.indexOf(s.state)+1)]},src,s),
 'state.prev':(p,src,s)=>ACT['state.go']({s:STATES[Math.max(0,STATES.indexOf(s.state)-1)]},src,s),
 'ep.start':(p,src,s)=>{const P0=Pp();if(P0.startBank!==E.CFG.start){P0.startBank=E.CFG.start;log('START_BANK','45')}s.t0=nowMs();log('EPISODE START','V7',src);sfx('boom');try{g$('renderScores')()}catch(e){}return ACT['state.go']({s:'R1'},src,s)},
 'ep.reset':(p,src)=>{const P0=Pp();const keep=P0.v7?{subs:P0.v7.subs,lock:P0.v7.lock}:{};P0.v7=Object.assign(fresh(),keep);log('V7 RESET','',src);return{ok:true,msg:'وضعیت V7 از اول (بانک‌ها با «شروع مسابقهٔ جدید» v5 صفر می‌شوند)'}},
 /* R1 */
 'r1.win':({p:k},src)=>{const r=E.r1Result({winner:k});give(k,r.awards[k],'R1 · '+r.reason,src);V7.moment('award',{k,n:r.awards[k]},2.2);return{ok:true}},
 'r1.levels':({p:k},src)=>{const r=E.r1Result({levels:{[k]:2,[other(k)]:1}});give(k,r.awards[k],'R1 · '+r.reason,src);return{ok:true}},
 /* R2 */
 'r2.lock':({p:k,line},src,s)=>{const d=s.r2[k];need(!d.throws.length,'بعد از پرتاب اول قفل است');need(E.CFG.r2.lines[line],'خط نامعتبر');d.line=line;log(`R2 ${k} LINE=${line} (+${E.r2Value(line)}) LOCK`,'',src);sfx('lock');V7.moment('lock',{k,line},2.2);return{ok:true}},
 'r2.throw':({p:k,hit},src,s)=>{const r=E.r2Throw(s.r2[k],!!hit);need(!r.error,r.error);log(`R2 ${k} ${hit?'HIT':'MISS'} ${s.r2[k].throws.length}/3`,'',src);if(hit){give(k,r.award,`R2 · گل از ${E.CFG.r2.lines[s.r2[k].line].m} متر`,src);V7.moment('throw',{k,line:s.r2[k].line,hit:true},2.6)}else{sfx('buzzer');V7.moment('throw',{k,line:s.r2[k].line,hit:false},2)}return{ok:true}},
 /* R3 sandwich */
 'r3.start':(p,src,s)=>{need(!s.r3.t0||s.r3.applied,'دوئل در جریان است');Object.assign(s.r3,{E:E.r3NewPlayer(),M:E.r3NewPlayer(),t0:nowMs(),stopped:false,safetyStop:false,applied:null});s.r3.E.status=s.r3.M.status='eating';log('R3 START','',src);sfx('whistle');return{ok:true}},
 'r3.mouth':({p:k},src,s)=>{const x=s.r3[k];need(s.r3.t0&&!s.r3.stopped,'اول شروع را بزنید');need(x.status==='eating','این بازیکن در حال خوردن نیست');x.T=+((nowMs()-s.r3.t0)/1000).toFixed(1);x.status='provisional';x.mouthAt=nowMs();log(`R3 ${k} MOUTHFULL T=${x.T}`,'',src);sfx('ding');return{ok:true}},
 'r3.empty':({p:k},src,s)=>{const x=s.r3[k];need(x.status==='provisional','اول «دهان‌پر» ثبت شود');x.status='final';log(`R3 ${k} EMPTY OK`,'',src);sfx('coin');r3Auto(src);return{ok:true}},
 'r3.penalty':({p:k},src,s)=>{s.r3[k].penalty+=E.CFG.r3.penalty;log(`R3 ${k} PENALTY +3`,'',src);sfx('buzzer');return{ok:true}},
 'r3.dq':({p:k},src,s)=>{s.r3[k].status='dq';log(`R3 ${k} DQ`,'برگشت غذا',src);r3Auto(src);return{ok:true}},
 'r3.safety':(p,src,s)=>{s.r3.safetyStop=true;s.r3.stopped=true;log('R3 SAFETY_STOP','«قرمز»',src);sfx('siren');V7.moment('safety',{},4);return{ok:true,msg:'توقف ایمنی: همهٔ ساعت‌ها ایستاد. اگر حال همه خوب است «اعمال» را بزنید (هر دو +۵).'}},
 'r3.edit':({p:k,T,reason},src,s)=>{need(isFinite(+T)&&+T>0&&+T<=60,'زمان نامعتبر');need(reason,'دلیل EDIT لازم است');const x=s.r3[k];x.T=+(+T).toFixed(1);if(x.status==='eating'||x.status==='provisional')x.status='final';log(`R3 ${k} EDIT T=${x.T}`,'دلیل: '+reason,src);r3Auto(src);return{ok:true}},
 'r3.pick':({who},src,s)=>{need(!s.r3.applied,'قبلاً اعمال شده');const r=E.r3NonePick(who);applyAwards(r,'R3',src);s.r3.applied=r;return{ok:true}},
 'r3.apply':(p,src,s)=>{need(!s.r3.applied,'قبلاً اعمال شده');const r=E.r3Result(s.r3);need(!r.needPick,'هیچ‌کس تمام نکرد: «کمتر باقی گذاشت» را انتخاب کنید');applyAwards(r,'R3',src);s.r3.applied=r;s.r3.stopped=true;log(`R3 RESULT ${r.winner?r.winner+' +'+r.awards[r.winner]:''}${r.diff!=null?` (Δ${r.diff.toFixed(1)})`:''}`,r.reason,src);return{ok:true}},
 /* twist */
 'twist.play':(p,src)=>{V7.moment('bankopen',{},8);sfx('vault');setTimeout(()=>sfx('boom'),900);log('TWIST BANKOPEN SHOWN','',src);return{ok:true}},
 /* R4 glue */
 'r4.start':(p,src,s)=>{Object.assign(s.r4,{t0:nowMs(),finish:{E:null,M:null},valid:{E:false,M:false},lockUntil:{E:0,M:0},challenge:null,applied:null});log('R4 START','180',src);sfx('whistle');return{ok:true}},
 'r4.finish':({p:k},src,s)=>{need(s.r4.t0,'اول شروع را بزنید');need(nowMs()>=s.r4.lockUntil[k],'دکمه ۵ ثانیه قفل است');need(!s.r4.finish[k],'قبلاً «تمام» زده');const t=(nowMs()-s.r4.t0)/1000;s.r4.finish[k]=t;log(`R4 ${k} FINISH ${mmss(t)}`,'',src);sfx('ding');V7.moment('stamp',{k,text:'تمام'},1.6);return{ok:true}},
 'r4.valid':({p:k},src,s)=>{need(s.r4.finish[k]!=null,'«تمام» ثبت نشده');s.r4.valid[k]=true;log(`R4 ${k} VALID`,'',src);r4Auto(src);return{ok:true}},
 'r4.wrong':({p:k},src,s)=>{need(s.r4.finish[k]!=null&&!s.r4.valid[k],'«تمام» معلقی برای لغو نیست');s.r4.finish[k]=null;s.r4.lockUntil[k]=nowMs()+E.CFG.r4.wrongLock*1000;log(`R4 ${k} WRONG`,'لغو + قفل ۵',src);sfx('buzzer');V7.moment('stamp',{k,text:'غلط',bad:true},1.6);return{ok:true}},
 'r4.challenge':({p:k},src,s)=>{const first=r4First(s);need(first,'هنوز «تمام» معتبر نیست');need(E.r4CanChallenge({first,finished:{E:!!s.r4.valid.E,M:!!s.r4.valid.M},challenge:s.r4.challenge},k),'چالش فقط یک بار و برای نفر دوم بعد از «تمام» معتبرِ خودش');s.r4.challenge={by:k,outcome:null};log(`R4 ${k} CHALLENGE`,'',src);sfx('hit');V7.moment('challenge',{k},30);return{ok:true}},
 'r4.challengeResult':({outcome},src,s)=>{need(s.r4.challenge&&!s.r4.challenge.outcome,'چالشی باز نیست');const by=s.r4.challenge.by;s.r4.challenge.outcome=outcome==='unclear'?'unclear':(outcome===by?'win':'lose');log(`R4 CHALLENGE ${s.r4.challenge.outcome.toUpperCase()} ${by}`,'',src);V7.moments=V7.moments.filter(m=>m.kind!=='challenge');r4Apply(src);return{ok:true}},
 'r4.fallback':({who},src,s)=>{need(!r4First(s),'«تمام» معتبر وجود دارد');need(!s.r4.applied,'قبلاً اعمال شده');const r=E.r4Result({first:null,fallback:who});applyAwards(r,'R4',src);s.r4.applied=r;return{ok:true}},
 'r4.apply':(p,src)=>{r4Apply(src,true);return{ok:true}},
 /* reveal */
 'reveal.run':(p,src,s)=>{need(!s.reveal.done,'رونمایی قبلاً انجام شده');const b=V7.banks();const r=E.gapCap(b);s.reveal.done={banks:b,cap:r};log(`REVEAL GAP=${r.gap} CAP=${r.apply?'YES':'NO'}`,'',src);V7.moment('reveal',{banks:b,cap:r},6);sfx('sweepUp');if(r.apply)setTimeout(()=>give(r.trailer,r.delta,'سقف فاصله ۳۰ (یک بار)',src),2600);return{ok:true}},
 /* shop */
 'shop.pick':({p:k,card},src,s)=>{need(!s.shop.revealed,'رونمایی شده');need(!s.shop.submitted[k],'ثبت شده');const c=E.shopCheck(s.shop.picks,k,card,V7.banks());need(c.ok,c.why);s.shop.picks[k].push(card);log(`SHOP ${k} PICK`,'(مخفی)',src);return{ok:true}},
 'shop.unpick':({p:k,card},src,s)=>{need(!s.shop.submitted[k],'ثبت شده');s.shop.picks[k]=s.shop.picks[k].filter(x=>x!==card);return{ok:true}},
 'shop.submit':({p:k},src,s)=>{need(!s.shop.revealed,'رونمایی شده');const order=E.riskOrder(V7.banks());if(k===order[1])need(s.shop.submitted[order[0]],'اول نفر عقب انتخاب می‌کند');s.shop.submitted[k]=true;log(`SHOP ${k} SUBMIT n=${s.shop.picks[k].length}`,'',src);sfx('lock');return{ok:true,msg:'ثبت شد ●'}},
 'shop.reveal':({force},src,s)=>{need(!s.shop.revealed,'قبلاً رونمایی شده');need(force||(s.shop.submitted.E&&s.shop.submitted.M),'هر دو باید ثبت کنند');const b=V7.banks();const charges=E.shopCharges(s.shop.picks,b);const r=E.shopResolve(s.shop.picks);
  s.shop.revealed=true;s.shop.events=r.events;s.shop.effects=r.effects;s.state='SHOP_REVEAL';
  for(const k of ['E','M'])for(const c of s.shop.picks[k]){const pr=E.cardPrice(c,k,b);log(`SHOP ${k} PICK=${c}${pr.tax?' TAX=5':''}`,'',src);give(k,-pr.total,'خرید کارت '+E.CFG.shop.cards[c].fa+(pr.tax?' (+۵ مالیات)':''),src)}
  r.events.forEach(e=>log(`SHOP REVEAL ${e.card}${e.target?'->'+e.target:''} ${e.label}`,'',src));V7.moment('shopReveal',{picks:JSON.parse(JSON.stringify(s.shop.picks)),events:r.events},8);sfx('drumroll',1.2);return{ok:true}},
 /* risk */
 'risk.stake':({p:k,stake},src,s)=>{stake=+stake;const b=V7.banks();need(s.risk.stake[k]==null,'شرط قفل شده');const order=E.riskOrder(b);if(k===order[1])need(s.risk.stake[order[0]]!=null,'اول نفر عقب اعلام می‌کند');need(E.riskOptions(k,b).includes(stake),'این شرط مجاز نیست (کف ۲۰ / همه‌چی ۳۰ فقط نفر عقب ۱۵+)');s.risk.stake[k]=stake;log(`RISK ${k} STAKE=${stake===30?'ALLIN30':stake} LOCK`,'',src);sfx('lock');V7.moment('stake',{k,stake},2.4);return{ok:true}},
 'risk.hit':({p:k,hit},src,s)=>{need(s.risk.stake[k]!=null,'اول شرط');need(s.risk.result[k]==null,'نتیجه ثبت شده');s.risk.result[k]=!!hit;const d=E.riskResult(s.risk.stake[k],!!hit);log(`RISK ${k} ${hit?'HIT':'MISS'} ${d>=0?'+':''}${d}`,'',src);if(d)give(k,d,'شوت ریسک · '+(hit?'خورد':'نخورد'),src);else sfx(hit?'coin':'lose');V7.moment('risk',{k,hit:!!hit,d},3);return{ok:true}},
 /* lock code (desktop only) */
 'lock.set':async()=>({ok:false,msg:'از پنل کامپیوتر وارد کنید'}),
 /* vault */
 'vault.arm':(p,src,s)=>{need(s.lock.code,'اول رمز واقعی کیف را در پنل «رمز کیف» وارد و مهر کنید');const d=E.codeDigits(s.lock.code);const bank=DATA.RIDDLES.map(r=>Object.assign({},r,{used:(s.usedRiddles||[]).includes(r.id)}));const rd=E.pickRiddle(bank,d.C3)||DATA.RIDDLES.find(r=>r.answer===d.C3);
  Object.assign(s.vault,{armed:true,target:Math.floor(Math.random()*DATA.TARGETS.length),pattern:E.memPattern(),riddleId:rd?rd.id:null,order:E.vaultOrder(V7.banks()),runs:{E:null,M:null},runner:null});log('VAULT ARMED',`SEAL=${s.lock.seal}`,src);if(s.state==='VAULT_ARMED'||s.state==='RISK')s.state='VAULT_ARMED';return{ok:true}},
 'vault.start':({p:k},src,s)=>{need(s.vault.armed,'اول «آماده‌سازی فینال»');k=k||s.vault.order[s.vault.runs[s.vault.order[0]]?1:0];need(!s.vault.runs[k],'این بازیکن دویده');const bank=V7.banks()[k];
  s.vault.runs[k]={state:'running',clock:bank,elapsed:0,tRun:nowMs(),station:1,codes:0,input:[0,0,0,0,0,0,0,0],mem:{phase:'idle',t0:0,checks:0},hintUsed:false,riddleLock:0,codeLock:0,opened:false,left:null,guesses:0};s.vault.runner=k;
  s.state=s.vault.runs[other(k)]?'RUN2':'RUN1';log(`${s.state} ${k} START CLOCK=${bank.toFixed(1)}`,'',src);sfx('whistle');V7.moment('target',{k,word:DATA.TARGETS[s.vault.target].name},E.CFG.vault.targetShow);return{ok:true}},
 'vault.pause':(p,src,s)=>{const r=curRun(s);need(r,'دونده‌ای نیست');if(r.state==='running'){r.elapsed+= (nowMs()-r.tRun)/1000;r.state='paused';log(`${s.state} ${s.vault.runner} PAUSE`,'',src)}else if(r.state==='paused'){r.tRun=nowMs();r.state='running';log(`${s.state} ${s.vault.runner} RESUME`,'',src)}return{ok:true}},
 'vault.showTarget':(p,src,s)=>{V7.moment('target',{k:s.vault.runner,word:DATA.TARGETS[s.vault.target].name},E.CFG.vault.targetShow);return{ok:true}},
 'vault.guess':({ok:good,word},src,s)=>{const r=curRun(s);need(r&&r.station===1,'ایستگاه ۱ فعال نیست');r.guesses++;const k=s.vault.runner;
  const pass=word?E.guessOk(DATA.TARGETS[s.vault.target],word):!!good;if(!pass){log(`${s.state} ${k} S1 GUESS=WRONG`,word||'',src);sfx('buzzer');return{ok:true,msg:'غلط → برگهٔ نو'}}
  r.station=2;r.codes=1;const d=E.codeDigits(s.lock.code);log(`${s.state} ${k} S1 PASS C1=${d.C1}`,'',src);sfx('lock');V7.moment('code',{k,slot:1,digit:d.C1},E.CFG.vault.codeShow);return{ok:true}},
 'vault.memShow':(p,src,s)=>{const r=curRun(s);need(r&&r.station===2,'ایستگاه ۲ فعال نیست');r.mem.phase='show';r.mem.t0=nowMs();log(`${s.state} ${s.vault.runner} S2 SHOW`,'',src);sfx('whoosh');return{ok:true}},
 'vault.toggle':({i},src,s)=>{const r=curRun(s);need(r&&r.station===2&&r.mem.phase==='input','ورود فعال نیست (قفل ۸ ثانیه)');i=+i;need(i>=0&&i<8,'لیوان نامعتبر');r.input[i]=r.input[i]?0:1;sfx('tick');return{ok:true}},
 'vault.check':(p,src,s)=>{const r=curRun(s);need(r&&r.station===2&&r.mem.phase==='input','ورود فعال نیست');const n=E.memCheck(s.vault.pattern,r.input);r.mem.checks++;const k=s.vault.runner;
  if(n<8){r.elapsed+=Math.abs(E.CFG.vault.memWrong);log(`${s.state} ${k} S2 CHECK ${n}/8 -3`,'',src);sfx('buzzer');V7.moment('memWrong',{k,n},2.4);return{ok:true,msg:`${faN(n)} از ۸ · −۳`}}
  r.station=3;r.codes=2;r.mem.phase='done';const d=E.codeDigits(s.lock.code);log(`${s.state} ${k} S2 PASS C2 SHOWN`,'',src);sfx('coin');V7.moment('memOk',{k},1.2);setTimeout(()=>V7.moment('code',{k,slot:2,digit:d.C2},E.CFG.vault.codeShow),900);return{ok:true}},
 'vault.hint':(p,src,s)=>{const r=curRun(s);const k=s.vault.runner;need(r,'دونده‌ای نیست');const eff=s.shop.effects&&s.shop.effects[k];need(eff&&eff.hint&&!r.hintUsed,'ذره‌بین ندارد یا مصرف شده');r.hintUsed=true;
  if(r.station===2){r.mem.phase='show';r.mem.t0=nowMs()-(E.CFG.vault.memShow-E.CFG.vault.hintShow)*1000;r.mem.hint=true;log(`${s.state} ${k} HINT S2`,'',src)}else{V7.moment('hint',{k},6);log(`${s.state} ${k} HINT S3`,'',src)}sfx('sweepUp');return{ok:true}},
 'vault.answer':({d},src,s)=>{const r=curRun(s);need(r&&r.station===3,'ایستگاه ۳ فعال نیست');need(nowMs()>=r.riddleLock,'قفل ۵ ثانیه');const rd=DATA.RIDDLES.find(x=>x.id===s.vault.riddleId);const k=s.vault.runner;
  if(+d!==rd.answer){r.riddleLock=nowMs()+E.CFG.vault.riddleLock*1000;log(`${s.state} ${k} S3 RIDDLE#${rd.id} WRONG`,'',src);sfx('buzzer');return{ok:true,msg:'غلط · قفل ۵ ثانیه'}}
  r.station=4;r.codes=3;log(`${s.state} ${k} S3 RIDDLE#${rd.id} OK`,'',src);sfx('coin');s.usedRiddles=[...new Set([...(s.usedRiddles||[]),rd.id])];V7.moment('code',{k,slot:3,digit:rd.answer},E.CFG.vault.codeShow);return{ok:true}},
 'vault.code':({code},src,s)=>{const r=curRun(s);need(r&&r.station===4,'هنوز سه کد کامل نیست');need(nowMs()>=r.codeLock,'قفل ۵ ثانیه');const k=s.vault.runner;
  if(String(code)!==String(s.lock.code)){r.codeLock=nowMs()+E.CFG.vault.codeLock*1000;log(`${s.state} ${k} CODE WRONG`,'',src);sfx('buzzer');const d=E.codeDigits(s.lock.code);V7.moment('reflash',{k,d},E.CFG.vault.codeShow);return{ok:true,msg:'کد غلط · قفل ۵ ثانیه + نمایش دوبارهٔ کدها'}}
  runEnd(s,r,true,src);return{ok:true}},
 'vault.stuckGloves':(p,src,s)=>{const r=curRun(s);need(r&&r.station===2,'فقط ایستگاه ۲');r.elapsed+=5;log(`${s.state} ${s.vault.runner} GLOVE_RELIEF -5`,'',src);return{ok:true,msg:'یک دست بی‌دستکش مجاز شد (−۵)'}},
 /* case */
 'cas.open':({winner},src,s)=>{let w=winner;if(!w){const R=s.vault.runs;w=R.E&&R.M?E.vaultWinner({E:{opened:R.E.opened,left:R.E.left||0,codes:R.E.codes},M:{opened:R.M.opened,left:R.M.left||0,codes:R.M.codes}}):null}need(w&&w!=='sudden','برنده مشخص نیست: مرگ ناگهانی (سُر توکن) → برنده را دستی انتخاب کنید');
  s.cas.winner=w;s.state='CASE';log(`CASE WINNER=${w} SEAL=${s.lock.seal} OK`,'',src);V7.moment('case',{w,code:s.lock.code},9);sfx('drumroll',2.4);setTimeout(()=>sfx('fanfare'),2600);return{ok:true}},
 'cas.layer':({n},src,s)=>{n=+n;need(n>=1&&n<=3,'لایه');s.cas.layer=n;s.state='CASE_L'+n;log(`CASE LAYER ${n}`,'',src);V7.moment('layer',{n},4);if(n===1)badgeAdd(s.cas.winner);return{ok:true}},
 'cas.fate':({i,text},src,s)=>{s.cas.fate=text||DATA.FATE[+i]||'';log('CASE FATE',s.cas.fate,src);V7.moment('fate',{text:s.cas.fate},7);return{ok:true}},
 'cas.bite':({n},src,s)=>{n=+n;const b=s.cas.bites;need(!b.revealed,'رونمایی شده');need(b.picks.length<2&&!b.picks.includes(n),'فقط ۲ جعبه');b.picks.push(n);log(`CASE BITE PICK ${n}`,'',src);V7.moment('bite',{n},4);return{ok:true}},
 'cas.biteReveal':(p,src,s)=>{s.cas.bites.revealed=true;log('CASE BITES REVEAL','',src);V7.moment('bitesAll',{picks:s.cas.bites.picks},7);return{ok:true}},
 /* subtitles */
 'subs.toggle':(p,src,s)=>{s.subs.on=!s.subs.on;log('SUBS '+(s.subs.on?'ON':'OFF'),'',src);return{ok:true,msg:'زیرنویس '+(s.subs.on?'روشن':'خاموش')}},
 'subs.set':({k,v},src,s)=>{const allowed=['cps','mode','size','pos','offset','lines','bg','bgA','clean','preset'];if(k.startsWith('sp.')){s.subs.speakers[k.slice(3)]=!!v;return{ok:true}}need(allowed.includes(k),'تنظیم نامعتبر');
  const num={cps:[8,25],size:[24,96],offset:[-2,2],lines:[1,2],bgA:[0,1]};if(num[k])v=E.clamp(+v,num[k][0],num[k][1]);s.subs[k]=v;return{ok:true}},
 'subs.preset':({name},src,s)=>{const P0={main:{size:52,pos:'bottom',lines:2,mode:'all',clean:false,on:true},shorts:{size:64,pos:'custom',lines:2,mode:'word',clean:false,on:true},rehearsal:{size:80,pos:'bottom',lines:2,mode:'karaoke',clean:false,on:true},off:{on:false},clean:{clean:true,on:true}}[name];need(P0,'پریست');Object.assign(s.subs,P0,{preset:name});log('SUBS PRESET '+name,'',src);return{ok:true}},
 /* Gemini cue (TTS through v5 voice engine, subtitle through V7) */
 'gem.say':({key,text,emotion},src)=>{const t=text||DATA.GEMINI[key];need(t,'جمله پیدا نشد');const ln={id:'v7'+uid(),speaker:'host',emotion:emotion||'referee',text:t,direction:''};try{g$('cueLine')(ln)}catch(e){V7.cue(t,'host')}log('GEMINI SAY',t,src);return{ok:true}},
 'misc.sfx':({n})=>{sfx(n);return{ok:true}}
};
V7.ACT=ACT;
function applyAwards(r,tag,src){for(const k of ['E','M'])if(r.awards[k])give(k,r.awards[k],tag+' · '+r.reason,src);const w=Object.keys(r.awards).filter(k=>r.awards[k]>0);w.forEach(k=>V7.moment('award',{k,n:r.awards[k]},2.4))}
function r3Auto(src){const s=S();const x=s.r3;if(x.applied)return;const done=k=>['final','dnf','dq'].includes(x[k].status);if(done('E')&&done('M')){const r=E.r3Result(x);if(!r.needPick)setTimeout(()=>{if(!S().r3.applied)exec('r3.apply',{},{force:true,toast:false})},900)}}
function r4First(s){const c=['E','M'].filter(k=>s.r4.valid[k]&&s.r4.finish[k]!=null);if(!c.length)return null;return c.sort((a,b)=>s.r4.finish[a]-s.r4.finish[b])[0]}
function r4Auto(src){const s=S();const f=r4First(s);if(f&&!s.r4.applied){const o=other(f);if(s.r4.valid[o]){clearTimeout(V7._r4t);V7._r4t=setTimeout(()=>{const s2=S();if(!s2.r4.challenge&&!s2.r4.applied)r4Apply(src)},E.CFG.r4.finalizeAfter*1000)}}}
function r4Apply(src,manual){const s=S();if(s.r4.applied)return;const f=r4First(s);if(!f){if(manual)toast('«تمام» معتبری نیست؛ «هیچ‌کس» را انتخاب کنید');return}if(s.r4.challenge&&!s.r4.challenge.outcome){if(manual)toast('اول نتیجهٔ چالش');return}
 const r=E.r4Result({first:f,challenge:s.r4.challenge&&{by:s.r4.challenge.by,outcome:s.r4.challenge.outcome}});applyAwards(r,'R4',src);s.r4.applied=r;log(`R4 RESULT`,r.reason,src);saveP();emit('change',{})}
const curRun=s=>s.vault.runner?s.vault.runs[s.vault.runner]:null;V7.curRun=()=>curRun(S());
V7.runLeft=(r)=>{if(!r)return 0;const el=r.elapsed+(r.state==='running'?(nowMs()-r.tRun)/1000:0);return Math.max(0,r.clock-el)};
function runEnd(s,r,opened,src){const left=V7.runLeft(r);r.elapsed=r.clock-left;r.state='done';r.opened=opened;r.left=opened?+left.toFixed(1):0;const k=s.vault.runner;
 log(`${s.state} ${k} ${opened?'VAULT OPEN LEFT='+r.left.toFixed(1):'TIMEOUT CODES='+r.codes}`,'',src);sfx(opened?'vault':'buzzer');V7.moment(opened?'vaultOpen':'vaultClosed',{k,left:r.left},4);saveP();emit('change',{})}
async function badgeAdd(w){try{const kv=(await DM.kvGet('v7-badges'))||{E:0,M:0};kv[w]=(kv[w]||0)+1;await DM.kvPut('v7-badges',kv);V7.badges=kv;log(`BADGE ${w} = ${kv[w]}`)}catch(e){}}
V7.loadBadges=async()=>{try{V7.badges=(await DM.kvGet('v7-badges'))||{E:0,M:0}}catch(e){V7.badges={E:0,M:0}}};
function onEnter(st,src){if(st==='TWIST_BANKOPEN')exec('twist.play',{},{force:true,toast:false});if(st==='VAULT_ARMED'&&!S().vault.armed&&S().lock.code)exec('vault.arm',{},{force:true,toast:false})}

/* lock code: only from the desktop panel, never over the network */
V7.setLock=async code=>{const s=S();if(!/^\d{3}$/.test(String(code)))throw new Error('رمز باید ۳ رقم باشد');const salt=Math.random().toString(36).slice(2,10);s.lock={code:String(code),salt,seal:await E.sealCode(code,salt)};log('LOCK SEALED',`SEAL=${s.lock.seal}`);saveP();emit('change',{});return s.lock.seal};

/* ---------------- tick (called every frame from the draw hook) ---------------- */
V7.tick=()=>{const s=S();if(!s)return;const now=nowMs();
 if(s.state==='R3_SANDWICH'&&s.r3.t0&&!s.r3.stopped){const el=(now-s.r3.t0)/1000;for(const k of ['E','M']){const x=s.r3[k];
   if(x.status==='provisional'&&now-x.mouthAt>E.CFG.r3.swallow*1000){x.status='dnf';x.T=60;log(`R3 ${k} NO_EMPTY T=60`);r3Auto()}
   if(x.status==='eating'&&el>=E.CFG.r3.limit){x.status='dnf';x.T=60;log(`R3 ${k} DNF T=60`);r3Auto()}}}
 const r=curRun(s);if(r&&r.state==='running'){if(r.station===2&&r.mem.phase==='show'&&now-r.mem.t0>E.CFG.vault.memShow*1000){r.mem.phase='lock';r.mem.t0=now}
   if(r.station===2&&r.mem.phase==='lock'&&now-r.mem.t0>E.CFG.vault.memLock*1000){r.mem.phase='input';r.mem.t0=now;sfx('ding')}
   if(V7.runLeft(r)<=0)runEnd(s,r,false)}
 const t=performance.now()/1000;V7.moments=V7.moments.filter(m=>t-m.t0<m.dur)};

/* ---------------- snapshot for phones / controller UI ---------------- */
V7.snapshot=(role='DIRECTOR')=>{const s=S();if(!s)return null;const b=V7.banks();const now=nowMs();const P0=Pp();const seg=DM.curSeg?DM.curSeg():null;
 const priv=k=>role==='PLAYER_'+k;const hidePicks=!s.shop.revealed;
 const r3p=k=>{const x=s.r3[k];const el=s.r3.t0?Math.min(60,(now-s.r3.t0)/1000):0;return{status:x.status,T:x.T,penalty:x.penalty,clock:x.status==='eating'?el:x.T,swallowLeft:x.status==='provisional'?Math.max(0,E.CFG.r3.swallow-(now-x.mouthAt)/1000):null}};
 const run=curRun(s);const rd=s.vault.riddleId&&DATA.RIDDLES.find(x=>x.id===s.vault.riddleId);
 return{t:now,role,state:s.state,stateFa:STATE_FA[s.state],states:STATES,names:{E:V7.name('E'),M:V7.name('M')},colors:{E:V7.color('E'),M:V7.color('M')},banks:b,leader:E.leaderOf(b),
  seg:seg?{title:seg.title,type:seg.type,game:seg.game}:null,var:(()=>{try{return !!G().var}catch(e){return false}})(),
  r2:{E:{line:s.r2.E.line,throws:s.r2.E.throws,scored:s.r2.E.scored},M:{line:s.r2.M.line,throws:s.r2.M.throws,scored:s.r2.M.scored}},
  r3:{started:!!s.r3.t0,stopped:s.r3.stopped,E:r3p('E'),M:r3p('M'),applied:s.r3.applied,needPick:!s.r3.applied&&['E','M'].every(k=>['dnf'].includes(s.r3[k].status))},
  r4:{started:!!s.r4.t0,remain:s.r4.t0?Math.max(0,180-(now-s.r4.t0)/1000):180,finish:s.r4.finish,valid:s.r4.valid,lock:{E:Math.max(0,(s.r4.lockUntil.E-now)/1000),M:Math.max(0,(s.r4.lockUntil.M-now)/1000)},first:r4First(s),challenge:s.r4.challenge,applied:s.r4.applied},
  reveal:s.reveal.done,
  shop:{submitted:s.shop.submitted,revealed:s.shop.revealed,events:s.shop.revealed?s.shop.events:[],effects:s.shop.revealed?s.shop.effects:null,
   picks:{E:(!hidePicks||priv('E')||role==='LOCAL_SECRET')?s.shop.picks.E:null,M:(!hidePicks||priv('M')||role==='LOCAL_SECRET')?s.shop.picks.M:null},
   counts:{E:s.shop.picks.E.length,M:s.shop.picks.M.length},order:E.riskOrder(b),
   price:{E:Object.fromEntries(E.CFG.shop.order.map(c=>[c,E.cardPrice(c,'E',b).total])),M:Object.fromEntries(E.CFG.shop.order.map(c=>[c,E.cardPrice(c,'M',b).total]))},
   why:{E:Object.fromEntries(E.CFG.shop.order.map(c=>[c,s.shop.picks.E.includes(c)?'':(E.shopCheck(s.shop.picks,'E',c,b).why||'')])),M:Object.fromEntries(E.CFG.shop.order.map(c=>[c,s.shop.picks.M.includes(c)?'':(E.shopCheck(s.shop.picks,'M',c,b).why||'')]))}},
  risk:{stake:s.risk.stake,result:s.risk.result,options:{E:E.riskOptions('E',b),M:E.riskOptions('M',b)},order:E.riskOrder(b)},
  vault:{armed:s.vault.armed,sealed:!!s.lock.seal,seal:s.lock.seal,order:s.vault.order,runner:s.vault.runner,
   runs:Object.fromEntries(['E','M'].map(k=>{const r=s.vault.runs[k];return[k,r?{state:r.state,left:+V7.runLeft(r).toFixed(1),station:r.station,codes:r.codes,opened:r.opened,mem:r.mem.phase,input:r.station===2?r.input:null,hintUsed:r.hintUsed,riddleLock:Math.max(0,(r.riddleLock-now)/1000),codeLock:Math.max(0,(r.codeLock-now)/1000)}:null]})),
   riddle:(role==='DIRECTOR'||role==='LOCAL'||role==='JUDGE')&&rd&&run&&run.station===3?(s.shop.effects&&s.shop.effects[s.vault.runner]&&s.shop.effects[s.vault.runner].spicy?rd.spicy:rd.normal):null,
   target:(role==='DIRECTOR'||role==='LOCAL')&&s.vault.armed?DATA.TARGETS[s.vault.target].name:null,effects:s.shop.revealed?s.shop.effects:null},
  cas:{winner:s.cas.winner,layer:s.cas.layer,fate:s.cas.fate,bites:s.cas.bites},fate:DATA.FATE,
  subs:s.subs,next:(()=>{try{const sg=DM.curSeg&&DM.curSeg();const st0=ST();const ln=sg&&sg.lines&&sg.lines[Math.max(0,st0.lineK+1)];return ln?ln.text:''}catch(e){return ''}})(),
  gem:Object.keys(DATA.GEMINI)}};

/* ---------------- draw hook (paints on the recorded canvas) ---------------- */
function hookDraw(){if(window.__v7draw)return;const d0=g$('draw');if(typeof d0!=='function')return setTimeout(hookDraw,200);window.__v7draw=1;
 const wrapped=function(){const st0=ST();const s=S();let saved=null;
  if(s&&s.enabled&&s.subs.on!==undefined&&st0&&st0.line){saved=st0.line;st0.line=Object.assign({},saved,{text:''})} // V7 owns subtitles: legacy caption gets an empty string
  try{d0.apply(this,arguments)}finally{if(saved)st0.line=saved}
  try{V7.tick();if(s&&s.enabled&&window.V7Stage)V7Stage.post()}catch(e){if(!V7._perr){V7._perr=1;console.error('[V7] overlay',e)}}};
 try{draw=wrapped}catch(e){window.draw=wrapped}}
V7.cue=(text,speaker='app',dur)=>{V7.extraCue={text,speaker,t0:performance.now()/1000,dur:dur||E.subDuration(text,(S()||{subs:{cps:15}}).subs.cps)}};

/* ---------------- keyboard (§9.5) — only inside V7 states; v5 keys untouched elsewhere ---------------- */
function keys(e){const s=S();if(!s||!s.enabled)return;if(e.target&&e.target.matches&&e.target.matches('input,textarea,select,[contenteditable]'))return;if(e.ctrlKey||e.metaKey||e.altKey)return;
 const k=e.key;let act=null,p={};const st=s.state;
 if(k==='c'||k==='C'){if(e.shiftKey){const order=['main','shorts','rehearsal','off'];const i=(order.indexOf(s.subs.preset)+1)%order.length;act='subs.preset';p={name:order[i]}}else act='subs.toggle'}
 else if(k===']'&&!e.shiftKey){act='subs.set';p={k:'cps',v:s.subs.cps+1}}else if(k==='['&&!e.shiftKey){act='subs.set';p={k:'cps',v:s.subs.cps-1}}
 else if(k==='}'||(k===']'&&e.shiftKey)){act='subs.set';p={k:'offset',v:+(s.subs.offset+.1).toFixed(1)}}else if(k==='{'||(k==='['&&e.shiftKey)){act='subs.set';p={k:'offset',v:+(s.subs.offset-.1).toFixed(1)}}
 else if(k==='='||k==='+'){act='subs.set';p={k:'size',v:s.subs.size+4}}else if(k==='-'){act='subs.set';p={k:'size',v:s.subs.size-4}}
 else if(k==='F2'){V7.emit('qr');e.preventDefault();return}
 else if(st==='R3_SANDWICH'){act={7:'r3.mouth',9:'r3.mouth',1:'r3.empty',3:'r3.empty',4:'r3.penalty',6:'r3.penalty'}[k];p={p:{7:'E',9:'M',1:'E',3:'M',4:'E',6:'M'}[k]}}
 else if(st==='R4_GLUE'){if(k==='1'||k==='2'){act='r4.finish';p={p:k==='1'?'E':'M'}}else if(k==='0'){const s4=s.r4;const pend=['E','M'].filter(x=>s4.finish[x]!=null&&!s4.valid[x]);if(pend.length){act='r4.wrong';p={p:pend.sort((a,b)=>s4.finish[b]-s4.finish[a])[0]}}}else if(k==='*'){const f=r4First(s);if(f){act='r4.challenge';p={p:other(f)}}}}
 else if(st==='SHOP'&&/^[4-8]$/.test(k)){const who=s.shop.submitted[s.shop.order?0:0]?null:null;const order=E.riskOrder(V7.banks());const turn=!s.shop.submitted[order[0]]?order[0]:order[1];act='shop.pick';p={p:turn,card:E.CFG.shop.order[+k-4]}}
 if(!act)return;e.preventDefault();e.stopImmediatePropagation();const r=exec(act,p,{role:'LOCAL',src:'key'});if(r&&r.ok===false)toast(r.msg)}

/* ---------------- boot ---------------- */
function boot(){upgradeData();hookDraw();addEventListener('keydown',keys,true);V7.loadBadges();
 const s=S();if(s&&Pp().v7&&Pp().v7.enabled===undefined)s.enabled=true;emit('ready');console.log('%c DADASHMODE V7 ready ','background:#ffc53d;color:#000;font-weight:900')}
if(DM.whenReady)DM.whenReady(['P','st','draw','award','bankOf','mkSeg'],boot);else setTimeout(boot,800);
})();
