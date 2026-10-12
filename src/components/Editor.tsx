/**
 * محرر بيانات السيرة: يجمع الحقول الشخصية والأقسام المتكررة وإدارة الترتيب.
 * يرسل كل تغيير إلى App عبر onChange، ويستخدم حدود validation.ts لمنع
 * القوائم الطويلة والتنبيه قبل أن يخرج المحتوى عن الصفحة.
 */
import React, { useState } from 'react';
import type { AdditionalSection, CVData, CVSectionId, EditorSection, Education, Experience, Project, Certification, Language, PersonalInfo } from '../types';
import { additionalKinds, uid } from '../data';
import { characterState, COLLECTION_LIMITS, TEXT_LIMITS, type TextLimit } from '../validation';
import { safeExternalUrl, type LinkKey } from '../links';

type Lang = 'en' | 'ar';
const tx = (lang: Lang, en: string, ar: string) => lang === 'ar' ? ar : en;
type Props = { data: CVData; onChange: (data: CVData) => void; activeSection: EditorSection; setActiveSection: (section: EditorSection) => void; lang: Lang };
type FieldProps = {
  id?: string; label: string; value: string; onChange: (value: string) => void; placeholder?: string;
  type?: string; wide?: boolean; limit?: TextLimit; required?: boolean; hint?: string; lang: Lang; rows?: number;
};

/** حقل موحد يحسب حالة الحد ويعرض التغذية الراجعة بعد التفاعل مع المستخدم. */
function Field({ id, label, value, onChange, placeholder, type = 'text', wide = false, limit, required = false, hint, lang, rows = 3 }: FieldProps) {
  const [touched, setTouched] = useState(false);
  const state = limit ? characterState(value, limit) : null;
  const missing = required && touched && !value.trim();
  const invalid = Boolean(state?.overLimit || missing);
  const feedback = state?.overLimit
    ? tx(lang, `${state.exceeded} characters over the limit. Trim this so the CV stays readable.`, `عدّيت الحد بـ ${state.exceeded} حرف. اختصر النص عشان السيرة تفضل واضحة.`)
    : state?.nearLimit
      ? tx(lang, 'You are close to the limit; concise wording helps the CV stay balanced.', 'قربت من الحد؛ الاختصار هيخلّي السيرة متوازنة.')
      : missing
        ? tx(lang, 'This field is required.', 'الخانة دي مطلوبة.')
        : null;
  const feedbackClass = state?.overLimit || missing ? 'error' : state?.nearLimit ? 'warning' : 'normal';
  const common = {
    id,
    value,
    placeholder,
    required,
    'aria-invalid': invalid,
    onBlur: () => setTouched(true),
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
  };

  return <label className={`field ${wide ? 'field-wide' : ''}`} htmlFor={id}>
    <span className="field-label">{label}{required && <><b className="required-mark">*</b><small>{tx(lang, 'Required', 'مطلوب')}</small></>}</span>
    {type === 'textarea'
      ? <textarea {...common} rows={rows} />
      : <input {...common} type={type} />}
    {hint && <small className="field-helper">{hint}</small>}
    {limit && state && <div className={`field-feedback ${feedbackClass}`} aria-live="polite">
      <span>{tx(lang, `${state.count} / ${limit.max} characters · ${state.remaining} left`, `${state.count} من ${limit.max} حرف · فاضل ${state.remaining}`)}</span>
      {feedback && <span role={state.overLimit || missing ? 'alert' : undefined}>{feedback}</span>}
    </div>}
    {missing && !limit && <small className="field-feedback error" role="alert">{feedback}</small>}
  </label>;
}

function SelectField({ label, value, onChange, options, lang }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; lang: Lang }) {
  return <label className="field">
    <span className="field-label">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>;
}

function IconButton({ children, onClick, label, danger = false, disabled = false }: { children: React.ReactNode; onClick: () => void; label: string; danger?: boolean; disabled?: boolean }) {
  return <button type="button" className={`icon-button ${danger ? 'danger' : ''}`} onClick={onClick} aria-label={label} title={label} disabled={disabled}>{children}</button>;
}

function SectionFrame({ title, hint, children, id }: { title: string; hint?: string; children: React.ReactNode; id: EditorSection }) {
  const [open, setOpen] = useState(true);
  const panelId = `editor-panel-${id}`;
  return <section className={`editor-section ${open ? 'section-open' : 'section-closed'}`} id={`editor-${id}`}>
    <div className="section-title-row"><h2><button type="button" className="section-toggle" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)}><span>{title}</span><span className="section-chevron" aria-hidden="true">⌄</span></button></h2>{hint && <p>{hint}</p>}</div>
    <div id={panelId} className={`section-collapse ${open ? 'is-open' : 'is-closed'}`} aria-hidden={!open} inert={!open}><div className="section-collapse-inner">{children}</div></div>
  </section>;
}

function AddButton({ children, onClick, disabled = false }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button type="button" className="add-button" onClick={onClick} disabled={disabled}><span aria-hidden="true">＋</span>{children}</button>;
}

/** يتحقق من ملف الصورة، يصغره على الجهاز، ويعيد Data URL مناسبًا للحفظ المحلي. */
async function optimizePortrait(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('image');
  if (file.size > 12 * 1024 * 1024) throw new Error('size');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('decode')); });
    const scale = Math.min(1, 640 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.84);
  } finally { URL.revokeObjectURL(url); }
}

type RecordWithId = { id: string };
type ListKey = 'experiences' | 'education' | 'projects' | 'certifications' | 'languages' | 'additional';

function CardActions({ index, length, onMove, onDuplicate, onDelete, lang, duplicateDisabled = false }: {
  index: number; length: number; onMove: (direction: -1 | 1) => void; onDuplicate: () => void; onDelete: () => void; lang: Lang; duplicateDisabled?: boolean;
}) {
  return <div className="card-actions">
    <span className="item-index">{String(index + 1).padStart(2, '0')}</span>
    <IconButton label={tx(lang, 'Move up', 'حرّك لفوق')} onClick={() => onMove(-1)} disabled={index === 0}>{'↑'}</IconButton>
    <IconButton label={tx(lang, 'Move down', 'حرّك لتحت')} onClick={() => onMove(1)} disabled={index === length - 1}>{'↓'}</IconButton>
    <IconButton label={tx(lang, 'Duplicate', 'كرّر')} onClick={onDuplicate} disabled={duplicateDisabled}>{'⧉'}</IconButton>
    <IconButton label={tx(lang, 'Remove section', 'امسح القسم')} onClick={onDelete} danger>{'×'}</IconButton>
  </div>;
}

function BulletEditor({ bullets, onChange, lang, idPrefix }: { bullets: string[]; onChange: (value: string[]) => void; lang: Lang; idPrefix: string }) {
  const filledCount = bullets.filter((bullet) => bullet.trim()).length;
  const atLimit = bullets.length >= COLLECTION_LIMITS.bulletsPerExperience;
  return <div className="bullet-editor">
    <div className="bullet-heading">
      <div><strong>{tx(lang, 'Impact bullets', 'إنجازاتك')}</strong><p>{tx(lang, 'Lead with an action and result. Aim for 3–5 points; concise bullets are easier to scan.', 'ابدأ بفعل ونتيجة، واكتب من 3 لـ5 نقط مختصرة وسهلة القراءة.')}</p></div>
      <span className="bullet-count">{filledCount} / {COLLECTION_LIMITS.bulletsPerExperience}</span>
    </div>
    <div className="bullet-guidance">{tx(lang, 'Recommended: 3–5 bullet points · Maximum 6 bullet points', 'الأفضل من 3 لـ5 نقط · بحد أقصى 6 نقط')}</div>
    {bullets.map((bullet, index) => {
      const state = characterState(bullet, TEXT_LIMITS.bullet);
      return <div className="bullet-row" key={`${idPrefix}-${index}`}>
        <span className="bullet-dot" aria-hidden="true">•</span>
        <div className="bullet-field-wrap">
          <input
            id={`${idPrefix}-bullet-${index}`}
            value={bullet}
            aria-label={tx(lang, `Achievement bullet ${index + 1}`, `إنجاز رقم ${index + 1}`)}
            aria-invalid={state.overLimit}
            onChange={(event) => onChange(bullets.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
            placeholder={tx(lang, 'e.g. Improved response time by 28% by simplifying the handoff.', 'مثال: قلّلت وقت الاستجابة 28٪ لما بسّطت خطوات التسليم.')}
          />
          <div className={`field-feedback ${state.overLimit ? 'error' : state.nearLimit ? 'warning' : 'normal'}`} aria-live="polite">
            <span>{tx(lang, `${state.count} / 180 characters · ${state.remaining} left`, `${state.count} من 180 حرف · فاضل ${state.remaining}`)}</span>
            {state.nearLimit && <span>{tx(lang, 'Recommended: 120 characters · Maximum: 180', 'الأفضل 120 حرف · بحد أقصى 180')}</span>}
            {state.overLimit && <span role="alert">{tx(lang, `${state.exceeded} characters over the limit. Shorten this bullet to protect page balance.`, `عدّيت الحد بـ ${state.exceeded} حرف. اختصر النقطة عشان تفضل الصفحة متوازنة.`)}</span>}
          </div>
        </div>
        <button type="button" className="remove-bullet" onClick={() => onChange(bullets.filter((_, itemIndex) => itemIndex !== index))} aria-label={tx(lang, `Remove bullet ${index + 1}`, `امسح الإنجاز ${index + 1}`)}>×</button>
      </div>;
    })}
    <button type="button" className="text-add" disabled={atLimit} onClick={() => onChange([...bullets, ''])}>
      ＋ {tx(lang, 'Add bullet', 'ضيف إنجاز')}
    </button>
    {atLimit && <p className="limit-note">{tx(lang, 'Maximum 6 bullet points. Remove one before adding another.', 'وصلت لـ6 إنجازات. امسح واحد قبل ما تضيف غيره.')}</p>}
  </div>;
}

function TagInput({ label, values, allSkills, onChange, placeholder, lang }: {
  label: string; values: string[]; allSkills: string[]; onChange: (values: string[]) => void; placeholder: string; lang: Lang;
}) {
  const [draft, setDraft] = useState('');
  const [attempted, setAttempted] = useState(false);
  const state = characterState(draft, TEXT_LIMITS.skill);
  const duplicate = allSkills.some((skill) => skill.trim().toLocaleLowerCase() === draft.trim().toLocaleLowerCase());
  const atLimit = allSkills.length >= COLLECTION_LIMITS.skills;
  const validationError = attempted && draft.trim() ? state.overLimit
    ? tx(lang, 'A skill can contain up to 40 characters.', 'المهارة ينفع يبقى طولها 40 حرف بالكتير.')
    : atLimit ? tx(lang, 'Maximum 20 skills across both skill groups.', 'ضيف لحد 20 مهارة للمجموعتين مع بعض.')
    : duplicate ? tx(lang, 'This skill is already listed.', 'المهارة دي مضافة قبل كده.') : '' : '';
  const add = () => {
    const value = draft.trim();
    setAttempted(true);
    if (!value || state.overLimit || atLimit || duplicate) return;
    onChange([...values, value]);
    setDraft('');
    setAttempted(false);
  };
  const remove = (value: string) => onChange(values.filter((item) => item !== value));

  return <div className="tag-field">
    <div className="tag-label-row"><span className="tag-label">{label}</span><span className="tag-total">{allSkills.length} / {COLLECTION_LIMITS.skills}</span></div>
    <div className="tags" aria-label={label}>
      {values.map((tag) => <span className="tag" key={tag}>{tag}<button type="button" onClick={() => remove(tag)} aria-label={tx(lang, `Remove ${tag}`, `امسح ${tag}`)}>×</button></span>)}
      <input
        value={draft}
        onChange={(event) => { setDraft(event.target.value); setAttempted(false); }}
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); add(); } }}
        onBlur={() => { if (draft.trim()) add(); }}
        aria-label={placeholder}
        placeholder={placeholder}
        aria-invalid={Boolean(validationError)}
      />
      <button type="button" className="tag-add" onClick={add} disabled={!draft.trim() || state.overLimit || atLimit || duplicate}>{tx(lang, 'Add', 'ضيف')}</button>
    </div>
    <div className={`field-feedback ${state.overLimit || validationError ? 'error' : state.nearLimit ? 'warning' : 'normal'}`} aria-live="polite">
      <span>{tx(lang, `${draft.length} / 40 characters · ${state.remaining} left`, `${draft.length} من 40 حرف · فاضل ${state.remaining}`)}</span>
      <span>{tx(lang, `${allSkills.length} / 20 skills across both groups`, `${allSkills.length} من 20 مهارة للمجموعتين`)}</span>
      {validationError && <span role="alert">{validationError}</span>}
    </div>
  </div>;
}

const sectionItems: Array<{id: CVSectionId; en: string; ar: string}> = [
  {id:'summary',en:'Professional Summary',ar:'نبذة عنك'}, {id:'experience',en:'Work Experience',ar:'الخبرة العملية'},
  {id:'education',en:'Education',ar:'التعليم'}, {id:'skills',en:'Skills',ar:'المهارات'}, {id:'projects',en:'Projects',ar:'المشروعات'},
  {id:'certifications',en:'Certifications',ar:'الشهادات'}, {id:'languages',en:'Languages',ar:'اللغات'}, {id:'additional',en:'Additional Sections',ar:'أقسام تانية'},
];
/** يدير ترتيب الأقسام وإظهارها؛ التعديل ينعكس في المعاينة والتصدير عبر CVData. */
function SectionManager({data,onChange,lang}:{data:CVData;onChange:(data:CVData)=>void;lang:Lang}) {
  const recommended: CVSectionId[] = ['summary','experience','skills','education','projects','certifications','languages','additional'];
  const order=data.sectionOrder?.length?data.sectionOrder:recommended;
  const hidden=new Set(data.hiddenSections||[]);
  const reorder=(from:number,to:number)=>{if(to<0||to>=order.length)return;const next=[...order];const [item]=next.splice(from,1);next.splice(to,0,item);onChange({...data,sectionOrder:next});};
  const toggle=(id:CVSectionId)=>{const next=new Set(hidden);next.has(id)?next.delete(id):next.add(id);onChange({...data,hiddenSections:[...next]});};
  let dragging=-1;
  return <section className="section-manager" aria-label={tx(lang,'Section manager','ترتيب الأقسام')}>
    <div className="manager-heading"><div><b>{tx(lang,'Section order','ترتيب الأقسام')}</b><span>{tx(lang,'Recommended order for experienced professionals · drag or use arrows','ترتيب مقترح · اسحب القسم أو استخدم الأسهم')}</span></div>
    <button type="button" className="manager-reset" onClick={()=>onChange({...data,sectionOrder:recommended})}>{tx(lang,'Reset to recommended','رجّع الترتيب المقترح')}</button></div>
    <ol>{order.map((id,index)=>{const item=sectionItems.find(x=>x.id===id)!;return <li key={id} draggable onDragStart={()=>{dragging=index;}} onDragOver={e=>e.preventDefault()} onDrop={()=>reorder(dragging,index)}>
      <button type="button" className="drag-grip" aria-label={tx(lang,`Drag ${item.en}`,`اسحب ${item.ar}`)} title={tx(lang,'Drag to reorder','اسحب عشان تغيّر الترتيب')}>⠿</button><span className="manager-index">{String(index+1).padStart(2,'0')}</span><b className={hidden.has(id)?'is-hidden':''}>{tx(lang,item.en,item.ar)}</b>
      <button type="button" className="manager-move" onClick={()=>reorder(index,index-1)} disabled={index===0} aria-label={tx(lang,'Move up','تحريك للأعلى')}>↑</button><button type="button" className="manager-move" onClick={()=>reorder(index,index+1)} disabled={index===order.length-1} aria-label={tx(lang,'Move down','تحريك للأسفل')}>↓</button>
      <button type="button" className={`visibility-toggle ${hidden.has(id)?'off':''}`} aria-pressed={!hidden.has(id)} onClick={()=>toggle(id)}>{hidden.has(id)?tx(lang,'Hidden','مستخبي'):tx(lang,'Visible','ظاهر')}</button>
    </li>})}</ol>
  </section>;
}
/** يبني شاشة التحرير كاملة، ويحوّل أحداث الحقول إلى تحديثات غير متزامنة للحالة العامة. */
export default function Editor({ data, onChange, activeSection, setActiveSection, lang }: Props) {
  const personalChange = (key: keyof PersonalInfo, value: string) => onChange({ ...data, personal: { ...data.personal, [key]: value } });
  const updateList = (key: ListKey, index: number, patch: Record<string, unknown>) => {
    const list = data[key] as unknown as RecordWithId[];
    onChange({ ...data, [key]: list.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) } as CVData);
  };
  const move = (key: ListKey, index: number, direction: -1 | 1) => {
    const list = [...(data[key] as unknown as RecordWithId[])];
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    onChange({ ...data, [key]: list } as CVData);
  };
  const duplicate = (key: ListKey, index: number) => {
    const list = [...(data[key] as unknown as RecordWithId[])];
    const copy = { ...list[index], id: uid(key.slice(0, 3)) };
    list.splice(index + 1, 0, copy);
    onChange({ ...data, [key]: list } as CVData);
  };
  const remove = (key: ListKey, index: number) => onChange({ ...data, [key]: (data[key] as unknown as RecordWithId[]).filter((_, itemIndex) => itemIndex !== index) } as CVData);
  const add = <T extends RecordWithId>(key: ListKey, value: T) => onChange({ ...data, [key]: [...(data[key] as unknown as RecordWithId[]), value] } as CVData);

  const nav: Array<[EditorSection, string]> = [
    ['personal', tx(lang, 'Basics', 'البيانات الأساسية')], ['summary', tx(lang, 'Summary', 'النبذة')], ['experience', tx(lang, 'Experience', 'الخبرة')],
    ['education', tx(lang, 'Education', 'التعليم')], ['skills', tx(lang, 'Skills', 'المهارات')], ['projects', tx(lang, 'Projects', 'المشروعات')],
    ['certifications', tx(lang, 'Certificates', 'الشهادات')], ['languages', tx(lang, 'Languages', 'اللغات')], ['additional', tx(lang, 'More', 'المزيد')],
  ];
  const [photoError, setPhotoError] = useState('');
  const [basicsOpen, setBasicsOpen] = useState(true);
  const allSkills = [...data.technicalSkills, ...data.softSkills];
  const educationFull = data.education.length >= COLLECTION_LIMITS.education;
  const projectsFull = data.projects.length >= COLLECTION_LIMITS.projects;
  const certificationsFull = data.certifications.length >= COLLECTION_LIMITS.certifications;
  const limitHint = (count: number, max: number) => tx(lang, `Maximum ${max} entries to keep the document focused.`, `ضيف لحد ${max} عناصر عشان السيرة تفضل مركّزة.`);

  return <div className="editor-wrap">
    <nav className="section-nav" aria-label={tx(lang, 'CV sections', 'أقسام السيرة')}>
      {nav.map(([id, label], index) => <button type="button" className={activeSection === id ? 'active' : ''} key={id} onClick={() => {
        setActiveSection(id);
        document.getElementById(`editor-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }}><span>{String(index + 1).padStart(2, '0')}</span>{label}</button>)}
    </nav>

    <div className="editor-content">
      <SectionManager data={data} onChange={onChange} lang={lang} />
      <section className={`editor-section ${basicsOpen ? 'section-open' : 'section-closed'}`} id="editor-personal">
        <button type="button" className="basics-toggle" aria-expanded={basicsOpen} aria-controls="basic-information-panel" onClick={() => setBasicsOpen(open => !open)}><span className="basics-icon" aria-hidden="true">♙</span><span><b>{tx(lang, 'Basic Information — البيانات الأساسية', 'Basic Information — البيانات الأساسية')}</b><small>{tx(lang, 'Your name, role, contact details and photo', 'الاسم والمسمى وبيانات التواصل والصورة')}</small></span><span className="basics-chevron" aria-hidden="true">⌄</span></button>
        <div id="basic-information-panel" className={`basics-panel section-collapse ${basicsOpen ? 'is-open' : 'is-closed'}`} role="region" aria-label={tx(lang, 'Basic Information', 'البيانات الأساسية')} aria-hidden={!basicsOpen} inert={!basicsOpen}><div className="section-collapse-inner"><p className="basics-hint">{tx(lang, 'These details appear at the top of your CV.', 'المعلومات دي هتظهر فوق في سيرتك.')}</p>
        <div className="form-grid">
          <Field id="full-name" label={tx(lang, 'Full name', 'اسمك بالكامل')} value={data.personal.fullName} onChange={(value) => personalChange('fullName', value)} placeholder={tx(lang, 'e.g. Mohamed Fahim', 'مثال: محمد فهيم')} limit={TEXT_LIMITS.fullName} required lang={lang} />
          <Field id="professional-title" label={tx(lang, 'Professional title', 'المسمّى المهني')} value={data.personal.title} onChange={(value) => personalChange('title', value)} placeholder={tx(lang, 'e.g. Your professional title', 'مثال: المسمّى المهني')} limit={TEXT_LIMITS.professionalTitle} required lang={lang} />
          <Field label={tx(lang, 'Email', 'الإيميل')} value={data.personal.email} onChange={(value) => personalChange('email', value)} type="email" placeholder="name@example.com" lang={lang} />
          <Field label={tx(lang, 'Phone', 'رقم الموبايل')} value={data.personal.phone} onChange={(value) => personalChange('phone', value)} placeholder="+20 ..." lang={lang} />
          <Field label={tx(lang, 'City and country', 'المدينة والدولة')} value={data.personal.location} onChange={(value) => personalChange('location', value)} placeholder={tx(lang, 'e.g. Cairo, Egypt', 'مثال: القاهرة، مصر')} lang={lang} />
          {([['linkedin', 'LinkedIn', 'linkedin.com/in/yourname'], ['github', 'GitHub', 'github.com/yourname'], ['portfolio', tx(lang, 'Portfolio / website', 'موقعك أو بورتفوليوك'), 'yourportfolio.com']] as Array<[LinkKey, string, string]>).map(([key, label, placeholder]) => <div className="field field-wide social-link-fields" key={key}><span className="field-label">{label}</span><Field label={tx(lang, 'URL', 'الرابط')} value={data.personal[key] || ''} onChange={(value) => personalChange(key, value)} placeholder={placeholder} lang={lang} />{data.personal[key]?.trim() && !safeExternalUrl(data.personal[key]) && <small className="field-feedback error" role="alert">{tx(lang, 'Enter a valid HTTP or HTTPS address.', 'أدخل رابطًا صحيحًا يبدأ بـ HTTP أو HTTPS.')}</small>}<Field label={tx(lang, 'Display name', 'اسم العرض')} value={data.personal[`${key}DisplayName` as keyof typeof data.personal] as string || ''} onChange={(value) => personalChange(`${key}DisplayName` as keyof PersonalInfo, value)} placeholder={tx(lang, `e.g. ${label} Profile`, `مثال: الملف الشخصي على ${label}`)} lang={lang} /></div>)}
          <div className="photo-upload field-wide">
            <div className="photo-upload-copy"><b>{tx(lang, 'Profile photo (optional)', 'صورتك الشخصية (اختياري)')}</b><span>{tx(lang, 'Only appears in the Profile Photo layout. Some ATS systems do not support photos. Saved on this device and never uploaded.', 'هتظهر في قالب الصورة الشخصية بس. بعض أنظمة ATS مش بتقبل الصور. بنحفظها على جهازك ومش بنرفعها.')}</span></div>
            <div className="photo-upload-actions">
              {data.personal.photo && <img className="photo-upload-preview" src={data.personal.photo} alt={tx(lang, 'Your profile photo', 'صورتك الشخصية')} />}
              <label className="photo-select-button">{tx(lang, data.personal.photo ? 'Replace photo' : 'Choose a photo', data.personal.photo ? 'غيّر الصورة' : 'اختار صورة')}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; setPhotoError(''); void optimizePortrait(file).then((photo) => personalChange('photo', photo)).catch((error: Error) => setPhotoError(error.message === 'size' ? tx(lang, 'Choose an image smaller than 12 MB.', 'اختار صورة حجمها أقل من 12 ميجابايت.') : tx(lang, 'Could not use that image. Try a JPG, PNG, or WebP file.', 'ماقدرناش نستخدم الصورة دي. جرّب ملف JPG أو PNG أو WebP.'))); event.target.value = ''; }} />
              </label>
              {data.personal.photo && <button type="button" className="photo-remove-button" onClick={() => personalChange('photo', '')}>{tx(lang, 'Remove', 'امسح الصورة')}</button>}
            </div>
            {photoError && <small className="photo-error" role="alert">{photoError}</small>}
          </div>
        </div>
        </div>
        </div>
      </section>

      <SectionFrame id="summary" title={tx(lang, 'Professional summary', 'نبذة عنك')} hint={tx(lang, 'In 3–4 lines, connect your experience with the value you bring.', 'في 3 أو 4 سطور، وضّح خبرتك والقيمة اللي بتضيفها.') }>
        <Field label={tx(lang, 'Summary / profile', 'نبذة عنك')} value={data.summary} onChange={(value) => onChange({ ...data, summary: value })} type="textarea" wide limit={TEXT_LIMITS.summary} rows={4} placeholder={tx(lang, 'Write a concise summary of your experience and goals...', 'اكتب نبذة مختصرة عن خبرتك وأهدافك...')} hint={tx(lang, 'Lead with your current role, years of experience, and one measurable outcome.', 'ابدأ بوظيفتك الحالية، وسنين خبرتك، ونتيجة واحدة بالأرقام.') } lang={lang} />
      </SectionFrame>

      <SectionFrame id="experience" title={tx(lang, 'Work experience', 'الخبرة العملية')} hint={tx(lang, 'Start with your latest role and show outcomes, not only responsibilities.', 'ابدأ بآخر وظيفة، وركّز على النتايج مش المسؤوليات بس.') }>
        {data.experiences.map((item, index) => <div className="repeat-card" key={item.id}>
          <CardActions index={index} length={data.experiences.length} lang={lang} onMove={(direction) => move('experiences', index, direction)} onDuplicate={() => duplicate('experiences', index)} onDelete={() => remove('experiences', index)} />
          <div className="form-grid">
            <Field label={tx(lang, 'Job title', 'المسمّى الوظيفي')} value={item.jobTitle} onChange={(value) => updateList('experiences', index, { jobTitle: value })} placeholder={tx(lang, 'e.g. Your job title', 'مثال: المسمّى الوظيفي')} limit={TEXT_LIMITS.experienceTitle} lang={lang} />
            <Field label={tx(lang, 'Company', 'الشركة')} value={item.company} onChange={(value) => updateList('experiences', index, { company: value })} placeholder={tx(lang, 'e.g. Company or organization', 'مثال: الشركة أو المؤسسة')} limit={TEXT_LIMITS.company} lang={lang} />
            <Field label={tx(lang, 'Location', 'المكان')} value={item.location} onChange={(value) => updateList('experiences', index, { location: value })} placeholder={tx(lang, 'City, country', 'المدينة، الدولة')} lang={lang} />
            <Field label={tx(lang, 'From', 'من')} value={item.startDate} onChange={(value) => updateList('experiences', index, { startDate: value })} placeholder="2022" lang={lang} />
            <Field label={tx(lang, 'To', 'لحد')} value={item.endDate} onChange={(value) => updateList('experiences', index, { endDate: value })} placeholder="2024" lang={lang} />
            <label className="checkbox-field"><input type="checkbox" checked={item.current} onChange={(event) => updateList('experiences', index, { current: event.target.checked })} /><span>{tx(lang, 'I work here now', 'لسه شغال هنا')}</span></label>
            <Field label={tx(lang, 'Role context (optional)', 'وصف بسيط (اختياري)')} value={item.description} onChange={(value) => updateList('experiences', index, { description: value })} type="textarea" wide limit={TEXT_LIMITS.description} rows={3} placeholder={tx(lang, 'Briefly describe the team, product, or scope of your role.', 'اكتب نبذة صغيرة عن الفريق أو المنتج أو دورك.') } lang={lang} />
          </div>
          <BulletEditor bullets={item.bullets} onChange={(bullets) => updateList('experiences', index, { bullets })} lang={lang} idPrefix={`experience-${index}`} />
        </div>)}
        <AddButton onClick={() => add('experiences', { id: uid('exp'), jobTitle: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '', bullets: ['', '', ''] })}>{tx(lang, 'Add experience', 'ضيف خبرة')}</AddButton>
      </SectionFrame>

      <SectionFrame id="education" title={tx(lang, 'Education', 'التعليم')} hint={tx(lang, 'Add your degree, institution, and dates.', 'اكتب مؤهلك الدراسي والجامعة والتواريخ.') }>
        {data.education.map((item, index) => <div className="repeat-card" key={item.id}>
          <CardActions index={index} length={data.education.length} lang={lang} onMove={(direction) => move('education', index, direction)} onDuplicate={() => duplicate('education', index)} onDelete={() => remove('education', index)} duplicateDisabled={educationFull} />
          <div className="form-grid">
            <Field label={tx(lang, 'Degree / field', 'الدرجة / التخصص')} value={item.degree} onChange={(value) => updateList('education', index, { degree: value })} placeholder={tx(lang, 'e.g. Degree or field', 'مثال: الدرجة أو التخصص')} lang={lang} />
            <Field label={tx(lang, 'University / institution', 'الجامعة أو المؤسسة')} value={item.institution} onChange={(value) => updateList('education', index, { institution: value })} placeholder={tx(lang, 'e.g. University or institution', 'مثال: الجامعة أو المؤسسة')} limit={TEXT_LIMITS.institution} lang={lang} />
            <Field label={tx(lang, 'Location', 'المكان')} value={item.location} onChange={(value) => updateList('education', index, { location: value })} placeholder={tx(lang, 'City, country', 'المدينة، الدولة')} lang={lang} />
            <Field label={tx(lang, 'From', 'من')} value={item.startDate} onChange={(value) => updateList('education', index, { startDate: value })} placeholder="2019" lang={lang} />
            <Field label={tx(lang, 'To', 'لحد')} value={item.endDate} onChange={(value) => updateList('education', index, { endDate: value })} placeholder="2023" lang={lang} />
            <Field label={tx(lang, 'Details (optional)', 'تفاصيل (اختياري)')} value={item.description} onChange={(value) => updateList('education', index, { description: value })} type="textarea" wide limit={TEXT_LIMITS.description} rows={3} placeholder={tx(lang, 'Add a relevant distinction, thesis, or achievement.', 'اكتب تميّزك أو مشروع تخرج أو إنجاز ليه علاقة.') } lang={lang} />
          </div>
        </div>)}
        <AddButton onClick={() => add('education', { id: uid('edu'), degree: '', institution: '', location: '', startDate: '', endDate: '', description: '' })} disabled={educationFull}>{tx(lang, 'Add education', 'ضيف تعليم')}</AddButton>
        {educationFull && <p className="limit-note">{limitHint(data.education.length, COLLECTION_LIMITS.education)}</p>}
      </SectionFrame>

      <SectionFrame id="skills" title={tx(lang, 'Skills', 'المهارات')} hint={tx(lang, 'Choose searchable skills that match the role. Skip rating bars.', 'اكتب مهارات مناسبة للوظيفة وسهل على مسؤولي التوظيف يلاقوها. بلاش أشرطة تقييم.') }>
        <TagInput label={tx(lang, 'Technical skills', 'مهارات تقنية')} values={data.technicalSkills} allSkills={allSkills} onChange={(values) => onChange({ ...data, technicalSkills: values })} placeholder={tx(lang, 'Type a skill and press Enter', 'اكتب مهارة ودوس Enter')} lang={lang} />
        <TagInput label={tx(lang, 'Professional skills', 'المهارات المهنية')} values={data.softSkills} allSkills={allSkills} onChange={(values) => onChange({ ...data, softSkills: values })} placeholder={tx(lang, 'e.g. Communication, collaboration', 'مثال: تواصل، تعاون')} lang={lang} />
        {allSkills.length >= COLLECTION_LIMITS.skills && <p className="limit-note">{tx(lang, 'Maximum 20 skills across both groups.', 'ضيف لحد 20 مهارة للمجموعتين مع بعض.')}</p>}
      </SectionFrame>

      <SectionFrame id="projects" title={tx(lang, 'Projects', 'المشروعات')} hint={tx(lang, 'Show what you built and the outcome or audience it served.', 'اكتب إيه اللي عملته، ونتيجته، أو مين استفاد منه.') }>
        {data.projects.map((item, index) => <div className="repeat-card" key={item.id}>
          <CardActions index={index} length={data.projects.length} lang={lang} onMove={(direction) => move('projects', index, direction)} onDuplicate={() => duplicate('projects', index)} onDelete={() => remove('projects', index)} duplicateDisabled={projectsFull} />
          <div className="form-grid">
            <Field label={tx(lang, 'Project name', 'اسم المشروع')} value={item.name} onChange={(value) => updateList('projects', index, { name: value })} placeholder={tx(lang, 'e.g. Project name', 'مثال: اسم المشروع')} limit={TEXT_LIMITS.projectName} lang={lang} />
            <Field label={tx(lang, 'Tools / technologies', 'الأدوات أو التقنيات')} value={item.technologies} onChange={(value) => updateList('projects', index, { technologies: value })} placeholder="Figma, React, SQL" limit={TEXT_LIMITS.technologies} lang={lang} />
            <Field label={tx(lang, 'What did you build?', 'إيه اللي عملته؟')} value={item.description} onChange={(value) => updateList('projects', index, { description: value })} type="textarea" wide limit={TEXT_LIMITS.description} rows={3} placeholder={tx(lang, 'Built a planning tool that helps students turn a course syllabus into a weekly plan.', 'طورت أداة تساعد الطلاب على تحويل المنهج لحد خطة أسبوعية.') } lang={lang} />
            {([['link', 'linkDisplayName', tx(lang, 'Project link', 'لينك المشروع'), 'yourproject.com'], ['github', 'githubDisplayName', 'GitHub', 'github.com/yourname/project']] as const).map(([urlKey, labelKey, label, placeholder]) => <div className="form-grid social-link-fields" key={urlKey}><Field label={tx(lang, 'URL', 'الرابط')} value={item[urlKey] || ''} onChange={(value) => updateList('projects', index, { [urlKey]: value })} placeholder={placeholder} lang={lang} />{item[urlKey]?.trim() && !safeExternalUrl(item[urlKey]) && <small className="field-feedback error" role="alert">{tx(lang, 'Enter a valid HTTP or HTTPS address.', 'أدخل رابطًا صحيحًا يبدأ بـ HTTP أو HTTPS.')}</small>}<Field label={tx(lang, 'Display name', 'اسم العرض')} value={item[labelKey] || ''} onChange={(value) => updateList('projects', index, { [labelKey]: value })} placeholder={tx(lang, `e.g. ${label}`, `مثال: ${label}`)} lang={lang} /></div>)}
          </div>
        </div>)}
        <AddButton onClick={() => add('projects', { id: uid('proj'), name: '', description: '', technologies: '', link: '', github: '', linkDisplayName: '', githubDisplayName: '' })} disabled={projectsFull}>{tx(lang, 'Add project', 'ضيف مشروع')}</AddButton>
        {projectsFull && <p className="limit-note">{limitHint(data.projects.length, COLLECTION_LIMITS.projects)}</p>}
      </SectionFrame>

      <SectionFrame id="certifications" title={tx(lang, 'Certifications', 'الشهادات')} hint={tx(lang, 'Add the credential and issuing organization; include a date if useful.', 'اكتب الشهادة والمكان أو الجهة اللي منحتها، والتاريخ لو مهم.') }>
        {data.certifications.map((item, index) => <div className="repeat-card" key={item.id}>
          <CardActions index={index} length={data.certifications.length} lang={lang} onMove={(direction) => move('certifications', index, direction)} onDuplicate={() => duplicate('certifications', index)} onDelete={() => remove('certifications', index)} duplicateDisabled={certificationsFull} />
          <div className="form-grid">
            <Field label={tx(lang, 'Certification', 'اسم الشهادة')} value={item.name} onChange={(value) => updateList('certifications', index, { name: value })} placeholder={tx(lang, 'e.g. Certification name', 'مثال: اسم الشهادة')} limit={TEXT_LIMITS.certification} lang={lang} />
            <Field label={tx(lang, 'Issuing organization', 'المكان أو الجهة المانحة')} value={item.organization} onChange={(value) => updateList('certifications', index, { organization: value })} placeholder={tx(lang, 'e.g. Issuing organization', 'مثال: الجهة المانحة')} limit={TEXT_LIMITS.institution} lang={lang} />
            <Field label={tx(lang, 'Date', 'التاريخ')} value={item.date} onChange={(value) => updateList('certifications', index, { date: value })} placeholder="2024" lang={lang} />
            <Field label={tx(lang, 'Credential link (optional)', 'لينك التحقق (اختياري)')} value={item.credential} onChange={(value) => updateList('certifications', index, { credential: value })} placeholder="credential.example/verify" lang={lang} />
          </div>
        </div>)}
        <AddButton onClick={() => add('certifications', { id: uid('cert'), name: '', organization: '', date: '', credential: '' })} disabled={certificationsFull}>{tx(lang, 'Add certification', 'ضيف شهادة')}</AddButton>
        {certificationsFull && <p className="limit-note">{limitHint(data.certifications.length, COLLECTION_LIMITS.certifications)}</p>}
      </SectionFrame>

      <SectionFrame id="languages" title={tx(lang, 'Languages', 'اللغات')} hint={tx(lang, 'Choose a clear proficiency level.', 'اختار مستوى إتقان واضح.') }>
        {data.languages.map((item, index) => <div className="repeat-card compact-card" key={item.id}>
          <CardActions index={index} length={data.languages.length} lang={lang} onMove={(direction) => move('languages', index, direction)} onDuplicate={() => duplicate('languages', index)} onDelete={() => remove('languages', index)} />
          <div className="form-grid">
            <Field label={tx(lang, 'Language', 'اللغة')} value={item.language} onChange={(value) => updateList('languages', index, { language: value })} placeholder={tx(lang, 'e.g. English', 'مثال: العربي')} limit={TEXT_LIMITS.skill} lang={lang} />
            <SelectField label={tx(lang, 'Proficiency', 'مستواك في اللغة')} value={item.level} onChange={(value) => updateList('languages', index, { level: value })} lang={lang} options={[
              { value: 'Beginner', label: tx(lang, 'Beginner', 'مبتدئ') }, { value: 'Intermediate', label: tx(lang, 'Intermediate', 'متوسط') },
              { value: 'Advanced', label: tx(lang, 'Advanced', 'متقدم') }, { value: 'Professional', label: tx(lang, 'Professional', 'كويس جدًا') },
              { value: 'Fluent', label: tx(lang, 'Fluent', 'بطلاقة') }, { value: 'Native', label: tx(lang, 'Native', 'لغة أم') },
            ]} />
          </div>
        </div>)}
        <AddButton onClick={() => add('languages', { id: uid('lang'), language: '', level: 'Intermediate' })}>{tx(lang, 'Add language', 'ضيف لغة')}</AddButton>
      </SectionFrame>

      <SectionFrame id="additional" title={tx(lang, 'Additional sections', 'أقسام تانية')} hint={tx(lang, 'Add relevant achievements, courses, volunteer work, or research.', 'ضيف إنجازات أو كورسات أو تطوع أو أبحاث ليها علاقة بالوظيفة.') }>
        {data.additional.map((item, index) => <div className="repeat-card" key={item.id}>
          <CardActions index={index} length={data.additional.length} lang={lang} onMove={(direction) => move('additional', index, direction)} onDuplicate={() => duplicate('additional', index)} onDelete={() => remove('additional', index)} />
          <div className="form-grid">
            <SelectField label={tx(lang, 'Section type', 'نوع القسم')} value={item.kind} onChange={(value) => updateList('additional', index, { kind: value })} lang={lang} options={additionalKinds.map((kind) => ({ value: kind.key, label: tx(lang, kind.en, kind.ar) }))} />
            {item.kind === 'Custom' && <Field label={tx(lang, 'Custom section heading', 'اسم القسم')} value={item.customHeading || ''} onChange={(value) => updateList('additional', index, { customHeading: value })} placeholder={tx(lang, 'e.g. Professional Achievements', 'مثال: إنجازات في الشغل')} limit={TEXT_LIMITS.experienceTitle} lang={lang} />}
            <Field label={tx(lang, 'Title', 'العنوان')} value={item.title} onChange={(value) => updateList('additional', index, { title: value })} placeholder={tx(lang, 'e.g. Title', 'مثال: العنوان')} limit={TEXT_LIMITS.experienceTitle} lang={lang} />
            <Field label={tx(lang, 'Organization', 'المكان أو الجهة')} value={item.organization} onChange={(value) => updateList('additional', index, { organization: value })} placeholder={tx(lang, 'Organization or community', 'المؤسسة أو المجتمع')} limit={TEXT_LIMITS.institution} lang={lang} />
            <Field label={tx(lang, 'From', 'من')} value={item.startDate} onChange={(value) => updateList('additional', index, { startDate: value })} placeholder="2022" lang={lang} />
            <Field label={tx(lang, 'To', 'لحد')} value={item.endDate} onChange={(value) => updateList('additional', index, { endDate: value })} placeholder="2024" lang={lang} />
            <Field label={tx(lang, 'Details', 'تفاصيل')} value={item.description} onChange={(value) => updateList('additional', index, { description: value })} type="textarea" wide limit={TEXT_LIMITS.description} rows={3} placeholder={tx(lang, 'Describe your contribution and who it helped.', 'احكي عن مساهمتك ومين استفاد منها.') } lang={lang} />
          </div>
          <BulletEditor bullets={item.bullets} onChange={(bullets) => updateList('additional', index, { bullets })} lang={lang} idPrefix={`additional-${index}`} />
        </div>)}
        <AddButton onClick={() => add('additional', { id: uid('add'), kind: 'Achievement', title: '', organization: '', startDate: '', endDate: '', description: '', bullets: [] })}>{tx(lang, 'Add section', 'ضيف قسم')}</AddButton>
      </SectionFrame>
    </div>
  </div>;
}
