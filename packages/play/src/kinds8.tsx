import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { Fb, useCardProgress } from './fb';
import { Rich } from './kinds3';
import { shuffle, stopSeq, type KindProps } from './common';
import { Story } from './kinds2';
import { Hint } from './hint';
import { ReviewPanel, type RvRow } from './review';

/** 본문 세트의 확인 문항: t 가 'tf' 면 문장 1~3개에 T/F 를 고르는 한 문제, 아니면 3~4지 선다(정답 1 + 오답 1~3) */
export interface SetQ { t?: 'mc' | 'tf' | 'multi'; q?: string; ans?: string; wrong?: string[]; fb?: string; lines?: string[] }

/** T/F 한 문제: 문장 최대 3개(ⓐⓑⓒ)를 보고 각각 T 또는 F 를 고른다. 모두 고른 뒤에야 한꺼번에 정·오답을 알려 준다(찍기 방지).
 *  틀린 문장만 빨갛게 표시했다가 다시 고르게 하고, 맞힌 문장은 잠근다. 모두 맞히면 onFinish(처음 판정에서 모두 맞혔는지) */
export function TfBlock({ q, no, onFinish, done }: { q: SetQ; no: string; onFinish: (firstTry: boolean, wrongRows?: number[]) => void; done?: boolean }) {
  const rows = (q.lines ?? []).slice(0, 6).map((l) => { const m = l.match(/^(.*)\|\s*([TFtf])\s*$/); return { t: (m ? m[1] : l).trim(), a: m ? m[2].toUpperCase() === 'T' : true }; });
  const [pick, setPick] = useState<Record<number, boolean>>(() => (done ? Object.fromEntries(rows.map((r, i) => [i, r.a])) : {}));
  const [locked, setLocked] = useState<number[]>(() => (done ? rows.map((_, i) => i) : [])); const [bad, setBad] = useState<number[]>([]); const [ok, setOk] = useState(!!done);
  const first = useRef(true); const wrongAll = useRef<Set<number>>(new Set());
  function choose(i: number, v: boolean) {
    if (ok || bad.length || locked.includes(i)) return;
    const n = { ...pick, [i]: v }; setPick(n);
    if (!rows.every((_, k) => n[k] != null)) return;
    const wr = rows.map((r, k) => (n[k] === r.a ? -1 : k)).filter((k) => k >= 0);
    if (!wr.length) { setLocked(rows.map((_, k) => k)); setOk(true); onFinish(first.current, [...wrongAll.current]); return; }
    first.current = false; wr.forEach((k) => wrongAll.current.add(k)); setBad(wr); setLocked(rows.map((_, k) => k).filter((k) => !wr.includes(k)));
    setTimeout(() => { setPick((p) => { const m = { ...p }; wr.forEach((k) => delete m[k]); return m; }); setBad([]); }, 1200);
  }
  const mark = (i: number) => String.fromCharCode(9424 + i);
  const cls = (i: number, v: boolean) => (locked.includes(i) ? (pick[i] === v ? ' nv-right' : '') : bad.includes(i) && pick[i] === v ? ' nv-wrong nv-shake' : pick[i] === v ? ' nv-on' : '');
  return (
    <div className="nv-sq">
      <p className="nv-qt">Q{no}. {q.q || '글의 내용과 일치하면 T, 아니면 F를 선택하세요.'}</p>
      <div className="nv-tfl">{rows.map((r, i) => (
        <div key={i} className="nv-tfr"><span>{mark(i)} {r.t}</span>
          {[true, false].map((v) => <button key={String(v)} className={'nv-tfb' + cls(i, v)} onClick={() => choose(i, v)}>{v ? 'T' : 'F'}</button>)}
        </div>))}</div>
      {bad.length > 0 ? <Fb className="nv-fbmsg on nv-fbbad">{bad.length === 1 ? '틀린 문장이 1개 있어요. 다시 골라 보세요.' : `틀린 문장이 ${bad.length}개 있어요. 다시 골라 보세요.`}</Fb> : <Fb className={'nv-fbmsg' + (ok ? ' on' : '')}>{ok ? '정답이에요! 👏' : ''}</Fb>}
    </div>
  );
}

/** 해석과 해설 쪽: Scene story 의 "해석과 해설" 과 같은 모양. 영어 문장(굵게)과 한글 해석, 그리고 해설 상자 */
function ReviewPage({ item }: { item: Record<string, any> }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const text: string[] = item.text ?? [];
  const clean = (l: string) => l.replace(/\[\[|\]\]|\{\{|\}\}/g, '');
  let rows: RvRow[];
  if (item.k === 'pread') {
    const pages: string[][] = text.reduce<string[][]>((a, l) => { if (l.trim() === '---') a.push([]); else a[a.length - 1].push(l); return a; }, [[]]).filter((g) => g.length);
    const kos: string[] = item.ko ? String(item.ko).split(/\n-{3,}\n/) : [];
    rows = pages.map((g, pi) => ({ who: pages.length > 1 ? pi + 1 : '', lines: g.map((l) => <Rich text={l} />), ko: kos[pi] }));
  } else {
    const kos: string[] = item.ko ? String(item.ko).split('\n') : [];
    rows = text.map((l, i) => ({ lines: [<Rich text={l} />], ko: kos[i] }));
  }
  return <ReviewPanel rows={rows} speak={text.filter((l) => l.trim() !== '---').map(clean)} explain={item.explain} />;
}

/** 확인 문항 한 쪽: 이미 푼 문항으로 돌아오면 정답이 채워진 상태로 보여 준다 */
function QPage({ q, no, solved, onSolved, hasNext }: { q: SetQ; no: string; solved: boolean | undefined; onSolved: (firstTry: boolean) => void; hasNext: boolean }) {
  const [ok, setOk] = useState(solved !== undefined); const [bad, setBad] = useState<number | null>(null); const wrong = useRef(false);
  const [sel, setSel] = useState<Set<number>>(new Set()); const [shake, setShake] = useState(false);
  const opts = useMemo(() => (q.t === 'tf' ? [] : shuffle([...(q.t === 'multi' ? (q.ans ?? '').split('|').map((t) => t.trim()).filter(Boolean) : [q.ans ?? '']).map((t) => ({ t, c: true })), ...(q.wrong ?? []).map((t) => ({ t, c: false }))])), []); // eslint-disable-line
  function choose(i: number) {
    if (ok) return;
    if (q.t === 'multi') { // 복수선택: 정답 개수만큼 고르면 판정, 틀리면 선택이 풀린다
      const n = new Set(sel); if (n.has(i)) n.delete(i); else n.add(i); setSel(n);
      if (n.size === opts.filter((o) => o.c).length) {
        if (opts.every((o, k) => o.c === n.has(k))) { setOk(true); onSolved(!wrong.current); }
        else { wrong.current = true; setShake(true); setTimeout(() => { setShake(false); setSel(new Set()); }, 600); }
      }
      return;
    }
    if (opts[i].c) { setOk(true); onSolved(!wrong.current); }
    else { wrong.current = true; setBad(i); setTimeout(() => setBad(null), 500); }
  }
  const msg = ok ? (hasNext ? '정답이에요! 오른쪽 ›를 눌러요 👏' : '정답이에요! 👏') : '';
  if (q.t === 'tf') return <TfBlock q={q} no={no} done={solved !== undefined} onFinish={(ft) => { setOk(true); onSolved(ft); }} />;
  return (
    <div className="nv-sq">
      <p className="nv-qt">Q{no}. {q.t === 'multi' ? '(알맞은 것을 모두 고르세요) ' : ''}{q.q}</p>
      <div className={'nv-list nv-list-s' + (shake ? ' nv-shake' : '')}>{opts.map((o, i) => <button key={i} className={'nv-opt' + (q.t === 'multi' ? ' nv-opt-l' : '') + (ok && o.c ? ' nv-right' : q.t === 'multi' && sel.has(i) ? ' nv-on' : bad === i ? ' nv-wrong nv-shake' : '')} onClick={() => choose(i)}>{o.t}</button>)}</div>
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
  useCardProgress(total, pg); // 위쪽 진행 동그라미: 본문·문항·해설 쪽수만큼
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

/** 글 읽고 답하기 (세트): 왼쪽에 본문(듣기)을 계속 보여 주고, 오른쪽에서 문항(최대 5개)을 푼다. 문항마다 선다·T/F·복수선택, Hint(누르면 근거 문장이 본문에서 노랗게 표시).
 *  다른 세트처럼 [<] [>] 로 쪽을 옮긴다(문항을 풀어야 [>] 가 열리고, [<] 는 언제나). 해석은 문항 뒤 "해석과 해설" 쪽에서 보여 준다. */
export function SqSet({ item, onDone }: KindProps) {
  const qs: (SetQ & { hint?: string; ev?: string })[] = (item.qs ?? []).slice(0, 5);
  const hasEx = !!(item.explain?.length || item.ko);
  const [pg, setPg] = useState(0); const [hl, setHl] = useState<number[]>([]); const [sol, setSol] = useState<(boolean | undefined)[]>(() => qs.map(() => undefined)); const fired = useRef(false);
  const total = qs.length + (hasEx ? 1 : 0); const isEx = hasEx && pg === qs.length;
  useEffect(() => { stopSeq(); setHl([]); }, [pg]);
  useEffect(() => { if (!fired.current && qs.length && sol.every((x) => x !== undefined)) { fired.current = true; onDone(sol.map((ok) => ({ tag: 'read', ok: !!ok }))); } /* eslint-disable-next-line */ }, [sol]);
  useCardProgress(total, pg);
  if (!qs.length) return null;
  const q = qs[Math.min(pg, qs.length - 1)];
  const ev = (q.ev ?? '').match(/\d+/g)?.map((n) => Number(n) - 1) ?? [];
  const hint = q.hint ? [q.hint] : ev.length ? ['본문에서 노란색으로 표시된 문장을 다시 읽어 보세요.'] : undefined;
  const canNext = pg < total - 1 && !isEx && sol[pg] !== undefined;
  const onSolved = (i: number) => (ft: boolean) => setSol((a) => { const b = [...a]; if (b[i] === undefined) b[i] = ft; return b; });
  return (
    <div className={'nv-body nv-setroot nv-sqroot ' + (isEx ? 'nv-wbody nv-wtop nv-sqrev' : 'nv-bodyw')}>
      {isEx ? <ReviewPage item={item} /> : (
        <Story item={item} noKo hl={hl} side={<>
          <QPage key={pg} q={q} no={qs.length > 1 ? String(pg + 1) : ''} solved={sol[pg]} onSolved={onSolved(pg)} hasNext={pg < total - 1} />
          <div className="nv-sqhint"><Hint key={'h' + pg} lines={hint} kind="sqset" item={{ ...item, q: q.q ?? q.lines?.join(' / ') }} onOpen={() => setHl(ev)} /></div>
        </>} />
      )}
      {pg > 0 && <button type="button" className="nv-arrow nv-q-prev" onClick={() => setPg(pg - 1)} title="이전" aria-label="이전">‹</button>}
      {pg < total - 1 && <button type="button" className="nv-arrow nv-q-next" disabled={!canNext} onClick={() => setPg(pg + 1)} title="다음" aria-label="다음">›</button>}
    </div>
  );
}

/** 글 읽고 답하기 (T/F) (옛 템플릿, 목록에서는 숨김): 문장 여러 개를 모두 고른 뒤 한꺼번에 판정한다 */
export function SqTF({ item, onDone }: KindProps) {
  const rows: { t: string; a?: boolean }[] = item.items ?? [];
  const q: SetQ = { t: 'tf', q: item.q ? String(item.q).replace(/^Q\d*\.\s*/, '') : undefined, lines: rows.map((r) => `${r.t} | ${r.a ? 'T' : 'F'}`) };
  return <div className="nv-body nv-bodyw"><Story item={item} side={<>
    <TfBlock q={q} no="" onFinish={(_, wr) => onDone(rows.map((_r, i) => ({ tag: 'read', ok: !(wr ?? []).includes(i) })))} />
    <Hint lines={item.hint} kind={item.k} item={item} />
  </>} /></div>;
}
