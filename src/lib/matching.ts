import { cipFamily, findJobCode, type DataRepository, type DegreeLevel, type KsbpKeyword, type School } from '@/data';

import type { Profile } from './profile';

/** Where a reason came from. Screens branch on this, never on the wording in `text`. */
export type MatchReasonSource = 'direct' | 'crossover' | 'related' | 'interest' | 'skills';

export interface MatchReason {
  source: MatchReasonSource;
  text: string;
}

export interface FieldMatch {
  cip: string;
  weight: number;
  reasons: MatchReason[];
}

export interface ProgramMatch {
  key: string;
  school: School;
  cip: string;
  fieldName: string;
  level: DegreeLevel;
  score: number;
  reasons: MatchReason[];
}

const WEIGHTS = {
  primaryOnet: 1.0,
  primaryCustom: 0.9,
  secondaryOnet: 0.8,
  secondaryCustom: 0.7,
  interest: 0.85,
  ksbp: 0.6,
  /** A job whose occupations only link to a neighbouring field in the same 4-digit CIP family. */
  familyFallback: 0.55,
  /** Bonus per additional independent source pointing at the same field. */
  corroboration: 0.1,
};

/** True when nothing but the family fallback suggested this field. A match with no reasons is not one. */
export const isRelatedOnly = (m: { reasons: readonly MatchReason[] }): boolean =>
  m.reasons.length > 0 && m.reasons.every((r) => r.source === 'related');

/** Programs scoring below this are dropped as too weak a match. */
const MIN_SCORE = 0.3;
/** Veteran graduation rate assumed when a school doesn't report one. */
const DEFAULT_VET_RATE = 0.5;

export function programKey(schoolId: string, cip: string, level: DegreeLevel): string {
  return `${schoolId}:${cip}:${level}`;
}

/** Reads a key from the right, so a school id containing a colon still parses; null if the key is malformed. */
export function parseProgramKey(key: string): { schoolId: string; cip: string; level: DegreeLevel } | null {
  const levelAt = key.lastIndexOf(':');
  const cipAt = levelAt > 0 ? key.lastIndexOf(':', levelAt - 1) : -1;
  const level = key.slice(levelAt + 1);
  if (cipAt < 1 || (level !== 'bachelor' && level !== 'master')) return null;
  return { schoolId: key.slice(0, cipAt), cip: key.slice(cipAt + 1, levelAt), level };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Crossover codes may use Air Force shorthand, where X stands for the skill-level digit: 1N0X1 covers 1N031, 1N051... */
function codeMatches(pattern: string, code: string): boolean {
  return pattern.length === code.length && [...pattern].every((ch, i) => ch === code[i] || (ch === 'X' && /\d/.test(code[i])));
}

// Compiled once per keyword list instead of on every match run.
const keywordPatterns = new WeakMap<KsbpKeyword[], { cip: string[]; patterns: [keyword: string, re: RegExp][] }[]>();
function patternsFor(keywords: KsbpKeyword[]) {
  let compiled = keywordPatterns.get(keywords);
  if (!compiled) {
    compiled = keywords.map((entry) => ({
      cip: entry.cip,
      patterns: entry.keywords.map((k): [string, RegExp] => [k, new RegExp(`(^|[^a-z0-9])${escapeRegex(k)}([^a-z0-9]|$)`)]),
    }));
    keywordPatterns.set(keywords, compiled);
  }
  return compiled;
}

/** Degree fields suggested by a profile's job codes, KSBP text and picked interests. */
export function fieldsForProfile(profile: Profile, repo: DataRepository): Map<string, FieldMatch> {
  const fields = new Map<string, FieldMatch>();
  // Which independent signals reached each field. Several occupations of one job code are one signal,
  // so they add reasons but never the corroboration bonus.
  const origins = new Map<string, Set<string>>();
  const add = (cip: string, weight: number, reason: MatchReason, origin: string) => {
    const existing = fields.get(cip);
    if (!existing) {
      fields.set(cip, { cip, weight, reasons: [reason] });
      origins.set(cip, new Set([origin]));
      return;
    }
    if (existing.reasons.some((r) => r.source === reason.source && r.text === reason.text)) return;
    existing.reasons.push(reason);
    const seen = origins.get(cip)!;
    existing.weight = Math.max(existing.weight, weight) + (seen.has(origin) ? 0 : WEIGHTS.corroboration);
    seen.add(origin);
  };

  // A code listed as both primary and secondary counts once, so it cannot corroborate itself.
  const seenCodes = new Set<string>();
  const addCode = (raw: string, primary: boolean) => {
    const code = raw.trim();
    if (!code || seenCodes.has(code)) return;
    seenCodes.add(code);
    const rank = primary ? 'Primary' : 'Secondary';
    const job = findJobCode(repo, profile.branch, code, profile.rankCategory);
    let direct = 0;
    if (job) {
      for (const soc of job.soc) {
        for (const cip of repo.socToCip[soc] ?? []) {
          direct++;
          add(cip, primary ? WEIGHTS.primaryOnet : WEIGHTS.secondaryOnet, {
            source: 'direct',
            text: `${rank} ${code} (${job.title}) → ${repo.socTitles[soc] ?? soc}`,
          }, `job:${code}`);
        }
      }
    }
    for (const cx of repo.customCrossover) {
      if (cx.branch !== profile.branch || !codeMatches(cx.code, code)) continue;
      for (const cip of cx.cip) {
        direct++;
        add(cip, primary ? WEIGHTS.primaryCustom : WEIGHTS.secondaryCustom, {
          source: 'crossover',
          text: `${code} custom crossover: ${cx.note}`,
        }, `crossover:${code}`);
      }
    }
    if (!job || direct > 0) return;
    // Nothing direct: offer fields in the same 4-digit family as any degree O*NET links to the job's occupations.
    for (const soc of job.soc) {
      const families = new Set((repo.rawSocToCip?.[soc] ?? []).map(cipFamily));
      for (const { cip } of repo.cipFields) {
        if (families.has(cipFamily(cip))) {
          add(cip, WEIGHTS.familyFallback, {
            source: 'related',
            text: `${rank} ${code} (${job.title}) → ${repo.socTitles[soc] ?? soc}`,
          }, `job:${code}`);
        }
      }
    }
  };

  if (profile.primaryCode) addCode(profile.primaryCode, true);
  for (const code of profile.secondaryCodes) addCode(code, false);

  for (const cip of profile.interests) add(cip, WEIGHTS.interest, { source: 'interest', text: 'You picked this field' }, 'interest');

  const text = profile.ksbp.toLowerCase();
  if (text.trim()) {
    for (const entry of patternsFor(repo.ksbpKeywords)) {
      const hit = entry.patterns.find(([, re]) => re.test(text))?.[0];
      if (!hit) continue;
      for (const cip of entry.cip) add(cip, WEIGHTS.ksbp, { source: 'skills', text: `Your skills mention “${hit}”` }, 'skills');
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
