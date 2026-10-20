import { parseIso } from './dates';
import type { ChecklistCategory, ChecklistItem } from './timeline';

export type ReminderChannel = 'push' | 'inApp' | 'email';

/** Notification preferences (spec §8.1). */
export interface NotificationSettings {
  enabled: boolean;
  /** Default lead times, in days before the due date. */
  leadDays: number[];
  categories: Record<ChecklistCategory, boolean>;
  /** Hour of day (0–23) reminders fire. */
  reminderHour: number;
  /** Quiet hours window; may wrap past midnight (e.g. 21 → 7). */
  quietStart: number;
  quietEnd: number;
  /** Per-profile switch; missing = enabled. */
  profileEnabled: Record<string, boolean>;
  /** Per-item lead-time overrides. */
  itemLeadDays: Record<string, number[]>;
  /** Per-item channel; missing = push. */
  itemChannel: Record<string, ReminderChannel>;
  escalateOverdue: boolean;
}

export interface PlannedReminder {
  id: string;
  itemId: string;
  profileId: string;
  title: string;
  body: string;
  at: Date;
  escalation: boolean;
}

/** iOS keeps at most 64 pending local notifications; stay under it. */
export const MAX_SCHEDULED = 60;
const ESCALATION_DAYS = [1, 3, 7];

export function defaultNotificationSettings(): NotificationSettings {
  return {
    enabled: true,
    leadDays: [30, 14, 7, 1],
    categories: {
      application: true,
      yellowRibbon: true,
      scholarship: true,
      fafsa: true,
      vaAppointment: true,
      documents: true,
    },
    reminderHour: 9,
    quietStart: 21,
    quietEnd: 7,
    profileEnabled: {},
    itemLeadDays: {},
    itemChannel: {},
    escalateOverdue: true,
  };
}

function inQuiet(hour: number, s: NotificationSettings): boolean {
  if (s.quietStart === s.quietEnd) return false;
  return s.quietStart < s.quietEnd
    ? hour >= s.quietStart && hour < s.quietEnd
    : hour >= s.quietStart || hour < s.quietEnd;
}

/** A local date at the reminder hour, pushed to the end of quiet hours if needed. */
function atReminderTime(day: Date, s: NotificationSettings): Date {
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate(), s.reminderHour, 0, 0, 0);
  if (inQuiet(s.reminderHour, s)) {
    // Quiet window that wraps midnight and starts before reminderHour → push to next morning.
    if (s.quietStart > s.quietEnd && s.reminderHour >= s.quietStart) d.setDate(d.getDate() + 1);
    d.setHours(s.quietEnd);
  }
  return d;
}

function offset(day: Date, days: number): Date {
  const d = new Date(day);
  d.setDate(d.getDate() + days);
  return d;
}

function whenLabel(lead: number): string {
  if (lead === 0) return 'due today';
  if (lead === 1) return 'due tomorrow';
  return `due in ${lead} days`;
}

/** Pure reminder schedule; `notifications.ts` hands the result to the OS. */
export function planReminders(
  items: ChecklistItem[],
  done: Record<string, boolean>,
  settings: NotificationSettings,
  now: Date
): PlannedReminder[] {
  if (!settings.enabled) return [];
  const out: PlannedReminder[] = [];

  for (const item of items) {
    if (done[item.id]) continue;
    if (settings.profileEnabled[item.profileId] === false) continue;
    if (!settings.categories[item.category]) continue;
    if ((settings.itemChannel[item.id] ?? 'push') !== 'push') continue;

    const due = parseIso(item.dueDate);
    const leads = [...new Set([...(settings.itemLeadDays[item.id] ?? settings.leadDays), 0])].sort((a, b) => b - a);

    for (const lead of leads) {
      const at = atReminderTime(offset(due, -lead), settings);
      if (at <= now) continue;
      out.push({
        id: `${item.id}@-${lead}`,
        itemId: item.id,
        profileId: item.profileId,
        title: item.title,
        body: `${whenLabel(lead)[0].toUpperCase()}${whenLabel(lead).slice(1)}. ${item.detail}`,
        at,
        escalation: false,
      });
    }

    const dueEnd = atReminderTime(due, settings);
    if (settings.escalateOverdue) {
      const escalations = ESCALATION_DAYS.map((n) => atReminderTime(offset(due, n), settings)).filter((at) => at > now);
      if (escalations.length === 0 && dueEnd <= now) {
        escalations.push(atReminderTime(offset(now, 1), settings));
      }
      for (const at of escalations) {
        out.push({
          id: `${item.id}@+${at.getTime()}`,
          itemId: item.id,
          profileId: item.profileId,
          title: `Overdue: ${item.title}`,
          body: 'This step is past due. Your transition timeline depends on it. Open your checklist to finish or reschedule it.',
          at,
          escalation: true,
        });
      }
    }
  }

  return out.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, MAX_SCHEDULED);
}
