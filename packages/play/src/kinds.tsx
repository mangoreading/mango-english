import { useEffect, useMemo, useRef, useState } from 'react';
import { imgSrc, norm, say, sayThen, shuffle, type KindProps, type Res } from './common';

const T = 'vocab';
const Pic = ({ src, cls }: { src: string | null; cls?: string }) => (src ? <img className={cls ?? 'nv-img'} src={imgSrc(src)} alt="" draggable={false} /> : <div className={cls ?? 'nv-img'} />);

/** ① 단어 카드 보기: 카드를 눌러 소리를 듣는다. 한글 뜻/영어 단어를 가리고 스스로 확인할 수도 있다. */
export function VCards({ words, onDone }: KindProps) {
  const [heard, setHeard] = useState<Set<string>>(new Set());
  const [hideKo, setHideKo] = useState(false); const [hideEn, setHideEn] = useState(false);
  const fired = useRef(false);
  useEffect(() => { if (!fired.current && heard.size === words.length) { fired.current = true; onDone([]); } /* eslint-disable-next-line */ }, [heard]);
  return (
    <div className="nv-body">
      <div className="nv-opts">
        <label><input type="checkbox" checked={hideKo} onChange={(e) => setHideKo(e.target.checked)} />한글뜻 가리기</label>
        <label><input type="checkbox" checked={hideEn} onChange={(e) => setHideEn(e.target.checked)} />영어단어 가리기</label>
      </div>
      <div className="nv-grid3">
        {words.map((w) => (
          <button key={w.key} className={'nv-card' + (heard.has(w.key) ? ' nv-heard' : '')} onClick={() => { say(w.en); setHeard(new Set(heard).add(w.key)); }}>
            <Pic src={w.image} />
            <b className={hideEn ? 'nv-hid' : ''}>{w.en}</b>
            <span className={hideKo ? 'nv-hid' : ''}>{w.ko}</span>
          </button>
        ))}
      </div>
      <p className="nv-hint">카드를 눌러 소리를 들어 보세요 ({heard.size}/{words.length})</p>
    </div>
  );
}

/** ② 단어 따라 쓰기: 한 개씩 보면서 입력한다. */
export function VType1({ words, onDone }: KindProps) {
  const [i, setI] = useState(0);
  const [val, setVal] = useState('');
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [wrong, setWrong] = useState<Record<string, boolean>>({});
  const [shake, setShake] = useState(false);
  const w = words[i];
  useEffect(() => { say(w.en); /* 카드가 열리면 자동으로 소리 */ }, [i]); // eslint-disable-line
  const finish = (d: Record<string, boolean>) => { if (words.every((x) => d[x.key])) onDone(words.map((x) => ({ tag: T, ok: !wrong[x.key] }))); };
  function check() {
    if (done[w.key]) return;
    if (norm(val) === norm(w.en)) {
      say(w.en);
      const d = { ...done, [w.key]: true }; setDone(d);
      const nextI = words.findIndex((x, k) => k > i && !d[x.key]);
      if (words.every((x) => d[x.key])) finish(d);
      else setTimeout(() => { go(nextI >= 0 ? nextI : words.findIndex((x) => !d[x.key])); }, 600);
    } else { setWrong({ ...wrong, [w.key]: true }); setShake(true); setTimeout(() => setShake(false), 400); }
  }
  function go(n: number) { if (n < 0 || n >= words.length) return; setI(n); setVal(''); }
  return (
    <div className="nv-body">
      <div className="nv-row nv-row-far">
        <button className="nv-arrow" disabled={i === 0} onClick={() => go(i - 1)} aria-label="이전">‹</button>
        <div className="nv-col">
          <div className={'nv-big' + (shake ? ' nv-shake' : '') + (done[w.key] ? ' nv-ok' : '')}>
            <Pic src={w.image} cls="nv-img nv-img-lg" />
            <b className="nv-word">{w.en}</b><span className="nv-ko">{w.ko}</span>
          </div>
          <div className="nv-inputrow">
            <input className="nv-input" value={done[w.key] ? w.en : val} disabled={!!done[w.key]} placeholder="단어를 따라 써 보세요" autoCapitalize="off" autoCorrect="off" spellCheck={false}
              onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') check(); }} />
            <button className="nv-btn" disabled={!!done[w.key] || !val.trim()} onClick={check}>확인</button>
          </div>
        </div>
        <button className="nv-arrow" disabled={i === words.length - 1} onClick={() => go(i + 1)} aria-label="다음">›</button>
      </div>
      <p className="nv-hint">{Object.keys(done).length}/{words.length} 완료</p>
    </div>
  );
}

/** ③ 철자 완성: 앞부분이 보이고, 나머지 글자를 눌러 채운다. */
export function VSpell({ item, words, onDone }: KindProps) {
  const w = words[0];
  const shown = Math.min(item.shown ?? Math.ceil(w.en.length / 2), w.en.length - 1);
  const rest = w.en.slice(shown);
  const tiles = useMemo(() => shuffle([...(rest + (item.extra ?? '')).split('')].map((c, id) => ({ id, c }))), [w.en, shown, item.extra]); // eslint-disable-line
  const [slots, setSlots] = useState<(number | null)[]>(Array(rest.length).fill(null));
  const [wrong, setWrong] = useState(false); const [shake, setShake] = useState(false); const [ok, setOk] = useState(false);
  function tap(id: number) {
    if (ok) return;
    const k = slots.indexOf(null); if (k < 0 || slots.includes(id)) return;
    const n = [...slots]; n[k] = id; setSlots(n);
    if (!n.includes(null)) {
      const guess = n.map((x) => tiles.find((t) => t.id === x)!.c).join('');
      if (guess === rest) { setOk(true); say(w.en); onDone([{ tag: T, ok: !wrong }]); }
      else { setWrong(true); setShake(true); setTimeout(() => { setShake(false); setSlots(Array(rest.length).fill(null)); }, 600); }
    }
  }
  function drop(k: number) { if (ok || slots[k] == null) return; const n = [...slots]; n[k] = null; setSlots(n); }
  return (
    <div className="nv-body">
      <div className={'nv-big' + (ok ? ' nv-ok' : '')}>
        <Pic src={w.image} cls="nv-img nv-img-lg" />
        <div className={'nv-spell' + (shake ? ' nv-shake' : '')}>
          <span className="nv-shown">{w.en.slice(0, shown)}</span>
          {slots.map((s, k) => <button key={k} className={'nv-slot' + (ok ? ' nv-slot-ok' : '')} onClick={() => drop(k)}>{s == null ? '' : tiles.find((t) => t.id === s)!.c}</button>)}
        </div>
        <span className="nv-ko">{w.ko}</span>
      </div>
      <div className="nv-tiles">
        {tiles.map((t) => <button key={t.id} className="nv-tile" disabled={slots.includes(t.id)} onClick={() => tap(t.id)}>{t.c}</button>)}
      </div>
    </div>
  );
}

interface Card { id: string; key: string; t: 'en' | 'ko' | 'snd'; label: string }
/** ④ 단어-뜻 매칭 / ⑤ 소리-단어 매칭: 카드 두 장을 차례로 눌러 짝을 맞춘다. */
function MatchBoard({ words, mode, onDone }: { words: KindProps['words']; mode: 'ko' | 'snd'; onDone: (r: Res[]) => void }) {
  // 4열 배치: 1열·4열 = 바깥 종류(단어-뜻이면 영어 단어, 소리-단어이면 소리), 2열·3열 = 안쪽 종류(한글 뜻 / 영어 단어)
  const cards = useMemo(() => {
    const outer = shuffle<Card>(words.map((w) => mode === 'ko'
      ? { id: w.key + ':en', key: w.key, t: 'en' as const, label: w.en }
      : { id: w.key + ':snd', key: w.key, t: 'snd' as const, label: '' }));
    const inner = shuffle<Card>(words.map((w) => mode === 'ko'
      ? { id: w.key + ':ko', key: w.key, t: 'ko' as const, label: w.ko }
      : { id: w.key + ':en', key: w.key, t: 'en' as const, label: w.en }));
    const rows = Math.ceil(words.length / 2);
    const out: (Card | null)[] = [];
    for (let r = 0; r < rows; r++) out.push(outer[r] ?? null, inner[r] ?? null, inner[rows + r] ?? null, outer[rows + r] ?? null);
    return out;
  }, [words, mode]);
  const [sel, setSel] = useState<Card | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongKeys, setWrongKeys] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState<string[]>([]);
  const [pop, setPop] = useState<KindProps['words'][number] | null>(null); // 맞췄을 때 가운데에 뜨는 카드
  const fired = useRef(false);
  useEffect(() => { if (!fired.current && matched.size === words.length && !pop) { fired.current = true; onDone(words.map((w) => ({ tag: T, ok: !wrongKeys.has(w.key) }))); } /* eslint-disable-next-line */ }, [matched, pop]);
  const textOf = (k: string) => words.find((w) => w.key === k)!;
  function tap(c: Card) {
    if (matched.has(c.key) || flash.length || pop) return;
    const isMatch = !!sel && sel.id !== c.id && sel.t !== c.t && sel.key === c.key;
    if (!isMatch && (c.t === 'snd' || c.t === 'en')) say(textOf(c.key).en); // 맞았을 때는 가운데 카드에서 읽어 준다(끊기지 않게)
    if (!sel) { setSel(c); return; }
    if (sel.id === c.id) { setSel(null); return; }
    if (sel.t === c.t) { setSel(c); return; }
    if (sel.key === c.key) {
      const w = textOf(c.key);
      setMatched(new Set(matched).add(c.key)); setSel(null); setPop(w);
      // 가운데 카드가 뜨면 단어를 끝까지 읽어 주고, 다 읽은 뒤(최소 1.6초) 카드를 닫는다
      const t0 = Date.now();
      setTimeout(() => sayThen(w.en, () => setTimeout(() => setPop(null), Math.max(600, 1600 - (Date.now() - t0)))), 250);
      return;
    }
    setWrongKeys(new Set(wrongKeys).add(sel.key).add(c.key));
    setFlash([sel.id, c.id]); setTimeout(() => { setFlash([]); setSel(null); }, 500);
  }
  return (
    <div className="nv-body">
      <div className={'nv-grid4'}>
        {cards.map((c, n) => {
          if (!c) return <div key={'x' + n} />;
          const cls = ['nv-m', c.t === 'en' ? 'nv-m-en' : c.t === 'snd' ? 'nv-m-snd' : 'nv-m-ko'];
          if (matched.has(c.key)) cls.push('nv-m-done'); if (sel?.id === c.id) cls.push('nv-m-sel'); if (flash.includes(c.id)) cls.push('nv-shake', 'nv-m-bad');
          return <button key={c.id} className={cls.join(' ')} onClick={() => tap(c)}>{c.t === 'snd' ? <i className="nv-sico" aria-hidden="true" /> : c.label}</button>;
        })}
      </div>
      <p className="nv-hint">{matched.size}/{words.length} 맞췄어요</p>
      {pop && (
        <div className="nv-pop" onClick={() => setPop(null)}>
          <div className="nv-pop-card">
            <Pic src={pop.image} cls="nv-img nv-img-lg" />
            <b className="nv-word">{pop.en}</b><span className="nv-ko">{pop.ko}</span>
          </div>
        </div>
      )}
    </div>
  );
}
export const VMatch = ({ words, onDone }: KindProps) => <MatchBoard words={words} mode="ko" onDone={onDone} />;
export const VSound = ({ words, onDone }: KindProps) => <MatchBoard words={words} mode="snd" onDone={onDone} />;

/** ⑥ 그림 보고 쓰기: 여러 단어를 한 화면에서 쓴다. 맞게 쓰면 바로 확인되고, 확인 버튼은 없다. */
export function VWrite({ words, onDone }: KindProps) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [ok, setOk] = useState<Record<string, boolean>>({});
  const [bad, setBad] = useState<Record<string, boolean>>({});
  const wrong = useRef<Record<string, boolean>>({});
  const fired = useRef(false);
  function update(w: KindProps['words'][number], v: string, final: boolean) {
    setVals((x) => ({ ...x, [w.key]: v }));
    if (norm(v) === norm(w.en)) {
      setBad((b) => ({ ...b, [w.key]: false }));
      setOk((o) => {
        const n = { ...o, [w.key]: true };
        if (!fired.current && words.every((x) => n[x.key])) { fired.current = true; setTimeout(() => onDone(words.map((x) => ({ tag: T, ok: !wrong.current[x.key] }))), 0); }
        return n;
      });
    } else if (v.trim() && (final || v.trim().length >= w.en.length)) { wrong.current[w.key] = true; setBad((b) => ({ ...b, [w.key]: true })); }
    else setBad((b) => ({ ...b, [w.key]: false }));
  }
  return (
    <div className="nv-body">
      <div className="nv-grid3">
        {words.map((w) => (
          <div key={w.key} className={'nv-card nv-card-w' + (ok[w.key] ? ' nv-heard' : '') + (bad[w.key] ? ' nv-bad' : '')}>
            <Pic src={w.image} />
            <input className="nv-input nv-input-s" value={ok[w.key] ? w.en : vals[w.key] ?? ''} disabled={!!ok[w.key]} autoCapitalize="off" autoCorrect="off" spellCheck={false}
              onChange={(e) => update(w, e.target.value, false)} onBlur={(e) => update(w, e.target.value, true)} />
            <span className="nv-ko-k">{w.ko}</span>
          </div>
        ))}
      </div>
      <p className="nv-hint">{Object.keys(ok).length}/{words.length} 맞췄어요</p>
    </div>
  );
}
