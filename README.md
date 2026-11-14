# 다이스키 일본어 학습기 (상·하 통합)

다이스키 일본어 **(상) 12~15과**, **(하) 1과**의 단문·단어·문법·활용 연습과 9개 특강
(동사 · い형용사 · な형용사 · 명사 · 조수사 · 숫자·시간 · 날짜 · 가족 호칭 · 위치 명사)을 한 곳에서 공부하는 웹앱입니다.
서버 없이 정적 파일만으로 동작하므로 GitHub Pages에 올리면 휴대폰에서도 바로 쓸 수 있습니다.

## 실행

```bash
python -I tools/serve.py
```

브라우저에서 http://localhost:8765 를 엽니다. (`python -m http.server`는 Range 요청을 지원하지 않아 문장별 음성 구간 이동이 안 됩니다. GitHub Pages는 지원합니다.)

## 폴더 구조

| 경로 | 내용 |
| --- | --- |
| `index.html` | 화면 마크업 (포털, 학습 탭) |
| `js/app.js` | 앱 로직 (퀴즈, 타이핑, 모의고사, 녹음 과제 등) |
| `data/manifest.js` | 단원별 음성 파일 경로 |
| `data/lessons/s12.js` ~ `s15.js` | (상) 12~15과 |
| `data/lessons/h01.js` | (하) 1과 |
| `data/special/*.js` | 특강 9개 |
| `data/furigana.js` | 후리가나 사전 (긴 단어부터 적용) |
| `audio/` | 원어민 음성 (단원별 MP3 1개, 문장마다 `[시작초, 끝초]` 구간 재생) |
| `tools/` | 데이터 생성·검증 스크립트 |
| `materials/` | 원본 PDF·음성 (git 제외) |
| `legacy/` | 분리 전 단일 HTML (git 제외) |

## 데이터 수정 방법

`data/*.js`는 `window.LESSONS_DB["키"] = { ...JSON... };` 형태입니다. 직접 고쳐도 되지만,
하권/특강 추가분은 스크립트로 만들어지므로 원본 스크립트를 고친 뒤 다시 생성하는 것이 안전합니다.

```bash
python -I tools/build_content.py
```

```bash
python -I tools/validate.py
```

- `tools/content_h1.py`, `tools/content_h1_sentences.py` — 하 1과 단어·활용·문법·단문
- `tools/content_special.py` — 명사·날짜 특강, 동사 て형 예문/문법
- `tools/build_content.py` — 위 내용을 data 파일에 반영 (동사 て형, 형용사 くて/で, 한국어 해석 재생성 포함, 여러 번 실행해도 결과 동일)
- `tools/validate.py` — 누락 필드, 후리가나 읽기 불일치, 깨진 한국어 활용형 검사

## 새 단원 추가 (예: 하 2과)

1. 단문 음성 WAV를 `materials/`에 넣고 문장 구간을 찾습니다.
   ```bash
   python -I tools/split_silence.py "materials/하2과.wav"
   ```
2. MP3로 변환해 `audio/h02.mp3`로 저장하고 `data/manifest.js`에 `"h2": "audio/h02.mp3"`를 추가합니다.
3. `tools/content_h1*.py`를 복사해 `content_h2*.py`를 만들고 `build_content.py`에서 `data/lessons/h02.js`로 저장합니다.
   `book: "하"`, `label: "2(하)"`, `lessonNo: 2`, `card`를 넣으면 포털 하권 카드가 자동으로 생깁니다.
4. `index.html`에 `<script src="data/lessons/h02.js"></script>`와 상단 전환 버튼(`openLesson('h2')`)을 추가합니다.

## GitHub Pages 배포

1. GitHub에 저장소를 만들고 push
2. Settings → Pages → Branch: `main` / root 선택
3. `https://<계정>.github.io/<저장소>/` 로 접속

> 교재 음성(`audio/`)과 본문은 교재·학원 저작물입니다. 공개 저장소로 올리기 전에 이용 범위를 확인하세요.
> (무료 계정의 GitHub Pages는 공개 저장소에서만 동작합니다.)
