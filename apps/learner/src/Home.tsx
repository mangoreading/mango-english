import { useState } from 'react';
import { buildReport } from './reportCalc';
import { unitProgress, type ProgRow, type UnitInfo } from './home';

export type Tab = 'home' | 'lessons' | 'report' | 'my';
export const TAB_KO: [Tab, string][] = [['home', '홈'], ['lessons', 'Lesson'], ['report', '리포트'], ['my', 'My Page']];
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(3 - n);
export interface BookOpt { id: string; label: string; grade: number }

export function Nav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return <nav className="mx-nav">{TAB_KO.map(([k, n]) => <button key={k} className={tab === k ? 'mx-nav-on' : ''} onClick={() => setTab(k)}>{n}</button>)}</nav>;
}

function BookPick({ books, bookId, onBook }: { books: BookOpt[]; bookId: string; onBook: (id: string) => void }) {
  if (books.length < 2) return <span className="mx-chip">{books[0]?.label}</span>;
  return <select className="mx-bookpick" value={bookId} onChange={(e) => onBook(e.target.value)} aria-label="교재">{books.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}</select>;
}

/** 홈: 지금 학습 중인 Lesson 과 차시 (핵심) */
export function HomeView({ name, books, bookId, onBook, units, rows, unit, onUnit, onStart, onOpenUnit, onReport }: {
  name: string; books: BookOpt[]; bookId: string; onBook: (id: string) => void; units: UnitInfo[]; rows: ProgRow[]; unit: UnitInfo | null;
  onUnit: (id: string) => void; onStart: (u: UnitInfo, a?: { no: number; idx: number }) => void; onOpenUnit: (u: UnitInfo) => void; onReport: (u: UnitInfo) => void;
}) {
  if (!unit) return <div className="mx-card"><h2>학습할 Lesson이 아직 없어요</h2><p className="mx-muted">관리자가 Lesson을 발행하면 여기에 나타나요.</p></div>;
  const up = unitProgress(unit, rows);
  const idx = units.findIndex((u) => u.unit_id === unit.unit_id);
  const cur = up.current ? up.lessons.find((l) => l.no === up.current!.no)! : up.lessons[up.lessons.length - 1];
  const next = idx >= 0 ? units[idx + 1] : undefined, prev = idx > 0 ? units[idx - 1] : undefined;
  const curAct = up.current ? cur?.acts.find((a) => a.idx === up.current!.idx) : undefined;
  return (
    <>
      <div className="mx-hello"><h1>{name ? `${name}님, ` : ''}오늘도 Mango English!</h1><BookPick books={books} bookId={bookId} onBook={onBook} /></div>
      <div className="mx-card mx-now">
        <div className="mx-now-top">
          <button className="mx-arrow" disabled={!prev} onClick={() => prev && onUnit(prev.unit_id)} aria-label="이전 Lesson">◀</button>
          <div className="mx-now-title"><span className="mx-chip">LESSON {unit.unit_no}</span><h2>{unit.unit_title}</h2><span className="mx-muted">{up.started ? '지금 학습 중' : '아직 시작 전'} · 활동 {up.done}/{up.total}</span></div>
          <button className="mx-arrow" disabled={!next} onClick={() => next && onUnit(next.unit_id)} aria-label="다음 Lesson">▶</button>
        </div>
        <div className="mx-pbar" role="img" aria-label={`진행 ${up.pct}%`}><i style={{ width: up.pct + '%' }} /></div>
        <div className="mx-steps6">
          {up.lessons.map((l) => {
            const full = l.doneN >= l.studyN, on = cur && l.no === cur.no;
            return <button key={l.no} className={'mx-s6' + (full ? ' mx-s6-done' : '') + (on && !up.complete ? ' mx-s6-cur' : '')} onClick={() => onOpenUnit(unit)} title={l.ko || l.en}><b>{full ? '✓' : l.no}</b><span>{l.no}차시</span><small>{l.doneN}/{l.studyN}</small></button>;
          })}
        </div>
        {up.complete ? (
          <div className="mx-cur">
            <h3>Lesson {unit.unit_no} 완료!</h3><p className="mx-muted">모든 활동을 마쳤어요. 결과 리포트를 확인해 보세요.</p>
            <div className="mx-row"><button className="mx-btn mx-go" onClick={() => onReport(unit)}>리포트 보기</button>{next && <button className="mx-btn mx-sec" onClick={() => onUnit(next.unit_id)}>다음 Lesson으로</button>}<button className="mx-link" onClick={() => onOpenUnit(unit)}>다시 풀어 보기</button></div>
          </div>
        ) : cur && (
          <div className="mx-cur">
            <div className="mx-cur-h"><span className="mx-cur-tag">지금 할 차시</span><h3>{cur.no}차시 · {cur.ko || cur.en}</h3></div>
            {cur.goal && <p className="mx-muted">{cur.goal}</p>}
            <ul className="mx-curacts">
              {cur.acts.filter((a) => a.study && a.n > 0).map((a) => (
                <li key={a.idx} className={(a.done ? 'mx-ca-done ' : '') + (up.current && a.idx === up.current.idx && cur.no === up.current.no ? 'mx-ca-now' : '')}>
                  <span className="mx-ca-mark">{a.done ? '✓' : up.current && a.idx === up.current.idx ? '▶' : '○'}</span>
                  <button className="mx-ca-name" onClick={() => onStart(unit, { no: cur.no, idx: a.idx })}>{a.t}</button>
                  <span className="mx-muted">{a.min ? a.min + '분 · ' : ''}{a.n}문항{a.done ? ' · ' + stars(a.stars) : ''}</span>
                </li>))}
            </ul>
            <div className="mx-row">
              {curAct && <button className="mx-btn mx-go" onClick={() => onStart(unit, up.current!)}>{up.started ? '이어하기' : '시작하기'} → {curAct.t}</button>}
              <button className="mx-link" onClick={() => onOpenUnit(unit)}>이 Lesson 전체 보기</button>
            </div>
          </div>
        )}
      </div>
      <div className="mx-moveblk">
        <h3>Lesson 이동</h3>
        <LessonChips units={units} rows={rows} currentId={unit.unit_id} onPick={onUnit} />
      </div>
    </>
  );
}

function LessonChips({ units, rows, currentId, onPick }: { units: UnitInfo[]; rows: ProgRow[]; currentId: string; onPick: (id: string) => void }) {
  return (
    <div className="mx-chips">
      {units.map((u) => { const p = unitProgress(u, rows); return (
        <button key={u.unit_id} className={'mx-lchip' + (u.unit_id === currentId ? ' mx-lchip-on' : '') + (p.complete ? ' mx-lchip-done' : '')} onClick={() => onPick(u.unit_id)}>
          <b>{p.complete ? '✓ ' : ''}Lesson {u.unit_no}</b><span>{u.unit_title}</span><small>{p.pct}%</small></button>); })}
    </div>
  );
}

/** Lesson 탭: 교재의 모든 Lesson 을 한눈에 보고 이동 */
export function LessonsView({ books, bookId, onBook, units, rows, currentId, onPick }: { books: BookOpt[]; bookId: string; onBook: (id: string) => void; units: UnitInfo[]; rows: ProgRow[]; currentId: string | null; onPick: (id: string) => void }) {
  return (
    <>
      <div className="mx-hello"><h1>Lesson 이동</h1><BookPick books={books} bookId={bookId} onBook={onBook} /></div>
      {!units.length && <div className="mx-card"><p className="mx-muted">이 교재에는 발행된 Lesson이 아직 없어요.</p></div>}
      <div className="mx-grid">
        {units.map((u) => { const p = unitProgress(u, rows); return (
          <button key={u.unit_id} className={'mx-unit' + (u.unit_id === currentId ? ' mx-unit-cur' : '')} onClick={() => onPick(u.unit_id)}>
            <span className="mx-chip">LESSON {u.unit_no}{u.unit_id === currentId ? ' · 학습 중' : ''}</span>
            <b>{u.unit_title}</b>
            <div className="mx-pbar"><i style={{ width: p.pct + '%' }} /></div>
            <span className="mx-muted">{p.complete ? '✓ 완료' : p.started ? `진행 중 · 활동 ${p.done}/${p.total}` : p.total ? '시작 전' : '준비 중'}</span>
          </button>); })}
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
