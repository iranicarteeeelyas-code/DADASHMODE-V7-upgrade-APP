/* V7 acceptance tests (Director Book §9.7 "بازی و اعداد") · run: node tests/v7-engine.test.mjs */
import {createRequire} from 'node:module';const require=createRequire(import.meta.url);
const E=require('../js/v7/v7-engine.js');const D=require('../js/v7/v7-data.js');
let pass=0,fail=0;const ok=(c,m)=>{if(c){pass++;console.log('  ✔',m)}else{fail++;console.log('  ✘',m)}};
const P=(T,status='final',penalty=0)=>({T,status,penalty});
console.log('R2 · farther line = more seconds');
ok(E.r2Value('L1')===5&&E.r2Value('L2')===10&&E.r2Value('L3')===20,'L1 2m=+5 · L2 3m=+10 · L3 4m=+20');
ok(E.CFG.r2.lines.L3.m>E.CFG.r2.lines.L1.m&&E.r2Value('L3')>E.r2Value('L1'),'distance and reward grow together');
{const s={line:'L3',throws:[],scored:false};E.r2Throw(s,false);const r=E.r2Throw(s,true);const r3=E.r2Throw(s,true);ok(r.award===20&&r3.error,'first goal only; later throws removed')}
console.log('R3 · speed sandwich');
{const r=E.r3Result({E:P(46.8),M:P(31.4)});ok(r.awards.M===15&&r.awards.E===0,'Emad 31.4 · Elias 46.8 → Emad +15')}
{const r=E.r3Result({E:P(30.6),M:P(30.0)});ok(r.awards.E===5&&r.awards.M===5,'diff 0.6 → both +5')}
{const r=E.r3Result({E:P(null,'dnf'),M:P(34.6)});ok(r.awards.M===20,'only one finished at 34.6 → +20 (cap)')}
{const r=E.r3Result({E:P(32.2),M:P(30.0)});ok(r.awards.M===3,'diff 2.2 → floor +3')}
{const r=E.r3Result({E:P(null,'dnf'),M:P(40)});ok(E.r3Effective(P(null,'dnf'))===60&&r.awards.M===20,'no «empty ✔» in 30s → T=60')}
{const r=E.r3Result({E:P(null,'dnf'),M:P(null,'dnf')});ok(r.needPick,'nobody finished → director picks')}
{const r=E.r3Result({E:P(null,'dq'),M:P(40)});ok(r.awards.M===10,'DQ with opponent finished → +10')}
{const r=E.r3Result({E:P(30,'final',3),M:P(32)});ok(r.awards.M===3&&r.awards.E===0,'penalty +3 applied to T (30+3 vs 32 → Emad +3)')}
{const r=E.r3Result({E:P(30),M:P(30),safetyStop:true});ok(r.awards.E===5&&r.awards.M===5,'safety stop → both +5')}
console.log('R4 · glue');
ok(E.r4Result({first:'M'}).awards.M===15,'first valid FINISH +15');
{const r=E.r4Result({first:'M',challenge:{by:'E',outcome:'win'}});ok(r.awards.E===10&&r.awards.M===5,'challenge win 10/5')}
{const r=E.r4Result({first:'M',challenge:{by:'E',outcome:'lose'}});ok(r.awards.E===-5&&r.awards.M===15,'challenge lose −5')}
{const r=E.r4Result({first:'M',challenge:{by:'E',outcome:'unclear'}});ok(r.awards.E===0&&r.awards.M===15,'unclear → 0')}
ok(E.r4CanChallenge({first:'M',finished:{E:true}},'E')&&!E.r4CanChallenge({first:'M',finished:{E:true}},'M')&&!E.r4CanChallenge({first:'M',finished:{E:false}},'E'),'challenge only by second player after own FINISH');
console.log('Full example §1.3');
let b={E:45,M:45};const add=a=>{b.E+=a.E||0;b.M+=a.M||0};
add(E.r1Result({winner:'M'}).awards);add({E:E.r2Value('L2'),M:E.r2Value('L3')});ok(b.E===55&&b.M===75,'after R2 55|75');
add(E.r3Result({E:P(46.8),M:P(31.4)}).awards);ok(b.E===55&&b.M===90,'after R3 55|90');
add(E.r4Result({first:'M',challenge:{by:'E',outcome:'win'}}).awards);ok(b.E===65&&b.M===95,'after R4 65|95');
ok(!E.gapCap(b).apply,'reveal gap exactly 30 → no cap');
ok(E.gapCap({E:50,M:95}).apply&&E.gapCap({E:50,M:95}).delta===15,'gap 45 → trailer raised to leader−30');
const picks={E:[],M:[]};ok(E.shopCheck(picks,'E','HINT',b).ok,'Elias HINT ok');picks.E.push('HINT');
ok(E.cardPrice('SPICY','M',b).total===15,'leader tax: Emad SPICY 10+5');picks.M.push('SPICY');
const ch=E.shopCharges(picks,b);b.E-=ch.E;b.M-=ch.M;ok(b.E===55&&b.M===80,'after shop 55|80');
ok(E.riskOptions('E',b).includes(30),'Elias 25 behind → ALL-IN 30 allowed (55−30=25 ≥ 20)');
ok(!E.riskOptions('M',b).includes(30),'leader has no ALL-IN');
b.E+=E.riskResult(30,true);b.M+=E.riskResult(10,false);ok(b.E===85&&b.M===70,'after risk 85|70');
console.log('Shop rules');
{const pk={E:['GLOVES'],M:[]};ok(!E.shopCheck(pk,'E','SPICY',{E:90,M:40}).ok,'second red disabled')}
{const pk={E:['HINT','SHIELD'],M:[]};ok(!E.shopCheck(pk,'E','MIRROR',{E:90,M:40}).ok,'third card disabled')}
ok(!E.shopCheck({E:[],M:[]},'M','MIRROR',{E:60,M:39}).ok,'card that drops bank below 20 is greyed');
ok(E.shopCheck({E:[],M:[]},'M','MIRROR',{E:60,M:40}).ok,'exactly 20 is allowed');
{const r=E.shopResolve({E:['GLOVES'],M:['SHIELD']});ok(r.events.some(e=>e.label==='BLOCKED')&&!r.effects.M.gloves,'red vs shield → blocked')}
{const r=E.shopResolve({E:['GLOVES'],M:['MIRROR']});ok(r.effects.E.gloves&&!r.effects.M.gloves,'red vs mirror → bounced to buyer')}
{const r=E.shopResolve({E:['GLOVES','MIRROR'],M:['MIRROR']});ok(r.effects.E.gloves&&r.events.filter(e=>e.label==='BOUNCED').length===1,'mirror vs mirror → bounces once')}
{const r=E.shopResolve({E:['GLOVES','SHIELD'],M:['MIRROR']});ok(!r.effects.E.gloves&&r.events.some(e=>e.label==='BLOCKED'&&e.target==='E'),'bounced red caught by buyer shield')}
{const r=E.shopResolve({E:['SHIELD'],M:['HINT']});ok(r.events.some(e=>e.label==='BURNED'&&e.card==='SHIELD'),'unused shield burns')}
{const r=E.shopResolve({E:['GLOVES'],M:['SPICY']});ok(r.effects.M.gloves&&r.effects.E.spicy,'two reds → both apply')}
console.log('Vault / lock / riddles');
{const d=E.codeDigits(472);ok(d.C1===4&&d.C2===7&&d.C3===2,'code 472 → C1=4 C2=7 C3=2')}
{const r=E.pickRiddle(D.RIDDLES,2);ok(r&&r.answer===2&&r.spicy,'riddle drawn from bucket 2 with spicy version')}
ok(D.RIDDLES.length===10&&[...Array(10).keys()].every(k=>D.RIDDLES.some(r=>r.answer===k)),'bank covers answers 0–9');
{let okAll=true;for(let i=0;i<300;i++){const p=E.memPattern();const s=p.reduce((a,b)=>a+b,0);let run=1,mx=1;for(let j=1;j<8;j++){run=p[j]===p[j-1]?run+1:1;mx=Math.max(mx,run)}if(s<3||s>5||mx>3)okAll=false}ok(okAll,'memory pattern: 3–5 gold, max 3 same in a row (300 samples)')}
ok(E.memCheck([1,0,1,1,0,0,1,0],[1,0,1,0,0,0,1,1])===6,'CHECK counts correct cups (6 of 8)');
ok(E.guessOk(D.TARGETS[0],'بایسیکل')&&!E.guessOk(D.TARGETS[0],'عینک'),'drawing guess list');
const s1=await E.sealCode(472,'abc'),s2=await E.sealCode(472,'abc');ok(s1===s2&&/^[0-9A-F]{6}$/.test(s1),'seal is stable 6-hex ('+s1+')');
ok(E.vaultWinner({E:{opened:true,left:3},M:{opened:true,left:12.4}})==='M','more time left wins');
ok(E.vaultWinner({E:{opened:false,codes:2},M:{opened:false,codes:1}})==='E','both timed out → more codes');
console.log('Subtitles');
ok(E.subDuration('سلام',15)===1.5,'min 1.5 s');ok(E.subDuration('x'.repeat(300),15)===7,'max 7 s');ok(Math.abs(E.subDuration('x'.repeat(60),15)-4)<1e-9,'duration = chars ÷ cps');
ok(E.wrapLines('یک دو سه چهار پنج شش هفت هشت نه ده یازده دوازده سیزده چهارده پانزده',42).length<=2,'max 2 lines');
ok(E.toSRT([{s:1,e:2.5,text:'الف'}]).includes('00:00:01,000 --> 00:00:02,500'),'SRT timing');ok(E.toVTT([{s:1,e:2.5,text:'الف'}]).startsWith('WEBVTT'),'VTT header');
console.log(`\n${pass} passed · ${fail} failed`);process.exit(fail?1:0);
