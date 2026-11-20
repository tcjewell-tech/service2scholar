import type { CostedMatch } from '@/hooks/use-plan';
import { activeFilterCount, filterMatches, groupBySchool, NO_FILTERS, sortMatches } from '@/lib/matchFilters';

const item = (id: string, state: string, tuition: number, control = 'public', onlineOnly = false, yr = false) =>
  ({
    match: { key: id, school: { state, control, onlineOnly } },
    cost: { netCost: tuition, yellowRibbonEligible: yr },
  }) as unknown as CostedMatch;

const all = [
  item('a', 'TX', -20000),
  item('b', 'NY', 12000, 'private_nonprofit', false, true),
  item('c', 'MD', 4000, 'public', true),
];
const keys = (list: CostedMatch[]) => list.map((c) => c.match.key);

describe('filterMatches', () => {
  it('returns everything with no filters', () => {
    expect(filterMatches(all, NO_FILTERS)).toHaveLength(3);
    expect(activeFilterCount(NO_FILTERS)).toBe(0);
  });

  it('caps net cost, including a left-over (negative) cap', () => {
    expect(keys(filterMatches(all, { ...NO_FILTERS, maxNetCost: -10000 }))).toEqual(['a']);
    expect(keys(filterMatches(all, { ...NO_FILTERS, maxNetCost: 5000 }))).toEqual(['a', 'c']);
  });

  it('lists online-only schools under Online, not their home state', () => {
    expect(keys(filterMatches(all, { ...NO_FILTERS, locations: ['MD'] }))).toEqual([]);
    expect(keys(filterMatches(all, { ...NO_FILTERS, locations: ['Online', 'TX'] }))).toEqual(['a', 'c']);
  });

  it('combines filters and counts the active ones', () => {
    const f = { ...NO_FILTERS, control: 'private_nonprofit' as const, yellowRibbonOnly: true, maxNetCost: 15000 };
    expect(keys(filterMatches(all, f))).toEqual(['b']);
    expect(activeFilterCount(f)).toBe(3);
  });
});

describe('sortMatches and groupBySchool', () => {
  const prog = (key: string, school: string, tuition: number, net: number, score: number) =>
    ({
      match: { key, score, level: 'bachelor', school: { id: school } },
      cost: { tuitionOutOfPocket: tuition, netCost: net },
    }) as unknown as CostedMatch;
  const list = [prog('a1', 'A', 0, -10000, 0.9), prog('b1', 'B', 0, -30000, 0.5), prog('c1', 'C', 2000, -5000, 0.99), prog('a2', 'A', 0, -10000, 0.8)];

  it('breaks a $0 tuition tie by money left over, not match score', () => {
    expect(keys(sortMatches(list, 'cost'))).toEqual(['b1', 'a1', 'a2', 'c1']);
    expect(keys(sortMatches(list, 'match'))).toEqual(['c1', 'a1', 'a2', 'b1']);
  });

  it('groups programs under their school in first-seen order', () => {
    expect(groupBySchool(sortMatches(list, 'cost')).map(keys)).toEqual([['b1'], ['a1', 'a2'], ['c1']]);
  });
});
