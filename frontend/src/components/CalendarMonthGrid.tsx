import { Box, Card, Stack, Typography } from "@mui/material";
import { DateTime } from "luxon";
import { useMemo } from "react";

import { CalendarEventChip } from "./CalendarEventChip";
import {
  eventOccursOnDateInZone,
  formatDateKey,
} from "../utils/calendar-utils";

import {
  monthGridDayCardSx,
  monthGridDayContentSx,
  monthGridDayNumberSx,
  monthGridDaysSx,
  monthGridHeaderCardSx,
  monthGridRowSx,
  monthGridShellSx,
} from "../styles/calendarStyles";

import type { CalendarEvent } from "../types/types";

const WEEKDAY_LABELS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

interface CalendarMonthGridProps {
  cells: Date[];
  currentDate: Date;
  events: CalendarEvent[];
  viewTimeZone: string;
  isMobile: boolean;
  onOpenCreateForDay: (day: Date) => void;
  onEditEvent: (event: CalendarEvent) => void;
}

export function CalendarMonthGrid({
  cells,
  currentDate,
  events,
  viewTimeZone,
  isMobile,
  onOpenCreateForDay,
  onEditEvent,
}: CalendarMonthGridProps) {
  const todayKey = formatDateKey(new Date());
  const selectedDayKey = formatDateKey(currentDate);

  /**
   * Pre-group events by day (performance boost)
   */
  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};

    for (const day of cells) {
      const key = formatDateKey(day);

      map[key] = events.filter((event) =>
        eventOccursOnDateInZone(event, day, viewTimeZone),
      );
    }

    return map;
  }, [cells, events, viewTimeZone]);

  return (
    <Box sx={monthGridShellSx}>
      <Box sx={monthGridRowSx}>
        {WEEKDAY_LABELS.map((label) => (
          <Card key={label} variant="outlined" sx={monthGridHeaderCardSx}>
            <Typography variant={isMobile ? "caption" : "subtitle2"}>
              {label}
            </Typography>
          </Card>
        ))}
      </Box>

      <Box sx={monthGridDaysSx}>
        {cells.map((day) => {
          const dayKey = formatDateKey(day);
          const isToday = dayKey === todayKey;
          const isSelected = dayKey === selectedDayKey;
          const isOutsideMonth = day.getMonth() !== currentDate.getMonth();

          const dayEvents = eventsByDay[dayKey] ?? [];

          return (
            <Card
              key={dayKey}
              variant="outlined"
              sx={monthGridDayCardSx(isToday, isSelected, isOutsideMonth)}
              onClick={() => onOpenCreateForDay(day)}
            >
              <Typography
                variant={isMobile ? "caption" : "subtitle2"}
                sx={monthGridDayNumberSx(isOutsideMonth)}
              >
                {DateTime.fromJSDate(day).setZone(viewTimeZone).day}
              </Typography>

              <Stack spacing={0.5} sx={monthGridDayContentSx}>
                {dayEvents.slice(0, isMobile ? 2 : 3).map((event) => (
                  <CalendarEventChip
                    key={event.occurrenceId}
                    event={event}
                    isMobile={isMobile}
                    onClick={() => onEditEvent(event)}
                  />
                ))}
              </Stack>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}