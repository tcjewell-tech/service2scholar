import type { DegreeLevel, Program, School } from '../types';

const B: DegreeLevel[] = ['bachelor'];
const BM: DegreeLevel[] = ['bachelor', 'master'];
const M: DegreeLevel[] = ['master'];

function progs(list: [cip: string, levels: DegreeLevel[]][]): Program[] {
  return list.map(([cip, levels]) => ({ cip, levels }));
}

/**
 * SAMPLE DATA — rounded approximations. Tuition, fees, Yellow Ribbon, control, ZIP, housing and
 * program lists are overridden with real VA and College Scorecard figures from live/gids.json
 * (npm run refresh-data); veteran graduation rates and deadlines here are still sample data.
 */
export const SCHOOLS: School[] = [
  {
    id: 'syracuse', name: 'Syracuse University', city: 'Syracuse', state: 'NY', zip: '13244',
    control: 'private_nonprofit', onlineOnly: false,
    tuitionInState: 64000, tuitionOutOfState: 64000, fees: 1900,
    yellowRibbon: { participates: true, maxPerStudent: null, levels: BM },
    veteranGradRate: 0.82, appDeadline: '01-05', url: 'https://www.syracuse.edu',
    programs: progs([
      ['11.0701', BM], ['11.1003', M], ['52.0201', BM], ['44.0401', M], ['45.0901', BM],
      ['45.1001', B], ['09.0702', BM], ['50.0602', B], ['52.0203', B], ['52.1001', M], ['30.7001', M],
    ]),
  },
  {
    id: 'usc', name: 'University of Southern California', city: 'Los Angeles', state: 'CA', zip: '90089',
    control: 'private_nonprofit', onlineOnly: false,
    tuitionInState: 69000, tuitionOutOfState: 69000, fees: 1500,
    yellowRibbon: { participates: true, maxPerStudent: null, levels: B },
    veteranGradRate: 0.85, appDeadline: '01-15', url: 'https://www.usc.edu',
    programs: progs([
      ['11.0701', BM], ['14.0201', BM], ['14.1001', BM], ['50.0602', BM], ['44.0701', M],
      ['52.0201', BM], ['44.0401', M], ['51.0701', M], ['42.0101', B],
    ]),
  },
  {
    id: 'georgetown', name: 'Georgetown University', city: 'Washington', state: 'DC', zip: '20057',
    control: 'private_nonprofit', onlineOnly: false,
    tuitionInState: 68000, tuitionOutOfState: 68000, fees: 700,
    yellowRibbon: { participates: true, maxPerStudent: null, levels: BM },
    veteranGradRate: 0.88, appDeadline: '01-10', url: 'https://www.georgetown.edu',
    programs: progs([
      ['45.0901', BM], ['45.1001', B], ['43.0301', M], ['52.0201', BM], ['51.3801', BM],
      ['51.0701', M], ['30.7001', M], ['16.0101', B],
    ]),
  },
  {
    id: 'columbia-gs', name: 'Columbia University – School of General Studies', city: 'New York', state: 'NY', zip: '10027',
    control: 'private_nonprofit', onlineOnly: false,
    tuitionInState: 68000, tuitionOutOfState: 68000, fees: 3000,
    yellowRibbon: { participates: true, maxPerStudent: null, levels: B },
    veteranGradRate: 0.9, appDeadline: '03-01', url: 'https://gs.columbia.edu',
    programs: progs([
      ['11.0701', B], ['45.1001', B], ['45.0901', B], ['42.0101', B], ['26.0101', B], ['30.7001', B],
    ]),
  },
  {
    id: 'gwu', name: 'The George Washington University', city: 'Washington', state: 'DC', zip: '20052',
    control: 'private_nonprofit', onlineOnly: false,
    tuitionInState: 66000, tuitionOutOfState: 66000, fees: 400,
    yellowRibbon: { participates: true, maxPerStudent: 20000, levels: BM },
    veteranGradRate: 0.8, appDeadline: '01-05', url: 'https://www.gwu.edu',
    programs: progs([
      ['44.0401', BM], ['45.0901', BM], ['11.1003', M], ['43.0302', M], ['51.2201', BM],
      ['52.0201', BM], ['52.1001', M],
    ]),
  },
  {
    id: 'norwich', name: 'Norwich University', city: 'Northfield', state: 'VT', zip: '05663',
    control: 'private_nonprofit', onlineOnly: false,
    tuitionInState: 45000, tuitionOutOfState: 45000, fees: 1500,
    yellowRibbon: { participates: true, maxPerStudent: 12000, levels: BM },
    veteranGradRate: 0.68, appDeadline: '05-01', url: 'https://www.norwich.edu',
    programs: progs([
      ['11.1003', BM], ['43.0104', B], ['43.0302', M], ['52.0213', BM], ['14.0801', B],
      ['45.0901', M], ['52.0201', M], ['51.3801', B],
    ]),
  },
  {
    id: 'erau-db', name: 'Embry-Riddle Aeronautical University – Daytona Beach', city: 'Daytona Beach', state: 'FL', zip: '32114',
    control: 'private_nonprofit', onlineOnly: false,
    tuitionInState: 42000, tuitionOutOfState: 42000, fees: 1600,
    yellowRibbon: { participates: true, maxPerStudent: 10000, levels: BM },
    veteranGradRate: 0.7, appDeadline: '03-01', url: 'https://daytonabeach.erau.edu',
    programs: progs([
      ['49.0101', BM], ['49.0104', B], ['14.0201', BM], ['40.0404', B], ['11.1003', BM], ['30.7001', B],
    ]),
  },
  {
    id: 'erau-ww', name: 'Embry-Riddle Aeronautical University – Worldwide (Online)', city: 'Daytona Beach', state: 'FL', zip: '32114',
    control: 'private_nonprofit', onlineOnly: true,
    tuitionInState: 14000, tuitionOutOfState: 14000, fees: 200,
    yellowRibbon: { participates: true, maxPerStudent: 3000, levels: BM },
    veteranGradRate: 0.55, appDeadline: '07-01', url: 'https://worldwide.erau.edu',
    programs: progs([
      ['49.0101', BM], ['49.0104', BM], ['52.0203', BM], ['11.1003', BM], ['43.0302', BM], ['52.0213', BM],
    ]),
  },
  {
    id: 'hpu', name: 'Hawaii Pacific University', city: 'Honolulu', state: 'HI', zip: '96813',
    control: 'private_nonprofit', onlineOnly: false,
    tuitionInState: 33000, tuitionOutOfState: 33000, fees: 300,
    yellowRibbon: { participates: true, maxPerStudent: 5000, levels: BM },
    veteranGradRate: 0.52, appDeadline: '06-01', url: 'https://www.hpu.edu',
    programs: progs([
      ['51.3801', BM], ['52.0201', BM], ['11.1003', B], ['42.0101', B], ['44.0701', M], ['13.0101', M],
    ]),
  },
  {
    id: 'snhu', name: 'Southern New Hampshire University (Online)', city: 'Manchester', state: 'NH', zip: '03106',
    control: 'private_nonprofit', onlineOnly: true,
    tuitionInState: 11900, tuitionOutOfState: 11900, fees: 0,
    yellowRibbon: { participates: false, maxPerStudent: 0, levels: [] },
    veteranGradRate: 0.45, appDeadline: '08-01', url: 'https://www.snhu.edu',
    programs: progs([
      ['11.0701', BM], ['11.1003', BM], ['11.0103', BM], ['30.7001', BM], ['52.0201', BM],
      ['52.0213', BM], ['52.1001', BM], ['52.0203', B], ['52.0301', BM], ['42.0101', BM],
      ['43.0104', BM], ['51.0701', BM], ['09.0702', B], ['44.0401', M],
    ]),
  },
  {
    id: 'excelsior', name: 'Excelsior University (Online)', city: 'Albany', state: 'NY', zip: '12203',
    control: 'private_nonprofit', onlineOnly: true,
    tuitionInState: 9600, tuitionOutOfState: 9600, fees: 600,
    yellowRibbon: { participates: false, maxPerStudent: 0, levels: [] },
    veteranGradRate: 0.5, appDeadline: '08-01', url: 'https://www.excelsior.edu',
    programs: progs([
      ['11.1003', BM], ['11.0103', BM], ['52.0201', BM], ['52.0213', BM], ['51.3801', BM],
      ['51.0701', BM], ['43.0301', B], ['15.0303', B],
    ]),
  },
  {
    id: 'tamu', name: 'Texas A&M University', city: 'College Station', state: 'TX', zip: '77843',
    control: 'public', onlineOnly: false,
    tuitionInState: 13200, tuitionOutOfState: 40600, fees: 0,
    yellowRibbon: { participates: true, maxPerStudent: null, levels: BM },
    veteranGradRate: 0.78, appDeadline: '12-01', url: 'https://www.tamu.edu',
    programs: progs([
      ['11.0701', BM], ['11.1003', M], ['14.0201', BM], ['14.1001', BM], ['14.1901', BM],
      ['14.0801', BM], ['52.0203', BM], ['44.0401', M], ['43.0302', BM], ['40.0404', BM], ['52.2001', B],
    ]),
  },
  {
    id: 'asu', name: 'Arizona State University – Tempe', city: 'Tempe', state: 'AZ', zip: '85281',
    control: 'public', onlineOnly: false,
    tuitionInState: 12100, tuitionOutOfState: 33000, fees: 900,
    yellowRibbon: { participates: true, maxPerStudent: null, levels: BM },
    veteranGradRate: 0.66, appDeadline: '02-01', url: 'https://www.asu.edu',
    programs: progs([
      ['11.0701', BM], ['11.1003', BM], ['14.0201', BM], ['52.0203', BM], ['44.0401', M],
      ['44.0701', BM], ['51.2201', BM], ['50.0602', B], ['09.0702', BM], ['42.0101', B],
      ['30.7001', BM], ['52.0213', B],
    ]),
  },
  {
    id: 'asu-online', name: 'ASU Online', city: 'Tempe', state: 'AZ', zip: '85281',
    control: 'public', onlineOnly: true,
    tuitionInState: 15000, tuitionOutOfState: 15000, fees: 300,
    yellowRibbon: { participates: true, maxPerStudent: 5000, levels: BM },
    veteranGradRate: 0.58, appDeadline: '07-15', url: 'https://asuonline.asu.edu',
    programs: progs([
      ['11.0701', BM], ['11.1003', BM], ['11.0103', BM], ['52.0213', BM], ['52.0201', BM],
      ['44.0401', BM], ['42.0101', BM], ['51.0701', BM], ['43.0302', BM],
    ]),
  },
  {
    id: 'umgc', name: 'University of Maryland Global Campus (Online)', city: 'Adelphi', state: 'MD', zip: '20783',
    control: 'public', onlineOnly: true,
    tuitionInState: 9500, tuitionOutOfState: 15000, fees: 0,
    yellowRibbon: { participates: true, maxPerStudent: 2500, levels: BM },
    veteranGradRate: 0.48, appDeadline: '08-01', url: 'https://www.umgc.edu',
    programs: progs([
      ['11.0701', BM], ['11.1003', BM], ['11.0103', BM], ['11.0901', B], ['30.7001', BM],
      ['52.0201', BM], ['52.1001', BM], ['52.0203', B], ['52.0301', BM], ['43.0301', BM],
      ['43.0104', B], ['43.0302', BM], ['51.0701', BM], ['42.0101', B],
    ]),
  },
  {
    id: 'psu-world', name: 'Penn State World Campus (Online)', city: 'University Park', state: 'PA', zip: '16802',
    control: 'public', onlineOnly: true,
    tuitionInState: 15600, tuitionOutOfState: 16600, fees: 300,
    yellowRibbon: { participates: true, maxPerStudent: 6000, levels: BM },
    veteranGradRate: 0.62, appDeadline: '07-01', url: 'https://www.worldcampus.psu.edu',
    programs: progs([
      ['11.1003', BM], ['11.0103', BM], ['52.0203', BM], ['52.0213', BM], ['44.0401', M],
      ['43.0302', M], ['42.0101', B], ['15.0303', B],
    ]),
  },
  {
    id: 'purdue', name: 'Purdue University', city: 'West Lafayette', state: 'IN', zip: '47907',
    control: 'public', onlineOnly: false,
    tuitionInState: 9200, tuitionOutOfState: 28800, fees: 800,
    yellowRibbon: { participates: true, maxPerStudent: null, levels: BM },
    veteranGradRate: 0.79, appDeadline: '01-15', url: 'https://www.purdue.edu',
    programs: progs([
      ['11.0701', BM], ['11.1003', BM], ['14.0201', BM], ['14.1001', BM], ['14.1901', BM],
      ['14.0801', BM], ['15.0303', B], ['49.0101', B], ['49.0104', B], ['52.0203', B], ['52.2001', B],
    ]),
  },
  {
    id: 'vt', name: 'Virginia Tech', city: 'Blacksburg', state: 'VA', zip: '24061',
    control: 'public', onlineOnly: false,
    tuitionInState: 13700, tuitionOutOfState: 33600, fees: 2400,
    yellowRibbon: { participates: true, maxPerStudent: 15000, levels: BM },
    veteranGradRate: 0.8, appDeadline: '01-15', url: 'https://www.vt.edu',
    programs: progs([
      ['11.0701', BM], ['11.1003', M], ['14.0201', BM], ['14.1001', BM], ['14.1901', BM],
      ['14.0801', BM], ['52.2001', B], ['44.0401', M], ['40.0404', B],
    ]),
  },
  {
    id: 'odu', name: 'Old Dominion University', city: 'Norfolk', state: 'VA', zip: '23529',
    control: 'public', onlineOnly: false,
    tuitionInState: 11100, tuitionOutOfState: 31000, fees: 600,
    yellowRibbon: { participates: true, maxPerStudent: 5000, levels: BM },
    veteranGradRate: 0.6, appDeadline: '03-01', url: 'https://www.odu.edu',
    programs: progs([
      ['11.1003', BM], ['11.0701', BM], ['15.0303', B], ['52.0203', BM], ['43.0104', BM],
      ['43.0302', M], ['44.0701', BM], ['51.3801', BM], ['51.2201', BM], ['52.1001', B],
    ]),
  },
  {
    id: 'uncw', name: 'University of North Carolina Wilmington', city: 'Wilmington', state: 'NC', zip: '28403',
    control: 'public', onlineOnly: false,
    tuitionInState: 4500, tuitionOutOfState: 21000, fees: 2800,
    yellowRibbon: { participates: true, maxPerStudent: 3000, levels: BM },
    veteranGradRate: 0.63, appDeadline: '02-01', url: 'https://uncw.edu',
    programs: progs([
      ['43.0104', B], ['51.3801', BM], ['52.0201', BM], ['11.0701', BM], ['44.0701', BM],
      ['26.0101', BM], ['09.0101', B], ['13.0101', M],
    ]),
  },
  {
    id: 'uccs', name: 'University of Colorado Colorado Springs', city: 'Colorado Springs', state: 'CO', zip: '80918',
    control: 'public', onlineOnly: false,
    tuitionInState: 10700, tuitionOutOfState: 25000, fees: 1800,
    yellowRibbon: { participates: true, maxPerStudent: 6000, levels: BM },
    veteranGradRate: 0.58, appDeadline: '07-01', url: 'https://www.uccs.edu',
    programs: progs([
      ['11.1003', BM], ['11.0701', BM], ['14.1001', BM], ['14.1901', BM], ['14.0201', B],
      ['44.0401', M], ['43.0104', B], ['51.3801', BM],
    ]),
  },
  {
    id: 'sdsu', name: 'San Diego State University', city: 'San Diego', state: 'CA', zip: '92182',
    control: 'public', onlineOnly: false,
    tuitionInState: 6400, tuitionOutOfState: 18300, fees: 2200,
    yellowRibbon: { participates: true, maxPerStudent: 7000, levels: BM },
    veteranGradRate: 0.71, appDeadline: '11-30', url: 'https://www.sdsu.edu',
    programs: progs([
      ['11.0701', BM], ['14.0201', BM], ['14.1001', BM], ['14.0801', BM], ['44.0401', BM],
      ['52.0201', BM], ['44.0701', BM], ['51.2201', BM], ['42.0101', B], ['52.0901', B],
    ]),
  },
  {
    id: 'uw-tacoma', name: 'University of Washington Tacoma', city: 'Tacoma', state: 'WA', zip: '98402',
    control: 'public', onlineOnly: false,
    tuitionInState: 11500, tuitionOutOfState: 40000, fees: 900,
    yellowRibbon: { participates: true, maxPerStudent: 4000, levels: BM },
    veteranGradRate: 0.67, appDeadline: '03-01', url: 'https://www.tacoma.uw.edu',
    programs: progs([
      ['11.0701', BM], ['11.1003', BM], ['43.0104', B], ['44.0701', BM], ['51.3801', BM],
      ['52.0201', BM], ['14.1001', B],
    ]),
  },
  {
    id: 'utsa', name: 'University of Texas at San Antonio', city: 'San Antonio', state: 'TX', zip: '78249',
    control: 'public', onlineOnly: false,
    tuitionInState: 10600, tuitionOutOfState: 28000, fees: 0,
    yellowRibbon: { participates: true, maxPerStudent: 4000, levels: BM },
    veteranGradRate: 0.57, appDeadline: '07-01', url: 'https://www.utsa.edu',
    programs: progs([
      ['11.1003', BM], ['11.0701', BM], ['30.7001', BM], ['14.1001', BM], ['14.1901', BM],
      ['14.0801', BM], ['52.2001', B], ['43.0104', BM], ['44.0401', M], ['52.0213', B],
    ]),
  },
  // For-profit institutions: present in the data so the default exclusion rule (spec §5.3) is exercised.
  {
    id: 'uopx', name: 'University of Phoenix (Online)', city: 'Phoenix', state: 'AZ', zip: '85040',
    control: 'for_profit', onlineOnly: true,
    tuitionInState: 12000, tuitionOutOfState: 12000, fees: 0,
    yellowRibbon: { participates: false, maxPerStudent: 0, levels: [] },
    veteranGradRate: 0.3, appDeadline: '08-15', url: 'https://www.phoenix.edu',
    programs: progs([['11.0701', BM], ['11.1003', BM], ['52.0201', BM], ['52.0213', BM], ['43.0104', B]]),
  },
  {
    id: 'ctu', name: 'Colorado Technical University (Online)', city: 'Colorado Springs', state: 'CO', zip: '80907',
    control: 'for_profit', onlineOnly: true,
    tuitionInState: 13000, tuitionOutOfState: 13000, fees: 0,
    yellowRibbon: { participates: false, maxPerStudent: 0, levels: [] },
    veteranGradRate: 0.28, appDeadline: '08-15', url: 'https://www.coloradotech.edu',
    programs: progs([['11.1003', BM], ['11.0103', BM], ['52.0201', BM], ['43.0104', B]]),
  },
  {
    id: 'apus', name: 'American Public University (Online)', city: 'Charles Town', state: 'WV', zip: '25414',
    control: 'for_profit', onlineOnly: true,
    tuitionInState: 8500, tuitionOutOfState: 8500, fees: 0,
    yellowRibbon: { participates: false, maxPerStudent: 0, levels: [] },
    veteranGradRate: 0.35, appDeadline: '08-15', url: 'https://www.apus.edu',
    programs: progs([['43.0301', BM], ['43.0302', BM], ['45.0901', BM], ['52.0213', BM], ['11.1003', BM]]),
  },
];
