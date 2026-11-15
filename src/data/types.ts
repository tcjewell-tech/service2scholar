export type Branch = 'army' | 'navy' | 'airforce' | 'marines' | 'coastguard' | 'spaceforce';
export type RankCategory = 'enlisted' | 'warrant' | 'officer';
export type Beneficiary = 'self' | 'spouse' | 'child';
export type DegreeLevel = 'bachelor' | 'master';
export type SchoolControl = 'public' | 'private_nonprofit' | 'for_profit';

export interface JobCode {
  code: string;
  title: string;
  branch: Branch;
  rankCategory: RankCategory;
  /** O*NET-SOC occupation codes this job maps to (O*NET Military Crossover Walk). */
  soc: string[];
  /** Optional grouping shown in the picker, e.g. Army CMF or Marine occupational field. */
  group?: string;
}

export interface CipField {
  cip: string;
  name: string;
}

export interface CustomCrossover {
  branch: Branch;
  code: string;
  cip: string[];
  note: string;
}

export interface KsbpKeyword {
  keywords: string[];
  cip: string[];
}

export interface Program {
  cip: string;
  levels: DegreeLevel[];
}

export interface School {
  id: string;
  name: string;
  city: string;
  state: string;
  zip: string;
  control: SchoolControl;
  onlineOnly: boolean;
  /** Annual tuition, full-time, in USD. */
  tuitionInState: number;
  tuitionOutOfState: number;
  fees: number;
  yellowRibbon: {
    participates: boolean;
    /** Annual school contribution per student; VA matches it. null = unlimited. */
    maxPerStudent: number | null;
    /** Per-level cap from VA data (null = unlimited); wins over maxPerStudent when set for a level. */
    maxByLevel?: Partial<Record<DegreeLevel, number | null>>;
    levels: DegreeLevel[];
  };
  /** Graduation rate for veteran / GI Bill students, 0–1, null if unknown. */
  veteranGradRate: number | null;
  /** Fall application deadline as MM-DD. */
  appDeadline: string;
  url: string;
  programs: Program[];
}

export interface Scholarship {
  id: string;
  name: string;
  provider: string;
  /** Typical annual award in USD (approximate). */
  amount: number;
  /** Annual deadline as MM-DD. */
  deadline: string;
  url: string;
  eligibility: {
    beneficiaries: Beneficiary[];
    branches?: Branch[];
    /** Minimum VA disability rating (the veteran's rating; for dependents, the sponsor's). */
    minVaRating?: number;
    levels?: DegreeLevel[];
  };
  summary: string;
}

export interface BenefitRates {
  academicYear: string;
  effectiveDate: string;
  privateTuitionCap: number;
  booksStipendAnnual: number;
  onlineMhaMonthly: number;
  monthsPerAcademicYear: number;
  /** Sample E-5-with-dependents BAH figures by school ZIP, monthly USD. */
  mhaByZip: Record<string, number>;
  /** Fallback when a ZIP is missing from the sample table. */
  defaultMhaMonthly: number;
}
