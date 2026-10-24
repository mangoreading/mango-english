export interface VWord { key: string; en: string; ko: string; image: string | null }
export interface Res { tag?: string; ok: boolean; hint?: number }
/** 어휘 활동 6종의 종류 코드 (기획서 p29~34). 이 종류는 React 정식 화면으로 재생한다. */
export const VOCAB_KINDS = ['vcards', 'vtype1', 'vspell', 'vmatch', 'vsound', 'vwrite', 'wrepeat'];
/** 1단계 문장·읽기·듣기 템플릿 (문항 안에 글이 그대로 들어 있다) */
export const TEXT_KINDS = ['sbuild', 'swrite', 'sfill', 'dfill', 'sscram', 'sorder', 'mwbank', 'scloze', 'lwrite', 'mfree', 'swrt', 'goal', 'kexp', 'tapl', 'lsent', 'lcardp', 'lcardt', 'sdrill', 'pread', 'mtext', 'wchoice', 'pchoice', 'dchoice', 'tf', 'lchtext', 'lchpic', 'lchlist', 'lmatch', 'sqchoice', 'sqtf', 'sqmulti'];
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

function utter(text: string): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice();
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-US';
  u.rate = 0.85; u.pitch = 1;
  return u;
}

export function say(text: string) {
  try { speechSynthesis.cancel(); speechSynthesis.speak(utter(text)); } catch { /* 소리가 안 되는 환경이면 조용히 넘어간다 */ }
}

/** 읽어 주고, 다 읽으면 done()을 부른다. 소리가 안 되는 환경이거나 끝 신호가 안 오면 3초 뒤에 부른다. */
export function sayThen(text: string, done: () => void) {
  let fin = false; const end = () => { if (!fin) { fin = true; done(); } };
  setTimeout(end, 3000);
  try {
    speechSynthesis.cancel();
    const u = utter(text); u.onend = end; u.onerror = end;
    speechSynthesis.speak(u);
  } catch { end(); }
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
  pic: (key?: string | null) => string | null; // 단원 단어 key → 그림 경로
  onDone: (res: Res[]) => void;
}
