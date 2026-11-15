import { OnboardingFrame } from '@/components/onboarding-frame';
import { Choice, Field, Notice } from '@/components/ui';
import type { Beneficiary } from '@/data';
import { useAccount } from '@/store';

const OPTIONS: { value: Beneficiary; title: string; subtitle: string }[] = [
  { value: 'self', title: 'Me', subtitle: 'I’m serving, separating, retiring, or a veteran' },
  { value: 'spouse', title: 'My spouse', subtitle: 'Using GI Bill benefits transferred by a service member' },
  { value: 'child', title: 'My child', subtitle: 'Using GI Bill benefits transferred by a parent' },
];

const DEFAULT_NAMES = ['Me', 'Spouse', 'Child'];

export default function WhoStep() {
  const draft = useAccount((s) => s.draft)!;
  const updateDraft = useAccount((s) => s.updateDraft);
  const isFirst = useAccount((s) => s.profiles.length === 0);

  return (
    <OnboardingFrame
      step="who"
      title="Who is this plan for?"
      subtitle="You can add more people to your account later. Each person gets their own matches and cost estimates."
      canContinue={draft.name.trim().length > 0}>
      {OPTIONS.map((o) => (
        <Choice
          key={o.value}
          title={o.title}
          subtitle={o.subtitle}
          selected={draft.beneficiary === o.value}
          onPress={() =>
            updateDraft({
              beneficiary: o.value,
              name: DEFAULT_NAMES.includes(draft.name) ? DEFAULT_NAMES[OPTIONS.indexOf(o)] : draft.name,
            })
          }
        />
      ))}
      <Field
        label="Profile name"
        value={draft.name}
        onChangeText={(name) => updateDraft({ name })}
        placeholder="e.g. Sam"
        autoCapitalize="words"
      />
      {isFirst ? (
        <Notice>
          This build stores your profile only on this device. Nothing is sent anywhere. School costs and degree fields come
          from the VA and the College Scorecard; scholarships are sample data for now.
        </Notice>
      ) : null}
    </OnboardingFrame>
  );
}
