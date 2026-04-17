#🚀 Koo Mean Space (KooMeanBlog)
A Modern Personal Micro-Blogging Platform แพลตฟอร์มพื้นที่ส่วนตัวสำหรับบันทึกเรื่องราว (Space) ที่รวมความทันสมัยของ UI และความเรียบง่ายของการใช้ Google Sheets เป็นระบบหลังบ้าน

##✨ Features (คุณสมบัติ)
OLED Black Design: UI สวยงาม ทันสมัย รองรับ Dark Mode เต็มรูปแบบ ประหยัดพลังงานสำหรับหน้าจอ OLED

Responsive UI: ใช้งานได้สมบูรณ์แบบทั้งบนคอมพิวเตอร์และมือถือ (Mobile-First Experience)

Admin Control: ระบบหลังบ้านที่จัดการโดยคุณมีนเพียงคนเดียว (Admin) สามารถ โพสต์, แก้ไข, และลบเนื้อหาได้จากหน้าเว็บ

Social Engagement: ผู้ใช้ทั่วไปสามารถ Login ผ่าน Google เพื่อกด Like และแสดงความคิดเห็น (Comment) ได้

Media Support: * รองรับการอัปโหลดรูปภาพผ่าน ImgBB API โดยอัตโนมัติ

รองรับการแสดงผลวิดีโอจาก YouTube อัตโนมัติเมื่อแปะลิงก์

Smart Link Preview: ระบบตรวจจับลิงก์และดึงข้อมูล Preview (รูปปก/หัวข้อ) จากเว็บไซต์ต่างๆ มาแสดงผลแบบการ์ดสวยๆ

Skeleton Loading: ระบบโหลดข้อมูลแบบนุ่มนวล มอบประสบการณ์ใช้งานที่ลื่นไหล

Editable Content: ระบบแก้ไขข้อความพร้อมประทับเวลา "แก้ไขแล้วเมื่อ..." สำหรับโพสต์และคอมเมนต์

##🛠 Tech Stack (เทคโนโลยีที่ใช้)
Frontend: Vanilla JavaScript, HTML5, CSS3 (Modern Flexbox/Grid)

Backend: Google Apps Script (GAS)

Database: Google Sheets

Authentication: Google Sign-In API

Image Hosting: ImgBB API

CORS Bypass: AllOrigins (สำหรับระบบ Link Preview)

##📂 Database Structure (โครงสร้าง Google Sheets)
โปรเจกต์นี้ใช้ไฟล์ Google Sheet เดียวกันในการบริหารจัดการ โดยแบ่งเป็นแผ่นงานดังนี้:

Users: เก็บข้อมูลผู้ใช้งาน, บทบาท (Admin/Public), และประวัติการเข้าใช้งาน

Profile: เก็บข้อมูลส่วนตัว เช่น ชื่อเว็บ, Bio, รูป Profile (Circle), และรูป Cover (Rect)

Posts: เก็บข้อมูลโพสต์ทั้งหมด, ลิงก์รูปภาพ, ข้อมูลการกด Like และ Comment (JSON Format)

Links & Apps: สำหรับเชื่อมต่อข้อมูลกับเว็บไซต์เวอร์ชันเก่า

##🚀 Getting Started (การติดตั้ง)
Google Sheets: สร้างไฟล์และตั้งชื่อแผ่นงานให้ตรงตามโครงสร้าง

Apps Script: คัดลอกโค้ดหลังบ้านไปวางและสั่ง Deploy เป็น Web App

Configuration: นำ URL ที่ได้จาก Apps Script มาใส่ในไฟล์ index.html

ImgBB Key: ใส่ API Key ของ ImgBB เพื่อใช้งานระบบอัปโหลดรูปภาพ

GitHub Pages: อัปโหลดไฟล์ขึ้น Repository และเปิดใช้งาน Pages

##👨‍💻 Author
Name: koomean

Device: Macbook Air M4, Gemini 3 Pro, Claude

Storage: Github, ImgBB, Google Sheet

This project is built with passion and optimized for a seamless personal blogging experience.
