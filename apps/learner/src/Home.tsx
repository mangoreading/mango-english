import { useState } from 'react';
import { buildReport } from './reportCalc';
import { unitProgress, type ProgRow, type UnitInfo } from './home';

export type Tab = 'home' | 'reading' | 'report' | 'my';
/** 영어원서 탭 표시 여부(false 로 바꾸면 메뉴에서 숨겨짐, 화면 코드는 그대로 보존). */
export const SHOW_READING_TAB = true;
export const TAB_KO: [Tab, string][] = ([['home', '교과서'], ['reading', '영어원서'], ['report', 'Report'], ['my', 'MyPage']] as [Tab, string][]).filter(([k]) => k !== 'reading' || SHOW_READING_TAB);
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(3 - n);
export interface BookOpt { id: string; label: string; grade: number }

export function Nav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return <nav className="mx-nav">{TAB_KO.map(([k, n]) => <button key={k} className={tab === k ? 'mx-nav-on' : ''} onClick={() => setTab(k)}>{n}</button>)}</nav>;
}

function BookPick({ books, bookId, onBook }: { books: BookOpt[]; bookId: string; onBook: (id: string) => void }) {
  if (books.length < 2) return <span className="mx-chip">{books[0]?.label}</span>;
  return <select className="mx-bookpick" value={bookId} onChange={(e) => onBook(e.target.value)} aria-label="교재">{books.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}</select>;
}

/** 상단 차시 스텝의 번호 원: 둘레 선이 진행률, 지금 할 차시는 주황, 보고 있는 차시는 주황 테두리 */
function StepRing({ no, frac, cur, done, sel }: { no: number; frac: number; cur?: boolean; done?: boolean; sel?: boolean }) {
  const C = 2 * Math.PI * 21;
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden>
      <circle cx="26" cy="26" r="21" fill={cur ? '#FF9F1C' : sel ? '#FFF3DC' : '#fff'} stroke="#DCE4F2" strokeWidth="3.5" />
      {(cur || frac > 0 || sel) && <circle cx="26" cy="26" r="21" fill="none" stroke={cur ? '#FFE0A8' : sel ? '#FF9F1C' : done ? '#2FB26B' : '#4F7DF0'} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(sel && !cur ? 1 : cur ? 0.0001 : Math.min(frac, 1)) * C} ${C}`} transform="rotate(-90 26 26)" />}
      <text x="26" y="33" textAnchor="middle" fontSize="20" fontWeight="800" fill={cur ? '#3B2600' : sel ? '#B86A00' : '#5F6B85'}>{done ? '✓' : no}</text>
    </svg>
  );
}

/** 교과서: 지금 학습 중인 Lesson 의 8개 박스(1~6차시 · Lesson Report). 숙제는 주 단위로 2·4·6차시 상세에 모아 보여 준다 */
export function HomeView({ name, books, bookId, onBook, units, rows, unit, onUnit, onOpenUnit, onStart, onReport }: {
  name: string; books: BookOpt[]; bookId: string; onBook: (id: string) => void; units: UnitInfo[]; rows: ProgRow[]; unit: UnitInfo | null;
  onUnit: (id: string) => void; onOpenUnit: (u: UnitInfo, focusNo?: number) => void; onStart: (u: UnitInfo, a: { no: number; idx: number }) => void; onReport: (u: UnitInfo) => void;
}) {
  const [sel, setSel] = useState<number | null>(null);
  const [toc, setToc] = useState(false);
  if (!unit) return <div className="mx-card"><h2>학습할 Lesson이 아직 없어요</h2><p className="mx-muted">관리자가 Lesson을 발행하면 여기에 나타나요.</p></div>;
  const up = unitProgress(unit, rows);
  const idx = units.findIndex((u) => u.unit_id === unit.unit_id);
  const next = idx >= 0 ? units[idx + 1] : undefined, prev = idx > 0 ? units[idx - 1] : undefined;
  const curNo = up.current?.no;
  const core = (unit.bundle.flow ?? []).filter((l) => (l.track ?? 'core') === 'core').slice(0, 6);
  const shown: number = typeof sel === 'number' && up.lessons.some((l) => l.no === sel) ? sel : (curNo ?? up.lessons[0]?.no ?? 1);
  const detailLessons = up.lessons.filter((l) => l.no === shown);
  const pct = (d: number, t: number) => (t ? Math.round((d / t) * 100) : 0);
  return (
    <>
      <div className="mx-hello"><h1>{name ? `${name}님, ` : ''}오늘도 Mango English!</h1><BookPick books={books} bookId={bookId} onBook={onBook} /></div>
      {toc && (
        <div className="mx-toc-bg" onClick={() => setToc(false)}>
          <div className="mx-toc" role="dialog" aria-label="목차" onClick={(e) => e.stopPropagation()}>
            <div className="mx-toc-h"><b>목차</b><button onClick={() => setToc(false)} aria-label="닫기">✕</button></div>
            <ul>{units.map((u) => { const p = unitProgress(u, rows); return (
              <li key={u.unit_id}><button className={u.unit_id === unit.unit_id ? 'on' : ''} onClick={() => { onUnit(u.unit_id); setToc(false); }}>
                <span className="mx-chip">LESSON {u.unit_no}</span><span className="mx-toc-t">{u.unit_title}</span><small>{p.complete ? '완료' : p.pct + '%'}</small></button></li>); })}</ul>
          </div>
        </div>
      )}
      <div className="mx-card mx-now">
        <div className="mx-now-top">
          <button className="mx-arrow" disabled={!prev} onClick={() => prev && onUnit(prev.unit_id)} aria-label="이전 Lesson">◀</button>
          <div className="mx-now-title">
            <button className="mx-tocbtn" onClick={() => setToc(true)} aria-label="목차 열기" title="목차"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 6h12M8 12h12M8 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></svg></button><span className="mx-chip">LESSON {unit.unit_no}</span><h2>{unit.unit_title}</h2>
          </div>
          <button className="mx-arrow" disabled={!next} onClick={() => next && onUnit(next.unit_id)} aria-label="다음 Lesson">▶</button>
        </div>
        <nav className="mx-steps" aria-label="차시 선택">
          {Array.from({ length: 6 }, (_, i) => core[i]).map((l, i) => {
            const info = l ? up.lessons.find((x) => x.no === l.no) : undefined;
            if (!info) return <div key={i} className="mx-st mx-st-off"><StepRing no={i + 1} frac={0} /><span className="mx-st-t">{l ? (l.en || l.ko) : '준비 중'}</span></div>;
            const full = info.studyN > 0 && info.doneN >= info.studyN, on = !up.complete && info.no === curNo, selected = shown === info.no;
            return (
              <button key={i} className={'mx-st' + (on ? ' mx-st-cur' : '') + (selected ? ' mx-st-sel' : '') + (full ? ' mx-st-done' : '')} onClick={() => setSel(info.no)} aria-current={selected ? 'true' : undefined}>
                <StepRing no={info.no} frac={info.studyN ? info.doneN / info.studyN : 0} cur={on} done={full} sel={selected} />
                                <span className="mx-st-t">{info.en || info.ko}</span>
                {on && <em className="mx-st-now">지금</em>}
              </button>);
          })}
          <button className={'mx-st mx-st-rep' + (up.complete ? ' mx-st-done' : '')} disabled={!up.complete} onClick={() => onReport(unit)}>
            <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden><circle cx="26" cy="26" r="21" fill="#fff" stroke="#DCE4F2" strokeWidth="3.5" />
              <g fill="none" stroke={up.complete ? '#4F7DF0' : '#9AA5BC'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 16h14v20H19z" /><path d="M23 22h6M23 27h6" /></g></svg>
            <span className="mx-st-t">Lesson Report</span>
          </button>
        </nav>
        <div className="mx-nowbody">
          <section className="mx-detail" aria-label="차시 상세">
            {detailLessons.map((l) => {
              const todo = l.acts.find((x) => x.study && x.n > 0 && !x.done);
              const isWk = l.no % 2 === 0 || l.no === up.lessons[up.lessons.length - 1]?.no, wkNos = l.no % 2 === 0 ? [l.no - 1, l.no] : [l.no];
              const hw = isWk ? up.lessons.filter((x) => wkNos.includes(x.no)).flatMap((x) => x.acts.filter((a) => a.n > 0 && a.hw).map((a) => ({ ...a, no: x.no }))) : [], hwTodo = hw.find((x) => !x.done), hwDone = hw.length > 0 && !hwTodo, hwGo = hwTodo ?? hw[0], hwMin = hw.reduce((m, x) => m + (x.min || 0), 0) || 10;
              const go = todo, label = l.doneN > 0 ? '이어서 학습하기' : '학습 시작하기';
              const showGo = !!go && !up.complete && l.no === curNo;
              return (
              <div key={l.no} className="mx-dl">
                <div className="mx-dl-h"><span className="mx-lchip">{`${l.no}차시`}</span><h3>{l.en || l.ko}</h3><span className="mx-muted">{l.en ? l.ko : ''}</span>
                  {go && showGo && <button className={'mx-startbtn' + ' mx-startbtn-now'} onClick={() => onStart(unit, { no: l.no, idx: go.idx })}>{label} <span aria-hidden>→</span></button>}
                  {!(go && showGo) && <span className="mx-startbtn" style={{ visibility: 'hidden' }} aria-hidden>학습 시작하기 →</span>}</div>
                {l.goal && <p className="mx-dl-goal">{l.goal}</p>}
                <ul className="mx-dl-acts">
                  {l.acts.filter((a) => a.n > 0 && a.study).map((a) => (
                    <li key={a.idx}>
                      <button className={a.done ? 'mx-da mx-da-done' : 'mx-da'} onClick={() => onStart(unit, { no: l.no, idx: a.idx })}>
                        <span className="mx-da-mark">{a.done ? '✓' : ''}</span>
                        <span className="mx-da-t"><b>{a.t}</b><small>{a.ko}{a.study ? '' : ' · 숙제'} · {a.n}문항</small></span>
                        <span className="mx-da-st">{a.done ? stars(a.stars) : (up.current && l.no === up.current.no && up.current.idx === a.idx ? '지금 할 활동' : '')}</span>
                      </button>
                    </li>))}
                </ul>
                {hw.length > 0 && (
                  <div className={'mx-hw' + (hwDone ? ' mx-hw-done' : '')}>
                    <div className="mx-hw-h"><b><svg className="mx-hw-ico" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6z"/><path d="M6 3v18"/><path d="M10 8h5M10 12h5"/></svg> {l.no % 2 === 0 ? `이번 주 숙제 (${l.no - 1}~${l.no}차시)` : '숙제'}</b><span className="mx-muted">집에서 해요 · 약 {hwMin}분 · {hw.filter((x) => x.done).length}/{hw.length} 완료</span>
                      {hwGo && <button className="mx-hwbtn" onClick={() => onStart(unit, { no: hwGo.no, idx: hwGo.idx })}>{hwDone ? '숙제 다시 하기' : hw.some((x) => x.done) ? '숙제 이어서 하기' : '숙제 시작하기'} <span aria-hidden>→</span></button>}</div>
                    <ul className="mx-hw-l">{hw.map((x) => <li key={x.no * 100 + x.idx} className={x.done ? 'on' : ''}><button onClick={() => onStart(unit, { no: x.no, idx: x.idx })}><span>{x.done ? '✓' : '○'}</span>{x.t}</button></li>)}</ul>
                  </div>
                )}
              </div>);
            })}
          </section>
        </div>
      </div>
    </>
  );
}

/** 리포트 탭: Lesson 별 결과 리포트 모아 보기 */
export function ReportsView({ units, rows, onOpen }: { units: UnitInfo[]; rows: ProgRow[]; onOpen: (u: UnitInfo) => void }) {
  const items = units.map((u) => {
    const mine = new Map(rows.filter((r) => r.unit_id === u.unit_id && r.level === 'CORE').map((r) => [r.lesson * 1000 + r.act_idx, r]));
    const rep = u.bundle.flow ? buildReport(u.bundle.flow, (no, idx) => { const p = mine.get(no * 1000 + idx); return p ? { ok: p.ok, total: p.total } : undefined; }) : null;
    return { u, rep, p: unitProgress(u, rows) };
  });
  return (
    <>
      <h1>나의 리포트</h1>
      <div className="mx-grid">
        {items.map(({ u, rep, p }) => (
          <div key={u.unit_id} className="mx-card mx-repcard">
            <span className="mx-chip">LESSON {u.unit_no}</span><b>{u.unit_title}</b>
            {rep ? <><div className="mx-rep-big"><b>{rep.pct ?? '-'}<small>{rep.pct == null ? '' : '%'}</small></b><span className="mx-rep-stars">{stars(rep.stars)}</span></div>
              <span className="mx-muted">{rep.complete ? '6차시 완료' : '진행 중인 결과'} · 영역 {rep.areas.length}개</span>
              <button className="mx-btn" onClick={() => onOpen(u)}>리포트 보기</button></>
              : <><span className="mx-muted">{p.started ? '마지막 차시를 시작하면 리포트가 생겨요.' : '아직 학습 기록이 없어요.'}</span><button className="mx-btn" disabled>리포트 없음</button></>}
          </div>))}
      </div>
      {!items.length && <div className="mx-card"><p className="mx-muted">발행된 Lesson이 없어요.</p></div>}
    </>
  );
}

/** My Page: 내 정보, 학습 요약, 교재 설정 */
export function MyView({ email, name, grade, books, bookId, rows, units, onSave, onBook, onLogout }: {
  email: string; name: string; grade: number | null; books: BookOpt[]; bookId: string; rows: ProgRow[]; units: UnitInfo[];
  onSave: (n: string, g: number | null) => Promise<string>; onBook: (id: string) => void; onLogout: () => void;
}) {
  const [n, setN] = useState(name); const [g, setG] = useState<string>(grade ? String(grade) : ''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const core = rows.filter((r) => r.level === 'CORE'); const doneUnits = units.filter((u) => unitProgress(u, rows).complete).length;
  const star = core.reduce((x, r) => x + r.stars, 0); const lastAt = core.reduce<string>((m, r) => (r.updated_at > m ? r.updated_at : m), '');
  async function save() { setBusy(true); setMsg(await onSave(n.trim(), g ? Number(g) : null)); setBusy(false); }
  return (
    <>
      <h1>My Page</h1>
      <div className="mx-card">
        <h3>내 정보</h3>
        <div className="mx-form">
          <label>이메일<input value={email} disabled /></label>
          <label>이름(닉네임)<input value={n} onChange={(e) => setN(e.target.value)} placeholder="이름을 적어 주세요" maxLength={20} /></label>
          <label>학년<select value={g} onChange={(e) => setG(e.target.value)}><option value="">선택 안 함</option>{[1, 2, 3, 4, 5, 6].map((v) => <option key={v} value={v}>{v}학년</option>)}</select></label>
          {books.length > 0 && <label>학습 중인 교재<select value={bookId} onChange={(e) => onBook(e.target.value)}>{books.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}</select></label>}
        </div>
        <div className="mx-row"><button className="mx-btn" disabled={busy} onClick={save}>저장</button>{msg && <span className={msg.startsWith('저장했') ? 'mx-ok-t' : 'mx-err'}>{msg}</span>}</div>
      </div>
      <div className="mx-card">
        <h3>나의 학습</h3>
        <div className="mx-stats">
          <div><b>{doneUnits}</b><span>끝낸 Lesson</span></div><div><b>{core.length}</b><span>마친 활동</span></div><div><b>{star}</b><span>모은 별 ★</span></div>
          <div><b>{lastAt ? lastAt.slice(5, 10).replace('-', '/') : '-'}</b><span>마지막 학습일</span></div>
        </div>
      </div>
      <div className="mx-card"><button className="mx-btn mx-sec" onClick={onLogout}>로그아웃</button></div>
    </>
  );
}
