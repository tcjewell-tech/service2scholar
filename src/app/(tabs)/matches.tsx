import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import { ProfileHeader } from '@/components/profile-header';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chip, Notice, Row, Screen, SectionLabel } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCostedMatches, type CostedMatch } from '@/hooks/use-plan';
import { useTheme } from '@/hooks/use-theme';
import { formatUsd } from '@/lib/costCalculator';
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
  const whys = new Set(sorted.map((c) => c.match.reasons[0]));
  const sharedWhy = whys.size === 1 ? [...whys][0] : null;

  return (
    <Screen>
      <ProfileHeader />
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
              {sharedWhy ? ` Matched on: ${sharedWhy}` : ''}
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

function SchoolCard({ programs, savedKeys, showWhy }: { programs: CostedMatch[]; savedKeys: string[]; showWhy: boolean }) {
  const theme = useTheme();
  // Cost depends on the school and degree level, so it is the same for every program here.
  const { cost, match } = programs[0];
  const { school } = match;
  const surplus = cost.netCost < 0;
  const free = cost.tuitionOutOfPocket === 0;

  return (
    <Card>
      <View style={{ gap: 2 }}>
        <ThemedText type="title">{school.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {school.onlineOnly ? 'Online' : `${school.city}, ${school.state}`}
        </ThemedText>
      </View>

      <View style={styles.figures}>
        <Figure label="You pay (tuition)" value={formatUsd(cost.tuitionOutOfPocket)} strong={free} />
        {/* With no tuition to pay, "Paid to you" equals what is left over, so it is shown once. */}
        {free ? null : <Figure label="Paid to you" value={formatUsd(cost.mha + cost.books)} />}
        <Figure
          label={surplus ? 'Left over / yr' : 'Net cost / yr'}
          value={formatUsd(Math.abs(cost.netCost))}
          color={surplus ? theme.success : theme.text}
        />
      </View>

      <Row style={{ gap: Spacing.one }}>
        {cost.yellowRibbonEligible ? <Tag text="Yellow Ribbon" /> : null}
        {school.control === 'public' ? <Tag text="Public" /> : <Tag text="Private nonprofit" />}
        {school.veteranGradRate != null ? <Tag text={`${Math.round(school.veteranGradRate * 100)}% vet grad rate`} /> : null}
      </Row>

      <View>
        {programs.map(({ match: m }) => (
          <Link key={m.key} href={{ pathname: '/program/[key]', params: { key: m.key } }} asChild>
            <Pressable accessibilityRole="link" style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              {/* Layout lives on this inner row: a Link only passes simple styles through to its child. */}
              <View style={[styles.program, { borderTopColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontWeight: 700, color: theme.tint }}>{m.fieldName}</ThemedText>
                {showWhy ? (
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                    Why: {m.reasons[0]}
                    {m.reasons.length > 1 ? ` (+${m.reasons.length - 1} more)` : ''}
                  </ThemedText>
                ) : null}
              </View>
              {savedKeys.includes(m.key) ? (
                <ThemedText type="smallBold" style={{ color: theme.accent }}>
                  ★ In plan
                </ThemedText>
              ) : null}
              </View>
            </Pressable>
          </Link>
        ))}
      </View>
    </Card>
  );
}

function Figure({ label, value, strong, color }: { label: string; value: string; strong?: boolean; color?: string }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="figure" style={{ color: color ?? (strong ? theme.success : theme.text) }}>
        {value}
      </ThemedText>
    </View>
  );
}

function Tag({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.tag, { backgroundColor: theme.backgroundSelected }]}>
      <ThemedText type="small" style={{ fontSize: 12, lineHeight: 16 }}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  // 48 tall so each program is a comfortable tap on both iPhone and Android.
  program: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 48, paddingVertical: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  // flex-end keeps the three amounts on one line when a label wraps to two.
  figures: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  controls: { gap: Spacing.two },
  bleed: { marginHorizontal: -Spacing.three },
  fieldRow: { gap: Spacing.two, paddingHorizontal: Spacing.three },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  tag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
});
