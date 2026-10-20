import * as WebBrowser from 'expo-web-browser';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chip, Heading, Notice, Screen, SectionLabel } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { data } from '@/data';
import { plannedScholarshipsFor } from '@/hooks/use-plan';
import { useTheme } from '@/hooks/use-theme';
import { eligibleScholarships, estimateCost, formatUsd } from '@/lib/costCalculator';
import { formatDate } from '@/lib/dates';
import { matchPrograms } from '@/lib/matching';
import { useAccount, useActiveProfile } from '@/store';

export default function ProgramScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const profile = useActiveProfile();
  const toggleSaved = useAccount((s) => s.toggleSavedProgram);
  const togglePlanned = useAccount((s) => s.togglePlannedScholarship);
  const theme = useTheme();

  const match = useMemo(
    () => (profile ? matchPrograms(profile, data).find((m) => m.key === key) : undefined),
    [profile, key]
  );

  if (!profile || !match) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Program' }} />
        <ThemedText>This program isn’t in the current profile’s matches.</ThemedText>
      </Screen>
    );
  }

  const cost = estimateCost(profile, match.school, match.level, plannedScholarshipsFor(profile), data.rates);
  const scholarships = eligibleScholarships(profile, data.scholarships);
  const saved = profile.savedProgramKeys.includes(match.key);
  const school = match.school;

  return (
    <Screen
      footer={
        <>
          <Button title="Visit school site" variant="secondary" onPress={() => WebBrowser.openBrowserAsync(school.url)} />
          <Button
            title={saved ? 'Remove from plan' : 'Add to my plan'}
            variant={saved ? 'secondary' : 'primary'}
            onPress={() => toggleSaved(profile.id, match.key)}
          />
        </>
      }>
      <Stack.Screen options={{ title: school.name }} />
      <Heading sub={`${school.name} · ${school.onlineOnly ? 'Online' : `${school.city}, ${school.state}`}`}>
        {match.fieldName} ({match.level === 'bachelor' ? 'Bachelor’s' : 'Master’s'})
      </Heading>

      <SectionLabel>Why it matches</SectionLabel>
      <Card>
        {match.reasons.map((r) => (
          <ThemedText key={r} type="small">
            • {r}
          </ThemedText>
        ))}
        {school.veteranGradRate != null ? (
          <ThemedText type="small" themeColor="textSecondary">
            Veteran graduation rate: about {Math.round(school.veteranGradRate * 100)}%
          </ThemedText>
        ) : null}
      </Card>

      <SectionLabel>Estimated cost per year ({data.rates.academicYear})</SectionLabel>
      <Card style={{ gap: Spacing.three }}>
        {cost.lines.map((line) => (
          <View key={line.label} style={{ gap: 2 }}>
            <View style={styles.lineTop}>
              <ThemedText style={{ flex: 1, fontWeight: 600 }}>{line.label}</ThemedText>
              <ThemedText style={{ fontWeight: 700, color: line.amount < 0 ? theme.success : theme.text }}>
                {formatUsd(line.amount)}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {line.explanation}
            </ThemedText>
          </View>
        ))}
        <View style={[styles.total, { borderTopColor: theme.border }]}>
          <View style={styles.lineTop}>
            <ThemedText style={{ flex: 1, fontWeight: 700 }}>You pay the school</ThemedText>
            <ThemedText style={{ fontWeight: 700 }}>{formatUsd(cost.tuitionOutOfPocket)}</ThemedText>
          </View>
          <View style={styles.lineTop}>
            <ThemedText style={{ flex: 1, fontWeight: 700 }}>
              {cost.netCost < 0 ? 'Left over for living costs' : 'Net out-of-pocket'}
            </ThemedText>
            <ThemedText style={{ fontWeight: 800, fontSize: 20, color: cost.netCost < 0 ? theme.success : theme.text }}>
              {formatUsd(Math.abs(cost.netCost))}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Net = what you pay the school minus the housing allowance and book stipend paid to you. Rent, food and
            travel aren’t included.
          </ThemedText>
        </View>
      </Card>

      <SectionLabel>Scholarships you may qualify for</SectionLabel>
      {scholarships.length === 0 ? (
        <ThemedText themeColor="textSecondary">No sample scholarships match this profile yet.</ThemedText>
      ) : (
        scholarships.map((s) => {
          const planned = profile.plannedScholarshipIds.includes(s.id);
          return (
            <Card key={s.id}>
              <ThemedText style={{ fontWeight: 700 }}>{s.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {s.provider} · about {formatUsd(s.amount)} · usually due {formatDate(`2027-${s.deadline}`).replace(', 2027', '')}
              </ThemedText>
              <ThemedText type="small">{s.summary}</ThemedText>
              <View style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'center' }}>
                <Chip
                  label={planned ? '✓ Applying' : 'I’ll apply'}
                  selected={planned}
                  onPress={() => togglePlanned(profile.id, s.id)}
                />
                <Button title="Open application ↗" variant="ghost" onPress={() => WebBrowser.openBrowserAsync(s.url)} />
              </View>
            </Card>
          );
        })
      )}
      <Notice>
        Marking “I’ll apply” adds the award to every estimate and puts its deadline in your plan. Applications open on the
        provider’s site.
      </Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lineTop: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.two },
  total: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.three, gap: Spacing.two },
});
