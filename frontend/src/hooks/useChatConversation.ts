import { useCallback, useEffect, useRef, useState } from "react";

import {
  createChatMessage,
  requestMockAssistantReply,
  type ChatMessage,
} from "../helpers/chat-mock-helpers";

export function useChatConversation() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPending, setIsPending] = useState(false);
  const pendingRef = useRef(false);
  const userMessageCountRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const content = text.trim();

    if (!content || pendingRef.current) {
      return;
    }

    pendingRef.current = true;
    userMessageCountRef.current += 1;
    setMessages((current) => [...current, createChatMessage("user", content)]);
    setIsPending(true);

    try {
      const reply = await requestMockAssistantReply(
        userMessageCountRef.current,
      );

      if (mountedRef.current) {
        setMessages((current) => [
          ...current,
          createChatMessage("assistant", reply),
        ]);
      }
    } finally {
      pendingRef.current = false;
      if (mountedRef.current) {
        setIsPending(false);
      }
    }
  }, []);

  return { messages, isPending, sendMessage };
}
