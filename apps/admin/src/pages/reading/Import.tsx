import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../shared/supabase';

interface Row { id: string; code: string; level: string; title: string; week: number; ord: number; ar: string | null; status: string; version: number; cover_path: string | null }
interface ImportBook { code: string; level: string; title: string; emoji: string | null; week: number; ord: number; ar: string | null; cover: string; content: unknown }
interface ImportFile { version: number; books: ImportBook[]; images: { src: string; dest: string }[] }

const MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };

/** 원서 관리: 변환된 JSON 가져오기 → 이미지 폴더 올리기 → 공개(published) */
export function ImportBooks({ onDone }: { onDone?: () => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; s: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [imp, setImp] = useState<ImportFile | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const imgInput = useRef<HTMLInputElement>(null);

  async function load() {
    const { data, error } = await supabase.from('reading_books').select('id,code,level,title,week,ord,ar,status,version,cover_path').order('level').order('ord');
    if (error) { setMsg({ t: 'err', s: error.message }); return; }
    setRows((data ?? []) as Row[]);
  }
  useEffect(() => { load(); }, []);

  async function pickJson(f: File | undefined) {
    if (!f) return;
    try {
      const j = JSON.parse(await f.text()) as ImportFile;
      if (!Array.isArray(j.books) || !Array.isArray(j.images)) throw new Error('원서 변환 파일이 아니에요');
      setImp(j); setMsg(null);
    } catch (e) { setImp(null); setMsg({ t: 'err', s: '파일을 읽지 못했어요: ' + (e as Error).message }); }
  }

  /** 책 내용 저장: 같은 code 는 덮어쓰고 version 을 올린다. 새 책은 비공개(draft)로 시작 */
  async function importBooks() {
    if (!imp) return;
    setBusy(true); setLog([]);
    const old = new Map((rows ?? []).map((r) => [r.code, r]));
    let n = 0;
    for (const b of imp.books) {
      const prev = old.get(b.code);
      const { error } = await supabase.from('reading_books').upsert({
        code: b.code, level: b.level, title: b.title, emoji: b.emoji, week: b.week, ord: b.ord, ar: b.ar, cover_path: b.cover, content: b.content,
        status: prev?.status ?? 'draft', version: (prev?.version ?? 0) + 1, updated_at: new Date().toISOString(),
      }, { onConflict: 'code' });
      if (error) { setMsg({ t: 'err', s: `${b.code}: ${error.message}` }); setBusy(false); return; }
      n++;
    }
    setBusy(false); setMsg({ t: 'ok', s: `책 ${n}권을 저장했어요 (새 책은 비공개 상태). 필요하면 이미지를 올려 주세요.` }); await load(); onDone?.();
  }

  /** 고른 폴더의 이미지를 변환 파일의 매핑대로 올린다. 폴더 안에서 'pages/…' 또는 'covers/…' 로 끝나는 경로를 찾는다 */
  async function uploadImages(files: FileList | null) {
    if (!imp || !files?.length) return;
    setBusy(true); setLog([]);
    const byPath = new Map<string, File>();
    for (const f of Array.from(files)) {
      const rel = ((f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name).replace(/\\/g, '/');
      byPath.set(rel, f);
    }
    const find = (src: string) => { for (const [p, f] of byPath) if (p === src || p.endsWith('/' + src)) return f; return null; };
    const missing: string[] = []; let ok = 0, fail = 0;
    const queue = imp.images.slice();
    const worker = async () => {
      for (;;) {
        const it = queue.shift(); if (!it) return;
        const f = find(it.src);
        if (!f) { missing.push(it.src); continue; }
        const ext = it.dest.split('.').pop()!.toLowerCase();
        const { error } = await supabase.storage.from('reading').upload(it.dest, f, { upsert: true, contentType: MIME[ext] ?? f.type });
        if (error) { fail++; setLog((l) => [...l, `${it.dest}: ${error.message}`]); } else ok++;
        if ((ok + fail) % 20 === 0) setMsg({ t: 'ok', s: `올리는 중… ${ok + fail}/${imp.images.length}` });
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    setBusy(false);
    setLog((l) => [...(missing.length ? [`폴더에서 찾지 못한 파일 ${missing.length}개:`, ...missing.slice(0, 30), missing.length > 30 ? '…' : ''] : []), ...l]);
    setMsg({ t: fail || missing.length ? 'err' : 'ok', s: `이미지 ${ok}개 올림${fail ? `, 실패 ${fail}` : ''}${missing.length ? `, 없음 ${missing.length}` : ''}` });
    if (imgInput.current) imgInput.current.value = '';
  }

  return (
    <>
      <div className="mx-card">
        <h3>1. 원서 일괄 가져오기</h3>
        <p className="mx-muted">변환기(tools/reading/convert.mjs)로 만든 <code>reading_import.json</code> 파일을 고르세요. 같은 책 코드는 내용을 통째로 덮어쓰고 버전이 올라가요(화면에서 고친 내용도 덮어써지니 주의!). 공개 상태는 유지돼요.</p>
        <input type="file" accept=".json,application/json" onChange={(e) => pickJson(e.target.files?.[0])} disabled={busy} />
        {imp && <p>책 {imp.books.length}권 · 이미지 {imp.images.length}개 <button className="mx-btn" onClick={importBooks} disabled={busy}>가져오기</button></p>}
      </div>
      <div className="mx-card">
        <h3>2. 이미지 올리기</h3>
        <p className="mx-muted">원서 폴더의 <b>assets</b> 폴더를 고르세요. 변환 파일의 경로(pages/…, covers/…)와 맞는 이미지만 올라가요. 로그인한 학습자만 볼 수 있는 비공개 저장소예요.</p>
        <input ref={imgInput} type="file" multiple disabled={busy || !imp}
          {...({ webkitdirectory: '' } as Record<string, string>)} onChange={(e) => uploadImages(e.target.files)} />
        {!imp && <p className="mx-muted">먼저 1번에서 변환 파일을 골라 주세요.</p>}
      </div>
      {msg && <p className={msg.t === 'ok' ? 'mx-ok' : 'mx-err'}>{msg.s}</p>}
      {log.length > 0 && <pre className="mx-card" style={{ maxHeight: 220, overflow: 'auto', fontSize: 12 }}>{log.join('\n')}</pre>}
    </>
  );
}
