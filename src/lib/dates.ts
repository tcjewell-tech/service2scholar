/** Date helpers working on local calendar dates as ISO `YYYY-MM-DD` strings. */

export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toIso(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
  const d = parseIso(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

export function isValidIso(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  return toIso(parseIso(iso)) === iso;
}

export function todayIso(): string {
  return toIso(new Date());
}

export function formatDate(iso: string): string {
  return parseIso(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatMonth(iso: string): string {
  return parseIso(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
