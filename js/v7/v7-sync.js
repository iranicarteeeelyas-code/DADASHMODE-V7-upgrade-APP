/* DADASHMODE V7 · Phone Mode host (computer side). The computer is the ONLY source of truth:
   phones send commands → V7.exec() validates role/state/idempotency → host timestamps → snapshots go back per role.
   Transport: WebSocket hub of tools/serve-v7.mjs (LAN, no internet) + BroadcastChannel fallback for tabs on the same PC. */
'use strict';
(function(){
const DM=window.DM5||{};
const Sync=window.V7Sync={ws:null,room:null,pin:null,roster:[],bcRoles:{},online:false,lastErr:'',hz:8};
const rnd=(n,al)=>Array.from(crypto.getRandomValues(new Uint8Array(n)),x=>al[x%al.length]).join('');
async function ids(){let r=null;try{r=await DM.kvGet('v7-room')}catch(e){}if(!r||!r.room){r={room:rnd(5,'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'),pin:rnd(4,'0123456789')};try{await DM.kvPut('v7-room',r)}catch(e){}}Sync.room=r.room;Sync.pin=r.pin;return r}
Sync.newPin=async()=>{const r={room:Sync.room,pin:rnd(4,'0123456789')};try{await DM.kvPut('v7-room',r)}catch(e){}Sync.pin=r.pin;Sync.connect();V7.emit('sync')};
Sync.remoteURL=(role,host)=>{const h=host||location.host;return `${location.protocol}//${h}/remote.html#room=${Sync.room}&pin=${Sync.pin}${role?'&role='+role:''}`};
Sync.lan=async()=>{try{const r=await fetch('/api/v7/lan',{cache:'no-store'});if(r.ok)return await r.json()}catch(e){}return null};
function handle(m,via){if(!m||typeof m!=='object')return;
 if(m.type==='roster'){Sync.roster=m.clients||[];V7.emit('sync');return}
 if(m.type==='join'){V7.toast&&V7.toast('📱 وصل شد: '+m.role);push(true);return}
 if(m.type==='cmd'){const r=V7.exec(String(m.action||''),m.p||{},{role:m.role||'MONITOR',src:(m.role||'?')+'·'+String(m.cid||'').slice(0,4),id:m.id,toast:false});
  const ack={type:'ack',id:m.id,ok:r.ok!==false,msg:r.msg||'',hostT:Date.now(),to:m.cid};if(via==='bc')bc&&bc.postMessage(ack);else sendWS(ack);push(true);return}
 if(m.type==='hello'&&via==='bc'){Sync.bcRoles[m.role]=Date.now();push(true);return}
 if(m.type==='sync'){push(true)}}
function sendWS(o){try{if(Sync.ws&&Sync.ws.readyState===1)Sync.ws.send(JSON.stringify(o))}catch(e){}}
let retry=0,rt=null;
Sync.connect=async()=>{if(location.protocol==='file:'){Sync.lastErr='برای حالت گوشی، اپ را با start-v7 (سرور محلی) اجرا کنید';return}await ids();try{if(Sync.ws)Sync.ws.close()}catch(e){}
 const u=`${location.protocol==='https:'?'wss':'ws'}://${location.host}/v7ws?role=HOST&room=${Sync.room}&pin=${Sync.pin}&cid=host`;let ws;try{ws=new WebSocket(u)}catch(e){Sync.lastErr=e.message;return}Sync.ws=ws;
 ws.onopen=()=>{Sync.online=true;retry=0;Sync.lastErr='';V7.emit('sync');push(true)};
 ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(_){return}if(m.type==='error'){Sync.lastErr=m.msg;return}handle(m,'ws')};
 ws.onclose=()=>{Sync.online=false;V7.emit('sync');clearTimeout(rt);rt=setTimeout(Sync.connect,Math.min(8000,500*Math.pow(2,retry++)))};
 ws.onerror=()=>{Sync.lastErr='سرور Phone Mode پیدا نشد (tools/serve-v7.mjs را اجرا کنید)'}};
let bc=null;try{bc=new BroadcastChannel('dm-v7');bc.onmessage=e=>handle(e.data,'bc')}catch(e){}
let lastSig={};
function push(force){const roles=new Set(Sync.roster.map(c=>c.role));const now=Date.now();for(const r in Sync.bcRoles)if(now-Sync.bcRoles[r]<15000)roles.add(r);
 for(const role of roles){const snap=V7.snapshot(role==='DIRECTOR'?'DIRECTOR':role);if(!snap)continue;const msg={type:'snap',to:role,snap,hostT:now};
  if(Sync.online&&Sync.roster.some(c=>c.role===role))sendWS(msg);if(bc&&Sync.bcRoles[role])bc.postMessage(msg)}}
Sync.push=push;
setInterval(()=>{try{if(window.V7&&V7.S&&V7.S())push()}catch(e){}},1000/Sync.hz);
function boot(){if(!window.V7)return setTimeout(boot,300);V7.on('change',()=>push(true));Sync.connect()}
if(DM.whenReady)DM.whenReady(['P'],()=>setTimeout(boot,400));else setTimeout(boot,1200);
})();
