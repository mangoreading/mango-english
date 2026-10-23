import { useMemo, useState } from 'react';
import type { Res, VWord } from './common';
import { VCards, VMatch, VSound, VSpell, VType1, VWrite } from './kinds';

export interface NativeResult { results: Res[]; total: number; scored: number }
interface Props {
  title: string; items: Record<string, any>[]; vocab: VWord[]; nextLabel?: string; // eslint-disable-line @typescript-eslint/no-explicit-any
  onResult: (r: NativeResult) => void;
  onFinish: (a: 'next' | 'again' | 'exit') => void;
}
const INST: Record<string, string> = {
  vcards: '제시하는 단어를 익히고, 소리를 들으며 따라해 보세요',
  vtype1: '단어를 직접 써보며 익히세요.',
  vspell: '단어를 완성해 보세요',
  vmatch: '단어와 한글 뜻을 매칭해 보세요.',
  vsound: '소리를 듣고 단어를 매칭해 보세요.',
  vwrite: '단어를 직접 써보며 익히세요.',
};
const KIND = { vcards: VCards, vtype1: VType1, vspell: VSpell, vmatch: VMatch, vsound: VSound, vwrite: VWrite } as const;

/** 어휘 활동 6종 재생기: 문항(화면)을 차례로 보여 주고, 끝나면 결과 화면을 보여 준다. */
export function NativePlayer({ title, items, vocab, nextLabel, onResult, onFinish }: Props) {
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);
  const [all, setAll] = useState<Res[]>([]);
  const [fin, setFin] = useState(false);
  const [pts, setPts] = useState(0);
  const byKey = useMemo(() => new Map(vocab.map((v) => [v.key, v])), [vocab]);
  const it = items[i];

  if (fin) {
    const scored = all.filter((r) => r.tag); const ok = scored.filter((r) => r.ok).length;
    const pct = scored.length ? ok / scored.length : 1; const st = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
    return (
      <div className="nv-overlay"><div className="nv-result">
        <h1>{st === 3 ? '완벽해요!' : st === 2 ? '잘했어요!' : '끝까지 해냈어요!'}</h1>
        <div className="nv-stars">{[1, 2, 3].map((n) => <span key={n} style={{ color: n <= st ? '#FFC000' : '#D9DEE8' }}>★</span>)}</div>
        <p className="nv-sum">{scored.length ? `첫 시도 정답 ${ok}/${scored.length}` : '모든 단어를 익혔어요'} · 포인트 +{pts}</p>
        <div className="nv-btns">
          {nextLabel && <button className="nv-btn nv-btn-lg" onClick={() => onFinish('next')}>다음: {nextLabel}</button>}
          <button className="nv-btn nv-ghost" onClick={() => onFinish('again')}>다시 하기</button>
          <button className="nv-btn nv-ghost" onClick={() => onFinish('exit')}>나가기</button>
        </div>
      </div></div>
    );
  }

  const keys: string[] = it.k === 'vspell' ? [it.word] : it.words ?? [];
  const words = keys.map((k) => byKey.get(k)).filter(Boolean) as VWord[];
  const Comp = KIND[it.k as keyof typeof KIND];
  const last = i === items.length - 1;
  function onDone(res: Res[]) { setAll((a) => [...a, ...res]); setPts((p) => p + 5 * Math.max(1, res.filter((r) => r.ok).length)); setDone(true); }
  function next() {
    if (last) { const results = all; onResult({ results, total: items.length, scored: results.filter((r) => r.tag).length }); setFin(true); }
    else { setI(i + 1); setDone(false); }
  }

  return (
    <div className="nv-overlay">
      <div className="nv-head">
        <button className="nv-x" onClick={() => onFinish('exit')} aria-label="나가기">‹</button>
        <b>{title}</b>
        <span className="nv-dots">{items.map((_, k) => <i key={k} className={k < i ? 'd1' : k === i ? 'd2' : ''} />)}</span>
        <span className="nv-pts">★ 포인트 : +{pts}</span>
      </div>
      <p className="nv-inst">{it.inst || INST[it.k] || ''}</p>
      {!Comp || words.length !== keys.length
        ? <p className="nv-hint">이 문항에 쓰인 단어가 단원 어휘에 없어요. 관리자에서 단어를 확인해 주세요. ({keys.filter((k) => !byKey.has(k)).join(', ')})</p>
        : <Comp key={i} item={it} words={words} onDone={onDone} />}
      <div className="nv-foot"><button className="nv-btn nv-btn-lg" disabled={!done} onClick={next}>{last ? '결과 보기' : '다음'}</button></div>
    </div>
  );
}
