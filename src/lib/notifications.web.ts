// Local notifications aren't available on web; the checklist's in-app "Coming up" list covers it.

export async function syncReminders(): Promise<number> {
  return 0;
}

export async function sendTestReminder(): Promise<boolean> {
  return false;
}

export const remindersSupported = false;

export function useReminderSync() {}
