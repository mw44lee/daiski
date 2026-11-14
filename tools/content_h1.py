"""다이스키 (하) 1과 — 동사의 て형 Ⅰ / 명사·형용사의 て형 / ~ています / ~てください / ~てから

Sources: materials/다이스키(하) 1과 단어장.pdf, materials/하 1과 추가자료.pdf
단문은 content_h1_sentences.py (단문표현-1/-2, 원어민 음성 구간 포함).
"""
import ko
from jp import S, group_of, masu_stem, te, te_rule
from content_h1_sentences import PART1, PART2, FURIGANA as SENT_FURIGANA

WORDS = [  # kr, hira, kanji('-' = 없음), category
    ('아침밥', 'あさごはん', '朝ご飯', '명사'),
    ('빨리, 빠르게 / 일찍', 'はやく', '早く', '부사·형용사'),
    ('일어나고 / 일어나서 / 일어나', 'おきて', '起きて', 'て형 활용'),
    ('먹고 / 먹어서 / 먹어', 'たべて', '食べて', 'て형 활용'),
    ('마시고 / 마셔서 / 마셔', 'のんで', '飲んで', 'て형 활용'),
    ('끝나고 / 끝나서 / 끝나', 'おわって', '終わって', 'て형 활용'),
    ('만나고 / 만나서 / 만나', 'あって', '会って', 'て형 활용'),
    ('기다리고 / 기다려서 / 기다려', 'まって', '待って', 'て형 활용'),
    ('보고 / 봐서 / 봐', 'みて', '見て', 'て형 활용'),
    ('맛있고 / 맛있어서 / 맛있어', 'おいしくて', '-', 'て형 활용'),
    ('덥고 / 더워서', 'あつくて', '暑くて', 'て형 활용'),
    ('성실하고 / 성실해서', 'まじめで', '-', 'て형 활용'),
    ('편리하고 / 편리해서', 'べんりで', '便利で', 'て형 활용'),
    ('영화관', 'えいがかん', '映画館', '명사'),
    ('음악', 'おんがく', '音楽', '명사'),
    ('열다', 'あける', '開ける', '동사'),
    ('사진', 'しゃしん', '写真', '명사'),
    ('(사진을) 찍다', 'とる', '撮る', '동사'),
    ('전기 / 불', 'でんき', '電気', '명사'),
    ('기타', 'ギター', '-', '명사'),
    ('(악기를) 치다', 'ひく', '弾く', '동사'),
    ('듣다', 'きく', '聞く', '동사'),
    ('걷다', 'あるく', '歩く', '동사'),
    ('쓰다', 'かく', '書く', '동사'),
    ('알려주다, 가르치다', 'おしえる', '教える', '동사'),
    ('만들다', 'つくる', '作る', '동사'),
    ('공부(하다)', 'べんきょう(する)', '勉強(する)', '동사'),
    ('개', 'いぬ', '犬', '명사'),
    ('놀다', 'あそぶ', '遊ぶ', '동사'),
    ('도서관', 'としょかん', '図書館', '명사'),
    ('숙제', 'しゅくだい', '宿題', '명사'),
    ('커피', 'コーヒー', '-', '명사'),
    ('이야기하다', 'はなす', '話す', '동사'),
    ('집', 'いえ', '家', '명사'),
    ('돌아가다 / 귀가하다', 'かえる', '帰る', '동사'),
    ('저녁밥', 'ゆうごはん', '夕ご飯', '명사'),
    ('TV', 'テレビ', '-', '명사'),
    ('친구', 'ともだち', '友達', '명사'),
    ('얼굴', 'かお', '顔', '명사'),
    ('씻다', 'あらう', '洗う', '동사'),
    ('공원', 'こうえん', '公園', '명사'),
    ('운동', 'うんどう', '運動', '명사'),
    ('같이 / 함께', 'いっしょに', '一緒に', '부사·형용사'),
    ('~를 타다', '～にのる', '～に乗る', '동사'),
    ('회사', 'かいしゃ', '会社', '명사'),
    ('배우다', 'ならう', '習う', '동사'),
    ('내년', 'らいねん', '来年', '명사'),
    ('4월', 'しがつ', '四月', '명사'),
    ('예정', 'よてい', '予定', '명사'),
    ('매일', 'まいにち', '毎日', '명사'),
    ('책을 읽다', 'ほんをよむ', '本を読む', '동사'),
    ('한자', 'かんじ', '漢字', '명사'),
    ('가장, 제일', 'いちばん', '一番', '부사·형용사'),
    ('어렵다', 'むずかしい', '難しい', '부사·형용사'),
]

# (dict, hira, 한국어 기본형, cat)
H1_VERBS = [
    ('会う', 'あう', '만나다', '1그룹 (5단 동사)'),
    ('待つ', 'まつ', '기다리다', '1그룹 (5단 동사)'),
    ('撮る', 'とる', '찍다', '1그룹 (5단 동사)'),
    ('終わる', 'おわる', '끝나다', '1그룹 (5단 동사)'),
    ('飲む', 'のむ', '마시다', '1그룹 (5단 동사)'),
    ('遊ぶ', 'あそぶ', '놀다', '1그룹 (5단 동사)'),
    ('書く', 'かく', '쓰다', '1그룹 (5단 동사)'),
    ('歩く', 'あるく', '걷다', '1그룹 (5단 동사)'),
    ('泳ぐ', 'およぐ', '수영하다', '1그룹 (5단 동사)'),
    ('話す', 'はなす', '이야기하다', '1그룹 (5단 동사)'),
    ('帰る', 'かえる', '돌아가다', '★ 예외 (帰る・行く)'),
    ('行く', 'いく', '가다', '★ 예외 (帰る・行く)'),
    ('見る', 'みる', '보다', '2그룹 (1단 동사)'),
    ('起きる', 'おきる', '일어나다', '2그룹 (1단 동사)'),
    ('食べる', 'たべる', '먹다', '2그룹 (1단 동사)'),
    ('開ける', 'あける', '열다', '2그룹 (1단 동사)'),
    ('来る', 'くる', '오다', '3그룹 (불규칙)'),
    ('勉強する', 'べんきょうする', '공부하다', '3그룹 (불규칙)'),
]
# (dict, hira, kr, 한국어 기본형, kind) kind: i / na / n
H1_NOMINALS = [
    ('おいしい', 'おいしい', '맛있다', '맛있다', 'i'),
    ('暑い', 'あつい', '덥다', '덥다', 'i'),
    ('難しい', 'むずかしい', '어렵다', '어렵다', 'i'),
    ('おもしろい', 'おもしろい', '재미있다', '재미있다', 'i'),
    ('まじめだ', 'まじめだ', '성실하다', '성실하다', 'na'),
    ('便利だ', 'べんりだ', '편리하다', '편리하다', 'na'),
    ('静かだ', 'しずかだ', '조용하다', '조용하다', 'na'),
    ('先生', 'せんせい', '선생님', '선생님', 'n'),
    ('学生', 'がくせい', '학생', '학생', 'n'),
    ('会社員', 'かいしゃいん', '회사원', '회사원', 'n'),
]
CAT_NOMINAL = {'i': 'い형용사 (い ➔ くて)', 'na': 'な형용사 (だ ➔ で)', 'n': '명사 (+ で)'}


def _verb_item(dict_, hira, kbase, cat):
    g = 3 if cat.startswith('3') else 2 if cat.startswith('2') else 1
    t, th = te(dict_, g), te(hira, g)
    s, a = ko.stem_of(kbase), ko.a_form(kbase)
    forms = [
        {'label': 'ます형 (~ます)', 'ja': masu_stem(dict_, g) + 'ます', 'hira': masu_stem(hira, g) + 'ます', 'kr': ko.polite(kbase)},
        {'label': 'て형 (~て: ~하고/~해서)', 'ja': t, 'hira': th, 'kr': f'{s}고 / {a}서'},
        {'label': '진행 (~ています)', 'ja': t + 'います', 'hira': th + 'います',
         'kr': '끝나 있습니다 (결과 상태)' if dict_ == '終わる' else f'{s}고 있습니다'},
        {'label': '요청 (~てください)', 'ja': t + 'ください', 'hira': th + 'ください', 'kr': f'{a} 주세요'},
        {'label': '순서 (~てから)', 'ja': t + 'から', 'hira': th + 'から', 'kr': f'{s}고 나서'},
    ]
    if dict_ == '終わる':  # '끝나 주세요'는 부자연스러워 제외
        forms = [f for f in forms if not f['label'].startswith('요청')]
    return {'cat': cat, 'dict': dict_, 'dictHira': hira, 'kr': kbase,
            'rule': te_rule(dict_, g, '예외' if cat.startswith('★') and dict_ == '帰る' else ''),
            'stem': t[:-1], 'stemHira': th[:-1], 'forms': forms}


def _nominal_item(dict_, hira, kr, kbase, kind):
    if kind == 'i':
        tj, th = dict_[:-1] + 'くて', hira[:-1] + 'くて'
        polite = (dict_ + 'です', hira + 'です', ko.polite(kbase))
        neg = (dict_[:-1] + 'くないです', hira[:-1] + 'くないです', ko.neg(kbase))
        tk = f'{ko.go(kbase)} / {ko.seo(kbase)}'
        rule = 'い형용사 て형: 어미 い ➔ くて (나열 ~하고 / 이유 ~해서)'
    elif kind == 'na':
        tj, th = dict_[:-1] + 'で', hira[:-1] + 'で'
        polite = (dict_[:-1] + 'です', hira[:-1] + 'です', ko.polite(kbase))
        neg = (dict_[:-1] + 'では ありません', hira[:-1] + 'では ありません', ko.neg(kbase))
        tk = f'{ko.go(kbase)} / {ko.seo(kbase)}'
        rule = 'な형용사 て형: 어미 だ ➔ で (나열 ~하고 / 이유 ~해서)'
    else:
        tj, th = dict_ + 'で', hira + 'で'
        b = ko.has_batchim(kbase)
        polite = (dict_ + 'です', hira + 'です', kbase + '입니다')
        neg = (dict_ + 'では ありません', hira + 'では ありません', kbase + ('이' if b else '가') + ' 아닙니다')
        tk = f'{kbase}이고 / {kbase}' + ('이라서' if b else '라서')
        rule = '명사 て형: 명사 + で (나열 ~이고 / 이유 ~라서)'
    forms = [
        {'label': '정중형 (~です)', 'ja': polite[0], 'hira': polite[1], 'kr': polite[2]},
        {'label': '부정형', 'ja': neg[0], 'hira': neg[1], 'kr': neg[2]},
        {'label': 'て형 연결 (나열·이유)', 'ja': tj, 'hira': th, 'kr': tk},
    ]
    return {'cat': CAT_NOMINAL[kind], 'dict': dict_, 'dictHira': hira, 'kr': kr, 'rule': rule, 'forms': forms}


GRAMMAR_HTML = '''
<div class="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-8">
  <div class="border-b border-slate-100 pb-4">
    <span class="text-xs font-bold text-orange-700 bg-orange-50 px-3 py-1 rounded-full">다이스키 (하) 1과 핵심 문법</span>
    <h3 class="text-2xl font-extrabold text-slate-900 mt-2">① 동사의 て형 Ⅰ</h3>
    <p class="text-xs text-slate-500 mt-1">て형은 "~하고 / ~해서"로 문장을 잇거나, ~ています · ~てください · ~てから 문형을 만드는 기본 형태입니다.</p>
  </div>
  <div class="overflow-x-auto">
    <table class="w-full text-sm font-jp border border-slate-200">
      <thead class="bg-slate-50 text-xs text-slate-600 font-sans"><tr><th class="p-3 text-left">그룹</th><th class="p-3 text-left">규칙</th><th class="p-3 text-left">예</th></tr></thead>
      <tbody class="divide-y divide-slate-100">
        <tr><td class="p-3 font-sans font-bold align-top" rowspan="7">1그룹<br>(5단동사)</td><td class="p-3 font-bold text-orange-700">う・つ・る ➔ って</td><td class="p-3">会う ➔ 会って</td></tr>
        <tr><td class="p-3 font-bold text-orange-700">ぬ・む・ぶ ➔ んで</td><td class="p-3">飲む ➔ 飲んで</td></tr>
        <tr><td class="p-3 font-bold text-orange-700">く ➔ いて</td><td class="p-3">書く ➔ 書いて</td></tr>
        <tr><td class="p-3 font-bold text-orange-700">ぐ ➔ いで</td><td class="p-3">泳ぐ ➔ 泳いで</td></tr>
        <tr><td class="p-3 font-bold text-orange-700">す ➔ して</td><td class="p-3">話す ➔ 話して</td></tr>
        <tr><td class="p-3 font-bold text-rose-700">★ 帰る ➔ 帰って</td><td class="p-3">★ 帰る ➔ 帰って (예외 1그룹)</td></tr>
        <tr><td class="p-3 font-bold text-rose-700">(예외) ★ 行く ➔ 行って</td><td class="p-3">★ 行く ➔ 行って</td></tr>
        <tr><td class="p-3 font-sans font-bold">2그룹<br>(상1단·하1단)</td><td class="p-3 font-bold text-emerald-700">る를 떼고 + て</td><td class="p-3">見る ➔ 見て / 起きる ➔ 起きて / 食べる ➔ 食べて / 寝る ➔ 寝て</td></tr>
        <tr><td class="p-3 font-sans font-bold">3그룹<br>(カ행·サ행 변격)</td><td class="p-3 font-bold text-indigo-700">来る ➔ 来て / する ➔ して</td><td class="p-3">来(く)る ➔ 来(き)て / 勉強する ➔ 勉強して</td></tr>
      </tbody>
    </table>
  </div>

  <div class="space-y-3">
    <h3 class="text-xl font-extrabold text-slate-900">② 명사 · 형용사의 て형</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
      <div class="p-4 rounded-2xl bg-lime-50/60 border border-lime-200 space-y-1.5 font-jp">
        <div class="font-extrabold text-lime-800 font-sans">명사 + で</div>
        <div>会社員 ➔ 会社員<b class="text-orange-600">で</b> / 先生 ➔ 先生<b class="text-orange-600">で</b></div>
        <div class="text-slate-700">私は 会社員で、木村さんは 医者です。</div>
        <div class="text-slate-500 font-sans">저는 회사원이고, 기무라 씨는 의사입니다.</div>
      </div>
      <div class="p-4 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-1.5 font-jp">
        <div class="font-extrabold text-sky-800 font-sans">い형용사: い ➔ くて</div>
        <div>おいしい ➔ おいし<b class="text-orange-600">くて</b> / 難しい ➔ 難し<b class="text-orange-600">くて</b></div>
        <div class="text-slate-700">この 店は おいしくて 安いです。<span class="font-sans text-slate-400">(나열)</span></div>
        <div class="text-slate-700">暑くて ドアを 開けました。<span class="font-sans text-slate-400">(이유)</span></div>
      </div>
      <div class="p-4 rounded-2xl bg-pink-50/60 border border-pink-200 space-y-1.5 font-jp">
        <div class="font-extrabold text-pink-800 font-sans">な형용사: だ ➔ で</div>
        <div>便利だ ➔ 便利<b class="text-orange-600">で</b> / にぎやかだ ➔ にぎやか<b class="text-orange-600">で</b></div>
        <div class="text-slate-700">山田さんは まじめで 親切です。<span class="font-sans text-slate-400">(나열)</span></div>
        <div class="text-slate-700">ここの 交通は 便利で いいですね。<span class="font-sans text-slate-400">(이유)</span></div>
      </div>
    </div>
  </div>

  <div class="space-y-3">
    <h3 class="text-xl font-extrabold text-slate-900">③ て형 문형 3가지</h3>
    <table class="w-full text-sm font-jp border border-slate-200">
      <tbody class="divide-y divide-slate-100">
        <tr><td class="p-3 font-bold text-orange-700">～て います</td><td class="p-3 font-sans">~하고 있습니다 (진행)</td><td class="p-3">学校の 前で 友達を 待って います。<br>映画館で 映画を 見て います。<br>図書館で 勉強して います。</td></tr>
        <tr><td class="p-3 font-bold text-orange-700">～て ください</td><td class="p-3 font-sans">~해 주세요 (요청)</td><td class="p-3">電話番号を 教えて ください。<br>写真を 撮って ください。<br>電気を つけて ください。</td></tr>
        <tr><td class="p-3 font-bold text-orange-700">～てから</td><td class="p-3 font-sans">~하고 나서 (순서)</td><td class="p-3">見てから / 朝ご飯を 食べてから 会社へ 行きます。</td></tr>
      </tbody>
    </table>
  </div>

  <div class="space-y-3">
    <h3 class="text-xl font-extrabold text-slate-900">④ 단문에 함께 나오는 복습 문형</h3>
    <table class="w-full text-sm font-jp border border-slate-200">
      <tbody class="divide-y divide-slate-100">
        <tr><td class="p-3 font-bold text-indigo-700">ます형 어간 + ながら</td><td class="p-3 font-sans">~하면서 (동시동작)</td><td class="p-3">音楽を 聞きながら 歩きます。/ テレビを 見ながら パンを 食べます。</td></tr>
        <tr><td class="p-3 font-bold text-indigo-700">명사 + が ほしいです</td><td class="p-3 font-sans">~을/를 갖고 싶습니다</td><td class="p-3">プレゼントは 何が ほしいですか。携帯が ほしいです。</td></tr>
        <tr><td class="p-3 font-bold text-indigo-700">ます형 어간 + たいです</td><td class="p-3 font-sans">~하고 싶습니다</td><td class="p-3">何が 食べたいですか。すしが 食べたいです。</td></tr>
        <tr><td class="p-3 font-bold text-indigo-700">기본형 + 予定です</td><td class="p-3 font-sans">~할 예정입니다</td><td class="p-3">来年の 4月に 日本へ 行く 予定です。</td></tr>
      </tbody>
    </table>
  </div>

  <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-jp space-y-1">
    <div class="font-sans font-bold">⚠️ 시험 단골 함정</div>
    <div>• 行く ➔ 行って (行いて ✕) / 帰る ➔ 帰って (帰て ✕)</div>
    <div>• 待つ ➔ 待って (待ちて ✕) / 飲む ➔ 飲んで (飲みて ✕) / 泳ぐ ➔ 泳いで (泳いて ✕)</div>
    <div>• いい ➔ よくて (いくて ✕) / きれいだ ➔ きれいで (きれいくて ✕ — な형용사!)</div>
  </div>
</div>
'''

H1_FURIGANA = SENT_FURIGANA + [
    ('会社員', 'かいしゃいん'), ('木村', 'きむら'), ('医者', 'いしゃ'), ('店', 'みせ'), ('安い', 'やすい'), ('暑くて', 'あつくて'),
    ('開けました', 'あけました'), ('山田', 'やまだ'), ('親切', 'しんせつ'), ('交通', 'こうつう'), ('便利', 'べんり'),
    ('来年', 'らいねん'), ('四月', 'しがつ'), ('日本語', 'にほんご'), ('習う', 'ならう'), ('予定', 'よてい'), ('漢字', 'かんじ'),
    ('一番', 'いちばん'), ('難しい', 'むずかしい'), ('毎日', 'まいにち'), ('電車', 'でんしゃ'), ('乗って', 'のって'),
    ('会社', 'かいしゃ'), ('見ます', 'みます'), ('食べます', 'たべます'), ('飲みましょう', 'のみましょう'),
    ('読みます', 'よみます'), ('本', 'ほん'), ('映画', 'えいが'),
]


def build_h1():
    sents = []
    for part, rows in ((1, PART1), (2, PART2)):
        for s, audio in rows:
            sents.append({'id': len(sents) + 1, 'part': part, **s, 'audio': audio})
    words = [{'kr': kr, 'hira': h, 'kanji': k, 'category': c} for kr, h, k, c in WORDS]
    items = [_verb_item(*v) for v in H1_VERBS] + [_nominal_item(*n) for n in H1_NOMINALS]
    reading = [sents[i] for i in (0, 29, 30, 31)]  # 아침 일과 흐름 (단문 1, 30, 31, 32)
    return {
        'id': 'h1', 'label': '1(하)', 'book': '하', 'lessonNo': 1,
        'title': '제1과 동사의 て형 & 명사·형용사의 て형 마스터', 'badge': '동사·형용사 て형',
        'theme': 'from-orange-500 to-rose-600', 'accent': 'orange',
        'subtitle': '동사 て형Ⅰ(って・んで・いて・いで・して) • 명사·な형 + で / い형 くて • ~ています • ~てください • ~てから',
        'sample': sents[0]['ja'],
        'card': {
            'summary': sents[0]['kr'],
            'points': ['동사 て형Ⅰ: って / んで / いて / いで / して', '명사·な형 ～で / い형 ～くて (나열·이유)',
                       '～ています · ～てください · ～てから'],
        },
        'sentences': sents,
        'words': words,
        'reading_passage': {
            'title': '읽어 봅시다! (하 1과) — 나의 아침 일과 (단문 종합)',
            'sentences': [{'ja': s['ja'], 'hira': s['hira'], 'kr': s['kr']} for s in reading],
        },
        'grammarHtml': GRAMMAR_HTML,
        'conjugationItems': items,
    }
