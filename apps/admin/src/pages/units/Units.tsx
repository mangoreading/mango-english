import { useEffect, useState } from 'react';
import { supabase } from '../../shared/supabase';
import { PageHead } from '../../shared/ui';
import { UnitFlow } from '../flow/Flow';
import { Items } from './Items';
import { UnitVocab } from './Vocab';

type Status = 'draft' | 'review' | 'approved' | 'rejected';
const STATUS_KO: Record<Status, string> = { draft: '초안', review: '검수중', approved: '승인', rejected: '반려' };
interface UnitRow { id: string; no: number; kind?: string; title: string; status: string; version: number; books: { title: string; grade: number; publishers: { name: string } | null } | null }

export function Units({ uid }: { uid: string }) {
  const [units, setUnits] = useState<UnitRow[] | null>(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<UnitRow | null>(null);
  useEffect(() => {
    supabase.from('units').select('id,no,title,status,version,kind,seq,books(title,grade,publishers(name))').order('seq').then(({ data, error }) => {
      if (error) setErr(error.message); else setUnits((data ?? []) as unknown as UnitRow[]);
    });
  }, []);
  if (err) return <p className="mx-err">{err}</p>;
  if (!units) return <p className="mx-muted">불러오는 중…</p>;
  if (open) return <UnitEditor unit={open} uid={uid} onBack={() => setOpen(null)} />;
  return (
    <>
      <PageHead title="단원·콘텐츠" sub="교재별 단원의 학습 흐름과 문항을 관리해요." />
      <div className="mx-card">
        <table>
          <thead><tr><th>출판사</th><th>교재</th><th>학년</th><th>Lesson</th><th>제목</th><th>상태</th></tr></thead>
          <tbody>
            {units.map((u) => (
              <tr key={u.id} className="mx-click" onClick={() => setOpen(u)}>
                <td>{u.books?.publishers?.name}</td><td>{u.books?.title}</td><td>{u.books?.grade}</td><td>{u.kind === 'review' ? 'Review' : u.no}</td><td>{u.title}</td>
                <td><span className={`mx-chip ${u.status}`}>{STATUS_KO[u.status as Status] ?? u.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!units.length && <p className="mx-muted">등록된 단원이 없어요.</p>}
      </div>
    </>
  );
}

function UnitEditor({ unit, uid, onBack }: { unit: UnitRow; uid: string; onBack: () => void }) {
  const [tab, setTab] = useState<'flow' | 'vocab' | 'items'>('flow');
  return (
    <>
      <PageHead title={`Lesson ${unit.no} · ${unit.title}`} sub={<button className="mx-link" onClick={onBack}>← 단원 목록</button>} />
      <div className="mx-seg">
        <button className={tab === 'flow' ? 'on' : ''} onClick={() => setTab('flow')}>학습 흐름</button>
        <button className={tab === 'vocab' ? 'on' : ''} onClick={() => setTab('vocab')}>단어</button>
        <button className={tab === 'items' ? 'on' : ''} onClick={() => setTab('items')}>문항</button>
      </div>
      {tab === 'flow' && <UnitFlow unitId={unit.id} />}
      {tab === 'vocab' && <UnitVocab unitId={unit.id} />}
      {tab === 'items' && <Items unitId={unit.id} uid={uid} />}
    </>
  );
}
