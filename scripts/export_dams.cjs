const fs = require('fs');
const path = require('path');

const jsonPath = path.resolve('.agents/skills/fetch-dam-water-data/data/dams_latest.json');
const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Official / standard retention capacity (Million Cubic Meters - MCM) of major Thai reservoirs
const officialCapacities = {
  'เขื่อนศรีนครินทร์': 17745,
  'เขื่อนภูมิพล': 13462,
  'เขื่อนสิริกิติ์': 9510,
  'เขื่อนวชิราลงกรณ': 8860,
  'เขื่อนรัชชประภา': 5639,
  'เขื่อนอุบลรัตน์': 2431,
  'เขื่อนลำปาว': 1980,
  'เขื่อนสิรินธร': 1966,
  'เขื่อนบางลาง': 1454,
  'เขื่อนป่าสักชลสิทธิ์': 960,
  'เขื่อนแควน้อยบำรุงแดน': 939,
  'เขื่อนแก่งกระจาน': 710,
  'เขื่อนน้ำอูน': 520,
  'เขื่อนคลองสียัด': 420,
  'เขื่อนปราณบุรี': 391,
  'เขื่อนลำตะคอง': 314,
  'เขื่อนกระเสียว': 299,
  'เขื่อนประแสร์': 295,
  'เขื่อนนฤบดินทรจินดา': 295,
  'เขื่อนลำแชะ': 275,
  'เขื่อนแม่งัดสมบูรณ์ชล': 265,
  'เขื่อนแม่กวงอุดมธารา': 263,
  'เขื่อนขุนด่านปราการชล': 224,
  'เขื่อนกิ่วคอหมา': 170,
  'เขื่อนน้ำพุง': 165,
  'เขื่อนหนองปลาไหล': 164,
  'เขื่อนจุฬาภรณ์': 164,
  'เขื่อนทับเสลา': 160,
  'เขื่อนลำพระเพลิง': 155,
  'เขื่อนมูลบน': 141,
  'เขื่อนห้วยหลวง': 135,
  'เขื่อนลำนางรอง': 121,
  'เขื่อนบางพระ': 117,
  'เขื่อนแม่มอก': 110,
  'เขื่อนกิ่วลม': 106,
  'เขื่อนท่าทุ่งนา': 55,
  'เขื่อนห้วยกุ่ม': 20
};

// Filter out empty / zero-storage duplicate records
const cleanDams = [];
for (const d of raw.dams) {
  if (d.name_th === 'เขื่อนแม่งัด' && d.storage_percent === 0) continue;
  if (d.name_th === 'เขื่อนปากมูล' && d.storage_mcm === 0) continue;
  cleanDams.push(d);
}

// Assign capacity and rank
cleanDams.forEach(d => {
  const cap = officialCapacities[d.name_th] || (d.storage_percent > 0 ? Math.round(d.storage_mcm / (d.storage_percent / 100)) : d.storage_mcm);
  d.capacity_mcm = cap;
});

// Sort by capacity to determine national rank
cleanDams.sort((a, b) => (b.capacity_mcm || 0) - (a.capacity_mcm || 0));
cleanDams.forEach((d, idx) => {
  d.national_rank = idx + 1;
});

const tsContent = `import { DamTelemetry } from '../types/dam';

export const DAMS_DATA: DamTelemetry[] = ${JSON.stringify(cleanDams, null, 2)};

export const TOP_10_DAMS = DAMS_DATA.filter((d) => d.national_rank && d.national_rank <= 10);
`;

fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/dams.ts', tsContent, 'utf8');
console.log('Successfully written src/data/dams.ts with', cleanDams.length, 'dams. Top 10 dams:');
cleanDams.slice(0, 10).forEach(d => console.log(`  #${d.national_rank} ${d.name_th} (${d.region}) - Cap: ${d.capacity_mcm} MCM`));
