/* DADASHMODE V7 · broadcast graphics layer (paints on the SAME recorded 1920x1080 canvas, after v5 draw()).
   - subtitles engine (Director Book §9.3): on/off, per-speaker, cps 8–25, modes all/word/typewriter/karaoke,
     offset ±2s, size 24–96, top/bottom/custom, 1–2 balanced lines ≤42 chars, speaker colours, gold keywords,
     bg none/shadow/box, clean-record, collision avoidance with V7 HUDs
   - "moments": MrBeast / Beast-Games style juice (slam-in 200ms w/ ~10% overshoot, 80ms flash, 2–6px shake,
     count-up numerals, safe areas 3.5% action / 5% title per EBU R95)
   - per-state live HUDs (R2, R3 sandwich, R4 glue, shop, risk, vault runs, memory room, riddle)
   - ILL overrides incl. the FIXED distance illustration: farther line = more seconds (2m +5 · 3m +10 · 4m +20) */
'use strict';
(function(){
const $=n=>{try{return eval(n)}catch(e){return undefined}};
const W=1920,H=1080,SAFE_X=W*.05,SAFE_Y=H*.05;
const Y='#ffd400',GOLD='#ffc53d',ORANGE='#ff7a1a',INK='#fffaf0',NAVY='#050914',PURPLE='#b98cff',RED='#ff2738',GREEN='#00c98d';
let X=null;const need=['g','cv','TH','F','UF','hexA','mix','eo','ph','cl','fa','rr','fit','bigText','chip','panel','rays','vIcon','ILL','DIST','st','P'];
function H$(){if(X&&X.g)return X;const o={};for(const n of need)o[n]=$(n);if(!o.g||!o.cv)return null;X=o;return X}
const now=()=>performance.now()/1000;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const easeOutBack=(x,c1=1.70158)=>{x=clamp(x,0,1);const c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)};
const easeOut=x=>1-Math.pow(1-clamp(x,0,1),3);
const faN=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const sec1=v=>faN((Math.round(v*10)/10).toFixed(1));
const col=k=>window.V7?V7.color(k):(k==='E'?RED:GREEN);
const nm=k=>window.V7?V7.name(k):k;
let ctx=null;
function hexA(c,a){try{return X.hexA(c,a)}catch(e){return c}}
/* ---------- primitives ---------- */
function font(size,w=900){return `${w} ${size}px Vazirmatn, Tahoma, sans-serif`}
function dfont(size){try{return X.F(size)}catch(e){return font(size)}}
function rrect(x,y,w,h,r){ctx.beginPath();r=Math.min(r,h/2,w/2);ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function glass(x,y,w,h,r=28,edge=GOLD,a=.72){ctx.save();rrect(x,y,w,h,r);const lg=ctx.createLinearGradient(0,y,0,y+h);lg.addColorStop(0,hexA('#16244f',a));lg.addColorStop(1,hexA(NAVY,a+.12));ctx.fillStyle=lg;ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=40;ctx.shadowOffsetY=14;ctx.fill();ctx.shadowColor='transparent';ctx.lineWidth=3;ctx.strokeStyle=hexA(edge,.85);ctx.stroke();
 rrect(x+3,y+3,w-6,h*.42,r-3);const hl=ctx.createLinearGradient(0,y,0,y+h*.42);hl.addColorStop(0,'rgba(255,255,255,.10)');hl.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=hl;ctx.fill();ctx.restore()}
/* MrBeast-style display text: heavy stroke, hard drop, optional glow; RTL */
function slab(txt,x,y,size,o={}){ctx.save();ctx.font=o.font||dfont(size);ctx.textAlign=o.align||'center';ctx.textBaseline='middle';ctx.direction=/^[+−\-]?[۰-۹0-9.:٫]+s?$/.test(String(txt).trim())?'ltr':'rtl';ctx.lineJoin='round';ctx.globalAlpha*=o.alpha??1;
 if(o.maxW){const w=ctx.measureText(txt).width;if(w>o.maxW){size=size*o.maxW/w;ctx.font=o.font?o.font.replace(/\d+px/,Math.floor(size)+'px'):dfont(size)}}
 const d=o.depth??Math.round(size*.08);ctx.fillStyle=o.shade||'#000';for(let i=d;i>0;i-=2)ctx.fillText(txt,x,y+i);
 ctx.lineWidth=size*(o.sw??.16);ctx.strokeStyle=o.stroke||'#000';ctx.strokeText(txt,x,y);
 if(o.glow){ctx.shadowColor=o.glow;ctx.shadowBlur=size*.5}
 if(o.grad){const lg=ctx.createLinearGradient(0,y-size/2,0,y+size/2);lg.addColorStop(0,o.grad[0]);lg.addColorStop(1,o.grad[1]);ctx.fillStyle=lg}else ctx.fillStyle=o.fill||INK;
 ctx.fillText(txt,x,y);ctx.restore();return size}
function pill(txt,x,y,size,bg,fg,a=1){ctx.save();ctx.globalAlpha*=a;ctx.font=font(size);ctx.direction='rtl';const w=ctx.measureText(txt).width+size*1.3,h=size*1.8;rrect(x-w/2,y-h/2,w,h,h/2);ctx.fillStyle=bg;ctx.fill();ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,x,y+size*.05);ctx.restore();return w}
function ring(x,y,r,p,c,w=12,bg='rgba(255,255,255,.12)'){ctx.save();ctx.lineCap='round';ctx.lineWidth=w;ctx.strokeStyle=bg;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=c;ctx.beginPath();ctx.arc(x,y,r,-Math.PI/2,-Math.PI/2+Math.PI*2*clamp(p,0,1));ctx.stroke();ctx.restore()}
function flash(a,c='#fff'){if(a<=0)return;ctx.save();ctx.globalAlpha=clamp(a,0,1);ctx.fillStyle=c;ctx.fillRect(0,0,W,H);ctx.restore()}
function burst(x,y,t,c,n=16,R=420){if(t<0||t>1)return;ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(x,y);for(let i=0;i<n;i++){const a=i/n*Math.PI*2;const r0=R*.25*easeOut(t),r1=R*easeOut(t);ctx.strokeStyle=hexA(c,(1-t)*.9);ctx.lineWidth=10*(1-t)+2;ctx.beginPath();ctx.moveTo(Math.cos(a)*r0,Math.sin(a)*r0);ctx.lineTo(Math.cos(a)*r1,Math.sin(a)*r1);ctx.stroke()}ctx.restore()}
function sparks(x,y,t,c,n=40){if(t<0||t>1.4)return;ctx.save();for(let i=0;i<n;i++){const a=(i*137.5)*Math.PI/180,sp=300+((i*97)%400);const px=x+Math.cos(a)*sp*t,py=y+Math.sin(a)*sp*t+420*t*t;ctx.globalAlpha=clamp(1.2-t,0,1);ctx.fillStyle=i%3?c:'#fff';ctx.fillRect(px-4,py-4,8,8)}ctx.restore()}
function shake(amp,t){return amp>0?[Math.sin(t*93)*amp,Math.cos(t*71)*amp]:[0,0]}
/* slam-in: 0→1.12→1 in ~220ms (≈10% overshoot) */
const slamK=a=>a<=0?0:easeOutBack(a/.22,2.2);
/* ---------- subtitles ---------- */
const SUB={id:null,t0:0,ln:null};
const SP_COL=k=>({host:PURPLE,gemini:PURPLE,E:RED,M:GREEN,elias:RED,emad:GREEN,app:GOLD}[k]||INK);
function speakerKey(sp){if(!sp||sp==='host')return 'host';try{const p=X.P;if(p.players[0]&&sp===p.players[0].id)return 'E';if(p.players[1]&&sp===p.players[1].id)return 'M'}catch(e){}return sp==='E'||sp==='M'?sp:'app'}
function tokenize(text){/* words + keyword flag: numbers, «quoted», +N */const out=[];let q=false;for(const w of String(text).split(/\s+/).filter(Boolean)){const open=w.includes('«'),close=w.includes('»');const kw=q||open||/[0-9۰-۹]/.test(w)||/^[+−-]/.test(w);if(open&&!close)q=true;if(close)q=false;out.push({w,kw})}return out}
function chunkText(text,max,lines){/* split long text into subtitle events of ≤ lines×max chars */const words=String(text).split(/\s+/).filter(Boolean);const cap=max*lines;const out=[];let cur='';for(const w of words){const t=cur?cur+' '+w:w;if(t.length>cap&&cur){out.push(cur);cur=w}else cur=t}if(cur)out.push(cur);return out}
function currentCue(ss){const st=X.st;const t=now();let c=null;
 if(window.V7&&V7.extraCue){const e=V7.extraCue;if(t-e.t0<e.dur+.2)c={id:'x'+e.t0,text:e.text,sp:e.speaker,t0:e.t0,dur:e.dur};else V7.extraCue=null}
 if(!c&&st&&st.line&&st.line.text){const ln=st.line;const id=ln.id||ln.text;if(SUB.id!==id){SUB.id=id;SUB.t0=t}let dur=+st.lineDur||0;if(dur>200)dur/=1000;c={id,text:ln.text,sp:ln.speaker,t0:SUB.t0,dur:dur>0?dur:null}}
 if(!c){SUB.id=null;return null}
 const tt=t-c.t0-(ss.offset||0);if(tt<0)return null;
 const chunks=chunkText(c.text,42,ss.lines||2);const E=V7.E;const durs=chunks.map(x=>E.subDuration(x,ss.cps));let total=durs.reduce((a,b)=>a+b,0);
 const scale=c.dur&&chunks.length>1?c.dur/total:1;let acc=0;for(let i=0;i<chunks.length;i++){const d=durs[i]*scale;if(tt<acc+d||i===chunks.length-1){if(!c.dur&&tt>acc+d+.25&&c.id[0]==='x')return null;return{text:chunks[i],sp:c.sp,age:tt-acc,dur:d,idx:i,n:chunks.length}}acc+=d}return null}

const SL={key:null,cur:null};
function logCue(cue){const key=cue?cue.text+'|'+cue.idx:null;if(key===SL.key)return;const t=Date.now();if(SL.cur){SL.cur.e=t;SL.cur=null}SL.key=key;if(cue){SL.cur={s:t,e:null,text:cue.text,speaker:speakerKey(cue.sp)};(V7.subLog=V7.subLog||[]).push(SL.cur);if(V7.subLog.length>3000)V7.subLog.shift()}}
function drawSubs(ss,avoid){if(!ss)return;const cue=currentCue(ss);logCue(cue);if(!ss.on||ss.clean||!cue)return;const k=speakerKey(cue.sp);const spk=ss.speakers||{};if(spk[k]===false)return;
 const size=clamp(ss.size||52,24,96);const lines=V7.E.wrapLines(cue.text,42,ss.lines||2).slice(0,ss.lines||2);const toks=lines.map(tokenize);
 const all=toks.flat().length;const cps=ss.cps||15;const age=cue.age;
 let shownChars=Infinity,activeWord=-1;const mode=ss.mode||'all';
 if(mode==='typewriter')shownChars=Math.floor(age*cps*1.6);
 if(mode==='word'||mode==='karaoke'){let acc=0;const per=[];toks.flat().forEach(t=>{per.push(acc);acc+=(t.w.length+1)/(cps*1.25)});activeWord=per.filter(x=>x<=age).length-1}
 ctx.save();ctx.font=font(size,900);ctx.direction='rtl';ctx.textBaseline='middle';
 const lh=size*1.32;const blockH=lh*lines.length;let yc;
 if(ss.pos==='top')yc=SAFE_Y+80+blockH/2;else if(ss.pos==='custom')yc=H*.70;else yc=H-SAFE_Y-40-blockH/2-(avoid||0);
 const fadeIn=easeOut(age/.12);const out=cue.dur?clamp((cue.dur-age)/.15,0,1):1;ctx.globalAlpha=fadeIn*Math.max(.001,out);
 const spc=ctx.measureText(' ').width;const widths=toks.map(ln=>ln.map(t=>ctx.measureText(t.w).width));const lw=widths.map(ws=>ws.reduce((a,b)=>a+b,0)+spc*(ws.length-1));const maxW=Math.max(...lw);
 if(ss.bg==='box'){ctx.save();ctx.globalAlpha*=ss.bgA??.55;rrect(W/2-maxW/2-size*.6,yc-blockH/2-size*.25,maxW+size*1.2,blockH+size*.5,size*.35);ctx.fillStyle='#000';ctx.fill();ctx.restore()}
 /* speaker tag (colour identity) */
 const tag={host:'جِمنای',E:nm('E'),M:nm('M'),app:''}[k];if(tag&&k!=='app'){ctx.save();ctx.font=font(size*.42,900);const tw=ctx.measureText(tag).width+size*.6;const tx=W/2+maxW/2-tw/2,ty=yc-blockH/2-size*.55;rrect(tx-tw/2,ty-size*.3,tw,size*.6,size*.3);ctx.fillStyle=SP_COL(k);ctx.fill();ctx.fillStyle='#0b0b12';ctx.textAlign='center';ctx.fillText(tag,tx,ty+1);ctx.restore()}
 let wi=0,ci=0;
 lines.forEach((ln,li)=>{const y=yc-blockH/2+lh*(li+.5);let x=W/2+lw[li]/2;/* RTL: first word at the right */
  toks[li].forEach((t,j)=>{const w=widths[li][j];const myIdx=wi++;const startC=ci;ci+=t.w.length+1;
   let txt=t.w;if(mode==='typewriter'){if(startC>=shownChars){x-=w+spc;return}const vis=shownChars-startC;if(vis<t.w.length)txt=t.w.slice(0,vis)}
   if(mode==='word'&&myIdx>activeWord){x-=w+spc;return}
   let sc=1,a=1;if(mode==='word'&&myIdx===activeWord){const wa=(age%1);sc=1+.12*Math.max(0,1-wa*6)}
   const kar=mode==='karaoke';const lit=!kar||myIdx<=activeWord;
   const fill=t.kw?GOLD:(k==='app'?INK:(lit?INK:'rgba(255,255,255,.45)'));
   ctx.save();ctx.translate(x-w/2,y);ctx.scale(sc,sc);ctx.textAlign='center';ctx.lineJoin='round';
   if(ss.bg!=='none'){ctx.shadowColor='rgba(0,0,0,.85)';ctx.shadowBlur=size*.28;ctx.shadowOffsetY=size*.06}
   ctx.lineWidth=size*.14;ctx.strokeStyle='rgba(0,0,0,.92)';ctx.strokeText(txt,0,0);ctx.shadowColor='transparent';
   if(kar&&myIdx===activeWord){ctx.shadowColor=SP_COL(k);ctx.shadowBlur=size*.5}
   ctx.fillStyle=kar&&myIdx===activeWord?SP_COL(k):fill;ctx.fillText(txt,0,0);ctx.restore();
   if(kar&&myIdx===activeWord){ctx.save();ctx.fillStyle=SP_COL(k);ctx.fillRect(x-w,y+size*.55,w,size*.08);ctx.restore()}
   x-=w+spc})});
 ctx.restore()}
/* ---------- moments ---------- */
const MOM={};const EVFA={ACTIVE:'فعال شد',BLOCKED:'🛡 سپر خنثی کرد',BOUNCED:'🪞 آینه برگرداند',BURNED:'🔥 استفاده‌نشده سوخت'};const CFA=c=>(V7.E.CFG.shop.cards[c]||{fa:c}).fa;const evTxt=e=>`${CFA(e.card)}${e.buyer?' · '+nm(e.buyer):''}${e.target&&e.target!==e.buyer?' → '+nm(e.target):''} · ${EVFA[e.label]||e.label}`;
MOM.award=(m,t)=>{const k=m.data.k,n=m.data.n;const a=slamK(t);const cx=k==='E'?W*.28:W*.72;const cy=H*.42;if(t<.09)flash(.35*(1-t/.09),Y);burst(cx,cy,t/.7,Y);
 const cnt=Math.round(n*easeOut(t/.6));ctx.save();ctx.translate(cx,cy-40*(1-a));ctx.scale(a,a);slab('+'+faN(cnt),0,0,260,{fill:Y,glow:hexA(Y,.6),depth:14});ctx.restore();
 slab('ثانیه به بانک '+nm(k),cx,cy+170,54,{fill:INK,alpha:easeOut((t-.25)/.3),maxW:760});sparks(cx,cy,t,col(k))};
MOM.lock=(m,t)=>{const k=m.data.k,L=V7.E.CFG.r2.lines[m.data.line];const a=slamK(t);const cx=k==='E'?W*.28:W*.72;ctx.save();ctx.translate(cx,H*.46);ctx.scale(a,a);glass(-300,-120,600,240,34,col(k));slab('🔒 '+faN(L.m)+' متر',0,-30,92,{fill:INK});slab('+'+faN(L.sec)+' ثانیه اگر گل شود',0,64,40,{fill:Y,depth:4});ctx.restore()};
MOM.throw=(m,t)=>{const k=m.data.k;const L=V7.E.CFG.r2.lines[m.data.line]||{m:3,sec:10};const cx=k==='E'?W*.28:W*.72;const a=slamK(t);
 if(m.data.hit){if(t<.08)flash(.4,'#fff');burst(cx,H*.4,t/.6,Y,20);ctx.save();ctx.translate(cx,H*.4);ctx.scale(a,a);slab('گُل!',0,-40,210,{grad:[Y,ORANGE],glow:hexA(Y,.5)});slab('از '+faN(L.m)+' متر · +'+faN(L.sec),0,110,56,{fill:INK});ctx.restore()}
 else{const[dx]=shake(6*(1-t),t);ctx.save();ctx.translate(cx+dx,H*.42);ctx.scale(a,a);slab('نخورد',0,0,150,{fill:'#c9ccd6',depth:8});ctx.restore()}};
MOM.safety=(m,t)=>{const p=.5+.5*Math.sin(t*12);ctx.save();ctx.fillStyle=hexA('#c40018',.28+.18*p);ctx.fillRect(0,0,W,H);ctx.restore();slab('«قرمز» · توقف ایمنی',W/2,H/2-30,120,{fill:'#fff',glow:'#ff0033'});slab('همهٔ ساعت‌ها ایستاد',W/2,H/2+90,50,{fill:INK})};
MOM.bankopen=(m,t)=>{/* gold glitch → 5 locked cards dealt → zoom to gloves (6s) */const gl=t<1.2;ctx.save();ctx.fillStyle=hexA(NAVY,clamp(t/.3,0,.86));ctx.fillRect(0,0,W,H);ctx.restore();
 if(gl){for(let i=0;i<14;i++){const y=((i*131+Math.floor(t*30)*57)%H);ctx.save();ctx.globalAlpha=.55;ctx.fillStyle=i%2?GOLD:ORANGE;ctx.fillRect(((i*383)%600)-300+Math.sin(t*40+i)*80,y,W,4+(i%4)*6);ctx.restore()}}
 const tk=slamK(t-.35);ctx.save();ctx.translate(W/2+(gl?Math.sin(t*70)*10:0),250);ctx.scale(tk,tk);slab('بانک باز شد',0,0,170,{grad:['#fff3b0',GOLD],glow:hexA(GOLD,.7),depth:12});ctx.restore();
 const cards=V7.E.CFG.shop.order;cards.forEach((c,i)=>{const d=V7.E.CFG.shop.cards[c];const p=easeOutBack((t-1.2-i*.18)/.45);if(p<=0)return;const x=W/2+(i-2)*300,y=640+(1-p)*500;const cc={blue:'#2f8cff',red:'#ff3b4e',gold:GOLD}[d.color];
  ctx.save();ctx.translate(x,y);ctx.rotate((i-2)*.06*(1-p*.3));glass(-120,-170,240,340,24,cc,.9);ctx.fillStyle=cc;rrect(-108,-158,216,50,14);ctx.fill();slab(d.fa,0,-133,34,{fill:'#0b0b12',stroke:'rgba(0,0,0,0)',depth:0,sw:0});slab(faN(d.cost)+'s',0,-20,84,{fill:INK});slab(d.line,0,70,24,{fill:INK,depth:2,maxW:210});
  if(t<5)slab('🔒',0,130,46,{fill:INK,depth:0});ctx.restore()});
 if(t>5.2){const z=easeOut((t-5.2)/.8);ctx.save();ctx.globalAlpha=z;slab('🥊 دستکش بوکس · کارت قرمز',W/2,960,56,{fill:'#ff5566'});ctx.restore()}};
MOM.stamp=(m,t)=>{const k=m.data.k;const a=easeOutBack(t/.2,3);const cx=k==='E'?W*.28:W*.72;ctx.save();ctx.translate(cx,H*.44);ctx.rotate(-.12);ctx.scale(2.2-1.2*a,2.2-1.2*a);ctx.globalAlpha=clamp(t/.08,0,1);const c=m.data.bad?'#ff3b4e':GREEN;ctx.lineWidth=14;ctx.strokeStyle=c;rrect(-230,-90,460,180,24);ctx.stroke();slab(m.data.text,0,6,110,{fill:c,stroke:'#000'});ctx.restore()};
MOM.challenge=(m,t)=>{const k=m.data.k;const p=.5+.5*Math.sin(t*6);glass(W/2-520,110,1040,150,30,Y);slab('⚖️ چالش چسب · '+nm(k),W/2,165,64,{fill:Y});slab('تکه را برعکس بگیرید: اولی که بیفتد، می‌بازد',W/2,225,30,{fill:INK,depth:2,alpha:.7+.3*p})};
MOM.reveal=(m,t)=>{const b=m.data.banks,cap=m.data.cap;ctx.save();ctx.fillStyle=hexA(NAVY,clamp(t/.3,0,.8));ctx.fillRect(0,0,W,H);ctx.restore();
 ['E','M'].forEach((k,i)=>{const cx=i?W*.7:W*.3;const v=b[k]*easeOut((t-.3)/1.4);const a=slamK(t-.2-i*.12);ctx.save();ctx.translate(cx,H*.44);ctx.scale(a,a);glass(-300,-190,600,380,40,col(k));slab(nm(k),0,-120,56,{fill:col(k)});slab(faN(Math.round(v)),0,20,190,{fill:INK,glow:hexA(col(k),.4)});slab('ثانیه',0,140,40,{fill:INK,depth:2});ctx.restore()});
 const gp=easeOut((t-1.9)/.4);if(gp>0){pill('فاصله: '+faN(cap.gap)+' ثانیه',W/2,H*.8,40,cap.apply?'#ff3b4e':'#1d2c5c',INK,gp);if(cap.apply&&t>2.4)slab('سقف ۳۰ اعمال شد · +'+faN(cap.delta)+' به '+nm(cap.trailer),W/2,H*.9,48,{fill:Y,alpha:easeOut((t-2.4)/.3)})}};
MOM.shopReveal=(m,t)=>{ctx.save();ctx.fillStyle=hexA(NAVY,clamp(t/.3,0,.85));ctx.fillRect(0,0,W,H);ctx.restore();slab('رونمایی کارت‌ها',W/2,130,96,{grad:['#fff3b0',GOLD]});
 ['E','M'].forEach((k,i)=>{const cx=i?W*.73:W*.27;slab(nm(k),cx,250,50,{fill:col(k)});const ps=m.data.picks[k]||[];if(!ps.length)slab('بدون خرید',cx,480,48,{fill:'#9aa3b8'});
  ps.forEach((c,j)=>{const d=V7.E.CFG.shop.cards[c];const p=easeOutBack((t-.5-j*.4-i*.2)/.4);if(p<=0)return;const flip=Math.abs(Math.cos(clamp(p,0,1)*Math.PI/2+Math.PI/2));const x=cx+(j-(ps.length-1)/2)*260;const cc={blue:'#2f8cff',red:'#ff3b4e',gold:GOLD}[d.color];ctx.save();ctx.translate(x,500);ctx.scale(Math.max(.05,flip),1);glass(-110,-150,220,300,22,cc,.92);slab(d.fa,0,-40,44,{fill:cc,maxW:190});slab(faN(d.cost)+'s',0,50,60,{fill:INK});ctx.restore()})});
 (m.data.events||[]).forEach((e,i)=>{const a=easeOut((t-2.4-i*.7)/.3);if(a>0)pill(evTxt(e),W/2,800+i*70,32,'#1d2c5c',Y,a)})};
MOM.stake=(m,t)=>{const k=m.data.k,v=m.data.stake;const a=slamK(t);const cx=k==='E'?W*.28:W*.72;ctx.save();ctx.translate(cx,H*.45);ctx.scale(a,a);slab(v===30?'همه‌چی · ۳۰':('شرط '+faN(v)),0,0,v===30?120:140,{fill:v===30?Y:INK,glow:v===30?hexA(ORANGE,.7):null});ctx.restore();if(v===30&&t<.1)flash(.3,ORANGE)};
MOM.risk=(m,t)=>{const k=m.data.k,d=m.data.d;const cx=k==='E'?W*.28:W*.72;const a=slamK(t);if(m.data.hit&&t<.08)flash(.35,Y);const[dx,dy]=shake(m.data.hit?0:5*(1-t),t);ctx.save();ctx.translate(cx+dx,H*.42+dy);ctx.scale(a,a);slab(m.data.hit?'خورد!':'نخورد',0,-50,150,{fill:m.data.hit?Y:'#c9ccd6'});slab((d>=0?'+':'−')+faN(Math.abs(d)),0,90,110,{fill:d>0?GREEN:(d<0?'#ff3b4e':INK)});ctx.restore()};
MOM.target=(m,t)=>{const a=slamK(t);const left=Math.max(0,m.dur-t);glass(W/2-460,H/2-220,920,440,40,Y,.9);slab('هدف نقاشی',W/2,H/2-140,44,{fill:Y,depth:3});ctx.save();ctx.translate(W/2,H/2);ctx.scale(a,a);slab(m.data.word,0,0,190,{fill:INK});ctx.restore();ring(W/2,H/2+160,34,left/m.dur,Y,10);slab(faN(Math.ceil(left)),W/2,H/2+162,34,{fill:INK,depth:0})};
MOM.code=(m,t)=>{const a=slamK(t);if(t<.08)flash(.4,Y);glass(W/2-300,H/2-230,600,460,40,Y,.92);slab('کد '+['','اول','دوم','سوم'][m.data.slot],W/2,H/2-150,56,{fill:Y});ctx.save();ctx.translate(W/2,H/2+30);ctx.scale(a,a);slab(faN(m.data.digit),0,0,280,{fill:INK,glow:hexA(Y,.6)});ctx.restore();ring(W/2,H/2+180,26,1-t/m.dur,Y,8)};
MOM.memWrong=(m,t)=>{const[dx]=shake(6*(1-t/.3),t);ctx.save();ctx.translate(dx,0);slab(faN(m.data.n)+' از ۸',W/2,H*.4,170,{fill:'#ff3b4e'});slab('−۳ ثانیه',W/2,H*.4+140,64,{fill:INK});ctx.restore()};
MOM.memOk=(m,t)=>{burst(W/2,H*.45,t/.6,GREEN);slab('۸ از ۸',W/2,H*.45,180,{fill:GREEN,alpha:easeOut(t/.15)})};
MOM.hint=(m,t)=>{glass(W/2-500,120,1000,140,30,'#2f8cff');slab('🔎 ذره‌بین · راهنمای معما',W/2,190,56,{fill:'#7fbaff'})};
MOM.reflash=(m,t)=>{const d=m.data.d;glass(W/2-420,H/2-160,840,320,36,'#ff3b4e',.92);slab('کد غلط · قفل ۵ ثانیه',W/2,H/2-90,50,{fill:'#ff6b7a'});[d.C1,d.C2,d.C3].forEach((v,i)=>slab(faN(v),W/2+(1-i)*180,H/2+40,150,{fill:INK,alpha:easeOut((t-i*.15)/.2)}))};
MOM.vaultOpen=(m,t)=>{if(t<.1)flash(.5,'#fff3b0');try{X.rays(W/2,H/2,t,easeOut(t/.6),GOLD,18)}catch(e){}slab('گاوصندوق باز شد',W/2,H*.4,130,{grad:['#fff3b0',GOLD]});slab('باقی‌مانده: '+sec1(m.data.left)+' ثانیه',W/2,H*.4+140,64,{fill:INK});sparks(W/2,H*.4,t,GOLD,60)};
MOM.vaultClosed=(m,t)=>{ctx.save();ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillRect(0,0,W,H);ctx.restore();slab('زمان تمام شد',W/2,H*.44,140,{fill:'#ff3b4e'})};
MOM.case=(m,t)=>{ctx.save();ctx.fillStyle=hexA(NAVY,clamp(t/.4,0,.9));ctx.fillRect(0,0,W,H);ctx.restore();const w=m.data.w;const drum=t<2.4;
 if(drum){const p=.5+.5*Math.sin(t*20);slab('برندهٔ کیف...',W/2,H*.45,130,{fill:INK,alpha:.6+.4*p})}else{const tt=t-2.4;if(tt<.1)flash(.6,GOLD);try{X.rays(W/2,H*.42,t,1,col(w),20)}catch(e){}const a=slamK(tt);ctx.save();ctx.translate(W/2,H*.42);ctx.scale(a,a);slab('👑 '+nm(w),0,0,200,{fill:col(w),glow:hexA(col(w),.6)});ctx.restore();slab('رمز کیف: '+faN(m.data.code||''),W/2,H*.66,60,{fill:Y,alpha:easeOut((tt-.4)/.3)});sparks(W/2,H*.42,tt,GOLD,70)}};
MOM.layer=(m,t)=>{const n=m.data.n;const a=slamK(t);ctx.save();ctx.translate(W/2,H*.2);ctx.scale(a,a);pill('لایهٔ '+faN(n)+' · '+['','تاج و نشان ساندویچ طلایی','پاکت سرنوشت','مجازات لقمهٔ مرموز'][n],0,0,46,GOLD,'#0b0b12');ctx.restore()};
MOM.fate=(m,t)=>{const o=easeOut((t-.3)/.6);glass(W/2-640,H/2-200,1280,400,40,GOLD,.94);slab('✉️ پاکت سرنوشت',W/2,H/2-120,52,{fill:GOLD});ctx.save();ctx.globalAlpha=o;slab(m.data.text,W/2,H/2+40,58,{fill:INK,maxW:1160});ctx.restore()};
MOM.bite=(m,t)=>{slab('جعبهٔ '+faN(m.data.n)+' انتخاب شد',W/2,H*.85,56,{fill:Y,alpha:easeOut(t/.2)})};
MOM.bitesAll=(m,t)=>{ctx.save();ctx.fillStyle=hexA(NAVY,.85);ctx.fillRect(0,0,W,H);ctx.restore();slab('لقمهٔ مرموز',W/2,120,80,{grad:['#fff3b0',GOLD]});V7.DATA.BITES.forEach((b,i)=>{const x=W/2+((i%3)-1)*420,y=380+Math.floor(i/3)*330;const p=easeOutBack((t-.3-i*.2)/.4);if(p<=0)return;const picked=(m.data.picks||[]).includes(b.n);ctx.save();ctx.translate(x,y);ctx.scale(p,p);glass(-180,-130,360,260,26,picked?'#ff3b4e':GOLD,.92);slab(faN(b.n),0,-80,50,{fill:picked?'#ff6b7a':GOLD});slab(b.fa,0,0,40,{fill:INK,maxW:330});slab(b.note,0,70,24,{fill:'#aab3c8',depth:1,maxW:330});ctx.restore()})};
const SLOT=new Set(['award','lock','throw','stamp','stake','risk']);
function drawMoments(){const t=now();const last={};V7.moments.forEach((m,i)=>{if(SLOT.has(m.kind))last[m.data.k]=i});V7.moments.forEach((m,i)=>{if(SLOT.has(m.kind)&&last[m.data.k]!==i)return;const f=MOM[m.kind];if(f)try{ctx.save();f(m,t-m.t0);ctx.restore()}catch(e){ctx.restore()}})}
/* ---------- live HUDs per state ---------- */
function hudBar(k,x,y,w,title,big,sub,c){glass(x,y,w,170,30,c||col(k));slab(nm(k),x+w-30,y+40,34,{align:'right',fill:col(k),depth:2});if(title)slab(title,x+30,y+40,28,{align:'left',fill:'#aab3c8',depth:0});slab(big,x+w/2,y+100,78,{fill:INK});if(sub)slab(sub,x+w/2,y+150,24,{fill:'#aab3c8',depth:0})}
const HUD={};let AVOID=0;
HUD.R2=s=>{['E','M'].forEach((k,i)=>{const d=s.r2[k];const L=d.line?V7.E.CFG.r2.lines[d.line]:null;const x=i?W-SAFE_X-520:SAFE_X;glass(x,H-SAFE_Y-190,520,170,28,col(k));slab(nm(k),x+490,H-SAFE_Y-150,34,{align:'right',fill:col(k),depth:2});
 slab(L?faN(L.m)+' متر · +'+faN(L.sec):'خط؟',x+260,H-SAFE_Y-95,64,{fill:L?Y:'#8792ab'});for(let j=0;j<3;j++){const th=d.throws[j];ctx.save();ctx.beginPath();ctx.arc(x+60+j*50,H-SAFE_Y-150,16,0,7);ctx.fillStyle=th===undefined?'rgba(255,255,255,.15)':(th?GREEN:'#ff3b4e');ctx.fill();ctx.restore()}});AVOID=200};
HUD.R3_SANDWICH=s=>{const r=s.r3;if(!r.t0)return;const now=Date.now();const el=Math.min(60,(now-r.t0)/1000);
 ['E','M'].forEach((k,i)=>{const x=r[k];const cx=i?W*.73:W*.27,cy=H-SAFE_Y-150;const map={eating:[INK,'در حال خوردن'],provisional:[Y,'دهان پر · ساعت ایستاد'],final:[GREEN,'✔ دهان خالی'],dnf:['#8792ab','تمام نکرد · ۶۰'],dq:['#ff3b4e','حذف']};const[c,lab]=map[x.status]||[INK,''];
  const v=x.status==='eating'?el:(x.T||0);glass(cx-280,cy-120,560,240,34,c);slab(nm(k),cx,cy-80,34,{fill:col(k),depth:2});slab(sec1(v),cx,cy+10,110,{fill:c,glow:x.status==='final'?hexA(GREEN,.5):null});slab(lab+(x.penalty?' · جریمه +'+faN(x.penalty):''),cx,cy+90,28,{fill:c,depth:1});
  if(x.status==='provisional'){const left=Math.max(0,30-(now-x.mouthAt)/1000);ring(cx+220,cy-60,34,left/30,Y,9);slab(faN(Math.ceil(left)),cx+220,cy-58,28,{fill:INK,depth:0})}});
 const lim=Math.max(0,60-el);ctx.save();ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(W/2-300,SAFE_Y+10,600,14);ctx.fillStyle=lim<10?'#ff3b4e':Y;ctx.fillRect(W/2-300,SAFE_Y+10,600*(lim/60),14);ctx.restore();
 if(['provisional','eating'].some(z=>[r.E.status,r.M.status].includes(z)))pill('🤫 جِمنای ساکت است (دهان پر)',W/2,SAFE_Y+60,22,'rgba(185,140,255,.25)',PURPLE);AVOID=250};
HUD.R4_GLUE=s=>{const r=s.r4;if(!r.t0)return;const now=Date.now();const left=Math.max(0,180-(now-r.t0)/1000);const m=Math.floor(left/60),sc=Math.floor(left%60);
 glass(W/2-200,SAFE_Y,400,120,30,left<30?'#ff3b4e':Y);slab(faN(m)+':'+faN(String(sc).padStart(2,'0')),W/2,SAFE_Y+62,80,{fill:left<30?'#ff6b7a':INK});
 ['E','M'].forEach((k,i)=>{const x=i?W-SAFE_X-460:SAFE_X;const f=r.finish[k],v=r.valid[k];const lk=Math.max(0,(r.lockUntil[k]-now)/1000);const st=v?['✔ معتبر · '+V7.mmss(f).slice(0,5),GREEN]:(f!=null?['تمام؟ · بررسی داور',Y]:(lk>0?['قفل '+faN(Math.ceil(lk)),'#ff3b4e']:['در حال ساخت',INK]));glass(x,H-SAFE_Y-150,460,130,28,col(k));slab(nm(k),x+430,H-SAFE_Y-110,32,{align:'right',fill:col(k),depth:2});slab(st[0],x+230,H-SAFE_Y-60,46,{fill:st[1]})});AVOID=170};
HUD.SHOP=s=>{['E','M'].forEach((k,i)=>{const x=i?W-SAFE_X-420:SAFE_X;const sub=s.shop.submitted[k];glass(x,H-SAFE_Y-130,420,110,26,sub?GREEN:col(k));slab(nm(k),x+390,H-SAFE_Y-95,30,{align:'right',fill:col(k),depth:2});slab(sub?'● ثبت شد':'در حال انتخاب…',x+210,H-SAFE_Y-50,40,{fill:sub?GREEN:INK})});pill('خرید مخفی و هم‌زمان · حداکثر ۲ کارت',W/2,SAFE_Y+30,26,'rgba(255,197,61,.18)',GOLD);AVOID=150};
HUD.RISK=s=>{['E','M'].forEach((k,i)=>{const x=i?W-SAFE_X-420:SAFE_X;const v=s.risk.stake[k],r=s.risk.result[k];glass(x,H-SAFE_Y-130,420,110,26,col(k));slab(nm(k),x+390,H-SAFE_Y-95,30,{align:'right',fill:col(k),depth:2});slab(v==null?'شرط؟':(v===30?'همه‌چی ۳۰':'شرط '+faN(v))+(r==null?'':(r?' ✔':' ✘')),x+210,H-SAFE_Y-50,42,{fill:v===30?Y:INK})});AVOID=150};
function hudVault(s){const k=s.vault.runner;const r=k&&s.vault.runs[k];if(!r)return;const left=V7.runLeft(r);const c=left<10?'#ff3b4e':Y;
 glass(W/2-330,SAFE_Y,660,190,36,c);slab(nm(k)+' · ساعت = بانک',W/2,SAFE_Y+42,30,{fill:col(k),depth:2});slab(sec1(left),W/2,SAFE_Y+122,110,{fill:c,glow:left<10?hexA('#ff3b4e',.5):null});if(r.state==='paused')pill('مکث',W/2+260,SAFE_Y+42,22,'#ff3b4e','#fff');
 const labels=['نقاشی کور','اتاق حافظه','معما','رمز'];labels.forEach((l,i)=>{const x=W/2+(1.5-i)*230,y=H-SAFE_Y-70;const done=r.station>i+1,on=r.station===i+1;glass(x-105,y-45,210,90,24,done?GREEN:(on?Y:'#39456a'),.8);slab((done?'✔ ':'')+l,x,y,30,{fill:done?GREEN:(on?Y:'#8792ab'),depth:2})});
 /* code slots */for(let i=0;i<3;i++){const x=W-SAFE_X-80-i*110,y=SAFE_Y+70;glass(x-45,y-55,90,110,18,r.codes>i?Y:'#39456a',.85);slab(r.codes>i?faN(V7.E.codeDigits(s.lock.code)['C'+(i+1)]):'؟',x,y+4,70,{fill:r.codes>i?Y:'#8792ab'})}
 if(r.station===2){const ph=r.mem.phase;const pat=s.vault.pattern||[];const cy=H*.5;const tt=(Date.now()-r.mem.t0)/1000;
  for(let i=0;i<8;i++){const x=W/2+(3.5-i)*170;const showP=ph==='show';const val=showP?pat[i]:(ph==='input'?r.input[i]:0);ctx.save();ctx.translate(x,cy);ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(0,70,60,14,0,0,7);ctx.fill();
   const up=val===1;ctx.beginPath();if(up){ctx.moveTo(-48,60);ctx.lineTo(48,60);ctx.lineTo(36,-60);ctx.lineTo(-36,-60)}else{ctx.moveTo(-36,60);ctx.lineTo(36,60);ctx.lineTo(48,-60);ctx.lineTo(-48,-60)}ctx.closePath();ctx.fillStyle=ph==='lock'?'#39456a':(up?GOLD:'#e9edf7');ctx.fill();ctx.lineWidth=4;ctx.strokeStyle='#000';ctx.stroke();slab(faN(i+1),0,110,26,{fill:INK,depth:0});ctx.restore()}
  const lab={idle:'آماده نمایش',show:'نگاه کن! '+faN(Math.max(0,Math.ceil((r.mem.hint?3:5)-tt))),lock:'قفل · '+faN(Math.max(0,Math.ceil(8-tt))),input:'بچین و «بررسی» بزن',done:'✔'}[ph]||'';pill(lab,W/2,cy-150,34,ph==='lock'?'#39456a':'rgba(255,197,61,.2)',ph==='lock'?INK:Y)}
 if(r.station===3){const rd=V7.DATA.RIDDLES.find(x=>x.id===s.vault.riddleId);if(rd){const spicy=s.shop.effects&&s.shop.effects[k]&&s.shop.effects[k].spicy;glass(W/2-760,H*.34,1520,300,36,spicy?'#ff3b4e':PURPLE,.88);slab(spicy?'🌶️ معمای تند':'🧩 معمای خنده‌دار',W/2,H*.34+50,36,{fill:spicy?'#ff6b7a':PURPLE,depth:2});
  const lines=V7.E.wrapLines(spicy?rd.spicy:rd.normal,48,3);lines.forEach((l,i)=>slab(l,W/2,H*.34+120+i*64,44,{fill:INK,depth:2,maxW:1440}));if(Date.now()<r.riddleLock)pill('قفل ۵ ثانیه',W/2,H*.34+280,26,'#ff3b4e','#fff')}}
 if(r.station===4)slab('رمز کیف را وارد کن',W/2,H*.5,80,{fill:Y});AVOID=140}
HUD.RUN1=hudVault;HUD.RUN2=hudVault;
function drawHUD(s){AVOID=0;const f=HUD[s.state];if(f)try{ctx.save();f(s);ctx.restore()}catch(e){ctx.restore();console.warn('[V7 HUD]',e)}}
/* ---------- ILL overrides (rule/intro illustrations) ---------- */
function installILL(){const ILL=X.ILL;if(!ILL||ILL.__v7)return;ILL.__v7=1;
 /* FIXED R2: side view, basket at the left, lines go AWAY from the basket. farther = more seconds */
 ILL.distance=(t,cx,cy,s,step)=>{const g=X.g;ctx=g;const Ls=V7.E.CFG.r2.lines;const keys=['L1','L2','L3'];const cols=[X.DIST.green.col||'#2bd67b',X.DIST.yellow.col||'#ffd400',X.DIST.red.col||'#ff3b4e'];
  const floor=cy+190*s,bx=cx-470*s,unit=190*s;
  g.save();g.strokeStyle=hexA(INK,.25);g.lineWidth=4*s;g.beginPath();g.moveTo(cx-560*s,floor);g.lineTo(cx+560*s,floor);g.stroke();
  /* basket (hoop + net) */g.fillStyle='#9aa3b8';g.fillRect(bx-80*s,floor-330*s,12*s,330*s);g.strokeStyle=ORANGE;g.lineWidth=9*s;g.beginPath();g.ellipse(bx,floor-240*s,62*s,15*s,0,0,7);g.stroke();g.strokeStyle=hexA('#fff',.55);g.lineWidth=3*s;for(let i=-3;i<=3;i++){g.beginPath();g.moveTo(bx+i*18*s,floor-232*s);g.lineTo(bx+i*10*s,floor-170*s);g.stroke()}
  /* distance ruler */g.fillStyle=hexA(INK,.5);g.font=`800 ${24*s}px Vazirmatn`;g.textAlign='center';g.direction='rtl';for(let m=0;m<=4;m++){const x=bx+m*unit;g.fillRect(x-1.5*s,floor+6*s,3*s,18*s);g.fillText(faN(m)+'m',x,floor+48*s)}
  keys.forEach((kk,i)=>{const L=Ls[kk];const x=bx+L.m*unit;const k=easeOut((t-.2-i*.25)/.5);if(k<=0)return;const hi=step===1?kk==='L3':step===2?kk==='L2':true;g.save();g.globalAlpha=k*(hi?1:.45);
   g.fillStyle=cols[i];g.fillRect(x-7*s,floor-8*s,14*s,22*s);g.shadowColor=cols[i];g.shadowBlur=20*s;g.fillRect(x-60*s,floor-4*s,120*s,8*s);g.shadowBlur=0;
   const fs=(50+i*18)*s;slab('+'+faN(L.sec),x,floor-330*s-i*14*s,fs,{fill:cols[i]});slab(faN(L.m)+' متر',x,floor+95*s,34*s,{fill:INK,depth:2});g.restore()});
  /* arrow: farther = more */const ak=easeOut((t-1)/.6);if(ak>0){g.save();g.globalAlpha=ak;const y=cy-250*s,x0=bx+1.6*unit,x1=bx+4.4*unit;const lg=g.createLinearGradient(x0,0,x1,0);lg.addColorStop(0,cols[0]);lg.addColorStop(.5,cols[1]);lg.addColorStop(1,cols[2]);g.strokeStyle=lg;g.lineWidth=14*s;g.lineCap='round';g.beginPath();g.moveTo(x0,y);g.lineTo(x0+(x1-x0)*ak,y);g.stroke();g.fillStyle=cols[2];g.beginPath();g.moveTo(x1+30*s,y);g.lineTo(x1-10*s,y-26*s);g.lineTo(x1-10*s,y+26*s);g.closePath();g.fill();slab('دورتر = امتیاز بیشتر',(x0+x1)/2,y-50*s,40*s,{fill:Y});g.restore()}
  /* ball: thrown FROM the chosen line INTO the basket (cycles 2m→3m→4m, higher arc from farther) */
  const cyc=t%3.3,li=step===1?2:step===2?1:Math.floor(t/3.3)%3;const L=Ls[keys[li]];const sx=bx+L.m*unit-10*s,sy=floor-110*s;const ex=bx,ey=floor-250*s;const bt=cyc/1.5;
  const pl=sx+26*s;g.save();g.strokeStyle=hexA(INK,.9);g.lineWidth=8*s;g.lineCap='round';g.beginPath();g.arc(pl,floor-190*s,20*s,0,7);g.moveTo(pl,floor-170*s);g.lineTo(pl,floor-70*s);g.moveTo(pl,floor-70*s);g.lineTo(pl-18*s,floor);g.moveTo(pl,floor-70*s);g.lineTo(pl+18*s,floor);g.moveTo(pl,floor-150*s);g.lineTo(pl-30*s,floor-(bt<.1?200:130)*s);g.stroke();g.restore();
  if(bt<=1){const apex=(160+li*70)*s;const x=sx+(ex-sx)*bt,y=sy+(ey-sy)*bt-Math.sin(bt*Math.PI)*apex;g.save();for(let j=1;j<6;j++){const b2=Math.max(0,bt-j*.04);g.globalAlpha=.12*(6-j);g.fillStyle=ORANGE;g.beginPath();g.arc(sx+(ex-sx)*b2,sy+(ey-sy)*b2-Math.sin(b2*Math.PI)*apex,20*s,0,7);g.fill()}g.globalAlpha=1;g.fillStyle='#ff8a3d';g.beginPath();g.arc(x,y,22*s,0,7);g.fill();g.strokeStyle='#5a2400';g.lineWidth=3*s;g.beginPath();g.moveTo(x-22*s,y);g.lineTo(x+22*s,y);g.stroke();g.restore()}
  else if(bt<1.5){const a=1-(bt-1)*2;g.save();g.globalAlpha=a;slab('گل!',bx+40*s,floor-310*s,54*s,{fill:Y});g.restore()}
  if(step===2)try{X.vIcon('lock',bx+L.m*unit,floor-300*s,110*s,{col:ORANGE})}catch(e){}
  if(step===3){for(let i=0;i<3;i++){g.save();g.beginPath();g.arc(cx+(i-1)*110*s+200*s,floor+170*s,30*s,0,7);g.fillStyle=i===0?GREEN:hexA(INK,.25);g.globalAlpha=easeOut((t-i*.3)/.4);g.fill();g.restore()}slab('اولین گل حساب است',cx+200*s,floor+225*s,30*s,{fill:INK,depth:2})}
  g.restore()};
 ILL.sandwich=(t,cx,cy,s,step)=>{const g=X.g;ctx=g;const OC=ILL.__sw||(ILL.__sw=document.createElement('canvas'));OC.width=340;OC.height=200;
  const draw1=(x,sc,bite)=>{const o=OC.getContext('2d');o.clearRect(0,0,340,200);o.save();o.translate(170,120);const lay=[['#d9a45b',34],['#6fbf4a',12],['#e8473d',14],['#f2d15c',12],['#8b4a2b',18],['#d9a45b',34]];let y=60;lay.forEach(([c,h])=>{o.fillStyle=c;o.beginPath();o.roundRect(-150,y-h,300,h,h/2);o.fill();y-=h+2});
   if(bite>0){o.globalCompositeOperation='destination-out';for(let i=0;i<bite;i++){o.beginPath();o.arc(150-i*40,-20,38,0,7);o.fill()}}o.restore();g.save();g.translate(x,cy+40*s);g.scale(sc*s,sc*s);g.drawImage(OC,-170,-120);g.restore()};
  const b=step<0?Math.floor(t*1.5)%5:step;draw1(cx-240*s,1.2,b);draw1(cx+240*s,1.2,Math.max(0,b-1));
  if(step===1||step===2){const c=step===1?Y:GREEN;slab(step===1?'✋ دست‌ها بالا · ساعت می‌ایستد':'😮 دهان خالی ✔',cx,cy-230*s,46*s,{fill:c})}
  if(step===3)slab('اختلاف زمان = جایزه (۳ تا ۲۰)',cx,cy-230*s,44*s,{fill:Y});if(step===4)slab('«قرمز» = توقف ایمنی',cx,cy-230*s,50*s,{fill:'#ff3b4e'});
  ring(cx,cy+230*s,46*s,(t%6)/6,Y,10*s);slab('۶۰',cx,cy+232*s,34*s,{fill:INK,depth:0})};
 ILL.glue=(t,cx,cy,s,step)=>{const g=X.g;ctx=g;const k=step>=1?1:easeOut(t/1.6);for(let i=0;i<6;i++){const r=Math.floor(i/3),c=i%3;const tx=cx+(c-1)*130*s,ty=cy+(r-.5)*130*s;const ox=Math.cos(i*1.7)*300*s*(1-k),oy=Math.sin(i*2.3)*200*s*(1-k);g.save();g.translate(tx+ox,ty+oy);g.rotate((1-k)*(i-2.5)*.5);g.fillStyle=[GOLD,ORANGE,'#ffe08a','#ff9a4d',GOLD,ORANGE][i];rrect(-62*s,-62*s,124*s,124*s,14*s);g.fill();g.lineWidth=4*s;g.strokeStyle='#1a1206';g.stroke();g.restore()}
  if(k>=1)slab('DM',cx,cy+6*s,120*s,{fill:NAVY,stroke:GOLD,sw:.05});
  if(step===0)slab('🧤 چیدن با دستکش',cx,cy-270*s,46*s,{fill:INK});if(step===1)slab('🧴 چسب بدون دستکش',cx,cy-270*s,46*s,{fill:Y});if(step===2)slab('دکمهٔ «تمام» خودت',cx,cy-270*s,46*s,{fill:INK});if(step===3)slab('+۱۵ اولین تمام معتبر',cx,cy-270*s,52*s,{fill:Y});if(step===4)slab('⚖️ چالش: ۱۰/۵ یا −۵',cx,cy-270*s,50*s,{fill:ORANGE})};
 ILL.bankopen=(t,cx,cy,s)=>{const g=X.g;ctx=g;slab('بانک باز شد',cx,cy-220*s,90*s,{grad:['#fff3b0',GOLD]});V7.E.CFG.shop.order.forEach((c,i)=>{const d=V7.E.CFG.shop.cards[c];const p=easeOutBack((t-.2-i*.15)/.4);if(p<=0)return;const cc={blue:'#2f8cff',red:'#ff3b4e',gold:GOLD}[d.color];g.save();g.translate(cx+(i-2)*150*s,cy+60*s+(1-p)*200*s);g.rotate((i-2)*.08);glass(-65*s,-95*s,130*s,190*s,14*s,cc,.9);slab(d.fa,0,-30*s,26*s,{fill:cc,maxW:120*s});slab(faN(d.cost)+'s',0,30*s,40*s,{fill:INK});g.restore()})};
 ILL.shop=(t,cx,cy,s,step)=>{ILL.bankopen(t,cx,cy,s);const tx=['🔵 آبی برای خودت · 🔴 قرمز برای حریف','حداکثر ۲ · فقط ۱ قرمز','+۵ مالیات برای نفر جلو','کف بانک ۲۰ · دزدی ممنوع'][step];if(tx)slab(tx,cx,cy+260*s,34*s,{fill:Y,maxW:720*s})};
 ILL.risk=(t,cx,cy,s,step)=>{const g=X.g;ctx=g;g.save();g.strokeStyle=Y;g.lineWidth=8*s;g.strokeRect(cx-110*s,cy-10*s,220*s,220*s);g.restore();const bt=(t%2.4)/1.2;const hit=Math.floor(t/2.4)%2===0;const ex=hit?cx:cx+190*s,ey=cy+100*s;const sx=cx-420*s,sy=cy+160*s;if(bt<=1){const x=sx+(ex-sx)*easeOut(bt),y=sy+(ey-sy)*bt-Math.sin(bt*Math.PI)*60*s;g.save();g.fillStyle=GOLD;g.beginPath();g.arc(x,y,26*s,0,7);g.fill();g.restore()}else slab(hit?'+شرط':'−شرط',ex,ey-80*s,54*s,{fill:hit?GREEN:'#ff3b4e'});
  ['۰','۱۰','۲۰','۳۰'].forEach((v,i)=>pill(v,cx+(i-1.5)*140*s,cy-170*s,34*s,i===3?ORANGE:'#1d2c5c',INK,easeOut((t-i*.15)/.3)))};
 ILL.memory=(t,cx,cy,s)=>{const g=X.g;ctx=g;const pat=[1,0,1,1,0,0,1,0];for(let i=0;i<8;i++){const x=cx+(3.5-i)*95*s;const show=(t%6)<3;g.save();g.translate(x,cy);g.beginPath();const up=show&&pat[i];if(up){g.moveTo(-34*s,44*s);g.lineTo(34*s,44*s);g.lineTo(26*s,-44*s);g.lineTo(-26*s,-44*s)}else{g.moveTo(-26*s,44*s);g.lineTo(26*s,44*s);g.lineTo(34*s,-44*s);g.lineTo(-34*s,-44*s)}g.closePath();g.fillStyle=up?GOLD:'#e9edf7';g.fill();g.lineWidth=3*s;g.strokeStyle='#000';g.stroke();g.restore()}slab((t%6)<3?'۵ ثانیه نگاه':'۸ ثانیه قفل',cx,cy-150*s,44*s,{fill:Y})};
 const oldVault=ILL.vault;ILL.vault=(t,cx,cy,s,step)=>{const g=X.g;ctx=g;const st4=['✏️ نقاشی کور','🥤 اتاق حافظه','🧩 معما','🔐 رمز واقعی کیف'];st4.forEach((l,i)=>{const x=cx+(1.5-i)*190*s,y=cy+250*s;const on=step===i||step<0||step>=4;g.save();g.globalAlpha=easeOut((t-.2-i*.15)/.4)*(on?1:.4);glass(x-85*s,y-45*s,170*s,90*s,18*s,on?Y:'#39456a',.85);slab(l,x,y,22*s,{fill:on?Y:INK,depth:1,maxW:160*s});g.restore()});
  g.save();g.translate(0,-60*s);try{oldVault(t,cx,cy-40*s,s*.8,Math.min(step,3))}catch(e){}g.restore()};
 ILL.case=(t,cx,cy,s,step)=>{const g=X.g;ctx=g;const op=easeOut((t-.4)/1);g.save();g.translate(cx,cy+40*s);const lg=g.createLinearGradient(0,-150*s,0,150*s);lg.addColorStop(0,'#fff3b0');lg.addColorStop(.5,GOLD);lg.addColorStop(1,'#8a5a00');g.fillStyle=lg;rrect(-260*s,-120*s,520*s,260*s,26*s);g.fill();g.save();g.translate(0,-120*s);g.rotate(-op*.5);g.fillStyle='#c78f16';rrect(-260*s,-40*s,520*s,50*s,20*s);g.fill();g.restore();g.fillStyle='#3a2600';rrect(-60*s,-20*s,120*s,70*s,14*s);g.fill();g.restore();try{X.rays(cx,cy-60*s,t,op*.6,GOLD,14)}catch(e){}
  const l=['👑 تاج + نشان','✉️ پاکت سرنوشت','🍋 لقمهٔ مرموز'];l.forEach((x,i)=>pill(x,cx+(1-i)*260*s,cy-230*s,26*s,step===i?GOLD:'#1d2c5c',step===i?'#0b0b12':INK,easeOut((t-.8-i*.2)/.3)))};
}
/* ---------- post (called from the wrapped draw) ---------- */
function post(){const h=H$();if(!h)return;ctx=h.g;installILL();const s=V7.S();if(!s)return;const cv=h.cv;
 ctx.save();ctx.setTransform(cv.width/W,0,0,cv.height/H,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.shadowColor='transparent';
 try{drawHUD(s)}catch(e){}
 try{drawMoments()}catch(e){}
 try{drawSubs(s.subs,s.subs.pos==='bottom'?AVOID:0)}catch(e){console.warn('[V7 subs]',e)}
 ctx.restore()}
window.V7Stage={post,MOM,HUD,drawSubs,currentCue,easeOutBack,slamK};
})();
