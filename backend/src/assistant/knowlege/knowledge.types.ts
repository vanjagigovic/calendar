export const KNOWLEDGE_CATEGORIES = [
  'health',
  'learning',
  'productivity',
] as const;

export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];

export interface KnowledgeDocument {
  id: string;
  category: KnowledgeCategory;
  title: string;
  content: string;
}

export interface KnowledgePassage {
  sourceId: string;
  documentId: string;
  category: KnowledgeCategory;
  title: string;
  content: string;
}

export interface KnowledgeSearchResult {
  passages: KnowledgePassage[];
}
