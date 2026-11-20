import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ProfileHeader } from '@/components/profile-header';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chip, Notice, Row, Screen, SectionLabel } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCostedMatches, type CostedMatch } from '@/hooks/use-plan';
import { useTheme } from '@/hooks/use-theme';
import { formatUsd } from '@/lib/costCalculator';
import { activeFilterCount, filterMatches, locationOf, NO_FILTERS, type MatchFilters } from '@/lib/matchFilters';
import { useActiveProfile } from '@/store';

type Sort = 'cost' | 'match';

const PRICE_CAPS: [string, number | null][] = [
  ['Any', null],
  ['$0', 0],
  ['Up to $5,000', 5000],
  ['Up to $15,000', 15000],
];

export default function MatchesScreen() {
  const profile = useActiveProfile();
  const costed = useCostedMatches(profile);
  const [sort, setSort] = useState<Sort>('cost');
  const [field, setField] = useState<string | null>(null);
  const [filters, setFilters] = useState<MatchFilters>(NO_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  if (!profile) return null;

  const fields = [...new Map(costed.map((c) => [c.match.cip, c.match.fieldName])).entries()];
  const locations = [...new Set(costed.map(locationOf))].sort();
  const active = activeFilterCount(filters);
  const set = (patch: Partial<MatchFilters>) => setFilters({ ...filters, ...patch });
  const filtered = filterMatches(field ? costed.filter((c) => c.match.cip === field) : costed, filters);
  // Rank by what the user owes the school, not net cost: a big-city housing allowance would
  // otherwise float expensive cities to the top even though rent there eats it.
  const sorted = [...filtered].sort((a, b) =>
    sort === 'cost'
      ? a.cost.tuitionOutOfPocket - b.cost.tuitionOutOfPocket || b.match.score - a.match.score
      : b.match.score - a.match.score
  );

  return (
    <Screen>
      <ProfileHeader />
      <Notice>
        School costs, Yellow Ribbon, housing rates and degree fields are government figures. Graduation rates are still sample data. For-profit schools are left out.
      </Notice>

      {costed.length === 0 ? (
        <Card>
          <ThemedText style={{ fontWeight: 600 }}>No matches yet</ThemedText>
          <ThemedText themeColor="textSecondary">
            Add a secondary job code, more skills, or fields of interest in Profiles to widen your matches.
          </ThemedText>
        </Card>
      ) : (
        <>
          <Row>
            <Chip label="Lowest cost to you" selected={sort === 'cost'} onPress={() => setSort('cost')} />
            <Chip label="Best match" selected={sort === 'match'} onPress={() => setSort('match')} />
            <Chip
              label={active ? `Filters (${active})` : 'Filters'}
              selected={showFilters || active > 0}
              onPress={() => setShowFilters(!showFilters)}
            />
          </Row>
          {showFilters ? (
            <Card>
              <SectionLabel>You pay (tuition) per year</SectionLabel>
              <Row>
                {PRICE_CAPS.map(([label, cap]) => (
                  <Chip key={label} label={label} selected={filters.maxTuition === cap} onPress={() => set({ maxTuition: cap })} />
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
          ) : null}
          <Row>
            <Chip label={`All fields (${costed.length})`} selected={!field} onPress={() => setField(null)} />
            {fields.map(([cip, name]) => (
              <Chip key={cip} label={name} selected={field === cip} onPress={() => setField(field === cip ? null : cip)} />
            ))}
          </Row>
          {sorted.length === 0 ? (
            <Card>
              <ThemedText style={{ fontWeight: 600 }}>No programs fit these filters</ThemedText>
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
              Showing {sorted.length} of {costed.length} programs
            </ThemedText>
          )}
          {sorted.map((c) => (
            <MatchCard key={c.match.key} item={c} saved={profile.savedProgramKeys.includes(c.match.key)} />
          ))}
        </>
      )}
    </Screen>
  );
}

function MatchCard({ item, saved }: { item: CostedMatch; saved: boolean }) {
  const theme = useTheme();
  const { match, cost } = item;
  const surplus = cost.netCost < 0;

  return (
    <Link href={{ pathname: '/program/[key]', params: { key: match.key } }} asChild>
      <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        <Card>
          <View style={styles.top}>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText type="small" themeColor="textSecondary">
                {match.school.name}
                {match.school.onlineOnly ? ' · Online' : ` · ${match.school.city}, ${match.school.state}`}
              </ThemedText>
              <ThemedText style={{ fontWeight: 700, fontSize: 17 }}>{match.fieldName}</ThemedText>
            </View>
            {saved ? (
              <ThemedText type="smallBold" style={{ color: theme.accent }}>
                ★ In plan
              </ThemedText>
            ) : null}
          </View>

          <View style={styles.figures}>
            <Figure label="You pay (tuition)" value={formatUsd(cost.tuitionOutOfPocket)} strong={cost.tuitionOutOfPocket === 0} />
            <Figure label="Paid to you" value={formatUsd(cost.mha + cost.books)} />
            <Figure
              label={surplus ? 'Left over / yr' : 'Net cost / yr'}
              value={formatUsd(Math.abs(cost.netCost))}
              color={surplus ? theme.success : theme.text}
            />
          </View>

          <Row style={{ gap: Spacing.one }}>
            {cost.yellowRibbonEligible ? <Tag text="Yellow Ribbon" /> : null}
            {match.school.control === 'public' ? <Tag text="Public" /> : <Tag text="Private nonprofit" />}
            {match.school.veteranGradRate != null ? (
              <Tag text={`${Math.round(match.school.veteranGradRate * 100)}% vet grad rate`} />
            ) : null}
          </Row>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            Why: {match.reasons[0]}
            {match.reasons.length > 1 ? ` (+${match.reasons.length - 1} more)` : ''}
          </ThemedText>
        </Card>
      </Pressable>
    </Link>
  );
}

function Figure({ label, value, strong, color }: { label: string; value: string; strong?: boolean; color?: string }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText style={{ fontWeight: 700, fontSize: 18, color: color ?? (strong ? theme.success : theme.text) }}>
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
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  figures: { flexDirection: 'row', gap: Spacing.two },
  tag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
});
