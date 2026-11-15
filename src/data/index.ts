import gids from './live/gids.json';
import { BENEFIT_RATES } from './seed/benefitRates';
import { CIP_FIELDS, CIP_NAME, CUSTOM_CROSSOVER, KSBP_KEYWORDS, SOC_TITLES, SOC_TO_CIP } from './seed/fields';
import { JOB_CODES } from './seed/jobCodes';
import { SCHOLARSHIPS } from './seed/scholarships';
import { SCHOOLS } from './seed/schools';
import type {
  BenefitRates,
  CipField,
  CustomCrossover,
  DegreeLevel,
  JobCode,
  KsbpKeyword,
  Program,
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

export const schoolDataAsOf = gids.fetchedAt;
export const data = withGids(seedRepository, gids as GidsSnapshot);
