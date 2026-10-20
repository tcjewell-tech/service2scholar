import { defaultNotificationSettings, planReminders } from '@/lib/reminders';
import type { ChecklistItem } from '@/lib/timeline';

const item = (overrides: Partial<ChecklistItem> = {}): ChecklistItem => ({
  id: 'p1:fafsa',
  profileId: 'p1',
  title: 'Submit FAFSA',
  detail: '',
  category: 'fafsa',
  dueDate: '2027-01-31',
  ...overrides,
});

const now = new Date(2027, 0, 1, 12, 0); // Jan 1 2027 noon local

describe('planReminders', () => {
  const settings = defaultNotificationSettings();

  it('schedules each lead time plus the due day at the reminder hour', () => {
    const r = planReminders([item()], {}, settings, now).filter((x) => !x.escalation);
    const days = r.map((x) => x.at.getDate() + '/' + (x.at.getMonth() + 1));
    // due Jan 31: 30d before = Jan 1 (09:00, already past noon → skipped), 14d = Jan 17, 7d = Jan 24, 1d = Jan 30, day-of = Jan 31
    expect(days).toEqual(['17/1', '24/1', '30/1', '31/1']);
    expect(r.every((x) => x.at.getHours() === settings.reminderHour)).toBe(true);
  });

  it('honours per-item lead-time overrides', () => {
    const s = { ...settings, itemLeadDays: { 'p1:fafsa': [3] } };
    const r = planReminders([item()], {}, s, now).filter((x) => !x.escalation);
    expect(r.map((x) => x.at.getDate())).toEqual([28, 31]);
  });

  it('skips completed items, disabled categories, disabled profiles and non-push channels', () => {
    expect(planReminders([item()], { 'p1:fafsa': true }, settings, now)).toEqual([]);
    expect(planReminders([item()], {}, { ...settings, categories: { ...settings.categories, fafsa: false } }, now)).toEqual([]);
    expect(planReminders([item()], {}, { ...settings, profileEnabled: { p1: false } }, now)).toEqual([]);
    expect(planReminders([item()], {}, { ...settings, itemChannel: { 'p1:fafsa': 'inApp' } }, now)).toEqual([]);
    expect(planReminders([item()], {}, { ...settings, enabled: false }, now)).toEqual([]);
  });

  it('pre-schedules escalations after the due date (cancelled when the item is marked done)', () => {
    const r = planReminders([item()], {}, settings, now).filter((x) => x.escalation);
    expect(r.map((x) => x.at.getDate() + '/' + (x.at.getMonth() + 1))).toEqual(['1/2', '3/2', '7/2']);
  });

  it('escalates overdue items instead of going silent', () => {
    const r = planReminders([item({ dueDate: '2026-12-31' })], {}, settings, now);
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((x) => x.escalation)).toBe(true);
    expect(r[0].title).toMatch(/overdue/i);
  });

  it('escalates long-overdue items with a next-morning nudge', () => {
    const r = planReminders([item({ dueDate: '2026-11-01' })], {}, settings, now);
    expect(r).toHaveLength(1);
    expect(r[0].at.getDate()).toBe(2);
  });

  it('moves reminders out of quiet hours', () => {
    const s = { ...settings, reminderHour: 22, quietStart: 21, quietEnd: 7 };
    const r = planReminders([item()], {}, s, now);
    expect(r.every((x) => x.at.getHours() === 7)).toBe(true);
  });

  it('caps the schedule so the OS limit is never hit', () => {
    const many = Array.from({ length: 40 }, (_, i) => item({ id: 'p1:x' + i, dueDate: '2027-06-01' }));
    expect(planReminders(many, {}, settings, now).length).toBeLessThanOrEqual(60);
  });
});
