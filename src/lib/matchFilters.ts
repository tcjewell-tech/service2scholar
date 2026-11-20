import type { SchoolControl } from '@/data/types';
import type { CostedMatch } from '@/hooks/use-plan';

export interface MatchFilters {
  /** Highest yearly tuition the user pays out of pocket; null = any. */
  maxTuition: number | null;
  /** State codes, or 'Online' for online-only schools; empty = anywhere. */
  locations: string[];
  control: SchoolControl | null;
  yellowRibbonOnly: boolean;
}

export const NO_FILTERS: MatchFilters = { maxTuition: null, locations: [], control: null, yellowRibbonOnly: false };

/** Online-only schools are listed as 'Online', matching how the match card shows them. */
export const locationOf = (c: CostedMatch) => (c.match.school.onlineOnly ? 'Online' : c.match.school.state);

export const activeFilterCount = (f: MatchFilters) =>
  (f.maxTuition != null ? 1 : 0) + (f.locations.length ? 1 : 0) + (f.control ? 1 : 0) + (f.yellowRibbonOnly ? 1 : 0);

export function filterMatches(costed: CostedMatch[], f: MatchFilters): CostedMatch[] {
  return costed.filter(
    (c) =>
      (f.maxTuition == null || c.cost.tuitionOutOfPocket <= f.maxTuition) &&
      (f.locations.length === 0 || f.locations.includes(locationOf(c))) &&
      (!f.control || c.match.school.control === f.control) &&
      (!f.yellowRibbonOnly || c.cost.yellowRibbonEligible)
  );
}
