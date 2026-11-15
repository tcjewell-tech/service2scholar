#!/usr/bin/env python3
"""
Rebuilds src/data/live/onet.json from two free O*NET Resource Center downloads (no key, no account):
the Defense Manpower Data Center military crosswalk (job code -> civilian occupation) and the
CIP-to-O*NET-SOC crosswalk (occupation -> degree field).

Run: npm run refresh-onet     (needs Python 3; standard library only)
Only needed when O*NET publishes a new crosswalk, roughly once a year.
"""
import csv
import datetime
import io
import json
import pathlib
import re
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

MILITARY_URL = 'https://www.onetcenter.org/dl_files/2019/military_crosswalk.zip'
CIP_URL = 'https://www.onetcenter.org/crosswalks/cip/Education_CIP_to_ONET_SOC.xlsx'
OUT = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'data' / 'live' / 'onet.json'

# Crosswalk service letters for each branch's main occupation codes. Navy officer designators (P)
# carry no civilian mapping in the file, so the seed's hand-entered designators stay in the app.
BRANCH = {'A': 'army', 'N': 'navy', 'F': 'airforce', 'M': 'marines', 'C': 'coastguard', 'H': 'spaceforce'}
RANK = {'E': 'enlisted', 'W': 'warrant', 'O': 'officer'}


def download(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'data-refresh-script'})
    with urllib.request.urlopen(req, timeout=120) as res:
        return io.BytesIO(res.read())


def read_military(zip_bytes):
    """Active job codes per branch and rank as [code, title, [SOC...]], plus SOC titles."""
    z = zipfile.ZipFile(zip_bytes)
    name = next(n for n in z.namelist() if n.lower().endswith('.csv'))
    codes, soc_titles = {}, {}
    for r in csv.DictReader(io.TextIOWrapper(z.open(name), encoding='utf-8-sig')):
        branch, rank = BRANCH.get(r['SVC']), RANK.get(r['MPC'])
        if not branch or not rank or r['STATUS'] != 'A':
            continue
        socs = []
        for i in '1234':
            soc = r['SOC' + i].strip()
            if soc and soc != '-' and soc not in socs:
                socs.append(soc)
                soc_titles[soc] = r[f'SOC{i}_TITLE'].strip()
        # A few codes are listed twice; the first row wins.
        codes.setdefault(branch, {}).setdefault(rank, {}).setdefault(r['MOC'].strip(), [r['MOC'].strip(), r['MOC_TITLE'].strip(), socs])
    job_codes = {b: {rk: sorted(rows.values()) for rk, rows in ranks.items()} for b, ranks in codes.items()}
    return pathlib.PurePath(name).stem, job_codes, soc_titles


def read_cip(xlsx_bytes, wanted_socs):
    """SOC -> sorted 6-digit CIP codes, for the occupations our job codes use."""
    ns = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
    # Standard-library XML parsing is acceptable here: the file comes straight from onetcenter.org over HTTPS.
    z = zipfile.ZipFile(xlsx_bytes)
    strings = [''.join(t.text or '' for t in si.iter(ns + 't')) for si in ET.parse(z.open('xl/sharedStrings.xml')).getroot()]
    soc_to_cip = {}
    for row in ET.parse(z.open('xl/worksheets/sheet1.xml')).getroot().iter(ns + 'row'):
        cells = [strings[int(c.find(ns + 'v').text)] for c in row if c.get('t') == 's' and c.find(ns + 'v') is not None]
        # Data rows are: CIP code, CIP title, O*NET-SOC code (e.g. 15-1212.00), O*NET-SOC title.
        if len(cells) >= 3 and re.fullmatch(r'\d\d\.\d{4}', cells[0]):
            soc = cells[2][:7]
            if soc in wanted_socs:
                soc_to_cip.setdefault(soc, set()).add(cells[0])
    return {soc: sorted(cips) for soc, cips in sorted(soc_to_cip.items())}


def main():
    version, job_codes, soc_titles = read_military(download(MILITARY_URL))
    soc_to_cip = read_cip(download(CIP_URL), set(soc_titles))

    # Self-check: fail loudly rather than write a broken file if O*NET changes the layout.
    total = sum(len(rows) for ranks in job_codes.values() for rows in ranks.values())
    assert total > 10000, f'only {total} job codes found'
    assert set(job_codes) == set(BRANCH.values()), f'branches found: {sorted(job_codes)}'
    assert all({'enlisted', 'officer'} <= set(ranks) for ranks in job_codes.values()), 'a branch is missing a rank'
    assert ['11B', 'Infantryman', ['55-3016']] in job_codes['army']['enlisted'], 'Army 11B not as expected'
    assert '11.1003' in soc_to_cip.get('15-1212', []), 'Information Security Analysts should map to Cybersecurity'

    snapshot = {
        'source': 'O*NET Resource Center: DMDC military crosswalk and CIP 2020 to O*NET-SOC 2019 crosswalk',
        'crosswalk': version,
        'fetchedAt': datetime.date.today().isoformat(),
        'jobCodes': job_codes,
        'socTitles': dict(sorted(soc_titles.items())),
        'socToCip': soc_to_cip,
    }
    # One job code per line keeps future diffs readable.
    text = json.dumps(snapshot, separators=(',', ':'), ensure_ascii=False).replace('],[', '],\n[')
    OUT.write_text(text + '\n', encoding='utf-8', newline='\n')
    print(f'Wrote {total} job codes ({version}) and {len(soc_to_cip)} occupation-to-field links to {OUT.name}')


if __name__ == '__main__':
    main()
