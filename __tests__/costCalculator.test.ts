import { seedRepository as repo, type School } from '@/data';
import { eligibleScholarships, estimateCost } from '@/lib/costCalculator';
import { emptyProfile, type Profile } from '@/lib/profile';

const rates = repo.rates;

function school(overrides: Partial<School>): School {
  return {
    id: 't', name: 'Test U', city: 'X', state: 'TX', zip: '77843',
    control: 'private_nonprofit', onlineOnly: false,
    tuitionInState: 50000, tuitionOutOfState: 50000, fees: 0,
    yellowRibbon: { participates: true, maxPerStudent: 5000, levels: ['bachelor', 'master'] },
    veteranGradRate: 0.7, appDeadline: '01-15', url: '', programs: [],
    ...overrides,
  };
}

function profile(overrides: Partial<Profile> = {}): Profile {
  return { ...emptyProfile('self'), ...overrides };
}

describe('estimateCost', () => {
  it('public school at 100%: full in-state tuition covered, nothing out of pocket', () => {
    const s = school({ control: 'public', tuitionInState: 12000, tuitionOutOfState: 40000, fees: 1000 });
    const c = estimateCost(profile(), s, 'bachelor', [], rates);
    expect(c.charged).toBe(13000);
    expect(c.giBillTuition).toBe(13000);
    expect(c.tuitionOutOfPocket).toBe(0);
  });

  it('private school at 60%: covers 60% of the capped amount, no Yellow Ribbon', () => {
    const c = estimateCost(profile({ giBillTier: 60 }), school({}), 'bachelor', [], rates);
    expect(c.giBillTuition).toBe(Math.round(rates.privateTuitionCap * 0.6));
    expect(c.yellowRibbonEligible).toBe(false);
    expect(c.yellowRibbon).toBe(0);
    expect(c.tuitionOutOfPocket).toBe(50000 - Math.round(rates.privateTuitionCap * 0.6));
  });

  it('Yellow Ribbon at 100%: school + VA match up to twice the school contribution', () => {
    const c = estimateCost(profile(), school({}), 'bachelor', [], rates);
    const gap = 50000 - Math.round(rates.privateTuitionCap);
    expect(c.yellowRibbonEligible).toBe(true);
    expect(c.yellowRibbon).toBe(Math.min(gap, 10000));
    expect(c.tuitionOutOfPocket).toBe(gap - 10000);
  });

  it('unlimited Yellow Ribbon closes the whole gap', () => {
    const s = school({ yellowRibbon: { participates: true, maxPerStudent: null, levels: ['bachelor'] } });
    const c = estimateCost(profile(), s, 'bachelor', [], rates);
    expect(c.tuitionOutOfPocket).toBe(0);
  });

  it('Yellow Ribbon is level-specific', () => {
    const s = school({ yellowRibbon: { participates: true, maxPerStudent: null, levels: ['bachelor'] } });
    const c = estimateCost(profile({ degreeLevel: 'master' }), s, 'master', [], rates);
    expect(c.yellowRibbonEligible).toBe(false);
  });

  it('spouse of an active-duty sponsor gets no housing allowance and no Yellow Ribbon', () => {
    const p = { ...emptyProfile('spouse'), sponsorOnActiveDuty: true };
    const c = estimateCost(p, school({}), 'bachelor', [], rates);
    expect(c.mha).toBe(0);
    expect(c.yellowRibbonEligible).toBe(false);
  });

  it('child of an active-duty sponsor still gets housing allowance', () => {
    const p = { ...emptyProfile('child'), sponsorOnActiveDuty: true };
    const c = estimateCost(p, school({}), 'bachelor', [], rates);
    expect(c.mha).toBeGreaterThan(0);
  });

  it('housing allowance uses the school ZIP rate × tier × 9 months', () => {
    const c = estimateCost(profile({ giBillTier: 80 }), school({ zip: '77843' }), 'bachelor', [], rates);
    expect(c.mha).toBe(Math.round(rates.mhaByZip['77843'] * 0.8) * 9);
  });

  it('online-only programs use the online housing rate', () => {
    const c = estimateCost(profile(), school({ onlineOnly: true }), 'bachelor', [], rates);
    expect(c.mha).toBe(rates.onlineMhaMonthly * 9);
  });

  it('books stipend scales with tier', () => {
    const c = estimateCost(profile({ giBillTier: 70 }), school({}), 'bachelor', [], rates);
    expect(c.books).toBe(700);
  });

  it('scholarships stack but never push tuition below zero', () => {
    const sch = repo.scholarships.filter((s) => s.id === 'tillman' || s.id === 'amvets');
    const c = estimateCost(profile({ giBillTier: 60 }), school({}), 'bachelor', sch, rates);
    expect(c.scholarships).toBe(14000);
    const cheap = school({ control: 'public', tuitionInState: 5000, fees: 0 });
    const c2 = estimateCost(profile({ giBillTier: 60 }), cheap, 'bachelor', sch, rates);
    expect(c2.scholarships).toBe(2000);
    expect(c2.tuitionOutOfPocket).toBe(0);
  });

  it('net cost = tuition out of pocket − housing − books, and every line has an explanation', () => {
    const c = estimateCost(profile({ giBillTier: 60 }), school({}), 'bachelor', [], rates);
    expect(c.netCost).toBe(c.tuitionOutOfPocket - c.mha - c.books);
    expect(c.lines.every((l) => l.explanation.length > 20)).toBe(true);
  });
});

describe('eligibleScholarships', () => {
  it('filters by beneficiary, branch, level and VA rating', () => {
    const marineChild = { ...emptyProfile('child'), branch: 'marines' as const };
    const ids = eligibleScholarships(marineChild, repo.scholarships).map((s) => s.id);
    expect(ids).toContain('mcsf');
    expect(ids).not.toContain('aer-ursano');
    expect(ids).not.toContain('folds-of-honor');
    expect(ids).not.toContain('amvets');

    const ratedChild = { ...marineChild, vaRating: 50 };
    expect(eligibleScholarships(ratedChild, repo.scholarships).map((s) => s.id)).toContain('folds-of-honor');
  });
});
