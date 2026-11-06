export const naira = (n: number): string =>
  '₦' + Math.round(n || 0).toLocaleString('en-NG');

export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

export const todayISO = (): string => new Date().toISOString();

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const prettyDate = (iso?: string | null): string => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const prettyTime = (iso: string): string => {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
};

export const addDays = (d: Date, days: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};

/** Accepts YYYY-MM-DD or DD/MM/YYYY. Returns ISO string or null. */
export const parseDateInput = (s: string): string | null => {
  const t = s.trim();
  let y: number, m: number, d: number;
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(t)) {
    [y, m, d] = t.split('-').map(Number);
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(t)) {
    [d, m, y] = t.split('/').map(Number);
  } else return null;
  const dt = new Date(y, m - 1, d, 12);
  if (dt.getMonth() !== m - 1) return null;
  return dt.toISOString();
};

export const toInputDate = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

/** Normalise Nigerian phone to 234XXXXXXXXXX for WhatsApp links. */
export const toWhatsAppNumber = (phone: string): string => {
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) p = '234' + p.slice(1);
  if (!p.startsWith('234') && p.length === 10) p = '234' + p;
  return p;
};

/** Normalise to 0XXXXXXXXXX (11 digits) for storage/identity. */
export const normalizePhone = (phone: string): string => {
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('234')) p = '0' + p.slice(3);
  if (p.length === 10 && !p.startsWith('0')) p = '0' + p;
  return p;
};

export const isValidPhone = (phone: string): boolean => /^0[789][01]\d{8}$/.test(normalizePhone(phone));
