import type { DataRepository } from '@/data';

import { addDays, parseIso } from './dates';
import { parseProgramKey } from './matching';
import type { Profile } from './profile';

export type ChecklistCategory =
  | 'application'
  | 'yellowRibbon'
  | 'scholarship'
  | 'fafsa'
  | 'vaAppointment'
  | 'documents';

export const CATEGORY_LABEL: Record<ChecklistCategory, string> = {
  application: 'Applications & benefits',
  yellowRibbon: 'Yellow Ribbon windows',
  scholarship: 'Scholarship deadlines',
  fafsa: 'FAFSA',
  vaAppointment: 'VA appointments',
  documents: 'Document requests',
};

export interface ChecklistItem {
  id: string;
  profileId: string;
  title: string;
  detail: string;
  category: ChecklistCategory;
  /** ISO date YYYY-MM-DD */
  dueDate: string;
  url?: string;
}

const FALL = '08-20';
const SPRING = '01-10';
/** Minimum runway between separation and the first class. */
const RUNWAY_DAYS = 45;

/** First fall or spring term that starts at least RUNWAY_DAYS after separation. */
export function targetTermStart(separationDate: string): string {
  const earliest = addDays(separationDate, RUNWAY_DAYS);
  const year = parseIso(separationDate).getFullYear();
  const candidates = [year, year + 1, year + 2].flatMap((y) => [`${y}-${SPRING}`, `${y}-${FALL}`]);
  return candidates.find((c) => c >= earliest)!;
}

/** Latest yearly occurrence of MM-DD that falls on or before `notAfter`. */
function lastOccurrence(mmdd: string, notAfter: string): string {
  let year = parseIso(notAfter).getFullYear();
  let candidate = `${year}-${mmdd}`;
  while (candidate > notAfter) {
    year -= 1;
    candidate = `${year}-${mmdd}`;
  }
  return candidate;
}

/** Personalized, date-aware checklist for one profile (spec §8). */
export function buildChecklist(profile: Profile, repo: DataRepository): ChecklistItem[] {
  if (!profile.separationDate) return [];
  const pid = profile.id;
  const sep = profile.separationDate;
  const term = targetTermStart(sep);
  const termDate = parseIso(term);
  const items: ChecklistItem[] = [];
  const isSelf = profile.beneficiary === 'self';

  if (isSelf) {
    const usesCcaf = profile.branch === 'airforce' || profile.branch === 'spaceforce';
    items.push({
      id: `${pid}:jst`,
      profileId: pid,
      category: 'documents',
      title: usesCcaf ? 'Request your CCAF transcript' : 'Request your Joint Services Transcript (JST)',
      detail: 'Schools use it to award college credit for your military training. Request it now so it’s ready for applications.',
      dueDate: addDays(sep, -180),
      url: usesCcaf ? 'https://www.airuniversity.af.edu/Barnes/CCAF/' : 'https://jst.doded.mil',
    });
    items.push({
      id: `${pid}:dd214`,
      profileId: pid,
      category: 'documents',
      title: 'Get certified copies of your DD-214',
      detail: 'Schools, VA and scholarship providers ask for it. Keep a few certified copies.',
      dueDate: addDays(sep, 14),
      url: 'https://www.archives.gov/veterans/military-service-records',
    });
  }

  items.push({
    id: `${pid}:coe`,
    profileId: pid,
    category: 'application',
    title: isSelf
      ? 'Apply for GI Bill benefits (VA Form 22-1990)'
      : 'Apply for transferred GI Bill benefits (VA Form 22-1990E)',
    detail: 'VA sends a Certificate of Eligibility (COE). Your school needs it to certify your enrollment. Allow about 30 days.',
    dueDate: addDays(term, -90),
    url: 'https://www.va.gov/education/how-to-apply/',
  });

  // The academic year containing the term starts in the fall; FAFSA for it opens Oct 1 the year before.
  const ayStart = termDate.getMonth() >= 7 ? termDate.getFullYear() : termDate.getFullYear() - 1;
  items.push({
    id: `${pid}:fafsa`,
    profileId: pid,
    category: 'fafsa',
    title: `Submit the ${ayStart}–${String(ayStart + 1).slice(2)} FAFSA`,
    detail: `Opens Oct 1, ${ayStart - 1}. Pell Grants stack on top of the GI Bill, and some aid runs out, so file early.`,
    dueDate: `${ayStart - 1}-10-15`,
    url: 'https://studentaid.gov/h/apply-for-aid/fafsa',
  });

  const latestDeadline = addDays(term, -30);
  const seenSchools = new Set<string>();
  for (const key of profile.savedProgramKeys) {
    const { schoolId } = parseProgramKey(key);
    if (seenSchools.has(schoolId)) continue;
    seenSchools.add(schoolId);
    const school = repo.schools.find((s) => s.id === schoolId);
    if (!school) continue;

    const appDue = lastOccurrence(school.appDeadline, latestDeadline);
    items.push({
      id: `${pid}:app:${school.id}`,
      profileId: pid,
      category: 'application',
      title: `Apply to ${school.name}`,
      detail: `Application deadline for the term starting ${term}.`,
      dueDate: appDue,
      url: school.url,
    });
    items.push({
      id: `${pid}:transcripts:${school.id}`,
      profileId: pid,
      category: 'documents',
      title: `Send transcripts to ${school.name}`,
      detail: isSelf
        ? 'Send your JST/CCAF and any prior college transcripts.'
        : 'Send high school or prior college transcripts.',
      dueDate: addDays(appDue, -14),
      url: school.url,
    });

    const canUseYr =
      profile.giBillTier === 100 &&
      school.yellowRibbon.participates &&
      school.yellowRibbon.levels.includes(profile.degreeLevel) &&
      !(profile.beneficiary === 'spouse' && profile.sponsorOnActiveDuty);
    if (canUseYr) {
      items.push({
        id: `${pid}:yr:${school.id}`,
        profileId: pid,
        category: 'yellowRibbon',
        title: `Request a Yellow Ribbon slot at ${school.name}`,
        detail: 'Yellow Ribbon slots can be limited and first-come. Ask the School Certifying Official to confirm yours.',
        dueDate: addDays(term, -60),
        url: school.url,
      });
    }
  }

  for (const id of profile.plannedScholarshipIds) {
    const s = repo.scholarships.find((x) => x.id === id);
    if (!s) continue;
    items.push({
      id: `${pid}:sch:${s.id}`,
      profileId: pid,
      category: 'scholarship',
      title: `Apply: ${s.name}`,
      detail: `${s.provider}. About $${s.amount.toLocaleString('en-US')}. Check the provider’s page for this year’s deadline.`,
      dueDate: lastOccurrence(s.deadline, latestDeadline),
      url: s.url,
    });
  }

  for (const appt of profile.vaAppointments) {
    items.push({
      id: `${pid}:va:${appt.id}`,
      profileId: pid,
      category: 'vaAppointment',
      title: appt.title || 'VA appointment',
      detail: 'Logged VA appointment.',
      dueDate: appt.date,
    });
  }

  if (seenSchools.size > 0) {
    items.push({
      id: `${pid}:sco`,
      profileId: pid,
      category: 'application',
      title: 'Give your COE to the School Certifying Official and register for classes',
      detail: 'The SCO certifies your enrollment to VA, which starts tuition payments and the housing allowance.',
      dueDate: addDays(term, -30),
    });
  }

  return items.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id));
}

