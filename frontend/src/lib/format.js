export const money = (n) => {
  const v = Number(n || 0);
  return '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 });
};
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const parseDay = (s) => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
const toDate = (s) => (String(s).length > 10 ? new Date(String(s).slice(0, 19)) : parseDay(s));
export const fmtDate = (s) => { if (!s) return ''; const d = toDate(s); return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`; };
export const fmtShort = (s) => { if (!s) return ''; const d = toDate(s); return `${d.getDate()} ${MON[d.getMonth()]}`; };
export const fmtTime = (s) => (s ? toDate(s).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '');
export const fmtDateTime = (s) => (s ? `${fmtShort(s)}, ${fmtTime(s)}` : '');
export const fmtRange = (a, b) => {
  const x = parseDay(a), y = parseDay(b);
  const same = x.getMonth() === y.getMonth() && x.getFullYear() === y.getFullYear();
  return same ? `${x.getDate()}–${y.getDate()} ${MON[y.getMonth()]} ${y.getFullYear()}` : `${fmtDate(a)} – ${fmtDate(b)}`;
};
export const todayStr = (add = 0) => {
  const d = new Date(); d.setDate(d.getDate() + add);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const daysBetween = (a, b) => Math.round((parseDay(b) - parseDay(a)) / 86400000);
export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
const titleCase = (s = '') => s.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export const CATEGORY_LABELS = {
  ELECTRONICS: 'Electronics', CYCLES: 'Cycles', FURNITURE: 'Furniture', BOOKS: 'Books & notes', APPLIANCES: 'Appliances',
  SPORTS: 'Sports & outdoors', LAB_EQUIPMENT: 'Lab essentials', ACADEMIC: 'Academic essentials', OTHER: 'Other',
};
export const catLabel = (c) => CATEGORY_LABELS[c] || titleCase(c);
export const CONDITIONS = [['LIKE_NEW', 'Excellent'], ['GOOD', 'Good'], ['FAIR', 'Fair']];
export const condLabel = (c) => (CONDITIONS.find((x) => x[0] === c) || [0, titleCase(c)])[1];

// booking status -> label and colour tone
export const STATUS = {
  REQUESTED: { label: 'Pending', tone: 'warn' },
  ACCEPTED: { label: 'Accepted', tone: 'ok' },
  DECLINED: { label: 'Declined', tone: 'bad' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
  PAID: { label: 'Paid', tone: 'ok' },
  ACTIVE: { label: 'In progress', tone: 'lav' },
  RETURNED: { label: 'Returned', tone: 'lav' },
  UNDER_REVIEW: { label: 'Claim under review', tone: 'warn' },
  DEDUCTION_ACCEPTED: { label: 'Deduction accepted', tone: 'warn' },
  DISPUTED: { label: 'Disputed', tone: 'bad' },
  SETTLED: { label: 'Completed', tone: 'ok' },
};
export const isOpen = (s) => ['REQUESTED', 'ACCEPTED', 'PAID', 'ACTIVE', 'RETURNED', 'UNDER_REVIEW', 'DISPUTED'].includes(s);
