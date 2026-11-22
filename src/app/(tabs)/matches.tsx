import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import { ProfileHeader } from '@/components/profile-header';
import { SchoolCard } from '@/components/school-card';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chip, Notice, Row, Screen, SectionLabel } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCostedMatches } from '@/hooks/use-plan';
import {
  activeFilterCount,
  filterMatches,
  groupBySchool,
  locationOf,
  NO_FILTERS,
  sortMatches,
  type MatchFilters,
  type MatchSort,
} from '@/lib/matchFilters';
import { isRelatedOnly } from '@/lib/matching';
import { useActiveProfile } from '@/store';

const PRICE_CAPS: [string, number | null][] = [
  ['Any', null],
  ['Up to $10,000', 10000],
  ['Break even or better', 0],
  ['$10,000+ left over', -10000],
  ['$20,000+ left over', -20000],
  ['$30,000+ left over', -30000],
];

export default function MatchesScreen() {
  const profile = useActiveProfile();
  const costed = useCostedMatches(profile);
  const [sort, setSort] = useState<MatchSort>('cost');
  const [field, setField] = useState<string | null>(null);
  const [filters, setFilters] = useState<MatchFilters>(NO_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  if (!profile) return null;

  const fields = [...new Map(costed.map((c) => [c.match.cip, c.match.fieldName])).entries()];
  const locations = [...new Set(costed.map(locationOf))].sort();
  const active = activeFilterCount(filters);
  const set = (patch: Partial<MatchFilters>) => setFilters({ ...filters, ...patch });
  const filtered = filterMatches(field ? costed.filter((c) => c.match.cip === field) : costed, filters);
  const sorted = sortMatches(filtered, sort);
  const schools = groupBySchool(sorted);
  // When every program matched for the same reason, say it once instead of on every row.
  const whys = new Set(sorted.map((c) => c.match.reasons[0]?.text));
  const sharedWhy = whys.size === 1 ? ([...whys][0] ?? null) : null;

  return (
    <Screen>
      <ProfileHeader />
      {/* Information, not a warning: amber is kept for things to act on. Each sample rate is marked "(est.)" on its card. */}
      <Notice>
        Costs are government figures. Graduation rates are sample data. For-profit schools are left out.
      </Notice>

      {costed.length === 0 ? (
        <Card>
          <ThemedText style={{ fontWeight: 700 }}>No matches yet</ThemedText>
          <ThemedText themeColor="textSecondary">
            Add a secondary job code, more skills, or fields of interest in Profiles to widen your matches.
          </ThemedText>
        </Card>
      ) : (
        <>
          {/* Controls sit closer to each other than to the cards, so they read as one group. */}
          <View style={styles.controls}>
          <Row>
            <Chip label="Lowest cost to you" selected={sort === 'cost'} onPress={() => setSort('cost')} />
            <Chip label="Best match" selected={sort === 'match'} onPress={() => setSort('match')} />
          </Row>
          {/* One swipeable line that runs to the screen edges, however many fields match. */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.fieldRow}>
            <Chip label={`All fields (${costed.length})`} selected={!field} onPress={() => setField(null)} />
            {fields.map(([cip, name]) => (
              <Chip key={cip} label={name} selected={field === cip} onPress={() => setField(field === cip ? null : cip)} />
            ))}
          </ScrollView>
          <View style={styles.countRow}>
            <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
              {sorted.length === costed.length ? costed.length : `${sorted.length} of ${costed.length}`} programs at {schools.length}{' '}
              {schools.length === 1 ? 'school' : 'schools'}
            </ThemedText>
            <Chip
              label={active ? `Filters (${active})` : 'Filters'}
              selected={showFilters || active > 0}
              onPress={() => setShowFilters(!showFilters)}
            />
          </View>
          {showFilters ? (
            <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOut.duration(120)}>
            <Card>
              <SectionLabel>Net cost per year</SectionLabel>
              <Row>
                {PRICE_CAPS.map(([label, cap]) => (
                  <Chip key={label} label={label} selected={filters.maxNetCost === cap} onPress={() => set({ maxNetCost: cap })} />
                ))}
              </Row>
              <SectionLabel>State</SectionLabel>
              <Row>
                <Chip label="Anywhere" selected={filters.locations.length === 0} onPress={() => set({ locations: [] })} />
                {locations.map((loc) => (
                  <Chip
                    key={loc}
                    label={loc}
                    selected={filters.locations.includes(loc)}
                    onPress={() =>
                      set({
                        locations: filters.locations.includes(loc)
                          ? filters.locations.filter((l) => l !== loc)
                          : [...filters.locations, loc],
                      })
                    }
                  />
                ))}
              </Row>
              <SectionLabel>School type</SectionLabel>
              <Row>
                <Chip label="Any" selected={!filters.control} onPress={() => set({ control: null })} />
                <Chip label="Public" selected={filters.control === 'public'} onPress={() => set({ control: 'public' })} />
                <Chip
                  label="Private nonprofit"
                  selected={filters.control === 'private_nonprofit'}
                  onPress={() => set({ control: 'private_nonprofit' })}
                />
                <Chip
                  label="Yellow Ribbon"
                  selected={filters.yellowRibbonOnly}
                  onPress={() => set({ yellowRibbonOnly: !filters.yellowRibbonOnly })}
                />
              </Row>
              {active ? <Button title="Clear filters" variant="ghost" onPress={() => setFilters(NO_FILTERS)} /> : null}
            </Card>
            </Animated.View>
          ) : null}
          </View>
          {sorted.length === 0 ? (
            <Card>
              <ThemedText style={{ fontWeight: 700 }}>No programs fit these filters</ThemedText>
              <ThemedText themeColor="textSecondary">Loosen a filter or pick a different field to see more.</ThemedText>
              <Button
                title="Clear filters"
                variant="secondary"
                onPress={() => {
                  setFilters(NO_FILTERS);
                  setField(null);
                }}
              />
            </Card>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              {sort === 'cost'
                ? 'Ranked by tuition you pay, then by money left over.'
                : 'Ranked by fit with your service and skills, weighted by graduation rate (sample data).'}
              {sharedWhy ? ` Matched on: ${sharedWhy}.` : ''}
              {sorted.some((c) => isRelatedOnly(c.match))
                ? ' “Related major” degrees sit in the same academic family as your military job.'
                : ''}
            </ThemedText>
          )}
          {schools.map((programs) => (
            <SchoolCard
              key={programs[0].match.key}
              programs={programs}
              savedKeys={profile.savedProgramKeys}
              showWhy={!sharedWhy}
            />
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  controls: { gap: Spacing.two },
  bleed: { marginHorizontal: -Spacing.three },
  fieldRow: { gap: Spacing.two, paddingHorizontal: Spacing.three },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
