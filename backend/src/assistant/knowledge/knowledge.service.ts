import { Injectable } from '@nestjs/common';
import { KnowledgeRepository } from './knowledge.repository';
import {
  KnowledgeCategory,
  KnowledgePassage,
  KnowledgeSearchResult,
} from './knowledge.types';

/**
 * Minimum number of distinct meaningful query terms a passage must contain.
 * The requirement is capped by the number of meaningful query terms, so a
 * single-keyword query still matches passages that contain that keyword.
 */
export const MIN_RELEVANCE_SCORE = 2;

export const STOPWORDS: ReadonlySet<string> = new Set([
  'a',
  'about',
  'above',
  'after',
  'again',
  'all',
  'also',
  'am',
  'an',
  'and',
  'any',
  'are',
  'as',
  'at',
  'be',
  'because',
  'been',
  'before',
  'being',
  'between',
  'both',
  'but',
  'by',
  'can',
  'could',
  'did',
  'do',
  'does',
  'doing',
  'down',
  'during',
  'each',
  'few',
  'for',
  'from',
  'further',
  'had',
  'has',
  'have',
  'having',
  'he',
  'her',
  'here',
  'hers',
  'him',
  'his',
  'how',
  'i',
  'if',
  'in',
  'into',
  'is',
  'it',
  'its',
  'just',
  'me',
  'more',
  'most',
  'my',
  'no',
  'nor',
  'not',
  'of',
  'off',
  'on',
  'once',
  'only',
  'or',
  'other',
  'our',
  'ours',
  'out',
  'over',
  'own',
  's',
  'same',
  'she',
  'should',
  'so',
  'some',
  'such',
  'than',
  'that',
  'the',
  'their',
  'theirs',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'those',
  'through',
  'to',
  'too',
  'under',
  'until',
  'up',
  'very',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'who',
  'whom',
  'why',
  'will',
  'with',
  'would',
  'you',
  'your',
  'yours',
]);

@Injectable()
export class KnowledgeService {
  constructor(private readonly knowledgeRepository: KnowledgeRepository) {}

  search(
    query: string,
    limit = 3,
    minScore = MIN_RELEVANCE_SCORE,
  ): KnowledgeSearchResult {
    const queryTerms = new Set(this.tokenize(query));

    if (queryTerms.size === 0 || limit <= 0) {
      return { passages: [] };
    }

    const passages = this.knowledgeRepository
      .findAll()
      .flatMap((document) =>
        this.splitIntoPassages(
          document.id,
          document.sourceId,
          document.category,
          document.title,
          document.content,
        ),
      );

    const requiredScore = Math.max(1, Math.min(minScore, queryTerms.size));

    const rankedPassages = passages
      .map((passage) => ({
        passage,
        score: this.scorePassage(passage.content, queryTerms),
      }))
      .filter((result) => result.score >= requiredScore)
      .sort((a, b) => b.score - a.score);

    return {
      passages: rankedPassages.slice(0, limit).map((result) => result.passage),
    };
  }

  private splitIntoPassages(
    documentId: string,
    sourceId: string,
    category: KnowledgeCategory,
    title: string,
    content: string,
  ): KnowledgePassage[] {
    const blocks = content
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean);

    const groupedBlocks: string[] = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];

      if (/^#{1,6}\s/.test(block) && i + 1 < blocks.length) {
        groupedBlocks.push(`${block}\n\n${blocks[++i]}`);
      } else {
        groupedBlocks.push(block);
      }
    }

    return groupedBlocks.map((passageContent, index) => ({
      sourceId: `${sourceId}#${index + 1}`,
      documentId,
      category,
      title,
      content: passageContent,
    }));
  }

  private scorePassage(content: string, queryTerms: Set<string>): number {
    const passageTerms = new Set(this.tokenize(content));
    let score = 0;

    for (const term of queryTerms) {
      if (passageTerms.has(term)) {
        score++;
      }
    }

    return score;
  }

  private tokenize(text: string): string[] {
    const tokens =
      text
        .toLocaleLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .match(/[\p{L}\p{N}]+/gu) ?? [];

    return tokens.filter((token) => !STOPWORDS.has(token));
  }
}
