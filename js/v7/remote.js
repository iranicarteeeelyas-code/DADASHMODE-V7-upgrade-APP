/* DADASHMODE V7 · phone client. Sends idempotent commands (uuid), shows host acks, reconnects and resyncs from the host snapshot. */
'use strict';
(function(){
const q=new URLSearchParams(location.hash.slice(1));let room=(q.get('room')||localStorage.v7room||'').toUpperCase(),pin=q.get('pin')||localStorage.v7pin||'',role=q.get('role')||localStorage.v7role||'';
const cid=localStorage.v7cid||(localStorage.v7cid=(crypto.randomUUID?crypto.randomUUID():String(Math.random()).slice(2)));
const $=s=>document.querySelector(s);const app=$('#app');let ws=null,bc=null,snap=null,lat=null,offline=true,retry=0;const pending=new Map();
function toast(m,bad){const t=$('#toast');t.textContent=m;t.className='v7toast'+(bad?' bad':'');t.hidden=false;clearTimeout(t._h);t._h=setTimeout(()=>t.hidden=true,1800)}
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2)}
function send(action,p){const m={type:'cmd',id:uid(),action,p,t:Date.now()};pending.set(m.id,m);tx(m);setTimeout(()=>{if(pending.has(m.id))tx(m)},2500)}
function tx(m){if(ws&&ws.readyState===1)ws.send(JSON.stringify(m));else if(bc)bc.postMessage(Object.assign({},m,{role,cid}))}
function onMsg(m){if(!m)return;
 if(m.type==='snap'&&(m.to===role||m.to==='all'||!m.to)){snap=m.snap;offline=false;draw();return}
 if(m.type==='ack'&&(!m.to||m.to===cid)){if(!pending.has(m.id))return;pending.delete(m.id);if(!m.ok){toast(m.msg||'رد شد',true);if(navigator.vibrate)navigator.vibrate([40,40,40])}else if(m.msg)toast(m.msg);return}
 if(m.type==='pong'){lat=Date.now()-m.t;draw();return}
 if(m.type==='host'){offline=!m.online;if(!m.online)toast('کامپیوتر قطع شد',true);draw();return}
 if(m.type==='error'){toast(m.msg==='pin'?'پین/اتاق اشتباه است':m.msg,true);if(m.msg==='pin'){localStorage.removeItem('v7pin');showPick()}}}
function draw(){if(!snap){app.innerHTML=`<div class="v7wait">در حال اتصال…<br><small>${role} · اتاق ${room}</small></div>`;return}V7Ctl.render(app,snap,send,{latency:lat,offline});document.body.classList.toggle('offline',offline)}
function connect(){if(location.protocol==='file:'){useBC();return}
 try{ws=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/v7ws?room=${room}&pin=${pin}&role=${role}&cid=${cid}`)}catch(e){useBC();return}
 ws.onopen=()=>{retry=0;ws.send(JSON.stringify({type:'sync'}));for(const m of pending.values())tx(m)};
 ws.onmessage=e=>{try{onMsg(JSON.parse(e.data))}catch(_){}};
 ws.onclose=()=>{offline=true;draw();setTimeout(connect,Math.min(6000,400*Math.pow(2,retry++)));if(retry===3)useBC()}}
function useBC(){if(bc)return;try{bc=new BroadcastChannel('dm-v7');bc.onmessage=e=>onMsg(e.data);const hi=()=>bc.postMessage({type:'hello',role,cid});hi();setInterval(hi,5000)}catch(e){}}
setInterval(()=>{if(ws&&ws.readyState===1)ws.send(JSON.stringify({type:'ping',t:Date.now()}))},2000);
let wl=null;async function wake(){try{if('wakeLock' in navigator&&document.visibilityState==='visible')wl=await navigator.wakeLock.request('screen')}catch(e){}}
document.addEventListener('visibilitychange',wake);
function showPick(){$('#pick').hidden=false;app.hidden=true;$('#room').value=room;$('#pin').value=pin}
$('#pick').addEventListener('click',e=>{const b=e.target.closest('[data-role]');if(!b)return;room=$('#room').value.trim().toUpperCase();pin=$('#pin').value.trim().replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d));if(!room||!/^\d{4}$/.test(pin)){toast('اتاق و پین ۴ رقمی را وارد کنید',true);return}
 role=b.dataset.role;localStorage.v7room=room;localStorage.v7pin=pin;localStorage.v7role=role;$('#pick').hidden=true;app.hidden=false;start()});
function start(){document.body.dataset.role=role;draw();connect();wake()}
if(room&&pin&&role&&q.get('role'))start();else showPick();
app.addEventListener('dblclick',e=>{if(e.target.closest('.v7head'))showPick()});
})();
