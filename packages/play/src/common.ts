export interface VWord { key: string; en: string; ko: string; image: string | null }
export interface Res { tag?: string; ok: boolean; hint?: number }
/** 어휘 활동 6종의 종류 코드 (기획서 p29~34). 이 종류는 React 정식 화면으로 재생한다. */
export const VOCAB_KINDS = ['vcards', 'vtype1', 'vspell', 'vmatch', 'vsound', 'vwrite', 'wrepeat'];
/** 1단계 문장·읽기·듣기 템플릿 (문항 안에 글이 그대로 들어 있다) */
export const TEXT_KINDS = ['lookspeak', 'saykor', 'lspeak', 'raloud', 'role', 'present', 'aitalk', 'sbuild', 'swrite', 'sfill', 'dfill', 'sscram', 'sorder', 'mwbank', 'scloze', 'lwrite', 'mfree', 'swrt', 'goal', 'scene', 'kexp', 'tapl', 'lsent', 'lcardp', 'lcardt', 'sdrill', 'pread', 'mtext', 'wchoice', 'pchoice', 'dchoice', 'tf', 'lchtext', 'lchpic', 'lchlist', 'lmatch', 'sqchoice', 'sqtf', 'sqmulti'];
export const NATIVE_KINDS = [...VOCAB_KINDS, ...TEXT_KINDS];
export const isNative = (it: unknown) => NATIVE_KINDS.includes((it as { k?: string })?.k ?? '');

/** 단어 그림 경로: 'word/hat.png'(앱 내장) 또는 업로드된 전체 주소(https://…) */
export const imgSrc = (p?: string | null) => (!p ? '' : /^https?:/.test(p) ? p : '/img/' + p);

/* ===== 읽어 주기(TTS): 기기에 설치된 영어 목소리 중 가장 자연스러운 것을 골라 쓴다 ===== */
// 이상한 효과음 목소리(맥 등)는 제외
const BAD = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|junior|kathy|organ|princess|ralph|superstar|trinoids|whisper|wobble|zarvox|fred|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley)\b/i;
function score(v: SpeechSynthesisVoice): number {
  const n = v.name; let s = 0;
  if (/^en[-_]US$/i.test(v.lang)) s += 100; else if (/^en/i.test(v.lang)) s += 40; else return -1;
  if (BAD.test(n)) return -1;
  if (/natural|neural|online/i.test(n)) s += 60;                        // 윈도우 엣지의 Aria·Jenny 등 신경망 음성
  if (/google us english/i.test(n)) s += 50;                             // 크롬
  if (/premium|enhanced|siri/i.test(n)) s += 45;                         // 맥·아이폰의 고음질 음성
  if (/\b(samantha|ava|allison|zoe|evan|nicky|aria|jenny|ana|emma|michelle)\b/i.test(n)) s += 30;
  if (/microsoft (zira|david|mark)/i.test(n)) s += 5;                    // 윈도우 기본 음성(품질 낮음)
  if (v.localService === false) s += 5;
  return s;
}
let picked: SpeechSynthesisVoice | null | undefined;
function pickVoice(): SpeechSynthesisVoice | null {
  try {
    const vs = speechSynthesis.getVoices();
    if (!vs.length) return null; // 아직 목록이 안 왔으면 다음에 다시 고른다
    if (picked === undefined) picked = vs.map((v) => ({ v, s: score(v) })).filter((x) => x.s >= 0).sort((a, b) => b.s - a.s)[0]?.v ?? null;
    return picked;
  } catch { return null; }
}
try { speechSynthesis.addEventListener('voiceschanged', () => { picked = undefined; }); } catch { /* 소리가 안 되는 환경 */ }

function utter(text: string, pitch = 1): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice();
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-US';
  u.rate = 0.85; u.pitch = pitch;
  return u;
}

/* ===== Azure 음성(서버): 연결돼 있으면 긴 지문에 쓰고, 안 되면 브라우저 음성으로 대신한다 ===== */
/** 말하기 평가(STT) 서버 연결: 녹음(WAV)과 읽을 문장을 보내 글자와 발음 점수(0~100)를 받는다 */
export interface SttInfo { text: string; accuracy?: number; fluency?: number; completeness?: number; pron?: number }
let sttHook: ((wav: Blob, ref?: string) => Promise<SttInfo>) | null = null;
export const registerStt = (h: (wav: Blob, ref?: string) => Promise<SttInfo>) => { sttHook = h; };
export const getStt = () => sttHook;

export type TtsLine = { who?: string; t: string };
let ttsHook: ((lines: TtsLine[]) => Promise<Blob>) | null = null;
export const registerTts = (h: (lines: TtsLine[]) => Promise<Blob>) => { ttsHook = h; };
const ttsCache = new Map<string, string>();
let curAudio: HTMLAudioElement | null = null;
const stopAudio = () => { try { curAudio?.pause(); } catch { /* 무시 */ } curAudio = null; };

export function say(text: string) {
  stopAudio(); scriptGen++;
  try { speechSynthesis.cancel(); speechSynthesis.speak(utter(text)); } catch { /* 소리가 안 되는 환경이면 조용히 넘어간다 */ }
}

/** 읽어 주고, 다 읽으면 done()을 부른다. 소리가 안 되는 환경이거나 끝 신호가 안 오면 3초 뒤에 부른다. */
export function sayThen(text: string, done: () => void, pitch = 1) {
  let fin = false; const end = () => { if (!fin) { fin = true; done(); } };
  setTimeout(end, Math.max(3000, text.length * 120));
  try {
    speechSynthesis.cancel();
    const u = utter(text, pitch); u.onend = end; u.onerror = end;
    speechSynthesis.speak(u);
  } catch { end(); }
}

/** 여러 줄 지문 재생: 한 줄씩 차례로 읽는다. "이름: 문장" 이면 이름별로 목소리 높낮이를 달리한다. 새로 재생하면 앞 재생은 멈춘다. */
let scriptGen = 0;
export const isScript = (t?: string) => /\n/.test((t ?? '').trim());
export function sayScript(text: string, done?: () => void) {
  stopAudio();
  const gen = ++scriptGen;
  const rows = text.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = l.match(/^([A-Za-z][A-Za-z .'-]{0,14}(?:\(\s*[A-Za-z]{3,6}\s*\))?|[가-힣]{1,6}):\s*(.+)$/);
    return m ? { who: m[1], t: m[2] } : { who: undefined as string | undefined, t: l };
  });
  const browser = () => {
  let i = 0;
  const next = () => {
    if (gen !== scriptGen) return;
    if (i >= rows.length) { done?.(); return; }
    const r = rows[i++];
    sayThen(r.t, () => { if (gen === scriptGen) setTimeout(next, 350); }, voicePitch(r.who));
  };
  next();
  };
  if (!ttsHook) { browser(); return; }
  const k = JSON.stringify(rows);
  const play = (src: string) => {
    if (gen !== scriptGen) return;
    try { speechSynthesis.cancel(); } catch { /* 무시 */ }
    const a = new Audio(src); curAudio = a; a.onended = () => done?.(); a.onerror = () => { if (gen === scriptGen) browser(); };
    a.play().catch(() => { if (gen === scriptGen) browser(); });
  };
  const hit = ttsCache.get(k);
  if (hit) { play(hit); return; }
  ttsHook(rows).then((b) => { const u = URL.createObjectURL(b); ttsCache.set(k, u); play(u); }).catch(() => { if (gen === scriptGen) browser(); });
}

export function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}
export const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export interface KindProps {
  item: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  words: VWord[];            // item.words / item.word 에 해당하는 단어(순서 유지)
  vocab?: VWord[];           // 단원 어휘 전체 (보기·오답 후보로 쓴다)
  pic: (key?: string | null) => string | null; // 단원 단어 key → 그림 경로
  onDone: (res: Res[]) => void;
}

/** AI 연동 자리: 학습앱이 서버 함수를 연결해 두면 AI 대화·힌트가 동작하고, 없으면 문항에 적힌 내용으로 대신한다 */
export interface AiHandlers {
  chat?: (req: { situation: string; role?: string; history: { who: 'ai' | 'me'; text: string }[] }) => Promise<string>;
  check?: (req: { text: string; rules: string[] }) => Promise<boolean[]>;
  hint?: (req: { kind: string; item: unknown; input: string; wrong: number; given: number; prev?: string[] }) => Promise<string>;
}
export const aiHandlers: AiHandlers = {};
export const registerAi = (h: AiHandlers) => Object.assign(aiHandlers, h);

/** 화면이 열릴 때 저절로 나는 소리(자동 재생). 관리자의 미리보기 같은 곳에서는 끈다. */
let quiet = false;
export function setQuiet(b: boolean) { quiet = b; }
export function sayAuto(text: string) { if (!quiet) say(text); }

/** 장면 영상: 말하는 사람마다 목소리 높낮이를 다르게 읽어 준다 */
export const voicePitch = (who?: string) => { if (!who) return 1; const tg = who.match(/\(\s*([A-Za-z]+)\s*\)\s*$/)?.[1]?.toLowerCase(); if (tg) { const t: Record<string, number> = { girl: 1.35, child: 1.35, boy: 1.2, woman: 1.1, female: 1.1, man: 0.8, male: 0.8 }; if (t[tg]) return t[tg]; } let h = 0; for (const c of who) h = (h * 31 + c.charCodeAt(0)) >>> 0; return [1, 1.3, 0.75, 1.15][h % 4]; };
