(function(root){
'use strict';
const Q=typeof module!=='undefined'&&module.exports?require('./qc-model.js'):root.QCModel;
const f=(x,d=2)=>Number(x).toFixed(d),vec=(v,d=1)=>'('+v.map(x=>f(x,d)).join(', ')+')';
const rule='<span class="qc-rule-label">提案原则</span>',impl='<span class="qc-rule-label implementation">本页实现</span>';
function projectionMetrics(c){const edges=c.polygon.map((p,i)=>Math.hypot(p[0]-c.polygon[(i+1)%6][0],p[1]-c.polygon[(i+1)%6][1]));return {edges,min:Math.min(...edges),max:Math.max(...edges),ratio:Math.max(...edges)/Math.min(...edges)};}
function example(m,neighbor=1){const p=Q.placement(m,neighbor);return {...p,phi:Math.atan2(p.sat.y,p.sat.x)/Q.DEG,latitude:m.sphere?Math.asin(p.sat.nadir[2]/Q.R)/Q.DEG:null,longitude:m.sphere?Math.atan2(p.sat.nadir[1],p.sat.nadir[0])/Q.DEG:null};}
function copyData(m,c,neighbor=1){const p=Q.placement(m,neighbor);return {sat:p.sat,reference:p.sats[0],center0:c.center,centerJ:p.sat.rotate(c.center),vertex0:c.vertices[0],vertexJ:p.sat.rotate(c.vertices[0])};}
function geometryPage(S,m,c){
 const p=example(m,S.neighbor),j=p.sat.id,next=p.next.id;
 const base={source:'Proposal 11.1-1 / 11.1-2 · 几何构造',handoff:'给第二步：各星宽小区的实际地面坐标、边界顶点与局部天线坐标系；逻辑网格保留用于编号和 W 筛选。'};
 const pages=[
 {title:'先在逻辑平面排宽小区，再确定实际地面位置',head:'61 个宽小区组织一颗星的服务区',
 body:`<p>${rule}单星服务区按地面六角宽小区组织，圈数 n、最小仰角及是否考虑曲率由评估方报告。</p><p>${impl}在逻辑平面按 D = 200 km 排网格，中心加 n = 4 圈，共 <strong>1 + 3n(n+1) = 61</strong> 个宽小区。球面模式再把中心与边界顶点放到地球表面。</p><p>中心宽小区的中心与该星星下点重合。其余宽小区属于同一颗星的服务区，并不各自对应一颗卫星。</p>`,
 key:'D 是生成逻辑网格的间距。映射到球面后，不能把所有相邻地面中心的测地距离都视为严格等于 D。',note:'本页采用球形地球 R = 6371 km。逻辑网格、地面三维坐标和 UV 方向余弦分别在不同步骤中建立。',caption:'逻辑展开图：点击宽小区可持续跟踪。球面模式下，链路计算使用映射后的三维地面位置。',formula:'Nwide = 1 + 3n(n+1) = 61；D = 200 km 为逻辑平面中心距',read:[['宽小区 / 星',61,'服务与撒点单元'],['逻辑网格间距','200 km','映射前的平面距离'],['地球半径','6371 km','本页球形地球']]},
 {title:'六颗邻星围绕参考星，先确定逻辑网格位置',head:'这一步只确定邻星中心的相对排布',
 body:`<p>${rule}在参考星外增加六颗邻星，中心位于六角网格距离 <strong>2n+1 = 9</strong> 的位置；星下点按实际地面距离偏移。</p><p>${impl}选取第一颗邻星轴坐标 <strong>(n+1,n) = (5,4)</strong>，再绕参考中心做五次 60° 旋转，得到六个中心。</p><p>轴坐标 (q,r) 是网格编号。它决定了逻辑位置，但还需要换算成公里，再映射到球面。<strong>完整换算例子集中在 1.3。</strong></p><table class="qc-compact-table"><caption>本页选定的六邻星中心</caption><thead><tr><th>星下点 / 卫星</th><th>(q,r)</th><th>d_hex</th></tr></thead><tbody>${p.sats.slice(1).map(s=>`<tr><td>P${s.id} / S${s.id}</td><td>(${s.q},${s.r})</td><td>${Q.hexDistance([s.q,s.r])}</td></tr>`).join('')}</tbody></table>`,
 key:'六角距离是无量纲的网格步数；它不能直接乘 D 当作两点间直线距离。',note:'(5,4) 及其旋转副本是本页采用的具体嵌入。此图为各星宽小区的逻辑平移展开，球面上的实际复制在 1.5 说明。',caption:'六邻星的逻辑排布图。这里的七星表示参考星加六颗邻星，未设置轨道面数。',formula:'d_hex = max(|q|, |r|, |q+r|)；邻星中心 d_hex = 2n+1 = 9',read:[['参考星',1,'中心区域'],['附加邻星',6,'六个对称位置'],['六角网格距离',9,'换算示例见 1.3']]},
 {title:`完整例子：从 (${p.sat.q},${p.sat.r}) 算到星下点 P${j} 与卫星 S${j}`,head:'把 1.2 的网格编号一直算到三维位置',
 body:`<p>${impl}本例把参考星下点放在赤道、零经度，<strong>P0 = (R,0,0)</strong>。局部东向沿全局 Y，北向沿全局 Z，便于逐项核对坐标；整套球面构造可整体旋转到其他参考位置。</p><p>先把 (${p.sat.q},${p.sat.r}) 换成局部平面位移 x、y，再计算长度 L 与方向 φ。${S.sphere?'球面模式把 L 作为大圆弧长，以 α = L/R 得到地心夹角。':'当前平面近似直接使用 (x,y) 位移，不将地面弯成球面。'}</p><p>最后分别得到<strong>地面点 P${j}</strong>与<strong>星上点 S${j}</strong>。下方五行计算会随邻星和地球模型同步更新。</p>`,
 key:'q、r 是网格编号；x、y 是局部平面公里数；g 是地面三维坐标；s 是卫星三维坐标。这四种量不要混用。',
 note:'φ 从局部东向 x 轴起算，逆时针朝北为正。三维坐标单位为 km。本例数值与球面映射公式属于本页明确采用的实现。',
 caption:`左：由网格坐标选中 P${j}；右：把偏移方向旋转到剖面内，展示 P0、P${j} 及其上方卫星。下方继续展开完整数值。`,
 formula:S.sphere?'(q,r) → (x,y) → (L,φ) → α=L/R → 地面 gⱼ → 卫星 sⱼ=(R+h)gⱼ/R':'(q,r) → (x,y) → 地面 gⱼ=(R,x,y) → 卫星 sⱼ=(R+h,x,y)',
 read:[['六角网格距离',Q.hexDistance([p.sat.q,p.sat.r]),'无量纲'],['偏移长度 L',f(p.plane,1)+' km',S.sphere?'作为球面弧长':'平面距离'],['地心 / 法线夹角',f(p.verticalAngle,2)+'°',S.sphere?'α = L/R':'平面模型为 0°']]},
 {title:'考虑曲率后，哪些距离和六边形性质还保留？',head:'中心距离保持，不代表所有距离都保持',
 body:`<p>从 P0 沿六个方位走相同弧长，可以构造六个对称的外围星下点。球面上仍可定义六边区域、保留六角编号和邻接关系。</p><p>但平面正六边形不能无变形地贴到球面。按本页映射，${S.sphere?`P0 到任一外围点仍为 <strong>${f(p.centerDistance,1)} km</strong>，相邻外围点却约为 <strong>${f(p.outerDistance,1)} km</strong>。`:'平面模型中的两类距离相等；切换球面后即可看到差别。'}</p><p>地面宽小区也会经历球面形变；到第二步还要再经历“从地面到卫星 UV”的方向映射。两次映射都不能一般保证欧式正六边形形状。</p>`,
 key:'不能同时保留所有平面距离、欧式正六边形形状和无缝铺砌。当前六角俯视图是逻辑展开，链路采用实际三维几何。',note:'整片网格共享边界一起映射，可保持拼接；各星分别旋转复制，则保持本地布局相同，却不保证不同星之间的边缘严丝合缝。复制规则见 1.5。',caption:`切换地球模型，比较 P0→P${j} 与 P${j}→P${next} 的距离。剖面中的当地竖直方向也随曲率改变。`,formula:'球面映射保留中心距离与初始方位；其他点间距离需由球面坐标重新计算',read:[[`P0 → P${j}`,f(p.centerDistance,1)+' km',S.sphere?'大圆弧长':'平面地面距离'],[`P${j} → P${next}`,f(p.outerDistance,1)+' km','相邻两个外围星下点'],['当地竖直夹角',f(p.verticalAngle,2)+'°',S.sphere?'两点径向夹角':'平面模型为 0°']]},
 {title:`把 S0 的整套宽小区模板，搬到邻星 S${j}`,head:'先复制编号与本地布局，再换算全球位置',
 body:`<p>${rule}每颗邻星在自己的<strong>局部坐标系（Local Coordinate System，LCS）</strong>中携带相同的小区与波束布局。</p><p>具体到所选宽小区：S0 的 <strong>C${c.id}</strong> 有一个中心和六个边界顶点；S${j} 也建立自己的 <strong>C${c.id}</strong>，保留同一编号和本地位置。</p><p>${S.sphere?`为把它放到 P${j} 附近，先求从 P0 径向转到 P${j} 径向的最小旋转 Rⱼ，再把参考模板的每个地面点都乘 Rⱼ；邻星的局部坐标轴也一起旋转。`:`平面近似下，把每个参考地面点加上邻星的平面位移，局部坐标轴保持平行。`}</p><p>因此左右两张<strong>各自本地的图</strong>相同，但地球共同坐标中的位置不同。下方表格直接比较同一中心与顶点的三维坐标。</p>`,
 key:'复制的是一套布局模板；每颗星有自己的小区实例。计算同一个 UE 的多星干扰时，UE 保持在共同地球坐标中，逐星计算其与发送束的几何关系。',
 note:'这里先讲宽小区与坐标系的复制。2.2 生成窄波束后，同一束保持相同局部 (u,v)，全球波束指向按同一个旋转变换。区域七星数不等于轨道面数。',
 caption:`两图分别使用 S0、S${j} 自己的本地展开坐标；都高亮 C${c.id} 及顶点 A。它们不是一张共同地球平面中的两个重合区域。`,
 formula:S.sphere?'地面点：gⱼ,c = Rⱼ g₀,c；坐标轴与方向向量也乘 Rⱼ；同一局部编号保持不变':'地面点：gⱼ,c = g₀,c + 位移；方向向量不加位移；各星局部坐标轴平行',
 read:[['参考 / 邻星','S0 / S'+j,'各有一套模板实例'],['相同宽小区','C'+c.id,'中心与六个顶点均复制'],['布局副本',7,'相同本地布局、不同全球位置']]}
 ];return {...base,...pages[S.subs[0]]};
}
function beamPage(S,m,c){
 const stats=projectionMetrics(c),owner=m.beams.filter(b=>b.cell===c.id);
 if(S.subs[1]===0)return {source:'Fixed Beam-Layout · Figure 11.1-3',title:'地面六个顶点映到 UV，轮廓通常不再是正六边形',head:'2.1 只确定宽小区的 UV 轮廓',
 body:`<p>对宽小区 C${c.id} 的每个地面顶点 g，从卫星位置 rₛ 指向它，先计算单位方向 <strong>d = (g−rₛ)/‖g−rₛ‖</strong>。</p><p>取这个方向在本星两个横向坐标轴上的分量，得到 <strong>u = d·eᵤ，v = d·eᵥ</strong>。A—F 六个地面顶点与六个 UV 点一一对应。</p><p>这一步保留了顶点的对应关系和轮廓，<strong>没有保证边长、角度不变</strong>。切换中心和边缘小区，观察 UV 轮廓与下方顶点数值。</p>`,
 key:'通常仍是六顶点轮廓，但不保证是正六边形。星下中心小区在本页对称配置中可以保持规则；离轴边缘小区一般会变形。',
 note:(S.sphere?'左图是球面地面点在本地东／北坐标中的投影展示；':'左图为平面地面点的东／北坐标；')+'右图为无量纲 UV 方向余弦。本页将六个 UV 顶点依次连成轮廓，两图各用自己的比例尺。窄波束及 k、g 留到 2.2。',
 caption:'A—F 表示同一组顶点。切换中心、边缘、角部小区，或点击图中小区；“放大所选小区”用于观察形变。',formula:'地面顶点 g → 单位视线 d → (u,v) → 宽小区轮廓；本步不决定窄波束数量',
 read:[['所选宽小区','C'+c.id,`轴坐标 (${c.q},${c.r})`],['UV 最长边 / 最短边',f(stats.ratio,2),'边长不等即可排除正六边形'],['对应顶点',6,'A—F 逐点映射']],handoff:'给 2.2：61 个宽小区的 UV 轮廓及中心；接下来在整片服务区上生成窄波束并确定归属。'};
 return {source:'Fixed Beam-Layout · Figures 11.1-4 / 11.1-5',title:'用 k、g 生成整片 UV 窄束，再统计各小区关联数量',head:'2.2 把生成、边界保护、归属和计数放在一起',
 body:`<p>沿用 2.1 的宽小区 UV 轮廓，先按 <strong>s = k·2sin(HPBW/2)</strong> 在整片 UV 服务区生成六角窄波束网格。</p><p><strong>k</strong> 控制中心间距；<strong>g</strong> 在整颗星服务区的外缘保留距离不超过 gs 的额外中心。g 不是对每个宽小区的内部边界各加一圈。</p><p>保留的每条窄束，再按 <strong>UV 中心距离最近</strong>关联到一个宽小区，最后逐小区计数。当前每星 <strong>${m.beams.length}</strong> 条候选束，其中外缘保护中心 <strong>${m.beams.filter(b=>b.guard).length}</strong> 个；C${c.id} 关联 <strong>${owner.length}</strong> 条。</p>`,
 key:'顺序是“整片排束 → 保留边界束 → 关联宽小区 → 统计数量”。不是先给每个宽小区指定相同的束数，再分别填满。',
 note:'本页 HPBW 取 2.82°作数值展开；球面默认 k=√3/2、g=0.5 得1303条候选束。改变 k、g 或地球模型，数量与归属都会重新计算。候选束数不等于同时发送束数。',
 caption:S.beamView==='guard'?'放大所选小区附近的边界。金色点为服务区外保护中心，圆为3 dB方向域轮廓。':S.beamView==='ground'?'左图看 UV 归属，右图把关联窄束投回地面。点击窄束可跟踪其所属宽小区。':'左图看整片 UV 网格，右图放大所选宽小区附近。青色为所选小区关联束，金色点为外缘保护中心。',
 formula:`Δu = 2sin(HPBW/2) = ${f(m.diameter,5)}；s = kΔu = ${f(m.s,5)}；保护距离 gs = ${f(m.guard,5)}`,
 read:[['每星候选窄束',m.beams.length,'整片网格保留结果'],['C'+c.id+' 关联窄束',owner.length,'按 UV 最近中心归属'],['外缘保护中心',m.beams.filter(b=>b.guard).length,'只补整片服务区外缘']],handoff:'给第三步：卫星 → 宽小区 → 关联窄波束列表。各星复制相同局部布局，之后由调度确定哪些窄束正在发送。'};
}
function detail(S,m,c){
 const sub=S.subs[S.major];
 if(S.major===0&&sub===2){const p=example(m,S.neighbor),j=p.sat.id;
 return `<section class="qc-lesson-block"><span class="eyebrow">WORKED EXAMPLE · 随控件更新</span><h3>把 P${j} 的网格编号，一直算到 S${j} 的三维位置</h3><p>本例统一使用地心三维坐标 (X,Y,Z)，单位 km；参考点 P0=(6371,0,0)，局部平面 x 指东、y 指北。小写 x、y 与全局 X、Y、Z 不同。</p><div class="qc-table-wrap"><table class="qc-worked-table"><thead><tr><th>计算步骤</th><th>代入规则</th><th>当前结果</th></tr></thead><tbody>
 <tr><th>① 网格编号</th><td>d_hex=max(|q|,|r|,|q+r|)</td><td>(q,r)=(${p.sat.q},${p.sat.r})；d_hex=${Q.hexDistance([p.sat.q,p.sat.r])}</td></tr>
 <tr><th>② 换算平面公里</th><td>x=D(q+r/2)<br>y=√3Dr/2，D=200 km</td><td>x=${f(p.sat.x,1)} km<br>y=${f(p.sat.y,1)} km</td></tr>
 <tr><th>③ 长度与方向</th><td>L=√(x²+y²)<br>φ=atan2(y,x)，从东向起算</td><td>L=${f(p.plane,1)} km<br>φ=${f(p.phi,2)}°</td></tr>
 <tr><th>④ 地面星下点</th><td>${S.sphere?'α=L/R；g=(Rcosα, x·sinα/α, y·sinα/α)':'平面近似：g=(R,x,y)'}</td><td>${S.sphere?'α='+f(p.verticalAngle,2)+'°<br>':''}P${j}=${vec(p.sat.nadir)} km${S.sphere?'<br>纬度 '+f(p.latitude,3)+'°，经度 '+f(p.longitude,3)+'°':''}</td></tr>
 <tr><th>⑤ 抬高到卫星</th><td>${S.sphere?'s=(R+h)g/R':'s=g+(h,0,0)'}，h=600 km</td><td>S${j}=${vec(p.sat.position)} km<br>${S.sphere?'‖s‖−R':'s_X−R'}=600 km</td></tr>
 </tbody></table></div><p class="qc-lesson-conclusion">${S.sphere?'球面下的“升高600 km”沿该星下点的径向进行，因此全局X、Y、Z分量都可能改变，并非只给某一坐标加600。':'平面近似使用共同法线，本例沿全局X方向升高600 km。'}其他邻星沿用同一计算流程。</p></section>`;
 }
 if(S.major===0&&sub===4){const d=copyData(m,c,S.neighbor),j=d.sat.id;
 return `<section class="qc-lesson-block"><span class="eyebrow">COPY ONE TEMPLATE · 每颗星有自己的实例</span><h3>用同一个 C${c.id}，把“复制”分成三个动作</h3><ol class="qc-lesson-sequence"><li><b>准备参考模板。</b>S0 保存61个宽小区的编号、中心、六个边界顶点；选中的是 C${c.id}。后续2.2还会补充窄束 (u,v) 与归属列表。</li><li><b>把模板放到邻星。</b>${S.sphere?`求从 P0 径向转向 P${j} 径向的最小旋转 R${j}，并把每个地面中心、顶点与局部轴都乘这个旋转。不是仅改变星下点、其余顶点仍留在原地。`:`将所有中心与顶点加上邻星的平面位移；坐标轴保持平行。`}</li><li><b>在共同地球坐标中使用。</b>S0/C${c.id} 与 S${j}/C${c.id} 的本地编号相同，全球位置不同；针对同一个目标UE，分别计算两颗星到它的链路。把同一过程应用于其余五颗邻星。</li></ol><div class="qc-table-wrap"><table class="qc-worked-table"><caption>同一模板实例：坐标由实际${S.sphere?'旋转':'平移'}计算</caption><thead><tr><th>对象</th><th>参考星 S0</th><th>邻星 S${j}</th></tr></thead><tbody>
 <tr><th>本地小区编号</th><td>C${c.id}，(q,r)=(${c.q},${c.r})</td><td>C${c.id}，(q,r)=(${c.q},${c.r})</td></tr>
 <tr><th>卫星位置 / km</th><td>${vec(d.reference.position)}</td><td>${vec(d.sat.position)}</td></tr>
 <tr><th>小区中心 / km</th><td>${vec(d.center0)}</td><td>${vec(d.centerJ)}</td></tr>
 <tr><th>边界顶点 A / km</th><td>${vec(d.vertex0)}</td><td>${vec(d.vertexJ)}</td></tr>
 <tr><th>第二步生成窄束后</th><td>本星局部 (u,v)</td><td>同一编号保持相同局部 (u,v)，全球方向随局部坐标轴改变</td></tr>
 </tbody></table></div><p class="qc-lesson-conclusion">左右本地图一样，不表示它们位于地球上的同一处；各自回到共同三维坐标后，位置已经不同。</p></section>`;
 }
 if(S.major===1&&sub===0){const st=projectionMetrics(c);
 return `<section class="qc-lesson-block"><span class="eyebrow">2.1 · 逐顶点映射</span><h3>C${c.id}：六个地面点如何变成六个 UV 点</h3><p>参考卫星位于 (R+h,0,0)。对每个顶点计算 d=(g−rₛ)/‖g−rₛ‖，在本页坐标下 u=d_Y、v=d_Z。地面列为地心三维坐标，单位km；UV列为无量纲方向余弦。</p><div class="qc-table-wrap"><table class="qc-worked-table"><thead><tr><th>顶点</th><th>地面 (X,Y,Z) / km</th><th>u</th><th>v</th></tr></thead><tbody>${c.vertices.map((g,i)=>`<tr><th>${'ABCDEF'[i]}</th><td>${vec(g)}</td><td>${f(c.polygon[i][0],5)}</td><td>${f(c.polygon[i][1],5)}</td></tr>`).join('')}</tbody></table></div><p>UV 最短边=${f(st.min,5)}，最长边=${f(st.max,5)}，比值=${f(st.ratio,3)}。${st.ratio>1.001?'边长已经不等，因此这个轮廓不是正六边形。':'当前中心对称配置的边长相等；这只是特例，切换“边缘中部”观察形变。'}</p><p class="qc-lesson-conclusion">本步只输出宽小区的 UV 轮廓与中心。窄波束网格、k、g、归属与数量统一放到2.2。</p></section>`;
 }
 if(S.major===1&&sub===1){const owner=m.beams.filter(b=>b.cell===c.id),guard=m.beams.filter(b=>b.guard).length;
 return `<section class="qc-lesson-block"><span class="eyebrow">2.2 · 同一条生成链</span><h3>宽小区轮廓已知后，怎样得到“每小区多少束”</h3><ol class="qc-lesson-sequence"><li><b>用 k 排整片窄束网格。</b>HPBW=${f(m.hpbw,2)}°，Δu=${f(m.diameter,5)}；当前 k=${f(m.k,3)}，所以 s=kΔu=${f(m.s,5)}。k越小，排列越密。</li><li><b>用 g 补整片服务区外缘。</b>当前 g=${f(m.g,1)}，保护距离 gs=${f(m.guard,5)}。保留服务区内的中心，以及外侧距轮廓不超过gs的中心；当前外侧保护中心${guard}个。</li><li><b>逐束确定宽小区归属。</b>每个保留中心，关联到UV中心距离最近的宽小区。这个归属规则也用于服务区外保护中心，不是简单按“落进哪个六边形”决定全部归属。</li><li><b>完成归属后再计数。</b>每星共${m.beams.length}条候选窄束；所选C${c.id}关联${owner.length}条。各小区的UV面积、位置与最近中心区域不同，关联束数可以不同。</li></ol><p class="qc-lesson-conclusion">2.1确定宽小区在UV里长什么样；2.2用k、g生成窄束，再关联和计数。候选束全部生成后，第三步再决定哪些束正在同频发送。</p></section>`;
 }
 return '';
}
const api={projectionMetrics,example,copyData,geometryPage,beamPage,detail};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.QCLessons=api;
})(typeof globalThis!=='undefined'?globalThis:this);
