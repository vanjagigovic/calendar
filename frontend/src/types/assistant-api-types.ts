import type { EventOccurrenceResponseDto } from "./event-api-types";

export type DayEventsResponse = EventOccurrenceResponseDto[];

export interface FreeInterval {
  startUtc: string;
  endUtc: string;
}

export interface FreeSlotResponse {
  freeInterval: FreeInterval | null;
}

export const ASSISTANT_REASON_CODES = [
  "supported",
  "insufficient_evidence",
  "conflicting_sources",
  "requires_review",
  "refusal",
] as const;

export type AssistantReasonCode = (typeof ASSISTANT_REASON_CODES)[number];

export interface SendChatMessageResponse {
  answer: string;
  sourceIds: string[];
  needsReview: boolean;
  reasonCode: AssistantReasonCode;
}
