/**
 * Representative Riverbank Gauging Stations (สถานีตรวจวัดน้ำท่าริมตลิ่งตัวแทน)
 * Calibrated with official Royal Irrigation Department (RID / กรมชลประทาน)
 * and Hydro-Informatics Institute (HII / ThaiWater สสน.) telemetry standards.
 * 
 * Each river monitors 2-3 key stations (upstream, midstream, downstream)
 * evaluating water level relative to bank capacity (% เทียบระดับตลิ่ง).
 */

export interface RiverbankStation {
  code: string;           // RID station code (e.g. C.2, P.1, M.7)
  name_th: string;        // Station name in Thai
  name_en: string;        // Station name in English
  province_th: string;    // Province
  location_type: 'upstream' | 'midstream' | 'downstream';
  bank_percent: number;   // Water level relative to bankfull capacity (%)
  diff_wl_text_th: string;// "ต่ำกว่าตลิ่ง" or "ล้นตลิ่ง"
}

export interface RiverTelemetryData {
  river_id: string;
  name_th: string;
  name_en: string;
  avg_bank_percent: number; // Average riverbank water level %
  status: 'critical' | 'warning' | 'normal';
  status_color: string;
  status_label_th: string;
  status_label_en: string;
  stations: RiverbankStation[];
}

function evaluateRiverStatus(percent: number): {
  status: 'critical' | 'warning' | 'normal';
  status_color: string;
  status_label_th: string;
  status_label_en: string;
} {
  // 🔴 Critical: > 100% (ล้นตลิ่ง) or < 30% (แล้งวิกฤต)
  if (percent > 100) {
    return { status: 'critical', status_color: '#EF4444', status_label_th: 'ล้นตลิ่ง/วิกฤต', status_label_en: 'Critical / Overflow' };
  }
  if (percent < 30) {
    return { status: 'critical', status_color: '#EF4444', status_label_th: 'น้ำแล้งวิกฤต', status_label_en: 'Critical Drought' };
  }
  // 🟡 Warning: 80% - 100% (เฝ้าระวังน้ำสูง) or 30% - 50% (น้ำน้อย)
  if (percent >= 80) {
    return { status: 'warning', status_color: '#F59E0B', status_label_th: 'เฝ้าระวังน้ำสูง', status_label_en: 'High Water Watch' };
  }
  if (percent < 50) {
    return { status: 'warning', status_color: '#F59E0B', status_label_th: 'ระดับน้ำน้อย', status_label_en: 'Low Water' };
  }
  // 🟢 Normal: 50% - 80%
  return { status: 'normal', status_color: '#10B981', status_label_th: 'ปกติ', status_label_en: 'Normal' };
}

export const RIVER_TELEMETRY: Record<string, RiverTelemetryData> = {
  'river-ping': {
    river_id: 'river-ping',
    name_th: 'แม่น้ำปิง',
    name_en: 'Ping River',
    avg_bank_percent: 63.4,
    ...evaluateRiverStatus(63.4),
    stations: [
      { code: 'P.1', name_th: 'สะพานนวรัฐ อ.เมือง', name_en: 'Nawarat Bridge', province_th: 'เชียงใหม่', location_type: 'upstream', bank_percent: 48.9, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'P.73', name_th: 'บ้านสบสอย อ.สามเงา', name_en: 'Sop Soi', province_th: 'ตาก', location_type: 'midstream', bank_percent: 71.6, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'P.17', name_th: 'บ้านท่างิ้ว อ.บรรพตพิสัย', name_en: 'Tha Ngiu', province_th: 'นครสวรรค์', location_type: 'downstream', bank_percent: 69.6, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' }
    ]
  },
  'river-wang': {
    river_id: 'river-wang',
    name_th: 'แม่น้ำวัง',
    name_en: 'Wang River',
    avg_bank_percent: 43.4,
    ...evaluateRiverStatus(43.4),
    stations: [
      { code: 'W.1C', name_th: 'สะพานเสตุวารี อ.เมือง', name_en: 'Setuwari Bridge', province_th: 'ลำปาง', location_type: 'upstream', bank_percent: 42.1, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'W.4A', name_th: 'บ้านวังหมัน อ.เกาะคา', name_en: 'Wang Man', province_th: 'ลำปาง', location_type: 'midstream', bank_percent: 54.2, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'W.3A', name_th: 'บ้านดอนชัย อ.สามเงา', name_en: 'Don Chai', province_th: 'ตาก', location_type: 'downstream', bank_percent: 33.9, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' }
    ]
  },
  'river-yom': {
    river_id: 'river-yom',
    name_th: 'แม่น้ำยม',
    name_en: 'Yom River',
    avg_bank_percent: 57.6,
    ...evaluateRiverStatus(57.6),
    stations: [
      { code: 'Y.1C', name_th: 'บ้านน้ำโค้ง อ.เมือง', name_en: 'Nam Khong', province_th: 'แพร่', location_type: 'upstream', bank_percent: 24.6, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'Y.14A', name_th: 'อ.ศรีสัชนาลัย', name_en: 'Si Satchanalai', province_th: 'สุโขทัย', location_type: 'midstream', bank_percent: 45.0, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'Y.16', name_th: 'บ้านบางระกำ อ.บางระกำ', name_en: 'Bang Rakam', province_th: 'พิษณุโลก', location_type: 'downstream', bank_percent: 103.3, diff_wl_text_th: 'ล้นตลิ่ง' }
    ]
  },
  'river-nan': {
    river_id: 'river-nan',
    name_th: 'แม่น้ำน่าน',
    name_en: 'Nan River',
    avg_bank_percent: 56.9,
    ...evaluateRiverStatus(56.9),
    stations: [
      { code: 'N.1', name_th: 'สะพานพัฒนาภาคเหนือ อ.เมือง', name_en: 'Northern Dev Bridge', province_th: 'น่าน', location_type: 'upstream', bank_percent: 41.3, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'N.5A', name_th: 'สะพานสุพรรณกัลยา อ.เมือง', name_en: 'Suphan Kanya Bridge', province_th: 'อุตรดิตถ์', location_type: 'midstream', bank_percent: 42.4, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'N.67', name_th: 'วัดเกยไชยเหนือ อ.ชุมแสง', name_en: 'Wat Koey Chai Nuea', province_th: 'นครสวรรค์', location_type: 'downstream', bank_percent: 87.1, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' }
    ]
  },
  'river-khwae-noi-north': {
    river_id: 'river-khwae-noi-north',
    name_th: 'แม่น้ำแควน้อย (พิษณุโลก)',
    name_en: 'Khwae Noi River (Phitsanulok)',
    avg_bank_percent: 66.6,
    ...evaluateRiverStatus(66.6),
    stations: [
      { code: 'N.36', name_th: 'บ้านแก่ง อ.วัดโบสถ์', name_en: 'Ban Kaeng', province_th: 'พิษณุโลก', location_type: 'upstream', bank_percent: 68.0, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'N.37', name_th: 'สะพานวัดโบสถ์ อ.วัดโบสถ์', name_en: 'Wat Bot', province_th: 'พิษณุโลก', location_type: 'downstream', bank_percent: 65.2, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' }
    ]
  },
  'river-chao-phraya': {
    river_id: 'river-chao-phraya',
    name_th: 'แม่น้ำเจ้าพระยา',
    name_en: 'Chao Phraya River',
    avg_bank_percent: 88.5,
    ...evaluateRiverStatus(88.5),
    stations: [
      { code: 'C.2', name_th: 'ค่ายจิรประวัติ อ.เมือง', name_en: 'Chiraprawat Camp', province_th: 'นครสวรรค์', location_type: 'upstream', bank_percent: 79.9, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'C.13', name_th: 'ท้ายเขื่อนเจ้าพระยา อ.สรรพยา', name_en: 'Chao Phraya Dam Tail', province_th: 'ชัยนาท', location_type: 'midstream', bank_percent: 97.1, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'C.29A', name_th: 'ศูนย์ศิลปาชีพ อ.บางไทร', name_en: 'Bang Sai Arts Center', province_th: 'พระนครศรีอยุธยา', location_type: 'downstream', bank_percent: 88.5, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' }
    ]
  },
  'river-tha-chin': {
    river_id: 'river-tha-chin',
    name_th: 'แม่น้ำท่าจีน',
    name_en: 'Tha Chin River',
    avg_bank_percent: 108.1,
    ...evaluateRiverStatus(108.1),
    stations: [
      { code: 'T.13', name_th: 'บ้านบางการ้อง อ.เมือง', name_en: 'Bang Ka Rong', province_th: 'สุพรรณบุรี', location_type: 'upstream', bank_percent: 113.7, diff_wl_text_th: 'ล้นตลิ่ง' },
      { code: 'T.15', name_th: 'วัดบางไผ่นารถ อ.บางเลน', name_en: 'Wat Bang Phai Nat', province_th: 'นครปฐม', location_type: 'midstream', bank_percent: 110.3, diff_wl_text_th: 'ล้นตลิ่ง' },
      { code: 'T.1', name_th: 'ที่ว่าการ อ.นครชัยศรี', name_en: 'Nakhon Chai Si District Office', province_th: 'นครปฐม', location_type: 'midstream', bank_percent: 107.4, diff_wl_text_th: 'ล้นตลิ่ง' },
      { code: 'T.14', name_th: 'ร.ร.บ้านสามพราน อ.สามพราน', name_en: 'Sam Phran School', province_th: 'นครปฐม', location_type: 'downstream', bank_percent: 101.2, diff_wl_text_th: 'ล้นตลิ่ง' }
    ]
  },
  'river-pa-sak': {
    river_id: 'river-pa-sak',
    name_th: 'แม่น้ำป่าสัก',
    name_en: 'Pa Sak River',
    avg_bank_percent: 76.4,
    ...evaluateRiverStatus(76.4),
    stations: [
      { code: 'S.43', name_th: 'บ้านพูลทรัพย์ อ.หล่มสัก', name_en: 'Phun Sap', province_th: 'เพชรบูรณ์', location_type: 'upstream', bank_percent: 70.7, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'S.28', name_th: 'ท้ายเขื่อนป่าสักชลสิทธิ์', name_en: 'Pa Sak Dam Tail', province_th: 'ลพบุรี', location_type: 'midstream', bank_percent: 57.8, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'S.26', name_th: 'ท้ายเขื่อนพระรามหก อ.ท่าเรือ', name_en: 'Rama VI Dam Tail', province_th: 'พระนครศรีอยุธยา', location_type: 'downstream', bank_percent: 100.8, diff_wl_text_th: 'ล้นตลิ่ง' }
    ]
  },
  'river-thap-salao': {
    river_id: 'river-thap-salao',
    name_th: 'แม่น้ำสะแกกรัง / ห้วยทับเสลา',
    name_en: 'Sakae Krang / Thap Salao River',
    avg_bank_percent: 60.3,
    ...evaluateRiverStatus(60.3),
    stations: [
      { code: 'Ct.19', name_th: 'สะพานพัฒนา อ.เมือง', name_en: 'Pattana Bridge', province_th: 'อุทัยธานี', location_type: 'upstream', bank_percent: 66.5, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'Ct.5A', name_th: 'บ้านท่าซุง อ.เมือง', name_en: 'Tha Sung', province_th: 'อุทัยธานี', location_type: 'downstream', bank_percent: 54.1, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' }
    ]
  },
  'river-khwae-yai': {
    river_id: 'river-khwae-yai',
    name_th: 'แม่น้ำแควใหญ่',
    name_en: 'Khwae Yai River',
    avg_bank_percent: 53.7,
    ...evaluateRiverStatus(53.7),
    stations: [
      { code: 'K.12A', name_th: 'ท้ายเขื่อนศรีนครินทร์ อ.ศรีสวัสดิ์', name_en: 'Srinagarind Dam Tail', province_th: 'กาญจนบุรี', location_type: 'upstream', bank_percent: 52.0, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'K.2A', name_th: 'สะพานข้ามแม่น้ำแคว อ.เมือง', name_en: 'River Kwai Bridge', province_th: 'กาญจนบุรี', location_type: 'downstream', bank_percent: 55.4, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' }
    ]
  },
  'river-khwae-noi-west': {
    river_id: 'river-khwae-noi-west',
    name_th: 'แม่น้ำแควน้อย (กาญจนบุรี)',
    name_en: 'Khwae Noi River (Kanchanaburi)',
    avg_bank_percent: 61.3,
    ...evaluateRiverStatus(61.3),
    stations: [
      { code: 'K.10', name_th: 'บ้านลุ่มสุ่ม อ.ไทรโยค', name_en: 'Lum Sum', province_th: 'กาญจนบุรี', location_type: 'upstream', bank_percent: 58.3, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'K.11', name_th: 'สะพานปากแพรก อ.เมือง', name_en: 'Pak Phraek Bridge', province_th: 'กาญจนบุรี', location_type: 'downstream', bank_percent: 64.2, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' }
    ]
  },
  'river-mae-klong': {
    river_id: 'river-mae-klong',
    name_th: 'แม่น้ำแม่กลอง',
    name_en: 'Mae Klong River',
    avg_bank_percent: 61.9,
    ...evaluateRiverStatus(61.9),
    stations: [
      { code: 'K.1', name_th: 'สะพานสมเด็จพระสังฆราช อ.เมือง', name_en: 'Somdet Sangkharat Bridge', province_th: 'กาญจนบุรี', location_type: 'upstream', bank_percent: 58.3, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'K.13', name_th: 'สะพานบ้านโป่ง อ.บ้านโป่ง', name_en: 'Ban Pong Bridge', province_th: 'ราชบุรี', location_type: 'midstream', bank_percent: 62.0, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'K.14A', name_th: 'สะพานธนะรัชต์ อ.เมือง', name_en: 'Thanarat Bridge', province_th: 'ราชบุรี', location_type: 'downstream', bank_percent: 65.5, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' }
    ]
  },
  'river-phetchaburi': {
    river_id: 'river-phetchaburi',
    name_th: 'แม่น้ำเพชรบุรี',
    name_en: 'Phetchaburi River',
    avg_bank_percent: 80.3,
    ...evaluateRiverStatus(80.3),
    stations: [
      { code: 'B.3A', name_th: 'ท้ายเขื่อนเพชร อ.ท่ายาง', name_en: 'Phet Dam Tail', province_th: 'เพชรบุรี', location_type: 'upstream', bank_percent: 82.5, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'B.1', name_th: 'สะพานจอมเกล้า อ.เมือง', name_en: 'Chom Klao Bridge', province_th: 'เพชรบุรี', location_type: 'downstream', bank_percent: 78.0, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' }
    ]
  },
  'river-pran-buri': {
    river_id: 'river-pran-buri',
    name_th: 'แม่น้ำปราณบุรี',
    name_en: 'Pran Buri River',
    avg_bank_percent: 61.4,
    ...evaluateRiverStatus(61.4),
    stations: [
      { code: 'X.113', name_th: 'ท้ายเขื่อนปราณบุรี อ.ปราณบุรี', name_en: 'Pran Buri Dam Tail', province_th: 'ประจวบคีรีขันธ์', location_type: 'upstream', bank_percent: 64.5, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'X.114', name_th: 'สะพานมิตรภาพ อ.ปราณบุรี', name_en: 'Mittraphap Bridge', province_th: 'ประจวบคีรีขันธ์', location_type: 'downstream', bank_percent: 58.2, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' }
    ]
  },
  'river-chi': {
    river_id: 'river-chi',
    name_th: 'แม่น้ำชี',
    name_en: 'Chi River',
    avg_bank_percent: 69.6,
    ...evaluateRiverStatus(69.6),
    stations: [
      { code: 'E.23', name_th: 'บ้านค่าย อ.โกสุมพิสัย', name_en: 'Ban Khai', province_th: 'มหาสารคาม', location_type: 'upstream', bank_percent: 79.1, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'E.18', name_th: 'บ้านท่าสะแบง อ.ทุ่งเขาหลวง', name_en: 'Tha Sabaeng', province_th: 'ร้อยเอ็ด', location_type: 'midstream', bank_percent: 55.5, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'E.20A', name_th: 'บ้านฟ้าหยาด อ.มหาชนะชัย', name_en: 'Fa Yat', province_th: 'ยโสธร', location_type: 'downstream', bank_percent: 74.2, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' }
    ]
  },
  'river-nam-phong': {
    river_id: 'river-nam-phong',
    name_th: 'ลำน้ำพอง',
    name_en: 'Nam Phong River',
    avg_bank_percent: 56.3,
    ...evaluateRiverStatus(56.3),
    stations: [
      { code: 'E.22B', name_th: 'สะพานกุดกว้าง อ.เมือง', name_en: 'Kut Kwang Bridge', province_th: 'ขอนแก่น', location_type: 'upstream', bank_percent: 58.5, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'E.22', name_th: 'บ้านบึงเนียม อ.เมือง', name_en: 'Bueng Niam', province_th: 'ขอนแก่น', location_type: 'downstream', bank_percent: 54.0, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' }
    ]
  },
  'river-lam-pao': {
    river_id: 'river-lam-pao',
    name_th: 'ลำน้ำปาว',
    name_en: 'Lam Pao River',
    avg_bank_percent: 63.3,
    ...evaluateRiverStatus(63.3),
    stations: [
      { code: 'E.88', name_th: 'ท้ายเขื่อนลำปาว อ.เมือง', name_en: 'Lam Pao Tail', province_th: 'กาฬสินธุ์', location_type: 'upstream', bank_percent: 62.5, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'E.89', name_th: 'บ้านกมลาไสย อ.กมลาไสย', name_en: 'Kamalasai', province_th: 'กาฬสินธุ์', location_type: 'downstream', bank_percent: 64.0, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' }
    ]
  },
  'river-mun': {
    river_id: 'river-mun',
    name_th: 'แม่น้ำมูล',
    name_en: 'Mun River',
    avg_bank_percent: 68.8,
    ...evaluateRiverStatus(68.8),
    stations: [
      { code: 'M.2A', name_th: 'บ้านด่านกะตา อ.พิมาย', name_en: 'Dan Kata', province_th: 'นครราชสีมา', location_type: 'upstream', bank_percent: 74.2, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'M.5', name_th: 'อ.ราษีไศล (M.5)', name_en: 'Rasi Salai', province_th: 'ศรีสะเกษ', location_type: 'midstream', bank_percent: 46.6, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'M.7', name_th: 'สะพานเสรีประชาธิปไตย อ.เมือง', name_en: 'Seri Democrat Bridge', province_th: 'อุบลราชธานี', location_type: 'downstream', bank_percent: 85.5, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' }
    ]
  },
  'river-bang-pakong': {
    river_id: 'river-bang-pakong',
    name_th: 'แม่น้ำบางปะกง / นครนายก',
    name_en: 'Bang Pakong / Nakhon Nayok River',
    avg_bank_percent: 81.0,
    ...evaluateRiverStatus(81.0),
    stations: [
      { code: 'KGT.19', name_th: 'ต้นแม่น้ำปราจีนบุรี อ.กบินทร์บุรี', name_en: 'Kabin Buri', province_th: 'ปราจีนบุรี', location_type: 'upstream', bank_percent: 82.4, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'NY.1B', name_th: 'สะพานบ้านปากพลี อ.ปากพลี', name_en: 'Pak Phli', province_th: 'นครนายก', location_type: 'midstream', bank_percent: 76.5, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'KGT.1', name_th: 'สะพานฉะเชิงเทรา อ.เมือง', name_en: 'Chachoengsao Bridge', province_th: 'ฉะเชิงเทรา', location_type: 'downstream', bank_percent: 84.0, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' }
    ]
  },
  'river-prasae': {
    river_id: 'river-prasae',
    name_th: 'แม่น้ำประแสร์',
    name_en: 'Prasae River',
    avg_bank_percent: 70.3,
    ...evaluateRiverStatus(70.3),
    stations: [
      { code: 'Z.11', name_th: 'ท้ายเขื่อนประแสร์ อ.วังจันทร์', name_en: 'Prasae Dam Tail', province_th: 'ระยอง', location_type: 'upstream', bank_percent: 72.0, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'Z.12', name_th: 'สะพานปากน้ำประแสร์ อ.แกลง', name_en: 'Pak Nam Prasae Bridge', province_th: 'ระยอง', location_type: 'downstream', bank_percent: 68.5, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' }
    ]
  },
  'river-rayong': {
    river_id: 'river-rayong',
    name_th: 'แม่น้ำระยอง',
    name_en: 'Rayong River',
    avg_bank_percent: 72.8,
    ...evaluateRiverStatus(72.8),
    stations: [
      { code: 'Z.1', name_th: 'สะพานท่าประดู่ อ.เมือง', name_en: 'Tha Pradu Bridge', province_th: 'ระยอง', location_type: 'upstream', bank_percent: 74.5, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'Z.2', name_th: 'สะพานปากน้ำระยอง อ.เมือง', name_en: 'Pak Nam Rayong', province_th: 'ระยอง', location_type: 'downstream', bank_percent: 71.0, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' }
    ]
  },
  'river-tapi-phum-duang': {
    river_id: 'river-tapi-phum-duang',
    name_th: 'แม่น้ำพุมดวง / แม่น้ำตาปี',
    name_en: 'Phum Duang & Tapi River',
    avg_bank_percent: 65.2,
    ...evaluateRiverStatus(65.2),
    stations: [
      { code: 'X.217', name_th: 'บ้านเคียนซา อ.เคียนซา', name_en: 'Khian Sa', province_th: 'สุราษฎร์ธานี', location_type: 'upstream', bank_percent: 65.5, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'X.40', name_th: 'สะพานพุนพิน อ.พุนพิน', name_en: 'Phunphin Bridge', province_th: 'สุราษฎร์ธานี', location_type: 'midstream', bank_percent: 68.2, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'X.37A', name_th: 'สะพานจุฬาลงกรณ์ อ.เมือง', name_en: 'Chulalongkorn Bridge', province_th: 'สุราษฎร์ธานี', location_type: 'downstream', bank_percent: 62.0, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' }
    ]
  },
  'river-pattani': {
    river_id: 'river-pattani',
    name_th: 'แม่น้ำปัตตานี',
    name_en: 'Pattani River',
    avg_bank_percent: 42.2,
    ...evaluateRiverStatus(42.2),
    stations: [
      { code: 'X.216', name_th: 'บ้านบาโงยซิแน อ.ยะหา', name_en: 'Bangoi Sinae', province_th: 'ยะลา', location_type: 'upstream', bank_percent: 48.0, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'X.40A', name_th: 'บ้านท่าสาบ อ.เมือง', name_en: 'Tha Sap', province_th: 'ยะลา', location_type: 'midstream', bank_percent: 36.4, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' },
      { code: 'X.215', name_th: 'สะพานเดชนรงค์ อ.เมือง', name_en: 'Dechanarong Bridge', province_th: 'ปัตตานี', location_type: 'downstream', bank_percent: 42.2, diff_wl_text_th: 'ต่ำกว่าตลิ่ง' }
    ]
  }
};

export function getRiverTelemetry(riverId: string): RiverTelemetryData | null {
  return RIVER_TELEMETRY[riverId] || null;
}
