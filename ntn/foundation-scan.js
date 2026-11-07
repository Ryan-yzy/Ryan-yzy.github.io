(function (root) {
  'use strict';
  const R = 6371, DEG = Math.PI / 180;
  const clamp = x => Math.max(-1, Math.min(1, x));
  function calculate(heightKm, elevationDeg) {
    if (!Number.isFinite(heightKm) || heightKm <= 0 || heightKm > 40000 ||
        !Number.isFinite(elevationDeg) || elevationDeg < 0 || elevationDeg > 90) {
      throw new RangeError('请输入 0–40000 km 之间的正高度，以及 0–90° 的最低仰角。');
    }
    const elevation = elevationDeg * DEG;
    const alpha = elevationDeg === 90 ? 0 : Math.asin(clamp(R / (R + heightKm) * Math.cos(elevation)));
    const psi = Math.max(0, Math.PI / 2 - elevation - alpha);
    const edge = [R * Math.sin(psi), R * Math.cos(psi)];
    return { R, heightKm, elevationDeg, alpha, alphaDeg: alpha / DEG,
      psi, psiDeg: psi / DEG, arcKm: R * psi, edge,
      distanceKm: Math.hypot(edge[0], R + heightKm - edge[1]) };
  }
  const api = { R, calculate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FoundationScan = api;
  if (typeof document === 'undefined' || !document.getElementById('scan-height')) return;

  const $ = id => document.getElementById(id);
  const C = { blue: '#286f92', green: '#2c7b78', gold: '#ad7b32', red: '#bf5a46',
    text: '#203143', muted: '#687782', line: '#afc3c7' };
  const f = (n, digits = 2) => n.toFixed(digits);
  const escape = value => String(value).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const path = (points, color, width = 1.6, dash = '') =>
    `<path d="M${points.map(p => p.join(',')).join('L')}" fill="none" stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  const dot = (p, color, radius = 4) => `<circle cx="${p[0]}" cy="${p[1]}" r="${radius}" fill="${color}"/>`;
  const text = (x, y, value, color = C.text, size = 15, anchor = 'start') =>
    `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}">${escape(value)}</text>`;
  function angleArc(center, a, b, radius, color) {
    const start = Math.atan2(a[1] - center[1], a[0] - center[0]);
    let delta = Math.atan2(b[1] - center[1], b[0] - center[0]) - start;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    return path(Array.from({ length: 33 }, (_, i) => {
      const t = start + delta * i / 32;
      return [center[0] + radius * Math.cos(t), center[1] + radius * Math.sin(t)];
    }), color, 2.2);
  }
  function paint(id, title, parts) {
    $(id).innerHTML = `<title id="${id}-title">${escape(title)}</title>` + parts.join('');
  }

  function drawGlobal(d) {
    const scale = 300 / (R + d.heightKm), o = [185, 370];
    const p = (x, y) => [o[0] + x * scale, o[1] - y * scale];
    const s = p(0, R + d.heightKm), n = p(0, R), e = p(...d.edge);
    const ground = Array.from({ length: 65 }, (_, i) => {
      const a = d.psi * i / 64;
      return p(R * Math.sin(a), R * Math.cos(a));
    });
    const middle = ground[32];
    const parts = [
      `<circle cx="${o[0]}" cy="${o[1]}" r="${R * scale}" fill="#eef4f1" stroke="#c5d8d2" stroke-width="1.5"/>`,
      path([o, s], C.line), path([o, e], C.gold), path([s, e], C.blue, 2.8),
      path(ground, C.gold, 4), angleArc(o, n, e, 77, C.gold),
      dot(o, C.text), dot(n, C.green), dot(s, C.blue, 5), dot(e, C.red, 4.5),
      text(o[0] - 15, o[1] + 24, 'O · 地心', C.text, 15, 'end'),
      text(s[0], s[1] - 24, 'S · 卫星', C.blue, 16, 'middle'),
      path([n, [111, n[1] + 28]], C.green),
      text(101, n[1] + 33, 'P · 星下点', C.green, 14, 'end'),
      path([e, [365, Math.max(134, e[1] + 25)]], C.red),
      text(377, Math.max(139, e[1] + 30), 'E · 边缘位置', C.red, 15),
      text(142, 248, 'Rₑ', C.muted, 15),
      text(325, 256, `OS = Rₑ+h = ${f(R + d.heightKm, 0)} km`, C.muted, 15),
      text(325, 286, `OE = OP = ${R} km`, C.muted, 15),
      path([[o[0] + 77 * Math.sin(d.psi / 2), o[1] - 77 * Math.cos(d.psi / 2)], [309, 324]], C.gold),
      text(323, 330, `ψ = ${f(d.psiDeg, 3)}°`, C.gold, 17),
      path([middle, [359, 192]], C.gold),
      text(373, 197, `弧长 L = ${f(d.arcKm)} km`, C.gold, 15),
      text(320, 411, '同一比例的球面地球剖面', C.muted, 14, 'middle')
    ];
    paint('scan-global', `地心角 ${f(d.psiDeg, 3)} 度，地表半径 ${f(d.arcKm)} 千米`, parts);
  }

  function drawLocal(d) {
    // Subtract P before fitting the local view; all points still use the same geometry.
    const s0 = [0, d.heightKm], n0 = [0, 0], e0 = [d.edge[0], d.edge[1] - R];
    const span = d.distanceKm, t = [-Math.cos(d.psi), Math.sin(d.psi)];
    const tangentA = [e0[0] + t[0] * span * .5, e0[1] + t[1] * span * .5];
    const tangentB = [e0[0] - t[0] * span * .27, e0[1] - t[1] * span * .27];
    const zenith = [e0[0] + Math.sin(d.psi) * span * .24, e0[1] + Math.cos(d.psi) * span * .24];
    const points = [s0, n0, e0, tangentA, tangentB, zenith];
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const scale = Math.min(370 / (maxX - minX || 1), 225 / (maxY - minY || 1));
    const centerX = (minX + maxX) / 2, centerY = (minY + maxY) / 2;
    const p = a => [310 + (a[0] - centerX) * scale, 218 - (a[1] - centerY) * scale];
    const s = p(s0), n = p(n0), e = p(e0), ta = p(tangentA), tb = p(tangentB);
    const ground = Array.from({ length: 65 }, (_, i) => {
      const a = d.psi * i / 64;
      return p([R * Math.sin(a), R * Math.cos(a) - R]);
    });
    const parts = [
      path(ground, C.green, 2.8), path([s, n], C.green, 1.6, '6 5'),
      path([ta, tb], C.gold, 1.8, '5 4'), path([e, p(zenith)], C.line, 1.4, '4 4'),
      path([s, e], C.blue, 3), angleArc(s, n, e, 41, C.blue),
      angleArc(e, ta, s, 36, C.gold),
      dot(s, C.blue, 5), dot(n, C.green), dot(e, C.red, 5),
      text(s[0] - 14, s[1] - 20, 'S · 卫星', C.blue, 16),
      text(n[0] - 13, n[1] + 26, 'P', C.green, 16, 'end'),
      text(e[0] + 13, e[1] + 33, 'E · 边缘位置', C.red, 15),
      text(s[0] + 60, s[1] + 36, `α = ${f(d.alphaDeg)}°`, C.blue, 20),
      text(e[0] - 80, e[1] - 30, `ε = ${f(d.elevationDeg)}°`, C.gold, 20, 'end'),
      text(tb[0] + 9, tb[1] - 14, '当地水平', C.gold, 14),
      text(p(zenith)[0] + 9, p(zenith)[1] - 10, '当地天顶', C.muted, 13),
      text(35, 28, '蓝色 α：从卫星的星下轴量', C.blue, 16),
      text(35, 54, '金色 ε：从 UE 的当地水平量', C.gold, 16),
      text(320, 404, d.elevationDeg === 90 ? '正下方特例：E=P，α=ψ=0°' : '星下方向 S→P 为扫描基准', C.muted, 14, 'middle')
    ];
    paint('scan-local', `卫星扫描角 ${f(d.alphaDeg)} 度，地面仰角 ${f(d.elevationDeg)} 度`, parts);
  }

  function render() {
    try {
      if (!$('scan-height').value.trim() || !$('scan-elevation').value.trim()) {
        throw new RangeError('请输入卫星高度和 UE 最低仰角。');
      }
      const d = calculate(Number($('scan-height').value), Number($('scan-elevation').value));
      $('scan-error').textContent = '';
      $('scan-metrics').innerHTML = [
        ['最大扫描角 αₘₐₓ', `${f(d.alphaDeg)}°`, '在卫星处，相对星下方向'],
        ['最大地心角 ψₘₐₓ', `${f(d.psiDeg, 3)}°`, '在地心处，对应边缘射线'],
        ['门限覆盖半径 Lₘₐₓ', `${f(d.arcKm)} km`, '星下点至边缘的地表弧长']
      ].map(([a, b, c]) => `<div><small>${a}</small><strong>${b}</strong><span>${c}</span></div>`).join('');
      $('scan-working').innerHTML = `αₘₐₓ = asin[ ${R}/(${R}+${d.heightKm}) × cos${f(d.elevationDeg, 4)}° ] = <strong>${f(d.alphaDeg, 4)}°</strong><br>` +
        `ψₘₐₓ = 90° − ${f(d.elevationDeg, 4)}° − ${f(d.alphaDeg, 4)}° = ${f(d.psiDeg, 4)}°<br>` +
        `Lₘₐₓ = ${R} × ${f(d.psiDeg, 4)} × π/180 = ${f(d.arcKm)} km`;
      drawGlobal(d); drawLocal(d);
    } catch (e) {
      $('scan-error').textContent = e.message;
      $('scan-metrics').replaceChildren(); $('scan-working').replaceChildren();
      $('scan-global').replaceChildren(); $('scan-local').replaceChildren();
    }
  }
  ['scan-height', 'scan-elevation'].forEach(id => $(id).addEventListener('input', render));
  document.querySelectorAll('[data-scan-height]').forEach(button => button.addEventListener('click', () => {
    $('scan-height').value = button.dataset.scanHeight;
    $('scan-elevation').value = button.dataset.scanElevation;
    render();
  }));
  render();
})(typeof globalThis !== 'undefined' ? globalThis : this);
