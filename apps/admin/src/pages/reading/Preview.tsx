import { memo, useEffect, useRef, useState } from 'react';
import { MR_MARKUP, mrThemeClass, startMr } from '@mango/mr';
import { canRecord, startRecording } from '@mango/play';
import '@mango/mr/mr.css';
import { supabase } from '../../shared/supabase';
import { signReading, type RBook } from './shared';

const Markup = memo(function Markup() { return <div style={{ width: 1280, height: 800 }} dangerouslySetInnerHTML={{ __html: MR_MARKUP }} />; });
const fit = () => Math.min(window.innerWidth / 1280, window.innerHeight / 800);

/** 학습앱과 같은 화면으로 이 책을 미리 본다(저장하지 않은 편집 내용 그대로, 진도는 저장하지 않음) */
export function Preview({ book, onClose, bare }: { book: RBook; onClose: () => void; bare?: boolean }) {
  const [ready, setReady] = useState(false); const [err, setErr] = useState('');
  const [k, setK] = useState(fit());
  useEffect(() => { const f = () => setK(fit()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  const urls = useRef<Record<string, string>>({}); const words = useRef<Record<string, string>>({});
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    (async () => {
      urls.current = await signReading([book.cover_path ?? '', ...book.content.pages.map((p) => p.img)]);
      const { data } = await supabase.from('reading_words').select('word,image_path');
      const rows = (data ?? []) as { word: string; image_path: string }[];
      const u = await signReading(rows.map((r) => r.image_path));
      for (const r of rows) if (u[r.image_path]) words.current[r.word.toLowerCase()] = u[r.image_path];
      setReady(true);
    })().catch((e) => setErr(String(e.message ?? e)));
  }, [book]);
  useEffect(() => {
    if (!ready) return;
    const u = urls.current; const b = book;
    const stop = startMr({
      userId: 'preview', progress: {},
      books: [{ code: b.code, title: b.title, emoji: b.emoji, week: b.week, ar: b.ar, coverUrl: b.cover_path ? u[b.cover_path] : undefined }],
      async loadBook() { return { id: b.code, title: b.title, cover: b.cover_path ? u[b.cover_path] ?? '' : '', ar: b.ar, ...b.content, pages: b.content.pages.map((p) => ({ ...p, img: u[p.img] ?? '' })) }; },
      record: canRecord() ? (o?: { onReady?: () => void; onLevel?: (v: number) => void }) => startRecording(o) : undefined,
      async stt(wav: Blob, ref: string) {
        const { data, error } = await supabase.functions.invoke('stt', { body: wav, headers: { 'Content-Type': 'audio/wav', 'x-ref': encodeURIComponent(ref ?? '') } });
        if (error) throw new Error((error as Error).message);
        return data as { text: string; display?: string; accuracy?: number; fluency?: number; completeness?: number; pron?: number; words?: { w: string; acc?: number; err?: string }[] };
      },
      wordImg: (w: string) => words.current[String(w).toLowerCase()],
      async tts(text: string, rate: string) {
        const { data, error } = await supabase.functions.invoke('tts', { body: { lines: [{ t: text }], rate } });
        if (error) throw new Error((error as Error).message);
        if (!(data instanceof Blob)) throw new Error('tts');
        return data;
      },
      saveProgress() { /* 미리보기는 저장하지 않는다 */ },
      async listTakes() { return []; }, async saveTake() { /* 저장 안 함 */ }, exit: () => closeRef.current(),
    });
    const t = setTimeout(() => (window as unknown as { openBook?: (c: string) => void }).openBook?.(b.code), 150);
    return () => { clearTimeout(t); stop(); };
  }, [ready, book]);
  if (err) return <div className="mx-card"><p className="mx-err">{err}</p><button className="mx-btn" onClick={onClose}>닫기</button></div>;
  if (!ready) return null;
  // 1280×800 화면을 창 크기에 맞춰 줄이고 가운데에 둔다(스크롤 없음)
  return (
    <div className={'mr-root mr-fit ' + mrThemeClass()} style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
      <div style={{ position: 'absolute', left: (window.innerWidth - 1280 * k) / 2, top: (window.innerHeight - 800 * k) / 2, width: 1280, height: 800, transform: `scale(${k})`, transformOrigin: 'top left' }}><Markup /></div>
      {!bare && <button className="mx-btn" style={{ position: 'fixed', top: 10, right: 14, zIndex: 1001 }} onClick={onClose}>✕ 미리보기 닫기</button>}
    </div>
  );
}
