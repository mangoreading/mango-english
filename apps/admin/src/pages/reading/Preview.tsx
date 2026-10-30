import { useEffect, useRef, useState } from 'react';
import { MR_MARKUP, startMr } from '@mango/mr';
import '@mango/mr/mr.css';
import { signReading, type RBook } from './shared';

/** 학습앱과 같은 화면으로 이 책을 미리 본다(저장하지 않은 편집 내용 그대로, 진도는 저장하지 않음) */
export function Preview({ book, onClose }: { book: RBook; onClose: () => void }) {
  const [ready, setReady] = useState(false); const [err, setErr] = useState('');
  const urls = useRef<Record<string, string>>({});
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    signReading([book.cover_path ?? '', ...book.content.pages.map((p) => p.img)]).then((u) => { urls.current = u; setReady(true); }).catch((e) => setErr(String(e.message ?? e)));
  }, [book]);
  useEffect(() => {
    if (!ready) return;
    const u = urls.current; const b = book;
    const stop = startMr({
      userId: 'preview', progress: {},
      books: [{ code: b.code, title: b.title, emoji: b.emoji, week: b.week, ar: b.ar, coverUrl: b.cover_path ? u[b.cover_path] : undefined }],
      async loadBook() { return { id: b.code, title: b.title, cover: b.cover_path ? u[b.cover_path] ?? '' : '', ar: b.ar, ...b.content, pages: b.content.pages.map((p) => ({ ...p, img: u[p.img] ?? '' })) }; },
      saveProgress() { /* 미리보기는 저장하지 않는다 */ },
      async listTakes() { return []; }, async saveTake() { /* 저장 안 함 */ }, exit: () => closeRef.current(),
    });
    const t = setTimeout(() => (window as unknown as { openBook?: (c: string) => void }).openBook?.(b.code), 150);
    return () => { clearTimeout(t); stop(); };
  }, [ready, book]);
  if (err) return <div className="mx-card"><p className="mx-err">{err}</p><button className="mx-btn" onClick={onClose}>닫기</button></div>;
  if (!ready) return null;
  return (
    <div className="mr-root" style={{ position: 'fixed', inset: 0, zIndex: 1000, overflow: 'auto' }}>
      <div dangerouslySetInnerHTML={{ __html: MR_MARKUP }} />
      <button className="mx-btn" style={{ position: 'fixed', top: 10, right: 14, zIndex: 1001 }} onClick={onClose}>✕ 미리보기 닫기</button>
    </div>
  );
}
