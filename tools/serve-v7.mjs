#!/usr/bin/env node
/* DADASHMODE V7 · zero-dependency local server = everything tools/serve.mjs does + a LAN WebSocket hub for Phone Mode.
   - same APIs as v5 (Gemini proxy, Gemini TTS, Edge/Dilara TTS, voices/save) → nothing that worked before is lost
   - /v7ws          WebSocket hub (RFC 6455, no npm). Rooms protected by a 4-digit PIN. The COMPUTER (role HOST) is the
                    single source of truth: phones only send commands; the host validates, logs and broadcasts state.
   - /api/v7/lan    LAN addresses so the app can print a pairing QR
   Works fully offline on a laptop hotspot or phone hotspot.  Usage: node tools/serve-v7.mjs [port]  (default 3000) */
import http from 'node:http';import fs from 'node:fs';import fsp from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const PORT=+process.env.PORT||+process.argv[2]||3000;const HOST=process.env.HOST||'0.0.0.0';
let edge=null;try{edge=await import('./edge-tts.mjs')}catch(e){console.warn(' (edge-tts.mjs not found: Dilara voice disabled)')}
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ttf':'font/ttf','.woff2':'font/woff2','.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg','.webm':'video/webm','.mp4':'video/mp4','.md':'text/markdown; charset=utf-8','.pdf':'application/pdf'};
const VOICES=path.join(ROOT,'voices');
const lan=()=>Object.values(os.networkInterfaces()).flat().filter(n=>n&&n.family==='IPv4'&&!n.internal).map(n=>n.address);
function body(req,limit=60e6){return new Promise((res,rej)=>{let n=0;const c=[];req.on('data',d=>{n+=d.length;if(n>limit){rej(new Error('too large'));req.destroy()}else c.push(d)});req.on('end',()=>{try{res(JSON.parse(Buffer.concat(c).toString('utf8')||'{}'))}catch(e){rej(e)}});req.on('error',rej)})}
const json=(res,code,obj)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj))};
function wav(pcm,rate=24000){const h=Buffer.alloc(44);h.write('RIFF',0);h.writeUInt32LE(36+pcm.length,4);h.write('WAVE',8);h.write('fmt ',12);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(rate,24);h.writeUInt32LE(rate*2,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);return Buffer.concat([h,pcm])}
async function gemini(model,key,payload){const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(payload)});const t=await r.text();if(!r.ok){const e=new Error(`Gemini ${r.status}: ${t.slice(0,300)}`);e.status=r.status;throw e}return JSON.parse(t)}
const API={
 'GET /api/config':async(req,res)=>json(res,200,{server:'dadashmode-v7',gemini:!!process.env.GEMINI_API_KEY,edge:!!edge,voicesWritable:true,ws:true}),
 'GET /api/v7/lan':async(req,res)=>json(res,200,{ips:lan(),port:PORT,rooms:[...rooms.keys()].length}),
 'POST /api/ai/json':async(req,res)=>{const b=await body(req);const key=b.apiKey||process.env.GEMINI_API_KEY;if(!key)return json(res,400,{error:'کلید Gemini نه در اپ وارد شده و نه روی سرور.'});const parts=Array.isArray(b.parts)&&b.parts.length?b.parts:[{text:b.user||''}];
  const j=await gemini(b.model||'gemini-2.5-flash',key,{systemInstruction:{parts:[{text:b.system||''}]},contents:[{role:'user',parts}],generationConfig:{responseMimeType:'application/json',temperature:b.temperature??.6,maxOutputTokens:b.maxTokens||65536}});
  json(res,200,{text:(j.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join(''),finish:j.candidates?.[0]?.finishReason})},
 'POST /api/ai/tts':async(req,res)=>{const b=await body(req);const key=b.apiKey||process.env.GEMINI_API_KEY;if(!key)return json(res,400,{error:'کلید Gemini موجود نیست.'});
  const j=await gemini(b.model||'gemini-2.5-flash-preview-tts',key,{contents:[{parts:[{text:b.text||''}]}],generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:b.voiceName||'Leda'}}}}});
  const part=j.candidates?.[0]?.content?.parts?.find(p=>p.inlineData);if(!part)return json(res,502,{error:'Gemini صدایی برنگرداند'});const rate=+((part.inlineData.mimeType||'').match(/rate=(\d+)/)||[])[1]||24000;const out=wav(Buffer.from(part.inlineData.data,'base64'),rate);res.writeHead(200,{'Content-Type':'audio/wav','Content-Length':out.length});res.end(out)},
 'POST /api/tts/edge':async(req,res)=>{if(!edge)return json(res,501,{error:'edge-tts.mjs missing'});const b=await body(req);const pro=Object.assign({},edge.EDGE_EMO[b.emotion]||{},b.prosody||{});const mp3=await edge.edgeSynth(b.text||'',{voice:b.voice||'fa-IR-DilaraNeural',...pro});res.writeHead(200,{'Content-Type':'audio/mpeg','Content-Length':mp3.length});res.end(mp3)},
 'POST /api/voices/save':async(req,res)=>{const b=await body(req);if(!/^[a-z0-9]{4,20}$/.test(b.key||''))return json(res,400,{error:'bad key'});const ext=['wav','mp3','webm','ogg'].includes(b.ext)?b.ext:'wav';await fsp.mkdir(VOICES,{recursive:true});await fsp.writeFile(path.join(VOICES,b.key+'.'+ext),Buffer.from(b.data||'','base64'));
  const ip=path.join(VOICES,'index.json');let idx={format:'dadashmode-voicepack-index/3',items:{}};try{idx=JSON.parse(await fsp.readFile(ip,'utf8'))}catch(e){}idx.items[b.key]={file:b.key+'.'+ext,text:b.text||'',emotion:b.emotion||'',direction:b.direction||'',voice:b.voice||'',source:b.source||'',created:Date.now()};await fsp.writeFile(ip,JSON.stringify(idx,null,1));json(res,200,{ok:true,count:Object.keys(idx.items).length})}};

/* ================= WebSocket hub (RFC 6455, text frames only) ================= */
const rooms=new Map(); // room → {pin, host:client|null, clients:Set}
function wsAccept(key){return crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64')}
function frame(str){const p=Buffer.from(str,'utf8');const n=p.length;let h;if(n<126){h=Buffer.from([0x81,n])}else if(n<65536){h=Buffer.alloc(4);h[0]=0x81;h[1]=126;h.writeUInt16BE(n,2)}else{h=Buffer.alloc(10);h[0]=0x81;h[1]=127;h.writeBigUInt64BE(BigInt(n),2)}return Buffer.concat([h,p])}
function send(c,obj){if(c.alive){try{c.sock.write(frame(typeof obj==='string'?obj:JSON.stringify(obj)))}catch(e){}}}
function onUpgrade(req,sock){const u=new URL(req.url,'http://x');if(u.pathname!=='/v7ws'){sock.destroy();return}
 const key=req.headers['sec-websocket-key'];if(!key){sock.destroy();return}
 const room=(u.searchParams.get('room')||'').toUpperCase().slice(0,8),pin=(u.searchParams.get('pin')||'').slice(0,8),role=(u.searchParams.get('role')||'MONITOR').toUpperCase(),cid=(u.searchParams.get('cid')||crypto.randomUUID()).slice(0,40);
 const ROLES=['HOST','DIRECTOR','PLAYER_E','PLAYER_M','MONITOR','JUDGE'];
 sock.write(['HTTP/1.1 101 Switching Protocols','Upgrade: websocket','Connection: Upgrade','Sec-WebSocket-Accept: '+wsAccept(key),'',''].join('\r\n'));
 const c={sock,room,role:ROLES.includes(role)?role:'MONITOR',cid,alive:true,buf:Buffer.alloc(0),ua:(req.headers['user-agent']||'').slice(0,60)};
 const fail=m=>{send(c,{type:'error',msg:m});setTimeout(()=>sock.end(),50)};
 if(!/^[A-Z0-9]{4,8}$/.test(room))return fail('room');
 let R=rooms.get(room);
 if(c.role==='HOST'){if(!/^\d{4}$/.test(pin))return fail('pin');if(!R){R={pin,host:null,clients:new Set()};rooms.set(room,R)}R.pin=pin;if(R.host&&R.host!==c)try{R.host.sock.end()}catch(e){}R.host=c}
 else{if(!R||R.pin!==pin)return fail('pin');R.clients.add(c)}
 send(c,{type:'hello',role:c.role,cid:c.cid,room});
 const roster=()=>R&&R.host&&send(R.host,{type:'roster',clients:[...R.clients].map(x=>({cid:x.cid,role:x.role,ua:x.ua}))});
 roster();if(c.role!=='HOST'&&R.host)send(R.host,{type:'join',cid:c.cid,role:c.role});
 sock.on('data',d=>{c.buf=Buffer.concat([c.buf,d]);while(c.buf.length>=2){const b0=c.buf[0],b1=c.buf[1];const op=b0&15,masked=b1&128;let len=b1&127,o=2;
  if(len===126){if(c.buf.length<4)return;len=c.buf.readUInt16BE(2);o=4}else if(len===127){if(c.buf.length<10)return;len=Number(c.buf.readBigUInt64BE(2));o=10}
  if(len>4e6){sock.destroy();return}const mk=masked?c.buf.slice(o,o+4):null;o+=masked?4:0;if(c.buf.length<o+len)return;let p=c.buf.slice(o,o+len);c.buf=c.buf.slice(o+len);
  if(mk){p=Buffer.from(p);for(let i=0;i<p.length;i++)p[i]^=mk[i&3]}
  if(op===8){sock.end();return}if(op===9){try{sock.write(Buffer.concat([Buffer.from([0x8A,p.length]),p]))}catch(e){}continue}if(op!==1)continue;
  let m;try{m=JSON.parse(p.toString('utf8'))}catch(e){continue}
  if(m.type==='ping'){send(c,{type:'pong',t:m.t,hub:Date.now()});continue}
  if(c.role==='HOST'){ // host → phones (to: 'all' | role | cid)
   const to=m.to||'all';for(const x of R.clients)if(to==='all'||x.role===to||x.cid===to)send(x,m)}
  else{ // phone → host, stamped with the authenticated role (phones cannot fake a role)
   if(R.host)send(R.host,Object.assign({},m,{role:c.role,cid:c.cid,hubT:Date.now()}));else send(c,{type:'ack',id:m.id,ok:false,msg:'کامپیوتر وصل نیست'})}}});
 const bye=()=>{if(!c.alive)return;c.alive=false;if(!R)return;if(R.host===c){R.host=null;for(const x of R.clients)send(x,{type:'host',online:false})}else{R.clients.delete(c);roster()}};
 sock.on('close',bye);sock.on('error',bye);
 if(c.role==='HOST')for(const x of R.clients)send(x,{type:'host',online:true})}

const server=http.createServer(async(req,res)=>{const u=new URL(req.url,'http://x');const route=API[`${req.method} ${u.pathname}`];
 if(route){try{await route(req,res)}catch(e){console.warn(u.pathname,e.message);if(!res.headersSent)json(res,e.status||500,{error:e.message})}return}
 if(u.pathname.startsWith('/api/'))return json(res,404,{error:'unknown api'});
 let p=decodeURIComponent(u.pathname);if(p.endsWith('/'))p+='index.html';const f=path.join(ROOT,path.normalize(p).replace(/^(\.\.[\/\\])+/,''));
 if(!f.startsWith(ROOT)){res.writeHead(403);return res.end()}
 fs.readFile(f,(err,data)=>{if(err){res.writeHead(404);return res.end('not found')}res.writeHead(200,{'Content-Type':MIME[path.extname(f).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data)})});
server.on('upgrade',onUpgrade);
server.listen(PORT,HOST,()=>{console.log(`\n DADASHMODE V7 → http://localhost:${PORT}`);for(const ip of lan())console.log(` گوشی روی همان وای‌فای: http://${ip}:${PORT}   (کنترل گوشی: /remote.html)`);console.log(' Phone Mode hub: ws://<ip>:'+PORT+'/v7ws · بدون اینترنت کار می‌کند\n')});
export {server,rooms};
