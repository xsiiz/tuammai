const fs = require('fs');
const path = require('path');

const geojsonPath = path.join(__dirname, '../src/data/thailand-provinces.json');
const d = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

// Regional anchor cities for national level overview LOD
const majorCityCodes = new Set(['10', '50', '40', '30', '20', '83', '90', '65', '71', '84']);

const provinces = d.features.map(f => {
  const code = f.properties.pro_code;
  const name_th = f.properties.pro_th;
  const name_en = f.properties.pro_en;
  const regRaw = (f.properties.reg_royin || 'Central').toLowerCase();
  
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  let sumArea = 0;
  let cx = 0, cy = 0;
  let totalPts = 0;
  let totalLng = 0, totalLat = 0;

  for (const poly of f.geometry.coordinates) {
    const ring = poly[0];
    if (!ring) continue;
    let ringArea = 0;
    let ringCx = 0, ringCy = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const p1 = ring[i];
      const p2 = ring[i + 1];
      const factor = p1[0] * p2[1] - p2[0] * p1[1];
      ringArea += factor;
      ringCx += (p1[0] + p2[0]) * factor;
      ringCy += (p1[1] + p2[1]) * factor;
      
      if (p1[0] < minLng) minLng = p1[0];
      if (p1[0] > maxLng) maxLng = p1[0];
      if (p1[1] < minLat) minLat = p1[1];
      if (p1[1] > maxLat) maxLat = p1[1];
      totalLng += p1[0];
      totalLat += p1[1];
      totalPts++;
    }
    ringArea = ringArea / 2;
    if (Math.abs(ringArea) > 0.0001) {
      ringCx = ringCx / (6 * ringArea);
      ringCy = ringCy / (6 * ringArea);
      sumArea += Math.abs(ringArea);
      cx += ringCx * Math.abs(ringArea);
      cy += ringCy * Math.abs(ringArea);
    }
  }

  const finalCentroidLng = sumArea > 0 ? cx / sumArea : totalLng / totalPts;
  const finalCentroidLat = sumArea > 0 ? cy / sumArea : totalLat / totalPts;

  return {
    code,
    name_th,
    name_en,
    region: regRaw,
    center: [Number(((minLng + maxLng) / 2).toFixed(4)), Number(((minLat + maxLat) / 2).toFixed(4))],
    centroid: [Number(finalCentroidLng.toFixed(4)), Number(finalCentroidLat.toFixed(4))],
    bounds: [Number(minLng.toFixed(4)), Number(minLat.toFixed(4)), Number(maxLng.toFixed(4)), Number(maxLat.toFixed(4))],
    isMajorCity: majorCityCodes.has(code)
  };
});

provinces.sort((a, b) => a.name_th.localeCompare(b.name_th, 'th'));

const outPath = path.join(__dirname, '../src/data/provinces.ts');
const fileContent = `import { ProvinceMeta, RegionId } from '../types/dam';

export const PROVINCES_DATA: ProvinceMeta[] = ${JSON.stringify(provinces, null, 2)};

export const PROVINCES_BY_CODE: Record<string, ProvinceMeta> = Object.fromEntries(
  PROVINCES_DATA.map((p) => [p.code, p])
);

export const getProvincesByRegion = (region: RegionId): ProvinceMeta[] => {
  if (region === 'all') return PROVINCES_DATA;
  return PROVINCES_DATA.filter((p) => p.region === region);
};
`;

fs.writeFileSync(outPath, fileContent, 'utf8');
console.log('Successfully generated provinces.ts with', provinces.length, 'provinces.');
