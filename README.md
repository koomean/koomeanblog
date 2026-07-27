<div align="center">

# 🚀 KOO MEAN BLOG
### **A Premium Personal Micro-Blogging & Document Platform**

[![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)]()
[![Platform](https://img.shields.io/badge/Platform-GitHub_Pages-blue?style=for-the-badge)]()
[![Proxy](https://img.shields.io/badge/Proxy-Cloudflare_Worker-orange?style=for-the-badge)]()
[![Backend](https://img.shields.io/badge/Backend-Google_Apps_Script-green?style=for-the-badge)]()
[![Auth](https://img.shields.io/badge/Auth-Google_Identity-white?style=for-the-badge)]()

</div>

---

# 🌟 OVERVIEW (ภาพรวมโปรเจกต์)

**Koo Mean Space** คือแพลตฟอร์มโซเชียลมีเดียส่วนตัวแบบ Micro-blogging ที่ใช้ **Google Sheets เป็นฐานข้อมูล 100%** พร้อมระบบ **คลังบทความ/เอกสาร** ที่เก็บไฟล์จริงไว้บน Google Drive และจำกัดสิทธิ์การเข้าถึงได้รายไฟล์

ทั้งเว็บอยู่ในไฟล์ `index.html` ไฟล์เดียว (HTML + CSS + JS รวมกัน) ไม่มี build step ไม่มี framework — แก้เสร็จอัปขึ้น GitHub Pages ได้เลย

---

# 🏗️ ARCHITECTURE (สถาปัตยกรรม)

```
เบราว์เซอร์ (index.html)
        │
        │  POST / GET  (application/x-www-form-urlencoded)
        ▼
Cloudflare Worker  ── koomean-proxy.meanchannel52.workers.dev
        │           • ซ่อน URL จริงของ Apps Script ไว้ใน env var "UPSTREAM"
        │           • ใส่ CORS header
        │           • แคชคำตอบของ action ประเภทอ่านไว้ที่ edge (worker.js)
        ▼
Google Apps Script (doGet / doPost)
        │           • ตรวจ Google ID Token
        │           • Rate limit + Circuit breaker
        │           • CacheService (posts 5 นาที / meta 30 นาที)
        ├──────────► Google Sheets  ──  Posts · Users · Profile · Articles · Log
        ├──────────► Google Drive   ──  โฟลเดอร์ KooMean_Articles (ไฟล์บทความ)
        └──────────► ImgBB API      ──  รูปภาพในโพสต์
```

> 🔒 หน้าเว็บ **ไม่เคยรู้ URL จริงของ Apps Script** และ **ไม่เคยเห็น ImgBB API Key** — การอัปโหลดรูปส่งผ่าน backend ทั้งหมด

---

# ✨ KEY FEATURES (คุณสมบัติที่มีอยู่จริง)

### 📝 Posts & Social
- เขียน / แก้ไข / ลบโพสต์ พร้อมประทับเวลา *"แก้ไขแล้วเมื่อ..."* อัตโนมัติ
- **สิทธิ์โพสต์** เปิดให้ role ที่มีคำว่า `admin` หรือ `blog` — คนอื่นอ่าน กดใจ และคอมเมนต์ได้
- **Like** และ **Comment** — ผู้ใช้แก้ไข/ลบคอมเมนต์ของตัวเองได้
- **Hashtag** — ใส่แท็กในโพสต์ กดเพื่อกรองเฉพาะแท็กนั้น พร้อมแถบ Trends ในไซด์บาร์
- **นับยอดวิว** ต่อโพสต์ (นับครั้งเดียวต่อ session)
- **บันทึกโพสต์ (Saved)** เก็บไว้ในเครื่อง ดูย้อนหลังได้
- **Draft อัตโนมัติ** — พิมพ์ค้างไว้แล้วปิดหน้าไป กลับมาข้อความยังอยู่
- **แชร์ลิงก์เฉพาะโพสต์** ผ่าน `?post=` และแชร์แท็กผ่าน `?tag=`

### 📚 Articles & Documents
- อัปโหลดไฟล์เข้า **Google Drive** ได้โดยตรงจากหน้าเว็บ (สูงสุด ~21 MB/ไฟล์)
  รองรับ **PDF · HTML/HTM · รูปภาพ · DOC/DOCX · PPT/PPTX · XLS/XLSX · CSV** หรือจะบันทึกเป็น**ลิงก์ภายนอก**เฉยๆ ก็ได้
- **จำกัดสิทธิ์รายไฟล์** ด้วยคอลัมน์ `Group` — เว้นว่างคือทุกคนเห็น
- **ตั้งรหัสผ่านรายไฟล์** ได้ (เก็บเป็น hash ไม่ใช่ข้อความจริง)
- จัดลำดับการแสดงผลเอง (`moveArticle`) · ใส่แท็ก · นับยอดเปิดอ่าน
- เปิดอ่านในหน้าเว็บได้เลยผ่าน viewer ในตัว · แชร์ผ่าน `?article=`

### 🖼️ Smart Media & Link
- **อัปโหลดรูปในโพสต์** (PNG/JPEG/GIF/WebP) ผ่าน ImgBB — มีแถบแสดงความคืบหน้าจริงระหว่างอัปโหลด
- **YouTube Embed** — วางลิงก์แล้วกลายเป็นเครื่องเล่นทันที
- **Link Preview Card** — ดึงรูปปก/หัวข้อ/คำอธิบายจาก `api.microlink.io` และถ้าไม่ได้ผลจะลอง `api.dub.co` ต่อให้
  โหลดแบบ lazy (เฉพาะการ์ดที่ใกล้จะเลื่อนถึง) และ**แคชไว้ในเครื่อง 24 ชั่วโมง**
- **Lightbox** ดูรูปเต็มจอ ซูมและลากได้

### 🎨 UI / UX
- เลย์เอาต์ 3 คอลัมน์บนจอใหญ่ (ไซด์บาร์ซ้าย · ฟีด · ไซด์บาร์ขวา) และแถบนำทางล่างบนมือถือ
- **สลับธีมสว่าง/มืด** ได้ จำค่าไว้ในเครื่อง
- **Skeleton Loading** + **แคชฟีดในเครื่อง 5 นาที** → เปิดเว็บซ้ำเห็นเนื้อหาทันทีไม่ต้องรอ API
- **ค้นหาโพสต์** — แบบ dropdown บนจอใหญ่ และเต็มหน้าจอบนมือถือ
- **Emoji picker** ในกล่องเขียนโพสต์
- **รีเฟรชโพสต์อัตโนมัติทุก 25 วินาที** และ**หยุดทำงานเมื่อผู้ใช้สลับแท็บ** แล้วเช็คทันทีที่กลับมา
- รองรับ `prefers-reduced-motion`

### 🔑 Auth & Profile
- ล็อกอินผ่าน Google Identity Services (GSI) ด้วย ID Token
- จำเซสชันใน `localStorage` และ**เช็ควันหมดอายุของ token ก่อนใช้ซ้ำ** — หมดอายุแล้วเคลียร์ทิ้งอัตโนมัติ
- แก้ชื่อที่แสดงของตัวเองได้ · แอดมินแก้โปรไฟล์ของ Space (ชื่อเว็บ, bio, handle, รูปโปรไฟล์, รูปปก) ได้จากหน้าเว็บ
- เจอ 429 จาก backend → พักการยิง 20 วินาที แล้วแจ้งผู้ใช้

---

# 🛠️ TECH STACK

| ส่วนงาน | เทคโนโลยีที่ใช้ |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Flexbox/Grid + Custom Properties), Vanilla JavaScript (ES2020+) |
| **Proxy** | Cloudflare Workers |
| **Backend** | Google Apps Script (Web App) |
| **Database** | Google Sheets |
| **File Storage** | Google Drive (บทความ) · ImgBB API (รูปในโพสต์) |
| **Auth** | Google Identity Services (GSI) |
| **Link Preview** | microlink.io → dub.co (fallback) |
| **Icons** | Font Awesome 6.5.0 (cdnjs) |
| **Fonts** | Plus Jakarta Sans + Bricolage Grotesque (Google Fonts) |

---

# 📂 DATABASE STRUCTURE (โครงสร้างชีต)

### `Posts`
| A | B | C | D | E | F | G | H | I | J |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| Timestamp | Email | Content | Likes | Comments | MediaUrl | EditedTime | Link | Hashtags | Views |

> `Likes` และ `Comments` เก็บเป็น JSON string · ระบบส่งกลับสูงสุด 200 โพสต์ล่าสุด

### `Articles`
| A | B | C | D | E | F | G | H | I | J | K | L | M |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| Title | Type | FileId | Url | Description | UploadedBy | Date | Mime | Group | Password | Tags | Order | Views |

- `Type` = `pdf` · `html` · `image` · `link` ฯลฯ · ถ้าเป็น `link` จะใช้คอลัมน์ `Url` แทน `FileId`
- `Group` = เว้นว่างคือทุกคนเห็น · ใส่ชื่อ role คั่นด้วย `,` เพื่อจำกัดสิทธิ์
- `Password` = เก็บเป็น hash เท่านั้น

### `Users`
| A | B | C | D | E | F | G |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| Email | Name | Role | Last Login | Notes | Pic | Created |

> `Role` เป็นข้อความอิสระ ใส่ได้หลายค่าคั่นด้วย `,` `;` `|` — คำที่มีความหมายพิเศษคือ `admin` (สิทธิ์สูงสุด) และ `blog` (โพสต์ได้)

### `Profile` — ใช้แถวที่ 2 แถวเดียว
| F | G | H | I | J | K |
| :-- | :-- | :-- | :-- | :-- | :-- |
| WebTitle | SpaceName | SpaceBio | SpaceImageUrl | CoverUrl | Handle |

> คอลัมน์ A-E ของชีตเดียวกันใช้ร่วมกับเว็บ Koo Mean SITE

### `Log`
บันทึกเหตุการณ์อัตโนมัติ (ล็อกอิน, โพสต์, อัปโหลด, ข้อผิดพลาด) — ระบบสร้างให้เองเมื่อใช้งานครั้งแรก

---

# 💾 LOCAL STORAGE KEYS

| Key | เก็บอะไร | อายุ |
| :-- | :-- | :-- |
| `kms_v3` | เซสชันผู้ใช้ + ID Token | ตามอายุ token (~1 ชม.) |
| `kms_blog_cache_v4` | ฟีดโพสต์ล่าสุด (ให้เปิดซ้ำแล้วเห็นทันที) | 5 นาที |
| `kms_link_preview_cache_v1` | ข้อมูล preview ของลิงก์ | 24 ชั่วโมง |
| `kms_saved_v1` | รายการโพสต์ที่บันทึกไว้ | ถาวร |
| `kms_draft_v1` | ร่างโพสต์ที่ยังไม่ได้ส่ง | จนกว่าจะโพสต์ |
| `kms_theme` | ธีมสว่าง/มืด | ถาวร |

---

# 🔌 API ACTIONS ที่หน้านี้เรียกใช้

| กลุ่ม | Actions |
| :-- | :-- |
| **อ่าน** | `all` · `postsOnly` · `listArticles` · `articleContent` |
| **บัญชี** | `register` · `updateUserName` · `updateProfile` |
| **โพสต์** | `addPost` · `editPost` · `deletePost` · `toggleLike` · `uploadImage` |
| **คอมเมนต์** | `addComment` · `editComment` · `deleteComment` |
| **บทความ** | `uploadArticle` · `updateArticle` · `deleteArticle` · `moveArticle` · `unlockArticleByPassword` |
| **สถิติ** | `trackPostView` · `trackArticleView` |

> การอ่านข้อมูลส่งผ่าน **POST** เพื่อไม่ให้ `idToken` ติดไปกับ URL

---

# 🚀 GETTING STARTED (การเริ่มต้นใช้งาน)

1. **Google Sheet** — สร้างชีตชื่อ `Posts`, `Users`, `Profile`, `Articles` ตามโครงสร้างด้านบน
   (ชีต `Articles` และ `Log` ระบบสร้างให้เองอัตโนมัติเมื่อใช้งานครั้งแรก)
2. **ImgBB** — สมัคร API Key แล้วใส่ที่ `CONFIG.IMGBB_KEY` **ใน Apps Script เท่านั้น** ห้ามใส่ในหน้าเว็บ
3. **Apps Script** — วางโค้ด `BackEnd.gs` แล้ว Deploy เป็น Web App
   (Execute as: *Me* · Who has access: *Anyone*) แล้วคัดลอก URL `/exec` เก็บไว้
   ครั้งแรกที่อัปโหลดบทความ ระบบจะขอสิทธิ์ Drive และสร้างโฟลเดอร์ `KooMean_Articles` ให้เอง
4. **Google Cloud Console** — สร้าง OAuth Client ID (Web application)
   ใส่โดเมนของ GitHub Pages ใน *Authorized JavaScript origins*
   แล้วนำ Client ID ไปใส่ทั้งใน `index.html` (`data-client_id`) และใน `CONFIG.GOOGLE_CLIENT_ID` ของ Apps Script — **ต้องตรงกัน ไม่งั้นล็อกอินไม่ผ่าน**
5. **Cloudflare Worker** — วางโค้ด `worker.js` แล้วตั้ง Environment Variable
   `UPSTREAM` = URL `/exec` จากข้อ 3 · จากนั้นนำ URL ของ Worker ไปใส่ที่ตัวแปร `API_URL` ใน `index.html`
6. **Deploy** — อัป `index.html` ขึ้น GitHub แล้วเปิด GitHub Pages

---

# ⚡ PERFORMANCE NOTES

สิ่งที่ทำไปแล้วเพื่อให้หน้าเว็บเบาและคะแนน PageSpeed ดีขึ้น:

- **Google Sign-In โหลดแบบ on-demand** — ไม่ดาวน์โหลด 98 KB ให้คนที่แค่เข้ามาอ่านบล็อกเฉยๆ
  โหลดตอนผู้ใช้แตะ/เลื่อน/พิมพ์ครั้งแรก หรือตอนเปิดหน้าต่างล็อกอิน
- **ตัดน้ำหนักฟอนต์ที่ไม่ได้ใช้** — Bricolage Grotesque เหลือเฉพาะ 800 (เดิมโหลด 700 มาด้วยทั้งที่ CSS ไม่เรียกใช้เลยสักจุด)
  ฟอนต์ตัวนี้เป็น variable font `opsz@12..96` ไฟล์ละ ~77 KB จึงประหยัดได้เยอะ
- **`preconnect`** ไปยัง API, cdnjs และ Google Fonts ตั้งแต่บรรทัดแรกของ `<head>`
- **`<img>` อวาตาร์ทุกตัวระบุ `width`/`height`** เพื่อไม่ให้ฟีดกระตุกตอนโหลดรูป (CLS)
  *(รูปในโพสต์ไม่ใส่ เพราะขนาดไม่แน่นอนตามที่ผู้ใช้อัปโหลด)*
- **Link preview โหลดแบบ lazy** เฉพาะการ์ดที่ใกล้จะเลื่อนถึง + แคชในเครื่อง 24 ชม.
- **แคชฟีดในเครื่อง 5 นาที** → เปิดเว็บซ้ำเห็นเนื้อหาก่อน แล้วค่อยอัปเดตเบื้องหลัง
- **Edge cache ที่ Cloudflare Worker** — Apps Script มี latency พื้นฐาน 2-3 วินาทีต่อ request
  ที่ frontend แก้ไม่ได้ `worker.js` จึงแคชคำตอบของ action ประเภทอ่านไว้ที่ edge (แยกแคชตามสิทธิ์ผู้ใช้)

---

# 👨‍💻 AUTHOR
**koomean**
> "Built with ChatGPT 5.6 Sol and Claude Fable 5, driven by M5 Power."

**Personal Gears:**
- 💻 **Macbook Air M5** (Development Machine)
- 📱 **iPhone 14 Pro** (Testing Device)
- 🗄️ **Synology DS423+** (Home Data Storage)

---
<div align="center">
  <sub>Copyright © 2026 koomean. All rights reserved.</sub>
</div>
