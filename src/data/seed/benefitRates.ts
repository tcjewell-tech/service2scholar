import type { BenefitRates } from '../types';

/**
 * Post-9/11 GI Bill rates for academic year 2026–27 (effective 2026-08-01).
 * Cap and online MHA per VA's published 2026–27 rates. The per-ZIP MHA table is a small
 * SAMPLE of approximate E-5-with-dependents BAH figures — replace with the full DoD BAH
 * table (Phase 2) before launch.
 */
export const BENEFIT_RATES: BenefitRates = {
  academicYear: '2026–27',
  effectiveDate: '2026-08-01',
  privateTuitionCap: 30908.34,
  booksStipendAnnual: 1000,
  onlineMhaMonthly: 1261,
  monthsPerAcademicYear: 9,
  defaultMhaMonthly: 2522,
  mhaByZip: {
    '13244': 1950,
    '90089': 4200,
    '20057': 3500,
    '20052': 3500,
    '10027': 4900,
    '05663': 2050,
    '32114': 2150,
    '96813': 4000,
    '77843': 1750,
    '85281': 2450,
    '47907': 1550,
    '24061': 1700,
    '23529': 2350,
    '28403': 1950,
    '80918': 2350,
    '92182': 3800,
    '98402': 2850,
    '78249': 2000,
    '16802': 1900,
    '20783': 3300,
    '03106': 2350,
    '12203': 1900,
  },
};
