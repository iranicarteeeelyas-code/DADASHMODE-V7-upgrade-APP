#!/usr/bin/env node
/* DADASHMODE V7 · installer. Adds V7 on top of the working v5 app. Adds only; removes nothing. Safe to run twice.
   usage (inside the app folder):   node apply-v7.mjs            → install / update
                                     node apply-v7.mjs --check    → only report what is installed
                                     node apply-v7.mjs --uninstall→ remove the V7 tags again (files stay; backups are kept) */
import fs from 'node:fs';
const JS=['js/v7/v7-engine.js','js/v7/v7-data.js','js/v7/v7-qr.js','js/v7/v7-core.js','js/v7/v7-stage.js','js/v7/v7-controller.js','js/v7/v7-sync.js','js/v7/v7-panel.js','js/v7/v7-chroma.js'];
const CSS=['css/v7.css','css/v7-ctl.css'];
const EXTRA=['remote.html','js/v7/remote.js','episodes/ep1-time-bank-v7.json'];
const arg=process.argv[2]||'';
const die=m=>{console.error('✕ '+m);process.exit(1)};
if(!fs.existsSync('index.html'))die('index.html پیدا نشد؛ این دستور را داخل پوشهٔ اپ (کنار index.html) اجرا کنید');
for(const f of [...JS,...CSS,...EXTRA])if(!fs.existsSync(f))die('پیدا نشد: '+f+' — محتوای زیپ را مستقیم داخل پوشهٔ اپ باز کنید');
for(const f of ['js/stage.js','js/show.js','js/game.js','js/p345-core.js'])if(!fs.existsSync(f))die('این پوشه اپ v5 نیست (نبود '+f+')');
let html=fs.readFileSync('index.html','utf8');const stamp=new Date().toISOString().replace(/[:.]/g,'-');
if(arg==='--check'){console.log('JS  :',JS.map(f=>(html.includes(`src="${f}"`)?'✓ ':'✕ ')+f).join('\n      '));console.log('CSS :',CSS.map(f=>(html.includes(`href="${f}"`)?'✓ ':'✕ ')+f).join('\n      '));process.exit(0)}
fs.writeFileSync(`index.html.bak-v7-${stamp}`,html);
if(arg==='--uninstall'){html=html.replace(/\n?\s*<!-- DADASHMODE V7[^>]*-->/g,'');for(const f of JS)html=html.replace(new RegExp(`\\n?\\s*<script[^>]*src="${f.replace(/[.\/]/g,'\\$&')}"[^>]*></script>`,'g'),'');for(const f of CSS)html=html.replace(new RegExp(`\\n?\\s*<link[^>]*href="${f.replace(/[.\/]/g,'\\$&')}"[^>]*>`,'g'),'');fs.writeFileSync('index.html',html);console.log('✓ تگ‌های V7 حذف شد (فایل‌ها و نسخهٔ پشتیبان باقی ماندند). Ctrl+Shift+R');process.exit(0)}
/* scripts: after the LAST existing js/ script so every v5 global exists first */
const todo=JS.filter(f=>!html.includes(`src="${f}"`));
if(todo.length){const re=/<script\b[^>]*\bsrc=["'](?![^"']*v7\/)[^"']*js\/[^"']+["'][^>]*>\s*<\/script>/gi;let last=null,m;while((m=re.exec(html)))last=m;
 const lastV7=[...html.matchAll(/<script\b[^>]*src="js\/v7\/[^"]+"[^>]*><\/script>/g)].pop();const anchor=lastV7||last;
 const defer=last&&/\bdefer\b/i.test(last[0])?' defer':'';const tags=(lastV7?'':'\n<!-- DADASHMODE V7 (Director Book V7) -->')+todo.map(f=>`\n<script src="${f}"${defer}></script>`).join('');
 if(anchor){const at=anchor.index+anchor[0].length;html=html.slice(0,at)+tags+html.slice(at)}else html=html.replace(/<\/body>/i,tags+'\n</body>');console.log('✓ اسکریپت‌ها: '+todo.join(', '))}else console.log('✓ اسکریپت‌ها قبلاً نصب بوده');
const ctodo=CSS.filter(f=>!html.includes(`href="${f}"`));
if(ctodo.length){html=html.replace(/<\/head>/i,ctodo.map(f=>`<link rel="stylesheet" href="${f}">`).join('\n')+'\n</head>');console.log('✓ استایل‌ها: '+ctodo.join(', '))}
fs.writeFileSync('index.html',html);
if(fs.existsSync('sw.js')){let sw=fs.readFileSync('sw.js','utf8');fs.writeFileSync(`sw.js.bak-v7-${stamp}`,sw);const add=[...JS,...CSS,'remote.html','js/v7/remote.js'].filter(f=>!sw.includes(`'${f}'`));
 if(add.length)sw=sw.replace(/(const CORE=\[)/,`$1${add.map(f=>`'${f}',`).join('')}`);
 if(!sw.includes('/api/')&&sw.includes("addEventListener('fetch',e=>{"))sw=sw.replace("addEventListener('fetch',e=>{","addEventListener('fetch',e=>{if(new URL(e.request.url).pathname.startsWith('/api/'))return;");
 sw=sw.replace(/const VERSION='([^']+)'/,(a,v)=>`const VERSION='${v.replace(/-v7.*$/,'')}-v7-${Date.now().toString(36)}'`);fs.writeFileSync('sw.js',sw);console.log('✓ sw.js: فایل‌های V7 برای کار بدون اینترنت + نسخهٔ کش جدید')}
console.log(`
تمام ✓  اجرا:  node tools/serve-v7.mjs   (یا start-v7.bat / start-v7.sh)
بعد در مرورگر: http://localhost:3000  و یک بار Ctrl+Shift+R
سمت چپ: «V7 کنترل» و «استودیو کروما» · F2 = QR گوشی · C = زیرنویس روشن/خاموش`);
