<div align="center">

# ✦ Koo Mean Blog

### พื้นที่แบ่งปันโพสต์และอ่านบทความ · v4.0.0

![Frontend](https://img.shields.io/badge/Frontend-HTML%20%2F%20CSS%20%2F%20JS-2563eb?style=flat-square)
![Hosting](https://img.shields.io/badge/Hosting-GitHub%20Pages-24292f?style=flat-square)
![API](https://img.shields.io/badge/API-Cloudflare%20Workers-f38020?style=flat-square)
![Database](https://img.shields.io/badge/Database-D1-7c3aed?style=flat-square)
![Media](https://img.shields.io/badge/Media-R2-0f766e?style=flat-square)

[เปิด Blog](https://blog.koomean.com/) · [การตั้งค่า](#settings) · [ฟีเจอร์](#features) · [เส้นทาง](#routes) · [พัฒนา](#developer)

</div>

<a id="overview"></a>

ฟีดโพสต์และคลังบทความอยู่ที่ [blog.koomean.com](https://blog.koomean.com/) รุ่น 4.0.0 ปรับหน้าอ่านและหน้าตั้งค่าสำหรับเดสก์ท็อปและมือถือ ตัวอักษรไทยใช้ Noto Sans Thai ส่วนข้อความและหัวข้อภาษาละตินใช้ Plus Jakarta Sans และ Bricolage Grotesque เว็บให้บริการไฟล์ฟอนต์จากโดเมน Blog โดยตรง

<a id="settings"></a>
## ⚙️ การแสดงผลและการอ่าน

หน้า [ตั้งค่า](https://blog.koomean.com/settings) จัดกลุ่มการแสดงผล บัญชี และข้อมูลเว็บไซต์ เดสก์ท็อปจัดกลุ่มการตั้งค่าเป็นสองคอลัมน์ ส่วนมือถือเรียงเป็นคอลัมน์เดียว ตัวอย่างการอ่านแสดงธีม สีเน้น ขนาดตัวอักษร และระยะห่างที่เลือกทันที

- **ธีม** · ตามระบบ สว่าง หรือมืด
- **สีเน้น** · น้ำเงิน ม่วง เขียวอมฟ้า หรือชมพู
- **ขนาดตัวอักษร** · ปกติ ใหญ่ หรือใหญ่มาก
- **ระยะห่าง** · สบายตาหรือกระชับ
- **การเคลื่อนไหว** · ตามระบบหรือลดการเคลื่อนไหว

ปรับค่าได้ด้วยตัวเลือกมาตรฐานของเบราว์เซอร์และใช้คีย์บอร์ดได้ ผู้เข้าชมตั้งค่าได้ก่อนเข้าสู่ระบบ ค่าจะเก็บไว้ในเบราว์เซอร์นี้ ปุ่ม **คืนค่าเริ่มต้น** คืนค่าการแสดงผลและธีม โดยเก็บโพสต์ที่บันทึกและแบบร่างไว้

<a id="features"></a>
## ✨ ฟีเจอร์

| ส่วน | ทำอะไรได้ |
|---|---|
| **📝 โพสต์** | อ่านฟีด สร้าง แก้ไข และลบตามสิทธิ์ กดถูกใจ แสดงความคิดเห็น และแชร์โพสต์ |
| **🔎 ค้นหา** | ค้นหาโพสต์ กรองด้วยแฮชแท็ก และเปิดโพสต์หรือแท็กจากลิงก์ที่แชร์ |
| **📚 คลังบทความ** | ค้นหาตามชื่อหรือแท็ก เปิดลิงก์และไฟล์ รวมถึงบทความ HTML แบบโต้ตอบ บทความบางรายการจำกัดตามกลุ่ม สิทธิ์ หรือรหัสผ่าน |
| **🖼️ สื่อ** | อัปโหลดรูปและสื่อของโพสต์ไปยัง Cloudflare R2 พร้อมแสดงสถานะการอัปโหลด |
| **👤 บัญชีและโปรไฟล์** | เข้าสู่ระบบด้วย Google และแก้ไขชื่อที่แสดง ผู้ดูแลจัดการชื่อเว็บ คำแนะนำตัว รูปโปรไฟล์ และรูปปกได้ |
| **💾 บันทึกส่วนตัว** | เก็บแบบร่าง โพสต์ที่บันทึก และการตั้งค่าการอ่านไว้ในเบราว์เซอร์ |
| **📊 โควตา R2** | ผู้ดูแลดูการใช้พื้นที่ จำนวนคำขออ่านและเขียน และสถานะโควตาจากหน้าตั้งค่า |

<a id="routes"></a>
## 🔗 เส้นทางและหน้า 404

แต่ละหน้ารองรับลิงก์ตรง การรีเฟรช และปุ่มย้อนกลับหรือไปข้างหน้าของเบราว์เซอร์

| หน้า | URL |
|---|---|
| หน้าหลัก / โพสต์ | `/` |
| คลังบทความ | `/article` |
| บันทึกไว้ | `/saved` |
| ตั้งค่า | `/settings` |
| ค้นหา | `/search` |

ลิงก์บทความใช้ `/article?article=<rowIdx>` ส่วนลิงก์เดิม `/?article=<rowIdx>` จะเปลี่ยนเป็นเส้นทางนี้ ลิงก์โพสต์ `/?post=<rowIdx>` และลิงก์แท็ก `/?tag=<tag>` ยังใช้ได้ URL ใช้ระบุหน้า รายการ หรือตัวกรอง ส่วนข้อมูลยืนยันตัวตนและรหัสผ่านส่งผ่านคำขอ API

GitHub Pages ให้บริการไฟล์อย่าง `article.html` ที่ `/article` เมื่อเปิดเส้นทางที่ไม่มีอยู่ โฮสต์จะคืน `404.html` พร้อมสถานะ HTTP 404 หากเส้นทางมีอยู่แต่รายการที่ระบุใน query หายไป หน้าเว็บจะแสดงว่าไม่พบรายการหลังจากโหลดข้อมูลสำเร็จ เมื่อ API ขัดข้อง หน้าเว็บจะแสดงปุ่มให้ลองใหม่

<a id="flow"></a>
## 🗄️ ข้อมูลและสิทธิ์

GitHub Pages ให้บริการไฟล์หน้าเว็บ ส่วน Cloudflare Worker รับคำขอ `POST` และตรวจ Google ID token กับสิทธิ์ของผู้ใช้สำหรับคำขอที่ต้องยืนยันตัวตน

| ข้อมูล | ที่เก็บ |
|---|---|
| โพสต์ บัญชีผู้ใช้ สิทธิ์ โปรไฟล์ และข้อมูลกำกับบทความ | Cloudflare D1 |
| รูปโปรไฟล์และรูปปกของเว็บ | Cloudflare D1 (`site_profile_images`) |
| รูปและสื่อที่แนบกับโพสต์ | Cloudflare R2 (`BLOG_ASSETS`) |
| ไฟล์บทความที่อัปโหลด | Google Drive หลังผู้ดูแลอนุญาตสิทธิ์ Drive |
| แบบร่าง โพสต์ที่บันทึก การตั้งค่าการอ่าน และแคชฟีดสาธารณะ | พื้นที่จัดเก็บของเบราว์เซอร์ |

Google ID token และ Drive access token อยู่ในหน่วยความจำของแท็บ เมื่อโหลดหน้าใหม่ต้องเข้าสู่ระบบอีกครั้ง CSP ของ Blog บล็อกสคริปต์และ event handler แบบ inline บทความ HTML แบบโต้ตอบใช้ `/blog-article-sandbox.html` จากโดเมน Worker ใน iframe ที่แยก origin และใช้ `sandbox` ตัว Worker จำกัดหน้าที่ฝัง iframe ได้ให้เหลือโดเมน Blog ส่วน [article-sandbox.html](article-sandbox.html) เป็นไฟล์ต้นฉบับของ shell ที่ใช้เทียบกับสำเนาใน Worker

Worker หยุดการใช้ R2 เมื่อถึงขีดจำกัดที่ 80% ของโควตาฟรีที่ใช้คำนวณ รอบปัจจุบันเริ่มใหม่วันที่ 11 ตาม `R2_QUOTA_RESET_DAY` กลไกนี้ควบคุมการเรียก R2 ภายในแอป ส่วนยอดเรียกเก็บเงินขึ้นอยู่กับ Cloudflare

<a id="developer"></a>
## 🧑‍💻 พัฒนาและเผยแพร่

ต้นฉบับอยู่ใน [`src/`](src/) โดย [`src/index.html`](src/index.html) เป็นหน้าแอป [`src/routing.js`](src/routing.js) จัดการเส้นทาง และ [`src/404.html`](src/404.html) เป็นหน้า 404 แก้การตั้งค่าการอ่านใน [`src/preferences.js`](src/preferences.js), [`src/preferences.css`](src/preferences.css) และ [`src/settings.css`](src/settings.css)

ใช้ Node.js 22 ตาม GitHub Actions และรันจากรากของ repository

```sh
npm ci --ignore-scripts
npm run build
npm test
npx playwright install chromium
npm run test:browser
npm run test:routing
npm run test:performance
npm run verify
```

`npm run build` สร้าง `index.html`, `article.html`, `saved.html`, `settings.html`, `search.html`, `404.html` และไฟล์ JavaScript/CSS ที่มี hash ใน `assets/` โดยเก็บ assets จากรุ่นก่อนหนึ่งชุดเพื่อให้ HTML ที่ยังอยู่ในแคชโหลดได้ แก้ต้นฉบับใน `src/` แล้วรัน build เพื่ออัปเดตไฟล์เหล่านี้

เมื่อ push ไปที่ `main` [GitHub Actions](.github/workflows/pages.yml) จะ build รันชุดทดสอบ Chromium และตรวจ `CNAME` ก่อนเผยแพร่ไฟล์เว็บไปที่ [blog.koomean.com](https://blog.koomean.com/) การย้อนเวอร์ชันทำได้ด้วยการ revert commit แล้วให้ workflow เผยแพร่ใหม่ งาน deploy Worker และ DNS จัดการแยกจาก GitHub Pages

หากต้องทดสอบบน WebKit ให้ติดตั้งด้วย `npx playwright install webkit` แล้วตั้ง `BLOG_BROWSER=webkit` สำหรับ `test:browser`, `test:routing` หรือ `test:performance`

<a id="setup"></a>

### ☁️ ตั้งค่าระบบหลังบ้าน

ใน workspace หลัก Worker อยู่ในโฟลเดอร์ `CloudFlare` โดยใช้ `wrangler.portal.jsonc` และ `koomean-d1-worker.js` ก่อน deploy ให้ตรวจ D1 binding `DB`, R2 binding `BLOG_ASSETS` และ migration ของฐานข้อมูล หากเปลี่ยนโดเมนเว็บ ให้ปรับ `API_URL` และ CSP ของหน้าเว็บให้ตรงกับ Worker ที่เลือก เพิ่ม origin ของเว็บใน `ALLOWED_ORIGINS` และใน **Authorized JavaScript origins** ของ Google OAuth Client แล้วทดสอบผ่าน HTTPS

```sh
npx wrangler deploy --config wrangler.portal.jsonc
```

### 🖼️ ดูแล assets

- รูปสาธารณะที่ปรับขนาดแล้วอ้างอิง URL ต้นฉบับแบบตรงกันใน [`src/media-map.json`](src/media-map.json) หาก URL เปลี่ยน หน้าเว็บจะใช้รูปจากแหล่งเดิม และตัวดูรูปจะแสดงต้นฉบับเต็มความละเอียด
- หากต้องสร้างไฟล์รูปที่ปรับขนาดอีกครั้ง ให้ติดตั้ง Sharp และรัน `BLOG_SHARP_PATH=/path/to/sharp node scripts/optimize-public-media.mjs` จากนั้นตรวจ [`media-optimization.json`](media-optimization.json) และ build ใหม่ สคริปต์อ่านเฉพาะสื่อสาธารณะ
- ฟอนต์และไอคอนใช้ไฟล์ที่โฮสต์กับเว็บ ตรวจเงื่อนไขการใช้งานได้ใน [`licenses/`](licenses/) เมื่อเพิ่มไอคอน ให้ตรวจ CSS mapping และ glyph ของไฟล์ subset ด้วย

ผลตรวจและบันทึกการปรับปรุงก่อนหน้าอยู่ใน [รายงาน 8 ต.ค. 2026](AUDIT-2026-10-08.md) และ [รายงาน 25 ต.ค. 2026](AUDIT-2026-10-25.md) หากพบช่องโหว่ให้ดูวิธีแจ้งใน [`SECURITY.md`](SECURITY.md)
