import type { CostedMatch } from '@/hooks/use-plan';
import { activeFilterCount, filterMatches, NO_FILTERS } from '@/lib/matchFilters';

const item = (id: string, state: string, tuition: number, control = 'public', onlineOnly = false, yr = false) =>
  ({
    match: { key: id, school: { state, control, onlineOnly } },
    cost: { tuitionOutOfPocket: tuition, yellowRibbonEligible: yr },
  }) as unknown as CostedMatch;

const all = [
  item('a', 'TX', 0),
  item('b', 'NY', 12000, 'private_nonprofit', false, true),
  item('c', 'MD', 4000, 'public', true),
];
const keys = (list: CostedMatch[]) => list.map((c) => c.match.key);

describe('filterMatches', () => {
  it('returns everything with no filters', () => {
    expect(filterMatches(all, NO_FILTERS)).toHaveLength(3);
    expect(activeFilterCount(NO_FILTERS)).toBe(0);
  });

  it('caps what the user pays, including a $0 cap', () => {
    expect(keys(filterMatches(all, { ...NO_FILTERS, maxTuition: 0 }))).toEqual(['a']);
    expect(keys(filterMatches(all, { ...NO_FILTERS, maxTuition: 5000 }))).toEqual(['a', 'c']);
  });

  it('lists online-only schools under Online, not their home state', () => {
    expect(keys(filterMatches(all, { ...NO_FILTERS, locations: ['MD'] }))).toEqual([]);
    expect(keys(filterMatches(all, { ...NO_FILTERS, locations: ['Online', 'TX'] }))).toEqual(['a', 'c']);
  });

  it('combines filters and counts the active ones', () => {
    const f = { ...NO_FILTERS, control: 'private_nonprofit' as const, yellowRibbonOnly: true, maxTuition: 15000 };
    expect(keys(filterMatches(all, f))).toEqual(['b']);
    expect(activeFilterCount(f)).toBe(3);
  });
});
