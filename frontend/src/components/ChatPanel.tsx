import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";

import { useChatConversation } from "../hooks/useChatConversation";
import {
  chatComposerSx,
  chatHeaderSx,
  chatMessageListSx,
  chatMessageSx,
  chatPanelSx,
  chatSendButtonSx,
  chatWelcomeSx,
} from "../styles/chatStyles";

interface ChatPanelProps {
  onClose?: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const { t } = useTranslation();
  const { messages, isPending, sendMessage } = useChatConversation();
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLUListElement>(null);

  // Scroll the message list itself, never the page.
  useEffect(() => {
    const list = listRef.current;
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages, isPending]);

  const canSend = draft.trim().length > 0 && !isPending;

  function submit() {
    if (!canSend) {
      return;
    }
    void sendMessage(draft);
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <Box component="section" aria-label={t("aiAssistant")} sx={chatPanelSx}>
      <Box component="header" sx={chatHeaderSx}>
        <AutoAwesomeIcon fontSize="small" />
        <Typography component="h2" variant="h6" sx={{ flex: 1 }}>
          {t("aiAssistant")}
        </Typography>
        {onClose ? (
          <IconButton
            aria-label={t("backToCalendar")}
            onClick={onClose}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        ) : null}
      </Box>

      <Box
        component="ul"
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label={t("chatConversation")}
        sx={chatMessageListSx}
      >
        {messages.length === 0 ? (
          <Box component="li" sx={chatWelcomeSx}>
            <Typography variant="body2">{t("chatWelcome")}</Typography>
          </Box>
        ) : null}

        {messages.map((message) => (
          <Box component="li" key={message.id} sx={chatMessageSx(message.role)}>
            <Typography variant="body2" component="span">
              {message.content}
            </Typography>
          </Box>
        ))}

        {isPending ? (
          <Box
            component="li"
            sx={chatMessageSx("assistant")}
            aria-label={t("chatThinking")}
          >
            <CircularProgress size={16} aria-hidden />
          </Box>
        ) : null}
      </Box>

      <Box
        component="form"
        sx={chatComposerSx}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          size="small"
          value={draft}
          placeholder={t("chatPlaceholder")}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          slotProps={{ htmlInput: { "aria-label": t("chatMessageLabel") } }}
        />
        <IconButton
          type="submit"
          aria-label={t("chatSend")}
          disabled={!canSend}
          sx={chatSendButtonSx}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
