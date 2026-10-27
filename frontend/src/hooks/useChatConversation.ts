import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { findFreeSlot, getDayEvents } from "../api/assistant-api";
import { createChatMessage, type ChatMessage } from "../helpers/chat-helpers";
import {
  buildFreeSlotWindow,
  formatChatDate,
  formatDayEventsMessage,
  formatFreeSlotMessage,
} from "../helpers/chat-format-helpers";
import { getErrorMessage } from "../helpers/client-state-helpers";

interface UseChatConversationOptions {
  date: string;
  timeZone: string;
}

export function useChatConversation({
  date,
  timeZone,
}: UseChatConversationOptions) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPending, setIsPending] = useState(false);
  const pendingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const appendMessage = useCallback(
    (role: ChatMessage["role"], content: string) => {
      setMessages((current) => [...current, createChatMessage(role, content)]);
    },
    [],
  );

  const runAction = useCallback(
    async (userText: string, produceReply: () => Promise<string>) => {
      if (pendingRef.current) {
        return;
      }

      pendingRef.current = true;
      appendMessage("user", userText);
      setIsPending(true);

      try {
        const reply = await produceReply();

        if (mountedRef.current) {
          appendMessage("assistant", reply);
        }
      } catch (error) {
        if (mountedRef.current) {
          appendMessage(
            "assistant",
            t("chatRequestFailed", {
              message: getErrorMessage(error, t("chatRequestFailedFallback")),
            }),
          );
        }
      } finally {
        pendingRef.current = false;
        if (mountedRef.current) {
          setIsPending(false);
        }
      }
    },
    [appendMessage, t],
  );

  // Free text is not understood yet; reply with a fixed hint, never calendar data.
  const sendMessage = useCallback(
    (text: string) => {
      const content = text.trim();

      if (!content || pendingRef.current) {
        return;
      }

      appendMessage("user", content);
      appendMessage("assistant", t("chatFreeTextHint"));
    },
    [appendMessage, t],
  );

  const showDayEvents = useCallback(
    () =>
      runAction(
        t("chatUserDayEvents", { date: formatChatDate(date, timeZone) }),
        async () =>
          formatDayEventsMessage(
            await getDayEvents(date, timeZone),
            date,
            timeZone,
            t,
          ),
      ),
    [date, runAction, t, timeZone],
  );

  const findFreeTime = useCallback(
    (durationMinutes: number) =>
      runAction(
        t("chatUserFreeTime", {
          minutes: durationMinutes,
          date: formatChatDate(date, timeZone),
        }),
        async () => {
          const window = buildFreeSlotWindow(date, timeZone);

          if (!window) {
            return t("chatFreeSlotPastDay", {
              date: formatChatDate(date, timeZone),
            });
          }

          const response = await findFreeSlot(
            window.startUtc,
            window.endUtc,
            durationMinutes,
          );

          return formatFreeSlotMessage(
            response,
            window,
            durationMinutes,
            timeZone,
            t,
          );
        },
      ),
    [date, runAction, t, timeZone],
  );

  return { messages, isPending, sendMessage, showDayEvents, findFreeTime };
}
