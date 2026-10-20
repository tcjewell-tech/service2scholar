import { useMemo } from 'react';

import { data } from '@/data';
import { eligibleScholarships, estimateCost, type CostEstimate } from '@/lib/costCalculator';
import { matchPrograms, type ProgramMatch } from '@/lib/matching';
import type { Profile } from '@/lib/profile';
import { buildChecklist } from '@/lib/timeline';

export interface CostedMatch {
  match: ProgramMatch;
  cost: CostEstimate;
}

export function plannedScholarshipsFor(profile: Profile) {
  return eligibleScholarships(profile, data.scholarships).filter((s) => profile.plannedScholarshipIds.includes(s.id));
}

export function useCostedMatches(profile: Profile | null): CostedMatch[] {
  return useMemo(() => {
    if (!profile) return [];
    const planned = plannedScholarshipsFor(profile);
    return matchPrograms(profile, data).map((match) => ({
      match,
      cost: estimateCost(profile, match.school, match.level, planned, data.rates),
    }));
  }, [profile]);
}

export function useChecklist(profile: Profile | null) {
  return useMemo(() => (profile ? buildChecklist(profile, data) : []), [profile]);
}
