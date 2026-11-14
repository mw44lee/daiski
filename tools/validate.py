"""Sanity checks for data/*.js. Usage: python -I tools/validate.py [--show]"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from datafile import load_data  # noqa: E402
from jp import kata2hira  # noqa: E402

furi = load_data(ROOT / 'data' / 'furigana.js')
problems = []
BROKEN_KO = ['ㄴ/은', '았/었', '아/어', '을/를', '은/는(한)', '하았', '하해']


def check_ruby(where, ja, hira):
    """Mimic renderRubyFromText (longest-first greedy) and make sure each reading occurs in hira."""
    rest = ja
    h = kata2hira(hira).replace(' ', '').replace('　', '')
    for k, r in furi:
        if k in rest:
            if r.replace(" ", "") not in h:
                problems.append(f'[ruby] {where}: {k}→{r} not in hira「{hira}」')
            rest = rest.replace(k, '□')


files = sorted((ROOT / 'data' / 'lessons').glob('*.js')) + sorted((ROOT / 'data' / 'special').glob('*.js'))
for f in files:
    d = load_data(f)
    key = d['id']
    for s in d['sentences']:
        w = f'{key}#{s["id"]}'
        for fld in ('kr', 'ja', 'hira', 'grammar', 'blankWord', 'blankQ'):
            if not s.get(fld):
                problems.append(f'[sentence] {w} missing {fld}')
        if s.get('blankWord') and s['blankWord'] not in s['ja']:
            problems.append(f'[sentence] {w} blankWord not in ja')
        if s.get('part') not in (1, 2):
            problems.append(f'[sentence] {w} part must be 1 or 2')
        check_ruby(w, s['ja'], s['hira'])
    for rp in d['reading_passage']['sentences']:
        check_ruby(f'{key}/reading', rp['ja'], rp['hira'])
    for it in d.get('conjugationItems', []):
        for fm in it['forms']:
            w = f'{key}:{it["dict"]}:{fm.get("label")}'
            for fld in ('label', 'ja', 'hira', 'kr'):
                if not fm.get(fld):
                    problems.append(f'[form] {w} missing {fld}')
            if any(b in fm.get('kr', '') for b in BROKEN_KO):
                problems.append(f'[ko] {w}: {fm["kr"]}')
    for wd in d['words']:
        for fld in ('kr', 'hira', 'kanji', 'category'):
            if not wd.get(fld):
                problems.append(f'[word] {key} {wd} missing {fld}')

for p in problems:
    print(p)
print(f'{len(problems)} problem(s) in {len(files)} files')

if '--show' in sys.argv:
    for name in sys.argv[2:]:
        d = load_data(ROOT / 'data' / name)
        for it in d['conjugationItems']:
            print(it['dict'], '|', ' ; '.join(f"{f['ja']}={f['kr']}" for f in it['forms']))
