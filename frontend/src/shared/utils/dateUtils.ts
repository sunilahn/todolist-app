export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function toKSTDateString(date: Date = new Date()): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
}

export function isOverdue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  const today = toKSTDateString();
  return dueDate < today;
}

export function isDueToday(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  const today = toKSTDateString();
  return dueDate === today;
}
