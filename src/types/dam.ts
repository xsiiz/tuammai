export type RegionId = 'all' | 'north' | 'northeast' | 'central' | 'east' | 'west' | 'south';

export type AlertStatus = 'critical' | 'warning' | 'normal';

export interface DamHistoryRecord {
  date: string;
  storage_mcm: number;
  storage_percent: number;
  inflow_mcm: number;
  outflow_mcm: number;
  water_level_msl?: number;
}

export interface DamTelemetry {
  id: string;
  name_th: string;
  name_en: string;
  type: string;
  region: 'north' | 'northeast' | 'central' | 'east' | 'west' | 'south';
  province?: string;
  authority?: 'EGAT' | 'RID' | 'DWR';
  coordinates: [number, number]; // [Longitude, Latitude]
  date: string;
  storage_mcm: number;
  storage_percent: number;
  inflow_mcm: number;
  outflow_mcm: number;
  capacity_mcm?: number;
  water_level_msl?: number;
  status: AlertStatus;
  status_color: string;
  status_label_th: string;
  status_label_en: string;
  national_rank?: number;
  history7Days?: DamHistoryRecord[];
}

export interface RegionMeta {
  id: RegionId;
  name_th: string;
  name_en: string;
  short_name_th?: string;
  short_name_en?: string;
  center: [number, number]; // [lng, lat]
  cameraTarget: [number, number, number]; // [x, y, z] in 3D scene
  zoom: number;
  description_th: string;
  description_en: string;
}

export interface ProvinceMeta {
  code: string;
  name_th: string;
  name_en: string;
  region: RegionId;
  center: [number, number]; // [lng, lat]
  centroid: [number, number]; // [lng, lat]
  bounds: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  isMajorCity?: boolean;
}

export interface DrillDownState {
  currentLevel: 'national' | 'regional' | 'province' | 'dam';
  selectedRegion: RegionId;
  selectedProvince: string | null;
  selectedDam: DamTelemetry | null;
}
