export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

let messageCounter = 0;

export function createChatMessage(
  role: ChatRole,
  content: string,
): ChatMessage {
  messageCounter += 1;
  return { id: `chat-${messageCounter}`, role, content };
}
