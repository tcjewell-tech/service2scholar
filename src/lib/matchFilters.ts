import type { SchoolControl } from '@/data/types';
import type { CostedMatch } from '@/hooks/use-plan';

export interface MatchFilters {
  /** Highest yearly net cost (tuition paid minus housing and book money); negative = money left over; null = any. */
  maxNetCost: number | null;
  /** State codes, or 'Online' for online-only schools; empty = anywhere. */
  locations: string[];
  control: SchoolControl | null;
  yellowRibbonOnly: boolean;
}

export const NO_FILTERS: MatchFilters = { maxNetCost: null, locations: [], control: null, yellowRibbonOnly: false };

/** Online-only schools are listed as 'Online', matching how the match card shows them. */
export const locationOf = (c: CostedMatch) => (c.match.school.onlineOnly ? 'Online' : c.match.school.state);

export const activeFilterCount = (f: MatchFilters) =>
  (f.maxNetCost != null ? 1 : 0) + (f.locations.length ? 1 : 0) + (f.control ? 1 : 0) + (f.yellowRibbonOnly ? 1 : 0);

export function filterMatches(costed: CostedMatch[], f: MatchFilters): CostedMatch[] {
  return costed.filter(
    (c) =>
      (f.maxNetCost == null || c.cost.netCost <= f.maxNetCost) &&
      (f.locations.length === 0 || f.locations.includes(locationOf(c))) &&
      (!f.control || c.match.school.control === f.control) &&
      (!f.yellowRibbonOnly || c.cost.yellowRibbonEligible)
  );
}

export type MatchSort = 'cost' | 'match';

/**
 * 'cost' ranks by tuition owed. At 100% GI Bill that is often $0 everywhere, so ties fall to
 * money left over (a real figure) before match score, which leans on sample graduation rates.
 */
export function sortMatches(costed: CostedMatch[], sort: MatchSort): CostedMatch[] {
  return [...costed].sort((a, b) =>
    sort === 'cost'
      ? a.cost.tuitionOutOfPocket - b.cost.tuitionOutOfPocket || a.cost.netCost - b.cost.netCost || b.match.score - a.match.score
      : b.match.score - a.match.score
  );
}

/** One group per school, in the order each school first appears; cost is the same for every program in a group. */
export function groupBySchool(costed: CostedMatch[]): CostedMatch[][] {
  const groups = new Map<string, CostedMatch[]>();
  for (const c of costed) {
    const key = `${c.match.school.id}:${c.match.level}`;
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }
  return [...groups.values()];
}
