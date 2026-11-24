"""Apply 하권 1과 content updates to data/*.js (idempotent: safe to re-run).

  - 12~15과 → label "12(상)" 등, book/lessonNo 필드
  - verb  : て형 4형태 추가 + 하 1과 신규 동사 11개
  - iadj  : 한국어 해석 재생성 + ～くて 추가
  - naadj : 한국어 해석 재생성 + ～で 추가
  - noun  : 신설 (명사 です형 + で)
  - date  : 신설 (월·일·요일)
  - h1    : 하권 1과 (data/lessons/h01.js)

Usage: python -I tools/build_content.py
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from datafile import load_data, save_data  # noqa: E402
import ko  # noqa: E402
from jp import group_of, masu_stem, te, te_rule  # noqa: E402
from content_h1 import build_h1, H1_FURIGANA  # noqa: E402
from content_h2 import build_h2, FURIGANA as H2_FURIGANA  # noqa: E402
from content_h3 import build_h3, FURIGANA as H3_FURIGANA, PART1 as H3_P1, PART2 as H3_P2, GRAMMAR_HTML as H3_GRAMMAR  # noqa: E402
from te2 import te2_forms, TE2_LABELS  # noqa: E402
from ta import ta_forms, TA_LABELS  # noqa: E402
from content_h4 import build_h4, FURIGANA as H4_FURIGANA, PART1 as H4_P1, PART2 as H4_P2, GRAMMAR_HTML as H4_GRAMMAR  # noqa: E402

V4 = 4  # 하 3과 업데이트 번호
VERSION = 5  # 이번 업데이트 번호 (하 4과, data/changelog.js 와 맞춤). since: VERSION 이 붙은 것은 화면에 NEW 표시
from content_special import build_noun, build_date, VERB_TE_SENTENCES, VERB_TE_GRAMMAR_HTML, SPECIAL_FURIGANA  # noqa: E402

D = ROOT / 'data'

# ------------------------------------------------------------------ 상권 labels
for n in (12, 13, 14, 15):
    p = D / 'lessons' / f's{n}.js'
    d = load_data(p)
    d['label'] = f'{n}(상)'
    d['book'] = '상'
    d['lessonNo'] = n
    save_data(p, 'LESSONS_DB', str(n), d)

# ------------------------------------------------------------------ verb
KO_EU_OVERRIDE = {'걷다': '걸으', '듣다': '들으'}  # 으-stem for 으러/읍시다


def ko_primary(kr):
    return kr.split(' / ')[0].split(' (')[0].strip()


def ko_a(d):
    return ko.a_form(d)


def ko_verb_forms(d):
    s = ko.stem_of(d)
    a = ko_a(d)
    f = ko.final_of(s)
    if d in KO_EU_OVERRIDE:
        purpose = KO_EU_OVERRIDE[d] + '러 갑니다'      # 걸으러 갑니다
        lets = KO_EU_OVERRIDE[d][:-1] + '읍시다'       # 걸읍시다
    elif f == 0 or f == ko.F['ㄹ']:
        purpose = s + '러 갑니다'
        lets = ko.set_final(s, 'ㅂ') + '시다'
    else:
        purpose = s + '으러 갑니다'
        lets = s + '읍시다'
    return {
        'masu': ko.polite(d), 'masen': s + '지 않습니다', 'mashita': ko.set_final(a, 'ㅆ') + '습니다',
        'masendeshita': s + '지 않았습니다', 'tai': s + '고 싶습니다', 'ni_iku': purpose,
        'mashou': lets, 'masenka': s + '지 않을래요?',
    }


def ko_te_forms(d):
    s = ko.stem_of(d)
    a = ko_a(d)
    return {'te': f'{s}고 / {a}서', 'teiru': f'{s}고 있습니다', 'kudasai': f'{a} 주세요', 'tekara': f'{s}고 나서'}


NATURE = {'降る', '吹く'}  # 자연현상 동사: 희망·목적·청유·권유·요청형은 부자연스러워 제외
NO_KUDASAI = {'終わる', '知る', '死ぬ', 'やせる', '太る'} | NATURE  # 부자연스러운 요청형은 제외
TEIRU_RESULT = {'終わる': '끝나 있습니다 (결과 상태)', '入る': '들어가 있습니다 (결과 상태)', '死ぬ': '죽어 있습니다 (결과 상태)',
                '太る': '살쪘습니다 (살찐 상태)', 'やせる': '말랐습니다 (마른 상태)'}

TE_LABELS = [('te', 'て형 (~て: ~하고/~해서)', '', ''),
             ('teiru', '진행 (~ています)', 'います', 'います'),
             ('kudasai', '요청 (~てください)', 'ください', 'ください'),
             ('tekara', '순서 (~てから)', 'から', 'から')]


def add_te_forms(item):
    g = group_of(item['cat'])
    ja_te = te(item['dict'], g)
    hira_te = te(item['dictHira'], g)
    k = ko_te_forms(item.get('kr_base') or ko_primary(item['kr']))
    te_labels = {lab for _, lab, _, _ in TE_LABELS}
    item['forms'] = [f for f in item['forms'] if f['label'] not in te_labels]  # regenerate every run
    for key, label, ja_suf, hi_suf in TE_LABELS:
        if key == 'kudasai' and item['dict'] in NO_KUDASAI:
            continue
        kr = TEIRU_RESULT.get(item['dict'], k[key]) if key == 'teiru' else k[key]
        item['forms'].append({'label': label, 'ja': ja_te + ja_suf, 'hira': hira_te + hi_suf, 'kr': kr})
    rule = te_rule(item['dict'], g, item['cat'])
    if 'て형:' not in item['rule']:
        item['rule'] = f"{item['rule']} | {rule}"


NEW_VERBS = [  # dict, hira, kr(표시), 한국어 기본형(활용용), cat
    ('待つ', 'まつ', '기다리다', '기다리다', '1그룹 (5단 동사)'),
    ('終わる', 'おわる', '끝나다', '끝나다', '1그룹 (5단 동사)'),
    ('遊ぶ', 'あそぶ', '놀다', '놀다', '1그룹 (5단 동사)'),
    ('歩く', 'あるく', '걷다', '걷다', '1그룹 (5단 동사)'),
    ('弾く', 'ひく', '(악기를) 치다·연주하다', '치다', '1그룹 (5단 동사)'),
    ('洗う', 'あらう', '씻다', '씻다', '1그룹 (5단 동사)'),
    ('習う', 'ならう', '배우다', '배우다', '1그룹 (5단 동사)'),
    ('撮る', 'とる', '(사진을) 찍다', '찍다', '1그룹 (5단 동사)'),
    ('泳ぐ', 'およぐ', '헤엄치다 / 수영하다', '수영하다', '1그룹 (5단 동사)'),
    ('開ける', 'あける', '열다', '열다', '2그룹 (1단 동사)'),
    ('つける', 'つける', '(불을) 켜다', '켜다', '2그룹 (1단 동사)'),
    # 하 2과
    ('降る', 'ふる', '(비·눈이) 내리다', '내리다', '1그룹 (5단 동사)'),
    ('吹く', 'ふく', '(바람이) 불다', '불다', '1그룹 (5단 동사)'),
    ('住む', 'すむ', '살다 (~に 住む)', '살다', '1그룹 (5단 동사)'),
    ('持つ', 'もつ', '가지다, 들다', '가지다', '1그룹 (5단 동사)'),
    ('かぶる', 'かぶる', '(모자를) 쓰다', '쓰다', '1그룹 (5단 동사)'),
    ('はく', 'はく', '(하의·신발을) 입다/신다', '신다', '1그룹 (5단 동사)'),
    ('かける', 'かける', '(안경을) 쓰다', '쓰다', '2그룹 (1단 동사)'),
    ('しめる', 'しめる', '(넥타이를) 매다', '매다', '2그룹 (1단 동사)'),
    ('着る', 'きる', '(상의를) 입다', '입다', '2그룹 (1단 동사)'),
    ('予約する', 'よやくする', '예약하다', '예약하다', '3그룹 (불규칙)'),
    # 하 3과
    ('忘れる', 'わすれる', '잊다', '잊다', '2그룹 (1단 동사)'),
    ('止める', 'とめる', '세우다, 멈추다', '세우다', '2그룹 (1단 동사)'),
    ('つれる', 'つれる', '데리고 가다 (つれて 行く)', '데려가다', '2그룹 (1단 동사)'),
    ('やせる', 'やせる', '살이 빠지다, 마르다', '살이 빠지다', '2그룹 (1단 동사)'),
    ('座る', 'すわる', '앉다', '앉다', '1그룹 (5단 동사)'),
    ('探す', 'さがす', '찾다', '찾다', '1그룹 (5단 동사)'),
    ('泣く', 'なく', '울다', '울다', '1그룹 (5단 동사)'),
    ('働く', 'はたらく', '일하다', '일하다', '1그룹 (5단 동사)'),
    ('通う', 'かよう', '다니다 (~に 通う)', '다니다', '1그룹 (5단 동사)'),
    ('死ぬ', 'しぬ', '죽다 (유일한 ぬ 동사)', '죽다', '1그룹 (5단 동사)'),
    ('頑張る', 'がんばる', '열심히 하다, 힘내다', '힘내다', '1그룹 (5단 동사)'),
    ('太る', 'ふとる', '살찌다', '살찌다', '1그룹 (5단 동사)'),
    # 하 4과
    ('始める', 'はじめる', '시작하다', '시작하다', '2그룹 (1단 동사)'),
    ('出る', 'でる', '나가다, 나서다 (うちを 出る)', '나서다', '2그룹 (1단 동사)'),
    ('やめる', 'やめる', '그만두다 (会社を やめる)', '그만두다', '2그룹 (1단 동사)'),
    ('できる', 'できる', '생기다, 완성되다 / 할 수 있다', '생기다', '2그룹 (1단 동사)'),
    ('休む', 'やすむ', '쉬다', '쉬다', '1그룹 (5단 동사)'),
    ('着く', 'つく', '도착하다 (~に 着く)', '도착하다', '1그룹 (5단 동사)'),
]
H4_NEW = {'始める', '出る', 'やめる', 'できる', '休む', '着く'}
H3_NEW = {'忘れる', '止める', 'つれる', 'やせる', '座る', '探す', '泣く', '働く', '通う', '死ぬ', '頑張る', '太る'}
MASU_LABELS = [('masu', '현재 긍정 (~ます)', 'ます'), ('masen', '현재 부정 (~ません)', 'ません'),
               ('mashita', '과거 긍정 (~ました)', 'ました'), ('masendeshita', '과거 부정 (~ませんでした)', 'ませんでした'),
               ('tai', '희망 (~たいです)', 'たいです'), ('ni_iku', '목적 (~に行きます)', ('に行きます', 'にいきます')),
               ('mashou', '청유 (~ましょう)', 'ましょう'), ('masenka', '권유 (~ませんか)', 'ませんか')]


def make_verb(dict_, hira, kr, kbase, cat):
    g = group_of(cat)
    st, sth = masu_stem(dict_, g), masu_stem(hira, g)
    kf = ko_verb_forms(kbase)
    forms = []
    for key, label, suf in MASU_LABELS:
        if (dict_ in NATURE and key in ('tai', 'ni_iku', 'mashou', 'masenka')) or (dict_ in ('死ぬ', 'やせる', '太る') and key in ('ni_iku', 'mashou', 'masenka')):
            continue
        js, hs = (suf, suf) if isinstance(suf, str) else suf
        forms.append({'label': label, 'ja': st + js, 'hira': sth + hs, 'kr': kf[key]})
    if g == 3:
        rule = 'する ➔ します (3그룹 불규칙: 명사 + する)'
    elif g == 2:
        rule = f'어미 る 앞이 {"い" if sth[-1] in "いきしちにひみりぎじびぴ" else "え"}단({sth[-1]}): 어미 る를 떼고 ます 결합'
    else:
        rule = f'어미 「{dict_[-1]}」를 い단 「{st[-1]}」로 바꾸고 ます 결합'
    return {'cat': cat, 'dict': dict_, 'dictHira': hira, 'kr': kr, 'kr_base': kbase, 'rule': rule,
            'stem': st, 'stemHira': sth, 'forms': forms}


verb_p = D / 'special' / 'verb.js'
verb = load_data(verb_p)
existing = {i['dict'] for i in verb['conjugationItems']}
for v in NEW_VERBS:
    if v[0] not in existing:
        verb['conjugationItems'].append(make_verb(*v))
for item in verb['conjugationItems']:
    add_te_forms(item)
    # 하 3과: て형 활용 Ⅱ (매 실행마다 다시 만듦)
    item['forms'] = [f for f in item['forms'] if f['label'] not in TE2_LABELS]
    item['forms'] += te2_forms(item['dict'], item['dictHira'], item.get('kr_base') or ko_primary(item['kr']),
                               group_of(item['cat']), since=V4)
    if item['dict'] in H3_NEW:
        item['since'] = V4
    # 하 4과: た형 + ~たことがある / ~た方がいい / ~たばかり
    item['forms'] = [f for f in item['forms'] if f['label'] not in TA_LABELS]
    item['forms'] += ta_forms(item['dict'], item['dictHira'], item.get('kr_base') or ko_primary(item['kr']),
                              group_of(item['cat']), since=VERSION)
    if item['dict'] in H4_NEW:
        item['since'] = VERSION
    if 'た형:' not in item['rule']:
        item['rule'] += ' | た형: て형과 같은 규칙 (て➔た, で➔だ)'
    # 활용형 묶음 표시 (연습실의 "활용형별 집중 연습" 필터용)
    masu_labels = {lab for _, lab, _ in MASU_LABELS}
    te_labels = {lab for _, lab, _, _ in TE_LABELS}
    for f in item['forms']:
        if f['label'] in TA_LABELS:
            f['fam'] = 'た형'
        elif f['label'] in TE2_LABELS:
            f['fam'] = 'て형Ⅱ'
        elif f['label'] in te_labels:
            f['fam'] = 'て형'
        elif f['label'] in masu_labels or f['label'].startswith(('현재', '과거', '희망', '목적', '청유', '권유')):
            f['fam'] = 'ます형'
    if 'て형Ⅱ' not in item['rule']:
        item['rule'] += ' | て형Ⅱ: ~てみる・~ておく・~てしまう・~てもいい・~てはいけない・~てばかりいる / ~たがる'
# keep groups together: 3 → 2 → 1 → 예외
order = {'3그룹 (불규칙)': 0, '2그룹 (1단 동사)': 1, '1그룹 (5단 동사)': 2, '예외 1그룹 (필수 암기)': 3}
verb['conjugationItems'].sort(key=lambda i: order.get(i['cat'], 9))

word_keys = {w['hira'] for w in verb['words']}
for dict_, hira, kr, kbase, cat in NEW_VERBS:
    if hira in word_keys:
        continue
    g = group_of(cat)
    verb['words'].append({'kr': f'{kr} (→ {masu_stem(dict_, g)}ます / {te(dict_, g)})', 'hira': hira,
                          'kanji': dict_ if dict_ != hira else '-', 'category': cat})
for kr, hira in [('て형 (~하고 / ~해서)', '～て・～で'), ('진행 (~하고 있습니다)', '～ています'),
                 ('요청 (~해 주세요)', '～てください'), ('순서 (~하고 나서)', '～てから')]:
    if hira not in word_keys:
        verb['words'].append({'kr': kr, 'hira': hira, 'kanji': hira, 'category': 'て형 응용'})

have_ja = {s['ja'] for s in verb['sentences']}
next_id = max(s['id'] for s in verb['sentences']) + 1
for s in VERB_TE_SENTENCES:
    if s['ja'] in have_ja:
        continue
    verb['sentences'].append({'id': next_id, 'part': 2, **s})
    next_id += 1
if 'data-te-section' not in verb['grammarHtml']:
    verb['grammarHtml'] = verb['grammarHtml'].rstrip() + '\n' + VERB_TE_GRAMMAR_HTML
# 하 3과 문법 카드(て형 활용 Ⅱ ~ ~たがる)를 동사 특강에도 추가 (표식으로 한 번만)
if 'data-te2-section' not in verb['grammarHtml']:
    verb['grammarHtml'] = verb['grammarHtml'].rstrip() + '\n<div data-te2-section class="mt-6">' + H3_GRAMMAR + '</div>'
for s3, _ in [H3_P1[4], H3_P1[8], H3_P1[13], H3_P1[15], H3_P2[3], H3_P2[7]]:
    if s3['ja'] in have_ja:
        continue
    verb['sentences'].append({'id': next_id, 'part': 2, **s3, 'since': V4})
    next_id += 1
for kr, hira in [('~해 보다', '～てみる'), ('~해 두다', '～ておく'), ('~해 버리다', '～てしまう'), ('~해도 됩니다', '～てもいいです'),
                 ('~해서는 안 됩니다', '～てはいけません'), ('~하고만 있다', '～てばかりいる'), ('(3인칭) ~하고 싶어 하다', '～たがる')]:
    if hira not in word_keys:
        verb['words'].append({'kr': kr, 'hira': hira, 'kanji': hira, 'category': 'て형 활용 Ⅱ (하 3과)'})
# 하 4과 문법 카드 + 예문
if 'data-ta-section' not in verb['grammarHtml']:
    verb['grammarHtml'] = verb['grammarHtml'].rstrip() + '\n<div data-ta-section class="mt-6">' + H4_GRAMMAR + '</div>'
have_ja = {x['ja'] for x in verb['sentences']}
for s4, _ in [H4_P1[0], H4_P1[5], H4_P1[8], H4_P1[13], H4_P2[7], H4_P2[13]]:
    if s4['ja'] in have_ja:
        continue
    verb['sentences'].append({'id': next_id, 'part': 2, **s4, 'since': VERSION})
    next_id += 1
for kr, hira in [('た형 (~했다: 보통형 과거)', '～た・～だ'), ('~한 적이 있습니다', '～たことがあります'),
                 ('~하는 편이 좋습니다', '～たほうがいいです'), ('막 ~했습니다', '～たばかりです')]:
    if hira not in word_keys:
        verb['words'].append({'kr': kr, 'hira': hira, 'kanji': hira, 'category': 'た형 (하 4과)'})
verb['updatedIn'] = VERSION
verb['title'] = '일본어 동사 활용 (1·2·3그룹 구분 & ます형·て형·て형Ⅱ·た형 응용) 마스터'
verb['badge'] = '동사 그룹 & ます형·て형 활용'
verb['subtitle'] = '3그룹 • 2그룹 • 1그룹 구분 · ます형 8형태 + て형(~て/~ています/~てください/~てから) + て형Ⅱ(~てみる/~ておく/~てしまう/~てもいい/~てはいけない/~てばかり) + ~たがる + た형(~た/~たことがある/~た方がいい/~たばかり)'
verb['sample'] = '待つ ➔ 待ちます / 待って / 待っています / 待ってください / 待ってから'
save_data(verb_p, 'LESSONS_DB', 'verb', verb)

# ------------------------------------------------------------------ adjectives
IADJ_PRIMARY = {'古い': '낡다', '暑い': '덥다', '寒い': '춥다', '熱い': '뜨겁다', '冷たい': '차갑다', 'いい': '좋다'}
NAADJ_PRIMARY = {'素敵だ': '멋지다', '大事だ': '소중하다', '上手だ': '능숙하다', '苦手だ': '자신없다',
                 '得意だ': '자신있다', '下手だ': '서투르다', '元気だ': '건강하다', '綺麗だ': '예쁘다'}
VERBISH = {'좋아하다', '싫어하다'}  # 관형형 ~는, 변화 ~게 됩니다
TASTE_PRED = {'好きだ': '좋아합니다', '嫌いだ': '싫어합니다', '上手だ': '잘합니다', '下手だ': '못합니다',
              '得意だ': '잘합니다 (자신 있습니다)', '苦手だ': '못합니다 (자신 없습니다)'}


def regen_adj(item, primary, kind):
    d = primary
    s = ko.stem_of(d)
    if d in VERBISH:
        adn, become = s + '는', s + '게 됩니다'
    else:
        adn, become = ko.adnominal_adj(d), ko.become(d)
    for f in item['forms']:
        lab = f['label']
        if lab.startswith('명사 수식'):
            marker = '은/는(한) ' if kind == 'i' else 'ㄴ/은/한 '
            if marker in f['kr']:
                f['kr'] = f"{adn} {f['kr'].split(marker)[-1]}"
        elif lab.startswith('현재 긍정'):
            f['kr'] = ko.polite(d)
        elif lab.startswith('현재 부정 2'):
            f['kr'] = ko.neg(d) + ' (정중)'
        elif lab.startswith('현재 부정'):
            f['kr'] = ko.neg(d)
        elif lab.startswith('과거 긍정'):
            f['kr'] = ko.past(d)
        elif lab.startswith('과거 부정'):
            f['kr'] = ko.neg_past(d)
        elif lab.startswith('상태 변화'):
            f['kr'] = become
        elif lab.startswith('대상 조사'):
            noun = f['kr'].split('을/를')[0] if '을/를' in f['kr'] else None
            if noun:
                f['kr'] = f"{ko.eul(noun)} {TASTE_PRED[item['dict']]}"
    return d


iadj_p = D / 'special' / 'iadj.js'
iadj = load_data(iadj_p)
COLOR_ADJ = [('青い', 'あおい', '파랗다', ('ブラウス', '블라우스')), ('赤い', 'あかい', '빨갛다', ('靴', '구두'))]
have_adj = {i['dict'] for i in iadj['conjugationItems']}
for dict_, hira, kr, (noun, noun_kr) in COLOR_ADJ:
    if dict_ in have_adj:
        continue
    st, sth = dict_[:-1], hira[:-1]
    noun_hira = {'靴': 'くつ'}.get(noun, noun)
    forms = [('명사 수식 (~い + 명사)', f'{dict_} {noun}', f'{hira} {noun_hira}', f'{ko.adnominal_adj(kr)} {noun_kr}')]
    forms += [(lab, st + suf, sth + suf, '') for lab, suf in [
        ('현재 긍정 (~いです)', 'いです'), ('현재 부정 1 (~くないです)', 'くないです'), ('현재 부정 2 (~くありません)', 'くありません'),
        ('과거 긍정 (~かったです)', 'かったです'), ('과거 부정 (~くなかったです)', 'くなかったです'), ('상태 변화 (~くなります)', 'くなります')]]
    iadj['conjugationItems'].append({'cat': '④ 색깔 어휘 (하 2과)', 'dict': dict_, 'dictHira': hira, 'kr': kr,
        'rule': '어미 い를 활용: 명사 수식은 그대로 ~い + 명사', 'forms': [{'label': a, 'ja': b, 'hira': c, 'kr': d} for a, b, c, d in forms]})
    iadj['words'].append({'kr': kr, 'hira': hira, 'kanji': dict_, 'category': '④ 색깔 어휘 (하 2과)'})
NEW_IADJ_H3 = [('うらやましい', 'うらやましい', '부럽다', ('生活', 'せいかつ', '생활')),
               ('こわい', 'こわい', '무섭다', ('映画', 'えいが', '영화')),
               ('ほしい', 'ほしい', '갖고 싶다', ('物', 'もの', '것'))]
have_adj = {i['dict'] for i in iadj['conjugationItems']}
for dict_, hira, kr, (noun, noun_h, noun_kr) in NEW_IADJ_H3:
    if dict_ in have_adj:
        continue
    st, sth = dict_[:-1], hira[:-1]
    forms = [('명사 수식 (~い + 명사)', f'{dict_} {noun}', f'{hira} {noun_h}', f'{ko.adnominal_adj(kr)} {noun_kr}')]
    forms += [(lab, st + suf, sth + suf, '') for lab, suf in [
        ('현재 긍정 (~いです)', 'いです'), ('현재 부정 1 (~くないです)', 'くないです'), ('현재 부정 2 (~くありません)', 'くありません'),
        ('과거 긍정 (~かったです)', 'かったです'), ('과거 부정 (~くなかったです)', 'くなかったです'), ('상태 변화 (~くなります)', 'くなります')]]
    iadj['conjugationItems'].append({'cat': '③ 감정·성상 어휘', 'dict': dict_, 'dictHira': hira, 'kr': kr, 'since': V4,
        'rule': '어미 い를 활용 / 3인칭 감정은 어간 + がる', 'forms': [{'label': a, 'ja': b, 'hira': c, 'kr': d} for a, b, c, d in forms]})
    iadj['words'].append({'kr': kr, 'hira': hira, 'kanji': '-', 'category': '③ 감정·성상 어휘 (하 3과)'})
IADJ_PRIMARY['ほしい'] = '갖고 싶다'
EMOTION = {'ほしい', 'こわい', '難しい', 'うらやましい', 'うれしい', 'かなしい', '痛い'}
for item in iadj['conjugationItems']:
    d = regen_adj(item, IADJ_PRIMARY.get(item['dict'], ko_primary(item['kr'])), 'i')
    st, sth = ('よ', 'よ') if item['dict'] == 'いい' else (item['dict'][:-1], item['dictHira'][:-1])
    item['forms'] = [f for f in item['forms'] if not f['label'].startswith(('~くても', '3인칭 감정'))]
    item['forms'].append({'label': '~くても (~해도 / ~하더라도)', 'ja': st + 'くても', 'hira': sth + 'くても',
                          'kr': f'{ko.a_form(d)}도', 'since': V4})
    item['forms'] = [f for f in item['forms'] if not f['label'].startswith('보통형 과거')]
    item['forms'].append({'label': '보통형 과거 (~かった: 일기체)', 'ja': st + 'かった', 'hira': sth + 'かった',
                          'kr': ko.past_plain(d), 'since': VERSION})
    if item['dict'] in EMOTION:
        gst, gsth = item['dict'][:-1], item['dictHira'][:-1]
        item['forms'].append({'label': '3인칭 감정 (~がって います)', 'ja': gst + 'がって います', 'hira': gsth + 'がって います',
                              'kr': f'{ko.a_form(d)}합니다', 'since': V4})
    lab = 'て형 연결 (~くて: 나열·이유)'
    if not any(f['label'] == lab for f in item['forms']):
        if item['dict'] == 'いい':
            ja, hi = 'よくて', 'よくて'
        else:
            ja, hi = item['dict'][:-1] + 'くて', item['dictHira'][:-1] + 'くて'
        item['forms'].append({'label': lab, 'ja': ja, 'hira': hi, 'kr': f'{ko.go(d)} / {ko.seo(d)}'})
    if 'くて' not in item['rule']:
        item['rule'] += ' | て형: 어미 い ➔ くて' + (' (⚠️ いい ➔ よくて)' if item['dict'] == 'いい' else '')
iadj['subtitle'] = '반의어 • 계절·날씨 • 감정·색깔 어휘 및 명사수식・부정・과거・변화・て형(~くて)・~くても・3인칭 감정(~がる)'
iadj['updatedIn'] = VERSION
save_data(iadj_p, 'LESSONS_DB', 'iadj', iadj)

naadj_p = D / 'special' / 'naadj.js'
naadj = load_data(naadj_p)
for item in naadj['conjugationItems']:
    d = regen_adj(item, NAADJ_PRIMARY.get(item['dict'], ko_primary(item['kr'])), 'na')
    lab = 'て형 연결 (~で: 나열·이유)'
    item['forms'] = [f for f in item['forms'] if f['label'] != lab]
    ja, hi = item['dict'][:-1] + 'で', item['dictHira'][:-1] + 'で'
    item['forms'].insert(6, {'label': lab, 'ja': ja, 'hira': hi, 'kr': f'{ko.go(d)} / {ko.seo(d)}'})
    if '~で' not in item['rule'] and 'て형' not in item['rule']:
        item['rule'] += ' | て형: 어미 だ ➔ で'
    item['forms'] = [f for f in item['forms'] if not f['label'].startswith('~でも')]
    item['forms'].append({'label': '~でも (~해도)', 'ja': item['dict'][:-1] + 'でも', 'hira': item['dictHira'][:-1] + 'でも',
                          'kr': f'{ko.a_form(d)}도', 'since': V4})
    item['forms'] = [f for f in item['forms'] if not f['label'].startswith('보통형 과거')]
    item['forms'].append({'label': '보통형 과거 (~だった: 일기체)', 'ja': item['dict'][:-1] + 'だった',
                          'hira': item['dictHira'][:-1] + 'だった', 'kr': ko.past_plain(d), 'since': VERSION})
naadj['subtitle'] = '상태·성품 • 취향·능력(好き/上手/得意) 어휘 및 ~な 명사수식 • ~ではありません • ~になります • て형(~で) • ~でも'
naadj['updatedIn'] = VERSION
save_data(naadj_p, 'LESSONS_DB', 'naadj', naadj)

# ------------------------------------------------------------------ 상권 단원 안의 형용사 해석도 같은 방식으로 재생성 (13과)
for n in (12, 13, 14, 15):
    p = D / 'lessons' / f's{n}.js'
    d = load_data(p)
    for item in d['conjugationItems']:
        labels = [f['label'] for f in item['forms']]
        if not any(lab.startswith('명사 수식') for lab in labels):
            continue
        if item['dict'].endswith('だ'):
            regen_adj(item, NAADJ_PRIMARY.get(item['dict'], ko_primary(item['kr'])), 'na')
        else:
            regen_adj(item, IADJ_PRIMARY.get(item['dict'], ko_primary(item['kr'])), 'i')
    for s in d['sentences']:  # 원본 오타 수정
        s['hira'] = s['hira'].replace('はなしまさんでした', 'はなしませんでした')
    save_data(p, 'LESSONS_DB', str(n), d)

# ------------------------------------------------------------------ new modules & 하 1과
save_data(D / 'special' / 'noun.js', 'LESSONS_DB', 'noun', build_noun())
save_data(D / 'special' / 'date.js', 'LESSONS_DB', 'date', build_date())
save_data(D / 'lessons' / 'h01.js', 'LESSONS_DB', 'h1', build_h1())
save_data(D / 'lessons' / 'h02.js', 'LESSONS_DB', 'h2', build_h2())
save_data(D / 'lessons' / 'h03.js', 'LESSONS_DB', 'h3', build_h3())
save_data(D / 'lessons' / 'h04.js', 'LESSONS_DB', 'h4', build_h4())

# ------------------------------------------------------------------ furigana map
fp = D / 'furigana.js'
furi = load_data(fp)
keys = {k for k, _ in furi}
FURIGANA_FIXES = [  # 기존 맵이 잘못 읽던 경우를 더 긴 키로 바로잡음 (긴 키가 먼저 적용됨)
    ('中国', 'ちゅうごく'), ('電話します', 'でんわします'), ('主人公', 'しゅじんこう'), ('何ですか', 'なんですか'),
    ('何歳', 'なんさい'), ('後は', 'あとは'), ('後に', 'あとに'), ('一日です', 'ついたちです'), ('一日、', 'ついたち、'),
    ('日本', 'にほん'), ('今度', 'こんど'), ('場所', 'ばしょ'),
]
for k, r in FURIGANA_FIXES + H1_FURIGANA + H2_FURIGANA + H3_FURIGANA + H4_FURIGANA + SPECIAL_FURIGANA:
    if k not in keys:
        furi.append([k, r])
        keys.add(k)
FURIGANA_REMOVE = {('家へ', 'うちへ')}  # 다른 단원은 いえへ로 읽음 → h1은 더 긴 키 사용
furi = [kr for kr in furi if tuple(kr) not in FURIGANA_REMOVE]
furi.sort(key=lambda kr: -len(kr[0]))
save_data(fp, 'FURIGANA_MAP', None, furi)
print('done')
