import { useRef, useState } from 'react';
import { aiHandlers } from './common';

/** 1단계: 규칙 점검(AI 없이 즉시). 문장 첫 글자 대문자 · I 대문자 · 문장 끝 부호 · 공백 */
export function basicIssues(text: string): string[] {
  const t = text.replace(/\s+/g, ' ').trim(); if (!t) return [];
  const out: string[] = [];
  const sents = t.split(/(?<=[.!?])\s+/).filter((x) => x.trim());
  if (sents.some((x) => /^[a-z]/.test(x))) out.push('문장은 대문자로 시작해요. (예: it is → It is)');
  if (/(^|[\s"'(])i(?=[\s',.!?]|$)/.test(t)) out.push('"나"를 뜻하는 I 는 항상 대문자로 써요.');
  if (!/[.!?]["')]*$/.test(t)) out.push('마지막에 . ? ! 중 하나를 붙여요.');
  else if (sents.some((x, i) => i < sents.length - 1 && !/[.!?]["')]*$/.test(x))) out.push('문장이 끝날 때마다 . ? ! 를 붙여요.');
  if (/\b(\w+) \1\b/i.test(t)) out.push('같은 단어가 두 번 이어져 있어요. 한 번만 써도 되는지 봐요.');
  return out;
}

/** 글 점검 버튼: 규칙 점검 결과 + AI 문법·철자 점검(최대 3번). 정답 문장은 알려 주지 않고 고칠 곳만 짚어 준다 */
export function WriteCheck({ getText, goal, locked }: { getText: () => string; goal?: string; locked?: boolean }) {
  const [res, setRes] = useState<{ basic: string[]; ai: { q: string; tip: string }[] | null; text: string } | null>(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const used = useRef(0);
  const MAX = 3;
  async function run() {
    const text = getText(); if (busy || !text.trim()) return; setBusy(true); setErr('');
    const basic = basicIssues(text); let ai: { q: string; tip: string }[] | null = null;
    if (aiHandlers.grammar) {
      try {
        try { ai = await aiHandlers.grammar({ text, goal }); } catch { await new Promise((r) => setTimeout(r, 700)); ai = await aiHandlers.grammar({ text, goal }); }
        used.current += 1;
      } catch (e) { setErr('AI 점검이 지금은 어려워요. 아래 기본 점검만 보여 드려요. [' + String((e as Error)?.message ?? e).slice(0, 120) + ']'); }
    }
    setRes({ basic, ai, text }); setBusy(false);
  }
  const left = MAX - used.current; const canAi = !!aiHandlers.grammar;
  const clean = res && res.basic.length === 0 && (res.ai?.length ?? 0) === 0 && !err;
  return (
    <div className="nv-wchk">
      <button type="button" className="nv-aibtn nv-wchkbtn" disabled={busy || locked || (canAi && left <= 0)} onClick={() => void run()}>
        {busy ? '살펴보는 중…' : res ? `다시 점검하기${canAi ? ` (${Math.max(left, 0)}번 남음)` : ''}` : '✏️ 글 점검하기'}
      </button>
      {res && (
        <div className="nv-wchkbox">
          {clean && <p className="nv-wchkok">잘 썼어요! 눈에 띄는 실수가 없어요. 👍</p>}
          {res.basic.map((m, i) => <p key={'b' + i} className="nv-wchkitem">✔ {m}</p>)}
          {res.ai?.map((m, i) => <p key={'a' + i} className="nv-wchkitem">🤖 {m.q ? <b>"{m.q}"</b> : null} {m.tip}</p>)}
          {err && <p className="nv-fbbad">{err}</p>}
          {!clean && <p className="nv-wchkfoot">고친 다음 다시 점검해 보세요. 안 고쳐도 계속할 수 있어요.</p>}
        </div>
      )}
    </div>
  );
}
