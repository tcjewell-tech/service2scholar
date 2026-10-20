import { BENEFIT_RATES } from './seed/benefitRates';
import { CIP_FIELDS, CIP_NAME, CUSTOM_CROSSOVER, KSBP_KEYWORDS, SOC_TITLES, SOC_TO_CIP } from './seed/fields';
import { JOB_CODES } from './seed/jobCodes';
import { SCHOLARSHIPS } from './seed/scholarships';
import { SCHOOLS } from './seed/schools';
import type {
  BenefitRates,
  CipField,
  CustomCrossover,
  JobCode,
  KsbpKeyword,
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

export const data = seedRepository;
