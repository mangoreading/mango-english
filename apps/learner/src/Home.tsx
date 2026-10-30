import { useState } from 'react';
import { buildReport } from './reportCalc';
import { unitProgress, type ProgRow, type UnitInfo } from './home';

export type Tab = 'home' | 'reading' | 'report' | 'my';
export const TAB_KO: [Tab, string][] = [['home', '교과서'], ['reading', '영어원서'], ['report', 'Report'], ['my', 'MyPage']];
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(3 - n);
export interface BookOpt { id: string; label: string; grade: number }

export function Nav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return <nav className="mx-nav">{TAB_KO.map(([k, n]) => <button key={k} className={tab === k ? 'mx-nav-on' : ''} onClick={() => setTab(k)}>{n}</button>)}</nav>;
}

function BookPick({ books, bookId, onBook }: { books: BookOpt[]; bookId: string; onBook: (id: string) => void }) {
  if (books.length < 2) return <span className="mx-chip">{books[0]?.label}</span>;
  return <select className="mx-bookpick" value={bookId} onChange={(e) => onBook(e.target.value)} aria-label="교재">{books.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}</select>;
}

/** 교과서: 지금 학습 중인 Lesson 의 8개 박스(1~6차시 · 보충/확장 학습 · Lesson Report) */
export function HomeView({ name, books, bookId, onBook, units, rows, unit, onUnit, onOpenUnit, onStart, onReport }: {
  name: string; books: BookOpt[]; bookId: string; onBook: (id: string) => void; units: UnitInfo[]; rows: ProgRow[]; unit: UnitInfo | null;
  onUnit: (id: string) => void; onOpenUnit: (u: UnitInfo, focusNo?: number) => void; onStart: (u: UnitInfo, a: { no: number; idx: number }) => void; onReport: (u: UnitInfo) => void;
}) {
  const [sel, setSel] = useState<number | 'x' | null>(null);
  if (!unit) return <div className="mx-card"><h2>학습할 Lesson이 아직 없어요</h2><p className="mx-muted">관리자가 Lesson을 발행하면 여기에 나타나요.</p></div>;
  const up = unitProgress(unit, rows);
  const idx = units.findIndex((u) => u.unit_id === unit.unit_id);
  const next = idx >= 0 ? units[idx + 1] : undefined, prev = idx > 0 ? units[idx - 1] : undefined;
  const curNo = up.current?.no;
  const core = (unit.bundle.flow ?? []).filter((l) => (l.track ?? 'core') === 'core').slice(0, 6);
  const goals = Object.entries((unit.bundle.unit.goals ?? {}) as Record<string, { ko?: string }>).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })).map(([, v]) => v?.ko ?? '').filter(Boolean);
  const shown: number | 'x' = sel === 'x' && up.extra.total ? 'x' : typeof sel === 'number' && up.lessons.some((l) => l.no === sel) ? sel : (curNo ?? up.lessons[0]?.no ?? 1);
  const detailLessons = shown === 'x' ? up.extra.lessons : up.lessons.filter((l) => l.no === shown);
  const pct = (d: number, t: number) => (t ? Math.round((d / t) * 100) : 0);
  return (
    <>
      <div className="mx-hello"><h1>{name ? `${name}님, ` : ''}오늘도 Mango English!</h1><BookPick books={books} bookId={bookId} onBook={onBook} /></div>
      <div className="mx-card mx-now">
        <div className="mx-now-top">
          <button className="mx-arrow" disabled={!prev} onClick={() => prev && onUnit(prev.unit_id)} aria-label="이전 Lesson">◀</button>
          <div className="mx-now-title">
            <span className="mx-chip">LESSON {unit.unit_no}</span><h2>{unit.unit_title}</h2>
            <span className="mx-muted">{up.complete ? '모든 활동을 마쳤어요' : up.started ? '지금 학습 중' : '아직 시작 전'} · 활동 {up.done}/{up.total}</span>
            <select className="mx-lessonpick" value={unit.unit_id} onChange={(e) => onUnit(e.target.value)} aria-label="Lesson 이동">
              {units.map((u) => <option key={u.unit_id} value={u.unit_id}>Lesson {u.unit_no} · {u.unit_title}</option>)}
            </select>
          </div>
          <button className="mx-arrow" disabled={!next} onClick={() => next && onUnit(next.unit_id)} aria-label="다음 Lesson">▶</button>
        </div>
        <div className="mx-pbar" role="img" aria-label={`진행 ${up.pct}%`}><i style={{ width: up.pct + '%' }} /></div>
        <div className="mx-nowbody">
          <div className="mx-lside">
            {Array.from({ length: 6 }, (_, i) => core[i]).map((l, i) => {
              const info = l ? up.lessons.find((x) => x.no === l.no) : undefined;
              if (!l || !info) return <div key={i} className="mx-lrow mx-lrow-off"><span className="mx-lrow-no">{i + 1}</span><span className="mx-lrow-t"><b>{l ? (l.ko || l.en) : '준비 중'}</b><small>준비 중</small></span></div>;
              const full = info.doneN >= info.studyN, on = !up.complete && info.no === curNo;
              return (
                <button key={i} className={'mx-lrow' + (full ? ' mx-lrow-done' : '') + (on ? ' mx-lrow-cur' : '') + (shown === info.no ? ' mx-lrow-sel' : '')} onClick={() => setSel(info.no)}>
                  <span className="mx-lrow-no">{full ? '✓' : info.no}</span>
                  <span className="mx-lrow-t"><b>{info.ko || info.en}</b><small>{on ? '지금 할 차시 · ' : ''}{info.doneN}/{info.studyN} 활동</small></span>
                  <span className="mx-lrow-bar"><i style={{ width: pct(info.doneN, info.studyN) + '%' }} /></span>
                </button>);
            })}
            <button className={'mx-lrow mx-lrow-x' + (up.extra.total && up.extra.done >= up.extra.total ? ' mx-lrow-done' : '') + (shown === 'x' ? ' mx-lrow-sel' : '')} disabled={!up.extra.total} onClick={() => setSel('x')}>
              <span className="mx-lrow-no">＋</span>
              <span className="mx-lrow-t"><b>보충/확장 학습</b><small>{up.extra.total ? `${up.extra.done}/${up.extra.total} 활동` : '준비 중'}</small></span>
              <span className="mx-lrow-bar"><i style={{ width: pct(up.extra.done, up.extra.total) + '%' }} /></span>
            </button>
            <button className={'mx-lrow mx-lrow-rep' + (up.complete ? ' mx-lrow-done' : '')} disabled={!up.complete} onClick={() => onReport(unit)}>
              <span className="mx-lrow-no">★</span>
              <span className="mx-lrow-t"><b>Lesson Report</b><small>{up.complete ? '결과 리포트 보기' : '차시를 모두 마치면 열려요'}</small></span>
              <span className="mx-lrow-bar"><i style={{ width: up.pct + '%' }} /></span>
            </button>
          </div>
          <section className="mx-detail" aria-label="차시 상세">
            {detailLessons.map((l) => (
              <div key={l.no} className="mx-dl">
                <div className="mx-dl-h"><span className="mx-lchip">{shown === 'x' ? '보충·확장' : `${l.no}차시`}</span><h3>{l.ko || l.en}</h3><span className="mx-muted">{l.en}</span></div>
                {l.goal && <p className="mx-dl-goal">{l.goal}</p>}
                <ul className="mx-dl-acts">
                  {l.acts.filter((a) => a.n > 0).map((a) => (
                    <li key={a.idx}>
                      <button className={a.done ? 'mx-da mx-da-done' : 'mx-da'} onClick={() => onStart(unit, { no: l.no, idx: a.idx })}>
                        <span className="mx-da-mark">{a.done ? '✓' : '▶'}</span>
                        <span className="mx-da-t"><b>{a.t}</b><small>{a.ko}{a.study ? '' : ' · 숙제'} · {a.n}문항</small></span>
                        <span className="mx-da-st">{a.done ? stars(a.stars) : (up.current && l.no === up.current.no && up.current.idx === a.idx ? '지금 할 활동' : '')}</span>
                      </button>
                    </li>))}
                </ul>
              </div>))}
            {goals.length > 0 && (
              <aside className="mx-goals" aria-label="학습목표">
                <h4>이번 Lesson 학습목표</h4>
                <ol>{goals.map((g, i) => <li key={i}><b>{i + 1}</b><span>{g}</span></li>)}</ol>
              </aside>
            )}
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
