import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { KNOWLEDGE_CATEGORIES, KnowledgeDocument } from './knowledge.types';

@Injectable()
export class KnowledgeRepository implements OnModuleInit {
  private readonly logger = new Logger(KnowledgeRepository.name);
  private readonly documentsDirectory = join(__dirname, 'documents');

  private documents: KnowledgeDocument[] = [];

  async onModuleInit(): Promise<void> {
    await this.loadDocuments();
  }

  findAll(): KnowledgeDocument[] {
    return this.documents.map((document) => ({ ...document }));
  }

  findById(id: string): KnowledgeDocument | undefined {
    const document = this.documents.find((item) => item.id === id);
    return document ? { ...document } : undefined;
  }

  private parseDocument(
    file: string,
    category: KnowledgeDocument['category'],
    rawContent: string,
  ): KnowledgeDocument {
    const match = rawContent.match(
      /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)([\s\S]*)$/,
    );

    if (!match) {
      throw new Error(`Knowledge document "${file}" has invalid frontmatter`);
    }

    const [, frontmatter, body] = match;
    const metadata = Object.fromEntries(
      frontmatter.split(/\r?\n/).map((line) => {
        const separatorIndex = line.indexOf(':');

        if (separatorIndex === -1) {
          throw new Error(`Knowledge document "${file}" has invalid metadata`);
        }

        return [
          line.slice(0, separatorIndex).trim(),
          line.slice(separatorIndex + 1).trim(),
        ];
      }),
    );

    const { sourceId, organization, title } = metadata;
    const content = body.trim();

    if (!sourceId || !organization || !title || !content) {
      throw new Error(
        `Knowledge document "${file}" is missing required metadata or content`,
      );
    }

    return {
      id: `${category}/${file.replace(/\.md$/, '')}`,
      sourceId,
      organization,
      category,
      title,
      content,
    };
  }

  private async loadDocuments(): Promise<void> {
    const loaded: KnowledgeDocument[] = [];

    try {
      for (const category of KNOWLEDGE_CATEGORIES) {
        const categoryDirectory = join(this.documentsDirectory, category);

        const files = (await readdir(categoryDirectory))
          .filter((file) => file.endsWith('.md'))
          .sort();

        for (const file of files) {
          const rawContent = await readFile(
            join(categoryDirectory, file),
            'utf8',
          );

          loaded.push(this.parseDocument(file, category, rawContent));
        }
      }
    } catch (error) {
      this.logger.error(
        'Failed to load knowledge documents',
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        'The assistant knowledge base could not be loaded',
      );
    }

    if (loaded.length !== 6) {
      throw new InternalServerErrorException(
        `Expected 6 knowledge documents, but loaded ${loaded.length}`,
      );
    }

    this.documents = loaded;
    this.logger.log(`Loaded ${loaded.length} knowledge documents`);
  }
}
