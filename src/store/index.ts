import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { emptyProfile, type Profile } from '@/lib/profile';
import { defaultNotificationSettings, type NotificationSettings } from '@/lib/reminders';

interface AccountState {
  profiles: Profile[];
  activeProfileId: string | null;
  /** In-progress onboarding draft (new or edited profile). */
  draft: Profile | null;
  /** Checklist completion, keyed by item id (item ids are profile-scoped). */
  done: Record<string, boolean>;
  notifications: NotificationSettings;
  hydrated: boolean;

  startDraft: (beneficiary?: Profile['beneficiary'], copyFrom?: Profile) => void;
  editDraft: (profileId: string) => void;
  updateDraft: (patch: Partial<Profile>) => void;
  commitDraft: () => void;
  discardDraft: () => void;
  setActive: (profileId: string) => void;
  updateProfile: (profileId: string, patch: Partial<Profile>) => void;
  removeProfile: (profileId: string) => void;
  toggleSavedProgram: (profileId: string, key: string) => void;
  togglePlannedScholarship: (profileId: string, id: string) => void;
  setDone: (itemId: string, value: boolean) => void;
  updateNotifications: (patch: Partial<NotificationSettings>) => void;
  reset: () => void;
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export const useAccount = create<AccountState>()(
  persist(
    (set, get) => ({
      profiles: [],
      activeProfileId: null,
      draft: null,
      done: {},
      notifications: defaultNotificationSettings(),
      hydrated: false,

      startDraft: (beneficiary = 'self', copyFrom) => {
        const base = emptyProfile(beneficiary);
        // Dependents inherit the sponsor's service details so they don't re-enter them.
        const draft: Profile = copyFrom
          ? {
              ...base,
              branch: copyFrom.branch,
              rankCategory: copyFrom.rankCategory,
              serviceMonths: copyFrom.serviceMonths,
              vaRating: copyFrom.vaRating,
              separationDate: copyFrom.separationDate,
              separationType: copyFrom.separationType,
              giBillTier: copyFrom.giBillTier,
            }
          : base;
        set({ draft });
      },
      editDraft: (profileId) => {
        const p = get().profiles.find((x) => x.id === profileId);
        if (p) set({ draft: { ...p } });
      },
      updateDraft: (patch) => {
        const d = get().draft;
        if (d) set({ draft: { ...d, ...patch } });
      },
      commitDraft: () => {
        const { draft, profiles } = get();
        if (!draft) return;
        const exists = profiles.some((p) => p.id === draft.id);
        // The draft stays set: onboarding screens are still mounted while we navigate away.
        // startDraft/editDraft overwrite it next time.
        set({
          profiles: exists ? profiles.map((p) => (p.id === draft.id ? draft : p)) : [...profiles, draft],
          activeProfileId: draft.id,
        });
      },
      discardDraft: () => set({ draft: null }),
      setActive: (profileId) => set({ activeProfileId: profileId }),
      updateProfile: (profileId, patch) =>
        set({ profiles: get().profiles.map((p) => (p.id === profileId ? { ...p, ...patch } : p)) }),
      removeProfile: (profileId) => {
        const profiles = get().profiles.filter((p) => p.id !== profileId);
        const done = Object.fromEntries(
          Object.entries(get().done).filter(([k]) => !k.startsWith(profileId + ':'))
        );
        set({
          profiles,
          done,
          activeProfileId: get().activeProfileId === profileId ? profiles[0]?.id ?? null : get().activeProfileId,
        });
      },
      toggleSavedProgram: (profileId, key) => {
        const p = get().profiles.find((x) => x.id === profileId);
        if (p) get().updateProfile(profileId, { savedProgramKeys: toggle(p.savedProgramKeys, key) });
      },
      togglePlannedScholarship: (profileId, id) => {
        const p = get().profiles.find((x) => x.id === profileId);
        if (p) get().updateProfile(profileId, { plannedScholarshipIds: toggle(p.plannedScholarshipIds, id) });
      },
      setDone: (itemId, value) => set({ done: { ...get().done, [itemId]: value } }),
      updateNotifications: (patch) => set({ notifications: { ...get().notifications, ...patch } }),
      reset: () =>
        set({ profiles: [], activeProfileId: null, draft: null, done: {}, notifications: defaultNotificationSettings() }),
    }),
    {
      name: 'service-to-scholar/account',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated, ...rest }) => rest,
      onRehydrateStorage: () => () => useAccount.setState({ hydrated: true }),
    }
  )
);

export function useActiveProfile(): Profile | null {
  return useAccount((s) => s.profiles.find((p) => p.id === s.activeProfileId) ?? null);
}
