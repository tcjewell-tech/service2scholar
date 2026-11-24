import type { DataRepository, DegreeLevel } from '@/data';

import { parseProgramKey } from './matching';

/** Splits saved program keys into those the data still offers and those that are retired or malformed. */
export function reconcileSavedPrograms(
  savedProgramKeys: string[],
  repo: DataRepository
): { activeKeys: string[]; orphanedKeys: string[] } {
  const activeKeys: string[] = [];
  const orphanedKeys: string[] = [];
  for (const key of savedProgramKeys) {
    const parsed = parseProgramKey(key);
    const program = parsed && repo.schools.find((s) => s.id === parsed.schoolId)?.programs.find((p) => p.cip === parsed.cip);
    (parsed && program?.levels.includes(parsed.level) ? activeKeys : orphanedKeys).push(key);
  }
  return { activeKeys, orphanedKeys };
}

const LEVEL_NAME: Record<DegreeLevel, string> = { bachelor: 'bachelor’s', master: 'master’s' };

/** A saved program in words, from whatever of its key the data can still explain. */
function describeSavedProgram(key: string, repo: DataRepository): string {
  const parsed = parseProgramKey(key);
  if (!parsed) return 'a saved program that can’t be read';
  const field = repo.cipName[parsed.cip] ?? parsed.cip;
  const school = repo.schools.find((s) => s.id === parsed.schoolId)?.name ?? 'a school no longer listed';
  return `${field} (${LEVEL_NAME[parsed.level]}) at ${school}`;
}

/** The Plan tab's warning, naming each retired program so the reader knows what "Remove from plan" drops. */
export function retiredProgramsNotice(orphanedKeys: string[], repo: DataRepository): string {
  const count = orphanedKeys.length;
  const names = orphanedKeys.map((k) => describeSavedProgram(k, repo)).join('; ');
  return `${count} saved ${count === 1 ? 'program is' : 'programs are'} no longer listed in the current school catalog: ${names}.`;
}
