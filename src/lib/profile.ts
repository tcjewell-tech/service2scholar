import type { Beneficiary, Branch, DegreeLevel, RankCategory } from '@/data';

export interface VaAppointment {
  id: string;
  title: string;
  /** ISO date YYYY-MM-DD */
  date: string;
}

export interface Profile {
  id: string;
  name: string;
  beneficiary: Beneficiary;
  /** For spouse/child profiles this is the sponsor's branch. */
  branch: Branch;
  rankCategory: RankCategory;
  primaryCode: string | null;
  secondaryCodes: string[];
  /** Knowledge, Skills, Behaviors, Preferences (spec §4.3). */
  ksbp: string;
  /** Degree fields picked directly — mainly for spouse/child profiles without job codes. */
  interests: string[];
  separationType: 'separating' | 'retiring';
  /** Months of qualifying active duty after 9/10/2001 (the sponsor's, for transferees). */
  serviceMonths: number;
  /** VA disability rating 0–100, or null if none. For dependents, the sponsor's rating. */
  vaRating: number | null;
  /** ISO date YYYY-MM-DD; anchors the timeline. */
  separationDate: string;
  vaAppointments: VaAppointment[];
  /** Post-9/11 GI Bill benefit level, 0–100. */
  giBillTier: number;
  /** Spouse/child only: is the sponsor still on active duty? (affects MHA/Yellow Ribbon) */
  sponsorOnActiveDuty: boolean;
  degreeLevel: DegreeLevel;
  /** Include online-only programs in matches. */
  includeOnline: boolean;
  savedProgramKeys: string[];
  plannedScholarshipIds: string[];
}

export const BRANCHES: Record<Branch, { name: string; short: string }> = {
  army: { name: 'U.S. Army', short: 'Army' },
  navy: { name: 'U.S. Navy', short: 'Navy' },
  airforce: { name: 'U.S. Air Force', short: 'Air Force' },
  marines: { name: 'U.S. Marine Corps', short: 'Marine Corps' },
  coastguard: { name: 'U.S. Coast Guard', short: 'Coast Guard' },
  spaceforce: { name: 'U.S. Space Force', short: 'Space Force' },
};

export const BRANCH_ORDER: Branch[] = ['army', 'navy', 'airforce', 'marines', 'coastguard', 'spaceforce'];

export const RANK_LABEL: Record<RankCategory, string> = {
  enlisted: 'Enlisted',
  warrant: 'Warrant Officer',
  officer: 'Officer',
};

/** What each branch calls its job code for a given rank category (spec §4.2). */
export function codeTermFor(branch: Branch, rank: RankCategory): string {
  switch (branch) {
    case 'army':
      return rank === 'enlisted' ? 'MOS' : rank === 'warrant' ? 'Warrant Officer MOS' : 'AOC';
    case 'marines':
      return 'MOS';
    case 'navy':
      return rank === 'enlisted' ? 'Rating' : 'Designator';
    case 'coastguard':
      return rank === 'enlisted' ? 'Rating' : rank === 'warrant' ? 'CWO Specialty' : 'Officer Specialty';
    case 'airforce':
    case 'spaceforce':
      return 'AFSC';
  }
}

/** Branches with warrant officer codes in the O*NET crosswalk (the Air Force brought warrants back in 2024). */
export function hasWarrantOfficers(branch: Branch): boolean {
  return branch !== 'spaceforce';
}

/**
 * Post-9/11 GI Bill tier from months of qualifying active duty (38 U.S.C. 3311/3313,
 * table in effect since Aug 2020). Purple Heart recipients and those discharged for a
 * service-connected disability after 30+ days get 100% regardless.
 */
export function suggestedTier(serviceMonths: number): number {
  if (serviceMonths >= 36) return 100;
  if (serviceMonths >= 30) return 90;
  if (serviceMonths >= 24) return 80;
  if (serviceMonths >= 18) return 70;
  if (serviceMonths >= 6) return 60;
  if (serviceMonths >= 3) return 50;
  return 0;
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function emptyProfile(beneficiary: Profile['beneficiary'] = 'self'): Profile {
  return {
    id: newId(),
    name: beneficiary === 'self' ? 'Me' : beneficiary === 'spouse' ? 'Spouse' : 'Child',
    beneficiary,
    branch: 'army',
    rankCategory: 'enlisted',
    primaryCode: null,
    secondaryCodes: [],
    ksbp: '',
    interests: [],
    separationType: 'separating',
    serviceMonths: 48,
    vaRating: null,
    separationDate: '',
    vaAppointments: [],
    giBillTier: 100,
    sponsorOnActiveDuty: false,
    degreeLevel: 'bachelor',
    includeOnline: true,
    savedProgramKeys: [],
    plannedScholarshipIds: [],
  };
}
