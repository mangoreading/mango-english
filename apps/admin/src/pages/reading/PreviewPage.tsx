import { useEffect, useState } from 'react';
import { supabase } from '../../shared/supabase';
import { Preview } from './Preview';
import type { RBook } from './shared';

const codeOf = () => decodeURIComponent(location.hash.replace(/^#readpreview=/, ''));
/** 별도 창(#readpreview=코드)에서 학습 화면(원서)을 미리 본다. 관리자 로그인 상태를 그대로 사용해요. */
export function ReadingPreviewPage() {
  const [code, setCode] = useState(codeOf()); const [book, setBook] = useState<RBook | null>(null); const [err, setErr] = useState('');
  useEffect(() => { const f = () => setCode(codeOf()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  useEffect(() => {
    setBook(null); setErr('');
    supabase.from('reading_books').select('id,code,level,title,emoji,week,ord,ar,cover_path,status,version,updated_at,content').eq('code', code).maybeSingle().then(({ data, error }) => {
      if (error || !data) setErr(error?.message ?? '책을 찾지 못했어요. 관리자에 로그인되어 있는지 확인해 주세요.'); else { setBook(data as unknown as RBook); document.title = `${(data as { title: string }).title} · 미리보기`; }
    });
  }, [code]);
  if (err) return <p style={{ padding: 40, fontFamily: 'sans-serif', color: '#b42318' }}>{err}</p>;
  if (!book) return <p style={{ padding: 40, fontFamily: 'sans-serif', color: '#555' }}>불러오는 중…</p>;
  return <Preview key={book.code} book={book} bare onClose={() => window.close()} />;
}
