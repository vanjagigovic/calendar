import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import "../config/i18n";
import { ChatPanel } from "./ChatPanel";
import { appTheme } from "../theme/theme";
import { ThemeProvider } from "@mui/material";

function renderPanel() {
  return render(
    <ThemeProvider theme={appTheme}>
      <ChatPanel />
    </ThemeProvider>,
  );
}

describe("ChatPanel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the welcome message and a disabled send button when empty", () => {
    renderPanel();

    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
    expect(screen.getByText(/placeholders for now/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });

  it("submits on Enter, shows loading, then a mock reply", async () => {
    renderPanel();
    const input = screen.getByLabelText("Message to AI Assistant");

    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(input).toHaveValue("");
    expect(screen.getByLabelText("Assistant is typing")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "Again" } });
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(screen.queryByLabelText("Assistant is typing")).toBeNull();
    expect(screen.getByText(/can't look at your calendar/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
  });

  it("does not submit on Shift+Enter", () => {
    renderPanel();
    const input = screen.getByLabelText("Message to AI Assistant");

    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });

    expect(screen.queryByLabelText("Assistant is typing")).toBeNull();
    expect(input).toHaveValue("Hello");
  });
});
