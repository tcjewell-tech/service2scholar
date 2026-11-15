import { data, seedRepository as repo, withGids, type School } from '@/data';
import { estimateCost } from '@/lib/costCalculator';
import { emptyProfile } from '@/lib/profile';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { mapInstitution } = require('../scripts/refresh-data');

const gids = {
  name: 'TEST U',
  type: 'PRIVATE',
  zip: '13244',
  physical_zip: '13244-1234',
  yr: true,
  tuition_in_state: 60000,
  tuition_out_of_state: 60000,
  graduation_rate_veteran: null,
  bah: 2175,
  dod_bah: 2049,
  yellow_ribbon_programs: [
    { degree_level: 'Undergraduate', division_professional_school: 'All', contribution_amount: '99999.0' },
    { degree_level: 'Graduate', division_professional_school: 'Business', contribution_amount: '20000.0' },
    { degree_level: 'Graduate', division_professional_school: 'Policy', contribution_amount: '5000.0' },
    { degree_level: 'Doctorate', division_professional_school: 'Medicine', contribution_amount: '1000.0' },
  ],
};

describe('mapInstitution (VA GIDS record -> school fields)', () => {
  const { school, mhaMonthly } = mapInstitution(gids);

  it('folds fees into tuition and uses the post-2018 housing rate', () => {
    expect(school).toMatchObject({ zip: '13244', control: 'private_nonprofit', tuitionInState: 60000, fees: 0 });
    expect(mhaMonthly).toBe(2049);
  });

  it('caps Yellow Ribbon per level at the lowest division, ignoring doctorates', () => {
    expect(school.yellowRibbon).toEqual({
      participates: true,
      maxPerStudent: 5000,
      maxByLevel: { bachelor: null, master: 5000 },
      levels: ['bachelor', 'master'],
    });
  });

  it('leaves the grad rate and kept tuition to the seed', () => {
    expect(school).not.toHaveProperty('veteranGradRate');
    expect(mapInstitution(gids, { keepTuition: true }).school).not.toHaveProperty('tuitionInState');
  });

  it('marks for-profits and non-participants, and rejects non-schools', () => {
    const fp = mapInstitution({ ...gids, type: 'FOR PROFIT', yr: false }).school;
    expect(fp.control).toBe('for_profit');
    expect(fp.yellowRibbon).toMatchObject({ participates: false, levels: [], maxPerStudent: null });
    expect(() => mapInstitution({ ...gids, type: 'OJT' })).toThrow(/unexpected institution type/);
  });
});

describe('withGids', () => {
  const live = {
    fetchedAt: '2026-11-15',
    schools: { syracuse: { tuitionInState: 1, fees: 0 } },
    mhaByZip: { '13244': 9 },
  };
  const merged = withGids(repo, live);

  it('overrides only the listed fields of the listed schools', () => {
    const before = repo.schools.find((s) => s.id === 'syracuse')!;
    const after = merged.schools.find((s) => s.id === 'syracuse')!;
    expect(after).toEqual({ ...before, tuitionInState: 1, fees: 0 });
    expect(merged.schools.find((s) => s.id === 'usc')).toEqual(repo.schools.find((s) => s.id === 'usc'));
    expect(merged.rates.mhaByZip['13244']).toBe(9);
  });
});

describe('bundled snapshot', () => {
  it('covers every seed school with a housing rate and keeps for-profits flagged', () => {
    for (const s of data.schools) {
      expect(data.rates.mhaByZip[s.zip]).toBeGreaterThan(0);
      expect(s.tuitionInState).toBeGreaterThan(0);
    }
    expect(data.schools.find((s) => s.id === 'uopx')!.control).toBe('for_profit');
  });
});

describe('estimateCost with per-level Yellow Ribbon caps', () => {
  const school: School = {
    ...repo.schools[0],
    control: 'private_nonprofit',
    tuitionInState: 60000,
    tuitionOutOfState: 60000,
    fees: 0,
    yellowRibbon: { participates: true, maxPerStudent: 5000, maxByLevel: { bachelor: null, master: 5000 }, levels: ['bachelor', 'master'] },
  };
  const profile = emptyProfile('self');

  it('uses the cap for the level being priced', () => {
    expect(estimateCost(profile, school, 'bachelor', [], repo.rates).tuitionOutOfPocket).toBe(0);
    const gap = 60000 - repo.rates.privateTuitionCap;
    expect(estimateCost(profile, school, 'master', [], repo.rates).tuitionOutOfPocket).toBeCloseTo(gap - 10000, 0);
  });
});
