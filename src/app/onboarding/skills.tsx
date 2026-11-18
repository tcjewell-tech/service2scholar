import { OnboardingFrame } from '@/components/onboarding-frame';
import { Chip, Field, Row, SectionLabel } from '@/components/ui';
import { useData } from '@/data';
import { useAccount } from '@/store';

export default function SkillsStep() {
  const draft = useAccount((s) => s.draft)!;
  const updateDraft = useAccount((s) => s.updateDraft);
  const data = useData();
  const self = draft.beneficiary === 'self';

  const toggleInterest = (cip: string) =>
    updateDraft({
      interests: draft.interests.includes(cip) ? draft.interests.filter((c) => c !== cip) : [...draft.interests, cip],
    });

  return (
    <OnboardingFrame
      step="skills"
      title={self ? 'What else are you good at?' : 'What do they want to study?'}
      subtitle={
        self
          ? 'Knowledge, skills, behaviors and preferences (KSBP). Include things you taught yourself off duty. They widen your matches beyond your job code.'
          : 'Pick fields of interest and describe skills or goals. Both shape the matches.'
      }
      canContinue={self || draft.interests.length > 0 || draft.ksbp.trim().length > 0}>
      <Field
        label="Skills & interests"
        value={draft.ksbp}
        onChangeText={(ksbp) => updateDraft({ ksbp })}
        placeholder={
          self
            ? 'e.g. I build Python apps and LLM projects, edit video for a YouTube channel, and mentor junior soldiers'
            : 'e.g. loves biology, volunteers as an EMT, wants to work in healthcare'
        }
        multiline
      />
      <SectionLabel>{self ? 'Fields you’re curious about (optional)' : 'Fields of interest'}</SectionLabel>
      <Row>
        {data.cipFields.map((f) => (
          <Chip
            key={f.cip}
            label={f.name}
            selected={draft.interests.includes(f.cip)}
            onPress={() => toggleInterest(f.cip)}
          />
        ))}
      </Row>
    </OnboardingFrame>
  );
}
