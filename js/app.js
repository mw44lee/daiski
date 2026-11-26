    // --- Master Data Injected from Server ---
    const LESSONS_DB = window.LESSONS_DB;
    const FURIGANA_MAP = window.FURIGANA_MAP;
    const AUDIO_SOURCES = window.AUDIO_SOURCES;

    // --- State Variables ---
    let currentLesson = 13;
    let APP_DATA = LESSONS_DB[currentLesson];
    let sentences = APP_DATA.sentences;
    let words = APP_DATA.words;
    let readingPassage = APP_DATA.reading_passage;

    let currentStep = 1;
    let currentCardIndex = 0;
    let learnedSentenceIds = new Set();
    let audioPlaybackRate = 1.0;
    let autoPlayEnabled = true;
    let currentFilterPart = 'all'; // all, 1, 2, unlearned
    let filteredIndices = [];
    let audioTimer = null;

    // --- User & Student Profile System ---
    let currentUserName = '';
    let currentUserId = '';

    function initUserSystem() {
      try {
        const activeUser = localStorage.getItem('daisuki_active_user');
        if (activeUser) {
          const users = JSON.parse(localStorage.getItem('daisuki_users_list') || '{}');
          if (users[activeUser]) {
            currentUserName = users[activeUser].name;
            currentUserId = activeUser;
          }
        }
      } catch (e) {}
      updateUserUI();
    }

    function updateUserUI() {
      const portalUserNameText = document.getElementById('portalUserNameText');
      const workspaceUserNameText = document.getElementById('workspaceUserNameText');
      const modalCurrentUserName = document.getElementById('modalCurrentUserName');
      const modalLogoutBtn = document.getElementById('modalLogoutBtn');
      const sheetNameInput = document.getElementById('studentNameInput');

      if (currentUserName) {
        if (portalUserNameText) portalUserNameText.textContent = `${currentUserName} 님 (설정)`;
        if (workspaceUserNameText) workspaceUserNameText.textContent = `👤 ${currentUserName} 님`;
        if (modalCurrentUserName) modalCurrentUserName.textContent = `${currentUserName} (로그인 중)`;
        if (modalLogoutBtn) modalLogoutBtn.classList.remove('hidden');
        if (sheetNameInput) sheetNameInput.value = currentUserName;
      } else {
        if (portalUserNameText) portalUserNameText.textContent = `사용자 로그인 / 이름·비번 설정`;
        if (workspaceUserNameText) workspaceUserNameText.textContent = `👤 사용자 로그인`;
        if (modalCurrentUserName) modalCurrentUserName.textContent = `게스트 (비로그인)`;
        if (modalLogoutBtn) modalLogoutBtn.classList.add('hidden');
      }
      renderQuickUserList();
    }

    function renderQuickUserList() {
      const listDiv = document.getElementById('quickUserList');
      if (!listDiv) return;
      listDiv.innerHTML = '';
      try {
        const users = JSON.parse(localStorage.getItem('daisuki_users_list') || '{}');
        const userKeys = Object.keys(users);
        if (userKeys.length === 0) {
          listDiv.innerHTML = '<span class="text-xs text-slate-400">등록된 학생이 없습니다. 아래에서 새 학생을 등록하세요.</span>';
          return;
        }
        userKeys.forEach(name => {
          const btn = document.createElement('button');
          btn.className = `px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
            name === currentUserName ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 border-slate-200'
          }`;
          btn.textContent = name;
          btn.onclick = () => {
            document.getElementById('modalInputName').value = name;
            document.getElementById('modalInputPass').focus();
          };
          listDiv.appendChild(btn);
        });
      } catch (e) {}
    }

    function handleUserLoginOrRegister(isRegister) {
      const nameInput = document.getElementById('modalInputName');
      const passInput = document.getElementById('modalInputPass');
      const name = (nameInput.value || '').trim();
      const pass = (passInput.value || '').trim();

      if (!name) {
        showToast('이름(학생명)을 입력해 주세요.', '⚠️');
        return;
      }
      if (!pass || pass.length < 3) {
        showToast('비밀번호는 3자리 이상 입력해 주세요.', '⚠️');
        return;
      }

      let users = {};
      try {
        users = JSON.parse(localStorage.getItem('daisuki_users_list') || '{}');
      } catch (e) {
        users = {};
      }

      const passHash = btoa(encodeURIComponent(pass));

      if (isRegister) {
        if (users[name]) {
          showToast('이미 등록된 이름입니다. 기존 학생 로그인을 이용해 주세요.', '⚠️');
          return;
        }
        users[name] = { name, passHash, createdAt: new Date().toISOString() };
        localStorage.setItem('daisuki_users_list', JSON.stringify(users));
        localStorage.setItem('daisuki_active_user', name);
        currentUserName = name;
        currentUserId = name;
        updateUserUI();
        loadSavedLearned(currentLesson);
        closeUserModal();
        showToast(`새 학생 [${name}] 님으로 등록 및 로그인되었습니다!`, '🎉');
      } else {
        if (!users[name]) {
          showToast('등록되지 않은 학생 이름입니다. "새 학생 등록" 탭에서 등록해 주세요.', '⚠️');
          return;
        }
        if (users[name].passHash !== passHash) {
          showToast('비밀번호가 올바르지 않습니다.', '❌');
          return;
        }
        localStorage.setItem('daisuki_active_user', name);
        currentUserName = name;
        currentUserId = name;
        updateUserUI();
        loadSavedLearned(currentLesson);
        closeUserModal();
        showToast(`${name} 님으로 로그인되었습니다!`, '✅');
      }
    }

    function logoutUser() {
      try {
        localStorage.removeItem('daisuki_active_user');
      } catch (e) {}
      currentUserName = '';
      currentUserId = '';
      updateUserUI();
      loadSavedLearned(currentLesson);
      closeUserModal();
      showToast('로그아웃되어 게스트 모드로 전환되었습니다.', 'ℹ️');
    }

    function openUserModal() {
      const modal = document.getElementById('userLoginModal');
      if (modal) modal.classList.remove('hidden');
      renderQuickUserList();
    }

    function closeUserModal() {
      const modal = document.getElementById('userLoginModal');
      if (modal) modal.classList.add('hidden');
    }

    // Load saved learned sentences (separated by User ID)
    function loadSavedLearned(lessonId) {
      try {
        const storageKey = currentUserId ? `daisuki_learned_${lessonId}_u_${currentUserId}` : `daisuki_learned_${lessonId}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          learnedSentenceIds = new Set(JSON.parse(saved));
        } else {
          learnedSentenceIds = new Set();
        }
      } catch (e) {
        learnedSentenceIds = new Set();
      }
      updateLearnedCounter();
    }

    function saveLearned() {
      try {
        const storageKey = currentUserId ? `daisuki_learned_${currentLesson}_u_${currentUserId}` : `daisuki_learned_${currentLesson}`;
        localStorage.setItem(storageKey, JSON.stringify(Array.from(learnedSentenceIds)));
      } catch (e) {}
      updateLearnedCounter();
    }

    function updateLearnedCounter() {
      const el = document.getElementById('learnedCount');
      if (el) el.textContent = learnedSentenceIds.size;
      const totalEl = document.getElementById('totalSentenceCount');
      if (totalEl) totalEl.textContent = sentences.length;
      const gridText = document.getElementById('gridProgressText');
      if (gridText) gridText.textContent = `${learnedSentenceIds.size}/${sentences.length}`;
      renderJumpGrid();
    }

    function showToast(msg, icon) {
      icon = icon || 'ℹ️';
      const toast = document.getElementById('toastNotification');
      const msgEl = document.getElementById('toastMessage');
      const iconEl = document.getElementById('toastIcon');
      if (!toast || !msgEl) return;
      msgEl.textContent = msg;
      if (iconEl) iconEl.textContent = icon;
      toast.classList.remove('translate-y-20', 'opacity-0');
      setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
      }, 3500);
    }

    // --- Native Audio Playback Engine ---
    const nativeAudio = document.getElementById('nativeAudio');

    function playSentenceAudio(index) {
      if (!nativeAudio) return;
      if (audioTimer) clearTimeout(audioTimer);
      const s = sentences[index];
      if (!s) return;
      if (!s.audio || !AUDIO_SOURCES[currentLesson]) {
        speakTTS(s.ja);
        return;
      }

      const [start, end] = s.audio;
      try {
        nativeAudio.playbackRate = audioPlaybackRate;
        nativeAudio.currentTime = start;
        nativeAudio.play().then(() => {
          const dur = (end - start) / audioPlaybackRate;
          audioTimer = setTimeout(() => {
            nativeAudio.pause();
          }, dur * 1000);
        }).catch(err => {
          console.log('Audio autoplay prevented by browser policy:', err);
        });
      } catch (e) {
        console.log('Audio playback error', e);
      }
    }

    // --- 일본어 TTS 음성 선택 ---
    // 안드로이드 크롬은 lang='ja-JP'만 지정하면 기기 기본(한국어) 음성으로 읽어서 한자를 한국어로 읽는 경우가 있다.
    // → 일본어 음성을 직접 골라 u.voice에 지정한다. 음성 목록은 비동기로 늦게 채워지므로 voiceschanged 때 다시 고른다.
    let jaVoice = null;
    let jaVoiceWarned = false;
    function pickJaVoice() {
      if (!('speechSynthesis' in window)) return null;
      const voices = window.speechSynthesis.getVoices() || [];
      const ja = voices.filter(v => /^ja([-_]|$)/i.test(v.lang || '') || /japan|日本/i.test(v.name || ''));
      // 기기 내장(local) 음성 > Google 음성 > 그 외
      jaVoice = ja.find(v => v.localService) || ja.find(v => /google/i.test(v.name)) || ja[0] || null;
      return jaVoice;
    }
    if ('speechSynthesis' in window) {
      pickJaVoice();
      window.speechSynthesis.addEventListener('voiceschanged', pickJaVoice);
    }

    // --- TTS는 한자 대신 저장된 히라가나 읽기를 읽는다 ---
    // TTS 엔진은 한자 읽기를 추측하므로 틀리는 경우가 있다 (例: 行った方がいい 의 方를 かた로 읽음).
    // 모든 단원의 문장·단어·활용형은 정확한 히라가나(hira)를 갖고 있으므로, 같은 일본어 문자열이면 그 읽기를 대신 읽는다.
    let ttsReadingMap = null;
    function ttsReading(text) {
      if (!ttsReadingMap) {
        ttsReadingMap = new Map();
        const add = (ja, hira) => {
          if (ja && hira && ja !== '-' && hira !== '-' && !ttsReadingMap.has(ja)) ttsReadingMap.set(ja, hira);
        };
        Object.values(LESSONS_DB).forEach(d => {
          (d.sentences || []).forEach(s => add(s.ja, s.hira));
          ((d.reading_passage || {}).sentences || []).forEach(s => add(s.ja, s.hira));
          (d.words || []).forEach(w => add(w.kanji, w.hira));
          (d.conjugationItems || []).forEach(it => {
            add(it.dict, it.dictHira);
            (it.forms || []).forEach(f => add(f.ja, f.hira));
          });
        });
      }
      return ttsReadingMap.get(text) || text;
    }

    const IS_SAMSUNG_BROWSER = /SamsungBrowser/i.test(navigator.userAgent);
    let samsungTtsWarned = false;

    function speakTTS(text) {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      if (!jaVoice) pickJaVoice();
      const u = new SpeechSynthesisUtterance(ttsReading(text));
      u.lang = 'ja-JP';
      if (jaVoice) u.voice = jaVoice;
      u.rate = audioPlaybackRate;
      window.speechSynthesis.speak(u);
      if (IS_SAMSUNG_BROWSER && !samsungTtsWarned) {
        samsungTtsWarned = true;
        showToast('삼성 인터넷은 일본어를 한국어 음성으로 읽을 수 있어요. 발음 듣기는 크롬에서 열어 주세요 (포털 상단 "크롬으로 열기").', '⚠️');
      } else if (!jaVoice && !jaVoiceWarned && window.speechSynthesis.getVoices().length > 0) {
        jaVoiceWarned = true;
        showToast('이 기기에 일본어 TTS 음성이 없어 한국어로 읽힐 수 있어요. 설정 → 일반 → 텍스트 음성 변환(TTS) → Google 음성 엔진 → 일본어 음성 데이터를 설치해 주세요.', '⚠️');
      }
    }

    // --- FIXED ROBUST TOKEN-BASED FURIGANA PARSER (Prevents nested rubies and vertical stacking) ---
    function renderRubyFromText(ja, hira) {
      let tokens = [];
      let res = ja;
      for (const [k, r] of FURIGANA_MAP) {
        if (res.includes(k)) {
          const placeholder = `___RUBY_${tokens.length}___`;
          tokens.push(`<ruby>${k}<rt>${r}</rt></ruby>`);
          res = res.split(k).join(placeholder);
        }
      }
      tokens.forEach((tag, idx) => {
        res = res.split(`___RUBY_${idx}___`).join(tag);
      });
      return res;
    }

    // --- Filter Indices ---
    function updateFilteredIndices() {
      filteredIndices = [];
      sentences.forEach((s, idx) => {
        if (currentFilterPart === 'all') {
          filteredIndices.push(idx);
        } else if (currentFilterPart === '1' && s.part === 1) {
          filteredIndices.push(idx);
        } else if (currentFilterPart === '2' && s.part === 2) {
          filteredIndices.push(idx);
        } else if (currentFilterPart === 'unlearned' && !learnedSentenceIds.has(s.id)) {
          filteredIndices.push(idx);
        }
      });
      if (filteredIndices.length === 0) {
        filteredIndices = sentences.map((_, i) => i);
      }
      currentCardIndex = 0;
    }

    // --- Switch Lesson Function (Called from Portal or Quick Switcher) ---
    function openLesson(num, initialTab) {
      if (!LESSONS_DB[num]) return;
      currentLesson = num;
      APP_DATA = LESSONS_DB[num];
      sentences = APP_DATA.sentences;
      words = APP_DATA.words;
      readingPassage = APP_DATA.reading_passage;
      const isSpecial = !!APP_DATA.isSpecial;
      const labelText = lessonLabel();

      // Update Native Audio Source
      if (AUDIO_SOURCES[num]) {
        nativeAudio.src = AUDIO_SOURCES[num];
        if (nativeAudio.load) nativeAudio.load();
      }

      // Switch View: Hide Portal, Show Workspace
      document.getElementById('lessonPortal').classList.add('hidden');
      document.getElementById('lessonWorkspace').classList.remove('hidden');

      // Update Workspace Header UI
      document.getElementById('activeLessonBadge').textContent = isSpecial ? APP_DATA.icon : (APP_DATA.lessonNo || num);
      document.getElementById('activeLessonHeaderTitle').textContent = isSpecial ? APP_DATA.title : `다이스키 (${lessonBook()}) ${APP_DATA.lessonNo || num}과 단문 • 단어 • 숙제 완벽 마스터`;
      const wsTag = document.getElementById('worksheetBookTag');
      if (wsTag) wsTag.textContent = `다이스키(${lessonBook()})`;
      const mockTitle = document.getElementById('mockTestMainTitle');
      if (mockTitle) mockTitle.textContent = `다이스키 ${labelText} 실전 모의고사`;
      document.getElementById('activeLessonHeaderSubtitle').textContent = APP_DATA.subtitle;
      document.getElementById('navSentenceCount').textContent = sentences.length;
      document.getElementById('navWordCount').textContent = words.length;
      const conjCountEl = document.getElementById('navConjCount');
      if (conjCountEl) conjCountEl.textContent = (APP_DATA.conjugationItems || []).length;
      document.getElementById('navGrammarLessonText').textContent = labelText;
      document.getElementById('navMockLessonText').textContent = labelText;

      // Update Lesson Switch Buttons
      document.querySelectorAll('.lesson-switch-btn').forEach(btn => {
        const isThis = String(btn.dataset.lesson) === String(num);
        btn.classList.toggle('bg-white', isThis);
        btn.classList.toggle('shadow-xs', isThis);
        btn.classList.toggle('text-indigo-600', isThis);
        btn.classList.toggle('font-bold', isThis);
      });

      // Update Grammar HTML
      document.getElementById('grammarContentBox').innerHTML = APP_DATA.grammarHtml;

      // Select initial tab (default to tab-conjugation for special topics if specified, else tab-sentences)
      const targetTabId = initialTab || (isSpecial ? 'tab-conjugation' : 'tab-sentences');
      document.querySelectorAll('.nav-tab').forEach(t => {
        t.classList.remove('active', 'border-indigo-600', 'text-indigo-600');
        t.classList.add('border-transparent', 'text-slate-500');
      });
      const activeTabBtn = document.querySelector(`.nav-tab[data-tab="${targetTabId}"]`) || document.querySelector('.nav-tab[data-tab="tab-sentences"]');
      if (activeTabBtn) {
        activeTabBtn.classList.add('active', 'border-indigo-600', 'text-indigo-600');
        activeTabBtn.classList.remove('border-transparent', 'text-slate-500');
      }
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
      const targetPane = document.getElementById(targetTabId) || document.getElementById('tab-sentences');
      if (targetPane) targetPane.classList.remove('hidden');

      // Reset Flow Step to 1
      currentStep = 1;
      document.querySelectorAll('.flow-step-btn').forEach(b => {
        const isS1 = parseInt(b.dataset.step) === 1;
        b.classList.toggle('active', isS1);
        b.classList.toggle('border-indigo-600', isS1);
        b.classList.toggle('bg-indigo-50/30', isS1);
        b.classList.toggle('border-slate-200', !isS1);
      });
      document.getElementById('step1-container').classList.remove('hidden');
      document.getElementById('step2-container').classList.add('hidden');
      document.getElementById('step3-container').classList.add('hidden');
      document.getElementById('step4-container').classList.add('hidden');

      // Reset Filter Part to All
      currentFilterPart = 'all';
      document.querySelectorAll('.filter-part-btn').forEach(b => {
        const isAll = b.dataset.part === 'all';
        b.classList.toggle('active', isAll);
        b.classList.toggle('bg-white', isAll);
        b.classList.toggle('shadow-xs', isAll);
        b.classList.toggle('text-slate-800', isAll);
        b.classList.toggle('text-slate-600', !isAll);
      });

      // Load Saved Learned for this lesson
      loadSavedLearned(num);

      // Re-render UI components
      updateFilteredIndices();
      renderCurrentCard();
      currentWordCat = 'all';
      renderWordsGrid();
      renderConjugationLab();
      renderReadingHomework();
      renderSentencePicker(false);

      // Reset Homework recordings
      recordedBlobs = {};
      updateCompletedCounter();
      document.getElementById('mergedPlayerBox').classList.add('hidden');

      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast(`${labelText} 학습 데이터가 성공적으로 로드되었습니다!`, '🚀');
    }

    // Return to Portal Hub
    function returnToPortal() {
      if (audioTimer) clearTimeout(audioTimer);
      if (nativeAudio) nativeAudio.pause();
      document.getElementById('lessonWorkspace').classList.add('hidden');
      document.getElementById('lessonPortal').classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- STEP 1: Render Card ---
    function renderCurrentCard() {
      if (filteredIndices.length === 0) updateFilteredIndices();
      const actualIdx = filteredIndices[currentCardIndex];
      const s = sentences[actualIdx];
      if (!s) return;

      document.getElementById('cardIndexBadge').textContent = `문장 ${currentCardIndex + 1} / ${filteredIndices.length} (전체 ${s.id}번)`;
      document.getElementById('step1PartBadge').textContent = s.part === 1 ? '단문표현-1' : '단문표현-2';
      document.getElementById('cardKorean').textContent = s.kr;

      const cardJa = document.getElementById('cardJapanese');
      cardJa.innerHTML = renderRubyFromText(s.ja, s.hira);
      document.getElementById('cardHiragana').textContent = s.hira;
      document.getElementById('cardGrammar').textContent = s.grammar;

      const isLearned = learnedSentenceIds.has(s.id);
      document.getElementById('learnCheckIcon').textContent = isLearned ? '✅' : '⚪';
      document.getElementById('learnCheckText').textContent = isLearned ? '암기 완료!' : '암기 체크';

      if (autoPlayEnabled) {
        playSentenceAudio(actualIdx);
      }
    }

    function renderJumpGrid() {
      const grid = document.getElementById('sentenceJumpGrid');
      if (!grid) return;
      grid.innerHTML = '';
      sentences.forEach((s, idx) => {
        const btn = document.createElement('button');
        const isLearned = learnedSentenceIds.has(s.id);
        const isCurrent = filteredIndices[currentCardIndex] === idx;
        btn.className = `py-1.5 text-xs font-bold rounded-lg border transition ${
          isCurrent ? 'ring-2 ring-indigo-600 bg-indigo-600 text-white' :
          isLearned ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
          'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
        }`;
        btn.textContent = idx + 1;
        btn.onclick = () => {
          const targetPos = filteredIndices.indexOf(idx);
          if (targetPos !== -1) {
            currentCardIndex = targetPos;
          } else {
            currentFilterPart = 'all';
            document.querySelectorAll('.filter-part-btn').forEach(b => {
              b.classList.toggle('active', b.dataset.part === 'all');
              b.classList.toggle('bg-white', b.dataset.part === 'all');
            });
            updateFilteredIndices();
            currentCardIndex = idx;
          }
          renderCurrentCard();
          renderJumpGrid();
        };
        grid.appendChild(btn);
      });
    }

    // --- STEP 2: 4-Choice Drill ---
    let quizCurrentIdx = 0;
    function renderQuizQuestion() {
      if (filteredIndices.length === 0) updateFilteredIndices();
      const actualIdx = filteredIndices[quizCurrentIdx % filteredIndices.length];
      const correct = sentences[actualIdx];

      document.getElementById('quizBadge').textContent = `객관식 퀴즈 ${quizCurrentIdx + 1} / ${filteredIndices.length}`;
      document.getElementById('quizQuestion').textContent = correct.kr;

      const distractors = generateSentenceDistractors(correct);
      const allOptions = [
        { text: correct.ja, isCorrect: true, exp: '정답입니다! ' + correct.grammar },
        ...distractors
      ].sort(() => Math.random() - 0.5);

      const optsContainer = document.getElementById('quizOptions');
      optsContainer.innerHTML = '';
      document.getElementById('quizFeedback').classList.add('hidden');

      allOptions.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt-btn w-full p-4 text-left rounded-2xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition text-slate-800 font-jp font-medium text-base flex items-start space-x-3';
        btn.innerHTML = `<span class="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-sans font-bold text-xs shrink-0 mt-0.5">${String.fromCharCode(65 + idx)}</span><span class="flex-1">${opt.text}</span>`;

        btn.onclick = () => {
          document.querySelectorAll('.quiz-opt-btn').forEach(b => b.disabled = true);
          if (opt.isCorrect) {
            btn.classList.add('border-emerald-500', 'bg-emerald-50', 'text-emerald-900');
            showQuizFeedback(true, opt.exp);
            learnedSentenceIds.add(correct.id);
            saveLearned();
          } else {
            btn.classList.add('border-rose-500', 'bg-rose-50', 'text-rose-900');
            document.querySelectorAll('.quiz-opt-btn').forEach(b => {
              if (b.innerText.includes(correct.ja)) b.classList.add('border-emerald-500', 'bg-emerald-50');
            });
            showQuizFeedback(false, opt.exp || '오답입니다. 문형과 조사를 다시 확인하세요.');
          }
        };
        optsContainer.appendChild(btn);
      });

      if (autoPlayEnabled) {
        playSentenceAudio(actualIdx);
      }
    }

    function generateSentenceDistractors(s) {
      const list = [];
      const ja = s.ja;

      if (currentLesson === 12) {
        if (ja.includes('買います')) list.push({ text: ja.replace('買います', '買きます'), isCorrect: false, exp: '동사 활용 오류: 買う는 1그룹이므로 い단 買います입니다.' });
        if (ja.includes('行きます')) list.push({ text: ja.replace('行きます', '行ちます'), isCorrect: false, exp: '동사 활용 오류: 行く는 き단 行きます입니다.' });
        if (ja.includes('へ')) list.push({ text: ja.replace('へ', 'で'), isCorrect: false, exp: '조사 오류: 방향/목적지에는 조사 へ를 씁니다.' });
        if (ja.includes('で')) list.push({ text: ja.replace('で', 'に'), isCorrect: false, exp: '조사 오류: 수단/방법에는 조사 で를 씁니다.' });
      } else if (currentLesson === 13) {
        if (ja.includes('有名に なりました')) list.push({ text: ja.replace('有名に なりました', '有名く なりました'), isCorrect: false, exp: '함정! 有名だ는 な형용사이므로 有名に なりました입니다.' });
        if (ja.includes('上手に なりました')) list.push({ text: ja.replace('上手に なりました', '上手く なりました'), isCorrect: false, exp: '함정! 上手だ는 な형용사이므로 上手に なりました입니다.' });
        if (ja.includes('難しく なりました')) list.push({ text: ja.replace('難しく なりました', '難しに なりました'), isCorrect: false, exp: '함정! 難しい는 い형용사이므로 難しく なりました입니다.' });
        if (ja.includes('よく なりました')) list.push({ text: ja.replace('よく なりました', 'いいに なりました'), isCorrect: false, exp: '함정! いい의 활용형은 よい이므로 よく なりました입니다.' });
        if (ja.includes('何か ありますか')) list.push({ text: ja.replace('何か ありますか', '何が ありますか'), isCorrect: false, exp: '함정! "무언가 있습니까?"는 조사 없이 何か ありますか입니다.' });
        if (ja.includes('誰か いますか')) list.push({ text: ja.replace('誰か いますか', '誰が いますか'), isCorrect: false, exp: '함정! "누군가 있습니까?"는 誰か いますか입니다.' });
      } else if (currentLesson === 14) {
        if (ja.includes('行きたいです')) list.push({ text: ja.replace('行きたいです', '行くたいです'), isCorrect: false, exp: '함정! 〜たい입니다 앞에는 ます형 어간(行き)이 와야 합니다.' });
        if (ja.includes('飲みませんか')) list.push({ text: ja.replace('飲みませんか', '飲むませんか'), isCorrect: false, exp: '함정! 권유형 〜ませんか 앞에는 ます형 어간(飲み)이 옵니다.' });
        if (ja.includes('食べましょう')) list.push({ text: ja.replace('食べましょう', '食べるましょう'), isCorrect: false, exp: '함정! 제안형 〜ましょう 앞에는 ます형 어간(食べ)이 옵니다.' });
        if (ja.includes('コーヒーに します')) list.push({ text: ja.replace('コーヒーに します', 'コーヒーを します'), isCorrect: false, exp: '함정! 선택·결정에는 조사 に します를 씁니다.' });
      } else if (currentLesson === 15) {
        if (ja.includes('やすい')) list.push({ text: ja.replace('やすい', 'にくい'), isCorrect: false, exp: '함정! 〜やすい는 "하기 쉽다", 〜にくい는 "하기 어렵다"입니다.' });
        if (ja.includes('にくい')) list.push({ text: ja.replace('にくい', 'やすい'), isCorrect: false, exp: '함정! 〜にくい는 "하기 어렵다", 〜やすい는 "하기 쉽다"입니다.' });
        if (ja.includes('ながら')) list.push({ text: ja.replace('ながら', 'すぎて'), isCorrect: false, exp: '함정! 동시동작 "~하면서"는 ます형 어간 + ながら입니다.' });
        if (ja.includes('すぎました')) list.push({ text: ja.replace('すぎました', 'やすいです'), isCorrect: false, exp: '함정! "너무 많이 ~했습니다"는 ます형 어간 + すぎました입니다.' });
        if (ja.includes('だから')) list.push({ text: ja.replace('だから', 'くて'), isCorrect: false, exp: '함정! 명사·な형용사 뒤에 이유의 から가 올 때는 だから가 됩니다.' });
        if (ja.includes('方')) list.push({ text: ja.replace('方', 'ながら'), isCorrect: false, exp: '함정! "~하는 법(방법)"은 ます형 어간 + 方(かた)입니다.' });
      } else if (currentLesson === 'h1') {
        const TE_TRAPS = [
          ['待って', '待いて', '함정! 待つ(つ로 끝남)는 っ+て ➔ 待って입니다.'],
          ['会って', '会いて', '함정! 会う(う로 끝남)는 っ+て ➔ 会って입니다.'],
          ['撮って', '撮りて', '함정! 撮る(1그룹 る)는 っ+て ➔ 撮って입니다.'],
          ['帰って', '帰て', '함정! 帰る는 예외 1그룹이라 帰って입니다 (帰て ✕).'],
          ['行って', '行いて', '함정! 行く는 예외로 行って입니다 (行いて ✕).'],
          ['飲んで', '飲みて', '함정! む로 끝나는 동사는 ん+で ➔ 飲んで입니다.'],
          ['遊んで', '遊びて', '함정! ぶ로 끝나는 동사는 ん+で ➔ 遊んで입니다.'],
          ['書いて', '書って', '함정! く로 끝나는 동사는 い+て ➔ 書いて입니다.'],
          ['泳いで', '泳いて', '함정! ぐ로 끝나는 동사는 い+で ➔ 泳いで입니다.'],
          ['話して', '話いて', '함정! す로 끝나는 동사는 し+て ➔ 話して입니다.'],
          ['見て', '見って', '함정! 2그룹 동사는 る를 떼고 て ➔ 見て입니다.'],
          ['勉強して', '勉強しって', '함정! する ➔ して입니다.'],
          ['おいしくて', 'おいしいで', '함정! い형용사 て형은 い ➔ くて: おいしくて입니다.'],
          ['暑くて', '暑いで', '함정! い형용사 て형은 い ➔ くて: 暑くて입니다.'],
          ['まじめで', 'まじめくて', '함정! な형용사 て형은 だ ➔ で: まじめで입니다.'],
          ['便利で', '便利くて', '함정! な형용사 て형은 だ ➔ で: 便利で입니다.'],
          ['会社員で', '会社員て', '함정! 명사 て형은 명사 + で입니다.'],
        ];
        TE_TRAPS.forEach(([ok, ng, exp]) => {
          if (ja.includes(ok)) list.push({ text: ja.replace(ok, ng), isCorrect: false, exp });
        });
      }

      let attempts = 0;
      while (list.length < 3 && attempts < 20) {
        attempts++;
        const rand = sentences[Math.floor(Math.random() * sentences.length)];
        if (rand.id !== s.id && !list.some(d => d.text === rand.ja)) {
          list.push({ text: rand.ja, isCorrect: false, exp: `이 문장은 "${rand.kr}"의 뜻입니다.` });
        }
      }
      return list.slice(0, 3);
    }

    function showQuizFeedback(isCorrect, exp) {
      const fb = document.getElementById('quizFeedback');
      fb.classList.remove('hidden', 'bg-emerald-50', 'border-emerald-200', 'bg-rose-50', 'border-rose-200');
      const title = document.getElementById('quizFeedbackTitle');
      const detail = document.getElementById('quizFeedbackDetail');

      if (isCorrect) {
        fb.classList.add('bg-emerald-50', 'border-emerald-200');
        title.innerHTML = '<span class="text-emerald-700 font-bold">⭕ 정답입니다! 아주 잘 하셨습니다.</span>';
      } else {
        fb.classList.add('bg-rose-50', 'border-rose-200');
        title.innerHTML = '<span class="text-rose-700 font-bold">❌ 아쉽네요! 다시 한 번 확인해 보세요.</span>';
      }
      detail.textContent = exp;
    }

    // --- STEP 3: Cloze Blank ---
    let clozeCurrentIdx = 0;
    function renderClozeQuestion() {
      if (filteredIndices.length === 0) updateFilteredIndices();
      const actualIdx = filteredIndices[clozeCurrentIdx % filteredIndices.length];
      const s = sentences[actualIdx];

      document.getElementById('clozeBadge').textContent = `빈칸 훈련 ${clozeCurrentIdx + 1} / ${filteredIndices.length}`;
      document.getElementById('clozeKr').textContent = s.kr;
      document.getElementById('clozePrompt').textContent = s.blankQ;
      document.getElementById('clozeInput').value = '';
      document.getElementById('clozeHintText').classList.add('hidden');
      document.getElementById('clozeFeedback').classList.add('hidden');

      if (autoPlayEnabled) {
        playSentenceAudio(actualIdx);
      }
    }

    function checkClozeAnswer() {
      const actualIdx = filteredIndices[clozeCurrentIdx % filteredIndices.length];
      const s = sentences[actualIdx];
      const input = document.getElementById('clozeInput').value.trim();
      const target = s.blankWord.replace(/\s+/g, '');
      const cleanInput = input.replace(/\s+/g, '');

      const fb = document.getElementById('clozeFeedback');
      fb.classList.remove('hidden', 'bg-emerald-50', 'border-emerald-200', 'bg-rose-50', 'border-rose-200');
      const title = document.getElementById('clozeFeedbackTitle');
      const corr = document.getElementById('clozeFeedbackCorrect');
      const gram = document.getElementById('clozeFeedbackGrammar');

      const isMatch = (cleanInput === target || cleanInput === s.ja.replace(/\s+/g, '') || (input.length > 1 && s.ja.includes(input)));

      if (isMatch) {
        fb.classList.add('bg-emerald-50', 'border-emerald-200');
        title.innerHTML = '<span class="text-emerald-700 font-bold">⭕ 정답입니다!</span>';
        learnedSentenceIds.add(s.id);
        saveLearned();
      } else {
        fb.classList.add('bg-rose-50', 'border-rose-200');
        title.innerHTML = '<span class="text-rose-700 font-bold">❌ 아쉬워요! 아래 정답을 확인하세요.</span>';
      }
      corr.textContent = `정답 빈칸: ${s.blankWord} (전체 문장: ${s.ja})`;
      gram.textContent = `핵심 포인트: ${s.grammar}`;
    }

    // --- STEP 4: Full Sentence Writing ---
    let writeCurrentIdx = 0;
    let writeMode = 'blocks';
    let currentAssembledWords = [];
    let currentAvailableWords = [];

    function renderWriteQuestion() {
      if (filteredIndices.length === 0) updateFilteredIndices();
      const actualIdx = filteredIndices[writeCurrentIdx % filteredIndices.length];
      const s = sentences[actualIdx];

      document.getElementById('writeBadge').textContent = `전체 문장 쓰기 ${writeCurrentIdx + 1} / ${filteredIndices.length}`;
      document.getElementById('writeKr').textContent = s.kr;
      document.getElementById('directInputText').value = '';
      document.getElementById('writeFeedback').classList.add('hidden');

      prepareScrambleBlocks(s);

      if (autoPlayEnabled) {
        playSentenceAudio(actualIdx);
      }
    }

    function prepareScrambleBlocks(s) {
      currentAssembledWords = [];
      const rawTokens = s.ja.split(' ').filter(t => t.trim().length > 0);
      let tokens = [];
      rawTokens.forEach(t => {
        if (t.includes('、')) {
          const parts = t.split('、');
          tokens.push(parts[0] + '、');
          if (parts[1]) tokens.push(parts[1]);
        } else {
          tokens.push(t);
        }
      });

      const distractors = ['に', 'を', 'が', 'で', 'へ', 'なりました', 'あります', 'います', 'つもりです', 'たいです', 'しました'];
      const extra = distractors.filter(d => !tokens.includes(d)).slice(0, 2);
      currentAvailableWords = [...tokens, ...extra].map((text, id) => ({ id, text }));
      currentAvailableWords.sort(() => Math.random() - 0.5);

      renderBlocksUI();
    }

    let assembledPlaceholderEl = null;
    function renderBlocksUI() {
      const assembledArea = document.getElementById('assembledWordsArea');
      // 조각을 고르면 placeholder가 DOM에서 빠지므로, 처음 한 번 잡아 둔 노드를 재사용한다
      // (매번 getElementById로 찾으면 null이 되어 appendChild에서 오류 → 조각 목록이 갱신되지 않던 버그)
      if (!assembledPlaceholderEl) assembledPlaceholderEl = document.getElementById('assembledPlaceholder');
      const placeholder = assembledPlaceholderEl;
      assembledArea.innerHTML = '';

      if (currentAssembledWords.length === 0) {
        assembledArea.appendChild(placeholder);
      } else {
        currentAssembledWords.forEach((word, idx) => {
          const chip = document.createElement('button');
          chip.className = 'px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-jp font-bold text-sm shadow-sm flex items-center space-x-1';
          chip.innerHTML = `<span>${word.text}</span><span class="text-indigo-200 text-xs ml-1">×</span>`;
          chip.onclick = () => {
            currentAssembledWords.splice(idx, 1);
            currentAvailableWords.push(word);
            renderBlocksUI();
          };
          assembledArea.appendChild(chip);
        });
      }

      const poolArea = document.getElementById('availableWordsPool');
      poolArea.innerHTML = '';
      currentAvailableWords.forEach((word) => {
        const btn = document.createElement('button');
        btn.className = 'px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-900 border border-slate-200 hover:border-indigo-300 font-jp font-semibold text-sm shadow-xs transition active:scale-95';
        btn.textContent = word.text;
        btn.onclick = () => {
          currentAssembledWords.push(word);
          currentAvailableWords = currentAvailableWords.filter(w => w.id !== word.id);
          renderBlocksUI();
        };
        poolArea.appendChild(btn);
      });
    }

    function checkWriteAnswer() {
      const actualIdx = filteredIndices[writeCurrentIdx % filteredIndices.length];
      const s = sentences[actualIdx];

      let userStr = '';
      if (writeMode === 'blocks') {
        userStr = currentAssembledWords.map(w => w.text).join('').replace(/\s+/g, '');
      } else {
        userStr = document.getElementById('directInputText').value.replace(/\s+/g, '');
      }

      const targetKanji = s.ja.replace(/\s+/g, '').replace(/[。、]/g, '');
      const targetHira = s.hira.replace(/\s+/g, '').replace(/[。、]/g, '');
      const cleanUser = userStr.replace(/[。、]/g, '');

      const isMatch = (cleanUser === targetKanji || cleanUser === targetHira);

      const fb = document.getElementById('writeFeedback');
      fb.classList.remove('hidden', 'bg-emerald-50', 'border-emerald-200', 'bg-rose-50', 'border-rose-200');
      const title = document.getElementById('writeFeedbackTitle');
      const corr = document.getElementById('writeFeedbackCorrect');
      const hira = document.getElementById('writeFeedbackHira');
      const gram = document.getElementById('writeFeedbackGrammar');

      if (isMatch) {
        fb.classList.add('bg-emerald-50', 'border-emerald-200');
        title.innerHTML = '<span class="text-emerald-700 font-bold">🎉 완벽합니다! 시험에서 100점 맞을 실력입니다!</span>';
        learnedSentenceIds.add(s.id);
        saveLearned();
      } else {
        fb.classList.add('bg-rose-50', 'border-rose-200');
        title.innerHTML = '<span class="text-rose-700 font-bold">📝 아쉽습니다! 아래 정답과 철자를 비교해 보세요.</span>';
      }

      corr.textContent = s.ja;
      hira.textContent = s.hira;
      gram.textContent = `핵심 문법: ${s.grammar}`;
    }

    // ==========================================
    // TAB 2: 숙제 마스터 로직 (쓰기 & 녹음)
    // ==========================================
    let selectedRecordingIds = [];
    let recordedBlobs = {};
    let mediaRecorders = {};
    let activeMediaStream = null;

    function renderReadingHomework() {
      const mainHeading = document.getElementById('worksheetMainHeading');
      const titleTag = document.getElementById('readingPassageTitleTag');
      const sentBox = document.getElementById('readingPassageSentencesBox');
      const jaList = document.getElementById('readingHandwritingJaList');
      const krList = document.getElementById('readingHandwritingKrList');
      const answerKey = document.getElementById('readingAnswerKey');

      if (!readingPassage || !readingPassage.sentences) return;

      const lessonLabelText = lessonLabel();
      mainHeading.textContent = `📖 [${lessonLabelText}] 읽어 봅시다! 쓰기 & 한국어 번역 과제`;
      titleTag.textContent = `【 ${readingPassage.title} 】`;

      sentBox.innerHTML = '';
      jaList.innerHTML = '';
      krList.innerHTML = '';
      answerKey.innerHTML = '<div class="font-bold text-slate-500 pb-1">해석 참고</div>';

      readingPassage.sentences.forEach((ps, idx) => {
        const p = document.createElement('p');
        p.innerHTML = ps.ruby || renderRubyFromText(ps.ja, ps.hira);
        sentBox.appendChild(p);

        const jaDiv = document.createElement('div');
        jaDiv.className = 'space-y-1';
        jaDiv.innerHTML = `
          <div class="text-xs text-slate-500 font-jp font-medium">${idx + 1}. ${ps.ja}</div>
          <div class="min-h-12 border-b-2 border-slate-300 border-dashed relative flex items-end pb-1 text-slate-400 text-xs font-mono">
            <span class="text-slate-300">필기란 (일본어 정자체 쓰기)</span>
          </div>
        `;
        jaList.appendChild(jaDiv);

        const krDiv = document.createElement('div');
        krDiv.className = 'space-y-1';
        krDiv.innerHTML = `
          <div class="flex items-end gap-2 min-h-10 border-b-2 border-slate-300 border-dashed pb-1">
            <span class="text-xs text-slate-500 font-bold">${idx + 1}.</span>
          </div>
        `;
        krList.appendChild(krDiv);

        const keyLine = document.createElement('div');
        keyLine.textContent = `${idx + 1}. ${ps.kr}`;
        answerKey.appendChild(keyLine);
      });
    }

    // FIXED: preserveSelection parameter prevents resetting selectedRecordingIds on random selection!
    function renderSentencePicker(preserveSelection) {
      const grid = document.getElementById('sentencePickerGrid');
      if (!grid) return;
      grid.innerHTML = '';

      // Default pick first 10 ONLY when not preserving or empty
      if (!preserveSelection || !selectedRecordingIds || selectedRecordingIds.length === 0) {
        selectedRecordingIds = sentences.slice(0, Math.min(10, sentences.length)).map(s => s.id);
      }

      // Filter only IDs existing in current lesson
      const validLessonIds = new Set(sentences.map(s => s.id));
      selectedRecordingIds = selectedRecordingIds.filter(id => validLessonIds.has(id));
      if (selectedRecordingIds.length === 0) {
        selectedRecordingIds = sentences.slice(0, Math.min(10, sentences.length)).map(s => s.id);
      }

      sentences.forEach(s => {
        const isChecked = selectedRecordingIds.includes(s.id);
        const label = document.createElement('label');
        label.className = `flex items-center space-x-1.5 p-2 rounded-xl border text-xs cursor-pointer transition select-none ${
          isChecked ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
        }`;
        label.innerHTML = `
          <input type="checkbox" value="${s.id}" ${isChecked ? 'checked' : ''} class="rounded text-indigo-600 focus:ring-indigo-500">
          <span>${s.id}번</span>
        `;
        const cb = label.querySelector('input');
        cb.onchange = () => {
          if (cb.checked) {
            if (selectedRecordingIds.length >= 10) {
              cb.checked = false;
              showToast('최대 10개 문장까지만 선택할 수 있습니다.', '⚠️');
              return;
            }
            selectedRecordingIds.push(s.id);
          } else {
            selectedRecordingIds = selectedRecordingIds.filter(id => id !== s.id);
          }
          selectedRecordingIds.sort((a,b) => a-b);
          updateRecordingSelectionUI();
        };
        grid.appendChild(label);
      });
      updateRecordingSelectionUI();
    }

    function updateRecordingSelectionUI() {
      const badge = document.getElementById('selectedCountBadge');
      if (badge) badge.textContent = selectedRecordingIds.length;
      renderRecordingCards();
    }

    function renderRecordingCards() {
      const container = document.getElementById('recordingCardsContainer');
      if (!container) return;
      container.innerHTML = '';

      if (selectedRecordingIds.length === 0) {
        container.innerHTML = '<div class="p-6 text-center text-slate-400 text-xs">선택된 문장이 없습니다. 위에서 문장을 선택해 주세요.</div>';
        return;
      }

      selectedRecordingIds.forEach((sid, idx) => {
        const s = sentences.find(item => item.id === sid);
        if (!s) return;

        const hasRecorded = !!recordedBlobs[s.id];

        const card = document.createElement('div');
        card.className = `p-4 md:p-5 rounded-2xl border transition space-y-3 ${
          hasRecorded ? 'bg-emerald-50/50 border-emerald-300' : 'bg-white border-slate-200'
        }`;

        card.innerHTML = `
          <div class="flex items-center justify-between text-xs">
            <span class="font-extrabold px-2.5 py-1 rounded-md ${
              hasRecorded ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }">과제 문장 #${idx + 1} (교재 ${s.id}번)</span>

            <div class="flex items-center space-x-2">
              <span id="recStatus-${s.id}" class="font-medium ${
                hasRecorded ? 'text-emerald-700 font-bold' : 'text-slate-400'
              }">${hasRecorded ? '✅ 녹음 완료' : '대기 중'}</span>

              <button class="native-play-btn px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs flex items-center space-x-1" title="원어민 표준 발음 듣기">
                <span>🔊 표준음성</span>
              </button>
            </div>
          </div>

          <div class="space-y-1">
            <div class="text-lg md:text-xl font-bold font-jp text-indigo-950">${renderRubyFromText(s.ja, s.hira)}</div>
            <div class="text-xs font-jp text-indigo-600 font-medium">${s.hira}</div>
            <div class="text-sm font-semibold text-slate-700 mt-1">뜻: ${s.kr}</div>
          </div>

          <div class="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center space-x-2">
              <button id="recStartBtn-${s.id}" class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 transition active:scale-95">
                <span class="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
                <span id="recStartText-${s.id}">${hasRecorded ? '다시 녹음하기' : '녹음 시작'}</span>
              </button>
              <button id="recStopBtn-${s.id}" class="hidden px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs shadow-sm transition active:scale-95">
                ⏹️ 녹음 중지
              </button>
              <button id="recReplayBtn-${s.id}" class="${hasRecorded ? '' : 'hidden'} px-3.5 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs transition flex items-center space-x-1">
                <span>▶ 내 녹음 듣기</span>
              </button>
            </div>
            <audio id="recAudioPlayer-${s.id}" class="${hasRecorded ? '' : 'hidden'} h-8 max-w-xs" controls></audio>
          </div>
        `;

        card.querySelector('.native-play-btn').onclick = () => {
          const realIdx = sentences.findIndex(x => x.id === s.id);
          if (realIdx !== -1) playSentenceAudio(realIdx);
        };

        const startBtn = card.querySelector(`#recStartBtn-${s.id}`);
        const stopBtn = card.querySelector(`#recStopBtn-${s.id}`);
        const replayBtn = card.querySelector(`#recReplayBtn-${s.id}`);
        const player = card.querySelector(`#recAudioPlayer-${s.id}`);
        const statusSpan = card.querySelector(`#recStatus-${s.id}`);

        if (hasRecorded && recordedBlobs[s.id]) {
          player.src = URL.createObjectURL(recordedBlobs[s.id]);
        }

        startBtn.onclick = async () => {
          try {
            if (!activeMediaStream) {
              activeMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }
            const stream = activeMediaStream;
            const recorder = new MediaRecorder(stream);
            let chunks = [];

            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = () => {
              const blob = new Blob(chunks, { type: 'audio/webm' });
              recordedBlobs[s.id] = blob;
              player.src = URL.createObjectURL(blob);
              player.classList.remove('hidden');
              replayBtn.classList.remove('hidden');
              statusSpan.textContent = '✅ 녹음 완료';
              statusSpan.className = 'font-bold text-emerald-700';
              card.classList.add('bg-emerald-50/50', 'border-emerald-300');
              updateCompletedCounter();
            };

            recorder.start();
            mediaRecorders[s.id] = recorder;

            startBtn.classList.add('hidden');
            stopBtn.classList.remove('hidden');
            statusSpan.textContent = '🔴 녹음 중...';
            statusSpan.className = 'font-bold text-rose-600 animate-pulse';
          } catch (err) {
            console.error('Microphone access error:', err);
            showToast('마이크 접근 권한이 필요합니다. 브라우저 설정에서 마이크를 허용해 주세요.', '🎙️');
          }
        };

        stopBtn.onclick = () => {
          const recorder = mediaRecorders[s.id];
          if (recorder && recorder.state !== 'inactive') {
            recorder.stop();
          }
          startBtn.classList.remove('hidden');
          stopBtn.classList.add('hidden');
          startBtn.querySelector(`#recStartText-${s.id}`).textContent = '다시 녹음하기';
        };

        replayBtn.onclick = () => {
          player.play();
        };

        container.appendChild(card);
      });

      updateCompletedCounter();
    }

    function updateCompletedCounter() {
      const el = document.getElementById('completedRecordCount');
      let count = 0;
      selectedRecordingIds.forEach(id => {
        if (recordedBlobs[id]) count++;
      });
      if (el) el.textContent = count;
    }

    // --- Merge 10 Audios into unified WAV ---
    async function mergeAndSaveRecordings() {
      const missing = selectedRecordingIds.filter(id => !recordedBlobs[id]);
      if (missing.length > 0) {
        showToast(`아직 녹음되지 않은 문장이 ${missing.length}개 있습니다. 10개 문장을 모두 녹음해 주세요.`, '⚠️');
        return;
      }

      const mergeBtn = document.getElementById('mergeAudioBtn');
      mergeBtn.disabled = true;
      mergeBtn.innerHTML = '<span>⏳ 합치는 중...</span>';

      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffers = [];

        for (const sid of selectedRecordingIds) {
          const blob = recordedBlobs[sid];
          const arrayBuffer = await blob.arrayBuffer();
          const decoded = await audioCtx.decodeAudioData(arrayBuffer);
          audioBuffers.push(decoded);
        }

        const pauseSamples = Math.floor(audioCtx.sampleRate * 0.8);
        let totalSamples = 0;
        audioBuffers.forEach((buf, i) => {
          totalSamples += buf.length;
          if (i < audioBuffers.length - 1) totalSamples += pauseSamples;
        });

        const mergedBuffer = audioCtx.createBuffer(1, totalSamples, audioCtx.sampleRate);
        const channelData = mergedBuffer.getChannelData(0);

        let offset = 0;
        audioBuffers.forEach((buf, i) => {
          const inputChannel = buf.getChannelData(0);
          channelData.set(inputChannel, offset);
          offset += buf.length;
          if (i < audioBuffers.length - 1) {
            offset += pauseSamples;
          }
        });

        const wavBlob = audioBufferToWavBlob(mergedBuffer);
        const downloadUrl = URL.createObjectURL(wavBlob);

        const box = document.getElementById('mergedPlayerBox');
        box.classList.remove('hidden');
        const player = document.getElementById('mergedAudioPlayer');
        player.src = downloadUrl;
        const durMin = Math.floor(mergedBuffer.duration / 60);
        const durSec = Math.floor(mergedBuffer.duration % 60);
        document.getElementById('mergedDurationText').textContent = `${durMin}:${durSec < 10 ? '0' : ''}${durSec}`;

        const studentTag = currentUserName ? `_${currentUserName}` : '';
        const link = document.getElementById('downloadMergedLink');
        link.href = downloadUrl;
        link.download = `다이스키${lessonLabel()}_10문장_녹음과제${studentTag}.wav`;

        const autoLink = document.createElement('a');
        autoLink.href = downloadUrl;
        autoLink.download = `다이스키${lessonLabel()}_10문장_녹음과제${studentTag}.wav`;
        autoLink.click();

        mergeBtn.disabled = false;
        mergeBtn.innerHTML = '<span>⚡ 10개 문장 음성 합치기 & 파일 저장 완료!</span>';
        showToast('10문장 음성 합치기 및 저장이 완료되었습니다!', '✅');
      } catch (err) {
        console.error('Audio merge error:', err);
        showToast('음성 파일 합치기 오류: ' + err.message, '❌');
        mergeBtn.disabled = false;
        mergeBtn.innerHTML = '<span>⚡ 10개 문장 음성 합치기 & 파일 저장</span>';
      }
    }

    function audioBufferToWavBlob(buffer) {
      const numChannels = 1;
      const sampleRate = buffer.sampleRate;
      const format = 1; // PCM
      const bitDepth = 16;
      const bytesPerSample = bitDepth / 8;
      const blockAlign = numChannels * bytesPerSample;
      const data = buffer.getChannelData(0);
      const dataLength = data.length * bytesPerSample;
      const bufferLength = 44 + dataLength;

      const arrayBuffer = new ArrayBuffer(bufferLength);
      const view = new DataView(arrayBuffer);

      function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      }

      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + dataLength, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, format, true);
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * blockAlign, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, bitDepth, true);
      writeString(view, 36, 'data');
      view.setUint32(40, dataLength, true);

      let index = 44;
      for (let i = 0; i < data.length; i++) {
        let sample = Math.max(-1, Math.min(1, data[i]));
        view.setInt16(index, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        index += 2;
      }

      return new Blob([view], { type: 'audio/wav' });
    }

    // ==========================================
    // NEW TAB 0: 어휘·문형 활용 연습실 엔진 (Conjugation & Application Lab)
    // ==========================================
    let conjMode = 'table'; // 'table', 'quiz', 'write'
    let currentConjCat = 'all';
    // 활용형 묶음 필터 (ます형 / て형 / て형Ⅱ / た형 …): 표·4지선다·타이핑 모두 이 묶음만 출제
    let currentConjFam = 'all';
    const FAM_ORDER = ['ます형', 'て형', 'て형Ⅱ', 'た형', '기본형'];
    function famOf(f) { return f.fam || '기본'; }
    function formsInFam(item) {
      return (item.forms || []).filter(f => currentConjFam === 'all' || famOf(f) === currentConjFam);
    }
    function renderConjFamFilters() {
      const box = document.getElementById('conjFamFilters');
      if (!box) return;
      const counts = {};
      (APP_DATA.conjugationItems || []).forEach(it => (it.forms || []).forEach(f => { counts[famOf(f)] = (counts[famOf(f)] || 0) + 1; }));
      const fams = Object.keys(counts).filter(k => k !== '기본')
        .sort((a, b) => (FAM_ORDER.indexOf(a) + 1 || 99) - (FAM_ORDER.indexOf(b) + 1 || 99));
      if (fams.length < 2) { box.classList.add('hidden'); box.innerHTML = ''; currentConjFam = 'all'; return; }
      box.classList.remove('hidden');
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      box.innerHTML = '<span class="text-xs font-extrabold text-slate-600 mr-1">🎯 활용형별 집중 연습:</span>';
      [['all', `전체 활용형 (${total})`], ...fams.map(f => [f, `${f} (${counts[f]})`]), ...(counts['기본'] ? [['기본', `기타 (${counts['기본']})`]] : [])]
        .forEach(([key, text]) => {
          const btn = document.createElement('button');
          const on = currentConjFam === key;
          btn.className = `px-3 py-1.5 rounded-xl text-xs transition border ${on ? 'bg-amber-500 border-amber-500 text-white font-extrabold shadow-xs' : 'bg-white border-amber-200 text-amber-800 font-bold hover:bg-amber-50'}`;
          btn.textContent = text;
          btn.onclick = () => {
            currentConjFam = key;
            renderConjFamFilters();
            renderConjugationTable();
            conjQuizPool = buildConjugationPool().sort(() => Math.random() - 0.5);
            conjQuizIdx = 0;
            conjWriteIdx = 0;
            if (conjMode === 'quiz') renderConjugationQuizQuestion();
            if (conjMode === 'write') renderConjugationWriteQuestion();
          };
          box.appendChild(btn);
        });
    }
    let conjQuizPool = [];
    let conjQuizIdx = 0;
    let conjQuizStreak = 0;
    let conjQuizScore = 0;
    let conjWriteIdx = 0;

    function buildConjugationPool() {
      const items = APP_DATA.conjugationItems || [];
      const pool = [];
      items.forEach(item => {
        formsInFam(item).forEach(f => {
          pool.push({
            cat: item.cat,
            baseDict: item.dict,
            baseHira: item.dictHira,
            baseKr: item.kr,
            rule: item.rule,
            targetLabel: f.label,
            ja: f.ja,
            hira: f.hira,
            kr: f.kr
          });
        });
      });
      return pool;
    }

    function renderConjugationLab() {
      const items = APP_DATA.conjugationItems || [];
      const heading = document.getElementById('conjSectionHeading');
      const countEl = document.getElementById('navConjCount');
      if (countEl) countEl.textContent = items.length;
      if (heading) {
        const label = lessonLabel();
        heading.textContent = `[${label}] 어휘 및 문형 활용 집중 연습실 (${items.length}개 핵심 항목)`;
      }
      currentConjCat = 'all';
      currentConjFam = 'all';
      renderConjFamFilters();
      renderConjugationTable();
      conjQuizPool = buildConjugationPool().sort(() => Math.random() - 0.5);
      conjQuizIdx = 0;
      conjWriteIdx = 0;
      if (conjMode === 'quiz') renderConjugationQuizQuestion();
      if (conjMode === 'write') renderConjugationWriteQuestion();
    }

    function renderConjugationTable() {
      const items = APP_DATA.conjugationItems || [];
      const filterBox = document.getElementById('conjCatFilters');
      const grid = document.getElementById('conjItemsGrid');
      if (!filterBox || !grid) return;

      const hasNewIn = x => isNewSince(x.since) || (x.forms || []).some(f => isNewSince(f.since));
      const newCount = items.filter(hasNewIn).length;
      const cats = ['all', ...(newCount ? ['__new__'] : []), ...Array.from(new Set(items.map(x => x.cat)))];
      if (currentConjCat === '__new__' && !newCount) currentConjCat = 'all';
      filterBox.innerHTML = '';
      cats.forEach(c => {
        const btn = document.createElement('button');
        const count = c === 'all' ? items.length : c === '__new__' ? newCount : items.filter(x => x.cat === c).length;
        const isActive = currentConjCat === c;
        btn.className = `px-3 py-1.5 rounded-full text-xs transition ${
          isActive ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'bg-slate-200 text-slate-700 font-medium hover:bg-slate-300'
        }`;
        btn.textContent = `${c === 'all' ? '전체 보기' : c === '__new__' ? '🆕 새로 추가된 것' : c} (${count})`;
        if (c === '__new__' && !isActive) btn.className = 'px-3 py-1.5 rounded-full text-xs transition bg-rose-100 text-rose-700 font-bold hover:bg-rose-200';
        btn.onclick = () => {
          currentConjCat = c;
          renderConjugationTable();
        };
        filterBox.appendChild(btn);
      });

      grid.innerHTML = '';
      const filtered = items.filter(x => currentConjCat === 'all' || (currentConjCat === '__new__' ? hasNewIn(x) : x.cat === currentConjCat))
        .filter(x => formsInFam(x).length > 0);

      filtered.forEach(item => {
        const card = document.createElement('div');
        const itemNew = isNewSince(item.since);
        card.className = `p-5 rounded-3xl bg-white border ${itemNew ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'} shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between`;

        const formsHtml = formsInFam(item).map((f, fIdx) => `
          <div class="p-2.5 rounded-xl ${isNewSince(f.since) ? 'bg-rose-50/60 border-rose-300' : 'bg-slate-50 border-slate-200/80'} hover:bg-indigo-50/50 border flex items-center justify-between gap-2 transition">
            <div class="space-y-0.5 min-w-0 flex-1">
              <div class="text-[11px] font-bold text-indigo-600">${isNewSince(f.since) ? newBadgeHtml('NEW') + ' ' : ''}${f.label}</div>
              <div class="text-sm md:text-base font-extrabold font-jp text-slate-900 truncate">${renderRubyFromText(f.ja, f.hira)}</div>
              <div class="text-[11px] text-slate-500 font-jp">${f.hira} <span class="font-sans text-slate-600 font-semibold">• ${f.kr}</span></div>
            </div>
            <button data-speak="${f.ja.replace(/"/g, '&quot;')}" class="conj-form-speak-btn shrink-0 w-8 h-8 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-indigo-600 flex items-center justify-center text-xs shadow-2xs transition active:scale-95" title="이 활용형 발음 듣기">
              🔊
            </button>
          </div>
        `).join('');

        card.innerHTML = `
          <div class="space-y-2.5">
            <div class="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <span class="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">${item.cat}</span>${itemNew ? ' ' + newBadgeHtml('NEW') : ''}
                <h3 class="text-xl font-extrabold font-jp text-slate-900 mt-1">${renderRubyFromText(item.dict, item.dictHira)} <span class="text-sm font-normal text-indigo-600">(${item.dictHira})</span></h3>
                <div class="text-sm font-bold text-slate-700">${item.kr}</div>
              </div>
              <button data-speak="${item.dict.replace(/"/g, '&quot;')}" class="conj-base-speak-btn px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center space-x-1 shrink-0">
                <span>🔊</span><span>기본형</span>
              </button>
            </div>

            <div class="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950">
              <span class="font-bold">💡 활용 핵심:</span> ${item.rule}
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              ${formsHtml}
            </div>
          </div>
        `;

        const baseBtn = card.querySelector('.conj-base-speak-btn');
        if (baseBtn) {
          baseBtn.onclick = () => speakTTS(baseBtn.dataset.speak);
        }
        card.querySelectorAll('.conj-form-speak-btn').forEach(btn => {
          btn.onclick = () => speakTTS(btn.dataset.speak);
        });

        grid.appendChild(card);
      });
    }

    function generateConjugationDistractors(target, pool) {
      const distractors = [];
      const sameBaseForms = pool.filter(x => x.baseDict === target.baseDict && x.ja !== target.ja && x.hira !== target.hira);
      sameBaseForms.sort(() => Math.random() - 0.5).forEach(x => {
        if (distractors.length < 2 && !distractors.some(d => d.ja === x.ja)) {
          distractors.push({ ja: x.ja, hira: x.hira, kr: x.kr, label: x.targetLabel });
        }
      });

      // Add smart trap distractors
      if (target.ja.endsWith('くないです')) {
        distractors.push({ ja: target.baseDict + 'ないです', hira: target.baseHira + 'ないです', kr: '함정 오답 (어미 い를 그대로 둔 형태)', label: '오답 함정' });
      } else if (target.ja.endsWith('ではありません')) {
        const stem = target.baseDict.replace(/だ$/, '');
        const stemH = target.baseHira.replace(/だ$/, '');
        distractors.push({ ja: stem + 'くないです', hira: stemH + 'くないです', kr: '함정 오답 (な형용사에 い형용사 부정을 붙인 형태)', label: '오답 함정' });
      } else if (target.ja.includes('な ')) {
        distractors.push({ ja: target.ja.replace('な ', 'い '), hira: target.hira.replace('な ', 'い '), kr: '함정 오답 (な 대신 い를 붙인 형태)', label: '오답 함정' });
      }

      const otherForms = pool.filter(x => x.ja !== target.ja && x.hira !== target.hira);
      otherForms.sort(() => Math.random() - 0.5).forEach(x => {
        if (distractors.length < 3 && !distractors.some(d => d.ja === x.ja)) {
          distractors.push({ ja: x.ja, hira: x.hira, kr: x.kr, label: x.targetLabel });
        }
      });
      return distractors.slice(0, 3);
    }

    function renderConjugationQuizQuestion() {
      if (conjQuizPool.length === 0) {
        conjQuizPool = buildConjugationPool().sort(() => Math.random() - 0.5);
      }
      if (conjQuizPool.length === 0) return;
      const q = conjQuizPool[conjQuizIdx % conjQuizPool.length];

      document.getElementById('cquizBadge').textContent = `활용 변환 퀴즈 #${(conjQuizIdx % conjQuizPool.length) + 1} / ${conjQuizPool.length}`;
      document.getElementById('cquizScoreBadge').textContent = `연속 정답: ${conjQuizStreak}회 (총 ${conjQuizScore}점)`;
      document.getElementById('cquizCatTag').textContent = q.cat;
      document.getElementById('cquizBaseWord').innerHTML = `${renderRubyFromText(q.baseDict, q.baseHira)} <span class="text-base font-sans font-bold text-slate-500">(${q.baseKr})</span>`;
      document.getElementById('cquizTargetLabel').textContent = `목표 활용: [ ${q.targetLabel} ] ➔ "${q.kr}"`;

      const distractors = generateConjugationDistractors(q, conjQuizPool);
      const options = [
        { ja: q.ja, hira: q.hira, kr: q.kr, isCorrect: true },
        ...distractors.map(d => ({ ...d, isCorrect: false }))
      ].sort(() => Math.random() - 0.5);

      const optsBox = document.getElementById('cquizOptions');
      optsBox.innerHTML = '';
      document.getElementById('cquizFeedback').classList.add('hidden');

      options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'cquiz-opt-btn p-4 rounded-2xl border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 text-left transition flex items-start space-x-3';
        btn.innerHTML = `
          <span class="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">${idx + 1}</span>
          <div class="min-w-0 flex-1">
            <div class="font-jp font-extrabold text-base text-slate-900">${renderRubyFromText(opt.ja, opt.hira)}</div>
            <div class="font-jp text-xs text-indigo-600 mt-0.5">${opt.hira}</div>
          </div>
        `;
        btn.onclick = () => {
          document.querySelectorAll('.cquiz-opt-btn').forEach(b => b.disabled = true);
          speakTTS(q.ja);
          const fb = document.getElementById('cquizFeedback');
          fb.classList.remove('hidden', 'bg-emerald-50', 'border-emerald-200', 'bg-rose-50', 'border-rose-200');
          const title = document.getElementById('cquizFeedbackTitle');
          const detail = document.getElementById('cquizFeedbackDetail');
          const rule = document.getElementById('cquizFeedbackRule');

          if (opt.isCorrect) {
            btn.classList.add('border-emerald-500', 'bg-emerald-50');
            conjQuizStreak++;
            conjQuizScore += 10;
            fb.classList.add('bg-emerald-50', 'border-emerald-200');
            title.innerHTML = '<span class="text-emerald-700 font-bold">⭕ 정답입니다! 완벽한 활용입니다.</span>';
          } else {
            btn.classList.add('border-rose-500', 'bg-rose-50');
            conjQuizStreak = 0;
            fb.classList.add('bg-rose-50', 'border-rose-200');
            title.innerHTML = '<span class="text-rose-700 font-bold">❌ 아쉽습니다! 올바른 활용형을 확인하세요.</span>';
          }
          document.getElementById('cquizScoreBadge').textContent = `연속 정답: ${conjQuizStreak}회 (총 ${conjQuizScore}점)`;
          detail.textContent = `정답: ${q.ja} (${q.hira}) — 뜻: ${q.kr}`;
          rule.textContent = `💡 규칙: ${q.rule}`;
        };
        optsBox.appendChild(btn);
      });
    }

    function renderConjugationWriteQuestion() {
      if (conjQuizPool.length === 0) {
        conjQuizPool = buildConjugationPool().sort(() => Math.random() - 0.5);
      }
      if (conjQuizPool.length === 0) return;
      const q = conjQuizPool[conjWriteIdx % conjQuizPool.length];

      document.getElementById('cwriteBadge').textContent = `직접 활용 변환 #${(conjWriteIdx % conjQuizPool.length) + 1} / ${conjQuizPool.length}`;
      document.getElementById('cwriteCatTag').textContent = q.cat;
      document.getElementById('cwriteBaseWord').innerHTML = `${renderRubyFromText(q.baseDict, q.baseHira)} <span class="text-base font-sans font-bold text-slate-500">(${q.baseKr})</span>`;
      document.getElementById('cwriteTargetPrompt').textContent = `변환 목표: [ ${q.targetLabel} ] ➔ "${q.kr}"`;
      document.getElementById('cwriteInput').value = '';
      document.getElementById('cwriteHintBox').classList.add('hidden');
      document.getElementById('cwriteFeedback').classList.add('hidden');
    }

    function checkConjugationWriteAnswer() {
      if (conjQuizPool.length === 0) return;
      const q = conjQuizPool[conjWriteIdx % conjQuizPool.length];
      const val = (document.getElementById('cwriteInput').value || '').trim().replace(/\s+/g, '').replace(/[。、]/g, '');
      const targetJa = q.ja.replace(/\s+/g, '').replace(/[。、]/g, '');
      const targetHira = q.hira.replace(/\s+/g, '').replace(/[。、]/g, '');

      const isMatch = val.length > 0 && (val === targetJa || val === targetHira);
      speakTTS(q.ja);

      const fb = document.getElementById('cwriteFeedback');
      fb.classList.remove('hidden', 'bg-emerald-50', 'border-emerald-200', 'bg-rose-50', 'border-rose-200');
      const title = document.getElementById('cwriteFeedbackTitle');
      const corr = document.getElementById('cwriteFeedbackCorrect');
      const rule = document.getElementById('cwriteFeedbackRule');

      if (isMatch) {
        fb.classList.add('bg-emerald-50', 'border-emerald-200');
        title.innerHTML = '<span class="text-emerald-700 font-bold">🎉 정답입니다! 직접 변환까지 완벽하게 마스터하셨습니다!</span>';
      } else {
        fb.classList.add('bg-rose-50', 'border-rose-200');
        title.innerHTML = '<span class="text-rose-700 font-bold">📝 아래 올바른 활용형과 철자를 비교해 보세요.</span>';
      }
      corr.textContent = `정답: ${q.ja} (히라가나: ${q.hira}) — ${q.kr}`;
      rule.textContent = `💡 규칙: ${q.rule}`;
    }

    // --- TAB 3: Words Engine ---
    let wordMode = 'cards';
    let currentWordCat = 'all';

    function renderWordsGrid() {
      const grid = document.getElementById('wordsGrid');
      const filterBox = document.getElementById('wordCategoryFilters');
      if (!grid || !filterBox) return;

      const cats = ['all', ...Array.from(new Set(words.map(w => w.category)))];
      filterBox.innerHTML = '';
      cats.forEach(c => {
        const btn = document.createElement('button');
        const count = c === 'all' ? words.length : words.filter(w => w.category === c).length;
        const isActive = currentWordCat === c;
        btn.className = `word-cat-btn px-3 py-1 rounded-full text-xs transition ${
          isActive ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-200 text-slate-700 font-medium hover:bg-slate-300'
        }`;
        btn.textContent = `${c === 'all' ? '전체' : c} (${count})`;
        btn.onclick = () => {
          currentWordCat = c;
          renderWordsGrid();
        };
        filterBox.appendChild(btn);
      });

      grid.innerHTML = '';
      const filtered = words.filter(w => {
        if (currentWordCat === 'all') return true;
        return w.category === currentWordCat;
      });

      filtered.forEach((w) => {
        const card = document.createElement('div');
        card.className = 'p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-200 transition space-y-2 flex flex-col justify-between';
        card.innerHTML = `
          <div>
            <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">${w.category}</span>
              <button class="word-speak-btn text-indigo-500 hover:text-indigo-700 p-1" title="발음 듣기">🔊</button>
            </div>
            <div class="text-lg font-bold text-slate-900 mb-0.5">${w.kr}</div>
          </div>
          <div class="pt-2 border-t border-slate-100 flex items-baseline justify-between">
            <span class="text-xl font-bold font-jp text-indigo-950">${w.kanji !== '-' ? w.kanji : w.hira}</span>
            <span class="text-xs font-jp text-indigo-600 font-medium">${w.hira}</span>
          </div>
        `;
        card.querySelector('.word-speak-btn').onclick = (e) => {
          e.stopPropagation();
          speakTTS(w.kanji !== '-' ? w.kanji : w.hira);
        };
        grid.appendChild(card);
      });
    }

    // Word Quiz Mode
    let wquizIdx = 0;
    let wquizScoreVal = 0;
    let wquizList = [];

    function startWordQuiz() {
      wquizIdx = 0;
      wquizScoreVal = 0;
      wquizList = [...words].sort(() => Math.random() - 0.5).slice(0, 10);
      renderWordQuizQuestion();
    }

    function renderWordQuizQuestion() {
      if (wquizIdx >= wquizList.length) {
        showWordQuizFinal();
        return;
      }
      const w = wquizList[wquizIdx];
      document.getElementById('wquizBadge').textContent = `단어 퀴즈 ${wquizIdx + 1} / ${wquizList.length}`;
      document.getElementById('wquizScore').textContent = `점수: ${wquizScoreVal * 10}점`;
      document.getElementById('wquizQuestion').textContent = w.kr;
      document.getElementById('wquizCatBadge').textContent = w.category;

      const optsContainer = document.getElementById('wquizOptions');
      optsContainer.innerHTML = '';
      document.getElementById('wquizFeedback').classList.add('hidden');

      const correctText = w.kanji !== '-' ? `${w.kanji} (${w.hira})` : w.hira;
      const wrongList = words.filter(x => x.kr !== w.kr)
        .sort(() => Math.random() - 0.5).slice(0, 3)
        .map(x => x.kanji !== '-' ? `${x.kanji} (${x.hira})` : x.hira);

      const allOpts = [
        { text: correctText, isCorrect: true, word: w },
        ...wrongList.map(t => ({ text: t, isCorrect: false, word: w }))
      ].sort(() => Math.random() - 0.5);

      allOpts.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'wquiz-btn w-full p-3.5 text-left rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition font-jp font-semibold text-slate-800 text-base flex items-center space-x-2';
        btn.innerHTML = `<span class="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-sans font-bold text-xs">${idx + 1}</span><span>${opt.text}</span>`;

        btn.onclick = () => {
          document.querySelectorAll('.wquiz-btn').forEach(b => b.disabled = true);
          speakTTS(w.kanji !== '-' ? w.kanji : w.hira);

          if (opt.isCorrect) {
            btn.classList.add('border-emerald-500', 'bg-emerald-50', 'text-emerald-900');
            wquizScoreVal++;
            document.getElementById('wquizScore').textContent = `점수: ${wquizScoreVal * 10}점`;
            showWQuizFeedback(true, `정답입니다! [${w.kr}] = ${correctText}`);
          } else {
            btn.classList.add('border-rose-500', 'bg-rose-50', 'text-rose-900');
            document.querySelectorAll('.wquiz-btn').forEach(b => {
              if (b.innerText.includes(w.hira)) b.classList.add('border-emerald-500', 'bg-emerald-50');
            });
            showWQuizFeedback(false, `오답입니다. 정답은 [${correctText}] 입니다.`);
          }
        };
        optsContainer.appendChild(btn);
      });
    }

    function showWQuizFeedback(isCorrect, exp) {
      const fb = document.getElementById('wquizFeedback');
      fb.classList.remove('hidden', 'bg-emerald-50', 'border-emerald-200', 'bg-rose-50', 'border-rose-200');
      const title = document.getElementById('wquizFeedbackTitle');
      const detail = document.getElementById('wquizFeedbackDetail');

      if (isCorrect) {
        fb.classList.add('bg-emerald-50', 'border-emerald-200');
        title.innerHTML = '<span class="text-emerald-700 font-bold">⭕ 정답!</span>';
      } else {
        fb.classList.add('bg-rose-50', 'border-rose-200');
        title.innerHTML = '<span class="text-rose-700 font-bold">❌ 오답</span>';
      }
      detail.textContent = exp;
    }

    function showWordQuizFinal() {
      const container = document.getElementById('wordQuizContainer');
      container.innerHTML = `
        <div class="bg-white rounded-3xl p-8 text-center space-y-4 max-w-md mx-auto border border-slate-200">
          <div class="text-4xl">🏆</div>
          <h3 class="text-2xl font-bold text-slate-900">${lessonLabel()} 단어 퀴즈 완료!</h3>
          <div class="text-4xl font-extrabold text-indigo-600">${wquizScoreVal * 10}점 / 100점</div>
          <p class="text-xs text-slate-500">10문제 중 ${wquizScoreVal}문제를 맞히셨습니다.</p>
          <button onclick="startWordQuiz()" class="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow hover:bg-indigo-700 transition">
            다시 도전하기
          </button>
        </div>
      `;
    }

    // --- TAB 5: Mock Test Engine ---
    let mockQuestions = [];
    let mockIndex = 0;
    let mockScore = 0;
    let mockWrongItems = [];

    function generateMockExam() {
      mockQuestions = [];
      mockIndex = 0;
      mockScore = 0;
      mockWrongItems = [];

      const shuffledWords = [...words].sort(() => Math.random() - 0.5).slice(0, 10);
      shuffledWords.forEach(w => {
        const correctText = w.kanji !== '-' ? `${w.kanji} (${w.hira})` : w.hira;
        const wrongList = words.filter(x => x.kr !== w.kr)
          .sort(() => Math.random() - 0.5).slice(0, 3)
          .map(x => x.kanji !== '-' ? `${x.kanji} (${x.hira})` : x.hira);
        const options = [
          { text: correctText, isCorrect: true },
          ...wrongList.map(t => ({ text: t, isCorrect: false }))
        ].sort(() => Math.random() - 0.5);

        mockQuestions.push({
          type: '단어',
          q: `다음 한국어 단어의 일본어 표기는? [ ${w.kr} ]`,
          correctText,
          options,
          item: w
        });
      });

      const shuffledSentences = [...sentences].sort(() => Math.random() - 0.5).slice(0, 10);
      shuffledSentences.forEach(s => {
        const distractors = generateSentenceDistractors(s);
        const options = [
          { text: s.ja, isCorrect: true },
          ...distractors
        ].sort(() => Math.random() - 0.5);

        mockQuestions.push({
          type: '단문표현',
          q: `다음 한국어 문장을 일본어로 바르게 옮긴 것은? [ ${s.kr} ]`,
          correctText: s.ja,
          options,
          item: s
        });
      });

      mockQuestions.sort(() => Math.random() - 0.5);
    }

    function renderMockQuestion() {
      if (mockIndex >= mockQuestions.length) {
        showMockResults();
        return;
      }
      const q = mockQuestions[mockIndex];
      document.getElementById('mockProgressBadge').textContent = `문제 ${mockIndex + 1} / ${mockQuestions.length}`;
      document.getElementById('mockTypeBadge').textContent = q.type === '단어' ? '📝 단어 영역' : '📖 단문표현 영역';
      document.getElementById('mockQuestionText').textContent = q.q;

      const optsContainer = document.getElementById('mockOptions');
      optsContainer.innerHTML = '';
      const nextBtn = document.getElementById('mockNextBtn');
      nextBtn.classList.add('hidden');

      q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'mock-opt-btn w-full p-4 text-left rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition font-jp font-semibold text-slate-800 text-base flex items-start space-x-2';
        btn.innerHTML = `<span class="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-sans font-bold text-xs shrink-0">${idx + 1}</span><span>${opt.text}</span>`;

        btn.onclick = () => {
          document.querySelectorAll('.mock-opt-btn').forEach(b => b.disabled = true);
          if (opt.isCorrect) {
            btn.classList.add('border-emerald-500', 'bg-emerald-50', 'text-emerald-900');
            mockScore += 5;
          } else {
            btn.classList.add('border-rose-500', 'bg-rose-50', 'text-rose-900');
            mockWrongItems.push({ q: q.q, correct: q.correctText, user: opt.text });
            document.querySelectorAll('.mock-opt-btn').forEach(b => {
              if (b.innerText.includes(q.correctText)) b.classList.add('border-emerald-500', 'bg-emerald-50');
            });
          }
          nextBtn.classList.remove('hidden');
        };
        optsContainer.appendChild(btn);
      });
    }

    function showMockResults() {
      document.getElementById('mockTesting').classList.add('hidden');
      document.getElementById('mockResult').classList.remove('hidden');

      document.getElementById('mockScoreDisplay').textContent = `${mockScore}점`;
      const comment = document.getElementById('mockScoreComment');
      const emoji = document.getElementById('mockResultEmoji');

      if (mockScore === 100) {
        emoji.textContent = '💯';
        comment.textContent = `완벽합니다! ${lessonLabel()} 시험에서 만점이 확실합니다!`;
      } else if (mockScore >= 80) {
        emoji.textContent = '🎉';
        comment.textContent = '훌륭합니다! 조금만 복습하면 100점입니다!';
      } else {
        emoji.textContent = '💪';
        comment.textContent = '1단계와 2단계를 한 번 더 정주행해 보세요!';
      }

      const wrongList = document.getElementById('mockWrongList');
      wrongList.innerHTML = '';
      if (mockWrongItems.length === 0) {
        wrongList.innerHTML = '<div class="text-emerald-600 font-bold p-3 bg-emerald-50 rounded-xl">틀린 문제가 없습니다! 완벽합니다.</div>';
      } else {
        mockWrongItems.forEach(item => {
          const div = document.createElement('div');
          div.className = 'p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1';
          div.innerHTML = `
            <div class="font-bold text-slate-800">${item.q}</div>
            <div class="text-rose-600 font-jp">내가 고른 오답: ${item.user}</div>
            <div class="text-emerald-700 font-bold font-jp">올바른 정답: ${item.correct}</div>
          `;
          wrongList.appendChild(div);
        });
      }
    }

    // --- Offline File Download Helper ---
    function downloadCurrentHtml() {
      try {
        const htmlStr = document.documentElement.outerHTML;
        const blob = new Blob([htmlStr], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '다이스키_일본어_통합마스터_12_13_14_15과.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('단일 HTML 파일 다운로드가 시작되었습니다!', '💾');
      } catch (e) {
        console.error('Download error:', e);
        showToast('다운로드 처리 중 오류가 발생했습니다.', '❌');
      }
    }

    // --- Wire All DOM Events ---
    window.addEventListener('DOMContentLoaded', () => {
      // Initialize User System
      initUserSystem();

      // Default initial view is Portal!
      loadSavedLearned(currentLesson);
      updateFilteredIndices();
      renderCurrentCard();
      updateLearnedCounter();
      renderWordsGrid();
      renderConjugationLab();
      renderSentencePicker(false);
      renderReadingHomework();
      document.getElementById('grammarContentBox').innerHTML = APP_DATA.grammarHtml;

      // Return to portal home
      document.getElementById('returnHomeBtn').onclick = returnToPortal;

      // Offline Download Buttons

      // User Modal Buttons
      document.getElementById('portalUserBtn').onclick = openUserModal;
      document.getElementById('workspaceUserBtn').onclick = openUserModal;
      document.getElementById('footerUserBtn').onclick = openUserModal;
      document.getElementById('closeUserModalBtn').onclick = closeUserModal;
      document.getElementById('modalLogoutBtn').onclick = logoutUser;

      let isRegisterTab = false;
      const tabLogin = document.getElementById('userTabLogin');
      const tabReg = document.getElementById('userTabRegister');
      const submitBtn = document.getElementById('modalSubmitUserBtn');

      tabLogin.onclick = () => {
        isRegisterTab = false;
        tabLogin.className = 'flex-1 py-2.5 text-center border-b-2 border-indigo-600 text-indigo-600 font-bold';
        tabReg.className = 'flex-1 py-2.5 text-center border-b-2 border-transparent text-slate-400 hover:text-slate-600';
        submitBtn.textContent = '로그인하기';
      };

      tabReg.onclick = () => {
        isRegisterTab = true;
        tabReg.className = 'flex-1 py-2.5 text-center border-b-2 border-indigo-600 text-indigo-600 font-bold';
        tabLogin.className = 'flex-1 py-2.5 text-center border-b-2 border-transparent text-slate-400 hover:text-slate-600';
        submitBtn.textContent = '신규 학생 등록 및 시작';
      };

      submitBtn.onclick = () => handleUserLoginOrRegister(isRegisterTab);

      // Worksheet name input sync
      const sheetNameInput = document.getElementById('studentNameInput');
      if (sheetNameInput) {
        sheetNameInput.oninput = (e) => {
          const val = e.target.value.trim();
          if (val) currentUserName = val;
        };
      }

      // Navigation tab switching
      document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.onclick = () => {
          document.querySelectorAll('.nav-tab').forEach(t => {
            t.classList.remove('active', 'border-indigo-600', 'text-indigo-600');
            t.classList.add('border-transparent', 'text-slate-500');
          });
          tab.classList.add('active', 'border-indigo-600', 'text-indigo-600');
          tab.classList.remove('border-transparent', 'text-slate-500');

          const targetId = tab.dataset.tab;
          document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
          document.getElementById(targetId).classList.remove('hidden');
        };
      });

      // Homework sub-tabs switching
      document.getElementById('hwSubTabReading').onclick = () => {
        document.getElementById('hwSubTabReading').classList.add('bg-white', 'shadow-xs', 'text-emerald-700', 'font-bold');
        document.getElementById('hwSubTabRecording').classList.remove('bg-white', 'shadow-xs', 'text-emerald-700', 'font-bold');
        document.getElementById('hwReadingSection').classList.remove('hidden');
        document.getElementById('hwRecordingSection').classList.add('hidden');
      };

      document.getElementById('hwSubTabRecording').onclick = () => {
        document.getElementById('hwSubTabRecording').classList.add('bg-white', 'shadow-xs', 'text-emerald-700', 'font-bold');
        document.getElementById('hwSubTabReading').classList.remove('bg-white', 'shadow-xs', 'text-emerald-700', 'font-bold');
        document.getElementById('hwRecordingSection').classList.remove('hidden');
        document.getElementById('hwReadingSection').classList.add('hidden');
      };

      // Reading Voice Playback
      // 교재 트랙(reading_passage.audio)이 있으면 원어민 음성, 없으면 TTS. 재생 중 다시 누르면 정지.
      const readingAudio = new Audio();
      document.getElementById('playReadingVoiceBtn').onclick = () => {
        if (!readingPassage || !readingPassage.sentences) return;
        // 본문이 단문 음성 안에 들어 있는 단원(3·4·5과): 단원 음성의 [시작, 끝] 구간을 재생
        if (readingPassage.range && AUDIO_SOURCES[currentLesson] && nativeAudio) {
          if (!nativeAudio.paused) { nativeAudio.pause(); return; }
          if (audioTimer) clearTimeout(audioTimer);
          readingAudio.pause();
          const [start, end] = readingPassage.range;
          nativeAudio.playbackRate = audioPlaybackRate;
          nativeAudio.currentTime = start;
          nativeAudio.play().then(() => {
            audioTimer = setTimeout(() => nativeAudio.pause(), (end - start) / audioPlaybackRate * 1000);
          }).catch(err => console.log('Reading audio blocked:', err));
          return;
        }
        if (readingPassage.audio) {
          const src = new URL(readingPassage.audio, location.href).href;
          if (readingAudio.src === src && !readingAudio.paused) {
            readingAudio.pause();
            return;
          }
          if (nativeAudio) nativeAudio.pause();
          if (readingAudio.src !== src) readingAudio.src = src;
          readingAudio.currentTime = 0;
          readingAudio.playbackRate = audioPlaybackRate;
          readingAudio.play().catch(err => console.log('Reading audio blocked:', err));
          return;
        }
        // 문장마다 정확한 히라가나 읽기로 이어 읽기
        const fullText = readingPassage.sentences.map(s => s.hira || s.ja).join(' ');
        speakTTS(fullText);
      };

      // Print Worksheet Button
      document.getElementById('printWorksheetBtn').onclick = () => {
        window.print();
      };

      // Random 10 Select Button - FIXED: preserves random selection
      document.getElementById('randomSelect10Btn').onclick = () => {
        const allIds = sentences.map(s => s.id);
        selectedRecordingIds = allIds.sort(() => Math.random() - 0.5).slice(0, 10).sort((a,b) => a-b);
        renderSentencePicker(true);
        showToast(`랜덤 10개 문장 선택 완료! (${selectedRecordingIds.join(', ')}번)`, '🎲');
      };

      // Clear Select Button
      document.getElementById('clearSelectBtn').onclick = () => {
        selectedRecordingIds = [];
        renderSentencePicker(true);
        showToast('선택이 초기화되었습니다.', '🧹');
      };

      // Merge Audio Button
      document.getElementById('mergeAudioBtn').onclick = mergeAndSaveRecordings;

      // Flow step switching
      document.querySelectorAll('.flow-step-btn').forEach(btn => {
        btn.onclick = () => {
          document.querySelectorAll('.flow-step-btn').forEach(b => {
            b.classList.remove('active', 'border-indigo-600', 'bg-indigo-50/30');
            b.classList.add('border-slate-200');
          });
          btn.classList.add('active', 'border-indigo-600', 'bg-indigo-50/30');
          btn.classList.remove('border-slate-200');

          currentStep = parseInt(btn.dataset.step);
          document.getElementById('step1-container').classList.toggle('hidden', currentStep !== 1);
          document.getElementById('step2-container').classList.toggle('hidden', currentStep !== 2);
          document.getElementById('step3-container').classList.toggle('hidden', currentStep !== 3);
          document.getElementById('step4-container').classList.toggle('hidden', currentStep !== 4);

          if (currentStep === 1) renderCurrentCard();
          else if (currentStep === 2) renderQuizQuestion();
          else if (currentStep === 3) renderClozeQuestion();
          else if (currentStep === 4) renderWriteQuestion();
        };
      });

      // Part Filter buttons
      document.querySelectorAll('.filter-part-btn').forEach(btn => {
        btn.onclick = () => {
          document.querySelectorAll('.filter-part-btn').forEach(b => {
            b.classList.remove('active', 'bg-white', 'shadow-xs', 'text-slate-800');
            b.classList.add('text-slate-600');
          });
          btn.classList.add('active', 'bg-white', 'shadow-xs', 'text-slate-800');
          btn.classList.remove('text-slate-600');

          currentFilterPart = btn.dataset.part;
          updateFilteredIndices();
          if (currentStep === 1) renderCurrentCard();
          else if (currentStep === 2) renderQuizQuestion();
          else if (currentStep === 3) renderClozeQuestion();
          else if (currentStep === 4) renderWriteQuestion();
          renderJumpGrid();
        };
      });

      // Step 1 controls
      document.getElementById('prevCardBtn').onclick = () => {
        if (currentCardIndex > 0) currentCardIndex--;
        else currentCardIndex = filteredIndices.length - 1;
        renderCurrentCard();
        renderJumpGrid();
      };

      document.getElementById('nextCardBtn').onclick = () => {
        if (currentCardIndex < filteredIndices.length - 1) currentCardIndex++;
        else currentCardIndex = 0;
        renderCurrentCard();
        renderJumpGrid();
      };

      document.getElementById('playAudioBtn').onclick = () => {
        playSentenceAudio(filteredIndices[currentCardIndex]);
      };

      document.getElementById('toggleLearnBtn').onclick = () => {
        const actualIdx = filteredIndices[currentCardIndex];
        const s = sentences[actualIdx];
        if (learnedSentenceIds.has(s.id)) {
          learnedSentenceIds.delete(s.id);
        } else {
          learnedSentenceIds.add(s.id);
        }
        saveLearned();
        renderCurrentCard();
      };

      // Speed buttons
      const speedBtns = [
        { btn: document.getElementById('speed08'), rate: 0.8 },
        { btn: document.getElementById('speed10'), rate: 1.0 },
        { btn: document.getElementById('speed12'), rate: 1.2 }
      ];
      speedBtns.forEach(item => {
        item.btn.onclick = () => {
          audioPlaybackRate = item.rate;
          speedBtns.forEach(x => {
            x.btn.classList.remove('bg-white', 'shadow-xs', 'font-bold', 'text-indigo-600');
            x.btn.classList.add('text-slate-600');
          });
          item.btn.classList.add('bg-white', 'shadow-xs', 'font-bold', 'text-indigo-600');
          item.btn.classList.remove('text-slate-600');
        };
      });

      // Audio test button
      document.getElementById('audioTestBtn').onclick = () => {
        // 원어민 음성이 없는 화면(특강 등)에서는 TTS로 읽으므로, 어떤 일본어 음성이 잡혔는지도 알려준다
        const v = pickJaVoice();
        showToast(v ? `일본어 TTS 음성: ${v.name}` : '일본어 TTS 음성을 찾지 못했습니다 (기기 설정에서 일본어 음성 데이터를 설치하세요)', v ? '🔊' : '⚠️');
        playSentenceAudio(0);
        document.getElementById('audioTestText').textContent = '재생 중...';
        setTimeout(() => {
          document.getElementById('audioTestText').textContent = '음성 테스트';
        }, 3000);
      };

      // Furigana Toggle
      document.getElementById('toggleFurigana').onchange = (e) => {
        document.getElementById('cardJapanese').classList.toggle('hide-furigana', !e.target.checked);
      };

      // Auto play Toggle
      document.getElementById('toggleAutoPlay').onchange = (e) => {
        autoPlayEnabled = e.target.checked;
      };

      // Step 2 Quiz controls
      document.getElementById('quizReplayBtn').onclick = () => {
        playSentenceAudio(filteredIndices[quizCurrentIdx % filteredIndices.length]);
      };
      document.getElementById('quizNextBtn').onclick = () => {
        quizCurrentIdx++;
        renderQuizQuestion();
      };

      // Step 3 Cloze controls
      document.getElementById('clozeReplayBtn').onclick = () => {
        playSentenceAudio(filteredIndices[clozeCurrentIdx % filteredIndices.length]);
      };
      document.getElementById('clozeCheckBtn').onclick = checkClozeAnswer;
      document.getElementById('clozeInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') checkClozeAnswer();
      });
      document.getElementById('clozeHintBtn').onclick = () => {
        const actualIdx = filteredIndices[clozeCurrentIdx % filteredIndices.length];
        const s = sentences[actualIdx];
        const hintEl = document.getElementById('clozeHintText');
        hintEl.classList.remove('hidden');
        hintEl.textContent = `💡 힌트: 정답은 [${s.blankWord}] 입니다.`;
      };
      document.getElementById('clozeGiveUpBtn').onclick = () => {
        const actualIdx = filteredIndices[clozeCurrentIdx % filteredIndices.length];
        const s = sentences[actualIdx];
        document.getElementById('clozeInput').value = s.blankWord;
        checkClozeAnswer();
      };
      document.getElementById('clozeNextBtn').onclick = () => {
        clozeCurrentIdx++;
        renderClozeQuestion();
      };

      // Step 4 Writing controls
      document.getElementById('writeReplayBtn').onclick = () => {
        playSentenceAudio(filteredIndices[writeCurrentIdx % filteredIndices.length]);
      };
      document.getElementById('writeModeBlocksBtn').onclick = () => {
        writeMode = 'blocks';
        document.getElementById('writeModeBlocksBtn').classList.add('bg-white', 'shadow-xs', 'text-indigo-600', 'font-bold');
        document.getElementById('writeModeDirectBtn').classList.remove('bg-white', 'shadow-xs', 'text-indigo-600', 'font-bold');
        document.getElementById('scrambleBlockSection').classList.remove('hidden');
        document.getElementById('directInputSection').classList.add('hidden');
      };
      document.getElementById('writeModeDirectBtn').onclick = () => {
        writeMode = 'direct';
        document.getElementById('writeModeDirectBtn').classList.add('bg-white', 'shadow-xs', 'text-indigo-600', 'font-bold');
        document.getElementById('writeModeBlocksBtn').classList.remove('bg-white', 'shadow-xs', 'text-indigo-600', 'font-bold');
        document.getElementById('scrambleBlockSection').classList.add('hidden');
        document.getElementById('directInputSection').classList.remove('hidden');
      };
      document.getElementById('resetBlocksBtn').onclick = () => {
        const actualIdx = filteredIndices[writeCurrentIdx % filteredIndices.length];
        prepareScrambleBlocks(sentences[actualIdx]);
      };
      document.getElementById('checkBlocksBtn').onclick = checkWriteAnswer;
      document.getElementById('directCheckBtn').onclick = checkWriteAnswer;
      document.getElementById('writeNextBtn').onclick = () => {
        writeCurrentIdx++;
        renderWriteQuestion();
      };

      // Word Modes
      document.getElementById('wordModeCardsBtn').onclick = () => {
        wordMode = 'cards';
        document.getElementById('wordModeCardsBtn').classList.add('bg-white', 'shadow-xs', 'text-indigo-600', 'font-bold');
        document.getElementById('wordModeQuizBtn').classList.remove('bg-white', 'shadow-xs', 'text-indigo-600', 'font-bold');
        document.getElementById('wordCardsContainer').classList.remove('hidden');
        document.getElementById('wordQuizContainer').classList.add('hidden');
      };
      document.getElementById('wordModeQuizBtn').onclick = () => {
        wordMode = 'quiz';
        document.getElementById('wordModeQuizBtn').classList.add('bg-white', 'shadow-xs', 'text-indigo-600', 'font-bold');
        document.getElementById('wordModeCardsBtn').classList.remove('bg-white', 'shadow-xs', 'text-indigo-600', 'font-bold');
        document.getElementById('wordCardsContainer').classList.add('hidden');
        document.getElementById('wordQuizContainer').classList.remove('hidden');
        startWordQuiz();
      };
      document.getElementById('wquizNextBtn').onclick = () => {
        wquizIdx++;
        renderWordQuizQuestion();
      };

      // Mock Test controls
      document.getElementById('startMockBtn').onclick = () => {
        document.getElementById('mockIntro').classList.add('hidden');
        document.getElementById('mockTesting').classList.remove('hidden');
        document.getElementById('mockResult').classList.add('hidden');
        generateMockExam();
        renderMockQuestion();
      };
      document.getElementById('mockNextBtn').onclick = () => {
        mockIndex++;
        renderMockQuestion();
      };
      document.getElementById('mockReplayAudioBtn').onclick = () => {
        const q = mockQuestions[mockIndex];
        if (q && q.type === '단문표현') {
          const idx = sentences.findIndex(s => s.ja === q.correctText);
          if (idx !== -1) playSentenceAudio(idx);
        } else if (q && q.item) {
          speakTTS(q.item.kanji !== '-' ? q.item.kanji : q.item.hira);
        }
      };
      document.getElementById('restartMockBtn').onclick = () => {
        document.getElementById('mockResult').classList.add('hidden');
        document.getElementById('mockIntro').classList.remove('hidden');
      };

      // Conjugation Lab Sub-Modes & Controls
      const conjTableBtn = document.getElementById('conjModeTableBtn');
      const conjQuizBtn = document.getElementById('conjModeQuizBtn');
      const conjWriteBtn = document.getElementById('conjModeWriteBtn');

      function setConjSubMode(mode) {
        conjMode = mode;
        [
          { btn: conjTableBtn, active: mode === 'table' },
          { btn: conjQuizBtn, active: mode === 'quiz' },
          { btn: conjWriteBtn, active: mode === 'write' }
        ].forEach(x => {
          if (!x.btn) return;
          x.btn.classList.toggle('bg-white', x.active);
          x.btn.classList.toggle('shadow-xs', x.active);
          x.btn.classList.toggle('text-indigo-600', x.active);
          x.btn.classList.toggle('font-bold', x.active);
        });
        document.getElementById('conjTableSection').classList.toggle('hidden', mode !== 'table');
        document.getElementById('conjQuizSection').classList.toggle('hidden', mode !== 'quiz');
        document.getElementById('conjWriteSection').classList.toggle('hidden', mode !== 'write');
        if (mode === 'table') renderConjugationTable();
        else if (mode === 'quiz') renderConjugationQuizQuestion();
        else if (mode === 'write') renderConjugationWriteQuestion();
      }

      if (conjTableBtn) conjTableBtn.onclick = () => setConjSubMode('table');
      if (conjQuizBtn) conjQuizBtn.onclick = () => setConjSubMode('quiz');
      if (conjWriteBtn) conjWriteBtn.onclick = () => setConjSubMode('write');

      document.getElementById('cquizSpeakBtn').onclick = () => {
        if (conjQuizPool.length > 0) {
          const q = conjQuizPool[conjQuizIdx % conjQuizPool.length];
          speakTTS(q.baseDict);
        }
      };
      document.getElementById('cquizNextBtn').onclick = () => {
        conjQuizIdx++;
        renderConjugationQuizQuestion();
      };

      document.getElementById('cwriteSpeakBtn').onclick = () => {
        if (conjQuizPool.length > 0) {
          const q = conjQuizPool[conjWriteIdx % conjQuizPool.length];
          speakTTS(q.ja);
        }
      };
      document.getElementById('cwriteCheckBtn').onclick = checkConjugationWriteAnswer;
      document.getElementById('cwriteInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') checkConjugationWriteAnswer();
      });
      document.getElementById('cwriteHintBtn').onclick = () => {
        if (conjQuizPool.length === 0) return;
        const q = conjQuizPool[conjWriteIdx % conjQuizPool.length];
        const box = document.getElementById('cwriteHintBox');
        box.classList.remove('hidden');
        box.textContent = `💡 힌트 (히라가나 첫 글자: ${q.hira.slice(0, 2)}...) | 공식: ${q.rule}`;
      };
      document.getElementById('cwriteGiveUpBtn').onclick = () => {
        if (conjQuizPool.length === 0) return;
        const q = conjQuizPool[conjWriteIdx % conjQuizPool.length];
        document.getElementById('cwriteInput').value = q.ja;
        checkConjugationWriteAnswer();
      };
      document.getElementById('cwriteNextBtn').onclick = () => {
        conjWriteIdx++;
        renderConjugationWriteQuestion();
      };

    });

    // --- 상/하 단원 표기 helpers ---
    function lessonBook(d = APP_DATA) { return d.book || '상'; }
    function lessonLabel(d = APP_DATA, key = currentLesson) {
      if (d.isSpecial) return d.shortLabel;
      return d.label || `${key}과`;
    }

    // --- 하권 단원 카드: data/lessons/h*.js 에 book: "하" 와 card 정보만 넣으면 자동 생성 ---
    function renderBookCards() {
      const box = document.getElementById('bookHaCards');
      if (!box) return;
      box.innerHTML = '';
      Object.entries(LESSONS_DB).filter(([, d]) => d.book === '하').forEach(([key, d]) => {
        const c = d.card || {};
        const accent = d.accent || 'orange';
        const el = document.createElement('div');
        el.className = `bg-white rounded-3xl p-6 border-2 ${isNewSince(d.since) ? 'border-rose-300 ring-4 ring-rose-100' : 'border-slate-200'} hover:border-${accent}-500 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group`;
        const points = (c.points || []).map(p => `<li>• ${p}</li>`).join('');
        const audioTag = d.sentences.some(s => s.audio) ? '🔊 원어민 음성' : '🔈 TTS 음성';
        el.innerHTML = `
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="w-12 h-12 rounded-2xl bg-gradient-to-tr ${d.theme} text-white font-extrabold text-xl flex items-center justify-center shadow-md group-hover:scale-105 transition">${d.lessonNo}</span>
              <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-${accent}-50 text-${accent}-700 border border-${accent}-200">${d.badge}</span>
            </div>
            <div>
              <h3 class="text-xl font-bold text-slate-900 group-hover:text-${accent}-600 transition">제 ${d.lessonNo} 과 <span class="text-sm font-bold text-slate-400">(하)</span>${isNewSince(d.since) ? ' ' + newBadgeHtml('NEW') : ''}</h3>
              <p class="text-xs text-slate-500 mt-1 line-clamp-2 font-jp">${c.summary || d.sample || ''}</p>
            </div>
            <div class="p-3 bg-${accent}-50/50 rounded-2xl border border-${accent}-100 text-xs text-slate-700 space-y-1.5">
              <div class="font-bold text-${accent}-900">💡 핵심 문법 족집게:</div>
              <ul class="space-y-1 text-slate-600 font-jp">${points}</ul>
            </div>
            <div class="flex flex-wrap gap-1.5 text-xs text-slate-500 font-medium">
              <span class="bg-slate-100 px-2.5 py-1 rounded-lg">📖 단문 ${d.sentences.length}문장</span>
              <span class="bg-slate-100 px-2.5 py-1 rounded-lg">📝 단어 ${d.words.length}개</span>
              <span class="bg-slate-100 px-2.5 py-1 rounded-lg">${audioTag}</span>
            </div>
          </div>
          <button class="w-full mt-6 py-3 px-4 rounded-2xl bg-${accent}-600 hover:bg-${accent}-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center space-x-1.5">
            <span>${d.label} 마스터하기 입장</span><span>→</span>
          </button>`;
        el.querySelector('button').onclick = () => openLesson(key);
        box.appendChild(el);
      });
    }
    // --- 업데이트 표시 (data/changelog.js) ---
    // since / updatedIn 이 "마지막으로 확인한 버전"보다 크면 NEW·UPDATE 표시. 처음 방문이면 직전 버전 기준(최신 업데이트만 표시).
    function latestVersion() {
      return (window.CHANGELOG || []).reduce((m, c) => Math.max(m, c.id), 0);
    }
    function seenVersion() {
      try {
        const v = parseInt(localStorage.getItem('daisuki_seen_version'), 10);
        if (!isNaN(v)) return v;
      } catch (e) {}
      return latestVersion() - 1;
    }
    function isNewSince(v) { return !!v && v > seenVersion(); }
    function newBadgeHtml(text) {
      return `<span class="upd-mark inline-block align-middle px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-extrabold tracking-wide">${text}</span>`;
    }
    function lessonIsUpdated(d) { return !!d && (isNewSince(d.since) || isNewSince(d.updatedIn)); }

    function renderUpdateBanner() {
      const box = document.getElementById('updateBanner');
      if (!box) return;
      const seen = seenVersion();
      const fresh = (window.CHANGELOG || []).filter(c => c.id > seen).sort((a, b) => b.id - a.id);
      if (!fresh.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }
      box.className = 'rounded-3xl border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-amber-50 p-5 space-y-3 shadow-sm';
      box.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="font-extrabold text-rose-700 flex items-center gap-2">🆕 새로 업데이트되었어요 <span class="text-xs font-bold text-rose-500">${fresh[0].date}</span></div>
          <button id="updateSeenBtn" class="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition active:scale-95">확인했어요 (표시 끄기)</button>
        </div>
        ${fresh.map(c => `
          <div class="space-y-1">
            <div class="text-sm font-bold text-slate-900">${c.title}</div>
            <ul class="text-xs text-slate-700 space-y-0.5">${c.items.map(i => `<li>• ${i}</li>`).join('')}</ul>
          </div>`).join('')}
        <div class="text-[11px] text-slate-500">빨간 <b>NEW</b> · <b>UPDATE</b> 표시와 활용 연습실의 "🆕 새로 추가된 것" 필터로 바뀐 내용만 골라 볼 수 있습니다.</div>`;
      document.getElementById('updateSeenBtn').onclick = () => {
        try { localStorage.setItem('daisuki_seen_version', String(latestVersion())); } catch (e) {}
        refreshUpdateMarks();
        showToast('업데이트 표시를 껐습니다.', '✅');
      };
    }

    // 특강 카드(정적 HTML)·단원 전환 버튼에 UPDATE / 빨간 점 붙이기
    function markUpdatedButtons() {
      document.querySelectorAll('.upd-dynamic').forEach(el => el.remove());
      Object.entries(LESSONS_DB).forEach(([key, d]) => {
        if (!lessonIsUpdated(d)) return;
        document.querySelectorAll(`.lesson-switch-btn[data-lesson="${key}"]`).forEach(btn => {
          btn.classList.add('relative');
          btn.insertAdjacentHTML('beforeend', '<span class="upd-dynamic absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500"></span>');
        });
        if (d.isSpecial) {
          const btn = document.querySelector(`#lessonPortal button[onclick^="openLesson('${key}'"]`);
          const title = btn && btn.closest('.group') && btn.closest('.group').querySelector('h3');
          if (title) title.insertAdjacentHTML('beforeend', ` <span class="upd-dynamic">${newBadgeHtml(isNewSince(d.since) ? 'NEW' : 'UPDATE')}</span>`);
        }
      });
    }

    function refreshUpdateMarks() {
      renderUpdateBanner();
      renderBookCards();
      markUpdatedButtons();
      if (document.getElementById('conjItemsGrid') && APP_DATA && APP_DATA.conjugationItems) renderConjugationTable();
    }

    refreshUpdateMarks();

    // --- 삼성 인터넷 안내 ---
    // 삼성 인터넷은 웹 TTS를 기기 기본(삼성 한국어) 엔진으로 읽어서 일본어가 한국어 발음으로 섞여 나온다.
    // 웹페이지에서는 엔진을 바꿀 수 없으므로 크롬으로 여는 버튼(안드로이드 intent 링크)을 보여준다.
    function renderBrowserNotice() {
      const box = document.getElementById('browserNotice');
      if (!box || !IS_SAMSUNG_BROWSER) return;
      try { if (localStorage.getItem('daisuki_hide_samsung_notice') === '1') return; } catch (e) {}
      const chromeUrl = `intent://${location.host}${location.pathname}${location.search}#Intent;scheme=https;package=com.android.chrome;end`;
      box.className = 'rounded-3xl border-2 border-amber-300 bg-amber-50 p-4 space-y-2 shadow-sm';
      box.innerHTML = `
        <div class="font-extrabold text-amber-800 text-sm">📱 삼성 인터넷으로 보고 계세요</div>
        <div class="text-xs text-slate-700 leading-relaxed">삼성 인터넷은 단어·활용형 발음(🔊)을 한국어 음성으로 섞어 읽습니다. 원어민 음성이 없는 발음 듣기는 <b>크롬</b>에서 정확하게 나옵니다.</div>
        <div class="flex flex-wrap gap-2">
          <a href="${chromeUrl}" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm">크롬으로 열기</a>
          <button id="hideSamsungNotice" class="px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-800 text-xs font-bold">다시 보지 않기</button>
        </div>`;
      document.getElementById('hideSamsungNotice').onclick = () => {
        try { localStorage.setItem('daisuki_hide_samsung_notice', '1'); } catch (e) {}
        box.className = 'hidden';
        box.innerHTML = '';
      };
    }
    renderBrowserNotice();
