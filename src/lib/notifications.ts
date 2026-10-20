import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { data } from '@/data';
import { useAccount } from '@/store';

import { planReminders } from './reminders';
import { buildChecklist } from './timeline';

const CHANNEL_ID = 'reminders';
const SYNC_DEBOUNCE_MS = 800;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Checklist reminders',
      // eslint-disable-next-line import/namespace -- re-exported via `export *`; tsc resolves it
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** Replace every scheduled local notification with a fresh plan from current state. */
export async function syncReminders(): Promise<number> {
  const { profiles, done, notifications } = useAccount.getState();
  const items = profiles.flatMap((p) => buildChecklist(p, data));
  const plan = planReminders(items, done, notifications, new Date());

  await Notifications.cancelAllScheduledNotificationsAsync();
  if (plan.length === 0 || !(await ensurePermission())) return 0;

  for (const r of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: r.id,
      content: { title: r.title, body: r.body, data: { itemId: r.itemId, profileId: r.profileId } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.at, channelId: CHANNEL_ID },
    });
  }
  return plan.length;
}

/** Fire a test notification a few seconds from now (Settings → "Send test reminder"). */
export async function sendTestReminder(): Promise<boolean> {
  if (!(await ensurePermission())) return false;
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Service-to-Scholar', body: 'Reminders are working. You’ll hear from us before each deadline.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: CHANNEL_ID },
  });
  return true;
}

export const remindersSupported = true;

/** Re-plan reminders whenever profiles, completion or notification settings change. */
export function useReminderSync() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        syncReminders().catch((e) => console.warn('Reminder sync failed', e));
      }, SYNC_DEBOUNCE_MS);
    };
    const unsubscribe = useAccount.subscribe((state, prev) => {
      if (!state.hydrated) return;
      if (
        state.profiles !== prev.profiles ||
        state.done !== prev.done ||
        state.notifications !== prev.notifications ||
        state.hydrated !== prev.hydrated
      ) {
        schedule();
      }
    });
    if (useAccount.getState().hydrated) schedule();
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);
}
