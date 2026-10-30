import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../shared/supabase';
import { signReading, type RContent } from './shared';

interface W { word: string; kor: string; kinds: Set<string>; books: Set<string> }
interface Row { word: string; image_path: string }

/** 이미지를 가로세로 최대 512px 의 PNG 로 줄인다(투명 배경 유지). 화면에서는 100~170px 로 쓰여서 충분해요. */
async function shrink(file: File, max = 512): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('이미지를 읽지 못했어요')); i.src = url; });
    const r = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas');
    c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise<Blob>((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('변환 실패'))), 'image/png'));
  } finally { URL.revokeObjectURL(url); }
}
const stemOf = (name: string) => name.replace(/\.[^.]+$/, '').trim().toLowerCase();
const fileKey = (w: string) => w.toLowerCase().replace(/[-\s]+/g, '_');

/** 단어 이미지: 원서에 나오는 모든 단어(키워드·파닉스)의 그림을 올려요. 파일 이름이 단어와 같으면(apple.png) 한꺼번에 올릴 수 있어요. */
export function WordImages() {
  const [titles, setTitles] = useState<string[]>([]);
  const [words, setWords] = useState<W[] | null>(null); const [rows, setRows] = useState<Record<string, string>>({});
  const [urls, setUrls] = useState<Record<string, string>>({}); const [msg, setMsg] = useState<{ t: 'ok' | 'err'; s: string } | null>(null);
  const [busy, setBusy] = useState(false); const [q, setQ] = useState(''); const [bookSel, setBookSel] = useState(''); const [only, setOnly] = useState<'all' | 'missing' | 'done'>('all');
  const one = useRef<{ word: string } | null>(null); const oneInput = useRef<HTMLInputElement>(null);

  async function load() {
    const [b, w] = await Promise.all([
      supabase.from('reading_books').select('title,content').order('ord'),
      supabase.from('reading_words').select('word,image_path'),
    ]);
    const e = b.error ?? w.error; if (e) { setMsg({ t: 'err', s: e.message }); return; }
    setTitles(((b.data ?? []) as unknown as { title: string }[]).map((x) => x.title));
    const map = new Map<string, W>();
    const add = (word: string, kor: string, kind: string, title: string) => {
      const k = word.toLowerCase().trim(); if (!k) return;
      const x = map.get(k) ?? { word: k, kor: '', kinds: new Set<string>(), books: new Set<string>() };
      x.kinds.add(kind); x.books.add(title); if (kind === '키워드' || !x.kor) x.kor = kor || x.kor; map.set(k, x);
    };
    for (const bk of (b.data ?? []) as unknown as { title: string; content: RContent }[]) {
      for (const k of bk.content.keyWords ?? []) add(k.word, k.kor, '키워드', bk.title);
      for (const p of bk.content.phonics ?? []) for (const c of p.cvc ?? []) add(c.word, '', '파닉스', bk.title);   // 라임 단어는 이미지 없이 글자만 쓴다
    }
    setWords([...map.values()].sort((a, c) => a.word.localeCompare(c.word)));
    const rm: Record<string, string> = {}; for (const r of (w.data ?? []) as Row[]) rm[r.word] = r.image_path;
    setRows(rm); setUrls(await signReading(Object.values(rm)));
  }
  useEffect(() => { load(); }, []); // eslint-disable-line
  useEffect(() => { if (msg?.t === 'ok') { const id = setTimeout(() => setMsg(null), 2500); return () => clearTimeout(id); } }, [msg]);

  async function put(word: string, file: File) {
    const blob = await shrink(file);
    const path = `words/${fileKey(word)}-${Date.now()}.png`;
    const up = await supabase.storage.from('reading').upload(path, blob, { contentType: 'image/png' });
    if (up.error) throw up.error;
    const { error } = await supabase.from('reading_words').upsert({ word, image_path: path, updated_at: new Date().toISOString() }, { onConflict: 'word' });
    if (error) throw error;
    const old = rows[word]; if (old) void supabase.storage.from('reading').remove([old]);
    setRows((r) => ({ ...r, [word]: path })); setUrls((u) => ({ ...u, [path]: URL.createObjectURL(blob) }));
  }
  async function bulk(files: FileList | null) {
    if (!files?.length || !words) return;
    setBusy(true); const byKey = new Map(words.map((w) => [fileKey(w.word), w.word]));
    let ok = 0; const unknown: string[] = []; const failed: string[] = [];
    for (const f of Array.from(files)) {
      const word = byKey.get(stemOf(f.name).replace(/[-\s]+/g, '_'));
      if (!word) { unknown.push(f.name); continue; }
      try { await put(word, f); ok++; setMsg({ t: 'ok', s: `올리는 중… ${ok}개` }); } catch (e) { failed.push(`${f.name}: ${(e as Error).message}`); }
    }
    setBusy(false);
    setMsg({ t: unknown.length || failed.length ? 'err' : 'ok', s: `${ok}개 올렸어요${unknown.length ? ` · 단어 목록에 없는 파일 ${unknown.length}개(${unknown.slice(0, 4).join(', ')}${unknown.length > 4 ? '…' : ''})` : ''}${failed.length ? ` · 실패 ${failed.length}개(${failed[0]})` : ''}` });
  }
  async function single(f: File | undefined) {
    const t = one.current; if (!f || !t) return;
    setBusy(true); try { await put(t.word, f); setMsg({ t: 'ok', s: `${t.word} 이미지를 올렸어요` }); } catch (e) { setMsg({ t: 'err', s: (e as Error).message }); }
    setBusy(false); if (oneInput.current) oneInput.current.value = '';
  }
  async function remove(word: string) {
    if (!confirm(`「${word}」 이미지를 지울까요? (이모지로 돌아가요)`)) return;
    const { error } = await supabase.from('reading_words').delete().eq('word', word);
    if (error) { setMsg({ t: 'err', s: error.message }); return; }
    void supabase.storage.from('reading').remove([rows[word]]); setRows((r) => { const x = { ...r }; delete x[word]; return x; });
  }

  const list = useMemo(() => (words ?? []).filter((w) => (only === 'all' || (only === 'done') === !!rows[w.word]) && (!bookSel || w.books.has(bookSel)) && (!q || w.word.includes(q.toLowerCase()) || w.kor.includes(q) || [...w.books].some((t) => t.toLowerCase().includes(q.toLowerCase())))), [words, rows, q, only, bookSel]);
  if (!words) return <div className="mx-card">{msg ? <p className="mx-err">{msg.s}</p> : <p className="mx-muted">불러오는 중…</p>}</div>;
  const done = words.filter((w) => rows[w.word]).length;
  return (
    <div className="mx-card">
      <input ref={oneInput} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={(e) => single(e.target.files?.[0])} />
      <p className="mx-muted">키워드·파닉스(CVC) 단어 {words.length}개 중 <b>{done}개</b>에 이미지가 있어요. 이미지가 있는 단어는 학습 화면에서 이모지 대신 이 그림이 보여요(키워드 카드, 파닉스 단어 카드). 라임 단어는 글자만 보여요.</p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '10px 0' }}>
        <label className="mx-btn" style={{ cursor: 'pointer', flexDirection: 'row' }}>📁 여러 장 한꺼번에 올리기
          <input type="file" multiple accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} disabled={busy} onChange={(e) => { void bulk(e.target.files); e.target.value = ''; }} />
        </label>
        <span className="mx-muted">파일 이름 = 영어 단어 (예: apple.png, fox_trot.png). 자동으로 512px로 줄여 올려요.</span>
        <span style={{ flex: 1 }} />
        {msg && <span className={msg.t === 'ok' ? 'mx-ok' : 'mx-err'}>{msg.s}</span>}
        <select value={bookSel} onChange={(e) => setBookSel(e.target.value)} title="등장 책으로 찾기"><option value="">모든 책</option>{titles.map((t) => <option key={t} value={t}>{t}</option>)}</select>
        <input placeholder="단어/뜻/책 검색" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 170 }} />
        <select value={only} onChange={(e) => setOnly(e.target.value as 'all' | 'missing' | 'done')}><option value="all">전체</option><option value="missing">이미지 없음</option><option value="done">이미지 있음</option></select>
      </div>
      <p className="mx-muted">{list.length}개 표시{bookSel ? ` · 「${bookSel}」에 나오는 단어 ${list.filter((w) => rows[w.word]).length}/${list.length}개에 이미지가 있어요` : ''}</p>
      <table>
        <thead><tr><th>이미지</th><th>단어</th><th>뜻</th><th>구분</th><th>등장 책</th><th /></tr></thead>
        <tbody>{list.map((w) => {
          const p = rows[w.word]; const u = p ? urls[p] : undefined;
          return (
            <tr key={w.word}>
              <td style={{ width: 90 }}>{u ? <img src={u} alt={w.word} style={{ height: 64, maxWidth: 80, objectFit: 'contain' }} /> : <span className="mx-muted">없음</span>}</td>
              <td><b>{w.word}</b></td><td>{w.kor}</td><td>{[...w.kinds].join('/')}</td><td title={[...w.books].join(', ')} style={{ whiteSpace: 'normal', maxWidth: 320 }}>{[...w.books].slice(0, 2).join(', ')}{w.books.size > 2 ? ` 외 ${w.books.size - 2}권` : ''}</td>
              <td><button className="mx-btn sec" disabled={busy} onClick={() => { one.current = { word: w.word }; oneInput.current?.click(); }}>{p ? '교체' : '올리기'}</button>{p && <> <button className="mx-btn sec" onClick={() => remove(w.word)}>삭제</button></>}</td>
            </tr>);
        })}</tbody>
      </table>
    </div>
  );
}
