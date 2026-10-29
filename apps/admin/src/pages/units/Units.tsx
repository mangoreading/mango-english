import { useEffect, useState } from 'react';
import { supabase } from '../../shared/supabase';
import { PageHead } from '../../shared/ui';
import { UnitFlow } from '../flow/Flow';
import { Items } from './Items';
import { Review } from './Review';
import { Source } from './Source';
import { openReviewPopup } from './ReviewPopup';
import { UnitVocab } from './Vocab';

type Status = 'draft' | 'review' | 'approved' | 'rejected';
const STATUS_KO: Record<Status, string> = { draft: '초안', review: '검수중', approved: '승인', rejected: '반려' };
interface UnitRow { id: string; no: number; kind?: string; title: string; status: string; version: number; books: { title: string; grade: number; publishers: { name: string } | null } | null }

export function Units({ uid }: { uid: string }) {
  const [units, setUnits] = useState<UnitRow[] | null>(null);
  const [dots, setDots] = useState<Record<string, { no: number; n: number; track: string }[]>>({});
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<UnitRow | null>(null);
  const [q, setQ] = useState({ pub: '', grade: '', book: '', status: '', text: '' });
  useEffect(() => {
    (async () => {
      const u = await supabase.from('units').select('id,no,title,status,version,kind,seq,books(title,grade,publishers(name))').order('seq');
      if (u.error) { setErr(u.error.message); return; }
      setUnits((u.data ?? []) as unknown as UnitRow[]);
      const fl = await supabase.from('flow_lessons').select('unit_id,no,track').not('unit_id', 'is', null).order('no');
      const it = await supabase.from('items').select('unit_id,lesson').limit(20000);
      const cnt: Record<string, number> = {};
      (it.data ?? []).forEach((x: { unit_id: string; lesson: number }) => { const k = x.unit_id + ':' + x.lesson; cnt[k] = (cnt[k] ?? 0) + 1; });
      const d: Record<string, { no: number; n: number; track: string }[]> = {};
      (fl.data ?? []).forEach((x: { unit_id: string; no: number; track: string }) => { (d[x.unit_id] ??= []).push({ no: x.no, track: x.track, n: cnt[x.unit_id + ':' + x.no] ?? 0 }); });
      setDots(d);
    })();
  }, []);
  if (err) return <p className="mx-err">{err}</p>;
  if (!units) return <p className="mx-muted">불러오는 중…</p>;
  if (open) return <UnitEditor unit={open} uid={uid} onBack={() => setOpen(null)} />;
  const uniq = (f: (u: UnitRow) => string | number | undefined) => Array.from(new Set(units.map(f).filter((x) => x !== undefined && x !== ''))) as (string | number)[];
  const shown = units.filter((u) =>
    (!q.pub || u.books?.publishers?.name === q.pub) && (!q.grade || String(u.books?.grade) === q.grade) && (!q.book || u.books?.title === q.book) &&
    (!q.status || u.status === q.status) && (!q.text.trim() || (u.title + ' ' + (u.kind === 'review' ? 'review' : 'lesson ' + u.no)).toLowerCase().includes(q.text.trim().toLowerCase())));
  const sel = (key: keyof typeof q, label: string, opts: (string | number)[], fmt?: (v: string | number) => string) => (
    <select value={q[key]} onChange={(e) => setQ({ ...q, [key]: e.target.value })}><option value="">{label} 전체</option>{opts.map((o) => <option key={o} value={o}>{fmt ? fmt(o) : o}</option>)}</select>
  );
  return (
    <>
      <PageHead title="단원·콘텐츠" sub="교재별 단원의 학습 흐름과 문항을 관리해요." />
      <div className="mx-card">
        <div className="mx-row" style={{ marginBottom: 10 }}>
          {sel('pub', '출판사', uniq((u) => u.books?.publishers?.name))}
          {sel('grade', '학년', uniq((u) => u.books?.grade).sort(), (v) => v + '학년')}
          {sel('book', '교재', uniq((u) => u.books?.title))}
          {sel('status', '상태', ['draft', 'review', 'approved', 'rejected'], (v) => STATUS_KO[v as Status])}
          <input value={q.text} placeholder="Lesson 번호·제목 검색" style={{ width: 220 }} onChange={(e) => setQ({ ...q, text: e.target.value })} />
          <button className="mx-btn sec" onClick={() => setQ({ pub: '', grade: '', book: '', status: '', text: '' })} disabled={!Object.values(q).some(Boolean)}>초기화</button>
          <span className="mx-muted">{shown.length} / {units.length}</span>
        </div>
        <table>
          <thead><tr><th>출판사</th><th>교재</th><th>학년</th><th>Lesson</th><th>제목</th><th>입력 현황 (차시별)</th><th>상태</th><th /></tr></thead>
          <tbody>
            {shown.map((u) => (
              <tr key={u.id} className="mx-click" onClick={() => setOpen(u)}>
                <td>{u.books?.publishers?.name}</td><td>{u.books?.title}</td><td>{u.books?.grade}</td><td>{u.kind === 'review' ? 'Review' : u.no}</td><td>{u.title}</td>
                <td>{dots[u.id]?.length
                  ? <span style={{ letterSpacing: 3, color: 'var(--navy)' }}>
                      {dots[u.id].filter((d) => d.track === 'core').map((d) => <span key={d.no} title={`${d.no}차시 · 문항 ${d.n}개`}>{d.n > 0 ? '●' : '○'}</span>)}
                      {dots[u.id].filter((d) => d.track !== 'core').map((d) => <span key={d.no} className="mx-muted" style={{ marginLeft: 8, letterSpacing: 0 }} title={`${d.track === 'support' ? '보충' : '확장'} · 문항 ${d.n}개`}>{d.track === 'support' ? '보' : '확'}<span style={{ color: 'var(--navy)', letterSpacing: 0 }}> {d.n > 0 ? '●' : '○'}</span></span>)}
                    </span>
                  : <span className="mx-muted">흐름 없음</span>}</td>
                <td><span className={`mx-chip ${u.status}`}>{STATUS_KO[u.status as Status] ?? u.status}</span></td>
                <td><button className="mx-btn sec" onClick={(e) => { e.stopPropagation(); const err = openReviewPopup(u.id); if (err) window.alert(err); }}>미리보기</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length && <p className="mx-muted">조건에 맞는 단원이 없어요.</p>}
      </div>
    </>
  );
}

function UnitEditor({ unit, uid, onBack }: { unit: UnitRow; uid: string; onBack: () => void }) {
  const [tab, setTab] = useState<'flow' | 'vocab' | 'items' | 'review' | 'source'>('flow');
  return (
    <>
      <PageHead title={`Lesson ${unit.no} · ${unit.title}`} sub={<button className="mx-link" onClick={onBack}>← 단원 목록</button>} />
      <div className="mx-seg">
        <button className={tab === 'flow' ? 'on' : ''} onClick={() => setTab('flow')}>학습 흐름</button>
        <button className={tab === 'vocab' ? 'on' : ''} onClick={() => setTab('vocab')}>단어</button>
        <button className={tab === 'items' ? 'on' : ''} onClick={() => setTab('items')}>문항</button>
        <button title="새 창으로 열려요. 이 화면은 그대로 있어요" onClick={() => { const err = openReviewPopup(unit.id); if (err) window.alert(err); }}>학생 화면 검수 ↗</button>
        <button className={tab === 'source' ? 'on' : ''} onClick={() => setTab('source')}>교과서 자료</button>
      </div>
      {tab === 'flow' && <UnitFlow unitId={unit.id} />}
      {tab === 'vocab' && <UnitVocab unitId={unit.id} />}
      {tab === 'items' && <Items unitId={unit.id} uid={uid} />}
      {tab === 'review' && <Review unitId={unit.id} uid={uid} />}
      {tab === 'source' && <Source unitId={unit.id} uid={uid} />}
    </>
  );
}
