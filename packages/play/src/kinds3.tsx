import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { imgSrc, say, sayAuto, sayThen, type KindProps } from './common';

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
const Spk = ({ on }: { on?: boolean }) => <span className={'nv-sp' + (on ? ' on' : '')} aria-hidden><i className="nv-sico" aria-hidden="true" /></span>;
const KoBtn = ({ on, set }: { on: boolean; set: (v: boolean) => void }) => <button type="button" className={'nv-kobtn' + (on ? ' on' : '')} onClick={() => set(!on)} aria-pressed={on} title="한글 뜻 보기/숨기기">한</button>;
type Ex = { en: string; ko?: string; pic?: string; label?: string; group?: string };
/** 오른쪽 위 둥근 버튼: 🔊 전체 듣기 · 한(한글 뜻 보기/숨기기) */
const IconBtns = ({ onAll, ko, setKo }: { onAll: () => void; ko: boolean; setKo: (v: boolean) => void }) => (
  <div className="nv-ibtns"><button type="button" className="nv-icb" onClick={onAll} aria-label="전체 듣기" title="전체 듣기"><i className="nv-sico" aria-hidden="true" /></button><KoBtn on={ko} set={setKo} /></div>
);
/** 문장들을 차례로 끝까지 읽어 주는 '전체 듣기' */
function useAll(texts: string[], mark: (i: number) => void) {
  const seq = useRef(0);
  useEffect(() => () => { seq.current++; }, []);
  return () => {
    const id = ++seq.current; let i = 0;
    const step = () => { if (id !== seq.current || i >= texts.length) return; const k = i++; mark(k); sayThen(texts[k], () => setTimeout(step, 350)); };
    step();
  };
}

/** 눌러서 듣는 카드 모음: kexp(말풍선) / tapl(문장 상자) / lsent(세로 카드) / lcardp(그림 카드) / lcardt(글 카드) */
function Tapper({ item, pic, onDone, mode }: KindProps & { mode: TMode }) {
  const rows: Ex[] = item.items ?? [];
  const [heard, setHeard] = useState<Set<number>>(new Set()); const [cur, setCur] = useState<number | null>(null);
  const [ko, setKo] = useState(true); const fired = useRef(false); const seq = useRef(0);
  useEffect(() => { if (!fired.current && rows.length && heard.size === rows.length) { fired.current = true; onDone([]); } /* eslint-disable-next-line */ }, [heard]);
  const hear = (i: number) => { say(plain(rows[i].en)); setCur(i); setHeard((h) => new Set(h).add(i)); };
  const all = useAll(rows.map((r) => plain(r.en)), (i) => { setCur(i); setHeard((h) => new Set(h).add(i)); });
  const grid = mode === 'lcardp' || mode === 'lcardt';
  const tools = grid ? <div className="nv-toolrow"><KoBtn on={ko} set={setKo} /></div> : <div className="nv-toolrow"><IconBtns onAll={all} ko={ko} setKo={setKo} /></div>;
  return (
    <div className="nv-body">
      <div className={'nv-tapwrap' + (grid ? '' : ' nv-tapwrap-stack')}>
        {tools}
        <div className={grid ? 'nv-grid3' : 'nv-stack nv-stack-' + mode}>
          {rows.map((r, i) => (
            <button key={i} className={'nv-tap nv-tap-' + mode + (cur === i ? ' nv-cur' : '') + (heard.has(i) ? ' nv-heard2' : '')} onClick={() => hear(i)}>
              {mode === 'lcardp' && (pic(r.pic) ? <img className="nv-img" src={imgSrc(pic(r.pic))} alt="" draggable={false} /> : <div className="nv-img" />)}
              <span className="nv-tt"><b><Rich text={r.en} /></b>{r.ko && <i className={ko ? '' : 'nv-hid'}>{r.ko}</i>}</span>
              {mode !== 'lcardp' && mode !== 'lcardt' && <Spk on={cur === i} />}
            </button>
          ))}
        </div>
      </div>
      <p className="nv-hint">눌러서 들어 보세요 ({heard.size}/{rows.length})</p>
    </div>
  );
}
type TMode = 'tapl' | 'lsent' | 'lcardp' | 'lcardt';
/** 핵심 표현 듣고 따라 읽기: 말풍선 5개 (각각 🔊), 오른쪽 위 전체 듣기·한, 오른쪽에 설명 꼬리표(선택) */
export function KExp({ item, onDone }: KindProps) {
  const rows: Ex[] = item.items ?? [];
  const [heard, setHeard] = useState<Set<number>>(new Set()); const [cur, setCur] = useState<number | null>(null); const [ko, setKo] = useState(true); const fired = useRef(false);
  useEffect(() => { if (!fired.current && rows.length && heard.size === rows.length) { fired.current = true; onDone([]); } /* eslint-disable-next-line */ }, [heard]);
  const hear = (i: number) => { say(plain(rows[i].en)); setCur(i); setHeard((h) => new Set(h).add(i)); };
  const all = useAll(rows.map((r) => plain(r.en)), (i) => { setCur(i); setHeard((h) => new Set(h).add(i)); });
  const hasLab = rows.some((r) => r.label);
  return (
    <div className="nv-body">
      <div className={'nv-kx' + (hasLab ? ' nv-kx-lab' : '')}>
        <div className="nv-kx-tools"><IconBtns onAll={all} ko={ko} setKo={setKo} /></div>{hasLab && <span />}
        {rows.map((r, i) => (
          <div key={i} className="nv-kx-row">
            <button className={'nv-tap nv-tap-kexp' + (cur === i ? ' nv-cur' : '') + (heard.has(i) ? ' nv-heard2' : '')} onClick={() => hear(i)}>
              <span className="nv-tt"><b><Rich text={r.en} /></b>{r.ko && <i className={ko ? '' : 'nv-hid'}>{r.ko}</i>}</span><Spk on={cur === i} />
            </button>
            {hasLab && <span className="nv-kx-l">{r.label ? <>‹ {r.label}</> : null}</span>}
          </div>
        ))}
      </div>
      <p className="nv-hint">눌러서 들어 보세요 ({heard.size}/{rows.length})</p>
    </div>
  );
}
export const TapL = (p: KindProps) => <Tapper {...p} mode="tapl" />;
export const LSent = (p: KindProps) => <Tapper {...p} mode="lsent" />;
export const LCardP = (p: KindProps) => <Tapper {...p} mode="lcardp" />;
export const LCardT = (p: KindProps) => <Tapper {...p} mode="lcardt" />;

/** 학습목표: 왼쪽에 학습목표(2~3줄)와 그림(선택), 오른쪽에 핵심 표현(최대 5~6개, 소제목으로 묶기 가능) */
export function Goal({ item, pic, onDone }: KindProps) {
  const ex: Ex[] = item.items ?? []; const [ko, setKo] = useState(true); const [cur, setCur] = useState<number | null>(null);
  useEffect(() => { onDone([]); /* eslint-disable-next-line */ }, []);
  const all = useAll(ex.map((r) => plain(r.en)), setCur);
  const src = pic(item.pic) ?? (/^(https?:|word\/)/.test(item.pic ?? '') ? item.pic : null);
  return (
    <div className="nv-body nv-bodyw">
      <div className="nv-split nv-goal">
        <div className="nv-goalL">
          <h3 className="nv-gh">학습목표</h3>
          {item.title && <p className="nv-gtext"><Rich text={item.title} /></p>}
          {item.ko && <p className="nv-sub">{item.ko}</p>}
          {src && <img className="nv-gimg" src={imgSrc(src)} alt="" draggable={false} />}
        </div>
        <div className="nv-goalR">
          <div className="nv-gr-head"><h3 className="nv-gh">{item.head || '핵심표현'}</h3><IconBtns onAll={all} ko={ko} setKo={setKo} /></div>
          <div className="nv-gr-list">
            {ex.map((r, i) => (
              <div key={i} className="nv-gr-item">
                {r.group && r.group !== ex[i - 1]?.group && <p className="nv-grp">{r.group}</p>}
                <button className={'nv-tap nv-tap-goal' + (cur === i ? ' nv-cur' : '')} onClick={() => { say(plain(r.en)); setCur(i); }}>
                  <span className="nv-tt"><b><Rich text={r.en} /></b>{r.ko && <i className={ko ? '' : 'nv-hid'}>{r.ko}</i>}</span>
                </button>
              </div>))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** 단어 듣고 따라 말하기: 카드 한 장씩 넘기며 듣고 따라 말한다 */
export function WRepeat({ words, onDone }: KindProps) {
  const [i, setI] = useState(0); const [seen, setSeen] = useState<Set<number>>(new Set([0]));
  const fired = useRef(false); const w = words[i];
  useEffect(() => { sayAuto(w.en); /* 카드가 열리면 자동으로 소리 */ }, [i]); // eslint-disable-line
  useEffect(() => { if (!fired.current && seen.size === words.length) { fired.current = true; onDone([]); } /* eslint-disable-next-line */ }, [seen]);
  const go = (n: number) => { if (n >= 0 && n < words.length) { setI(n); setSeen(new Set(seen).add(n)); } };
  return (
    <div className="nv-body">
      <div className="nv-row nv-row-far">
        <button className="nv-arrow" disabled={i === 0} onClick={() => go(i - 1)} aria-label="이전">‹</button>
        <button type="button" className="nv-big nv-bigbtn" onClick={() => say(w.en)} aria-label="다시 듣기">
          {w.image ? <img className="nv-img nv-img-lg" src={imgSrc(w.image)} alt="" draggable={false} /> : <div className="nv-img nv-img-lg" />}
          <b className="nv-word">{w.en}</b><span className="nv-ko">{w.ko}</span>
        </button>
        <button className="nv-arrow" disabled={i === words.length - 1} onClick={() => go(i + 1)} aria-label="다음">›</button>
      </div>
      <p className="nv-hint">{i + 1} / {words.length} · 카드를 누르면 소리를 다시 들려줘요</p>
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
      <button type="button" className="nv-listen nv-listen-s" disabled={cur == null} onClick={() => cur != null && say(full(words[cur]))}><i className="nv-sico" aria-hidden="true" /> <b>다시 듣기</b></button>
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
        <button className="nv-listen nv-listen-s" onClick={() => { say(pages[p].map(plain).join(' ')); heard(); }}><i className="nv-sico" aria-hidden="true" /> <b>전체 듣기</b></button>
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
  const sideEx: string[] = item.explain ?? []; const sideKo: string[] = item.ko ? String(item.ko).split('\n') : [];
  const side = tab === 'ex' ? sideEx : sideKo;
  const tabs = useMemo(() => [item.explain?.length && ['ex', '💡 해설'], item.ko && ['ko', '해석']].filter(Boolean) as [string, string][], [item]);
  const n = Math.max(lines.length, sideEx.length, sideKo.length);
  return (
    <div className="nv-body nv-bodyw nv-mtbody">
      <div className="nv-mtwrap">
      <div className="nv-mtgrid">
        <div className="nv-mtrow nv-mthead">
          <div className="nv-mtl">{item.title && <h3 className="nv-sale">{item.title}</h3>}</div>
          <div className="nv-mtr nv-tabs">{tabs.map(([k, l]) => <button key={k} className={'nv-hintbtn' + (tab === k ? ' on' : '')} onClick={() => setTab(k as 'ex' | 'ko')}>{l}</button>)}</div>
        </div>
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className="nv-mtrow">
            <div className="nv-mtl"><p className="nv-p-lg">{lines[i] != null && <Rich text={lines[i]} />}</p></div>
            <div className="nv-mtr nv-mtstack">{[['ex', sideEx], ['ko', sideKo]].map(([k, arr]) => <p key={k as string} className={'nv-p-md' + (tab === k ? '' : ' nv-mtoff')}>{(arr as string[])[i] != null && <Rich text={(arr as string[])[i]} />}</p>)}</div>
          </div>))}
      </div>
      <div className="nv-ptools"><button className="nv-listen nv-listen-s" onClick={() => say(lines.map(plain).join(' '))}><i className="nv-sico" aria-hidden="true" /> <b>듣기</b></button></div>
      </div>
    </div>
  );
}
