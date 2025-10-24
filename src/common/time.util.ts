export function toUTC(dateStrOrISO: string | Date): Date {
  const d = typeof dateStrOrISO === 'string' ? new Date(dateStrOrISO) : dateStrOrISO;
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
}




