import type { Scholarship } from '../types';

/**
 * SAMPLE DATA — real programs, but award amounts and deadlines are approximate and change
 * every cycle. The app always links out to the provider's page (spec §7.1).
 */
export const SCHOLARSHIPS: Scholarship[] = [
  {
    id: 'tillman', name: 'Tillman Scholars Program', provider: 'Pat Tillman Foundation',
    amount: 10000, deadline: '02-28', url: 'https://pattillmanfoundation.org/apply-to-be-a-scholar/',
    eligibility: { beneficiaries: ['self', 'spouse'] },
    summary: 'Academic scholarship plus leadership development for veterans, service members, and military spouses.',
  },
  {
    id: 'amvets', name: 'AMVETS National Scholarship for Veterans', provider: 'AMVETS',
    amount: 4000, deadline: '04-30', url: 'https://amvets.org/scholarships/',
    eligibility: { beneficiaries: ['self'] },
    summary: 'For veterans and active-duty members pursuing a degree or certification.',
  },
  {
    id: 'fisher-house', name: 'Scholarships for Military Children', provider: 'Fisher House Foundation',
    amount: 2000, deadline: '02-15', url: 'https://militaryscholar.org/',
    eligibility: { beneficiaries: ['child'], levels: ['bachelor'] },
    summary: 'For dependent children of service members, retirees, and deceased members.',
  },
  {
    id: 'thanksusa', name: 'ThanksUSA Scholarship', provider: 'ThanksUSA',
    amount: 3000, deadline: '04-15', url: 'https://www.thanksusa.org/',
    eligibility: { beneficiaries: ['spouse', 'child'] },
    summary: 'Need-based awards for children and spouses of active-duty service members.',
  },
  {
    id: 'mcsf', name: 'Marine Corps Scholarship', provider: 'Marine Corps Scholarship Foundation',
    amount: 7500, deadline: '03-01', url: 'https://www.mcsf.org/apply/',
    eligibility: { beneficiaries: ['child'], branches: ['marines'], levels: ['bachelor'] },
    summary: 'For children of Marines and Navy Corpsmen who served with Marine units.',
  },
  {
    id: 'folds-of-honor', name: 'Folds of Honor Higher Education Scholarship', provider: 'Folds of Honor',
    amount: 5000, deadline: '03-31', url: 'https://foldsofhonor.org/scholarships/',
    eligibility: { beneficiaries: ['spouse', 'child'], minVaRating: 10 },
    summary: 'For spouses and children of service members killed or disabled in service.',
  },
  {
    id: 'aer-ursano', name: 'MG James Ursano Scholarship', provider: 'Army Emergency Relief',
    amount: 2500, deadline: '05-01', url: 'https://www.armyemergencyrelief.org/scholarships/',
    eligibility: { beneficiaries: ['child'], branches: ['army'], levels: ['bachelor'] },
    summary: 'Need-based scholarship for dependent children of Army soldiers.',
  },
  {
    id: 'aer-spouse', name: 'Spouse Education Assistance Program', provider: 'Army Emergency Relief',
    amount: 2500, deadline: '05-01', url: 'https://www.armyemergencyrelief.org/scholarships/',
    eligibility: { beneficiaries: ['spouse'], branches: ['army'] },
    summary: 'Need-based assistance for spouses of Army soldiers.',
  },
  {
    id: 'afas-arnold', name: 'General Henry H. Arnold Education Grant', provider: 'Air Force Aid Society',
    amount: 2000, deadline: '03-31', url: 'https://afas.org/how-we-help/education-support/',
    eligibility: { beneficiaries: ['spouse', 'child'], branches: ['airforce', 'spaceforce'], levels: ['bachelor'] },
    summary: 'Need-based grant for dependents of Air Force and Space Force members.',
  },
  {
    id: 'nmcrs', name: 'Education Assistance Program', provider: 'Navy-Marine Corps Relief Society',
    amount: 3000, deadline: '05-01', url: 'https://www.nmcrs.org/education',
    eligibility: { beneficiaries: ['self', 'spouse', 'child'], branches: ['navy', 'marines'] },
    summary: 'Interest-free loans and grants for sailors, Marines, and their families.',
  },
  {
    id: 'cgf', name: 'Coast Guard Foundation Scholarship', provider: 'Coast Guard Foundation',
    amount: 5000, deadline: '03-15', url: 'https://www.coastguardfoundation.org/scholarships',
    eligibility: { beneficiaries: ['child'], branches: ['coastguard'] },
    summary: 'For dependent children of enlisted Coast Guard members.',
  },
];
