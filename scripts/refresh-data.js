#!/usr/bin/env node
/**
 * Pulls real school figures from the VA GI Bill Comparison Tool (GIDS) and the Dept. of Education
 * College Scorecard, and writes src/data/live/gids.json, which src/data/index.ts lays over the seed.
 * Run: npm run refresh-data
 *
 * GIDS needs no key. Scorecard works with api.data.gov's shared DEMO_KEY (about 10 requests an hour;
 * a refresh makes one). If that is ever throttled, get a free key at https://api.data.gov/signup/
 * and set it in your shell as SCORECARD_API_KEY. Never commit a key.
 */
const fs = require('fs');
const path = require('path');

const API = 'https://www.va.gov/gids/v0/institutions/';
const SCORECARD = 'https://api.data.gov/ed/collegescorecard/v1/schools';
const OUT = path.join(__dirname, '..', 'src', 'data', 'live', 'gids.json');

/**
 * Seed school id -> VA facility code.
 * keepTuition: GIDS reports the parent campus's on-campus price for these online divisions, so its
 * tuition is ignored. unitid: their own College Scorecard (IPEDS) id, instead of the parent's.
 */
const FACILITIES = {
  syracuse: { code: '31879132' },
  usc: { code: '31505105' },
  georgetown: { code: '31405209' },
  'columbia-gs': { code: '31937132' },
  gwu: { code: '31907109' },
  norwich: { code: '31801045' },
  'erau-db': { code: '31806110' },
  'erau-ww': { code: '31806810', keepTuition: true, unitid: '426314' },
  hpu: { code: '31712164' },
  snhu: { code: '31805629' },
  excelsior: { code: '31905132' },
  tamu: { code: '11028943' },
  asu: { code: '11905103' },
  'asu-online': { code: '11905103', keepTuition: true, unitid: '483124' },
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

/** Scorecard credential levels we offer: 3 = bachelor's, 5 = master's. */
const CREDENTIAL = { 3: 'bachelor', 5: 'master' };

/** One Scorecard school record -> fresher tuition plus the 4-digit CIP families it awards per level. */
function mapScorecard(r) {
  const programs = { bachelor: [], master: [] };
  for (const p of r['latest.programs.cip_4_digit'] ?? []) {
    const level = CREDENTIAL[p.credential?.level];
    if (level && !programs[level].includes(p.code)) programs[level].push(p.code);
  }
  const tuition = {};
  const inState = r['latest.cost.tuition.in_state'];
  const outOfState = r['latest.cost.tuition.out_of_state'];
  // Scorecard's figure is published tuition and fees together, a year or so newer than GIDS's.
  if (inState != null && outOfState != null) Object.assign(tuition, { tuitionInState: inState, tuitionOutOfState: outOfState, fees: 0 });
  return { tuition, programs };
}

async function fetchScorecard(unitids) {
  const key = process.env.SCORECARD_API_KEY || 'DEMO_KEY';
  const fields = 'id,latest.cost.tuition.in_state,latest.cost.tuition.out_of_state,latest.programs.cip_4_digit.code,latest.programs.cip_4_digit.credential.level';
  const res = await fetch(`${SCORECARD}?id=${unitids.join(',')}&fields=${fields}&per_page=100`, { headers: { 'X-Api-Key': key } });
  if (!res.ok) throw new Error(`College Scorecard returned HTTP ${res.status}${res.status === 429 ? ' (rate limit: wait an hour or set SCORECARD_API_KEY)' : ''}`);
  return Object.fromEntries((await res.json()).results.map((r) => [String(r.id), mapScorecard(r)]));
}

async function main() {
  const schools = {};
  const mhaByZip = {};
  const unitidOf = {};
  for (const [id, { code, keepTuition, unitid }] of Object.entries(FACILITIES)) {
    const res = await fetch(API + code, { headers: { 'User-Agent': 'data-refresh-script' } });
    if (!res.ok) throw new Error(`${id}: GIDS returned HTTP ${res.status} for facility ${code}`);
    const attrs = (await res.json()).data.attributes;
    const { school, mhaMonthly } = mapInstitution(attrs, { keepTuition });
    schools[id] = school;
    unitidOf[id] = unitid ?? attrs.cross;
    if (mhaMonthly != null) mhaByZip[school.zip] = mhaMonthly;
    console.log(`${id.padEnd(12)} <- ${attrs.name}`);
  }
  const scorecard = await fetchScorecard([...new Set(Object.values(unitidOf).filter(Boolean))]);
  const programs = {};
  for (const [id, unitid] of Object.entries(unitidOf)) {
    const sc = scorecard[unitid];
    if (!sc) {
      console.warn(`${id}: no College Scorecard record for unit ${unitid}; keeping seed programs`);
      continue;
    }
    Object.assign(schools[id], sc.tuition);
    programs[id] = sc.programs;
  }
  const snapshot = {
    source: 'VA GI Bill Comparison Tool + College Scorecard',
    fetchedAt: new Date().toISOString().slice(0, 10),
    schools,
    mhaByZip,
    programs,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`Wrote ${Object.keys(schools).length} schools to ${path.relative(process.cwd(), OUT)}`);
}

module.exports = { mapInstitution, mapScorecard };

if (require.main === module) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
