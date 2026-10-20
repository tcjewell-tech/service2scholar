import { OnboardingFrame } from '@/components/onboarding-frame';
import { Choice } from '@/components/ui';
import type { RankCategory } from '@/data';
import { BRANCHES, codeTermFor, hasWarrantOfficers, RANK_LABEL } from '@/lib/profile';
import { useAccount } from '@/store';

export default function RankStep() {
  const draft = useAccount((s) => s.draft)!;
  const updateDraft = useAccount((s) => s.updateDraft);
  const options: RankCategory[] = hasWarrantOfficers(draft.branch)
    ? ['enlisted', 'warrant', 'officer']
    : ['enlisted', 'officer'];

  return (
    <OnboardingFrame
      step="rank"
      title="What was your rank category?"
      subtitle={`Each category uses a different code set in the ${BRANCHES[draft.branch].short}.`}>
      {options.map((r) => (
        <Choice
          key={r}
          title={RANK_LABEL[r]}
          subtitle={`You’ll pick your ${codeTermFor(draft.branch, r)}`}
          selected={draft.rankCategory === r}
          onPress={() => {
            if (r === draft.rankCategory) return;
            updateDraft({ rankCategory: r, primaryCode: null, secondaryCodes: [] });
          }}
        />
      ))}
    </OnboardingFrame>
  );
}
