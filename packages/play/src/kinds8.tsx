import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { Fb } from './fb';
import { shuffle, stopSeq, type KindProps } from './common';

/** 본문 세트의 확인 문항: t 가 'tf' 면 True/False, 아니면 3~4지 선다(정답 1 + 오답 2~3) */
interface SetQ { t?: 'mc' | 'tf'; q: string; ans: string; wrong?: string[]; fb?: string }

function QuizPane({ qs, showText, onFinish }: { qs: SetQ[]; showText: () => void; onFinish: (r: boolean[]) => void }) {
  const [qi, setQi] = useState(0); const [res, setRes] = useState<boolean[]>([]); const [bad, setBad] = useState<number | null>(null); const [ok, setOk] = useState(false);
  const wrong = useRef(false); const fired = useRef(false);
  const q = qs[qi];
  const opts = useMemo(() => {
    if (!q) return [];
    if (q.t === 'tf') return [{ t: 'True', c: q.ans === 'True' }, { t: 'False', c: q.ans === 'False' }];
    return shuffle([{ t: q.ans, c: true }, ...(q.wrong ?? []).map((t) => ({ t, c: false }))]);
  }, [qi]); // eslint-disable-line
  function choose(i: number) {
    if (ok) return;
    if (opts[i].c) {
      setOk(true); const r = [...res, !wrong.current];
      setTimeout(() => {
        setRes(r);
        if (qi + 1 >= qs.length) { if (!fired.current) { fired.current = true; onFinish(r); } }
        else { setQi(qi + 1); setOk(false); wrong.current = false; }
      }, 900);
    } else { wrong.current = true; setBad(i); setTimeout(() => setBad(null), 500); }
  }
  if (!q) return null;
  return (
    <div className="nv-sq">
      <p className="nv-qt">Q{qs.length > 1 ? qi + 1 : ''}. {q.t === 'tf' ? 'True or False?' : ''} {q.q}</p>
      <div className={'nv-list nv-list-s' + (q.t === 'tf' ? ' nv-setq-tf' : '')}>{opts.map((o, i) => <button key={i} className={'nv-opt' + (ok && o.c ? ' nv-right' : bad === i ? ' nv-wrong nv-shake' : '')} onClick={() => choose(i)}>{o.t}</button>)}</div>
      {ok && q.fb && <p className="nv-setq-fb">{q.fb}</p>}
      <Fb className={'nv-fbmsg' + (ok ? ' on' : '')}>{ok ? '정답이에요! 👏' : ''}</Fb>
      <div className="nv-ptools"><button type="button" className="nv-hintbtn" onClick={showText}>📖 본문 보기</button></div>
    </div>
  );
}

/** 본문 템플릿(Model Text · Passage Read Aloud)에 확인 문항(최대 3개)을 붙인다. 문항이 없으면 원래 템플릿 그대로 동작한다.
 *  흐름: 본문 보기(원래 화면) → [문제 풀기] → 문항(언제든 "본문 보기") → 끝 */
export function withQuiz(Inner: ComponentType<KindProps>): ComponentType<KindProps> {
  return function WithQuiz(p: KindProps) {
    const qs: SetQ[] = (p.item.qs ?? []).slice(0, 3);
    if (!qs.length) return <Inner {...p} />;
    return <QuizShell Inner={Inner} p={p} qs={qs} />;
  };
}

function QuizShell({ Inner, p, qs }: { Inner: ComponentType<KindProps>; p: KindProps; qs: SetQ[] }) {
  const [phase, setPhase] = useState<'read' | 'quiz'>('read'); const [readDone, setReadDone] = useState(false); const [peek, setPeek] = useState(false);
  useEffect(() => { stopSeq(); }, [phase, peek]);
  const noop = () => undefined;
  if (phase === 'read') return (
    <>
      <Inner {...p} onDone={() => setReadDone(true)} />
      <div className="nv-setbar"><button type="button" className="nv-hintbtn on" disabled={!readDone} onClick={() => setPhase('quiz')}>{readDone ? '문제 풀기 ▶' : '본문을 끝까지 읽어 보세요'}</button></div>
    </>
  );
  return (
    <div className="nv-body nv-wbody nv-wtop">
      <QuizPane qs={qs} showText={() => setPeek(true)} onFinish={(r) => p.onDone(r.map((ok) => ({ tag: 'read', ok })))} />
      {peek && (
        <div className="nv-setov" role="dialog" aria-label="본문">
          <div className="nv-setov-in"><Inner {...p} onDone={noop} /></div>
          <button type="button" className="nv-hintbtn on nv-setov-x" onClick={() => { stopSeq(); setPeek(false); }}>닫기 ✕</button>
        </div>
      )}
    </div>
  );
}
