/** 1,284 / 12.9K / 1.2M — a stat tile has no room for seven digits. */
export function compactNumber(value: number): string {
  if (value < 10_000) return value.toLocaleString('en-US');
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/** `2026-09-04` -> `Sep 4`. Built from the parts so it stays UTC. */
export function shortDayUtc(day: string): string {
  const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const [, month, date] = day.split('-');
  const index = Number(month) - 1;
  return `${MONTHS[index] ?? month} ${Number(date)}`;
}

export function signedPercent(change: number): string {
  const rounded = Math.round(change * 100);
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}
