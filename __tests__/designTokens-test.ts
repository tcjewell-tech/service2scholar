import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

import sidecar from '../.impeccable/design.json';

// theme.ts is the source of truth; these fail when DESIGN.md or its preview copy drifts from it.
// Typed by hand because the project does not install Node's type definitions.
const { readFileSync } = jest.requireActual<{ readFileSync(path: string, encoding: 'utf8'): string }>('fs');
const design = readFileSync('DESIGN.md', 'utf8');
const frontMatter = design.split('\n---')[0];

const section = (name: string) => frontMatter.split(`\n${name}:\n`)[1].split(/\n(?=\S)/)[0];
const sorted = (values: Iterable<string>) => [...new Set(values)].sort();
const themeColors = sorted([...Object.values(Colors.light), ...Object.values(Colors.dark)]);

describe('design tokens', () => {
  it('DESIGN.md lists exactly the colours in theme.ts', () => {
    expect(sorted(section('colors').match(/#[0-9A-F]{6}/g) ?? [])).toEqual(themeColors);
  });

  it('design.json lists exactly the colours in theme.ts', () => {
    const meta = Object.values(sidecar.extensions.colorMeta) as { canonical: string }[];
    expect(sorted(meta.map((c) => c.canonical))).toEqual(themeColors);
  });

  it('DESIGN.md has every spacing step and the content width', () => {
    for (const [name, px] of Object.entries(Spacing)) expect(section('spacing')).toContain(`${name}: "${px}px"`);
    expect(design).toContain(`capped at ${MaxContentWidth}px`);
    expect(sidecar.narrative.keyCharacteristics.join(' ')).toContain(`capped at ${MaxContentWidth}px`);
  });

  it('DESIGN.md and design.json name the same text roles', () => {
    const roles = section('typography').match(/^ {2}[a-z-]+(?=:)/gm)?.map((r) => r.trim());
    expect(sorted(Object.keys(sidecar.extensions.typographyMeta))).toEqual(sorted(roles ?? []));
  });
});
