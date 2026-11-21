"""て형 활용 Ⅱ (하 3과) — ~てみる / ~ておく / ~てしまう / ~てもいい / ~てはいけない / ~てばかりいる / ~たがる"""
import ko
from jp import masu_stem, te

TE2 = [  # key, label, 일본어 뒤붙임(て형 기준), 한국어 만들기
    ('miru', '~てみます (~해 봅니다)', 'みます', lambda s, a: f'{a} 봅니다'),
    ('oku', '~ておきます (~해 둡니다)', 'おきます', lambda s, a: f'{a} 둡니다'),
    ('shimau', '~てしまいました (~해 버렸습니다)', 'しまいました', lambda s, a: f'{a} 버렸습니다'),
    ('moii', '~てもいいです (~해도 됩니다)', 'もいいです', lambda s, a: f'{a}도 됩니다'),
    ('ikenai', '~てはいけません (~하면 안 됩니다)', 'はいけません', lambda s, a: f'{a}서는 안 됩니다'),
    ('bakari', '~てばかりいます (~하고만 있습니다)', 'ばかりいます', lambda s, a: f'{s}고만 있습니다'),
    ('tagaru', '~たがっています (3인칭: ~하고 싶어 합니다)', None, lambda s, a: f'{s}고 싶어 합니다'),
]
TE2_LABELS = {lab for _, lab, _, _ in TE2}

# 뜻이 부자연스러운 조합은 뺀다
TE2_SKIP = {
    '降る': {'miru', 'oku', 'ikenai', 'tagaru'},
    '吹く': {'miru', 'oku', 'ikenai', 'tagaru'},
    '死ぬ': {'miru', 'oku', 'moii', 'bakari', 'tagaru'},
    '終わる': {'miru', 'oku', 'ikenai', 'tagaru'},
    '知る': {'bakari'},
    'やせる': {'miru', 'oku', 'bakari'},
    '太る': {'miru', 'oku', 'bakari'},
}


def te2_forms(dict_, hira, kbase, group, since=None):
    t, th = te(dict_, group), te(hira, group)
    st, sth = masu_stem(dict_, group), masu_stem(hira, group)
    s, a = ko.stem_of(kbase), ko.a_form(kbase)
    out = []
    for key, label, suf, krf in TE2:
        if key in TE2_SKIP.get(dict_, ()):
            continue
        if suf is None:
            ja, hi = st + 'たがっています', sth + 'たがっています'
        else:
            ja, hi = t + suf, th + suf
        f = {'label': label, 'ja': ja, 'hira': hi, 'kr': krf(s, a)}
        if since:
            f['since'] = since
        out.append(f)
    return out
