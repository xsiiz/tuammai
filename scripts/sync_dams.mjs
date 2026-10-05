#!/usr/bin/env node
/**
 * sync_dams.mjs
 * Automated daily hydrology sync script for Tuammai.
 * Fetches real telemetry & 7-day historical trends from ThaiWater API (สสน. / HII)
 * and updates src/data/dams.ts directly.
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

function inferRegion(lat, lon, name = '', prov = '') {
  if (name.includes('ภูมิพล') || name.includes('สิริกิติ์') || name.includes('กิ่วลม') || name.includes('แควน้อย') || name.includes('แม่มอก')) return 'north';
  if (name.includes('อุบลรัตน์') || name.includes('ลำปาว') || name.includes('จุฬาภรณ์') || name.includes('ห้วยหลวง') || name.includes('น้ำพอง') || name.includes('ลำพระเพลิง') || name.includes('มูลบน') || name.includes('ลำแชะ') || name.includes('ลำตะคอง') || name.includes('น้ำอูน') || name.includes('สิรินธร')) return 'northeast';
  if (name.includes('ศรีนครินทร์') || name.includes('วชิราลงกรณ') || name.includes('แก่งกระจาน') || name.includes('ปราณบุรี') || name.includes('ท่าทุ่งนา')) return 'west';
  if (name.includes('ขุนด่าน') || name.includes('คลองสียัด') || name.includes('บางพระ') || name.includes('หนองปลาไหล') || name.includes('ประแสร์') || name.includes('นฤบดินทร')) return 'east';
  if (name.includes('รัชชประภา') || name.includes('บางลาง')) return 'south';
  if (name.includes('ป่าสัก') || name.includes('ทับเสลา') || name.includes('กระเสียว')) return 'central';

  if (prov.includes('ตาก') || prov.includes('อุตรดิตถ์') || prov.includes('เชียงใหม่') || prov.includes('ลำปาง') || prov.includes('พิษณุโลก') || prov.includes('สุโขทัย')) return 'north';
  if (prov.includes('กาญจนบุรี') || prov.includes('เพชรบุรี') || prov.includes('ประจวบ')) return 'west';
  if (prov.includes('ชลบุรี') || prov.includes('ระยอง') || prov.includes('นครนายก') || prov.includes('ปราจีนบุรี') || prov.includes('ฉะเชิงเทรา')) return 'east';
  if (prov.includes('สุราษฎร์ธานี') || prov.includes('ยะลา')) return 'south';
  if (prov.includes('ลพบุรี') || prov.includes('อุทัยธานี') || prov.includes('สุพรรณบุรี')) return 'central';

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

function getRecent7Dates() {
  const bkkOffset = 7 * 60 * 60 * 1000;
  const now = new Date(Date.now() + bkkOffset);
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() + bkkOffset - (i * 86400000));
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

async function fetchDayData(date) {
  const url = `https://api-v3.thaiwater.net/api/v1/thaiwater30/analyst/dam?dam_size=1&dam_date=${date}`;
  let retries = 3;
  while (retries > 0) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'TuammaiBot/1.0' }
      });
      if (res.ok) {
        const json = await res.json();
        return json?.data?.dam_daily || [];
      }
      retries--;
      await new Promise(r => setTimeout(r, 1000));
    } catch {
      retries--;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return [];
}

async function sync() {
  const dates = getRecent7Dates();
  console.log(`📡 [Tuammai Daily Sync] Starting 7-day fetch: ${dates[0]} -> ${dates[dates.length - 1]}...`);

  const dailyMap = {};
  for (const date of dates) {
    process.stdout.write(`  ⏳ Fetching ${date}... `);
    const data = await fetchDayData(date);
    dailyMap[date] = data;
    console.log(`✓ (${data.length} records)`);
  }

  // Find the latest available date with data
  let latestDate = dates[dates.length - 1];
  for (let i = dates.length - 1; i >= 0; i--) {
    if (dailyMap[dates[i]] && dailyMap[dates[i]].length > 0) {
      latestDate = dates[i];
      break;
    }
  }

  console.log(`📌 Using latest reporting date: ${latestDate}`);
  const latestList = dailyMap[latestDate] || [];
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
      const cap = officialCapacities[nameTh] || Number(damMeta.max_storage || 0) || (percent > 0 ? Math.round(Number(item.dam_storage || 0) / (percent / 100)) : Number(item.dam_storage || 0));
      const provName = item.geocode?.province_name?.th || undefined;
      const agencyShort = item.agency?.agency_shortname?.en?.toUpperCase();
      const authority = agencyShort === 'RID' ? 'RID' : (agencyShort === 'EGAT' ? 'EGAT' : 'DWR');

      damMap.set(nameTh, {
        id: `dam-${damMeta.id || item.id}`,
        name_th: nameTh,
        name_en: nameEn.endsWith('Dam') ? nameEn : `${nameEn} Dam`,
        type: 'large',
        region: inferRegion(lat, lon, nameTh, provName || ''),
        province: provName,
        authority: authority,
        coordinates: [lon, lat],
        date: item.dam_date || latestDate,
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

  // Populate history7Days
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
  cleanDams.sort((a, b) => (b.capacity_mcm || 0) - (a.capacity_mcm || 0));
  cleanDams.forEach((d, idx) => {
    d.national_rank = idx + 1;
  });

  // Save to src/data/dams.ts
  const tsContent = `import { DamTelemetry } from '../types/dam';

export const DAMS_DATA: DamTelemetry[] = ${JSON.stringify(cleanDams, null, 2)};

export const TOP_10_DAMS = DAMS_DATA.filter((d) => d.national_rank && d.national_rank <= 10);
`;

  const tsPath = path.resolve(rootDir, 'src/data/dams.ts');
  fs.writeFileSync(tsPath, tsContent, 'utf8');

  // Save to cache json
  const skillDataDir = path.resolve(rootDir, '.agents/skills/fetch-dam-water-data/data');
  if (!fs.existsSync(skillDataDir)) {
    fs.mkdirSync(skillDataDir, { recursive: true });
  }
  const skillDataPath = path.join(skillDataDir, 'dams_latest.json');
  fs.writeFileSync(skillDataPath, JSON.stringify({
    updated_at: new Date().toISOString(),
    date: latestDate,
    count: cleanDams.length,
    dams: cleanDams
  }, null, 2), 'utf8');

  const critical = cleanDams.filter(d => d.status === 'critical');
  const warning = cleanDams.filter(d => d.status === 'warning');
  const normal = cleanDams.filter(d => d.status === 'normal');

  console.log('\n======================================================');
  console.log(`✅ [Sync Complete] วันที่: ${latestDate}`);
  console.log(`📊 จำนวนเขื่อน: ${cleanDams.length} แห่ง`);
  console.log(`🔴 วิกฤต: ${critical.length} | 🟡 เฝ้าระวัง: ${warning.length} | 🟢 ปกติ: ${normal.length}`);
  console.log(`📁 อัปเดตไฟล์: ${tsPath}`);
  console.log('======================================================\n');
}

sync().catch(err => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
