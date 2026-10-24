import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { imgSrc, say, shuffle, type KindProps, type Res } from './common';
import { Hint } from './hint';
import { Fb } from './fb';

/* ===== 1단계 템플릿: 고르기 · True/False · 듣고 고르기 · 짝짓기 · 글 읽고 답하기 =====
   문항 데이터는 문항 안에 글이 그대로 들어 있고, 그림은 단원 어휘의 key(pic / opts[].flag)로 가리킨다. */
type O = { t: string; flag?: string };
const Img = ({ src, cls }: { src: string | null; cls: string }) => (src ? <img className={cls} src={imgSrc(src)} alt="" draggable={false} /> : null);

const Listen = ({ text }: { text: string }) => <button type="button" className="nv-listen nv-listen-top" onClick={() => say(text)}>🔊 <b>듣기</b></button>;
const Lines = ({ lines, cls }: { lines: string[]; cls?: string }) => <div className={cls ?? 'nv-dlg'}>{lines.map((l, i) => <p key={i}>{l}</p>)}</div>;

/** 보기 한 개를 눌러 정답을 찾는 공통 동작: 틀리면 흔들리고 다시, 맞으면 초록으로 잠긴다 */
function useSingle(a: number, tag: string, onDone: (r: Res[]) => void) {
  const [sel, setSel] = useState<number | null>(null);
  const [bad, setBad] = useState<number | null>(null);
  const [ok, setOk] = useState(false);
  const wrong = useRef(false); const nw = useRef(0); const last = useRef(-1);
  function pick(i: number, spoken?: string) {
    if (ok) return;
    if (spoken) say(spoken);
    if (i === a) { setSel(i); setBad(null); setOk(true); onDone([{ tag, ok: !wrong.current }]); }
    else { wrong.current = true; nw.current += 1; last.current = i; setBad(i); setTimeout(() => setBad(null), 500); }
  }
  const cls = (i: number) => (ok && i === a ? ' nv-right' : bad === i ? ' nv-wrong nv-shake' : sel === i ? ' nv-on' : '');
  const ctx = () => ({ input: last.current >= 0 ? `선택한 보기: ${last.current + 1}번` : '', wrong: nw.current });
  return { pick, cls, ok, ctx };
}
const Msg = ({ ok }: { ok: boolean }) => <Fb className={'nv-fbmsg' + (ok ? ' on' : '')}>{ok ? '정답이에요! 👏' : ''}</Fb>;

/* ---------- 뜻 고르기 (wchoice) ---------- */
/** 한글 뜻 ↔ 영어 단어: 문제 상자 오른쪽 위 토글로 바꾼다 (위에 단어가 나오면 보기는 한글 뜻, 위에 뜻이 나오면 보기는 영어 단어). 보기는 2×2 */
function WChoiceBody({ item, words, vocab, ko2en, onPick, toggle, onDone }: KindProps & { ko2en: boolean; onPick: () => void; toggle: ReactNode }) {
  const w = words[0];
  const opts = useMemo(() => {
    const pool = (vocab ?? []).filter((v) => v.key !== w.key).map((v) => (ko2en ? v.en : v.ko));
    const given: string[] = item.dir === (ko2en ? 'ko2en' : 'en2ko') || (!item.dir && ko2en) ? item.wrong ?? [] : [];
    const wr = [...new Set([...given, ...shuffle(pool)])].filter((t) => t !== (ko2en ? w.en : w.ko)).slice(0, 3);
    return shuffle([{ t: ko2en ? w.en : w.ko, c: true }, ...wr.map((t) => ({ t, c: false }))]);
  }, [item, ko2en]); // eslint-disable-line
  const a = opts.findIndex((o) => o.c);
  const s = useSingle(a, 'vocab', onDone);
  useEffect(() => { say(w.en); /* 단어 소리는 문제가 열리면 자동 재생 */ }, [ko2en]); // eslint-disable-line
  return (
    <div className="nv-body">
      <div className="nv-prompt">
        {toggle}
        <b className={ko2en ? 'nv-ko-lg' : 'nv-en-lg'}>{ko2en ? w.ko : w.en}</b>
        <button className="nv-spk" onClick={() => say(w.en)} aria-label="다시 듣기">🔊</button>
      </div>
      <div className="nv-grid22">{opts.map((o, i) => <button key={i} className={'nv-opt nv-opt-c' + s.cls(i)} onClick={() => { onPick(); s.pick(i, ko2en ? o.t : undefined); }}>{o.t}</button>)}</div>
      <Msg ok={s.ok} />
    </div>
  );
}
export function WChoice(p: KindProps) {
  const [ko2en, setK] = useState((p.item.dir ?? 'ko2en') === 'ko2en'); const [touched, setT] = useState(false);
  const toggle = (
    <button type="button" className="nv-swap" disabled={touched} onClick={() => setK(!ko2en)} aria-label="한글 뜻과 영어 단어 바꾸기" title="문제 방향 바꾸기">
      <span className={ko2en ? 'on' : ''}>가</span><i>⇄</i><span className={ko2en ? '' : 'on'}>A</span>
    </button>
  );
  return <WChoiceBody key={String(ko2en)} {...p} ko2en={ko2en} onPick={() => setT(true)} toggle={toggle} />;
}

/* ---------- 그림 보고 고르기 (pchoice) · 대화 고르기 (dchoice) ---------- */
export function PChoice({ item, pic, onDone }: KindProps) {
  const opts: O[] = item.opts ?? []; const s = useSingle(item.a ?? 0, 'vocab', onDone);
  return (
    <div className="nv-body">
      {item.q && <p className="nv-q">{item.q}</p>}
      <Img src={pic(item.pic)} cls="nv-img nv-img-md" />
      <div className="nv-list">{opts.map((o, i) => <button key={i} className={'nv-opt' + s.cls(i)} onClick={() => s.pick(i, o.t)}>{o.t}</button>)}</div>
      <Msg ok={s.ok} /><Hint lines={item.hint} kind={item.k} item={item} ctx={s.ctx} />
    </div>
  );
}
export function DChoice({ item, pic, onDone }: KindProps) {
  const opts: O[] = item.opts ?? []; const s = useSingle(item.a ?? 0, 'read', onDone);
  return (
    <div className="nv-body">
      {item.pic && <Img src={pic(item.pic)} cls="nv-img nv-img-md" />}
      {item.q && <p className="nv-q">{item.q}</p>}
      {!!item.lines?.length && <Lines lines={item.lines} />}
      <div className="nv-list">{opts.map((o, i) => <button key={i} className={'nv-opt' + s.cls(i)} onClick={() => s.pick(i)}>{o.t}</button>)}</div>
      <Msg ok={s.ok} />
    </div>
  );
}

/* ---------- True or False (tf) ---------- */
export function TrueFalse({ item, onDone }: KindProps) {
  const ans = !!item.a; const s = useSingle(ans ? 0 : 1, 'read', onDone);
  return (
    <div className="nv-body">
      {!!item.lines?.length && <Lines lines={item.lines} />}
      <div className="nv-capsule">{item.stmt}</div>
      <div className="nv-tfrow">
        <button className={'nv-opt nv-tf' + s.cls(0)} onClick={() => s.pick(0)}>True (맞아요)</button>
        <button className={'nv-opt nv-tf' + s.cls(1)} onClick={() => s.pick(1)}>False (달라요)</button>
      </div>
      <Msg ok={s.ok} /><Hint lines={item.hint} kind={item.k} item={item} ctx={s.ctx} />
    </div>
  );
}

/* ---------- 듣고 고르기 3종 (lchtext 글 4칸 · lchpic 그림 4칸 · lchlist 세로) ---------- */
function LChoose({ item, pic, onDone, mode }: KindProps & { mode: 'row' | 'pic' | 'list' }) {
  const opts: O[] = item.opts ?? []; const s = useSingle(item.a ?? 0, 'listen', onDone);
  return (
    <div className="nv-body nv-hasl">
      <Listen text={item.say ?? ''} />
      <div className={mode === 'list' ? 'nv-list' : 'nv-row4'}>
        {opts.map((o, i) => (
          <button key={i} className={'nv-opt' + (mode === 'pic' ? ' nv-opt-pic' : mode === 'row' ? ' nv-opt-tile' : '') + s.cls(i)} onClick={() => s.pick(i)}>
            {mode === 'pic' && <Img src={pic(o.flag)} cls="nv-img" />}{o.t}
          </button>
        ))}
      </div>
      <Msg ok={s.ok} /><Hint lines={item.hint} kind={item.k} item={item} ctx={s.ctx} />
    </div>
  );
}
export const LChText = (p: KindProps) => <LChoose {...p} mode="row" />;
export const LChPic = (p: KindProps) => <LChoose {...p} mode="pic" />;
export const LChList = (p: KindProps) => <LChoose {...p} mode="list" />;

/* ---------- 듣고 짝짓기 (lmatch): 왼쪽(소리) → 오른쪽(물건) ---------- */
export function LMatch({ item, onDone }: KindProps) {
  const pairs: { left: string; say?: string; right: string }[] = item.pairs ?? [];
  const rights = useMemo(() => shuffle(pairs.map((p, i) => ({ i, t: p.right }))), [item]); // eslint-disable-line
  const [sel, setSel] = useState<number | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [bad, setBad] = useState<number | null>(null);
  const wrongs = useRef<Set<number>>(new Set()); const fired = useRef(false);
  const hue = ['#DCE8FA', '#FFE7A8', '#D8F0E0', '#F6DDF0', '#E6E3F8', '#FAD9D3'];
  useEffect(() => { if (!fired.current && done.size === pairs.length) { fired.current = true; onDone(pairs.map((_, i) => ({ tag: 'listen', ok: !wrongs.current.has(i) }))); } /* eslint-disable-next-line */ }, [done]);
  function left(i: number) { if (done.has(i)) return; say(pairs[i].say ?? pairs[i].left); setSel(i); }
  function right(ri: number) {
    if (sel == null || done.has(ri)) return;
    if (sel === ri) { setDone(new Set(done).add(ri)); setSel(null); }
    else { wrongs.current.add(sel); setBad(ri); setTimeout(() => setBad(null), 500); }
  }
  return (
    <div className="nv-body">
      <div className="nv-lm">
        <div className="nv-lmcol">{pairs.map((p, i) => (
          <button key={i} className={'nv-lmc' + (sel === i ? ' nv-on' : '') + (done.has(i) ? ' nv-lmdone' : '')} style={done.has(i) ? { background: hue[i % hue.length] } : undefined} onClick={() => left(i)}>
            <b>{p.left}</b><span>🔊</span></button>))}</div>
        <div className="nv-lmcol">{rights.map((r) => (
          <button key={r.i} className={'nv-lmc nv-lmr' + (bad === r.i ? ' nv-wrong nv-shake' : '') + (done.has(r.i) ? ' nv-lmdone' : '')} style={done.has(r.i) ? { background: hue[r.i % hue.length] } : undefined} onClick={() => right(r.i)}>
            <b>{r.t}</b></button>))}</div>
      </div>
      <p className="nv-hint">왼쪽을 눌러 소리를 듣고, 알맞은 오른쪽 짝을 찾아요 ({done.size}/{pairs.length})</p>
    </div>
  );
}

/* ---------- 글 읽고 답하기 3종 (sqchoice 선택 · sqtf T/F · sqmulti 복수 선택) ---------- */
function Story({ item, side, tag }: { item: Record<string, any>; side: ReactNode; tag?: string }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const [ko, setKo] = useState(false);
  const text: string[] = item.text ?? [];
  return (
    <div className="nv-split">
      <div className="nv-passage">
        {item.title && <h3>{item.title}</h3>}
        {text.map((l, i) => <p key={i}>{l}</p>)}
        <div className="nv-ptools">
          <button type="button" className="nv-listen nv-listen-s" onClick={() => say(text.join(' '))}>🔊 <b>듣기</b></button>
          {item.ko && <button type="button" className="nv-hintbtn" onClick={() => setKo(!ko)}>{ko ? '해석 닫기' : '해석 보기'}</button>}
        </div>
        {ko && <div className="nv-hintbox on">{String(item.ko).split('\n').map((l, i) => <p key={i}>{l}</p>)}</div>}
      </div>
      <div className="nv-qpane" data-tag={tag}>{side}</div>
    </div>
  );
}
export function SqChoice({ item, onDone }: KindProps) {
  const opts: O[] = item.opts ?? []; const s = useSingle(item.a ?? 0, 'read', onDone);
  return (
    <div className="nv-body nv-bodyw"><Story item={item} side={<>
      <p className="nv-qt">Q. {item.q}</p>
      <div className="nv-list nv-list-s">{opts.map((o, i) => <button key={i} className={'nv-opt' + s.cls(i)} onClick={() => s.pick(i)}>{o.t}</button>)}</div>
      <Msg ok={s.ok} /><Hint lines={item.hint} kind={item.k} item={item} ctx={s.ctx} />
    </>} /></div>
  );
}
export function SqTF({ item, onDone }: KindProps) {
  const rows: { t: string; a?: boolean }[] = item.items ?? [];
  const [res, setRes] = useState<Record<number, boolean>>({}); const [bad, setBad] = useState<string | null>(null);
  const wrongs = useRef<Set<number>>(new Set()); const fired = useRef(false);
  useEffect(() => { if (!fired.current && rows.length && rows.every((_, i) => res[i] != null)) { fired.current = true; onDone(rows.map((_, i) => ({ tag: 'read', ok: !wrongs.current.has(i) }))); } /* eslint-disable-next-line */ }, [res]);
  function pick(i: number, v: boolean) {
    if (res[i] != null) return;
    if (!!rows[i].a === v) setRes({ ...res, [i]: v });
    else { wrongs.current.add(i); setBad(i + (v ? 'T' : 'F')); setTimeout(() => setBad(null), 500); }
  }
  const mark = (i: number) => String.fromCharCode(9424 + i);
  return (
    <div className="nv-body nv-bodyw"><Story item={item} side={<>
      <p className="nv-qt">{item.q || 'Q. 글의 내용과 일치하면 T, 아니면 F를 선택하세요.'}</p>
      <div className="nv-tfl">{rows.map((r, i) => (
        <div key={i} className="nv-tfr"><span>{mark(i)} {r.t}</span>
          {[true, false].map((v) => <button key={String(v)} className={'nv-tfb' + (res[i] === v ? ' nv-right' : '') + (bad === i + (v ? 'T' : 'F') ? ' nv-wrong nv-shake' : '')} onClick={() => pick(i, v)}>{v ? 'T' : 'F'}</button>)}
        </div>))}</div>
      <Msg ok={rows.length > 0 && rows.every((_, i) => res[i] != null)} /><Hint lines={item.hint} kind={item.k} item={item} />
    </>} /></div>
  );
}
export function SqMulti({ item, onDone }: KindProps) {
  const rows: { t: string; ok?: boolean }[] = item.items ?? [];
  const [sel, setSel] = useState<Set<number>>(new Set()); const [ok, setOk] = useState(false); const [bad, setBad] = useState(false); const wrong = useRef(false);
  const mark = (i: number) => String.fromCharCode(9424 + i);
  function check() {
    const good = rows.every((r, i) => !!r.ok === sel.has(i));
    if (good) { setOk(true); onDone([{ tag: 'read', ok: !wrong.current }]); }
    else { wrong.current = true; setBad(true); setTimeout(() => { setBad(false); setSel(new Set()); }, 700); }
  }
  return (
    <div className="nv-body nv-bodyw"><Story item={item} side={<>
      <p className="nv-qt">{item.q || 'Q. 알맞은 것을 모두 선택하세요.'}</p>
      <div className={'nv-list nv-list-s' + (bad ? ' nv-shake' : '')}>{rows.map((r, i) => (
        <button key={i} disabled={ok} className={'nv-opt nv-opt-l' + (ok ? (r.ok ? ' nv-right' : '') : sel.has(i) ? ' nv-on' : '')}
          onClick={() => { const n = new Set(sel); if (n.has(i)) n.delete(i); else n.add(i); setSel(n); }}>{mark(i)} {r.t}</button>))}</div>
      <div className="nv-center"><button className="nv-btn" disabled={ok || !sel.size} onClick={check}>확인</button></div>
      <Msg ok={ok} /><Hint lines={item.hint} kind={item.k} item={item} />
    </>} /></div>
  );
}
