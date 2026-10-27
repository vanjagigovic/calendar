import type { SxProps, Theme } from "@mui/material";

export const chatPanelSx: SxProps<Theme> = (theme) => ({
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  minHeight: 0,
  height: "100%",
  overflow: "hidden",
  bgcolor: theme.custom.glass.surface.background,
  backdropFilter: theme.custom.glass.surface.blur,
  border: `1px solid ${theme.custom.glass.surface.border}`,
  borderRadius: "10px",
  boxShadow: theme.custom.glass.surface.shadow,
});

export const chatHeaderSx: SxProps<Theme> = (theme) => ({
  display: "flex",
  alignItems: "center",
  gap: 1,
  px: 2,
  py: 1.5,
  flexShrink: 0,
  color: theme.custom.text.accent,
  borderBottom: `1px solid ${theme.custom.borders.default}`,
  background: theme.custom.gradients.dialogAccent,
});

export const chatMessageListSx: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 1.25,
  p: 2,
  m: 0,
  listStyle: "none",
};

export const chatWelcomeSx: SxProps<Theme> = (theme) => ({
  p: 1.5,
  borderRadius: "10px",
  color: theme.palette.text.secondary,
  bgcolor: theme.custom.fills.sectionSoft,
  border: `1px dashed ${theme.custom.borders.default}`,
});

export const chatMessageSx =
  (role: "user" | "assistant"): SxProps<Theme> =>
  (theme) => ({
    alignSelf: role === "user" ? "flex-end" : "flex-start",
    maxWidth: "85%",
    px: 1.5,
    py: 1,
    borderRadius: "10px",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    ...(role === "user"
      ? {
          background: theme.custom.text.accent,
          color: theme.palette.primary.contrastText,
        }
      : {
          bgcolor: theme.custom.fills.selectedSoft,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.custom.borders.subtle}`,
        }),
  });

export const chatComposerSx: SxProps<Theme> = (theme) => ({
  display: "flex",
  alignItems: "flex-end",
  gap: 1,
  p: 1.5,
  flexShrink: 0,
  borderTop: `1px solid ${theme.custom.borders.default}`,
});

export const chatSendButtonSx: SxProps<Theme> = (theme) => ({
  flexShrink: 0,
  color: theme.palette.primary.contrastText,
  background: theme.custom.gradients.primaryAction,
  "&.Mui-disabled": {
    background: theme.custom.fills.viewSwitcher,
    color: theme.custom.text.subtle,
  },
});

export const chatMobileOpenButtonSx: SxProps<Theme> = (theme) => ({
  alignSelf: "flex-start",
  height: 44,
  borderRadius: "10px",
  color: theme.custom.text.accent,
  borderColor: theme.custom.borders.default,
  bgcolor: theme.custom.fills.todayButton,
});
