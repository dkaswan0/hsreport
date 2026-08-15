# 🚗 منصة هاي سيفتي لفحص السيارات الذكي (High Safety Vehicle Inspection Platform)

نظام سحابي متكامل ومتقدم لإدارة مراكز فحص وتشخيص السيارات، مصمم خصيصاً لمطابقة أعلى المعايير الخليجية المعتمدة (السعودية، الكويت، الإمارات، قطر، البحرين، عمان)، معزز بالذكاء الاصطناعي للرؤية الحاسوبية وتوليد التقارير التفاعلية وإصدار ملفات الـ PDF الرسمية وتطبيقات الهواتف الذكية (Android APK).

---

## 🌟 أبرز المميزات الرئيسية (Key Features)

### 1. ⚡ الفحص البصري العميق بالذكاء الاصطناعي (Deep AI Visual Defect Diagnosis)
* **كاميرا فحص مباشرة مدمجة (In-App Fault Camera)** مع دعم الفلاش/الكشاف (Flashlight/Torch)، شبكة ضبط المحاذاة، وتبديل الكاميرات.
* **تحليل فوري وتشخيص بصري**: التعرف التلقائي على أجزاء السيارة (الدعامية، الكبوت، الرفارف، غطاء البلوف، الشاصي، المساعدات، الإطارات...).
* **صياغة فورية بأسلوب الفاحص الميداني**: استخراج العطل مباشرة (مثل: *يوجد شحفات بالدعامية*، *الدعامية مبدلة*، *ترشيح زيت حول غطاء البلوف*، *آثار رش تجميلي*) بدون حشو أو مقدمات.
* **تعبئة فورية بضغطة زر (1-Click Fill)**: خيارات أعطال محددة بدرجات الخطورة الملونة لملء النموذج والوصف الفني في ثانية واحدة.

### 2. 📄 تقارير الفحص الرقمية والتفاعلية (Interactive Digital Reports & PDF)
* **رابط مشاركة مباشر للعميل (`/view/:token`)**: صفحة تفاعلية متجاوبة وفاخرة لعرض نتائج الفحص، الصور، ومخططات الهيكل.
* **مخططات هيكل السيارة التفاعلية (2D/3D Body Interactive Diagrams)**: توضيح حالة كل قطعة (سليم، رش تجميلي، صدمة، تعديل، كسر).
* **توليد تقارير PDF رسمية عالية الدقة**: تدعم اللغة العربية والتشكيل الصحيح ومخططات الألوان ورموز الاستجابة السريعة (QR Code).

### 3. 📚 مكتبة الأعطال الخليجية الشاملة (9,639+ Gulf Fault Library)
* قاعدة بيانات ضخمة ومصنفة لجميع أعطال ومصطلحات فحص السيارات المعتمدة بدول الخليج.
* محرك بحث سريع وفوري يدعم الإكمال التلقائي وتصنيف الأقسام (الهيكل، المحرك، القير، الدبل، الشاصي، الكهرباء، العضلات).

### 4. 📱 تطبيق أندرويد متكامل (Native Modern Android App)
* حزمة APK موجهة وموقعة لأحدث إصدارات أندرويد (Android 14 / 15 / 16 - API 34).
* دعم كامل للتحكم في الكاميرا، وضع ملء الشاشة، السحب للتحديث، وتخزين الصور السريع.

### 5. 🛡️ نظام أمان وإدارة صلاحيات قوي (Security & RBAC)
* إدارة مستخدمين متعددة المستويات (مدير النظام، فاحص فني، استقبال).
* تسجيل دخول آمن بجلسات مشفرة وحماية ضد هجمات الـ Brute Force وحماية الـ Rate Limiting.

---

## 🛠️ البنية التقنية (Tech Stack)

| المكون | التقنيات المستخدمة |
| :--- | :--- |
| **الواجهة الأمامية (Frontend)** | React 18, TypeScript, Tailwind CSS, Radix UI, Lucide & Phosphor Icons, Wouter Routing, TanStack React Query |
| **الواجهة الخلفية (Backend)** | Node.js, Express, TypeScript, REST API, WebSockets |
| **قاعدة البيانات (Database)** | PostgreSQL (Neon / Supabase / Render Postgres), Drizzle ORM, Drizzle-Kit |
| **محركات الذكاء الاصطناعي (AI Engines)** | Google Gemini Vision (Gemini 2.5/2.0/1.5 Flash), OpenRouter Fallback, Groq Vision API |
| **توليد ملفات PDF** | PDFMake, Arabic Reshaper, Bidi.js |
| **تطبيق الهاتف (Mobile)** | Android Studio SDK (Java/WebView wrapper, AAPT2, D8, Apksigner) |

---

## 📁 هيكل المشروع (Project Directory Structure)

```text
├── client/                     # الواجهة الأمامية (React SPA)
│   ├── src/
│   │   ├── components/         # المكونات العامة (كاميرا الأعطال، المخططات، النوافذ)
│   │   ├── hooks/              # خطافات البيانات ومزامنة الـ API (use-inspections)
│   │   ├── pages/              # صفحات التطبيق (تفاصيل الفحص، التقرير، الداشبورد)
│   │   └── lib/                # دوال المعالجة المساعدة
├── server/                     # الواجهة الخلفية (Express Server)
│   ├── index.ts                # نقطة تشغيل الخادم
│   ├── routes.ts               # مسارات الـ REST API
│   ├── storage.ts              # طبقة التعامل مع قاعدة البيانات (Database Storage)
│   ├── auth.ts                 # المصادقة وإدارة الجلسات
│   └── services/               # الخدمات السحابية (image-analysis, pdf, studio...)
├── shared/                     # المخططات المشتركة بين الفرونت والباك
│   ├── schema.ts               # جداول قاعدة البيانات (Drizzle Schema)
│   └── routes.ts               # مسارات وعقود الـ API (Zod Contracts)
├── android/                    # ملفات مشروع أندرويد الأصلي
│   └── app/src/main/           # كود جافا والموارد للأندرويد
├── build_apk.py                # سكربت التجميع والتوقيع التلقائي لملف الـ APK
├── HighSafetyReport.apk        # التطبيق الجاهز للتثبيت على هواتف الأندرويد
└── dist/                       # حزمة الإنتاج المبنية للتشغيل السحابي
```

---

## 🚀 التشغيل والتثبيت محلياً (Local Development Setup)

### المتطلبات الأساسية:
* **Node.js** الإصدار 18 أو 20+
* **قاعدة بيانات PostgreSQL** (سواء محلية أو سحابية من Neon/Supabase)
* **Python 3.9+** (اختياري لبناء حزم الـ APK وأدوات معالجة الصور)

### خطوات التشغيل:

1. **تثبيت الحزم والمكتبات:**
   ```bash
   npm install
   ```

2. **إعداد متغيرات البيئة (`.env`):**
   قم بإنشاء ملف `.env` في المجلد الرئيسي وضع المتغيرات التالية:
   ```env
   DATABASE_URL=postgresql://username:password@ep-your-db-host.neon.tech/highsafety?sslmode=require
   SESSION_SECRET=your_super_secret_session_key_here
   PORT=5000
   NODE_ENV=development
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```

3. **مزامنة جداول قاعدة البيانات:**
   ```bash
   npm run db:push
   ```

4. **تشغيل خادم التطوير:**
   ```bash
   npm run dev
   ```
   * سيعمل التطبيق محلياً على: `http://localhost:5000`

---

## 🏗️ أوامر البناء والإنتاج (Build & Production Scripts)

| الأمر | الوظيفة |
| :--- | :--- |
| `npm run check` | فحص توافق الشيفرة البرمجية وأنواع الـ TypeScript بدون أخطاء |
| `npm run build` | بناء حزمة الإنتاج المحسنة للفرونت إند والباك إند داخل مجلد `dist/` |
| `npm start` | تشغيل التطبيق في بيئة الإنتاج السحابية من ملف `dist/index.cjs` |
| `python build_apk.py` | تجميع وتوقيع تطبيق الأندرويد `HighSafetyReport.apk` تلقائياً |

---

## 🌐 النشر السحابي (Deployment Guide)

المشروع جاهز تماماً للنشر على منصات مثل **Render**, **Railway**, أو **VPS**:

### النشر على Render:
1. أنشئ **Web Service** جديدة واربطها بمستودع GitHub.
2. **Environment**: `Node`
3. **Build Command**:
   ```bash
   npm install && npm run build
   ```
4. **Start Command**:
   ```bash
   npm start
   ```
5. في قسم **Environment Variables**، أضف:
   * `DATABASE_URL`
   * `SESSION_SECRET`
   * `NODE_ENV=production`
   * `GEMINI_API_KEY`

---

## 📱 بناء تطبيق الأندرويد (Android APK Build)

يحتوي المشروع على أداة مؤتمتة `build_apk.py` تقوم بتجميع وتوقيع الـ APK مباشرة بدون الحاجة لفتح Android Studio:

```bash
python build_apk.py
```
* المخرجات: ملف `HighSafetyReport.apk` جاهز وموقع بمفاتيح التشفير ومتوافق مع Android 14 و 15.

---

## 📄 الترخيص (License)
هذا المشروع مرخص تحت رخصة **MIT License**. جميع الحقوق محفوظة لمركز الفحص الفني.
