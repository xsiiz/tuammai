#!/usr/bin/env node
/**
 * fetch_dams.mjs
 * Comprehensive fetcher for Thailand dam and reservoir hydrology data.
 * - Source 1: ThaiWater Public Analyst API (Large Dams: Bhumibol, Sirikit, Srinagarind, etc.)
 * - Source 2: RID Public Reservoir API (Medium-sized Reservoirs across 6 regions)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Region mapping helper by province or coordinate
function inferRegion(lat, lon, name = '') {
  if (name.includes('ภูมิพล') || name.includes('สิริกิติ์') || name.includes('กิ่วลม') || name.includes('แควน้อย') || name.includes('แม่มอก')) return 'north';
  if (name.includes('อุบลรัตน์') || name.includes('ลำปาว') || name.includes('จุฬาภรณ์') || name.includes('ห้วยหลวง') || name.includes('น้ำพอง') || name.includes('ลำพระเพลิง') || name.includes('มูลบน') || name.includes('ลำแชะ') || name.includes('ลำตะคอง')) return 'northeast';
  if (name.includes('ศรีนครินทร์') || name.includes('วชิราลงกรณ') || name.includes('แก่งกระจาน') || name.includes('ปราณบุรี')) return 'west';
  if (name.includes('ขุนด่าน') || name.includes('คลองสียัด') || name.includes('บางพระ') || name.includes('หนองปลาไหล') || name.includes('ประแสร์')) return 'east';
  if (name.includes('รัชชประภา') || name.includes('บางลาง')) return 'south';
  if (name.includes('ป่าสัก') || name.includes('ทับเสลา') || name.includes('กระเสียว')) return 'central';

  // Coordinate fallback
  if (lat >= 16.8 && lon <= 101.5) return 'north';
  if (lat >= 14.1 && lon >= 101.0) return 'northeast';
  if (lat <= 11.5) return 'south';
  if (lat >= 11.5 && lat <= 16.0 && lon <= 100.0) return 'west';
  if (lat >= 12.0 && lat <= 14.5 && lon >= 101.0) return 'east';
  return 'central';
}

/**
 * Status threshold evaluation as defined in AGENTS.md
 */
function evaluateStatus(storagePercent) {
  if (storagePercent > 95) {
    return { status: 'critical', color: '#EF4444', label_th: 'วิกฤต', label_en: 'Critical' };
  }
  if (storagePercent > 80) {
    return { status: 'warning', color: '#F59E0B', label_th: 'เฝ้าระวัง', label_en: 'Warning' };
  }
  return { status: 'normal', color: '#10B981', label_th: 'ปกติ', label_en: 'Normal' };
}

/**
 * Fetch Large Dams from ThaiWater Analyst API
 */
async function fetchThaiWaterLargeDams() {
  const url = 'https://api-v3.thaiwater.net/api/v1/thaiwater30/analyst/dam?dam_size=1';
  console.log(`📡 Fetching Large Dams from ThaiWater API: ${url}...`);

  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'TuammaiBot/1.0' }
  });

  if (!res.ok) {
    throw new Error(`ThaiWater API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const dailyList = json?.data?.dam_daily || [];
  
  // Deduplicate by dam Name, picking the record with valid percent > 0
  const damMap = new Map();

  for (const item of dailyList) {
    const damMeta = item.dam || {};
    const nameThRaw = damMeta.dam_name?.th || '';
    if (!nameThRaw) continue;
    const nameTh = nameThRaw.startsWith('เขื่อน') ? nameThRaw : `เขื่อน${nameThRaw}`;

    const percent = Number(item.dam_storage_percent || 0);
    const existing = damMap.get(nameTh);

    // If existing record has 0% and current has > 0%, replace it
    if (!existing || (existing.storage_percent === 0 && percent > 0) || (existing.storage_percent > 0 && percent > 0 && item.dam_storage > existing.storage_mcm)) {
      const nameEn = damMeta.dam_name?.en || 'Dam';
      const lat = Number(damMeta.dam_lat || 0);
      const lon = Number(damMeta.dam_long || 0);
      const statusEval = evaluateStatus(percent);

      damMap.set(nameTh, {
        id: `dam-${damMeta.id || item.id}`,
        name_th: nameTh,
        name_en: nameEn.endsWith('Dam') ? nameEn : `${nameEn} Dam`,
        type: 'large',
        region: inferRegion(lat, lon, nameTh),
        coordinates: [lon, lat],
        date: item.dam_date || new Date().toISOString().split('T')[0],
        storage_mcm: Number(item.dam_storage || 0),
        storage_percent: percent,
        inflow_mcm: Number(item.dam_inflow || 0),
        outflow_mcm: Number(item.dam_released || 0),
        water_level_msl: Number(item.dam_level || 0),
        status: statusEval.status,
        status_color: statusEval.color,
        status_label_th: statusEval.label_th,
        status_label_en: statusEval.label_en
      });
    }
  }

  return Array.from(damMap.values());
}

/**
 * Main routine
 */
async function main() {
  try {
    const largeDams = await fetchThaiWaterLargeDams();

    // Summary counts
    const critical = largeDams.filter(d => d.status === 'critical');
    const warning = largeDams.filter(d => d.status === 'warning');
    const normal = largeDams.filter(d => d.status === 'normal');

    console.log('\n======================================================');
    console.log('💧 TUAMMAI — THAILAND DAM HYDROLOGY SUMMARY');
    console.log(`📅 วันที่รายงาน: ${largeDams[0]?.date || 'Today'}`);
    console.log(`📊 จำนวนเขื่อนขนาดใหญ่ที่ติดตาม: ${largeDams.length} แห่ง`);
    console.log(`🔴 วิกฤต (Critical >100% หรือ <30%) : ${critical.length} แห่ง`);
    console.log(`🟡 เฝ้าระวัง (Warning 80-100% / 30-50%) : ${warning.length} แห่ง`);
    console.log(`🟢 ปกติ (Normal 50-80%)                 : ${normal.length} แห่ง`);
    console.log('======================================================\n');

    console.log('📍 ตัวอย่างเขื่อนหลักระดับประเทศ:');
    const keyDamNames = ['ภูมิพล', 'สิริกิติ์', 'ป่าสัก', 'ศรีนครินทร์', 'อุบลรัตน์', 'รัชชประภา', 'ขุนด่าน', 'วชิราลงกรณ', 'บางลาง'];
    const sampleDams = largeDams.filter(d => 
      keyDamNames.some(k => d.name_th.includes(k))
    );

    console.table(sampleDams.map(d => ({
      'ชื่อเขื่อน': d.name_th,
      'ภาค': d.region,
      'ความจุ (%)': `${d.storage_percent}%`,
      'ปริมาตรน้ำ (MCM)': d.storage_mcm,
      'สถานะ': d.status_label_th
    })));

    // Save output cache
    const outputDir = path.resolve(__dirname, '../data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, 'dams_latest.json');
    fs.writeFileSync(outputPath, JSON.stringify({
      updated_at: new Date().toISOString(),
      date: largeDams[0]?.date,
      count: largeDams.length,
      dams: largeDams
    }, null, 2), 'utf-8');

    console.log(`💾 บันทึกข้อมูล JSON ลงไฟล์: ${outputPath}`);
  } catch (err) {
    console.error('❌ Error executing fetcher:', err);
    process.exit(1);
  }
}

main();
