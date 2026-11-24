"""Content for new special modules (noun, date) and the て형 additions to the verb module."""
import ko
from jp import S

# ---------------------------------------------------------------- shared て형 sentences
TE_SENT = {
    'matte': S('학교 앞에서 친구를 기다리고 있습니다.', '学校の 前で 友達を 待って います。', 'がっこうの まえで ともだちを まって います。',
               '진행 ~ています: 待つ ➔ 待って (う・つ・る ➔ って)', '待って います', '기다리고 있습니다(待つ 진행)'),
    'mite': S('영화관에서 영화를 보고 있습니다.', '映画館で 映画を 見て います。', 'えいがかんで えいがを みて います。',
              '진행 ~ています: 見る ➔ 見て (2그룹: る ➔ て)', '見て います', '보고 있습니다(見る 진행)'),
    'benkyou': S('도서관에서 공부하고 있습니다.', '図書館で 勉強して います。', 'としょかんで べんきょうして います。',
                 '진행 ~ています: 勉強する ➔ 勉強して (3그룹)', '勉強して います', '공부하고 있습니다(勉強する 진행)'),
    'oshiete': S('전화번호를 알려 주세요.', '電話番号を 教えて ください。', 'でんわばんごうを おしえて ください。',
                 '요청 ~てください: 教える ➔ 教えて (2그룹)', '教えて ください', '알려 주세요(教える 요청)'),
    'totte': S('사진을 찍어 주세요.', '写真を 撮って ください。', 'しゃしんを とって ください。',
               '요청 ~てください: 撮る ➔ 撮って (1그룹 る ➔ って)', '撮って ください', '찍어 주세요(撮る 요청)'),
    'tsukete': S('불을 켜 주세요.', '電気を つけて ください。', 'でんきを つけて ください。',
                 '요청 ~てください: つける ➔ つけて (2그룹)', 'つけて ください', '켜 주세요(つける 요청)'),
    'tabetekara': S('아침밥을 먹고 나서 회사에 갑니다.', '朝ご飯を 食べてから 会社へ 行きます。', 'あさごはんを たべてから かいしゃへ いきます。',
                    '순서 ~てから: 食べる ➔ 食べてから (~하고 나서)', '食べてから', '먹고 나서(食べる ~てから)'),
    'shitekara': S('숙제를 하고 나서 TV를 봅니다.', '宿題を してから テレビを 見ます。', 'しゅくだいを してから テレビを みます。',
                   '순서 ~てから: する ➔ してから', 'してから', '하고 나서(する ~てから)'),
    'okite': S('매일 아침 일찍 일어나서 얼굴을 씻습니다.', '毎朝 早く 起きて、顔を 洗います。', 'まいあさ はやく おきて、かおを あらいます。',
               'て형 연결(~해서): 起きる ➔ 起きて', '起きて', '일어나서(起きる て형)'),
    'asonde': S('공원에서 개와 놀고 있습니다.', '公園で 犬と 遊んで います。', 'こうえんで いぬと あそんで います。',
                '진행 ~ています: 遊ぶ ➔ 遊んで (ぬ・む・ぶ ➔ んで)', '遊んで います', '놀고 있습니다(遊ぶ 진행)'),
    'atte': S('친구를 만나서 함께 공원을 걸었습니다.', '友達に 会って、一緒に 公園を 歩きました。', 'ともだちに あって、いっしょに こうえんを あるきました。',
              'て형 연결: 会う ➔ 会って (う ➔ って) / ~に 会う(~를 만나다)', '会って', '만나서(会う て형)'),
    'kaettekara': S('집에 돌아가고 나서 저녁밥을 먹습니다.', '家に 帰ってから 夕ご飯を 食べます。', 'いえに かえってから ゆうごはんを たべます。',
                    '⚠️ 帰る는 예외 1그룹 ➔ 帰って / ~てから(~하고 나서)', '帰ってから', '돌아가고 나서(帰る ~てから)'),
    'hiite': S('기타를 치고 있습니다.', 'ギターを 弾いて います。', 'ギターを ひいて います。',
               '진행 ~ています: 弾く ➔ 弾いて (く ➔ いて)', '弾いて います', '치고 있습니다(弾く 진행)'),
    'owatte': S('영화가 끝나고 나서 커피를 마십시다.', '映画が 終わってから コーヒーを 飲みましょう。', 'えいがが おわってから コーヒーを のみましょう。',
                '순서 ~てから: 終わる ➔ 終わって (る ➔ って)', '終わってから', '끝나고 나서(終わる ~てから)'),
    'kiite': S('매일 음악을 듣고 운동을 합니다.', '毎日 音楽を 聞いて、運動を します。', 'まいにち おんがくを きいて、うんどうを します。',
               'て형 연결(~하고): 聞く ➔ 聞いて (く ➔ いて)', '聞いて', '듣고(聞く て형)'),
    'itte': S('도서관에 가서 책을 읽습니다.', '図書館へ 行って、本を 読みます。', 'としょかんへ いって、ほんを よみます。',
              '⚠️ 예외: 行く ➔ 行って (行いて ✕)', '行って', '가서(行く て형)'),
    'nonde': S('커피를 마시고 나서 숙제를 합니다.', 'コーヒーを 飲んでから 宿題を します。', 'コーヒーを のんでから しゅくだいを します。',
               '순서 ~てから: 飲む ➔ 飲んで (む ➔ んで)', '飲んでから', '마시고 나서(飲む ~てから)'),
}

VERB_TE_SENTENCES = [TE_SENT[k] for k in
                     ['matte', 'mite', 'benkyou', 'oshiete', 'totte', 'tsukete', 'tabetekara',
                      'shitekara', 'okite', 'asonde', 'atte', 'kaettekara', 'itte', 'nonde']]

VERB_TE_GRAMMAR_HTML = '''
<div data-te-section class="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-orange-200 space-y-6 mt-6">
  <div class="border-b border-slate-100 pb-4">
    <span class="text-xs font-bold text-orange-700 bg-orange-50 px-3 py-1 rounded-full">NEW • 다이스키 (하) 1과</span>
    <h3 class="text-2xl font-extrabold text-slate-900 mt-2">2. 동사의 て형 (~하고 / ~해서) 만들기</h3>
    <p class="text-xs text-slate-500 mt-1">1그룹은 어미에 따라 음편(音便)이 생기고, 2그룹은 る를 떼고 て, 3그룹은 통째로 암기합니다.</p>
  </div>
  <div class="overflow-x-auto">
    <table class="w-full text-sm font-jp border border-slate-200 rounded-2xl overflow-hidden">
      <thead class="bg-slate-50 text-xs text-slate-600 font-sans"><tr><th class="p-3 text-left">그룹</th><th class="p-3 text-left">규칙</th><th class="p-3 text-left">예</th></tr></thead>
      <tbody class="divide-y divide-slate-100">
        <tr><td class="p-3 font-sans font-bold" rowspan="7">1그룹<br>(5단 동사)</td><td class="p-3 text-orange-700 font-bold">う・つ・る ➔ って</td><td class="p-3">会う ➔ 会って / 待つ ➔ 待って / 撮る ➔ 撮って</td></tr>
        <tr><td class="p-3 text-orange-700 font-bold">ぬ・む・ぶ ➔ んで</td><td class="p-3">飲む ➔ 飲んで / 遊ぶ ➔ 遊んで</td></tr>
        <tr><td class="p-3 text-orange-700 font-bold">く ➔ いて</td><td class="p-3">書く ➔ 書いて / 聞く ➔ 聞いて / 歩く ➔ 歩いて</td></tr>
        <tr><td class="p-3 text-orange-700 font-bold">ぐ ➔ いで</td><td class="p-3">泳ぐ ➔ 泳いで</td></tr>
        <tr><td class="p-3 text-orange-700 font-bold">す ➔ して</td><td class="p-3">話す ➔ 話して</td></tr>
        <tr><td class="p-3 text-rose-700 font-bold">★ 예외 1그룹</td><td class="p-3">帰る ➔ 帰って / 入る ➔ 入って / 知る ➔ 知って</td></tr>
        <tr><td class="p-3 text-rose-700 font-bold">★ 예외 行く</td><td class="p-3">行く ➔ <b>行って</b> (行いて ✕)</td></tr>
        <tr><td class="p-3 font-sans font-bold">2그룹<br>(1단 동사)</td><td class="p-3 text-emerald-700 font-bold">る를 떼고 + て</td><td class="p-3">見る ➔ 見て / 起きる ➔ 起きて / 食べる ➔ 食べて / 寝る ➔ 寝て</td></tr>
        <tr><td class="p-3 font-sans font-bold">3그룹<br>(불규칙)</td><td class="p-3 text-indigo-700 font-bold">통째로 암기</td><td class="p-3">来る ➔ 来(き)て / する ➔ して / 勉強する ➔ 勉強して</td></tr>
      </tbody>
    </table>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
    <div class="p-4 rounded-2xl bg-orange-50/60 border border-orange-200 space-y-1.5">
      <div class="font-extrabold text-orange-800">～て います (~하고 있습니다)</div>
      <div class="font-jp text-slate-800">学校の 前で 友達を 待って います。</div>
      <div class="text-slate-500">학교 앞에서 친구를 기다리고 있습니다.</div>
    </div>
    <div class="p-4 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-1.5">
      <div class="font-extrabold text-sky-800">～て ください (~해 주세요)</div>
      <div class="font-jp text-slate-800">写真を 撮って ください。</div>
      <div class="text-slate-500">사진을 찍어 주세요.</div>
    </div>
    <div class="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
      <div class="font-extrabold text-emerald-800">～てから (~하고 나서)</div>
      <div class="font-jp text-slate-800">朝ご飯を 食べてから 会社へ 行きます。</div>
      <div class="text-slate-500">아침밥을 먹고 나서 회사에 갑니다.</div>
    </div>
  </div>
</div>
'''

# ---------------------------------------------------------------- noun module
NOUNS = [  # ja, hira, kr, cat
    ('学生', 'がくせい', '학생', '① 사람·직업 명사'),
    ('先生', 'せんせい', '선생님', '① 사람·직업 명사'),
    ('会社員', 'かいしゃいん', '회사원', '① 사람·직업 명사'),
    ('医者', 'いしゃ', '의사', '① 사람·직업 명사'),
    ('日本人', 'にほんじん', '일본인', '② 국적 명사'),
    ('韓国人', 'かんこくじん', '한국인', '② 국적 명사'),
    ('休み', 'やすみ', '휴일 / 쉬는 날', '③ 때·날씨 명사'),
    ('雨', 'あめ', '비', '③ 때·날씨 명사'),
]


def _ko_noun(n):
    n = n.split(' / ')[0]
    b = ko.has_batchim(n)
    ga = n + ('이' if b else '가')
    return {
        'desu': n + '입니다',
        'neg': ga + ' 아닙니다',
        'past': n + ('이었습니다' if b else '였습니다'),
        'negpast': ga + ' 아니었습니다',
        'de': n + '이고 / ' + n + ('이라서' if b else '라서'),
        'naru': ga + ' 됩니다',
    }


def build_noun():
    items = []
    for ja, hi, kr, cat in NOUNS:
        k = _ko_noun(kr)
        forms = [
            ('현재 긍정 (~です)', 'です', 'です', k['desu']),
            ('현재 부정 (~ではありません)', 'では ありません', 'では ありません', k['neg']),
            ('현재 부정·회화 (~じゃありません)', 'じゃ ありません', 'じゃ ありません', k['neg'] + ' (회화체)'),
            ('과거 긍정 (~でした)', 'でした', 'でした', k['past']),
            ('과거 부정 (~ではありませんでした)', 'では ありませんでした', 'では ありませんでした', k['negpast']),
            ('て형 연결 (~で: 나열·이유)', 'で', 'で', k['de']),
            ('상태 변화 (~に なります)', 'に なります', 'に なります', k['naru']),
        ]
        fl = [{'label': l, 'ja': ja + j, 'hira': hi + h, 'kr': kk} for l, j, h, kk in forms]
        n0 = kr.split(' / ')[0]
        fl.append({'label': '허가 (~でも いいです)', 'ja': ja + 'でも いいです', 'hira': hi + 'でも いいです',
                   'kr': n0 + ('이어도' if ko.has_batchim(n0) else '여도') + ' 됩니다', 'since': 4})
        fl.append({'label': '보통형 과거 (~だった: 일기체)', 'ja': ja + 'だった', 'hira': hi + 'だった',
                   'kr': n0 + ('이었다' if ko.has_batchim(n0) else '였다'), 'since': 5})
        items.append({'cat': cat, 'dict': ja, 'dictHira': hi, 'kr': kr,
                      'rule': '명사 + です / では ありません / でした / では ありませんでした | て형: 명사 + で (~이고 / ~라서) | 변화: 명사 + に なります | 허가: 명사 + でも いいです',
                      'forms': fl})
    words = [{'kr': kr, 'hira': hi, 'kanji': ja, 'category': cat} for ja, hi, kr, cat in NOUNS]
    words += [
        {'kr': '~입니다', 'hira': '～です', 'kanji': '～です', 'category': '명사 문형'},
        {'kr': '~이/가 아닙니다', 'hira': '～では ありません', 'kanji': '～では ありません', 'category': '명사 문형'},
        {'kr': '~이었습니다/였습니다', 'hira': '～でした', 'kanji': '～でした', 'category': '명사 문형'},
        {'kr': '~이/가 아니었습니다', 'hira': '～では ありませんでした', 'kanji': '～では ありませんでした', 'category': '명사 문형'},
        {'kr': '~이고 / ~라서 (て형)', 'hira': '～で', 'kanji': '～で', 'category': '명사 문형'},
        {'kr': '~이/가 됩니다', 'hira': '～に なります', 'kanji': '～に なります', 'category': '명사 문형'},
    ]
    sents = [
        S('저는 학생입니다.', '私は 学生です。', 'わたしは がくせいです。', '명사 + です (~입니다)', '学生です', '학생입니다'),
        S('다나카 씨는 선생님이 아닙니다.', '田中さんは 先生では ありません。', 'たなかさんは せんせいでは ありません。',
          '명사 + では ありません (~이/가 아닙니다)', '先生では ありません', '선생님이 아닙니다'),
        S('어제는 휴일이었습니다.', '昨日は 休みでした。', 'きのうは やすみでした。', '명사 + でした (~이었습니다)', '休みでした', '휴일이었습니다'),
        S('어제는 비가 아니었습니다.', '昨日は 雨では ありませんでした。', 'きのうは あめでは ありませんでした。',
          '명사 + では ありませんでした (~이/가 아니었습니다)', '雨では ありませんでした', '비가 아니었습니다'),
        S('야마다 씨는 일본인입니까? — 아니요, 일본인이 아닙니다.', '山田さんは 日本人ですか。— いいえ、日本人じゃ ありません。',
          'やまださんは にほんじんですか。— いいえ、にほんじんじゃ ありません。', '회화체 부정: じゃ ありません = では ありません',
          '日本人じゃ ありません', '일본인이 아닙니다(회화체)'),
        S('저는 회사원이고, 기무라 씨는 의사입니다.', '私は 会社員で、木村さんは 医者です。', 'わたしは かいしゃいんで、きむらさんは いしゃです。',
          '명사 て형: 명사 + で (나열: ~이고)', '会社員で', '회사원이고(명사 て형)'),
        S('김 씨는 한국인이고 대학생입니다.', 'キムさんは 韓国人で、大学生です。', 'キムさんは かんこくじんで、だいがくせいです。',
          '명사 て형: 韓国人 + で (나열)', '韓国人で', '한국인이고(명사 て형)'),
        S('아버지는 의사이고, 어머니는 선생님입니다.', '父は 医者で、母は 先生です。', 'ちちは いしゃで、ははは せんせいです。',
          '명사 て형: 医者 + で (나열)', '医者で', '의사이고(명사 て형)'),
        S('오늘은 휴일이라서 기쁩니다.', '今日は 休みで、うれしいです。', 'きょうは やすみで、うれしいです。',
          '명사 て형: 休み + で (이유: ~라서)', '休みで', '휴일이라서(명사 て형 이유)'),
        S('남동생은 내년에 대학생이 됩니다.', '弟は 来年 大学生に なります。', 'おとうとは らいねん だいがくせいに なります。',
          '명사 + に なります (~이/가 됩니다)', '大学生に なります', '대학생이 됩니다'),
        S('이것은 제 가방이 아닙니다.', 'これは 私の かばんでは ありません。', 'これは わたしの かばんでは ありません。',
          '명사 + では ありません', 'かばんでは ありません', '가방이 아닙니다'),
        S('어제는 비였고 오늘은 맑음입니다.', '昨日は 雨で、今日は 晴れです。', 'きのうは あめで、きょうは はれです。',
          '명사 て형: 雨 + で (나열)', '雨で', '비였고(명사 て형)'),
    ]
    for i, s in enumerate(sents):
        s['id'] = i + 1
        s['part'] = 1 if i < 6 else 2
    sents = [{'id': s.pop('id'), 'part': s.pop('part'), **s} for s in sents]
    grammar = '''
<div class="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
  <div class="border-b border-slate-100 pb-4">
    <span class="text-xs font-bold text-lime-700 bg-lime-50 px-3 py-1 rounded-full">명사 활용 핵심 노트</span>
    <h3 class="text-2xl font-extrabold text-slate-900 mt-2">명사의 정중형 4가지 & て형(で)</h3>
    <p class="text-xs text-slate-500 mt-1">명사 뒤에 그대로 붙입니다. 명사의 て형은 「で」 하나뿐 — 나열(~이고)과 이유(~라서)로 쓰입니다.</p>
  </div>
  <div class="overflow-x-auto">
    <table class="w-full text-sm font-jp border border-slate-200">
      <thead class="bg-slate-50 text-xs text-slate-600 font-sans"><tr><th class="p-3 text-left">형태</th><th class="p-3 text-left">접속</th><th class="p-3 text-left">예 (学生)</th><th class="p-3 text-left font-sans">뜻</th></tr></thead>
      <tbody class="divide-y divide-slate-100">
        <tr><td class="p-3 font-sans font-bold">현재 긍정</td><td class="p-3">명사 + です</td><td class="p-3">学生です</td><td class="p-3 font-sans">학생입니다</td></tr>
        <tr><td class="p-3 font-sans font-bold">현재 부정</td><td class="p-3">명사 + では(じゃ) ありません</td><td class="p-3">学生では ありません</td><td class="p-3 font-sans">학생이 아닙니다</td></tr>
        <tr><td class="p-3 font-sans font-bold">과거 긍정</td><td class="p-3">명사 + でした</td><td class="p-3">学生でした</td><td class="p-3 font-sans">학생이었습니다</td></tr>
        <tr><td class="p-3 font-sans font-bold">과거 부정</td><td class="p-3">명사 + では ありませんでした</td><td class="p-3">学生では ありませんでした</td><td class="p-3 font-sans">학생이 아니었습니다</td></tr>
        <tr class="bg-lime-50/50"><td class="p-3 font-sans font-bold">て형 (연결)</td><td class="p-3 text-lime-700 font-bold">명사 + で</td><td class="p-3">学生で</td><td class="p-3 font-sans">학생이고 / 학생이라서</td></tr>
        <tr><td class="p-3 font-sans font-bold">상태 변화</td><td class="p-3">명사 + に なります</td><td class="p-3">学生に なります</td><td class="p-3 font-sans">학생이 됩니다</td></tr>
      </tbody>
    </table>
  </div>
  <div class="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1 font-jp">
    <div>💡 <b>명사·형용사 て형 비교</b> (하 1과)</div>
    <div>• 명사: 会社員 ➔ 会社員<b>で</b> / な형용사: 便利だ ➔ 便利<b>で</b> / い형용사: おいしい ➔ おいし<b>くて</b></div>
    <div>• 私は 会社員で、木村さんは 医者です。(나열) ・ 今日は 休みで、うれしいです。(이유)</div>
  </div>
</div>
'''
    return {
        'id': 'noun', 'isSpecial': True, 'updatedIn': 5, 'icon': '🏷️', 'shortLabel': '명사 활용',
        'title': '일본어 명사 활용 (です형 4가지 & て형 で・상태변화) 마스터', 'badge': '명사 です형 & て형(で)',
        'theme': 'from-lime-500 to-green-600', 'accent': 'lime',
        'subtitle': '명사 + です / では ありません / でした / では ありませんでした • て형(で: 나열·이유) • ~に なります',
        'sample': '学生 ➔ 学生です / 学生では ありません / 学生でした / 学生で / 学生に なります',
        'words': words, 'sentences': sents,
        'reading_passage': {'title': '우리 가족 소개 (명사 です형 & て형 종합)', 'sentences': [
            {'ja': '私は 会社員で、木村さんは 医者です。', 'hira': 'わたしは かいしゃいんで、きむらさんは いしゃです。', 'kr': '저는 회사원이고, 기무라 씨는 의사입니다.'},
            {'ja': '父は 医者で、母は 先生です。', 'hira': 'ちちは いしゃで、ははは せんせいです。', 'kr': '아버지는 의사이고, 어머니는 선생님입니다.'},
            {'ja': '弟は 学生では ありません。会社員です。', 'hira': 'おとうとは がくせいでは ありません。かいしゃいんです。', 'kr': '남동생은 학생이 아닙니다. 회사원입니다.'},
            {'ja': '昨日は 休みでした。今日は 休みで、うれしいです。', 'hira': 'きのうは やすみでした。きょうは やすみで、うれしいです。', 'kr': '어제는 휴일이었습니다. 오늘은 휴일이라서 기쁩니다.'},
        ]},
        'grammarHtml': grammar, 'conjugationItems': items,
    }


# ---------------------------------------------------------------- date module
MONTHS = [('一月', 'いちがつ', ''), ('二月', 'にがつ', ''), ('三月', 'さんがつ', ''), ('四月', 'しがつ', 'よんがつ ✕'),
          ('五月', 'ごがつ', ''), ('六月', 'ろくがつ', ''), ('七月', 'しちがつ', 'なながつ ✕'), ('八月', 'はちがつ', ''),
          ('九月', 'くがつ', 'きゅうがつ ✕'), ('十月', 'じゅうがつ', ''), ('十一月', 'じゅういちがつ', ''), ('十二月', 'じゅうにがつ', '')]
DAYS_1_10 = [('一日', 'ついたち'), ('二日', 'ふつか'), ('三日', 'みっか'), ('四日', 'よっか'), ('五日', 'いつか'),
             ('六日', 'むいか'), ('七日', 'なのか'), ('八日', 'ようか'), ('九日', 'ここのか'), ('十日', 'とおか')]
DAYS_SPECIAL = [('十一日', 'じゅういちにち', 11, ''), ('十四日', 'じゅうよっか', 14, '⚠️ 특수'), ('十七日', 'じゅうしちにち', 17, ''),
                ('十九日', 'じゅうくにち', 19, ''), ('二十日', 'はつか', 20, '⚠️ 특수'), ('二十四日', 'にじゅうよっか', 24, '⚠️ 특수'),
                ('三十日', 'さんじゅうにち', 30, '')]
WEEK = [('月曜日', 'げつようび', '월요일'), ('火曜日', 'かようび', '화요일'), ('水曜日', 'すいようび', '수요일'),
        ('木曜日', 'もくようび', '목요일'), ('金曜日', 'きんようび', '금요일'), ('土曜日', 'どようび', '토요일'),
        ('日曜日', 'にちようび', '일요일')]


def build_date():
    items = []
    forms = []
    for i, (ja, hi, warn) in enumerate(MONTHS):
        n = i + 1
        forms.append({'label': f'{n}월' + (' (⚠️예외)' if warn else ''), 'ja': ja, 'hira': hi,
                      'kr': f'{n}월' + (f' ({warn})' if warn else '')})
    forms.append({'label': '몇 월 (의문사)', 'ja': '何月', 'hira': 'なんがつ', 'kr': '몇 월'})
    items.append({'cat': '① 월(月)', 'dict': '1月 ～ 12月 (월 읽기)', 'dictHira': 'いちがつ ～ じゅうにがつ',
                  'kr': '월(月 - がつ) 읽기', 'rule': '⚠️ 4월(しがつ), 7월(しちがつ), 9월(くがつ) 3가지만 주의! 나머지는 숫자 + がつ', 'forms': forms})
    forms = [{'label': f'{i + 1}일 (⚠️특수)', 'ja': ja, 'hira': hi, 'kr': f'{i + 1}일'} for i, (ja, hi) in enumerate(DAYS_1_10)]
    forms.append({'label': '며칠 (의문사)', 'ja': '何日', 'hira': 'なんにち', 'kr': '며칠'})
    items.append({'cat': '② 일(日) 1~10일', 'dict': '1日 ～ 10日 (날짜 읽기)', 'dictHira': 'ついたち ～ とおか',
                  'kr': '1~10일 고유 독음', 'rule': '⚠️ 1~10일은 전부 고유어 독음! 1일 ついたち・2일 ふつか・3일 みっか … 10일 とおか', 'forms': forms})
    forms = [{'label': f'{n}일' + (f' ({w})' if w else ''), 'ja': ja, 'hira': hi, 'kr': f'{n}일'} for ja, hi, n, w in DAYS_SPECIAL]
    items.append({'cat': '③ 일(日) 11일 이후', 'dict': '11日 ～ 30日 (주의 날짜)', 'dictHira': 'じゅういちにち ～',
                  'kr': '숫자 + にち (14·20·24일 예외)', 'rule': '⚠️ 14일 じゅうよっか・20일 はつか・24일 にじゅうよっか는 특수 독음! 17일 じゅうしちにち, 19일 じゅうくにち', 'forms': forms})
    forms = [{'label': kr, 'ja': ja, 'hira': hi, 'kr': kr} for ja, hi, kr in WEEK]
    forms.append({'label': '무슨 요일 (의문사)', 'ja': '何曜日', 'hira': 'なんようび', 'kr': '무슨 요일'})
    items.append({'cat': '④ 요일(曜日)', 'dict': '月曜日 ～ 日曜日 (요일)', 'dictHira': 'げつようび ～ にちようび',
                  'kr': '요일 읽기', 'rule': '月(げつ)・火(か)・水(すい)・木(もく)・金(きん)・土(ど)・日(にち) + ようび', 'forms': forms})

    words = [{'kr': f'{i + 1}월', 'hira': hi, 'kanji': ja, 'category': '월(月)'} for i, (ja, hi, _) in enumerate(MONTHS)]
    words += [{'kr': f'{i + 1}일', 'hira': hi, 'kanji': ja, 'category': '일(日) 1~10일'} for i, (ja, hi) in enumerate(DAYS_1_10)]
    words += [{'kr': f'{n}일', 'hira': hi, 'kanji': ja, 'category': '일(日) 특수'} for ja, hi, n, w in DAYS_SPECIAL if w]
    words += [{'kr': kr, 'hira': hi, 'kanji': ja, 'category': '요일(曜日)'} for ja, hi, kr in WEEK]
    words += [{'kr': '몇 월', 'hira': 'なんがつ', 'kanji': '何月', 'category': '의문사'},
              {'kr': '며칠', 'hira': 'なんにち', 'kanji': '何日', 'category': '의문사'},
              {'kr': '무슨 요일', 'hira': 'なんようび', 'kanji': '何曜日', 'category': '의문사'}]
    sents = [
        S('오늘은 4월 1일입니다.', '今日は 四月 一日です。', 'きょうは しがつ ついたちです。',
          '⚠️ 4월 しがつ / 1일 ついたち', '四月 一日です', '4월 1일입니다'),
        S('생일은 7월 20일입니다.', '誕生日は 七月 二十日です。', 'たんじょうびは しちがつ はつかです。',
          '⚠️ 7월 しちがつ / 20일 はつか', '七月 二十日です', '7월 20일입니다'),
        S('내일은 9월 9일 일요일입니다.', '明日は 九月 九日、日曜日です。', 'あしたは くがつ ここのか、にちようびです。',
          '⚠️ 9월 くがつ / 9일 ここのか', '九月 九日', '9월 9일'),
        S('오늘은 무슨 요일입니까? — 수요일입니다.', '今日は 何曜日ですか。— 水曜日です。', 'きょうは なんようびですか。— すいようびです。',
          '何曜日(なんようび): 무슨 요일', '何曜日ですか', '무슨 요일입니까'),
        S('시험은 5월 14일입니다.', 'テストは 五月 十四日です。', 'テストは ごがつ じゅうよっかです。',
          '⚠️ 14일 じゅうよっか', '十四日です', '14일입니다'),
        S('6월 24일에 일본에 갑니다.', '六月 二十四日に 日本へ 行きます。', 'ろくがつ にじゅうよっかに にほんへ いきます。',
          '⚠️ 24일 にじゅうよっか', '二十四日に', '24일에'),
        S('제 생일은 8월 8일입니다.', '私の 誕生日は 八月 八日です。', 'わたしの たんじょうびは はちがつ ようかです。',
          '⚠️ 8일 ようか (はちにち ✕)', '八日です', '8일입니다'),
        S('매주 금요일에 일본어를 공부합니다.', '毎週 金曜日に 日本語を 勉強します。', 'まいしゅう きんようびに にほんごを べんきょうします。',
          '金曜日(きんようび) + に', '金曜日に', '금요일에'),
        S('휴가는 3일부터 5일까지입니다.', '休みは 三日から 五日までです。', 'やすみは みっかから いつかまでです。',
          '3일 みっか / 5일 いつか / ~から ~まで', '三日から 五日まで', '3일부터 5일까지'),
        S('12월 25일은 크리스마스입니다.', '十二月 二十五日は クリスマスです。', 'じゅうにがつ にじゅうごにちは クリスマスです。',
          '일반 날짜: 숫자 + にち', '二十五日', '25일'),
        S('토요일과 일요일은 휴일입니다.', '土曜日と 日曜日は 休みです。', 'どようびと にちようびは やすみです。',
          '土曜日(どようび) / 日曜日(にちようび)', '土曜日と 日曜日', '토요일과 일요일'),
        S('오늘은 몇 월 며칠입니까? — 10월 6일입니다.', '今日は 何月 何日ですか。— 十月 六日です。', 'きょうは なんがつ なんにちですか。— じゅうがつ むいかです。',
          '何月 何日(なんがつ なんにち) / 6일 むいか', '十月 六日です', '10월 6일입니다'),
    ]
    sents = [{'id': i + 1, 'part': 1 if i < 6 else 2, **s} for i, s in enumerate(sents)]

    def row(cells):
        return '<tr>' + ''.join(f'<td class="p-2 text-center">{c}</td>' for c in cells) + '</tr>'

    m_rows = ''.join(row([f'{i + 1}월', f'{ja}<br><span class="text-xs {"text-rose-600 font-bold" if w else "text-slate-500"}">{hi}</span>'])
                     for i, (ja, hi, w) in enumerate(MONTHS))
    d_rows = ''.join(row([f'{i + 1}일', f'{ja}<br><span class="text-xs text-rose-600 font-bold">{hi}</span>'])
                     for i, (ja, hi) in enumerate(DAYS_1_10))
    s_rows = ''.join(row([f'{n}일', f'{ja}<br><span class="text-xs {"text-rose-600 font-bold" if w else "text-slate-500"}">{hi}</span>'])
                     for ja, hi, n, w in DAYS_SPECIAL)
    w_rows = ''.join(row([kr, f'{ja}<br><span class="text-xs text-slate-500">{hi}</span>']) for ja, hi, kr in WEEK)
    tbl = '<table class="w-full text-sm font-jp border border-slate-200"><tbody class="divide-y divide-slate-100">{}</tbody></table>'
    grammar = f'''
<div class="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
  <div class="border-b border-slate-100 pb-4">
    <span class="text-xs font-bold text-orange-700 bg-orange-50 px-3 py-1 rounded-full">날짜 읽기 핵심 노트</span>
    <h3 class="text-2xl font-extrabold text-slate-900 mt-2">월(月) • 일(日) • 요일(曜日) 읽기</h3>
    <p class="text-xs text-slate-500 mt-1">빨간 글씨가 시험에 자주 나오는 특수 독음입니다. 1~10일, 14일, 20일, 24일은 반드시 통째로 암기!</p>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div><div class="font-bold text-sm mb-2">① 월 (がつ)</div>{tbl.format(m_rows)}</div>
    <div><div class="font-bold text-sm mb-2">② 1~10일 (고유 독음)</div>{tbl.format(d_rows)}</div>
    <div><div class="font-bold text-sm mb-2">③ 11일 이후 (にち)</div>{tbl.format(s_rows)}</div>
    <div><div class="font-bold text-sm mb-2">④ 요일 (ようび)</div>{tbl.format(w_rows)}</div>
  </div>
  <div class="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-jp space-y-1">
    <div>💡 의문사: 何月(なんがつ) 몇 월 / 何日(なんにち) 며칠 / 何曜日(なんようび) 무슨 요일</div>
    <div>💡 今日は 何月 何日ですか。— 四月 一日です。(오늘은 몇 월 며칠입니까? — 4월 1일입니다.)</div>
  </div>
</div>
'''
    return {
        'id': 'date', 'isSpecial': True, 'icon': '📅', 'shortLabel': '날짜',
        'title': '일본어 날짜 읽기 (월·일 특수 독음 & 요일) 마스터', 'badge': '월 • 일 • 요일 특수 독음',
        'theme': 'from-orange-500 to-red-500', 'accent': 'orange',
        'subtitle': '4월(しがつ)·7월(しちがつ)·9월(くがつ) • 1~10일 고유 독음 • 14일·20일(はつか)·24일 • 요일',
        'sample': '四月(しがつ) 一日(ついたち) / 二十日(はつか) / 十四日(じゅうよっか) / 水曜日(すいようび)',
        'words': words, 'sentences': sents,
        'reading_passage': {'title': '나의 일정표 (날짜·요일 종합)', 'sentences': [
            {'ja': '今日は 四月 一日、月曜日です。', 'hira': 'きょうは しがつ ついたち、げつようびです。', 'kr': '오늘은 4월 1일 월요일입니다.'},
            {'ja': 'テストは 五月 十四日です。', 'hira': 'てすとは ごがつ じゅうよっかです。', 'kr': '시험은 5월 14일입니다.'},
            {'ja': '私の 誕生日は 七月 二十日です。', 'hira': 'わたしの たんじょうびは しちがつ はつかです。', 'kr': '제 생일은 7월 20일입니다.'},
            {'ja': '休みは 八月 三日から 十日までです。', 'hira': 'やすみは はちがつ みっかから とおかまでです。', 'kr': '휴가는 8월 3일부터 10일까지입니다.'},
        ]},
        'grammarHtml': grammar, 'conjugationItems': items,
    }


SPECIAL_FURIGANA = [
    # noun
    ('会社員', 'かいしゃいん'), ('医者', 'いしゃ'), ('日本人', 'にほんじん'), ('韓国人', 'かんこくじん'), ('大学生', 'だいがくせい'),
    ('学生', 'がくせい'), ('先生', 'せんせい'), ('休み', 'やすみ'), ('雨', 'あめ'), ('田中', 'たなか'), ('木村', 'きむら'),
    ('山田', 'やまだ'), ('来年', 'らいねん'), ('晴れ', 'はれ'),
    # date
    ('十二月', 'じゅうにがつ'), ('四月', 'しがつ'), ('五月', 'ごがつ'), ('六月', 'ろくがつ'), ('七月', 'しちがつ'), ('八月', 'はちがつ'),
    ('九月', 'くがつ'), ('十月', 'じゅうがつ'), ('二十四日', 'にじゅうよっか'), ('二十五日', 'にじゅうごにち'), ('十四日', 'じゅうよっか'),
    ('二十日', 'はつか'), ('一日', 'ついたち'), ('三日', 'みっか'), ('五日', 'いつか'), ('六日', 'むいか'), ('八日', 'ようか'),
    ('九日', 'ここのか'), ('十日', 'とおか'), ('何月', 'なんがつ'), ('何日', 'なんにち'), ('何曜日', 'なんようび'),
    ('月曜日', 'げつようび'), ('水曜日', 'すいようび'), ('金曜日', 'きんようび'), ('土曜日', 'どようび'), ('日曜日', 'にちようび'),
    ('誕生日', 'たんじょうび'), ('明日', 'あした'), ('毎週', 'まいしゅう'),
    # te sentences
    ('映画館', 'えいがかん'), ('図書館', 'としょかん'), ('電話番号', 'でんわばんごう'), ('写真', 'しゃしん'), ('電気', 'でんき'),
    ('朝ご飯', 'あさごはん'), ('夕ご飯', 'ゆうごはん'), ('宿題', 'しゅくだい'), ('公園', 'こうえん'), ('一緒', 'いっしょ'),
    ('毎朝', 'まいあさ'), ('音楽', 'おんがく'), ('運動', 'うんどう'), ('待って', 'まって'), ('撮って', 'とって'), ('教えて', 'おしえて'),
    ('遊んで', 'あそんで'), ('会って', 'あって'), ('歩き', 'あるき'), ('帰って', 'かえって'), ('弾いて', 'ひいて'),
    ('終わって', 'おわって'), ('聞いて', 'きいて'), ('行って', 'いって'), ('飲んで', 'のんで'), ('起きて', 'おきて'),
    ('洗い', 'あらい'), ('顔', 'かお'), ('犬', 'いぬ'), ('早く', 'はやく'), ('学校', 'がっこう'), ('友達', 'ともだち'),
]
