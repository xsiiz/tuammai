const fs = require('fs');
const path = require('path');

const provincesGeoJsonPath = path.join(__dirname, '../src/data/thailand-provinces.json');
const d = JSON.parse(fs.readFileSync(provincesGeoJsonPath, 'utf8'));

const borderFeatures = [];

for (const f of d.features) {
  const code = f.properties.pro_code;
  const name_th = f.properties.pro_th;
  const name_en = f.properties.pro_en;
  const region = (f.properties.reg_royin || 'Central').toLowerCase();

  for (let pIdx = 0; pIdx < f.geometry.coordinates.length; pIdx++) {
    const poly = f.geometry.coordinates[pIdx];
    for (let rIdx = 0; rIdx < poly.length; rIdx++) {
      const ring = poly[rIdx];
      if (!ring || ring.length < 3) continue;

      borderFeatures.push({
        type: 'Feature',
        id: `border-${code}-${pIdx}-${rIdx}`,
        properties: {
          pro_code: code,
          pro_th: name_th,
          pro_en: name_en,
          region: region,
          is_outer: rIdx === 0
        },
        geometry: {
          type: 'LineString',
          coordinates: ring
        }
      });
    }
  }
}

const outGeoJson = {
  type: 'FeatureCollection',
  name: 'thailand-province-borders',
  crs: {
    type: 'name',
    properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' }
  },
  features: borderFeatures
};

const outPath = path.join(__dirname, '../src/data/thailand-province-borders.json');
fs.writeFileSync(outPath, JSON.stringify(outGeoJson, null, 2), 'utf8');
console.log(`Generated ${borderFeatures.length} province border features into ${outPath}`);
