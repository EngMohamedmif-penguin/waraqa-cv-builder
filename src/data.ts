/**
 * مصدر البيانات الثابتة: تعريف القوالب ولوحات الألوان، بيانات البداية الفارغة
 * والمثال، وترجمة القيم المعروضة. تعتمد App وEditor وCVPreview وexport على هذه الوحدة.
 */
import type { CVColorId, CVData, TemplateId } from './types';

export const templateMeta: Record<TemplateId, { name: string; subtitle: string; note: string; nameAr: string; subtitleAr: string; noteAr: string }> = {
  classic: { name: 'ATS Classic', subtitle: 'Traditional & clear', note: 'A steady single-column layout', nameAr: 'ATS كلاسيك', subtitleAr: 'تقليدي وواضح', noteAr: 'تخطيط رأسي سهل القراءة' },
  modern: { name: 'ATS Modern', subtitle: 'Centered editorial', note: 'A centered masthead with a fresh, structured rhythm', nameAr: 'ATS مودرن', subtitleAr: 'تحريري بترويسة في النص', noteAr: 'خط جديد وترويسة وسط الصفحة وتقسيم أوضح' },
  compact: { name: 'ATS Compact', subtitle: 'Focused & efficient', note: 'Balanced spacing for longer histories', nameAr: 'ATS كومباكت', subtitleAr: 'مركز وعملي', noteAr: 'مسافات موفرة للخبرات الطويلة' },
  executive: { name: 'Executive Focus', subtitle: 'Achievement-led & polished', note: 'A refined, ATS-safe single-column design', nameAr: 'إكزكيوتيف فوكس', subtitleAr: 'يركز على الإنجازات', noteAr: 'تصميم أنيق وسهل القراءة' },
  mint: { name: 'Mint Timeline', subtitle: 'Green-line timeline', note: 'Dates on the left, details on the right', nameAr: 'مينت تايملاين', subtitleAr: 'خط زمني بلمسات خضرا', noteAr: 'التواريخ على الجنب والتفاصيل جنبها' },
  photo: { name: 'Profile Photo', subtitle: 'Photo-ready profile', note: 'Optional portrait and polished header', nameAr: 'بروفايل بصورة', subtitleAr: 'قالب اختياري بصورة شخصية', noteAr: 'صورة اختيارية وترويسة مرتبة' },
};

export type CVPalette = { name: { en: string; ar: string }; note: { en: string; ar: string }; heading: string; accent: string; divider: string };
export const cvColorIds: CVColorId[] = ['none', 'blue', 'forest', 'teal', 'burgundy'];
export const cvColorPalettes: Record<CVColorId, CVPalette> = {
  none: { name: { en: 'No color', ar: 'من غير ألوان' }, note: { en: 'Black & gray only', ar: 'أسود ورمادي بس' }, heading: '#252525', accent: '#343434', divider: '#B8B8B8' },
  blue: { name: { en: 'Professional blue', ar: 'أزرق مهني' }, note: { en: 'A crisp, print-ready professional blue', ar: 'أزرق هادي وواضح في الطباعة' }, heading: '#1F5E99', accent: '#2B6FB0', divider: '#BCCBDA' },
  forest: { name: { en: 'Forest green', ar: 'أخضر غابي' }, note: { en: 'Grounded & composed', ar: 'هادي ومتزن' }, heading: '#315F50', accent: '#427361', divider: '#C1D0C8' },
  teal: { name: { en: 'Professional teal', ar: 'أزرق مخضر' }, note: { en: 'Modern & restrained', ar: 'عصري وهادي' }, heading: '#25636A', accent: '#347E83', divider: '#BFD1D2' },
  burgundy: { name: { en: 'Soft burgundy', ar: 'عنابي هادئ' }, note: { en: 'Formal & refined', ar: 'رسمي وأنيق' }, heading: '#783B4B', accent: '#965367', divider: '#D4BEC4' },
};

const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export const emptyData = (): CVData => ({
  personal: { fullName: '', title: '', phone: '', email: '', location: '', linkedin: '', github: '', portfolio: '' },
  sectionOrder: ['summary','experience','education','skills','projects','certifications','languages','additional'], hiddenSections: [],
  summary: '', experiences: [], education: [], technicalSkills: [], softSkills: [], projects: [], certifications: [], languages: [], additional: [],
});

export const sampleData = (): CVData => ({
  personal: {
    fullName: 'Mohamed Fahim',
    title: 'Agricultural Engineering | Digital Agriculture & Smart Systems',
    phone: '+20 109 449 1212',
    email: 'eng.muhammad.fahim@gmail.com',
    location: 'Cairo, Egypt',
    linkedin: 'https://www.linkedin.com/in/muhammad-mif-550a132b1',
    github: 'https://github.com/EngMohamedmif-penguin',
    portfolio: '',
  },
  sectionOrder: ['summary','experience','education','skills','projects','certifications','languages','additional'], hiddenSections: [],
  summary: 'Agricultural Engineering graduate specializing in Environmental Control and Smart Agricultural Systems, with multidisciplinary experience in irrigation engineering, greenhouse technology, agricultural electronics, AI applications, web development, and smart farming solutions. Interested in Digital Agriculture, Precision Agriculture, IoT, agricultural digital transformation, and data-driven farming systems. Experienced in combining agricultural engineering knowledge with modern technologies including Artificial Intelligence, sensors, Arduino, and web technologies to develop practical smart-agriculture solutions. Seeking opportunities in Digital Agriculture, Smart Agriculture, Agricultural Technology, and related engineering and technology roles.',
  experiences: [
    {
      id: id('exp'), jobTitle: 'Irrigation Systems & Softscape Professional', company: "Alrua'a Landscaping", location: '', startDate: 'Jul 2025', endDate: 'Aug 2025', current: false,
      description: '',
      bullets: ['Completed a 45-hour practical course covering irrigation system design, installation, and softscape landscaping.', 'Trained by specialized irrigation and softscape engineers.'],
    },
    {
      id: id('exp'), jobTitle: 'Freelance Development Training', company: 'ITIDA Gigs Program', location: '', startDate: 'May 2025', endDate: 'Jul 2025', current: false,
      description: '',
      bullets: ['Completed a 3-month freelance development training program.', 'Certified as a qualified freelancer.'],
    },
    {
      id: id('exp'), jobTitle: 'Front-End Developer Trainee', company: 'Digital Egypt Builders Initiative (DEBI)', location: '', startDate: 'May 2024', endDate: 'Nov 2024', current: false,
      description: '',
      bullets: ['Built responsive web applications using HTML, CSS, JavaScript, and Angular.', 'Contributed to the Robabookia online book marketplace project.', 'Used Git and GitHub for development and code management.'],
    },
    {
      id: id('exp'), jobTitle: 'AI & Digital Agriculture Projects', company: '', location: '', startDate: 'Apr 2024', endDate: 'May 2024', current: false,
      description: '',
      bullets: ['Completed AI foundations training covering core Artificial Intelligence and Machine Learning concepts.', 'Built "FarmFlow", a smart agriculture dashboard using AI-assisted development tools.'],
    },
    {
      id: id('exp'), jobTitle: 'Summer Training — Electronics & Arduino Programming', company: 'AEnRI / Agricultural Research Center', location: '', startDate: 'Sep 2024', endDate: 'Sep 2024', current: false,
      description: '',
      bullets: ['Hands-on training in agricultural electronics and Arduino programming.', 'Applied Arduino and sensor integration concepts.'],
    },
    {
      id: id('exp'), jobTitle: 'Summer Training — Irrigation & Land Surveying', company: 'AEnRI / Agricultural Research Center', location: '', startDate: 'Jul 2024', endDate: 'Jul 2024', current: false,
      description: '',
      bullets: ['Practical training in irrigation network design.', 'Applied precision land measurement and surveying techniques.'],
    },
    {
      id: id('exp'), jobTitle: 'Practical Training — Greenhouse Technology & Nursery Production', company: 'Climate Modification Research Lab (CLM), Agricultural Research Center', location: '', startDate: 'Jun 2024', endDate: 'Jun 2024', current: false,
      description: '',
      bullets: ['Training in protected agriculture and greenhouse technology.', 'Practical training in colored pepper cultivation.', 'Covered nursery production methods and greenhouse metallic structure components.'],
    },
  ],
  education: [{
    id: id('edu'), degree: 'B.Sc. in Agricultural Engineering', institution: 'Al-Azhar University, Faculty of Agricultural Engineering', location: 'Cairo, Egypt', startDate: '', endDate: '2026',
    description: 'Environmental Control & Structures Department',
  }],
  technicalSkills: ['Digital Agriculture', 'Precision Agriculture', 'Smart Farming Systems', 'Irrigation Systems', 'Greenhouse Technology', 'Agricultural Electronics', 'Sensor Integration', 'Environmental Monitoring', 'Sustainable Agriculture', 'HTML5', 'CSS3', 'JavaScript', 'Bootstrap', 'Tailwind CSS', 'Python', 'Angular', 'Arduino Programming', 'Git', 'GitHub', 'AI Fundamentals', 'Machine Learning Fundamentals', 'AI Applications in Agriculture', 'AI-Assisted Development', 'Prompt Engineering', 'AutoCAD', 'Figma', 'Canva', 'Microsoft Word', 'Microsoft Excel', 'Microsoft PowerPoint'],
  softSkills: ['Problem Solving', 'Effective Communication', 'Teamwork & Collaboration', 'Presentation', 'Research', 'Self-Learning'],
  projects: [{
    id: id('proj'), name: 'FarmFlow',
    description: 'Smart agriculture dashboard developed as part of my AI and Digital Agriculture work using AI-assisted development tools.',
    technologies: 'Environmental Control, Evaporative Cooling, Experimental Design, Data Analysis, Greenhouse Systems, Sustainable Agriculture', link: '', github: '',
  }],
  certifications: [
    { id: id('cert'), name: 'Artificial Intelligence Ambassadors Program', organization: 'NTI & MCIT', date: '', credential: '' },
    { id: id('cert'), name: 'AI for Everyone (AI4E)', organization: 'Mahara-Tech / ITI', date: '', credential: '' },
    { id: id('cert'), name: 'Artificial Intelligence for Juniors', organization: 'Mahara-Tech / ITI', date: '', credential: '' },
    { id: id('cert'), name: 'Digital Egypt Pioneers Program (DEPI) — Front-End Developer Track', organization: '', date: '', credential: '' },
    { id: id('cert'), name: 'Business English Professional Certificate', organization: 'Berlitz Egypt & SYE Community', date: '', credential: '' },
    { id: id('cert'), name: 'Irrigation Systems & Softscape Professional Course', organization: "Alrua'a Landscaping", date: '', credential: '' },
    { id: id('cert'), name: 'Greenhouse Technology Training', organization: 'CLM / ARC', date: '', credential: '' },
    { id: id('cert'), name: 'Irrigation Systems & Land Surveying Training', organization: 'AEnRI / ARC', date: '', credential: '' },
    { id: id('cert'), name: 'Agricultural Electronics & Arduino Training', organization: 'AEnRI / ARC', date: '', credential: '' },
    { id: id('cert'), name: 'ITIDA Gigs Program — Freelance Development Training', organization: '', date: '', credential: '' },
  ],
  languages: [{ id: id('lang'), language: 'Arabic', level: 'Native' }, { id: id('lang'), language: 'English', level: 'Intermediate' }],
  additional: [],
});

export const additionalKinds = [
  { key: 'Custom', en: 'Custom Section', ar: 'قسم من اختيارك' },
  { key: 'Achievement', en: 'Achievement', ar: 'إنجاز' },
  { key: 'Course', en: 'Course', ar: 'كورس' },
  { key: 'Volunteer Experience', en: 'Volunteer Experience', ar: 'تطوع' },
  { key: 'Publication', en: 'Publication', ar: 'نشر'  },
  { key: 'Research', en: 'Research', ar: 'بحث' },
  { key: 'Extra Experience', en: 'Extra Experience', ar: 'خبرة زيادة' },
] as const;

export function localizeAdditionalKind(kind: string, lang: 'en' | 'ar'): string {
  const match = additionalKinds.find((item) => item.key === kind || item.en === kind || item.ar === kind);
  return lang === 'ar' ? (match?.ar ?? kind) : (match?.en ?? kind);
}

export function localizeProficiency(level: string, lang: 'en' | 'ar'): string {
  if (lang === 'en') return level;
  const translations: Record<string, string> = {
    Beginner: 'مبتدئ', Intermediate: 'متوسط', Advanced: 'متقدم', Fluent: 'بطلاقة', Native: 'لغة أم', Professional: 'كويس جدًا',
  };
  return translations[level] ?? level;
}

export const uid = id;


export function getTemplatePalette(template: TemplateId, color: CVColorId): CVPalette {
  const palette = cvColorPalettes[color];
  if (template !== 'mint') return palette;
  return { ...palette, name: { en: 'Mint green', ar: 'أخضر نعناع' }, note: { en: 'Fixed accent for this layout', ar: 'لون ثابت للقالب ده' }, heading: '#283b34', accent: '#294f43', divider: '#8bcbb7' };
}
