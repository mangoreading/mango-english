import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Reader } from './Reader';
import { useSignedUrls } from './useImages';
import { STEPS, type RBook, type RProg } from './types';
import './reading.css';

const COLS = 'id,code,level,title,emoji,week,ord,ar,cover_path,content';
export interface ReadingData { books: RBook[]; prog: Record<string, RProg>; level: 'PRE' | 'BASIC' }

/** 원서 목록 + 내 진도를 불러온다 (원서 탭과 홈의 '오늘의 원서'가 같이 쓴다) */
export function useReading(uid: string, nonce = 0) {
  const [data, setData] = useState<ReadingData | null>(null); const [err, setErr] = useState('');
  useEffect(() => {
    let alive = true;
    (async () => {
      const pr = await supabase.from('profiles').select('reading_level').eq('id', uid).maybeSingle();
      const level = ((pr.data?.reading_level as string) === 'BASIC' ? 'BASIC' : 'PRE') as 'PRE' | 'BASIC';
      const [b, p] = await Promise.all([
        supabase.from('reading_books').select(COLS).eq('level', level).eq('status', 'published').order('ord'),
        supabase.from('reading_progress').select('book_id,step_reached,completed,taps,quiz_ok,quiz_total,speak_stars,updated_at').eq('user_id', uid),
      ]);
      if (!alive) return;
      if (b.error) { setErr(b.error.message); return; }
      setData({ level, books: (b.data ?? []) as unknown as RBook[], prog: Object.fromEntries(((p.data ?? []) as RProg[]).map((r) => [r.book_id, r])) });
    })();
    return () => { alive = false; };
  }, [uid, nonce]);
  return { data, err };
}

/** 다음에 읽을 책: 아직 끝내지 않은 첫 책(학습 순서대로) */
export const nextBook = (d: ReadingData | null): RBook | null => d?.books.find((b) => !d.prog[b.id]?.completed) ?? d?.books[d.books.length - 1] ?? null;

export function ReadingTab({ uid, openCode, onOpened }: { uid: string; openCode?: string | null; onOpened?: () => void }) {
  const [nonce, setNonce] = useState(0);
  const { data, err } = useReading(uid, nonce);
  const [open, setOpen] = useState<RBook | null>(null);
  const [week, setWeek] = useState<number | null>(null);
  const urls = useSignedUrls(data?.books.map((b) => b.cover_path) ?? []);

  useEffect(() => { if (openCode && data) { const b = data.books.find((x) => x.code === openCode); if (b) setOpen(b); onOpened?.(); } }, [openCode, data, onOpened]);
  useEffect(() => { if (data && week == null) setWeek(nextBook(data)?.week ?? 1); }, [data, week]);

  const patch = useCallback(async (book: RBook, p: Partial<RProg>) => {
    const prev = data?.prog[book.id];
    const row = { user_id: uid, book_id: book.id, ...(prev ?? {}), ...p, updated_at: new Date().toISOString(), ...(p.completed ? { completed_at: new Date().toISOString() } : {}) };
    delete (row as Record<string, unknown>).started_at;
    await supabase.from('reading_progress').upsert(row, { onConflict: 'user_id,book_id' });
  }, [uid, data]);

  if (err) return <div className="mx-card"><h2>원서를 불러오지 못했어요</h2><p className="mx-muted">{err}</p></div>;
  if (!data) return <p className="mx-muted">불러오는 중…</p>;
  if (open) return <Reader key={open.id} book={open} prog={data.prog[open.id] ?? null} onPatch={(p) => void patch(open, p)} onExit={() => { setOpen(null); setNonce((n) => n + 1); }} />;
  if (!data.books.length) return <div className="mx-card"><h2>읽을 원서가 아직 없어요</h2><p className="mx-muted">선생님이 원서를 열어 주면 여기에 나타나요.</p></div>;

  const weeks = [...new Set(data.books.map((b) => b.week))].sort((a, b) => a - b);
  const w = week ?? weeks[0]; const list = data.books.filter((b) => b.week === w);
  const done = data.books.filter((b) => data.prog[b.id]?.completed).length;
  return (
    <div className="rd-home">
      <div className="mx-card">
        <h2>원서 읽기 · {data.level === 'PRE' ? 'Pre' : 'Basic'}</h2>
        <p className="mx-muted">{done} / {data.books.length}권 완료</p>
        <div className="rd-weeks">{weeks.map((x) => <button key={x} className={x === w ? 'on' : ''} onClick={() => setWeek(x)}>Week {x}</button>)}</div>
      </div>
      <div className="rd-grid">{list.map((b) => {
        const p = data.prog[b.id]; const pct = p ? Math.round((p.step_reached / (STEPS.length - 1)) * 100) : 0;
        return (
          <button key={b.id} className="rd-bk" onClick={() => setOpen(b)}>
            {b.cover_path && urls[b.cover_path] ? <img src={urls[b.cover_path]} alt={b.title} /> : <span className="rd-bke">{b.emoji}</span>}
            <b>{b.title}</b>
            <span className="rd-bar"><i style={{ width: (p?.completed ? 100 : pct) + '%' }} /></span>
            <small>{p?.completed ? '완료 ✓' : pct > 0 ? '학습중' : '시작하기'}{b.ar ? ` · AR ${b.ar}` : ''}</small>
          </button>);
      })}</div>
    </div>
  );
}

const isFriday = () => new Date(Date.now() + 9 * 3600_000).getUTCDay() === 5; // 한국 시간 기준 금요일

/** 홈의 '금요일 원서 읽기' 카드: 다음에 읽을 책으로 바로 들어간다. 금요일에는 강조해서 보여 준다. */
export function FridayReading({ uid, onGo }: { uid: string; onGo: (code: string) => void }) {
  const { data } = useReading(uid);
  const b = nextBook(data);
  const urls = useSignedUrls([b?.cover_path]);
  if (!data || !b) return null;
  const p = data.prog[b.id]; const fri = isFriday();
  return (
    <button className={'rd-fri' + (fri ? ' hot' : '')} onClick={() => onGo(b.code)}>
      {b.cover_path && urls[b.cover_path] ? <img src={urls[b.cover_path]} alt="" /> : <span className="rd-bke">{b.emoji}</span>}
      <span><small>{fri ? '📚 오늘은 금요일! 원서 읽기' : '📚 오늘의 원서'}</small><b>{b.title}</b><em>{p && !p.completed && p.step_reached > 0 ? '이어서 읽기' : '시작하기'}</em></span>
    </button>
  );
}

/** 리포트의 원서 요약 */
export function ReadingSummary({ uid }: { uid: string }) {
  const { data } = useReading(uid);
  if (!data || !data.books.length) return null;
  const ps = Object.values(data.prog); const done = ps.filter((p) => p.completed);
  const qo = ps.reduce((a, p) => a + p.quiz_ok, 0), qt = ps.reduce((a, p) => a + p.quiz_total, 0);
  const taps = ps.reduce((a, p) => a + p.taps, 0);
  return (
    <div className="mx-card">
      <h3>원서 읽기</h3>
      <p>완료한 책 <b>{done.length}</b> / {data.books.length}권 · 퀴즈 첫 시도 정답 <b>{qt ? Math.round((qo / qt) * 100) : 0}%</b> · 눌러 본 단어 <b>{taps}</b>개</p>
    </div>
  );
}
