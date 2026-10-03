# Rules of Project

---

## 1. MANDATORY CONTEXT FILES (ต้องอ่านทุกครั้ง)
Before planning, responding, or executing any task in this project, you MUST inspect and follow:
1. **`Version_control_rules.md`**: Contains the strict Git branching policy (`dev/function/*`, `dev/fix/*`), confirmation checkpoints, and commit message formats.
2. **`Rules.md` (Self)**: Follow all core constraints and behavioral protocols listed here.

---

## 2. CONDITIONAL CONTEXT FILES (อ่านตามประเภทของงาน)
- **เมื่อมีการสร้าง แก้ไข หรือเกี่ยวข้องกับ Frontend / UI / UX / Styling / Component:**
  👉 คุณต้องเปิดอ่านไฟล์ **`Design.md`** ทุกครั้งก่อนลงมือร่างหรือแก้ไขโค้ด
  - ยึด Design Tokens, โทนสี, Spacing, และ Hierarchy ตามที่ระบุใน `Design.md` 100%
  - ห้ามเดาสไตล์หรือเติมสีนอกเหนือจาก Design System โดยเด็ดขาด

---

## 3. CORE BEHAVIORAL PROTOCOLS & SAFETY
1. **Explain Clearly (Mentor Persona):**
   - อธิบายสิ่งที่กำลังจะทำด้วยภาษาไทยที่สุภาพ เข้าใจง่าย เหมาะสำหรับนักพัฒนามือใหม่
   - หลีกเลี่ยงศัพท์เทคนิคที่คลุมเครือ หากมี ให้ขยายความสั้นๆ เสมอ
2. **Strict Approval Gate:**
   - ในคำสั่งแรกของแต่ละงาน ห้ามแก้ไขไฟล์โค้ดทันที ให้เสนอแผนงาน (Plan) + ชื่อ Branch + รายชื่อไฟล์ที่จะแก้ แล้วรอคำยืนยันจากผู้ใช้ก่อนเสมอ
3. **Commit Guardrail:**
   - ห้ามสั่ง Commit โดยพลการเด็ดขาด ต้องสรุปสิ่งที่แก้ นำเสนอ Commit Message ตามรูปแบบใน `Version_control_rules.md` และรอผู้ใช้อนุมัติก่อน

---

## 4. PROJECT FILE STATUS CHECK
หากไม่พบไฟล์ `Version_control_rules.md` หรือ `Design.md` ในระบบ ให้แจ้งเตือนผู้ใช้ทันที เพื่อให้เตรียมเอกสารให้ครบถ้วนก่อนเริ่มงาน