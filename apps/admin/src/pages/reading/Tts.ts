import { MR_MARKUP, startMr } from '@mango/mr';
import { supabase } from '../../shared/supabase';
import type { RBook, RContent } from './shared';

export interface TtsItem { text: string; rate: string }
export interface SaveResult { total: number; created: number; existing: number; failed: number; firstError?: string }

/** 이 책에서 읽게 될 모든 소리(글+속도)를 학습 화면 엔진에게 물어 목록으로 받는다 */
export function collectBookTts(title: string, content: RContent): TtsItem[] {
  const host = document.createElement('div'); host.style.display = 'none'; host.innerHTML = MR_MARKUP; document.body.appendChild(host);
  try {
    const stop = startMr({
      userId: 'tts', progress: {}, books: [{ code: 'X', title, emoji: null, week: 1, ar: null }],
      async loadBook() { return {}; }, saveProgress() { /* 없음 */ }, async listTakes() { return []; }, async saveTake() { /* 없음 */ }, exit() { /* 없음 */ },
    });
    const items = (window as unknown as { collectTts: (d: unknown) => TtsItem[] }).collectTts({ title, ...content });
    stop(); return items;
  } finally { host.remove(); }
}

/** 소리를 미리 만들어 저장해 둔다(이미 저장된 것은 건너뜀). 학습 화면은 저장된 음원을 그대로 재사용해요. */
export async function saveItems(items: TtsItem[], onProgress?: (done: number, total: number) => void): Promise<SaveResult> {
  const r: SaveResult = { total: items.length, created: 0, existing: 0, failed: 0 }; let done = 0; const q = items.slice();
  const worker = async () => {
    for (;;) {
      const it = q.shift(); if (!it) return;
      const { data, error } = await supabase.functions.invoke('tts', { body: { lines: [{ t: it.text }], rate: it.rate, prefetch: true } });
      if (error) { r.failed++; if (!r.firstError) { let m = (error as Error).message; try { const j = await (error as unknown as { context: Response }).context.json(); m = j.error ?? m; } catch { /* 그대로 */ } r.firstError = m; } }
      else if ((data as { cached?: boolean })?.cached) r.existing++; else r.created++;
      onProgress?.(++done, items.length);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  return r;
}
export const saveBookAudio = (b: Pick<RBook, 'title' | 'content'>, onProgress?: (d: number, t: number) => void) => saveItems(collectBookTts(b.title, b.content), onProgress);
export const resultText = (r: SaveResult) => `음성 ${r.total}개 확인 · 새로 저장 ${r.created}개 · 이미 저장됨 ${r.existing}개${r.failed ? ` · 실패 ${r.failed}개(${r.firstError})` : ''}`;
