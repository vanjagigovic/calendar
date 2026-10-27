import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import { DateTime } from "luxon";
import { beforeEach, describe, expect, it, vi } from "vitest";

import "../config/i18n";
import { Calendar } from "./Calendar";
import { appTheme } from "../theme/theme";
import { findFreeSlot, getDayEvents } from "../api/assistant-api";
import { getBrowserTimeZone } from "../utils/calendar-utils";

vi.mock("../api/assistant-api", () => ({
  getDayEvents: vi.fn(),
  findFreeSlot: vi.fn(),
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
  EventDialog: ({ initialStartUtc }: { initialStartUtc?: string }) => (
    <div data-testid="event-dialog">{initialStartUtc}</div>
  ),
}));

const ZONE = getBrowserTimeZone();

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

function header(label: string) {
  return screen.getByText(label).closest('[role="button"]') as HTMLElement;
}

function showDayEvents() {
  fireEvent.click(
    screen.getByText("Events for selected day"),
  );
}

describe("Calendar day selection for the AI assistant", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getDayEvents).mockResolvedValue([]);
    vi.mocked(findFreeSlot).mockResolvedValue({ freeInterval: null });
  });

  it("initializes the assistant date from the displayed date", async () => {
    renderCalendar("/calendar/week/2099-08-26");

    showDayEvents();

    expect(getDayEvents).toHaveBeenCalledWith("2099-08-26", ZONE);
    await screen.findByText(/No events on/);
  });

  it("moves the selected ring between month cells and keeps today's glow", () => {
    const todayKey = DateTime.now().toFormat("yyyy-LL-dd");
    renderCalendar(`/calendar/month/${todayKey}`);
    const ring = `inset 0 0 0 2px ${appTheme.palette.primary.main}`.toLowerCase();
    const shadowOf = (key: string) =>
      getComputedStyle(screen.getByTestId(`month-day-${key}`)).boxShadow.toLowerCase();
    const otherKey = DateTime.now().startOf("month").toFormat("yyyy-LL-dd");
    const pick = otherKey === todayKey ? DateTime.now().startOf("month").plus({ days: 1 }).toFormat("yyyy-LL-dd") : otherKey;

    // Today is selected initially: ring and today's outer glow both present.
    expect(shadowOf(todayKey)).toContain(ring);
    expect(shadowOf(todayKey)).toContain(appTheme.custom.shadows.focusRing.toLowerCase());

    fireEvent.click(screen.getByTestId(`month-day-${pick}`));

    expect(shadowOf(pick)).toContain(ring);
    expect(shadowOf(pick)).not.toContain(appTheme.custom.shadows.focusRing.toLowerCase());
    expect(shadowOf(todayKey)).not.toContain(ring);
    expect(shadowOf(todayKey)).toContain(appTheme.custom.shadows.focusRing.toLowerCase());
  });

  it("selects a day in month view without opening the create dialog", async () => {
    renderCalendar("/calendar/month/2099-08-15");

    fireEvent.click(screen.getByTestId("month-day-2099-08-20"));

    expect(screen.queryByTestId("event-dialog")).toBeNull();
    expect(screen.getByTestId("month-day-2099-08-20")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByTestId("month-day-2099-08-15")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    showDayEvents();
    expect(getDayEvents).toHaveBeenCalledWith("2099-08-20", ZONE);
    await screen.findByText(/No events on/);
  });

  it("selects a day through the week header for both quick actions", async () => {
    renderCalendar("/calendar/week/2099-08-26");

    fireEvent.click(header("Thu 27"));

    expect(screen.queryByTestId("event-dialog")).toBeNull();
    expect(header("Thu 27")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(header("Wed 26")).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    fireEvent.keyDown(header("Fri 28"), {
      key: "Enter",
    });
    expect(header("Fri 28")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(header("Thu 27"));

    showDayEvents();
    expect(getDayEvents).toHaveBeenCalledWith("2099-08-27", ZONE);
    await screen.findByText(/No events on/);

    fireEvent.click(screen.getByText("Find free time"));
    await screen.findByText(/No free interval/);
    const dayStart = DateTime.fromISO("2099-08-27", { zone: ZONE }).startOf(
      "day",
    );
    expect(findFreeSlot).toHaveBeenCalledWith(
      dayStart.toUTC().toISO(),
      dayStart.plus({ days: 1 }).startOf("day").toUTC().toISO(),
      30,
    );
  });

  it("selects a header by keyboard and the displayed day in day view", async () => {
    renderCalendar("/calendar/day/2099-08-26");

    const dayHeader = header("Wed 26 Aug");
    fireEvent.click(dayHeader);

    expect(screen.queryByTestId("event-dialog")).toBeNull();
    expect(dayHeader).toHaveAttribute("aria-pressed", "true");
    showDayEvents();
    expect(getDayEvents).toHaveBeenCalledWith("2099-08-26", ZONE);
    await screen.findByText(/No events on/);

    // Day view time slots still open the create dialog.
    fireEvent.click(screen.getByTestId("slot-2099-08-26-20"));
    const expected = DateTime.fromISO("2099-08-26", { zone: ZONE })
      .plus({ minutes: 600 })
      .toUTC()
      .toISO();
    expect(screen.getByTestId("event-dialog")).toHaveTextContent(
      expected as string,
    );
  });

  it("resets the selection to the displayed date after navigation", async () => {
    renderCalendar("/calendar/week/2099-08-26");

    fireEvent.click(header("Thu 27"));
    fireEvent.keyDown(window, { key: "ArrowRight" });

    showDayEvents();
    const call = vi.mocked(getDayEvents).mock.calls[0];
    expect(call[0]).toBe("2099-09-02");
    await screen.findByText(/No events on/);
  });

  it("still opens the create dialog from week time slots", () => {
    renderCalendar("/calendar/week/2099-08-26");

    fireEvent.click(screen.getByTestId("slot-2099-08-27-3"));

    const expected = DateTime.fromISO("2099-08-27", { zone: ZONE })
      .plus({ minutes: 90 })
      .toUTC()
      .toISO();
    expect(screen.getByTestId("event-dialog")).toHaveTextContent(
      expected as string,
    );
  });
});
