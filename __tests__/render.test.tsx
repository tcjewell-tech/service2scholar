import { act, type ReactElement } from 'react';
import { StyleSheet } from 'react-native';
// shortcut: uses the renderer jest-expo already installs instead of adding @testing-library/react-native;
// switch to that library (the one Expo's docs recommend) once tests need to type or do more than one plain press.
import { createRoot, type TestInstance } from 'test-renderer';

import ChecklistScreen from '@/app/(tabs)/checklist';
import MatchesScreen from '@/app/(tabs)/matches';
import ProgramScreen from '@/app/program/[key]';
import { SchoolCard } from '@/components/school-card';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { data } from '@/data';
import { useCostedMatches, type CostedMatch } from '@/hooks/use-plan';
import { isRelatedOnly, programKey, type MatchReason } from '@/lib/matching';
import { emptyProfile } from '@/lib/profile';
import { useAccount } from '@/store';

// No animated panel opens in these tests, so the animation library only has to load.
jest.mock('react-native-reanimated', () => {
  const preset = { duration: () => preset };
  return {
    __esModule: true,
    default: { View: jest.requireActual('react-native').View },
    FadeIn: preset,
    FadeInDown: preset,
    FadeOut: preset,
    ZoomIn: preset,
  };
});
let mockProgramKey = '';
jest.mock('expo-router', () => ({
  Link: ({ children }: { children: ReactElement }) => children,
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ key: mockProgramKey }),
}));
jest.mock('expo-web-browser', () => ({}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/components/profile-header', () => ({ ProfileHeader: () => null }));
jest.mock('@/lib/exportPdf', () => ({}));
// Matches gets hand-built programs; everything else in the module, including saved-program reconciliation, is real.
jest.mock('@/hooks/use-plan', () => ({ ...jest.requireActual('@/hooks/use-plan'), useCostedMatches: jest.fn(() => []) }));

// Unmounted after each test, so a later test's store update cannot re-render an earlier tree outside act().
const mounted: ReturnType<typeof createRoot>[] = [];
afterEach(() => act(() => mounted.splice(0).forEach((root) => root.unmount())));

async function render(element: ReactElement) {
  const root = createRoot();
  mounted.push(root);
  await act(async () => root.render(element));
  return root.container;
}

const textOf = (node: TestInstance): string => node.children.map((c) => (typeof c === 'string' ? c : textOf(c))).join('');
const texts = (tree: TestInstance) => tree.queryAll((n) => n.type === 'Text').map(textOf);
const styleOf = (node: TestInstance) => StyleSheet.flatten(node.props.style) ?? {};
const notices = (tree: TestInstance) => tree.queryAll((n) => styleOf(n).borderLeftWidth === 3);

const WHY = 'Primary 17C (Cyber Operations Specialist) → Information Security Analysts';
const DIRECT: MatchReason = { source: 'direct', text: WHY };
const RELATED: MatchReason = { source: 'related', text: WHY };
const INTEREST: MatchReason = { source: 'interest', text: 'You picked this field' };

const program = (schoolId: string, fieldName: string, reasons: MatchReason[], school: object = {}) =>
  ({
    match: {
      key: `${schoolId}:${fieldName}:bachelor`,
      school: { id: schoolId, name: `School ${schoolId}`, city: 'Austin', state: 'TX', control: 'public', onlineOnly: false, ...school },
      cip: fieldName,
      fieldName,
      level: 'bachelor',
      score: 0.5,
      reasons,
    },
    cost: { tuitionOutOfPocket: 0, netCost: -20000, mha: 19000, books: 1000, yellowRibbonEligible: false },
  }) as unknown as CostedMatch;

/** Puts one profile in the real store and returns a reader for its saved programs. */
function seedProfile(savedProgramKeys: string[] = []) {
  const profile = { ...emptyProfile('self'), savedProgramKeys };
  useAccount.setState({ profiles: [profile], activeProfileId: profile.id });
  return () => useAccount.getState().profiles[0].savedProgramKeys;
}

async function renderMatches(costed: CostedMatch[]) {
  seedProfile();
  jest.mocked(useCostedMatches).mockReturnValue(costed);
  return render(<MatchesScreen />);
}

describe('ThemedText', () => {
  it('sets fixed-width digits on the figure role', async () => {
    const tree = await render(<ThemedText type="figure">$46,630</ThemedText>);
    const [text] = tree.queryAll((n) => n.type === 'Text');
    expect(styleOf(text)).toMatchObject({ fontVariant: ['tabular-nums'], fontWeight: 700, fontSize: 20 });
  });

  it('has a tag role, so tags need no inline sizes', async () => {
    const tree = await render(<ThemedText type="tag">Public</ThemedText>);
    const [text] = tree.queryAll((n) => n.type === 'Text');
    expect(styleOf(text)).toMatchObject({ fontSize: 12, lineHeight: 16, fontWeight: 500 });
  });
});

describe('isRelatedOnly', () => {
  it('is true only when no direct reason backs the field', () => {
    expect(isRelatedOnly({ reasons: [RELATED] })).toBe(true);
    expect(isRelatedOnly({ reasons: [RELATED, INTEREST] })).toBe(false);
  });

  it('is false for a match with no reasons at all', () => {
    expect(isRelatedOnly({ reasons: [] })).toBe(false);
  });
});

describe('SchoolCard', () => {
  it('does not tag a related field that another reason also backs', async () => {
    const seen = texts(await render(<SchoolCard programs={[program('a', 'Information Technology', [RELATED, INTEREST])]} savedKeys={[]} showWhy />));
    expect(seen).not.toContain('Related major');
    expect(seen).toContain(`Why: ${WHY} (+1 more)`);
  });

  it('tags a field that only the related fallback suggested', async () => {
    const seen = texts(await render(<SchoolCard programs={[program('a', 'Information Technology', [RELATED])]} savedKeys={[]} showWhy={false} />));
    expect(seen.filter((t) => t === 'Related major')).toHaveLength(1);
  });

  it('labels the sample graduation rate as an estimate', async () => {
    const card = program('a', 'Computer Science', [DIRECT], { veteranGradRate: 0.618 });
    expect(texts(await render(<SchoolCard programs={[card]} savedKeys={[]} showWhy />))).toContain('~62% grad rate (est.)');
  });
});

describe('Matches screen', () => {
  it('groups programs by school and tags a related-major row when each row shows its reason', async () => {
    const seen = texts(
      await renderMatches([
        program('a', 'Computer Science', [DIRECT]),
        program('a', 'Information Technology', [RELATED]),
        program('b', 'Computer Science', [INTEREST]),
      ])
    );
    expect(seen).toContain('3 programs at 2 schools');
    expect(seen.filter((t) => t.startsWith('School '))).toEqual(['School a', 'School b']);
    expect(seen.filter((t) => t.startsWith('Why: '))).toHaveLength(3);
    expect(seen.filter((t) => t === 'Related major')).toHaveLength(1);
    expect(seen.some((t) => t.includes('“Related major” degrees sit in the same academic family as your military job.'))).toBe(true);
  });

  it('still tags related-major rows when the shared reason is stated once above the list', async () => {
    const seen = texts(await renderMatches([program('a', 'Computer Science', [RELATED]), program('b', 'Cybersecurity', [RELATED])]));
    expect(seen.some((t) => t.includes(`Matched on: ${WHY}`))).toBe(true);
    expect(seen.filter((t) => t.startsWith('Why: '))).toHaveLength(0);
    expect(seen.filter((t) => t === 'Related major')).toHaveLength(2);
  });

  it('adds no tag or explanation when every match is direct', async () => {
    const seen = texts(await renderMatches([program('a', 'Computer Science', [DIRECT])]));
    expect(seen.join(' ')).not.toContain('Related major');
  });

  it('shows the sample-data notice as information, not a warning', async () => {
    const tree = await renderMatches([program('a', 'Computer Science', [DIRECT])]);
    expect(notices(tree)).toHaveLength(1);
    expect(styleOf(notices(tree)[0]).borderLeftColor).toBe(Colors.light.tint);
    expect(textOf(notices(tree)[0])).toContain('Graduation rates are sample data');
  });
});

describe('Plan screen', () => {
  const school = data.schools[0];
  const listed = programKey(school.id, school.programs[0].cip, school.programs[0].levels[0]);
  const retired = ['closed-school:11.0701:bachelor', 'not-a-program-key'];

  it('warns about saved programs the catalog no longer lists, and removes them only when asked', async () => {
    const saved = seedProfile([listed, ...retired]);
    const tree = await render(<ChecklistScreen />);

    expect(notices(tree)).toHaveLength(1);
    expect(styleOf(notices(tree)[0]).borderLeftColor).toBe(Colors.light.warning);
    expect(textOf(notices(tree)[0])).toMatch(/\b2\b/);
    expect(saved()).toEqual([listed, ...retired]);

    // shortcut: Pressable answers a bare click event the way it answers a tap; see the note on the import above.
    const [clear] = tree.queryAll((n) => typeof n.props.onClick === 'function' && /remove/i.test(textOf(n)));
    await act(async () => clear.props.onClick({}));

    expect(saved()).toEqual([listed]);
    expect(notices(tree)).toHaveLength(0);
  });

  it('says nothing when every saved program is still listed', async () => {
    seedProfile([listed]);
    expect(notices(await render(<ChecklistScreen />))).toHaveLength(0);
  });

  it('names each retired program in the warning', async () => {
    seedProfile([`${school.id}:99.9999:master`]);
    expect(textOf(notices(await render(<ChecklistScreen />))[0])).toContain(`(master’s) at ${school.name}`);
  });
});

describe('Program screen', () => {
  const school = data.schools[0];
  const key = programKey(school.id, school.programs[0].cip, school.programs[0].levels[0]);
  const removeButtons = (tree: TestInstance) =>
    tree.queryAll((n) => typeof n.props.onClick === 'function' && /remove from plan/i.test(textOf(n)));

  it('lets a saved program that no longer matches be removed', async () => {
    mockProgramKey = key;
    // A profile with no job codes or interests matches nothing, so the saved program is not a current match.
    const saved = seedProfile([key]);
    const tree = await render(<ProgramScreen />);

    const [remove] = removeButtons(tree);
    await act(async () => remove.props.onClick({}));
    expect(saved()).toEqual([]);
    expect(removeButtons(tree)).toHaveLength(0);
  });

  it('offers no action for a program that is neither matched nor saved', async () => {
    mockProgramKey = key;
    seedProfile([]);
    expect(removeButtons(await render(<ProgramScreen />))).toHaveLength(0);
  });
});
