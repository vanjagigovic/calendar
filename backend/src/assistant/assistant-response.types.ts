export const ASSISTANT_REASON_CODES = [
  'supported',
  'insufficient_evidence',
  'conflicting_sources',
  'requires_review',
  'refusal',
] as const;

export type AssistantReasonCode = (typeof ASSISTANT_REASON_CODES)[number];

export interface AssistantResponse {
  answer: string;
  sourceIds: string[];
  needsReview: boolean;
  reasonCode: AssistantReasonCode;
}
