/**
 * Design Utility Functions for SKU/Code parsing and generation
 */

export function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function extractDesignCode(title?: string, code?: string): string | undefined {
  if (code && code.trim()) return code.trim().toUpperCase();
  if (!title) return undefined;
  const match = title.match(/^(SFV\d+)/i);
  return match ? match[1].toUpperCase() : undefined;
}

export function getNextDesignCode(designs: { code?: string; title?: string }[]): string {
  let maxNum = 0;
  for (const d of designs) {
    const str = `${d.code || ''} ${d.title || ''}`;
    const match = str.match(/SFV(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  const nextNum = maxNum + 1;
  return `SFV${String(nextNum).padStart(4, '0')}`;
}
