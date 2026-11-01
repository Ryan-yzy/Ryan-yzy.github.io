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
 const before=M.exp(model.f,D,0),after=sats[1].f.n,shift=M.arc(before,after),minElev=Math.min(...sats[0].points.map(p=>M.elevation(sats[0].S,M.mul(p.v,M.R))));
 $('metrics2').innerHTML=metric('相邻星下点弧长 D',fmt(D),'km')+metric('方位错位 δ',fmt(delta/M.DEG,3),'°')+metric('参考星外环中心最低仰角',fmt(minElev),'°');
 $('offsetReadout').textContent=`ρ=${fmt(o.rho,2)}：切平面目标错位 ρd=${fmt(o.rho*sp.d)} km；当前球面星下点实际移动 ${fmt(shift)} km。六邻星到参考点的弧长仍为 ${fmt(D)} km。`;
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
 line(c,tr.xy(A),tr.xy(B),'#2c7b78',1.4);
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
  dot(c,p,6,colors[k+1],'white');text(c,`S${k+1}`,p[0]+11,p[1]-9,colors[k+1],font(12));
 }
 dot(c,origin,7,colors[0],'white');text(c,'S0',origin[0]+12,origin[1]-12,colors[0],font(12));
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
function draw(){if(!model)return;if(stage===1)drawGrid();else if(stage===2)drawMulti();else drawRoi();}
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
function setView(v){view=v;$('surfaceView').setAttribute('aria-pressed',v==='surface');$('sphereView').setAttribute('aria-pressed',v==='sphere');$('multiTitle').textContent=v==='surface'?'七星地表网格 · 参考点等距投影':'星下点径向抬升 · 球面局部视图';draw();}
$('showAll').addEventListener('click',()=>{showAll=!showAll;$('showAll').setAttribute('aria-pressed',showAll);$('showAll').textContent=showAll?'聚焦 ROI 与保留波位':'显示全部候选波位';draw();});
$('roiCanvas').addEventListener('click',e=>{const rect=e.currentTarget.getBoundingClientRect(),x=(e.clientX-rect.left)*e.currentTarget.width/rect.width,y=(e.clientY-rect.top)*e.currentTarget.height/rect.height;let best=null,d=Infinity;for(const p of model.roi){const pos=roiTransform.xy(p.v),dist=Math.hypot(pos[0]-x,pos[1]-y);if(dist<d){d=dist;best=p;}}if(best){selected=best.id;updateBudget();updateText();draw();}});
$('roiCanvas').addEventListener('keydown',e=>{if(['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();const i=model.roi.findIndex(p=>p.id===selected),n=model.roi.length,delta=['ArrowRight','ArrowDown'].includes(e.key)?1:-1;selected=model.roi[(i+delta+n)%n].id;updateBudget();updateText();draw();}});
window.addEventListener('resize',draw);
drawTiling();rebuild();setStage(1);
})();
