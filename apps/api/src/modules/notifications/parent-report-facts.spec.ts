import { describe, expect, it } from 'vitest';
import { factsFromRecords } from './parent-report-facts';

describe('parent report facts', () => {
  it('uses the student feedback when the group plan is empty', () => {
    const facts = factsFromRecords(
      [],
      [
        {
          strengths: 'Writing accuracy.',
          improvements: 'Speak a bit louder.',
          skillsNote: null,
          progress: 'Inversions',
          encouragement: 'Keep going',
          grammarTopics: ['Tenses'],
          skills: ['writing'],
        },
      ],
    );

    expect(facts.topics).toEqual(['Tenses']);
    expect(facts.skills).toEqual(['Գրավոր']);
    expect(facts.challenges).toEqual(['Speak a bit louder.']);
    expect(facts.achievements).toEqual(['Writing accuracy.', 'Inversions', 'Keep going']);
  });

  it('keeps one copy when the plan and the feedback name the same topic', () => {
    const facts = factsFromRecords(
      [{ topics: [{ title: 'Present Simple', resources: [{ kind: 'SPEAKING' }] }] }],
      [
        {
          strengths: null,
          improvements: null,
          skillsNote: null,
          progress: null,
          encouragement: null,
          grammarTopics: ['Present Simple'],
          skills: ['speaking'],
        },
      ],
    );

    expect(facts.topics).toEqual(['Present Simple']);
    expect(facts.skills).toEqual(['Խոսք']);
  });
});
