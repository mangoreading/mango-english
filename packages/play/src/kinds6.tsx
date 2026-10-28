import { useEffect, useMemo, useRef, useState } from 'react';
import { Fb } from './fb';
import { imgSrc, sayThen, shuffle, voicePitch, type KindProps } from './common';

interface Sc { who?: string; en: string; ko?: string; pic?: string }
interface Q { q: string; ans: string; wrong: string[] }

/** 장면 영상: 그림·대사가 이어지는 짧은 장면을 보고 듣는다. 확인 문항이 있으면 다 본 뒤 이어서 푼다. */
export function SceneStory({ item, pic, onDone }: KindProps) {
  const scenes: Sc[] = item.scenes ?? []; const qs: Q[] = item.qs ?? []; const max: number = item.replay ?? 2;
  const [phase, setPhase] = useState<'ready' | 'play' | 'after'>('ready');
  const [idx, setIdx] = useState(0); const [plays, setPlays] = useState(0); const [cc, setCc] = useState(item.sub !== 'none');
  const run = useRef(0); const fired = useRef(false);
  const [qi, setQi] = useState(0); const [res, setRes] = useState<boolean[]>([]); const wrong = useRef(false); const [bad, setBad] = useState<number | null>(null); const [okq, setOkq] = useState(false);
  const opts = useMemo(() => (qs[qi] ? shuffle([{ t: qs[qi].ans, c: true }, ...qs[qi].wrong.map((t) => ({ t, c: false }))]) : []), [qi]); // eslint-disable-line
  useEffect(() => () => { run.current++; try { speechSynthesis.cancel(); } catch { /* 소리가 안 되는 환경 */ } }, []);
  useEffect(() => { if (phase === 'after' && !qs.length && !fired.current) { fired.current = true; onDone([]); } /* eslint-disable-next-line */ }, [phase]);
  const src = (k?: string) => (k ? (/^https?:|^word\//.test(k) ? imgSrc(k) : imgSrc(pic(k))) : '');
  function step(i: number, id: number) {
    if (id !== run.current) return;
    if (i >= scenes.length) { setPhase('after'); return; }
    setIdx(i);
    sayThen(scenes[i].en, () => setTimeout(() => step(i + 1, id), 450), voicePitch(scenes[i].who));
  }
  function start() { const id = ++run.current; setPlays((n) => n + 1); setIdx(0); setPhase('play'); step(0, id); }
  function choose(i: number) {
    if (okq) return;
    if (opts[i].c) {
      setOkq(true);
      const r = [...res, !wrong.current];
      setTimeout(() => { if (qi + 1 >= qs.length) { if (!fired.current) { fired.current = true; onDone(r.map((ok) => ({ tag: 'listen', ok }))); } setRes(r); setOkq(true); } else { setRes(r); setQi(qi + 1); setOkq(false); wrong.current = false; } }, 700);
    } else { wrong.current = true; setBad(i); setTimeout(() => setBad(null), 500); }
  }
  const sc = scenes[Math.min(idx, scenes.length - 1)]; const img = src(sc?.pic) || src(scenes.find((s) => s.pic)?.pic);
  const left = Math.max(0, max + 1 - plays); const quiz = phase === 'after' && qs.length > 0;
  return (
    <div className="nv-body nv-scene">
      {!quiz && (
        <div className="nv-stage">
          {img ? <img className="nv-stage-img" src={img} alt="" draggable={false} /> : <div className="nv-stage-img nv-stage-ph" />}
          {phase === 'play' && sc.who && <span className="nv-who">{sc.who}</span>}
          {phase === 'ready' && <button type="button" className="nv-stage-go" onClick={start} aria-label="영상 보기"><i>▶</i><b>장면 보기</b></button>}
          {phase !== 'ready' && cc && item.sub !== 'none' && (
            <div className="nv-subs">{phase === 'play' ? <><p>{sc.en}</p>{item.sub === 'enko' && sc.ko && <small>{sc.ko}</small>}</> : <p className="nv-subs-end">끝났어요</p>}</div>
          )}
          {phase !== 'ready' && <div className="nv-bar"><i style={{ width: `${phase === 'after' ? 100 : ((idx + 1) / scenes.length) * 100}%` }} /></div>}
        </div>
      )}
      {quiz && qs[qi] && (
        <div className="nv-sq">
          <p className="nv-qt">Q{qs.length > 1 ? qi + 1 : ''}. {qs[qi].q}</p>
          <div className="nv-list nv-list-s">{opts.map((o, i) => <button key={i} className={'nv-opt' + (okq && o.c ? ' nv-right' : bad === i ? ' nv-wrong nv-shake' : '')} onClick={() => choose(i)}>{o.t}</button>)}</div>
          <Fb className={'nv-fbmsg' + (okq ? ' on' : '')}>{okq ? '정답이에요! 👏' : ''}</Fb>
        </div>
      )}
      {phase !== 'ready' && (
        <div className="nv-ptools">
          {item.sub !== 'none' && !quiz && <button className="nv-hintbtn" onClick={() => setCc(!cc)}>{cc ? '자막 끄기' : '자막 켜기'}</button>}
          <button className="nv-hintbtn" disabled={phase === 'play' || !left} onClick={start}>다시 보기{phase === 'play' ? '' : ` (${left}회 남음)`}</button>
        </div>
      )}
    </div>
  );
}
