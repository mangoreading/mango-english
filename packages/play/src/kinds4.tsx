import { useEffect, useMemo, useRef, useState } from 'react';
import { aiHandlers, imgSrc, say, shuffle, type KindProps } from './common';
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
const Ko = ({ t }: { t?: string }) => <div className="nv-koslot">{t ? <div className="nv-kobar">{t}</div> : null}</div>;
const Msg = ({ ok, bad }: { ok: boolean; bad: boolean }) => <Fb className={'nv-fbmsg' + (ok || bad ? ' on' : '') + (bad ? ' nv-fbbad' : '')}>{ok ? '정답이에요! 👏' : bad ? '다시 한번 써 보세요' : ''}</Fb>;

/** 우리말을 보고 영어 문장 쓰기. mode=cap: 캡슐 안에 쓰기(M29) / box: 문장 틀(빈칸) + 아래 입력칸(M31). 확인 버튼 없이 맞으면 바로, 틀리면 Enter·칸 이탈 때 알려 준다 */
function SB({ item, onDone, mode }: KindProps & { mode: 'cap' | 'box' }) {
  const [v, setV] = useState(''); const [ok, setOk] = useState(false); const [bad, setBad] = useState(false); const wrong = useRef(false);
  const ans: string = item.ans ?? '';
  const all = [ans, ...(item.alts ?? [])].join('|');
  function judge(val: string, final: boolean) {
    setV(val);
    if (ok || !val.trim()) return;
    if (accepts(val, all)) { setOk(true); setBad(false); say(ans); onDone([{ tag: 'write', ok: !wrong.current }]); }
    else if (final) { wrong.current = true; setBad(true); setTimeout(() => setBad(false), 700); }
  }
  const input = <input className={'nv-winput' + (mode === 'cap' ? ' nv-winput-cap' : '') + (ok ? ' nv-wok' : '') + (bad ? ' nv-wbad' : '')} value={ok ? ans : v} disabled={ok} placeholder={mode === 'cap' ? '' : '정답을 써 보세요'} autoCapitalize="off" autoCorrect="off" spellCheck={false}
    onChange={(e) => judge(e.target.value, false)} onBlur={(e) => judge(e.target.value, true)} onKeyDown={(e) => { if (e.key === 'Enter') judge(v, true); }} />;
  const tpl: string = item.tpl ?? '';
  return (
    <div className="nv-body nv-wbody nv-wtop">
      <Ko t={item.ko} />
      {mode === 'box' && tpl && <div className="nv-capsule nv-capsule-tpl nv-main">{tpl.replace('{}', '__________')}</div>}
      {mode === 'cap' ? <div className={'nv-capsule nv-capsule-in nv-main' + (ok ? ' nv-okc' : '') + (bad ? ' nv-shake nv-badc' : '')}>{input}</div> : null}
      <div className="nv-subslot">{mode === 'box' && <div className={'nv-pillin' + (bad ? ' nv-shake' : '')}>{input}</div>}
        <HintBox lines={item.hint?.length ? item.hint : [initials(ans), item.starter ? `${item.starter} 로 시작해 보세요` : ''].filter(Boolean)} item={item} ctx={() => ({ input: v, wrong: wrong.current ? 1 : 0 })} /></div>
    </div>
  );
}
export const SBuild = (p: KindProps) => <SB {...p} mode="cap" />;
export const SWrite = (p: KindProps) => <SB {...p} mode="box" />;

/** 빈칸이 들어 있는 줄들. {} 하나가 입력칸 하나, 정답은 순서대로 ans[]. 칸마다 맞으면 바로 고정, 틀리면 Enter·칸 이탈 때 표시 (확인 버튼 없음) */
function Blanks({ lines, ans, big, cap, box, onDone, tag }: { lines: string[]; ans: string[]; big?: boolean; cap?: boolean; box?: boolean; onDone: KindProps['onDone']; tag: string }) {
  const [vals, setVals] = useState<string[]>(ans.map(() => '')); const [okS, setOkS] = useState<boolean[]>(ans.map(() => false));
  const [bad, setBad] = useState<boolean[]>(ans.map(() => false)); const wrong = useRef<boolean[]>(ans.map(() => false)); const fired = useRef(false);
  function judge(i: number, val: string, final: boolean) {
    setVals((x) => x.map((y, k) => (k === i ? val : y)));
    if (okS[i] || !val.trim()) return;
    if (accepts(val, ans[i])) {
      const o = okS.map((y, k) => (k === i ? true : y)); setOkS(o); setBad((b) => b.map((y, k) => (k === i ? false : y)));
      if (!fired.current && o.every(Boolean)) { fired.current = true; onDone(ans.map((_, k) => ({ tag, ok: !wrong.current[k] }))); }
    } else if (final) { wrong.current[i] = true; setBad((b) => b.map((y, k) => (k === i ? true : y))); setTimeout(() => setBad((b) => b.map((y, k) => (k === i ? false : y))), 700); }
  }
  let bi = 0;
  return (
    <div className={'nv-bl' + (big ? ' nv-bl-big' : '') + (cap ? ' nv-capsule nv-capsule-bl nv-main' : '') + (box ? ' nv-bl-box' : '')}>
      {lines.map((l, li) => (
        <p key={li}>{l.split('{}').map((seg, si, arr) => {
          const idx = si < arr.length - 1 ? bi++ : -1;
          return <span key={si}><Rich text={seg} />{idx >= 0 && (
            <input className={'nv-blank' + (okS[idx] ? ' nv-bok' : '') + (bad[idx] ? ' nv-bbad nv-shake' : '')} style={{ width: Math.max(4, ans[idx].split('|')[0].length * 0.78 + 1.6) + 'em' }}
              value={okS[idx] ? ans[idx].split('|')[0] : vals[idx]} disabled={okS[idx]} autoCapitalize="off" autoCorrect="off" spellCheck={false}
              onChange={(e) => judge(idx, e.target.value, false)} onBlur={(e) => judge(idx, e.target.value, true)} onKeyDown={(e) => { if (e.key === 'Enter') judge(idx, vals[idx], true); }} />)}</span>;
        })}</p>))}
    </div>
  );
}
/** 빈칸 단어 쓰기: 한글 뜻 줄 + 문장 캡슐(빈칸) + 힌트 */
export function SFill({ item, onDone }: KindProps) {
  return (
    <div className="nv-body nv-wbody nv-wtop">
      <Ko t={item.ko} />
      <Blanks lines={[item.tpl ?? '{}']} ans={[item.ans ?? '']} big cap onDone={onDone} tag="write" />
      <div className="nv-subslot"><HintBox lines={item.hint?.length ? item.hint : [initials(String(item.tpl ?? '').replace('{}', (item.ans ?? '').split('|')[0]))]} item={item} /></div>
    </div>
  );
}
/** 그림 보고 대화 완성하기 (Key Expression 대화 빈칸) */
export function DFill({ item, pic, onDone }: KindProps) {
  const src = pic(item.pic);
  return (
    <div className="nv-body nv-wbody">
      <div className="nv-picwrap nv-dfpic">{src && <img className="nv-img nv-img-md" src={imgSrc(src)} alt="" draggable={false} />}{src && item.tag2 && <span className="nv-price">{item.tag2}</span>}</div>
      <Blanks lines={item.lines ?? []} ans={item.ans ?? []} big box onDone={onDone} tag="write" />
      <HintBox lines={item.hint ?? []} item={item} />
    </div>
  );
}

/** 단어 칩 순서대로 눌러 문장 만들기 (M32) */
export function SScram({ item, onDone }: KindProps) {
  const ans: string = item.ans ?? ''; const wordsA = ans.split(/\s+/).filter(Boolean);
  const chips = useMemo(() => shuffle([...wordsA, ...(item.extra ?? [])].map((t, id) => ({ id, t }))), [item]); // eslint-disable-line
  const [seq, setSeq] = useState<number[]>([]); const [ok, setOk] = useState(false); const [bad, setBad] = useState(false); const wrong = useRef(false);
  const text = (ids: number[]) => ids.map((i) => chips.find((c) => c.id === i)!.t).join(' ');
  function tap(id: number) {
    if (ok || bad || seq.includes(id)) return;
    const n = [...seq, id]; setSeq(n);
    if (n.length === wordsA.length) {
      if (accepts(text(n), [ans, ...(item.alts ?? [])].join('|'))) { setOk(true); say(ans); onDone([{ tag: 'write', ok: !wrong.current }]); }
      else { wrong.current = true; setBad(true); setTimeout(() => { setBad(false); setSeq([]); }, 800); }
    }
  }
  return (
    <div className="nv-body nv-wbody nv-wtop">
      <Ko t={item.ko} />
      <div className={'nv-capsule nv-capsule-chips nv-main' + (ok ? ' nv-okc' : '') + (bad ? ' nv-shake nv-badc' : '')}>
        {seq.map((id) => <button key={id} className="nv-chipb nv-placed" onClick={() => !ok && !bad && setSeq(seq.filter((x) => x !== id))}>{chips.find((c) => c.id === id)!.t}</button>)}
      </div>
      <div className="nv-subslot"><div className="nv-chips nv-chips-bank">{chips.map((c) => <button key={c.id} className="nv-chipb" disabled={seq.includes(c.id)} onClick={() => tap(c.id)}>{c.t}</button>)}</div>
        <HintBox lines={item.hint ?? []} item={item} /></div>
    </div>
  );
}

/** 문장(대화)을 순서대로 맞추기 (M33): 끌어서 옮기거나, 한 줄을 누르고 옮길 자리를 눌러 맞바꾼다. 맞으면 바로 완료 */
export function SOrder({ item, onDone }: KindProps) {
  const rows: { en: string; ko?: string }[] = item.items ?? [];
  const [order, setOrder] = useState<number[]>(() => { let o = shuffle(rows.map((_, i) => i)); let g = 0; while (rows.length > 1 && o.every((x, i) => x === i) && g++ < 9) o = shuffle(o); return o; });
  const [ko, setKo] = useState(true); const [drag, setDrag] = useState<number | null>(null); const [sel, setSel] = useState<number | null>(null);
  const [ok, setOk] = useState(false); const wrong = useRef(false);
  const [landed, setLanded] = useState<number | null>(null); const lt = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 옮긴 문장을 1초쯤 노란색으로 남겼다가 서서히 사라지게 해서, 제대로 놓였는지 알 수 있게 한다 */
  function flash(r: number) { setLanded(r); if (lt.current) clearTimeout(lt.current); lt.current = setTimeout(() => setLanded(null), 1000); }
  function apply(n: number[], moved: number) {
    flash(moved); setOrder(n);
    if (n.every((x, i) => x === i)) { setOk(true); onDone([{ tag: 'write', ok: !wrong.current }]); }
  }
  const move = (a: number, b: number) => { if (ok || a === b) return; const n = [...order]; const [x] = n.splice(a, 1); n.splice(b, 0, x); apply(n, x); };
  const swap = (a: number, b: number) => { const n = [...order]; [n[a], n[b]] = [n[b], n[a]]; apply(n, order[a]); };
  function tapRow(pos: number) { if (ok) return; if (sel == null) setSel(pos); else if (sel === pos) setSel(null); else { swap(sel, pos); setSel(null); } }
  return (
    <div className="nv-body nv-wbody">
      <div className="nv-toolrow"><button type="button" className={'nv-kobtn' + (ko ? ' on' : '')} onClick={() => setKo(!ko)}>한</button></div>
      <div className="nv-ord">
        {order.map((r, pos) => (
          <div key={r} className={'nv-ordi' + (drag === pos ? ' nv-drag' : '') + (sel === pos ? ' nv-sel' : '') + (landed === r ? ' nv-landed' : '') + (ok ? ' nv-right' : '')} draggable={!ok}
            onClick={() => tapRow(pos)}
            onDragStart={() => { setDrag(pos); setSel(null); }} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag != null) move(drag, pos); setDrag(null); }} onDragEnd={() => setDrag(null)}>
            <span className="nv-tt"><b>{rows[r].en}</b>{rows[r].ko && <i className={ko ? '' : 'nv-hid'}>{rows[r].ko}</i>}</span>
          </div>))}
      </div>
      <p className="nv-ordtip">문장을 위아래로 끌어 옮기거나, 두 문장을 차례로 눌러 자리를 바꿔요.</p>
    </div>
  );
}

/** 보기 단어를 눌러 글의 빈칸 채우기 (모범 글 완성 / 글 빈칸 채우기 공용). 보기 줄은 그대로 두고 쓴 것만 흐리게 */
function WB({ item, onDone, tag }: KindProps & { tag: string }) {
  const ans: string[] = item.ans ?? []; const lines: string[] = item.lines ?? [];
  const bank = useMemo(() => shuffle([...ans, ...(item.extra ?? [])].map((t, id) => ({ id, t }))), [item]); // eslint-disable-line
  const [slots, setSlots] = useState<(number | null)[]>(ans.map(() => null)); const [bad, setBad] = useState<boolean[]>(ans.map(() => false));
  const [ok, setOk] = useState(false); const wrong = useRef<boolean[]>(ans.map(() => false));
  const txt = (id: number | null) => (id == null ? '' : bank.find((b) => b.id === id)!.t);
  const [dragId, setDragId] = useState<number | null>(null); const [over, setOver] = useState<number | null>(null);
  /** 보기를 칸에 넣는다. at 이 없으면 비어 있는 첫 칸(위에서부터), 있으면 그 칸(이미 찬 칸이면 바꿔 넣음) */
  function put(id: number, at?: number) {
    if (ok || bad.some(Boolean)) return;
    const n0 = slots.map((x) => (x === id ? null : x)); // 이미 다른 칸에 있던 보기는 옮긴다
    const k = at ?? n0.indexOf(null); if (k == null || k < 0) return;
    const n = [...n0]; n[k] = id; setSlots(n);
    if (!n.includes(null)) {
      const b = n.map((x, i) => !accepts(txt(x), ans[i]));
      if (b.some(Boolean)) { b.forEach((x, i) => { if (x) wrong.current[i] = true; }); setBad(b); setTimeout(() => { setBad(ans.map(() => false)); setSlots(n.map((x, i) => (b[i] ? null : x))); }, 800); }
      else { setOk(true); onDone(ans.map((_, i) => ({ tag, ok: !wrong.current[i] }))); }
    }
  }
  let bi = 0;
  return (
    <div className="nv-body nv-wbody">
      <div className="nv-chips nv-chips-bank">{bank.map((c) => <button key={c.id} className="nv-chipb" draggable={!slots.includes(c.id) && !ok} onDragStart={() => setDragId(c.id)} onDragEnd={() => { setDragId(null); setOver(null); }} disabled={slots.includes(c.id)} onClick={() => put(c.id)}>{c.t}</button>)}</div>
      <div className="nv-bl nv-bl-box nv-bl-fix">
        {lines.map((l, li) => (
          <p key={li}>{l.split('{}').map((seg, si, arr) => {
            const idx = si < arr.length - 1 ? bi++ : -1;
            return <span key={si}><Rich text={seg} />{idx >= 0 && <button onDragOver={(e) => { e.preventDefault(); setOver(idx); }} onDragLeave={() => setOver(null)} onDrop={(e) => { e.preventDefault(); if (dragId != null) put(dragId, idx); setDragId(null); setOver(null); }} className={'nv-slotb' + (over === idx ? ' nv-over' : '') + (slots[idx] != null ? ' filled' : '') + (bad[idx] ? ' nv-bbad nv-shake' : '') + (ok ? ' nv-bok' : '')} onClick={() => !ok && slots[idx] != null && setSlots(slots.map((x, k) => (k === idx ? null : x)))}>{txt(slots[idx])}</button>}</span>;
          })}</p>))}
      </div>
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

/** 모범 글 따라 쓰기(자유): 위의 '상품' 칸은 학생이 직접 쓰고, 문장 틀의 빈칸도 자기 말로 채운다. 모든 칸에 2자 이상 쓰고 칸을 벗어나면 완료 */
export function MFree({ item, onDone }: KindProps) {
  const lines: string[] = item.lines ?? []; const n = lines.join(' ').split('{}').length - 1;
  const [v, setV] = useState<string[]>(Array(n).fill('')); const [topic, setTopic] = useState(''); const [ok, setOk] = useState(false); const fired = useRef(false);
  let bi = 0;
  function settle(vals: string[], t: string) { if (!fired.current && t.trim().length >= 2 && vals.every((x) => x.trim().length >= 2)) { fired.current = true; setOk(true); onDone([{ tag: 'write', ok: true }]); } }
  return (
    <div className="nv-body nv-wbody">
      <div className="nv-topic">{item.topicLabel || '상품'} : <input className="nv-topicin" value={topic} disabled={ok} autoCapitalize="off" spellCheck={false}
        onChange={(e) => setTopic(e.target.value)} onBlur={() => settle(v, topic)} onKeyDown={(e) => { if (e.key === 'Enter') settle(v, topic); }} /></div>
      <div className="nv-bl nv-bl-box nv-bl-fix nv-bl-thick">
        {lines.map((l, li) => (
          <p key={li}>{l.split('{}').map((seg, si, arr) => {
            const idx = si < arr.length - 1 ? bi++ : -1;
            return <span key={si}><Rich text={seg} />{idx >= 0 && <input className={'nv-blank nv-blank-w' + (ok ? ' nv-bok' : '')} disabled={ok} value={v[idx]} autoCapitalize="off" spellCheck={false}
              onChange={(e) => setV(v.map((x, k) => (k === idx ? e.target.value : x)))} onBlur={() => settle(v, topic)} onKeyDown={(e) => { if (e.key === 'Enter') settle(v, topic); }} />}</span>;
          })}</p>))}
      </div>
      <HintBox lines={item.hint ?? []} item={item} />
    </div>
  );
}

/** 글 쓰기 + 체크리스트: 학생이 쓴 글을 AI가 읽고 체크 항목을 켠다(AI가 없으면 찾을 패턴으로 대신). 모두 켜지고 문장이 끝나면 바로 완료 */
export function SWrt({ item, onDone }: KindProps) {
  const rules: { label: string; re?: string }[] = item.rules ?? []; const [v, setV] = useState(''); const [ok, setOk] = useState(false); const fired = useRef(false);
  const [ai, setAi] = useState<boolean[] | null>(null); const seq = useRef(0);
  const reHit = (t: string) => rules.map((r) => { try { return r.re ? new RegExp(r.re, 'i').test(t) : false; } catch { return false; } });
  const sentsOf = (t: string) => t.split(/[.!?]+/).filter((x) => x.trim().length > 1).length;
  const hit = ai ?? reHit(v); const sents = sentsOf(v); const need = item.minSent ?? 1;
  function finish(h: boolean[], t: string) {
    if (!fired.current && h.every(Boolean) && sentsOf(t) >= need && /[.!?]\s*$/.test(t.trim())) { fired.current = true; setOk(true); onDone([{ tag: 'write', ok: true }]); }
  }
  useEffect(() => {
    if (!aiHandlers.check || !v.trim() || ok) return;
    const my = ++seq.current;
    const id = setTimeout(async () => {
      try { const r = await aiHandlers.check!({ text: v, rules: rules.map((x) => x.label) }); if (my === seq.current) { setAi(r); finish(r, v); } }
      catch { if (my === seq.current) setAi(null); }
    }, 1100);
    return () => clearTimeout(id);
    // eslint-disable-next-line
  }, [v]);
  function change(t: string) { setV(t); if (!aiHandlers.check) finish(reHit(t), t); }
  return (
    <div className="nv-body nv-wbody nv-bodyw">
      <div className="nv-split nv-split-w">
        <div className="nv-chk">
          {item.title && <b className="nv-chkt">{item.title}</b>}
          {rules.map((r, i) => <p key={i} className={hit[i] ? 'on' : ''}><span>{hit[i] ? '●' : '○'}</span> {r.label}</p>)}
          <p className={sents >= need ? 'on' : ''}><span>{sents >= need ? '●' : '○'}</span> {need}문장 이상</p>
        </div>
        <textarea className="nv-wta" disabled={ok} value={v} placeholder={item.starter ?? '여기에 써 보세요'} onChange={(e) => change(e.target.value)} />
      </div>
      <HintBox lines={item.hint ?? []} item={item} ctx={() => ({ input: v, wrong: 0 })} />
    </div>
  );
}
void plain;
