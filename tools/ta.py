"""동사의 た형 (하 4과) — 보통형 과거 / ~たことがあります / ~た方がいいです / ~たばかりです

た형은 て형과 만드는 법이 같다: て→た, で→だ (会って→会った, 飲んで→飲んだ, 行って→行った)
"""
import ko
from jp import te


def ta(word, group):
    t = te(word, group)
    return t[:-1] + ('だ' if t.endswith('で') else 'た')


TA = [  # key, label, 일본어 뒤붙임(ja, hira), 한국어 만들기
    ('ta', 'た형 (보통형 과거: ~했다)', ('', ''), lambda d: ko.past_plain(d)),
    ('koto', '~たことがあります (~한 적이 있습니다)', ('ことがあります', 'ことがあります'),
     lambda d: f'{ko.adn_past_verb(d)} 적이 있습니다'),
    ('hou', '~た方がいいです (~하는 편이 좋습니다)', ('方がいいです', 'ほうがいいです'),
     lambda d: f'{ko.adn_pres_verb(d)} 편이 좋습니다'),
    ('bakari', '~たばかりです (막 ~했습니다)', ('ばかりです', 'ばかりです'), lambda d: f'막 {ko.past(d)}'),
]
TA_LABELS = {lab for _, lab, _, _ in TA}

TA_SKIP = {  # 뜻이 부자연스러운 조합은 뺀다
    '降る': {'hou'}, '吹く': {'hou'}, '終わる': {'hou'},
    '死ぬ': {'koto', 'hou', 'bakari'},
    'やせる': {'hou'}, '太る': {'hou'},
}


def ta_forms(dict_, hira, kbase, group, since=None):
    t, th = ta(dict_, group), ta(hira, group)
    out = []
    for key, label, (js, hs), krf in TA:
        if key in TA_SKIP.get(dict_, ()):
            continue
        f = {'label': label, 'ja': t + js, 'hira': th + hs, 'kr': krf(kbase), 'fam': 'た형'}
        if since:
            f['since'] = since
        out.append(f)
    return out
