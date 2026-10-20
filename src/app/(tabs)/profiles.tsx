import { useRouter } from 'expo-router';
import { Alert, Platform, View } from 'react-native';

import { BranchSeal } from '@/components/branch-seal';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Notice, Row, Screen, SectionLabel } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/lib/dates';
import { BRANCHES, codeTermFor, type Profile } from '@/lib/profile';
import { useAccount } from '@/store';

export default function ProfilesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const profiles = useAccount((s) => s.profiles);
  const activeId = useAccount((s) => s.activeProfileId);
  const setActive = useAccount((s) => s.setActive);
  const editDraft = useAccount((s) => s.editDraft);
  const startDraft = useAccount((s) => s.startDraft);
  const removeProfile = useAccount((s) => s.removeProfile);
  const sponsor = profiles.find((p) => p.beneficiary === 'self');

  const add = (beneficiary: Profile['beneficiary']) => {
    startDraft(beneficiary, sponsor);
    router.push('/onboarding');
  };

  const edit = (id: string) => {
    editDraft(id);
    router.push('/onboarding');
  };

  const remove = (p: Profile) => {
    const run = () => removeProfile(p.id);
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove ${p.name}’s profile?`)) run();
      return;
    }
    Alert.alert(`Remove ${p.name}?`, 'Their matches and checklist progress will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: run },
    ]);
  };

  return (
    <Screen>
      <Notice>
        One account can plan for you and anyone you’ve transferred GI Bill benefits to. Each profile has its own matches,
        costs and reminders.
      </Notice>
      {profiles.map((p) => {
        const active = p.id === activeId;
        const codes = [p.primaryCode, ...p.secondaryCodes].filter(Boolean).join(', ');
        return (
          <Card key={p.id} style={active ? { borderColor: theme.tint, borderWidth: 1.5 } : undefined}>
            <View style={{ flexDirection: 'row', gap: Spacing.three, alignItems: 'center' }}>
              <BranchSeal branch={p.branch} size={40} />
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontWeight: 700 }}>
                  {p.name}
                  {active ? ' · viewing' : ''}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {p.beneficiary === 'self' ? BRANCHES[p.branch].short : `${p.beneficiary === 'spouse' ? 'Spouse' : 'Child'} of ${BRANCHES[p.branch].short} member`}
                  {codes ? ` · ${codeTermFor(p.branch, p.rankCategory)} ${codes}` : ''} · {p.giBillTier}%
                </ThemedText>
                {p.separationDate ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {p.beneficiary === 'self' ? (p.separationType === 'retiring' ? 'Retires' : 'Separates') : 'Can start'} {formatDate(p.separationDate)}
                  </ThemedText>
                ) : null}
              </View>
            </View>
            <Row>
              {!active ? <Button title="View" variant="secondary" onPress={() => setActive(p.id)} /> : null}
              <Button title="Edit" variant="secondary" onPress={() => edit(p.id)} />
              {profiles.length > 1 ? <Button title="Remove" variant="danger" onPress={() => remove(p)} /> : null}
            </Row>
          </Card>
        );
      })}
      <SectionLabel>Add a beneficiary</SectionLabel>
      <Row>
        <Button title="+ Spouse" variant="secondary" onPress={() => add('spouse')} />
        <Button title="+ Child" variant="secondary" onPress={() => add('child')} />
      </Row>
      {!sponsor ? (
        <Button title="+ Service member / veteran" variant="ghost" onPress={() => add('self')} style={{ alignSelf: 'center' }} />
      ) : null}
    </Screen>
  );
}
