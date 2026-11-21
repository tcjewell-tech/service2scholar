import { act, type ReactElement } from 'react';
import { StyleSheet } from 'react-native';
// shortcut: uses the renderer jest-expo already installs instead of adding @testing-library/react-native;
// switch to that library (the one Expo's docs recommend) once tests need to press or type.
import { createRoot, type TestInstance } from 'test-renderer';

import MatchesScreen from '@/app/(tabs)/matches';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useCostedMatches, type CostedMatch } from '@/hooks/use-plan';
import { isRelatedOnly } from '@/lib/matching';

// The Filters panel stays closed in these tests, so the animation library only has to load.
jest.mock('react-native-reanimated', () => {
  const preset = { duration: () => preset };
  return { __esModule: true, default: { View: jest.requireActual('react-native').View }, FadeInDown: preset, FadeOut: preset };
});
jest.mock('expo-router', () => ({ Link: ({ children }: { children: ReactElement }) => children }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('@/components/profile-header', () => ({ ProfileHeader: () => null }));
jest.mock('@/store', () => ({ useActiveProfile: () => ({ savedProgramKeys: [] }) }));
jest.mock('@/hooks/use-plan', () => ({ useCostedMatches: jest.fn() }));

async function render(element: ReactElement) {
  const root = createRoot();
  await act(async () => root.render(element));
  return root.container;
}

const textOf = (node: TestInstance): string => node.children.map((c) => (typeof c === 'string' ? c : textOf(c))).join('');
const texts = (tree: TestInstance) => tree.queryAll((n) => n.type === 'Text').map(textOf);
const styleOf = (node: TestInstance) => StyleSheet.flatten(node.props.style) ?? {};

const DIRECT = 'Primary 17C (Cyber Operations Specialist) → Information Security Analysts';
const RELATED = `${DIRECT} (related field)`;

const program = (schoolId: string, fieldName: string, reasons: string[]) =>
  ({
    match: {
      key: `${schoolId}:${fieldName}:bachelor`,
      school: { id: schoolId, name: `School ${schoolId}`, city: 'Austin', state: 'TX', control: 'public', onlineOnly: false },
      cip: fieldName,
      fieldName,
      level: 'bachelor',
      score: 0.5,
      reasons,
    },
    cost: { tuitionOutOfPocket: 0, netCost: -20000, mha: 19000, books: 1000, yellowRibbonEligible: false },
  }) as unknown as CostedMatch;

async function renderMatches(costed: CostedMatch[]) {
  jest.mocked(useCostedMatches).mockReturnValue(costed);
  return render(<MatchesScreen />);
}

describe('ThemedText', () => {
  it('sets fixed-width digits on the figure role', async () => {
    const tree = await render(<ThemedText type="figure">$46,630</ThemedText>);
    const [text] = tree.queryAll((n) => n.type === 'Text');
    expect(styleOf(text)).toMatchObject({ fontVariant: ['tabular-nums'], fontWeight: 700, fontSize: 20 });
  });
});

describe('isRelatedOnly', () => {
  it('is true only when no direct reason backs the field', () => {
    expect(isRelatedOnly({ reasons: [RELATED] })).toBe(true);
    expect(isRelatedOnly({ reasons: [RELATED, 'You picked this field'] })).toBe(false);
  });
});

describe('Matches screen', () => {
  it('groups programs by school and tags a related-field row when each row shows its reason', async () => {
    const seen = texts(
      await renderMatches([
        program('a', 'Computer Science', [DIRECT]),
        program('a', 'Information Technology', [RELATED]),
        program('b', 'Computer Science', ['You picked this field']),
      ])
    );
    expect(seen).toContain('3 programs at 2 schools');
    expect(seen.filter((t) => t.startsWith('School '))).toEqual(['School a', 'School b']);
    expect(seen.filter((t) => t.startsWith('Why: '))).toHaveLength(3);
    expect(seen.filter((t) => t === 'Related field')).toHaveLength(1);
    expect(seen.some((t) => t.includes('“Related field” marks a degree close to your job’s field'))).toBe(true);
  });

  it('still tags related-field rows when the shared reason is stated once above the list', async () => {
    const seen = texts(await renderMatches([program('a', 'Computer Science', [RELATED]), program('b', 'Cybersecurity', [RELATED])]));
    expect(seen.some((t) => t.includes(`Matched on: ${RELATED}`))).toBe(true);
    expect(seen.filter((t) => t.startsWith('Why: '))).toHaveLength(0);
    expect(seen.filter((t) => t === 'Related field')).toHaveLength(2);
  });

  it('adds no tag or explanation when every match is direct', async () => {
    const seen = texts(await renderMatches([program('a', 'Computer Science', [DIRECT])]));
    expect(seen.join(' ')).not.toContain('Related field');
  });

  it('shows the sample-data notice as a warning', async () => {
    const tree = await renderMatches([program('a', 'Computer Science', [DIRECT])]);
    const notice = tree.queryAll((n) => styleOf(n).borderLeftWidth === 3);
    expect(notice).toHaveLength(1);
    expect(styleOf(notice[0]).borderLeftColor).toBe(Colors.light.warning);
    expect(textOf(notice[0])).toContain('Graduation rates are sample data');
  });
});
