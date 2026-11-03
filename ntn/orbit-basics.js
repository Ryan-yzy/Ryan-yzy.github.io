(() => {
 'use strict';
 const M=window.NTNOrbit,$=id=>document.getElementById(id),D=M.D,TAU=2*Math.PI;
 const C={ink:'#203143',muted:'#71818b',blue:'#286f92',green:'#2b8275',red:'#c35c48',gold:'#aa7b2c',grid:'#e0e8e7'};
 const palette=['#32759a','#3d927c','#b17c3c','#9273a6','#b66470','#588f9c','#7285a2','#8c9560','#b08097','#5e9a9b','#9b8052','#7b83b2'];
 const state={h:600,i:53,P:4,S:6,F:1,type:'delta',u0:45,raan0:0,t:0,frame:'eci',p:0,q:0,ueLat:31,ueLon:30,minEl:30,speed:300,playing:false};
 const element={i:53,o:25,u:55},camera={elementsCanvas:{az:.8,el:.48},walkerCanvas:{az:.78,el:.39}};
 let dirty=true,traceKey='',trace=[],last=0,lastDraw=0,satellites=[];
 const fmt=(x,n=1)=>Number.isFinite(x)?x.toFixed(n):'—',signed=(x,n=1)=>(x>=0?'+':'')+fmt(x,n),color=p=>palette[p%palette.length];
 const vector=v=>'['+v.map(x=>fmt(x,1)).join(', ')+'] km';
 function setting(){return {h:state.h,i:state.i,P:state.P,S:state.S,F:state.F,type:state.type,u0:state.u0,raan0:state.raan0};}
 function setText(id,v){$(id).textContent=v;}
 function rebuild(){state.F=Math.max(0,Math.min(state.P-1,state.F));state.p=Math.min(state.P-1,state.p);state.q=Math.min(state.S-1,state.q);$('phase').max=state.P-1;$('phase').value=state.F;
  for(const [id,count,current,prefix] of [['selectedPlane',state.P,state.p,'P'],['selectedSatellite',state.S,state.q,'S']]){
   $(id).innerHTML=Array.from({length:count},(_,k)=>`<option value="${k}">${prefix}${k}</option>`).join('');$(id).value=current;
  }
  $('planeLegend').innerHTML=Array.from({length:state.P},(_,p)=>`<span><i class="dot" style="background:${color(p)}"></i>P${p}</span>`).join('')+'<span><i class="dot red"></i>红圈：所选卫星</span><span><i class="dot gold"></i>地面 UE</span>';
  const c=setting(),T=state.P*state.S,span=state.type==='star'?180:360;
  setText('planesOut',state.P+' 面');setText('perPlaneOut',state.S+' 星');setText('phaseOut',state.F);setText('inclinationOut',fmt(state.i,1)+'°');setText('totalOut',T+' 星');
  setText('walkerTitle',`Walker ${state.type==='star'?'Star':'Delta'} · ${fmt(state.i,1)}° : ${T}/${state.P}/${state.F}`);
  setText('raanGap',fmt(span/state.P,2)+'°');setText('raanGapFormula',`${span}° / P`);setText('alongGap',fmt(360/state.S,2)+'°');setText('phaseGap',fmt(state.F*360/T,2)+'°');
  setText('phaseExplanation',`当前 ${T}/${state.P}/${state.F}：跨面 Ω 间隔 ${fmt(span/state.P,2)}°；同面卫星间隔 ${fmt(360/state.S,2)}°；相邻面同序号星沿轨错开 ${fmt(state.F*360/T,2)}°。`);
  $('planeTable').innerHTML=Array.from({length:state.P},(_,p)=>{const a=M.satellite(c,p,0),b=M.satellite(c,p,1);return `<tr><td>P${p}</td><td>${fmt(a.raan,2)}°</td><td>${fmt(a.u,2)}°</td><td>${fmt(b.u,2)}°</td></tr>`;}).join('');
  setText('walkerWarning',state.i===0?'i=0° 时各轨道面都落在赤道面，Ω 的平面区分退化。':state.i===90&&state.type==='delta'&&state.P%2===0?'i=90° 且 Delta 的 P 为偶数时，Ω 相差 180° 的两组具有相同几何平面、相反绕行方向。':state.type==='star'&&state.i<70?'此处保留当前倾角以单独比较 Ω 的排布；Star 示例按钮采用近极轨。':'调节 P、S、F，观察平面朝向与沿轨相位如何分别改变。');
  traceKey='';dirty=true;updateBasics();
 }
 function updateBasics(){const a=M.circular(state.h);setText('radiusOut',fmt(a.r,0)+' km');setText('speedOut',fmt(a.v,3)+' km/s');setText('periodOut',fmt(a.period/60,2)+' min');setText('gravityOut',fmt(a.g,2)+' m/s²');setText('walkerPeriod',`${fmt(state.h,0)} km / ${fmt(a.period/60,1)} min`);setText('earthShift',`当前高度下，一圈约 ${fmt(a.period/60,2)} min；这段时间地球自转 ${fmt(M.WE*a.period/D,2)}°。本页两体模型中，一圈后的相同沿轨位置，在 ECEF 中相对起点向西偏移相同角度。`);}
 function updateTime(){const config=setting(),orb=M.circular(state.h);satellites=[];for(let p=0;p<state.P;p++)for(let q=0;q<state.S;q++)satellites.push(M.satellite(config,p,q,state.t));const selected=satellites[state.p*state.S+state.q],link=M.link(selected,state.ueLat,state.ueLon),visible=satellites.filter(s=>M.link(s,state.ueLat,state.ueLon).elevation>=state.minEl).length;
  $('time').value=state.t/orb.period*1000;setText('timeOut',fmt(state.t/60,1)+' min');setText('visibleOut',visible+' / '+satellites.length);setText('elevationOut',signed(link.elevation,1)+'°');setText('linkOut',`${fmt(link.distance,0)} km / ${fmt(link.delayMs,2)} ms`);setText('dopplerOut',signed(link.dopplerHz/1000,2)+' kHz');
  const status=link.elevation<0?'处于 UE 地平线以下，地球遮挡':link.elevation<state.minEl?'在地平线上方，仰角低于设定门限':'满足设定的 UE 仰角门限';
  setText('linkStatus',`跟踪 P${state.p}/S${state.q} · t=${fmt(state.t,1)} s · ${status}。多普勒正号表示接近，负号表示远离；遮挡时的链路读数仅表示几何计算。`);
  setText('phaseState',`u = 45° + ${state.q}×360°/${state.S} + ${state.p}×${state.F}×360°/${state.P*state.S} + (nt)×180°/π = ${fmt(selected.u,3)}°；Ω = ${fmt(selected.raan,2)}°`);
  setText('eciState',vector(selected.eci));setText('ecefState',`θE = ${fmt(M.WE*state.t/D,3)}°；r = ${vector(selected.ecef)}`);setText('geoState',`纬度 ${signed(selected.lat,3)}°，经度 ${signed(selected.lon,3)}°；斜距 ${fmt(link.distance,2)} km`);
  setText('frameCaption',state.frame==='eci'?'ECI 视图：轨道面在本页两体模型中固定，地球经纬网随自转运动。拖动旋转；背向观察者且被地球挡住的部分隐藏。':'ECEF 视图：经纬网固定，轨道面相对地面转动。坐标系转换只改变观察表示，同一时刻的距离和仰角保持一致。');
 }
 const sizes=new Map();
 function fit(canvas){const box=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(box.width*d);canvas.height=Math.round(box.height*d);sizes.set(canvas.id,{w:box.width,h:box.height,d});dirty=true;}
 function context(id){const canvas=$(id),s=sizes.get(id);if(!s||!s.w)return null;const c=canvas.getContext('2d');c.setTransform(s.d,0,0,s.d,0,0);c.clearRect(0,0,s.w,s.h);c.lineCap='round';c.lineJoin='round';return {c,w:s.w,h:s.h};}
 function text(c,s,x,y,col=C.muted,size=11,align='left'){c.font=`${size}px system-ui,sans-serif`;c.fillStyle=col;c.textAlign=align;c.fillText(s,x,y);}
 function line(c,a,b,col,width=1,dash=[]){c.beginPath();c.setLineDash(dash);c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.strokeStyle=col;c.lineWidth=width;c.stroke();c.setLineDash([]);}
 function path(c,points,col,width=1,fill=null){if(!points.length)return;c.beginPath();points.forEach((v,k)=>k?c.lineTo(v[0],v[1]):c.moveTo(v[0],v[1]));if(fill){c.closePath();c.fillStyle=fill;c.fill();}if(col){c.strokeStyle=col;c.lineWidth=width;c.stroke();}}
 function point(c,a,r,col,stroke=null){c.beginPath();c.arc(a[0],a[1],r,0,TAU);c.fillStyle=col;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}}
 function arrow(c,a,b,col,width=1.5){line(c,a,b,col,width);const t=Math.atan2(b[1]-a[1],b[0]-a[0]),r=6;path(c,[[b[0]-r*Math.cos(t-.5),b[1]-r*Math.sin(t-.5)],b,[b[0]-r*Math.cos(t+.5),b[1]-r*Math.sin(t+.5)]],col,width);}
 function project(w,h,cam,extent){const ca=Math.cos(cam.az),sa=Math.sin(cam.az),ce=Math.cos(cam.el),se=Math.sin(cam.el),right=[-sa,ca,0],up=[-se*ca,-se*sa,ce],front=[ce*ca,ce*sa,se],scale=Math.min(w*.43,h*.40)/extent,cx=w/2,cy=h*.53;
  return {scale,cx,cy,p:v=>[cx+scale*M.dot(v,right),cy-scale*M.dot(v,up),M.dot(v,front)]};}
 function unobscured(v,proj){const p=proj.p(v);return p[2]>=0||Math.hypot(p[0]-proj.cx,p[1]-proj.cy)>M.R*proj.scale;}
 function segment3(c,a,b,pj,col,width=1,opaque=false,dash=[]){const mid=M.mul(M.add(a,b),.5);if(opaque&&!unobscured(mid,pj))return;line(c,pj.p(a),pj.p(b),col,width,dash);}
 function sphere(c,pj,angle,transparent=false){const r=M.R*pj.scale,g=c.createRadialGradient(pj.cx-r*.35,pj.cy-r*.4,Math.max(1,r*.04),pj.cx,pj.cy,r);g.addColorStop(0,transparent?'#edf5f080':'#f1f7f2');g.addColorStop(1,transparent?'#cfdfdf55':'#c9dddd');c.beginPath();c.arc(pj.cx,pj.cy,r,0,TAU);c.fillStyle=g;c.fill();c.strokeStyle='#b4cbcb';c.lineWidth=1;c.stroke();
  const grid=(fn,col='#a9c5c7')=>{let previous=null;for(let k=0;k<=120;k++){const v=M.rotZ(fn(k/120),angle),p=pj.p(v);if(previous&&(!transparent?p[2]>=0&&previous[2]>=0:true))line(c,previous,p,col,.65);previous=p;}};
  for(let lat=-60;lat<=60;lat+=30)grid(t=>M.ground(lat,t*360));for(let lon=0;lon<360;lon+=30)grid(t=>M.ground(-90+t*180,lon),lon===0?'#ae9368':'#a9c5c7');
 }
 function drawMotion(){const z=context('motionCanvas');if(!z)return;const {c,w,h}=z,o=M.circular(state.h),scale=Math.min(w*.34,h*.35)/o.r,cx=w*.47,cy=h*.52,r=M.R*scale,rr=o.r*scale,a=.62+o.n*state.t;
  c.beginPath();c.arc(cx,cy,r,0,TAU);c.fillStyle='#e5f0eb';c.fill();c.strokeStyle='#b7d0ca';c.stroke();c.beginPath();c.arc(cx,cy,rr,0,TAU);c.setLineDash([5,4]);c.strokeStyle='#7fa7a0';c.stroke();c.setLineDash([]);
  const s=[cx+rr*Math.cos(a),cy-rr*Math.sin(a)],v=[s[0]-65*Math.sin(a),s[1]-65*Math.cos(a)],g=[s[0]-Math.cos(a)*54,s[1]+Math.sin(a)*54];line(c,[cx,cy],s,'#a5b7bd',1,[3,4]);arrow(c,s,v,C.blue,2);arrow(c,s,g,C.red,2);point(c,s,5,C.ink,'white');point(c,[cx,cy],3,C.muted);text(c,'O',cx+7,cy+15,C.muted,10);text(c,'地球',cx,cy+r*.46,C.green,11,'center');text(c,'S 卫星',s[0]+8,s[1]+16,C.ink,10);text(c,'v',v[0]+7,v[1]-3,C.blue,12);text(c,'引力',g[0]+7,g[1]+3,C.red,10);text(c,`r = ${fmt(o.r,0)} km`,20,h-37,C.muted,10);text(c,`h = ${fmt(state.h,0)} km`,20,h-20,C.muted,10);text(c,'切线方向运动 + 指向地心的加速度',17,25,C.muted,10);
 }
 function drawElements(){const z=context('elementsCanvas');if(!z)return;const {c,w,h}=z,r=M.R+state.h,pj=project(w,h,camera.elementsCanvas,r*1.25),o=element.o,i=element.i,u=element.u;
  const corners=(inc,raan)=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>{const x=M.orientation(r*1.08,inc,raan,0),y=M.orientation(r*1.08,inc,raan,90);return pj.p(M.add(M.mul(x,a),M.mul(y,b)));});
  path(c,corners(0,0),'#96b9ca',1,'#dcebf244');path(c,corners(i,o),'#85b3a5',1,'#dceee24d');sphere(c,pj,0,true);
  const orbit=[];for(let k=0;k<=180;k++)orbit.push(pj.p(M.orientation(r,i,o,k*2)));path(c,orbit,C.green,1.7);
  const eq=[];for(let k=0;k<=120;k++)eq.push(pj.p(M.orientation(r,0,0,k*3)));path(c,eq,C.blue,1);
  const A=M.orientation(r,i,o,0),B=M.mul(A,-1),sat=M.orientation(r,i,o,u),normal=M.unit(M.cross(M.orientation(1,i,o,0),M.orientation(1,i,o,90)));
  line(c,pj.p(B),pj.p(A),'#6f969e',1,[4,4]);line(c,pj.p([0,0,0]),pj.p(sat),C.red,1,[3,3]);point(c,pj.p(A),4,C.green,'white');point(c,pj.p(sat),5,C.red,'white');point(c,pj.p([0,0,0]),3,C.ink);
  arrow(c,pj.p([0,0,0]),pj.p([r*1.3,0,0]),C.blue);arrow(c,pj.p([0,0,0]),pj.p([0,0,r*1.35]),C.muted);arrow(c,pj.p([0,0,0]),pj.p(M.mul(normal,r*1.3)),C.green);
  let points=[];for(let k=0;k<=60;k++)points.push(pj.p(M.orientation(r*.50,0,0,o*k/60)));path(c,points,C.blue,2);
  points=[];for(let k=0;k<=80;k++)points.push(pj.p(M.orientation(r*.77,i,o,u*k/80)));path(c,points,C.red,2.3);
  points=[];for(let k=0;k<=40;k++){const a=i*D*k/40;points.push(pj.p(M.mul([Math.sin(o*D)*Math.sin(a),-Math.cos(o*D)*Math.sin(a),Math.cos(a)],r*.55)));}path(c,points,C.gold,2);
  const labels=[['O',[0,0,0],C.ink,7,16],['X 参考方向',[r*1.3,0,0],C.blue,5,4],['北极 +Z',[0,0,r*1.35],C.muted,6,-3],['轨道法向',M.mul(normal,r*1.3),C.green,6,-4],['A 升交点',A,C.green,6,17],['S 卫星',sat,C.red,8,-8]];
  for(const [s,v,col,dx,dy]of labels){const p=pj.p(v);text(c,s,p[0]+dx,p[1]+dy,col,10);}
  const po=pj.p(M.orientation(r*.58,0,0,o/2)),pu=pj.p(M.orientation(r*.84,i,o,u/2)),pi=pj.p(M.mul(M.unit(M.add([0,0,1],normal)),r*.63));text(c,`Ω=${o}°`,po[0],po[1],C.blue,10);text(c,`u=${u}°`,pu[0],pu[1],C.red,10);text(c,`i=${i}°`,pi[0]+6,pi[1],C.gold,10);
  setText('elementIOut',i+'°');setText('elementOOut',o+'°');setText('elementUOut',u+'°');setText('elementReadout','卫星 ECI 坐标：\n'+vector(sat));setText('elementDegenerate',i===0?'i=0° 时轨道与赤道重合，升交点的定义退化；此时用平面内的总相位定位卫星。':'绿色法向与 +Z 的夹角为 i；Ω 在赤道面内量，u 在轨道面内量。');
 }
 function drawWalker(){const z=context('walkerCanvas');if(!z)return;const {c,w,h}=z,r=M.R+state.h,pj=project(w,h,camera.walkerCanvas,r),theta=M.WE*state.t,transform=v=>state.frame==='eci'?v:M.rotZ(v,-theta);sphere(c,pj,state.frame==='eci'?theta:0);
  for(let p=0;p<state.P;p++){const raan=(state.type==='star'?180:360)*p/state.P;for(let k=0;k<128;k++){const a=transform(M.orientation(r,state.i,raan,k*360/128)),b=transform(M.orientation(r,state.i,raan,(k+1)*360/128));segment3(c,a,b,pj,color(p)+(p===state.p?'cc':'77'),p===state.p?1.8:1,true);}}
  const selected=satellites[state.p*state.S+state.q],ue=state.frame==='eci'?M.rotZ(M.ground(state.ueLat,state.ueLon),theta):M.ground(state.ueLat,state.ueLon),sPos=transform(selected.eci),link=M.link(selected,state.ueLat,state.ueLon);
  if(link.elevation>=0)segment3(c,sPos,ue,pj,C.gold,1.4,true,[3,3]);
  const sorted=satellites.map(s=>({s,pos:transform(s.eci)})).sort((a,b)=>pj.p(a.pos)[2]-pj.p(b.pos)[2]);
  for(const {s,pos}of sorted){if(!unobscured(pos,pj))continue;const chosen=s.p===state.p&&s.q===state.q,p=pj.p(pos);point(c,p,chosen?5.2:3.1,chosen?C.red:color(s.p),'#fff');if(chosen){c.beginPath();c.arc(p[0],p[1],9,0,TAU);c.strokeStyle=C.red;c.lineWidth=1.5;c.stroke();text(c,`P${s.p}/S${s.q}`,p[0]+12,p[1]-7,C.red,11);}else if(s.q===0&&state.P<=6)text(c,`P${s.p}/S0`,p[0]+6,p[1]-5,color(s.p),9);}
  const U=pj.p(ue);if(U[2]>=0){point(c,U,4,C.gold,'white');text(c,'UE',U[0]+6,U[1]+16,C.gold,10);}const N=pj.p([0,0,M.R*1.12]);text(c,'北极 / +Z',N[0]+8,N[1],C.muted,10);text(c,state.frame==='eci'?'惯性系中：轨道面固定，地球转动':'地固系中：地球固定，轨道面转动',15,25,C.muted,10);text(c,'拖动旋转 · 方向键 · Home 复位',w-14,h-17,C.muted,9,'right');
 }
 function drawRAAN(){const z=context('raanCanvas');if(!z)return;const {c,w,h}=z,cx=w/2,cy=h*.53,r=Math.min(w*.31,h*.32),span=state.type==='star'?180:360;c.beginPath();c.moveTo(cx,cy);c.arc(cx,cy,r,0,-span*D,true);c.closePath();c.fillStyle='#eaf2ef';c.fill();c.beginPath();c.arc(cx,cy,r,0,TAU);c.strokeStyle=C.grid;c.stroke();arrow(c,[cx-r*1.15,cy],[cx+r*1.2,cy],'#b5c6ce',1);arrow(c,[cx,cy+r*1.1],[cx,cy-r*1.15],'#b5c6ce',1);text(c,'0° / X',cx+r*1.16,cy+20,C.muted,9,'right');
  for(let p=0;p<state.P;p++){const a=span/state.P*p*D,pos=[cx+r*Math.cos(a),cy-r*Math.sin(a)];line(c,[cx,cy],pos,color(p),1.5);point(c,pos,4,color(p),'white');text(c,`P${p} · ${fmt(a/D,0)}°`,cx+(r+17)*Math.cos(a),cy-(r+17)*Math.sin(a)+3,color(p),9,Math.cos(a)>.3?'left':Math.cos(a)<-.3?'right':'center');}point(c,[cx,cy],3,C.ink);text(c,'从北极方向看赤道参考面',w/2,23,C.muted,10,'center');text(c,`${state.type==='star'?'Star':'Delta'}：铺开 ${span}°`,w/2,h-15,C.blue,11,'center');
 }
 function drawPhases(){const z=context('phaseCanvas');if(!z)return;const {c,w,h}=z,left=53,right=w-20,top=41,row=Math.min(34,(h-78)/state.P),x=u=>left+u/360*(right-left);for(let a=0;a<=360;a+=60){line(c,[x(a),top-12],[x(a),top+(state.P-1)*row+13],C.grid,1,[3,3]);text(c,a+'°',x(a),20,C.muted,9,'center');}
  for(let p=0;p<state.P;p++){const y=top+p*row;text(c,'P'+p,14,y+4,color(p),11);line(c,[left,y],[right,y],'#e4ebe8',1);for(let q=0;q<state.S;q++){const u=M.satellite(setting(),p,q,0).u;point(c,[x(u),y],q===0?5:3,q===0?'#fff':color(p),q===0?color(p):null);}}
  text(c,'横坐标为每面内的 u；圈出首星 q=0',left,h-15,C.muted,10);
 }
 function updateTrace(){const key=JSON.stringify([state.h,state.i,state.P,state.S,state.F,state.type,state.p,state.q]);if(key===traceKey)return;traceKey=key;const period=M.circular(state.h).period,c=setting();trace=Array.from({length:361},(_,k)=>M.satellite(c,state.p,state.q,period*k/360));}
 function drawGround(){const z=context('groundCanvas');if(!z)return;const {c,w,h}=z,L=38,rr=w-16,tt=24,bb=h-29,p=(lon,lat)=>[L+(lon+180)/360*(rr-L),tt+(90-lat)/180*(bb-tt)];c.fillStyle='#f2f6f3';c.fillRect(L,tt,rr-L,bb-tt);
  for(let lat=-60;lat<=60;lat+=30){line(c,p(-180,lat),p(180,lat),C.grid,lat===0?1.3:.8);text(c,lat+'°',L-7,p(0,lat)[1]+3,C.muted,9,'right');}for(let lon=-180;lon<=180;lon+=60){line(c,p(lon,-90),p(lon,90),C.grid,.8);text(c,lon+'°',p(lon,0)[0],h-10,C.muted,9,'center');}
  const drawGeo=(points,col,width=1,dash=[])=>{for(let k=1;k<points.length;k++)if(Math.abs(points[k].lon-points[k-1].lon)<180)line(c,p(points[k-1].lon,points[k-1].lat),p(points[k].lon,points[k].lat),col,width,dash);};
  updateTrace();drawGeo(trace,C.red+'88',1.3);
  const selected=satellites[state.p*state.S+state.q],normal=M.unit(selected.ecef),east=M.unit([-normal[1],normal[0],0]),north=M.cross(normal,east),psi=M.coverage(state.h,state.minEl),outline=[];
  for(let k=0;k<=120;k++){const a=k*TAU/120,v=M.add(M.mul(normal,Math.cos(psi)),M.mul(M.add(M.mul(east,Math.cos(a)),M.mul(north,Math.sin(a))),Math.sin(psi)));outline.push({lat:Math.asin(M.clamp(v[2]))/D,lon:Math.atan2(v[1],v[0])/D});}drawGeo(outline,'#87af9b',1.3,[3,3]);
  for(const s of satellites){const good=M.link(s,state.ueLat,state.ueLon).elevation>=state.minEl;point(c,p(s.lon,s.lat),good?3.8:2.5,good?C.green:color(s.p)+(state.P>6?'99':'cc'));}
  const pos=p(selected.lon,selected.lat);point(c,pos,5,C.red,'white');text(c,`P${state.p}/S${state.q}`,Math.min(rr-38,pos[0]+8),pos[1]-9,C.red,10);const U=p(state.ueLon,state.ueLat);point(c,U,4.5,C.gold,'white');text(c,'UE',Math.min(rr-18,U[0]+7),U[1]+16,C.gold,10);text(c,`t = ${fmt(state.t/60,1)} min`,rr-4,16,C.muted,9,'right');
 }
 function draw(){updateTime();drawMotion();drawElements();drawWalker();drawRAAN();drawPhases();drawGround();dirty=false;}
 function invalidate(reset=false){if(reset){state.t=0;state.playing=false;setText('play','▶ 播放');}rebuild();}
 function setHeight(h){state.h=Math.max(200,Math.min(36000,h));$('height').value=state.h;invalidate(true);}
 $('height').addEventListener('change',e=>{if(Number.isFinite(+e.target.value)&&e.target.value!=='')setHeight(+e.target.value);else e.target.value=state.h;});document.querySelectorAll('[data-height]').forEach(b=>b.onclick=()=>setHeight(+b.dataset.height));
 for(const [id,key]of [['elementI','i'],['elementO','o'],['elementU','u']])$(id).oninput=e=>{element[key]=+e.target.value;dirty=true;};
 for(const [id,key]of [['planes','P'],['perPlane','S'],['phase','F'],['inclination','i']])$(id).oninput=e=>{state[key]=+e.target.value;invalidate(true);};$('pattern').onchange=e=>{state.type=e.target.value;invalidate(true);};
 function preset(type,inc){state.type=type;state.i=inc;state.P=4;state.S=6;state.F=1;state.h=600;state.p=0;state.q=0;for(const [id,v]of [['pattern',type],['inclination',inc],['planes',4],['perPlane',6],['phase',1],['height',600]])$(id).value=v;invalidate(true);}
 $('deltaPreset').onclick=()=>preset('delta',53);$('starPreset').onclick=()=>preset('star',86.4);
 document.querySelectorAll('[data-frame]').forEach(b=>b.onclick=()=>{state.frame=b.dataset.frame;document.querySelectorAll('[data-frame]').forEach(x=>x.classList.toggle('active',x===b));dirty=true;});
 $('play').onclick=()=>{if(state.t>=M.circular(state.h).period)state.t=0;state.playing=!state.playing;setText('play',state.playing?'Ⅱ 暂停':'▶ 播放');dirty=true;};$('speed').onchange=e=>state.speed=+e.target.value;
 $('time').oninput=e=>{state.t=+e.target.value/1000*M.circular(state.h).period;dirty=true;};$('timeZero').onclick=()=>{state.t=0;dirty=true;};$('oneOrbit').onclick=()=>{state.t=M.circular(state.h).period;state.playing=false;setText('play','▶ 播放');dirty=true;};
 $('selectedPlane').onchange=e=>{state.p=+e.target.value;traceKey='';dirty=true;};$('selectedSatellite').onchange=e=>{state.q=+e.target.value;traceKey='';dirty=true;};
 for(const [id,key,min,max] of [['ueLat','ueLat',-90,90],['ueLon','ueLon',-180,180],['minElevation','minEl',0,90]])$(id).onchange=e=>{const raw=+e.target.value;if(e.target.value!==''&&Number.isFinite(raw)){state[key]=Math.max(min,Math.min(max,raw));e.target.value=state[key];}else e.target.value=state[key];dirty=true;};
 $('nearest').onclick=()=>{const list=satellites.map(s=>({s,link:M.link(s,state.ueLat,state.ueLon)})).filter(x=>x.link.elevation>=state.minEl).sort((a,b)=>a.link.distance-b.link.distance);if(list.length){state.p=list[0].s.p;state.q=list[0].s.q;$('selectedPlane').value=state.p;$('selectedSatellite').value=state.q;traceKey='';}dirty=true;};
 for(const id of ['elementsCanvas','walkerCanvas']){const canvas=$(id),cam=camera[id];let drag=null;canvas.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!drag)return;cam.az-=(e.clientX-drag[0])*.008;cam.el=Math.max(-1.3,Math.min(1.3,cam.el+(e.clientY-drag[1])*.008));drag=[e.clientX,e.clientY];dirty=true;});for(const event of ['pointerup','pointercancel'])canvas.addEventListener(event,()=>drag=null);const reset=()=>{cam.az=.78;cam.el=id==='walkerCanvas'?.39:.48;dirty=true;};canvas.ondblclick=reset;canvas.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home')reset();else{cam.az+=e.key==='ArrowRight'?.12:e.key==='ArrowLeft'?-.12:0;cam.el=Math.max(-1.3,Math.min(1.3,cam.el+(e.key==='ArrowUp'?.1:e.key==='ArrowDown'?-.1:0)));dirty=true;}};}
 const resize=new ResizeObserver(entries=>{for(const e of entries)fit(e.target);});for(const canvas of document.querySelectorAll('canvas')){fit(canvas);resize.observe(canvas);}
 document.addEventListener('visibilitychange',()=>{if(document.hidden){state.playing=false;setText('play','▶ 播放');}});
 function frame(now){const elapsed=last?Math.min(.1,(now-last)/1000):0;last=now;if(state.playing){state.t+=elapsed*state.speed;const period=M.circular(state.h).period;if(state.t>=period){state.t=period;state.playing=false;setText('play','▶ 播放');}dirty=true;}if(dirty&&now-lastDraw>30){draw();lastDraw=now;}requestAnimationFrame(frame);}
 rebuild();requestAnimationFrame(frame);
})();
