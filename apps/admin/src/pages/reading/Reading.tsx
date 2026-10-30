import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../shared/supabase';
import { PageHead } from '../../shared/ui';

interface Row { id: string; code: string; level: string; title: string; week: number; ord: number; ar: string | null; status: string; version: number; cover_path: string | null }
interface ImportBook { code: string; level: string; title: string; emoji: string | null; week: number; ord: number; ar: string | null; cover: string; content: unknown }
interface ImportFile { version: number; books: ImportBook[]; images: { src: string; dest: string }[] }

const MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };

/** 원서 관리: 변환된 JSON 가져오기 → 이미지 폴더 올리기 → 공개(published) */
export function Reading() {
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
    setBusy(false); setMsg({ t: 'ok', s: `책 ${n}권을 저장했어요 (비공개 상태). 이제 이미지를 올려 주세요.` }); load();
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

  async function setStatus(r: Row, status: 'draft' | 'published') {
    const { error } = await supabase.from('reading_books').update({ status }).eq('id', r.id);
    if (error) setMsg({ t: 'err', s: error.message }); else load();
  }
  async function publishAll(status: 'draft' | 'published') {
    const { error } = await supabase.from('reading_books').update({ status }).in('id', (rows ?? []).map((r) => r.id));
    if (error) setMsg({ t: 'err', s: error.message }); else { setMsg({ t: 'ok', s: status === 'published' ? '전체 공개했어요' : '전체 비공개로 바꿨어요' }); load(); }
  }

  return (
    <>
      <PageHead title="원서 관리" sub="Pre/Basic 원서를 가져오고 이미지를 올려 학습앱에 공개해요" />
      <div className="mx-card">
        <h3>1. 원서 가져오기</h3>
        <p className="mx-muted">변환기(tools/reading/convert.mjs)로 만든 <code>reading_import.json</code> 파일을 고르세요. 같은 책은 덮어쓰고 버전이 올라가며, 공개 상태는 유지돼요.</p>
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
      <div className="mx-card">
        <h3>3. 공개 관리 {rows ? `(${rows.length}권)` : ''}</h3>
        <p><button className="mx-btn" onClick={() => publishAll('published')} disabled={!rows?.length}>전체 공개</button>{' '}
          <button className="mx-btn sec" onClick={() => publishAll('draft')} disabled={!rows?.length}>전체 비공개</button></p>
        {rows && (
          <table>
            <thead><tr><th>단계</th><th>주차</th><th>순서</th><th>제목</th><th>AR</th><th>버전</th><th>상태</th><th /></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id}>
                <td>{r.level}</td><td>{r.week}</td><td>{r.ord + 1}</td><td>{r.title}</td><td>{r.ar}</td><td>v{r.version}</td>
                <td>{r.status === 'published' ? '공개' : '비공개'}</td>
                <td><button className="mx-btn sec" onClick={() => setStatus(r, r.status === 'published' ? 'draft' : 'published')}>{r.status === 'published' ? '비공개로' : '공개로'}</button></td>
              </tr>))}</tbody>
          </table>
        )}
      </div>
    </>
  );
}
