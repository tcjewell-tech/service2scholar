import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Platform, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chip, Notice, Row, Screen, SectionLabel } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { schoolDataAsOf, useData } from '@/data';
import { useTheme } from '@/hooks/use-theme';
import { remindersSupported, sendTestReminder } from '@/lib/notifications';
import { CATEGORY_LABEL, type ChecklistCategory } from '@/lib/timeline';
import { useAccount } from '@/store';

const LEADS = [30, 14, 7, 3, 1];
const REMINDER_HOURS = [7, 9, 12, 18];
const QUIET_START = [20, 21, 22, 23];
const QUIET_END = [6, 7, 8, 9];

const hourLabel = (h: number) => `${((h + 11) % 12) + 1}${h < 12 ? 'am' : 'pm'}`;

function Toggle({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
      <View style={{ flex: 1 }}>
        <ThemedText>{label}</ThemedText>
        {hint ? (
          <ThemedText type="small" themeColor="textSecondary">
            {hint}
          </ThemedText>
        ) : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: theme.tint }} accessibilityLabel={label} />
    </View>
  );
}

export default function SettingsScreen() {
  const s = useAccount((st) => st.notifications);
  const update = useAccount((st) => st.updateNotifications);
  const profiles = useAccount((st) => st.profiles);
  const reset = useAccount((st) => st.reset);
  const data = useData();
  const [testMsg, setTestMsg] = useState<string | null>(null);

  const toggleLead = (d: number) => {
    const next = s.leadDays.includes(d) ? s.leadDays.filter((x) => x !== d) : [...s.leadDays, d].sort((a, b) => b - a);
    if (next.length) update({ leadDays: next });
  };

  const confirmReset = () => {
    const run = () => reset();
    if (Platform.OS === 'web') {
      if (window.confirm('Delete all profiles and progress on this device?')) run();
      return;
    }
    Alert.alert('Delete everything?', 'This removes all profiles and checklist progress from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: run },
    ]);
  };

  return (
    <Screen>
      <SectionLabel>Reminders</SectionLabel>
      <Card style={{ gap: Spacing.three }}>
        <Toggle label="Reminders on" value={s.enabled} onChange={(enabled) => update({ enabled })} />
        {!remindersSupported ? (
          <Notice>Push reminders work in the iPhone and Android app. On the web, check the Plan tab’s “coming up” list.</Notice>
        ) : null}
        <View style={{ gap: Spacing.two }}>
          <ThemedText type="smallBold">Default lead times</ThemedText>
          <Row>
            {LEADS.map((d) => (
              <Chip key={d} label={`${d} day${d > 1 ? 's' : ''}`} selected={s.leadDays.includes(d)} onPress={() => toggleLead(d)} />
            ))}
          </Row>
          <ThemedText type="small" themeColor="textSecondary">
            You’ll also get a reminder on the due date. Override any item from the Plan tab.
          </ThemedText>
        </View>
        <View style={{ gap: Spacing.two }}>
          <ThemedText type="smallBold">Send at</ThemedText>
          <Row>
            {REMINDER_HOURS.map((h) => (
              <Chip key={h} label={hourLabel(h)} selected={s.reminderHour === h} onPress={() => update({ reminderHour: h })} />
            ))}
          </Row>
        </View>
        <View style={{ gap: Spacing.two }}>
          <ThemedText type="smallBold">Quiet hours</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            From
          </ThemedText>
          <Row>
            {QUIET_START.map((h) => (
              <Chip key={h} label={hourLabel(h)} selected={s.quietStart === h} onPress={() => update({ quietStart: h })} />
            ))}
          </Row>
          <ThemedText type="small" themeColor="textSecondary">
            Until
          </ThemedText>
          <Row>
            {QUIET_END.map((h) => (
              <Chip key={h} label={hourLabel(h)} selected={s.quietEnd === h} onPress={() => update({ quietEnd: h })} />
            ))}
          </Row>
        </View>
        <Toggle
          label="Escalate overdue items"
          hint="Keep nudging 1, 3 and 7 days after a missed deadline."
          value={s.escalateOverdue}
          onChange={(escalateOverdue) => update({ escalateOverdue })}
        />
        {remindersSupported ? (
          <>
            <Button
              title="Send a test reminder"
              variant="secondary"
              onPress={async () => setTestMsg((await sendTestReminder()) ? 'Sent. It arrives in about 5 seconds.' : 'Notifications are blocked. Enable them in system settings.')}
            />
            {testMsg ? (
              <ThemedText type="small" themeColor="textSecondary">
                {testMsg}
              </ThemedText>
            ) : null}
          </>
        ) : null}
      </Card>

      <SectionLabel>Reminder types</SectionLabel>
      <Card style={{ gap: Spacing.three }}>
        {(Object.keys(CATEGORY_LABEL) as ChecklistCategory[]).map((c) => (
          <Toggle
            key={c}
            label={CATEGORY_LABEL[c]}
            value={s.categories[c]}
            onChange={(v) => update({ categories: { ...s.categories, [c]: v } })}
          />
        ))}
      </Card>

      {profiles.length > 1 ? (
        <>
          <SectionLabel>Remind me about</SectionLabel>
          <Card style={{ gap: Spacing.three }}>
            {profiles.map((p) => (
              <Toggle
                key={p.id}
                label={p.name}
                value={s.profileEnabled[p.id] !== false}
                onChange={(v) => update({ profileEnabled: { ...s.profileEnabled, [p.id]: v } })}
              />
            ))}
          </Card>
        </>
      ) : null}

      <SectionLabel>Support the app</SectionLabel>
      <Card>
        <ThemedText>Service-to-Scholar is free. If it helped your family, you can chip in to keep it that way.</ThemedText>
        <Button title="Donate (coming soon)" variant="secondary" disabled onPress={() => {}} />
      </Card>

      <SectionLabel>About the data</SectionLabel>
      <Card>
        <ThemedText type="small" themeColor="textSecondary">
          GI Bill rates for {data.rates.academicYear} (private school cap ${data.rates.privateTuitionCap.toLocaleString('en-US')},
          online housing ${data.rates.onlineMhaMonthly}/mo). Yellow Ribbon and housing rates come from the VA GI Bill Comparison Tool, and tuition and degree fields from
          the College Scorecard, as of {schoolDataAsOf}. Veteran graduation rates, application deadlines and scholarships are sample data.
        </ThemedText>
        {/* Credit wording required by O*NET's CC BY 4.0 licence (onetcenter.org/license.html); keep it intact. */}
        <ThemedText type="small" themeColor="textSecondary">
          Job codes and their links to civilian occupations and degree fields include information from the O*NET Resource Center by the
          U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the CC BY 4.0 license. O*NET® is a
          trademark of USDOL/ETA. Service-to-Scholar has modified all or some of this information. USDOL/ETA has not approved, endorsed,
          or tested these modifications.
        </ThemedText>
        <Button title="VA GI Bill Comparison Tool ↗" variant="ghost" onPress={() => WebBrowser.openBrowserAsync('https://www.va.gov/education/gi-bill-comparison-tool/')} style={{ alignSelf: 'flex-start' }} />
        <Button title="CC BY 4.0 license ↗" variant="ghost" onPress={() => WebBrowser.openBrowserAsync('https://creativecommons.org/licenses/by/4.0/')} style={{ alignSelf: 'flex-start' }} />
      </Card>

      <Button title="Delete all data on this device" variant="danger" onPress={confirmReset} style={{ alignSelf: 'center' }} />
    </Screen>
  );
}
