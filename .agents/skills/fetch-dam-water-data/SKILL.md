---
name: fetch-dam-water-data
description: >-
  Use this skill to fetch, normalize, and evaluate real-time or historical water and dam hydrology data
  from official Thai public water sources (RID, ThaiWater/HII, EGAT). Formats reservoir capacity,
  inflow, outflow, and applies alert threshold color coding.
---

# Fetch Dam Water Data Skill (ท่วมมั้ย — Tuammai)

This skill provides step-by-step procedures to fetch, normalize, and validate dam telemetry and reservoir capacity data from public Thai government and utility endpoints.

## 1. When to Use This Skill
- Fetching current daily reservoir capacity, volume (MCM), percent storage, inflow, and outflow.
- Populating the national map overview or regional drill-down views with real-time dam statuses.
- Evaluating dam status thresholds (🔴 Critical, 🟡 Warning, 🟢 Normal) according to `AGENTS.md`.
- Updating the Dam Detail drawer or modal with 7-day historical trends.

---

## 2. Public Data Sources & Priority

1. **RID Reservoir API (Primary Live Public JSON):**
   - **URL:** `https://app.rid.go.th/reservoir/api/reservoir/public`
   - **Historical URL:** `https://app.rid.go.th/reservoir/api/reservoir/public/{YYYY-MM-DD}`
   - **Coverage:** 450+ large and medium reservoirs across Thailand (Bhumibol, Sirikit, Pasak Jolasid, Ubol Ratana, etc.).
   - **Auth:** Public, no API key required.

2. **ThaiWater Standard API (Hydro-Informatics Institute - สสน. / HII):**
   - **Portal:** `https://standard.thaiwater.net`
   - **Resource Code:** `A003` (`/LargesizedWaterResources`), `A004` (`/MediumsizedWaterResources`), `B002` (Station metadata).

3. **EGAT Water Portal (กฟผ.):**
   - **URL:** `https://water.egat.co.th/`
   - **Coverage:** Primary hydroelectric dams. Used for fallback validation.

Detailed endpoints, parameters, and payloads are documented in:
👉 [Public Water Sources Reference](./references/public_water_sources.md)

---

## 3. Data Normalization Schema

All fetched dam records must be mapped to the standardized project interface:

```typescript
export interface DamTelemetry {
  id: string;                 // Unique identifier, e.g. "dam-bhumibol"
  name_th: string;            // Thai dam name, e.g. "เขื่อนภูมิพล"
  name_en: string;            // English dam name, e.g. "Bhumibol Dam"
  region: 'north' | 'northeast' | 'central' | 'east' | 'west' | 'south';
  province: string;           // Province name, e.g. "ตาก"
  authority: 'EGAT' | 'RID' | 'DWR';
  coordinates: [number, number]; // [Longitude, Latitude]
  date: string;               // ISO date string, e.g. "2026-10-03"
  capacity_mcm: number;       // Maximum storage capacity (Million Cubic Meters)
  volume_mcm: number;         // Current water volume (MCM)
  storage_percent: number;    // Capacity percentage (e.g. 78.5)
  inflow_mcm: number;         // 24h inflow (MCM)
  outflow_mcm: number;        // 24h outflow (MCM)
  status: 'critical' | 'warning' | 'normal';
  status_color: '#EF4444' | '#F59E0B' | '#10B981'; // Red / Yellow / Green
}
```

---

## 4. Status Threshold Evaluation Logic

As mandated in `AGENTS.md` (Agent-DamData):

```javascript
function evaluateDamStatus(storagePercent) {
  // 🔴 Critical: Over 95%
  if (storagePercent > 95) {
    return { status: 'critical', color: '#EF4444', label_th: 'วิกฤต', label_en: 'Critical' };
  }
  // 🟡 Warning: Over 80% (80% - 95%)
  if (storagePercent > 80) {
    return { status: 'warning', color: '#F59E0B', label_th: 'เฝ้าระวัง', label_en: 'Warning' };
  }
  // 🟢 Normal: Under 80%
  return { status: 'normal', color: '#10B981', label_th: 'ปกติ', label_en: 'Normal' };
}
```

---

## 5. Automated Execution via Helper Script

A ready-to-run Node.js script is included to test live API calls, filter key national dams, and output clean JSON:

```bash
# Run from repository root
node .agents/skills/fetch-dam-water-data/scripts/fetch_dams.mjs
```

### Script output:
- Standardized dam telemetry JSON.
- Summary of total dams monitored.
- Status breakdown (Critical / Warning / Normal count).
