# ورقة — WARAQA

منشئ السيرة الذاتية الاحترافي **WARAQA CV Builder**.

© 2026 محمد محمود إبراهيم فهيم (Mohamed Mahmoud Ibrahim Fahim). جميع الحقوق محفوظة. All Rights Reserved. See `LICENSE`.

## 🇪🇬 بالعربي

### إيه هو المشروع؟

«ورقة» تطبيق ويب ثابت يساعدك على إنشاء سيرة ذاتية احترافية ومنظمة. بتكتب بياناتك وخبرتك ومهاراتك، وتشوف النتيجة مباشرة، وبعدها تختار القالب واللون وتنزّل سيرتك بصيغة PDF أو Word.

### المميزات

- دعم العربية والإنجليزية مع اتجاهي RTL وLTR.
- معاينة مباشرة للسيرة أثناء الكتابة.
- 6 قوالب احترافية مناسبة لأساليب مختلفة من السير الذاتية:
  - ATS Classic
  - ATS Modern
  - ATS Compact
  - Executive Focus
  - Mint Timeline
  - Profile Photo
- 5 لوحات ألوان مهنية، من ضمنها خيار «من غير ألوان» للطباعة الرسمية.
- إضافة الخبرات والتعليم والمشروعات والشهادات واللغات والأقسام الإضافية.
- ترتيب الأقسام أو إخفاؤها حسب الحاجة.
- عدادات للحروف وحدود عملية تساعد على الحفاظ على سيرة واضحة.
- رفع صورة شخصية اختياري لقالب Profile Photo.
- تصدير PDF مناسب للطباعة والإرسال.
- تصدير Word قابل للتعديل.
- حفظ تلقائي للمسودة على جهاز المستخدم.
- لا يحتاج إلى حساب أو قاعدة بيانات أو خادم لحفظ السيرة.

### الخصوصية

بيانات السيرة والصورة الشخصية تُحفظ محليًا في متصفح المستخدم باستخدام `localStorage`. لا يحتوي المشروع على API أو قاعدة بيانات لحفظ بيانات السير الذاتية.

المكتبات والخطوط الخارجية المستخدمة في المشروع تظل خاضعة لرخصها الخاصة، كما هو موضح في ملف `LICENSE`.

### التقنيات

React 19 · TypeScript · Vite · html2canvas · jsPDF · docx · CSS · npm / pnpm

### التشغيل على جهازك

يحتاج المشروع إلى Node.js حديث وnpm أو pnpm.

```bash
npm ci       # تثبيت الاعتماديات
npm run dev  # تشغيل التطبيق محليًا على http://localhost:3000
npm run build # فحص TypeScript وإنشاء نسخة الإنتاج داخل dist/
```

وبواسطة pnpm:

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm build
```

### النشر

يمكن نشر التطبيق على Netlify أو Vercel أو Cloudflare Pages بإعدادات:

```text
Build command: npm run build
Output directory: dist
```

لا يتطلب التطبيق متغيرات بيئة في صورته الحالية.

### حقوق المشروع

المشروع وكوده وتصميمه وقوالبه ونصوص واجهته ووثائقه وأصوله الخاصة ملك حصري لـ **محمد محمود إبراهيم فهيم**.

لا يُسمح بنسخ المشروع أو تعديله أو إعادة نشره أو بيعه أو استضافته أو استخدامه في مشروع آخر بدون إذن كتابي مسبق. راجع ملف `LICENSE` للتفاصيل.

محتوى السيرة الذي يدخله المستخدم يظل ملكًا للمستخدم نفسه، وتتم معالجته محليًا على جهازه.

---

## 🇬🇧 English

### What is it?

**WARAQA** is a static web application for creating a clean, professional CV. Enter your personal details, experience, education, skills, projects, and certifications, preview the result live, choose a layout and color system, then export your CV as PDF or editable Word.

### Features

- Arabic and English support with full RTL / LTR support.
- Live CV preview while editing.
- Six professional layouts:
  - ATS Classic
  - ATS Modern
  - ATS Compact
  - Executive Focus
  - Mint Timeline
  - Profile Photo
- Five professional color systems, including a black-and-gray option.
- Experience, education, projects, certifications, languages, skills, and custom sections.
- Reorder or hide CV sections.
- Character counters and practical content limits.
- Optional profile photo for the Profile Photo layout.
- PDF export for printing and applications.
- Editable DOCX export.
- Automatic local draft saving.
- No account, server-side database, or CV storage service required.

### Privacy

CV data and the optional profile photo are stored locally in the user’s browser through `localStorage`. This project does not include an API or database for storing CV data.

Third-party libraries and fonts remain under their own licenses. See `LICENSE` for the proprietary project terms and third-party notice.

### Tech stack

React 19 · TypeScript · Vite · html2canvas · jsPDF · docx · CSS · npm / pnpm

### Run locally

Requires a recent Node.js version and npm or pnpm.

```bash
npm ci       # install dependencies
npm run dev  # start the dev server at http://localhost:3000
npm run build # type-check and build the production version to dist/
```

With pnpm:

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm build
```

### Deployment

The application can be deployed to Netlify, Vercel, or Cloudflare Pages with:

```text
Build command: npm run build
Output directory: dist
```

No environment variables are required in the current version.

### License & Copyright

The WARAQA project, including its source code, design, layouts, interface text, documentation, and project-owned assets, is the exclusive property of **Mohamed Mahmoud Ibrahim Fahim**.

You may not copy, modify, redistribute, sell, host, deploy, or use the project or any substantial part of it in another project without prior written permission. See `LICENSE` for the full terms.

User-entered CV content remains the property of the respective user and is processed locally in the user’s browser.

### Contact

For permission requests, contact the copyright holder through the GitHub profile that owns this repository.

- Email: `eng.muhammad.fahim@gmail.com`
- LinkedIn: [Mohamed Mahmoud Ibrahim Fahim](https://www.linkedin.com/in/mohamed-mif-550a132b1/)
