import { describe, expect, it, jest } from '@jest/globals';
import { KnowledgeRepository } from './knowledge.repository';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeDocument } from './knowledge.types';

describe('KnowledgeService', () => {
  const documents: KnowledgeDocument[] = [
    {
      id: 'productivity/focus-time-policy',
      category: 'productivity',
      title: 'Focus Time Policy',
      content:
        '# Focus Time Policy\n\n' +
        'Protect focus time by blocking calendar hours for deep work.\n\n' +
        'Use calendar blocks to reduce interruptions.',
      sourceId: 'productivity-focus-time-policy',
      organization: 'Productivity',
    },
    {
      id: 'productivity/meeting-guidelines',
      category: 'productivity',
      title: 'Meeting Guidelines',
      content:
        '# Meeting Guidelines\n\n' +
        'Schedule meetings in the calendar when necessary.',
      sourceId: 'productivity-meeting-guidelines',
      organization: 'Productivity',
    },
  ];

  function createService(
    knowledgeDocuments: KnowledgeDocument[] = documents,
  ): KnowledgeService {
    const repository = {
      findAll: jest.fn().mockReturnValue(knowledgeDocuments),
    };

    return new KnowledgeService(repository as unknown as KnowledgeRepository);
  }

  it('returns relevant passages for a query', () => {
    const service = createService();

    const result = service.search('focus blocking calendar');

    expect(result.passages.length).toBeGreaterThan(0);
    expect(result.passages[0]).toMatchObject({
      documentId: 'productivity/focus-time-policy',
      category: 'productivity',
    });
    expect(result.passages[0].content).toContain('blocking calendar');
  });

  it('ranks passages with more matching terms higher', () => {
    const service = createService();

    const result = service.search('focus blocking calendar');

    expect(result.passages[0].sourceId).toBe(
      'productivity-focus-time-policy#1',
    );
  });

  it('returns no passages for an empty query', () => {
    const service = createService();

    expect(service.search('   ')).toEqual({ passages: [] });
  });

  it('returns no passages when the limit is zero or negative', () => {
    const service = createService();

    expect(service.search('calendar', 0)).toEqual({ passages: [] });
    expect(service.search('calendar', -1)).toEqual({ passages: [] });
  });

  it('does not return more passages than the specified limit', () => {
    const service = createService();

    const result = service.search('calendar', 1);

    expect(result.passages).toHaveLength(1);
  });

  it('returns no passages when no terms match', () => {
    const service = createService();

    expect(service.search('astronaut volcano')).toEqual({
      passages: [],
    });
  });

  describe('stopword filtering', () => {
    it('returns no passages for a query made only of stopwords', () => {
      const service = createService([
        {
          ...documents[0],
          content: 'What is the plan for your day and the week?',
        },
      ]);

      expect(service.search('what is the for your')).toEqual({ passages: [] });
    });

    it('does not match passages through generic words alone', () => {
      const service = createService();

      expect(service.search('What is the capital of France?')).toEqual({
        passages: [],
      });
    });

    it('still retrieves relevant passages when the query contains stopwords', () => {
      const service = createService();

      const result = service.search('How do I protect the focus time?');

      expect(result.passages[0]?.sourceId).toBe(
        'productivity-focus-time-policy#1',
      );
    });

    it('does not let stopwords change relevance or ranking', () => {
      const service = createService();

      expect(
        service.search('the focus of your blocking and the calendar'),
      ).toEqual(service.search('focus blocking calendar'));
    });
  });

  describe('minimum relevance threshold', () => {
    it('excludes passages that match fewer terms than the threshold', () => {
      const service = createService();

      expect(service.search('focus astronaut volcano')).toEqual({
        passages: [],
      });
    });

    it('returns passages that meet the threshold', () => {
      const service = createService();

      const result = service.search('focus blocking astronaut');

      expect(result.passages.map(({ sourceId }) => sourceId)).toEqual([
        'productivity-focus-time-policy#1',
      ]);
    });

    it('returns no passages for weak overlap with a mostly unrelated query', () => {
      const service = createService();

      expect(service.search('capital of France calendar')).toEqual({
        passages: [],
      });
    });

    it('allows a custom minimum score', () => {
      const service = createService();

      expect(
        service.search('focus astronaut volcano', 3, 1).passages,
      ).toHaveLength(1);
    });

    it('matches a single meaningful term when it is the only one in the query', () => {
      const service = createService();

      expect(service.search('the meetings?').passages).toHaveLength(1);
    });
  });

  describe('built-in knowledge documents', () => {
    async function createRealService(): Promise<KnowledgeService> {
      const repository = new KnowledgeRepository();
      await repository.onModuleInit();
      return new KnowledgeService(repository);
    }

    it('returns no passages for an unrelated general-knowledge question', async () => {
      const service = await createRealService();

      expect(service.search('What is the capital of France?')).toEqual({
        passages: [],
      });
    });

    it('retrieves the workout document for a workout scheduling question', async () => {
      const service = await createRealService();

      const result = service.search(
        'How should I schedule workouts during the week?',
      );

      expect(result.passages.length).toBeGreaterThan(0);
      expect(result.passages.length).toBeLessThanOrEqual(3);
      expect(result.passages[0]?.documentId).toBe('health/workout-planning');
    });

    it('returns identical results for repeated identical queries', async () => {
      const service = await createRealService();
      const query = 'How long should a focus block be?';

      expect(service.search(query)).toEqual(service.search(query));
    });
  });
});
