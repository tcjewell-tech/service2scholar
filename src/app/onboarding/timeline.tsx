import { useState } from 'react';
import { View } from 'react-native';

import { OnboardingFrame } from '@/components/onboarding-frame';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chip, Field, Row, SectionLabel } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { formatDate, isValidIso } from '@/lib/dates';
import { newId } from '@/lib/profile';
import { useAccount } from '@/store';

const VA_RATINGS = [null, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;

export default function TimelineStep() {
  const draft = useAccount((s) => s.draft)!;
  const updateDraft = useAccount((s) => s.updateDraft);
  const self = draft.beneficiary === 'self';
  const [apptTitle, setApptTitle] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [months, setMonths] = useState(String(draft.serviceMonths));

  const dateError = draft.separationDate && !isValidIso(draft.separationDate) ? 'Use YYYY-MM-DD' : undefined;
  const apptError = apptDate && !isValidIso(apptDate) ? 'Use YYYY-MM-DD' : undefined;

  const addAppt = () => {
    updateDraft({
      vaAppointments: [...draft.vaAppointments, { id: newId(), title: apptTitle.trim() || 'VA appointment', date: apptDate }],
    });
    setApptTitle('');
    setApptDate('');
  };

  return (
    <OnboardingFrame
      step="timeline"
      title={self ? 'Your timeline' : 'Timeline'}
      subtitle="These dates anchor the checklist and reminders."
      canContinue={isValidIso(draft.separationDate) && Number(months) >= 0}>
      {self ? (
        <>
          <SectionLabel>Status</SectionLabel>
          <Row>
            <Chip label="Separating" selected={draft.separationType === 'separating'} onPress={() => updateDraft({ separationType: 'separating' })} />
            <Chip label="Retiring" selected={draft.separationType === 'retiring'} onPress={() => updateDraft({ separationType: 'retiring' })} />
          </Row>
        </>
      ) : null}
      <Field
        label={self ? `${draft.separationType === 'retiring' ? 'Retirement' : 'Separation'} date` : 'Earliest date they could start school'}
        hint={self ? 'Already out? Use your separation date or today.' : 'Their first term starts at least 45 days after this date.'}
        error={dateError}
        value={draft.separationDate}
        onChangeText={(separationDate) => updateDraft({ separationDate: separationDate.trim() })}
        placeholder="YYYY-MM-DD"
        inputMode="numeric"
        maxLength={10}
      />
      <Field
        label={self ? 'Months of active duty since 9/11' : 'Sponsor’s months of active duty since 9/11'}
        hint="Sets the suggested GI Bill benefit level on the next screen."
        value={months}
        onChangeText={(t) => {
          setMonths(t);
          const n = parseInt(t, 10);
          if (!Number.isNaN(n)) updateDraft({ serviceMonths: n });
        }}
        inputMode="numeric"
        maxLength={3}
      />
      <SectionLabel>{self ? 'VA disability rating' : 'Sponsor’s VA disability rating'}</SectionLabel>
      <Row>
        {VA_RATINGS.map((r) => (
          <Chip
            key={String(r)}
            label={r == null ? 'None' : `${r}%`}
            selected={draft.vaRating === r}
            onPress={() => updateDraft({ vaRating: r })}
          />
        ))}
      </Row>

      <SectionLabel>VA appointments</SectionLabel>
      {draft.vaAppointments.map((a) => (
        <Card key={a.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontWeight: 700 }}>{a.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatDate(a.date)}
            </ThemedText>
          </View>
          <Button
            title="Remove"
            variant="danger"
            onPress={() => updateDraft({ vaAppointments: draft.vaAppointments.filter((x) => x.id !== a.id) })}
          />
        </Card>
      ))}
      <View style={{ gap: Spacing.two }}>
        <Field label="Appointment" value={apptTitle} onChangeText={setApptTitle} placeholder="e.g. C&P exam" />
        <Field label="Date" value={apptDate} onChangeText={(t) => setApptDate(t.trim())} placeholder="YYYY-MM-DD" error={apptError} maxLength={10} />
        <Button title="Add appointment" variant="secondary" onPress={addAppt} disabled={!isValidIso(apptDate)} />
      </View>
    </OnboardingFrame>
  );
}
