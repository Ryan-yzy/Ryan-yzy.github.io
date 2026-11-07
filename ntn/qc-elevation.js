(function () {
  'use strict';
  const M = window.QCElevation;
  const $ = id => document.getElementById(id);
  if (!M || !$('elevationLayout')) return;
  const C = { mint: '#2c7b78', blue: '#2e80b8', gold: '#b8882e', red: '#b83b2e',
    text: '#406577', muted: '#55829a', line: '#54809c', fill: '#dfe4e6' };
  const f = (x, digits = 2) => x.toFixed(digits);
  const esc = value => String(value).replace(/[&<>"']/g, x => ({ '&': '&amp;', '<': '&lt;',
    '>': '&gt;', '"': '&quot;', "'": '&#39;' })[x]);
  const line = (a, b, color = C.line, width = 1.4, dash = '') =>
    `<path d="M${a.join(',')}L${b.join(',')}" fill="none" stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  const path = (points, color, width = 1.4, fill = 'none', close = false, dash = '') =>
    `<path d="M${points.map(p => p.join(',')).join('L')}${close ? 'Z' : ''}" fill="${fill}" stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  const dot = (p, color, radius = 4) => `<circle cx="${p[0]}" cy="${p[1]}" r="${radius}" fill="${color}"/>`;
  const text = (x, y, value, color = C.text, size = 12, anchor = 'start') =>
    `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}">${esc(value)}</text>`;
  function paint(id, parts) {
    const svg = $(id), title = svg.querySelector('title');
    svg.innerHTML = `<title id="${title.id}">${esc(title.textContent)}</title>` + parts.join('');
  }

  function drawLayout(d) {
    const scale = 147 / d.maxArcKm, center = [250, 178];
    const p = (x, y) => [center[0] + x * scale, center[1] - y * scale];
    const parts = [];
    for (const cell of d.cells) {
      const chosen = cell.q === d.rings && cell.r === 0;
      parts.push(path(cell.vertices.map(v => p(...v)), chosen ? C.gold : C.line,
        chosen ? 2.1 : .8, chosen ? '#655d3e' : C.fill, true));
      parts.push(dot(p(cell.x, cell.y), chosen ? C.gold : C.muted, chosen ? 4 : 1.8));
      for (const vertex of cell.vertices) {
        if (Math.abs(Math.hypot(...vertex) - d.maxArcKm) < 1e-7) parts.push(dot(p(...vertex), C.red, 2.7));
      }
    }
    const cp = p(d.centerRadiusKm, 0);
    parts.push(line(center, cp, C.gold, 2), dot(center, C.mint, 4.5));
    parts.push(text(center[0] - 11, center[1] + 22, 'N · 星下点', C.mint, 11, 'end'));
    parts.push(text(cp[0] + 7, cp[1] - 9, 'C', C.gold, 13));
    parts.push(text((center[0] + cp[0]) / 2, center[1] - 10, `nD = ${f(d.centerRadiusKm, 0)} km`, C.gold, 11, 'middle'));
    parts.push(text(270, 345, `${d.cells.length} 个宽小区 · 第 ${d.rings} 圈中心最远`, C.muted, 12, 'middle'));
    paint('elevationLayout', parts);
  }

  function drawVertex(d) {
    const scale = 395 / d.vertex[0], n = [55, 269];
    const p = (x, y) => [n[0] + x * scale, n[1] - y * scale];
    const cp = p(d.centerRadiusKm, 0), up = p(...d.vertex), foot = [up[0], n[1]];
    const parts = [line(n, foot, C.muted, 1.4), line(foot, up, C.blue, 2), line(n, up, C.red, 2.5),
      line(cp, up, C.gold, 2), dot(n, C.mint), dot(cp, C.gold), dot(up, C.red, 4.5),
      text(n[0], n[1] + 22, 'N', C.mint, 12, 'middle'),
      text(cp[0] - 7, cp[1] - 10, 'C', C.gold, 12, 'end'),
      text(up[0] + 9, up[1] - 9, 'U', C.red, 13),
      text((n[0] + up[0]) / 2, (n[1] + up[1]) / 2 - 14, `r_max = ${f(d.maxArcKm)} km`, C.red, 12, 'middle'),
      text((n[0] + foot[0]) / 2, 320, `横向：nD + D/2 = ${f(d.vertex[0])} km`, C.muted, 11, 'middle'),
      text(270, 344, '在展开坐标中，对 NU 使用勾股定理', C.muted, 11, 'middle')];
    // A separate fixed-size inset makes the vertex offsets legible for every ring count.
    const inset = [367, 87], side = 58;
    const hex = Array.from({ length: 6 }, (_, i) => {
      const a = (30 + 60 * i) * M.DEG;
      return [inset[0] + side * Math.cos(a), inset[1] - side * Math.sin(a)];
    });
    const v = hex[0], elbow = [v[0], inset[1]];
    parts.push(text(367, 17, '单个小区放大', C.muted, 11, 'middle'), path(hex, C.blue, 1.5, '#dfe4e7', true),
      line(inset, elbow, C.gold, 2), line(elbow, v, C.blue, 2), dot(inset, C.gold, 3), dot(v, C.red, 3.5),
      text(inset[0] - 10, inset[1] + 4, 'C', C.gold, 11, 'end'), text(v[0] + 8, v[1] - 4, 'U', C.red, 11),
      text(390, 111, 'Δx = D/2', C.gold, 10, 'middle'), text(438, 82, 'Δy', C.blue, 11),
      text(365, 165, 'Δy = D/(2√3)', C.blue, 11, 'middle'));
    paint('elevationVertex', parts);
  }

  function drawSphere(d) {
    const origin = [164, 318], scale = 231 / M.R;
    const p = (x, y) => [origin[0] + y * scale, origin[1] - x * scale];
    const op = origin, np = p(M.R, 0), sp = p(M.R + d.heightKm, 0), up = p(...d.userSection);
    const surface = Array.from({ length: 101 }, (_, i) => {
      const a = -.32 + i * 1.34 / 100;
      return p(M.R * Math.cos(a), M.R * Math.sin(a));
    });
    const groundArc = Array.from({ length: 41 }, (_, i) => {
      const a = d.psi * i / 40;
      return p(M.R * Math.cos(a), M.R * Math.sin(a));
    });
    const angleArc = Array.from({ length: 31 }, (_, i) => {
      const a = d.psi * i / 30;
      return [op[0] + 82 * Math.sin(a), op[1] - 82 * Math.cos(a)];
    });
    const parts = [path([op, ...surface], C.line, .8, '#dfe4e7', true), path(surface, C.blue, 1.8),
      line(op, np, C.muted, 1.5), line(op, [264, op[1]], C.muted, 1, '4 4'),
      text(273, op[1] + 4, 'Y', C.muted, 11), text(145, 48, 'X', C.muted, 11),
      line(op, up, C.gold, 1.8), line(np, sp, C.mint, 3),
      line(sp, up, C.red, 1.7), path(groundArc, C.gold, 4), path(angleArc, C.gold, 2.1),
      dot(op, C.text, 3.5), dot(np, C.mint, 3.5), dot(sp, C.blue, 4), dot(up, C.red, 4),
      text(op[0] - 10, op[1] + 21, 'O · 地心', C.text, 12, 'end'),
      line(sp, [217, sp[1] - 7], C.blue), text(223, sp[1] - 5, 'S · 卫星', C.blue, 12),
      line(np, [111, 103], C.mint), text(102, 108, 'N · 星下点', C.mint, 11, 'end'),
      line(up, [278, 121], C.red), text(285, 126, 'U · 最远 UE', C.red, 12),
      text(318, 170, 'ON = OU = R', C.muted, 12), text(318, 197, 'OS = R + h', C.muted, 12),
      text(306, 225, '黄色地表弧 NU = r_max', C.gold, 11),
      line(angleArc[15], [278, 274], C.gold), text(285, 279, `ψ = ${f(d.psiDeg, 4)}°`, C.gold, 13),
      text(290, 317, 'ψ 在地心 O 处量', C.muted, 11), text(290, 339, 'ε 在 UE 处量（转到图④）', C.muted, 11),
      text(142, 209, 'R', C.muted, 12, 'end')];
    paint('elevationSphere', parts);
  }

  function drawLocal(d) {
    const user = [73, 277], scale = Math.min(350 / d.horizontalKm, 207 / Math.abs(d.verticalKm));
    const satellite = [user[0] + d.horizontalKm * scale, user[1] - d.verticalKm * scale];
    const foot = [satellite[0], user[1]];
    const arc = Array.from({ length: 41 }, (_, i) => {
      const a = d.minElevationDeg * M.DEG * i / 40;
      return [user[0] + 48 * Math.cos(a), user[1] - 48 * Math.sin(a)];
    });
    const mid = d.minElevationDeg * M.DEG / 2;
    const parts = [line([36, user[1]], [488, user[1]], C.muted, 1.3, '5 4'),
      line(user, [user[0], 37], C.blue, 1.5), line(user, foot, C.gold, 2.5),
      line(foot, satellite, C.blue, 2.2), line(user, satellite, C.red, 2.5),
      path(arc, C.red, 2), path([[foot[0] - 9, foot[1]], [foot[0] - 9, foot[1] - 9], [foot[0], foot[1] - 9]], C.muted, 1),
      dot(user, C.mint, 4.5), dot(satellite, C.red, 4.5), dot(foot, C.muted, 2.5),
      text(user[0], 306, 'U', C.mint, 12, 'middle'), text(81, 30, '本地天顶', C.blue, 12),
      text(485, 264, '本地水平', C.muted, 11, 'end'),
      text(satellite[0] + 12, satellite[1] - 11, 'S · 卫星', C.red, 12),
      text(satellite[0] + 14, (satellite[1] + foot[1]) / 2, `a = ${f(d.verticalKm)} km`, C.blue, 11),
      text((user[0] + foot[0]) / 2, 330, `b = ${f(d.horizontalKm)} km`, C.gold, 12, 'middle'),
      text(user[0] + 83 * Math.cos(mid), user[1] - 83 * Math.sin(mid) - 3,
        `ε = ${f(d.minElevationDeg)}°`, C.red, 13)];
    paint('elevationLocal', parts);
  }

  function render() {
    const d = M.calculate({ heightKm: Number($('elevationHeight').value),
      rings: Number($('elevationRings').value), distanceKm: Number($('elevationDistance').value) });
    $('elevationDistanceValue').textContent = `${d.distanceKm} km`;
    $('elevationStep1').innerHTML = `<p>输入：n = ${d.rings}，D = ${d.distanceKm} km。</p>
      <span class="equation">N<sub>cell</sub> = 1 + 3n(n+1) = <strong>${d.cells.length}</strong></span>
      <span class="equation">C = (nD, 0) = <strong>(${f(d.centerRadiusKm, 0)}, 0) km</strong></span>
      <small>这里统计宽小区；最外侧中心在六个角方向上距 N 最远。</small>`;
    $('elevationStep2').innerHTML = `<p>输入：C 与正六边形外接圆半径 D/√3 = ${f(d.cellRadiusKm)} km。</p>
      <span class="equation">Δx = D/2 = ${f(d.distanceKm / 2)} km<br>Δy = D/(2√3) = ${f(d.vertex[1])} km</span>
      <span class="equation">U = (nD + D/2, D/(2√3))<br>U = <strong>(${f(d.vertex[0])}, ${f(d.vertex[1])}) km</strong></span>
      <span class="equation">r<sub>max</sub> = √[(nD+D/2)² + (D/(2√3))²]<br>= D√(n²+n+1/3) = <strong>${f(d.maxArcKm, 5)} km</strong></span>
      <small>六边形内的最大径向距离在顶点取得；遍历所有宽小区顶点可核对同一结果。</small>`;
    $('elevationStep3').innerHTML = `<p>输入：r<sub>max</sub> = ${f(d.maxArcKm)} km，R = ${M.R} km。</p>
      <span class="equation">ψ = r<sub>max</sub>/R = <strong>${f(d.psi, 7)} rad = ${f(d.psiDeg, 5)}°</strong></span>
      <span class="equation">U<sub>section</sub> = (R cosψ, R sinψ)<br>= <strong>(${f(d.userSection[0])}, ${f(d.userSection[1])}) km</strong></span>
      <span class="equation">S<sub>section</sub> = (R+h, 0) = (${f(M.R + d.heightKm, 0)}, 0) km</span>
      <small>图①②使用展开坐标；本步改用地心剖面坐标。径向弧长 r 在球面映射后保持不变。</small>`;
    $('elevationStep4').innerHTML = `<p>输入：ψ = ${f(d.psiDeg, 5)}°，R+h = ${f(M.R + d.heightKm, 0)} km。</p>
      <span class="equation">本地竖直分量 a = (R+h) cosψ − R<br>= <strong>${f(d.verticalKm, 5)} km</strong></span>
      <span class="equation">本地水平分量 b = (R+h) sinψ<br>= <strong>${f(d.horizontalKm, 5)} km</strong></span>
      <span class="equation">ε<sub>min</sub> = atan2(a, b)<br>= atan2(${f(d.verticalKm)}, ${f(d.horizontalKm)})<br>= <strong>${f(d.minElevationDeg, 5)}°</strong></span>
      <small>投影关系：本地天顶 û = (cosψ, sinψ)，水平轴 t̂ = (sinψ, −cosψ)；a = (S−U)·û，b = (S−U)·t̂。斜距 d = √(a²+b²) = ${f(d.rangeKm)} km。</small>`;
    $('elevationResult').innerHTML = [
      ['图① · 宽小区数', String(d.cells.length), `n = ${d.rings} 圈，D = ${d.distanceKm} km`],
      ['图② · 最远 UE 弧长', `${f(d.maxArcKm)} km`, '完整小区区域的最远顶点'],
      ['图③ · 最大地心角', `${f(d.psiDeg, 4)}°`, 'ψ = r_max/R'],
      ['图④ · 最低服务仰角', `${f(d.minElevationDeg, 4)}°`, 'ε_min 是既定几何的输出']
    ].map(([a,b,c]) => `<div><small>${a}</small><strong>${b}</strong><span>${c}</span></div>`).join('');
    $('elevationComparison').innerHTML = `<tr><td>只检查小区中心 · 球面</td><td>${f(d.centerRadiusKm)} km</td><td>${f(d.centerElevationDeg)}°</td></tr>
      <tr class="elevation-exact"><td>完整小区边界 · 球面</td><td>${f(d.maxArcKm)} km</td><td><strong>${f(d.minElevationDeg)}°</strong></td></tr>
      <tr><td>同一边界距离 · 平面近似</td><td>${f(d.maxArcKm)} km</td><td>${f(d.flatElevationDeg)}°</td></tr>`;
    $('elevationNeighbor').innerHTML = `按当前 n、D 构造，参考星到邻星的星下点弧长为 D√[3n(n+1)+1] = <strong>${f(d.neighborArcKm)} km</strong>。
      参考星星下点的 UE 看本星时为 90°，看六邻星时约为 <strong>${f(d.neighborElevationDeg)}°</strong>；邻星链路单独计算可见性、同频发射与干扰功率。`;
    drawLayout(d); drawVertex(d); drawSphere(d); drawLocal(d);
  }
  for (const id of ['elevationHeight', 'elevationRings', 'elevationDistance']) $(id).addEventListener('input', render);
  $('elevationReset').addEventListener('click', () => {
    $('elevationHeight').value = '600'; $('elevationRings').value = '4'; $('elevationDistance').value = '200'; render();
  });
  render();
})();

