import { RegionMeta } from '../types/dam';

export const REGIONS: Record<string, RegionMeta> = {
  all: {
    id: 'all',
    name_th: 'ทั่วประเทศ',
    name_en: 'All Thailand',
    center: [100.5, 13.5],
    cameraTarget: [0, 0, 0],
    zoom: 1.0,
    description_th: 'ภาพรวมเขื่อนและอ่างเก็บน้ำขนาดใหญ่ 39 แห่งทั่วประเทศไทย',
    description_en: 'Overview of 39 major reservoirs and dams across Thailand'
  },
  north: {
    id: 'north',
    name_th: 'ภาคเหนือ',
    name_en: 'Northern Region',
    center: [99.8, 18.8],
    cameraTarget: [-0.3, 2.2, 0],
    zoom: 1.8,
    description_th: 'แหล่งต้นน้ำสายหลักเจ้าพระยา (ปิง วัง ยม น่าน) และเขื่อนภูมิพล-สิริกิติ์',
    description_en: 'Main headwaters of Chao Phraya river basin, including Bhumibol & Sirikit dams'
  },
  northeast: {
    id: 'northeast',
    name_th: 'ภาคตะวันออกเฉียงเหนือ',
    name_en: 'Northeastern (Isan)',
    center: [103.2, 16.2],
    cameraTarget: [1.2, 1.0, 0],
    zoom: 1.7,
    description_th: 'ลุ่มน้ำชี-มูล พื้นที่เกษตรกรรมขนาดใหญ่และเขื่อนอุบลรัตน์-ลำปาว',
    description_en: 'Chi-Mun river basin, major agriculture and Ubol Ratana / Lam Pao dams'
  },
  central: {
    id: 'central',
    name_th: 'ภาคกลาง',
    name_en: 'Central Region',
    center: [100.2, 14.8],
    cameraTarget: [-0.1, 0.4, 0],
    zoom: 2.2,
    description_th: 'พื้นที่รับน้ำลุ่มน้ำเจ้าพระยาตอนล่างและเขื่อนป่าสักชลสิทธิ์',
    description_en: 'Lower Chao Phraya basin floodplain and Pasak Jolasid Dam'
  },
  west: {
    id: 'west',
    name_th: 'ภาคตะวันตก',
    name_en: 'Western Region',
    center: [99.0, 14.2],
    cameraTarget: [-0.8, 0.2, 0],
    zoom: 2.0,
    description_th: 'ลุ่มน้ำแม่กลอง แหล่งกักเก็บน้ำพลังงานไฟฟ้าขนาดใหญ่ (ศรีนครินทร์-วชิราลงกรณ)',
    description_en: 'Mae Klong basin, key hydroelectric dams (Srinagarind & Vajiralongkorn)'
  },
  east: {
    id: 'east',
    name_th: 'ภาคตะวันออก',
    name_en: 'Eastern Region',
    center: [101.8, 13.2],
    cameraTarget: [0.7, -0.2, 0],
    zoom: 2.2,
    description_th: 'พื้นที่รองรับ EEC ลุ่มน้ำบางปะกง และเขื่อนขุนด่านปราการชล',
    description_en: 'EEC economic corridor, Bang Pakong basin, and Khun Dan Prakan Chon Dam'
  },
  south: {
    id: 'south',
    name_th: 'ภาคใต้',
    name_en: 'Southern Region',
    center: [99.5, 8.5],
    cameraTarget: [-0.5, -2.2, 0],
    zoom: 1.6,
    description_th: 'พื้นที่คาบสมุทร ลุ่มน้ำตาปี-ปัตตานี และเขื่อนรัชชประภา-บางลาง',
    description_en: 'Peninsular Thailand, Tapi-Pattani basins, Rajjaprabha & Bang Lang dams'
  }
};
