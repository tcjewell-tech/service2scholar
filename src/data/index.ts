import gids from './live/gids.json';
import onet from './live/onet.json';
import { BENEFIT_RATES } from './seed/benefitRates';
import { CIP_FIELDS, CIP_NAME, CUSTOM_CROSSOVER, KSBP_KEYWORDS, SOC_TITLES, SOC_TO_CIP } from './seed/fields';
import { JOB_CODES } from './seed/jobCodes';
import { SCHOLARSHIPS } from './seed/scholarships';
import { SCHOOLS } from './seed/schools';
import type {
  BenefitRates,
  Branch,
  CipField,
  CustomCrossover,
  DegreeLevel,
  JobCode,
  KsbpKeyword,
  Program,
  RankCategory,
  Scholarship,
  School,
} from './types';

export * from './types';

/**
 * Everything the matching engine and calculator read. Today it's the bundled seed;
 * swap in a repository backed by College Scorecard / VA GIDS / O*NET without touching callers.
 */
export interface DataRepository {
  jobCodes: JobCode[];
  cipFields: CipField[];
  cipName: Record<string, string>;
  socTitles: Record<string, string>;
  socToCip: Record<string, string[]>;
  customCrossover: CustomCrossover[];
  ksbpKeywords: KsbpKeyword[];
  schools: School[];
  scholarships: Scholarship[];
  rates: BenefitRates;
}

export const seedRepository: DataRepository = {
  jobCodes: JOB_CODES,
  cipFields: CIP_FIELDS,
  cipName: CIP_NAME,
  socTitles: SOC_TITLES,
  socToCip: SOC_TO_CIP,
  customCrossover: CUSTOM_CROSSOVER,
  ksbpKeywords: KSBP_KEYWORDS,
  schools: SCHOOLS,
  scholarships: SCHOLARSHIPS,
  rates: BENEFIT_RATES,
};

/** A snapshot written by scripts/refresh-data.js: real VA figures for the seed's schools. */
export interface GidsSnapshot {
  fetchedAt: string;
  schools: Record<string, Partial<School>>;
  mhaByZip: Record<string, number>;
  /** Per school id: the 4-digit CIP families (e.g. "1107") College Scorecard reports degrees in, by level. */
  programs: Record<string, Record<DegreeLevel, string[]>>;
}

// shortcut: Scorecard only reports 4-digit CIP families, so a field counts as offered when the school
// awards any degree in its family (11.1003 Cybersecurity matches any 11.10 program);
// upgrade if a 6-digit program source (e.g. IPEDS completions) is added.
function programsFrom(families: Record<DegreeLevel, string[]>, fields: CipField[]): Program[] {
  const all: DegreeLevel[] = ['bachelor', 'master'];
  return fields
    .map(({ cip }) => ({ cip, levels: all.filter((l) => families[l].includes(cip.replace('.', '').slice(0, 4))) }))
    .filter((p) => p.levels.length > 0);
}

/** Lays VA GI Bill Comparison Tool figures over a repository's schools and housing table. */
export function withGids(repo: DataRepository, live: GidsSnapshot): DataRepository {
  return {
    ...repo,
    schools: repo.schools.map((s) => ({
      ...s,
      ...live.schools[s.id],
      ...(live.programs[s.id] ? { programs: programsFrom(live.programs[s.id], repo.cipFields) } : null),
    })),
    rates: { ...repo.rates, mhaByZip: { ...repo.rates.mhaByZip, ...live.mhaByZip } },
  };
}

/** A snapshot written by scripts/import-onet.py from O*NET's military and CIP crosswalks. */
export interface OnetSnapshot {
  /** Active job codes per branch and rank, as [code, title, SOC codes]. */
  jobCodes: Partial<Record<Branch, Partial<Record<RankCategory, [code: string, title: string, soc: string[]][]>>>>;
  socTitles: Record<string, string>;
  /** SOC -> every 6-digit CIP code O*NET links to it. */
  socToCip: Record<string, string[]>;
}

/**
 * Lays the O*NET military crosswalk over a repository: its job codes replace same-code seed entries
 * (keeping the seed's picker group), and its occupation-to-field links are added to the seed's.
 * Seed-only codes stay, e.g. Navy officer designators, which the crosswalk does not map.
 */
export function withOnet(repo: DataRepository, live: OnetSnapshot): DataRepository {
  const key = (j: Pick<JobCode, 'branch' | 'rankCategory' | 'code'>) => `${j.branch}/${j.rankCategory}/${j.code}`;
  const seedGroup = new Map(repo.jobCodes.map((j) => [key(j), j.group]));
  const jobCodes: JobCode[] = [];
  for (const [branch, ranks] of Object.entries(live.jobCodes) as [Branch, OnetSnapshot['jobCodes'][Branch]][]) {
    for (const [rankCategory, rows] of Object.entries(ranks ?? {}) as [RankCategory, [string, string, string[]][]][]) {
      for (const [code, title, soc] of rows) {
        jobCodes.push({ code, title, branch, rankCategory, soc, group: seedGroup.get(key({ branch, rankCategory, code })) });
      }
    }
  }
  const liveKeys = new Set(jobCodes.map(key));

  // Only fields the app offers count; O*NET links occupations to hundreds of other CIP codes.
  const offered = new Set(repo.cipFields.map((f) => f.cip));
  const socToCip = { ...repo.socToCip };
  for (const [soc, cips] of Object.entries(live.socToCip)) {
    const merged = [...new Set([...(socToCip[soc] ?? []), ...cips.filter((c) => offered.has(c))])];
    if (merged.length > 0) socToCip[soc] = merged;
  }

  return {
    ...repo,
    jobCodes: [...jobCodes, ...repo.jobCodes.filter((j) => !liveKeys.has(key(j)))],
    socTitles: { ...repo.socTitles, ...live.socTitles },
    socToCip,
  };
}

export const schoolDataAsOf = gids.fetchedAt;
export const data = withOnet(withGids(seedRepository, gids as GidsSnapshot), onet as unknown as OnetSnapshot);
