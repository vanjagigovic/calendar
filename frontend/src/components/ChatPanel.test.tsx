import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@mui/material";

import "../config/i18n";
import { ChatPanel } from "./ChatPanel";
import { appTheme } from "../theme/theme";
import { findFreeSlot, getDayEvents, sendChatMessage} from "../api/assistant-api";
import { ApiError } from "../api/api-client";

vi.mock("../api/assistant-api", () => ({
  getDayEvents: vi.fn(),
  findFreeSlot: vi.fn(),
  sendChatMessage: vi.fn(),
}));

const DATE = "2099-08-26";
const ZONE = "Europe/Belgrade";

function renderPanel(onClose?: () => void) {
  return render(
    <ThemeProvider theme={appTheme}>
      <ChatPanel date={DATE} timeZone={ZONE} onClose={onClose} />
    </ThemeProvider>,
  );
}

describe("ChatPanel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows the welcome message, quick actions and a disabled send button", () => {
    renderPanel();

    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
    expect(screen.getByText(/list your events/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Events for selected day" }),
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: "Find free time" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "30 minutes" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });

 it("sends free text to the API and displays the assistant response", async () => {
  vi.mocked(sendChatMessage).mockResolvedValue({
    answer: "Your day looks manageable!",
  });

  renderPanel();
  const input = screen.getByLabelText("Message to AI Assistant");

  fireEvent.change(input, { target: { value: "What is my day like?" } });
  fireEvent.keyDown(input, { key: "Enter" });

  expect(screen.getByText("What is my day like?")).toBeInTheDocument();
  expect(input).toHaveValue("");

  expect(
    await screen.findByText("Your day looks manageable!"),
  ).toBeInTheDocument();

  expect(sendChatMessage).toHaveBeenCalledWith(
    "What is my day like?",
    ZONE,
    DATE,
    [],
  );
  expect(getDayEvents).not.toHaveBeenCalled();
  expect(findFreeSlot).not.toHaveBeenCalled();
});

  it("sends earlier messages as history for follow-ups, excluding the new message", async () => {
    vi.mocked(sendChatMessage)
      .mockResolvedValueOnce({ answer: "What are your goals?" })
      .mockResolvedValueOnce({ answer: "What would you like at the gym?" });

    renderPanel();
    const input = screen.getByLabelText("Message to AI Assistant");

    fireEvent.change(input, { target: { value: "Which workout is best?" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await screen.findByText("What are your goals?");

    fireEvent.change(input, { target: { value: "gym" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await screen.findByText("What would you like at the gym?");

    expect(sendChatMessage).toHaveBeenNthCalledWith(
      2,
      "gym",
      ZONE,
      DATE,
      [
        { role: "user", content: "Which workout is best?" },
        { role: "assistant", content: "What are your goals?" },
      ],
    );
  });

  it("does not submit on Shift+Enter", () => {
    renderPanel();
    const input = screen.getByLabelText("Message to AI Assistant");

    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });

    expect(sendChatMessage).not.toHaveBeenCalled();
    expect(input).toHaveValue("Hello");
  });

  it("shows real day events for the selected date and time zone", async () => {
    vi.mocked(getDayEvents).mockResolvedValue([
      {
        id: "e1",
        occurrenceId: "e1:1",
        baseEventId: "e1",
        title: "Planning",
        startUtc: "2099-08-26T08:00:00.000Z",
        endUtc: "2099-08-26T09:00:00.000Z",
        isAllDay: false,
        timeZone: ZONE,
        eventType: "work",
        repeatWeekly: false,
        repeatUntilUtc: null,
        reminderEnabled: false,
        reminderAtUtc: null,
      },
    ]);
    renderPanel();

    fireEvent.click(
      screen.getByRole("button", { name: "Events for selected day" }),
    );

    expect(await screen.findByText(/10:00 - 11:00 Planning/)).toBeInTheDocument();
    expect(getDayEvents).toHaveBeenCalledWith(DATE, ZONE);
    expect(screen.getByText("Events for Wed, 26 Aug 2099")).toBeInTheDocument();
  });

  it("finds free time using the selected duration and a full-day UTC window", async () => {
    vi.mocked(findFreeSlot).mockResolvedValue({
      freeInterval: {
        startUtc: "2099-08-26T08:00:00.000Z",
        endUtc: "2099-08-26T09:00:00.000Z",
      },
    });
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "60 minutes" }));
    fireEvent.click(screen.getByRole("button", { name: "Find free time" }));

    expect(await screen.findByText(/First free slot of at least 60 minutes: 10:00 - 11:00/)).toBeInTheDocument();
    expect(findFreeSlot).toHaveBeenCalledWith(
      "2099-08-25T22:00:00.000Z",
      "2099-08-26T22:00:00.000Z",
      60,
    );
  });

  it("shows a message when no free interval exists", async () => {
    vi.mocked(findFreeSlot).mockResolvedValue({ freeInterval: null });
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Find free time" }));

    expect(
      await screen.findByText(/No free interval of at least 30 minutes/),
    ).toBeInTheDocument();
  });

  it("shows API errors as assistant messages", async () => {
    vi.mocked(getDayEvents).mockRejectedValue(
      new ApiError("date must be valid", null),
    );
    renderPanel();

    fireEvent.click(
      screen.getByRole("button", { name: "Events for selected day" }),
    );

    expect(
      await screen.findByText("Sorry, that request failed: date must be valid"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Events for selected day" }),
    ).toBeEnabled();
  });

  it("blocks duplicate requests while one is pending", async () => {
    let resolve: (value: never[]) => void = () => undefined;
    vi.mocked(getDayEvents).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    renderPanel();
    const button = screen.getByRole("button", { name: "Events for selected day" });

    fireEvent.click(button);
    expect(screen.getByLabelText("Assistant is typing")).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(screen.getByRole("button", { name: "Find free time" })).toBeDisabled();
    fireEvent.click(button);
    expect(getDayEvents).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolve([]);
    });

    expect(screen.queryByLabelText("Assistant is typing")).toBeNull();
    expect(button).toBeEnabled();
  });

  it("offers a way back to the calendar when closable", () => {
    const onClose = vi.fn();
    renderPanel(onClose);

    fireEvent.click(screen.getByRole("button", { name: "Back to Calendar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
