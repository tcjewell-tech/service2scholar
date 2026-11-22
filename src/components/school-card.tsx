import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import type { CostedMatch } from '@/hooks/use-plan';
import { useTheme } from '@/hooks/use-theme';
import { formatUsd } from '@/lib/costCalculator';
import { isRelatedOnly } from '@/lib/matching';

import { ThemedText } from './themed-text';
import { Card, Row, Tag } from './ui';

/** One school on Matches: its cost figures once, then a row for each matching degree field. */
export function SchoolCard({ programs, savedKeys, showWhy }: { programs: CostedMatch[]; savedKeys: string[]; showWhy: boolean }) {
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
        {/* "~" and "(est.)" because these rates are sample data; drop both once they are real. */}
        {school.veteranGradRate != null ? <Tag text={`~${Math.round(school.veteranGradRate * 100)}% grad rate (est.)`} /> : null}
      </Row>

      <View>
        {programs.map(({ match: m }) => (
          <Link key={m.key} href={{ pathname: '/program/[key]', params: { key: m.key } }} asChild>
            <Pressable accessibilityRole="link" style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              {/* Layout lives on this inner row: a Link only passes simple styles through to its child. */}
              <View style={[styles.program, { borderTopColor: theme.border }]}>
                <View style={{ flex: 1, gap: Spacing.half }}>
                  <ThemedText style={{ fontWeight: 700, color: theme.tint }}>{m.fieldName}</ThemedText>
                  {/* Shown whether or not the reason line is, so a looser match never passes as a direct one. */}
                  {isRelatedOnly(m) ? <Tag text="Related major" /> : null}
                  {showWhy ? (
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                      Why: {m.reasons[0]?.text}
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

const styles = StyleSheet.create({
  // 48 tall so each program is a comfortable tap on both iPhone and Android.
  program: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 48, paddingVertical: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  // flex-end keeps the three amounts on one line when a label wraps to two.
  figures: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
});
