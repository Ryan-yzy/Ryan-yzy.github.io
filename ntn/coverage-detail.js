'use strict';
const CoverageDetail=(()=>{
  const colors={theta:'#7be3c3',height:'#90b9c9',perp:'#64c8ed',zeta:'#64c8ed',elevation:'#baa3ff',half:'#edc578',inside:'#eaa5ac',muted:'#607f92',white:'#d8e8ee'};
  const parts=[
    {name:'已知几何',heading:'先定义点和线，\n明确已知边角',triangle:'整体几何与垂足 H',body:'<p><strong>O</strong> 为地心，<strong>S</strong> 为卫星，<strong>N</strong> 为星下点，<strong>P</strong> 为覆盖边界点。O、N、S 共线。</p><p>将射线 SP 向内延长。从 O 向这条直线作垂线，垂足记为 <strong>H</strong>：S、P、H 依次共线，OH ⟂ SH。</p><div class="callout">已知 OS = Re+h，OP = ON = Re，以及 S 处的 θs。N 用于标明高度 h；求解主要使用 OSH、OPH、OSP。</div>'},
    {name:'△OSH 求 OH',heading:'第一步：在直角\n三角形 OSH 中求 OH',triangle:'当前求解：△OSH，直角在 H',body:'<p>高亮的 <strong>△OSH</strong> 是直角三角形，直角位于 H。</p><p>因为 S、P、H 共线，∠OSH 就是已知的 <strong>θs</strong>。OS 是斜边，OH 是 θs 的对边。</p><div class="callout">sinθs = OH / OS<br>因此 OH = (Re+h)sinθs。</div>'},
    {name:'△OPH 求 ζ',heading:'第二步：换到直角\n三角形 OPH 中求 ζ',triangle:'当前求解：△OPH，直角在 H',body:'<p>换到高亮的 <strong>△OPH</strong>。它同样在 H 处为直角，并与前一三角形共享已经求出的 OH。</p><p>OP = Re 是斜边。定义 P 处的锐角 <strong>ζ = ∠OPH</strong>，它的对边仍是 OH。</p><div class="callout">sinζ = OH / OP = OH / Re<br>ζ = asin[(Re+h)/Re · sinθs]。</div>'},
    {name:'P 点求 El',heading:'第三步：在 P 点\n把 ζ 换成仰角 El',triangle:'当前求解：P 点的切线、半径与对顶角',body:'<p>PZ 是 OP 向外的延长线，表示当地天顶方向。P 点的地表切线与 OP 垂直。</p><p>PO 与 PZ 是反向射线，PH 与 PS 也是反向射线，所以 <strong>∠ZPS = ∠OPH = ζ</strong>（对顶角相等）。</p><div class="callout">El 从当地切线量起：El + ζ = 90°。因此 El = 90°−ζ，化简得到提案中的 acos 表达式。</div>'},
    {name:'△OSP 求 Δ½',heading:'第四步：回到\n三角形 OSP 中求 Δ½',triangle:'当前求解：△OSP 的内角和',body:'<p>最后使用高亮的 <strong>△OSP</strong>。S 处内角为 θs，O 处内角就是 Δ½。</p><p>P 处内角是 <strong>α = ∠OPS = 180°−ζ = 90°+El</strong>，这是一个钝角。</p><div class="callout">θs + Δ½ + α = 180°<br>所以 Δ½ = 90°−θs−El。右图同时画出 α 与 El，区分内角和仰角。</div>'}
  ];
  let part=0,change=()=>{};
  const f=x=>x.toFixed(3),deg=x=>(x/M.DEG).toFixed(4)+'°';
  const geometry=()=>M.coverageTriangle(M.presets[state.scenario].h);
  function formulas(){const g=geometry();return [
    [`已知：OS = Re+h = ${f(g.os)} km；OP = ON = ${f(M.R)} km；∠OSP = θs = ${deg(g.theta)}`,`构造：OH ⟂ SP，S→P→H 共线；PZ 为 OP 的外向延长线`,`H 与 ζ 是为解释提案公式补充的辅助点、辅助角。左右两图使用同一组精确坐标。`],
    [`△OSH（直角 H）：sinθs = OH / OS`,`OH = (Re+h) sinθs = ${f(g.oh)} km`,`已知 OS、θs → 求 OH；直角符号和绿色填充定位本次使用的三角形。`],
    [`△OPH（直角 H）：sinζ = OH / OP`,`ζ = asin(OH/Re) = ${deg(g.zeta)}`,`已知 OH、OP → 求 ζ = ∠OPH；这里使用锐角，避免反正弦的补角分支混淆。`],
    [`P 点：OP ⟂ 切线，∠ZPS = ∠OPH = ζ，El + ζ = 90°`,`El = 90°−ζ = acos[(Re+h)/Re · sinθs] = ${deg(g.elevation)}`,`本次使用 P 点的垂直关系和对顶角关系；无需再解新的三角形。`],
    [`△OSP：α = ∠OPS = 180°−ζ = 90°+El = ${deg(g.alpha)}`,`Δ½ = 180°−θs−α = 90°−θs−El = ${deg(g.half)}`,`按 HPBW = 4.41° 重算；下一主步骤的星座间距继续使用提案附录 A 的表值。`]
  ][part];}
  function show(active){$('coverageParts').hidden=!active;document.querySelector('.visual-panel').classList.toggle('is-coverage',active);document.querySelectorAll('[data-coverage-part]').forEach(b=>{let yes=+b.dataset.coveragePart===part;b.classList.toggle('active',yes);b.setAttribute('aria-current',yes?'step':'false');});}
  function go(n){part=(n+parts.length)%parts.length;show(true);change();dirty=true;}
  function lab(t,x,y,c=colors.white,size=10,align='left'){ctx.font=`${size}px ${getComputedStyle(document.body).fontFamily}`;let w=ctx.measureText(t).width,left=align==='center'?x-w/2-4:align==='right'?x-w-4:x-4;ctx.fillStyle='#0c1e2be8';ctx.fillRect(left,y-size-3,w+8,size+8);text(t,x,y,c,size,align);}
  function arc(o,a,b,r,c,width=2){let start=Math.atan2(a[1]-o[1],a[0]-o[0]),end=Math.atan2(b[1]-o[1],b[0]-o[0]),delta=((end-start+3*Math.PI)%(2*Math.PI))-Math.PI;ctx.beginPath();ctx.arc(o[0],o[1],r,start,start+delta,delta<0);ctx.strokeStyle=c;ctx.lineWidth=width;ctx.stroke();}
  function rightAngle(o,a,b,size,c){const va=[a[0]-o[0],a[1]-o[1]],vb=[b[0]-o[0],b[1]-o[1]],na=Math.hypot(...va),nb=Math.hypot(...vb);const A=[o[0]+va[0]/na*size,o[1]+va[1]/na*size],B=[o[0]+vb[0]/nb*size,o[1]+vb[1]/nb*size];path([A,[A[0]+B[0]-o[0],A[1]+B[1]-o[1]],B],c,1.2);}
  function leader(t,point,offset,c=colors.white,align='left'){const end=[point[0]+offset[0],point[1]+offset[1]];path([point,end],c+'a0',.7);lab(t,end[0]+(align==='left'?4:-4),end[1]+3,c,9,align);}
  function panelHeading(t,box){text(t,box.x+10,box.y+18,'#b4cdd9',11);}
  function draw(options){
    const g=geometry(),small=W<550,margin=small?13:20;
    const A=small?{x:margin,y:45,w:W-margin*2,h:H*.48-40}:{x:20,y:48,w:W*.48-25,h:H-100};
    const B=small?{x:margin,y:H*.50+15,w:W-margin*2,h:H*.45-15}:{x:W*.52,y:48,w:W*.46-20,h:H-100};
    if(!small)path([[W*.505,47],[W*.505,H-40]],'#2a4151',1);else path([[18,H*.50],[W-18,H*.50]],'#2a4151',1);
    drawWhole(A,g,options);drawZoom(B,g,options);text(parts[part].triangle,W/2,H-17,'#94b6c8',10,'center');
  }
  function drawWhole(box,g,{angles,aux}){
    ctx.save();ctx.beginPath();ctx.rect(box.x,box.y,box.w,box.h);ctx.clip();panelHeading('完整剖面 · 真实长度比例',box);
    const origin=[box.x+box.w*.23,box.y+box.h*.81],r=Math.min(box.w*.92,box.h*.66,(origin[1]-box.y-72)*M.R/g.os),k=r/M.R,pt=v=>[origin[0]+v[0]*k,origin[1]-v[1]*k];
    const O=pt(g.O),S=pt(g.S),N=pt(g.N),P=pt(g.P),H=pt(g.H);
    const edge=[];for(let a=0;a<=1.15;a+=.02)edge.push(pt([M.R*Math.sin(a),M.R*Math.cos(a)]));path([O,...edge,O],null,0,'#1534488a');path(edge,'#567f96',1.3);
    const triangles={1:[O,S,H,O],2:[O,P,H,O],4:[O,S,P,O]},tcol=part===1?colors.theta:part===2?colors.zeta:colors.half;
    if(triangles[part])path(triangles[part],tcol,1.8,tcol+'17');
    path([O,S],part===1?colors.theta:colors.muted,part===1?2:1);
    path([O,P],part===2?colors.zeta:part===4?colors.half:colors.muted,part===2||part===4?1.8:1);
    path([S,P],part===4?colors.half:colors.theta,1.6);
    if(aux||part===1||part===2){path([P,H],part===2?colors.zeta:colors.muted,1.2,null,[4,4]);path([O,H],part===1?colors.theta:part===2?colors.zeta:colors.perp,part===1||part===2?2:1);rightAngle(H,O,S,10,colors.perp);dot(H,3,colors.perp);lab('H',H[0]+9,H[1]+12,colors.perp,11);lab('OH ⟂ SH',H[0]+6,H[1]+33,colors.perp,8);}
    drawSatellite(S,colors.theta,false,'');dot(O,4,colors.white);dot(N,2.5,colors.height);dot(P,3.5,colors.half);
    lab('O 地心',O[0]-5,O[1]+20,colors.white,10,'right');leader('S 卫星',S,[-16,-16],colors.theta,'right');leader('N 星下点',N,[-24,18],colors.height,'right');leader('P 覆盖边界',P,[48,24],colors.half);
    lab('OS',O[0]-9,(O[1]+S[1])/2,colors.height,9,'right');lab('OP',P[0]+17,(O[1]+P[1])/2+25,colors.height,9);if(part===1||part===2)lab('OH = '+f(g.oh)+' km',(O[0]+H[0])/2,O[1]+45,tcol,9,'center');
    if(angles){
      if(part===0||part===1||part===4){arc(S,O,P,Math.min(62,box.h*.17),colors.theta);leader('θs = '+deg(g.theta),[S[0]+9,S[1]+60],[37,13],colors.theta);}
      if(part===2){arc(P,O,H,48,colors.zeta);lab('ζ',P[0]+5,P[1]+68,colors.zeta,11);}
      if(part===4||part===0){arc(O,S,P,Math.min(120,r*.55),colors.half,3);leader('Δ½ = '+deg(g.half),[O[0]+2,O[1]-r*.48],[80,-15],colors.half);}
    }
    lab('S → P → H：同一条直线',box.x+10,box.y+box.h-13,colors.muted,9);ctx.restore();
  }
  function drawZoom(box,g,{angles,aux}){
    ctx.save();ctx.beginPath();ctx.rect(box.x,box.y,box.w,box.h);ctx.clip();panelHeading('P 点近景 · 同一几何等比例放大',box);
    const P=[box.x+box.w*.57,box.y+box.h*.57],distance=Math.hypot(g.S[0]-g.P[0],g.S[1]-g.P[1]),scale=Math.min(box.h*.33/distance,box.w*.43/Math.abs(g.S[0]-g.P[0]));
    const pt=v=>[P[0]+(v[0]-g.P[0])*scale,P[1]-(v[1]-g.P[1])*scale],S=pt(g.S),unitZ=[g.P[0]/M.R,-g.P[1]/M.R],unitO=unitZ.map(x=>-x),unitT=[-g.P[1]/M.R,-g.P[0]/M.R],norm=Math.hypot(...g.S.map((x,i)=>x-g.P[i])),unitS=[(g.S[0]-g.P[0])/norm,-(g.S[1]-g.P[1])/norm],unitH=unitS.map(x=>-x),L=Math.min(box.w*.31,box.h*.22);
    const ray=(v,len=L)=>[P[0]+v[0]*len,P[1]+v[1]*len],Z=ray(unitZ,L*1.6),O=ray(unitO,L*1.2),T=ray(unitT,L*1.4),Tr=ray(unitT,-L),H=ray(unitH,L*1.45);
    const edge=[],span=Math.min(.22,box.w/(M.R*scale)*.72);for(let j=0;j<=80;j++){let d=-span+2*span*j/80,a=g.half+d;edge.push(pt([M.R*Math.sin(a),M.R*Math.cos(a)]));}path([...edge,[box.x+box.w+30,box.y+box.h+30],[box.x-30,box.y+box.h+30]],null,0,'#16344775');path(edge,'#527b92',1.2);
    path([S,P],part===4?colors.half:colors.theta,2);path([P,H],part===2?colors.zeta:colors.muted,1.3,null,[4,4]);path([O,P,Z],part===3?colors.elevation:colors.height,1.1,null,[4,4]);
    if(aux||part===3){path([T,Tr],colors.elevation,1.1,null,[3,3]);rightAngle(P,Z,T,18,colors.elevation);lab('当地切线',T[0]+3,T[1]-12,colors.elevation,9);}
    drawSatellite(S,colors.theta,false,'S');dot(P,4,colors.half);lab('P',P[0]+11,P[1]+5,colors.half,12);lab('天顶 Z',Z[0]+7,Z[1]+3,colors.height,9);lab('向 O',O[0]-8,O[1]+12,colors.height,9,'right');lab('延长至 H',H[0]+4,H[1]+12,colors.perp,9);
    if(angles){
      if(part===0||part===2){arc(P,O,H,51,colors.zeta);lab('ζ = ∠OPH',P[0]+8,P[1]+75,colors.zeta,10);lab(deg(g.zeta),P[0]+8,P[1]+94,colors.zeta,10);}
      if(part===3){arc(P,Z,S,56,colors.zeta);lab('ζ = '+deg(g.zeta),P[0]+21,P[1]-78,colors.zeta,10);arc(P,T,S,38,colors.elevation);lab('El = '+deg(g.elevation),P[0]-38,P[1]-50,colors.elevation,10,'right');arc(P,O,H,40,colors.zeta,1.4);lab('ζ',P[0]-2,P[1]+60,colors.zeta,11);}
      if(part===4){arc(P,O,S,43,colors.inside,2);lab('α = '+deg(g.alpha),P[0]-36,P[1]+37,colors.inside,10,'right');arc(P,T,S,69,colors.elevation,1.7);lab('El = '+deg(g.elevation),P[0]-38,P[1]-67,colors.elevation,9,'right');}
    }
    const lines=part===4?['△OSP 的 P 点内角：α = 90° + El','α 是钝角；El 是从切线量起的仰角。']:part===3?['∠ZPS 与 ∠OPH 为对顶角，均为 ζ','切线 ⟂ PZ，所以 El + ζ = 90°。']:part===2?['ζ 是 △OPH 的 P 点锐角','OP 为斜边，OH 为 ζ 的对边。']:['O、P、Z 共线；S、P、H 共线','近景中的 O、H 仅标明其所在方向。'];
    lines.forEach((line,i)=>text(line,box.x+10,box.y+box.h-34+i*19,i?colors.muted:colors.white,9));ctx.restore();
  }
  $('coverageParts').innerHTML='<div class="coverage-part-heading">第三步细解 <span>先选关系，再看高亮三角形</span></div><div class="coverage-part-buttons">'+parts.map((p,i)=>`<button data-coverage-part="${i}" aria-label="第三步细解 ${i+1} ${p.name}"><span>${i+1}</span>${p.name}</button>`).join('')+'</div>';
  document.querySelectorAll('[data-coverage-part]').forEach(b=>b.onclick=()=>go(+b.dataset.coveragePart));
  return {show,formulas,draw,heading:()=>parts[part].heading,body:()=>parts[part].body,go,onChange:fn=>change=fn};
})();
