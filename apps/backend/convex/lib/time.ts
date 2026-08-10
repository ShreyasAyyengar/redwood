export const MS_PER_MINUTE = 60_000;
export const MS_PER_HOUR = 3_600_000;
export const MS_PER_SECOND = 1000;

export function earlierIsoDate(existing: string | undefined, requested: string): string {
  if (existing === undefined) return requested;

  return Date.parse(existing) <= Date.parse(requested) ? existing : requested;
}
