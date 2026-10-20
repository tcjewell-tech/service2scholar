import type { BenefitRates, DegreeLevel, Scholarship, School } from '@/data';

import type { Profile } from './profile';

export interface CostLine {
  label: string;
  /** Positive = cost to you, negative = covered or paid to you. */
  amount: number;
  explanation: string;
}

export interface CostEstimate {
  charged: number;
  giBillTuition: number;
  yellowRibbonEligible: boolean;
  yellowRibbon: number;
  scholarships: number;
  tuitionOutOfPocket: number;
  mha: number;
  books: number;
  /** Tuition out of pocket minus cash benefits. Negative = money left over for living costs. */
  netCost: number;
  lines: CostLine[];
}

const usd = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

export function eligibleScholarships(profile: Profile, all: Scholarship[]): Scholarship[] {
  return all.filter((s) => {
    const e = s.eligibility;
    if (!e.beneficiaries.includes(profile.beneficiary)) return false;
    if (e.branches && !e.branches.includes(profile.branch)) return false;
    if (e.levels && !e.levels.includes(profile.degreeLevel)) return false;
    if (e.minVaRating != null && (profile.vaRating ?? 0) < e.minVaRating) return false;
    return true;
  });
}

/** Annual, full-time estimate for one program (spec §6). */
export function estimateCost(
  profile: Profile,
  school: School,
  level: DegreeLevel,
  scholarships: Scholarship[],
  rates: BenefitRates
): CostEstimate {
  const tier = profile.giBillTier / 100;
  const isPublic = school.control === 'public';
  const activeDutySpouse = profile.beneficiary === 'spouse' && profile.sponsorOnActiveDuty;

  // Public schools must charge GI Bill users in-state rates (Veterans Choice Act §702).
  const tuition = isPublic ? school.tuitionInState : school.tuitionOutOfState;
  const charged = tuition + school.fees;

  const coveredBase = isPublic ? charged : Math.min(charged, rates.privateTuitionCap);
  const giBillTuition = Math.round(coveredBase * tier);

  const yr = school.yellowRibbon;
  const yellowRibbonEligible =
    profile.giBillTier === 100 && yr.participates && yr.levels.includes(level) && !activeDutySpouse;
  const gap = Math.max(0, charged - giBillTuition);
  const yellowRibbon = yellowRibbonEligible
    ? yr.maxPerStudent == null
      ? gap
      : Math.min(gap, yr.maxPerStudent * 2)
    : 0;

  const remaining = Math.max(0, charged - giBillTuition - yellowRibbon);
  const offered = scholarships.reduce((sum, s) => sum + s.amount, 0);
  const scholarshipTotal = Math.min(offered, remaining);
  const tuitionOutOfPocket = remaining - scholarshipTotal;

  const monthlyRate = school.onlineOnly
    ? rates.onlineMhaMonthly
    : rates.mhaByZip[school.zip] ?? rates.defaultMhaMonthly;
  const mha = activeDutySpouse ? 0 : Math.round(monthlyRate * tier) * rates.monthsPerAcademicYear;
  const books = Math.round(rates.booksStipendAnnual * tier);
  const netCost = tuitionOutOfPocket - mha - books;

  const pct = `${profile.giBillTier}%`;
  const lines: CostLine[] = [
    {
      label: 'Tuition & fees',
      amount: charged,
      explanation: isPublic
        ? `What ${school.name} charges per year at the in-state rate. Public schools must charge GI Bill students in-state tuition no matter where they live.`
        : `What ${school.name} charges per year for full-time study.`,
    },
    {
      label: `GI Bill (${pct})`,
      amount: -giBillTuition,
      explanation: isPublic
        ? `At a public school the Post-9/11 GI Bill pays ${pct} of in-state tuition and fees, paid directly to the school.`
        : `At a private school the GI Bill pays ${pct} of tuition and fees, up to the ${rates.academicYear} national cap of ${usd(rates.privateTuitionCap)} per year, paid directly to the school.`,
    },
  ];

  if (yr.participates && yr.levels.includes(level)) {
    lines.push({
      label: 'Yellow Ribbon',
      amount: -yellowRibbon,
      explanation: yellowRibbonEligible
        ? yr.maxPerStudent == null
          ? `${school.name} covers the remaining gap with no cap, with VA matching what the school contributes.`
          : `${school.name} contributes up to ${usd(yr.maxPerStudent)} a year and VA matches it, covering up to ${usd(yr.maxPerStudent * 2)} of the gap.`
        : activeDutySpouse
          ? 'Yellow Ribbon isn’t available to spouses while the sponsor is still on active duty.'
          : `Yellow Ribbon needs the 100% benefit level. At ${pct} this school’s Yellow Ribbon agreement doesn’t apply.`,
    });
  }

  if (scholarships.length > 0) {
    lines.push({
      label: 'Scholarships you plan to apply for',
      amount: -scholarshipTotal,
      explanation: `Assumes you’re awarded ${scholarships.map((s) => s.name).join(', ')}. Awards are competitive and can’t reduce your bill below zero.`,
    });
  }

  lines.push(
    {
      label: 'Monthly housing allowance (paid to you)',
      amount: -mha,
      explanation: activeDutySpouse
        ? 'Spouses don’t receive the housing allowance while the sponsor is on active duty.'
        : school.onlineOnly
          ? `Fully online students get ${usd(rates.onlineMhaMonthly)}/month (half the national average) × ${pct}, for about ${rates.monthsPerAcademicYear} months of class.`
          : `Based on the military housing rate (E-5 with dependents) for the school’s ZIP ${school.zip}: about ${usd(monthlyRate)}/month × ${pct}, for about ${rates.monthsPerAcademicYear} months of class.`,
    },
    {
      label: 'Books & supplies stipend (paid to you)',
      amount: -books,
      explanation: `Up to ${usd(rates.booksStipendAnnual)} a year × ${pct}, paid at the start of each term.`,
    }
  );

  return {
    charged,
    giBillTuition,
    yellowRibbonEligible,
    yellowRibbon,
    scholarships: scholarshipTotal,
    tuitionOutOfPocket,
    mha,
    books,
    netCost,
    lines,
  };
}

export function formatUsd(n: number): string {
  const s = usd(Math.abs(n));
  return n < 0 ? '−' + s : s;
}
