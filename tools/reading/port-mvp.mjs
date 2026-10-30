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
  listTakes: () => Promise<any[]>; saveTake: (code: string, blob: Blob) => Promise<void>; exit: () => void; wordImg?: (word: string) => string | undefined; }
export function startMr(ctx: MrCtx): () => void {
${js}
  Object.assign(window, { ${names.join(', ')} });
  return () => { try { cancelPlay(); } catch (e) {} try { videoStopCamera(); } catch (e) {} try { window.speechSynthesis.cancel(); } catch (e) {} videoTakes.forEach(t => { try { URL.revokeObjectURL(t.url); } catch (_) {} }); };
}
`;
fs.writeFileSync(out + '/mrEngine.ts', body);
console.log('ok', names.length, 'functions; handlers used', used.size);
