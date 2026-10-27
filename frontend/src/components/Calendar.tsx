import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  Snackbar,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
//components
import { CalendarMonthGrid } from "./CalendarMonthGrid";
import { CalendarControls } from "./CalendarControls";
import { CalendarTimeGrid } from "./CalendarTimeGrid";
import { ChatPanel } from "./ChatPanel";
import { EventDialog } from "./EventDialog";
//custom hooks
import { useCalendarEvents } from "../hooks/useCalendarEvents";
import { useCalendarUiState } from "../hooks/useCalendarUiState";
import { useCalendarViewModel } from "../hooks/useCalendarViewModel";
//helers
import {
  getCalendarControlText,
  getCalendarViewLabels,
} from "../helpers/calendar-presentation-helpers";
import {
  calendarLayoutSx,
  calendarLoadingContentSx,
  calendarMainSx,
  calendarPageSx,
} from "../styles/calendarStyles";
import { successSnackbarAlertSx } from "../styles/alertStyles";
import { chatMobileOpenButtonSx } from "../styles/chatStyles";
import {
  eventOccursOnDateInZone,
  formatEventRange,
} from "../utils/calendar-utils";
import { DateTime } from "luxon";
import { useState } from "react";
import { useCalendarKeyboardShortcuts } from "../hooks/useCalendarKeyboardShortcuts";

const SLOT_HEIGHT = 40;
const SLOT_MINUTES = 30;
const HOURS_PER_DAY = 24;
const SLOTS_PER_DAY = 48;

export function Calendar() {
  const { t } = useTranslation();
  const theme = useTheme();
  // const [now] = useState(() => Date.now());
  const [now] = useState(() => DateTime.utc().toMillis());
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const {
    currentView,
    setCurrentView,
    currentDate,
    viewTimeZone,
    setViewTimeZone,
    modalState,
    timeZones,
    goPrevious,
    goNext,
    goToday,
    openCreateDialog,
    openCreateForSlot,
    openCreateForDay,
    openEditDialog,
    closeModal,
  } = useCalendarUiState();
  const {
    events,
    loading,
    error,
    successMessage,
    setSuccessMessage,
    handleCreate,
    handleUpdate,
    handleDelete,
  } = useCalendarEvents({
    currentView,
    currentDate,
    viewTimeZone,
    t,
  });
  const { rangeLabel, visibleDays, monthCells, isMonthView } =
    useCalendarViewModel({
      currentView,
      currentDate,
      viewTimeZone,
    });

  useCalendarKeyboardShortcuts({
    enabled: modalState === null,
    onCreateEvent: openCreateDialog,
    onPrevious: goPrevious,
    onNext: goNext,
    onToday: goToday,
  });

  const headerText = {
    nextEventLabel: t("newEvent"),
    viewTimeZone: t("viewTimeZone"),
  };

  const controlText = getCalendarControlText(t);
  const viewLabels = getCalendarViewLabels(t);
  const todayInZone = DateTime.now().setZone(viewTimeZone);
  const isViewingToday = (() => {
    if (currentView === "day") {
      return DateTime.fromJSDate(currentDate)
        .setZone(viewTimeZone)
        .hasSame(todayInZone, "day");
    }
    if (currentView === "week") {
      const currentWeekStart = DateTime.fromJSDate(currentDate)
        .setZone(viewTimeZone)
        .startOf("week");
      const todayWeekStart = todayInZone.startOf("week");
      return currentWeekStart.hasSame(todayWeekStart, "day");
    }
    return DateTime.fromJSDate(currentDate)
      .setZone(viewTimeZone)
      .hasSame(todayInZone, "month");
  })();

  const upcomingEvents = events
    .filter((event) => eventOccursOnDateInZone(event, new Date(), viewTimeZone))
    .sort((first, second) => {
      return (
        DateTime.fromISO(first.startUtc, { zone: "utc" }).toMillis() -
        DateTime.fromISO(second.startUtc, { zone: "utc" }).toMillis()
      );
    })
    .filter((event) => {
      return DateTime.fromISO(event.endUtc, { zone: "utc" }).toMillis() >= now;
    })
    // .slice(0, 5)
    .map((event) => ({
      id: event.occurrenceId,
      title: event.title,
      timeLabel: formatEventRange(event, viewTimeZone),
    }));

  function renderContent() {
    if (loading) {
      return (
        <Card>
          <CardContent sx={calendarLoadingContentSx}>
            <Typography variant="h6">{t("loading")}</Typography>
            <Typography color="text.secondary">
              {t("loadingSubtitle")}
            </Typography>
            <Skeleton variant="rounded" height={44} />
            <Skeleton variant="rounded" height={isMobile ? 260 : 420} />
          </CardContent>
        </Card>
      );
    }
    if (isMonthView) {
      return renderMonthView();
    }
    return renderTimeGrid(visibleDays);
  }
  function renderTimeGrid(days: Date[]) {
    return (
      <CalendarTimeGrid
        days={days}
        events={events}
        viewTimeZone={viewTimeZone}
        isMobile={isMobile}
        isTablet={isTablet}
        slotHeight={SLOT_HEIGHT}
        slotMinutes={SLOT_MINUTES}
        slotsPerDay={SLOTS_PER_DAY}
        hoursPerDay={HOURS_PER_DAY}
        onOpenCreateForSlot={openCreateForSlot}
        onEditEvent={openEditDialog}
      />
    );
  }

  function renderMonthView() {
    return (
      <CalendarMonthGrid
        cells={monthCells}
        currentDate={currentDate}
        events={events}
        viewTimeZone={viewTimeZone}
        isMobile={isMobile}
        onOpenCreateForDay={openCreateForDay}
        onEditEvent={openEditDialog}
      />
    );
  }

  return (
    <>
      <Box sx={calendarPageSx}>
        <Box sx={calendarLayoutSx}>
          <Box sx={calendarMainSx}>
            <CalendarControls
              isMobile={isMobile}
              showUpcomingEvents={isViewingToday}
              currentView={currentView}
              rangeLabel={rangeLabel}
              previousLabel={controlText.previuosLabel}
              todayLabel={controlText.todayLabel}
              nextLabel={controlText.nextLabel}
              newEventLabel={headerText.nextEventLabel}
              viewTimeZoneLabel={headerText.viewTimeZone}
              upcomingEventsLabel={t("upcomingEventsToday")}
              noUpcomingEventsLabel={t("noUpcomingEventsToday")}
              timeZones={timeZones}
              viewTimeZone={viewTimeZone}
              viewLabels={viewLabels}
              upcomingEvents={upcomingEvents}
              onPrevious={goPrevious}
              onToday={goToday}
              onNext={goNext}
              onCreateEvent={() => openCreateDialog()}
              onViewTimeZoneChange={setViewTimeZone}
              onChangeView={setCurrentView}
            />

            {isTablet ? (
              <Button
                variant="outlined"
                startIcon={<AutoAwesomeIcon />}
                sx={chatMobileOpenButtonSx}
                onClick={() => setIsChatOpen(true)}
              >
                {t("aiAssistant")}
              </Button>
            ) : null}

            {error ? <Alert severity="error">{error}</Alert> : null}

            <AnimatePresence mode="wait">
              <motion.div
                style={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
                key={`${currentView}-${rangeLabel}`}
              >
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {renderContent()}
                </Box>
              </motion.div>
            </AnimatePresence>
          </Box>
          {isTablet ? (
            <Dialog
              fullScreen
              keepMounted
              open={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              aria-label={t("aiAssistant")}
            >
              <Box sx={{ height: "100%", p: 1 }}>
                <ChatPanel onClose={() => setIsChatOpen(false)} />
              </Box>
            </Dialog>
          ) : (
            <ChatPanel />
          )}
        </Box>
      </Box>

      {modalState?.mode === "create" ? (
        <EventDialog
          event={null}
          initialStartUtc={modalState.startUtc}
          initialEndUtc={modalState.endUtc}
          onClose={closeModal}
          onSave={handleCreate}
        />
      ) : null}

      {modalState?.mode === "edit" ? (
        <EventDialog
          event={modalState.event}
          onClose={closeModal}
          onSave={(payload) =>
            handleUpdate(modalState.event.baseEventId, payload)
          }
          onDelete={() => handleDelete(modalState.event.baseEventId)}
        />
      ) : null}

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage("")}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccessMessage("")}
          sx={successSnackbarAlertSx}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
