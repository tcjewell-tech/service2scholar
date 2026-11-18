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
  /** Lookup built by buildJobCodeIndex; read it through findJobCode. */
  jobCodeIndex?: Map<string, JobCode>;
  /** SOC -> every 6-digit CIP O*NET links to it, including fields the app does not offer. */
  rawSocToCip?: Record<string, string[]>;
}

/** The 4-digit CIP family of a 6-digit code: 11.1003 -> 1110. */
export const cipFamily = (cip: string) => cip.replace('.', '').slice(0, 4);

// Remembers which list each index was built from, so a copied repo with a different jobCodes list never reads a stale index.
const indexSource = new WeakMap<Map<string, JobCode>, JobCode[]>();

/** Keys every code by branch/rank/code and by branch/code; the first entry seen wins, as Array.find would. */
export function buildJobCodeIndex(jobCodes: JobCode[]): Map<string, JobCode> {
  const index = new Map<string, JobCode>();
  for (const j of jobCodes) {
    for (const k of [`${j.branch}/${j.rankCategory}/${j.code}`, `${j.branch}/${j.code}`]) {
      if (!index.has(k)) index.set(k, j);
    }
  }
  indexSource.set(index, jobCodes);
  return index;
}

/** The job for a branch and code, preferring the given rank and falling back to any rank. */
export function findJobCode(repo: DataRepository, branch: Branch, code: string, rankCategory?: RankCategory): JobCode | undefined {
  const index = repo.jobCodeIndex;
  if (index && indexSource.get(index) === repo.jobCodes) {
    return (rankCategory ? index.get(`${branch}/${rankCategory}/${code}`) : undefined) ?? index.get(`${branch}/${code}`);
  }
  return (
    (rankCategory ? repo.jobCodes.find((j) => j.branch === branch && j.code === code && j.rankCategory === rankCategory) : undefined) ??
    repo.jobCodes.find((j) => j.branch === branch && j.code === code)
  );
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
  jobCodeIndex: buildJobCodeIndex(JOB_CODES),
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
    .map(({ cip }) => ({ cip, levels: all.filter((l) => families[l].includes(cipFamily(cip))) }))
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
 * From the seed, a branch the crosswalk covers keeps only its Navy officer designators, which the
 * crosswalk does not map; a branch missing from the snapshot keeps all its seed codes.
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
  const liveBranches = new Set(Object.keys(live.jobCodes));
  const seedOnly = repo.jobCodes.filter(
    (j) => !liveKeys.has(key(j)) && (!liveBranches.has(j.branch) || (j.branch === 'navy' && j.rankCategory === 'officer'))
  );
  const allJobCodes = [...jobCodes, ...seedOnly];

  // Only fields the app offers count; O*NET links occupations to hundreds of other CIP codes.
  const offered = new Set(repo.cipFields.map((f) => f.cip));
  const socToCip = { ...repo.socToCip };
  for (const [soc, cips] of Object.entries(live.socToCip)) {
    const merged = [...new Set([...(socToCip[soc] ?? []), ...cips.filter((c) => offered.has(c))])];
    if (merged.length > 0) socToCip[soc] = merged;
  }

  return {
    ...repo,
    jobCodes: allJobCodes,
    jobCodeIndex: buildJobCodeIndex(allJobCodes),
    socTitles: { ...repo.socTitles, ...live.socTitles },
    socToCip,
    rawSocToCip: live.socToCip,
  };
}

export const schoolDataAsOf = gids.fetchedAt;
export const data = withOnet(withGids(seedRepository, gids as GidsSnapshot), onet as unknown as OnetSnapshot);

/** Where screens and hooks read the data. Today it is the bundled snapshot; a server-backed source can replace it here. */
export function useData(): DataRepository {
  return data;
}
