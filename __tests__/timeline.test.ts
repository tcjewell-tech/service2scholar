import { seedRepository as repo } from '@/data';
import { programKey } from '@/lib/matching';
import { emptyProfile, type Profile } from '@/lib/profile';
import { buildChecklist, targetTermStart } from '@/lib/timeline';

function profile(overrides: Partial<Profile> = {}): Profile {
  return { ...emptyProfile('self'), id: 'p1', separationDate: '2027-03-15', ...overrides };
}

describe('targetTermStart', () => {
  it('picks the fall term after separation', () => {
    expect(targetTermStart('2027-03-15')).toBe('2027-08-20');
  });
  it('rolls to spring when fall is less than 45 days out', () => {
    expect(targetTermStart('2027-07-20')).toBe('2028-01-10');
  });
  it('rolls to next fall when spring is too close', () => {
    expect(targetTermStart('2027-12-15')).toBe('2028-08-20');
  });
});

describe('buildChecklist', () => {
  it('builds dated core items relative to separation date', () => {
    const items = buildChecklist(profile(), repo);
    const byId = Object.fromEntries(items.map((i) => [i.id, i]));
    expect(byId['p1:jst'].dueDate).toBe('2026-09-16'); // sep − 180d
    expect(byId['p1:coe'].dueDate).toBe('2027-05-22'); // term − 90d
    expect(byId['p1:fafsa'].dueDate).toBe('2026-10-15');
    expect(byId['p1:dd214'].dueDate).toBe('2027-03-29');
  });

  it('is sorted by due date', () => {
    const items = buildChecklist(profile(), repo);
    const dates = items.map((i) => i.dueDate);
    expect([...dates].sort()).toEqual(dates);
  });

  it('adds application, transcript and Yellow Ribbon items for saved programs', () => {
    const key = programKey('syracuse', '11.0701', 'bachelor');
    const items = buildChecklist(profile({ savedProgramKeys: [key] }), repo);
    const app = items.find((i) => i.id === 'p1:app:syracuse')!;
    expect(app.dueDate).toBe('2027-01-05');
    expect(app.category).toBe('application');
    expect(items.find((i) => i.id === 'p1:yr:syracuse')!.category).toBe('yellowRibbon');
    expect(items.find((i) => i.id === 'p1:transcripts:syracuse')!.dueDate).toBe('2026-12-22');
  });

  it('skips Yellow Ribbon items when the profile cannot use Yellow Ribbon', () => {
    const key = programKey('syracuse', '11.0701', 'bachelor');
    const items = buildChecklist(profile({ savedProgramKeys: [key], giBillTier: 80 }), repo);
    expect(items.some((i) => i.category === 'yellowRibbon')).toBe(false);
  });

  it('makes no school items for a saved program the school no longer offers', () => {
    const retired = programKey('syracuse', '99.9999', 'bachelor');
    const items = buildChecklist(profile({ savedProgramKeys: [retired] }), repo);
    expect(items.filter((i) => /:(app|transcripts|yr):|:sco$/.test(i.id))).toEqual([]);
  });

  describe('Yellow Ribbon by the saved program’s level', () => {
    const syracuse = repo.schools.find((s) => s.id === 'syracuse')!;
    // Offers both levels, but its Yellow Ribbon agreement covers master’s only.
    const masterOnlyYr = {
      ...repo,
      schools: [
        {
          ...syracuse,
          programs: [{ cip: '11.0701', levels: ['bachelor' as const, 'master' as const] }],
          yellowRibbon: { ...syracuse.yellowRibbon, participates: true, levels: ['master' as const] },
        },
      ],
    };
    const hasYr = (level: 'bachelor' | 'master', degreeLevel: 'bachelor' | 'master') =>
      buildChecklist(profile({ degreeLevel, savedProgramKeys: [programKey('syracuse', '11.0701', level)] }), masterOnlyYr).some(
        (i) => i.id === 'p1:yr:syracuse'
      );

    it('adds the item for a saved master’s even when the profile is set to bachelor’s', () => {
      expect(hasYr('master', 'bachelor')).toBe(true);
    });

    it('skips it for a saved bachelor’s even when the profile is set to master’s', () => {
      expect(hasYr('bachelor', 'master')).toBe(false);
    });
  });

  it('adds planned scholarship deadlines before the term and VA appointments', () => {
    const items = buildChecklist(
      profile({
        plannedScholarshipIds: ['tillman'],
        vaAppointments: [{ id: 'a1', title: 'C&P exam', date: '2027-01-20' }],
      }),
      repo
    );
    expect(items.find((i) => i.id === 'p1:sch:tillman')!.dueDate).toBe('2027-02-28');
    expect(items.find((i) => i.id === 'p1:va:a1')!.category).toBe('vaAppointment');
  });

  it('uses the transferee form and skips JST/DD-214 for dependents', () => {
    const items = buildChecklist({ ...emptyProfile('child'), id: 'c1', separationDate: '2027-03-15' }, repo);
    expect(items.find((i) => i.id === 'c1:coe')!.title).toMatch(/1990E/);
    expect(items.some((i) => i.id === 'c1:jst')).toBe(false);
    expect(items.some((i) => i.id === 'c1:dd214')).toBe(false);
  });

  it('returns nothing without a separation date', () => {
    expect(buildChecklist(profile({ separationDate: '' }), repo)).toEqual([]);
  });
});
