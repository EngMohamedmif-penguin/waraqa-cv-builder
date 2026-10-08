/**
 * طبقة الإخراج المحلي: exportPdf يحول صفحات المعاينة وحدها إلى PDF، وexportWord
 * يعيد بناء CVData في فقرات DOCX قابلة للتحرير. لا تعتمد هذه الوحدة على واجهة المحرر.
 */
import { AlignmentType, BorderStyle, Document, HeadingLevel, ImageRun, Packer, Paragraph, TextRun } from 'docx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { CVColorId, CVData, CVSectionId, TemplateId } from './types';
import { getTemplatePalette, localizeAdditionalKind, localizeProficiency, templateMeta, type CVPalette } from './data';

type Lang = 'en' | 'ar';
const tx = (lang: Lang, en: string, ar: string) => lang === 'ar' ? ar : en;

const printStyles = (palette: CVPalette) => `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');
  @page { size: A4; margin: 17mm 18mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #202020; }
  body { font: 10.5pt/1.48 Arial, "Noto Sans Arabic", sans-serif; }
  .cv-sections-flow { display: flex; flex-direction: column; }
  .cv-paper { width: auto !important; min-height: 0 !important; padding: 0 !important; margin: 0 !important; position: static !important; transform: none !important; left: auto !important; box-shadow: none !important; background: #fff !important; color: #202020 !important; }
  .cv-page { width: 210mm !important; height: 297mm !important; min-height: 297mm !important; padding: 17mm 17mm 18mm !important; position: relative !important; overflow: hidden !important; page-break-after: always; break-after: page; }
  .cv-page:last-child { page-break-after: auto; break-after: auto; }
  .cv-page-number { position: absolute !important; inset-inline: 17mm !important; bottom: 7mm !important; }
  .cv-header { display: block; border-bottom: 1px solid #707070; padding: 0 0 9pt; margin: 0 0 13pt; }
  .cv-name-block h1 { font-size: 22pt; line-height: 1.12; margin: 0 0 3pt; font-weight: 700; letter-spacing: -.25pt; color: #151515; }
  .cv-professional-title { font-size: 12pt !important; line-height: 1.3; color: ${palette.accent} !important; margin: 0 0 6pt !important; }
  .cv-contact { display: flex; flex-wrap: wrap; gap: 2pt 9pt; color: #4d4d4d; font-size: 9pt; line-height: 1.4; }
  .cv-contact-item:not(:last-child)::after { content: "·"; margin-inline-start: 9pt; color: #888; }
  .cv-section { margin: 12pt 0 0; break-inside: auto; page-break-inside: auto; }
  .cv-section-title { font-size: 11pt; line-height: 1.25; letter-spacing: .55pt; text-transform: uppercase; color: ${palette.heading}; border-bottom: .65pt solid ${palette.divider}; padding: 0 0 4pt; margin: 0 0 7pt; break-after: avoid; page-break-after: avoid; }
  .cv-summary, .cv-entry p, .cv-skills-grid p, .cv-language-row { font-size: 10.5pt; line-height: 1.48; margin: 0; color: #272727; }
  .cv-entry { margin: 0 0 8pt; break-inside: avoid; page-break-inside: avoid; }
  .cv-entry-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10pt; margin-bottom: 2pt; }
  .cv-entry h3 { font-size: 10.7pt; line-height: 1.35; margin: 0 0 1pt; font-weight: 700; color: ${palette.accent}; }
  .cv-org { color: #4d4d4d !important; }
  .cv-date { flex: 0 0 auto; font-size: 9.3pt; line-height: 1.35; color: #555; white-space: nowrap; }
  .cv-technologies { margin: 2pt 0 3pt !important; color: #555 !important; font-size: 9.4pt !important; line-height: 1.4 !important; overflow-wrap: anywhere; word-break: normal; }
  .cv-entry ul { margin: 3pt 0 0; padding-inline-start: 16pt; }
  .cv-entry li { font-size: 10.3pt; line-height: 1.45; margin: 0 0 2pt; break-inside: avoid; }
  .cv-skills-grid { display: block; }
  .cv-skills-grid > div { margin: 0 0 4pt; }
  .cv-skills-grid h3 { display: inline; font-size: 9.5pt; text-transform: uppercase; margin: 0 5pt 0 0; color: ${palette.heading}; }
  .cv-link-line { color: ${palette.accent} !important; overflow-wrap: anywhere; }
  .cv-inline-entry { display: block; }
  .cv-inline-entry .cv-org { margin-top: 1pt; }
  .cv-language-row { display: flex; flex-wrap: wrap; gap: 3pt 16pt; }
  .cv-language-row em { font-style: normal; color: #555; margin-inline-start: 4pt; }
  .template-modern { font-family:"IBM Plex Sans","IBM Plex Sans Arabic","Noto Sans Arabic",Arial,sans-serif; }
  .template-modern .cv-header { display:flex; flex-direction:column; align-items:center; gap:0; border:0; border-top:2pt solid ${palette.accent}; border-bottom:.65pt solid ${palette.divider}; padding:8pt 0 7pt; margin:0 0 13pt; text-align:center; }
  .template-modern .cv-name-block { width:100%; text-align:center; }
  .template-modern .cv-name-block h1 { color:${palette.heading}; font:600 29pt/1.12 "IBM Plex Sans","IBM Plex Sans Arabic","Noto Sans Arabic",Arial,sans-serif; letter-spacing:-.5pt; }
  .template-modern .cv-professional-title { margin:4pt 0 8pt !important; font:500 12pt/1.3 "IBM Plex Sans","IBM Plex Sans Arabic","Noto Sans Arabic",Arial,sans-serif; }
  .template-modern .cv-contact { display:flex; flex-wrap:wrap; justify-content:center; width:100%; gap:3pt 9pt; margin:0; padding:6pt 6pt 0; border-top:.65pt solid ${palette.divider}; font-size:8.5pt; text-align:center; }
  .template-modern .cv-section { margin-top:14pt; }
  .template-modern .cv-section-title { position:relative; margin:0 0 7pt; padding:0 0 5pt; border:0; font:700 10.5pt/1.25 "IBM Plex Sans","IBM Plex Sans Arabic","Noto Sans Arabic",Arial,sans-serif; letter-spacing:1pt; text-align:center; }
  .template-modern .cv-section-title::after { content:""; display:block; width:25pt; height:1.5pt; margin:4pt auto 0; background:${palette.accent}; }
  .template-modern .cv-entry { margin:0 0 8pt; padding-inline-start:7pt; border-inline-start:1pt solid ${palette.divider}; }
  .template-modern .cv-entry h3 { font-family:"IBM Plex Sans","IBM Plex Sans Arabic","Noto Sans Arabic",Arial,sans-serif; font-size:10.7pt; }
  .template-modern .cv-org { color:${palette.accent} !important; font-weight:600; }
  .template-executive .cv-header { display:block; border:0; border-bottom:1pt solid #777; padding:8pt 0 12pt; margin-bottom:15pt; }
  .template-executive .cv-name-block h1 { font:500 29pt Georgia, "Times New Roman", serif; }
  .template-executive .cv-contact { border-top:1pt solid #ddd; padding-top:7pt; }
  .template-executive .cv-section { margin-top:16pt; }
  .template-executive .cv-section-title { border:0; border-bottom:1pt solid #888; font:600 12.5pt Georgia, "Times New Roman", serif; text-transform:none; letter-spacing:0; }
  .template-compact .cv-section { margin-top: 9pt; }
  .template-compact .cv-entry { margin-bottom: 6pt; }
  .template-compact .cv-section-title { margin-bottom: 5pt; }
  [dir="rtl"] { text-align: right; }
  [dir="rtl"] .cv-contact { direction: rtl; }
  [dir="rtl"] .cv-date, [dir="rtl"] .cv-technologies { direction: ltr; unicode-bidi: plaintext; }
  .template-mint .cv-header { display:grid; grid-template-columns:minmax(0,1fr) 55mm; grid-template-areas:"name contact"; padding:0 0 8mm; margin-bottom:8mm; border:0; }
  .template-mint .cv-name-block { grid-area:name; }
  .template-mint .cv-name-block h1 { font:500 24pt Georgia,"Times New Roman",serif; }
  .template-mint .cv-contact { grid-area:contact; display:flex; flex-direction:column; gap:3pt; }
  .template-mint .cv-contact-item::after { content:none !important; }
  .template-mint .cv-section-title { color:#283b34 !important; border-bottom:1pt solid #8bcbb7 !important; letter-spacing:2pt; }
  .template-mint .cv-entry { display:grid; grid-template-columns:34mm minmax(0,1fr); gap:0 5mm; }
  .template-mint .cv-entry-head { display:contents; }
  .template-mint .cv-entry-main { grid-column:2; grid-row:1; }
  .template-mint .cv-entry-head > .cv-date { grid-column:1; grid-row:1; white-space:normal; }
  .template-mint .cv-entry > p, .template-mint .cv-entry > ul { grid-column:2; }
  .template-photo.has-photo .cv-header { display:grid; grid-template-columns:minmax(0,1fr) 24mm; grid-template-areas:"name photo" "contact photo"; }
  .template-photo.has-photo .cv-name-block { grid-area:name; }
  .template-photo.has-photo .cv-contact { grid-area:contact; }
  .template-photo .cv-photo { grid-area:photo; width:21mm; height:21mm; object-fit:cover; border-radius:2mm; }
  @media screen { body { padding: 16mm; } }
`;

/** يلتقط صفحات السيرة فقط ويضيفها إلى PDF A4 متعدد الصفحات. */
export async function exportPdf(colorTheme: CVColorId = 'blue', template: TemplateId = 'compact'): Promise<boolean> {
  const papers = Array.from(document.querySelectorAll<HTMLElement>('.cv-page'));
  if (!papers.length) return false;
  if (document.fonts?.ready) await document.fonts.ready;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const temporaryNodes: HTMLElement[] = [];
  try {
    for (const [index, paper] of papers.entries()) {
      const clone = paper.cloneNode(true) as HTMLElement;
      clone.removeAttribute('id');
      clone.style.setProperty('position', 'relative', 'important');
      clone.style.setProperty('left', '0', 'important');
      clone.style.setProperty('top', '0', 'important');
      clone.style.setProperty('transform', 'none', 'important');
      clone.style.setProperty('width', '210mm', 'important');
      clone.style.setProperty('height', '297mm', 'important');
      clone.style.setProperty('min-height', '297mm', 'important');
      clone.style.setProperty('margin', '0', 'important');
      clone.style.setProperty('box-shadow', 'none', 'important');
      clone.style.setProperty('visibility', 'visible', 'important');
      clone.style.setProperty('z-index', '-100', 'important');
      document.body.appendChild(clone);
      temporaryNodes.push(clone);
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const canvas = await html2canvas(clone, {
        backgroundColor: '#ffffff',
        scale: Math.min(2, window.devicePixelRatio || 1.5),
        useCORS: true,
        logging: false,
        width: clone.scrollWidth,
        height: clone.scrollHeight,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
      });
      if (index > 0) pdf.addPage('a4', 'portrait');
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.96), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }
    const name = (papers[0].querySelector('.cv-name-block h1')?.textContent || 'curriculum-vitae').trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'curriculum-vitae';
    pdf.save(`${name}.pdf`);
    return true;
  } finally {
    temporaryNodes.forEach((node) => node.remove());
  }
}

type RunOptions = { bold?: boolean; size?: number; color?: string; italics?: boolean; font?: string };
const run = (text: string, options: RunOptions = {}) => new TextRun({ text, font: options.font ?? 'Arial', size: options.size ?? 21, color: options.color ?? '252525', bold: options.bold, italics: options.italics });

function paragraph(text: string, lang: Lang, options: { size?: number; bold?: boolean; before?: number; after?: number; alignment?: typeof AlignmentType[keyof typeof AlignmentType]; color?: string; font?: string; heading?: boolean; borderLeft?: boolean; borderTop?: boolean; borderColor?: string; borderLeftColor?: string } = {}) {
  const rtl = lang === 'ar';
  const alignment = options.alignment ?? (rtl ? AlignmentType.RIGHT : AlignmentType.LEFT);
  const borderLine = { style: BorderStyle.SINGLE, color: options.borderColor ?? 'BEBEBE', size: 4, space: 3 };
  const borders: Record<string, typeof borderLine> = {};
  if (options.heading) borders.bottom = borderLine;
  if (options.borderLeft) borders.left = { ...borderLine, color: options.borderLeftColor ?? '777777' };
  if (options.borderTop) borders.top = { ...borderLine, color: '777777' };
  return new Paragraph({
    ...(options.heading ? { heading: HeadingLevel.HEADING_2 } : {}),
    children: [run(text || ' ', { size: options.size ?? 21, bold: options.bold, color: options.color, font: options.font })],
    alignment,
    bidirectional: rtl,
    spacing: { before: options.before ?? 0, after: options.after ?? 90, line: 276 },
    ...(Object.keys(borders).length ? { border: borders } : {}),
  } as ConstructorParameters<typeof Paragraph>[0]);
}

function richParagraph(runs: TextRun[], lang: Lang, after = 45) {
  return new Paragraph({ children: runs, alignment: lang === 'ar' ? AlignmentType.RIGHT : AlignmentType.LEFT, bidirectional: lang === 'ar', spacing: { after, line: 276 } } as ConstructorParameters<typeof Paragraph>[0]);
}

function bullet(text: string, lang: Lang) {
  return new Paragraph({
    children: [run(text)],
    bullet: { level: 0 },
    alignment: lang === 'ar' ? AlignmentType.RIGHT : AlignmentType.LEFT,
    bidirectional: lang === 'ar',
    indent: { left: 360, hanging: 180 },
    spacing: { after: 38, line: 270 },
  } as ConstructorParameters<typeof Paragraph>[0]);
}

/** ينشئ DOCX قابلًا للتحرير من نفس البيانات والترتيب المستخدمين في المعاينة. */
export async function exportWord(data: CVData, template: TemplateId, lang: Lang = 'en', colorTheme: CVColorId = 'blue') {
  const { personal } = data;
  let children: Paragraph[] = [];
  const rtl = lang === 'ar';
  const palette = getTemplatePalette(template, colorTheme);
  const alignment = rtl ? AlignmentType.RIGHT : AlignmentType.LEFT;
  const compact = template === 'compact';
  const modern = template === 'modern';
  const executive = template === 'executive';
  const mint = template === 'mint';
  const contacts = [personal.email, personal.phone, personal.location, personal.linkedin, personal.portfolio, personal.github].filter(Boolean);

  if (template === 'photo' && personal.photo) {
    const encoded = personal.photo.split(',')[1] || '';
    const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
    children.push(new Paragraph({
      children: [new ImageRun({ type: 'jpg', data: bytes, transformation: { width: 68, height: 68 } })],
      alignment: rtl ? AlignmentType.LEFT : AlignmentType.RIGHT,
      spacing: { after: 70 },
    }));
  }
  if (personal.fullName) children.push(paragraph(personal.fullName, lang, { size: modern || executive ? 46 : 40, bold: true, before: modern ? 120 : executive ? 80 : 0, after: 28, color: modern ? palette.heading.slice(1) : '171717', borderTop: modern, alignment: modern ? AlignmentType.CENTER : undefined, font: modern ? 'Aptos Display' : undefined }));
  if (personal.title) children.push(paragraph(personal.title, lang, { size: 25, after: compact ? 45 : 65, color: palette.accent.slice(1), alignment: modern ? AlignmentType.CENTER : undefined, font: modern ? 'Aptos' : undefined }));
  if (contacts.length) children.push(paragraph(contacts.join('  ·  '), lang, { size: 18, after: compact ? 95 : 130, color: '555555', alignment: modern ? AlignmentType.CENTER : undefined, font: modern ? 'Aptos' : undefined }));

  const section = (title: string) => children.push(paragraph(title, lang, { size: executive ? 25 : mint ? 23 : 23, bold: true, before: compact ? 95 : executive ? 155 : mint ? 145 : 130, after: compact ? 48 : executive ? 75 : mint ? 72 : 70, color: palette.heading.slice(1), heading: true, alignment: modern ? AlignmentType.CENTER : undefined, borderColor: palette.divider.slice(1) }));
  const detailLine = (title: string, detail: string, date: string) => {
    const runs: TextRun[] = [];
    if (title) runs.push(run(title, { bold: true, size: 21, color: palette.accent.slice(1) }));
    if (detail) runs.push(run(`${title ? '  ·  ' : ''}${detail}`, { size: 20, color: '626262' }));
    if (date) runs.push(run(`\t${date}`, { size: 19, color: '64748B' }));
    if (runs.length) children.push(richParagraph(runs, lang, compact ? 25 : 36));
  };

  const blocks: Record<string, Paragraph[]> = {};
  const renderBlock = (id: string, render: () => void) => { const previous = children; children = []; render(); blocks[id] = children; children = previous; };
  renderBlock('summary', () => { if (data.summary.trim()) { section(tx(lang, 'PROFESSIONAL SUMMARY', 'نبذة عنك')); children.push(paragraph(data.summary, lang, { size: 21, after: compact ? 50 : 70 })); } });
  renderBlock('experience', () => { if (data.experiences.length) { section(tx(lang, 'WORK EXPERIENCE', 'الخبرة العملية')); data.experiences.forEach((item) => {
    const date = [item.startDate, item.current ? tx(lang, 'Present', 'لحد دلوقتي') : item.endDate].filter(Boolean).join(' — ');
    detailLine(item.jobTitle, [item.company, item.location].filter(Boolean).join(' · '), date);
    if (item.description.trim()) children.push(paragraph(item.description, lang, { size: 20, after: 45, color: '444444' }));
    item.bullets.filter((text) => text.trim()).forEach((text) => children.push(bullet(text, lang)));
    children.push(paragraph('', lang, { size: 8, after: 35 }));
  }); } });
  renderBlock('education', () => { if (data.education.length) { section(tx(lang, 'EDUCATION', 'التعليم')); data.education.forEach((item) => {
    detailLine(item.degree, [item.institution, item.location].filter(Boolean).join(' · '), [item.startDate, item.endDate].filter(Boolean).join(' — '));
    if (item.description.trim()) children.push(paragraph(item.description, lang, { size: 20, after: 55 }));
  }); } });
  renderBlock('skills', () => { if (data.technicalSkills.length || data.softSkills.length) { section(tx(lang, 'SKILLS', 'المهارات'));
    const skillGroup = (title: string, skills: string[]) => {
      if (!skills.length) return;
      children.push(paragraph(title, lang, { size: 20, bold: true, before: 35, after: 28, color: palette.heading.slice(1) }));
      skills.filter((skill) => skill.trim()).forEach((skill) => children.push(bullet(skill.trim(), lang)));
    };
    skillGroup(tx(lang, 'Technical Skills', 'المهارات التقنية'), data.technicalSkills);
    skillGroup(tx(lang, 'Professional Skills', 'المهارات المهنية'), data.softSkills);
  } });
  renderBlock('projects', () => { if (data.projects.length) { section(tx(lang, 'PROJECTS', 'المشروعات')); data.projects.forEach((item) => {
    detailLine(item.name, '', ''); if (item.technologies) children.push(paragraph(item.technologies, lang, { size: 18, after: 45, color: '555555' })); if (item.description.trim()) children.push(paragraph(item.description, lang, { size: 20, after: 45 }));
    const links = [item.link, item.github].filter(Boolean).join(' · '); if (links) children.push(paragraph(links, lang, { size: 18, after: 55, color: '555555' }));
  }); } });
  renderBlock('certifications', () => { if (data.certifications.length) { section(tx(lang, 'CERTIFICATIONS', 'الشهادات')); data.certifications.forEach((item) => children.push(paragraph([item.name, item.organization, item.date, item.credential].filter(Boolean).join('  ·  '), lang, { size: 20, after: 55 }))); } });
  renderBlock('languages', () => { if (data.languages.length) { section(tx(lang, 'LANGUAGES', 'اللغات')); children.push(paragraph(data.languages.map((item) => `${item.language}${item.level ? ` — ${localizeProficiency(item.level, lang)}` : ''}`).join('  ·  '), lang, { size: 20, after: 55 })); } });
  renderBlock('additional', () => { data.additional.forEach((item) => {
    section(item.kind === 'Custom' ? (item.customHeading || tx(lang, 'CUSTOM SECTION', 'قسم من اختيارك')) : (localizeAdditionalKind(item.kind, lang) || tx(lang, 'ADDITIONAL', 'قسم المزيد')));
    detailLine(item.title, item.organization, [item.startDate, item.endDate].filter(Boolean).join(' — '));
    if (item.description.trim()) children.push(paragraph(item.description, lang, { size: 20, after: 45 }));
    item.bullets.filter((text) => text.trim()).forEach((text) => children.push(bullet(text, lang)));
  }); });
  const sectionIds: CVSectionId[] = data.sectionOrder?.length ? data.sectionOrder : ['summary','experience','education','skills','projects','certifications','languages','additional'];
  const hidden = new Set(data.hiddenSections || []);
  sectionIds.forEach((id) => { if (!hidden.has(id)) children.push(...(blocks[id] || [])); });
  const doc = new Document({
    creator: '',
    title: rtl ? 'السيرة الذاتية' : 'Curriculum Vitae',
    description: '',
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 960, right: 1000, bottom: 960, left: 1000 } } },
      children: children.length ? children : [paragraph(tx(lang, 'Add your name and professional title to begin.', 'ضيف اسمك ومسمّاك المهني عشان تبدأ.'), lang, { alignment })],
    }],
    styles: { default: { document: { run: { font: 'Arial', size: 21, color: '252525' }, paragraph: { spacing: { line: 276 } } } } },
    features: { updateFields: false },
    compatibility: { doNotExpandShiftReturn: true },
  });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${(personal.fullName || 'curriculum-vitae').trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'curriculum-vitae'}.docx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportLabel(template: TemplateId) {
  return templateMeta[template].name;
}
