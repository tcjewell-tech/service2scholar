import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';

import type { Profile } from '@/lib/profile';
import { useAccount } from '@/store';

import { Button, Heading, Progress, Screen } from './ui';

export type OnboardingStep = 'who' | 'branch' | 'rank' | 'codes' | 'skills' | 'timeline' | 'benefits';

const ROUTES = {
  who: '/onboarding',
  branch: '/onboarding/branch',
  rank: '/onboarding/rank',
  codes: '/onboarding/codes',
  skills: '/onboarding/skills',
  timeline: '/onboarding/timeline',
  benefits: '/onboarding/benefits',
} as const satisfies Record<OnboardingStep, string>;

export function stepsFor(draft: Profile | null): OnboardingStep[] {
  return draft?.beneficiary === 'self' || !draft
    ? ['who', 'branch', 'rank', 'codes', 'skills', 'timeline', 'benefits']
    : ['who', 'branch', 'skills', 'timeline', 'benefits'];
}

export function OnboardingFrame({
  step,
  title,
  subtitle,
  canContinue = true,
  children,
}: {
  step: OnboardingStep;
  title: string;
  subtitle?: string;
  canContinue?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const draft = useAccount((s) => s.draft);
  const commitDraft = useAccount((s) => s.commitDraft);
  const steps = stepsFor(draft);
  const index = steps.indexOf(step);
  const isLast = index === steps.length - 1;

  const next = () => {
    if (isLast) {
      commitDraft();
      router.dismissTo('/matches');
      return;
    }
    router.push(ROUTES[steps[index + 1]]);
  };

  return (
    <Screen
      footer={
        <>
          {index > 0 ? <Button title="Back" variant="secondary" onPress={() => router.back()} /> : null}
          <Button title={isLast ? 'See my matches' : 'Continue'} onPress={next} disabled={!canContinue} />
        </>
      }>
      <Progress step={index + 1} total={steps.length} />
      <Heading sub={subtitle}>{title}</Heading>
      {children}
    </Screen>
  );
}
