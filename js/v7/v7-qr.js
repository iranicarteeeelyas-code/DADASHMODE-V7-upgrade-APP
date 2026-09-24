/* DADASHMODE V7 · tiny offline QR encoder (byte mode, ECC level M, versions 1–10). No network, no dependency.
   Algorithm follows ISO/IEC 18004 (structure after Nayuki's reference implementation). */
(function(root,f){const Q=f();if(typeof module!=='undefined'&&module.exports)module.exports=Q;else root.V7QR=Q})(typeof self!=='undefined'?self:this,function(){
'use strict';
const ECC_M=[-1,10,16,26,18,24,16,18,22,22,26],BLK_M=[-1,1,1,1,2,2,4,4,4,5,5];
const rawModules=v=>{let r=(16*v+128)*v+64;if(v>=2){const n=Math.floor(v/7)+2;r-=(25*n-10)*n-55;if(v>=7)r-=36}return r};
const dataCw=v=>Math.floor(rawModules(v)/8)-ECC_M[v]*BLK_M[v];
function mul(x,y){let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11D);z^=((y>>>i)&1)*x}return z&255}
function rsDivisor(d){const r=new Array(d).fill(0);r[d-1]=1;let root=1;for(let i=0;i<d;i++){for(let j=0;j<r.length;j++){r[j]=mul(r[j],root);if(j+1<r.length)r[j]^=r[j+1]}root=mul(root,2)}return r}
function rsRem(data,div){const r=div.map(()=>0);for(const b of data){const f=b^r.shift();r.push(0);div.forEach((c,i)=>r[i]^=mul(c,f))}return r}
function encode(text){const bytes=[...new TextEncoder().encode(text)];let v=1;for(;v<=10;v++){const cap=dataCw(v)*8;const need=4+(v<10?8:16)+bytes.length*8;if(need<=cap)break}if(v>10)throw new Error('text too long for QR v10');
 const bits=[];const put=(val,n)=>{for(let i=n-1;i>=0;i--)bits.push((val>>>i)&1)};put(4,4);put(bytes.length,v<10?8:16);bytes.forEach(b=>put(b,8));
 const cap=dataCw(v)*8;put(0,Math.min(4,cap-bits.length));while(bits.length%8)bits.push(0);for(let p=0xEC;bits.length<cap;p^=0xEC^0x11)put(p,8);
 const data=[];for(let i=0;i<bits.length;i+=8)data.push(bits.slice(i,i+8).reduce((a,b)=>a<<1|b,0));
 const nb=BLK_M[v],ecl=ECC_M[v],raw=Math.floor(rawModules(v)/8),nShort=nb-raw%nb,shortLen=Math.floor(raw/nb);const div=rsDivisor(ecl);const blocks=[];
 for(let i=0,k=0;i<nb;i++){const dat=data.slice(k,k+shortLen-ecl+(i<nShort?0:1));k+=dat.length;const ecc=rsRem(dat,div);if(i<nShort)dat.push(0);blocks.push(dat.concat(ecc))}
 const all=[];for(let i=0;i<blocks[0].length;i++)blocks.forEach((b,j)=>{if(i!==shortLen-ecl||j>=nShort)all.push(b[i])});
 const size=v*4+17;const M=[...Array(size)].map(()=>new Array(size).fill(false)),F=[...Array(size)].map(()=>new Array(size).fill(false));
 const set=(x,y,d)=>{M[y][x]=d;F[y][x]=true};
 for(let i=0;i<size;i++){set(6,i,i%2===0);set(i,6,i%2===0)}
 const finder=(cx,cy)=>{for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const x=cx+dx,y=cy+dy;if(x<0||y<0||x>=size||y>=size)continue;const d=Math.max(Math.abs(dx),Math.abs(dy));set(x,y,d!==2&&d!==4)}};
 finder(3,3);finder(size-4,3);finder(3,size-4);
 if(v>1){const n=Math.floor(v/7)+2,step=Math.ceil((v*4+4)/(n*2-2))*2;const pos=[6];for(let p=size-7;pos.length<n;p-=step)pos.splice(1,0,p);
  for(const a of pos)for(const b of pos){if((a===6&&b===6)||(a===6&&b===size-7)||(a===size-7&&b===6))continue;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(a+dx,b+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1)}}
 const fmt=mask=>{const d=(0<<3)|mask;let r=d;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);const b=((d<<10)|r)^0x5412;const g=i=>((b>>>i)&1)===1;
  for(let i=0;i<=5;i++)set(8,i,g(i));set(8,7,g(6));set(8,8,g(7));set(7,8,g(8));for(let i=9;i<15;i++)set(14-i,8,g(i));
  for(let i=0;i<8;i++)set(size-1-i,8,g(i));for(let i=8;i<15;i++)set(8,size-15+i,g(i));set(8,size-8,true)};
 fmt(0);
 if(v>=7){let r=v;for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1F25);const b=(v<<12)|r;for(let i=0;i<18;i++){const bit=((b>>>i)&1)===1,a=size-11+i%3,c=Math.floor(i/3);set(a,c,bit);set(c,a,bit)}}
 let i=0;for(let right=size-1;right>=1;right-=2){if(right===6)right=5;for(let vert=0;vert<size;vert++)for(let j=0;j<2;j++){const x=right-j,up=((right+1)&2)===0,y=up?size-1-vert:vert;if(!F[y][x]&&i<all.length*8){M[y][x]=((all[i>>>3]>>>(7-(i&7)))&1)===1;i++}}}
 const MASKS=[(x,y)=>(x+y)%2===0,(x,y)=>y%2===0,(x,y)=>x%3===0,(x,y)=>(x+y)%3===0,(x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0,(x,y)=>x*y%2+x*y%3===0,(x,y)=>(x*y%2+x*y%3)%2===0,(x,y)=>((x+y)%2+x*y%3)%2===0];
 const apply=m=>{for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!F[y][x]&&MASKS[m](x,y))M[y][x]=!M[y][x]};
 const penalty=()=>{let p=0,dark=0;for(let y=0;y<size;y++){let run=1;for(let x=0;x<size;x++){if(M[y][x])dark++;if(x&&M[y][x]===M[y][x-1]){run++;if(run===5)p+=3;else if(run>5)p++}else run=1}}
  for(let x=0;x<size;x++){let run=1;for(let y=1;y<size;y++){if(M[y][x]===M[y-1][x]){run++;if(run===5)p+=3;else if(run>5)p++}else run=1}}
  for(let y=0;y<size-1;y++)for(let x=0;x<size-1;x++){const c=M[y][x];if(c===M[y][x+1]&&c===M[y+1][x]&&c===M[y+1][x+1])p+=3}
  p+=Math.floor(Math.abs(dark*20-size*size*10)/(size*size))*10;return p};
 let best=0,bp=1e9;for(let m=0;m<8;m++){apply(m);fmt(m);const pp=penalty();if(pp<bp){bp=pp;best=m}apply(m)}apply(best);fmt(best);
 return{size,modules:M,version:v}}
function toSVG(text,px=6,margin=4){const q=encode(text);const n=q.size+margin*2;let d='';for(let y=0;y<q.size;y++)for(let x=0;x<q.size;x++)if(q.modules[y][x])d+=`M${x+margin} ${y+margin}h1v1h-1z`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" width="${n*px}" height="${n*px}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`}
return{encode,toSVG}});
