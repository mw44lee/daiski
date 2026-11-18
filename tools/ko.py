"""Tiny Korean conjugator for 형용사/동사 translations (handles common irregulars)."""

BASE = 0xAC00
CHO, JUNG, JONG = 19, 21, 28
J = {'ㅏ': 0, 'ㅐ': 1, 'ㅑ': 2, 'ㅓ': 4, 'ㅔ': 5, 'ㅕ': 6, 'ㅗ': 8, 'ㅘ': 9, 'ㅙ': 10, 'ㅚ': 11,
     'ㅜ': 13, 'ㅝ': 14, 'ㅡ': 18, 'ㅢ': 19, 'ㅣ': 20}
JR = {v: k for k, v in J.items()}
F = {'': 0, 'ㄴ': 4, 'ㄹ': 8, 'ㅁ': 16, 'ㅂ': 17, 'ㅆ': 20}

# ㅂ-final stems that are REGULAR (좁다→좁아)
B_REGULAR = {'좁', '잡', '입', '씹', '굽'}
# 르 stems that are 러-irregular (이르다 'early' → 일러)
REO_IRREG = {'이르'}


def split(ch):
    c = ord(ch) - BASE
    return c // (JUNG * JONG), (c // JONG) % JUNG, c % JONG


def join(cho, jung, jong=0):
    return chr(BASE + (cho * JUNG + jung) * JONG + jong)


def set_final(s, final):
    cho, jung, _ = split(s[-1])
    return s[:-1] + join(cho, jung, F[final])


def final_of(s):
    return split(s[-1])[2]


def stem_of(dict_form):
    assert dict_form.endswith('다'), dict_form
    return dict_form[:-1]


def polite(d):
    """비싸다 → 비쌉니다"""
    s = stem_of(d)
    f = final_of(s)
    if f == 0:
        return set_final(s, 'ㅂ') + '니다'
    if f == F['ㄹ']:
        return set_final(s, '') and set_final(s, 'ㅂ') + '니다'
    return s + '습니다'


F_HIEUT = 27  # ㅎ 받침
H_REGULAR = {'좋', '놓', '낳', '넣', '괜찮', '많', '않'}  # ㅎ 받침이지만 규칙 활용
JV = {**J, 'ㅒ': 3}

IRREG_A = {'걷다': '걸어', '듣다': '들어', '묻다': '물어'}  # ㄷ 불규칙


def a_form(d):
    """아/어 형: 비싸다→비싸, 높다→높아, 덥다→더워, 크다→커, 빠르다→빨라, 하다→해"""
    if d in IRREG_A:
        return IRREG_A[d]
    s = stem_of(d)
    if s.endswith('하'):
        return s[:-1] + '해'
    last = s[-1]
    cho, jung, jong = split(last)
    # ㅎ irregular (파랗다→파래, 빨갛다→빨개, 하얗다→하얘)
    if jong == F_HIEUT and s not in H_REGULAR:
        nj = {'ㅏ': 'ㅐ', 'ㅑ': 'ㅒ', 'ㅓ': 'ㅔ'}.get(JR.get(jung), 'ㅐ')
        return s[:-1] + chr(BASE + (cho * JUNG + JV[nj]) * JONG)
    # 르 irregular
    if last == '르' and len(s) > 1:
        if s in REO_IRREG:
            return s[:-2] + set_final(s[-2], 'ㄹ')[-1] + '러'
        pc, pj, _ = split(s[-2])
        vowel = '라' if JR[pj] in ('ㅏ', 'ㅗ') else '러'
        return s[:-2] + join(pc, pj, F['ㄹ']) + vowel
    # ㅂ irregular
    if jong == F['ㅂ'] and s not in B_REGULAR:
        base = s[:-1] + join(cho, jung, 0)
        return base + ('와' if s in ('돕', '곱') else '워')
    if jong:
        bright = JR.get(jung) in ('ㅏ', 'ㅗ')
        return s + ('아' if bright else '어')
    v = JR.get(jung)
    if v == 'ㅡ':  # ㅡ 탈락
        if len(s) > 1:
            pv = JR.get(split(s[-2])[1])
            nv = 'ㅏ' if pv in ('ㅏ', 'ㅗ') else 'ㅓ'
        else:
            nv = 'ㅓ'
        return s[:-1] + join(cho, J[nv])
    if v in ('ㅏ', 'ㅓ', 'ㅐ', 'ㅔ', 'ㅕ'):
        return s
    if v == 'ㅗ':
        return s[:-1] + join(cho, J['ㅘ'])
    if v == 'ㅜ':
        return s[:-1] + join(cho, J['ㅝ'])
    if v == 'ㅣ':
        return s[:-1] + join(cho, J['ㅕ'])
    if v == 'ㅚ':
        return s[:-1] + join(cho, J['ㅙ'])
    return s + '어'


def past(d):
    a = a_form(d)
    return set_final(a, 'ㅆ') + '습니다'


def adnominal_adj(d):
    """형용사 관형형: 비싼, 높은, 더운, 긴, 맛있는"""
    s = stem_of(d)
    if s.endswith('있') or s.endswith('없'):
        return s + '는'
    cho, jung, jong = split(s[-1])
    if jong == 0:
        return set_final(s, 'ㄴ')
    if jong == F_HIEUT and s not in H_REGULAR:  # 파랗다 → 파란
        return s[:-1] + join(cho, jung, F['ㄴ'])
    if jong == F['ㄹ']:
        return set_final(s, 'ㄴ')
    if jong == F['ㅂ'] and s not in B_REGULAR:
        return s[:-1] + join(cho, jung, 0) + '운'
    return s + '은'


def neg(d):
    return stem_of(d) + '지 않습니다'


def neg_past(d):
    return stem_of(d) + '지 않았습니다'


def become(d):
    return a_form(d) + '집니다'


def go(d):
    return stem_of(d) + '고'


def seo(d):
    return a_form(d) + '서'


def has_batchim(word):
    ch = word[-1]
    if not ('가' <= ch <= '힣'):
        return False
    return final_of(word) != 0


def eul(word):
    return word + ('을' if has_batchim(word) else '를')


if __name__ == '__main__':
    for w in ['비싸다', '높다', '덥다', '크다', '빠르다', '이르다', '길다', '맛있다', '느리다', '조용하다',
              '좁다', '파랗다', '빨갛다', '나쁘다', '아프다', '가볍다', '오래되다', '시원하다', '좋다', '괜찮다', '멀다', '슬프다', '잘생기다', '귀엽다']:
        print(w, adnominal_adj(w), polite(w), neg(w), past(w), become(w), go(w), seo(w))
