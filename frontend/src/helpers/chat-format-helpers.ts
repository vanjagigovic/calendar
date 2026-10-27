import { DateTime } from "luxon";
import type { TFunction } from "i18next";

import type {
  DayEventsResponse,
  FreeSlotResponse,
} from "../types/assistant-api-types";

export interface FreeSlotWindow {
  startUtc: string;
  endUtc: string;
}

export const FREE_TIME_DURATION_PRESETS = [15, 30, 60, 90] as const;
export const DEFAULT_FREE_TIME_DURATION = 30;

export function formatChatDate(date: string, timeZone: string): string {
  return DateTime.fromISO(date, { zone: timeZone }).toFormat("ccc, d LLL yyyy");
}

/**
 * Search window rule: the selected local day in `timeZone`, from local
 * midnight to the next local midnight. When the selected day is today, the
 * window starts at the current time rounded up to the next full minute, so
 * past time is never offered. Returns null when the day has already ended.
 * Boundaries use calendar-day arithmetic, so DST days are not assumed to
 * be 24 hours.
 */
export function buildFreeSlotWindow(
  date: string,
  timeZone: string,
  now: Date = new Date(),
): FreeSlotWindow | null {
  const dayStart = DateTime.fromISO(date, { zone: timeZone }).startOf("day");
  const dayEnd = dayStart.plus({ days: 1 }).startOf("day");
  const nowRounded = Math.ceil(now.getTime() / 60_000) * 60_000;
  const startMs = Math.max(dayStart.toMillis(), nowRounded);

  if (startMs >= dayEnd.toMillis()) {
    return null;
  }

  return {
    startUtc: new Date(startMs).toISOString(),
    endUtc: new Date(dayEnd.toMillis()).toISOString(),
  };
}

function formatTime(utcIso: string, timeZone: string): string {
  return DateTime.fromISO(utcIso, { zone: "utc" })
    .setZone(timeZone)
    .toFormat("HH:mm");
}

function formatIntervalEnd(
  startUtc: string,
  endUtc: string,
  timeZone: string,
): string {
  const start = DateTime.fromISO(startUtc, { zone: "utc" }).setZone(timeZone);
  const end = DateTime.fromISO(endUtc, { zone: "utc" }).setZone(timeZone);

  // An interval ending exactly at the next local midnight reads as 24:00.
  if (
    !end.hasSame(start, "day") &&
    end.equals(end.startOf("day")) &&
    end.minus({ days: 1 }).hasSame(start, "day")
  ) {
    return "24:00";
  }

  return end.toFormat("HH:mm");
}

export function formatDayEventsMessage(
  events: DayEventsResponse,
  date: string,
  timeZone: string,
  t: TFunction,
): string {
  const dateLabel = formatChatDate(date, timeZone);

  if (events.length === 0) {
    return t("chatNoEvents", { date: dateLabel });
  }

  const lines = [...events]
    .sort(
      (left, right) =>
        left.startUtc.localeCompare(right.startUtc) ||
        left.title.localeCompare(right.title),
    )
    .map((event) => {
      const range = event.isAllDay
        ? t("chatAllDay")
        : `${formatTime(event.startUtc, timeZone)} - ${formatIntervalEnd(
            event.startUtc,
            event.endUtc,
            timeZone,
          )}`;
      return `${range}  ${event.title}`;
    });

  return [
    t("chatDayEventsHeading", { date: dateLabel, timeZone }),
    ...lines,
  ].join("\n");
}

export function formatFreeSlotMessage(
  response: FreeSlotResponse,
  window: FreeSlotWindow,
  durationMinutes: number,
  timeZone: string,
  t: TFunction,
): string {
  const searched = t("chatSearchWindow", {
    start: formatTime(window.startUtc, timeZone),
    end: formatIntervalEnd(window.startUtc, window.endUtc, timeZone),
  });

  if (!response.freeInterval) {
    return `${t("chatFreeSlotNone", { minutes: durationMinutes })}\n${searched}`;
  }

  const { startUtc, endUtc } = response.freeInterval;

  return `${t("chatFreeSlotFound", {
    minutes: durationMinutes,
    start: formatTime(startUtc, timeZone),
    end: formatIntervalEnd(startUtc, endUtc, timeZone),
    timeZone,
  })}\n${searched}`;
}
