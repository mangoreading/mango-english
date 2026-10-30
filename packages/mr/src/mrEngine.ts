// @ts-nocheck
// 자동 생성: tools/reading/port-mvp.mjs — MVP(Pre_Level_Prototype.html)의 동작 코드를 그대로 옮기고, 책·진도·영상·로그인만 학습앱 연결로 바꿈.
export interface MrCtx { userId: string; books: { code: string; title: string; emoji: string | null; week: number; ar: string | null; coverUrl?: string }[]; progress: Record<string, { stepReached: number; completed: boolean }>;
  loadBook: (code: string) => Promise<any>; saveProgress: (code: string, p: { stepReached: number; completed: boolean }) => void;
  listTakes: () => Promise<any[]>; saveTake: (code: string, blob: Blob) => Promise<void>; exit: () => void; tts?: (text: string, rate: string) => Promise<Blob>; wordImg?: (word: string) => string | undefined; }
export function startMr(ctx: MrCtx): () => void {
  // ---------- State ----------
  let currentStep = 0;
  const totalSteps = 9;
  let currentView = 'home';     // 'home' | 'status' | 'book'
  let currentBookId = null;     // currently open book (only set when in 'book' view)
  // Default to the week containing the currently-implemented book (THE PIE → Week 4)
  let currentWeek = 1;
  const TOTAL_WEEKS = 11;

  // ---------- Book Data ----------
  // I CAN READ "My Very First" series — Tug the Pup and Friends (33 books, 11 weeks × 3).
  // Only THE_PIE is fully implemented as a learning flow; others are placeholders for now.
  const ALL_BOOKS = ctx.books.map(b => ({ id: b.code, title: b.title, emoji: b.emoji, week: b.week, real: true, status: 'current', coverImg: b.coverUrl, ar: b.ar }));


  // bookProgress: { bookId: { stepReached: 0..8, completed: bool } }
  const bookProgress = {};
  ALL_BOOKS.forEach(b => { bookProgress[b.id] = { stepReached: 0, completed: false }; });
  // Seed dummy progress so the Status page looks alive

  // ---------- Progress Bar (dot row in topbar) ----------
  const progressEl = document.getElementById('progress');
  for (let i = 0; i < totalSteps; i++) {
    const dot = document.createElement('div');
    dot.className = 'step-dot';
    progressEl.appendChild(dot);
  }
  function updateProgress() {
    [...progressEl.children].forEach((d, i) => {
      d.classList.remove('active', 'done');
      if (i < currentStep) d.classList.add('done');
      if (i === currentStep) d.classList.add('active');
    });
  }

  // ---------- View Routing ----------
  function showView(name) {
    // Leaving book view → release camera if needed
    const wasInBook = (currentView === 'book');
    if (wasInBook && name !== 'book') {
      if (currentStep === 7 && typeof videoStopCamera === 'function') {
        try { if (videoRecorder && videoRecorder.state === 'recording') videoRecorder.stop(); } catch (e) {}
        videoStopCamera();
      }
      if (currentStep === 3 && typeof cancelPlay === 'function') cancelPlay();
    }
    // Returning to home from a book → auto-jump to the next book's week
    if (wasInBook && name === 'home' && typeof computeNextWeek === 'function') {
      currentWeek = computeNextWeek();
    }
    currentView = name;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const tgt = document.getElementById('view' + name.charAt(0).toUpperCase() + name.slice(1));
    if (tgt) tgt.classList.add('active');

    // Topbar-right (book chip / progress dots / restart) only in book view
    const showBookCtx = (name === 'book');
    document.getElementById('bookChip').style.display    = showBookCtx ? 'inline-flex' : 'none';
    document.getElementById('progress').style.display    = showBookCtx ? 'flex' : 'none';
    document.getElementById('btnRestart').style.display  = showBookCtx ? 'inline-block' : 'none';
    // User chip — visible on home/status (anywhere except inside a book)
    const userChip = document.getElementById('userChip');
    if (userChip) userChip.style.display = showBookCtx ? 'none' : 'inline-flex';
    // Hide brand logo when in book view — keeps header clean per plan slide 2
    const brand = document.querySelector('.brand');
    if (brand) brand.style.display = showBookCtx ? 'none' : 'flex';

    if (name === 'home')   renderHome();
    if (name === 'status') renderStatus();
  }

  // ---------- Home Page ----------
  function changeWeek(delta) {
    const next = currentWeek + delta;
    if (next < 1 || next > TOTAL_WEEKS) return;
    currentWeek = next;
    renderHome();
  }
  function renderHome() {
    document.getElementById('weekLabel').textContent = 'Week ' + currentWeek;
    document.getElementById('weekPrev').disabled = (currentWeek <= 1);
    document.getElementById('weekNext').disabled = (currentWeek >= TOTAL_WEEKS);

    const grid = document.getElementById('bookGrid');
    const books = ALL_BOOKS.filter(b => b.week === currentWeek);
    grid.innerHTML = books.map(b => {
      const p = bookProgress[b.id] || { stepReached: 0, completed: false };
      const pct = b.real ? Math.round((p.stepReached / (totalSteps - 1)) * 100) : (b.status === 'done' ? 100 : 0);
      let statusKey = 'locked';
      let statusLabel = '준비중';
      if (b.real) {
        if (p.completed) { statusKey = 'done'; statusLabel = '완료'; }
        else if (p.stepReached > 0) { statusKey = 'current'; statusLabel = '학습중'; }
        else { statusKey = 'current'; statusLabel = '시작하기'; }
      }
      const lockedClass = b.real ? '' : 'locked';
      const onClick = b.real ? `openBook('${b.id}')` : `alert('이 책은 곧 오픈될 예정이에요!')`;
      const lockOverlay = b.real ? '' : `<div class="lock-overlay">🔒</div>`;
      // Resolve cover: prefer a real image path, fall back to emoji
      let coverHTML = b.emoji;
      if (b.coverImg) {
        coverHTML = `<img src="${b.coverImg}" alt="${b.title}" />`;
      }
      return `
        <div class="book-card ${lockedClass}" onclick="${onClick}">
          <div class="cover">${coverHTML}</div>
          <div class="book-meta">
            <div class="book-sub">PRE · WEEK ${b.week}</div>
            <div class="book-title">${b.title}</div>
          </div>
          <div class="book-progress-row">
            <div class="book-bar"><span style="width:${pct}%"></span></div>
            <div class="book-pct">${pct}%</div>
          </div>
          <div class="book-status ${statusKey}">${statusLabel}</div>
          ${b.ar ? `<div class="book-ar">AR · ${b.ar}</div>` : ''}
          ${lockOverlay}
        </div>`;
    }).join('');
  }

  // ---------- Per-book content loader ----------
  let currentBookData = null;
  const bookCache = {};

  function loadBook(bookId) { return ctx.loadBook(bookId); }


  function wimg(word, fallback) {
    const u = ctx.wordImg && ctx.wordImg(word);
    return u ? '<img class="word-img" src="' + u + '" alt="' + String(word).replace(/"/g, '') + '" draggable="false" />' : (fallback || '');
  }
  function applyBookData(data) {
    currentBookData = data;

    // Reset per-book runtime indices
    phonicsIdx = 0; keyIdx = 0; tapState = 0;
    pageIdx = 0; readMode = 'listen';
    quizIdx = 0;
    traceIdx = 0; placeSeq = [];
    speakIdx = 0; speakResults = [];

    // Populate data arrays
    phonicsData    = data.phonics || [];
    keyWords       = data.keyWords || [];
    pages          = data.pages || [];
    quizzes        = data.quizzes || [];
    traceSentences = data.traceSentences || [];
    speakSentences = data.speakSentences || [];

    // STEP 0 — warmup hero
    const cover = document.getElementById('welcomePieCover');
    if (cover) {
      cover.src = data.cover || '';
      cover.alt = data.title || '';
    }
    const tEl = document.getElementById('warmupTitle');
    if (tEl) tEl.textContent = (data.warmup && data.warmup.title) || (data.title || '').toUpperCase();
    const lEl = document.getElementById('warmupLead');
    if (lEl) lEl.innerHTML = (data.warmup && data.warmup.lead) || '';
    const cl = document.getElementById('charList');
    if (cl) {
      const chars = (data.warmup && data.warmup.characters) || [];
      cl.innerHTML = chars.map(c => `
        <div class="char-card" onclick="speak('${(c.name || '').replace(/'/g, "\\'")}')">
          <div class="emoji">${c.emoji || ''}</div>
          <div class="c-body">
            <div class="c-name">${c.name || ''} <small>· ${c.tag || ''}</small></div>
            <div class="c-desc">${c.desc || ''}</div>
          </div>
        </div>
      `).join('');
    }
  }

  function speakBookTitle() {
    if (currentBookData && currentBookData.title) speak(currentBookData.title);
  }

  async function openBook(bookId) {
    try {
      currentBookId = bookId;
      const book = ALL_BOOKS.find(b => b.id === bookId);
      const chipTitle = document.getElementById('bookChipTitle');
      if (chipTitle) chipTitle.textContent = (book ? book.title.toUpperCase() : bookId);
      const data = await loadBook(bookId);
      applyBookData(data);
      showView('book');
      showStep(0);
    } catch (err) {
      console.error('[openBook] error', err);
      alert('책을 여는 중 오류가 발생했어요.\n\n' + (err && err.message ? err.message : err) +
            '\n\n자세한 내용은 브라우저 개발자도구(F12) 콘솔을 확인해주세요.');
    }
  }

  // ---------- Learning Status Page ----------
  function renderStatus() {
    const realBooks = ALL_BOOKS.filter(b => b.real);
    const startedBooks = realBooks.filter(b => bookProgress[b.id].stepReached > 0);
    const completedBooks = realBooks.filter(b => bookProgress[b.id].completed);
    const allTakesForCount = (typeof videoTakes !== 'undefined') ? videoTakes : [];
    const booksWithVideo = realBooks.filter(b => allTakesForCount.some(t => t.bookId === b.id)).length;

    const summary = document.getElementById('statusSummary');
    summary.innerHTML = `
      <div class="stat"><div class="num">${startedBooks.length}</div><div class="lbl">학습중인 책</div></div>
      <div class="stat"><div class="num">${completedBooks.length}</div><div class="lbl">완료한 책</div></div>
      <div class="stat"><div class="num">${booksWithVideo}</div><div class="lbl">Portfolio 영상</div></div>
    `;

    const allTakes = (typeof videoTakes !== 'undefined') ? videoTakes : [];
    const list = document.getElementById('statusBookList');
    list.innerHTML = ALL_BOOKS.map(b => {
      const p = bookProgress[b.id] || { stepReached: 0, completed: false };
      const pct = b.real ? Math.round((p.stepReached / (totalSteps - 1)) * 100) : 0;
      // Only the most recent take per book (portfolio = 1 per book)
      const take = allTakes.filter(t => t.bookId === b.id).slice(-1)[0];
      let portfolioHTML;
      if (!b.real) {
        portfolioHTML = `<span class="pf-badge locked">🔒 준비중</span>`;
      } else if (!take) {
        portfolioHTML = `<span class="pf-badge">🎬 녹화 전</span>`;
      } else {
        portfolioHTML = `
          <div class="pf-thumb" data-id="${take.id}" onclick="openVideoModal('${take.id}')" title="클릭하면 크게 보기">
            <video src="${take.url}" playsinline preload="metadata" muted></video>
            <div class="pf-play-overlay">▶</div>
          </div>`;
      }
      return `
        <div class="status-book-row">
          <div class="emoji">${b.emoji}</div>
          <div>
            <div class="name${b.real ? ' clickable' : ''}" ${b.real ? `onclick="openBook('${b.id}')" title="이 책의 학습 화면 열기"` : ''}>${b.title}</div>
            <div class="week">WEEK ${b.week}${b.real ? '' : ' · 준비중'}</div>
          </div>
          <div class="progress-cell">
            <div class="bar"><span style="width:${pct}%"></span></div>
            <div class="pct">${pct}%</div>
          </div>
          <div class="portfolio-cell">${portfolioHTML}</div>
        </div>`;
    }).join('');
  }

  // ---------- Step Navigation ----------
  function showStep(n) {
    // If leaving STEP 3 mid-play, stop audio + timers
    if (currentStep === 3 && n !== 3 && typeof cancelPlay === 'function') {
      cancelPlay();
    }
    // If leaving STEP 7, release camera/mic
    if (currentStep === 7 && n !== 7 && typeof videoStopCamera === 'function') {
      try { if (videoRecorder && videoRecorder.state === 'recording') videoRecorder.stop(); } catch (e) {}
      videoStopCamera();
    }
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.querySelector(`.screen[data-step="${n}"]`);
    if (target) target.classList.add('active');
    currentStep = n;
    updateProgress();
    // Track progress for the active book
    if (currentBookId && bookProgress[currentBookId]) {
      const bp = bookProgress[currentBookId];
      const before = JSON.stringify(bp);
      if (n > bp.stepReached) bp.stepReached = n;
      if (n === totalSteps - 1) bp.completed = true;
      if (JSON.stringify(bp) !== before) persistProgress();
    }
    if (n === 1) { renderPhonicsTabs(); renderPhonics(); }
    if (n === 2) renderKey();
    if (n === 3) {
      // Always default to Listen mode when entering STEP 3
      readMode = 'listen';
      pageIdx = 0;
      document.querySelectorAll('.mode-btn').forEach((b, idx) => {
        if (idx === 0) b.classList.add('active');
        else b.classList.remove('active');
      });
      renderPage();
      autoPlay(1000);
    }
    if (n === 4) renderQuiz();
    if (n === 5) renderTrace();
    if (n === 6) renderSpeak();
    if (n === 7) { renderVideoScript(); }
    if (n === 8) launchConfetti();
  }
  function nextStep() { if (currentStep < totalSteps - 1) showStep(currentStep + 1); }
  function prevStep() { if (currentStep > 0) showStep(currentStep - 1); }
  function goTo(n) { showStep(n); }
  updateProgress();

  // Initial render: home view
  renderHome();

  // ---------- Web Speech API (TTS) ----------
  // Pick the best available English female voice. Voices load asynchronously, so
  // we re-fetch each time. Most browsers offer at least one of: Microsoft Zira/Aria,
  // Google US English (which is female), or Samantha (macOS/iOS).
  function getFemaleVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || !voices.length) return null;
    // Priority list: well-known female en-US voices across Win/Mac/iOS/Android
    const prefer = [
      'Microsoft Zira', 'Microsoft Aria', 'Microsoft Jenny',
      'Google US English',           // Chrome's default en-US is female-sounding
      'Samantha', 'Karen', 'Allison', 'Victoria', 'Susan',
      'female'                       // some browsers expose 'female' in name
    ];
    for (const key of prefer) {
      const v = voices.find(vc => (vc.name || '').toLowerCase().includes(key.toLowerCase()));
      if (v) return v;
    }
    // Fallback: any en-US voice, otherwise any en-* voice
    return voices.find(v => v.lang === 'en-US')
        || voices.find(v => (v.lang || '').startsWith('en'))
        || null;
  }
  // Pre-warm the voice list across platforms.
  // - Chrome/Edge fire 'voiceschanged' once voices are ready.
  // - iOS Safari sometimes doesn't fire the event reliably, so we also poll
  //   for up to ~1 second after load to ensure getVoices() returns a populated list
  //   before the user taps Play.
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => { /* triggers cache refresh */ };
    // Polling fallback for iOS Safari and other browsers that don't fire voiceschanged
    let voicePollAttempts = 0;
    const pollVoices = () => {
      const list = window.speechSynthesis.getVoices();
      if ((list && list.length) || voicePollAttempts++ >= 15) return; // ~1.5s max
      setTimeout(pollVoices, 100);
    };
    pollVoices();
    // Some iOS versions only populate voices after the first speak() call;
    // we'll also pre-trigger an empty utterance in the very first user click handler.
    document.addEventListener('click', function primeTTS() {
      try {
        const warm = new SpeechSynthesisUtterance('');
        warm.volume = 0;
        window.speechSynthesis.speak(warm);
      } catch (_) { /* ignore */ }
      document.removeEventListener('click', primeTTS);
    }, { once: true, capture: true });
  }

  // ===== Onomatopoeia handling =====
  // The Web Speech TTS engine spells out non-dictionary words ("S-H-H-H-H"),
  // so for known sound effects we synthesise the actual sound with the
  // Web Audio API and play it in place of TTS. Sentences containing both
  // SFX and normal words are split into segments and played sequentially.
  //
  // To add a new effect: append `{ regex, play }` where `play()` returns a
  // Promise that resolves when the sound finishes.

  let _audioCtx = null;
  function getAudioCtx() {
    if (!_audioCtx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      _audioCtx = new Ctor();
    }
    if (_audioCtx.state === 'suspended') {
      _audioCtx.resume().catch(() => {});
    }
    return _audioCtx;
  }

  // "Shhh" — filtered noise burst (shushing)
  function playShhSound(durationMs = 700) {
    return new Promise(resolve => {
      const ctx = getAudioCtx();
      if (!ctx) return resolve();
      const dur = durationMs / 1000;
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3500;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';  lp.frequency.value = 8500;
      const g  = ctx.createGain();
      const t0 = ctx.currentTime;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.45, t0 + 0.08);
      g.gain.setValueAtTime(0.45, t0 + dur - 0.12);
      g.gain.linearRampToValueAtTime(0, t0 + dur);
      src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(ctx.destination);
      src.onended = () => resolve();
      src.start();
      src.stop(t0 + dur);
    });
  }

  // "Zzzz" — low-pitched buzzing saw wave with slow tremolo (snoring)
  function playZzzSound(durationMs = 900) {
    return new Promise(resolve => {
      const ctx = getAudioCtx();
      if (!ctx) return resolve();
      const dur = durationMs / 1000;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 95;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 4.5;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 25;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 600;
      const g = ctx.createGain();
      const t0 = ctx.currentTime;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.22, t0 + 0.1);
      g.gain.setValueAtTime(0.22, t0 + dur - 0.15);
      g.gain.linearRampToValueAtTime(0, t0 + dur);
      osc.connect(filter); filter.connect(g); g.connect(ctx.destination);
      osc.onended = () => resolve();
      osc.start(); lfo.start();
      osc.stop(t0 + dur); lfo.stop(t0 + dur);
    });
  }

  // "Mmmm" — warm closed-mouth humming (yum / contentment)
  // We use synthesis instead of TTS because Web Speech engines spell out
  // non-dictionary words like "mmm" letter-by-letter even after lowercasing.
  function playMmmSound(durationMs = 800) {
    return new Promise(resolve => {
      const ctx = getAudioCtx();
      if (!ctx) return resolve();
      const dur = durationMs / 1000;
      // Two close-frequency sine waves blend into a humming voice timbre
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine'; osc1.frequency.value = 220;        // ~A3 warm fundamental
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine'; osc2.frequency.value = 330;        // 5th overtone
      const osc2Gain = ctx.createGain(); osc2Gain.gain.value = 0.35;
      // Gentle vibrato for natural humming character
      const lfo = ctx.createOscillator(); lfo.frequency.value = 5;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 4;
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);
      // Low-pass for closed-mouth nasal quality
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 900;
      const g = ctx.createGain();
      const t0 = ctx.currentTime;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.28, t0 + 0.15);
      g.gain.setValueAtTime(0.28, t0 + dur - 0.2);
      g.gain.linearRampToValueAtTime(0, t0 + dur);
      osc1.connect(filter);
      osc2.connect(osc2Gain); osc2Gain.connect(filter);
      filter.connect(g); g.connect(ctx.destination);
      osc1.onended = () => resolve();
      osc1.start(); osc2.start(); lfo.start();
      osc1.stop(t0 + dur); osc2.stop(t0 + dur); lfo.stop(t0 + dur);
    });
  }

  // "Brrr" — low rumble with fast lip-trill modulation (shivering from cold)
  function playBrrrSound(durationMs = 850) {
    return new Promise(resolve => {
      const ctx = getAudioCtx();
      if (!ctx) return resolve();
      const dur = durationMs / 1000;
      // Low rumble base
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth'; osc.frequency.value = 80;
      // Fast LFO drives a tremolo gain (0..1) for the lip-trill flutter
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 25;
      const lfoDepth = ctx.createGain();
      lfoDepth.gain.value = 0.5;
      const trem = ctx.createGain();
      trem.gain.value = 0.5;        // base 0.5 ± 0.5 → oscillates 0..1
      lfo.connect(lfoDepth);
      lfoDepth.connect(trem.gain);
      // Muffled lip quality
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 800;
      // Master envelope
      const env = ctx.createGain();
      const t0 = ctx.currentTime;
      env.gain.setValueAtTime(0, t0);
      env.gain.linearRampToValueAtTime(0.45, t0 + 0.06);
      env.gain.setValueAtTime(0.45, t0 + dur - 0.12);
      env.gain.linearRampToValueAtTime(0, t0 + dur);
      osc.connect(filter); filter.connect(trem); trem.connect(env); env.connect(ctx.destination);
      osc.onended = () => resolve();
      osc.start(); lfo.start();
      osc.stop(t0 + dur); lfo.stop(t0 + dur);
    });
  }

  // "Buzz" — higher-pitched buzzing (bee-like)
  function playBuzzSound(durationMs = 700) {
    return new Promise(resolve => {
      const ctx = getAudioCtx();
      if (!ctx) return resolve();
      const dur = durationMs / 1000;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth'; osc.frequency.value = 220;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 18;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 40;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      const g = ctx.createGain();
      const t0 = ctx.currentTime;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.18, t0 + 0.05);
      g.gain.setValueAtTime(0.18, t0 + dur - 0.1);
      g.gain.linearRampToValueAtTime(0, t0 + dur);
      osc.connect(g); g.connect(ctx.destination);
      osc.onended = () => resolve();
      osc.start(); lfo.start();
      osc.stop(t0 + dur); lfo.stop(t0 + dur);
    });
  }

  // SFX dictionary — synthesised sound effects for onomatopoeia that TTS
  // engines spell letter-by-letter (non-dictionary words). Includes both
  // environmental sounds and closed-mouth human vocalisations.
  // Match the BARE alphabetic core of a token (no punctuation).
  const SFX_TABLE = [
    { regex: /^z+$/i,       play: playZzzSound  },  // Zzz / Zzzzz (snoring)
    { regex: /^s?h{2,}$/i,  play: playShhSound  },  // Shh / Shhhhh (shushing)
    { regex: /^m{2,}$/i,    play: playMmmSound  },  // Mm / Mmmm (yum hum)
    { regex: /^b+r{2,}$/i,  play: playBrrrSound },  // Brr / Brrrr (shivering)
    { regex: /^b+u+z+$/i,   play: playBuzzSound },  // Buzz / Buzzzz (bee)
  ];

  // TTS-normalisation dictionary — vocalisations that ARE in most TTS
  // dictionaries (real English exclamations). Lowercasing/canonicalising
  // them helps the synthesiser say them naturally instead of inconsistently.
  const TTS_NORMALIZE = [
    [/^a+h+$/i,      'ah'],    // Ah / Ahhh → "ah" (realisation / sigh)
    [/^o+h+$/i,      'oh'],    // Oh / Ohhh → "oh" (surprise)
    [/^w+o+w+$/i,    'wow'],   // Wow / Woww → "wow"
    [/^y+u+m+$/i,    'yum'],   // Yum / Yumm → "yum"
    [/^h+a+h+a+$/i,  'haha'],  // Haha / Hahaha → "haha"
  ];

  function normalizeForTTS(text) {
    if (!text) return text;
    return text.replace(/[A-Za-z']+/g, (word) => {
      for (const [re, repl] of TTS_NORMALIZE) {
        if (re.test(word)) return repl;
      }
      return word;
    });
  }

  function findSfx(word) {
    for (const e of SFX_TABLE) { if (e.regex.test(word)) return e.play; }
    return null;
  }

  // Detect a stutter token like "S-S-Sally", "S-S-S-Snake!", or
  // 'S-S-Snake!"' (with trailing/leading quotes and other punctuation).
  // Pattern: one or more single letters joined by '-', then a final word,
  // where every prefix letter equals the first letter of the final word
  // (case-insensitive). Returns { letter, word, count } or null. The
  // returned `word` preserves any surrounding punctuation/quotes so the
  // rebuilt sentence reads naturally.
  function parseStutterToken(token) {
    if (!token || !token.includes('-')) return null;
    // Peel off leading/trailing chars that aren't letters/apostrophes/dashes
    // (quotes, parentheses, punctuation). These are re-attached to the
    // resulting word so the spoken sentence keeps its shape.
    const leadMatch  = token.match(/^[^-A-Za-z']*/);
    const trailMatch = token.match(/[^-A-Za-z']*$/);
    const lead  = leadMatch  ? leadMatch[0]  : '';
    const trail = trailMatch ? trailMatch[0] : '';
    const body  = token.slice(lead.length, token.length - trail.length);
    if (!body.includes('-')) return null;
    const parts = body.split('-');
    if (parts.length < 2) return null;              // need at least one '-'
    const last = parts.pop();                       // final word candidate
    if (!/^[A-Za-z][A-Za-z']*$/.test(last) || last.length < 2) return null;
    if (parts.length < 1) return null;              // need ≥1 prefix letter
    const first = last[0].toLowerCase();
    for (const p of parts) {
      if (p.length !== 1) return null;              // each prefix is one letter
      if (!/^[A-Za-z]$/.test(p)) return null;
      if (p.toLowerCase() !== first) return null;   // must repeat the same letter
    }
    return { letter: first, word: lead + last + trail, count: parts.length };
  }

  // Split a sentence into ordered segments of TTS text and SFX players.
  // Each segment carries a `wordCount` so the caller can map back to the
  // on-screen word index (used by Step 3 highlighting).
  function tokenizeForSpeech(text) {
    if (!text) return [];
    const tokens = text.split(/\s+/).filter(Boolean);
    const segs = [];
    let buf = [];
    const flush = () => {
      if (buf.length) {
        segs.push({ kind: 'tts', text: buf.join(' '), wordCount: buf.length });
        buf = [];
      }
    };
    for (const tok of tokens) {
      // Stutter pattern (e.g. "S-S-Sally" or "B-b-but") — strip the leading
      // letter repetitions and read only the final word naturally.
      const stutter = parseStutterToken(tok);
      if (stutter) {
        buf.push(stutter.word);
        continue;
      }
      // Regular single-token SFX (Shh, Zzz, Mmm, …)
      const m = tok.match(/^[^A-Za-z']*([A-Za-z']+)[^A-Za-z']*$/);
      const core = m ? m[1] : '';
      const sfx = core ? findSfx(core) : null;
      if (sfx) {
        flush();
        segs.push({ kind: 'sfx', play: sfx, wordCount: 1 });
      } else {
        buf.push(tok);
      }
    }
    flush();
    return segs;
  }

  // ---- 브라우저 음성(대체용) ----
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
    const ws = text.split(/\s+/).filter(Boolean);
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


  // ---------- STEP 1: PHONICS ----------
  let phonicsData = [];
  let phonicsIdx = 0;
  function switchPhonics(i, e) {
    phonicsIdx = i;
    document.querySelectorAll('#phonicsSubChips .sub-chip').forEach((c, idx) => c.classList.toggle('active', idx === i));
    renderPhonics();
  }
  function renderPhonicsTabs() {
    const wrap = document.getElementById('phonicsSubChips');
    if (!wrap) return;
    wrap.innerHTML = (phonicsData || []).map((p, i) => {
      // CVC entries -> "Short i"; rhyme entries -> "-ie 라임"
      const label = p.rhyme ? `${p.letter} 라임` : `Short ${p.letter}`;
      const active = i === phonicsIdx ? ' active' : '';
      return `<div class="sub-chip${active}" onclick="switchPhonics(${i}, event)">${label}</div>`;
    }).join('');
  }
  // Strip the leading dash from a rhyme tag like "-an" or "-ie" so we can match endings
  function _rhymeEnding(letter) {
    return (letter || '').replace(/^[-_]+/, '').toLowerCase();
  }
  function renderPhonics() {
    const p = phonicsData[phonicsIdx];
    if (!p) return;
    const panel = document.getElementById('phonicsPanel');
    if (p.rhyme) {
      // Use the first rhyme word as the headline (by convention this is the book-title-derived word)
      const headline = p.rhyme[0] || p.letter;
      const ending = _rhymeEnding(p.letter);
      const renderWord = (w) => {
        const lw = (w || '').toLowerCase();
        if (ending && lw.endsWith(ending)) {
          const base = w.slice(0, w.length - ending.length);
          const tail = w.slice(w.length - ending.length);
          return `<span onclick="speak('${w}')" style="cursor:pointer">${base}<span class="highlight-ie">${tail}</span></span>`;
        }
        // Fallback (e.g. words that share the rhyme via spelling variants like -y)
        const altIe = lw.endsWith('ie') ? 'ie' : (lw.endsWith('y') ? 'y' : '');
        if (altIe) {
          const base = w.slice(0, w.length - altIe.length);
          return `<span onclick="speak('${w}')" style="cursor:pointer">${base}<span class="highlight-ie">${w.slice(-altIe.length)}</span></span>`;
        }
        return `<span onclick="speak('${w}')" style="cursor:pointer">${w}</span>`;
      };
      panel.innerHTML = `
        <div class="big-letter" style="cursor:pointer" onclick="speak('${headline}')">${headline}</div>
        <div class="sound-hint">${p.hint}</div>
        <div class="rhyme-box">
          ${p.rhyme.map(renderWord).join(' · ')}
        </div>
        <div style="color:var(--muted); font-size:16px">단어를 눌러 소리를 들어보세요!</div>
      `;
    } else {
      panel.innerHTML = `
        <div class="big-letter" onclick="speak('${p.letter}')" style="cursor:pointer">${p.letter.toUpperCase()}${p.letter.toLowerCase()}</div>
        <div class="sound-hint">${p.hint}</div>
        <div class="cvc-row">
          ${(p.cvc || []).map(c => `<div class="cvc-card" onclick="speak('${c.word}')"><span class="pic">${wimg(c.word, c.pic)}</span>${c.word}</div>`).join('')}
        </div>
      `;
    }
  }

  // ---------- STEP 2: KEY WORDS (Content Words) ----------
  let keyWords = [];
  let keyIdx = 0;
  let tapState = 0; // 0: picture only, 1: English word + TTS, 2: Korean meaning + scene
  const tapLabels = ['그림 보고 추측해요', '영어 소리를 들어봐요', '뜻과 이야기를 익혀요'];

  function renderKey() {
    const k = keyWords[keyIdx];
    const card = document.getElementById('keyCard');
    if (tapState === 0) {
      card.innerHTML = `
        <div class="kw-emoji">${wimg(k.word, k.emoji)}</div>
        <div class="kw-hint">이게 뭘까요? (탭!)</div>
      `;
    } else if (tapState === 1) {
      card.innerHTML = `
        <div class="kw-emoji">${wimg(k.word, k.emoji)}</div>
        <div class="kw-word">${k.word}</div>
      `;
      speak(k.word);
    } else {
      card.innerHTML = `
        <div class="kw-row">
          <div class="kw-emoji sm">${wimg(k.word, k.emoji)}</div>
          <div class="kw-text">
            <div class="kw-word" style="font-size:64px">${k.word}</div>
            <div class="kw-kor">${k.kor}</div>
          </div>
        </div>
        <div class="kw-scene">📖 ${k.scene}</div>
      `;
    }
    // Tap indicator dots — done (past) / active (current) / (future = default)
    [0, 1, 2].forEach(i => {
      const el = document.getElementById('td' + i);
      if (!el) return;
      el.classList.remove('done', 'active');
      if (i < tapState) el.classList.add('done');
      else if (i === tapState) el.classList.add('active');
    });
    document.getElementById('tapLabel').textContent = tapLabels[tapState];
    // Dot-style progress indicator (word is "done" after state 2)
    const pg = document.getElementById('keyProgress');
    pg.innerHTML = keyWords.map((_, i) => {
      let cls = 'dot';
      if (i < keyIdx || (i === keyIdx && tapState === 2)) cls += ' done';
      else if (i === keyIdx) cls += ' current';
      return `<div class="${cls}"></div>`;
    }).join('');
    // Side-arrow disabled state
    const prevBtn = document.getElementById('keyPrev');
    const nextBtn = document.getElementById('keyNext');
    if (prevBtn) prevBtn.disabled = (keyIdx <= 0);
    if (nextBtn) nextBtn.disabled = (keyIdx >= keyWords.length - 1);
  }
  function tapKeyCard() {
    if (tapState < 2) {
      tapState++;
      renderKey();
    } else {
      // On 3rd state, tapping the card speaks the word again
      speak(keyWords[keyIdx].word);
    }
  }
  function nextKeyWord() {
    if (keyIdx < keyWords.length - 1) {
      keyIdx++;
      tapState = 0;
      renderKey();
    }
  }
  function prevKeyWord() {
    if (keyIdx > 0) {
      keyIdx--;
      tapState = 0;
      renderKey();
    }
  }

  // ---------- STEP 3: READ THE BOOK ----------
  let pages = [];
  let pageIdx = 0;
  let readMode = 'listen';
  let playTimer = null;       // active timeout id (so we can cancel on mode/page change)
  let echoExpected = -1;      // word index the child is expected to tap (Echo mode)

  const modeHints = {
    listen: { cls: '',     msg: '' },
    echo:   { cls: 'echo', msg: '' },
  };

  function showPrompt(msg, cls) {
    // STEP 3 prompts are intentionally suppressed — leave the bubble empty/hidden.
    const el = document.getElementById('modePrompt');
    if (!el) return;
    el.className = 'mode-prompt';
    el.textContent = '';
  }
  function cancelPlay() {
    if (playTimer) { clearTimeout(playTimer); playTimer = null; }
    if (typeof cancelSpeak === 'function') cancelSpeak();
    else if (window.speechSynthesis) window.speechSynthesis.cancel();
    echoExpected = -1; activeSide = 0;
    document.querySelectorAll('.book-frame .word.expected').forEach(e => e.classList.remove('expected'));
    document.querySelectorAll('.book-frame .word.speaking').forEach(e => e.classList.remove('speaking'));
  }

  function setMode(m, e) {
    cancelPlay();
    readMode = m;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    if (e && e.target) e.target.classList.add('active');
    const h = modeHints[m];
    showPrompt(h.msg, h.cls);
  }

  // Helper: extract flat word array (ignores '/' line markers)
  function getWords(text) {
    return (text || '').split('/').join(' ').split(/\s+/).filter(Boolean);
  }

  // Linguistic auto-chunker for echo mode.
  // Builds semantically + prosodically + cognitively meaningful 2–3-word chunks by:
  //   1. Protecting known multi-word proper nouns (character names) — never split them
  //   2. Scoring candidate break points by linguistic features and picking the best:
  //      - Hard break after . ! ? or '/' hints
  //      - Strong break before auxiliary/linking verbs ('is going', 'was by')
  //      - Strong break before prepositional phrases ('by the lake', 'in the mud')
  //      - Strong break before subordinators (that/because/when/who)
  //      - Strong break before conjunctions (and/but/or)
  //      - Strong break before new proper-noun NPs ('glad | Tug was')
  //   3. Hard cap of MAX=3 words per chunk (kindergarten working memory limit)
  //   4. Post-merge of single-word sentence chunks like "Zoom. Zoom. Zoom."
  // Returns: [{start, end, text, wordCount}, ...] where start/end are global word indices.
  // ========================================================================
  //  Constituent-aware sentence chunker for Pre-Level Echo mode.
  //
  //  Goal: split a sentence into chunks a 5-6 year old can repeat after the
  //  narrator. Chunks must respect English sentence structure rather than
  //  being arbitrary 2-3 word slices.
  //
  //  Priority order (highest = strongest constraint):
  //    1. Sticky multi-word names — never split (e.g. "Sally Snake")
  //    2. Noun phrases [Det + Adj* + N(+N)*] — keep whole when possible
  //       e.g. "a talented dancer", "the lost crab", "any rubber bands"
  //    3. Verb phrases [Aux + V] — keep "is going", "will see" together
  //    4. Prepositional phrases [Prep + NP] — keep "with your penny" whole
  //    5. Clause boundaries — break at conjunctions, subordinators, reporting
  //       verbs, sentence endings, slash hints, commas
  //    6. Working-memory cap — prefer 2-3 word chunks (max 4 only when the
  //       chunk is a single atomic constituent)
  //
  //  Algorithm: dynamic programming over all possible segmentations,
  //  minimising a cost function that penalises in-constituent splits and
  //  rewards natural break points.
  //
  //  Returns: [{ start, end, text, wordCount }, …] where start/end are
  //  global word indices (end inclusive).
  // ========================================================================

  function getChunks(text) {
    if (!text) return [];

    // -------- Phase 1: tokenise --------
    const tokens = text.replace(/\s+/g, ' ').trim().split(' ');
    const words = [];
    const slashAfter = {};
    tokens.forEach(t => {
      if (t === '/') {
        if (words.length > 0) slashAfter[words.length - 1] = true;
      } else if (t) {
        words.push(t);
      }
    });
    const N = words.length;
    if (N === 0) return [];

    // -------- Phase 2: word categories --------
    // Protected multi-word character names from all 33 Pre-Level books.
    const NAMES = [
      ['Nat', 'the', 'Cat'], ['Tug', 'the', 'Pup'], ['Peg', 'the', 'Chick'],
      ['Little', 'Blue', 'Farm'], ['Scram', 'the', 'Skunk'],
      ['Big', 'Pig'], ['Pen', 'Hen'], ['Sly', 'Fox'], ['Sally', 'Snake'],
      ['Dotty', 'Duck'], ['Baby', 'Chick'], ['The', 'Barn'], ['The', 'Egg']
    ];

    const DET = new Set([
      'a','an','the','this','that','these','those',
      'my','your','his','her','its','our','their',
      'some','any','no','all','both','every','each','few','many','much',
      'several','another','other'
    ]);
    const PRO = new Set([
      'i','you','he','she','it','we','they',
      'me','him','her','us','them','mine','yours','hers','ours','theirs',
      "i'm","you're","he's","she's","it's","we're","they're","let's",
      "i'll","you'll","he'll","she'll","we'll","they'll","it'll",
      "i've","you've","we've","they've",
      "i'd","you'd","he'd","she'd","we'd","they'd",
      'someone','something','anyone','anything','everyone','everything',
      'nobody','nothing'
    ]);
    const AUX = new Set([
      'is','are','was','were','be','been','being','am',
      'have','has','had','do','does','did',
      'will','would','can','could','shall','should','may','might','must',
      "don't","doesn't","didn't","won't","can't","couldn't","wouldn't",
      "shouldn't","isn't","aren't","wasn't","weren't","hasn't","haven't","hadn't",
      "mustn't","mightn't"
    ]);
    const PREP = new Set([
      'in','on','at','by','with','from','to','into','onto','of','for',
      'about','over','under','between','through','after','before','during',
      'against','near','beside','beyond','around','across','behind','below',
      'above','inside','outside','toward','towards','upon'
    ]);
    const SUBORD = new Set([
      'that','because','when','while','if','although','though',
      'since','where','whom','whose','which','until','unless','as'
    ]);
    const CONJ = new Set(['and','but','or','nor','so','yet']);
    const REPORTING = new Set([
      'said','says','told','asked','answered','replied',
      'shouted','cried','whispered','called','yelled','sighed'
    ]);
    const ADJ = new Set([
      'big','small','tall','short','long','little','large',
      'old','new','young','good','bad','happy','sad','angry',
      'nice','mean','hot','cold','warm','cool','fast','slow',
      'hard','soft','loud','quiet','bright','dark','light','heavy',
      'red','blue','green','yellow','orange','purple','pink',
      'white','black','brown','gray','grey','gold','silver',
      'shiny','sleepy','tired','hungry','thirsty','scared','brave',
      'best','better','worst','worse','next','last','first','second',
      'only','same','different','lost','found','full','empty',
      'right','wrong','easy','round','flat','sharp','sweet','salty'
    ]);
    const ADJ_SUFFIX = /(?:ed|ing|ful|less|ous|able|ible|ive|al|ic|ish)$/i;
    const ADV_SUFFIX = /ly$/i;

    // -------- Phase 3: helpers --------
    // Strip only OUTER punctuation; preserve apostrophes inside contractions
    // ("don't" → "don't", '"Hello,"' → "hello").
    const cleanLow = (w) => (w || '')
      .replace(/^[^A-Za-z']+/, '')
      .replace(/[^A-Za-z']+$/, '')
      .toLowerCase();
    const endsSent  = (w) => /[.!?]['")\]]*$/.test(w || '');
    const endsComma = (w) => /,['")\]]*$/.test(w || '');

    // -------- Phase 4: POS tagging (heuristic) --------
    const pos = new Array(N);
    for (let k = 0; k < N; k++) {
      const w = cleanLow(words[k]);
      if (DET.has(w))            pos[k] = 'DET';
      else if (PRO.has(w))       pos[k] = 'PRO';
      else if (AUX.has(w))       pos[k] = 'AUX';
      else if (PREP.has(w))      pos[k] = 'PREP';
      else if (SUBORD.has(w))    pos[k] = 'SUB';
      else if (CONJ.has(w))      pos[k] = 'CONJ';
      else if (REPORTING.has(w)) pos[k] = 'REP';
      else if (ADJ.has(w))       pos[k] = 'ADJ';
      else if (ADV_SUFFIX.test(w) && w.length > 3) pos[k] = 'ADV';
      else if (ADJ_SUFFIX.test(w) && w.length > 3) pos[k] = 'ADJ';
      else {
        // Capitalised in mid-sentence → likely proper noun
        const orig = (words[k] || '').replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '');
        const prevEndsSent = k > 0 && endsSent(words[k-1]);
        if (k > 0 && /^[A-Z]/.test(orig) && !prevEndsSent) pos[k] = 'PROP';
        else pos[k] = 'N';   // default — noun or verb (can't easily disambiguate)
      }
    }

    // -------- Phase 5: sticky-name spans --------
    const stickyLen = {};   // word idx → length of sticky group starting there
    for (let s = 0; s < N; s++) {
      for (const name of NAMES) {
        if (s + name.length > N) continue;
        const slice = words.slice(s, s + name.length)
          .map(w => w.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, ''));
        if (slice.every((w, j) => w === name[j])) {
          stickyLen[s] = name.length;
          break;
        }
      }
    }
    // Mark every position that lies strictly inside a sticky group.
    const insideSticky = new Array(N).fill(false);
    for (let s = 0; s < N; s++) {
      if (stickyLen[s]) {
        for (let k = s + 1; k < s + stickyLen[s]; k++) insideSticky[k] = true;
      }
    }

    // -------- Phase 6: identify noun phrases --------
    // npEnd[i] = the LAST index of an NP that starts at i (or -1 if i is not
    // an NP head). NP = (Det|Pro|Prop) + (Adj|Adv)* + N (+N)*.
    // A sticky-name span is treated as one NP.
    const npEnd = new Array(N).fill(-1);
    let i = 0;
    while (i < N) {
      if (stickyLen[i]) {
        npEnd[i] = i + stickyLen[i] - 1;
        i = i + stickyLen[i];
        continue;
      }
      const p = pos[i];
      if (p === 'DET') {
        let j = i + 1;
        // adjectives / adverbs / proper-noun modifiers
        while (j < N && (pos[j] === 'ADJ' || pos[j] === 'ADV' || pos[j] === 'PROP') && !stickyLen[j]) j++;
        // head noun(s) — allow compound nouns like "apple pie"
        if (j < N && pos[j] === 'N') {
          while (j + 1 < N && pos[j + 1] === 'N' && !endsSent(words[j]) && !endsComma(words[j])) j++;
          npEnd[i] = j;
          i = j + 1;
          continue;
        }
        // Det without a clear head — single-word NP
        npEnd[i] = i;
        i++;
      } else if (p === 'PRO' || p === 'PROP') {
        // Standalone pronoun / proper noun = single-word NP
        npEnd[i] = i;
        i++;
      } else {
        i++;
      }
    }
    // insideNP[k] = true if k is strictly inside an NP (not at its boundary)
    const insideNP = new Array(N).fill(false);
    for (let s = 0; s < N; s++) {
      if (npEnd[s] > s) {
        for (let k = s + 1; k <= npEnd[s]; k++) insideNP[k] = true;
      }
    }
    // npRightEdge[k] = true if k is the LAST word of an NP (good break point after)
    const npRightEdge = new Array(N).fill(false);
    for (let s = 0; s < N; s++) {
      if (npEnd[s] >= 0) npRightEdge[npEnd[s]] = true;
    }

    // -------- Phase 7: score break points --------
    // breakScore[k] = score for placing a chunk boundary AFTER word k.
    // Higher = more natural place to split.
    const breakScore = new Array(N).fill(0);
    for (let k = 0; k < N - 1; k++) {
      let s = 0;
      const prev = words[k], next = words[k + 1];
      const nextPos = pos[k + 1];

      // Hard cues from punctuation
      if (endsSent(prev))            s += 35;
      if (slashAfter[k])             s += 25;
      if (endsComma(prev))           s += 14;

      // Cues from NEXT word's category — these mark constituent starts
      if (nextPos === 'CONJ')        s += 12;   // start of new clause
      if (nextPos === 'SUB')         s += 12;   // subordinate clause
      if (nextPos === 'REP')         s += 10;   // reporting verb after quote
      if (nextPos === 'PREP')        s += 9;    // start of PP
      if (nextPos === 'AUX')         s += 7;    // start of VP
      if (nextPos === 'DET')         s += 7;    // start of new NP
      if (nextPos === 'PRO')         s += 5;    // pronoun NP
      if (nextPos === 'PROP' && !stickyLen[k + 1] && !insideSticky[k + 1]) s += 4;

      // Bonus: breaking right at the right edge of an NP (Subject | Verb,
      // Object | next constituent) is very natural.
      if (npRightEdge[k] && !endsSent(prev)) s += 6;

      // PENALTIES — discourage breaks inside constituents
      if (insideNP[k + 1])           s -= 18;   // splits an NP (Det | Adj, Adj | N, N | N)
      if (insideSticky[k + 1])       s -= 50;   // splits a sticky name (catastrophic)
      if (pos[k] === 'AUX' && (nextPos === 'N' || nextPos === 'ADV' || nextPos === 'ADJ')) s -= 12;  // splits VP
      if (pos[k] === 'PREP')         s -= 14;   // splits PP (Prep | NP-head)
      if (cleanLow(prev) === 'to' && nextPos === 'N') s -= 10;   // splits infinitive "to V"
      if (pos[k] === 'N' && nextPos === 'N')  s -= 5;            // splits compound noun

      breakScore[k] = s;
    }

    // -------- Phase 8: DP segmentation --------
    // dp[i] = { cost, prev } describing the best chunking of words[0..i-1].
    // We minimise total cost.
    const MAX = 4;   // absolute cap (allow 4 only when chunk is one tight unit)
    function chunkCost(start, end) {
      const size = end - start;
      let c;
      if      (size === 1) c = 9;     // single-word chunks awkward
      else if (size === 2) c = 1;
      else if (size === 3) c = 0;     // ideal
      else                 c = 6;     // 4 words — discouraged
      // Bonus from breaking at a good point at the chunk's right edge
      const b = (end < N) ? breakScore[end - 1] : 30;
      c -= Math.max(0, b) * 0.6;
      // Heavy penalty if we break at a NEGATIVE-scored point (splits a constituent)
      if (end < N && breakScore[end - 1] < 0) c += -breakScore[end - 1] * 0.6;
      // Soften single-word penalty when it's a true sentence-ender (e.g. "disappeared.")
      if (size === 1 && endsSent(words[start])) c -= 4;
      return c;
    }
    function chunkAllowed(start, end) {
      // Disallow chunks that split a sticky group
      // 1) cannot start inside a sticky span
      if (insideSticky[start]) return false;
      // 2) any sticky group beginning inside the chunk must end inside the chunk
      for (let s = start; s < end; s++) {
        if (stickyLen[s] && s + stickyLen[s] > end) return false;
      }
      return true;
    }

    const dp = new Array(N + 1).fill(null);
    dp[0] = { cost: 0, prev: -1 };
    for (let end = 1; end <= N; end++) {
      let best = Infinity, bestPrev = -1;
      const minStart = Math.max(0, end - MAX);
      for (let start = minStart; start < end; start++) {
        if (!dp[start]) continue;
        if (!chunkAllowed(start, end)) continue;
        const total = dp[start].cost + chunkCost(start, end);
        if (total < best) { best = total; bestPrev = start; }
      }
      if (bestPrev >= 0) dp[end] = { cost: best, prev: bestPrev };
    }

    // Safety net: if DP didn't reach the end (shouldn't happen with MAX=4),
    // fall back to a simple greedy split that never breaks sticky names.
    if (!dp[N]) {
      const out = [];
      let p = 0;
      while (p < N) {
        let e = Math.min(N, p + 3);
        // Don't split sticky
        for (let k = p; k < e; k++) {
          if (stickyLen[k] && k + stickyLen[k] > e) { e = k + stickyLen[k]; break; }
        }
        if (e > N) e = N;
        out.push({ start: p, end: e - 1, text: words.slice(p, e).join(' '), wordCount: e - p });
        p = e;
      }
      return out;
    }

    // -------- Phase 9: reconstruct chunks --------
    const chunks = [];
    let q = N;
    while (q > 0) {
      const prev = dp[q].prev;
      const cw = words.slice(prev, q);
      chunks.unshift({
        start: prev,
        end: q - 1,
        text: cw.join(' '),
        wordCount: cw.length
      });
      q = prev;
    }
    return chunks;
  }

  // Echo mode strategy:
  //   ALL weeks (1-11) use chunk-by-chunk echo to train natural English prosody
  //   and phrase-level fluency from the start. The chunker (getChunks) splits
  //   sentences into syntactically meaningful units (2-3 words by default,
  //   single-unit NPs/VPs/PPs preserved).
  //   Kept as a function so future per-book overrides (e.g. "this book uses
  //   word mode") can be added in one place.
  function isChunkMode() {
    return true;
  }

  function getWordChunkIdx(wordIdx, chunks) {
    for (let i = 0; i < chunks.length; i++) {
      if (wordIdx >= chunks[i].start && wordIdx <= chunks[i].end) return i;
    }
    return -1;
  }

  // ----- 1페이지/2페이지 보기 -----
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
  function autoPlay(delay = 400) {
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
      const wordsHtml = line.split(/\s+/).filter(Boolean).map(w => {
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


  function speakWord(w, i) {
    const cleaned = (w || '').replace(/[.,!?]/g, '');
    if (cleaned) speak(cleaned, 0.9);
    const el = document.querySelector(`${T()} .word[data-i="${i}"]`);
    if (el) {
      el.classList.add('speaking');
      setTimeout(() => el.classList.remove('speaking'), 500);
    }
  }

  // Click on a word in the sentence — behavior depends on mode and book level
  function onWordTap(i) {
    const words = getWords(pages[readIdx()].text);

    // Chunk-based echo (applies to all books — see isChunkMode())
    if (readMode === 'echo' && isChunkMode()) {
      const chunks = getChunks(pages[readIdx()].text);
      const tappedChunkIdx = getWordChunkIdx(i, chunks);
      if (tappedChunkIdx === echoExpected && tappedChunkIdx >= 0) {
        // Child repeated the expected chunk → speak full chunk and advance
        const chunk = chunks[tappedChunkIdx];
        const chunkText = chunk.text.replace(/[.,!?]/g, '');
        speak(chunkText, 0.85);
        document.querySelectorAll(T() + ' .word.expected')
          .forEach(e => e.classList.remove('expected'));
        echoExpected = -1;
        playTimer = setTimeout(() => echoNext(tappedChunkIdx + 1, words), 400);
        return;
      }
      // Tap on a non-expected chunk: just speak that word as a hint
      speakWord(words[i], i);
      return;
    }

    // Word-by-word echo for Box Set 1 (week 1-4)
    if (readMode === 'echo' && echoExpected === i) {
      // Child repeated the expected word → advance
      speakWord(words[i], i);
      const el = document.querySelector(`${T()} .word[data-i="${i}"]`);
      if (el) el.classList.remove('expected');
      echoExpected = -1;
      // After child's tap, advance to next word
      playTimer = setTimeout(() => echoNext(i + 1, words), 350);
    } else {
      // Listen/Read/other: just speak the word as help
      speakWord(words[i], i);
    }
  }

  function echoNext(i, words) {
    // Chunk mode (default for all books): 'i' is the chunk index
    if (isChunkMode()) {
      const chunks = getChunks(pages[readIdx()].text);
      if (i >= chunks.length) {
        // All chunks done — read full sentence as wrap-up
        showPrompt('🎉 다 같이 한 번 더 읽어요!', 'cheer');
        const cleanedFull = getWords(pages[readIdx()].text).join(' ').replace(/[.,!?]/g, '');
        speak(cleanedFull, 0.65);
        playTimer = setTimeout(() => {
          const h = modeHints[readMode];
          showPrompt(h.msg, h.cls);
          if (twoNext()) { activeSide = 1; echoNext(0, getWords(pages[readIdx()].text)); }
        }, 3000);
        return;
      }
      // Speak the whole chunk
      const chunk = chunks[i];
      const chunkText = chunk.text.replace(/[.,!?]/g, '');
      speak(chunkText, 0.65);   // slow & clear for the model utterance
      showPrompt(`👉 "${chunkText}" — 따라 말해요!`, 'echo');
      // Mark every word in the chunk as expected
      for (let w = chunk.start; w <= chunk.end; w++) {
        const el = document.querySelector(`${T()} .word[data-i="${w}"]`);
        if (el) el.classList.add('expected');
      }
      echoExpected = i;       // store chunk index
      // Repeat-window: scale wait time with chunk length so kids get enough time
      // to actually say the chunk after hearing it.
      //   ~1.0s for the model speech to play (at rate 0.65)
      //   + ~1.0s per word as the "repeat" window
      const wc = chunk.wordCount;
      const safetyMs = 1000 + wc * 1000;   // 1-word: 2000ms, 2-word: 3000ms, 3-word: 4000ms
      playTimer = setTimeout(() => {
        if (echoExpected === i) {
          document.querySelectorAll(T() + ' .word.expected')
            .forEach(e => e.classList.remove('expected'));
          echoExpected = -1;
          echoNext(i + 1, words);
        }
      }, safetyMs);
      return;
    }

    // Word-by-word mode — kept as a fallback path. Currently unreachable
    // because isChunkMode() returns true for every book; flipping it (or
    // adding a per-book override) re-enables this path without code changes.
    if (i >= words.length) {
      // Whole sentence done — read the full sentence naturally as a wrap-up
      showPrompt('🎉 다 같이 한 번 더 읽어요!', 'cheer');
      const cleanedFull = getWords(pages[readIdx()].text).join(' ').replace(/[.,!?]/g, '');
      speak(cleanedFull, 0.7);
      playTimer = setTimeout(() => {
        const h = modeHints[readMode];
        showPrompt(h.msg, h.cls);
      }, 2800);
      return;
    }
    // Teacher says the word
    speakWord(words[i], i);
    const cleaned = words[i].replace(/[.,!?]/g, '');
    showPrompt(`👉 "${cleaned}" — 따라 말해요!`, 'echo');
    // Mark expected word for child to tap
    echoExpected = i;
    const el = document.querySelector(`${T()} .word[data-i="${i}"]`);
    if (el) el.classList.add('expected');
    // Safety: if child doesn't tap within a while, auto-advance
    playTimer = setTimeout(() => {
      if (echoExpected === i) {
        if (el) el.classList.remove('expected');
        echoExpected = -1;
        echoNext(i + 1, words);
      }
    }, 1800);
  }

  function playPage() { cancelPlay(); activeSide = 0; playActive(); }
  function playActive() {
    const words = getWords(pages[readIdx()].text);

    if (readMode === 'listen') {
      showPrompt('🎧 잘 듣고 따라와봐요', '');
      // SFX-aware sequential play: split the page into TTS and SFX segments
      // and play them in order. Highlight the on-screen word matching the
      // current segment / boundary position.
      if (!('speechSynthesis' in window)) return;
      cancelSpeak();

      const fullText = words.join(' ');
      const segs = tokenizeForSpeech(fullText);
      const rate = 0.45;
      const abort = { cancelled: false };
      _speakAbort = abort;

      const clearHighlights = () => {
        document.querySelectorAll('.book-frame .word.speaking')
          .forEach(e => e.classList.remove('speaking'));
      };
      const highlight = (i) => {
        clearHighlights();
        const el = document.querySelector(`${T()} .word[data-i="${i}"]`);
        if (el) el.classList.add('speaking');
      };

      const playSegments = async () => {
        let globalIdx = 0;
        for (const seg of segs) {
          if (abort.cancelled) return;
          if (seg.kind === 'sfx') {
            highlight(globalIdx);
            await seg.play();
            globalIdx += seg.wordCount;
          } else {
            // TTS segment with per-word highlighting via boundary events
            const segWords = seg.text.split(/\s+/);
            const segStart = globalIdx;
            let boundaryFired = false;
            let segWordIdx = 0;
            let timingTimer = null;

            const onboundary = (ev) => {
              if (ev.name && ev.name !== 'word') return;
              boundaryFired = true;
              if (segWordIdx < segWords.length) {
                highlight(segStart + segWordIdx);
                segWordIdx++;
              }
            };
            const onstart = () => {
              // Fallback: if no boundary events fire within 600ms,
              // estimate timing per word by length.
              timingTimer = setTimeout(() => {
                if (boundaryFired) return;
                const cleanSeg = segWords.map(w => w.replace(/[.,!?]+$/g, ''));
                const charsPerSec = 14 * rate;
                const totalChars = cleanSeg.reduce((a, w) => a + w.length, 0) + cleanSeg.length;
                const totalMs = (totalChars / charsPerSec) * 1000;
                let elapsed = 0;
                cleanSeg.forEach((w, i) => {
                  const slice = Math.max(180, ((w.length + 1) / Math.max(totalChars, 1)) * totalMs);
                  setTimeout(() => { if (!abort.cancelled) highlight(segStart + i); }, elapsed);
                  elapsed += slice;
                });
              }, 600);
            };

            await ttsUtter(seg.text, rate, { onboundary, onstart });
            if (timingTimer) clearTimeout(timingTimer);
            globalIdx += seg.wordCount;
          }
        }
        if (!abort.cancelled) {
          clearHighlights();
          const h = modeHints[readMode];
          showPrompt(h.msg, h.cls);
          if (twoNext()) { activeSide = 1; playActive(); }
        }
      };

      playSegments();
      return;
    }

    if (readMode === 'echo') {
      showPrompt('🔁 선생님을 따라 말해봐요 (단어를 탭!)', 'echo');
      playTimer = setTimeout(() => echoNext(0, words), 500);
      return;
    }

  }

  function nextPage() {
    const step = pageView === 2 ? 2 : 1;
    if (pageIdx + step < pages.length) { pageIdx += step; renderPage(); autoPlay(); }
    else nextStep();
  }
  function prevPage() {
    const step = pageView === 2 ? 2 : 1;
    if (pageIdx > 0) { pageIdx = Math.max(0, pageIdx - step); renderPage(); autoPlay(); }
  }


  // ---------- STEP 4: COMPREHENSION QUIZ ----------
  let quizzes = [];
  let quizIdx = 0;
  function renderQuiz() {
    const q = quizzes[quizIdx];
    document.getElementById('quizQ').innerHTML = '<span class="q-num">Q' + (quizIdx + 1) + '.</span> <span class="q-text">' + q.q + '</span>';
    document.getElementById('quizFeedback').textContent = '';
    document.getElementById('quizFeedback').classList.remove('wrong');
    const opts = document.getElementById('quizOptions');
    opts.innerHTML = q.options.map((o, i) =>
      `<div class="option" onclick="answerQuiz(${i}, ${!!o.correct})">
         <span class="pic">${o.pic}</span>
         <span>${o.label}</span>
       </div>`
    ).join('');
    // Dot-style progress indicator (shared with STEP 2/5/6)
    const qprog = document.getElementById('quizProgress');
    if (qprog) {
      qprog.innerHTML = quizzes.map((_, i) => {
        let cls = 'dot';
        if (i < quizIdx) cls += ' done';
        else if (i === quizIdx) cls += ' current';
        return `<div class="${cls}"></div>`;
      }).join('');
    }
  }
  function answerQuiz(i, correct) {
    const opts = document.querySelectorAll('.option');
    if (correct) {
      opts[i].classList.add('correct');
      document.getElementById('quizFeedback').textContent = '🎉 정답이에요!';
      speak('Great job!');
      setTimeout(() => {
        if (quizIdx < quizzes.length - 1) { quizIdx++; renderQuiz(); }
        else nextStep();
      }, 1200);
    } else {
      opts[i].classList.add('wrong');
      const fb = document.getElementById('quizFeedback');
      fb.textContent = '아쉬워요. 다시 한 번!';
      fb.classList.add('wrong');
      speak('Try again!');
    }
  }

  // ---------- STEP 5: SENTENCE BUILDING ----------
  let traceSentences = [];
  let traceIdx = 0;
  function renderTrace() {
    const s = traceSentences[traceIdx];
    document.getElementById('traceTarget').textContent = s;
    const words = s.split(' ');
    // Shuffle word bank
    const shuffled = [...words].map((w, i) => ({ w, i, r: Math.random() })).sort((a, b) => a.r - b.r);
    document.getElementById('wordBank').innerHTML = shuffled.map(({ w, i }) =>
      `<div class="wb-word" data-i="${i}" onclick="placeWord(this, '${w.replace(/'/g, "\\'")}', ${i})">${w}</div>`
    ).join('');
    document.getElementById('dropZone').innerHTML = '';
    document.getElementById('dropZone').classList.remove('complete');
    // Dot-style progress indicator
    const tprog = document.getElementById('traceProgress');
    if (tprog) {
      tprog.innerHTML = traceSentences.map((_, i) => {
        let cls = 'dot';
        if (i < traceIdx) cls += ' done';
        else if (i === traceIdx) cls += ' current';
        return `<div class="${cls}"></div>`;
      }).join('');
    }
    // Side-arrow disabled state
    const prevBtn = document.getElementById('tracePrev');
    const nextBtn = document.getElementById('traceNext');
    if (prevBtn) prevBtn.disabled = (traceIdx <= 0);
    if (nextBtn) nextBtn.disabled = (traceIdx >= traceSentences.length - 1);
  }
  let placeSeq = [];
  function placeWord(el, w, i) {
    const expected = traceSentences[traceIdx].split(' ')[placeSeq.length];
    if (w !== expected) {
      el.style.background = '#FFCDD2';
      setTimeout(() => el.style.background = '', 500);
      speak('Try again');
      return;
    }
    placeSeq.push(i);
    el.classList.add('used');
    const dz = document.getElementById('dropZone');
    const placed = document.createElement('div');
    placed.className = 'placed';
    placed.textContent = w;
    placed.onclick = () => speak(w);
    dz.appendChild(placed);
    speak(w);
    if (placeSeq.length === traceSentences[traceIdx].split(' ').length) {
      dz.classList.add('complete');
      setTimeout(() => speak(traceSentences[traceIdx]), 400);
    }
  }
  function resetTrace() { placeSeq = []; renderTrace(); }
  function nextTrace() {
    if (traceIdx < traceSentences.length - 1) {
      traceIdx++; placeSeq = []; renderTrace();
    }
  }
  function prevTrace() {
    if (traceIdx > 0) {
      traceIdx--; placeSeq = []; renderTrace();
    }
  }

  // ---------- STEP 6: SPEAK (Listen → Record → Pronunciation Eval) ----------
  let speakSentences = [];
  let speakIdx = 0;
  let speakResults = [];   // {score: 0..3} per sentence
  let isRecording = false;
  let recognizer = null;

  function getRecognizer() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    if (recognizer) return recognizer;
    const r = new SR();
    r.lang = 'en-US';
    r.interimResults = false;
    r.maxAlternatives = 3;
    r.continuous = false;
    recognizer = r;
    return r;
  }

  function normalizeWord(w) {
    return (w || '').toLowerCase().replace(/[^a-z']/g, '');
  }

  function tokenize(s) {
    return (s || '').split(/\s+/).map(normalizeWord).filter(Boolean);
  }

  // Compare what the recognizer heard against the target sentence.
  // Returns:
  //   stars        — 0..4 star rating used for the UI
  //   ratio        — matched / total (0..1)
  //   matchedCount — number of target words that were recognised
  //   total        — number of target words
  //   matchedFlags — per-word boolean array (could be used for highlighting)
  function evaluatePronunciation(target, recognized) {
    const tWords = tokenize(target);
    const rWords = tokenize(recognized);
    if (tWords.length === 0) {
      return { stars: 0, ratio: 0, matchedCount: 0, total: 0, matchedFlags: [] };
    }
    const rSet = new Set(rWords);
    const matchedFlags = tWords.map(w => rSet.has(w));
    const matchedCount = matchedFlags.filter(Boolean).length;
    const total = tWords.length;
    const ratio = matchedCount / total;
    // 4-star scale — tuned for kindergarten learners.
    // ≥3 stars (≥70% words matched) → "잘했어요"
    // ≤2 stars (<70% words matched) → "다시 해볼까요"
    let stars;
    if (ratio >= 0.90)      stars = 4;   // near-perfect       → 잘했어요
    else if (ratio >= 0.70) stars = 3;   // very good          → 잘했어요
    else if (ratio >= 0.40) stars = 2;   // partial            → 다시 해볼까요
    else if (ratio >= 0.20) stars = 1;   // some words         → 다시 해볼까요
    else                    stars = 0;   // try again          → 다시 해볼까요
    return { stars, ratio, matchedCount, total, matchedFlags };
  }

  function renderSpeak() {
    if (speakIdx >= speakSentences.length) speakIdx = 0;
    const item = speakSentences[speakIdx];
    document.getElementById('speakIllus').textContent = item.emoji;
    document.getElementById('speakIllus').className = 'speak-illustration';
    // target sentence with per-word spans
    const tWords = item.text.split(/\s+/);
    document.getElementById('speakTarget').innerHTML =
      tWords.map(w => `<span class="word">${w}</span>`).join(' ');
    document.getElementById('speakStatus').textContent = '🎧 먼저 소리를 들어봐요';
    document.getElementById('speakStatus').className = 'speak-status';
    const rec = document.getElementById('speakRecognized');
    rec.textContent = '';
    rec.className = 'speak-recognized';
    document.getElementById('speakScore').innerHTML = '';
    const spRetry = document.getElementById('spRetry');
    spRetry.disabled = true;
    const spRecord = document.getElementById('spRecord');
    spRecord.disabled = false;
    spRecord.classList.remove('recording');
    spRecord.textContent = '🎤 녹음';
    // progress dots
    const prog = document.getElementById('speakProgress');
    prog.innerHTML = speakSentences.map((_, i) => {
      let cls = 'dot';
      if (i < speakIdx) cls += ' done';
      else if (i === speakIdx) cls += ' current';
      return `<div class="${cls}"></div>`;
    }).join('');
    // Side-arrow disabled state
    const prevBtn = document.getElementById('speakPrev');
    const nextBtn = document.getElementById('speakNext');
    if (prevBtn) prevBtn.disabled = (speakIdx <= 0);
    if (nextBtn) nextBtn.disabled = (speakIdx >= speakSentences.length - 1);
  }

  function speakListen() {
    if (isRecording) return;
    const item = speakSentences[speakIdx];
    const illus = document.getElementById('speakIllus');
    illus.classList.add('listening');
    document.getElementById('speakStatus').textContent = '🎧 잘 들어보세요';
    document.getElementById('speakStatus').className = 'speak-status';
    if ('speechSynthesis' in window) {
      // Sequential play with SFX support (Web Audio synthesises onomatopoeia)
      cancelSpeak();
      speak(item.text, 0.85).then(() => {
        illus.classList.remove('listening');
        const status = document.getElementById('speakStatus');
        if (status && !isRecording) status.textContent = '이제 🎤 녹음 버튼을 눌러 따라 말해봐요';
      });
    } else {
      illus.classList.remove('listening');
    }
  }

  function speakRecord() {
    if (isRecording) {
      // toggle stop
      if (recognizer) {
        try { recognizer.stop(); } catch (e) {}
      }
      return;
    }
    const item = speakSentences[speakIdx];
    const r = getRecognizer();
    const status = document.getElementById('speakStatus');
    const recDiv = document.getElementById('speakRecognized');
    const spRecord = document.getElementById('spRecord');
    const illus = document.getElementById('speakIllus');

    if (!r) {
      // Fallback: no SpeechRecognition support — give 2-star encouragement
      status.textContent = '🎤 (이 브라우저는 자동 평가 미지원) 잘 읽었어요!';
      status.className = 'speak-status success';
      showSpeakScore(3);   // encouragement on the 4-star scale
      document.getElementById('spRetry').disabled = false;
      return;
    }

    isRecording = true;
    spRecord.classList.add('recording');
    spRecord.textContent = '⏹ 중지';
    illus.classList.add('recording');
    status.textContent = '🎤 녹음 중... 또박또박 말해보세요';
    status.className = 'speak-status recording';
    recDiv.textContent = '';
    recDiv.classList.remove('show');

    r.onresult = (event) => {
      let best = '';
      try { best = event.results[0][0].transcript || ''; } catch (e) {}
      recDiv.textContent = `들린 말: "${best}"`;
      recDiv.classList.add('show');
      const evalRes = evaluatePronunciation(item.text, best);
      showSpeakScore(evalRes.stars);
      const { matchedCount, total, stars } = evalRes;
      // ≥3 stars (≥70% words matched) → "잘했어요!"
      if (stars >= 3) {
        status.textContent = `🎉 잘했어요! (${matchedCount}/${total} 단어)`;
        status.className = 'speak-status success';
      } else {
        status.textContent = `👍 다시 해볼까요? (${matchedCount}/${total} 단어)`;
        status.className = 'speak-status';
      }
    };
    r.onerror = () => {
      status.textContent = '🎤 다시 시도해주세요';
      status.className = 'speak-status';
    };
    r.onend = () => {
      isRecording = false;
      spRecord.classList.remove('recording');
      spRecord.textContent = '🎤 녹음';
      illus.classList.remove('recording');
      const retry = document.getElementById('spRetry');
      if (retry) retry.disabled = false;
    };
    try { r.start(); } catch (e) { console.error('speech recognition start failed', e); }
  }

  // Render a 0..4 star rating (4 stars total).
  function showSpeakScore(stars) {
    const el = document.getElementById('speakScore');
    if (!el) return;
    el.innerHTML = '';
    const TOTAL_STARS = 4;
    const filled = Math.max(0, Math.min(TOTAL_STARS, stars | 0));
    for (let i = 0; i < TOTAL_STARS; i++) {
      const s = document.createElement('span');
      s.className = 'star' + (i < filled ? ' filled' : '');
      s.textContent = i < filled ? '⭐' : '☆';
      el.appendChild(s);
    }
  }

  function speakRetry() {
    const recDiv = document.getElementById('speakRecognized');
    if (recDiv) { recDiv.textContent = ''; recDiv.classList.remove('show'); }
    const status = document.getElementById('speakStatus');
    if (status) { status.textContent = '🎤 녹음 버튼을 눌러 따라 말해봐요'; status.className = 'speak-status'; }
    const sc = document.getElementById('speakScore');
    if (sc) sc.innerHTML = '';
    document.getElementById('spRetry').disabled = true;
  }

  function nextSpeak() {
    if (speakIdx < speakSentences.length - 1) {
      speakIdx++;
      renderSpeak();
    } else {
      nextStep();
    }
  }
  function prevSpeak() {
    if (speakIdx > 0) { speakIdx--; renderSpeak(); }
  }

  // ---------- STEP 7: PORTFOLIO (video recording) ----------
  let videoStream = null;
  let videoRecorder = null;
  let videoChunks = [];
  let videoBlob = null;

  // Populate the "읽을 문장" list from the current book's speakSentences /
  // traceSentences. Called by showStep() whenever STEP 7 is entered.
  function renderVideoScript() {
    const list = document.getElementById('videoScript');
    if (!list) return;

    // Prefer speakSentences (objects with text/kor/emoji); fall back to
    // traceSentences (plain strings) for older book data.
    let items = [];
    if (typeof speakSentences !== 'undefined' && speakSentences.length > 0) {
      items = speakSentences.map(s => (typeof s === 'string')
        ? { text: s, kor: '', emoji: '' }
        : { text: s.text || '', kor: s.kor || '', emoji: s.emoji || '' });
    } else if (typeof traceSentences !== 'undefined' && traceSentences.length > 0) {
      items = traceSentences.map(s => ({ text: s, kor: '', emoji: '' }));
    }

    if (items.length === 0) {
      list.innerHTML = '<li style="color:#94A3B8; padding:8px;">(이 책에는 아직 등록된 문장이 없어요)</li>';
      return;
    }

    // Show only the English sentence — no leading number, emoji, or KO gloss.
    list.innerHTML = items.map(it => `<li>${it.text}</li>`).join('');
  }

  function videoStartCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Common cause: opening the HTML via file:// — getUserMedia needs a
      // "secure context" (https:// or http://localhost) on modern browsers.
      const isFile = location.protocol === 'file:';
      alert(isFile
        ? '🔒 카메라 사용을 위해서는 보안 컨텍스트가 필요해요.\n\n' +
          '• 이 HTML 파일을 file:// 로 직접 열면 일부 브라우저가 카메라를 차단합니다.\n' +
          '• 해결법: 폴더에서 간단한 로컬 서버를 실행해 http://localhost 로 열어보세요.\n' +
          '  예) python -m http.server 8000   →   http://localhost:8000/Pre_Level_Prototype.html'
        : '이 브라우저는 카메라 녹화를 지원하지 않아요.');
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        videoStream = stream;
        const v = document.getElementById('videoPreview');
        if (v) {
          v.srcObject = stream;
          v.muted = true;
          v.style.display = '';      // ★ FIX: unhide the <video> element
          v.play().catch(() => {});
        }
        const placeholder = document.getElementById('videoPlaceholder');
        if (placeholder) placeholder.style.display = 'none';
        document.getElementById('vidStart').style.display = 'none';
        document.getElementById('vidRecord').style.display = '';
        // Clear any leftover state from a previous recording
        document.getElementById('vidStop').style.display = 'none';
        document.getElementById('vidReRecord').style.display = 'none';
        document.getElementById('vidSubmit').style.display = 'none';
      })
      .catch(err => {
        console.error('Camera access denied', err);
        const isFile = location.protocol === 'file:';
        const msg = (err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'))
          ? '카메라 접근이 거부되었어요. 브라우저 주소창 옆 자물쇠/카메라 아이콘에서 권한을 허용해주세요.'
          : (err && err.name === 'NotFoundError')
            ? '카메라를 찾을 수 없어요. 기기에 카메라가 연결되어 있는지 확인해주세요.'
            : (isFile
                ? '카메라 연결에 실패했어요. file:// 로 열면 일부 브라우저가 차단합니다. http://localhost 로 다시 시도해보세요.'
                : `카메라 연결에 실패했어요 (${err && err.name || 'Unknown'}). 콘솔을 확인해주세요.`);
        alert(msg);
      });
  }

  // Discard the current take and restart camera preview for a new recording.
  function videoReRecord() {
    videoBlob = null;
    videoChunks = [];
    const v = document.getElementById('videoPreview');
    if (v) {
      // Detach blob src, re-attach live stream
      try { v.pause(); } catch (_) {}
      v.removeAttribute('src');
      v.load();
      v.controls = false;
      v.muted = true;
      if (videoStream) v.srcObject = videoStream;
      v.play().catch(() => {});
    }
    document.getElementById('vidRecord').style.display = '';
    document.getElementById('vidStop').style.display = 'none';
    document.getElementById('vidReRecord').style.display = 'none';
    document.getElementById('vidSubmit').style.display = 'none';
  }

  // Pick the best MediaRecorder MIME type the current browser supports.
  // Chromium prefers webm/vp9 → vp8 → webm; iOS Safari only supports mp4.
  // Returns '' (let the browser default) if nothing in our preference list works.
  function pickRecorderMime() {
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4;codecs=h264,aac',   // iOS Safari 14.5+
      'video/mp4'
    ];
    for (const t of candidates) { if (MediaRecorder.isTypeSupported(t)) return t; }
    return '';
  }
  let videoMimeType = '';   // set when MediaRecorder is created, reused by Blob

  function videoStartRecord() {
    if (!videoStream) return;
    videoChunks = [];
    videoMimeType = pickRecorderMime();
    try {
      videoRecorder = videoMimeType
        ? new MediaRecorder(videoStream, { mimeType: videoMimeType })
        : new MediaRecorder(videoStream);
      // If we didn't preselect a mime, capture whatever the browser chose
      if (!videoMimeType && videoRecorder.mimeType) videoMimeType = videoRecorder.mimeType;
    } catch (e) {
      console.error('MediaRecorder init failed', e);
      alert('이 브라우저는 비디오 녹화를 지원하지 않아요. (iOS Safari는 iOS 14.5 이상이 필요해요)');
      return;
    }
    videoRecorder.ondataavailable = e => { if (e.data && e.data.size) videoChunks.push(e.data); };
    videoRecorder.onstop = () => {
      // Use the actual recorder mime type (webm on Chromium, mp4 on iOS Safari)
      videoBlob = new Blob(videoChunks, { type: videoMimeType || 'video/webm' });
      const v = document.getElementById('videoPreview');
      if (v) {
        v.srcObject = null;
        v.src = URL.createObjectURL(videoBlob);
        v.muted = false;
        v.controls = true;
        v.style.display = '';   // ensure visible during review playback
      }
      document.getElementById('vidStop').style.display = 'none';
      document.getElementById('vidReRecord').style.display = '';   // show re-record option
      document.getElementById('vidSubmit').style.display = '';
    };
    videoRecorder.start();
    document.getElementById('vidRecord').style.display = 'none';
    document.getElementById('vidStop').style.display = '';
  }

  function videoStopRecord() {
    if (videoRecorder && videoRecorder.state === 'recording') {
      try { videoRecorder.stop(); } catch (e) {}
    }
  }

  function videoStopCamera() {
    if (videoStream) {
      videoStream.getTracks().forEach(t => { try { t.stop(); } catch(_) {} });
      videoStream = null;
    }
  }

  async function videoSubmit() {
    try {
      if (videoBlob && currentBookId) { await ctx.saveTake(currentBookId, videoBlob); await refreshVideoTakes(); }
    } catch (e) {
      console.warn('videoSubmit save failed', e);
      alert('녹화 저장 중 문제가 발생했어요: ' + (e && e.message ? e.message : e));
    }
    videoStopCamera();
    nextStep();
  }


  // ---------- STEP 8: CELEBRATE ----------
  function launchConfetti() {
    // Simple confetti burst — kindergarten-friendly visual reward
    const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#C780FA'];
    const container = document.body;
    for (let i = 0; i < 40; i++) {
      const c = document.createElement('div');
      c.style.cssText = `
        position: fixed;
        top: 30%;
        left: 50%;
        width: 8px; height: 14px;
        background: ${colors[i % colors.length]};
        border-radius: 2px;
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
      `;
      container.appendChild(c);
      const dx = (Math.random() - 0.5) * 800;
      const dy = (Math.random() * 400) + 100;
      const rot = (Math.random() - 0.5) * 720;
      c.animate([
        { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot}deg)`, opacity: 0 }
      ], { duration: 1600, easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)' }).onfinish = () => c.remove();
    }
  }

  // ============================================================
  //  Per-account persistent storage
  //  - bookProgress  → localStorage  (key: mr_progress__<account>)
  //  - video blobs   → IndexedDB     (db: mango_reading_pre, store: recordings)
  //  Note: a pure HTML file cannot write files to an arbitrary disk path
  //  for security reasons. Browser storage gives full per-account
  //  persistence; in addition we auto-download each recording with a
  //  structured filename so the user can drop it into recordings/<account>/.
  // ============================================================

  // ----- Storage availability probe -----
  // iOS Safari in Private Browsing mode and similar locked-down environments
  // either throw on every storage call or silently discard writes. We probe
  // each backend once at app load and surface a friendly notice the first
  // time progress would have been lost.
  function probeStorage() {
    const result = { localStorage: false, sessionStorage: false, indexedDB: false };
    try {
      const k = '__mr_probe__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      result.localStorage = true;
    } catch (_) {}
    try {
      const k = '__mr_probe__';
      sessionStorage.setItem(k, '1');
      sessionStorage.removeItem(k);
      result.sessionStorage = true;
    } catch (_) {}
    try {
      // Just checking the API exists — actual open is asynchronous and
      // only fails reliably in Private mode when a transaction runs.
      result.indexedDB = typeof window.indexedDB !== 'undefined';
    } catch (_) {}
    return result;
  }
  let storageProbe = probeStorage();
  let storageWarningShown = false;
  function warnIfStorageDisabled() {
    if (storageWarningShown) return;
    if (storageProbe.localStorage && storageProbe.sessionStorage) return;
    storageWarningShown = true;
    setTimeout(() => {
      alert('⚠️ 브라우저 저장소가 비활성화되어 있어요.\n\n' +
            '• Safari 프라이빗 모드 / 시크릿 모드 / 쿠키 차단 설정에서 자주 발생합니다.\n' +
            '• 학습 진도와 녹화 영상이 새로고침 후 사라질 수 있어요.\n' +
            '• 일반 브라우징 모드로 다시 열어주세요.');
    }, 500);
  }

  // ----- localStorage: book progress -----
  const PROGRESS_KEY_PREFIX = 'mr_progress__';
  function progressKey(user) { return PROGRESS_KEY_PREFIX + user; }
  function loadProgress(user) { return ctx.progress; }
  function saveProgress(user, obj) { }


  function persistProgress() { if (currentBookId) ctx.saveProgress(currentBookId, bookProgress[currentBookId]); }


  // ----- IndexedDB: recordings -----
  const IDB_NAME = 'mango_reading_pre';
  const IDB_STORE = 'recordings';
  let idbPromise = null;
  function openIDB() {
    if (idbPromise) return idbPromise;
    idbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          const store = db.createObjectStore(IDB_STORE, { keyPath: 'id' });
          store.createIndex('account', 'account', { unique: false });
          store.createIndex('account_book', ['account', 'bookId'], { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return idbPromise;
  }
  function idbTx(mode) {
    return openIDB().then(db => db.transaction(IDB_STORE, mode).objectStore(IDB_STORE));
  }
  async function idbPutRecording(rec) {
    const store = await idbTx('readwrite');
    return new Promise((resolve, reject) => {
      const r = store.put(rec);
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    });
  }
  async function idbDeleteRecording(id) {
    const store = await idbTx('readwrite');
    return new Promise((resolve, reject) => {
      const r = store.delete(id);
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    });
  }
  async function idbGetByAccount(account) {
    const store = await idbTx('readonly');
    return new Promise((resolve, reject) => {
      const idx = store.index('account');
      const r = idx.getAll(IDBKeyRange.only(account));
      r.onsuccess = () => resolve(r.result || []);
      r.onerror = () => reject(r.error);
    });
  }
  async function idbGetById(id) {
    const store = await idbTx('readonly');
    return new Promise((resolve, reject) => {
      const r = store.get(id);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }

  // In-memory cache of takes for the current account (used by Status page).
  // Each entry: { id, account, bookId, createdAt, filename, url }
  let videoTakes = [];

  function buildTakeFilename(account, bookId, createdAtISO, mimeHint) {
    const d = new Date(createdAtISO);
    const pad = n => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
    // Pick extension based on the actual mime type (iOS Safari → mp4, Chromium → webm)
    const ext = (mimeHint || videoMimeType || '').includes('mp4') ? 'mp4' : 'webm';
    return `${account}_${bookId}_${stamp}.${ext}`;
  }

  // ---------- Portfolio Popup Player ----------
  // Open a fullscreen-ish modal with a real controls-enabled <video>.
  // Triggered from 학습현황 thumbnails. ESC and backdrop click close it.
  function openVideoModal(takeId) {
    const take = videoTakes.find(t => t.id === takeId);
    if (!take) return;
    const modal  = document.getElementById('videoModal');
    const player = document.getElementById('videoModalPlayer');
    const title  = document.getElementById('videoModalTitle');
    if (!modal || !player) return;
    // Set source from the cached blob URL (still alive while session is active)
    player.src = take.url;
    player.currentTime = 0;
    // Compose a friendly title: "Big Pig · 2026-05-29 14:30"
    let label = take.bookId || 'Portfolio';
    if (typeof ALL_BOOKS !== 'undefined') {
      const b = ALL_BOOKS.find(x => x.id === take.bookId);
      if (b && b.title) label = b.title;
    }
    const d = new Date(take.createdAt || Date.now());
    const pad = n => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (title) title.textContent = `${label} · ${stamp}`;
    modal.classList.add('open');
    // Autoplay best-effort (some browsers block without user gesture for unmuted)
    player.play().catch(() => {});
  }
  function closeVideoModal() {
    const modal  = document.getElementById('videoModal');
    const player = document.getElementById('videoModalPlayer');
    if (player) { try { player.pause(); } catch (_) {} player.removeAttribute('src'); player.load(); }
    if (modal)  modal.classList.remove('open');
  }
  function closeVideoModalIfBackdrop(e) {
    // Close only when the backdrop itself is clicked, not the inner card
    if (e && e.target && e.target.id === 'videoModal') closeVideoModal();
  }
  // ESC closes the modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('videoModal');
      if (modal && modal.classList.contains('open')) closeVideoModal();
    }
  });

  async function refreshVideoTakes() { videoTakes = await ctx.listTakes(); }



  // ---------- Authentication ----------
  // Allowed accounts. Plaintext is acceptable for a prototype — replace with
  // real auth (hashed creds / server API) for production.
  function getCurrentUser() { return ctx.userId; }
  function setCurrentUser() {}
  function clearCurrentUser() {}
  function showLoginScreen() {}


  async function enterApp() {
    const chipName = document.getElementById('userChipName');
    if (chipName) chipName.textContent = '← 학습앱으로';
    Object.keys(bookProgress).forEach(k => delete bookProgress[k]);
    ALL_BOOKS.forEach(b => { bookProgress[b.id] = ctx.progress[b.id] || { stepReached: 0, completed: false }; });
    await refreshVideoTakes();
    currentWeek = computeNextWeek();
    showView('home');
  }


  // Returns the week number that contains the next book the user should study.
  // Logic: first book (in study order) that is not yet completed.
  // If all completed → return the last real book's week.
  // If nothing started → returns week 1 (first book in sequence).
  function computeNextWeek() {
    const nextBook = ALL_BOOKS.find(b => {
      if (!b.real) return false;
      const p = bookProgress[b.id];
      return !p || !p.completed;
    });
    if (nextBook) return nextBook.week;
    const lastReal = [...ALL_BOOKS].reverse().find(b => b.real);
    return lastReal ? lastReal.week : 1;
  }
  function doLogin() { return false; }
  function doLogout() { ctx.exit(); }


  // ---------- Init ----------
  // Randomly pick one of the available study-desk backgrounds for this
  // session. Called once on page load — every refresh / new visit rolls
  // a fresh choice, so different students see different scenes.
  function applyStageBackground() {
    const stage = document.querySelector('.stage');
    if (!stage) return;
    const bgs = [
      '/reading/bg/study_desk1.png',
      '/reading/bg/study_desk2.png'
    ];
    const pick = bgs[Math.floor(Math.random() * bgs.length)];
    stage.style.backgroundImage = `url('${pick}')`;
  }

  applyStageBackground();
  enterApp();


  Object.assign(window, { updateProgress, showView, changeWeek, renderHome, loadBook, wimg, applyBookData, speakBookTitle, openBook, renderStatus, showStep, nextStep, prevStep, goTo, getFemaleVoice, getAudioCtx, playShhSound, playZzzSound, playMmmSound, playBrrrSound, playBuzzSound, normalizeForTTS, findSfx, parseStutterToken, tokenizeForSpeech, browserUtter, azFetch, stopAzure, wordSchedule, ttsUtter, warmPage, speak, cancelSpeak, switchPhonics, renderPhonicsTabs, _rhymeEnding, renderPhonics, renderKey, tapKeyCard, nextKeyWord, prevKeyWord, showPrompt, cancelPlay, setMode, getWords, getChunks, isChunkMode, getWordChunkIdx, onWordTapSide, autoPlay, setPageView, renderOne, renderPage, speakWord, onWordTap, echoNext, playPage, playActive, nextPage, prevPage, renderQuiz, answerQuiz, renderTrace, placeWord, resetTrace, nextTrace, prevTrace, getRecognizer, normalizeWord, tokenize, evaluatePronunciation, renderSpeak, speakListen, speakRecord, showSpeakScore, speakRetry, nextSpeak, prevSpeak, renderVideoScript, videoStartCamera, videoReRecord, pickRecorderMime, videoStartRecord, videoStopRecord, videoStopCamera, videoSubmit, launchConfetti, probeStorage, warnIfStorageDisabled, progressKey, loadProgress, saveProgress, persistProgress, openIDB, idbTx, idbPutRecording, idbDeleteRecording, idbGetByAccount, idbGetById, buildTakeFilename, openVideoModal, closeVideoModal, closeVideoModalIfBackdrop, refreshVideoTakes, getCurrentUser, setCurrentUser, clearCurrentUser, showLoginScreen, enterApp, computeNextWeek, doLogin, doLogout, applyStageBackground });
  return () => { try { cancelPlay(); } catch (e) {} try { videoStopCamera(); } catch (e) {} try { window.speechSynthesis.cancel(); } catch (e) {} videoTakes.forEach(t => { try { URL.revokeObjectURL(t.url); } catch (_) {} }); };
}
