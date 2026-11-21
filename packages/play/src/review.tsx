import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Rich } from './kinds3';
import { saySeq, stopSeq } from './common';

/** "해석과 해설" 쪽의 한 행: 말하는 사람(또는 쪽 번호), 영어 줄들(굵게), 한글 해석 */
export interface RvRow { who?: string | number; lines: ReactNode[]; ko?: string }

/** "해석과 해설" 공통 화면 (Scene · 세트 템플릿 모두 이것을 쓴다).
 *  rows 의 영어 줄에 위에서부터 번호를 매기고, speak[번호] 를 차례로 읽어 주면서 읽는 줄을 하이라이트하고 다음 줄까지 보이게 스크롤한다. */
export function ReviewPanel({ rows, speak, explain }: { rows: RvRow[]; speak: string[]; explain?: string[] }) {
  const [cur, setCur] = useState(-1); const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => () => stopSeq(), []);
  useEffect(() => {
    if (cur < 0) return;
    const q = (n: number) => listRef.current?.querySelector(`[data-li="${n}"]`);
    const t = q(cur + 1) ?? q(cur);
    (t?.closest('.nv-rv-row') ?? t)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [cur]);
  let gi = 0;
  return (
    <div className="nv-rv">
      <p className="nv-rv-t">해석과 해설</p>
      <div className="nv-rv-list" ref={listRef}>{rows.map((r, ri) => (
        <div key={ri} className="nv-rv-row"><span className="nv-rv-who">{r.who}</span>
          <div>{r.lines.map((ln, li) => { const n = gi++; return <b key={li} data-li={n} className={n === cur ? 'nv-rv-hl' : undefined}>{ln}</b>; })}{r.ko && <small>{r.ko}</small>}</div>
        </div>))}</div>
      <div className="nv-ptools nv-rv-tools"><button type="button" className="nv-listen nv-listen-s" onClick={() => { stopSeq(); saySeq(speak, { onLine: setCur, onDone: () => setCur(-1), gap: () => 300 }); }}><i className="nv-sico" aria-hidden="true" /> <b>전체 듣기</b></button></div>
      {!!explain?.length && <div className="nv-rv-ex">{explain.map((l, i) => <p key={i}><Rich text={l} /></p>)}</div>}
    </div>
  );
}
