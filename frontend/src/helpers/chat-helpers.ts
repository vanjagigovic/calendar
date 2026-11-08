export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  needsReview?: boolean;
}

let messageCounter = 0;

export function createChatMessage(
  role: ChatRole,
  content: string,
  needsReview = false,
): ChatMessage {
  messageCounter += 1;
  return { id: `chat-${messageCounter}`, role, content, needsReview };
}
