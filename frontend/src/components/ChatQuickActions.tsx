import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, ToggleButton, ToggleButtonGroup } from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ScheduleIcon from "@mui/icons-material/Schedule";

import {
  DEFAULT_FREE_TIME_DURATION,
  FREE_TIME_DURATION_PRESETS,
} from "../helpers/chat-format-helpers";
import { chatQuickActionsSx } from "../styles/chatStyles";

interface ChatQuickActionsProps {
  disabled: boolean;
  onShowDayEvents: () => void;
  onFindFreeTime: (durationMinutes: number) => void;
}

export function ChatQuickActions({
  disabled,
  onShowDayEvents,
  onFindFreeTime,
}: ChatQuickActionsProps) {
  const { t } = useTranslation();
  const [duration, setDuration] = useState<number>(DEFAULT_FREE_TIME_DURATION);

  return (
    <Box role="group" aria-label={t("chatQuickActions")} sx={chatQuickActionsSx}>
      <Button
        size="small"
        variant="outlined"
        startIcon={<EventNoteIcon />}
        disabled={disabled}
        onClick={onShowDayEvents}
      >
        {t("chatActionDayEvents")}
      </Button>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={duration}
          aria-label={t("chatDurationLabel")}
          onChange={(_event, value: number | null) => {
            if (value !== null) {
              setDuration(value);
            }
          }}
        >
          {FREE_TIME_DURATION_PRESETS.map((minutes) => (
            <ToggleButton
              key={minutes}
              value={minutes}
              disabled={disabled}
              aria-label={t("chatDurationAria", { minutes })}
            >
              {t("chatDurationOption", { minutes })}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Button
          size="small"
          variant="outlined"
          startIcon={<ScheduleIcon />}
          disabled={disabled}
          onClick={() => onFindFreeTime(duration)}
        >
          {t("chatActionFindFreeTime")}
        </Button>
      </Box>
    </Box>
  );
}
