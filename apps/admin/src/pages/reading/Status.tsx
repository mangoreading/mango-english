import { Fragment, useEffect, useState } from 'react';
import { supabase } from '../../shared/supabase';

interface Prog { user_id: string; book_id: string; step_reached: number; completed: boolean; updated_at: string }
interface Vid { id: string; user_id: string; book_id: string; video_path: string; created_at: string }
interface Book { id: string; code: string; title: string; week: number; ord: number }
const when = (s?: string) => (s ? new Date(s).toLocaleString('ko-KR', { hour12: false }).slice(0, 17) : '-');

/** 학습 현황: 학생별 원서 진도와 Portfolio 영상 */
export function ReadingStatus() {
  const [d, setD] = useState<{ prog: Prog[]; vids: Vid[]; books: Book[]; names: Record<string, string> } | null>(null);
  const [open, setOpen] = useState<string | null>(null); const [err, setErr] = useState('');
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    (async () => {
      const [p, v, b] = await Promise.all([
        supabase.from('reading_progress').select('user_id,book_id,step_reached,completed,updated_at').order('updated_at', { ascending: false }),
        supabase.from('reading_videos').select('id,user_id,book_id,video_path,created_at').order('created_at', { ascending: false }),
        supabase.from('reading_books').select('id,code,title,week,ord').order('ord'),
      ]);
      const e = p.error ?? v.error ?? b.error; if (e) { setErr(e.message); return; }
      const ids = [...new Set([...(p.data ?? []).map((x) => x.user_id as string), ...(v.data ?? []).map((x) => x.user_id as string)])];
      const names: Record<string, string> = {};
      if (ids.length) { const { data } = await supabase.from('profiles').select('id,display_name').in('id', ids); for (const r of data ?? []) names[r.id as string] = (r.display_name as string) || ''; }
      setD({ prog: (p.data ?? []) as Prog[], vids: (v.data ?? []) as Vid[], books: (b.data ?? []) as Book[], names });
    })();
  }, []);
  useEffect(() => {
    if (!open || !d) return;
    const mine = d.vids.filter((x) => x.user_id === open && !urls[x.video_path]); if (!mine.length) return;
    supabase.storage.from('outputs').createSignedUrls(mine.map((x) => x.video_path), 3600).then(({ data }) => {
      const o: Record<string, string> = {}; for (const r of data ?? []) if (r.path && r.signedUrl) o[r.path] = r.signedUrl; setUrls((x) => ({ ...x, ...o }));
    });
  }, [open, d]); // eslint-disable-line
  if (err) return <div className="mx-card"><p className="mx-err">{err}</p></div>;
  if (!d) return <div className="mx-card"><p className="mx-muted">불러오는 중…</p></div>;
  const users = [...new Set([...d.prog.map((x) => x.user_id), ...d.vids.map((x) => x.user_id)])];
  const book = (id: string) => d.books.find((b) => b.id === id);
  const nm = (u: string) => d.names[u] || `학생 ${u.slice(0, 6)}`;
  if (!users.length) return <div className="mx-card"><p className="mx-muted">아직 원서를 학습한 학생이 없어요.</p></div>;
  return (
    <div className="mx-card">
      <table>
        <thead><tr><th>학생</th><th>시작한 책</th><th>완료</th><th>영상</th><th>마지막 학습</th><th /></tr></thead>
        <tbody>{users.map((u) => {
          const ps = d.prog.filter((x) => x.user_id === u); const vs = d.vids.filter((x) => x.user_id === u);
          return (
            <Fragment key={u}>
              <tr><td>{nm(u)}</td><td>{ps.filter((x) => x.step_reached > 0 || x.completed).length}권</td><td>{ps.filter((x) => x.completed).length}권</td><td>{vs.length}개</td><td>{when(ps[0]?.updated_at)}</td>
                <td><button className="mx-btn sec" onClick={() => setOpen(open === u ? null : u)}>{open === u ? '접기' : '자세히'}</button></td></tr>
              {open === u && <tr><td colSpan={6} style={{ background: 'var(--soft)' }}>
                <table><thead><tr><th>책</th><th>진행</th><th>상태</th><th>마지막</th></tr></thead>
                  <tbody>{ps.sort((a, b) => (book(a.book_id)?.ord ?? 0) - (book(b.book_id)?.ord ?? 0)).map((x) => <tr key={x.book_id}><td>{book(x.book_id)?.title ?? '(삭제된 책)'}</td><td>{Math.round((x.step_reached / 8) * 100)}% (STEP {x.step_reached}/8)</td><td>{x.completed ? '완료' : '학습중'}</td><td>{when(x.updated_at)}</td></tr>)}</tbody></table>
                {vs.length > 0 && <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10 }}>{vs.map((x) => (
                  <div key={x.id}><div className="mx-muted">{book(x.book_id)?.title} · {when(x.created_at)}</div>{urls[x.video_path] ? <video src={urls[x.video_path]} controls playsInline style={{ width: 260, borderRadius: 10, background: '#000' }} /> : <span className="mx-muted">불러오는 중…</span>}</div>))}</div>}
              </td></tr>}
            </Fragment>);
        })}</tbody>
      </table>
      <p className="mx-muted" style={{ marginTop: 10 }}>영상은 아이의 개인정보예요. 보호자 동의와 보관 기간 정책을 정한 뒤 운영해 주세요.</p>
    </div>
  );
}
