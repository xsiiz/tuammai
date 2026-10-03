# Design System — ท่วมมั้ย (Tuammai)

> เอกสารกำหนด Design Tokens, คู่สี, Spacing, Typography, และ Hierarchy สำหรับโครงการท่วมมั้ย ตามข้อกำหนดใน `rules.md` และ `AGENTS.md`

---

## 1. Visual Theme & Style Direction

- **Style:** Tactile 3D Low-Relief (นูนต่ำ) / Matte Clay Topographic Aesthetic
- **Atmosphere:** สะอาดตา (Clean), สบายตา, มีมิติสมจริงแต่คงความเรียบง่าย (Soft Shadows, Matte Surface, ไม่สะท้อนแสงจัดจ้าน)
- **Background Mode:** Dark & Clean Modern Hydrology Theme (โทน Slate / Deep Navy Blue) ช่วยขับให้โมเดลแผนที่ 3D และหมุดเตือนภัยเด่นชัด

---

## 2. Color Palette & Design Tokens

### 2.1. Brand & Hydrology Water Colors
- **Primary Water Blue:** `#0284C7` (Sky 600) — สีน้ำหลัก
- **Water Cyan / Highlight:** `#06B6D4` (Cyan 500) — สีไฮไลต์ผิวน้ำ/สายน้ำ
- **Deep Navy / Background:** `#0B1120` (Slate 950) — สีพื้นหลังหลักของแอป
- **Surface Card / Glass:** `rgba(15, 23, 42, 0.75)` (Slate 900 with backdrop-blur) — ผิวการ์ดข้อมูล

### 2.2. Dam Alert Status Indicators (เกณฑ์เตือนภัยระดับน้ำตาม AGENTS.md)
- 🔴 **Critical (วิกฤต):** `#EF4444` (Red 500)
  - เกณฑ์: ความจุมากกว่า 100% (น้ำล้น/เสี่ยงท่วม) หรือ ต่ำกว่า 30% (แล้งรุนแรง)
  - Glow: `rgba(239, 68, 68, 0.4)`
- 🟡 **Warning (เฝ้าระวัง):** `#F59E0B` (Amber 500)
  - เกณฑ์: ความจุระหว่าง 80% – 100% หรือ 30% – 50%
  - Glow: `rgba(245, 158, 11, 0.4)`
- 🟢 **Normal (ปกติ):** `#10B981` (Emerald 500)
  - เกณฑ์: ความจุระหว่าง 50% – 80%
  - Glow: `rgba(16, 185, 129, 0.4)`

### 2.3. Terrain & Map 3D Shaders (Clay Low-Relief & Regional Pastel Palette)
- **Base Clay Land:** `#CBD5E1` (Slate 300) ถึง `#94A3B8` (Slate 400)
- **Highland / Mountain Elevation:** `#64748B` (Slate 500)
- **Region Active Highlight:** โทนสีเด่นประจำภูมิภาคนั้นๆ หรือ `#38BDF8` (Sky 400) พร้อมขอบเรืองแสงนุ่มนวล
- **Coastline / Border Rim:** `#E2E8F0` (Slate 200)

#### 2.3.1. Distinct Regional Pastel Tokens (พาเลตต์สีพาสเทลแยก 6 ภูมิภาค)
- 🌿 **ภาคเหนือ (North):** Base `#86EFAC` (Green 300 - Mint Pastel) / Highlight `#22C55E`
- 🍑 **ภาคตะวันออกเฉียงเหนือ (Northeast):** Base `#FDBA74` (Orange 300 - Warm Peach) / Highlight `#F97316`
- 🌾 **ภาคกลาง (Central):** Base `#FDE68A` (Amber 200 - Butter Yellow) / Highlight `#FACC15`
- 🪻 **ภาคตะวันตก (West):** Base `#DDD6FE` (Violet 200 - Soft Lavender) / Highlight `#8B5CF6`
- 🌸 **ภาคตะวันออก (East):** Base `#FDA4AF` (Rose 300 - Rose Pink) / Highlight `#F43F5E`
- 🌊 **ภาคใต้ (South):** Base `#7DD3FC` (Sky 300 - Sky Aqua) / Highlight `#0EA5E9`

---

## 3. Typography & Hierarchy

- **Font Family:** `'Prompt', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Scale:**
  - **Hero Title:** 24px - 32px (Bold, tracking-tight)
  - **Section / Region Title:** 18px - 20px (SemiBold)
  - **Body / Dam Name:** 14px - 16px (Medium / Regular)
  - **Caption / Metadata / Unit:** 11px - 12px (Regular, Muted text `#94A3B8`)

---

## 4. Spacing & Radius Tokens

- **Card Radius:** `rounded-2xl` (16px) สำหรับแผงควบคุมและ Modal, `rounded-xl` (12px) สำหรับปุ่มและแท็ก
- **Spacing:** Base 4px scale (p-2 = 8px, p-4 = 16px, p-6 = 24px)
- **Shadows:** Soft ambient diffusion
  - `box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3);`

---

## 5. Component Guidelines

1. **Breadcrumb / Drill-down Bar:** ด้านบนสุด แสดงลำดับ ประเทศไทย > ภาค > เขื่อน พร้อมปุ่มย้อนกลับที่ชัดเจน
2. **Dam Marker Pin:** เข็มหมุด 3D มีไฟกระพริบ Pulse ตามสีระดับน้ำ (แดง/เหลือง/เขียว) และป้าย Floating Tag สั้นๆ
3. **Region Quick-filter Buttons:** เมนูแท็บลอย (Floating Pills) เลือก 6 ภาคด้านล่างหรือด้านข้าง สะดวกต่อการกดทั้งบน Desktop และ Mobile
4. **Detail Drawer / Modal:** แสดงข้อมูลเขื่อน ปริมาตรกักเก็บ (ล้าน ลบ.ม.), % ความจุ, น้ำไหลเข้า/ออก (Inflow/Outflow) และสถานะแจ้งเตือน
