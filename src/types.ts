/**
 * نماذج البيانات المشتركة بين المحرر والمعاينة والتصدير. تمثل CVData المسودة
 * كاملة، بينما تصف الأنواع الفرعية معنى كل حقل وتمنع اختلاف شكل البيانات بين المكونات.
 */
export type TemplateId = 'classic' | 'modern' | 'compact' | 'executive' | 'mint' | 'photo';
export type CVColorId = 'none' | 'blue' | 'forest' | 'teal' | 'burgundy';

export type PersonalInfo = {
  fullName: string;
  title: string;
  phone: string;
  email: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  photo?: string;
};

export type Experience = {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  bullets: string[];
};

export type Education = {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  technologies: string;
  link: string;
  github: string;
};

export type Certification = {
  id: string;
  name: string;
  organization: string;
  date: string;
  credential: string;
};

export type Language = { id: string; language: string; level: string };

export type AdditionalSection = {
  id: string;
  kind: string;
  customHeading?: string;
  title: string;
  organization: string;
  startDate: string;
  endDate: string;
  description: string;
  bullets: string[];
};

export type CVSectionId = 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'languages' | 'additional';
export const defaultSectionOrder: CVSectionId[] = ['summary','experience','education','skills','projects','certifications','languages','additional'];
export type CVData = {
  sectionOrder?: CVSectionId[];
  hiddenSections?: CVSectionId[];
  personal: PersonalInfo;
  summary: string;
  experiences: Experience[];
  education: Education[];
  technicalSkills: string[];
  softSkills: string[];
  projects: Project[];
  certifications: Certification[];
  languages: Language[];
  additional: AdditionalSection[];
};

export type EditorSection = 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'languages' | 'additional';
