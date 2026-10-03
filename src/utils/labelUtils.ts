import { DamTelemetry } from '../types/dam';

export type LabelDirection = 'NW' | 'NE' | 'SE' | 'SW' | 'N' | 'S' | 'E' | 'W';

export interface DamLabelConfig {
  dir: LabelDirection;
  offset3D: [number, number, number];
  tailClass: string;
  offset2D: {
    dx: number;
    dy: number;
    align: 'start' | 'end' | 'middle';
  };
}

/**
 * Remove repetitive prefixes/suffixes for clean, compact map labels
 * e.g., "เขื่อนศรีนครินทร์" -> "ศรีนครินทร์", "Srinakarin Dam" -> "Srinakarin"
 */
export function getShortDamName(nameTh: string, nameEn: string, lang: 'th' | 'en'): string {
  if (lang === 'th') {
    return nameTh.replace(/^เขื่อน/, '');
  }
  return nameEn.replace(/\s+Dam$/i, '');
}

/**
 * Curated Anti-Collision Direction Map for all major & clustered dams in Thailand.
 * Pairs of geographically adjacent dams are explicitly pointed in opposite directions.
 */
export const DAM_DIRECTION_MAP: Record<string, LabelDirection> = {
  // Western Cluster (Kanchanaburi / Phetchaburi / Prachuap)
  'dam-15': 'NW', // วชิราลงกรณ -> Top-Left
  'dam-14': 'SE', // ศรีนครินทร์ -> Bottom-Right
  'dam-55': 'SW', // ท่าทุ่งนา -> Bottom-Left
  'dam-13': 'SW', // แก่งกระจาน -> Bottom-Left
  'dam-16': 'SE', // ปราณบุรี -> Bottom-Right

  // Northern Cluster
  'dam-1': 'NW',  // ภูมิพล -> Top-Left
  'dam-12': 'NE', // สิริกิติ์ -> Top-Right
  'dam-36': 'SE', // แควน้อยบำรุงแดน -> Bottom-Right
  'dam-230': 'SW',// แม่มอก -> Bottom-Left
  'dam-23': 'NW', // แม่งัดสมบูรณ์ชล -> Top-Left
  'dam-38': 'SE', // แม่กวงอุดมธารา -> Bottom-Right
  'dam-35': 'NE', // กิ่วคอหมา -> Top-Right
  'dam-34': 'SW', // กิ่วลม -> Bottom-Left

  // Central Cluster
  'dam-11': 'N',  // ป่าสักชลสิทธิ์ -> Top
  'dam-17': 'W',  // กระเสียว -> Left
  'dam-18': 'NW', // ทับเสลา -> Top-Left

  // Eastern Cluster
  'dam-32': 'SE', // ขุนด่านปราการชล -> Bottom-Right
  'dam-19': 'NW', // บางพระ -> Top-Left
  'dam-30': 'NE', // คลองสียัด -> Top-Right
  'dam-24': 'SW', // หนองปลาไหล -> Bottom-Left
  'dam-33': 'SE', // ประแสร์ -> Bottom-Right
  'dam-37': 'NE', // นฤบดินทรจินดา -> Top-Right

  // Northeastern (Isan) Cluster
  'dam-2': 'NW',  // อุบลรัตน์ -> Top-Left
  'dam-39': 'SE', // ลำปาว -> Bottom-Right
  'dam-4': 'NW',  // จุฬาภรณ์ -> Top-Left
  'dam-47': 'SE', // ห้วยกุ่ม -> Bottom-Right
  'dam-40': 'NW', // ลำตะคอง -> Top-Left
  'dam-41': 'SW', // ลำพระเพลิง -> Bottom-Left
  'dam-7': 'NE',  // มูลบน -> Top-Right
  'dam-9': 'SE',  // ลำแชะ -> Bottom-Right
  'dam-6': 'NE',  // ลำนางรอง -> Top-Right
  'dam-5': 'N',   // ห้วยหลวง -> Top
  'dam-42': 'NW', // น้ำอูน -> Top-Left
  'dam-8': 'SE',  // น้ำพุง -> Bottom-Right
  'dam-3': 'NE',  // สิรินธร -> Top-Right

  // Southern Cluster
  'dam-25': 'NW', // รัชชประภา -> Top-Left
  'dam-26': 'NE'  // บางลาง -> Top-Right
};

/**
 * Get positioning and visual offsets for a specific dam
 */
export function getDamLabelConfig(damId: string): DamLabelConfig {
  const dir = DAM_DIRECTION_MAP[damId] || 'NE';

  switch (dir) {
    case 'NW':
      return {
        dir: 'NW',
        offset3D: [-0.22, 0.13, 0.22],
        tailClass: 'right-3 -bottom-1 border-r border-b rotate-45',
        offset2D: { dx: -12, dy: -12, align: 'end' }
      };
    case 'NE':
      return {
        dir: 'NE',
        offset3D: [0.22, 0.13, 0.22],
        tailClass: 'left-3 -bottom-1 border-l border-b -rotate-45',
        offset2D: { dx: 12, dy: -12, align: 'start' }
      };
    case 'SE':
      return {
        dir: 'SE',
        offset3D: [0.22, -0.13, 0.22],
        tailClass: 'left-3 -top-1 border-l border-t rotate-45',
        offset2D: { dx: 12, dy: 14, align: 'start' }
      };
    case 'SW':
      return {
        dir: 'SW',
        offset3D: [-0.22, -0.13, 0.22],
        tailClass: 'right-3 -top-1 border-r border-t -rotate-45',
        offset2D: { dx: -12, dy: 14, align: 'end' }
      };
    case 'N':
      return {
        dir: 'N',
        offset3D: [0.0, 0.19, 0.22],
        tailClass: 'left-1/2 -translate-x-1/2 -bottom-1 border-r border-b rotate-45',
        offset2D: { dx: 0, dy: -20, align: 'middle' }
      };
    case 'S':
      return {
        dir: 'S',
        offset3D: [0.0, -0.19, 0.22],
        tailClass: 'left-1/2 -translate-x-1/2 -top-1 border-l border-t rotate-45',
        offset2D: { dx: 0, dy: 22, align: 'middle' }
      };
    case 'W':
      return {
        dir: 'W',
        offset3D: [-0.25, 0.0, 0.22],
        tailClass: '-right-1 top-1/2 -translate-y-1/2 border-r border-t rotate-45',
        offset2D: { dx: -14, dy: 0, align: 'end' }
      };
    case 'E':
    default:
      return {
        dir: 'E',
        offset3D: [0.25, 0.0, 0.22],
        tailClass: '-left-1 top-1/2 -translate-y-1/2 border-l border-b rotate-45',
        offset2D: { dx: 14, dy: 0, align: 'start' }
      };
  }
}
