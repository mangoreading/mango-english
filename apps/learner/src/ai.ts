import { registerAi } from '@mango/play';
import { supabase } from './supabase';

/** AI 도우미 연결: Supabase 서버 함수(ai-assist)를 통해 힌트·대화를 받는다. 함수가 아직 없거나 실패하면 문항에 적힌 내용으로 대신한다. */
async function call(body: Record<string, unknown>): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-assist', { body });
  if (error) {
    // 서버가 보낸 실제 오류 문장을 꺼내 화면에 보여 준다(원인 파악용)
    let msg = (error as Error).message;
    try { const j = await (error as unknown as { context: Response }).context.json(); msg = j.error ?? j.message ?? msg; } catch { /* 그대로 */ }
    throw new Error(msg);
  }
  const t = (data as { text?: string } | null)?.text;
  if (!t) throw new Error('empty');
  return t;
}
registerAi({
  hint: (r) => call({ action: 'hint', ...r }),
  chat: (r) => call({ action: 'chat', ...r }),
});
