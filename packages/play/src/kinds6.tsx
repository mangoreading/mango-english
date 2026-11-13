import { useEffect, useMemo, useRef, useState } from 'react';
import { Fb } from './fb';
import { Rich } from './kinds3';
import { TfBlock, type SetQ } from './kinds8';
import { imgSrc, prefetchSay, sayScript, shuffle, stopSeq, type KindProps } from './common';

interface Sc { who?: string; en: string; ko?: string; pic?: string }
type Q = SetQ

/** 장면 영상: 그림·대사가 이어지는 짧은 장면을 보고 듣는다. 확인 문항이 있으면 다 본 뒤 이어서 푼다. */
export function SceneStory({ item, pic, onDone }: KindProps) {
  const scenes: Sc[] = item.scenes ?? []; const qs: Q[] = item.qs ?? []; const max: number = item.replay ?? 2;
  const [phase, setPhase] = useState<'ready' | 'play' | 'after' | 'review'>('ready');
  const hasReview = item.review !== false && (!!item.explain?.length || scenes.some((s) => s.ko));
  const [idx, setIdx] = useState(0); const [paused, setPaused] = useState(false); const [plays, setPlays] = useState(0); const [cc, setCc] = useState(item.sub !== 'none');
  const run = useRef(0); const fired = useRef(false);
  const [back, setBack] = useState<'video' | 'quiz' | 'review' | 'shadow' | null>(null); const [maxPg, setMaxPg] = useState(0); // 이전 버튼으로 돌아가 보는 화면 / 지금까지 도달한 가장 먼 화면
  const [qi, setQi] = useState(0); const [res, setRes] = useState<boolean[]>([]); const wrong = useRef(false); const [bad, setBad] = useState<number | null>(null); const [okq, setOkq] = useState(false); const [qDone, setQDone] = useState(false);
  const opts = useMemo(() => (!qs[qi] || qs[qi].t === 'tf' ? [] : shuffle([{ t: qs[qi].ans ?? '', c: true }, ...(qs[qi].wrong ?? []).map((t) => ({ t, c: false }))])), [qi]); // eslint-disable-line
  useEffect(() => () => { run.current++; stopSeq(); }, []);
  useEffect(() => { if (phase === 'after' && !qs.length && !fired.current) { fired.current = true; onDone([]); } /* eslint-disable-next-line */ }, [phase]);
  const src = (k?: string) => (k ? (/^https?:|^word\/|^scene\//.test(k) ? imgSrc(k) : imgSrc(pic(k))) : '');
  function step(i: number, id: number) {
    if (id !== run.current) return;
    if (i >= scenes.length) { setPhase('after'); return; }
    setIdx(i);
    const line = (k: number) => (scenes[k].who ? `${scenes[k].who}: ${scenes[k].en}` : scenes[k].en);
    if (i + 1 < scenes.length) prefetchSay(line(i + 1));
    sayScript(line(i), () => { if (id === run.current) setTimeout(() => step(i + 1, id), 450); }); // 화자별 Azure 음성, 안 되면 브라우저 음성
  }
  function start() { setBack(null); const id = ++run.current; setPlays((n) => n + 1); setIdx(0); setPaused(false); setPhase('play'); step(0, id); }
  /** 멈춤: 읽던 소리를 끊고 지금 대사에서 멈춘다. 계속 보기는 그 대사를 처음부터 다시 읽으며 이어 간다. */
  function pause() { run.current++; setPaused(true); stopSeq(); }
  function resume() { const id = ++run.current; setPaused(false); step(idx, id); }
  /** 진행 막대의 한 지점을 눌러 그 장면으로 이동한다. 재생 중이면 그 장면부터 이어서 읽고, 멈춤 상태면 장면만 바꿔 멈춰 둔다. */
  function seek(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    if (phase !== 'play') return;
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.max(0, Math.min(scenes.length - 1, Math.floor(((e.clientX - r.left) / r.width) * scenes.length)));
    const id = ++run.current; stopSeq(); setIdx(i);
    if (!paused) step(i, id);
  }
  /** 문항을 맞힘: 마지막이면 바로 이어가고, 아니면 [>] 를 눌러야 다음 문항으로 간다 */
  const firstTry = useRef(true);
  function finishQ(ft: boolean) {
    firstTry.current = ft; setOkq(true);
    if (qi + 1 >= qs.length) { const r = [...res, ft]; setRes(r); setQDone(true); if (!fired.current) { fired.current = true; onDone(r.map((ok) => ({ tag: 'listen', ok }))); } }
  }
  function nextQ() { setRes([...res, firstTry.current]); setQi(qi + 1); setOkq(false); wrong.current = false; firstTry.current = true; }
  function choose(i: number) {
    if (okq) return;
    if (opts[i].c) finishQ(!wrong.current);
    else { wrong.current = true; setBad(i); setTimeout(() => setBad(null), 500); }
  }
  const sc = scenes[Math.min(idx, scenes.length - 1)]; const img = src(sc?.pic) || src(scenes.find((s) => s.pic)?.pic);
  const left = Math.max(0, max + 1 - plays);
  const natural: 'video' | 'quiz' | 'review' = 'video'; // 영상이 끝나도 저절로 넘어가지 않는다 — 오른쪽 [>] 를 눌러야 문제로 간다
  const view = back ?? natural; const quiz = view === 'quiz' && qs.length > 0; const review = view === 'review';
  const qPend = quiz && okq && qi + 1 < qs.length; // 문항을 맞혔고 다음 문항이 남음 → 오른쪽 [>] 로 이동
  const hasShadow = item.k === 'scenerep' && scenes.length > 0;
  const pages: ('video' | 'quiz' | 'review' | 'shadow')[] = ['video', ...(qs.length ? ['quiz' as const] : []), ...(hasReview ? ['review' as const] : []), ...(hasShadow ? ['shadow' as const] : [])];
  const shadow = view === 'shadow';
  const cur = Math.max(0, pages.indexOf(view));
  // 영상을 다 보면 문제(또는 해설)로, 문제를 모두 풀면 해설로 [>] 가 열린다. 문제와 해설까지 끝낸 뒤(또는 영상만 보고 끝난 뒤)에는 마지막의 '문장 따라 말해보기'로 갈 수 있다
  const finished = phase === 'after' && (!qs.length || qDone);
  const iq = pages.indexOf('quiz'); const ir = pages.indexOf('review'); const isx = pages.indexOf('shadow');
  let lim = 0; if (phase === 'after') lim = Math.min(1, pages.length - 1);
  if (qs.length && qDone) lim = ir >= 0 ? ir : isx >= 0 ? isx : Math.max(iq, 0);
  if (hasShadow && finished) lim = pages.length - 1;
  const reach = Math.max(maxPg, lim);
  useEffect(() => { setMaxPg((m) => Math.max(m, lim)); }, [lim]); // eslint-disable-line
  /** 화면 이동: 이전은 언제나, 다음은 이미 거친 화면까지만(영상을 끝까지 보기 전에 문제로 건너뛰지 못하게) */
  function goPage(n: number) {
    if (n < 0 || n >= pages.length || n > reach) return;
    if (phase === 'play') return;
    const t = pages[n]; setBack(t === natural ? null : t);
  }
  return (
    <div className="nv-body nv-scene">
      <div className="nv-row nv-lec-row">
        <button className="nv-arrow" disabled={cur === 0 || phase === 'play'} onClick={() => goPage(cur - 1)} aria-label="이전">‹</button>
        <div className="nv-scene-main">
          {!quiz && !review && !shadow && (
            <div className="nv-stage" onClick={phase === 'play' ? () => (paused ? resume() : pause()) : undefined} style={phase === 'play' ? { cursor: 'pointer' } : undefined}>
              {img ? <img className="nv-stage-img" src={img} alt="" draggable={false} /> : <div className="nv-stage-img nv-stage-ph" />}
              {phase === 'play' && sc.who && <span className="nv-who">{sc.who}</span>}
              {phase === 'play' && paused && <button type="button" className="nv-stage-go" onClick={(e) => { e.stopPropagation(); resume(); }} aria-label="계속 보기"><i>▶</i></button>}
              {phase === 'ready' && <button type="button" className="nv-stage-go" onClick={start} aria-label="영상 보기"><i>▶</i><b>장면 보기</b></button>}
              {phase !== 'ready' && cc && item.sub !== 'none' && (
                <div className="nv-subs">{phase === 'play' ? <><p>{sc.en}</p>{item.sub === 'enko' && sc.ko && <small>{sc.ko}</small>}</> : <p className="nv-subs-end">끝났어요</p>}</div>
              )}
              {phase !== 'ready' && <div className={'nv-bar' + (phase === 'play' ? ' seek' : '')} onClick={phase === 'play' ? seek : undefined} role={phase === 'play' ? 'slider' : undefined} aria-label="장면 이동"><i style={{ width: `${phase === 'after' ? 100 : ((idx + 1) / scenes.length) * 100}%` }} /></div>}
            </div>
          )}
          {review && (
            <div className="nv-rv">
              <p className="nv-rv-t">해석과 해설</p>
              <div className="nv-rv-list">{scenes.map((x, i) => (
                <div key={i} className="nv-rv-row"><span className="nv-rv-who">{x.who}</span><div><b>{x.en}</b>{x.ko && <small>{x.ko}</small>}</div></div>
              ))}</div>
              {!!item.explain?.length && <div className="nv-rv-ex">{item.explain.map((l: string, i: number) => <p key={i}><Rich text={l} /></p>)}</div>}
            </div>
          )}
          {shadow && <ShadowSay scenes={scenes} src={src} />}
          {quiz && qs[qi] && (
            qs[qi].t === 'tf' ? <TfBlock key={qi + (okq ? 's' : '')} q={qs[qi]} no={qs.length > 1 ? String(qi + 1) : ''} onFinish={finishQ} done={okq} /> : <div className="nv-sq">
              <p className="nv-qt">Q{qs.length > 1 ? qi + 1 : ''}. {qs[qi].q}</p>
              <div className="nv-list nv-list-s">{opts.map((o, i) => <button key={i} className={'nv-opt' + (okq && o.c ? ' nv-right' : bad === i ? ' nv-wrong nv-shake' : '')} onClick={() => choose(i)}>{o.t}</button>)}</div>
              <Fb className={'nv-fbmsg' + (okq ? ' on' : '')}>{okq ? '정답이에요! 👏' : ''}</Fb>
            </div>
          )}
        </div>
        <button className="nv-arrow" disabled={qPend ? false : cur >= pages.length - 1 || cur + 1 > reach || phase === 'play'} onClick={() => (qPend ? nextQ() : goPage(cur + 1))} title={qPend ? '다음 문제' : undefined} aria-label={qPend ? '다음 문제' : '다음'}>›</button>
      </div>
      {!shadow && (
        <div className="nv-ptools nv-scene-tools" style={phase === 'ready' || quiz || review ? { visibility: 'hidden' } : undefined}>
          {item.sub !== 'none' && <button className="nv-hintbtn" onClick={() => setCc(!cc)}>{cc ? '자막 끄기' : '자막 켜기'}</button>}
          <button className="nv-hintbtn" disabled={phase === 'play' || !left} onClick={start}>다시 보기{phase === 'play' ? '' : ` (${left}회 남음)`}</button>
        </div>
      )}
    </div>
  );
}

/** 문장 따라 말해보기: 장면 대사를 한 문장씩 들려주고, 소리 내어 따라 말해 보게 한다(선택 단계). 들려주기 → 따라 말하기 → 다음 문장 */
function ShadowSay({ scenes, src }: { scenes: Sc[]; src: (k?: string) => string }) {
  const [i, setI] = useState(0); const sc = scenes[Math.min(i, scenes.length - 1)];
  const hear = () => sayScript(sc.who ? `${sc.who}: ${sc.en}` : sc.en);
  useEffect(() => { hear(); return () => { stopSeq(); }; }, [i]); // eslint-disable-line
  const img = src(sc.pic) || src(scenes.find((s) => s.pic)?.pic);
  return (
    <div className="nv-shadow">
      <p className="nv-shadow-t">문장을 듣고 소리 내어 따라 말해 보세요.</p>
      <div className="nv-shadow-pic">{img ? <img src={img} alt="" draggable={false} /> : <i />}</div>
      <button type="button" className="nv-shadow-line" onClick={hear} aria-label="다시 듣기">
        {sc.who && <span className="nv-shadow-who">{sc.who}</span>}
        <b>{sc.en}</b>{sc.ko && <small>{sc.ko}</small>}
      </button>
      <div className="nv-shadow-nav">
        <button type="button" className="nv-hintbtn" disabled={i === 0} onClick={() => setI(i - 1)}>이전 문장</button>
        <span>{i + 1} / {scenes.length}</span>
        <button type="button" className="nv-hintbtn" disabled={i >= scenes.length - 1} onClick={() => setI(i + 1)}>다음 문장</button>
      </div>
    </div>
  );
}
