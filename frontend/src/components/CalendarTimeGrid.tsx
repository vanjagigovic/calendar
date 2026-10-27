import { Box, Card, Typography } from '@mui/material';
import { DateTime } from 'luxon';

import { CalendarEventCard } from './CalendarEventCard';

import {
  eventOccursOnDateInZone,
  formatDateKey,
  getEventBlockMetrics,
  getSlotStartUtc,
} from '../utils/calendar-utils';

import {
  timeGridBodyRowSx,
  timeGridDayColumnSx,
  timeGridDayHeaderCardSx,
  timeGridFocusBlockSx,
  timeGridHeaderRowSx,
  timeGridHourLabelSx,
  timeGridShellSx,
  timeGridSlotCellSx,
} from '../styles/calendarStyles';

import type { CalendarEvent } from '../types/types';
import { CalendarTimeIndicator } from './CalendarTimeIndicator';

interface CalendarTimeGridProps {
  days: Date[];
  selectedDayKey: string;
  events: CalendarEvent[];
  viewTimeZone: string;
  isMobile: boolean;
  isTablet: boolean;
  slotHeight: number;
  slotMinutes: number;
  slotsPerDay: number;
  hoursPerDay: number;
  onOpenCreateForSlot: (startUtc: string) => void;
  onSelectDay: (day: Date) => void;
  onEditEvent: (event: CalendarEvent) => void;
}

export function CalendarTimeGrid({
  days,
  selectedDayKey,
  onSelectDay,
  events,
  viewTimeZone,
  isMobile,
  isTablet,
  slotHeight,
  slotMinutes,
  slotsPerDay,
  hoursPerDay,
  onOpenCreateForSlot,
  onEditEvent,
}: CalendarTimeGridProps) {
  const isWeekView = days.length > 1;

  const gutterWidth = isMobile ? 56 : 88;

  const dayColumnWidth = isWeekView
    ? isMobile
      ? 92
      : isTablet
      ? 112
      : 132
    : isMobile
    ? 140
    : isTablet
    ? 160
    : 180;

  const eventPadding = isMobile ? 0.5 : 0.75;

  const todayKey = formatDateKey(new Date());

  const headerRowSx = timeGridHeaderRowSx(
    gutterWidth,
    dayColumnWidth,
    days.length
  );

  const bodyRowSx = timeGridBodyRowSx(
    gutterWidth,
    dayColumnWidth,
    days.length
  );

  return (
    <Box sx={timeGridShellSx}>
      <Box sx={headerRowSx}>
        <Box />

        {days.map((day) => (
          <Card
            key={formatDateKey(day)}
            variant="outlined"
            sx={timeGridDayHeaderCardSx(
              formatDateKey(day) === todayKey,
              formatDateKey(day) === selectedDayKey
            )}
            role="button"
            tabIndex={0}
            aria-pressed={formatDateKey(day) === selectedDayKey}
            onClick={() => onSelectDay(day)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelectDay(day);
              }
            }}
          >
            <Typography
              variant={
                isMobile || isWeekView ? 'caption' : 'subtitle2'
              }
            >
              {DateTime.fromJSDate(day)
                .setZone(viewTimeZone)
                .toFormat(
                  isMobile
                    ? 'ccc dd'
                    : isWeekView
                    ? 'ccc dd'
                    : 'ccc dd LLL'
                )}
            </Typography>
          </Card>
        ))}
      </Box>

      <Box sx={bodyRowSx}>
        <Box>
          {Array.from({ length: hoursPerDay }, (_, hour) => (
            <Box
              key={hour}
              sx={timeGridHourLabelSx(
                isMobile,
                slotHeight,
                hour >= 9 && hour <= 17
              )}
            >
              {String(hour).padStart(2, '0')}:00
            </Box>
          ))}
        </Box>

        <CalendarTimeIndicator
          timeZone={viewTimeZone}
          slotHeight={slotHeight}
          slotMinutes={slotMinutes}
          hoursPerDay={hoursPerDay}
          gutterWidth={gutterWidth}
        />

        {days.map((day) => (
          <Box
            key={formatDateKey(day)}
            sx={timeGridDayColumnSx(
              dayColumnWidth,
              slotHeight,
              slotsPerDay,
              formatDateKey(day) === todayKey,
              formatDateKey(day) === selectedDayKey
            )}
          >
            {Array.from({ length: slotsPerDay }, (_, slotIndex) => (
              <Box
                key={`${formatDateKey(day)}-${slotIndex}`}
                data-testid={`slot-${formatDateKey(day)}-${slotIndex}`}
                onClick={() =>
                  onOpenCreateForSlot(
                    getSlotStartUtc(
                      day,
                      slotIndex,
                      slotMinutes,
                      viewTimeZone
                    )
                  )
                }
                sx={timeGridSlotCellSx(slotIndex, slotHeight)}
              />
            ))}

            <Box sx={timeGridFocusBlockSx(slotHeight)} />

            {events
              .filter((event) =>
                eventOccursOnDateInZone(event, day, viewTimeZone)
              )
              .map((event) => {
                const metrics = getEventBlockMetrics(
                  event,
                  day,
                  viewTimeZone
                );

                return (
                  <CalendarEventCard
                    key={event.occurrenceId}
                    event={event}
                    viewTimeZone={viewTimeZone}
                    isMobile={isMobile}
                    eventPadding={eventPadding}
                    slotMinutes={slotMinutes}
                    slotHeight={slotHeight}
                    metrics={metrics}
                    onClick={() => onEditEvent(event)}
                  />
                );
              })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}