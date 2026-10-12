import type { PersonalInfo } from './types';

export type LinkKey = 'linkedin' | 'github' | 'portfolio';
export type LinkDefinition = { key: LinkKey; label: string; url: string; displayName: string };

export function safeExternalUrl(value: string): string | null {
  const raw = value.trim();
  if (!raw || /[\u0000-\u0020\\]/.test(raw) || /^(javascript|data|vbscript):/i.test(raw)) return null;
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname || !parsed.hostname.includes('.')) return null;
    return parsed.href;
  } catch { return null; }
}

export function getPersonalLinks(personal: PersonalInfo): LinkDefinition[] {
  const links: LinkDefinition[] = [
    { key: 'linkedin', label: 'LinkedIn', url: personal.linkedin || '', displayName: personal.linkedinDisplayName || '' },
    { key: 'github', label: 'GitHub', url: personal.github || '', displayName: personal.githubDisplayName || '' },
    { key: 'portfolio', label: 'Portfolio', url: personal.portfolio || '', displayName: personal.portfolioDisplayName || '' },
  ];
  return links.filter((link) => link.url.trim());
}

export function linkText(url: string, displayName: string, fallback: string): string {
  return displayName.trim() || fallback || url;
}


/** يبني وجهة mailto بعد التحقق من عنوان البريد وحصره في عنوان واحد بلا معاملات. */
export function safeEmailHref(value: string): string | null {
  const email = value.trim();
  const match = /^([A-Z0-9.!#$%&'*+/=?^_`{|}~-]+)@([A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+)$/i.exec(email);
  if (!match || email.length > 254 || match[1].length > 64) return null;
  return `mailto:${encodeURIComponent(match[1])}@${match[2]}`;
}

/** يقبل الروابط الشبكية المعتادة أو عنوان بريد صالحًا فقط. */
export function safeNavigationHref(value: string): string | null {
  const raw = value.trim();
  if (/^mailto:/i.test(raw)) return safeEmailHref(raw.slice(7));
  return safeExternalUrl(raw);
}
