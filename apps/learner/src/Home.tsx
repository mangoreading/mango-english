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
export function HomeView({ name, books, bookId, onBook, units, rows, unit, onUnit, onOpenUnit, onReport }: {
  name: string; books: BookOpt[]; bookId: string; onBook: (id: string) => void; units: UnitInfo[]; rows: ProgRow[]; unit: UnitInfo | null;
  onUnit: (id: string) => void; onOpenUnit: (u: UnitInfo, focusNo?: number) => void; onReport: (u: UnitInfo) => void;
}) {
  if (!unit) return <div className="mx-card"><h2>학습할 Lesson이 아직 없어요</h2><p className="mx-muted">관리자가 Lesson을 발행하면 여기에 나타나요.</p></div>;
  const up = unitProgress(unit, rows);
  const idx = units.findIndex((u) => u.unit_id === unit.unit_id);
  const next = idx >= 0 ? units[idx + 1] : undefined, prev = idx > 0 ? units[idx - 1] : undefined;
  const curNo = up.current?.no;
  const core = (unit.bundle.flow ?? []).filter((l) => (l.track ?? 'core') === 'core').slice(0, 6);
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
        <div className="mx-lgrid">
          {Array.from({ length: 6 }, (_, i) => core[i]).map((l, i) => {
            const info = l ? up.lessons.find((x) => x.no === l.no) : undefined;
            if (!l || !info) return <div key={i} className="mx-lbox mx-lbox-off"><span className="mx-lbox-tag">{i + 1}차시</span><b className="mx-lbox-title">{l ? (l.ko || l.en) : '준비 중'}</b><span className="mx-lbox-en">{l?.en ?? ''}</span><span className="mx-lbox-bar"><i style={{ width: '0%' }} /></span><small>준비 중</small></div>;
            const full = info.doneN >= info.studyN, on = !up.complete && info.no === curNo;
            return (
              <button key={i} className={'mx-lbox' + (full ? ' mx-lbox-done' : '') + (on ? ' mx-lbox-cur' : '')} onClick={() => onOpenUnit(unit, info.no)}>
                <span className="mx-lbox-tag">{full ? '✓ ' : ''}{info.no}차시{on ? ' · 지금 할 차시' : ''}</span>
                <b className="mx-lbox-title">{info.ko || info.en}</b><span className="mx-lbox-en">{info.en}</span>
                <span className="mx-lbox-bar"><i style={{ width: pct(info.doneN, info.studyN) + '%' }} /></span><small>{info.doneN}/{info.studyN} 활동</small>
              </button>);
          })}
          <button className={'mx-lbox mx-lbox-x' + (up.extra.total && up.extra.done >= up.extra.total ? ' mx-lbox-done' : '')} disabled={!up.extra.total} onClick={() => onOpenUnit(unit, up.extra.firstNo ?? undefined)}>
            <span className="mx-lbox-tag">보충 · 확장</span><b className="mx-lbox-title">보충/확장 학습</b><span className="mx-lbox-en">Support &amp; Challenge</span>
            <span className="mx-lbox-bar"><i style={{ width: pct(up.extra.done, up.extra.total) + '%' }} /></span><small>{up.extra.total ? `${up.extra.done}/${up.extra.total} 활동` : '준비 중'}</small>
          </button>
          <button className={'mx-lbox mx-lbox-rep' + (up.complete ? ' mx-lbox-done' : '')} disabled={!up.complete} onClick={() => onReport(unit)}>
            <span className="mx-lbox-tag">Lesson Report</span><b className="mx-lbox-title">결과 리포트</b><span className="mx-lbox-en">Result</span>
            <span className="mx-lbox-bar"><i style={{ width: up.pct + '%' }} /></span><small>{up.complete ? '리포트 보기' : '차시를 모두 마치면 열려요'}</small>
          </button>
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
