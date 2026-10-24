import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { imgSrc, say, type KindProps } from './common';

/* ===== 2단계 템플릿: 듣고 익히기 · 따라 말하기 · 학습목표 · 문장 바꿔 말하기 · 글 듣고 읽기 · 모범 글 =====
   강조 표기: [[파랑]]  {{빨강}}  (문항 글 안에 그대로 쓴다) */
export function Rich({ text }: { text: string }) {
  const out: ReactNode[] = []; let k = 0;
  text.split(/(\[\[.*?\]\]|\{\{.*?\}\})/g).forEach((p) => {
    if (!p) return;
    if (p.startsWith('[[')) out.push(<span key={k++} className="nv-cb">{p.slice(2, -2)}</span>);
    else if (p.startsWith('{{')) out.push(<span key={k++} className="nv-cr">{p.slice(2, -2)}</span>);
    else out.push(p);
  });
  return <>{out}</>;
}
const plain = (t: string) => t.replace(/\[\[|\]\]|\{\{|\}\}/g, '');
const Spk = ({ on }: { on?: boolean }) => <span className={'nv-sp' + (on ? ' on' : '')} aria-hidden>🔊</span>;
const KoBtn = ({ on, set }: { on: boolean; set: (v: boolean) => void }) => <button type="button" className={'nv-kobtn' + (on ? ' on' : '')} onClick={() => set(!on)} aria-pressed={on} title="한글 뜻 보기/숨기기">한</button>;
type Ex = { en: string; ko?: string; pic?: string; label?: string };

/** 눌러서 듣는 카드 모음: kexp(말풍선) / tapl(문장 상자) / lsent(세로 카드) / lcardp(그림 카드) / lcardt(글 카드) */
function Tapper({ item, pic, onDone, mode }: KindProps & { mode: 'kexp' | 'tapl' | 'lsent' | 'lcardp' | 'lcardt' }) {
  const rows: Ex[] = item.items ?? [];
  const [heard, setHeard] = useState<Set<number>>(new Set()); const [cur, setCur] = useState<number | null>(null);
  const [ko, setKo] = useState(true); const fired = useRef(false); const seq = useRef(0);
  useEffect(() => { if (!fired.current && rows.length && heard.size === rows.length) { fired.current = true; onDone([]); } /* eslint-disable-next-line */ }, [heard]);
  const hear = (i: number) => { say(plain(rows[i].en)); setCur(i); setHeard((h) => new Set(h).add(i)); };
  function all() { // 전체 듣기: 차례로 읽어 준다
    const id = ++seq.current; let i = 0;
    const step = () => { if (id !== seq.current || i >= rows.length) return; hear(i); i++; setTimeout(step, 2600); };
    step();
  }
  const grid = mode === 'lcardp' || mode === 'lcardt';
  return (
    <div className="nv-body">
      <div className="nv-toolrow">
        {(mode === 'kexp' || mode === 'tapl') && <button type="button" className="nv-listen nv-listen-s" onClick={all}>🔊 <b>전체 듣기</b></button>}
        <KoBtn on={ko} set={setKo} />
      </div>
      <div className={grid ? 'nv-grid3' : 'nv-stack nv-stack-' + mode}>
        {rows.map((r, i) => (
          <button key={i} className={'nv-tap nv-tap-' + mode + (cur === i ? ' nv-cur' : '') + (heard.has(i) ? ' nv-heard2' : '')} onClick={() => hear(i)}>
            {mode === 'lcardp' && (pic(r.pic) ? <img className="nv-img" src={imgSrc(pic(r.pic))} alt="" draggable={false} /> : <div className="nv-img" />)}
            <span className="nv-tt"><b><Rich text={r.en} /></b>{r.ko && <i className={ko ? '' : 'nv-hid'}>{r.ko}</i>}</span>
            {mode !== 'lcardp' && mode !== 'lcardt' && <Spk on={cur === i} />}
            {mode === 'kexp' && r.label && <em className="nv-lab">{r.label}</em>}
          </button>
        ))}
      </div>
      <p className="nv-hint">눌러서 들어 보세요 ({heard.size}/{rows.length})</p>
    </div>
  );
}
export const KExp = (p: KindProps) => <Tapper {...p} mode="kexp" />;
export const TapL = (p: KindProps) => <Tapper {...p} mode="tapl" />;
export const LSent = (p: KindProps) => <Tapper {...p} mode="lsent" />;
export const LCardP = (p: KindProps) => <Tapper {...p} mode="lcardp" />;
export const LCardT = (p: KindProps) => <Tapper {...p} mode="lcardt" />;

/** 학습목표: 목표 문장 + 핵심 표현 */
export function Goal({ item, pic, onDone }: KindProps) {
  const ex: Ex[] = item.items ?? []; const [ko, setKo] = useState(true); const [cur, setCur] = useState<number | null>(null);
  useEffect(() => { onDone([]); /* eslint-disable-next-line */ }, []);
  return (
    <div className="nv-body nv-bodyw">
      <div className="nv-split">
        <div className="nv-goalL">
          {item.title && <h3><Rich text={item.title} /></h3>}
          {item.ko && <p className="nv-sub">{item.ko}</p>}
          {pic(item.pic) && <img className="nv-img nv-img-lg" src={imgSrc(pic(item.pic))} alt="" draggable={false} />}
        </div>
        <div className="nv-qpane">
          <div className="nv-toolrow"><span className="nv-qt">{item.head || '핵심 표현'}</span><KoBtn on={ko} set={setKo} /></div>
          {ex.map((r, i) => (
            <button key={i} className={'nv-tap nv-tap-kexp' + (cur === i ? ' nv-cur' : '')} onClick={() => { say(plain(r.en)); setCur(i); }}>
              <span className="nv-tt"><b><Rich text={r.en} /></b>{r.ko && <i className={ko ? '' : 'nv-hid'}>{r.ko}</i>}</span><Spk on={cur === i} />
            </button>))}
        </div>
      </div>
    </div>
  );
}

/** 단어 듣고 따라 말하기: 카드 한 장씩 넘기며 듣고 따라 말한다 */
export function WRepeat({ words, onDone }: KindProps) {
  const [i, setI] = useState(0); const [seen, setSeen] = useState<Set<number>>(new Set([0])); const [said, setSaid] = useState<Set<number>>(new Set());
  const fired = useRef(false); const w = words[i];
  useEffect(() => { if (!fired.current && said.size === words.length) { fired.current = true; onDone([]); } /* eslint-disable-next-line */ }, [said]);
  const go = (n: number) => { if (n >= 0 && n < words.length) { setI(n); setSeen(new Set(seen).add(n)); } };
  return (
    <div className="nv-body">
      <div className="nv-row">
        <button className="nv-arrow" disabled={i === 0} onClick={() => go(i - 1)} aria-label="이전">‹</button>
        <div className={'nv-big' + (said.has(i) ? ' nv-ok' : '')}>
          {w.image ? <img className="nv-img nv-img-lg" src={imgSrc(w.image)} alt="" draggable={false} /> : <div className="nv-img nv-img-lg" />}
          <b className="nv-word">{w.en}</b><span className="nv-ko">{w.ko}</span>
          <button className="nv-listen nv-listen-s" onClick={() => say(w.en)}>🔊 <b>듣기</b></button>
        </div>
        <button className="nv-arrow" disabled={i === words.length - 1} onClick={() => go(i + 1)} aria-label="다음">›</button>
      </div>
      <button className={'nv-btn' + (said.has(i) ? ' nv-ghost' : '')} onClick={() => setSaid(new Set(said).add(i))}>{said.has(i) ? '따라 말했어요 ✓' : '소리 내어 따라 말했어요'}</button>
      <p className="nv-hint">{i + 1} / {words.length} · 따라 말한 단어 {said.size}/{words.length}</p>
    </div>
  );
}

/** 문장 바꿔 말하기: 문장 안 빈칸에 단어를 바꿔 넣으며 반복해서 말한다. tpl 의 {} 가 빈칸 */
export function SDrill({ item, onDone }: KindProps) {
  const words: string[] = item.words ?? []; const tpl: string = item.tpl ?? '{}';
  const [cur, setCur] = useState<number | null>(null); const [tried, setTried] = useState<Set<number>>(new Set()); const fired = useRef(false);
  useEffect(() => { if (!fired.current && words.length && tried.size === words.length) { fired.current = true; onDone([]); } /* eslint-disable-next-line */ }, [tried]);
  const [a, b] = tpl.split('{}');
  const full = (w: string) => `${a}${w}${b ?? ''}`;
  return (
    <div className="nv-body">
      <div className="nv-capsule nv-capsule-n">{a}<span className="nv-slotw">{cur == null ? ' ' : words[cur]}</span>{b}</div>
      <button type="button" className="nv-listen nv-listen-s" disabled={cur == null} onClick={() => cur != null && say(full(words[cur]))}>🔊 <b>다시 듣기</b></button>
      <div className="nv-chips">
        {words.map((w, i) => <button key={i} className={'nv-chipb' + (cur === i ? ' nv-sel' : '') + (tried.has(i) ? ' nv-heard2' : '')} onClick={() => { setCur(i); setTried(new Set(tried).add(i)); say(full(w)); }}>{w}</button>)}
      </div>
      <p className="nv-hint">단어를 눌러 문장을 바꿔 말해 보세요 ({tried.size}/{words.length})</p>
    </div>
  );
}

/** 글 듣고 읽기: 쪽을 넘기며 듣고, 해설(한글)을 열어 본다 */
export function PRead({ item, onDone }: KindProps) {
  // 본문 줄 중 '---' 는 쪽 나눔 표시, 해설도 같은 방식
  const pages: string[][] = ((item.text ?? []) as string[]).reduce<string[][]>((a, l) => { if (l.trim() === '---') a.push([]); else a[a.length - 1].push(l); return a; }, [[]]).filter((g) => g.length);
  const kos: string[] = item.ko ? String(item.ko).split(/\n-{3,}\n/) : [];
  const [p, setP] = useState(0); const [seen, setSeen] = useState<Set<number>>(new Set()); const [ko, setKo] = useState(false); const fired = useRef(false);
  useEffect(() => { if (!fired.current && seen.size === pages.length) { fired.current = true; onDone([]); } /* eslint-disable-next-line */ }, [seen]);
  const heard = () => setSeen((s) => new Set(s).add(p));
  const go = (n: number) => { if (n >= 0 && n < pages.length) { setP(n); setKo(false); } };
  return (
    <div className="nv-body nv-bodyw">
      <div className="nv-row nv-row-w">
        <button className="nv-arrow" disabled={p === 0} onClick={() => go(p - 1)} aria-label="이전">‹</button>
        <div className="nv-pbox">{pages[p].map((l, i) => <p key={i}><Rich text={l} /></p>)}</div>
        <button className="nv-arrow" disabled={p === pages.length - 1} onClick={() => go(p + 1)} aria-label="다음">›</button>
      </div>
      <div className="nv-ptools">
        <button className="nv-listen nv-listen-s" onClick={() => { say(pages[p].map(plain).join(' ')); heard(); }}>🔊 <b>전체 듣기</b></button>
        {kos[p] && <button className="nv-hintbtn" onClick={() => setKo(!ko)}>{ko ? '해설 닫기' : '해설 보기'}</button>}
      </div>
      {ko && kos[p] && <div className="nv-hintbox on nv-kobox">{kos[p].split('\n').map((l, i) => <p key={i}>{l}</p>)}</div>}
      <p className="nv-hint">{p + 1} / {pages.length}</p>
    </div>
  );
}

/** 모범 글 읽기: 왼쪽 본문, 오른쪽 해설/해석 */
export function MText({ item, onDone }: KindProps) {
  const [tab, setTab] = useState<'ex' | 'ko'>('ex'); const lines: string[] = item.text ?? [];
  useEffect(() => { onDone([]); /* eslint-disable-next-line */ }, []);
  const side: string[] = tab === 'ex' ? item.explain ?? [] : item.ko ? String(item.ko).split('\n') : [];
  const tabs = useMemo(() => [item.explain?.length && ['ex', '💡 해설'], item.ko && ['ko', '해석']].filter(Boolean) as [string, string][], [item]);
  return (
    <div className="nv-body nv-bodyw">
      <div className="nv-split">
        <div className="nv-passage">
          {item.title && <h3 className="nv-sale">{item.title}</h3>}
          {lines.map((l, i) => <p key={i} className="nv-p-lg"><Rich text={l} /></p>)}
          <div className="nv-ptools"><button className="nv-listen nv-listen-s" onClick={() => say(lines.map(plain).join(' '))}>🔊 <b>듣기</b></button></div>
        </div>
        <div className="nv-qpane">
          <div className="nv-toolrow nv-tabs">{tabs.map(([k, l]) => <button key={k} className={'nv-hintbtn' + (tab === k ? ' on' : '')} onClick={() => setTab(k as 'ex' | 'ko')}>{l}</button>)}</div>
          {side.map((l, i) => <p key={i} className="nv-p-md"><Rich text={l} /></p>)}
        </div>
      </div>
    </div>
  );
}
