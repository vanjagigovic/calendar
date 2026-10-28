import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import { beforeEach, describe, expect, it, vi } from "vitest";

import "../config/i18n";
import { Calendar } from "./Calendar";
import { appTheme } from "../theme/theme";
import {
  findFreeSlot,
  getDayEvents,
  sendChatMessage,
} from "../api/assistant-api";

// The browser runs in UTC while the calendar view is Europe/Sarajevo, so local
// midnight in the view zone (e.g. 2026-10-31T23:00Z) falls on the previous
// calendar day when read with browser-local getters.
vi.stubEnv("TZ", "UTC");

const VIEW_ZONE = "Europe/Sarajevo";

vi.mock("../utils/calendar-utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../utils/calendar-utils")>()),
  getBrowserTimeZone: () => "Europe/Sarajevo",
}));

vi.mock("../api/assistant-api", () => ({
  getDayEvents: vi.fn(),
  findFreeSlot: vi.fn(),
  sendChatMessage: vi.fn(),
}));

vi.mock("../hooks/useCalendarEvents", () => ({
  useCalendarEvents: () => ({
    events: [],
    loading: false,
    error: "",
    successMessage: "",
    setSuccessMessage: vi.fn(),
    handleCreate: vi.fn(),
    handleUpdate: vi.fn(),
    handleDelete: vi.fn(),
  }),
}));

vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({ user: { email: "test@example.com" }, logout: vi.fn() }),
}));

vi.mock("./EventDialog", () => ({
  EventDialog: () => <div data-testid="event-dialog" />,
}));

function renderCalendar(path: string) {
  return render(
    <ThemeProvider theme={appTheme}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/calendar/:view?/:date?" element={<Calendar />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

function sendFreeText(text: string) {
  const input = screen.getByLabelText("Message to AI Assistant");
  fireEvent.change(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: "Enter" });
}

describe("selected date when the browser zone differs from the view zone", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getDayEvents).mockResolvedValue([]);
    vi.mocked(findFreeSlot).mockResolvedValue({ freeInterval: null });
    vi.mocked(sendChatMessage).mockResolvedValue({ answer: "ok" });
  });

  it("runs the browser in a different zone than the view zone", () => {
    expect(new Date(2026, 10, 1).getTimezoneOffset()).toBe(0);
  });

  // Cells run Mon 2026-10-26 .. Sun 2026-12-06, so index 5 is Oct 31 and 6 is Nov 1.
  it.each([
    ["2026-10-31", 5, "31"],
    ["2026-11-01", 6, "1"],
    ["2026-11-02", 7, "2"],
  ])(
    "sends exactly %s after clicking the month cell showing that day",
    async (dateKey, cellIndex, dayNumber) => {
      renderCalendar("/calendar/month/2026-11-15");

      const cell = screen.getAllByTestId(/^month-day-/)[cellIndex];
      expect(cell.textContent?.startsWith(dayNumber)).toBe(true);
      fireEvent.click(cell);
      expect(cell).toHaveAttribute("aria-selected", "true");
      expect(cell.getAttribute("data-testid")).toBe(`month-day-${dateKey}`);
      sendFreeText("What events do I have on the selected calendar date?");
      await screen.findByText("ok");
      expect(sendChatMessage).toHaveBeenCalledWith(
        "What events do I have on the selected calendar date?",
        VIEW_ZONE,
        dateKey,
        [],
      );

      fireEvent.click(screen.getByText("Events for selected day"));
      expect(getDayEvents).toHaveBeenCalledWith(dateKey, VIEW_ZONE);
      await screen.findByText(/No events on/);
    },
  );

  it("sends exactly 2026-11-01 after clicking the Sunday week header", async () => {
    renderCalendar("/calendar/week/2026-10-28");

    fireEvent.click(
      screen.getByText("Sun 01").closest('[role="button"]') as HTMLElement,
    );

    sendFreeText("Selected day?");
    await screen.findByText("ok");
    expect(sendChatMessage).toHaveBeenCalledWith(
      "Selected day?",
      VIEW_ZONE,
      "2026-11-01",
      [],
    );
  });

  it("keeps the route date for the day view header", async () => {
    renderCalendar("/calendar/day/2026-11-01");

    sendFreeText("Selected day?");
    await screen.findByText("ok");
    expect(sendChatMessage).toHaveBeenCalledWith(
      "Selected day?",
      VIEW_ZONE,
      "2026-11-01",
      [],
    );
  });
});
