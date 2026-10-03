import { DamTelemetry } from '../types/dam';

export type LabelDirection = 'top' | 'bottom' | 'left' | 'right' | 'NW' | 'NE' | 'SE' | 'SW' | 'N' | 'S' | 'E' | 'W';

export interface DamLabelConfig {
  dir: LabelDirection;
  tailClass: string;
  wrapperClass: string;
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
  'dam-15': 'left',   // วชิราลงกรณ -> Left
  'dam-14': 'right',  // ศรีนครินทร์ -> Right
  'dam-55': 'bottom', // ท่าทุ่งนา -> Bottom
  'dam-13': 'left',   // แก่งกระจาน -> Left
  'dam-16': 'right',  // ปราณบุรี -> Right

  // Northern Cluster
  'dam-1': 'top',     // ภูมิพล -> Top
  'dam-12': 'top',    // สิริกิติ์ -> Top
  'dam-36': 'right',  // แควน้อยบำรุงแดน -> Right
  'dam-230': 'left',  // แม่มอก -> Left
  'dam-23': 'left',   // แม่งัดสมบูรณ์ชล -> Left
  'dam-38': 'right',  // แม่กวงอุดมธารา -> Right
  'dam-35': 'top',    // กิ่วคอหมา -> Top
  'dam-34': 'bottom', // กิ่วลม -> Bottom

  // Central Cluster
  'dam-11': 'right',  // ป่าสักชลสิทธิ์ -> Right
  'dam-17': 'left',   // กระเสียว -> Left
  'dam-18': 'top',    // ทับเสลา -> Top

  // Eastern Cluster
  'dam-32': 'bottom', // ขุนด่านปราการชล -> Bottom
  'dam-19': 'left',   // บางพระ -> Left
  'dam-30': 'right',  // คลองสียัด -> Right
  'dam-24': 'left',   // หนองปลาไหล -> Left
  'dam-33': 'right',  // ประแสร์ -> Right
  'dam-37': 'top',    // นฤบดินทรจินดา -> Top

  // Northeastern (Isan) Cluster
  'dam-2': 'top',     // อุบลรัตน์ -> Top
  'dam-39': 'right',  // ลำปาว -> Right
  'dam-4': 'left',    // จุฬาภรณ์ -> Left
  'dam-47': 'bottom', // ห้วยกุ่ม -> Bottom
  'dam-40': 'left',   // ลำตะคอง -> Left
  'dam-41': 'bottom', // ลำพระเพลิง -> Bottom
  'dam-7': 'top',     // มูลบน -> Top
  'dam-9': 'bottom',  // ลำแชะ -> Bottom
  'dam-6': 'right',   // ลำนางรอง -> Right
  'dam-5': 'top',     // ห้วยหลวง -> Top
  'dam-42': 'left',   // น้ำอูน -> Left
  'dam-8': 'bottom',  // น้ำพุง -> Bottom
  'dam-3': 'left',    // สิรินธร -> Left (keeps within Thailand!)

  // Southern Cluster
  'dam-25': 'right',  // รัชชประภา -> Right (into Surat Thani/Gulf)
  'dam-26': 'right'   // บางลาง -> Right
};

/**
 * Get positioning and visual offsets for a specific dam
 */
export function getDamLabelConfig(damId: string): DamLabelConfig {
  const dir = DAM_DIRECTION_MAP[damId] || 'top';

  switch (dir) {
    case 'left':
    case 'W':
    case 'NW':
    case 'SW':
      return {
        dir: 'left',
        wrapperClass: 'right-[9px] top-1/2 -translate-y-1/2',
        tailClass: '-right-1 top-1/2 -translate-y-1/2 border-r border-t rotate-45',
        offset2D: { dx: -12, dy: 0, align: 'end' }
      };
    case 'right':
    case 'E':
    case 'NE':
    case 'SE':
      return {
        dir: 'right',
        wrapperClass: 'left-[9px] top-1/2 -translate-y-1/2',
        tailClass: '-left-1 top-1/2 -translate-y-1/2 border-l border-b rotate-45',
        offset2D: { dx: 12, dy: 0, align: 'start' }
      };
    case 'bottom':
    case 'S':
      return {
        dir: 'bottom',
        wrapperClass: 'top-[7px] left-1/2 -translate-x-1/2',
        tailClass: '-top-1 left-1/2 -translate-x-1/2 border-l border-t rotate-45',
        offset2D: { dx: 0, dy: 14, align: 'middle' }
      };
    case 'top':
    case 'N':
    default:
      return {
        dir: 'top',
        wrapperClass: 'bottom-[7px] left-1/2 -translate-x-1/2',
        tailClass: '-bottom-1 left-1/2 -translate-x-1/2 border-r border-b rotate-45',
        offset2D: { dx: 0, dy: -14, align: 'middle' }
      };
  }
}
