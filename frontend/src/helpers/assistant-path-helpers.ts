const ASSISTANT_BASE_PATH = "/assistant";

export function buildDayEventsPath(date: string, timeZone: string): string {
  const params = new URLSearchParams({ date, timeZone });
  return `${ASSISTANT_BASE_PATH}/day-events?${params.toString()}`;
}

export function buildFreeSlotPath(
  windowStartUtc: string,
  windowEndUtc: string,
  durationMinutes: number,
): string {
  const params = new URLSearchParams({
    windowStartUtc: new Date(windowStartUtc).toISOString(),
    windowEndUtc: new Date(windowEndUtc).toISOString(),
    durationMinutes: String(durationMinutes),
  });
  return `${ASSISTANT_BASE_PATH}/free-slot?${params.toString()}`;
}
