export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

export const MOCK_REPLY_DELAY_MS = 900;

const MOCK_REPLIES = [
  "Thanks for your message. This is a preview of the assistant, so I can't look at your calendar yet.",
  "Got it. Once the assistant is connected, you'll be able to ask questions about your schedule here.",
  "I'm a placeholder assistant for now, so this reply is not based on your events.",
];

let messageCounter = 0;

export function createChatMessage(
  role: ChatRole,
  content: string,
): ChatMessage {
  messageCounter += 1;
  return { id: `chat-${messageCounter}`, role, content };
}

// Replace this function with a real API call when the backend is available.
export function requestMockAssistantReply(
  userMessageCount: number,
  delayMs: number = MOCK_REPLY_DELAY_MS,
): Promise<string> {
  const reply = MOCK_REPLIES[(userMessageCount - 1) % MOCK_REPLIES.length];

  return new Promise((resolve) => {
    setTimeout(() => resolve(reply), delayMs);
  });
}
