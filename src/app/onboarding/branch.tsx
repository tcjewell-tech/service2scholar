import { BranchSeal } from '@/components/branch-seal';
import { OnboardingFrame } from '@/components/onboarding-frame';
import { Choice } from '@/components/ui';
import { BRANCH_ORDER, BRANCHES } from '@/lib/profile';
import { useAccount } from '@/store';

export default function BranchStep() {
  const draft = useAccount((s) => s.draft)!;
  const updateDraft = useAccount((s) => s.updateDraft);
  const self = draft.beneficiary === 'self';

  return (
    <OnboardingFrame
      step="branch"
      title={self ? 'Which branch did you serve in?' : 'Which branch is your sponsor in?'}
      subtitle={self ? 'This sets the job-code terms you’ll see next.' : 'The service member who transferred their GI Bill.'}>
      {BRANCH_ORDER.map((b) => (
        <Choice
          key={b}
          title={BRANCHES[b].name}
          selected={draft.branch === b}
          left={<BranchSeal branch={b} size={40} />}
          onPress={() => {
            if (b === draft.branch) return;
            // Job codes are branch-specific; clear them when the branch changes.
            updateDraft({ branch: b, primaryCode: null, secondaryCodes: [] });
          }}
        />
      ))}
    </OnboardingFrame>
  );
}
