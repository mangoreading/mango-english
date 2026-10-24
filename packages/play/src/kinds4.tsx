import { useMemo, useRef, useState } from 'react';
import { imgSrc, say, shuffle, type KindProps } from './common';
import { Rich } from './kinds3';
import { Hint } from './hint';
import { Fb } from './fb';

/* ===== 3단계 템플릿: 쓰기류 (듣고 쓰기 · 문장 쓰기 · 빈칸 쓰기 · 문장 만들기 · 대화 완성 · 문장 순서 · 보기로 글 완성 · 글 쓰기) ===== */
const cmp = (s: string) => s.toLowerCase().replace(/[’‘`]/g, "'").replace(/[.?!,]/g, '').replace(/\s+/g, ' ').trim();
const accepts = (v: string, ans: string) => ans.split('|').some((a) => cmp(a) === cmp(v));
/** 단어 첫 글자만 보여 주는 자동 힌트: How much is it? → H___ m___ is it? */
export const initials = (s: string) => s.split(' ').map((w) => { const m = w.match(/^([A-Za-z']+)(.*)$/); return m && m[1].length >= 3 ? m[1][0] + '_'.repeat(m[1].length - 1) + m[2] : w; }).join(' ');
const plain = (t: string) => t.replace(/\[\[|\]\]|\{\{|\}\}/g, '');

function HintBox({ lines, item, ctx }: { lines: string[]; item?: Record<string, any>; ctx?: () => { input: string; wrong: number } }) { return <Hint lines={lines} kind={item?.k} item={item} ctx={ctx} />; } // eslint-disable-line @typescript-eslint/no-explicit-any
const Ko = ({ t }: { t?: string }) => (t ? <div className="nv-kobar">{t}</div> : null);
const Msg = ({ ok, bad }: { ok: boolean; bad: boolean }) => <Fb className={'nv-fbmsg' + (ok || bad ? ' on' : '') + (bad ? ' nv-fbbad' : '')}>{ok ? '정답이에요! 👏' : bad ? '다시 한번 써 보세요' : ''}</Fb>;

/** 우리말을 보고 영어 문장 쓰기. mode=cap: 캡슐 안에 쓰기 / box: 아래 입력칸에 쓰기 */
function SB({ item, onDone, mode }: KindProps & { mode: 'cap' | 'box' }) {
  const [v, setV] = useState(''); const [ok, setOk] = useState(false); const [bad, setBad] = useState(false); const wrong = useRef(false);
  const ans: string = item.ans ?? '';
  const all = [ans, ...(item.alts ?? [])].join('|');
  function check() {
    if (ok || !v.trim()) return;
    if (accepts(v, all)) { setOk(true); setBad(false); say(ans); onDone([{ tag: 'write', ok: !wrong.current }]); }
    else { wrong.current = true; setBad(true); setTimeout(() => setBad(false), 700); }
  }
  const input = <input className={'nv-winput' + (mode === 'cap' ? ' nv-winput-cap' : '')} value={ok ? ans : v} disabled={ok} placeholder="정답을 써 보세요" autoCapitalize="off" autoCorrect="off" spellCheck={false}
    onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') check(); }} />;
  return (
    <div className="nv-body">
      <Ko t={item.ko} />
      {mode === 'cap' ? <div className={'nv-capsule nv-capsule-in' + (ok ? ' nv-okc' : '') + (bad ? ' nv-shake' : '')}>{input}</div> : <div className={bad ? 'nv-shake' : ''}>{input}</div>}
      <button className="nv-btn" disabled={ok || !v.trim()} onClick={check}>확인</button>
      <Msg ok={ok} bad={bad} />
      <HintBox lines={item.hint?.length ? item.hint : [initials(ans), item.starter ? `${item.starter} 로 시작해 보세요` : ''].filter(Boolean)} item={item} ctx={() => ({ input: v, wrong: wrong.current ? 1 : 0 })} />
    </div>
  );
}
export const SBuild = (p: KindProps) => <SB {...p} mode="cap" />;
export const SWrite = (p: KindProps) => <SB {...p} mode="box" />;

/** 빈칸이 들어 있는 줄들. {} 하나가 입력칸 하나, 정답은 순서대로 ans[] */
function Blanks({ lines, ans, big, cap, onDone, tag }: { lines: string[]; ans: string[]; big?: boolean; cap?: boolean; onDone: KindProps['onDone']; tag: string }) {
  const [vals, setVals] = useState<string[]>(ans.map(() => '')); const [okS, setOkS] = useState<boolean[]>(ans.map(() => false));
  const [bad, setBad] = useState<boolean[]>(ans.map(() => false)); const wrong = useRef<boolean[]>(ans.map(() => false)); const fired = useRef(false);
  function check() {
    const o = [...okS], b = ans.map(() => false);
    ans.forEach((a, i) => { if (o[i]) return; if (accepts(vals[i], a)) o[i] = true; else if (vals[i].trim()) { b[i] = true; wrong.current[i] = true; } else { b[i] = true; wrong.current[i] = true; } });
    setOkS(o); setBad(b); if (b.some(Boolean)) setTimeout(() => setBad(ans.map(() => false)), 700);
    if (!fired.current && o.every(Boolean)) { fired.current = true; onDone(ans.map((_, i) => ({ tag, ok: !wrong.current[i] }))); }
  }
  let bi = 0;
  const done = okS.every(Boolean);
  return (
    <>
      <div className={'nv-bl' + (big ? ' nv-bl-big' : '') + (cap ? ' nv-capsule nv-capsule-bl' : '')}>
        {lines.map((l, li) => (
          <p key={li}>{l.split('{}').map((seg, si, arr) => {
            const idx = si < arr.length - 1 ? bi++ : -1;
            return <span key={si}><Rich text={seg} />{idx >= 0 && (
              <input className={'nv-blank' + (okS[idx] ? ' nv-bok' : '') + (bad[idx] ? ' nv-bbad nv-shake' : '')} style={{ width: Math.max(4, ans[idx].split('|')[0].length * 0.78 + 1.6) + 'em' }}
                value={okS[idx] ? ans[idx].split('|')[0] : vals[idx]} disabled={okS[idx]} autoCapitalize="off" autoCorrect="off" spellCheck={false}
                onChange={(e) => setVals(vals.map((x, k) => (k === idx ? e.target.value : x)))} onKeyDown={(e) => { if (e.key === 'Enter') check(); }} />)}</span>;
          })}</p>))}
      </div>
      <button className="nv-btn" disabled={done || vals.every((x) => !x.trim())} onClick={check}>확인</button>
      <Msg ok={done} bad={bad.some(Boolean)} />
    </>
  );
}
/** 빈칸 단어 쓰기: tpl 한 줄 + ans */
export function SFill({ item, onDone }: KindProps) {
  return (
    <div className="nv-body"><Ko t={item.ko} />
      <BlankLine item={item} onDone={onDone} />
      <HintBox lines={item.hint?.length ? item.hint : [initials(String(item.tpl ?? '').replace('{}', (item.ans ?? '').split('|')[0]))]} item={item} />
    </div>
  );
}
function BlankLine({ item, onDone }: Pick<KindProps, 'item' | 'onDone'>) { return <Blanks lines={[item.tpl ?? '{}']} ans={[item.ans ?? '']} big cap onDone={onDone} tag="write" />; }
/** 그림 보고 대화 완성하기 */
export function DFill({ item, pic, onDone }: KindProps) {
  const src = pic(item.pic);
  return (
    <div className="nv-body">
      {src && <div className="nv-picwrap"><img className="nv-img nv-img-md" src={imgSrc(src)} alt="" draggable={false} />{item.tag2 && <span className="nv-price">{item.tag2}</span>}</div>}
      <Blanks lines={item.lines ?? []} ans={item.ans ?? []} big onDone={onDone} tag="write" />
      <HintBox lines={item.hint ?? []} item={item} />
    </div>
  );
}

/** 단어 칩 순서대로 눌러 문장 만들기 */
export function SScram({ item, onDone }: KindProps) {
  const ans: string = item.ans ?? ''; const wordsA = ans.split(/\s+/).filter(Boolean);
  const chips = useMemo(() => shuffle([...wordsA, ...(item.extra ?? [])].map((t, id) => ({ id, t }))), [item]); // eslint-disable-line
  const [seq, setSeq] = useState<number[]>([]); const [ok, setOk] = useState(false); const [bad, setBad] = useState(false); const wrong = useRef(false);
  const text = (ids: number[]) => ids.map((i) => chips.find((c) => c.id === i)!.t).join(' ');
  function tap(id: number) {
    if (ok || seq.includes(id)) return;
    const n = [...seq, id]; setSeq(n);
    if (n.length === wordsA.length) {
      if (accepts(text(n), [ans, ...(item.alts ?? [])].join('|'))) { setOk(true); say(ans); onDone([{ tag: 'write', ok: !wrong.current }]); }
      else { wrong.current = true; setBad(true); setTimeout(() => { setBad(false); setSeq([]); }, 800); }
    }
  }
  return (
    <div className="nv-body"><Ko t={item.ko} />
      <div className={'nv-capsule nv-capsule-chips' + (ok ? ' nv-okc' : '') + (bad ? ' nv-shake nv-badc' : '')}>
        {seq.map((id) => <button key={id} className="nv-chipb nv-placed" onClick={() => !ok && setSeq(seq.filter((x) => x !== id))}>{chips.find((c) => c.id === id)!.t}</button>)}
      </div>
      <div className="nv-chips">{chips.map((c) => <button key={c.id} className="nv-chipb" disabled={seq.includes(c.id)} onClick={() => tap(c.id)}>{c.t}</button>)}</div>
      <Msg ok={ok} bad={bad} />
      <HintBox lines={item.hint ?? []} item={item} />
    </div>
  );
}

/** 문장(대화)을 위아래로 끌어서 순서 맞추기 (끌기 + ↑↓ 버튼) */
export function SOrder({ item, onDone }: KindProps) {
  const rows: { en: string; ko?: string }[] = item.items ?? [];
  const [order, setOrder] = useState<number[]>(() => { let o = shuffle(rows.map((_, i) => i)); let g = 0; while (rows.length > 1 && o.every((x, i) => x === i) && g++ < 9) o = shuffle(o); return o; });
  const [ko, setKo] = useState(true); const [drag, setDrag] = useState<number | null>(null); const [ok, setOk] = useState(false); const [bad, setBad] = useState(false); const wrong = useRef(false);
  const move = (a: number, b: number) => { if (b < 0 || b >= order.length || ok) return; const n = [...order]; const [x] = n.splice(a, 1); n.splice(b, 0, x); setOrder(n); };
  function check() {
    if (order.every((x, i) => x === i)) { setOk(true); onDone([{ tag: 'write', ok: !wrong.current }]); }
    else { wrong.current = true; setBad(true); setTimeout(() => setBad(false), 700); }
  }
  return (
    <div className="nv-body">
      <div className="nv-toolrow"><button type="button" className={'nv-kobtn' + (ko ? ' on' : '')} onClick={() => setKo(!ko)}>한</button></div>
      <div className={'nv-ord' + (bad ? ' nv-shake' : '')}>
        {order.map((r, pos) => (
          <div key={r} className={'nv-ordi' + (drag === pos ? ' nv-drag' : '') + (ok ? ' nv-right' : '')} draggable={!ok}
            onDragStart={() => setDrag(pos)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag != null) move(drag, pos); setDrag(null); }} onDragEnd={() => setDrag(null)}>
            <span className="nv-grip">⋮⋮</span>
            <span className="nv-tt"><b>{rows[r].en}</b>{rows[r].ko && <i className={ko ? '' : 'nv-hid'}>{rows[r].ko}</i>}</span>
            <span className="nv-ud"><button type="button" aria-label="위로" disabled={pos === 0 || ok} onClick={() => move(pos, pos - 1)}>▲</button><button type="button" aria-label="아래로" disabled={pos === order.length - 1 || ok} onClick={() => move(pos, pos + 1)}>▼</button></span>
          </div>))}
      </div>
      <button className="nv-btn" disabled={ok} onClick={check}>확인</button>
      <Msg ok={ok} bad={bad} />
    </div>
  );
}

/** 보기 단어를 눌러 글의 빈칸 채우기 (모범 글 완성 / 글 빈칸 채우기 공용) */
function WB({ item, onDone, tag }: KindProps & { tag: string }) {
  const ans: string[] = item.ans ?? []; const lines: string[] = item.lines ?? [];
  const bank = useMemo(() => shuffle([...ans, ...(item.extra ?? [])].map((t, id) => ({ id, t }))), [item]); // eslint-disable-line
  const [slots, setSlots] = useState<(number | null)[]>(ans.map(() => null)); const [bad, setBad] = useState<boolean[]>(ans.map(() => false));
  const [ok, setOk] = useState(false); const wrong = useRef<boolean[]>(ans.map(() => false));
  const txt = (id: number | null) => (id == null ? '' : bank.find((b) => b.id === id)!.t);
  function put(id: number) {
    if (ok || slots.includes(id)) return; const k = slots.indexOf(null); if (k < 0) return;
    const n = [...slots]; n[k] = id; setSlots(n);
    if (!n.includes(null)) {
      const b = n.map((x, i) => !accepts(txt(x), ans[i]));
      if (b.some(Boolean)) { b.forEach((x, i) => { if (x) wrong.current[i] = true; }); setBad(b); setTimeout(() => { setBad(ans.map(() => false)); setSlots(n.map((x, i) => (b[i] ? null : x))); }, 800); }
      else { setOk(true); onDone(ans.map((_, i) => ({ tag, ok: !wrong.current[i] }))); }
    }
  }
  let bi = 0;
  return (
    <div className="nv-body">
      <div className="nv-chips">{bank.map((c) => <button key={c.id} className="nv-chipb" disabled={slots.includes(c.id)} onClick={() => put(c.id)}>{c.t}</button>)}</div>
      <div className="nv-bl nv-bl-box">
        {lines.map((l, li) => (
          <p key={li}>{l.split('{}').map((seg, si, arr) => {
            const idx = si < arr.length - 1 ? bi++ : -1;
            return <span key={si}><Rich text={seg} />{idx >= 0 && <button className={'nv-slotb' + (slots[idx] != null ? ' filled' : '') + (bad[idx] ? ' nv-bbad nv-shake' : '') + (ok ? ' nv-bok' : '')} onClick={() => !ok && slots[idx] != null && setSlots(slots.map((x, k) => (k === idx ? null : x)))}>{txt(slots[idx])}</button>}</span>;
          })}</p>))}
      </div>
      <Msg ok={ok} bad={bad.some(Boolean)} />
      <HintBox lines={item.hint ?? []} item={item} />
    </div>
  );
}
export const MWBank = (p: KindProps) => <WB {...p} tag="write" />;
export const SCloze = (p: KindProps) => <WB {...p} tag="read" />;

/** 듣고 쓰기: 표의 빈칸(시각 등)에 듣고 쓴다 */
export function LWrite({ item, onDone }: KindProps) {
  const rows: { label: string; ans: string }[] = item.rows ?? [];
  const [v, setV] = useState<string[]>(rows.map(() => '')); const [okS, setOkS] = useState<boolean[]>(rows.map(() => false)); const [bad, setBad] = useState<boolean[]>(rows.map(() => false));
  const wrong = useRef<boolean[]>(rows.map(() => false)); const fired = useRef(false);
  const t = (s: string) => s.replace(/\s/g, '').replace(/^0(\d)/, '$1').replace('.', ':');
  /** 맞게 쓰면 바로 확인, 틀리면 칸을 벗어나거나 Enter 를 눌렀을 때 알려 준다 (확인 버튼 없음) */
  function judge(i: number, val: string, final: boolean) {
    setV((x) => x.map((y, k) => (k === i ? val : y)));
    if (t(val) === t(rows[i].ans)) {
      setBad((b) => b.map((y, k) => (k === i ? false : y)));
      setOkS((o) => { const n = o.map((y, k) => (k === i ? true : y)); if (!fired.current && n.every(Boolean)) { fired.current = true; setTimeout(() => onDone(rows.map((_, k) => ({ tag: 'listen', ok: !wrong.current[k] }))), 0); } return n; });
    } else if (final && val.trim()) { wrong.current[i] = true; setBad((b) => b.map((y, k) => (k === i ? true : y))); setTimeout(() => setBad((b) => b.map((y, k) => (k === i ? false : y))), 700); }
  }
  const done = okS.every(Boolean);
  return (
    <div className="nv-body nv-hasl">
      <button type="button" className="nv-listen nv-listen-top" onClick={() => say(item.say ?? '')}>🔊 <b>듣기</b></button>
      <table className="nv-ltab"><thead><tr><th>{item.h1 || '시간'}</th><th>{item.h2 || '일과'}</th></tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i}><td><input className={'nv-blank nv-time' + (okS[i] ? ' nv-bok' : '') + (bad[i] ? ' nv-bbad nv-shake' : '')} value={okS[i] ? r.ans : v[i]} disabled={okS[i]} placeholder="00:00" inputMode="numeric"
            onChange={(e) => judge(i, e.target.value, false)} onBlur={(e) => judge(i, e.target.value, true)} onKeyDown={(e) => { if (e.key === 'Enter') judge(i, v[i], true); }} /></td><td>{r.label}</td></tr>))}</tbody></table>
      <Msg ok={done} bad={bad.some(Boolean)} />
      <HintBox lines={item.hint ?? []} item={item} />
    </div>
  );
}

/** 모범 글 따라 쓰기(자유): 문장 틀의 빈칸을 자기 말로 채운다. 칸이 비어 있지 않고 길이 조건만 보며, 평가는 AI 힌트와 함께 확장 */
export function MFree({ item, onDone }: KindProps) {
  const lines: string[] = item.lines ?? []; const n = lines.join(' ').split('{}').length - 1;
  const [v, setV] = useState<string[]>(Array(n).fill('')); const [ok, setOk] = useState(false); const [bad, setBad] = useState(false);
  let bi = 0;
  function submit() { if (v.every((x) => x.trim().length >= 2)) { setOk(true); onDone([{ tag: 'write', ok: true }]); } else { setBad(true); setTimeout(() => setBad(false), 700); } }
  return (
    <div className="nv-body">
      {item.topic && <div className="nv-topic">{item.topicLabel || '상품'} : <b>{item.topic}</b></div>}
      <div className="nv-bl nv-bl-box">
        {lines.map((l, li) => (
          <p key={li}>{l.split('{}').map((seg, si, arr) => {
            const idx = si < arr.length - 1 ? bi++ : -1;
            return <span key={si}><Rich text={seg} />{idx >= 0 && <input className={'nv-blank nv-blank-w' + (bad && !v[idx].trim() ? ' nv-bbad nv-shake' : '')} disabled={ok} value={v[idx]} autoCapitalize="off" spellCheck={false} onChange={(e) => setV(v.map((x, k) => (k === idx ? e.target.value : x)))} />}</span>;
          })}</p>))}
      </div>
      <button className="nv-btn" disabled={ok || v.every((x) => !x.trim())} onClick={submit}>다 썼어요</button>
      <Msg ok={ok} bad={bad} />
      <HintBox lines={item.hint ?? []} item={item} />
    </div>
  );
}

/** 글 쓰기 + 체크리스트: 쓰는 동안 규칙(체크 항목)이 하나씩 켜진다 */
export function SWrt({ item, onDone }: KindProps) {
  const rules: { label: string; re?: string }[] = item.rules ?? []; const [v, setV] = useState(''); const [ok, setOk] = useState(false);
  const hit = rules.map((r) => { try { return r.re ? new RegExp(r.re, 'i').test(v) : false; } catch { return false; } });
  const sents = v.split(/[.!?]+/).filter((s) => s.trim().length > 1).length;
  const need = item.minSent ?? 1; const all = hit.every(Boolean) && sents >= need;
  return (
    <div className="nv-body nv-bodyw">
      <div className="nv-split nv-split-w">
        <div className="nv-chk">
          {item.title && <b className="nv-chkt">{item.title}</b>}
          {rules.map((r, i) => <p key={i} className={hit[i] ? 'on' : ''}><span>{hit[i] ? '●' : '○'}</span> {r.label}</p>)}
          <p className={sents >= need ? 'on' : ''}><span>{sents >= need ? '●' : '○'}</span> {need}문장 이상</p>
        </div>
        <textarea className="nv-wta" disabled={ok} value={v} placeholder={item.starter ?? '여기에 써 보세요'} onChange={(e) => setV(e.target.value)} />
      </div>
      <button className="nv-btn" disabled={ok || !all} onClick={() => { setOk(true); onDone([{ tag: 'write', ok: true }]); }}>제출하기</button>
      <Msg ok={ok} bad={false} />
      <HintBox lines={item.hint ?? []} item={item} />
    </div>
  );
}
void plain;
