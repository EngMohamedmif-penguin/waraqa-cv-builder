/**
 * معاينة السيرة: تحول CVData إلى كتل مرتبة داخل صفحات A4، وتطبق القالب
 * ولوحة اللون وتحدد عدد الصفحات بقياس DOM. التصدير يلتقط هذه الصفحات فقط.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { CVColorId, CVData, CVSectionId, TemplateId } from '../types';
import { getTemplatePalette, localizeAdditionalKind, localizeProficiency } from '../data';

type Lang = 'en' | 'ar';
type Props = { data: CVData; template: TemplateId; lang: Lang; colorTheme: CVColorId; onPageCountChange?: (count: number) => void };
const tx = (lang: Lang, en: string, ar: string) => lang === 'ar' ? ar : en;

/** يعرض نطاق التاريخ مع ترجمة حالة العمل الحالية. */
function DateRange({ start, end, current, lang }: { start: string; end: string; current?: boolean; lang: Lang }) {
  const finish = current ? tx(lang, 'Present', 'لحد دلوقتي') : end;
  if (!start && !finish) return null;
  return <span className="cv-date">{[start, finish].filter(Boolean).join(' — ')}</span>;
}
function SectionTitle({ children }: { children: ReactNode }) { return <h2 className="cv-section-title">{children}</h2>; }
type Block = { id: string; node: ReactNode };

/** يبني كتل السيرة المرتبة ثم يقيسها إلى صفحات A4 قابلة للعرض والتصدير. */
export default function CVPreview({ data, template, lang, colorTheme, onPageCountChange }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const measurementRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState(1122);
  const [scaledLeft, setScaledLeft] = useState(0);
  const [pages, setPages] = useState<number[][]>([[]]);
  const { personal } = data;
  const palette = getTemplatePalette(template, colorTheme);
  const sectionOrder: CVSectionId[] = data.sectionOrder?.length ? data.sectionOrder : ['summary','experience','education','skills','projects','certifications','languages','additional'];
  const hiddenSections = new Set(data.hiddenSections || []);
  const sectionStyle = (id: CVSectionId): CSSProperties => ({ display: hiddenSections.has(id) ? 'none' : undefined });
  const contactItems = [personal.email, personal.phone, personal.location, personal.linkedin, personal.portfolio, personal.github].filter((value) => value.trim());
  const hasContent = Boolean(personal.fullName || personal.title || contactItems.length || data.summary || data.experiences.length || data.education.length || data.technicalSkills.length || data.softSkills.length || data.projects.length || data.certifications.length || data.languages.length || data.additional.length);

  const blocks = useMemo<Block[]>(() => {
    const result: Block[] = [];
    const add = (id: string, node: ReactNode) => result.push({ id, node });
    if (personal.fullName || personal.title || contactItems.length) add('header', <header className="cv-header">
      <div className="cv-name-block">{personal.fullName && <h1>{personal.fullName}</h1>}{personal.title && <p className="cv-professional-title">{personal.title}</p>}</div>
      {template === 'photo' && personal.photo && <img className="cv-photo" src={personal.photo} alt={tx(lang, 'Profile photo', 'الصورة الشخصية')} />}
      {contactItems.length > 0 && <div className="cv-contact">{contactItems.map((item, index) => <span className="cv-contact-item" key={`${item}-${index}`}>{item}</span>)}</div>}
    </header>);

    const ordered = (id: CVSectionId) => sectionOrder.indexOf(id);
    const addSection = (id: CVSectionId, title: ReactNode, content: ReactNode, suffix = '') => {
      if (hiddenSections.has(id)) return;
      add(`${id}${suffix}`, <section className={`cv-section${id === 'skills' ? ' cv-section-skills' : ''}`} style={sectionStyle(id)}><SectionTitle>{title}</SectionTitle>{content}</section>);
    };
    const experienceEntry = (item: CVData['experiences'][number]) => <div className="cv-entry" key={item.id}>
      <div className="cv-entry-head"><div className="cv-entry-main">{item.jobTitle && <h3>{item.jobTitle}</h3>}{(item.company || item.location) && <p className="cv-org">{[item.company, item.location].filter(Boolean).join(' · ')}</p>}</div><DateRange start={item.startDate} end={item.endDate} current={item.current} lang={lang} /></div>
      {item.description.trim() && <p>{item.description}</p>}
      {item.bullets.some((bullet) => bullet.trim()) && <ul>{item.bullets.filter((bullet) => bullet.trim()).map((bullet, index) => <li key={`${item.id}-b-${index}`}>{bullet}</li>)}</ul>}
    </div>;

    const sectionEntries = [
      { id: 'summary' as CVSectionId, content: data.summary.trim() ? <p className="cv-summary">{data.summary}</p> : null, title: tx(lang, 'Professional Summary', 'نبذة عنك') },
      { id: 'education' as CVSectionId, content: data.education.map((item) => <div className="cv-entry" key={item.id}><div className="cv-entry-head"><div className="cv-entry-main">{item.degree && <h3>{item.degree}</h3>}{(item.institution || item.location) && <p className="cv-org">{[item.institution, item.location].filter(Boolean).join(' · ')}</p>}</div><DateRange start={item.startDate} end={item.endDate} lang={lang} /></div>{item.description.trim() && <p>{item.description}</p>}</div>), title: tx(lang, 'Education', 'التعليم') },
      { id: 'skills' as CVSectionId, content: (data.technicalSkills.length || data.softSkills.length) ? <div className="cv-skills-grid">
        {data.technicalSkills.length > 0 && <div className="cv-skill-group"><h3>{tx(lang, 'Technical skills', 'المهارات التقنية')}</h3><div className="cv-skill-list">{data.technicalSkills.map((skill) => <span className="cv-skill-tag" key={`technical-${skill}`}>{skill}</span>)}</div></div>}
        {data.softSkills.length > 0 && <div className="cv-skill-group"><h3>{tx(lang, 'Professional skills', 'المهارات المهنية')}</h3><div className="cv-skill-list">{data.softSkills.map((skill) => <span className="cv-skill-tag" key={`professional-${skill}`}>{skill}</span>)}</div></div>}
      </div> : null, title: tx(lang, 'Skills', 'المهارات') },
      { id: 'projects' as CVSectionId, content: data.projects.map((item) => <div className="cv-entry" key={item.id}><div className="cv-entry-head"><div className="cv-entry-main">{item.name && <h3>{item.name}</h3>}</div></div>{item.technologies && <p className="cv-technologies">{item.technologies}</p>}{item.description.trim() && <p>{item.description}</p>}{(item.link || item.github) && <p className="cv-link-line">{[item.link, item.github].filter(Boolean).join(' · ')}</p>}</div>), title: tx(lang, 'Projects', 'المشروعات') },
      { id: 'certifications' as CVSectionId, content: data.certifications.map((item) => <div className="cv-entry cv-inline-entry" key={item.id}>{item.name && <h3>{item.name}</h3>}{(item.organization || item.date || item.credential) && <p className="cv-org">{[item.organization, item.date, item.credential].filter(Boolean).join(' · ')}</p>}</div>), title: tx(lang, 'Certifications', 'الشهادات') },
      { id: 'languages' as CVSectionId, content: data.languages.length ? <div className="cv-language-row">{data.languages.map((item) => <span key={item.id}><b>{item.language}</b>{item.level && <em>{localizeProficiency(item.level, lang)}</em>}</span>)}</div> : null, title: tx(lang, 'Languages', 'اللغات') },
    ];
    const experienceIndex = ordered('experience');
    const all = [...sectionEntries.map((entry) => ({ ...entry, index: ordered(entry.id) })), { id: 'experience' as CVSectionId, index: experienceIndex, title: tx(lang, 'Experience', 'الخبرة العملية'), content: null }].sort((a, b) => a.index - b.index);
    all.forEach((entry) => {
      if (entry.id === 'experience') {
        if (!data.experiences.length || hiddenSections.has('experience')) return;
        data.experiences.forEach((item, index) => add(`experience-${index}`, <section className="cv-section" style={sectionStyle('experience')}>{index === 0 && <SectionTitle>{entry.title}</SectionTitle>}{experienceEntry(item)}</section>));
      } else if (entry.content) addSection(entry.id, entry.title, entry.content);
    });
    if (!hiddenSections.has('additional')) data.additional.forEach((item) => add(`additional-${item.id}`, <section className="cv-section" style={sectionStyle('additional')}><SectionTitle>{item.kind === 'Custom' ? (item.customHeading || tx(lang, 'Custom Section', 'قسم من اختيارك')) : (localizeAdditionalKind(item.kind, lang) || tx(lang, 'Additional section', 'قسم المزيد'))}</SectionTitle><div className="cv-entry"><div className="cv-entry-head"><div className="cv-entry-main">{item.title && <h3>{item.title}</h3>}{item.organization && <p className="cv-org">{item.organization}</p>}</div><DateRange start={item.startDate} end={item.endDate} lang={lang} /></div>{item.description.trim() && <p>{item.description}</p>}{item.bullets.some((bullet) => bullet.trim()) && <ul>{item.bullets.filter((bullet) => bullet.trim()).map((bullet, index) => <li key={`${item.id}-b-${index}`}>{bullet}</li>)}</ul>}</div></section>));
    return result;
  }, [data, template, lang, colorTheme, sectionOrder.join('|'), [...hiddenSections].join('|')]);

  useEffect(() => {
    const root = measurementRef.current;
    if (!root) return;
    let disposed = false;
    const measurePages = () => {
      if (disposed) return;
      const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-layout-block]'));
      const style = getComputedStyle(root);
      const pageHeight = parseFloat(style.getPropertyValue('--a4-height')) || 1122.52;
      const paddingTop = parseFloat(getComputedStyle(root).paddingTop) || 64.25;
      const paddingBottom = parseFloat(getComputedStyle(root).paddingBottom) || 68;
      const available = pageHeight - paddingTop - paddingBottom;
      const next: number[][] = [[]];
      let used = 0;
      nodes.forEach((node, index) => {
        const rect = node.getBoundingClientRect();
        const margins = parseFloat(getComputedStyle(node).marginTop) + parseFloat(getComputedStyle(node).marginBottom);
        const height = rect.height + margins;
        const keepTogether = node.getAttribute('data-keep-together') !== 'false';
        if (next[next.length - 1].length && used + height > available && keepTogether) { next.push([]); used = 0; }
        next[next.length - 1].push(index);
        used += height;
        if (height > available) used = available;
      });
      if (!nodes.length) next[0] = [];
      setPages((current) => JSON.stringify(current) === JSON.stringify(next) ? current : next);
      onPageCountChange?.(Math.max(1, next.length));
    };
    const frame = window.requestAnimationFrame(measurePages);
    const observer = new ResizeObserver(measurePages);
    observer.observe(root);
    document.fonts?.ready.then(() => {
      if (!disposed) window.requestAnimationFrame(measurePages);
    });
    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [blocks, onPageCountChange]);

  useEffect(() => {
    const measure = () => {
      const host = hostRef.current;
      if (!host) return;
      const paper = host.querySelector<HTMLElement>('.cv-page');
      if (!paper) return;
      const width = paper.offsetWidth || 794;
      const nextScale = Math.min(1, Math.max(0.2, host.clientWidth / width));
      const pageHeight = paper.offsetHeight || 1122;
      const gap = 24;
      const nextHeight = Math.ceil((pageHeight * pages.length + gap * Math.max(0, pages.length - 1)) * nextScale);
      const nextLeft = Math.max(0, (host.clientWidth - width * nextScale) / 2);
      setScale((current) => Math.abs(current - nextScale) > 0.002 ? nextScale : current);
      setScaledHeight((current) => current !== nextHeight ? nextHeight : current);
      setScaledLeft((current) => Math.abs(current - nextLeft) > 1 ? nextLeft : current);
    };
    const observer = new ResizeObserver(measure);
    if (hostRef.current) observer.observe(hostRef.current);
    measure();
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [pages.length, template, lang, colorTheme]);

  const pageNodes = pages.map((page, pageIndex) => {
    // القياس يتم في effect وقد يتأخر دورة واحدة عن تحديث البيانات بعد الحذف.
    // تجاهل المؤشرات القديمة بدلًا من محاولة قراءة block غير موجود.
    const visibleBlockIndexes = page.filter((blockIndex) => Boolean(blocks[blockIndex]));
    const pageGap = 24;
    return <article id={pageIndex === 0 ? 'cv-paper' : undefined} key={`page-${pageIndex}`} className={`cv-paper cv-page template-${template} ${template === 'photo' && personal.photo ? 'has-photo' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'} aria-label={tx(lang, `CV page ${pageIndex + 1}`, `صفحة السيرة ${pageIndex + 1}`)} style={{ '--cv-heading': palette.heading, '--cv-accent': palette.accent, '--cv-divider': palette.divider, transform: `scale(${scale})`, left: `${scaledLeft}px`, top: `${pageIndex * (1122.52 + pageGap) * scale}px` } as CSSProperties}>{visibleBlockIndexes.map((blockIndex) => { const block = blocks[blockIndex]; return <div className="cv-layout-block" key={block.id}>{block.node}</div>; })}{!hasContent && pageIndex === 0 && <div className="cv-empty"><strong>{tx(lang, 'Your CV will take shape here.', 'هتشوف سيرتك هنا.')}</strong><p>{tx(lang, 'Start with your name and current role, then add experience and measurable results.', 'ابدأ باسمك ووظيفتك الحالية، وبعدها ضيف خبراتك ونتايجك بالأرقام.')}</p></div>}<footer className="cv-page-number">{tx(lang, `Page ${pageIndex + 1} of ${pages.length}`, `صفحة ${pageIndex + 1} من ${pages.length}`)}</footer></article>;
  });

  return <div className="cv-fit-host" ref={hostRef} style={{ height: `${scaledHeight}px` }}>
    <div ref={measurementRef} className={`cv-paper cv-measure-paper template-${template} ${template === 'photo' && personal.photo ? 'has-photo' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ '--cv-heading': palette.heading, '--cv-accent': palette.accent, '--cv-divider': palette.divider } as CSSProperties}>{blocks.map((block, index) => <div className="cv-layout-block" data-layout-block="true" key={block.id} data-keep-together={block.id.startsWith('experience-') ? 'true' : 'true'}>{block.node}</div>)}</div>
    {pageNodes}
  </div>;
}
