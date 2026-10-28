import { apiRequest } from "./api-client";
import {
  buildDayEventsPath,
  buildFreeSlotPath,
} from "../helpers/assistant-path-helpers";
import type {
  DayEventsResponse,
  FreeSlotResponse,
} from "../types/assistant-api-types";


export interface SendChatMessageResponse {
  answer: string;
}

export interface ChatHistoryEntry {
  role: "user" | "assistant";
  content: string;
}

export function sendChatMessage(
  message: string,
  timeZone: string,
  selectedDate?: string,
  history: ChatHistoryEntry[] = [],
): Promise<SendChatMessageResponse> {
  return apiRequest<SendChatMessageResponse>("/assistant/chat", {
    method: "POST",
    body: JSON.stringify({ message, timeZone, selectedDate, history }),
  });
}
export function getDayEvents(
  date: string,
  timeZone: string,
): Promise<DayEventsResponse> {
  return apiRequest<DayEventsResponse>(buildDayEventsPath(date, timeZone));
}

export function findFreeSlot(
  windowStartUtc: string,
  windowEndUtc: string,
  durationMinutes: number,
): Promise<FreeSlotResponse> {
  return apiRequest<FreeSlotResponse>(
    buildFreeSlotPath(windowStartUtc, windowEndUtc, durationMinutes),
  );
}
