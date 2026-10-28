import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { readdir, readFile } from 'node:fs/promises';
import { join, parse } from 'node:path';
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

  private async loadDocuments(): Promise<void> {
    const loaded: KnowledgeDocument[] = [];

    try {
      for (const category of KNOWLEDGE_CATEGORIES) {
        const categoryDirectory = join(this.documentsDirectory, category);

        const files = (await readdir(categoryDirectory))
          .filter((file) => file.endsWith('.md'))
          .sort();

        for (const file of files) {
          const content = (
            await readFile(join(categoryDirectory, file), 'utf8')
          ).trim();

          if (!content) {
            throw new Error(`Knowledge document "${file}" is empty`);
          }

          const filename = parse(file).name;
          const heading = content.match(/^#\s+(.+)$/m);

          loaded.push({
            id: `${category}/${filename}`,
            category: category,
            title: heading?.[1]?.trim() ?? filename,
            content,
          });
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
