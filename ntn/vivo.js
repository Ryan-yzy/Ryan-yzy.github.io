(() => {
'use strict';
const M=window.VivoModel,$=id=>document.getElementById(id);
const colors=['#286f92','#bf5a46','#b28c35','#7a6997','#6b9650','#3e919b','#ad6679'];
let stage=1,view='surface',showAll=false,snapshot=0,selected=null,model,budget,roiTransform;
const defaults={height:600,width:5.075,tiers:11,ring:7,point:3,latitude:0,offset:.5,roi:5,buffer:2,active:32};
const val=id=>+$ (id).value;
const fmt=(v,n=1)=>v===Infinity?'∞':Number.isFinite(v)?v.toFixed(n):'—';
const metric=(label,value,unit='')=>`<div class="metric"><span>${label}</span><strong>${value}</strong><small>${unit}</small></div>`;
function setStage(s,scroll=false){
 stage=s;
 document.querySelectorAll('[data-step]').forEach(b=>{const yes=+b.dataset.step===s;b.setAttribute('aria-selected',yes);b.tabIndex=yes?0:-1;});
 for(let i=1;i<=3;i++) $('stage'+i).hidden=i!==s;
 document.querySelectorAll('[data-show]').forEach(el=>el.hidden=+el.dataset.show!==s);
 draw();
 if(scroll) document.querySelector('.steps').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
}
function rebuild(){
 $('ring').max=val('tiers');$('ring').value=Math.min(val('ring'),val('tiers'));
 $('point').max=Math.max(0,val('ring')-1);$('point').value=Math.min(val('point'),val('ring')-1);
 $('roi').max=val('tiers');$('roi').value=Math.min(val('roi'),val('tiers'));
 const o={h:val('height'),hpbw:val('width'),t:val('tiers'),lat:val('latitude'),lon:0,rho:val('offset'),roi:val('roi'),buffer:val('buffer')};
 model=M.build(o);if(!model.roi.some(p=>p.id===selected)) selected=model.roi.find(p=>p.ring===o.t&&p.side===5&&p.i===Math.floor(o.t/2)).id;
 updateBudget();updateText();draw();
}
function updateBudget(){budget=M.budget(model,selected,val('active'),snapshot);selected=budget.p.id;}
function updateText(){
 for(const [id,unit,n] of [['height',' km',0],['width','°',3],['tiers',' 环',0],['latitude','°',0],['offset','',2],['roi',' 环',0],['buffer','·d',0],['active','',0]]) $(id+'Val').textContent=fmt(val(id),n)+unit;
 $('ringVal').textContent=val('ring');$('pointVal').textContent=val('point')+' / '+val('ring');
 const {o,sp,D,delta,sats,roi,first}=model;
 $('gridCount').textContent=`${o.t} 环 / ${M.count(o.t)} 个波位中心`;
 $('metrics1').innerHTML=metric('基准地表波束间距 d',fmt(sp.d),'km')+metric('单星波位数 N',M.count(o.t),'个')+metric('中心至最外环角点 Rhex',fmt(o.t*sp.d),'km');
 const n=val('ring'),i=val('point'),a=M.exp(model.f,n*sp.d,Math.PI/6),b=M.exp(model.f,n*sp.d,Math.PI/2),beta=M.angle(a,b);
 $('pointReadout').textContent=`当前 n=${n}，i=${i}：βₙ=${fmt(beta/M.DEG,3)}°，分点对应 ${fmt(i/n*beta/M.DEG,3)}°；这一环共有 ${6*n} 个节点。`;
 const con=M.construction(model.f,sp.d,n,i),target=M.mul(con.C,M.R),ray=M.unit(M.sub(target,sats[0].S)),u=M.dot(ray,model.f.e),v=M.dot(ray,model.f.q),wn=-M.dot(ray,model.f.n);
 $('constructionReadout').textContent=`实际参数：n=${n}，i=${i}，αₙ=${fmt(con.alpha/M.DEG,3)}°，βₙ=${fmt(con.beta/M.DEG,3)}°；∠AₙOC=${fmt(con.fraction*con.beta/M.DEG,3)}°。径向间距 d=${fmt(sp.d,3)} km；本边每段弧长 Rₑβₙ/n=${fmt(M.R*con.beta/n,3)} km。`;
 $('uvReadout').textContent=`所选球面中心 C 的指向：u=${fmt(u,5)}，v=${fmt(v,5)}，w=${fmt(wn,5)}；离星下方向角=${fmt(M.angle(ray,M.mul(model.f.n,-1))/M.DEG,3)}°。这些 UV 是从当前三维几何反算的。`;

 const before=M.exp(model.f,D,0),after=sats[1].f.n,shift=M.arc(before,after),minElev=Math.min(...sats[0].points.map(p=>M.elevation(sats[0].S,M.mul(p.v,M.R))));
 $('metrics2').innerHTML=metric('相邻星下点弧长 D',fmt(D),'km')+metric('方位错位 δ',fmt(delta/M.DEG,3),'°')+metric('参考星外环中心最低仰角',fmt(minElev),'°');
 $('offsetReadout').textContent=`ρ=${fmt(o.rho,2)}：切平面构造中的目标错位 ρd=${fmt(o.rho*sp.d)} km；当前球面星下点实际移动 ${fmt(shift)} km。它们因曲率可略有差异。六邻星到 P₀ 的弧长仍为 D=${fmt(D)} km。`;
 $('coordinateReadout').textContent=`地心地固坐标 / km：参考星 S0=(${sats[0].S.map(v=>fmt(v,1)).join(', ')})；邻星下点 P1=(${M.mul(sats[1].f.n,M.R).map(v=>fmt(v,1)).join(', ')})。`;
 const kept=sats.slice(1).reduce((a,s)=>a+s.points.filter(p=>p.keep).length,0),activeKept=budget.links.filter(l=>l.sat>0).length;
 $('metrics3').innerHTML=metric(`参考星 ROI（第 ${first}–${o.t} 环）`,roi.length,'波位')+metric('保留的邻星候选波位',kept,`/ ${6*M.count(o.t)}`)+metric('本快照邻星活动干扰波束',activeKept,'个');
 $('roiFormula').innerHTML=`ring ≥ t − k + 1 = ${o.t} − ${o.roi} + 1 = ${first}<br>NROI = N(${o.t}) − N(${first-1})<br><b>= ${M.count(o.t)} − ${M.count(first-1)} = ${roi.length}</b>`;
 $('budgetMetrics').innerHTML=metric('只计本星干扰',fmt(budget.sirSingle,2),'dB')+metric('加入邻星干扰',fmt(budget.sirMulti,2),'dB')+metric('新增邻星带来的下降',fmt(budget.loss,2),'dB');
 const sum=budget.signal+budget.intra+budget.inter;
 $('powerBars').innerHTML=[['服务信号 Ps',budget.signal,'#286f92'],['本星干扰 Iintra',budget.intra,'#91aab7'],['邻星干扰 Iinter',budget.inter,'#ca8c47']].map(([name,p,c])=>`<div class="power-row"><span>${name}</span><div class="power-track"><i style="width:${100*p/sum}%;background:${c}"></i></div><span>${fmt(100*p/sum,1)}% 总功率</span></div>`).join('');
 $('linkRows').innerHTML=budget.links.slice(0,6).map(l=>`<tr><td>S${l.sat} · 波位 ${l.beam}</td><td>${fmt(l.distance,1)}</td><td>${fmt(l.theta,2)}</td><td>${fmt(10*Math.log10(Math.max(l.value,1e-30)/budget.signal),2)}</td></tr>`).join('')||'<tr><td colspan="4">当前活动与缓冲设定下，没有其他保留的活动干扰源。</td></tr>';
}
function ctx(id){const canvas=$(id),c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);return {c,canvas,w:canvas.width,h:canvas.height,font:(size=12)=>Math.min(28,size/Math.min(1,canvas.clientWidth/canvas.width||1))};}
function text(c,s,x,y,color='#687782',size=13,align='left'){c.font=`${size}px -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif`;c.fillStyle=color;c.textAlign=align;c.fillText(s,x,y);c.textAlign='left';}
function line(c,a,b,color='#c9d7db',width=1,dash=[]){c.beginPath();c.moveTo(...a);c.lineTo(...b);c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.stroke();c.setLineDash([]);}
function dot(c,p,r,color,stroke){c.beginPath();c.arc(...p,r,0,2*Math.PI);c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}}
function arrow(c,a,b,color,width=1.5){line(c,a,b,color,width);const t=Math.atan2(b[1]-a[1],b[0]-a[0]);for(const v of [-.4,.4])line(c,b,[b[0]-9*Math.cos(t+v),b[1]-9*Math.sin(t+v)],color,width);}
function mapTransform(w,h,extent){const scale=Math.min(w-110,h-100)/(2*extent),x0=w/2,y0=(h-25)/2;return {scale,xy:v=>{const p=M.project(v,model.f);return[x0+p[0]*scale,y0-p[1]*scale];},flat:p=>[x0+p[0]*scale,y0-p[1]*scale]};}
function mapBase(c,w,h,tr,extent,font){
 const step=10**Math.floor(Math.log10(extent))*(extent/10**Math.floor(Math.log10(extent))>4?2:1);
 for(let n=-Math.floor(extent/step);n<=Math.floor(extent/step);n++){
  const d=n*step;line(c,tr.flat([d,-extent]),tr.flat([d,extent]),n===0?'#d6e0e3':'#eff3f3');line(c,tr.flat([-extent,d]),tr.flat([extent,d]),n===0?'#d6e0e3':'#eff3f3');
 }
 const len=step*tr.scale,bx=w-45-len,by=h-34;line(c,[bx,by],[bx+len,by],'#738c98',2);line(c,[bx,by-4],[bx,by+4],'#738c98');line(c,[bx+len,by-4],[bx+len,by+4],'#738c98');text(c,`${step} km`,bx+len/2,by-12,'#687782',font(11),'center');
}
function boundary(c,s,tr,color,width=1.4){const out=s.points.filter(p=>p.ring===model.o.t);c.beginPath();out.forEach((p,i)=>i?c.lineTo(...tr.xy(p.v)):c.moveTo(...tr.xy(p.v)));c.closePath();c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function drawGrid(){
 const {c,w,h,font}=ctx('gridCanvas'),{sp,o}=model,tr=mapTransform(w,h,o.t*sp.d*1.17);mapBase(c,w,h,tr,o.t*sp.d*1.06,font);
 const n=val('ring'),i=val('point'),A=M.exp(model.f,n*sp.d,Math.PI/6),B=M.exp(model.f,n*sp.d,Math.PI/2),C=M.slerp(A,B,i/n),N=tr.xy(model.f.n);
 c.beginPath();c.moveTo(...N);c.lineTo(...tr.xy(A));for(let k=1;k<=30;k++)c.lineTo(...tr.xy(M.slerp(A,B,k/30)));c.closePath();c.fillStyle='#edf5f1';c.fill();
 boundary(c,model.sats[0],tr,'#b8cbd1');
 for(const p of model.sats[0].points) dot(c,tr.xy(p.v),p.ring===n?4:2.7,p.ring===n?'#2c7b78':'#c0cdd2');
 line(c,N,tr.xy(A),'#7aa29f',1.4,[5,4]);line(c,N,tr.xy(B),'#7aa29f',1.4,[5,4]);
 curve(c,Array.from({length:41},(_,j)=>tr.xy(M.slerp(A,B,j/40))),'#2c7b78',1.8);
 dot(c,N,5,'#203f51','white');dot(c,tr.xy(A),5,'#2c7b78','white');dot(c,tr.xy(B),5,'#2c7b78','white');dot(c,tr.xy(C),6,'#bf5a46','white');
 text(c,'N / 星下点',N[0]+12,N[1]+26,'#203f51',font(12));text(c,`A${n}`,tr.xy(A)[0]+12,tr.xy(A)[1]+4,'#2c7b78',font(12));text(c,`B${n}`,tr.xy(B)[0]-14,tr.xy(B)[1]-14,'#2c7b78',font(12),'right');
 const p=tr.xy(C);text(c,`C(${n}, ${i})`,p[0]+14,p[1]-16,'#bf5a46',font(12));
 text(c,`d = ${fmt(sp.d)} km`,35,h-32,'#286f92',font(12));
}
function drawMulti(){
 const {c,w,h,font}=ctx('multiCanvas');
 if(view==='sphere'){drawSphere(c,w,h,font);return;}
 const {o,D,sats,sp}=model,extent=(D+o.t*sp.d)*1.07,tr=mapTransform(w,h,extent);mapBase(c,w,h,tr,extent*.94,font);
 const origin=tr.xy(model.f.n);
 for(const s of sats){boundary(c,s,tr,colors[s.id]+'99');for(const p of s.points)dot(c,tr.xy(p.v),2,colors[s.id]+'8c');}
 for(let k=0;k<6;k++){
  const old=tr.xy(M.exp(model.f,D,k*Math.PI/3)),p=tr.xy(sats[k+1].f.n);
  line(c,origin,old,'#c1cdd1',1,[5,5]);c.beginPath();c.arc(...old,7,0,2*Math.PI);c.strokeStyle='#899da7';c.setLineDash([3,3]);c.stroke();c.setLineDash([]);
  dot(c,p,6,colors[k+1],'white');text(c,`P${k+1}`,p[0]+11,p[1]-9,colors[k+1],font(12));
 }
 dot(c,origin,7,colors[0],'white');text(c,'P0',origin[0]+12,origin[1]-12,colors[0],font(12));
 const s1=tr.xy(sats[1].f.n);line(c,origin,s1,'#286f92',1.7,[6,4]);const mid=[(origin[0]+s1[0])/2,(origin[1]+s1[1])/2];c.fillStyle='#ffffffed';c.fillRect(mid[0]-52,mid[1]-29,104,27);text(c,`D ${fmt(D,0)} km`,mid[0],mid[1]-9,'#286f92',font(11),'center');
 text(c,'星下点位置以大圆弧长确定',28,h-32,'#687782',font(11));
}
function drawSphere(c,w,h,font){
 const {f,o,D,sp,sats}=model,extent=(D+o.t*sp.d)*1.12,scale=Math.min(w*.40/extent,h*.30/Math.max(o.h,extent*.6)),P0=M.mul(f.n,M.R);
 function xyz(v){const rel=M.sub(v,P0);return[w/2+M.dot(rel,f.e)*scale,h*.56-(.60*M.dot(rel,f.q)+.80*M.dot(rel,f.n))*scale];}
 const surf=(x,y)=>M.mul(M.exp(f,Math.hypot(x,y),Math.atan2(y,x)),M.R);
 const edge=[];for(let i=0;i<=60;i++)edge.push(xyz(surf(-extent+2*extent*i/60,-extent)));for(let i=0;i<=60;i++)edge.push(xyz(surf(extent,-extent+2*extent*i/60)));for(let i=0;i<=60;i++)edge.push(xyz(surf(extent-2*extent*i/60,extent)));for(let i=0;i<=60;i++)edge.push(xyz(surf(-extent,extent-2*extent*i/60)));
 c.beginPath();edge.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();const grad=c.createLinearGradient(0,h*.28,0,h);grad.addColorStop(0,'#e6eff0');grad.addColorStop(1,'#f7faf8');c.fillStyle=grad;c.fill();
 for(let k=-4;k<=4;k++)for(const flip of [false,true]){c.beginPath();for(let j=0;j<=80;j++){const a=k*extent/4,b=-extent+2*extent*j/80,p=xyz(surf(flip?b:a,flip?a:b));j?c.lineTo(...p):c.moveTo(...p);}c.strokeStyle='#d2e0e1';c.lineWidth=1;c.stroke();}
 for(const s of sats){const npt=xyz(M.mul(s.f.n,M.R)),satpt=xyz(s.S);for(const p of s.points)dot(c,xyz(M.mul(p.v,M.R)),1.7,colors[s.id]+'9c');line(c,npt,satpt,colors[s.id],2);dot(c,npt,4,colors[s.id],'white');c.fillStyle=colors[s.id];c.fillRect(satpt[0]-5,satpt[1]-4,10,8);line(c,[satpt[0]-13,satpt[1]],[satpt[0]+13,satpt[1]],colors[s.id],2);text(c,`S${s.id}`,satpt[0]+14,satpt[1]-8,colors[s.id],font(12));}
 const p=xyz(P0),a=xyz(sats[0].S);text(c,`h=${o.h} km`,p[0]-16,(p[1]+a[1])/2,'#286f92',font(11),'right');
 text(c,'球面局部 · 真实高度比例',28,39,'#286f92',font(12));text(c,'每条径向线：星下点 P → 卫星 S',28,h-32,'#687782',font(11));
}
function drawRoi(){
 const {c,w,h,font}=ctx('roiCanvas'),{o,D,sp,sats}=model,extent=showAll?(D+o.t*sp.d)*1.07:(o.t+o.buffer+1.2)*sp.d,tr=mapTransform(w,h,extent);roiTransform=tr;mapBase(c,w,h,tr,extent*.94,font);
 for(const s of [...sats.slice(1),sats[0]]){
  if(showAll) boundary(c,s,tr,colors[s.id]+'50',1);
  for(const p of s.points){if(!showAll&&!p.keep)continue;const pos=tr.xy(p.v);if(pos[0]<12||pos[0]>w-12||pos[1]<12||pos[1]>h-55)continue;
   const color=p.roi?'#2c7b78':p.keep?(s.id?'#ca8c47':'#94adb9'):'#dfe6e8',active=budget.allActive[s.id].has(p.id);
   c.beginPath();c.arc(...pos,p.roi?3.7:3.1,0,Math.PI*2);c.strokeStyle=color;c.lineWidth=1.3;c.stroke();if(active){c.fillStyle=p.keep?color:'#c9d4d8';c.fill();}
  }
 }
 boundary(c,sats[0],tr,'#2c7b78',1.5);
 const u=tr.xy(M.unit(budget.U)),serv=tr.xy(budget.p.v);for(const l of budget.links.slice(0,4))if(l.value>0){const p=tr.xy(l.p.v);line(c,p,u,l.sat?'#bf5a4677':'#91aab780',1.6,[5,4]);dot(c,p,5.5,'#ffffff',l.sat?'#bf5a46':'#688292');}
 dot(c,serv,7,'#2c7b78','white');line(c,serv,u,'#2c7b78',2);dot(c,u,6,'#bf5a46','white');text(c,`UE / 波位 ${budget.p.id}`,u[0]+12,u[1]-14,'#a14938',font(12));
 text(c,`${model.first}–${o.t} 环 / ${model.roi.length} 个统计波位`,28,h-32,'#2c7b78',font(11));
}
function drawTiling(){
 const cx=120,cy=128,r=68,D=Math.sqrt(3)*r,path=(x,y)=>Array.from({length:6},(_,i)=>[x+r*Math.cos(Math.PI/6+i*Math.PI/3),y-r*Math.sin(Math.PI/6+i*Math.PI/3)]).map((p,i)=>(i?'L':'M')+p.join(',')).join(' ')+' Z';
 const mx=cx+D/2;
 $('tilingDiagram').innerHTML=`<path d="${path(cx,cy)}" fill="#edf5f2" stroke="#70a19d"/><path d="${path(cx+D,cy)}" fill="#f7f0e8" stroke="#d1a374"/><path d="M${cx} ${cy}H${cx+D}" stroke="#286f92" stroke-width="1.6"/><path d="M${cx} ${cy}L${mx} ${cy-r/2}" stroke="#2c7b78" stroke-width="1.3"/><path d="M${mx} ${cy-r/2}V${cy+r/2}" stroke="#a2b7bc" stroke-dasharray="4 4"/><g fill="#286f92" font-size="12"><text x="${cx-5}" y="${cy+23}">S0</text><text x="${cx+D-5}" y="${cy+23}">S1</text><text x="${cx+15}" y="${cy-5}">rin</text><text x="${cx+D/2+10}" y="${cy-5}">rin</text><text x="${cx+4}" y="${cy-33}" fill="#2c7b78">Rhex</text><text x="${cx+18}" y="${cy+r+29}">D = 2rin = √3 Rhex</text></g><g fill="#286f92"><circle cx="${cx}" cy="${cy}" r="3.5"/><circle cx="${cx+D}" cy="${cy}" r="3.5"/></g><text x="16" y="22" font-size="11" fill="#687782">相邻六边形 · 平面几何标尺</text>`;
}
let constructionPlane='all';
function responsiveCanvas(id){
 const cv=$(id),w=Math.max(280,cv.clientWidth),small=w<600,h=small?590:375,dpr=Math.min(devicePixelRatio||1,2);
 cv.style.height=h+'px';cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);
 const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);return {c,w,h,small};
}
function poly(c,points,fill,stroke,width=1){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function curve(c,points,color,width=1.5){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function drawConstruction(){
 const {c,w,h,small}=responsiveCanvas('constructionCanvas'),pw=small?w:w/2,ph=small?h/2:h;
 const f={n:[0,0,1],e:[1,0,0],q:[0,1,0]},n=val('ring'),i=val('point'),v=M.construction(f,M.R*55*M.DEG/n,n,i),D=[Math.cos(Math.PI/6),Math.sin(Math.PI/6),0],E=[0,1,0];
 const base=constructionPlane!=='arc',arc=constructionPlane!=='base',blue=base?'#286f92':'#b7c7cc',green=arc?'#2c7b78':'#b7c7cc';
 const ox=pw*.48,oy=ph*.78,sc=Math.min(pw*.39,ph*.57),pj=p=>[ox+sc*(.9*p[0]-.45*p[1]),oy-sc*(.95*p[2]+.18*p[0]+.27*p[1])];
 text(c,'三维定位：Π₀ 与 Πₙ 都经过 O',16,25,'#203143',12);
 poly(c,[[-.25,-.25,0],[1.15,-.25,0],[1.15,1.1,0],[-.25,1.1,0]].map(pj),base?'#286f9214':'#f5f7f6',base?'#81a8b9':'#dce3e5');
 poly(c,[[0,0,0],v.A,v.B].map(pj),arc?'#2c7b7828':'#f5f7f6',green,1.4);
 for(const edge of [D,E])curve(c,Array.from({length:41},(_,j)=>pj(M.add(M.mul(f.n,Math.cos(j*Math.PI/80)),M.mul(edge,Math.sin(j*Math.PI/80))))),'#b0c4c8',1);
 curve(c,Array.from({length:41},(_,j)=>pj(M.slerp(v.A,v.B,j/40))),green,2);
 for(const p of [[0,0,1],D,E])line(c,pj([0,0,0]),pj(p),blue,1.2,p[2]?[4,4]:[]);
 for(const p of [v.A,v.B])line(c,pj([0,0,0]),pj(p),green,1.4);
 line(c,pj(v.A),pj(v.B),green,1.1,[4,3]);
 for(const [name,p,dx,dy,color]of [['O',[0,0,0],-13,19,'#203143'],['N=P₀',[0,0,1],-22,-14,'#203143'],['D',D,10,12,blue],['E',E,-15,15,blue],['Aₙ',v.A,8,-10,green],['Bₙ',v.B,-25,-4,green]]){dot(c,pj(p),3.5,color,'white');text(c,name,pj(p)[0]+dx,pj(p)[1]+dy,color,11);}
 text(c,'蓝面 ODE ⟂ ON；绿面是 OAₙBₙ',16,ph-26,'#687782',11);
 text(c,'两者都是过地心平面；不是地表切平面',16,ph-9,'#687782',10);
 const left=small?0:pw,top=small?ph:0,r=Math.min(pw*.65,ph*(small?.49:.58)),o=[left+pw*.5,top+57],beta=v.beta,a=ang=>[o[0]+r*Math.sin(ang-beta/2),o[1]+r*Math.cos(ang-beta/2)],A=a(0),B=a(beta),C=a(v.fraction*beta),wa=Math.sin((1-v.fraction)*beta),wb=Math.sin(v.fraction*beta),t=wb/(wa+wb),K=[A[0]*(1-t)+B[0]*t,A[1]*(1-t)+B[1]*t];
 text(c,'在 Πₙ 内正视：弦上 K → 球面 C',left+16,top+25,'#203143',12);
 poly(c,[o,A,B],arc?'#2c7b7814':'#f5f7f6',green,1.2);
 curve(c,Array.from({length:41},(_,j)=>a(beta*j/40)),green,2.5);
 line(c,A,B,'#687782',1.2,[5,3]);arrow(c,o,C,'#bf5a46',1.6);
 for(let j=1;j<n;j++){if(j===i)continue;line(c,o,a(beta*j/n),'#d3dfdc',.7);}
 for(const [name,p,dx,dy,color]of [['O',o,-5,-12,'#203143'],['Aₙ',A,-24,3,green],['Bₙ',B,8,3,green],['K',K,8,-9,'#ad7b32'],['C',C,-18,22,'#bf5a46']]){dot(c,p,3.5,color,'white');text(c,name,p[0]+dx,p[1]+dy,color,11);}
 text(c,'弧 AₙC：占整段地心角的 i/n',left+16,top+ph-42,'#687782',11);
 text(c,'K 在弦上；C=Rₑ·K/‖K‖ 在球面',left+16,top+ph-24,'#687782',11);
 text(c,'结构图统一放大角度；实际数值见下方',left+16,top+ph-7,'#987e4e',10);
 $('planeHint').textContent={all:'先用 ODE 确定两条经向大圆的方位，再在 OAₙBₙ 平面内补点；最后结果 C 位于球面。',base:'ODE 经过地心 O，垂直于 ON。D、E 给出相差 60° 的方位；这个辅助面与地表点 N 处的切平面平行，但相距一个地球半径。',arc:'OAₙBₙ 经过地心和两个球面角点，所以它与球面的交线是大圆。在这个平面里等分角 βₙ，求 K 后径向投影到 C。'}[constructionPlane];
}
function drawMapping(){
 const {c,w,h,small}=responsiveCanvas('mappingCanvas'),pw=small?w:w/2,ph=small?h/2:h,{D,delta,o}=model;
 const center=[pw*.5,ph*.52],rad=Math.min(pw*.31,ph*.30),p=psi=>[center[0]+rad*Math.cos(psi),center[1]-rad*Math.sin(psi)];
 text(c,'T₀ 俯视：先安排平面点 Q₁…Q₆',16,25,'#203143',12);
 poly(c,[[20,55],[pw-20,55],[pw-20,ph-55],[20,ph-55]],'#edf3f226','#d2e1df');
 line(c,[center[0]-rad*1.2,center[1]],[center[0]+rad*1.2,center[1]],'#c5d6da',1);
 line(c,[center[0],center[1]+rad*1.2],[center[0],center[1]-rad*1.2],'#c5d6da',1);
 for(let k=0;k<6;k++){const q=p(k*Math.PI/3+delta);arrow(c,center,q,k===0?'#bf5a46':'#8daeb9',1.2);dot(c,q,4,k===0?'#bf5a46':'#286f92','white');text(c,'Q'+(k+1),q[0]+(q[0]<center[0]?-22:8),q[1]+(q[1]>center[1]?17:-6),'#286f92',11);}
 dot(c,center,4,'#2c7b78','white');text(c,'P₀',center[0]-22,center[1]+23,'#2c7b78',11);
 text(c,'D = '+fmt(D,1)+' km；每条向量都在 T₀',16,ph-28,'#687782',11);
 text(c,'Qₖ=P₀+D·t̂ₖ；平面点不在地球表面',16,ph-9,'#687782',10);
 const left=small?0:pw,top=small?ph:0,g=D/M.R,Q=[D,0],P=[M.R*Math.sin(g),M.R*(Math.cos(g)-1)],S=[(M.R+o.h)*Math.sin(g),(M.R+o.h)*Math.cos(g)-M.R];
 const xmin=0,xmax=Math.max(D,S[0])*1.12,ymin=Math.min(P[1],S[1],0)-Math.max(o.h*.1,20),ymax=Math.max(0,S[1])+Math.max(o.h*.1,20),sc=Math.min((pw-83)/(xmax-xmin),(ph-120)/(ymax-ymin)),origin=[left+35,top+55+ymax*sc],xy=v=>[origin[0]+v[0]*sc,origin[1]-v[1]*sc];
 text(c,'沿 OP₀P₁ 剖面：T₀ 的侧视是一条直线',left+16,top+25,'#203143',12);
 line(c,xy([0,0]),xy([xmax,0]),'#286f92',1.7,[5,4]);
 curve(c,Array.from({length:61},(_,j)=>{const a=g*j/60;return xy([M.R*Math.sin(a),M.R*(Math.cos(a)-1)]);}),'#2c7b78',2.5);
 line(c,xy(P),xy(Q),'#bf5a46',1.2,[3,3]);arrow(c,xy(P),xy(S),'#286f92',2);
 for(const [name,v,dx,dy,color]of [['P₀',[0,0],-14,19,'#2c7b78'],['Q₁',Q,5,-9,'#bf5a46'],['P₁',P,-20,21,'#2c7b78'],['S₁',S,8,0,'#286f92']]){dot(c,xy(v),4,color,'white');text(c,name,xy(v)[0]+dx,xy(v)[1]+dy,color,11);}
 text(c,'弧 P₀P₁ = D；P₁→S₁ 沿地心法向抬升 h',left+16,top+ph-28,'#687782',10);
 text(c,'Exp 是映射规则，不是 Q₁ 到 P₁ 的直线投影',left+16,top+ph-9,'#987e4e',10);
}

function draw(){if(!model)return;if(stage===1){drawConstruction();drawGrid();}else if(stage===2){drawMapping();drawMulti();}else drawRoi();}
for(const id of Object.keys(defaults)) $(id).addEventListener('input',rebuild);
$('reset').addEventListener('click',()=>{for(const [id,v]of Object.entries(defaults))$(id).value=v;selected=null;snapshot=0;rebuild();});
$('figPreset').addEventListener('click',()=>{$('tiers').value=10;rebuild();});
$('roiPreset').addEventListener('click',()=>{$('tiers').value=11;$('roi').value=5;$('buffer').value=2;rebuild();});
$('nextPoint').addEventListener('click',()=>{$('point').value=(val('point')+1)%val('ring');rebuild();});
$('snapshot').addEventListener('click',()=>{snapshot++;updateBudget();updateText();draw();});
for(const el of document.querySelectorAll('[data-step]'))el.addEventListener('click',()=>setStage(+el.dataset.step));
for(const el of document.querySelectorAll('[data-next]'))el.addEventListener('click',()=>setStage(+el.dataset.next,true));
document.querySelector('.steps').addEventListener('keydown',e=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?1:e.key==='End'?3:(stage-1+(e.key==='ArrowRight'?1:2))%3+1;setStage(next);$('tab'+next).focus();}});
$('surfaceView').addEventListener('click',()=>setView('surface'));$('sphereView').addEventListener('click',()=>setView('sphere'));
function setView(v){view=v;$('surfaceView').setAttribute('aria-pressed',v==='surface');$('sphereView').setAttribute('aria-pressed',v==='sphere');$('multiTitle').textContent=v==='surface'?'七星球面中心 · 参考点等距展开':'星下点径向抬升 · 球面局部视图';draw();}
$('showAll').addEventListener('click',()=>{showAll=!showAll;$('showAll').setAttribute('aria-pressed',showAll);$('showAll').textContent=showAll?'聚焦 ROI 与保留波位':'显示全部候选波位';draw();});
$('roiCanvas').addEventListener('click',e=>{const rect=e.currentTarget.getBoundingClientRect(),x=(e.clientX-rect.left)*e.currentTarget.width/rect.width,y=(e.clientY-rect.top)*e.currentTarget.height/rect.height;let best=null,d=Infinity;for(const p of model.roi){const pos=roiTransform.xy(p.v),dist=Math.hypot(pos[0]-x,pos[1]-y);if(dist<d){d=dist;best=p;}}if(best){selected=best.id;updateBudget();updateText();draw();}});
$('roiCanvas').addEventListener('keydown',e=>{if(['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();const i=model.roi.findIndex(p=>p.id===selected),n=model.roi.length,delta=['ArrowRight','ArrowDown'].includes(e.key)?1:-1;selected=model.roi[(i+delta+n)%n].id;updateBudget();updateText();draw();}});
window.addEventListener('resize',draw);
for(const button of document.querySelectorAll('[data-construction-plane]'))button.addEventListener('click',()=>{constructionPlane=button.dataset.constructionPlane;document.querySelectorAll('[data-construction-plane]').forEach(b=>b.setAttribute('aria-pressed',b===button));drawConstruction();});
drawTiling();rebuild();setStage(1);
window.NTNReadScene=()=>({R:M.R,h:model.o.h,sats:model.sats.map(s=>({id:'S'+s.id,pos:s.S})),ref:model.sats[0].S,ue:budget.U,target:M.mul(budget.p.v,M.R),points:model.sats[0].points.map(p=>M.mul(p.v,M.R)),note:`当前第 ${model.first}–${model.o.t} 环 ROI，选定波位 ${budget.p.id}。`});
})();

