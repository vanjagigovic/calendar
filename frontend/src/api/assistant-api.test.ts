import { describe, expect, it } from "vitest";

import { findFreeSlot, getDayEvents, sendChatMessage } from "./assistant-api";
import {
  buildDayEventsPath,
  buildFreeSlotPath,
} from "../helpers/assistant-path-helpers";
import { vi } from "vitest";
import { apiRequest } from "./api-client";

vi.mock("./api-client", () => ({ apiRequest: vi.fn() }));

describe("assistant paths", () => {
  it("builds the day-events path with encoded parameters", () => {
    expect(buildDayEventsPath("2026-03-29", "Europe/Belgrade")).toBe(
      "/assistant/day-events?date=2026-03-29&timeZone=Europe%2FBelgrade",
    );
  });

  it("builds the free-slot path with UTC ISO timestamps", () => {
    expect(
      buildFreeSlotPath(
        "2026-08-26T10:00:00+02:00",
        "2026-08-26T22:00:00.000Z",
        30,
      ),
    ).toBe(
      "/assistant/free-slot?windowStartUtc=2026-08-26T08%3A00%3A00.000Z&windowEndUtc=2026-08-26T22%3A00%3A00.000Z&durationMinutes=30",
    );
  });
});

describe("assistant api", () => {
  it("calls apiRequest with the built paths", async () => {
    vi.mocked(apiRequest).mockResolvedValue([]);

    await getDayEvents("2026-08-26", "UTC");
    await findFreeSlot("2026-08-26T08:00:00.000Z", "2026-08-26T18:00:00.000Z", 15);

    expect(apiRequest).toHaveBeenNthCalledWith(
      1,
      "/assistant/day-events?date=2026-08-26&timeZone=UTC",
    );
    expect(apiRequest).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/assistant/free-slot?windowStartUtc="),
    );
  });

  it("sends a free-text message to the chat endpoint", async () => {
  vi.mocked(apiRequest).mockResolvedValue({ answer: "Hello!" });

  const response = await sendChatMessage("Hello", "UTC", "2026-10-25");

  expect(apiRequest).toHaveBeenCalledWith("/assistant/chat", {
    method: "POST",
    body: JSON.stringify({
      message: "Hello",
      timeZone: "UTC",
      selectedDate: "2026-10-25",
      history: [],
    }),
  });

  expect(response).toEqual({ answer: "Hello!" });
});

  it("sends recent conversation history with the chat request", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ answer: "ok" });

    await sendChatMessage("gym", "UTC", "2026-10-25", [
      { role: "user", content: "Which workout is best?" },
    ]);

    expect(apiRequest).toHaveBeenCalledWith("/assistant/chat", {
      method: "POST",
      body: JSON.stringify({
        message: "gym",
        timeZone: "UTC",
        selectedDate: "2026-10-25",
        history: [{ role: "user", content: "Which workout is best?" }],
      }),
    });
  });
});
