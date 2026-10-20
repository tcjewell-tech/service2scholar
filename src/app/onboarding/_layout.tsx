import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { useAccount } from '@/store';

export default function OnboardingLayout() {
  const draft = useAccount((s) => s.draft);
  const startDraft = useAccount((s) => s.startDraft);

  useEffect(() => {
    if (!draft) startDraft('self');
  }, [draft, startDraft]);

  if (!draft) return null;

  return (
    <Stack screenOptions={{ headerShadowVisible: false, title: '', headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ title: 'Set up your profile' }} />
    </Stack>
  );
}
