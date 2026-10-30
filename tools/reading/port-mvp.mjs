// 사용: (postcss, postcss-prefix-selector 설치 후) node tools/reading/port-mvp.mjs <Pre_Level_Prototype.html> packages/mr/src
// MVP(Pre_Level_Prototype.html) → 학습앱 모듈 변환: CSS(범위 한정) / 마크업 / 동작 코드
import fs from 'node:fs';
import postcss from 'postcss';
import prefixer from 'postcss-prefix-selector';
const src = process.argv[2], out = process.argv[3];
const L = fs.readFileSync(src, 'utf8').split('\n');
const find = (re, from = 0) => { for (let i = from; i < L.length; i++) if (re.test(L[i])) return i; throw new Error('못 찾음 ' + re); };
const styleOpen = find(/^<style>/), styleClose = find(/^<\/style>/);
const css = L.slice(styleOpen + 1, styleClose).join('\n');
const appOpen = find(/<div class="app" id="appRoot"/), scriptOpen = find(/^<script>/, appOpen), scriptClose = find(/^<\/script>/, scriptOpen);
let markup = L.slice(appOpen, scriptOpen).join('\n');
let js = L.slice(scriptOpen + 1, scriptClose).join('\n');

/* ---------- CSS ---------- */
const NAMES = ['fadeIn', 'bob', 'popWord', 'pulse', 'blink-rec', 'vmFade', 'pop', 'spin', 'fall'];
const res = await postcss([
  prefixer({ prefix: '.mr-root', transform(prefix, sel) {
    if (sel === ':root' || sel === 'html' || sel === 'body' || sel === 'html, body') return prefix;
    if (/^(html|body)\b/.test(sel)) return sel.replace(/^(html|body)\s*/, prefix + ' ');
    if (sel === '*') return prefix + ' *';
    return prefix + ' ' + sel;
  } }),
  { postcssPlugin: 'kf', Once(root) {
    root.walkAtRules('keyframes', (r) => { if (NAMES.includes(r.params)) r.params = 'mr-' + r.params; });
    root.walkDecls(/^animation(-name)?$/, (d) => { d.value = d.value.replace(new RegExp('\\b(' + NAMES.join('|') + ')\\b', 'g'), 'mr-$1'); });
  } },
]).process(css, { from: undefined });
const EXTRA = `
/* 관리자 미리보기: 1280x800 캔버스를 창 크기에 맞춰 줄여 보여 줘서 스크롤이 생기지 않게 한다 */
.mr-root.mr-fit { display: block; padding: 0; min-height: 0; overflow: hidden; }
.mr-root.mr-fit .app { width: 1280px; height: 800px; min-height: 0; border-radius: 0; box-shadow: none; }
/* 1페이지/2페이지 보기 */
.mr-root .view-toggle { display: inline-flex; background: #F1F5F9; border-radius: 999px; padding: 4px; gap: 2px; flex-shrink: 0; }
.mr-root .view-btn { width: 40px; height: 34px; border-radius: 999px; border: none; background: transparent; color: var(--muted); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: background 0.18s, color 0.18s; }
.mr-root .view-btn.active { background: var(--purple); color: #fff; box-shadow: 0 2px 6px rgba(124, 58, 237, 0.35); }
.mr-root .book-frame.two { width: 100%; max-width: 1250px; min-height: 580px; gap: 6px; }
.mr-root .book-frame.two .nav-arrow { width: 48px; height: 48px; margin: 0 -14px; position: relative; z-index: 2; }   /* 화살표를 페이지 가장자리에 살짝 겹쳐 페이지를 최대한 크게 */   /* 1페이지 보기와 같은 높이를 유지해 아래 도구 영역 위치가 안 바뀐다 */
.mr-root .book-frame.two .book-page { flex: 1 1 0; width: auto; min-width: 0; max-width: 580px; }
.mr-root .book-frame.two .page-text { font-size: 27px; padding-left: 38px; }
.mr-root .book-frame.two .page-text.bs3 { font-size: 24px; padding-left: 30px; }
.mr-root .page-nav { width: min(100%, 700px); }
/* 라임 단어: 눌러서 듣는 버튼처럼 보이게(점선 테두리 + 마우스를 올리면 변화) */
.mr-root .rhyme-box > span { padding: 6px 16px; margin: 6px 7px; background: #fff; border: 3px dashed var(--mango); border-radius: 16px; transition: transform 0.15s, background 0.15s, border-color 0.15s, box-shadow 0.15s; user-select: none; }
.mr-root .rhyme-box > span span { margin: 0; }
.mr-root .rhyme-box > span:hover { background: #FFF2C5; border-style: solid; border-color: var(--mango-dark); transform: translateY(-3px) scale(1.08); box-shadow: 0 8px 16px rgba(247, 154, 31, 0.3); }
.mr-root .rhyme-box > span:active { transform: scale(0.95); box-shadow: none; }
/* 상단 '처음부터' 버튼은 작게 */
.mr-root .topbar #btnRestart { padding: 6px 16px; font-size: 13px; border-radius: 999px; }
/* STEP 5 Write: 카드와 글자를 크게 */
.mr-root .trace-wrap .nav-frame { max-width: 1080px; width: 100%; }
.mr-root .trace-card { flex: 1 1 0; min-width: 0; width: min(100%, 900px); padding: 28px 40px 30px; }
.mr-root .trace-target { font-size: 42px; letter-spacing: 1px; margin-bottom: 18px; padding-bottom: 16px; line-height: 1.25; }
.mr-root .word-bank { gap: 14px; margin-bottom: 18px; }
.mr-root .wb-word { font-size: 30px; padding: 5px 22px; border-radius: 14px; line-height: 1.25; }
.mr-root .drop-zone { min-height: 96px; gap: 12px; padding: 14px; }
.mr-root .drop-zone .placed { font-size: 30px; padding: 4px 20px; border-radius: 12px; line-height: 1.25; }
/* STEP 6 Speak: 카드와 문장 글자를 크게 */
.mr-root .speak-wrap .nav-frame { max-width: 1080px; width: 100%; }
.mr-root .speak-card { flex: 1 1 0; min-width: 0; width: min(100%, 900px); padding: 28px 40px 30px; gap: 16px; }
.mr-root .speak-illustration { font-size: 84px; }
.mr-root .speak-target { font-size: 46px; line-height: 1.35; padding: 6px 0; }
.mr-root .speak-target .word { margin: 0 6px; padding: 2px 6px; }
.mr-root .speak-status { font-size: 19px; min-height: 26px; }
.mr-root .speak-recognized { font-size: 18px; min-height: 28px; padding: 8px 14px; }
.mr-root .speak-score { font-size: 42px; min-height: 48px; }
.mr-root .speak-btn { min-width: 124px; padding: 14px 24px; font-size: 18px; }
/* STEP 6 발음 평가: 단어별 점수 색 */
.mr-root .speak-target .word.w-ok { color: #15803D; }
.mr-root .speak-target .word.w-mid { color: #D97706; }
.mr-root .speak-target .word.w-bad { color: #DC2626; }
.mr-root .speak-target .word small { font-size: 0.45em; font-weight: 700; margin-left: 3px; }
/* Key Words 카드: 1·2·3번째 탭에서 크기가 달라지지 않게 높이를 고정 */
.mr-root .keyword-card { height: 380px; min-height: 380px; }
/* 단어 이미지(이모지 대체) */
.mr-root .word-img { display: block; width: auto; object-fit: contain; -webkit-user-drag: none; user-select: none; }
.mr-root .kw-emoji .word-img { height: 170px; max-width: 280px; margin: 0 auto; filter: drop-shadow(0 6px 10px rgba(0,0,0,0.12)); }
.mr-root .kw-emoji.sm .word-img { height: 110px; max-width: 160px; }
.mr-root .cvc-card:has(.word-img) { flex-direction: column; padding: 12px 22px 14px; gap: 4px; }
.mr-root .cvc-card .pic .word-img { height: 92px; max-width: 120px; }
`;
fs.writeFileSync(out + '/mr.css', '/* MVP(Pre_Level_Prototype.html)의 스타일을 .mr-root 안으로 한정한 것. 자동 생성: tools/reading/port-mvp.mjs */\n' + res.css + EXTRA);

/* ---------- 마크업 ---------- */
markup = markup.replace(' style="display:none;">', '>').replace(/src="data:image\/jpeg;base64,[^"]+"/, 'src="/reading/logo.jpg"');
markup = markup.replace('👤 <span id="userChipName">mango01</span> · 로그아웃', '<span id="userChipName">← 학습앱으로</span>').replace('title="로그아웃"', 'title="학습앱으로 돌아가기"');
markup = markup.replace(/<h2>I Can Read This Book!<\/h2>/, '<h2>I Can Read This Book!</h2>');
fs.writeFileSync(out + '/mrMarkup.ts', '// 자동 생성: tools/reading/port-mvp.mjs (MVP 화면 구조 그대로)\nexport const MR_MARKUP = ' + JSON.stringify(markup) + ';\n');

/* ---------- 동작 코드 ---------- */
const must = (name, ok) => { if (!ok) throw new Error('변환 실패: ' + name); };
function cut(startRe, endRe, repl, name) {            // 시작 줄 ~ 끝 줄 직전까지를 repl 로 교체
  const a = js.search(startRe); must(name + ' 시작', a >= 0);
  const rest = js.slice(a); const m = rest.slice(1).search(endRe); must(name + ' 끝', m >= 0);
  js = js.slice(0, a) + repl + '\n' + rest.slice(1 + m);
}
// 1) 책 목록: DB 에서 받은 것
cut(/  const ALL_BOOKS = \[/, /\n  \/\/ bookProgress:/, "  const ALL_BOOKS = ctx.books.map(b => ({ id: b.code, title: b.title, emoji: b.emoji, week: b.week, real: true, status: 'current', coverImg: b.coverUrl, ar: b.ar }));\n", 'ALL_BOOKS');
// 2) 책 내용: DB 에서 받은 것(이미지는 임시 주소로 바꿔서 줌)
cut(/  \/\/ Load book content via dynamic/, /\n  function applyBookData/, "  function loadBook(bookId) { return ctx.loadBook(bookId); }\n", 'loadBook');
// 3) 저장: 진도/영상은 Supabase
cut(/  function loadProgress\(user\) \{/, /\n  function persistProgress/, "  function loadProgress(user) { return ctx.progress; }\n  function saveProgress(user, obj) { }\n", 'loadProgress');
cut(/  function persistProgress\(\) \{/, /\n  \/\/ ----- IndexedDB: recordings -----/, "  function persistProgress() { if (currentBookId) ctx.saveProgress(currentBookId, bookProgress[currentBookId]); }\n", 'persistProgress');
cut(/  async function refreshVideoTakes\(\) \{/, /\n\n  \/\/ ---------- Authentication ----------/, "  async function refreshVideoTakes() { videoTakes = await ctx.listTakes(); }\n", 'refreshVideoTakes');
// 4) 로그인 → 학습앱 로그인을 그대로 사용
cut(/  const ACCOUNTS = \{/, /\n  async function enterApp\(\) \{/, "  function getCurrentUser() { return ctx.userId; }\n  function setCurrentUser() {}\n  function clearCurrentUser() {}\n  function showLoginScreen() {}\n", 'ACCOUNTS');
cut(/  async function enterApp\(\) \{/, /\n  \/\/ Returns the week number/, `  async function enterApp() {
    const chipName = document.getElementById('userChipName');
    if (chipName) chipName.textContent = '← 학습앱으로';
    Object.keys(bookProgress).forEach(k => delete bookProgress[k]);
    ALL_BOOKS.forEach(b => { bookProgress[b.id] = ctx.progress[b.id] || { stepReached: 0, completed: false }; });
    await refreshVideoTakes();
    currentWeek = computeNextWeek();
    showView('home');
  }
`, 'enterApp');
cut(/  function doLogin\(e\) \{/, /\n  \/\/ ---------- Init ----------/, "  function doLogin() { return false; }\n  function doLogout() { ctx.exit(); }\n", 'doLogin');
// 5) 영상 제출: Supabase 에 저장
cut(/  async function videoSubmit\(\) \{/, /\n  \/\/ ---------- STEP 8: CELEBRATE ----------/, `  async function videoSubmit() {
    try {
      if (videoBlob && currentBookId) { await ctx.saveTake(currentBookId, videoBlob); await refreshVideoTakes(); }
    } catch (e) {
      console.warn('videoSubmit save failed', e);
      alert('녹화 저장 중 문제가 발생했어요: ' + (e && e.message ? e.message : e));
    }
    videoStopCamera();
    nextStep();
  }
`, 'videoSubmit');
// 5b) 단어 이미지: 등록된 이미지가 있으면 이모지 대신 보여 준다(없으면 이모지 그대로)
js = js.replace('  function applyBookData(data) {', `  function wimg(word, fallback) {
    const u = ctx.wordImg && ctx.wordImg(word);
    return u ? '<img class="word-img" src="' + u + '" alt="' + String(word).replace(/"/g, '') + '" draggable="false" />' : (fallback || '');
  }
  function applyBookData(data) {`);
must('wimg 정의', js.includes('function wimg('));
const rep = (a, b, name) => { must(name, js.includes(a)); js = js.split(a).join(b); };
rep('<div class="kw-emoji">${k.emoji}</div>', '<div class="kw-emoji">${wimg(k.word, k.emoji)}</div>', 'kw-emoji');
rep('<div class="kw-emoji sm">${k.emoji}</div>', '<div class="kw-emoji sm">${wimg(k.word, k.emoji)}</div>', 'kw-emoji sm');
rep('<span class="pic">${c.pic}</span>${c.word}', '<span class="pic">${wimg(c.word, c.pic)}</span>${c.word}', 'cvc pic');
// 5c) MVP 의 시험용 시드(THE_PIE 진도 0)는 THE_PIE 가 없으면 오류가 나므로 뺀다
js = js.replace("  bookProgress['THE_PIE'].stepReached = 0;\n", '');
must('THE_PIE 시드 제거', !js.includes("bookProgress['THE_PIE']"));
js = js.replace("      renderPage();\n    }\n    if (n === 4) renderQuiz();", "      renderPage();\n      autoPlay(1000);\n    }\n    if (n === 4) renderQuiz();");
must('showStep 자동 재생', js.includes('autoPlay(1000);\n    }\n    if (n === 4)'));
// 5e) 음성: Azure TTS(서버 함수)가 연결돼 있으면 사용하고, 없거나 실패하면 브라우저 음성으로 대신한다
cut(/  \/\/ Single TTS utterance promise/, /\n  \/\/ ---------- STEP 1: PHONICS ----------/, `  // ---- 브라우저 음성(대체용) ----
  function browserUtter(text, rate, opts = {}) {
    return new Promise(resolve => {
      if (!('speechSynthesis' in window) || !text) return resolve();
      const u = new SpeechSynthesisUtterance(normalizeForTTS(text));
      u.lang = 'en-US';
      const v = getFemaleVoice();
      if (v) u.voice = v;
      u.rate = rate;
      u.pitch = 1.15;
      if (opts.onboundary) u.onboundary = opts.onboundary;
      if (opts.onstart)    u.onstart    = opts.onstart;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });
  }

  // ---- Azure TTS ----
  const _azCache = new Map();          // '속도|글' → Promise<blob 주소 | null>
  let _azCur = null;                   // 지금 재생 중인 음원 { a, done }
  const azRate = (r) => Math.max(-35, Math.min(0, Math.round((r - 1) * 55))) + '%';   // 브라우저 속도(0.45~0.9) → Azure 속도
  function azFetch(text, rate) {
    if (!ctx.tts || !text) return Promise.resolve(null);
    const t = normalizeForTTS(text); const key = azRate(rate) + '|' + t;
    if (!_azCache.has(key)) _azCache.set(key, ctx.tts(t, azRate(rate)).then(b => URL.createObjectURL(b)).catch(e => { console.warn('[tts] Azure 실패, 브라우저 음성으로 대신해요:', e && e.message ? e.message : e); _azCache.delete(key); return null; }));
    return _azCache.get(key);
  }
  function stopAzure() {
    if (_azCur) { const c = _azCur; _azCur = null; try { c.a.pause(); } catch (e) {} c.done(); }
  }
  // 단어별 하이라이트 시각: 단어 길이(+문장부호 쉼)에 비례해 음원 길이를 나눈다
  function wordSchedule(text, dur) {
    const ws = text.split(/\\s+/).filter(Boolean);
    const wt = ws.map(w => w.replace(/[^A-Za-z']/g, '').length + 1.2 + (/[.!?]$/.test(w) ? 3 : /[,;:]$/.test(w) ? 1.5 : 0));
    const total = wt.reduce((a, b) => a + b, 0) || 1;
    const speech = Math.max(0.4, dur - 0.55);     // 음원 끝의 쉼(0.45초)을 뺀 말하는 시간
    let acc = 0; return wt.map(w => { const t = 0.08 + speech * (acc / total); acc += w; return t * 1000; });
  }
  function ttsUtter(text, rate, opts = {}) {
    if (!text) return Promise.resolve();
    return azFetch(text, rate).then(url => {
      if (!url) return browserUtter(text, rate, opts);
      return new Promise(resolve => {
        stopAzure();
        const a = new Audio(url); let fin = false; const timers = [];
        const done = () => { if (fin) return; fin = true; timers.forEach(clearTimeout); if (_azCur && _azCur.a === a) _azCur = null; resolve(); };
        _azCur = { a, done };
        a.onended = done; a.onerror = done;
        a.play().then(() => {
          if (fin) return;
          if (opts.onstart) opts.onstart({});
          if (opts.onboundary) {
            const sched = () => wordSchedule(text, isFinite(a.duration) && a.duration > 0 ? a.duration : Math.max(1, text.length / 12))
              .forEach(ms => timers.push(setTimeout(() => { if (!fin) opts.onboundary({ name: 'word' }); }, ms)));
            if (isFinite(a.duration) && a.duration > 0) sched(); else a.onloadedmetadata = sched;
          }
        }).catch(() => { if (fin) return; fin = true; browserUtter(text, rate, opts).then(resolve); });
      });
    });
  }
  // 이 페이지(들)에서 곧 읽을 소리를 미리 받아 둔다 → 재생 시작이 빨라진다
  function warmPage() {
    if (!ctx.tts) return;
    const idxs = pageView === 2 ? [pageIdx, pageIdx + 1] : [pageIdx];
    idxs.forEach(i => {
      const p = pages[i]; if (!p) return;
      const ws = getWords(p.text);
      if (readMode === 'listen') tokenizeForSpeech(ws.join(' ')).forEach(sg => { if (sg.kind !== 'sfx') azFetch(sg.text, 0.45); });
      else { getChunks(p.text).forEach(c => azFetch(c.text.replace(/[.,!?]/g, ''), 0.65)); azFetch(ws.join(' ').replace(/[.,!?]/g, ''), 0.65); }
    });
  }

  // 이 책에서 읽게 될 모든 소리의 (글, 속도) 목록 — 관리자의 '음성 저장'이 미리 만들어 저장하는 데 쓴다.
  // 화면에서 실제로 speak()/ttsUtter 를 부르는 글·속도와 같아야 저장한 소리를 그대로 다시 쓴다.
  function collectTts(d) {
    const out = []; const seen = new Set();
    const add = (t, r) => { t = (t || '').trim(); if (!t) return; const text = normalizeForTTS(t); const rate = azRate(r); const k = rate + '|' + text; if (!seen.has(k)) { seen.add(k); out.push({ text, rate }); } };
    const addSpeak = (t, r) => { if (!t) return; tokenizeForSpeech(t).forEach(sg => { if (sg.kind !== 'sfx') add(sg.text, r); }); };
    const cl = (t) => String(t || '').replace(/[.,!?]/g, '');
    addSpeak(d.title, 0.85);
    ((d.warmup && d.warmup.characters) || []).forEach(c => addSpeak(c.name, 0.85));
    (d.phonics || []).forEach(p => { addSpeak(p.letter, 0.85); (p.cvc || []).forEach(c => addSpeak(c.word, 0.85)); (p.rhyme || []).forEach(w => addSpeak(w, 0.85)); if (p.rhyme) addSpeak(p.rhyme[0] || p.letter, 0.85); });
    (d.keyWords || []).forEach(k => addSpeak(k.word, 0.85));
    (d.pages || []).forEach(pg => {
      const ws = getWords(pg.text); const full = ws.join(' ');
      tokenizeForSpeech(full).forEach(sg => { if (sg.kind !== 'sfx') add(sg.text, 0.45); });   // Listen
      ws.forEach(w => addSpeak(cl(w), 0.9));                                                    // 단어 누르기
      getChunks(pg.text).forEach(c => { addSpeak(cl(c.text), 0.65); addSpeak(cl(c.text), 0.85); });   // Echo
      addSpeak(cl(full), 0.65); addSpeak(cl(full), 0.7);
    });
    (d.traceSentences || []).forEach(t => { addSpeak(t, 0.85); String(t).split(/\s+/).forEach(w => { addSpeak(w, 0.85); addSpeak(cl(w), 0.85); }); });
    (d.speakSentences || []).forEach(s => addSpeak(s.text, 0.85));
    ['Great job!', 'Try again!', 'Try again', 'Hooray! I can read this book!'].forEach(t => addSpeak(t, 0.85));
    return out;
  }

  // Token to track / cancel an in-progress sequential play
  let _speakAbort = null;

  // Top-level speak — handles standalone words and full sentences with SFX
  async function speak(text, rate = 0.85) {
    if (!text) return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    stopAzure();
    const abort = { cancelled: false };
    _speakAbort = abort;
    const segs = tokenizeForSpeech(text);
    for (const seg of segs) {
      if (abort.cancelled) return;
      if (seg.kind === 'sfx') {
        await seg.play();
      } else {
        await ttsUtter(seg.text, rate);
      }
    }
  }

  function cancelSpeak() {
    if (_speakAbort) _speakAbort.cancelled = true;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    stopAzure();
  }
`, 'tts');
// 페이지가 그려질 때 소리를 미리 받아 둔다
// 5g) STEP 6 발음 평가: Azure STT(서버 함수 stt) 연결. 없거나 연속 실패하면 브라우저 음성 인식으로 대신한다
js = js.replace("  function speakRecord() {\n    if (isRecording) {", `  // ----- Azure 발음 평가 -----
  let azRec = null; let azBusy = false; let azSttFails = 0; let azCancelled = false;
  const azureSpeakOk = () => !!(ctx.record && ctx.stt) && azSttFails < 2;
  function speakIdleUi() {
    isRecording = false; azBusy = false; azRec = null;
    const b = document.getElementById('spRecord'); if (b) { b.classList.remove('recording'); b.textContent = '🎤 녹음'; b.disabled = false; }
    const il = document.getElementById('speakIllus'); if (il) il.classList.remove('recording', 'listening');
    const rt = document.getElementById('spRetry'); if (rt) rt.disabled = false;
  }
  // 발음 점수 → 별(0~4). 정확도 60% + 완성도 40%, 유치부 기준으로 후하게 잡는다(70점 이상 '잘했어요')
  function azStars(info, target) {
    const acc = (typeof info.accuracy === 'number') ? info.accuracy : info.pron;
    if (typeof acc !== 'number') return evaluatePronunciation(target, info.text).stars;
    const comp = (typeof info.completeness === 'number') ? info.completeness : 100;
    const v = acc * 0.6 + comp * 0.4;
    return v >= 85 ? 4 : v >= 70 ? 3 : v >= 50 ? 2 : v >= 30 ? 1 : 0;
  }
  // 단어별 정확도를 단어 색으로만 보여 준다(70% 이상 초록, 40~69% 주황, 40% 미만 빨강, 숫자는 표시하지 않음)
  function azMarkWords(info, target) {
    const spans = [...document.querySelectorAll('#speakTarget .word')]; if (!spans.length) return;
    const ws = (info.words || []).filter(x => x.err !== 'Insertion').map(x => ({ w: normalizeWord(x.w), acc: (typeof x.acc === 'number') ? x.acc : (x.err === 'Omission' ? 0 : undefined) }));
    const tw = tokenize(target); const used = new Set(); let worst = null;
    spans.forEach((sp, i) => {
      let acc;
      if (ws.length === tw.length) acc = ws[i].acc;
      else { const j = ws.findIndex((y, k) => !used.has(k) && y.w === tw[i]); if (j >= 0) { used.add(j); acc = ws[j].acc; } else acc = 0; }
      sp.classList.remove('w-ok', 'w-mid', 'w-bad'); const old = sp.querySelector('small'); if (old) old.remove();
      if (typeof acc !== 'number') return;
      sp.classList.add(acc >= 70 ? 'w-ok' : acc >= 40 ? 'w-mid' : 'w-bad');
      if (acc < 70 && (!worst || acc < worst.acc)) worst = { acc, word: sp.textContent.replace(/[.,!?]/g, '') };
    });
    return worst ? worst.word : null;
  }
  function speakRecordAzure() {
    const status = document.getElementById('speakStatus'); const recDiv = document.getElementById('speakRecognized'); const spRecord = document.getElementById('spRecord'); const illus = document.getElementById('speakIllus');
    if (azRec) { try { azRec.stop(); } catch (e) {} return; }      // 녹음 중에 다시 누르면 바로 끝낸다
    if (azBusy) return;
    const item = speakSentences[speakIdx];
    cancelSpeak();                                                // 읽어 주던 소리가 마이크에 들어가지 않게 멈춘다
    azBusy = true; azCancelled = false;
    status.textContent = '🎤 마이크를 켜고 있어요…'; status.className = 'speak-status recording';
    recDiv.textContent = ''; recDiv.classList.remove('show'); document.getElementById('speakScore').innerHTML = '';
    document.querySelectorAll('#speakTarget .word').forEach(e => { e.classList.remove('w-ok', 'w-mid', 'w-bad'); const sm = e.querySelector('small'); if (sm) sm.remove(); });
    spRecord.textContent = '⏹ 중지'; spRecord.classList.add('recording'); illus.classList.add('recording');
    let rec;
    try {
      rec = ctx.record({ onReady: () => { if (azRec === rec) { isRecording = true; status.textContent = '🎤 녹음 중... 또박또박 말해보세요'; } } });
    } catch (e) { speakIdleUi(); status.textContent = '🎤 다시 시도해주세요'; status.className = 'speak-status'; return; }
    azRec = rec;
    rec.result.then(async (wav) => {
      isRecording = false; azRec = null;
      spRecord.disabled = true; spRecord.textContent = '확인 중…'; illus.classList.remove('recording');
      status.textContent = '🔎 확인하고 있어요…'; status.className = 'speak-status';
      try {
        const info = await ctx.stt(wav, item.text);
        azSttFails = 0;
        if (azCancelled) return;
        if (!info || !String(info.text || '').trim()) { speakIdleUi(); status.textContent = '🎤 소리가 안 들렸어요. 다시 해볼까요?'; return; }
        const stars = azStars(info, item.text);
        const worst = azMarkWords(info, item.text);          // 가장 아쉬운 단어 하나를 짚어 준다(없으면 안내 줄을 숨김)
        if (worst) { recDiv.textContent = worst + '를 정확히 발음해 보세요.'; recDiv.classList.add('show'); } else { recDiv.textContent = ''; recDiv.classList.remove('show'); }
        showSpeakScore(stars);
        if (stars >= 3) { status.textContent = '🎉 잘했어요!'; status.className = 'speak-status success'; }
        else { status.textContent = '👍 다시 해볼까요? 빨간 단어를 또박또박 읽어 봐요'; status.className = 'speak-status'; }
        speakIdleUi();
      } catch (e) {
        console.warn('[stt] 실패', e && e.message ? e.message : e);
        azSttFails++; if (azCancelled) return; speakIdleUi();
        status.textContent = azSttFails >= 2 ? '🎤 평가가 잠시 어려워요. 다음부터는 간단히 확인할게요' : '🎤 평가에 문제가 생겼어요. 다시 해볼까요?'; status.className = 'speak-status';
      }
    }).catch((c) => {
      if (azCancelled) return;
      speakIdleUi();
      status.textContent = c === 'denied' ? '🎤 마이크 사용을 허용해 주세요' : (c === 'nospeech' || c === 'silent') ? '🎤 소리가 안 들렸어요. 다시 해볼까요?' : '🎤 다시 시도해주세요';
      status.className = 'speak-status';
    });
  }

  function speakRecord() {
    if (azureSpeakOk()) { speakRecordAzure(); return; }
    speakRecordBrowser();
  }
  function speakRecordBrowser() {
    if (isRecording) {`);
must('speakRecord 교체', js.includes('function speakRecordBrowser()'));
// 단계를 벗어나면 녹음 취소
js = js.replace("    // If leaving STEP 7, release camera/mic", "    if (currentStep === 6 && n !== 6 && azRec) { azCancelled = true; try { azRec.cancel(); } catch (e) {} speakIdleUi(); }\n    // If leaving STEP 7, release camera/mic");
must('step6 이탈 시 취소', js.includes('azCancelled = true; try { azRec.cancel()'));
// 다시 버튼: 단어 색 지우기
js = js.replace("  function speakRetry() {\n", "  function speakRetry() {\n    document.querySelectorAll('#speakTarget .word').forEach(e => { e.classList.remove('w-ok', 'w-mid', 'w-bad'); const sm = e.querySelector('small'); if (sm) sm.remove(); });\n");
// 5d) Read Aloud: 1페이지 보기 / 2페이지 보기(펼침면) 전환
js = js.replace("      if (!abort.cancelled) {\n          clearHighlights();\n          const h = modeHints[readMode];\n          showPrompt(h.msg, h.cls);\n        }\n      };", "      if (!abort.cancelled) {\n          clearHighlights();\n          const h = modeHints[readMode];\n          showPrompt(h.msg, h.cls);\n          if (twoNext()) { activeSide = 1; playActive(); }\n        }\n      };");
must('listen 이어 읽기', js.includes('playActive(); }\n        }\n      };'));
js = js.replace("        playTimer = setTimeout(() => {\n          const h = modeHints[readMode];\n          showPrompt(h.msg, h.cls);\n        }, 3000);\n        return;", "        playTimer = setTimeout(() => {\n          const h = modeHints[readMode];\n          showPrompt(h.msg, h.cls);\n          if (twoNext()) { activeSide = 1; echoNext(0, getWords(pages[readIdx()].text)); }\n        }, 3000);\n        return;");
must('echo 이어 읽기', js.includes('echoNext(0, getWords(pages[readIdx()]'.replace('readIdx()','pageIdx')) || js.includes('activeSide = 1; echoNext'));
// 재생 함수: 시작은 cancel + 왼쪽, 본문은 playActive
js = js.replace("  function playPage() {\n    cancelPlay();\n    const words = getWords(pages[pageIdx].text);", "  function playPage() { cancelPlay(); activeSide = 0; playActive(); }\n  function playActive() {\n    const words = getWords(pages[pageIdx].text);");
must('playActive', js.includes('function playActive()'));
// cancelPlay: 양쪽 페이지의 표시를 모두 지우고 활성 쪽을 왼쪽으로
js = js.replace("    echoExpected = -1;\n    document.querySelectorAll('#pageText .word.expected').forEach(e => e.classList.remove('expected'));\n    document.querySelectorAll('#pageText .word.speaking').forEach(e => e.classList.remove('speaking'));", "    echoExpected = -1; activeSide = 0;\n    document.querySelectorAll('.book-frame .word.expected').forEach(e => e.classList.remove('expected'));\n    document.querySelectorAll('.book-frame .word.speaking').forEach(e => e.classList.remove('speaking'));");
must('cancelPlay', js.includes("activeSide = 0;\n    document.querySelectorAll('.book-frame"));
js = js.replace("document.querySelectorAll('#pageText .word.speaking')\n          .forEach(e => e.classList.remove('speaking'));", "document.querySelectorAll('.book-frame .word.speaking')\n          .forEach(e => e.classList.remove('speaking'));");
// 지금 읽는 쪽(왼쪽/오른쪽)에 맞춰 글·요소를 고른다
js = js.split("pages[pageIdx]").join("pages[readIdx()]");
js = js.split("'#pageText .word").join("T() + ' .word").split("`#pageText .word").join("`${T()} .word");
// renderPage / nextPage / prevPage 교체
cut(/  function renderPage\(\) \{/, /\n  function speakWord\(w, i\) \{/, `  // ----- 1페이지/2페이지 보기 -----
  let pageView = 1;                       // 1 | 2
  try { if (localStorage.getItem('mr_pageview') === '2') pageView = 2; } catch (e) {}
  let activeSide = 0;                     // 지금 읽어 주는 쪽: 0=왼쪽(현재 페이지), 1=오른쪽(다음 페이지)
  const T = () => (activeSide === 1 ? '#pageText2' : '#pageText');
  const readIdx = () => pageIdx + activeSide;
  const twoNext = () => pageView === 2 && activeSide === 0 && pageIdx + 1 < pages.length;
  function onWordTapSide(side, i) {
    if (side === activeSide) { onWordTap(i); return; }
    // 지금 읽는 쪽이 아닌 페이지의 단어: 소리만 들려준다
    const w = getWords(pages[pageIdx + side].text)[i];
    const cleaned = (w || '').replace(/[.,!?]/g, '');
    if (cleaned) speak(cleaned, 0.9);
    const el = document.querySelector((side === 1 ? '#pageText2' : '#pageText') + ' .word[data-i="' + i + '"]');
    if (el) { el.classList.add('speaking'); setTimeout(() => el.classList.remove('speaking'), 500); }
  }
  // 첫 페이지 진입/페이지 넘김 시 바로 읽어 준다(렌더가 끝난 뒤 시작, 그 사이 또 넘기면 앞의 예약은 취소)
  let autoTok = 0;
  function autoPlay(delay = 1000) {
    const tok = ++autoTok;
    setTimeout(() => { if (tok === autoTok && currentView === 'book' && currentStep === 3) playPage(); }, delay);
  }
  function setPageView(n) {
    pageView = n === 2 ? 2 : 1;
    try { localStorage.setItem('mr_pageview', String(pageView)); } catch (e) {}
    renderPage();
  }
  function renderOne(idx, artId, textId, side) {
    const p = pages[idx];
    const ptEl = document.getElementById(textId);
    const artEl = document.getElementById(artId);
    const bookMeta = ALL_BOOKS.find(b => b.id === currentBookId);
    if (bookMeta && bookMeta.week >= 9) ptEl.classList.add('bs3'); else ptEl.classList.remove('bs3');
    const centeredBooks = ['BIG_PIG', 'NAT_THE_CAT', 'TUG_THE_PUP', 'PEN_HEN', 'THE_EGG', 'THE_FIREFLIES', 'THE_SNOWFLAKE'];
    const isFinalIllustPage = (idx === pages.length - 1);
    if (centeredBooks.includes(currentBookId) && !isFinalIllustPage) ptEl.classList.add('centered'); else ptEl.classList.remove('centered');
    [...artEl.children].forEach(c => { if (c !== ptEl) c.remove(); });
    artEl.style.fontSize = ''; artEl.style.display = ''; artEl.style.alignItems = ''; artEl.style.justifyContent = '';
    if (p.img) {
      const img = document.createElement('img'); img.className = 'page-img'; img.src = p.img; img.alt = ''; artEl.insertBefore(img, ptEl);
    } else if (p.art) {
      const span = document.createElement('span'); span.className = 'legacy-art'; span.textContent = p.art; span.style.fontSize = '160px';
      artEl.insertBefore(span, ptEl); artEl.style.display = 'flex'; artEl.style.alignItems = 'center'; artEl.style.justifyContent = 'center';
    }
    const lines = (p.text || '').split('/').map(s => s.trim()).filter(Boolean);
    let wi = 0;
    ptEl.innerHTML = lines.map(line => {
      const wordsHtml = line.split(/\\s+/).filter(Boolean).map(w => {
        const i = wi++;
        const safe = w.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        return '<span class="word" data-i="' + i + '" onclick="onWordTapSide(' + side + ',' + i + ')">' + safe + '</span>';
      }).join(' ');
      return '<div class="text-line">' + wordsHtml + '</div>';
    }).join('');
  }
  function renderPage() {
    cancelPlay();
    if (pageView === 2) pageIdx -= pageIdx % 2;       // 펼침면은 (1,2) (3,4) … 로 묶는다
    const two = pageView === 2;
    const hasRight = two && pageIdx + 1 < pages.length;
    const frame = document.querySelector('.book-frame');
    if (frame) frame.classList.toggle('two', two);
    const p2 = document.getElementById('bookPage2'); if (p2) p2.style.display = hasRight ? '' : 'none';
    renderOne(pageIdx, 'pageArt', 'pageText', 0);
    if (hasRight) renderOne(pageIdx + 1, 'pageArt2', 'pageText2', 1);
    document.getElementById('pageCount').textContent = hasRight ? (pageIdx + 1) + '–' + (pageIdx + 2) + ' / ' + pages.length : (pageIdx + 1) + ' / ' + pages.length;
    const step = two ? 2 : 1;
    const prevBtn = document.getElementById('navPrev'); const nextBtn = document.getElementById('navNext');
    if (prevBtn) prevBtn.disabled = (pageIdx <= 0);
    if (nextBtn) nextBtn.disabled = (pageIdx + step >= pages.length);
    [1, 2].forEach(n => { const b = document.getElementById('pv' + n); if (b) b.classList.toggle('active', pageView === n); });
    const h = modeHints[readMode];
    showPrompt(h.msg, h.cls);
    warmPage();
  }
`, 'renderPage');
cut(/  function nextPage\(\) \{/, /\n  \/\/ ---------- STEP 4: COMPREHENSION QUIZ ----------/, `  function nextPage() {
    const step = pageView === 2 ? 2 : 1;
    if (pageIdx + step < pages.length) { pageIdx += step; renderPage(); autoPlay(); }
    else nextStep();
  }
  function prevPage() {
    const step = pageView === 2 ? 2 : 1;
    if (pageIdx > 0) { pageIdx = Math.max(0, pageIdx - step); renderPage(); autoPlay(); }
  }
`, 'nextPage');
must('selector 정리', !js.includes("'#pageText .word") && !js.includes("`#pageText .word"));
// 마크업: 두 번째 페이지 + 보기 전환 아이콘
markup = markup.replace('<div class="page-text" id="pageText"></div>\n            </div>\n          </div>', '<div class="page-text" id="pageText"></div>\n            </div>\n          </div>\n          <div class="book-page" id="bookPage2" style="display:none;">\n            <div class="page-art" id="pageArt2">\n              <div class="page-text" id="pageText2"></div>\n            </div>\n          </div>');
must('두 번째 페이지 마크업', markup.includes('id="bookPage2"'));
markup = markup.replace('<span class="page-counter" id="pageCount">', `<div class="view-toggle" role="group" aria-label="페이지 보기">
            <button class="view-btn active" id="pv1" onclick="setPageView(1)" title="1페이지 보기" aria-label="1페이지 보기"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="6.5" y="3.5" width="11" height="17" rx="2" fill="none" stroke="currentColor" stroke-width="2"/></svg></button>
            <button class="view-btn" id="pv2" onclick="setPageView(2)" title="2페이지 보기" aria-label="2페이지 보기"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="2.5" y="4.5" width="8.5" height="15" rx="1.8" fill="none" stroke="currentColor" stroke-width="2"/><rect x="13" y="4.5" width="8.5" height="15" rx="1.8" fill="none" stroke="currentColor" stroke-width="2"/></svg></button>
          </div>
          <span class="page-counter" id="pageCount">`);
must('보기 전환 마크업', markup.includes('id="pv2"'));
fs.writeFileSync(out + '/mrMarkup.ts', '// 자동 생성: tools/reading/port-mvp.mjs (MVP 화면 구조 그대로)\nexport const MR_MARKUP = ' + JSON.stringify(markup) + ';\n');
// 5f) 라임 단어는 버튼처럼 보이므로 사이의 가운뎃점은 뺀다
js = js.replace("${p.rhyme.map(renderWord).join(' · ')}", "${p.rhyme.map(renderWord).join(' ')}");
must('라임 단어 구분점', js.includes("p.rhyme.map(renderWord).join(' ')"));
// 6) 배경 이미지 경로
js = js.replace("'assets/bg/study_desk1.png'", "'/reading/bg/study_desk1.png'").replace("'assets/bg/study_desk2.png'", "'/reading/bg/study_desk2.png'");
// 7) 시작: DOMContentLoaded 대신 바로 시작
cut(/  document\.addEventListener\('DOMContentLoaded', \(\) => \{/, /$/, `  applyStageBackground();
  enterApp();
`, 'init');
// 8) 인라인 onclick 이 부르는 함수를 window 로 내보낸다
const names = [...new Set([...js.matchAll(/^  (?:async )?function ([A-Za-z0-9_]+)\(/gm)].map((m) => m[1]))];
const used = new Set([...(markup + js).matchAll(/on(?:click|change|submit|input)="(?:return )?([A-Za-z0-9_]+)\(/g)].map((m) => m[1]));
const missing = [...used].filter((n) => !names.includes(n) && !['event'].includes(n)); if (missing.length) console.warn('내보내지 못하는 호출:', missing);
const body = `// @ts-nocheck
// 자동 생성: tools/reading/port-mvp.mjs — MVP(Pre_Level_Prototype.html)의 동작 코드를 그대로 옮기고, 책·진도·영상·로그인만 학습앱 연결로 바꿈.
export interface MrCtx { userId: string; books: { code: string; title: string; emoji: string | null; week: number; ar: string | null; coverUrl?: string }[]; progress: Record<string, { stepReached: number; completed: boolean }>;
  loadBook: (code: string) => Promise<any>; saveProgress: (code: string, p: { stepReached: number; completed: boolean }) => void;
  listTakes: () => Promise<any[]>; saveTake: (code: string, blob: Blob) => Promise<void>; exit: () => void; record?: (opts?: { onReady?: () => void; onLevel?: (v: number) => void }) => { stop: () => void; cancel: () => void; result: Promise<Blob> }; stt?: (wav: Blob, ref: string) => Promise<{ text: string; display?: string; accuracy?: number; fluency?: number; completeness?: number; pron?: number; words?: { w: string; acc?: number; err?: string }[] }>; tts?: (text: string, rate: string) => Promise<Blob>; wordImg?: (word: string) => string | undefined; }
export function startMr(ctx: MrCtx): () => void {
${js}
  Object.assign(window, { ${names.join(', ')} });
  return () => { azCancelled = true; try { azRec && azRec.cancel(); } catch (e) {} try { cancelPlay(); } catch (e) {} try { videoStopCamera(); } catch (e) {} try { window.speechSynthesis.cancel(); } catch (e) {} videoTakes.forEach(t => { try { URL.revokeObjectURL(t.url); } catch (_) {} }); };
}
`;
fs.writeFileSync(out + '/mrEngine.ts', body);
console.log('ok', names.length, 'functions; handlers used', used.size);
