/**
 * نقطة تنسيق التطبيق: تملك الحالة العامة، تحفظ المسودة محليًا، وتربط المحرر
 * بالمعاينة والتصدير. لا تبني هذا الملف محتوى السيرة بنفسه؛ بل يمرر CVData
 * إلى Editor وCVPreview ويحافظ على اختيارات المستخدم.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Editor from './components/Editor';
import CVPreview from './components/CVPreview';
import { cvColorIds, cvColorPalettes, emptyData, getTemplatePalette, sampleData, templateMeta } from './data';
import { exportPdf, exportWord } from './export';
import type { CVColorId, CVData, EditorSection, TemplateId } from './types';

type Lang = 'en' | 'ar';
const templateIds: TemplateId[] = ['classic', 'modern', 'compact', 'executive', 'mint', 'photo'];
const tx = (lang: Lang, en: string, ar: string) => lang === 'ar' ? ar : en;

/** يقرأ آخر مسودة، يدمجها مع قيم المثال لحماية الحقول الجديدة، ويعود للمثال عند فساد JSON. */
function loadInitialData(): CVData {
  try {
    const saved = localStorage.getItem('cvcraft-data');
    if (!saved) return sampleData();
    const parsed = JSON.parse(saved) as Partial<CVData>;
    const isLegacySample = parsed.personal?.fullName === 'سارة العتيبي' || parsed.personal?.location?.includes('الرياض');
    if (isLegacySample) return sampleData();
    const defaults = sampleData();
    const validSectionIds = ['summary','experience','education','skills','projects','certifications','languages','additional'] as const;
    const storedOrder = Array.isArray(parsed.sectionOrder)
      ? parsed.sectionOrder.filter((x): x is typeof validSectionIds[number] => validSectionIds.includes(x as typeof validSectionIds[number]))
      : [];
    const sectionOrder = [...new Set(storedOrder)];
    return {
      ...defaults,
      ...parsed,
      personal: { ...defaults.personal, ...(parsed.personal ?? {}) },
      sectionOrder: sectionOrder.length ? sectionOrder : defaults.sectionOrder,
      hiddenSections: Array.isArray(parsed.hiddenSections) ? parsed.hiddenSections : defaults.hiddenSections,
      summary: typeof parsed.summary === 'string' ? parsed.summary : defaults.summary,
      experiences: Array.isArray(parsed.experiences) ? parsed.experiences : defaults.experiences,
      education: Array.isArray(parsed.education) ? parsed.education : defaults.education,
      technicalSkills: Array.isArray(parsed.technicalSkills) ? parsed.technicalSkills : defaults.technicalSkills,
      softSkills: Array.isArray(parsed.softSkills) ? parsed.softSkills : defaults.softSkills,
      projects: Array.isArray(parsed.projects) ? parsed.projects : defaults.projects,
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : defaults.certifications,
      languages: Array.isArray(parsed.languages) ? parsed.languages : defaults.languages,
      additional: Array.isArray(parsed.additional) ? parsed.additional : defaults.additional,
    };
  } catch {
    return sampleData();
  }
}

/** ينسق الحالة العامة ويربط إجراءات المستخدم بالمحرر والمعاينة والتصدير. */
function App() {
  const [data, setData] = useState<CVData>(loadInitialData);
  const [template, setTemplate] = useState<TemplateId>(() => {
    const saved = localStorage.getItem('cvcraft-template') as TemplateId | null;
    return saved && templateIds.includes(saved) ? saved : 'compact';
  });
  const [colorTheme, setColorTheme] = useState<CVColorId>(() => {
    const saved = localStorage.getItem('cvcraft-color') as CVColorId | null;
    return saved && cvColorIds.includes(saved) ? saved : 'blue';
  });
  const [lang, setLang] = useState<Lang>(() => localStorage.getItem('cvcraft-lang') === 'ar' ? 'ar' : 'en');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [pageCount, setPageCount] = useState(1);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<EditorSection>('personal');
  const [notice, setNotice] = useState('');

  useEffect(() => { localStorage.setItem('cvcraft-data', JSON.stringify(data)); }, [data]);
  useEffect(() => { localStorage.setItem('cvcraft-template', template); }, [template]);
  useEffect(() => { localStorage.setItem('cvcraft-color', colorTheme); }, [colorTheme]);
  useEffect(() => {
    localStorage.setItem('cvcraft-lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 3400);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const activePalette = getTemplatePalette(template, colorTheme);
  const handlePageCountChange = useCallback((count: number) => setPageCount((current) => current === count ? current : count), []);

  const completion = useMemo(() => {
    const checks = [
      Boolean(data.personal.fullName.trim()), Boolean(data.personal.title.trim()), Boolean(data.personal.email.trim()),
      Boolean(data.summary.trim()), data.experiences.length > 0, data.education.length > 0,
      data.technicalSkills.length + data.softSkills.length > 0, data.projects.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [data]);

  const changeTemplate = (id: TemplateId) => {
    setTemplate(id);
    setGalleryOpen(false);
    setPaletteOpen(false);
    setNotice(tx(lang, `${lang === 'ar' ? templateMeta[id].nameAr : templateMeta[id].name} selected — your content stays intact.`, `اختارت ${templateMeta[id].nameAr} — بياناتك زي ما هي.`));
  };
  const changeColorTheme = (id: CVColorId) => {
    setColorTheme(id);
    setPaletteOpen(false);
    setNotice(tx(lang, `${cvColorPalettes[id].name.en} applied to your CV.`, `طبّقنا ألوان ${cvColorPalettes[id].name.ar} على سيرتك.`));
  };
  const startBlank = () => {
    if (window.confirm(tx(lang, 'Start with a blank CV? Your current draft will be replaced.', 'عايز تبدأ بسيرة فاضية؟ ده هيستبدل المسودة الحالية.'))) {
      setData(emptyData());
      setActiveSection('personal');
      setMode('edit');
      setNotice(tx(lang, 'Blank CV ready — start with your name and professional title.', 'السيرة الفاضية جاهزة — ابدأ باسمك ومسمّاك المهني.'));
    }
  };
  const hasRequiredDetails = () => {
    const missingName = !data.personal.fullName.trim();
    const missingTitle = !data.personal.title.trim();
    if (missingName || missingTitle) {
      setActiveSection('personal');
      setMode('edit');
      setNotice(tx(lang, 'Add your required name and professional title before exporting.', 'ضيف اسمك ومسمّاك المهني قبل ما تصدّر.'));
      window.setTimeout(() => document.getElementById(missingName ? 'full-name' : 'professional-title')?.focus(), 60);
      return false;
    }
    return true;
  };
  const handlePdf = async () => {
    if (!hasRequiredDetails()) return;
    try {
      const downloaded = await exportPdf(colorTheme, template);
      setNotice(downloaded ? tx(lang, 'PDF downloaded directly.', 'تم تنزيل ملف PDF مباشرة.') : tx(lang, 'PDF could not be generated. Please try again.', 'تعذر إنشاء ملف PDF. حاول مرة أخرى.'));
    } catch {
      setNotice(tx(lang, 'PDF could not be generated. Please try again.', 'تعذر إنشاء ملف PDF. حاول مرة أخرى.'));
    }
  };
  const handleWord = async () => {
    if (!hasRequiredDetails()) return;
    try {
      await exportWord(data, template, lang, colorTheme);
      setNotice(tx(lang, 'Editable Word document downloaded.', 'ملف Word القابل للتعديل نزل عندك.'));
    } catch {
      setNotice(tx(lang, 'Word export could not finish. Please try again.', 'ماقدرناش نكمّل تصدير Word. جرّب تاني.'));
    }
  };

  return <div className={`app-shell lang-${lang}`}>
    <header className="topbar">
      <div className="brand" aria-label="Waraqa">
        <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" role="presentation"><path d="M7 5.5h12l6 6V26H7z" /><path d="M19 5.5v6h6M11 16h10M11 20h10" /></svg></span>
        <span className="brand-copy"><strong>ورقة</strong><small>WARAQA</small></span>
      </div>
      <div className="save-status"><span className="save-dot" />{tx(lang, 'Saved on this device', 'محفوظ على جهازك')}<span className="ats-label">ATS {tx(lang, 'friendly', 'مناسب')}</span></div>
      <div className="topbar-actions">
        <button type="button" className="language-button" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>{lang === 'en' ? 'العربية' : 'English'}</button>
        <button type="button" className="text-button" onClick={startBlank}>{tx(lang, 'Start blank', 'ابدأ من الأول')}</button>
        <button type="button" className="primary-button" onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}>
          {mode === 'edit' ? tx(lang, 'Full preview', 'معاينة كاملة') : tx(lang, 'Back to editor', 'ارجع للتعديل')}<span aria-hidden="true">{mode === 'edit' ? '↗' : '↙'}</span>
        </button>
      </div>
    </header>

    <main className="workspace">
      <section className="workspace-heading">
        <div className="heading-copy">
          <p className="eyebrow">{tx(lang, 'CV WORKSPACE · YOUR STORY, CLEARLY TOLD', 'مساحة سيرتك · احكي قصتك المهنية بوضوح')}</p>
          <h1>{tx(lang, 'Get it done on ', 'خلّصها في ')}<em>{tx(lang, 'WARAQA.', 'ورقة.')}</em></h1>
          <p className="intro">{tx(lang, 'Turn your experience, skills, and achievements into a professional CV ready for your next opportunity.', 'حوّل خبرتك ومهاراتك وإنجازاتك إلى CV احترافي جاهز للفرصة الجاية.')}</p>
        </div>
        <div className="completion-card" aria-label={tx(lang, `CV completion ${completion}%`, `السيرة اكتملت بنسبة ${completion}٪`)}>
          <div className="completion-ring" style={{ '--progress': `${completion * 3.6}deg` } as React.CSSProperties}><strong>{completion}%</strong></div>
          <div><b>{tx(lang, 'CV completion', 'نسبة اكتمال السيرة')}</b><span>{tx(lang, `${data.experiences.length + data.education.length + data.projects.length} entries added`, `${data.experiences.length + data.education.length + data.projects.length} عناصر مضافة`)}</span></div>
        </div>
      </section>

      <section className="toolbar" aria-label={tx(lang, 'Template and export actions', 'اختيار القالب والتصدير')}>
        <div className="toolbar-template">
          <span className="template-index">A4 · {pageCount} {tx(lang, pageCount === 1 ? 'Page' : 'Pages', pageCount === 1 ? 'صفحة' : 'صفحات')}</span>
          <div><b>{lang === 'ar' ? templateMeta[template].nameAr : templateMeta[template].name}</b><span>{lang === 'ar' ? templateMeta[template].subtitleAr : templateMeta[template].subtitle} · {lang === 'ar' ? templateMeta[template].noteAr : templateMeta[template].note}</span></div>
        </div>
        <div className="toolbar-actions">
          <button type="button" className="outline-button color-picker-button" onClick={() => { setGalleryOpen(false); setPaletteOpen((open) => !open); }} aria-expanded={paletteOpen} disabled={template === 'mint'} aria-label={tx(lang, `CV color: ${activePalette.name.en}`, `لون السيرة: ${activePalette.name.ar}`)}><span className="current-palette-swatch" style={{ backgroundColor: activePalette.accent }} aria-hidden="true" />{tx(lang, 'CV color', 'لون السيرة')}: {lang === 'ar' ? activePalette.name.ar : activePalette.name.en}<span aria-hidden="true">⌄</span></button>
          <button type="button" className="outline-button" onClick={() => { setPaletteOpen(false); setGalleryOpen((open) => !open); }} aria-expanded={galleryOpen}>{tx(lang, 'Change template', 'غيّر القالب')}<span aria-hidden="true">⌄</span></button>
          <button type="button" className="outline-button preview-only-button" onClick={() => { setMode('preview'); window.setTimeout(() => document.getElementById('cv-paper')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }}>{tx(lang, 'Preview only', 'المعاينة بس')}</button>
          <button type="button" className="export-button pdf" onClick={() => void handlePdf()}><span aria-hidden="true">↓</span> PDF</button>
          <button type="button" className="export-button word" onClick={() => void handleWord()}><span className="word-icon" aria-hidden="true">W</span> Word</button>
        </div>
      </section>

      {paletteOpen && <section className="template-gallery palette-gallery" aria-label={tx(lang, 'Choose CV colors', 'اختار ألوان السيرة')}>
        <div className="gallery-heading">
          <div><b>{tx(lang, 'Choose a professional color style', 'اختار ألوان مناسبة للشغل')}</b><span>{tx(lang, 'Changes apply to the preview and both export formats.', 'التغييرات هتظهر في المعاينة وملفات التصدير.')}</span></div>
          <button type="button" className="close-gallery" onClick={() => setPaletteOpen(false)} aria-label={tx(lang, 'Close color chooser', 'اقفل اختيار الألوان')}>×</button>
        </div>
        <div className="palette-options" role="group" aria-label={tx(lang, 'CV color palette', 'ألوان السيرة')}>
          {cvColorIds.map((id) => <button type="button" className={`palette-option ${colorTheme === id ? 'selected' : ''}`} key={id} onClick={() => changeColorTheme(id)} aria-pressed={colorTheme === id}>
            <span className="palette-swatches" aria-hidden="true"><i style={{ backgroundColor: cvColorPalettes[id].heading }} /><i style={{ backgroundColor: cvColorPalettes[id].accent }} /><i style={{ backgroundColor: cvColorPalettes[id].divider }} /></span>
            <span className="palette-option-copy"><b>{cvColorPalettes[id].name[lang]}</b><small>{cvColorPalettes[id].note[lang]}</small></span>
            {colorTheme === id && <span className="palette-check" aria-hidden="true">✓</span>}
          </button>)}
        </div>
      </section>}

      {galleryOpen && <section className="template-gallery" aria-label={tx(lang, 'Choose a CV template', 'اختار قالب السيرة')}>
        <div className="gallery-heading">
          <div><b>{tx(lang, 'Choose a document style', 'اختار شكل السيرة')}</b><span>{tx(lang, 'Your details stay in place; only the page styling changes.', 'بياناتك هتفضل زي ما هي؛ اللي هيتغير بس شكل الصفحة.')}</span></div>
          <button type="button" className="close-gallery" onClick={() => setGalleryOpen(false)} aria-label={tx(lang, 'Close template chooser', 'اقفل اختيار القالب')}>×</button>
        </div>
        <div className="template-cards">
          {templateIds.map((id) => <button type="button" className={`template-card ${template === id ? 'selected' : ''}`} key={id} onClick={() => changeTemplate(id)} aria-pressed={template === id}>
            <span className={`mini-cv mini-${id}`} aria-hidden="true"><span className="mini-name" /><span className="mini-rule short" /><span className="mini-head" /><span className="mini-rule" /><span className="mini-rule" /><span className="mini-rule short" /><span className="mini-head second" /><span className="mini-rule" /></span>
            <span className="template-card-copy"><b>{lang === 'ar' ? templateMeta[id].nameAr : templateMeta[id].name}</b><span>{lang === 'ar' ? templateMeta[id].subtitleAr : templateMeta[id].subtitle}</span><i>{template === id ? `✓ ${tx(lang, 'In use', 'شغال دلوقتي')}` : tx(lang, 'Use this layout', 'استخدم القالب ده')}</i></span>
          </button>)}
        </div>
      </section>}

      <div className={`builder-layout ${mode === 'preview' ? 'preview-mode' : ''}`}>
        <section className="panel editor-panel">
          <div className="panel-header"><div><span className="panel-kicker">01 / {tx(lang, 'BUILD', 'اكتب')}</span><h2>{tx(lang, 'Your CV details', 'بيانات سيرتك')}</h2></div><span className="panel-status">{tx(lang, 'Live updates', 'تحديث لحظي')}</span></div>
          <Editor data={data} onChange={setData} activeSection={activeSection} setActiveSection={setActiveSection} lang={lang} />
        </section>
        <section className="panel preview-panel">
          <div className="panel-header preview-panel-header"><div><span className="panel-kicker">02 / {tx(lang, 'REVIEW', 'راجع')}</span><h2>{tx(lang, 'Live preview', 'معاينة مباشرة')}</h2></div><div className="preview-tools"><button type="button" className={mode === 'edit' ? 'active' : ''} onClick={() => setMode('edit')}>{tx(lang, 'Edit', 'تعديل')}</button><button type="button" className={mode === 'preview' ? 'active' : ''} onClick={() => setMode('preview')}>{tx(lang, 'Preview', 'معاينة')}</button></div></div>
          <div className="preview-stage"><CVPreview data={data} template={template} lang={lang} colorTheme={colorTheme} onPageCountChange={handlePageCountChange} /></div>
          <div className="preview-tip"><span aria-hidden="true">i</span><span>{tx(lang, 'Keep bullets concise and focus on outcomes. The page expands naturally when your CV needs another page.', 'خلّي النقط مختصرة وركّز على النتايج. السيرة هتكمل في صفحة تانية لو احتاجت.')}</span></div>
        </section>
      </div>
    </main>
    {notice && <div className="toast" role="status"><span aria-hidden="true">✓</span>{notice}</div>}
    <footer className="site-footer"><span>© 2026 ورقة · WARAQA</span><span>{tx(lang, 'Made with care for everyone working toward a new opportunity — Mohamed Fahim.', 'صُنع بحب لكل حد بيجتهد وبيسعى لفرصة شغل — محمد فهيم.')}</span></footer>
  </div>;
}

export default App;
