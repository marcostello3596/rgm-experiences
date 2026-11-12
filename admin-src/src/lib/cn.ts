/** Une clases condicionales. */
export const cn = (...parts: (string | false | null | undefined)[]): string => parts.filter(Boolean).join(' ');
export const uid = (prefix: string): string => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
