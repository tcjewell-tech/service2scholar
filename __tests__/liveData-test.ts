import { data, seedRepository as repo, withGids, type School } from '@/data';
import { estimateCost } from '@/lib/costCalculator';
import { emptyProfile } from '@/lib/profile';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { mapInstitution, mapScorecard } = require('../scripts/refresh-data');

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
    programs: { usc: { bachelor: ['1107', '9999'], master: ['1110'] } },
  };
  const merged = withGids(repo, live);

  it('overrides only the listed fields of the listed schools', () => {
    const before = repo.schools.find((s) => s.id === 'syracuse')!;
    const after = merged.schools.find((s) => s.id === 'syracuse')!;
    expect(after).toEqual({ ...before, tuitionInState: 1, fees: 0 });
    expect(merged.rates.mhaByZip['13244']).toBe(9);
  });

  it('builds program lists from Scorecard CIP families, leaving other schools on the seed list', () => {
    // 11.0701 Computer Science is in family 1107; 11.1003 Cybersecurity is in family 1110.
    expect(merged.schools.find((s) => s.id === 'usc')!.programs).toEqual([
      { cip: '11.0701', levels: ['bachelor'] },
      { cip: '11.1003', levels: ['master'] },
    ]);
    expect(merged.schools.find((s) => s.id === 'syracuse')!.programs).toEqual(repo.schools.find((s) => s.id === 'syracuse')!.programs);
  });
});

describe('mapScorecard (College Scorecard record -> tuition and program families)', () => {
  const record = {
    id: 1,
    'latest.cost.tuition.in_state': 12000,
    'latest.cost.tuition.out_of_state': 30000,
    'latest.programs.cip_4_digit': [
      { code: '1107', credential: { level: 3 } },
      { code: '1107', credential: { level: 3 } },
      { code: '1107', credential: { level: 5 } },
      { code: '5202', credential: { level: 2 } },
      { code: '5202', credential: { level: 6 } },
    ],
  };

  it("keeps only bachelor's and master's programs, without duplicates", () => {
    expect(mapScorecard(record).programs).toEqual({ bachelor: ['1107'], master: ['1107'] });
  });

  it('takes tuition only when both figures are published', () => {
    expect(mapScorecard(record).tuition).toEqual({ tuitionInState: 12000, tuitionOutOfState: 30000, fees: 0 });
    expect(mapScorecard({ ...record, 'latest.cost.tuition.in_state': null }).tuition).toEqual({});
  });
});

describe('bundled snapshot', () => {
  it('covers every seed school with a housing rate and keeps for-profits flagged', () => {
    for (const s of data.schools) {
      expect(data.rates.mhaByZip[s.zip]).toBeGreaterThan(0);
      expect(s.tuitionInState).toBeGreaterThan(0);
      expect(s.programs.length).toBeGreaterThan(0);
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
