import { useRef, useState } from 'react';
import { aiHandlers } from './common';

/** 힌트 버튼: 문항에 적힌 힌트를 보여 주고, AI 연결이 있으면 "AI 선생님 힌트"를 더 받을 수 있다(학생이 지금까지 한 입력·오답을 보고 만든다) */
export function Hint({ lines, kind, item, ctx, inline }: { lines?: string[]; kind?: string; item?: unknown; ctx?: () => { input: string; wrong: number }; inline?: boolean }) {
  const [on, setOn] = useState(false); const [ai, setAi] = useState<string[]>([]); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const given = useRef(0); const canAi = !!(aiHandlers.hint && kind);
  if (!lines?.length && !canAi) return null;
  async function ask() {
    if (busy || !aiHandlers.hint) return; setBusy(true); setErr('');
    try {
      const c = ctx?.() ?? { input: '', wrong: 0 };
      const req = { kind: kind!, item, input: c.input, wrong: c.wrong, given: given.current, prev: ai };
      let t: string;
      try { t = await aiHandlers.hint(req); } catch { await new Promise((r) => setTimeout(r, 700)); t = await aiHandlers.hint(req); } // 일시 오류면 한 번 더
      given.current += 1; setAi((a) => [...a, t]);
    } catch (e) { setErr('AI 선생님이 지금은 답하지 못해요. 위 힌트를 먼저 봐 주세요. [' + String((e as Error)?.message ?? e).slice(0, 160) + ']'); }
    setBusy(false);
  }
  return (
    <div className={'nv-hintwrap' + (inline ? ' nv-hint-in' : '')}>
      <button type="button" className="nv-hintbtn" onClick={() => setOn(!on)} aria-expanded={on}>💡 Hint</button>
      <div className={'nv-hintbox' + (on ? ' on' : '')}>
        {lines?.map((l, i) => <p key={i}>{l}</p>)}
        {ai.map((l, i) => <p key={'a' + i} className="nv-aihint">🤖 {l}</p>)}
        {err && <p className="nv-fbbad">{err}</p>}
        {canAi && given.current < 3 && <button type="button" className="nv-aibtn" disabled={busy} onClick={() => void ask()}>{busy ? '생각하는 중…' : 'AI 선생님께 힌트 받기'}</button>}
      </div>
    </div>
  );
}
