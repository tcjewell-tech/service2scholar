import { Redirect } from 'expo-router';

import { useAccount } from '@/store';

export default function Index() {
  const hasProfiles = useAccount((s) => s.profiles.length > 0);
  return <Redirect href={hasProfiles ? '/matches' : '/onboarding'} />;
}
