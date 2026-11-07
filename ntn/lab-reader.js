(() => {
'use strict';
const root=document.body,method=window.NTN_METHODS?.[root.dataset.method];if(!method)return;
const $=id=>document.getElementById(id),canvas=$('nrGeometryCanvas');
if(!canvas){for(const event of ['input','change','click'])document.addEventListener(event,()=>requestAnimationFrame(syncIO));syncIO();return;}
const ctx=canvas.getContext('2d');
const D=Math.PI/180,add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,k)=>a.map(v=>v*k),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),norm=a=>Math.hypot(...a),unit=a=>mul(a,1/(norm(a)||1)),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],angle=(a,b)=>Math.atan2(norm(cross(a,b)),dot(a,b)),clamp=x=>Math.max(-1,Math.min(1,x));
const C={ink:'#203143',muted:'#687782',blue:'#286f92',red:'#bf5a46',green:'#2c7b78',gold:'#ad7b32',grid:'#d7e3e3'};
let mode='position',view='local',yaw=-.38,pitch=.48,W=800,H=420,drag=null,scene=null,last=0,visible=true,dirty=true;
function sceneData(){
 if(typeof window.NTNReadScene!=='function')return null;
 try{
  const s=window.NTNReadScene();if(!s||!s.sats?.length||!s.ue?.every(Number.isFinite))return null;
  s.n=unit(s.ref);s.e=unit(cross([0,0,1],s.n));if(norm(s.e)<.1)s.e=[0,1,0];s.q=unit(cross(s.n,s.e));s.local=v=>[dot(v,s.e),dot(v,s.q),dot(v,s.n)];
  s.ps=mul(s.n,s.R);s.neighbor=s.sats[1]||s.sats[0];s.slant=norm(sub(s.ref,s.ue));s.elevation=Math.asin(clamp(dot(unit(sub(s.ref,s.ue)),unit(s.ue))))/D;s.offaxis=angle(sub(s.target,s.ref),sub(s.ue,s.ref))/D;s.psi=angle(s.ps,s.ue)/D;
  return s;
 }catch(e){console.error('NTN geometry reader:',e);return null;}
}
function fit(){const r=canvas.getBoundingClientRect();W=Math.max(280,r.width);H=Math.max(280,r.height);const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);dirty=true;}
function txt(t,x,y,color=C.muted,size=11,align='left'){ctx.font=`${size}px -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(t,x,y);ctx.textAlign='left';}
function tag(t,p,color=C.ink,dx=10,dy=-10){ctx.font='11px -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif';const w=ctx.measureText(t).width,x=p[0]+dx,y=p[1]+dy;ctx.fillStyle='#ffffffec';ctx.fillRect(x-3,y-12,w+6,17);txt(t,x,y,color,11);}
function line(a,b,color=C.grid,width=1,dash=[]){ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);}
function path(points,color=C.grid,width=1,fill=null){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));if(fill){ctx.closePath();ctx.fillStyle=fill;ctx.fill();}ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function dot2(p,r,color,stroke=null){ctx.beginPath();ctx.arc(p[0],p[1],r,0,2*Math.PI);ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}}
function arrow(a,b,color=C.muted){line(a,b,color,1.4);const t=Math.atan2(b[1]-a[1],b[0]-a[0]);for(const z of [-.42,.42])line(b,[b[0]-8*Math.cos(t+z),b[1]-8*Math.sin(t+z)],color,1.4);}
function satIcon(p,color){ctx.fillStyle=color;ctx.fillRect(p[0]-4,p[1]-5,8,10);ctx.globalAlpha=.7;ctx.fillRect(p[0]-14,p[1]-4,7,8);ctx.fillRect(p[0]+7,p[1]-4,7,8);ctx.globalAlpha=1;line([p[0]-14,p[1]],[p[0]+14,p[1]],color);}
function fmt(x,n=1){return Number.isFinite(x)?x.toFixed(n):'—';}
function setMode(v){mode=v;document.querySelectorAll('[data-lab-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.labMode===v));dirty=true;updateReading();}
function setView(v){view=v;if(v==='section')setMode('link');document.querySelectorAll('[data-lab-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.labView===v));dirty=true;}
function updateReading(){if(!scene)return;
 const readings={position:['先分开 P、B 与 U','P 是卫星沿地心法向投到地面的星下点；B 是实际波束指向的波位中心；U 是 UE。三者可以位于不同位置。先看径向抬升，再看离轴指向。','P = Rₑ · S/‖S‖\n‖S‖ = Rₑ + h\nB ∈ 球面，B 不必等于 P'],direction:[root.dataset.method==='zte-6870'?'轨道坐标与波束方向分开':'每颗卫星都有自己的局部基',method.direction,root.dataset.method==='zte-6870'?'轨道平面内生成位置\nS = Rz(Ω) Rx(i) · r(u)\n波束方向再转入地心坐标':'ℓ = (B−S) / ‖B−S‖\nu = ℓ·ê₁, v = ℓ·ê₂\nw = ℓ·n̂nadir\nu² + v² + w² = 1'],link:['同一个 UE，分别连接每颗星','蓝线与红线到达同一个 U；斜距分别计算。卫星端的 θ 是相对该束中心的偏离角；UE 端的 ε 是相对当地水平面的仰角。两者的顶点和参考方向不同。','d = ‖S−U‖\nε = asin[ (S−U)·Û / d ]\nθ = angle(B−S, U−S)']};
 const a=readings[mode];$('nrGeometryHeading').textContent=a[0];$('nrGeometryExplanation').textContent=a[1];$('nrGeometryFormula').textContent=a[2];
 $('nrGeometryReadout').textContent=`h = ${fmt(scene.h,0)} km\n服务斜距 d = ${fmt(scene.slant)} km\nUE 仰角 ε = ${fmt(scene.elevation)}°\n波束偏离角 θ = ${fmt(scene.offaxis,2)}°`;
 $('nrGeometryCaption').textContent=method.sceneNote+' '+(scene.note||'')+' 三维图的高度、地表与距离由同一组坐标计算；局部视图和全景视图采用各自缩放。';
}
function camera(s){
 const local=global=>s.local(global),near=v=>{const a=local(v);return[a[0],a[1],a[2]-s.R];};
 const p=s.sats.map(x=>near(x.pos)),g=s.points.map(near),u=near(s.ue),b=near(s.target),used=mode==='position'?p:[p[0],u,b];
 const extent=Math.max(250,Math.min(s.R*.95,Math.max(...used.map(v=>Math.hypot(v[0],v[1])),...g.map(v=>Math.hypot(v[0],v[1])))*1.2));
 const sc=view==='global'?Math.min(W*.32,H*.39)/(s.R+s.h):Math.min(W*.40/extent,H*.42/(s.h+extent*.32));
 const center=[W*.5,view==='global'?H*.54:H*.69];
 function project(v){const a=view==='global'?local(v):near(v),x=a[0]*Math.cos(yaw)-a[1]*Math.sin(yaw),z=a[0]*Math.sin(yaw)+a[1]*Math.cos(yaw),y=a[2]*Math.cos(pitch)-z*Math.sin(pitch),depth=a[2]*Math.sin(pitch)+z*Math.cos(pitch);return[center[0]+sc*x,center[1]-sc*y,depth];}
 return {project,extent,sc,near};
}
function earthSurface(s,camera){
 const {project,extent,sc}=camera;
 if(view==='global'){
  const center=project([0,0,0]),r=s.R*sc;const grad=ctx.createRadialGradient(center[0]-r*.35,center[1]-r*.4,r*.1,center[0],center[1],r);grad.addColorStop(0,'#f4f9f5');grad.addColorStop(1,'#d4e3e3');ctx.beginPath();ctx.arc(center[0],center[1],r,0,2*Math.PI);ctx.fillStyle=grad;ctx.fill();ctx.strokeStyle='#b9cfd3';ctx.stroke();
  const facing=v=>project(v)[2]>0;
  for(let lat=-60;lat<=60;lat+=30){let run=[];for(let lo=-180;lo<=180;lo+=3){const v=[s.R*Math.cos(lat*D)*Math.cos(lo*D),s.R*Math.cos(lat*D)*Math.sin(lo*D),s.R*Math.sin(lat*D)];if(facing(v))run.push(project(v));else{if(run.length>1)path(run,'#bdd1d2',.8);run=[];}}if(run.length>1)path(run,'#bdd1d2',.8);}
  for(let lo=-150;lo<=180;lo+=30){let run=[];for(let lat=-90;lat<=90;lat+=3){const v=[s.R*Math.cos(lat*D)*Math.cos(lo*D),s.R*Math.cos(lat*D)*Math.sin(lo*D),s.R*Math.sin(lat*D)];if(facing(v))run.push(project(v));else{if(run.length>1)path(run,'#bdd1d2',.8);run=[];}}if(run.length>1)path(run,'#bdd1d2',.8);}
  dot2(center,3,C.muted);tag('O 地心',center,C.muted,8,18);
 }else{
  const span=extent,point=(x,y)=>{const a=Math.hypot(x,y)/s.R;return mul(add(mul(s.n,Math.cos(a)),mul(add(mul(s.e,x),mul(s.q,y)),Math.sin(a)/(Math.hypot(x,y)||1))),s.R);};
  const edge=[];for(let j=0;j<=30;j++)edge.push(project(point(-span+2*span*j/30,-span)));for(let j=0;j<=30;j++)edge.push(project(point(span,-span+2*span*j/30)));for(let j=0;j<=30;j++)edge.push(project(point(span-2*span*j/30,span)));for(let j=0;j<=30;j++)edge.push(project(point(-span,span-2*span*j/30)));path(edge,'#dbe7e5',1,'#f0f6f3');
  for(let i=-4;i<=4;i++)for(const f of [false,true]){const run=[];for(let j=0;j<=60;j++){const a=i*span/4,b=-span+2*span*j/60;run.push(project(point(f?b:a,f?a:b)));}path(run,'#dce7e4',.7);}
 }
}
function arc3(o,a,b,r,pj,color){const A=unit(a),B=unit(b),pts=[];for(let i=0;i<=24;i++)pts.push(pj(add(o,mul(unit(add(mul(A,1-i/24),mul(B,i/24))),r))));path(pts,color,1.4);}
function localPlane(s,pj){
 const P=s.ref,n=s.n,e=s.uvE||s.e,q=s.uvN||s.q,L=Math.min(s.h*.5,300),center=sub(P,mul(n,L)),span=Math.min(s.h*.48,290);
 const corner=(a,b)=>pj(add(center,add(mul(e,a),mul(q,b))));
 path([corner(-span,-span),corner(span,-span),corner(span,span),corner(-span,span),corner(-span,-span)],'#88a6b5',1,'#dbeaf366');
 arrow(pj(center),corner(span,0),C.blue);arrow(pj(center),corner(0,span),C.green);tag('ê₁',corner(span,0),C.blue,5,-5);tag('ê₂',corner(0,span),C.green,5,-5);tag('局部参考平面',corner(-span,-span),C.muted,-15,22);
 arrow(pj(P),pj(sub(P,mul(n,s.h*.40))),C.muted);tag('天底方向',pj(sub(P,mul(n,s.h*.38))),C.muted,-64,15);
 const ray=unit(sub(s.target,P)),u=dot(ray,e),v=dot(ray,q);const bx=17,by=H-76;
 ctx.fillStyle='#ffffffed';ctx.fillRect(bx,by-36,190,80);ctx.strokeStyle='#dce5e5';ctx.strokeRect(bx,by-36,190,80);txt('方向余弦索引',bx+10,by-17,C.blue,10);txt(`u=${fmt(u,4)}   v=${fmt(v,4)}`,bx+10,by+3,C.ink,11);txt('坐标轴沿用本页阵列坐标约定',bx+10,by+23,C.muted,9);
}
function drawOrbits(s,cam){if(view!=='global'||!s.orbitNormals?.length)return;const O=cam.project([0,0,0]);for(const [i,n] of s.orbitNormals.entries()){const normal=unit(n);let e=unit(cross(normal,[0,0,1]));if(norm(e)<.1)e=[1,0,0];const q=unit(cross(normal,e));let run=[];for(let j=0;j<=144;j++){const t=j*Math.PI/72,v=mul(add(mul(e,Math.cos(t)),mul(q,Math.sin(t))),s.R+s.h),p=cam.project(v),show=p[2]>=0||Math.hypot(p[0]-O[0],p[1]-O[1])>=s.R*cam.sc;if(show)run.push(p);else{if(run.length>1)path(run,['#a6bbca','#bed1c5','#d9c4ac'][i%3],1);run=[];}}if(run.length>1)path(run,['#a6bbca','#bed1c5','#d9c4ac'][i%3],1);}}
function drawGeometry(){if(!scene)return;
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#fdfefd';ctx.fillRect(0,0,W,H);
 if(view==='section'){drawSection();return;}
 const s=scene,cam=camera(s),pj=cam.project;earthSurface(s,cam);drawOrbits(s,cam);
 if(mode==='direction'&&root.dataset.method!=='zte-6870')localPlane(s,pj);
 for(const p of s.points.filter((_,i,a)=>i%Math.max(1,Math.ceil(a.length/140))===0)){const pt=pj(p);if(view==='local'||pt[2]>0)dot2(pt,1.8,'#90b4a6');}
 const ss=mode==='position'?s.sats:s.sats.slice(0,2);
 for(let i=ss.length-1;i>=0;i--){const x=ss[i],g=mul(unit(x.pos),s.R),P=pj(g),S=pj(x.pos),color=i===0?C.blue:i===1?C.red:'#95a5ad';const O=pj([0,0,0]);if(view==='global'&&S[2]<0&&Math.hypot(S[0]-O[0],S[1]-O[1])<s.R*cam.sc)continue;if(view==='local'||P[2]>0)line(S,P,color,i<2?1.5:1,[4,4]);if(view==='local'||P[2]>0)dot2(P,i<2?4:2.5,i<2?C.green:'#9cafaa','white');satIcon(S,color);if(view==='global'&&i<2){const call=[W*(i===0?.28:.70),48+i*23];line(call,S,color,1);tag(String(x.id),call,color,-10,-7);}else if(view==='local'&&(i<2||mode==='position'&&W>560))tag(String(x.id),S,color,15,-8);if(i===0){if(view==='global')line(pj([0,0,0]),P,C.muted,1,[3,4]);if(view==='local')tag('P 星下点',P,C.green,-71,25);if(mode==='position'&&view==='local')tag(`h=${fmt(s.h,0)} km`,[(P[0]+S[0])/2,(P[1]+S[1])/2],C.blue,9,-2);}}
 const B=pj(s.target),U=pj(s.ue),S=pj(s.ref),I=pj(s.neighbor.pos);dot2(B,4.5,C.green,'white');if(view==='local')tag('B 波位中心',B,C.green,9,26);dot2(U,5,C.gold,'white');if(view==='local')tag('U / UE',U,C.gold,10,-13);
 if(mode==='link'){
  line(S,B,C.green,1,[3,4]);line(S,U,C.blue,2.3);line(I,U,C.red,1.8);if(view==='local')tag(`d₀=${fmt(s.slant,0)} km`,[(S[0]+U[0])/2,(S[1]+U[1])/2],C.blue,8,-10);if(view==='local')tag(`d₁=${fmt(norm(sub(s.neighbor.pos,s.ue)),0)} km`,[(I[0]+U[0])/2,(I[1]+U[1])/2],C.red,8,19);
  arc3(s.ref,sub(s.target,s.ref),sub(s.ue,s.ref),s.h*.28,pj,C.green);if(view==='local')tag(`θ=${fmt(s.offaxis,2)}°`,S,C.green,-88,27);const upUnit=unit(s.ue),look=unit(sub(s.ref,s.ue)),horizontal=unit(sub(look,mul(upUnit,dot(look,upUnit))));if(norm(horizontal)>.1)arc3(s.ue,horizontal,look,s.h*.20,pj,C.gold);if(view==='local')tag(`ε=${fmt(s.elevation)}°`,U,C.gold,-76,-16);const up=add(s.ue,mul(upUnit,s.h*.27));arrow(U,pj(up),C.muted);if(view==='local')tag('当地天顶',pj(up),C.muted,7,-8);
 }else{line(S,B,C.green,1.8);if(mode==='direction')line(S,U,C.gold,1.6,[5,4]);}
 if(mode==='direction'&&root.dataset.method==='zte-6870'){
  const O=pj([0,0,0]);if(view==='global'){for(const [v,label,col] of [[[s.R*1.15,0,0],'X',C.blue],[[0,s.R*1.15,0],'Y',C.green],[[0,0,s.R*1.15],'Z / 自转轴',C.gold]]){arrow(O,pj(v),col);tag(label,pj(v),col,5,-7);}}
  txt('轨道坐标与附录网格坐标分别使用',16,H-20,C.muted,10);
 }else txt(view==='global'?'地球全景 · 高度与地球半径按真实比例':'球面局部 · 拖动观察独立星下点与径向高度',16,25,C.muted,10);
 if(mode==='direction'&&root.dataset.method!=='zte-6870')txt('参考平面表示局部基朝向；u、v 由单位方向得到',W-17,H-16,C.muted,9,'right');
}
function drawSection(){
 const s=scene,small=W<500,cx=small?77:130,cy=H*.52,r=small?57:90,O=[cx,cy],sat=[cx,cy-r*(1+s.h/s.R)],psi=s.psi*D,U=[cx+r*Math.sin(psi),cy-r*Math.cos(psi)],P=[cx,cy-r];
 ctx.beginPath();ctx.arc(...O,r,0,Math.PI*2);ctx.fillStyle='#edf5f1';ctx.fill();ctx.strokeStyle='#bed3d1';ctx.stroke();line(O,sat,C.grid);line(O,U,C.green,1,[4,3]);line(sat,U,C.blue,1.5);dot2(O,2.8,C.muted);dot2(U,3.8,C.gold);satIcon(sat,C.blue);tag('O',O,C.muted,6,17);tag('S',sat,C.blue,-9,-14);tag('U',U,C.gold,8,15);txt('全局剖面',cx,H-43,C.muted,10,'center');txt(`ψ=${fmt(s.psi,2)}°`,cx,H-23,C.green,10,'center');
 const x0=small?W*.69:W*.65,y0=H*.79,up=unit(s.ue),toward=sub(s.ref,s.ue);let tangent=sub(s.n,mul(up,dot(s.n,up)));if(norm(tangent)<1e-9)tangent=unit(cross(up,[0,0,1]));if(norm(tangent)<1e-9)tangent=[0,1,0];tangent=unit(tangent);
 let tx=dot(toward,tangent),tz=dot(toward,up),scale=Math.min((small?W*.21:W*.24)/Math.max(80,Math.abs(tx)),H*.51/Math.max(s.h,tz));const a=[x0,y0],b=[x0+tx*scale,y0-tz*scale];
 line([x0-(small?60:140),y0],[x0+(small?45:140),y0],C.green,1.6);line(a,[x0,y0-H*.57],C.grid,1,[4,4]);line(a,b,C.blue,2);dot2(a,5,C.gold,'white');satIcon(b,C.blue);tag('U / UE',a,C.gold,-17,27);tag('S 服务星',b,C.blue,-18,-16);
 let theta=Math.atan2(-tz,tx),radius=small?32:46;ctx.beginPath();ctx.arc(x0,y0,radius,Math.min(0,theta),Math.max(0,theta));ctx.strokeStyle=C.gold;ctx.lineWidth=1.5;ctx.stroke();txt(`ε=${fmt(s.elevation)}°`,x0+6,y0-radius-13,C.gold,11);tag(`d=${fmt(s.slant)} km`,[(a[0]+b[0])/2,(a[1]+b[1])/2],C.blue,9,2);txt('当地水平面',x0+(small?42:138),y0+20,C.green,10,'right');txt('UE 局部剖面 · 独立缩放',x0,28,C.muted,10,'center');
}
function syncIO(){
 if(document.getElementById('mf-config'))return;
 let n=0;const key=root.dataset.method;
 if(key==='zte-6870')n=+document.querySelector('#majorSteps .active')?.dataset.value||0;
 else if(key==='qualcomm')n=+document.querySelector('#qcMajor .active')?.dataset.value||0;
 else if(key==='xiaomi')n=+document.querySelector('#steps .active')?.dataset.major||0;
 else if(key==='huawei')n=+document.querySelector('.path .active')?.dataset.step||0;
 else if(key==='vivo')n=(+document.querySelector('.steps [aria-selected=true]')?.dataset.step||1)-1;
 else if(key==='610'){const t=+document.querySelector('.setup-index .active')?.dataset.step||0;n=t<5?0:t<8?1:2;}
 const row=method.steps[n];if(!row)return;
 document.querySelectorAll('#nrStepIO>div>span').forEach((s,i)=>{if(s.textContent!==row[i+1])s.textContent=row[i+1];});
}
for(const b of document.querySelectorAll('[data-lab-mode]'))b.addEventListener('click',()=>setMode(b.dataset.labMode));
for(const b of document.querySelectorAll('[data-lab-view]'))b.addEventListener('click',()=>setView(b.dataset.labView));
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag||view==='section')return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;yaw+=dx*.008;pitch=Math.max(-1.1,Math.min(1.2,pitch+dy*.006));drag={x:e.clientX,y:e.clientY};dirty=true;});
for(const event of ['pointerup','pointercancel'])canvas.addEventListener(event,()=>drag=null);
canvas.addEventListener('dblclick',()=>{yaw=-.38;pitch=.48;dirty=true;});
canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key)){e.preventDefault();if(e.key==='Home'){yaw=-.38;pitch=.48;}else{yaw+=(e.key==='ArrowRight'?.12:e.key==='ArrowLeft'?-.12:0);pitch=Math.max(-1.1,Math.min(1.2,pitch+(e.key==='ArrowDown'?.12:e.key==='ArrowUp'?-.12:0)));}dirty=true;}});
for(const event of ['input','change','click'])document.addEventListener(event,e=>{if(e.target.closest('.nr-geometry'))return;requestAnimationFrame(()=>{scene=sceneData();syncIO();updateReading();dirty=true;});});
const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{rootMargin:'100px'});observer.observe(canvas);
new ResizeObserver(fit).observe(canvas);fit();
function frame(t){if(visible&&(dirty||t-last>700)){scene=sceneData();if(scene){updateReading();drawGeometry();dirty=false;}last=t;}requestAnimationFrame(frame);}syncIO();requestAnimationFrame(frame);
})();


