import type { DataRepository, DegreeLevel, School } from '@/data';

import type { Profile } from './profile';

export interface FieldMatch {
  cip: string;
  weight: number;
  reasons: string[];
}

export interface ProgramMatch {
  key: string;
  school: School;
  cip: string;
  fieldName: string;
  level: DegreeLevel;
  score: number;
  reasons: string[];
}

const WEIGHTS = {
  primaryOnet: 1.0,
  primaryCustom: 0.9,
  secondaryOnet: 0.8,
  secondaryCustom: 0.7,
  interest: 0.85,
  ksbp: 0.6,
  /** Bonus per additional independent source pointing at the same field. */
  corroboration: 0.1,
};

/** Programs scoring below this are dropped as too weak a match. */
const MIN_SCORE = 0.3;
/** Veteran graduation rate assumed when a school doesn't report one. */
const DEFAULT_VET_RATE = 0.5;

export function programKey(schoolId: string, cip: string, level: DegreeLevel): string {
  return `${schoolId}:${cip}:${level}`;
}

export function parseProgramKey(key: string): { schoolId: string; cip: string; level: DegreeLevel } {
  const [schoolId, cip, level] = key.split(':');
  return { schoolId, cip, level: level as DegreeLevel };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Degree fields suggested by a profile's job codes, KSBP text and picked interests. */
export function fieldsForProfile(profile: Profile, repo: DataRepository): Map<string, FieldMatch> {
  const fields = new Map<string, FieldMatch>();
  const add = (cip: string, weight: number, reason: string) => {
    const existing = fields.get(cip);
    if (!existing) {
      fields.set(cip, { cip, weight, reasons: [reason] });
      return;
    }
    if (existing.reasons.includes(reason)) return;
    existing.reasons.push(reason);
    existing.weight = Math.max(existing.weight, weight) + WEIGHTS.corroboration;
  };

  const addCode = (code: string, primary: boolean) => {
    const job = repo.jobCodes.find(
      (j) => j.branch === profile.branch && j.code === code && j.rankCategory === profile.rankCategory
    ) ?? repo.jobCodes.find((j) => j.branch === profile.branch && j.code === code);
    if (job) {
      for (const soc of job.soc) {
        for (const cip of repo.socToCip[soc] ?? []) {
          add(
            cip,
            primary ? WEIGHTS.primaryOnet : WEIGHTS.secondaryOnet,
            `${primary ? 'Primary' : 'Secondary'} ${code} (${job.title}) → ${repo.socTitles[soc] ?? soc}`
          );
        }
      }
    }
    for (const cx of repo.customCrossover) {
      if (cx.branch !== profile.branch || cx.code !== code) continue;
      for (const cip of cx.cip) {
        add(cip, primary ? WEIGHTS.primaryCustom : WEIGHTS.secondaryCustom, `${code} custom crossover: ${cx.note}`);
      }
    }
  };

  if (profile.primaryCode) addCode(profile.primaryCode, true);
  for (const code of profile.secondaryCodes) addCode(code, false);

  for (const cip of profile.interests) add(cip, WEIGHTS.interest, 'You picked this field');

  const text = profile.ksbp.toLowerCase();
  if (text.trim()) {
    for (const entry of repo.ksbpKeywords) {
      const hit = entry.keywords.find((k) => new RegExp(`(^|[^a-z0-9])${escapeRegex(k)}([^a-z0-9]|$)`).test(text));
      if (!hit) continue;
      for (const cip of entry.cip) add(cip, WEIGHTS.ksbp, `Your skills mention “${hit}”`);
    }
  }

  return fields;
}

/** Ranked programs for a profile. For-profit schools are excluded unless asked for (spec §5.3). */
export function matchPrograms(
  profile: Profile,
  repo: DataRepository,
  opts: { includeForProfit?: boolean } = {}
): ProgramMatch[] {
  const fields = fieldsForProfile(profile, repo);
  const matches: ProgramMatch[] = [];

  for (const school of repo.schools) {
    if (school.control === 'for_profit' && !opts.includeForProfit) continue;
    if (school.onlineOnly && !profile.includeOnline) continue;
    const outcome = 0.7 + 0.3 * (school.veteranGradRate ?? DEFAULT_VET_RATE);
    for (const program of school.programs) {
      if (!program.levels.includes(profile.degreeLevel)) continue;
      const field = fields.get(program.cip);
      if (!field) continue;
      const score = field.weight * outcome;
      if (score < MIN_SCORE) continue;
      matches.push({
        key: programKey(school.id, program.cip, profile.degreeLevel),
        school,
        cip: program.cip,
        fieldName: repo.cipName[program.cip] ?? program.cip,
        level: profile.degreeLevel,
        score,
        reasons: field.reasons,
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}
