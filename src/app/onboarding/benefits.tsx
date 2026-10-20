import { OnboardingFrame } from '@/components/onboarding-frame';
import { Chip, Choice, Notice, Row, SectionLabel } from '@/components/ui';
import { suggestedTier } from '@/lib/profile';
import { useAccount } from '@/store';

const TIERS = [50, 60, 70, 80, 90, 100];

export default function BenefitsStep() {
  const draft = useAccount((s) => s.draft)!;
  const updateDraft = useAccount((s) => s.updateDraft);
  const self = draft.beneficiary === 'self';
  const suggested = suggestedTier(draft.serviceMonths);

  return (
    <OnboardingFrame
      step="benefits"
      title="GI Bill benefits"
      subtitle="Your Post-9/11 GI Bill percentage drives every cost estimate.">
      <SectionLabel>Benefit level</SectionLabel>
      <Row>
        {TIERS.map((t) => (
          <Chip
            key={t}
            label={t === suggested ? `${t}% · suggested` : `${t}%`}
            selected={draft.giBillTier === t}
            onPress={() => updateDraft({ giBillTier: t })}
          />
        ))}
      </Row>
      <Notice>
        {draft.serviceMonths} months of service usually means {suggested}%. A Purple Heart or a service-connected discharge
        after 30+ days means 100%. Your Certificate of Eligibility shows the exact number.
      </Notice>

      {!self ? (
        <>
          <SectionLabel>Is the sponsor still on active duty?</SectionLabel>
          <Row>
            <Chip label="Yes" selected={draft.sponsorOnActiveDuty} onPress={() => updateDraft({ sponsorOnActiveDuty: true })} />
            <Chip label="No" selected={!draft.sponsorOnActiveDuty} onPress={() => updateDraft({ sponsorOnActiveDuty: false })} />
          </Row>
          {draft.beneficiary === 'spouse' && draft.sponsorOnActiveDuty ? (
            <Notice tone="warning">
              While the sponsor is on active duty, a spouse doesn’t get the housing allowance or Yellow Ribbon. Estimates
              will reflect that.
            </Notice>
          ) : null}
        </>
      ) : null}

      <SectionLabel>Degree level</SectionLabel>
      <Choice
        title="Bachelor’s"
        subtitle="Undergraduate degree programs"
        selected={draft.degreeLevel === 'bachelor'}
        onPress={() => updateDraft({ degreeLevel: 'bachelor' })}
      />
      <Choice
        title="Master’s"
        subtitle="Graduate degree programs"
        selected={draft.degreeLevel === 'master'}
        onPress={() => updateDraft({ degreeLevel: 'master' })}
      />

      <SectionLabel>Format</SectionLabel>
      <Row>
        <Chip label="Include online programs" selected={draft.includeOnline} onPress={() => updateDraft({ includeOnline: true })} />
        <Chip label="In-person only" selected={!draft.includeOnline} onPress={() => updateDraft({ includeOnline: false })} />
      </Row>
    </OnboardingFrame>
  );
}
