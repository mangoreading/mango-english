import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';
import { MrHost } from './MrHost';
import { useSignedUrls } from './useImages';
import type { RBook, RProg } from './types';
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

export function ReadingTab({ uid, openCode, onOpened, onExit }: { uid: string; openCode?: string | null; onOpened?: () => void; onExit: () => void }) {
  const code = useRef(openCode ?? null);
  useEffect(() => { onOpened?.(); /* 한 번만 */ // eslint-disable-next-line
  }, []);
  return <MrHost uid={uid} startCode={code.current} onExit={onExit} />;
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
  return (
    <div className="mx-card">
      <h3>원서 읽기</h3>
      <p>완료한 책 <b>{done.length}</b> / {data.books.length}권 · 시작한 책 <b>{ps.length}</b>권</p>
    </div>
  );
}
