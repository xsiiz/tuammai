# BASE GLOBAL RULES & WORKFLOW PROTOCOL (ANTIGRAVITY)

## 1. GIT BRANCHING DISCIPLINE
Never work or make commits directly on `master` or `main`.
- **New Feature / Function:** Always create and switch to a branch following the pattern:
  `dev/function/<feature-name>` (e.g., `dev/function/dam-monitoring-map`)
- **Bug Fix / Hotfix:** Always create and switch to a branch following the pattern:
  `dev/fix/<issue-name>` (e.g., `dev/fix/water-level-display`)

## 2. PRE-MODIFICATION CONFIRMATION (MANDATORY)
Before touching, editing, or creating ANY code files for the first time in a task:
1. **Pause immediately.** Do NOT generate or apply code changes or run code-modifying tools yet.
2. Present a clear, concise plan of action:
   - Proposed Git branch name (`dev/function/*` or `dev/fix/*`).
   - List of files to be created or modified.
   - Summary of key logic/architecture changes.
3. Explicitly ask the user for confirmation:
   > *"ยืนยันให้เริ่มสร้าง Branch และลงมือแก้ไขโค้ดตามแผนนี้หรือไม่?"*
4. **WAIT** for the user's explicit approval (e.g., 'ตกลง', 'yes', 'confirm', 'ลุย') before proceeding with code changes.

## 3. PRE-COMMIT CONFIRMATION (MANDATORY)
Once the coding task is complete:
1. Do NOT execute `git commit` automatically.
2. Display a brief summary of changed files (`git status` summary).
3. Present the proposed commit message following the format in Section 4.
4. Ask the user:
   > *"ต้องการให้ Commit โค้ดชุดนี้ด้วยข้อความนี้เลยหรือไม่?"*
5. Wait for user confirmation before executing the commit command.

## 4. PRE-MERGE TO MASTER CONFIRMATION (MANDATORY)
ห้ามทำการ Merge โค้ดจาก dev branch เข้าสู่ `master` โดยพลการเด็ดขาด:
1. ต้องทำการทดสอบและตรวจสอบความเรียบร้อยของโค้ดใน dev branch ให้เสร็จสิ้น
2. รายงานสรุปรายการเปลี่ยนแปลงและฟังก์ชันที่จะรวมเข้าสู่ `master` ให้ผู้ใช้ทราบ
3. ถามขออนุมัติจากผู้ใช้ก่อนเสมอ:
   > *"ยืนยันการ Merge สาขา `<branch-name>` เข้าสู่ `master` หรือไม่?"*
4. ดำเนินการ Merge ได้ก็ต่อเมื่อได้รับคำยืนยันที่ชัดเจนจากผู้ใช้เท่านั้น

## 5. COMMIT MESSAGE CONVENTIONS
Format all commit messages strictly using section headers and bilingual bullet points (Thai description followed by English summary in square brackets `[...]`):

```text
-- DEV --
- <สิ่งที่เพิ่ม/ฟังก์ชันใหม่เป็นภาษาไทย> [<short English description>]

-- FIX --
- <สิ่งที่แก้ไข/บั๊กที่แก้เป็นภาษาไทย> [<short English description>]
```