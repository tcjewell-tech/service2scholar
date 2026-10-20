import { Image } from 'expo-image';

import type { Branch } from '@/data';
import { BRANCHES } from '@/lib/profile';

const SEALS: Record<Branch, number> = {
  army: require('@/assets/seals/army.png'),
  navy: require('@/assets/seals/navy.png'),
  airforce: require('@/assets/seals/airforce.png'),
  marines: require('@/assets/seals/marines.png'),
  coastguard: require('@/assets/seals/coastguard.png'),
  spaceforce: require('@/assets/seals/spaceforce.png'),
};

export function BranchSeal({ branch, size = 48 }: { branch: Branch; size?: number }) {
  return (
    <Image
      source={SEALS[branch]}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityLabel={`${BRANCHES[branch].name} seal`}
    />
  );
}
