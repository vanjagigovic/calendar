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

  it('finds a document by its stable ID', async () => {
    await repository.onModuleInit();

    const document = repository.findById('health/workout-planning');

    expect(document).toBeDefined();
    expect(document?.category).toBe('health');
    expect(document?.content).not.toBe('');
  });

  it('returns undefined for an unknown document ID', async () => {
    await repository.onModuleInit();

    expect(repository.findById('unknown/document')).toBeUndefined();
  });
});
