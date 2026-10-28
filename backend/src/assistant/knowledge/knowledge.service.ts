import { Injectable } from '@nestjs/common';
import { KnowledgeRepository } from './knowledge.repository';
import {
  KnowledgeCategory,
  KnowledgePassage,
  KnowledgeSearchResult,
} from './knowledge.types';

@Injectable()
export class KnowledgeService {
  constructor(private readonly knowledgeRepository: KnowledgeRepository) {}

  search(query: string, limit = 3): KnowledgeSearchResult {
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

    const rankedPassages = passages
      .map((passage) => ({
        passage,
        score: this.scorePassage(passage.content, queryTerms),
      }))
      .filter((result) => result.score > 0)
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
    const passageTerms = this.tokenize(content);
    let score = 0;

    for (const term of queryTerms) {
      if (passageTerms.includes(term)) {
        score++;
      }
    }

    return score;
  }

  private tokenize(text: string): string[] {
    return (
      text
        .toLocaleLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .match(/[\p{L}\p{N}]+/gu) ?? []
    );
  }
}
