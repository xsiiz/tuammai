#!/usr/bin/env node
/**
 * fetch_7day_history.mjs
 * Fetches 7 days of real historical hydrology data for Thailand's large reservoirs
 * from ThaiWater (HII / สสน.), merges telemetry and history, and updates src/data/dams.ts.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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

function inferRegion(lat, lon, name = '') {
  if (name.includes('ภูมิพล') || name.includes('สิริกิติ์') || name.includes('กิ่วลม') || name.includes('แควน้อย') || name.includes('แม่มอก')) return 'north';
  if (name.includes('อุบลรัตน์') || name.includes('ลำปาว') || name.includes('จุฬาภรณ์') || name.includes('ห้วยหลวง') || name.includes('น้ำพอง') || name.includes('ลำพระเพลิง') || name.includes('มูลบน') || name.includes('ลำแชะ') || name.includes('ลำตะคอง')) return 'northeast';
  if (name.includes('ศรีนครินทร์') || name.includes('วชิราลงกรณ') || name.includes('แก่งกระจาน') || name.includes('ปราณบุรี')) return 'west';
  if (name.includes('ขุนด่าน') || name.includes('คลองสียัด') || name.includes('บางพระ') || name.includes('หนองปลาไหล') || name.includes('ประแสร์')) return 'east';
  if (name.includes('รัชชประภา') || name.includes('บางลาง')) return 'south';
  if (name.includes('ป่าสัก') || name.includes('ทับเสลา') || name.includes('กระเสียว')) return 'central';

  if (lat >= 16.8 && lon <= 101.5) return 'north';
  if (lat >= 14.1 && lon >= 101.0) return 'northeast';
  if (lat <= 11.5) return 'south';
  if (lat >= 11.5 && lat <= 16.0 && lon <= 100.0) return 'west';
  if (lat >= 12.0 && lat <= 14.5 && lon >= 101.0) return 'east';
  return 'central';
}

function evaluateStatus(storagePercent) {
  if (storagePercent > 95) {
    return { status: 'critical', color: '#EF4444', label_th: 'วิกฤต', label_en: 'Critical' };
  }
  if (storagePercent > 80) {
    return { status: 'warning', color: '#F59E0B', label_th: 'เฝ้าระวัง', label_en: 'Warning' };
  }
  return { status: 'normal', color: '#10B981', label_th: 'ปกติ', label_en: 'Normal' };
}

async function main() {
  const dates = [
    '2026-09-27',
    '2026-09-28',
    '2026-09-29',
    '2026-09-30',
    '2026-10-01',
    '2026-10-02',
    '2026-10-03'
  ];

  console.log(`📡 Fetching historical daily dam data for 7 days: ${dates[0]} to ${dates[dates.length - 1]}...`);

  const dailyMap = {};
  for (const date of dates) {
    let retries = 3;
    let success = false;
    while (retries > 0 && !success) {
      try {
        const url = `https://api-v3.thaiwater.net/api/v1/thaiwater30/analyst/dam?dam_size=1&dam_date=${date}`;
        console.log(`  Downloading ${date} (attempts left: ${retries})...`);
        const res = await fetch(url, {
          headers: { Accept: 'application/json', 'User-Agent': 'TuammaiBot/1.0' }
        });
        if (res.ok) {
          const json = await res.json();
          dailyMap[date] = json?.data?.dam_daily || [];
          success = true;
        } else {
          console.warn(`  Warning: failed to fetch ${date} (${res.status}), retrying...`);
          retries--;
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (err) {
        console.error(`  Error fetching ${date}:`, err.message);
        retries--;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    if (!success) {
      dailyMap[date] = [];
    }
  }

  // Get unique dams from latest day (2026-10-03)
  const latestList = dailyMap['2026-10-03'] || [];
  const damMap = new Map();

  for (const item of latestList) {
    const damMeta = item.dam || {};
    let nameTh = damMeta.dam_name?.th || '';
    if (!nameTh) continue;
    if (!nameTh.startsWith('เขื่อน')) {
      nameTh = `เขื่อน${nameTh}`;
    }

    if (nameTh === 'เขื่อนแม่งัด' && Number(item.dam_storage_percent || 0) === 0) continue;
    if (nameTh === 'เขื่อนปากมูล' && Number(item.dam_storage || 0) === 0) continue;

    const percent = Number(item.dam_storage_percent || 0);
    const existing = damMap.get(nameTh);

    if (!existing || (existing.storage_percent === 0 && percent > 0) || (existing.storage_percent > 0 && percent > 0 && Number(item.dam_storage || 0) > existing.storage_mcm)) {
      const nameEn = damMeta.dam_name?.en || 'Dam';
      const lat = Number(damMeta.dam_lat || 0);
      const lon = Number(damMeta.dam_long || 0);
      const statusEval = evaluateStatus(percent);
      const cap = officialCapacities[nameTh] || (percent > 0 ? Math.round(Number(item.dam_storage || 0) / (percent / 100)) : Number(item.dam_storage || 0));

      damMap.set(nameTh, {
        id: `dam-${damMeta.id || item.id}`,
        name_th: nameTh,
        name_en: nameEn.endsWith('Dam') ? nameEn : `${nameEn} Dam`,
        type: 'large',
        region: inferRegion(lat, lon, nameTh),
        coordinates: [lon, lat],
        date: item.dam_date || '2026-10-03',
        storage_mcm: Number(item.dam_storage || 0),
        storage_percent: percent,
        inflow_mcm: Number(item.dam_inflow || 0),
        outflow_mcm: Number(item.dam_released || 0),
        water_level_msl: Number(item.dam_level || 0),
        status: statusEval.status,
        status_color: statusEval.color,
        status_label_th: statusEval.label_th,
        status_label_en: statusEval.label_en,
        capacity_mcm: cap,
        history7Days: []
      });
    }
  }

  // Populate history7Days for each dam
  for (const [nameTh, damObj] of damMap.entries()) {
    const historyList = [];
    const baseName = nameTh.replace(/^เขื่อน/, '');

    for (const d of dates) {
      const records = dailyMap[d] || [];
      const match = records.find(r => {
        const rName = r.dam?.dam_name?.th || '';
        return rName.includes(baseName) || nameTh.includes(rName);
      });

      if (match) {
        let pct = Number(match.dam_storage_percent || 0);
        // Fallback percentage calculation if 0 but storage is present
        if (pct === 0 && damObj.capacity_mcm && Number(match.dam_storage || 0) > 0) {
          pct = Number(((Number(match.dam_storage) / damObj.capacity_mcm) * 100).toFixed(2));
        }
        historyList.push({
          date: d,
          storage_mcm: Number(match.dam_storage || 0),
          storage_percent: pct,
          inflow_mcm: Number(match.dam_inflow || 0),
          outflow_mcm: Number(match.dam_released || 0),
          water_level_msl: Number(match.dam_level || 0)
        });
      }
    }

    damObj.history7Days = historyList;
  }

  const cleanDams = Array.from(damMap.values());

  // Sort by capacity descending to establish national rank
  cleanDams.sort((a, b) => (b.capacity_mcm || 0) - (a.capacity_mcm || 0));
  cleanDams.forEach((d, idx) => {
    d.national_rank = idx + 1;
  });

  // Save to .agents/skills/fetch-dam-water-data/data/dams_latest.json
  const skillDataPath = path.resolve(rootDir, '.agents/skills/fetch-dam-water-data/data/dams_latest.json');
  fs.writeFileSync(skillDataPath, JSON.stringify({
    updated_at: new Date().toISOString(),
    date: '2026-10-03',
    count: cleanDams.length,
    dams: cleanDams
  }, null, 2), 'utf8');

  // Save to src/data/dams.ts
  const tsContent = `import { DamTelemetry } from '../types/dam';

export const DAMS_DATA: DamTelemetry[] = ${JSON.stringify(cleanDams, null, 2)};

export const TOP_10_DAMS = DAMS_DATA.filter((d) => d.national_rank && d.national_rank <= 10);
`;

  const tsPath = path.resolve(rootDir, 'src/data/dams.ts');
  fs.writeFileSync(tsPath, tsContent, 'utf8');

  console.log(`✅ Successfully updated ${cleanDams.length} dams with 7-day history.`);
  console.log(`📁 Saved to: ${tsPath}`);
}

main().catch(console.error);
