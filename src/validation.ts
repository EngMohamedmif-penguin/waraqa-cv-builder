/**
 * قواعد الإدخال المركزية: حدود الحروف وحدود القوائم وحساب حالة العداد.
 * يستخدمها Editor أثناء الكتابة؛ لا تمنع الاقتراب من الحد بل تمنع التجاوز الفعلي.
 */
export type TextLimit = {
  max: number;
  warnAt: number;
};

export const TEXT_LIMITS = {
  fullName: { max: 50, warnAt: 44 },
  professionalTitle: { max: 80, warnAt: 70 },
  experienceTitle: { max: 80, warnAt: 70 },
  company: { max: 100, warnAt: 88 },
  summary: { max: 500, warnAt: 430 },
  description: { max: 500, warnAt: 430 },
  bullet: { max: 180, warnAt: 120 },
  skill: { max: 40, warnAt: 34 },
  projectName: { max: 80, warnAt: 70 },
  technologies: { max: 120, warnAt: 100 },
  institution: { max: 100, warnAt: 88 },
  certification: { max: 120, warnAt: 105 },
} satisfies Record<string, TextLimit>;

export const COLLECTION_LIMITS = {
  skills: 20,
  education: 5,
  projects: 5,
  certifications: 10,
  bulletsPerExperience: 6,
} as const;

export type CharacterState = {
  count: number;
  remaining: number;
  exceeded: number;
  nearLimit: boolean;
  overLimit: boolean;
};

export function characterState(value: string, limit: TextLimit): CharacterState {
  const count = value.length;
  const overLimit = count > limit.max;
  return {
    count,
    remaining: Math.max(0, limit.max - count),
    exceeded: Math.max(0, count - limit.max),
    nearLimit: !overLimit && count >= limit.warnAt,
    overLimit,
  };
}

export function isWithinLimit(value: string, limit: TextLimit): boolean {
  return value.length <= limit.max;
}
