/* DADASHMODE V7 · WebGL Chroma Studio (cinema-grade keying + compositing, runs fully on the GPU, offline).
   Pipeline (6 passes):  FG ─▶ [1 key: 3×3 box-filtered CbCr distance (BT.709, OBS-style similarity/smoothness/spill)
                                 + channel despill + garbage matte]
                          ─▶ [2 matte refine: choke/dilate + edge softness]
                     BG ─▶ [3 downsample + separable Gaussian blur]  (light-wrap source)
                          ─▶ [4 composite in LINEAR light + light wrap + FG colour match + grade (lift/gamma/gain, split-tone)]
                          ─▶ [5 bloom: threshold + separable blur]  ─▶ [6 final: bloom add, film grain, vignette, 2.39 letterbox, sRGB encode]
   Sources: camera · video/image file · the app stage canvas (#stage) · solid colour.
   Typical: FG = camera on green screen, BG = app graphics — or FG = app in chroma mode, BG = field footage.
   The studio window is DOM, so it is never burnt into the main recording; it records its own output (WebM). */
'use strict';
(function(){
const DM=window.DM5||{};
const VS='attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
const HEAD='precision highp float;varying vec2 uv;';
const FS_KEY=HEAD+`uniform sampler2D t;uniform vec2 px;uniform vec2 key;uniform float sim,smo,spl,desp;uniform vec3 kch;uniform vec4 crop;uniform float fgOn;
float cd(vec3 c){float cb=-.1146*c.r-.3854*c.g+.5*c.b+.5;float cr=.5*c.r-.4542*c.g-.0458*c.b+.5;return distance(key,vec2(cb,cr));}
void main(){vec4 c=texture2D(t,uv);if(fgOn<.5){gl_FragColor=vec4(0.);return;}
 float d=cd(c.rgb);d+=cd(texture2D(t,uv-px).rgb);d+=cd(texture2D(t,uv+vec2(0.,-px.y)).rgb);d+=cd(texture2D(t,uv+vec2(px.x,-px.y)).rgb);d+=cd(texture2D(t,uv+vec2(-px.x,0.)).rgb);
 d+=cd(texture2D(t,uv+vec2(px.x,0.)).rgb);d+=cd(texture2D(t,uv+vec2(-px.x,px.y)).rgb);d+=cd(texture2D(t,uv+vec2(0.,px.y)).rgb);d+=cd(texture2D(t,uv+px).rgb);d/=9.;
 float base=d-sim;float a=pow(clamp(base/max(smo,.0001),0.,1.),1.5);float sv=pow(clamp(base/max(spl,.0001),0.,1.),1.5);
 float y=dot(c.rgb,vec3(.2126,.7152,.0722));vec3 rgb=mix(vec3(y),c.rgb,sv);
 /* channel despill: clamp the key channel to the other two (edge fringe removal) */
 float kc=dot(rgb,kch);float o1=kch.g>.5?rgb.r:rgb.g;float o2=kch.b>.5?rgb.r:rgb.b;if(kch.r>.5){o1=rgb.g;o2=rgb.b;}float lim=mix(max(o1,o2),(o1+o2)*.5,.5);float nk=min(kc,lim);rgb+=kch*(mix(kc,nk,desp)-kc);
 if(uv.x<crop.x||uv.x>1.-crop.y||uv.y>1.-crop.z||uv.y<crop.w)a=0.;
 gl_FragColor=vec4(rgb,a);}`;
const FS_MATTE=HEAD+`uniform sampler2D t;uniform vec2 px;uniform float choke,soft;
float er(vec2 u){float a=texture2D(t,u).a;vec2 r=px*abs(choke);float b=texture2D(t,u+vec2(r.x,0.)).a,c=texture2D(t,u-vec2(r.x,0.)).a,d=texture2D(t,u+vec2(0.,r.y)).a,e=texture2D(t,u-vec2(0.,r.y)).a;
 return choke>=0.?min(a,min(min(b,c),min(d,e))):max(a,max(max(b,c),max(d,e)));}
void main(){vec2 s=px*soft;float a=er(uv)*4.;a+=er(uv+vec2(s.x,0.))+er(uv-vec2(s.x,0.))+er(uv+vec2(0.,s.y))+er(uv-vec2(0.,s.y));a+=.5*(er(uv+s)+er(uv-s)+er(uv+vec2(s.x,-s.y))+er(uv+vec2(-s.x,s.y)));a/=10.;
 gl_FragColor=vec4(texture2D(t,uv).rgb,a);}`;
const FS_BLUR=HEAD+`uniform sampler2D t;uniform vec2 dir;uniform float thr;
vec3 f(vec2 u){vec3 c=texture2D(t,u).rgb;return thr>0.?max(c-vec3(thr),0.)/(1.-thr):c;}
void main(){vec3 c=f(uv)*.227027;c+=(f(uv+dir*1.3846)+f(uv-dir*1.3846))*.316216;c+=(f(uv+dir*3.2308)+f(uv-dir*3.2308))*.070270;gl_FragColor=vec4(c,1.);}`;
const FS_COMP=HEAD+`uniform sampler2D fg,bg,bgb;uniform vec2 px;uniform float wrap,wrapR,exposure,sat,temp,contrast,gsat;uniform vec3 lift,gam,gain,shadowT,hiT;uniform float split;uniform vec3 solid;uniform float bgMode;uniform float view;
vec3 L(vec3 c){return pow(max(c,0.),vec3(2.2));}vec3 G(vec3 c){return pow(max(c,0.),vec3(1./2.2));}
void main(){vec4 f=texture2D(fg,uv);vec3 b=bgMode>.5?texture2D(bg,uv).rgb:solid;vec3 bb=bgMode>.5?texture2D(bgb,uv).rgb:solid;
 if(view>.5&&view<1.5){gl_FragColor=vec4(vec3(f.a),1.);return;}
 if(view>1.5&&view<2.5){float ch=mod(floor(uv.x*48.)+floor(uv.y*27.),2.);b=vec3(.18+.1*ch);bb=b;}
 if(view>2.5){gl_FragColor=vec4(b,1.);return;}
 vec3 fl=L(f.rgb)*exp2(exposure);float y=dot(fl,vec3(.2126,.7152,.0722));fl=mix(vec3(y),fl,sat);fl*=vec3(1.+temp*.08,1.,1.-temp*.08);
 vec2 r=px*wrapR;float ab=0.;ab+=texture2D(fg,uv+vec2(r.x,0.)).a+texture2D(fg,uv-vec2(r.x,0.)).a+texture2D(fg,uv+vec2(0.,r.y)).a+texture2D(fg,uv-vec2(0.,r.y)).a;ab+=texture2D(fg,uv+r*.7).a+texture2D(fg,uv-r*.7).a+texture2D(fg,uv+vec2(r.x,-r.y)*.7).a+texture2D(fg,uv+vec2(-r.x,r.y)*.7).a;ab/=8.;
 float wm=clamp(f.a*(1.-ab)*2.,0.,1.)*wrap;
 vec3 c=mix(L(b),fl,f.a)+L(bb)*wm;
 /* grade (ASC-CDL-like lift/gamma/gain in display space + split-tone + contrast) */
 vec3 d=G(c);d=gain*(d+lift*(1.-d));d=pow(max(d,0.),1./max(gam,vec3(.01)));float yl=dot(d,vec3(.2126,.7152,.0722));d+=split*(mix(shadowT,hiT,smoothstep(.2,.8,yl))-.5)*.12;
 d=(d-.5)*contrast+.5;yl=dot(d,vec3(.2126,.7152,.0722));d=mix(vec3(yl),d,gsat);gl_FragColor=vec4(clamp(d,0.,1.),1.);}`;
const FS_FINAL=HEAD+`uniform sampler2D t,bl;uniform float bloom,grain,vig,box,time;uniform float view;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233))+time)*43758.5453);}
void main(){vec3 c=texture2D(t,uv).rgb;if(view>.5){gl_FragColor=vec4(c,1.);return;}vec3 l=pow(c,vec3(2.2))+pow(texture2D(bl,uv).rgb,vec3(2.2))*bloom;c=pow(l,vec3(1./2.2));
 c+=(h(uv*vec2(1920.,1080.))-.5)*grain;vec2 q=uv-.5;c*=1.-vig*smoothstep(.25,.85,length(q*vec2(1.,.8))*1.25);
 if(box>.5&&abs(uv.y-.5)>.5*(16./9.)/2.39)c=vec3(0.);gl_FragColor=vec4(clamp(c,0.,1.),1.);}`;
const GRADES={none:{lift:[0,0,0],gam:[1,1,1],gain:[1,1,1],split:0,sh:[.5,.5,.5],hi:[.5,.5,.5],contrast:1,gsat:1},
 blockbuster:{lift:[0,.01,.03],gam:[1,1,1.02],gain:[1.03,1,.96],split:1,sh:[.2,.55,.75],hi:[.85,.6,.35],contrast:1.12,gsat:1.08},
 goldshow:{lift:[.01,0,0],gam:[1.02,1,.97],gain:[1.06,1.02,.9],split:.7,sh:[.25,.3,.6],hi:[.95,.75,.35],contrast:1.1,gsat:1.12},
 punchy:{lift:[0,0,0],gam:[1,1,1],gain:[1.02,1.02,1.02],split:0,sh:[.5,.5,.5],hi:[.5,.5,.5],contrast:1.22,gsat:1.25},
 noir:{lift:[.02,.02,.02],gam:[1,1,1],gain:[1,1,1],split:0,sh:[.5,.5,.5],hi:[.5,.5,.5],contrast:1.3,gsat:0}};
const DEF={key:'#00b140',sim:.36,smo:.08,spl:.14,desp:.8,choke:1,soft:1.5,crop:[0,0,0,0],wrap:.18,wrapR:6,exposure:0,sat:1,temp:0,grade:'goldshow',bloom:.25,bthr:.72,grain:.025,vig:.35,box:false,fg:'camera',bg:'stage',solid:'#0f1f45',view:0,res:1080};
const CK=window.V7Chroma={open,close,cfg:Object.assign({},DEF),GRADES,DEF};
let ui=null,cv=null,gl=null,P={},T={},FB={},raf=0,src={fg:null,bg:null},rec=null,chunks=[];
function hex2rgb(h){h=h.replace('#','');return[0,2,4].map(i=>parseInt(h.substr(i,2),16)/255)}
function keyCbCr(h){const[r,g,b]=hex2rgb(h);return[-.1146*r-.3854*g+.5*b+.5,.5*r-.4542*g-.0458*b+.5]}
function kch(h){const c=hex2rgb(h);const m=c.indexOf(Math.max(...c));return [0,1,2].map(i=>i===m?1:0)}
function sh(type,s){const o=gl.createShader(type);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o}
function prog(fs){const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,VS));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));gl.bindAttribLocation(p,0,'p');gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));p.u={};return p}
function U(p,n){return p.u[n]!==undefined?p.u[n]:(p.u[n]=gl.getUniformLocation(p,n))}
function tex(){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);[gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER].forEach(k=>gl.texParameteri(gl.TEXTURE_2D,k,gl.LINEAR));[gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T].forEach(k=>gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE));gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));return t}
function fbo(w,h){const t=tex();gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);gl.bindFramebuffer(gl.FRAMEBUFFER,null);return{f,t,w,h}}
function initGL(){gl=cv.getContext('webgl',{premultipliedAlpha:false,preserveDrawingBuffer:true,antialias:false});if(!gl)throw new Error('WebGL در این مرورگر در دسترس نیست');
 const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
 P={key:prog(FS_KEY),matte:prog(FS_MATTE),blur:prog(FS_BLUR),comp:prog(FS_COMP),fin:prog(FS_FINAL)};T={fg:tex(),bg:tex()};alloc()}
function alloc(){const W=cv.width,H=cv.height,w4=Math.max(2,W>>2),h4=Math.max(2,H>>2);FB={a:fbo(W,H),b:fbo(W,H),c:fbo(w4,h4),d:fbo(w4,h4),e:fbo(W,H),f:fbo(w4,h4),g:fbo(w4,h4)}}
function pass(p,target,binds,uni){gl.useProgram(p);gl.bindFramebuffer(gl.FRAMEBUFFER,target?target.f:null);gl.viewport(0,0,target?target.w:cv.width,target?target.h:cv.height);
 let i=0;for(const n in binds){gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,binds[n]);gl.uniform1i(U(p,n),i);i++}
 for(const n in uni){const v=uni[n];const l=U(p,n);if(l==null)continue;if(typeof v==='number')gl.uniform1f(l,v);else if(v.length===2)gl.uniform2fv(l,v);else if(v.length===3)gl.uniform3fv(l,v);else gl.uniform4fv(l,v)}
 gl.drawArrays(gl.TRIANGLE_STRIP,0,4)}
function upload(t,el){if(!el)return false;if(el.tagName==='VIDEO'&&el.readyState<2)return false;if(el.tagName==='IMG'&&!el.complete)return false;gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,el)}catch(e){return false}gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);return true}
function frame(){raf=requestAnimationFrame(frame);if(!gl)return;const c=CK.cfg;const W=cv.width,H=cv.height;const px=[1/W,1/H];
 const fgOk=upload(T.fg,src.fg&&src.fg.el);const bgOk=upload(T.bg,src.bg&&src.bg.el);
 pass(P.key,FB.a,{t:T.fg},{px,key:keyCbCr(c.key),sim:c.sim,smo:c.smo,spl:c.spl,desp:c.desp,kch:kch(c.key),crop:c.crop,fgOn:fgOk?1:0});
 pass(P.matte,FB.b,{t:FB.a.t},{px,choke:c.choke,soft:c.soft});
 const bs=[1/FB.c.w,1/FB.c.h];pass(P.blur,FB.c,{t:T.bg},{dir:[bs[0]*2,0],thr:0});pass(P.blur,FB.d,{t:FB.c.t},{dir:[0,bs[1]*2],thr:0});
 const g=GRADES[c.grade]||GRADES.none;
 pass(P.comp,FB.e,{fg:FB.b.t,bg:T.bg,bgb:FB.d.t},{px,wrap:c.wrap,wrapR:c.wrapR,exposure:c.exposure,sat:c.sat,temp:c.temp,contrast:g.contrast,gsat:g.gsat,lift:g.lift,gam:g.gam,gain:g.gain,split:g.split,shadowT:g.sh,hiT:g.hi,solid:hex2rgb(c.solid),bgMode:(c.bg!=='color'&&bgOk)?1:0,view:c.view});
 pass(P.blur,FB.f,{t:FB.e.t},{dir:[bs[0]*1.5,0],thr:c.bthr});pass(P.blur,FB.g,{t:FB.f.t},{dir:[0,bs[1]*1.5],thr:0});pass(P.blur,FB.f,{t:FB.g.t},{dir:[bs[0]*3,0],thr:0});pass(P.blur,FB.g,{t:FB.f.t},{dir:[0,bs[1]*3],thr:0});
 pass(P.fin,null,{t:FB.e.t,bl:FB.g.t},{bloom:c.bloom,grain:c.grain,vig:c.vig,box:c.box?1:0,time:(performance.now()%10000)/1000,view:c.view});
 if(ui){const i=ui.querySelector('#v7ckInfo');if(i)i.textContent=`${W}×${H} · FG ${fgOk?'●':'○'} · BG ${bgOk||c.bg==='color'?'●':'○'}${rec?' · ● REC':''}`}}
/* ---------- sources ---------- */
async function setSource(slot,type,file){const old=src[slot];if(old&&old.stop)old.stop();let s=null;
 if(type==='stage'){const el=document.getElementById('stage');s={el}}
 else if(type==='camera'){const devId=ui&&ui.querySelector('#v7ckCam').value;const stream=await navigator.mediaDevices.getUserMedia({video:Object.assign({width:{ideal:1920},height:{ideal:1080},frameRate:{ideal:30}},devId?{deviceId:{exact:devId}}:{}),audio:false});const v=document.createElement('video');v.muted=true;v.playsInline=true;v.srcObject=stream;await v.play();s={el:v,stop:()=>stream.getTracks().forEach(t=>t.stop()),stream}}
 else if(type==='file'&&file){const url=URL.createObjectURL(file);if(file.type.startsWith('image/')){const im=new Image();im.src=url;s={el:im,stop:()=>URL.revokeObjectURL(url)}}else{const v=document.createElement('video');v.src=url;v.loop=true;v.muted=true;v.playsInline=true;await v.play().catch(()=>{});s={el:v,stop:()=>{v.pause();URL.revokeObjectURL(url)}}}}
 src[slot]=s;CK.cfg[slot]=type}
CK.setSource=setSource;CK.setSourceEl=(slot,el)=>{if(src[slot]&&src[slot].stop)src[slot].stop();src[slot]=el?{el}:null};
function samplePixel(u,v){const el=src.fg&&src.fg.el;if(!el)return null;const c=document.createElement('canvas');c.width=320;c.height=180;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(el,0,0,320,180);const d=x.getImageData(Math.floor(u*319),Math.floor(v*179),1,1).data;return'#'+[d[0],d[1],d[2]].map(n=>n.toString(16).padStart(2,'0')).join('')}
function autoKey(){const el=src.fg&&src.fg.el;if(!el)return;const c=document.createElement('canvas');c.width=160;c.height=90;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(el,0,0,160,90);const d=x.getImageData(0,0,160,90).data;const acc=[0,0,0];let n=0;
 for(let y=0;y<90;y++)for(let xx=0;xx<160;xx++){if(y>6&&y<84&&xx>8&&xx<152)continue;const i=(y*160+xx)*4;acc[0]+=d[i];acc[1]+=d[i+1];acc[2]+=d[i+2];n++}CK.cfg.key='#'+acc.map(v=>Math.round(v/n).toString(16).padStart(2,'0')).join('');sync()}
/* ---------- recording (own output) ---------- */
async function toggleRec(){if(rec){rec.stop();return}const fps=30;const st=cv.captureStream(fps);if(ui.querySelector('#v7ckMic').checked){try{const a=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false}});a.getAudioTracks().forEach(t=>st.addTrack(t))}catch(e){}}
 const mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(m=>window.MediaRecorder&&MediaRecorder.isTypeSupported(m))||'';chunks=[];rec=new MediaRecorder(st,{mimeType:mime,videoBitsPerSecond:CK.cfg.res>=1440?32e6:16e6});rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);
 rec.onstop=()=>{const b=new Blob(chunks,{type:'video/webm'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`DADASHMODE-V7-chroma-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.webm`;a.click();st.getTracks().forEach(t=>t.stop());rec=null;sync()};rec.start(1000);sync()}
/* ---------- UI ---------- */
const SL=[['sim','شباهت (Similarity)',0,1,.005],['smo','نرمی لبه (Smoothness)',.001,.4,.001],['spl','کاهش نشت رنگ (Spill)',.001,.5,.001],['desp','حذف هالهٔ سبز (Despill)',0,1,.01],['choke','جمع/باز کردن مات (px)',-4,6,.1],['soft','نرمی مات (px)',0,6,.1],
 ['wrap','لایت‌رپ (Light wrap)',0,.6,.01],['wrapR','شعاع لایت‌رپ',1,16,.5],['exposure','نوردهی سوژه (EV)',-2,2,.05],['sat','اشباع سوژه',0,2,.01],['temp','دمای رنگ سوژه',-3,3,.05],['bloom','بلوم (Bloom)',0,1.2,.01],['bthr','آستانهٔ بلوم',.3,.95,.01],['grain','گرین فیلم',0,.12,.002],['vig','وینیت',0,1,.01]];
function build(){ui=document.createElement('div');ui.className='v7ck';ui.innerHTML=`<div class="v7ck-stage"><canvas id="v7ckCv"></canvas><div class="v7ck-info" id="v7ckInfo"></div></div>
 <aside class="v7ck-side"><header><b>استودیو کروما · WebGL</b><button class="v7b" data-ck="close">✕</button></header>
 <div class="v7ck-g"><label>پیش‌زمینه (سوژه)<select id="v7ckFg"><option value="camera">دوربین</option><option value="file">فایل ویدیو/عکس</option><option value="stage">خروجی اپ (حالت کروما)</option><option value="none">هیچ</option></select></label>
 <label>پس‌زمینه<select id="v7ckBg"><option value="stage">گرافیک اپ</option><option value="file">فایل ویدیو/عکس</option><option value="camera">دوربین</option><option value="color">رنگ ثابت</option></select></label>
 <label>دوربین<select id="v7ckCam"><option value="">پیش‌فرض</option></select></label><input type="file" id="v7ckFile" accept="video/*,image/*" hidden></div>
 <div class="v7ck-g"><label>رنگ کلید<input type="color" id="v7ckKey"></label><button class="v7b" data-ck="auto">🎯 تشخیص خودکار</button><button class="v7b" data-ck="pick">💧 قطره‌چکان (کلیک روی تصویر)</button></div>
 <div class="v7ck-g"><label>نما<select id="v7ckView"><option value="0">نهایی</option><option value="1">مات (آلفا)</option><option value="2">سوژه روی شطرنجی</option><option value="3">فقط پس‌زمینه</option></select></label>
 <label>گرید<select id="v7ckGrade">${Object.keys(GRADES).map(k=>`<option value="${k}">${{none:'بدون',blockbuster:'بلاک‌باستر (تیل/نارنجی)',goldshow:'شوی طلایی',punchy:'پرانرژی',noir:'نوآر'}[k]}</option>`).join('')}</select></label>
 <label><input type="checkbox" id="v7ckBox"> لترباکس ۲.۳۹</label><label>کیفیت<select id="v7ckRes"><option value="720">720p</option><option value="1080">1080p</option><option value="1440">1440p</option></select></label></div>
 <div class="v7ck-sl">${SL.map(([k,l,a,b,s])=>`<label><span>${l} <i data-o="${k}"></i></span><input type="range" data-k="${k}" min="${a}" max="${b}" step="${s}"></label>`).join('')}
 <label><span>برش مات (چپ/راست/بالا/پایین)</span><div class="v7row">${[0,1,2,3].map(i=>`<input type="range" data-crop="${i}" min="0" max=".45" step=".005">`).join('')}</div></label></div>
 <div class="v7ck-g"><button class="v7b gold" data-ck="rec">● ضبط خروجی</button><label><input type="checkbox" id="v7ckMic"> صدای میکروفون</label><button class="v7b" data-ck="save">ذخیرهٔ تنظیمات</button><button class="v7b" data-ck="reset">پیش‌فرض</button><button class="v7b" data-ck="png">📸 عکس</button></div>
 <p class="v7ck-help">پیشنهاد: پرده را یکنواخت نور بدهید، سوژه ۱٫۵–۲ متر جلوتر از پرده. شباهت را تا حذف کامل پرده بالا ببرید، بعد نرمی لبه را کم‌کم زیاد کنید؛ هاله را با Despill و «جمع کردن مات» ۱–۲ پیکسل بگیرید.</p></aside>`;
 document.body.appendChild(ui);cv=ui.querySelector('#v7ckCv');
 ui.addEventListener('input',e=>{const k=e.target.dataset.k;if(k){CK.cfg[k]=+e.target.value;sync(true)}const ci=e.target.dataset.crop;if(ci!=null){CK.cfg.crop[+ci]=+e.target.value}if(e.target.id==='v7ckKey')CK.cfg.key=e.target.value});
 ui.addEventListener('change',async e=>{const id=e.target.id;try{
  if(id==='v7ckFg'||id==='v7ckBg'){const slot=id==='v7ckFg'?'fg':'bg';const v=e.target.value;if(v==='file'){const f=ui.querySelector('#v7ckFile');f.dataset.slot=slot;f.click();return}if(v==='color'||v==='none'){if(src[slot]&&src[slot].stop)src[slot].stop();src[slot]=null;CK.cfg[slot]=v;return}await setSource(slot,v)}
  if(id==='v7ckFile'&&e.target.files[0])await setSource(e.target.dataset.slot,'file',e.target.files[0]);
  if(id==='v7ckView')CK.cfg.view=+e.target.value;if(id==='v7ckGrade')CK.cfg.grade=e.target.value;if(id==='v7ckBox')CK.cfg.box=e.target.checked;if(id==='v7ckRes'){CK.cfg.res=+e.target.value;size();}
  if(id==='v7ckCam'&&CK.cfg.fg==='camera')await setSource('fg','camera')}catch(err){toast('منبع باز نشد: '+err.message)}});
 let picking=false;ui.addEventListener('click',e=>{const a=e.target.closest('[data-ck]');if(a){const k=a.dataset.ck;if(k==='close')close();if(k==='auto')autoKey();if(k==='pick'){picking=true;cv.style.cursor='crosshair';toast('روی پردهٔ سبز کلیک کنید')}if(k==='rec')toggleRec();if(k==='save'){DM.kvPut&&DM.kvPut('v7-chroma',CK.cfg);toast('ذخیره شد')}if(k==='reset'){CK.cfg=Object.assign({},DEF,{crop:[0,0,0,0],fg:CK.cfg.fg,bg:CK.cfg.bg});sync()}if(k==='png'){const l=document.createElement('a');l.href=cv.toDataURL('image/png');l.download='dadashmode-v7-chroma.png';l.click()}return}
  if(picking&&e.target===cv){const r=cv.getBoundingClientRect();const c=samplePixel((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);if(c){CK.cfg.key=c;sync()}picking=false;cv.style.cursor=''}});
 ui.addEventListener('keydown',e=>e.stopPropagation());
 navigator.mediaDevices&&navigator.mediaDevices.enumerateDevices&&navigator.mediaDevices.enumerateDevices().then(ds=>{const s=ui.querySelector('#v7ckCam');ds.filter(d=>d.kind==='videoinput').forEach((d,i)=>{const o=document.createElement('option');o.value=d.deviceId;o.textContent=d.label||('دوربین '+(i+1));s.appendChild(o)})}).catch(()=>{})}
function size(){const h=CK.cfg.res||1080;cv.width=Math.round(h*16/9);cv.height=h;if(gl)alloc()}
function sync(onlyOut){if(!ui)return;const c=CK.cfg;ui.querySelectorAll('[data-k]').forEach(i=>{if(!onlyOut)i.value=c[i.dataset.k]});ui.querySelectorAll('[data-o]').forEach(o=>{const v=c[o.dataset.o];o.textContent=typeof v==='number'?(Math.round(v*1000)/1000):''});
 if(onlyOut)return;ui.querySelectorAll('[data-crop]').forEach(i=>i.value=c.crop[+i.dataset.crop]);ui.querySelector('#v7ckKey').value=c.key;ui.querySelector('#v7ckView').value=c.view;ui.querySelector('#v7ckGrade').value=c.grade;ui.querySelector('#v7ckBox').checked=!!c.box;ui.querySelector('#v7ckRes').value=c.res;ui.querySelector('#v7ckFg').value=c.fg;ui.querySelector('#v7ckBg').value=c.bg;
 const r=ui.querySelector('[data-ck="rec"]');r.textContent=rec?'■ توقف ضبط':'● ضبط خروجی';r.classList.toggle('bad',!!rec)}
const toast=m=>{try{window.V7&&V7.toast?V7.toast(m):console.log(m)}catch(e){}};
async function open(){if(ui){ui.hidden=false;if(!raf)frame();return}build();try{const s=DM.kvGet&&await DM.kvGet('v7-chroma');if(s)CK.cfg=Object.assign({},DEF,s,{crop:(s.crop||[0,0,0,0]).slice()})}catch(e){}CK.cfg.crop=CK.cfg.crop.slice();size();
 try{initGL()}catch(e){ui.querySelector('.v7ck-stage').innerHTML='<p class="v7note">'+e.message+'</p>';return}sync();
 try{if(CK.cfg.bg==='stage'||CK.cfg.bg==='camera')await setSource('bg',CK.cfg.bg);if(CK.cfg.fg==='stage')await setSource('fg','stage');else if(CK.cfg.fg==='camera')await setSource('fg','camera').catch(()=>toast('دوربین در دسترس نیست؛ منبع دیگری انتخاب کنید'))}catch(e){}frame()}
function close(){if(!ui)return;ui.hidden=true;cancelAnimationFrame(raf);raf=0;for(const k of ['fg','bg'])if(src[k]&&src[k].stream){src[k].stop();src[k]=null}}
})();
