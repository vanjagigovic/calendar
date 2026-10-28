import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { KnowledgeRepository } from './knowledge.repository';

describe('KnowledgeRepository', () => {
  let repository: KnowledgeRepository;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [KnowledgeRepository],
    }).compile();

    repository = module.get(KnowledgeRepository);
  });

  afterEach(async () => {
    await module.close();
  });

  it('loads all six knowledge documents', async () => {
    await repository.onModuleInit();

    expect(repository.findAll()).toHaveLength(6);
  });

  it('finds a document by its stable ID and loads its metadata', async () => {
    await repository.onModuleInit();

    const document = repository.findById('health/workout-planning');

    expect(document).toBeDefined();
    expect(document?.category).toBe('health');
    expect(document?.content).not.toBe('');
    expect(document?.sourceId).toBe('healthy-workout-planning');
    expect(document?.organization).toBe('Healthy');
  });

  it('returns undefined for an unknown document ID', async () => {
    await repository.onModuleInit();

    expect(repository.findById('unknown/document')).toBeUndefined();
  });

  it('loads valid metadata for all six knowledge documents', async () => {
    await repository.onModuleInit();

    const documents = repository.findAll();

    expect(documents).toHaveLength(6);

    for (const document of documents) {
      expect(document.sourceId).toBeTruthy();
      expect(document.organization).toBeTruthy();
      expect(document.title).toBeTruthy();
      expect(document.content).not.toBe('');
    }

    expect(new Set(documents.map((document) => document.sourceId)).size).toBe(
      6,
    );
  });
});
