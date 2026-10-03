# Public Water Sources Reference (แหล่งข้อมูลสถานการณ์น้ำสาธารณะ)

เอกสารรวบรวมรายการ Public APIs, Endpoints และข้อกำหนดทางเทคนิคในการเชื่อมต่อข้อมูลน้ำของหน่วยงานรัฐในประเทศไทยที่ผ่านการทดสอบและใช้งานได้จริง

---

## 1. คลังข้อมูลน้ำแห่งชาติ (HII / สสน. — ThaiWater)

คลังข้อมูลน้ำแห่งชาติเป็นแหล่งข้อมูลกลางของประเทศไทยที่รวบรวมสถานการณ์น้ำทั้งเขื่อนของ กฟผ. (EGAT) และกรมชลประทาน (RID)

### 1.1 Large Dams API (เขื่อนขนาดใหญ่ทั่วประเทศ — ข้อมูลหลัก)
- **Method:** `GET`
- **URL:** `https://api-v3.thaiwater.net/api/v1/thaiwater30/analyst/dam?dam_size=1`
- **Parameters:**
  - `dam_size=1` : เขื่อนขนาดใหญ่ (39+ แห่งทั่วประเทศ เช่น ภูมิพล, สิริกิติ์, ศรีนครินทร์, ป่าสักชลสิทธิ์ ฯลฯ)
  - `dam_size=2` : อ่างเก็บน้ำขนาดกลาง
  - `dam_date=YYYY-MM-DD` : (ระบุหรือไม่ระบุก็ได้ หากไม่ระบุจะเป็นข้อมูลประจำวันล่าสุด)
- **Authentication:** ไม่ต้องใช้ API Key (Public Access)
- **Headers:** `Accept: application/json`

#### ฟิลด์ข้อมูลสำคัญใน `dam_daily`:
- `dam.dam_name.th`: ชื่อเขื่อนภาษาไทย
- `dam.dam_name.en`: ชื่อเขื่อนภาษาอังกฤษ
- `dam.dam_lat` / `dam.dam_long`: พิกัดภูมิศาสตร์ (Latitude, Longitude)
- `dam_storage`: ปริมาตรน้ำปัจจุบัน (ล้านลูกบาศก์เมตร - MCM)
- `dam_storage_percent`: เปอร์เซ็นต์ปริมาณน้ำเทียบกับความจุเก็บกัก (%)
- `dam_inflow`: ปริมาณน้ำไหลลงอ่าง (MCM)
- `dam_released`: ปริมาณน้ำระบายออก (MCM)
- `dam_level`: ระดับน้ำ (ม.รทก. / m MSL)

---

## 2. กรมชลประทาน (Royal Irrigation Department - RID)

กรมชลประทานให้บริการ Open API รายงานสถานการณ์น้ำในอ่างเก็บน้ำขนาดกลาง 461 แห่งทั่วประเทศ

### 2.1 Medium Reservoirs Public API
- **Method:** `GET`
- **URL:** `https://app.rid.go.th/reservoir/api/reservoir/public`
- **Historical URL:** `https://app.rid.go.th/reservoir/api/reservoir/public/{YYYY-MM-DD}`
- **Authentication:** ไม่ต้องใช้ API Key
- **Coverage:** อ่างเก็บน้ำขนาดกลาง 461 แห่ง แบ่งตาม 6 ภูมิภาค

#### ฟิลด์ข้อมูลใน `data[].reservoir[]`:
- `id`: รหัสอ่างเก็บน้ำ (เช่น `rsv01`)
- `name`: ชื่ออ่างเก็บน้ำ
- `storage`: ปริมาณน้ำเก็บกัก (MCM)
- `volume`: ปริมาณน้ำในอ่างปัจจุบัน (MCM)
- `percent_storage`: ร้อยละความจุ (%)
- `inflow`: น้ำไหลเข้า (MCM)
- `outflow`: น้ำระบาย (MCM)

---

## 3. สรุปความถี่ในการอัปเดตข้อมูล (Data Freshness & Caching)
- **ความถี่อัปเดตของหน่วยงานรัฐ:** วันละ 1 ครั้ง ช่วงเวลาประมาณ 06:00 - 08:00 น.
- **กลยุทธ์ Caching ที่แนะนำ:**
  - ทำ In-memory Cache / ISR (Incremental Static Regeneration) หรือ Cache ไว้ 1-3 ชั่วโมง
  - เพื่อลดภาระของเซิร์ฟเวอร์หน่วยงานรัฐ และให้หน้าเว็บโหลดได้รวดเร็วระดับมิลลิวินาที
