import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { OnboardingFrame } from '@/components/onboarding-frame';
import { ThemedText } from '@/components/themed-text';
import { Field, SectionLabel } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { data, type JobCode } from '@/data';
import { useTheme } from '@/hooks/use-theme';
import { BRANCHES, codeTermFor, RANK_LABEL } from '@/lib/profile';
import { useAccount } from '@/store';

export default function CodesStep() {
  const draft = useAccount((s) => s.draft)!;
  const updateDraft = useAccount((s) => s.updateDraft);
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const term = codeTermFor(draft.branch, draft.rankCategory);

  const codes = useMemo(
    () => data.jobCodes.filter((j) => j.branch === draft.branch && j.rankCategory === draft.rankCategory),
    [draft.branch, draft.rankCategory]
  );
  const q = query.trim().toLowerCase();
  const matching = q
    ? codes.filter((c) => c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q))
    : codes;
  // Some branches have thousands of codes: show the picked ones, then the first matches, and let search narrow it.
  const picked = (c: JobCode) => c.code === draft.primaryCode || draft.secondaryCodes.includes(c.code);
  const visible = [...codes.filter(picked), ...matching.filter((c) => !picked(c)).slice(0, MAX_ROWS)];
  const hidden = matching.filter((c) => !picked(c)).length - MAX_ROWS;

  const onPick = (code: string) => {
    if (!draft.primaryCode) {
      updateDraft({ primaryCode: code });
    } else if (draft.primaryCode === code) {
      // Promote the first secondary (if any) when the primary is removed.
      const [next, ...rest] = draft.secondaryCodes;
      updateDraft({ primaryCode: next ?? null, secondaryCodes: rest });
    } else if (draft.secondaryCodes.includes(code)) {
      updateDraft({ secondaryCodes: draft.secondaryCodes.filter((c) => c !== code) });
    } else {
      updateDraft({ secondaryCodes: [...draft.secondaryCodes, code] });
    }
  };

  const groups = new Map<string, JobCode[]>();
  for (const c of visible) {
    const key = c.group ?? `${RANK_LABEL[draft.rankCategory]} ${term}s`;
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }

  return (
    <OnboardingFrame
      step="codes"
      title={`Your ${term}`}
      subtitle={`Tap your primary ${term} first, then any others you held during your career. Secondary codes widen your matches.`}
      canContinue={!!draft.primaryCode}>
      <Field
        label={`Search ${BRANCHES[draft.branch].short} ${term}s`}
        value={query}
        onChangeText={setQuery}
        placeholder="Code or title, e.g. 11B or medic"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {[...groups.entries()].map(([group, list]) => (
        <View key={group} style={{ gap: Spacing.two }}>
          <SectionLabel>{group}</SectionLabel>
          {list.map((c) => {
            const role =
              draft.primaryCode === c.code ? 'Primary' : draft.secondaryCodes.includes(c.code) ? 'Secondary' : null;
            return (
              <Pressable
                key={c.code}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: !!role }}
                onPress={() => onPick(c.code)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: role ? theme.backgroundSelected : theme.backgroundElement,
                    borderColor: role ? theme.tint : theme.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <ThemedText style={[styles.code, { color: theme.tint }]}>{c.code}</ThemedText>
                <ThemedText style={{ flex: 1 }}>{c.title}</ThemedText>
                {role ? (
                  <ThemedText
                    type="smallBold"
                    style={{ color: role === 'Primary' ? theme.accent : theme.textSecondary }}>
                    {role}
                  </ThemedText>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
      {hidden > 0 ? (
        <ThemedText themeColor="textSecondary">
          {hidden.toLocaleString('en-US')} more {term}s not shown. Search by code or title to find yours.
        </ThemedText>
      ) : null}
      {matching.length === 0 ? (
        <ThemedText themeColor="textSecondary">
          No {term}s match “{query}”. Pick the closest one, and describe the rest in the next step.
        </ThemedText>
      ) : null}
    </OnboardingFrame>
  );
}

const MAX_ROWS = 50;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  code: { fontWeight: 700, minWidth: 56 },
});
