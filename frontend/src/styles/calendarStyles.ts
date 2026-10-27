import type { SxProps, Theme } from "@mui/material";

export const calendarPageSx: SxProps<Theme> = (theme) => ({
  width: "calc(100% - 50px)",
  maxWidth: "none",
  mx: "auto",
  px: { xs: 0, md: 0 },
  py: { xs: 3, md: 2 },
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  [theme.breakpoints.up("md")]: {
    height: "100vh",
    overflow: "hidden",
    "@supports (height: 100dvh)": { height: "100dvh" },
  },
  background: `
    radial-gradient(circle at top left, ${theme.custom.layout.pageOverlayPrimary}, ${theme.custom.fills.transparent} 34%),
    radial-gradient(circle at top right, ${theme.custom.layout.pageOverlaySecondary}, ${theme.custom.fills.transparent} 28%),
    linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.custom.layout.pageBackground} 100%)
  `,
});

// Calendar column + reserved right column for the future chat panel (md+).
export const calendarLayoutSx: SxProps<Theme> = (theme) => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  flex: 1,
  minHeight: 0,
  gap: { xs: 2.5, md: 2 },
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "minmax(0, 1fr) clamp(320px, 26vw, 380px)",
    gridTemplateRows: "minmax(0, 1fr)",
  },
});

export const calendarMainSx: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  minHeight: 0,
  gap: { xs: 2.5, md: 2 },
};

export const calendarToolbarSx: SxProps<Theme> = (theme) => ({
  width: "min(1180px, calc(100% - 32px))",
  mx: "auto",
  mt: { xs: 2, md: 3 },
  px: { xs: 2, md: 3.5 },
  py: { xs: 1.5, md: 2 },
  justifyContent: "space-between",
  alignItems: { xs: "stretch", md: "center" },
  flexDirection: { xs: "column", md: "row" },
  gap: 2,
  borderRadius: 6,
  background: theme.custom.glass.toolbar.background,
  backdropFilter: theme.custom.glass.toolbar.blur,
  border: `1px solid ${theme.custom.glass.toolbar.border}`,
  boxShadow: theme.custom.glass.toolbar.shadow,
  color: theme.palette.text.primary,
});

export const calendarHeaderSubtitleSx: SxProps<Theme> = (theme) => ({
  fontSize: { xs: 13, sm: 15 },
  color: theme.palette.text.secondary,
  mt: 0.5,
});

export const calendarHeaderActionsSx: SxProps<Theme> = {
  width: { xs: "100%", md: "auto" },
  justifyContent: "flex-end",
};

export const calendarTimeZoneControlSx: SxProps<Theme> = (theme) => ({
  minWidth: { xs: "100%", sm: 220 },
  "& .MuiInputLabel-root": {
    color: theme.palette.text.secondary,
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: theme.custom.text.accent,
  },
  "& .MuiOutlinedInput-root": {
    color: theme.palette.text.primary,
    background: theme.custom.gradients.dialogAccent,
    backdropFilter: theme.custom.glass.surface.blur,
    borderRadius: 14,
    boxShadow: theme.custom.shadows.medium,
    "& fieldset": {
      borderColor: theme.custom.glass.input.border,
    },
    "&:hover fieldset": {
      borderColor: theme.custom.glass.input.hoverBorder,
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.custom.glass.input.focusBorder,
    },
    "& .MuiSelect-icon": {
      color: theme.custom.text.accent,
    },
    "& .MuiSelect-select": {
      display: "flex",
      alignItems: "center",
    },
  },
});

export const calendarTimeZoneMenuProps = {
  PaperProps: {
    sx: (theme: Theme) => ({
      mt: 1,
      borderRadius: 3,
      border: `1px solid ${theme.custom.glass.menu.border}`,
      background: theme.custom.glass.menu.background,
      boxShadow: theme.custom.glass.menu.shadow,
      "& .MuiMenuItem-root": {
        color: theme.palette.text.primary,
        borderRadius: 1.5,
        margin: "4px 6px",
      },
      "& .MuiMenuItem-root.Mui-selected": {
        backgroundColor: theme.custom.glass.menu.selectedBackground,
      },
      "& .MuiMenuItem-root.Mui-selected:hover": {
        backgroundColor: theme.custom.glass.menu.selectedHoverBackground,
      },
      "& .MuiMenuItem-root:hover": {
        backgroundColor: theme.custom.glass.menu.hoverBackground,
      },
    }),
  },
} as const;

export const calendarSurfaceCardSx: SxProps<Theme> = (theme) => ({
  bgcolor: theme.custom.glass.surface.background,
  backdropFilter: theme.custom.glass.surface.blur,
  border: `1px solid ${theme.custom.glass.surface.border}`,
  borderRadius: "10px",
  boxShadow: theme.custom.glass.surface.shadow,
});

export const calendarControlsContentSx: SxProps<Theme> = {
  display: "grid",
  gap: { xs: 2, md: 1.5 },
  p: { xs: 2.5, md: 2 },
  "&:last-child": { pb: { xs: 2.5, md: 2 } },
};

export const calendarRangeLabelSx: SxProps<Theme> = (theme) => ({
  textAlign: "center",
  color: theme.palette.text.primary,
  letterSpacing: "-0.03em",
});

export const calendarHeroSectionSx: SxProps<Theme> = {
  display: "grid",
  gap: 0,
  justifyItems: "center",
  textAlign: "center",
  width: "100%",
};

export const calendarHeroTitleSx: SxProps<Theme> = (theme) => ({
  fontSize: { xs: "1.9rem", md: "2rem" },
  fontWeight: 700,
  letterSpacing: "-0.04em",
  color: theme.custom.text.accent,
});

export const calendarHeroSubtitleSx: SxProps<Theme> = (theme) => ({
  display: "none",
  color: theme.custom.text.muted,
  fontSize: { xs: 13, md: 15 },
});

export const calendarTopActionBarSx: SxProps<Theme> = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", md: "1fr auto 1fr" },
  gap: 1.5,
  alignItems: "center",
};

export const calendarNavGroupSx: SxProps<Theme> = {
  display: "flex",
  gap: 1,
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: { xs: "center", md: "center" },
};

export const calendarActionGroupSx: SxProps<Theme> = {
  display: "flex",
  gap: 1,
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: { xs: "center", md: "flex-end" },
};

export const calendarNavButtonSx: SxProps<Theme> = (theme) => ({
  minWidth: 44,
  height: 44,
  borderRadius: "10px",
  bgcolor: theme.custom.fills.navButton,
  color: theme.custom.text.accent,
  border: `1px solid ${theme.custom.borders.subtle}`,
  boxShadow: theme.custom.shadows.medium,
});

export const calendarTodayButtonSx: SxProps<Theme> = (theme) => ({
  height: 44,
  px: 2,
  borderRadius: "10px",
  color: theme.custom.text.accent,
  borderColor: theme.custom.borders.default,
  bgcolor: theme.custom.fills.todayButton,
  border: `1px solid ${theme.custom.borders.subtle}`,
});

export const calendarPrimaryActionSx: SxProps<Theme> = (theme) => ({
  height: 46,
  px: 2.25,
  borderRadius: "10px",
  background: theme.custom.gradients.primaryAction,
  color: theme.palette.primary.contrastText,
  boxShadow: theme.custom.shadows.strong,
});

export const calendarViewSwitcherSx: SxProps<Theme> = () => ({
  p: 0.5,
  borderRadius: "10px",
  justifySelf: "center",
  display: "flex",
});

export const calendarViewButtonSx =
  (isActive: boolean): SxProps<Theme> =>
  (theme) => ({
    flex: 1,
    borderRadius: "10px",
    border: `1px solid ${theme.custom.borders.subtle}`,
    px: 2,
    color: isActive
      ? theme.palette.primary.contrastText
      : theme.palette.text.secondary,
    background: isActive
      ? theme.custom.text.accent
      : theme.custom.fills.transparent,
  });

export const calendarLoadingContentSx: SxProps<Theme> = {
  display: "grid",
  gap: 1.75,
  p: { xs: 3, sm: 4 },
};

export const timeGridShellSx: SxProps<Theme> = (theme) => ({
  flex: 1,
  minHeight: 0,
  overflow: "auto",
  borderRadius: "10px",
  bgcolor: theme.custom.glass.surface.background,
  p: { xs: 1.5, sm: 2.5 },
  border: `1px solid ${theme.custom.glass.surface.border}`,
  boxShadow: theme.custom.glass.surface.shadow,
});

export const buildTimeGridColumns = (
  gutterWidth: number,
  dayColumnWidth: number,
  dayCount: number,
) => ({
  display: "grid",
  gridTemplateColumns: `${gutterWidth}px repeat(${dayCount}, minmax(${dayColumnWidth}px, 1fr))`,
  gap: 1.5,
  minWidth: gutterWidth + dayColumnWidth * dayCount,
});

export const timeGridHeaderRowSx = (
  gutterWidth: number,
  dayColumnWidth: number,
  dayCount: number,
): SxProps<Theme> => ({
  ...buildTimeGridColumns(gutterWidth, dayColumnWidth, dayCount),
  position: "sticky",
  top: 0,
  zIndex: 3,
  mb: 1.5,
  py: 0.5,
  bgcolor: "background.paper",
});

export const timeGridBodyRowSx = (
  gutterWidth: number,
  dayColumnWidth: number,
  dayCount: number,
): SxProps<Theme> => ({
  ...buildTimeGridColumns(gutterWidth, dayColumnWidth, dayCount),
  position: "relative",
});

export const currentTimeIndicatorSx =
  (topOffset: number, gutterWidth: number): SxProps<Theme> =>
  (theme) => ({
    position: "absolute",
    top: `${topOffset}px`,
    left: `calc(${gutterWidth}px + ${theme.spacing(1.5)})`,
    right: 0,
    height: 0,
    pointerEvents: "none",
    zIndex: 2,
    opacity: 0.9,
    transition: "top 0.28s ease",
  });

export const currentTimeIndicatorLineSx: SxProps<Theme> = (theme) => ({
  width: "100%",
  height: 2,
  borderRadius: 999,
  bgcolor: theme.palette.primary.main,
  boxShadow: `0 0 0 1px ${theme.custom.fills.transparent}`,
});

export const currentTimeIndicatorDotSx: SxProps<Theme> = (theme) => ({
  position: "absolute",
  left: 0,
  top: "50%",
  width: 10,
  height: 10,
  borderRadius: "50%",
  bgcolor: theme.palette.primary.main,
  transform: "translate(-50%, -50%)",
  boxShadow: `0 0 0 3px ${theme.custom.glass.surface.background}`,
});

export const timeGridDayHeaderCardSx =
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (isToday: boolean, _isSelected: boolean): SxProps<Theme> =>
    (theme) => ({
      p: { xs: 1, sm: 1.35 },
      textAlign: "center",
      borderRadius: "10px",
      border: "1px solid",
      bgcolor: theme.custom.fills.selectedSoft,
      color: theme.palette.primary.main,
      borderColor: theme.palette.primary.main,
      boxShadow: isToday
        ? `${theme.custom.shadows.focusRingStrong}, ${theme.custom.shadows.medium}`
        : theme.custom.shadows.medium,
    });

export const timeGridHourLabelSx =
  (
    isMobile: boolean,
    slotHeight: number,
    isWorkingHour: boolean,
  ): SxProps<Theme> =>
  (theme) => ({
    height: slotHeight * 2,
    color: isWorkingHour ? theme.palette.grey[800] : theme.custom.text.subtle,
    fontSize: isMobile ? 10 : 12,
    pr: 1,
  });

export const timeGridDayColumnSx =
  (
    dayColumnWidth: number,
    slotHeight: number,
    slotsPerDay: number,
    isToday: boolean,
    isSelected: boolean,
  ): SxProps<Theme> =>
  (theme) => ({
    position: "relative",
    minWidth: dayColumnWidth,
    height: slotHeight * slotsPerDay,
    borderRadius: "10px",
    border: "1px solid",
    borderColor: isToday
      ? theme.custom.borders.strong
      : theme.custom.borders.subtle,
    backgroundImage: `linear-gradient(to bottom, ${theme.palette.divider} 1px, ${theme.custom.fills.transparent} 1px)`,
    backgroundSize: `100% ${slotHeight}px`,
    backgroundColor: isSelected
      ? theme.custom.fills.selectedSoft
      : theme.custom.glass.surface.background,
    overflow: "hidden",
    boxShadow: isToday
      ? theme.custom.shadows.focusRing
      : theme.custom.shadows.soft,
    transition: "box-shadow 0.22s ease, background 0.22s ease",
  });

export const timeGridSlotCellSx =
  (slotIndex: number, slotHeight: number): SxProps<Theme> =>
  (theme) => ({
    position: "absolute",
    insetInline: 0,
    top: slotIndex * slotHeight,
    height: slotHeight,
    cursor: "pointer",
    border: "1px solid transparent",
    transition: "background 0.18s ease, box-shadow 0.18s ease",
    "&:hover": {
      background: theme.custom.fills.sectionSoft,
      boxShadow: theme.custom.shadows.insetSoft,
      borderColor: theme.palette.primary.main,
      borderRadius: 1,
    },
  });

export const timeGridFocusBlockSx =
  (slotHeight: number): SxProps<Theme> =>
  (theme) => ({
    position: "absolute",
    insetInline: 0,
    top: 18 * slotHeight,
    height: 16 * slotHeight,
    bgcolor: theme.custom.fills.focusBlock,
    pointerEvents: "none",
  });

export const monthGridShellSx: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  gap: 1.5,
  overflow: "auto",
};

export const monthGridRowSx: SxProps<Theme> = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(72px, 1fr))",
  gap: 1.25,
  minWidth: 560,
  flexShrink: 0,
};

// Auto rows keep their content height; spare height is shared by align-content stretch.
export const monthGridDaysSx: SxProps<Theme> = {
  ...monthGridRowSx,
  flexGrow: 1,
  gridAutoRows: "auto",
  alignContent: "stretch",
};

export const monthGridHeaderCardSx: SxProps<Theme> = (theme) => ({
  p: { xs: 1, sm: 1.2 },
  textAlign: "center",
  borderRadius: "10px",
  bgcolor: theme.custom.fills.selectedSoft,
  color: theme.palette.primary.main,
  border: `1px solid ${theme.palette.primary.main}`,
  boxShadow: theme.custom.shadows.medium,
});

export const monthGridDayCardSx =
  (
    isToday: boolean,
    isSelected: boolean,
    isOutsideMonth: boolean,
  ): SxProps<Theme> =>
  (theme) => ({
    minHeight: { xs: 104, sm: 112 },
    p: { xs: 1, sm: 1.15 },
    borderRadius: "10px",
    bgcolor: isToday
      ? theme.custom.fills.selectedSoft
      : isSelected
        ? theme.custom.gradients.selectedDaySurface
        : theme.custom.glass.surface.background,
    borderColor: isToday
      ? theme.custom.borders.strong
      : theme.custom.borders.subtle,
    boxShadow: isToday
      ? `${theme.custom.shadows.focusRing}, ${theme.custom.glass.surface.shadow}`
      : theme.custom.glass.surface.shadow,
    opacity: isOutsideMonth ? 0.58 : 1,
    transition:
      "transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: theme.custom.shadows.medium,
      background: theme.custom.fills.sectionSoft,
      borderColor: theme.custom.borders.strong,
    },
  });

export const monthGridDayContentSx: SxProps<Theme> = {
  mt: 1.25,
  gap: 0.6,
};

export const monthGridDayNumberSx =
  (isOutsideMonth: boolean): SxProps<Theme> =>
  (theme) => ({
    color: isOutsideMonth
      ? theme.palette.primary.main
      : theme.palette.primary.main,
    fontWeight: 600,
    fontSize: { xs: "0.95rem", sm: "1.1rem" },
  });

export const calendarUpcomingPanelSx: SxProps<Theme> = (theme) => ({
  display: "grid",
  gap: 0.75,
  justifyItems: { xs: "center", md: "start" },

  width: "50%",
  minWidth: 0,
  p: { xs: 0, md: 1.25 },

  borderRadius: "10px",
  background: theme.custom.gradients.dialogAccent,
  border: `1px solid ${theme.custom.glass.surface.border}`,
  boxShadow: theme.custom.shadows.soft,
});

export const calendarUpcomingTitleSx: SxProps<Theme> = (theme) => ({
  fontSize: "0.78rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: theme.custom.text.accent,
});

export const calendarUpcomingListSx: SxProps<Theme> = (theme) => ({
  display: "grid",
  gap: 0.75,
  width: "100%",
  maxHeight: { xs: 100, md: 72 },
  overflowY: "auto",

  scrollbarWidth: "thin",
  scrollbarColor: `${theme.palette.grey[500]} transparent`,

  "&::-webkit-scrollbar": {
    width: "4px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: theme.palette.grey[500],
    borderRadius: "8px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    background: theme.palette.grey[700],
  },
});

export const calendarUpcomingItemSx: SxProps<Theme> = (theme) => ({
  display: "flex",
  gap: 1,
  minWidth: 0,
  p: 0.9,
  borderRadius: "10px",
  backgroundColor: theme.custom.glass.surface.background,
  border: `1px solid ${theme.custom.borders.strong}`,
});

export const calendarUpcomingTimeSx: SxProps<Theme> = (theme) => ({
  fontSize: "0.78rem",
  fontWeight: 700,

  color: theme.custom.text.accent,
});

export const calendarUpcomingEmptySx: SxProps<Theme> = (theme) => ({
  fontSize: "0.9rem",
  color: theme.palette.text.secondary,
});
