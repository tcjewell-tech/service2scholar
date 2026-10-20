import * as WebBrowser from 'expo-web-browser';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ProfileHeader } from '@/components/profile-header';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chip, Notice, Row, Screen, SectionLabel } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useChecklist, useCostedMatches } from '@/hooks/use-plan';
import { useTheme } from '@/hooks/use-theme';
import { addDays, formatDate, formatMonth, todayIso } from '@/lib/dates';
import { checklistHtml, sharePlan } from '@/lib/exportPdf';
import type { ReminderChannel } from '@/lib/reminders';
import { CATEGORY_LABEL, targetTermStart, type ChecklistItem } from '@/lib/timeline';
import { useAccount, useActiveProfile } from '@/store';

const LEAD_OPTIONS = [30, 14, 7, 3, 1];
const UPCOMING_DAYS = 14;

export default function ChecklistScreen() {
  const profile = useActiveProfile();
  const items = useChecklist(profile);
  const costed = useCostedMatches(profile);
  const done = useAccount((s) => s.done);
  const [showDone, setShowDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const today = todayIso();

  const months = useMemo(() => {
    const groups = new Map<string, ChecklistItem[]>();
    for (const i of items) {
      if (!showDone && done[i.id]) continue;
      const key = i.dueDate.slice(0, 7);
      groups.set(key, [...(groups.get(key) ?? []), i]);
    }
    return [...groups.entries()];
  }, [items, done, showDone]);

  if (!profile) return null;

  const open = items.filter((i) => !done[i.id]);
  const overdue = open.filter((i) => i.dueDate < today);
  const soon = open.filter((i) => i.dueDate >= today && i.dueDate <= addDays(today, UPCOMING_DAYS));
  const completed = items.length - open.length;

  const exportPlan = async () => {
    setBusy(true);
    try {
      const saved = costed.filter((c) => profile.savedProgramKeys.includes(c.match.key));
      await sharePlan(checklistHtml(profile, items, done, saved));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ProfileHeader />
      {items.length === 0 ? (
        <Card>
          <ThemedText>Add a separation date in Profiles to build your timeline.</ThemedText>
        </Card>
      ) : (
        <>
          <Card>
            <ThemedText type="small" themeColor="textSecondary">
              Target first term
            </ThemedText>
            <ThemedText style={{ fontWeight: 700, fontSize: 20 }}>{formatDate(targetTermStart(profile.separationDate))}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {completed} of {items.length} steps done
              {profile.savedProgramKeys.length === 0 ? ' · Add programs to your plan from Matches to get school deadlines' : ''}
            </ThemedText>
            <Button title={busy ? 'Preparing…' : 'Export or share as PDF'} variant="secondary" onPress={exportPlan} disabled={busy} />
          </Card>

          {overdue.length > 0 || soon.length > 0 ? (
            <Notice tone={overdue.length > 0 ? 'warning' : 'info'}>
              {overdue.length > 0 ? `${overdue.length} overdue. ` : ''}
              {soon.length > 0 ? `${soon.length} due in the next ${UPCOMING_DAYS} days: ${soon.map((i) => i.title).join('; ')}` : ''}
            </Notice>
          ) : null}

          <Row>
            <Chip label={showDone ? 'Hide completed' : `Show completed (${completed})`} selected={showDone} onPress={() => setShowDone(!showDone)} />
          </Row>

          {months.map(([month, list]) => (
            <View key={month} style={{ gap: Spacing.two }}>
              <SectionLabel>{formatMonth(`${month}-01`)}</SectionLabel>
              {list.map((item) => (
                <ChecklistRow key={item.id} item={item} today={today} />
              ))}
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}

function ChecklistRow({ item, today }: { item: ChecklistItem; today: string }) {
  const theme = useTheme();
  const isDone = useAccount((s) => !!s.done[item.id]);
  const setDone = useAccount((s) => s.setDone);
  const settings = useAccount((s) => s.notifications);
  const updateNotifications = useAccount((s) => s.updateNotifications);
  const [expanded, setExpanded] = useState(false);
  const overdue = !isDone && item.dueDate < today;
  const leads = settings.itemLeadDays[item.id];
  const channel = settings.itemChannel[item.id] ?? 'push';

  const setLeads = (value: number[] | undefined) => {
    const next = { ...settings.itemLeadDays };
    if (value) next[item.id] = value;
    else delete next[item.id];
    updateNotifications({ itemLeadDays: next });
  };
  const setChannel = (value: ReminderChannel) =>
    updateNotifications({ itemChannel: { ...settings.itemChannel, [item.id]: value } });

  return (
    <Card style={overdue ? { borderColor: theme.danger, borderWidth: 1 } : undefined}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isDone }}
          accessibilityLabel={`Mark ${item.title} ${isDone ? 'not done' : 'done'}`}
          onPress={() => setDone(item.id, !isDone)}
          hitSlop={10}
          style={[styles.check, { borderColor: isDone ? theme.success : theme.border, backgroundColor: isDone ? theme.success : 'transparent' }]}>
          {isDone ? <ThemedText style={{ color: theme.onTint, fontWeight: 800, lineHeight: 18 }}>✓</ThemedText> : null}
        </Pressable>
        <Pressable style={{ flex: 1, gap: 2 }} onPress={() => setExpanded(!expanded)}>
          <ThemedText style={{ fontWeight: 600, textDecorationLine: isDone ? 'line-through' : 'none', opacity: isDone ? 0.6 : 1 }}>
            {item.title}
          </ThemedText>
          <ThemedText type="small" style={{ color: overdue ? theme.danger : theme.textSecondary }}>
            {overdue ? 'Overdue · ' : ''}
            {formatDate(item.dueDate)} · {CATEGORY_LABEL[item.category]}
          </ThemedText>
        </Pressable>
      </View>
      {expanded ? (
        <View style={{ gap: Spacing.two, marginTop: Spacing.one }}>
          <ThemedText type="small">{item.detail}</ThemedText>
          {item.url ? (
            <Button title="Open link ↗" variant="ghost" onPress={() => WebBrowser.openBrowserAsync(item.url!)} style={{ alignSelf: 'flex-start' }} />
          ) : null}
          <ThemedText type="smallBold">Remind me</ThemedText>
          <Row>
            <Chip label="Default" selected={!leads} onPress={() => setLeads(undefined)} />
            {LEAD_OPTIONS.map((d) => {
              const on = !!leads?.includes(d);
              return (
                <Chip
                  key={d}
                  label={`${d}d before`}
                  selected={on}
                  onPress={() => {
                    const base = leads ?? [];
                    const next = on ? base.filter((x) => x !== d) : [...base, d];
                    setLeads(next.length ? next : undefined);
                  }}
                />
              );
            })}
          </Row>
          <ThemedText type="smallBold">Deliver as</ThemedText>
          <Row>
            <Chip label="Push" selected={channel === 'push'} onPress={() => setChannel('push')} />
            <Chip label="In-app only" selected={channel === 'inApp'} onPress={() => setChannel('inApp')} />
            <Chip label="Email" selected={channel === 'email'} onPress={() => setChannel('email')} />
          </Row>
          {channel === 'email' ? (
            <ThemedText type="small" themeColor="textSecondary">
              Email delivery arrives with account sign-in. Until then this item shows in-app only.
            </ThemedText>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  check: { width: 26, height: 26, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
