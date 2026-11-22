import { useMemo } from 'react';

import { data, useData, type DataRepository } from '@/data';
import { eligibleScholarships, estimateCost, type CostEstimate } from '@/lib/costCalculator';
import { matchPrograms, type ProgramMatch } from '@/lib/matching';
import type { Profile } from '@/lib/profile';
import { buildChecklist } from '@/lib/timeline';
import { reconcileSavedPrograms } from '@/store';

export interface CostedMatch {
  match: ProgramMatch;
  cost: CostEstimate;
}

export function plannedScholarshipsFor(profile: Profile, repo: DataRepository = data) {
  return eligibleScholarships(profile, repo.scholarships).filter((s) => profile.plannedScholarshipIds.includes(s.id));
}

export function useCostedMatches(profile: Profile | null): CostedMatch[] {
  const data = useData();
  return useMemo(() => {
    if (!profile) return [];
    const planned = plannedScholarshipsFor(profile, data);
    return matchPrograms(profile, data).map((match) => ({
      match,
      cost: estimateCost(profile, match.school, match.level, planned, data.rates),
    }));
  }, [profile, data]);
}

/** A profile's saved programs, split into those the school data still lists and those it has dropped. Changes nothing. */
export function useReconciledSavedPrograms(profile: Profile | null): { activeKeys: string[]; orphanedKeys: string[] } {
  const data = useData();
  const savedProgramKeys = profile?.savedProgramKeys;
  return useMemo(() => reconcileSavedPrograms(savedProgramKeys ?? [], data), [savedProgramKeys, data]);
}

export function useChecklist(profile: Profile | null) {
  const data = useData();
  return useMemo(() => (profile ? buildChecklist(profile, data) : []), [profile, data]);
}
