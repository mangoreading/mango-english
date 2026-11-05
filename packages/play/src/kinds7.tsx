import { useEffect, useRef, useState } from 'react';
import { useCardProgress } from './fb';
import { Rich } from './kinds3';
import { imgSrc, say, sayScript, stopSeq, type KindProps } from './common';

interface Slide { head: string; text?: string[]; pic?: string; cards?: string[]; formula?: string[]; table?: string[]; tip?: string }
const plain = (t: string) => t.replace(/\[\[|\]\]|\{\{|\}\}/g, '');
const cells = (l: string) => l.split('|').map((c) => c.trim());

/** 강의 슬라이드: 이번 Lesson 의 표현·문법을 강의처럼 한 장씩 넘기며 설명한다. 마지막 슬라이드까지 보면 다음 활동으로 넘어갈 수 있다. */
export function Lecture({ item, pic, onDone }: KindProps) {
  const slides: Slide[] = item.slides ?? [];
  const [i, setI] = useState(0); const [cur, setCur] = useState<string | null>(null); const fired = useRef(false);
  useCardProgress(slides.length, i);
  useEffect(() => { if (slides.length && i >= slides.length - 1 && !fired.current) { fired.current = true; onDone([]); } /* eslint-disable-next-line */ }, [i]);
  useEffect(() => () => { try { speechSynthesis.cancel(); } catch { /* 소리가 안 되는 환경 */ } }, []);
  const s = slides[Math.min(i, slides.length - 1)]; if (!s) return null;
  const src = (k?: string) => (k ? (/^https?:|^word\//.test(k) ? imgSrc(k) : imgSrc(pic(k))) : '');
  const img = src(s.pic);
  const hear = (t: string) => { setCur(t); say(plain(t)); };
  return (
    <div className="nv-body nv-lec">
      <div className="nv-row nv-lec-row">
        <button type="button" className="nv-arrow" disabled={i === 0} onClick={() => { setI(i - 1); setCur(null); }} aria-label="이전">‹</button>
      <div className="nv-lec-stage">
        {img && <div className="nv-lec-pic"><img src={img} alt="" draggable={false} /></div>}
        <div className="nv-lec-main">
          <p className="nv-lec-no">{item.title ? item.title + ' · ' : ''}{i + 1} / {slides.length}</p>
          <h2 className="nv-lec-h"><Rich text={s.head} /></h2>
          {!!s.text?.length && <div className="nv-lec-txt">{s.text.map((l, k) => <p key={k}><Rich text={l} /></p>)}</div>}
          {!!s.cards?.length && (
            <div className="nv-lec-cards">
              {s.cards.map((c, k) => { const [en, ko, label] = cells(c); return (
                <button key={k} type="button" className={'nv-lec-card' + (cur === en ? ' nv-cur' : '')} onClick={() => hear(en)}>
                  {label && <small>{label}</small>}
                  <b><Rich text={en} /></b>{ko && <i>{ko}</i>}<span className="nv-sp" aria-hidden><i className="nv-sico" aria-hidden="true" /></span>
                </button>); })}
            </div>
          )}
          {!!s.formula?.length && (
            <div className="nv-lec-fm">{s.formula.map((l, k) => (
              <div key={k} className="nv-lec-fmrow">{l.split('+').map((part, j) => <span key={j} className="nv-lec-fmp">{j > 0 && <em>+</em>}<span className="nv-lec-chip"><Rich text={part.trim()} /></span></span>)}</div>
            ))}</div>
          )}
          {!!s.table?.length && (
            <table className="nv-lec-tb"><thead><tr>{cells(s.table[0]).map((c, k) => <th key={k}><Rich text={c} /></th>)}</tr></thead>
              <tbody>{s.table.slice(1).map((r, k) => <tr key={k}>{cells(r).map((c, j) => <td key={j}><Rich text={c} /></td>)}</tr>)}</tbody></table>
          )}
          {s.tip && <p className="nv-lec-tip"><b>알아 두기</b><span><Rich text={s.tip} /></span></p>}
        </div>
      </div>
        <button type="button" className="nv-arrow" disabled={i >= slides.length - 1} onClick={() => { setI(i + 1); setCur(null); }} aria-label="다음">›</button>
      </div>
    </div>
  );
}

interface WCard { word: string; sent: string; ko?: string; pic?: string }
const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** 문장 안의 단어를 빨강으로 표시한다(대소문자 무시, 복수형 등은 단어 앞부분이 같으면 함께) */
function Marked({ sent, word }: { sent: string; word: string }) {
  const m = word.trim() ? sent.match(new RegExp('\\b' + esc(word.trim()) + '\\w*', 'i')) : null;
  if (!m || m.index == null) return <>{sent}</>;
  return <>{sent.slice(0, m.index)}<span className="nv-ws-hl">{m[0]}</span>{sent.slice(m.index + m[0].length)}</>;
}

/** 단어·문장 듣고 따라 말하기: 카드가 열리면 단어를 두 번, 이어서 그 단어가 들어간 문장을 읽어 준다. 카드를 누르면 다시 들려준다. */
export function WordSent({ item, pic, onDone }: KindProps) {
  const cards: WCard[] = item.cards ?? [];
  const [i, setI] = useState(0); const [seen, setSeen] = useState<Set<number>>(new Set([0])); const fired = useRef(false);
  useCardProgress(cards.length, i);
  const c = cards[Math.min(i, cards.length - 1)];
  const play = () => { if (c) sayScript(`${c.word}\n${c.word}\n${c.sent}`); };
  useEffect(() => { play(); /* 카드가 열리면 자동으로 들려준다 */ }, [i]); // eslint-disable-line
  useEffect(() => () => { stopSeq(); }, []);
  useEffect(() => { if (!fired.current && cards.length && seen.size === cards.length) { fired.current = true; onDone([]); } /* eslint-disable-next-line */ }, [seen]);
  const go = (n: number) => { if (n >= 0 && n < cards.length) { setI(n); setSeen(new Set(seen).add(n)); } };
  if (!c) return null;
  const k = c.pic; const img = k ? (/^https?:|^word\//.test(k) ? imgSrc(k) : imgSrc(pic(k))) : '';
  return (
    <div className="nv-body nv-ws">
      <div className="nv-row nv-lec-row">
        <button type="button" className="nv-arrow" disabled={i === 0} onClick={() => go(i - 1)} aria-label="이전">‹</button>
        <button type="button" className="nv-ws-card" onClick={play} aria-label="다시 듣기">
          {img ? <img className="nv-ws-img" src={img} alt="" draggable={false} /> : <span className="nv-ws-img" />}
          <span className="nv-ws-sent"><span><Marked sent={c.sent} word={c.word} /></span>{c.ko && <small>{c.ko}</small>}</span>
        </button>
        <button type="button" className="nv-arrow" disabled={i === cards.length - 1} onClick={() => go(i + 1)} aria-label="다음">›</button>
      </div>
    </div>
  );
}

const NUMW = ['One', 'Two', 'Three', 'Four'];
/** 듣고 번호 고르기: 질문과 선택지를 모두 소리로만 들려주고 번호 버튼으로 고른다. 정답을 맞히면 들은 내용을 스크립트로 보여 준다. */
export function LNum({ item, pic, onDone }: KindProps) {
  const opts: string[] = item.opts ?? []; const ans: number = Math.min(Math.max(1, item.ans ?? 1), Math.max(1, opts.length)) - 1; const total: number = item.plays ?? 2;
  const q: string = item.q ?? '';
  const [used, setUsed] = useState(0); const [playing, setPlaying] = useState(false); const [prog, setProg] = useState(0);
  const [bad, setBad] = useState<number | null>(null); const [ok, setOk] = useState(false); const wrong = useRef(false); const fired = useRef(false);
  const pk: string | undefined = item.pic; const img = pk ? (/^https?:|^word\/|^scene\//.test(pk) ? imgSrc(pk) : imgSrc(pic(pk))) : '';
  const script = [q, ...opts.map((o, i) => `${NUMW[i]}. ${o}`)].join('\n');
  const est = Math.max(4, Math.round(script.split(/\s+/).length * 0.55 + opts.length * 0.9));
  function play() {
    if (playing || used >= total || ok) return;
    setUsed(used + 1); setPlaying(true); setProg(0); requestAnimationFrame(() => requestAnimationFrame(() => setProg(1)));
    sayScript(script, () => { setPlaying(false); setProg(1); });
  }
  useEffect(() => { play(); /* 열리면 한 번 자동으로 들려준다 */ }, []); // eslint-disable-line
  useEffect(() => () => { stopSeq(); }, []);
  function pick(i: number) {
    if (ok || playing) return;
    if (i === ans) { setOk(true); if (!fired.current) { fired.current = true; onDone([{ tag: 'listen', ok: !wrong.current }]); } }
    else { wrong.current = true; setBad(i); setTimeout(() => setBad(null), 500); }
  }
  const left = Math.max(0, total - used);
  return (
    <div className="nv-body nv-ln">
      <div className="nv-ln-player">
        <button type="button" className="nv-ln-play" disabled={playing || left === 0 || ok} onClick={play} aria-label="듣기">{playing ? '❚❚' : '▶'}</button>
        <span className="nv-ln-bar"><i key={used + (playing ? 'p' : 'd')} style={{ width: prog ? '100%' : '0%', transitionDuration: playing ? `${est}s` : '0s' }} /></span>
        <span className="nv-ln-left">{ok ? '' : `남은 횟수 ${left}`}</span>
      </div>
      {img && <img className="nv-ln-img" src={img} alt="" draggable={false} />}
      <div className="nv-ln-nums">
        {opts.map((_, i) => <button key={i} type="button" className={'nv-ln-num' + (ok && i === ans ? ' nv-right' : bad === i ? ' nv-wrong nv-shake' : '')} disabled={playing && !ok} onClick={() => pick(i)}>{i + 1}</button>)}
      </div>
      {ok && (
        <div className="nv-ln-script"><b>스크립트</b>
          <p>{q}</p>
          {opts.map((o, i) => <p key={i} className={i === ans ? 'ans' : ''}>{i + 1}. {o}</p>)}
        </div>
      )}
      {!ok && <p className="nv-hint">잘 듣고 알맞은 번호를 눌러 보세요{left === 0 ? ' · 더 들을 수 없어요' : ''}</p>}
    </div>
  );
}
