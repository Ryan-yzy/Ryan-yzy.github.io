(function (root) {
  'use strict';
  const R = 6371;
  const DEG = Math.PI / 180;

  function elevationAtArc(radiusKm, heightKm) {
    const psi = radiusKm / R;
    return Math.atan2((R + heightKm) * Math.cos(psi) - R,
      (R + heightKm) * Math.sin(psi)) / DEG;
  }

  function hexVertices(x, y, distanceKm) {
    const radius = distanceKm / Math.sqrt(3);
    return Array.from({ length: 6 }, (_, i) => {
      const a = (30 + 60 * i) * DEG;
      return [x + radius * Math.cos(a), y + radius * Math.sin(a)];
    });
  }

  function calculate({ heightKm = 600, rings = 4, distanceKm = 200 } = {}) {
    if (!Number.isFinite(heightKm) || heightKm <= 0 ||
        !Number.isFinite(distanceKm) || distanceKm <= 0 ||
        !Number.isInteger(rings) || rings < 0 || rings > 20) {
      throw new RangeError('Use positive finite height/distance and integer rings in [0,20].');
    }
    const cells = [];
    for (let q = -rings; q <= rings; q++) {
      for (let r = -rings; r <= rings; r++) {
        if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) > rings) continue;
        const x = distanceKm * (q + r / 2), y = distanceKm * Math.sqrt(3) * r / 2;
        cells.push({ q, r, x, y, vertices: hexVertices(x, y, distanceKm) });
      }
    }
    const centerRadiusKm = rings * distanceKm;
    const vertex = [centerRadiusKm + distanceKm / 2, distanceKm / (2 * Math.sqrt(3))];
    const maxArcKm = Math.hypot(...vertex), psi = maxArcKm / R;
    if (psi >= Math.PI) throw new RangeError('The local radial mapping requires an arc below pi*R.');
    const verticalKm = (R + heightKm) * Math.cos(psi) - R;
    const horizontalKm = (R + heightKm) * Math.sin(psi);
    const minElevationDeg = Math.atan2(verticalKm, horizontalKm) / DEG;
    const neighborArcKm = distanceKm * Math.sqrt(3 * rings * (rings + 1) + 1);
    return {
      R, heightKm, rings, distanceKm, cells, vertex, centerRadiusKm, maxArcKm,
      cellRadiusKm: distanceKm / Math.sqrt(3), psi, psiDeg: psi / DEG,
      // Coordinates in the O-N-U section: X along O-N, Y perpendicular to O-N.
      userSection: [R * Math.cos(psi), R * Math.sin(psi)],
      verticalKm, horizontalKm, minElevationDeg,
      rangeKm: Math.hypot(verticalKm, horizontalKm),
      centerElevationDeg: elevationAtArc(centerRadiusKm, heightKm),
      flatElevationDeg: Math.atan2(heightKm, maxArcKm) / DEG,
      neighborArcKm, neighborElevationDeg: elevationAtArc(neighborArcKm, heightKm),
      curve: Array.from({ length: 101 }, (_, i) => {
        const arcKm = maxArcKm * i / 100;
        return { arcKm, elevationDeg: elevationAtArc(arcKm, heightKm) };
      })
    };
  }

  const api = { R, DEG, elevationAtArc, hexVertices, calculate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.QCElevation = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
