"""하 5과 — たり형 / 기본형 + かもしれません / 기본형 + 前に"""
import ko
from ta import ta

TARI = [  # key, label, fam, 일본어 만들기(dict형, た형) → 뒤붙임, 한국어
    ('tari', '~たり します (~하기도 하고 ~하기도 합니다)', 'た형', lambda d, t: (t + 'り します'), lambda k: f'{ko.stem_of(k)}기도 합니다'),
    ('kamo', '~かもしれません (~할지도 모릅니다)', '기본형', lambda d, t: (d + 'かも しれません'), lambda k: f'{ko.fut_adn(k)}지도 모릅니다'),
    ('mae', '~前に (~하기 전에)', '기본형', lambda d, t: (d + ' 前に'), lambda k: f'{ko.stem_of(k)}기 전에'),
]
TARI_LABELS = {lab for _, lab, _, _, _ in TARI}
TARI_SKIP = {'死ぬ': {'tari'}}


def tari_forms(dict_, hira, kbase, group, since=None):
    t, th = ta(dict_, group), ta(hira, group)
    out = []
    for key, label, fam, jaf, krf in TARI:
        if key in TARI_SKIP.get(dict_, ()):
            continue
        ja = jaf(dict_, t)
        hi = jaf(hira, th).replace(' 前に', ' まえに')
        f = {'label': label, 'ja': ja, 'hira': hi, 'kr': krf(kbase), 'fam': fam}
        if since:
            f['since'] = since
        out.append(f)
    return out
