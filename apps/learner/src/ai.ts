import { registerAi, registerOutputs, registerStt, registerTts } from '@mango/play';
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
  check: async (r) => { const t = await call({ action: 'check', ...r }); const a = JSON.parse(t); if (!Array.isArray(a)) throw new Error('bad'); return r.rules.map((_, i) => !!a[i]); },
  grammar: async (r) => { const t = await call({ action: 'grammar', ...r }); const a = JSON.parse(t); if (!Array.isArray(a)) throw new Error('bad'); return a; },
  chat: (r) => call({ action: 'chat', ...r }),
});

/** 음성 합성 연결: Supabase 서버 함수(tts)가 Azure 음성으로 만든 mp3 를 받아 온다. 실패하면 브라우저 음성으로 대신한다. */
registerTts(async (lines) => {
  const { data, error } = await supabase.functions.invoke('tts', { body: { lines } });
  if (error) {
    let msg = (error as Error).message;
    try { const j = await (error as unknown as { context: Response }).context.json(); msg = j.error ?? j.message ?? msg; } catch { /* 그대로 */ }
    console.error('[tts] 서버 오류(브라우저 음성으로 대신 읽어요):', msg); throw new Error(msg);
  }
  if (!(data instanceof Blob)) throw new Error('tts');
  return data;
});

/** 말하기 평가 연결: Supabase 서버 함수(stt)가 녹음을 Azure 로 보내 글자와 발음 점수를 받아 온다. 실패하면 브라우저 음성 인식으로 대신한다. */
registerStt(async (wav, ref) => {
  const { data, error } = await supabase.functions.invoke('stt', { body: wav, headers: { 'Content-Type': 'audio/wav', 'x-ref': encodeURIComponent(ref ?? '') } });
  if (error) {
    let msg = (error as Error).message;
    try { const j = await (error as unknown as { context: Response }).context.json(); msg = j.error ?? j.message ?? msg; } catch { /* 그대로 */ }
    console.error('[stt] 서버 오류:', msg); throw new Error(msg);
  }
  if (!data || typeof (data as { text?: string }).text !== 'string') throw new Error('stt');
  return data as { text: string; accuracy?: number; fluency?: number; completeness?: number; pron?: number };
});

/** 학습 산출물 저장: 내가 쓴 글(mfree)과 발표 영상(present)을 본인 계정에 저장하고, 같은 차시의 뒤 활동이 가져다 쓴다. scope = "단원id|차시" */
registerOutputs({
  async load(scope, kind) {
    const [unit, lesson] = scope.split('|'); if (!lesson) return null;
    const { data: u } = await supabase.auth.getUser(); if (!u.user) return null;
    const { data } = await supabase.from('student_outputs').select('text').eq('user_id', u.user.id).eq('unit_id', unit).eq('lesson', Number(lesson)).eq('kind', kind).maybeSingle();
    return data ? { text: (data as { text: string | null }).text ?? undefined } : null;
  },
  async save(scope, kind, d) {
    const [unit, lesson] = scope.split('|'); if (!lesson) throw new Error('scope');
    const { data: u } = await supabase.auth.getUser(); if (!u.user) throw new Error('login');
    let video_path: string | undefined;
    if (d.video) {
      video_path = `${u.user.id}/${unit}/${lesson}-${kind}-${Date.now()}.webm`;
      const up = await supabase.storage.from('outputs').upload(video_path, d.video, { contentType: 'video/webm' });
      if (up.error) throw up.error;
    }
    const row: Record<string, unknown> = { user_id: u.user.id, unit_id: unit, lesson: Number(lesson), kind, updated_at: new Date().toISOString() };
    if (d.text != null) row.text = d.text;
    if (video_path) row.video_path = video_path;
    const { error } = await supabase.from('student_outputs').upsert(row, { onConflict: 'user_id,unit_id,lesson,kind' });
    if (error) throw error;
  },
});
