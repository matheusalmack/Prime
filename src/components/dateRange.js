// Calendar dates stay in local time; noon avoids daylight-saving midnight shifts.
export function toDateKey(date) {
  return [date.getFullYear().toString().padStart(4, '0'), (date.getMonth() + 1).toString().padStart(2, '0'), date.getDate().toString().padStart(2, '0')].join('-');
}

export function fromDateKey(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(12, 0, 0, 0);
  return toDateKey(date) === key ? date : null;
}

export function getToday(now = new Date()) {
  return toDateKey(now);
}

export function createTodayRange() {
  const today = getToday();
  return { start: today, end: today };
}

export function sortRange(start, end) {
  return start <= end ? { start, end } : { start: end, end: start };
}

export function normalizeRange(value) {
  const start = fromDateKey(value?.start) ? value.start : getToday();
  const end = fromDateKey(value?.end) ? value.end : start;
  return sortRange(start, end);
}

export function addDays(key, amount) {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

export function startOfMonth(key) {
  return `${key.slice(0, 7)}-01`;
}

export function addMonths(key, amount) {
  const date = fromDateKey(key);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + amount);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0, 12).getDate();
  date.setDate(Math.min(day, lastDay));
  return toDateKey(date);
}

export function calendarWeeks(month, minimumWeeks = 0) {
  const first = startOfMonth(month);
  const firstWeekday = fromDateKey(first).getDay();
  const last = addDays(addMonths(first, 1), -1);
  const count = Math.max(minimumWeeks, Math.ceil((firstWeekday + fromDateKey(last).getDate()) / 7)) * 7;
  const gridStart = addDays(first, -firstWeekday);
  return Array.from({ length: count / 7 }, (_, week) => (
    Array.from({ length: 7 }, (_, day) => addDays(gridStart, week * 7 + day))
  ));
}

export function getPresets(today = getToday()) {
  const end = today;
  return [
    { label: 'Hoje', description: 'Hoje', start: today, end: today },
    ...[7, 15, 30].map((days) => ({ label: `Últimos ${days} dias`, description: `Últimos ${days} dias, até ${formatDate(end)}`, start: addDays(end, 1 - days), end })),
    { label: 'Este ano', description: 'Do início deste ano até hoje', start: `${today.slice(0, 4)}-01-01`, end: today },
  ];
}

const shortDate = new Intl.DateTimeFormat('pt-BR');
const longDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' });
const monthDate = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const shortMonth = new Intl.DateTimeFormat('pt-BR', { month: 'short' });

export function formatDate(key, style = 'short') {
  if (style === 'calendar-month') return `${fromDateKey(key).getFullYear()} ${shortMonth.format(fromDateKey(key)).replace('.', '')}`;
  const formatter = style === 'long' ? longDate : style === 'month' ? monthDate : shortDate;
  return formatter.format(fromDateKey(key));
}

export function formatRange({ start, end }) {
  return !end || start === end ? formatDate(start) : `${formatDate(start)} – ${formatDate(end)}`;
}
