import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { Fb } from './fb';
import { shuffle, stopSeq, type KindProps } from './common';

/** 본문 세트의 확인 문항: t 가 'tf' 면 문장 1~3개에 T/F 를 고르는 한 문제, 아니면 3~4지 선다(정답 1 + 오답 1~3) */
export interface SetQ { t?: 'mc' | 'tf'; q?: string; ans?: string; wrong?: string[]; fb?: string; lines?: string[] }

/** T/F 한 문제: 문장 최대 3개(ⓐⓑⓒ)를 보고 각각 T 또는 F 를 고른다. 모두 맞히면 onFinish(처음부터 맞혔는지) */
export function TfBlock({ q, no, onFinish }: { q: SetQ; no: string; onFinish: (firstTry: boolean) => void }) {
  const rows = (q.lines ?? []).slice(0, 3).map((l) => { const m = l.match(/^(.*)\|\s*([TFtf])\s*$/); return { t: (m ? m[1] : l).trim(), a: m ? m[2].toUpperCase() === 'T' : true }; });
  const [res, setRes] = useState<Record<number, boolean>>({}); const [bad, setBad] = useState<string | null>(null);
  const wrongs = useRef<Set<number>>(new Set()); const fired = useRef(false);
  useEffect(() => {
    if (!fired.current && rows.length && rows.every((_, i) => res[i] != null)) { fired.current = true; const t = setTimeout(() => onFinish(wrongs.current.size === 0), 900); return () => clearTimeout(t); }
    return undefined; // eslint-disable-next-line
  }, [res]);
  function pick(i: number, v: boolean) {
    if (res[i] != null) return;
    if (!!rows[i].a === v) setRes({ ...res, [i]: v });
    else { wrongs.current.add(i); setBad(i + (v ? 'T' : 'F')); setTimeout(() => setBad(null), 500); }
  }
  const mark = (i: number) => String.fromCharCode(9424 + i);
  return (
    <div className="nv-sq">
      <p className="nv-qt">Q{no}. {q.q || '글의 내용과 일치하면 T, 아니면 F를 선택하세요.'}</p>
      <div className="nv-tfl">{rows.map((r, i) => (
        <div key={i} className="nv-tfr"><span>{mark(i)} {r.t}</span>
          {[true, false].map((v) => <button key={String(v)} className={'nv-tfb' + (res[i] === v ? ' nv-right' : '') + (bad === i + (v ? 'T' : 'F') ? ' nv-wrong nv-shake' : '')} onClick={() => pick(i, v)}>{v ? 'T' : 'F'}</button>)}
        </div>))}</div>
      <Fb className={'nv-fbmsg' + (rows.length > 0 && rows.every((_, i) => res[i] != null) ? ' on' : '')}>{rows.length > 0 && rows.every((_, i) => res[i] != null) ? '정답이에요! 👏' : ''}</Fb>
    </div>
  );
}

function QuizPane({ qs, showText, onFinish }: { qs: SetQ[]; showText: () => void; onFinish: (r: boolean[]) => void }) {
  const [qi, setQi] = useState(0); const [res, setRes] = useState<boolean[]>([]); const [bad, setBad] = useState<number | null>(null); const [ok, setOk] = useState(false);
  const wrong = useRef(false); const fired = useRef(false);
  const q = qs[qi];
  const opts = useMemo(() => {
    if (!q) return [];
    if (q.t === 'tf') return [];
    return shuffle([{ t: q.ans ?? '', c: true }, ...(q.wrong ?? []).map((t) => ({ t, c: false }))]);
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
  function next(firstTry: boolean) {
    const r = [...res, firstTry];
    setRes(r);
    if (qi + 1 >= qs.length) { if (!fired.current) { fired.current = true; onFinish(r); } }
    else { setQi(qi + 1); setOk(false); wrong.current = false; }
  }
  if (q.t === 'tf') return (
    <div className="nv-setq">
      <TfBlock key={qi} q={q} no={qs.length > 1 ? String(qi + 1) : ''} onFinish={next} />
      <div className="nv-ptools"><button type="button" className="nv-hintbtn" onClick={showText}>📖 본문 보기</button></div>
    </div>
  );
  return (
    <div className="nv-sq">
      <p className="nv-qt">Q{qs.length > 1 ? qi + 1 : ''}. {q.q}</p>
      <div className="nv-list nv-list-s">{opts.map((o, i) => <button key={i} className={'nv-opt' + (ok && o.c ? ' nv-right' : bad === i ? ' nv-wrong nv-shake' : '')} onClick={() => choose(i)}>{o.t}</button>)}</div>
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
  if (phase === 'read') { const I = Inner as ComponentType<KindProps & { onNext?: { ready: boolean; go: () => void } }>; return <I {...p} onDone={() => setReadDone(true)} onNext={{ ready: readDone, go: () => setPhase('quiz') }} />; }
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
