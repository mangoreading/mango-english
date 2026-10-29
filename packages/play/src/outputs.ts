/** 학습 산출물(내가 쓴 글·발표 영상) 저장 자리. 학습앱이 서버 저장을 연결해 두면 저장되고, 없으면(관리자 미리보기) 이 화면 안에서만 기억한다.
    같은 차시(scope) 안에서 앞 활동의 결과를 뒤 활동이 가져다 쓴다(나만의 글 쓰기 → 발표 영상). */
export interface OutData { text?: string; video?: Blob }
export interface OutputStore {
  load: (scope: string, kind: string) => Promise<{ text?: string } | null>;
  save: (scope: string, kind: string, d: OutData) => Promise<void>;
}
let store: OutputStore | null = null;
let scope = 'preview';
const mem = new Map<string, { text?: string }>();
export const registerOutputs = (s: OutputStore) => { store = s; };
export const setOutputScope = (s: string) => { scope = s || 'preview'; };
export const outputsPersist = () => !!store;
export async function loadOutput(kind: string): Promise<{ text?: string } | null> {
  const m = mem.get(scope + '|' + kind); if (m) return m;
  if (!store) return null;
  try { return await store.load(scope, kind); } catch { return null; }
}
/** 저장 성공이면 true. 서버 저장이 없거나 실패하면 false(그래도 이 화면 안에서는 기억한다) */
export async function saveOutput(kind: string, d: OutData): Promise<boolean> {
  if (d.text != null) mem.set(scope + '|' + kind, { text: d.text });
  if (!store) return false;
  try { await store.save(scope, kind, d); return true; } catch (e) { console.error('[outputs] 저장 실패', e); return false; }
}
