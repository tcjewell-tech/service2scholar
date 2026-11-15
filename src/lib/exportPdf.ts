import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { CostedMatch } from '@/hooks/use-plan';

import { formatUsd } from './costCalculator';
import { formatDate } from './dates';
import { BRANCHES, type Profile } from './profile';
import { CATEGORY_LABEL, type ChecklistItem } from './timeline';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function checklistHtml(
  profile: Profile,
  items: ChecklistItem[],
  done: Record<string, boolean>,
  saved: CostedMatch[]
): string {
  const rows = items
    .map(
      (i) => `<tr class="${done[i.id] ? 'done' : ''}">
        <td class="box">${done[i.id] ? '☑' : '☐'}</td>
        <td class="date">${esc(formatDate(i.dueDate))}</td>
        <td><strong>${esc(i.title)}</strong><br><span class="muted">${esc(CATEGORY_LABEL[i.category])} · ${esc(i.detail)}</span>${
          i.url ? `<br><span class="link">${esc(i.url)}</span>` : ''
        }</td>
      </tr>`
    )
    .join('');

  const programs = saved
    .map(
      ({ match, cost }) => `<tr>
        <td><strong>${esc(match.fieldName)}</strong><br><span class="muted">${esc(match.school.name)}</span></td>
        <td class="num">${formatUsd(cost.tuitionOutOfPocket)}</td>
        <td class="num">${formatUsd(cost.mha + cost.books)}</td>
        <td class="num">${cost.netCost < 0 ? `${formatUsd(-cost.netCost)} left over` : formatUsd(cost.netCost)}</td>
      </tr>`
    )
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8">
  <style>
    body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #14202E; padding: 24px; }
    h1 { font-size: 22px; margin: 0 0 4px; } h2 { font-size: 16px; margin: 24px 0 8px; }
    .muted { color: #5B6573; font-size: 12px; } .link { color: #1F3A5F; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; } td, th { padding: 8px 6px; border-bottom: 1px solid #DEDAD0; vertical-align: top; font-size: 13px; text-align: left; }
    .box { width: 18px; font-size: 16px; } .date { width: 96px; white-space: nowrap; } .num { text-align: right; white-space: nowrap; }
    tr.done td { color: #8A929C; } tr.done strong { text-decoration: line-through; }
    footer { margin-top: 24px; font-size: 11px; color: #5B6573; }
  </style></head><body>
  <h1>${esc(profile.name)}'s transition plan</h1>
  <div class="muted">${esc(BRANCHES[profile.branch].name)} · ${profile.giBillTier}% Post-9/11 GI Bill · generated ${esc(formatDate(new Date().toISOString().slice(0, 10)))}</div>
  ${saved.length ? `<h2>Programs in the plan (annual estimates)</h2>
  <table><tr><th>Program</th><th class="num">You pay school</th><th class="num">Paid to you</th><th class="num">Net</th></tr>${programs}</table>` : ''}
  <h2>Checklist</h2>
  <table>${rows}</table>
  <footer>Estimates use VA and College Scorecard school figures, sample scholarship amounts and 2026–27 VA rates. Confirm amounts with each school's certifying official and VA.</footer>
  </body></html>`;
}

/** Export as PDF and open the share sheet (native) or the print dialog (web). */
export async function sharePlan(html: string): Promise<void> {
  if (Platform.OS === 'web') {
    // expo-print on web prints the current page, so render the plan in its own window instead.
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Share your plan' });
  } else {
    await Print.printAsync({ uri });
  }
}
