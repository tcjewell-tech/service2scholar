import { seedRepository as repo } from '@/data';
import { fieldsForProfile, matchPrograms } from '@/lib/matching';
import { emptyProfile, type Profile } from '@/lib/profile';

function profile(overrides: Partial<Profile>): Profile {
  return { ...emptyProfile('self'), ...overrides };
}

describe('fieldsForProfile', () => {
  it('maps a primary code through O*NET SOC to degree fields', () => {
    const fields = fieldsForProfile(profile({ branch: 'army', primaryCode: '25B' }), repo);
    expect(fields.has('11.0901')).toBe(true);
    expect(fields.get('11.0901')!.reasons[0]).toMatchObject({ source: 'direct', text: expect.stringContaining('25B') });
  });

  it('adds the custom crossover layer (Infantry → Leadership)', () => {
    const fields = fieldsForProfile(profile({ branch: 'army', primaryCode: '11B' }), repo);
    const leadership = fields.get('52.0213');
    expect(leadership).toBeDefined();
    expect(leadership!.reasons).toContainEqual({ source: 'crossover', text: expect.stringMatching(/custom crossover/i) });
  });

  it('secondary codes and KSBP text widen the field set', () => {
    const base = fieldsForProfile(profile({ branch: 'army', primaryCode: '11B' }), repo);
    const wide = fieldsForProfile(
      profile({ branch: 'army', primaryCode: '11B', secondaryCodes: ['42A'], ksbp: 'I do Python coding and build LLM projects' }),
      repo
    );
    expect(base.has('52.1001')).toBe(false);
    expect(wide.has('52.1001')).toBe(true); // HR from 42A
    expect(wide.has('11.0701')).toBe(true); // CS from KSBP
    expect(wide.get('11.0701')!.reasons).toContainEqual({ source: 'skills', text: expect.stringMatching(/coding|python/i) });
  });

  it('matches KSBP keywords on word boundaries only', () => {
    const fields = fieldsForProfile(profile({ branch: 'army', primaryCode: null, ksbp: 'I like mail and email' }), repo);
    // "ai" must not match inside "mail"
    expect(fields.has('30.7001')).toBe(false);
  });

  it('uses picked interests for dependents without job codes', () => {
    const fields = fieldsForProfile(
      { ...emptyProfile('child'), interests: ['51.3801'] },
      repo
    );
    expect([...fields.keys()]).toEqual(['51.3801']);
  });
});

describe('matchPrograms', () => {
  const p = profile({ branch: 'army', primaryCode: '11B', secondaryCodes: ['42A'], ksbp: 'python coding' });

  it('excludes for-profit schools by default', () => {
    const matches = matchPrograms(p, repo);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some((m) => m.school.control === 'for_profit')).toBe(false);
  });

  it('can include for-profits when explicitly asked', () => {
    const matches = matchPrograms(p, repo, { includeForProfit: true });
    expect(matches.some((m) => m.school.control === 'for_profit')).toBe(true);
  });

  it('only returns programs at the chosen degree level', () => {
    const matches = matchPrograms({ ...p, degreeLevel: 'master' }, repo);
    expect(matches.every((m) => m.level === 'master')).toBe(true);
  });

  it('respects the online-only preference', () => {
    const matches = matchPrograms({ ...p, includeOnline: false }, repo);
    expect(matches.some((m) => m.school.onlineOnly)).toBe(false);
  });

  it('ranks stronger veteran outcomes higher for the same field weight', () => {
    const matches = matchPrograms(p, repo).filter((m) => m.cip === '11.0701');
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i - 1].score).toBeGreaterThanOrEqual(matches[i].score);
    }
  });

  it('includes leadership and CS programs for the 11B + 42A + coding example', () => {
    const cips = new Set(matchPrograms(p, repo).map((m) => m.cip));
    expect(cips.has('52.0213')).toBe(true);
    expect(cips.has('11.0701')).toBe(true);
  });
});
