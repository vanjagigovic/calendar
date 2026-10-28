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
    },
    {
      id: 'productivity/meeting-guidelines',
      category: 'productivity',
      title: 'Meeting Guidelines',
      content:
        '# Meeting Guidelines\n\n' +
        'Schedule meetings in the calendar when necessary.',
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
      'productivity/focus-time-policy#1',
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
});
