import type { JobCode } from '../types';

type Row = [code: string, title: string, soc: string[], group?: string];

function rows(branch: JobCode['branch'], rankCategory: JobCode['rankCategory'], list: Row[]): JobCode[] {
  return list.map(([code, title, soc, group]) => ({ code, title, branch, rankCategory, soc, group }));
}

/**
 * Hand-entered sample of job codes. live/onet.json (the full O*NET military crosswalk) replaces any
 * code it also lists; what survives from here is the picker `group` labels and codes the crosswalk
 * does not map, such as Navy officer designators.
 */
export const JOB_CODES: JobCode[] = [
  ...rows('army', 'enlisted', [
    ['11B', 'Infantryman', ['55-3016', '33-3051'], 'CMF 11 – Infantry'],
    ['11C', 'Indirect Fire Infantryman', ['55-3016', '55-3014'], 'CMF 11 – Infantry'],
    ['12B', 'Combat Engineer', ['47-2061', '17-2051'], 'CMF 12 – Corps of Engineers'],
    ['13B', 'Cannon Crewmember', ['55-3014'], 'CMF 13 – Field Artillery'],
    ['17C', 'Cyber Operations Specialist', ['15-1212', '15-1244'], 'CMF 17 – Cyber'],
    ['19K', 'M1 Armor Crewman', ['55-3013'], 'CMF 19 – Armor'],
    ['25B', 'Information Technology Specialist', ['15-1244', '15-1231'], 'CMF 25 – Signal'],
    ['31B', 'Military Police', ['33-3051', '33-9032'], 'CMF 31 – Military Police'],
    ['35F', 'Intelligence Analyst', ['13-1199', '19-3039'], 'CMF 35 – Military Intelligence'],
    ['42A', 'Human Resources Specialist', ['13-1071', '43-4161'], 'CMF 42 – Adjutant General'],
    ['46S', 'Public Affairs Mass Communication Specialist', ['27-3031', '27-4021'], 'CMF 46 – Public Affairs'],
    ['68W', 'Combat Medic Specialist', ['29-2042'], 'CMF 68 – Medical'],
    ['88M', 'Motor Transport Operator', ['53-3032'], 'CMF 88 – Transportation'],
    ['92A', 'Automated Logistical Specialist', ['13-1081', '43-5071'], 'CMF 92 – Quartermaster'],
    ['92Y', 'Unit Supply Specialist', ['43-5071'], 'CMF 92 – Quartermaster'],
    ['15T', 'UH-60 Helicopter Repairer', ['49-3011'], 'CMF 15 – Aviation'],
  ]),
  ...rows('army', 'warrant', [
    ['153A', 'Rotary Wing Aviator', ['53-2011']],
    ['255A', 'Information Services Technician', ['15-1244', '11-3021']],
    ['311A', 'CID Special Agent', ['33-3021']],
    ['920A', 'Property Accounting Technician', ['13-1081', '13-2011']],
  ]),
  ...rows('army', 'officer', [
    ['11A', 'Infantry Officer', ['55-1016', '11-1021']],
    ['12A', 'Engineer Officer', ['17-2051', '11-1021']],
    ['17A', 'Cyber Operations Officer', ['15-1212', '11-3021']],
    ['25A', 'Signal Officer', ['11-3021', '15-1244']],
    ['42B', 'Human Resources Officer', ['13-1071', '11-1021']],
    ['66H', 'Medical-Surgical Nurse', ['29-1141']],
    ['90A', 'Logistics Officer', ['11-3071', '13-1081']],
  ]),
  ...rows('navy', 'enlisted', [
    ['AD', "Aviation Machinist's Mate", ['49-3011']],
    ['AG', "Aerographer's Mate", ['19-2021']],
    ['AT', 'Aviation Electronics Technician', ['49-2091']],
    ['BM', "Boatswain's Mate", ['53-5011', '53-5021']],
    ['CTI', 'Cryptologic Technician – Interpretive', ['27-3091']],
    ['EM', "Electrician's Mate", ['47-2111', '17-3023']],
    ['ET', 'Electronics Technician', ['17-3023']],
    ['HM', 'Hospital Corpsman', ['29-2042']],
    ['IT', 'Information Systems Technician', ['15-1244', '15-1231']],
    ['LS', 'Logistics Specialist', ['13-1081', '43-5071']],
    ['MA', 'Master-at-Arms', ['33-3051']],
    ['MC', 'Mass Communication Specialist', ['27-3031', '27-4021']],
    ['OS', 'Operations Specialist', ['55-1015']],
    ['PS', 'Personnel Specialist', ['13-1071', '43-4161']],
  ]),
  ...rows('navy', 'officer', [
    ['1110', 'Surface Warfare Officer', ['53-5021', '11-1021']],
    ['1310', 'Naval Aviator', ['53-2011']],
    ['1820', 'Information Professional Officer', ['11-3021']],
    ['1840', 'Cyber Warfare Engineer', ['15-1212', '15-1252']],
    ['2900', 'Nurse Corps Officer', ['29-1141']],
    ['3100', 'Supply Corps Officer', ['11-3071', '13-1081']],
  ]),
  ...rows('marines', 'enlisted', [
    ['0111', 'Administrative Specialist', ['43-4161', '13-1071'], '01 – Personnel & Administration'],
    ['0231', 'Intelligence Specialist', ['13-1199'], '02 – Intelligence'],
    ['0311', 'Rifleman', ['55-3016'], '03 – Infantry'],
    ['0331', 'Machine Gunner', ['55-3016'], '03 – Infantry'],
    ['0631', 'Network Administrator', ['15-1244'], '06 – Communications'],
    ['1371', 'Combat Engineer', ['47-2061', '17-2051'], '13 – Engineer'],
    ['1721', 'Cyberspace Warfare Operator', ['15-1212'], '17 – Cyberspace'],
    ['3043', 'Supply Administration & Operations Specialist', ['13-1081', '43-5071'], '30 – Supply'],
    ['3531', 'Motor Vehicle Operator', ['53-3032'], '35 – Motor Transport'],
    ['5811', 'Military Police', ['33-3051'], '58 – Military Police'],
  ]),
  ...rows('marines', 'warrant', [
    ['0306', 'Infantry Weapons Officer', ['55-1016', '13-1151']],
    ['4430', 'Legal Administrative Officer', ['11-1021']],
  ]),
  ...rows('marines', 'officer', [
    ['0202', 'Intelligence Officer', ['13-1199']],
    ['0302', 'Infantry Officer', ['55-1016', '11-1021']],
    ['0402', 'Logistics Officer', ['11-3071', '13-1081']],
    ['0602', 'Communications Officer', ['11-3021']],
    ['1302', 'Combat Engineer Officer', ['17-2051']],
    ['1702', 'Cyberspace Officer', ['15-1212', '11-3021']],
  ]),
  ...rows('coastguard', 'enlisted', [
    ['AMT', 'Aviation Maintenance Technician', ['49-3011']],
    ['BM', "Boatswain's Mate", ['53-5011', '53-5021']],
    ['CS', 'Culinary Specialist', ['35-1011']],
    ['EM', "Electrician's Mate", ['47-2111']],
    ['HS', 'Health Services Technician', ['29-2042']],
    ['IT', 'Information Systems Technician', ['15-1244', '15-1231']],
    ['ME', 'Maritime Enforcement Specialist', ['33-3051']],
    ['OS', 'Operations Specialist', ['55-1015']],
    ['PA', 'Public Affairs Specialist', ['27-3031', '27-4021']],
    ['SK', 'Storekeeper', ['13-1081', '43-5071']],
    ['YN', 'Yeoman', ['13-1071', '43-4161']],
  ]),
  ...rows('coastguard', 'warrant', [
    ['BOSN', 'Boatswain (CWO)', ['53-5021']],
    ['ISS', 'Information Systems (CWO)', ['11-3021', '15-1244']],
    ['INV', 'Investigator (CWO)', ['33-3021']],
  ]),
];
