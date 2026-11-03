import { apiRequest } from "./api-client";
import {
  buildDayEventsPath,
  buildFreeSlotPath,
} from "../helpers/assistant-path-helpers";
import type {
  AssistantReasonCode,
  DayEventsResponse,
  FreeSlotResponse,
  SendChatMessageResponse,
} from "../types/assistant-api-types";
import { ASSISTANT_REASON_CODES } from "../types/assistant-api-types";

export type { SendChatMessageResponse } from "../types/assistant-api-types";

export interface ChatHistoryEntry {
  role: "user" | "assistant";
  content: string;
}

export async function sendChatMessage(
  message: string,
  timeZone: string,
  selectedDate?: string,
  history: ChatHistoryEntry[] = [],
): Promise<SendChatMessageResponse> {
  const response = await apiRequest<unknown>("/assistant/chat", {
    method: "POST",
    body: JSON.stringify({ message, timeZone, selectedDate, history }),
  });

  if (!isSendChatMessageResponse(response)) {
    throw new Error("The assistant returned an invalid response.");
  }

  return response;
}

const ASSISTANT_RESPONSE_KEYS = [
  "answer",
  "needsReview",
  "reasonCode",
  "sourceIds",
];

function isSendChatMessageResponse(
  value: unknown,
): value is SendChatMessageResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const response = value as Record<string, unknown>;
  const reasonCode = response.reasonCode;
  const requiresReview =
    reasonCode !== "supported" && reasonCode !== "refusal";

  const keys = Object.keys(response).sort();
  const hasExactKeys =
    keys.length === ASSISTANT_RESPONSE_KEYS.length &&
    keys.every((key, index) => key === ASSISTANT_RESPONSE_KEYS[index]);

  return (
    hasExactKeys &&
    typeof response.answer === "string" &&
    response.answer.trim().length > 0 &&
    Array.isArray(response.sourceIds) &&
    response.sourceIds.every((sourceId) => typeof sourceId === "string") &&
    typeof response.needsReview === "boolean" &&
    ASSISTANT_REASON_CODES.some(
      (allowedReasonCode: AssistantReasonCode) =>
        allowedReasonCode === reasonCode,
    ) &&
    response.needsReview === requiresReview
  );
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
