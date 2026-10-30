import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';
import { MR_MARKUP, startMr, type MrCtx } from '@mango/mr';
import type { RBook } from './types';
import '@mango/mr/mr.css';

const COLS = 'id,code,level,title,emoji,week,ord,ar,cover_path,content';
type Take = { id: string; bookId: string; createdAt: string; filename: string; url: string };

async function sign(bucket: string, paths: string[], secs = 3600): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const want = [...new Set(paths.filter(Boolean))];
  for (let i = 0; i < want.length; i += 100) {
    const { data } = await supabase.storage.from(bucket).createSignedUrls(want.slice(i, i + 100), secs);
    for (const r of data ?? []) if (r.path && r.signedUrl) out[r.path] = r.signedUrl;
  }
  return out;
}

/** 원서(Pre) 학습: MVP 화면(Pre_Level_Prototype)을 그대로 띄우고, 책·진도·영상만 Supabase 에 연결한다. */
export function MrHost({ uid, startCode, onExit }: { uid: string; startCode?: string | null; onExit: () => void }) {
  const [ctx, setCtx] = useState<MrCtx | null>(null);
  const [err, setErr] = useState('');
  const exitRef = useRef(onExit); exitRef.current = onExit;
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const pr = await supabase.from('profiles').select('reading_level').eq('id', uid).maybeSingle();
      const level = (pr.data?.reading_level as string) === 'BASIC' ? 'BASIC' : 'PRE';
      const [b, p] = await Promise.all([
        supabase.from('reading_books').select(COLS).eq('level', level).eq('status', 'published').order('ord'),
        supabase.from('reading_progress').select('book_id,step_reached,completed').eq('user_id', uid),
      ]);
      if (b.error) throw b.error;
      const books = (b.data ?? []) as unknown as RBook[];
      const byId = new Map(books.map((x) => [x.id, x]));
      const byCode = new Map(books.map((x) => [x.code, x]));
      const covers = await sign('reading', books.map((x) => x.cover_path ?? ''));
      // 단어 이미지(이모지 대체): 등록된 단어만. 실패해도 이모지로 보여 주면 되므로 조용히 넘어간다.
      const words: Record<string, string> = {};
      try {
        const wr = await supabase.from('reading_words').select('word,image_path');
        const rows = (wr.data ?? []) as { word: string; image_path: string }[];
        const u = await sign('reading', rows.map((r) => r.image_path));
        for (const r of rows) if (u[r.image_path]) words[r.word.toLowerCase()] = u[r.image_path];
      } catch { /* 이모지로 대체 */ }
      const progress: MrCtx['progress'] = {};
      for (const r of (p.data ?? []) as { book_id: string; step_reached: number; completed: boolean }[]) {
        const bk = byId.get(r.book_id); if (bk) progress[bk.code] = { stepReached: r.step_reached, completed: r.completed };
      }
      const c: MrCtx = {
        userId: uid, progress,
        books: books.map((x) => ({ code: x.code, title: x.title, emoji: x.emoji, week: x.week, ar: x.ar, coverUrl: x.cover_path ? covers[x.cover_path] : undefined })),
        async loadBook(code) {
          const bk = byCode.get(code); if (!bk) throw new Error('책을 찾지 못했어요: ' + code);
          const urls = await sign('reading', [bk.cover_path ?? '', ...bk.content.pages.map((pg) => pg.img)]);
          return { id: bk.code, title: bk.title, cover: bk.cover_path ? urls[bk.cover_path] ?? '' : '', ar: bk.ar, ...bk.content,
            pages: bk.content.pages.map((pg) => ({ ...pg, img: urls[pg.img] ?? '' })) };
        },
        saveProgress(code, pr2) {
          const bk = byCode.get(code); if (!bk) return;
          void supabase.from('reading_progress').upsert({ user_id: uid, book_id: bk.id, step_reached: pr2.stepReached, completed: pr2.completed,
            updated_at: new Date().toISOString(), ...(pr2.completed ? { completed_at: new Date().toISOString() } : {}) }, { onConflict: 'user_id,book_id' });
        },
        async listTakes() {
          const { data } = await supabase.from('reading_videos').select('id,book_id,video_path,created_at').eq('user_id', uid).order('created_at');
          const rows = (data ?? []) as { id: string; book_id: string; video_path: string; created_at: string }[];
          const urls = await sign('outputs', rows.map((r) => r.video_path));
          return rows.filter((r) => urls[r.video_path] && byId.get(r.book_id)).map((r): Take => ({ id: r.id, bookId: byId.get(r.book_id)!.code, createdAt: r.created_at, filename: r.video_path, url: urls[r.video_path] }));
        },
        async saveTake(code, blob) {
          const bk = byCode.get(code); if (!bk) throw new Error('책 정보가 없어요');
          const path = `${uid}/reading/${code}-${Date.now()}.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`;
          const up = await supabase.storage.from('outputs').upload(path, blob, { contentType: blob.type || 'video/webm' });
          if (up.error) throw up.error;
          const ins = await supabase.from('reading_videos').insert({ user_id: uid, book_id: bk.id, video_path: path });
          if (ins.error) throw ins.error;
        },
        wordImg: (w) => words[String(w).toLowerCase()],
        exit: () => exitRef.current(),
      };
      if (alive) setCtx(c);
    })().catch((e) => { if (alive) setErr(String(e?.message ?? e)); });
    return () => { alive = false; };
  }, [uid]);

  useEffect(() => {
    if (!ctx || !root.current) return;
    const stop = startMr(ctx);
    if (startCode) setTimeout(() => (window as unknown as { openBook?: (c: string) => void }).openBook?.(startCode), 150);
    return stop;
  }, [ctx, startCode]);

  if (err) return <div className="mx-card"><h2>원서를 불러오지 못했어요</h2><p className="mx-muted">{err}</p><button className="mx-btn" onClick={onExit}>돌아가기</button></div>;
  if (!ctx) return <p className="mx-muted">불러오는 중…</p>;
  if (!ctx.books.length) return <div className="mx-card"><h2>읽을 원서가 아직 없어요</h2><p className="mx-muted">선생님이 원서를 열어 주면 여기에 나타나요.</p><button className="mx-btn" onClick={onExit}>돌아가기</button></div>;
  return <div className="mr-root" style={{ position: 'fixed', inset: 0, zIndex: 1000, overflow: 'auto' }} ref={root} dangerouslySetInnerHTML={{ __html: MR_MARKUP }} />;
}
