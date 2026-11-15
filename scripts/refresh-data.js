#!/usr/bin/env node
/**
 * Pulls real school figures from the VA GI Bill Comparison Tool (GIDS) and writes
 * src/data/live/gids.json, which src/data/index.ts lays over the bundled seed.
 * Public API, no key needed. Run: npm run refresh-data
 */
const fs = require('fs');
const path = require('path');

const API = 'https://www.va.gov/gids/v0/institutions/';
const OUT = path.join(__dirname, '..', 'src', 'data', 'live', 'gids.json');

/**
 * Seed school id -> VA facility code.
 * keepTuition: GIDS reports the parent campus's on-campus price for these online
 * divisions, so their tuition stays as the seed's sample figure.
 */
const FACILITIES = {
  syracuse: { code: '31879132' },
  usc: { code: '31505105' },
  georgetown: { code: '31405209' },
  'columbia-gs': { code: '31937132' },
  gwu: { code: '31907109' },
  norwich: { code: '31801045' },
  'erau-db': { code: '31806110' },
  'erau-ww': { code: '31806810', keepTuition: true },
  hpu: { code: '31712164' },
  snhu: { code: '31805629' },
  excelsior: { code: '31905132' },
  tamu: { code: '11028943' },
  asu: { code: '11905103' },
  'asu-online': { code: '11905103', keepTuition: true },
  umgc: { code: '11801720' },
  'psu-world': { code: '11970238' },
  purdue: { code: '11902614' },
  vt: { code: '11815146' },
  odu: { code: '11900146' },
  uncw: { code: '11006133' },
  uccs: { code: '11802706' },
  sdsu: { code: '11910105' },
  'uw-tacoma': { code: '11805247' },
  utsa: { code: '119G2143' },
  uopx: { code: '21907103' },
  ctu: { code: '21809106' },
  apus: { code: '21913148' },
};

const CONTROL = { PUBLIC: 'public', PRIVATE: 'private_nonprofit', 'FOR PROFIT': 'for_profit' };
const YR_LEVELS = { Undergraduate: ['bachelor'], Graduate: ['master'], All: ['bachelor', 'master'] };
/** VA writes "no cap" as a contribution of $99,999. */
const YR_UNLIMITED = 99999;

/** GIDS institution attributes -> the School fields we trust it for, plus the school's housing rate. */
function mapInstitution(a, { keepTuition = false } = {}) {
  const control = CONTROL[a.type];
  if (!control) throw new Error(`${a.name}: unexpected institution type "${a.type}" (wrong facility code?)`);

  const rows = (a.yellow_ribbon_programs ?? []).filter((p) => YR_LEVELS[p.degree_level]);
  const levels = ['bachelor', 'master'].filter((l) => rows.some((p) => YR_LEVELS[p.degree_level].includes(l)));
  // shortcut: one cap per degree level, the lowest across the school's divisions, so estimates never
  // overstate aid; upgrade to per-division caps when the app asks which college the user is applying to.
  const cap = (level) => {
    const amounts = rows.filter((p) => YR_LEVELS[p.degree_level].includes(level)).map((p) => Number(p.contribution_amount));
    const lowest = Math.min(...amounts);
    return lowest >= YR_UNLIMITED ? null : lowest;
  };
  const participates = Boolean(a.yr) && levels.length > 0;
  const maxByLevel = Object.fromEntries((participates ? levels : []).map((l) => [l, cap(l)]));
  const caps = Object.values(maxByLevel);

  const school = {
    zip: String(a.physical_zip ?? a.zip).slice(0, 5),
    control,
    yellowRibbon: {
      participates,
      maxPerStudent: caps.some((c) => c != null) ? Math.min(...caps.filter((c) => c != null)) : null,
      maxByLevel,
      levels: participates ? levels : [],
    },
  };
  // VA publishes a veteran graduation rate for few schools; without one the seed's sample figure stays.
  if (a.graduation_rate_veteran != null) school.veteranGradRate = a.graduation_rate_veteran;
  if (!keepTuition && a.tuition_in_state != null && a.tuition_out_of_state != null) {
    // GIDS tuition is the published tuition-and-fees figure, so fees are already inside it.
    school.tuitionInState = a.tuition_in_state;
    school.tuitionOutOfState = a.tuition_out_of_state;
    school.fees = 0;
  }
  // dod_bah is the rate for anyone who started using the GI Bill on or after 2018-01-01.
  return { school, mhaMonthly: a.dod_bah ?? a.bah ?? null };
}

async function main() {
  const schools = {};
  const mhaByZip = {};
  for (const [id, { code, keepTuition }] of Object.entries(FACILITIES)) {
    const res = await fetch(API + code, { headers: { 'User-Agent': 'data-refresh-script' } });
    if (!res.ok) throw new Error(`${id}: GIDS returned HTTP ${res.status} for facility ${code}`);
    const attrs = (await res.json()).data.attributes;
    const { school, mhaMonthly } = mapInstitution(attrs, { keepTuition });
    schools[id] = school;
    if (mhaMonthly != null) mhaByZip[school.zip] = mhaMonthly;
    console.log(`${id.padEnd(12)} <- ${attrs.name}`);
  }
  const snapshot = { source: 'VA GI Bill Comparison Tool', fetchedAt: new Date().toISOString().slice(0, 10), schools, mhaByZip };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`Wrote ${Object.keys(schools).length} schools to ${path.relative(process.cwd(), OUT)}`);
}

module.exports = { mapInstitution };

if (require.main === module) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
