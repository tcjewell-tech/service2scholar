import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { BRANCHES, codeTermFor } from '@/lib/profile';
import { useAccount, useActiveProfile } from '@/store';

import { BranchSeal } from './branch-seal';
import { ThemedText } from './themed-text';
import { Chip, Row } from './ui';

/** Active profile summary plus a switcher when the account has several beneficiaries. */
export function ProfileHeader() {
  const profile = useActiveProfile();
  const profiles = useAccount((s) => s.profiles);
  const setActive = useAccount((s) => s.setActive);
  if (!profile) return null;

  const codes = [profile.primaryCode, ...profile.secondaryCodes].filter(Boolean).join(', ');
  const detail =
    profile.beneficiary === 'self'
      ? `${BRANCHES[profile.branch].short}${codes ? ` · ${codeTermFor(profile.branch, profile.rankCategory)} ${codes}` : ''}`
      : `${profile.beneficiary === 'spouse' ? 'Spouse' : 'Child'} · ${BRANCHES[profile.branch].short} sponsor`;

  return (
    <View style={{ gap: Spacing.two }}>
      <View style={styles.row}>
        <BranchSeal branch={profile.branch} size={44} />
        <View style={{ flex: 1 }}>
          <ThemedText type="title">{profile.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {detail} · {profile.giBillTier}% GI Bill · {profile.degreeLevel === 'bachelor' ? 'Bachelor’s' : 'Master’s'}
          </ThemedText>
        </View>
      </View>
      {profiles.length > 1 ? (
        <Row>
          {profiles.map((p) => (
            <Chip key={p.id} label={p.name} selected={p.id === profile.id} onPress={() => setActive(p.id)} />
          ))}
        </Row>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
});
