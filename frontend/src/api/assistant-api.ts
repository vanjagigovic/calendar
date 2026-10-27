import { apiRequest } from "./api-client";
import {
  buildDayEventsPath,
  buildFreeSlotPath,
} from "../helpers/assistant-path-helpers";
import type {
  DayEventsResponse,
  FreeSlotResponse,
} from "../types/assistant-api-types";

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
