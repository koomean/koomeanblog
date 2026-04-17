<div align="center">

# 🚀 KOO MEAN SPACE
### **A Premium Personal Micro-Blogging Platform**
 
[![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)]()
[![Platform](https://img.shields.io/badge/Platform-GitHub_Pages-blue?style=for-the-badge)]()
[![Backend](https://img.shields.io/badge/Backend-Google_Apps_Script-orange?style=for-the-badge)]()

</div>

---

# 🌟 OVERVIEW (ภาพรวมโปรเจกต์)
**Koo Mean Space** คือแพลตฟอร์มโซเชียลมีเดียส่วนตัว (Micro-blogging) ที่ออกแบบมาให้มีความทันสมัย เรียบหรูในสไตล์ **OLED Black** โดยเน้นความเร็วในการใช้งานและความง่ายในการจัดการข้อมูลผ่าน **Google Sheets** ในรูปแบบของ Database 100%

---

# ✨ KEY FEATURES (คุณสมบัติหลัก)

### 🌑 OLED Black & Modern UI
- ดีไซน์มินิมอล เน้นสีดำสนิทเพื่อประหยัดพลังงานบนหน้าจอ OLED
- ระบบ **Skeleton Loading** โหลดเนื้อหาแบบนุ่มนวล สบายตา
- **Fully Responsive** รองรับการใช้งานเต็มหน้าจอทั้งบน PC, iPad และ iPhone

### 🛠️ Advanced Admin Control
- ระบบจัดการโพสต์ระดับ Admin (คุณมีน) สามารถ **เขียน, แก้ไข และลบ** โพสต์ได้โดยตรงจากหน้าเว็บ
- ประทับเวลาการแก้ไขอัตโนมัติ *"แก้ไขแล้วเมื่อ..."* เพื่อความชัดเจน

### 💬 Social Interaction
- บุคคลทั่วไปสามารถล็อกอินผ่าน **Google Account** เพื่อมีส่วนร่วมกับเว็บ
- ระบบ **Like (กดใจ)** และ **Comment** ที่ใช้งานง่ายและรวดเร็ว
- ผู้ใช้ทั่วไปสามารถแก้ไขหรือลบคอมเมนต์ของตัวเองได้

### 🖼️ Smart Media & Link Support
- **Auto Image Upload:** ระบบอัปโหลดรูปภาพผ่าน ImgBB API โดยอัตโนมัติ ไม่ต้องฝากรูปเอง
- **YouTube Embed:** วางลิงก์วิดีโอแล้วแสดงผลเป็นเครื่องเล่นวิดีโอทันที
- **Link Previewer:** ระบบดึงข้อมูลตัวอย่างเว็บไซต์ (รูปปก/หัวข้อ/คำอธิบาย) มาแสดงผลเป็น Card สวยๆ ทุกลิงก์

---

# 🛠️ TECH STACK (เทคโนโลยีที่ใช้)

| ส่วนงาน | เทคโนโลยีที่ใช้ |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Modern Flexbox/Grid), Vanilla JavaScript |
| **Backend** | Google Apps Script (Web App Service) |
| **Database** | Google Sheets API |
| **Auth** | Google Identity Service (GSI) |
| **Storage** | ImgBB API (Image Hosting) |
| **CORS** | AllOrigins (Link Preview Fetcher) |

---

# 📂 DATABASE STRUCTURE (โครงสร้างข้อมูล)
ระบบบริหารจัดการข้อมูลผ่าน Google Sheet โดยแยกเป็นแผ่นงานดังนี้:
- **Profile:** จัดเก็บชื่อเว็บ, Bio, และลิงก์รูปภาพ Profile/Cover (คอลัมน์ A-J)
- **Posts:** จัดเก็บเนื้อหา, ลิงก์รูปภาพ, JSON ของการกดใจ และคอมเมนต์
- **Users:** จัดเก็บรายชื่อผู้ใช้งานและสิทธิ์การเข้าถึง (Admin/Public)
- **Links & Apps:** เชื่อมโยงข้อมูลสำหรับเว็บไซต์เวอร์ชันเก่า

---

# 🚀 GETTING STARTED (การเริ่มต้นใช้งาน)
1. **Setup Sheets:** สร้างแผ่นงานตามโครงสร้างที่กำหนด
2. **Deploy script:** นำโค้ด Google Apps Script ไปวางและสั่ง Deploy เป็น Web App
3. **Config API:** นำ URL Web App และ ImgBB API Key มาใส่ในไฟล์ `index.html`
4. **Launch:** อัปโหลดไฟล์ขึ้น GitHub และเปิดใช้งาน GitHub Pages

---

# 👨‍💻 AUTHOR
**koomean**
> "Built with Gemini and Claude, driven by M4 Power."

**Personal Gears:**
- 💻 **Macbook Air M4** (Development Machine)
- 📱 **iPhone 14 Pro** (Testing Device)
- 🗄️ **Synology DS423+** (Home Data Storage)

---
<div align="center">
  <sub>Copyright © 2026 Koo Mean Space. All rights reserved.</sub>
</div>
