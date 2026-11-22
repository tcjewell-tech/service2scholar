import {
  buildJobCodeIndex,
  data,
  findJobCode,
  seedRepository as repo,
  withGids,
  withOnet,
  type DataRepository,
  type JobCode,
  type OnetSnapshot,
  type School,
} from '@/data';
import onet from '@/data/live/onet.json';
import { estimateCost } from '@/lib/costCalculator';
import { fieldsForProfile } from '@/lib/matching';
import { emptyProfile } from '@/lib/profile';
import { migrateProfileV1ToV2, reconcileSavedPrograms } from '@/store';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

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

describe('withOnet', () => {
  const live: OnetSnapshot = {
    jobCodes: {
      army: {
        enlisted: [
          ['11B', 'Infantryman (live)', ['55-3016']],
          ['99Z', 'New Code', ['15-1212']],
        ],
        officer: [['99Z', 'Same Code, Officer', ['11-1021']]],
      },
    },
    socTitles: { '15-1212': 'Information Security Analysts' },
    // 99.9999 is not a field the app offers and must be dropped.
    socToCip: { '15-1212': ['11.1003', '99.9999'], '55-3016': ['99.9999'] },
  };
  const merged = withOnet(repo, live);
  const army = (code: string, rank = 'enlisted') =>
    merged.jobCodes.filter((j) => j.branch === 'army' && j.code === code && j.rankCategory === rank);

  it('replaces same-code seed entries, keeping the picker group, and adds new codes', () => {
    const seed11B = repo.jobCodes.find((j) => j.branch === 'army' && j.code === '11B')!;
    expect(army('11B')).toEqual([{ ...seed11B, title: 'Infantryman (live)', soc: ['55-3016'] }]);
    expect(army('99Z')).toHaveLength(1);
  });

  it('keeps seed codes the crosswalk does not list', () => {
    expect(merged.jobCodes.some((j) => j.branch === 'navy' && j.code === '1110')).toBe(true);
  });

  it('adds only offered fields to the seed occupation links', () => {
    expect(merged.socToCip['15-1212']).toEqual([...new Set([...(repo.socToCip['15-1212'] ?? []), '11.1003'])]);
    expect(merged.socToCip['55-3016']).toEqual(repo.socToCip['55-3016']);
  });

  it('matches a code by the profile rank when two ranks share it', () => {
    const officer = { ...emptyProfile('self'), branch: 'army' as const, rankCategory: 'officer' as const, primaryCode: '99Z' };
    const reasons = [...fieldsForProfile(officer, merged).values()].flatMap((f) => f.reasons.map((r) => r.text)).join(' ');
    expect(reasons).toContain('Same Code, Officer');
    expect(reasons).not.toContain('New Code');
  });
});

describe('bundled O*NET snapshot', () => {
  it('has every branch and unique codes within each branch and rank', () => {
    const keys = data.jobCodes.map((j) => `${j.branch}/${j.rankCategory}/${j.code}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(data.jobCodes.map((j) => j.branch)).size).toBe(6);
    expect(data.jobCodes.length).toBeGreaterThan(10000);
  });

  it('keeps only the Navy officer designators from the seed', () => {
    const live = new Set(
      Object.entries(onet.jobCodes).flatMap(([b, ranks]) => Object.entries(ranks).flatMap(([r, rows]) => rows.map((row) => `${b}/${r}/${row[0]}`)))
    );
    const seedOnly = data.jobCodes.filter((j) => !live.has(`${j.branch}/${j.rankCategory}/${j.code}`));
    expect(seedOnly.map((j) => `${j.branch}/${j.rankCategory}`)).toEqual(Array(6).fill('navy/officer'));
  });

  it('applies a shorthand custom crossover to each skill level of an Air Force code', () => {
    const p = { ...emptyProfile('self'), branch: 'airforce' as const, primaryCode: '1N051' };
    const reasons = [...fieldsForProfile(p, data).values()].flatMap((f) => f.reasons.map((r) => r.text)).join(' ');
    expect(reasons).toContain('1N051 custom crossover');
  });

  it('leads an Army 17C to Cybersecurity', () => {
    const p = { ...emptyProfile('self'), branch: 'army' as const, primaryCode: '17C' };
    expect(fieldsForProfile(p, data).has('11.1003')).toBe(true);
  });
});

describe('withOnet seed retention', () => {
  it('drops shorthand and stale seed codes for covered branches but keeps Navy officer designators', () => {
    const stale: JobCode = { code: '1N0X1', title: 'Shorthand', branch: 'airforce', rankCategory: 'enlisted', soc: [] };
    const merged = withOnet(
      { ...repo, jobCodes: [...repo.jobCodes, stale] },
      { jobCodes: { airforce: { enlisted: [['1N051', 'Real', []]] }, navy: { enlisted: [['IT', 'Real', []]] } }, socTitles: {}, socToCip: {} }
    );
    expect(merged.jobCodes.some((j) => j.code === '1N0X1')).toBe(false);
    expect(merged.jobCodes.some((j) => j.branch === 'navy' && j.rankCategory === 'enlisted' && j.code === 'HM')).toBe(false);
    expect(merged.jobCodes.some((j) => j.branch === 'navy' && j.code === '1110')).toBe(true);
    // Army is missing from this snapshot, so its seed codes stay.
    expect(merged.jobCodes.some((j) => j.branch === 'army' && j.code === '11B')).toBe(true);
  });

  it('leaves no shorthand AFSCs in the bundled data', () => {
    expect(data.jobCodes.filter((j) => j.branch === 'airforce' && /^.{3}X.$/.test(j.code))).toEqual([]);
    expect(findJobCode(data, 'airforce', '1N0X1')).toBeUndefined();
    expect(findJobCode(data, 'navy', '1110', 'officer')?.title).toBe('Surface Warfare Officer');
  });
});

describe('findJobCode', () => {
  const enlisted: JobCode = { code: '99Z', title: 'Enlisted', branch: 'army', rankCategory: 'enlisted', soc: [] };
  const officer: JobCode = { code: '99Z', title: 'Officer', branch: 'army', rankCategory: 'officer', soc: [] };
  const jobCodes = [enlisted, officer];
  const indexed: DataRepository = { ...repo, jobCodes, jobCodeIndex: buildJobCodeIndex(jobCodes) };

  it('resolves the rank-specific code from the index without scanning the list', () => {
    const find = jest.spyOn(jobCodes, 'find');
    expect(findJobCode(indexed, 'army', '99Z', 'officer')).toBe(officer);
    expect(findJobCode(indexed, 'army', '99Z', 'enlisted')).toBe(enlisted);
    expect(find).not.toHaveBeenCalled();
    find.mockRestore();
  });

  it('falls back to the first entry of any rank when the rank differs or is not given', () => {
    expect(findJobCode(indexed, 'army', '99Z', 'warrant')).toBe(enlisted);
    expect(findJobCode(indexed, 'army', '99Z')).toBe(enlisted);
    expect(findJobCode(indexed, 'navy', '99Z')).toBeUndefined();
  });

  it('scans the list when a repo has no index, or an index copied from another list', () => {
    expect(findJobCode({ ...repo, jobCodes, jobCodeIndex: undefined }, 'army', '99Z', 'officer')).toBe(officer);
    // repo.jobCodeIndex was built for the seed list, which has no 99Z.
    expect(findJobCode({ ...repo, jobCodes }, 'army', '99Z', 'officer')).toBe(officer);
  });
});

describe('fieldsForProfile guards and fallback', () => {
  it('gives no corroboration bonus when the same code is both primary and secondary', () => {
    const once = { ...emptyProfile('self'), branch: 'army' as const, primaryCode: '17C' };
    const twice = { ...once, secondaryCodes: ['17C', ' 17C '] };
    expect([...fieldsForProfile(twice, data).values()]).toEqual([...fieldsForProfile(once, data).values()]);
  });

  const job: JobCode = { code: '99Z', title: 'Test Job', branch: 'army', rankCategory: 'enlisted', soc: ['99-0001'] };
  const fallbackRepo: DataRepository = {
    ...repo,
    jobCodes: [job],
    jobCodeIndex: undefined,
    socTitles: { '99-0001': 'Test Occupation' },
    socToCip: {},
    // 11.1099 is not offered, but shares family 11.10 with the offered 11.1003 Cybersecurity.
    rawSocToCip: { '99-0001': ['11.1099', '99.9999'] },
  };
  const p = { ...emptyProfile('self'), branch: 'army' as const, primaryCode: '99Z' };

  it('falls back to an offered field in the same 4-digit CIP family', () => {
    expect([...fieldsForProfile(p, fallbackRepo).values()]).toEqual([
      { cip: '11.1003', weight: 0.55, reasons: [{ source: 'related', text: 'Primary 99Z (Test Job) → Test Occupation' }] },
    ]);
  });

  it('does not fall back when the job already has a direct field', () => {
    const direct = fieldsForProfile(p, { ...fallbackRepo, socToCip: { '99-0001': ['52.0201'] } });
    expect([...direct.keys()]).toEqual(['52.0201']);
  });

  it('lets more bundled job codes reach a field than the 6,711 that did before the fallback', () => {
    const fieldsOf = (j: JobCode) => [
      ...fieldsForProfile({ ...emptyProfile('self'), branch: j.branch, rankCategory: j.rankCategory, primaryCode: j.code }, data).values(),
    ];
    const all = data.jobCodes.map(fieldsOf);
    const reached = all.filter((f) => f.length > 0).length;
    const related = all.filter((f) => f.some((x) => x.weight === 0.55)).length;
    const pct = ((100 * reached) / all.length).toFixed(1);
    console.log(`COVERAGE ${reached} of ${all.length} job codes reach a field (${pct}%), ${related} of them only through a related field`);
    expect(reached).toBeGreaterThan(6711);
  });
});

describe('store migration to version 2', () => {
  it('upgrades Air Force shorthand to the 5-level code and strips repeated secondary codes', () => {
    const v1 = {
      ...emptyProfile('self'),
      branch: 'airforce' as const,
      primaryCode: '1N0X1',
      secondaryCodes: ['1N0X1', '3P0X1', '3P0X1', ' ', '1N051'],
      savedProgramKeys: ['usc:11.0701:bachelor', 'usc:11.0701:bachelor'],
      plannedScholarshipIds: ['a', 'a'],
    };
    expect(migrateProfileV1ToV2(v1)).toEqual({
      ...v1,
      primaryCode: '1N051',
      secondaryCodes: ['3P051'],
      savedProgramKeys: ['usc:11.0701:bachelor'],
      plannedScholarshipIds: ['a'],
    });
  });

  it('leaves codes that still resolve, and unknown codes, untouched', () => {
    const army = { ...emptyProfile('self'), branch: 'army' as const, primaryCode: '17C', secondaryCodes: ['ZZZX1'] };
    expect(migrateProfileV1ToV2(army)).toEqual(army);
  });
});

describe('reconcileSavedPrograms', () => {
  it('separates programs the data still offers from retired or malformed keys', () => {
    const school = data.schools[0];
    const { cip, levels } = school.programs[0];
    const good = `${school.id}:${cip}:${levels[0]}`;
    const orphans = ['no-such-school:11.0701:bachelor', `${school.id}:99.9999:bachelor`, `${school.id}:${cip}:doctorate`, 'garbage', ''];
    expect(reconcileSavedPrograms([good, ...orphans])).toEqual({ activeKeys: [good], orphanedKeys: orphans });
  });

  it('parses keys from the right, so a school id may contain a colon', () => {
    const odd = { ...data.schools[0], id: 'sys:campus', programs: [{ cip: '11.0701', levels: ['master' as const] }] };
    expect(reconcileSavedPrograms(['sys:campus:11.0701:master'], { ...data, schools: [odd] }).activeKeys).toEqual([
      'sys:campus:11.0701:master',
    ]);
  });
});
