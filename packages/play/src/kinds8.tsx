import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { Fb } from './fb';
import { Rich } from './kinds3';
import { shuffle, stopSeq, type KindProps } from './common';

/** 본문 세트의 확인 문항: t 가 'tf' 면 문장 1~3개에 T/F 를 고르는 한 문제, 아니면 3~4지 선다(정답 1 + 오답 1~3) */
export interface SetQ { t?: 'mc' | 'tf'; q?: string; ans?: string; wrong?: string[]; fb?: string; lines?: string[] }

/** T/F 한 문제: 문장 최대 3개(ⓐⓑⓒ)를 보고 각각 T 또는 F 를 고른다. 모두 맞히면 onFinish(처음부터 맞혔는지) */
export function TfBlock({ q, no, onFinish, done }: { q: SetQ; no: string; onFinish: (firstTry: boolean) => void; done?: boolean }) {
  const rows = (q.lines ?? []).slice(0, 3).map((l) => { const m = l.match(/^(.*)\|\s*([TFtf])\s*$/); return { t: (m ? m[1] : l).trim(), a: m ? m[2].toUpperCase() === 'T' : true }; });
  const [res, setRes] = useState<Record<number, boolean>>(() => (done ? Object.fromEntries(rows.map((r, i) => [i, r.a])) : {})); const [bad, setBad] = useState<string | null>(null);
  const wrongs = useRef<Set<number>>(new Set()); const fired = useRef(!!done);
  useEffect(() => {
    if (!fired.current && rows.length && rows.every((_, i) => res[i] != null)) { fired.current = true; onFinish(wrongs.current.size === 0); }
    // eslint-disable-next-line
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

/** 해석과 해설 쪽: Scene story 의 "해석과 해설" 과 같은 모양. 영어 문장(굵게)과 한글 해석, 그리고 해설 상자 */
function ReviewPage({ item }: { item: Record<string, any> }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const text: string[] = item.text ?? [];
  const explain: string[] = item.explain ?? [];
  let body;
  if (item.k === 'pread') {
    const pages: string[][] = text.reduce<string[][]>((a, l) => { if (l.trim() === '---') a.push([]); else a[a.length - 1].push(l); return a; }, [[]]).filter((g) => g.length);
    const kos: string[] = item.ko ? String(item.ko).split(/\n-{3,}\n/) : [];
    body = pages.map((g, pi) => (
      <div key={pi} className="nv-rv-row"><span className="nv-rv-who">{pages.length > 1 ? pi + 1 : ''}</span><div>{g.map((l, i) => <b key={i}><Rich text={l} /></b>)}{kos[pi] && <small>{kos[pi]}</small>}</div></div>
    ));
  } else {
    const kos: string[] = item.ko ? String(item.ko).split('\n') : [];
    body = text.map((l, i) => <div key={i} className="nv-rv-row"><span className="nv-rv-who" /><div><b><Rich text={l} /></b>{kos[i] && <small>{kos[i]}</small>}</div></div>);
  }
  return (
    <div className="nv-rv">
      <p className="nv-rv-t">해석과 해설</p>
      <div className="nv-rv-list">{body}</div>
      {!!explain.length && <div className="nv-rv-ex">{explain.map((l, i) => <p key={i}><Rich text={l} /></p>)}</div>}
    </div>
  );
}

/** 확인 문항 한 쪽: 이미 푼 문항으로 돌아오면 정답이 채워진 상태로 보여 준다 */
function QPage({ q, no, solved, onSolved, hasNext }: { q: SetQ; no: string; solved: boolean | undefined; onSolved: (firstTry: boolean) => void; hasNext: boolean }) {
  const [ok, setOk] = useState(solved !== undefined); const [bad, setBad] = useState<number | null>(null); const wrong = useRef(false);
  const opts = useMemo(() => (q.t === 'tf' ? [] : shuffle([{ t: q.ans ?? '', c: true }, ...(q.wrong ?? []).map((t) => ({ t, c: false }))])), []); // eslint-disable-line
  function choose(i: number) {
    if (ok) return;
    if (opts[i].c) { setOk(true); onSolved(!wrong.current); }
    else { wrong.current = true; setBad(i); setTimeout(() => setBad(null), 500); }
  }
  const msg = ok ? (hasNext ? '정답이에요! 오른쪽 ›를 눌러요 👏' : '정답이에요! 👏') : '';
  if (q.t === 'tf') return <TfBlock q={q} no={no} done={solved !== undefined} onFinish={(ft) => { setOk(true); onSolved(ft); }} />;
  return (
    <div className="nv-sq">
      <p className="nv-qt">Q{no}. {q.q}</p>
      <div className="nv-list nv-list-s">{opts.map((o, i) => <button key={i} className={'nv-opt' + (ok && o.c ? ' nv-right' : bad === i ? ' nv-wrong nv-shake' : '')} onClick={() => choose(i)}>{o.t}</button>)}</div>
      {ok && q.fb && <p className="nv-setq-fb">{q.fb}</p>}
      <Fb className={'nv-fbmsg' + (ok ? ' on' : '')}>{msg}</Fb>
    </div>
  );
}

/** 본문 템플릿(Model Text · Passage Read Aloud)에 확인 문항(최대 3개)을 붙인다. 문항이 없으면 원래 템플릿 그대로 동작한다.
 *  쪽 구성: 본문 → 문항들 → 해설 보기(해설·해석이 있을 때). 모든 쪽에 [<] [>] 가 있고, 그 쪽을 마치면 [>] 가 열리며 [<] 는 언제나 누를 수 있다. */
export function withQuiz(Inner: ComponentType<KindProps>): ComponentType<KindProps> {
  return function WithQuiz(p: KindProps) {
    const qs: SetQ[] = (p.item.qs ?? []).slice(0, 3);
    if (!qs.length) return <Inner {...p} />;
    return <QuizShell Inner={Inner} p={p} qs={qs} />;
  };
}

function QuizShell({ Inner, p, qs }: { Inner: ComponentType<KindProps>; p: KindProps; qs: SetQ[] }) {
  const hasEx = !!(p.item.explain?.length || p.item.ko);
  const [pg, setPg] = useState(0); const [readDone, setReadDone] = useState(false); const [sol, setSol] = useState<(boolean | undefined)[]>(() => qs.map(() => undefined)); const fired = useRef(false);
  const total = 1 + qs.length + (hasEx ? 1 : 0); const qi = pg - 1; const isQ = qi >= 0 && qi < qs.length; const isEx = hasEx && pg === total - 1;
  useEffect(() => { stopSeq(); }, [pg]);
  useEffect(() => { if (!fired.current && sol.every((x) => x !== undefined)) { fired.current = true; p.onDone(sol.map((ok) => ({ tag: 'read', ok: !!ok }))); } /* eslint-disable-next-line */ }, [sol]);
  const canNext = pg < total - 1 && (pg === 0 ? readDone : isQ ? sol[qi] !== undefined : false);
  const onSolved = (i: number) => (ft: boolean) => setSol((a) => { const b = [...a]; if (b[i] === undefined) b[i] = ft; return b; });
  return (
    <div className={'nv-body nv-wbody nv-wtop nv-setroot' + (p.item.k === 'pread' ? ' nv-set-pread' : '')}>
      {pg === 0 && (() => { const I = Inner as ComponentType<KindProps & { onNext?: { ready: boolean; go: () => void } }>; return <I {...p} onDone={() => setReadDone(true)} onNext={{ ready: readDone, go: () => setPg(1) }} />; })()}
      {isQ && <QPage key={qi} q={qs[qi]} no={qs.length > 1 ? String(qi + 1) : ''} solved={sol[qi]} onSolved={onSolved(qi)} hasNext={pg < total - 1} />}
      {isEx && <ReviewPage item={p.item} />}
      {pg > 0 && <button type="button" className="nv-arrow nv-q-prev" onClick={() => setPg(pg - 1)} title="이전" aria-label="이전">‹</button>}
      {pg > 0 && pg < total - 1 && <button type="button" className="nv-arrow nv-q-next" disabled={!canNext} onClick={() => setPg(pg + 1)} title="다음" aria-label="다음">›</button>}
    </div>
  );
}
