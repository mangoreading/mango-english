export interface VWord { key: string; en: string; ko: string; image: string | null }
export interface Res { tag?: string; ok: boolean; hint?: number }
/** 어휘 활동 6종의 종류 코드 (기획서 p29~34). 이 종류는 React 정식 화면으로 재생한다. */
export const NATIVE_KINDS = ['vcards', 'vtype1', 'vspell', 'vmatch', 'vsound', 'vwrite'];
export const isNative = (it: unknown) => NATIVE_KINDS.includes((it as { k?: string })?.k ?? '');

/** 단어 그림 경로: 'word/hat.png'(앱 내장) 또는 업로드된 전체 주소(https://…) */
export const imgSrc = (p?: string | null) => (!p ? '' : /^https?:/.test(p) ? p : '/img/' + p);

export function say(text: string) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.85;
    speechSynthesis.speak(u);
  } catch { /* 소리가 안 되는 환경이면 조용히 넘어간다 */ }
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
  onDone: (res: Res[]) => void;
}
