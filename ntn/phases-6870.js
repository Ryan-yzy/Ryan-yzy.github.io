(function(){
'use strict';
const C=window.C6870,B=window.B6870,$=id=>document.getElementById(id),canvas=$('phaseCanvas'),ctx=canvas.getContext('2d');
const S={major:0,sub:[0,0,0],h:1200,set:'set1',phase:0,orbit:'full',beamMode:'grid',layoutStage:0,beam:1,count:3,sampleGroup:'one',seed:6870,ue:0,reuse:1,scope:'multi',yaw:-24,pitch:22};
const colors={mint:'#2c7b78',gold:'#ad7b32',blue:'#286f92',purple:'#502eb8',muted:'#5a7f96',white:'#203143',grid:'#54819c'};
let W=820,H=475,hit=[],drag=null,raf=false,cache={};
const preset=()=>C.presets[S.h],grid=()=>B.grid(S.h,S.set),num=(n,d=2)=>Number(n).toFixed(d),sub=()=>S.sub[S.major];
function scene(){const key=[S.h,S.phase].join('|');if(cache.sceneKey!==key){const all=C.satellites(S.h,S.phase),list=C.classify(all,C.ground(0,0));cache.scene={all,list,ref:list[0]};cache.sceneKey=key;}return cache.scene;}
function beamData(){if(S.beamMode==='table'){const sat={pos:[C.R+1200,0,0]};return window.ZTE6870_TABLE11.map(b=>({...b,position:B.fromUV(sat,b.u,b.v),label:'B'+b.id}));}return grid().map(b=>({...b,position:B.center(scene().ref,b),label:'B'+(b.id+1)}));}
function pickedBeam(){const bs=beamData();return bs[Math.min(S.beam,bs.length-1)];}
function sampled(){const ref=scene().ref,bs=grid(),chosen=S.sampleGroup==='one'?[bs[Math.min(S.beam,bs.length-1)]]:bs.filter(b=>b.ring<=2),key=[S.h,S.set,S.phase,S.beam,S.sampleGroup,S.count,S.seed].join('|');if(cache.ueKey!==key){cache.ues=B.sampleUEs(ref,chosen,S.count,S.seed);cache.ueKey=key;}return cache.ues;}
function pickedUE(){const us=sampled();return us[Math.min(S.ue,us.length-1)];}
function candidateLinks(){const u=pickedUE();if(!u)return [];const key=[cache.ueKey,S.ue,S.reuse,S.scope].join('|');if(cache.linkKey!==key){cache.links=B.links(scene().all,scene().ref,u,grid(),S.reuse,S.scope);cache.linkKey=key;}return cache.links;}
function totals(){const ls=candidateLinks(),same=ls.filter(l=>l.sat.id===scene().ref.id);return {ls,same,other:ls.filter(l=>l.sat.id!==scene().ref.id),stars:new Set(ls.map(l=>l.sat.id)).size};}
function visibleAtUE(){const u=pickedUE();return u?C.classify(scene().all,u.position).filter(x=>x.visible):[];}
function linkForUE(){const u=pickedUE();if(!u)return {distance:0,elevation:0,theta:0};const r=scene().ref,c=B.center(r,u.beam);return {...C.link(r,u.position),theta:C.offaxis(r,u.position,c)};}
const main=[{name:'卫星几何的建立',en:'SATELLITE GEOMETRY',output:'输出：每颗卫星的位置 sₖ',subs:['轨道面、每轨星数与星座','由星座得到三维位置']},{name:'单星覆盖与波束设计',en:'COVERAGE → BEAM WIDTH → HEXAGONAL LAYOUT',output:'输出：覆盖尺度、束数与中心',subs:['覆盖范围与同轨星数','3 dB 宽度与整数束数','六角覆盖 → 中心 → 经纬坐标']},{name:'UE 撒点、干扰与统计',en:'UE SAMPLING & INTERFERENCE',output:'输出：每个 UE 的服务与干扰项',subs:['覆盖范围与统计区域','逐星逐束筛选同频链路','计算功率并累加干扰','从每个 UE 到 CDF']}];
const toggle=(action,value,text,on)=>`<button data-action="${action}" data-value="${value}" aria-pressed="${on}">${text}</button>`;
function controls(){if(S.major===0)return toggle('orbit','one','只看一张轨道面',S.orbit==='one')+toggle('orbit','single','在同轨放满卫星',S.orbit==='single')+toggle('orbit','full','显示完整星座',S.orbit==='full')+(sub()===1?`<label>沿轨相位 <input id="phaseAngle" type="range" min="0" max="360" step="2" value="${S.phase}"><output id="phaseAngleOut">${S.phase}°</output></label>`:'');if(S.major===1){
 if(sub()===0)return '<span class="eyebrow">最低服务仰角固定为原文示例 30°；切换高度比较覆盖尺度与同轨星数。</span>';
 if(sub()===1)return '<span class="eyebrow">切换高度与 Set，查看最终束数、直径和层数；3 dB 是宽度定义的门限。</span>';
 return '<div class="phase-coordinate-note"><b>本页 U、V：归一化经纬坐标（原文记作 UV）</b><span>记录地面位置；方向余弦 u、v 则记录卫星发射方向。</span></div><div class="phase-layout-stages" role="group" aria-label="2.3 图解步骤">'+['① 六角覆盖','② 波位中心','③ 归一化经纬坐标'].map((s,i)=>toggle('layoutStage',i,s,S.layoutStage===i)).join('')+'</div>'+(S.layoutStage===0?'<span class="phase-layout-hint">先看局部 7 束覆盖示意，再进入原文中心坐标。</span>':'<div class="phase-layout-selection">'+toggle('layoutBeam',0,'跟踪 B0',S.beam===0)+toggle('layoutBeam',1,'跟踪 B1',S.beam===1)+'<button data-action="beamPrev">← 上一中心</button><button data-action="beamNext">下一中心 →</button><span class="phase-layout-hint">原文 Table 11 · 固定 LEO1200 S 波段</span></div>');
}
if(sub()===0)return toggle('sampleGroup','one','只评估选中波束',S.sampleGroup==='one')+toggle('sampleGroup','nineteen','评估中心 19 束 · 教学子集',S.sampleGroup==='nineteen')+`<label>每束 UE <select id="sampleCount">${[1,3,10].map(n=>`<option ${n===S.count?'selected':''}>${n}</option>`).join('')}</select></label><button data-action="resample">重撒点 ↻</button>`;
return toggle('scope','same','只保留同星干扰',S.scope==='same')+toggle('scope','multi','加入其他可见星',S.scope==='multi')+toggle('reuse',1,'同频全开 · 基础示例',S.reuse===1)+toggle('reuse',3,'三频复用 · 教学映射',S.reuse===3);}
function body(){
const p=preset(),r=scene().ref,n=grid().length,b=pickedBeam(),u=pickedUE();
if(S.major===0)return {
 title:sub()===0?'用轨道面与每轨星数，构建参考星座':'轨道参数给出位置，还没有给出波束指向',
 heading:'先回答：卫星在哪里？',source:'原文 §2 · Tables 4 / 6；相位为教学补充',
 html:`<p>原文给出倾角 <strong>86.4°</strong>。当前参数是 <strong>${p.planes} 面 × 每面 ${p.perPlane} 星 = ${p.planes*p.perPlane} 星</strong>。</p><p>类似 Walker 星座的生成方法，还需指定轨道面朝向 Ω、轨内初相位、轨间相位关系和参考时刻，才能唯一确定一张快照。原文的数量表<strong>没有定义完整的 Walker T/P/F</strong>。</p><p>图中把各轨道面的圆轨道旋转到共同地心坐标，得到每颗星的 <strong>sₖ</strong>。波束朝哪里，要在第二步另行确定。</p>`,
 key:'卫星位置与载荷指向分开确定。相同星座可以采用不同的波位规划。',
 note:'本页补充：同高度圆轨道、沿轨均分、轨道面朝向在 180°内均分、邻轨半格错位；不含地球自转。这是一种教学快照。',
 caption:`${p.planes} 面 × ${p.perPlane} 星；拖动旋转查看轨道。沿轨相位滑块改变演示快照，并不代表原文唯一规定的轨间相位。`,
 formula:'sₖ = (Rₑ+h) Rz(Ωₖ) Rx(i) [cos uₖ, sin uₖ, 0]ᵀ',
 read:[['轨道面',p.planes,'原文 N_orbit'],['卫星 / 面',p.perPlane,'原文 N_s'],['星座总数',p.planes*p.perPlane,'位置不决定载荷指向']],
 handoff:'保留同一快照的卫星位置；下一步补充每星波束模板及其朝向。'};
if(S.major===1&&sub()===2)return layoutReading();
if(S.major===1){
 const rings=Math.round((Math.sqrt(12*n-3)-3)/6),g=C.coverage(S.h,30),alpha=g.alpha*C.D,nsRaw=2*Math.PI/(Math.sqrt(3)*alpha),table=S.beamMode==='table'&&sub()===2;
 const content=[
 `<p><strong>高度 h 与 UE 最低服务仰角共同确定单星设计覆盖范围。</strong>6870 以最低服务仰角 30° 为例；覆盖边界上的 UE 恰好以 30° 仰视卫星。</p><p>当前 h=${S.h} km，半覆盖地心角 α=<strong>${num(g.alpha,4)}°</strong>，星下点到边界的大圆弧长为 <strong>${num(g.arc,1)} km</strong>。§2 再结合六角覆盖几何估算同轨星数，并向上取整为 <strong>${Math.ceil(nsRaw)} 星 / 轨道面</strong>。</p><p>这是整颗星的覆盖设计尺度。第一大步读取的参考星座参数，与这里的覆盖设计相互衔接；波束层数和宽度在 2.2 中继续确定。</p>`,
 `<p><strong>3 dB 定义怎样量波束宽度。</strong>给定天线方向图，在峰值两侧下降 3 dB 的方向之间取全角，得到半功率波束宽度（Half-Power Beamwidth，HPBW）。具体宽度还取决于口径、频率与方向图。</p><p>用 2.1 的覆盖尺度配合单束宽度，估算六角布局所需层数；再满足星数与层数的整数约束，调整 HPBW、波束直径及等效口径。当前 ${S.h} km、${S.set==='set1'?'Set-1':'Set-2'} 的原文结果为 <strong>${n} 束 / 星</strong>，直径参数 <strong>${p.diameter[S.set]} km</strong>。</p><p>图中只示意中心加 ${rings} 圈的计数关系；中心外 n 圈时 Nbeam=1+3n(n+1)。它不代表全部波束的真实地面轮廓。</p>`,
 `<p><strong>ZTE 的目标是近似六角蜂窝式覆盖。</strong>Figure 1 用六角布局近似，Figure 2 展示真实 3 dB 足迹的重叠和边缘拉伸。</p><p><strong>6870 附录的 UV 是归一化经纬坐标。</strong>U=0.5+经度/(2π)，V=0.5−纬度/π，星下点为 (0.5,0.5)。它与方向余弦 UV 中的 (0,0) 定义不同。</p><p>Table 11 列出 B0–B36 共 37 个起始中心。原文没有完整给出“在方向余弦 UV 中等间距排束”的生成算法。默认图展示原文已列中心；补充网格另行标明。</p>`
 ];
 return {title:['由最低仰角确定覆盖范围与同轨星数','由 3 dB 宽度与覆盖尺度确定整数束数','六角覆盖近似与归一化经纬表示'][sub()],
 heading:['单星设计覆盖范围','单束尺度与整星束数共同设计','六角覆盖、实际足迹与中心坐标'][sub()],
 source:sub()===0?'原文 §2 · 最低仰角与同轨星数':sub()===1?'原文 §2 · Tables 3–6':'原文 §3 · Figures 1–3 / Appendix / Table 11',html:content[sub()],
 key:['最低服务仰角是覆盖设计输入；单星覆盖范围随后参与星座与波束的共同设计。','3 dB 是定义宽度的门限；具体 HPBW 由方向图给出，再结合覆盖范围确定层数并调整设计。','近似六角覆盖，不等于已经规定了方向余弦 UV 中的等间距六角网格。'][sub()],
 note:sub()===0?'本步球形地球 Rₑ=6371 km，地面 UE 高度为 0；单星半覆盖地心角在地心定义。':sub()===1?'表中束数、直径与口径来自原文；图中规则点阵只表达六角圈数，不将相同大小的地面圆当作真实足迹。':table?'原文 Table 11 是固定 LEO1200 S 波段的 37 个已列中心；它不是整星总束数。':'当前是按地面间距构造的补充网格，用于演示坐标转换和撒点，不作为 ZTE 原文的完整生成算法。',
 caption:sub()===0?'左：球面覆盖边界处 UE 的仰角为 30°；右：覆盖尺度与同轨星数。α 在地心定义，L 是大圆弧长。':sub()===1?'六角层数计数示意：点表示中心编号；每圈增加 6、12、18…束。此图不表示实际地面足迹。':table?'原文 Table 11：同一组已列中心分别用经纬归一化 UV 与地面 Y/Z 投影表示。两个面板各自缩放。':'补充示例：地面等间距中心映到球面，再计算经纬归一化 UV。该示例不定义原文全部波位。',
 formula:sub()===0?'α = acos[Rₑ cos(30°)/(Rₑ+h)] − 30°；L=Rₑα；Ns=ceil[2π/(√3α)]（α 用 rad）':sub()===1?'Rbeam ≈ h·HPBW/2（近轴、HPBW 用 rad）；Nbeam = 1 + 3n(n+1)（n 为中心外圈数）':'U = 0.5 + λ/(2π)；V = 0.5 − φ/π；已知中心 c 后再求 q = (c−s)/‖c−s‖',
 read:sub()===0?[['半覆盖地心角',num(g.alpha,4)+'°','由 h 与 30° 得到'],['地表半径 / 弧长',num(g.arc,1)+' km','设计覆盖尺度'],['同轨卫星数',Math.ceil(nsRaw),'原文向上取整规则']]:sub()===1?[['原文每星束数',n,'Tables 4 / 6'],['层数（含中心）',rings+1,'中心外 '+rings+' 圈'],['直径参数',p.diameter[S.set]+' km','Tables 3 / 5']]:[['当前显示中心',table?37:n,table?'原文已列点':'补充网格示例'],['当前参数束数',n,'与已列坐标点数分别看'],['所选中心',b.label,'中心坐标表示']],
 handoff:sub()===0?'把单星覆盖尺度交给 2.2，与单束宽度一起确定层数、束数并调整参数。':sub()===1?'把最终束数和单束尺度交给 2.3，结合原文中心、六角覆盖与真实足迹理解布局。':'下一大步选择统计 UE：设计覆盖、每束足迹与统计区域分别定义，再指定同频活动干扰集合。'};
}

const t=totals(),l=linkForUE(),v=visibleAtUE();
const content=[
 `<p>原文 Table 7 给出 LEO 低纬区域：<strong>经纬度各 −20°到 +20°</strong>，并提出每束最多 10 个均匀分布 UE。</p><p><strong>单星设计覆盖范围、各束实际覆盖和统计区域是三个范围。</strong>本页在参考星 <strong>${r.id}</strong> 的补充分区中选择一束或中心 19 束撒点，当前共 <strong>${sampled().length} 个 UE</strong>；这定义被测样本，不定义整颗星的服务区域。</p><p>6870 允许选择内部或外围部分波束进行评估，没有固定“内部 19 束就是单星服务区”。本页保留完整候选模板计算干扰；点亮与同频资源另行指定。</p>`,
 `<p>固定 UE <strong>${u?u.id:'无有效点'}</strong>，先排除地球遮挡。当前有 <strong>${v.length} 颗可见星（El &gt; 0°）</strong>。逐星逐束按当前频率标签筛选，并排除服务束。</p><p>本页资源假设为<strong>所选频组内所有候选束全开、资源完全重叠</strong>。当前同星 ${t.same.length} 束、异星 ${t.other.length} 束。实际仿真还要施加点亮、调度和极化规则。</p><p><strong>30° 是原文覆盖设计的最低服务仰角</strong>，不自动作为干扰删除门限。不能只因 UE 在某束主瓣轮廓外，就把旁瓣功率置零。</p>`,
 `<p>服务项取自一个服务星 / 束。对<strong>同一个 UE</strong>，每个干扰束都重新计算距离 d、偏离角 θ 和接收功率。</p><p>Gtx 使用<strong>朝被测 UE 方向的增益</strong>，不能用干扰束自身中心的峰值增益代替。定向 UE 的 Grx 保持服务接收指向，再评价异星入射方向。</p><p>同星、异星功率分别在线性域累加。各星的距离和增益不同，不能将单星干扰直接乘以可见卫星数。</p>`,
 `<p>每个被测 UE 都独立完成：<strong>服务关联 → 服务功率 → 同星 / 异星干扰 → SINR</strong>，得到一组样本后才统计累积分布函数（CDF）。</p><p>完整评估还需补充关联规则，例如在满足服务仰角的候选中选择长期接收功率最大者；跨时刻统计还要指定快照与权重。</p><p><strong>本页为几何与候选链路演示</strong>：UE 按撒点时所属波束关联，不执行最强功率关联；未接入完整功率和噪声模型，因此不绘制数值 SINR CDF。</p>`
];
return {title:['单星覆盖范围与 UE 统计区域','同一个 UE，接收同星与异星的同频活动功率','逐条链路求功率，再分别累加同星与异星干扰','对每个 UE 重复计算，最后汇成 CDF'][sub()],
 heading:sub()===0?'内部波束是可选统计子集':'把同一个 UE 贯穿整条计算链',source:'原文 Table 7；关联、资源与求和为方法展开',html:content[sub()],
 key:'选中心 19 束的 UE 做统计，不等于只保留 19 束干扰。本页采用“UE 子集＋完整候选束”；这是显式演示规则。',
 note:sub()===0?'原文允许选部分波束仿真，但没有写清未选波束是关闭、忽略还是继续计入干扰。中心 19 束不是 ZTE 规定的唯一统计范围。':sub()===3?'6870 Table 9 的同步链路级仿真设干扰束数为 0；这是独立的链路级用例，不能替代系统级多星干扰假设。':'链路表仅计算 d、El、θ 与候选束数。Ptx、方向图、传播损耗、实际资源及噪声尚未接入，候选数量不等于干扰功率。',
 caption:sub()===0?'青色六角形是补充示例中的采样分区，白圈标出当前 UE。它不是最低仰角定义的单星覆盖边界，也不是实际 3 dB 轮廓。':sub()===1?'图中所有链路到达同一个 UE。每颗星还有多个候选波束；只显示星级连线，右侧列示部分逐束几何量。':sub()===2?'候选计数是几何筛选结果；接入逐束接收功率后才能计算 C、I 与 SINR。':'统计流程示意。这里展示数据如何进入 CDF，不生成或暗示原文的数值分布。',
 formula:sub()===0?'被测 UE 集合 𝒰 与同频活动干扰集合 ℐᵤ 分别定义':sub()===1?'dₖ,ᵤ = ‖sₖ−pᵤ‖；θₖ,ᵦ,ᵤ = angle(qₖ,ᵦ, pᵤ−sₖ)':sub()===2?'Iᵤ = Σ同星 aₖ,ᵦ,ᵤ Pₖ,ᵦ,ᵤ + Σ异星 aₖ,ᵦ,ᵤ Pₖ,ᵦ,ᵤ；SINRᵤ = Cᵤ / (Iᵤ + Nᵤ)':'F̂γ(x) = (1 / |𝒰|) Σᵤ 1{SINRᵤ ≤ x}；先定义采样规则，再统计分布',
 read:sub()===0||sub()===3?[['被测 UE',sampled().length,'本页采样子集'],['每星候选模板',n,'采样范围不裁剪模板'],['异星候选 / 当前 UE',t.other.length,'当前频组全开假设']]:[['服务斜距',num(l.distance,1)+' km',u?u.id:'无点'],['同星候选',t.same.length,'排除服务束'],['异星候选',t.other.length,'与功率大小分开']],
 handoff:'完整平台输出每个 UE 的 C、I同星、I异星、N 和 SINR，再按统一的区域、快照和权重统计。本页完成几何与候选枚举。'};
}

function originalCenters(){
 const sat={pos:[C.R+1200,0,0]};
 return window.ZTE6870_TABLE11.map(b=>{const position=B.fromUV(sat,b.u,b.v),ll=B.lonlat(position);return {...b,label:'B'+b.id,position,lon:ll.lon,lat:ll.lat};});
}
function layoutReading(){
 const points=originalCenters(),b=points[Math.min(S.beam,points.length-1)],s=S.layoutStage;
 const html=[
 '<p><strong>先看覆盖。</strong>一条波束在地面形成一片覆盖，多条波束按近似蜂窝结构排列。左图用中心一束加周围六束，说明“六角布局”的含义。</p><p>彩色圆线表示 3 dB 轮廓的局部示意，青色虚线六边形表示覆盖规划近似。真实足迹可以相互重叠，外围还会拉伸。</p><p>这一图只解释排布概念；原文 Figure 2 给出实际足迹示例。下一小步从覆盖轮廓中只保留每束的目标中心。</p>',
 `<p><strong>再看中心。</strong>把每束覆盖轮廓暂时拿掉，只保留其地面目标中心 B。波位中心就是卫星希望这条波束对准的位置。</p><p>本图显示原文 Table 11 列出的 <strong>37 个中心</strong>，当前高亮 <strong>${b.label}</strong>：经度 <strong>${num(b.lon,5)}°</strong>、纬度 <strong>${num(b.lat,5)}°</strong>。</p><p>B0 位于星下点，其余中心偏离星下点。这里先确定“哪个点、在地球哪里”，下一小步再用 U、V 记录同一个点。</p>`,
 `<p><strong>最后换一种坐标记录同一位置。</strong>左图继续高亮 ${b.label}，右图高亮它的归一化经纬记录；编号和对应的地面位置保持一致。</p><p>6870 附录把经度、纬度归一化：<strong>U=0.5+经度/360°，V=0.5−纬度/180°</strong>。本例参考星下点 B0 的经纬度为 (0°,0°)，代入后 U=V=0.5；0.5 是坐标平移，与 3 dB 无关。</p><p>当前 ${b.label} 对应 <strong>U=${num(b.u,6)}、V=${num(b.v,6)}</strong>。向东经度增大，U 增大；向北纬度增大，V 减小，本图 V 轴向下。</p>`
 ];
 return {title:['六角覆盖：一束居中，六束相邻','波位中心：从覆盖轮廓中取出目标点','归一化经纬坐标：记录同一地面中心'][s],heading:['① 多束怎样组织覆盖','② 一个点对应一个波位中心','③ U、V 记录地面位置'][s],source:s===0?'原文 Figures 1–2 · 覆盖概念示意':'原文 Figure 3 / Appendix / Table 11',html:html[s],
 key:['“六角”说明覆盖的组织与近似分区；3 dB 足迹轮廓可以重叠。','点的位置与轮廓形状分别看；原文 37 个已列中心是坐标示例。','这一步是坐标表示转换，不会把已知中心重新排布。'][s],
 note:s===0?'局部 7 束概念图不按真实地表尺寸绘制，也不表示整星只有 7 束。':s===1?'图为地面点的 Y/Z 投影，仅显示中心，不把点阵当作实际 3 dB 轮廓。':'本页 U、V 记录地面经纬位置；方向余弦 u、v 记录卫星发射方向。下方直接并列两种定义。',
 caption:['圆线：3 dB 轮廓示意；点：波位中心；虚线六边形：覆盖规划近似。箭头指向下一小步要保留的中心点。','原文 Table 11 的 37 个已列中心。点击任意点，或用“跟踪 B0 / B1”切换；下一小步继续跟踪相同编号。','左：地面中心 Y/Z 投影；右：同一批中心的归一化经纬坐标（原文 U、V）。两图各自缩放，金色点的编号一一对应。'][s],
 formula:s===0?'覆盖轮廓 → 取中心 B → 用经纬度定位 → 用 U、V 记录':s===1?`${b.label}：经度 λ=${num(b.lon,5)}°；纬度 φ=${num(b.lat,5)}°`:`${b.label}：U=0.5+(${num(b.lon,5)})/360=${num(b.u,6)}；V=0.5−(${num(b.lat,5)})/180=${num(b.v,6)}`,
 read:s===0?[['本图示意',7,'中心 1 束 + 周围 6 束'],['圆线所示','3 dB 轮廓','局部覆盖示意'],['下一步保留','中心点 B','再说明其坐标']]:s===1?[['已列中心',37,'原文 Table 11'],['所选中心',b.label,'点选可切换'],['对应高度','1200 km','原文固定示例']]:[['同一中心',b.label,'左右编号一致'],['U',num(b.u,6),'经度的归一化记录'],['V',num(b.v,6),'纬度的归一化记录']],
 handoff:s===0?'进入“② 波位中心”，观察去掉轮廓后每个点表示什么。':s===1?'进入“③ 归一化经纬坐标”，同一个高亮点会保留，并逐项代入 U、V 公式。':'原文通过中心坐标表示布局；后续由卫星指向这些中心形成波束，再选择 UE 统计区域与活动干扰集合。'};
}
function layoutDetails(){
 const base=$('phase-beam-detail-2-'+S.layoutStage).innerHTML;
 if(S.layoutStage!==2)return base;
 const b=originalCenters()[Math.min(S.beam,36)];
 const worked=`<div class="phase-layout-worked"><b>当前 ${b.label}：从经纬度到归一化 U、V</b><div><span>经度 λ=${num(b.lon,5)}°</span><strong>U=0.5+(${num(b.lon,5)})/360=${num(b.u,6)}</strong></div><div><span>纬度 φ=${num(b.lat,5)}°</span><strong>V=0.5−(${num(b.lat,5)})/180=${num(b.v,6)}</strong></div><p>切换 B0、B1 或其他中心，上方两图和这里的代入过程一起更新。</p></div>`;
 return base.replace('<!--COORDINATE_EXAMPLE-->',worked);
}
function beamTable(){const p=preset();return `<table class="phase-side-table"><tr><th>S 波段</th><th>600 km</th><th>1200 km</th></tr><tr class="${S.set==='set1'?'active':''}"><td>Set-1</td><td>397 束</td><td>331 束</td></tr><tr class="${S.set==='set2'?'active':''}"><td>Set-2</td><td>37 束</td><td>61 束</td></tr></table>`;}
function representativeLinks(){const t=totals(),list=[...t.same.sort((a,b)=>a.theta-b.theta).slice(0,2),...t.other.sort((a,b)=>a.theta-b.theta).slice(0,4)];return `<div class="sat-rows"><p class="source-note">代表性候选链路：星 / 束 · d · θ</p>${list.map(l=>`<div class="sat-row"><span>${l.sat.id} / B${l.beam.id+1}</span><em>${num(l.distance,0)} km · ${num(l.theta,1)}°</em></div>`).join('')}<p class="source-note">各组按偏离角选取部分链路列示，非按实际接收功率排序。</p></div>`;}
function render(){const info=body(),m=main[S.major],p=preset();$('majorSteps').innerHTML=main.map((v,i)=>`<button data-action="major" data-value="${i}" class="${i===S.major?'active':''}" ${i===S.major?'aria-current="step"':''}><span>0${i+1}</span><strong>${v.name}</strong><small>${v.output}</small></button>`).join('');$('phaseName').textContent=`STEP 0${S.major+1} · ${m.name}`;$('phaseTotals').innerHTML=`<strong>${p.planes*p.perPlane}<small>参考星座卫星</small></strong><i></i><strong>${p.beams[S.set]}<small>波束 / 星</small></strong><i></i><strong>3<small>建模大步骤</small></strong>`;$('phaseSubheading').textContent=m.en;$('phaseTitle').textContent=info.title;$('phaseSubsteps').innerHTML=m.subs.map((t,i)=>`<button data-action="sub" data-value="${i}" class="${i===sub()?'active':''}" ${i===sub()?'aria-current="page"':''}>${S.major+1}.${i+1} ${t}</button>`).join('');$('phaseControls').innerHTML=controls();$('phaseCaption').textContent=info.caption;$('phaseFormula').textContent=info.formula;$('phaseReadouts').innerHTML=info.read.map(([a,b,c])=>`<div><small>${a}</small><strong>${b}</strong><em>${c}</em></div>`).join('');$('beam-design').hidden=S.major!==1;$('beam-design').innerHTML=S.major===1?(sub()===2?layoutDetails():$('phase-beam-detail-'+sub()).innerHTML):'';$('phaseHandoff').innerHTML=`<b>本大步的输出 →</b>${info.handoff}`;$('phaseExplanation').innerHTML=`<span class="source">${info.source}</span><h3>${info.heading}</h3>${info.html}${S.major===2&&sub()===2?'<div class="phase-callout">每束接收功率：<br>Pᵣ = Ptx · Gtx(θ) · Grx(ψ) / L<br><br>dB 形式：<br>Pᵣ[dBm] = Ptx[dBm] + Gtx[dBi] + Grx[dBi] − L[dB]</div><p>aₖ,ᵦ,ᵤ 表示地球遮挡、同频、资源重叠及点亮条件；极化隔离等损耗需一致计入功率模型。服务束记为 C，其余同频活动束分别累加到 I同星、I异星。载干比 CIR（Carrier-to-Interference Ratio）在线性域取 C/I；需要计入噪声时，再求 C/(I+N)。</p>':''}${S.major===1&&sub()===1?beamTable():''}<div class="geo-key">${info.key}</div>${S.major===2&&sub()>0?representativeLinks():''}<div class="phase-note">${info.note}</div>`;$('phaseProgress').textContent=`${S.major+1} / 3 · ${m.name}`;$('phasePrevious').disabled=S.major===0;$('phaseNext').textContent=S.major===2?'回到第一大步 ↺':'下一大步 →';document.querySelector('.phase-canvas').classList.toggle('is-globe',S.major===0||S.major===2&&sub()===1);$('phaseHeight').disabled=S.major===1&&sub()===2&&S.beamMode==='table';$('phaseSet').disabled=$('phaseHeight').disabled;size();}
function text(t,x,y,c=colors.muted,size=11,align='left'){ctx.font=`${size}px "Segoe UI","Microsoft YaHei",sans-serif`;ctx.fillStyle=c;ctx.textAlign=align;ctx.fillText(t,x,y);ctx.textAlign='left';}
function path(points,c=colors.grid,w=1,dash=[],fill){if(points.length<2)return;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));if(fill){ctx.closePath();ctx.fillStyle=fill;ctx.fill();}ctx.strokeStyle=c;ctx.lineWidth=w;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);}
function dot(p,r,c,stroke){ctx.beginPath();ctx.arc(p[0],p[1],r,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}}
function label(t,x,y,c=colors.white,size=11,align='left'){ctx.font=`${size}px "Segoe UI","Microsoft YaHei",sans-serif`;const width=ctx.measureText(t).width,left=align==='center'?x-width/2:align==='right'?x-width:x;ctx.fillStyle='#f9fafbee';ctx.fillRect(left-4,y-size-2,width+8,size+7);text(t,x,y,c,size,align);}
function camera(){const a=S.yaw*C.D,b=S.pitch*C.D;return {e:[-Math.sin(a),Math.cos(a),0],n:[-Math.cos(a)*Math.sin(b),-Math.sin(a)*Math.sin(b),Math.cos(b)],f:[Math.cos(a)*Math.cos(b),Math.sin(a)*Math.cos(b),Math.sin(b)]};}
function project(v){const c=camera(),scale=Math.min(W*.4,H*.40)/(C.R+S.h);return [W*.49+scale*C.dot(v,c.e),H*.5-scale*C.dot(v,c.n),C.dot(v,c.f),scale];}
function shown(v){const q=project(v);return q[2]>=0||Math.hypot(q[0]-W*.49,q[1]-H*.5)>C.R*q[3];}
function globe(){const p=preset(),c=camera(),scale=project([0,0,0])[3],single=S.major===0&&S.orbit!=='full',planes=single?1:p.planes,all=scene().all;for(const front of [false,true]){if(front)EarthSurface.globe(ctx,W*.49,H*.5,C.R*scale,c);for(let k=0;k<planes;k++){let run=[];for(let a=0;a<=360;a+=3){const q=project(C.orbit(p,180*k/p.planes,a));if((q[2]>=0)===front)run.push(q.slice(0,2));else{path(run,k===0?front?'#2c7b78b0':'#2c7b7844':front?'#547d9c60':'#547b9c22',k===0?1.3:.8,front?[]:[3,4]);run=[];}}path(run,k===0?front?'#2c7b78b0':'#2c7b7844':front?'#547d9c60':'#547b9c22',k===0?1.3:.8,front?[]:[3,4]);}}
const u=S.major===2?pickedUE():null,visible=u?C.classify(all,u.position).filter(s=>s.visible):[];for(const s of all){if(single&&(s.plane!==0||S.orbit==='one'&&s.k!==0))continue;if(!shown(s.pos))continue;const q=project(s.pos),v=u&&C.link(s,u.position).visible;dot(q,s.id===scene().ref.id?4:v?3:1.6,s.id===scene().ref.id?colors.mint:v?colors.purple:'#557e9a');}
if(u){for(const s of visible){if(!shown(s.pos)||!shown(u.position))continue;if(S.scope==='same'&&s.id!==scene().ref.id)continue;const a=project(s.pos),b=project(u.position);path([a.slice(0,2),b.slice(0,2)],s.id===scene().ref.id?colors.mint:'#4f2eb890',s.id===scene().ref.id?2:1,[3,4]);}if(shown(u.position)){const q=project(u.position);dot(q,5,'#ffffff');label('UE '+u.id,q[0]+10,q[1]+18,'#203143',11);}}
label(S.major===0?`${single?'当前只展开一轨；参考星座仍为 ':''}${p.planes} 面 × ${p.perPlane} 星 = ${p.planes*p.perPlane} 星`:`一个 UE · ${visible.length} 颗可见星 · 当前纳入 ${S.scope==='same'?1:visible.length} 星`,W/2,H-15,colors.white,11,'center');text('拖动旋转地球',W-20,21,colors.muted,9,'right');}
function viewport(box,fn){ctx.save();ctx.beginPath();ctx.rect(box.x,box.y,box.w,box.h);ctx.clip();fn();ctx.restore();}
function panelBoxes(){if(W<560)return [{x:12,y:22,w:W-24,h:H*.43},{x:12,y:H*.51,w:W-24,h:H*.43}];return [{x:25,y:25,w:W*.44,h:H-65},{x:W*.53,y:25,w:W*.44,h:H-65}];}

function layoutCoverage(){
 const small=W<560,b=small?{x:18,y:20,w:W-36,h:H*.59}:{x:26,y:25,w:W*.55,h:H-65},r=Math.min(b.w/5.2,(b.h-60)/5.5),cx=b.x+b.w/2,cy=b.y+b.h*.52;
 const pts=[[cx,cy],...Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return [cx+Math.sqrt(3)*r*Math.cos(a),cy+Math.sqrt(3)*r*Math.sin(a)];})];
 text('局部 7 束覆盖 · 概念示意',cx,b.y+12,colors.white,12,'center');
 for(let i=0;i<pts.length;i++){ctx.beginPath();ctx.arc(pts[i][0],pts[i][1],r,0,Math.PI*2);ctx.fillStyle=(i===0?'#ad7b32':'#286f92')+'0a';ctx.fill();ctx.strokeStyle=i===0?colors.gold:'#6a98ac';ctx.lineWidth=i===0?2:1;ctx.stroke();}
 const hex=Array.from({length:7},(_,i)=>{const a=(30+i*60)*C.D;return [cx+r*Math.cos(a),cy+r*Math.sin(a)];});path(hex,colors.mint,1.6,[5,4],'#2c7b780a');
 pts.forEach((p,i)=>{dot(p,i===0?4:3,i===0?colors.gold:colors.blue);label(i===0?'B₀':'B'+i,p[0]+7,p[1]-8,i===0?colors.gold:colors.blue,10);});
 const x=small?W*.5:W*.77,y=small?H*.68:H*.27;
 text('从一片覆盖，到一个中心',x,y,colors.white,small?12:14,'center');
 const q=[x,y+(small?52:80)];ctx.beginPath();ctx.arc(q[0],q[1],small?28:43,0,Math.PI*2);ctx.strokeStyle=colors.gold;ctx.lineWidth=1.8;ctx.stroke();dot(q,4,colors.gold);label('B₀',q[0]+8,q[1]-8,colors.gold,11);text('圆线：覆盖轮廓',x,q[1]+(small?48:68),colors.muted,11,'center');text('金色点：波位中心',x,q[1]+(small?69:92),colors.gold,11,'center');
 if(!small){const from=[b.x+b.w-7,cy],to=[x-58,q[1]];path([from,to],colors.muted,1.4);const a=Math.atan2(to[1]-from[1],to[0]-from[0]);path([[to[0]-8*Math.cos(a-.45),to[1]-8*Math.sin(a-.45)],to,[to[0]-8*Math.cos(a+.45),to[1]-8*Math.sin(a+.45)]],colors.muted,1.4);}
}
function plotCenters(box,uv=false){
 const data=originalCenters(),selected=Math.min(S.beam,36),vals=data.map(b=>uv?[b.u,b.v]:[b.position[1],b.position[2]]),mx=uv?.5:0,my=uv?.5:0,cx=box.x+box.w/2,cy=box.y+box.h*.51;
 let dx=Math.max(...vals.map(p=>Math.abs(p[0]-mx))),dy=Math.max(...vals.map(p=>Math.abs(p[1]-my))),xs=(box.w-78)/(2*dx||1)*.82,ys=(box.h-115)/(2*dy||1)*.82;
 if(!uv)xs=ys=Math.min(xs,ys);
 const xy=p=>[cx+(p[0]-mx)*xs,cy+(uv?1:-1)*(p[1]-my)*ys];
 text(uv?'归一化经纬坐标（原文 U,V）':'地面中心 · 星下点附近俯视',cx,box.y+12,colors.white,12,'center');path([[box.x+20,cy],[box.x+box.w-17,cy]],colors.grid,1);path([[cx,box.y+40],[cx,box.y+box.h-35]],colors.grid,1);
 for(let i=0;i<data.length;i++){const q=xy(vals[i]),sel=i===selected;dot(q,sel?5:3,sel?colors.gold:'#6e99a9',sel?'#ffffff':null);hit.push({x:q[0],y:q[1],r:9,beam:i});if(i===0&&i!==selected)label('B0',q[0]+7,q[1]+17,colors.mint,10);}
 const b=data[selected],q=xy(vals[selected]);label(b.label,q[0]+9,q[1]-10,colors.gold,12);
 text(uv?'U（经度）→':'东向 Y / km →',box.x+box.w-3,cy+20,colors.muted,10,'right');text(uv?'V（纬度，向下）':'北向 Z / km ↑',cx+8,box.y+37,colors.muted,10);
 text(uv?`${b.label}：U=${num(b.u,6)}，V=${num(b.v,6)}`:`${b.label}：经度 ${num(b.lon,5)}°，纬度 ${num(b.lat,5)}°`,cx,box.y+box.h-5,colors.gold,W<560?10:11,'center');
 if(uv)text('零经纬 B0=(0.5,0.5)',box.x+20,box.y+box.h-29,colors.muted,10);else text('点表示中心；覆盖轮廓在本图省略',cx,box.y+box.h-29,colors.muted,10,'center');
}
function layoutWalkthrough(){
 if(S.layoutStage===0){layoutCoverage();return;}
 if(S.layoutStage===1){plotCenters({x:W*.10,y:25,w:W*.80,h:H-48});return;}
 const boxes=panelBoxes();plotCenters(boxes[0],false);plotCenters(boxes[1],true);
}

function coverageDesign(){
 const g=C.coverage(S.h,30),a=g.alpha*C.D,ns=Math.ceil(2*Math.PI/(Math.sqrt(3)*a)),boxes=panelBoxes(),b=boxes[0],right=boxes[1];
 const xmax=C.R*Math.sin(a*1.16),drop=C.R*(1-Math.cos(a*1.16)),sc=Math.min((b.w-34)/(2*xmax),(b.h-95)/(S.h+drop)),cx=b.x+b.w/2,cy=b.y+55+S.h*sc,xy=(x,z)=>[cx+x*sc,cy-z*sc];
 text('球面覆盖剖面 · 最低仰角 30°',cx,b.y+14,colors.white,W<560?11:12,'center');
 const ground=[];for(let i=0;i<=100;i++){const q=a*1.16*(-1+2*i/100);ground.push(xy(C.R*Math.sin(q),C.R*(Math.cos(q)-1)));}path(ground,colors.mint,1.8);
 const sat=xy(0,S.h),p=xy(0,0),edge=xy(C.R*Math.sin(a),C.R*(Math.cos(a)-1)),other=xy(-C.R*Math.sin(a),C.R*(Math.cos(a)-1));
 path([other,sat,edge],colors.blue,1.6);path([sat,p],colors.muted,1,[4,4]);dot(sat,4,colors.blue);dot(p,3,colors.mint);dot(edge,4,colors.gold);
 label('S',sat[0]+7,sat[1]-6,colors.blue,11);label('P 星下点',p[0],p[1]+20,colors.mint,10,'center');label('U 边界',edge[0]+6,edge[1]+20,colors.gold,10);
 const tangent=[-Math.cos(a),Math.sin(a)],tt=[edge[0]+tangent[0]*60,edge[1]-tangent[1]*60];path([tt,edge],colors.gold,1,[3,3]);
 const aa=Math.atan2(tt[1]-edge[1],tt[0]-edge[0]),bb=Math.atan2(sat[1]-edge[1],sat[0]-edge[0]);ctx.beginPath();ctx.arc(edge[0],edge[1],27,aa,bb);ctx.strokeStyle=colors.gold;ctx.lineWidth=1.5;ctx.stroke();label('30°',edge[0]-54,edge[1]-21,colors.gold,10);
 label('高度 h = '+S.h+' km',p[0]-12,(p[1]+sat[1])/2,colors.muted,10,'right');
 const x=right.x+right.w/2,y=right.y+15; text('覆盖尺度 → 同轨卫星数',x,y,colors.white,12,'center');
 const rows=[['半覆盖地心角 α',num(g.alpha,4)+'°'],['地表半径 L = Rₑα',num(g.arc,1)+' km'],['未取整的同轨星数',num(2*Math.PI/(Math.sqrt(3)*a),3)],['向上取整 Ns',ns+' 星 / 轨道面']];
 rows.forEach(([title,value],i)=>{const yy=y+36+i*(right.h-55)/4;text(title,x,yy,colors.muted,10,'center');text(value,x,yy+23,i===3?colors.mint:colors.white,i===3?22:17,'center');});
}
function countGrid(){const bs=grid(),radius=preset().diameter[S.set]/2,max=Math.max(...bs.map(b=>Math.hypot(b.x,b.y)))+radius,plotW=W<560?W*.90:W*.65,sc=Math.min(plotW*.41,H*.39)/max,cx=W<560?W*.5:W*.36,cy=H*.5;for(const b of bs){const q=[cx+b.x*sc,cy-b.y*sc],c=colors.mint;dot(q,bs.length>100?1.7:3,c);}if(W>=560){const x=W*.73;label(grid().length+' 束 / 星',x,100,colors.mint,24);text('六角层数计数示意',x,133,colors.muted,12);text('每圈依次增加',x,176,colors.muted,11);text('6、12、18…束',x,200,colors.white,13);text('波束直径参数',x,249,colors.muted,11);text(preset().diameter[S.set]+' km',x,276,colors.gold,20);}label('1 + 6 + 12 + … = '+bs.length+' 束；此处不画真实足迹',W/2,H-16,colors.white,W<560?10:12,'center');}
function uePlot(){const us=sampled(),gs=grid(),beams=S.sampleGroup==='one'?[gs[Math.min(S.beam,gs.length-1)]]:gs.filter(b=>b.ring<=2),radius=preset().diameter[S.set]/2,mx=beams.reduce((s,b)=>s+b.x,0)/beams.length,my=beams.reduce((s,b)=>s+b.y,0)/beams.length,max=Math.max(...beams.map(b=>Math.hypot(b.x-mx,b.y-my)))+radius*1.4,sc=Math.min(W*.42,H*.38)/max,cx=W*.5,cy=H*.48,xy=(x,y)=>[cx+(x-mx)*sc,cy-(y-my)*sc];for(const b of beams){const pts=Array.from({length:7},(_,i)=>{const a=(30+i*60)*C.D;return xy(b.x+radius*Math.cos(a),b.y+radius*Math.sin(a));});path(pts,'#457769',1,[],'#2c7b7807');dot(xy(b.x,b.y),1.7,colors.mint);}const chosen=pickedUE();for(const u of us){const q=xy(u.x,u.y),sel=chosen&&u.id===chosen.id;dot(q,sel?5:3,sel?'#f9fafb':colors.gold,sel?'#203143':null);hit.push({x:q[0],y:q[1],r:10,ue:u.id});if(sel)label(u.id,q[0]+9,q[1]-10,'#203143',11);}label(`${beams.length} 个被评估波束 · 每束 ${S.count} UE · 当前 ${us.length} 个有效点`,W/2,H-16,colors.white,11,'center');}
function powerSum(){const t=totals(),u=pickedUE(),l=linkForUE(),small=W<560,m=small?18:40,bw=(W-2*m-18)/2,y=55,bh=H*.27;function box(x,y,w,h,c){ctx.fillStyle=c+'0a';ctx.strokeStyle=c+'80';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x,y,w,h,6);ctx.fill();ctx.stroke();}box(m,y,bw,bh,colors.mint);box(m+bw+18,y,bw,bh,colors.purple);text('同星干扰项',m+16,y+28,colors.mint,14);text(t.same.length+' 个候选波束',m+16,y+58,colors.white,small?12:16);text('逐束计算 P，再求和',m+16,y+86,colors.muted,10);text('异星干扰项',m+bw+34,y+28,colors.purple,14);text(t.other.length+' 个候选波束',m+bw+34,y+58,colors.white,small?12:16);text('每颗可见星重复同样计算',m+bw+34,y+86,colors.muted,10);const midY=y+bh+50;path([[m+bw/2,y+bh],[m+bw/2,midY],[W/2,midY]],colors.mint,1.4);path([[m+bw*1.5+18,y+bh],[m+bw*1.5+18,midY],[W/2,midY]],colors.purple,1.4);label('I = I同星 + I异星',W/2,midY+27,colors.gold,18,'center');text('所有接收功率先用 W 或 mW 表示',W/2,midY+58,colors.muted,11,'center');box(m,midY+82,W-2*m,85,colors.grid);text('服务束单独保留为 C',m+15,midY+108,colors.mint,12);text(`d = ${num(l.distance,1)} km；θ = ${num(l.theta,2)}°`,m+15,midY+134,colors.white,12);text('接入 Ptx、G(θ)、L 后得到 C 与 I；CIR = C / I',W/2,H-15,colors.muted,10,'center');}
function statistics(){
 const small=W<560,m=small?18:38,w=W-2*m,rows=[['被测 UE 集合',sampled().length+' 个样本；采样区域与快照先固定'],['对每个 UE 分别计算','关联 → Cᵤ、I同星、I异星、Nᵤ → SINRᵤ'],['把样本汇成 CDF','统计 SINRᵤ ≤ x 的样本比例']];
 rows.forEach((r,i)=>{const y=35+i*H*.27;ctx.fillStyle=i===1?'#edf3f2':'#f7f9f8';ctx.strokeStyle='#d2e1df';ctx.beginPath();ctx.roundRect(m,y,w,H*.20,7);ctx.fill();ctx.stroke();text('0'+(i+1)+'  '+r[0],m+16,y+30,colors.mint,small?12:15);text(r[1],m+16,y+58,colors.white,small?10:12);if(i<2)label('↓',W/2,y+H*.24,colors.muted,17,'center');});
 label('本页输出几何与候选链路；数值 CDF 需接入完整功率模型',W/2,H-18,colors.muted,small?9:11,'center');
}
function draw(){raf=false;ctx.clearRect(0,0,W,H);hit=[];if(S.major===0)globe();else if(S.major===1)[coverageDesign,countGrid,layoutWalkthrough][sub()]();else [uePlot,globe,powerSum,statistics][sub()]();}
function requestDraw(){if(!raf){raf=true;requestAnimationFrame(draw);}}
function size(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);requestDraw();}
function changeMajor(n){S.major=(n+3)%3;if(S.major===1&&sub()===2){S.beamMode='table';S.h=1200;$('phaseHeight').value='1200';}if(S.major!==1&&S.beamMode==='table'){S.beamMode='grid';S.beam=Math.min(S.beam,grid().length-1);}render();}
$('majorSteps').onclick=e=>{const b=e.target.closest('[data-action="major"]');if(b)changeMajor(+b.dataset.value);};$('phaseApp').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,v=b.dataset.value;if(a==='layoutStage'){S.layoutStage=+v;if(+v===0)S.beam=0;}if(a==='layoutBeam')S.beam=+v;if(a==='sub'){S.sub[S.major]=+v;if(S.major===1){S.beamMode=+v===2?'table':'grid';S.beam=1;if(+v===2){S.beam=0;S.h=1200;$('phaseHeight').value='1200';}}}if(a==='orbit')S.orbit=v;if(a==='beamMode'){S.beamMode=v;S.beam=1;if(v==='table'){S.h=1200;$('phaseHeight').value='1200';}}if(a==='beamNext')S.beam=(S.beam+1)%beamData().length;if(a==='beamPrev')S.beam=(S.beam+beamData().length-1)%beamData().length;if(a==='sampleGroup'){const id=pickedUE()?.id;S.sampleGroup=v;S.ue=Math.max(0,sampled().findIndex(u=>u.id===id));}if(a==='resample'){S.seed++;S.ue=0;}if(a==='scope')S.scope=v;if(a==='reuse')S.reuse=+v;render();});
$('phaseHeight').onchange=e=>{S.h=+e.target.value;S.beam=1;S.ue=0;render();};$('phaseSet').onchange=e=>{S.set=e.target.value;S.beam=1;S.ue=0;render();};$('phaseControls').addEventListener('change',e=>{if(e.target.id==='sampleCount'){S.count=+e.target.value;S.ue=0;}else if(e.target.id==='phaseAngle'){S.phase=+e.target.value;S.ue=0;}else return;render();});$('phaseControls').addEventListener('input',e=>{if(e.target.id==='phaseAngle')$('phaseAngleOut').textContent=e.target.value+'°';});$('phasePrevious').onclick=()=>changeMajor(S.major-1);$('phaseNext').onclick=()=>changeMajor(S.major+1);
canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,ox:e.clientX,oy:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.ox,e.clientY-drag.oy)>4)drag.moved=true;if(S.major===0||S.major===2&&sub()===1){S.yaw-=(e.clientX-drag.x)*.4;S.pitch=Math.max(-80,Math.min(80,S.pitch+(e.clientY-drag.y)*.3));requestDraw();}drag.x=e.clientX;drag.y=e.clientY;};canvas.onpointerup=e=>{if(drag&&!drag.moved){const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,h=hit.reduce((best,h)=>Math.hypot(h.x-x,h.y-y)<h.r&&(!best||Math.hypot(h.x-x,h.y-y)<Math.hypot(best.x-x,best.y-y))?h:best,null);if(h){if(h.beam!==undefined)S.beam=h.beam;if(h.ue)S.ue=sampled().findIndex(u=>u.id===h.ue);render();}}drag=null;};canvas.onpointercancel=()=>drag=null;
window.addEventListener('earthready',requestDraw);new ResizeObserver(size).observe(canvas);render();
function openBeamDesign(){if(!['#beam-design','#zte-layout'].includes(location.hash))return;S.major=1;if(location.hash==='#zte-layout'){S.sub[1]=2;S.layoutStage=0;S.beam=0;S.beamMode='table';S.h=1200;$('phaseHeight').value='1200';}render();requestAnimationFrame(()=>$('phaseApp').scrollIntoView({block:'start'}));}
window.addEventListener('hashchange',openBeamDesign);openBeamDesign();
window.NTNReadScene=()=>{
 const original=S.major===1&&S.beamMode==='table',sc=scene(),ref=original?{id:'Table 11 参考星',pos:[C.R+1200,0,0]}:sc.ref;
 const b=pickedBeam(),ue=pickedUE(),target=S.major===2&&ue?B.center(ref,ue.beam):original?B.fromUV(ref,b.u,b.v):B.center(ref,b);
 const near=original?[]:sc.all.filter(s=>s.id!==ref.id).sort((a,b)=>C.link(b,ue?.position||target).elevation-C.link(a,ue?.position||target).elevation).slice(0,6);
 return {R:C.R,h:original?1200:S.h,orbitNormals:original?[]:[...new Set([ref,...near].map(s=>s.plane))].slice(0,3).map(p=>{const z=sc.all.filter(s=>s.plane===p);return [z[0].pos[1]*z[1].pos[2]-z[0].pos[2]*z[1].pos[1],z[0].pos[2]*z[1].pos[0]-z[0].pos[0]*z[1].pos[2],z[0].pos[0]*z[1].pos[1]-z[0].pos[1]*z[1].pos[0]];}),sats:[ref,...near].map(s=>({id:s.id,pos:s.pos})),ref:ref.pos,ue:S.major===2&&ue?ue.position:target,target,points:[],note:original?'Table 11 固定 LEO1200 参考例；当前显示已选波束中心，未把 37 点当作整星全部波束。':`完整参考星座 ${preset().planes*preset().perPlane} 星；三维读图仅显示参考星及最多六颗邻星，不是七星星座模型。${S.major===2&&ue?'当前 UE '+ue.id+' 与下方采样一致。':'当前目标为下方所选波位。'}`};
};
})();


