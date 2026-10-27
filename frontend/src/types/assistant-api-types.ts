import type { EventOccurrenceResponseDto } from "./event-api-types";

export type DayEventsResponse = EventOccurrenceResponseDto[];

export interface FreeInterval {
  startUtc: string;
  endUtc: string;
}

export interface FreeSlotResponse {
  freeInterval: FreeInterval | null;
}
