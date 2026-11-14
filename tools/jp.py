"""Japanese conjugation helpers (ます형 / て형) used by build_content.py and validate.py."""

I_ROW = {'う': 'い', 'つ': 'ち', 'る': 'り', 'ぬ': 'に', 'む': 'み', 'ぶ': 'び', 'く': 'き', 'ぐ': 'ぎ', 'す': 'し'}
TE_END = {'う': 'って', 'つ': 'って', 'る': 'って', 'ぬ': 'んで', 'む': 'んで', 'ぶ': 'んで',
          'く': 'いて', 'ぐ': 'いで', 'す': 'して'}
TE_RULE = {'う': 'う・つ・る ➔ って', 'つ': 'う・つ・る ➔ って', 'る': 'う・つ・る ➔ って',
           'ぬ': 'ぬ・む・ぶ ➔ んで', 'む': 'ぬ・む・ぶ ➔ んで', 'ぶ': 'ぬ・む・ぶ ➔ んで',
           'く': 'く ➔ いて', 'ぐ': 'ぐ ➔ いで', 'す': 'す ➔ して'}


def group_of(cat):
    if cat.startswith('3그룹'):
        return 3
    if cat.startswith('2그룹'):
        return 2
    return 1


def masu_stem(word, group):
    if word.endswith('する'):
        return word[:-2] + 'し'
    if word == '来る':
        return '来'
    if word == 'くる':
        return 'き'
    if group == 2:
        return word[:-1]
    return word[:-1] + I_ROW[word[-1]]


def te(word, group):
    if word.endswith('する'):
        return word[:-2] + 'して'
    if word == '来る':
        return '来て'
    if word == 'くる':
        return 'きて'
    if word in ('行く', 'いく'):
        return word[:-1] + 'って'
    if group == 2:
        return word[:-1] + 'て'
    return word[:-1] + TE_END[word[-1]]


def te_rule(word, group, cat=''):
    if word.endswith('する'):
        return 'て형: する ➔ して (3그룹 불규칙)'
    if word == '来る':
        return 'て형: 来(く)る ➔ 来(き)て (3그룹 불규칙)'
    if word == '行く':
        return 'て형: ⚠️ 예외! 行く ➔ 行って (行いて ✕)'
    if group == 2:
        return 'て형: 어미 る를 떼고 + て'
    extra = ' (⚠️ 예외 1그룹이라 る ➔ って)' if cat.startswith('예외') else ''
    return 'て형: ' + TE_RULE[word[-1]] + extra


def kata2hira(text):
    return ''.join(chr(ord(c) - 0x60) if 'ァ' <= c <= 'ヶ' else c for c in text)


def S(kr, ja, hira, grammar, blank, hint):
    """단문 1개. blank(정답 부분)는 ja 안에 그대로 있어야 한다."""
    assert blank in ja, (blank, ja)
    return {'kr': kr, 'ja': ja, 'hira': kata2hira(hira), 'grammar': grammar,
            'blankWord': blank, 'blankQ': ja.replace(blank, f'[ 빈칸: {hint} ]', 1)}
