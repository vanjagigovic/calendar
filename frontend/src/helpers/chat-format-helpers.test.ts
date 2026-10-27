import { describe, expect, it } from "vitest";

import i18next from "../config/i18n";
import {
  buildFreeSlotWindow,
  formatDayEventsMessage,
  formatFreeSlotMessage,
} from "./chat-format-helpers";
import type { EventOccurrenceResponseDto } from "../types/event-api-types";

const t = i18next.t.bind(i18next);
const ZONE = "Europe/Belgrade";

function occurrence(
  overrides: Partial<EventOccurrenceResponseDto>,
): EventOccurrenceResponseDto {
  return {
    id: "e1",
    occurrenceId: "e1:1",
    baseEventId: "e1",
    title: "Event",
    startUtc: "2026-08-26T08:00:00.000Z",
    endUtc: "2026-08-26T09:00:00.000Z",
    isAllDay: false,
    timeZone: ZONE,
    eventType: "work",
    repeatWeekly: false,
    repeatUntilUtc: null,
    reminderEnabled: false,
    reminderAtUtc: null,
    ...overrides,
  };
}

describe("formatDayEventsMessage", () => {
  it("formats sorted events in the selected time zone", () => {
    const message = formatDayEventsMessage(
      [
        occurrence({
          title: "Lunch",
          startUtc: "2026-08-26T10:00:00.000Z",
          endUtc: "2026-08-26T11:00:00.000Z",
        }),
        occurrence({ title: "Standup" }),
      ],
      "2026-08-26",
      ZONE,
      t,
    );

    expect(message).toBe(
      [
        "Events on Wed, 26 Aug 2026 (Europe/Belgrade):",
        "10:00 - 11:00  Standup",
        "12:00 - 13:00  Lunch",
      ].join("\n"),
    );
  });

  it("labels all-day events", () => {
    const message = formatDayEventsMessage(
      [
        occurrence({
          title: "Holiday",
          isAllDay: true,
          startUtc: "2026-08-26T00:00:00.000Z",
          endUtc: "2026-08-27T00:00:00.000Z",
        }),
      ],
      "2026-08-26",
      ZONE,
      t,
    );

    expect(message).toContain("All day  Holiday");
  });

  it("reports an empty day", () => {
    expect(formatDayEventsMessage([], "2026-08-26", ZONE, t)).toBe(
      "No events on Wed, 26 Aug 2026.",
    );
  });
});

describe("buildFreeSlotWindow", () => {
  it("uses the whole local day for a future date", () => {
    expect(
      buildFreeSlotWindow("2026-08-26", ZONE, new Date("2026-08-20T12:00:00Z")),
    ).toEqual({
      startUtc: "2026-08-25T22:00:00.000Z",
      endUtc: "2026-08-26T22:00:00.000Z",
    });
  });

  it("starts at the next full minute when the day is today", () => {
    expect(
      buildFreeSlotWindow("2026-08-26", ZONE, new Date("2026-08-26T10:00:20Z")),
    ).toEqual({
      startUtc: "2026-08-26T10:01:00.000Z",
      endUtc: "2026-08-26T22:00:00.000Z",
    });
  });

  it("returns null for a day that has ended", () => {
    expect(
      buildFreeSlotWindow("2026-08-26", ZONE, new Date("2026-08-27T00:00:00Z")),
    ).toBeNull();
  });

  it("does not assume 24 hours on DST days", () => {
    const window = buildFreeSlotWindow(
      "2026-03-29",
      ZONE,
      new Date("2026-03-01T00:00:00Z"),
    );
    expect(window).toEqual({
      startUtc: "2026-03-28T23:00:00.000Z",
      endUtc: "2026-03-29T22:00:00.000Z",
    });
  });
});

describe("formatFreeSlotMessage", () => {
  const window = {
    startUtc: "2026-08-25T22:00:00.000Z",
    endUtc: "2026-08-26T22:00:00.000Z",
  };

  it("formats a found interval in the selected time zone", () => {
    const message = formatFreeSlotMessage(
      {
        freeInterval: {
          startUtc: "2026-08-26T12:00:00.000Z",
          endUtc: "2026-08-26T22:00:00.000Z",
        },
      },
      window,
      30,
      ZONE,
      t,
    );

    expect(message).toBe(
      "First free slot of at least 30 minutes: 14:00 - 24:00 (Europe/Belgrade).\nSearched 00:00 - 24:00.",
    );
  });

  it("explains when no interval is long enough", () => {
    const message = formatFreeSlotMessage(
      { freeInterval: null },
      window,
      90,
      ZONE,
      t,
    );

    expect(message).toBe(
      "No free interval of at least 90 minutes was found.\nSearched 00:00 - 24:00.",
    );
  });
});
