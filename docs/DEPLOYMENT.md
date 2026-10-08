# رفع ونشر WARAQA

## قبل الرفع

1. شغّل `pnpm install --frozen-lockfile`.
2. شغّل `pnpm run build` وتأكد من إنشاء `dist/`.
3. لا ترفع `node_modules/` أو `dist/` أو ملفات `.env`.
4. راجع `git diff` و`git status` وابحث عن أسرار قبل الدفع.

## GitHub لأول مرة

أنشئ مستودعًا فارغًا في GitHub، ثم من جذر المشروع:

```bash
git init
git add .
git commit -m "Initial Waraqa CV builder documentation"
git branch -M main
git remote add origin <رابط-المستودع>
git push -u origin main
```

إذا كان لديك remote سابق:

```bash
git remote -v
git add .
git commit -m "Update Waraqa"
git push
```

لا تستبدل `<رابط-المستودع>` برابط تخميني؛ استخدم رابط مستودعك الحقيقي فقط.

## إعدادات الاستضافة

التطبيق static SPA ولا يحتاج خادمًا أو متغيرات بيئة.

| الإعداد | القيمة |
|---|---|
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm run build` |
| Output directory | `dist` |
| Node version | 22 أو نسخة متوافقة مع TypeScript/Vite |
| Environment variables | لا شيء مطلوب حاليًا |

في Vercel، اختر **Other** أو **Vite** عند استيراد المستودع، ثم استخدم القيم السابقة. لا تحتاج إلى `vercel.json` حاليًا لأن التطبيق يستخدم المسار `/` فقط ولا يعتمد على API أو متغيرات بيئة.

## التحقق بعد النشر

- افتح الرابط في نافذة خاصة.
- جرّب اللغة العربية والإنجليزية.
- بدّل القوالب الستة ولوحات الألوان.
- أضف نصًا طويلًا ومهارات متعددة وتحقق من الصفحات.
- صدّر PDF وDOCX وافتحهما محليًا.
- تحقق من أن الصفحة المنشورة لا تعرض رسائل build أو ملفات source map غير مقصودة.

## التحديثات اللاحقة

```bash
git pull
git add .
git commit -m "Describe the change"
git push
```

ستعيد الاستضافة البناء تلقائيًا عند ربطها بالمستودع. إن لم يكن البناء تلقائيًا، شغّل deploy من لوحة الاستضافة بعد التأكد من نجاح `npm run build` محليًا.

## القيود والخصوصية

النشر يجعل ملفات JavaScript العامة متاحة للزوار، لكنه لا يرسل مسودات `localStorage` إلى مالك الموقع. لا تضف خدمة تحليلات أو API أو متغيرات سرية دون توثيقها وتحديث سياسة الخصوصية.
