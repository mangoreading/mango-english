import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { PageHead } from './ui';

interface Pub { id: string; name: string }
interface Book { id: string; publisher_id: string; grade: number; title: string; year: number | null; cover_url: string | null; lessons: number; units: { no: number; title: string; kind: string; seq: number | null }[] }
const tocOf = (b: Book) => [...b.units].sort((x, y) => (x.seq ?? x.no) - (y.seq ?? y.no)).map((u) => (u.kind === 'review' ? u.title : `LESSON ${u.no} ${u.title}`)).join('\n');
const empty = { publisher_id: '', grade: 5, title: '', year: new Date().getFullYear(), lessons: 12 };

/** 표지 그림을 가로 600px 이하 PNG 로 줄인다 */
async function shrink(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('그림을 읽지 못했어요')); i.src = url; });
    const r = Math.min(1, 600 / img.width); const c = document.createElement('canvas');
    c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise<Blob>((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('그림 변환 실패'))), 'image/png'));
  } finally { URL.revokeObjectURL(url); }
}

/** 교재 관리: 출판사 → 학년 → 책(표지, 12 Lesson). 책 1권 = 한 학년 전체 */
export function Books() {
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [books, setBooks] = useState<Book[] | null>(null);
  const [sel, setSel] = useState<string | 'new' | null>(null);
  const [f, setF] = useState(empty);
  const [file, setFile] = useState<File | null>(null);
  const [newPub, setNewPub] = useState('');
  const [toc, setToc] = useState('');
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; s: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [pubOpen, setPubOpen] = useState(false);
  useEffect(() => { if (msg?.t !== 'ok') return; const id = setTimeout(() => setMsg(null), 1200); return () => clearTimeout(id); }, [msg]);

  async function load() {
    const p = await supabase.from('publishers').select('id,name').order('name');
    const b = await supabase.from('books').select('id,publisher_id,grade,title,year,cover_url,lessons,units(no,title,kind,seq)').order('grade');
    if (p.error || b.error) { setMsg({ t: 'err', s: (p.error ?? b.error)!.message }); return; }
    setPubs((p.data ?? []) as Pub[]); setBooks((b.data ?? []) as unknown as Book[]);
    setSel((c) => c ?? ((b.data ?? [])[0] as { id: string } | undefined)?.id ?? null);
  }
  useEffect(() => { load(); }, []);
  useEffect(() => { if (cur && sel === cur.id) pick(cur); /* 처음 선택될 때 폼 채우기 */ // eslint-disable-next-line
  }, [books?.length, sel === null]);

  const pubName = (id: string) => pubs.find((x) => x.id === id)?.name ?? '';
  const cur = books?.find((x) => x.id === sel) ?? null;
  function pick(b: Book | 'new') {
    setFile(null);
    if (b === 'new') { setToc(''); setSel('new'); setF({ ...empty, publisher_id: pubs[0]?.id ?? '' }); return; }
    setToc(tocOf(b)); setSel(b.id); setF({ publisher_id: b.publisher_id, grade: b.grade, title: b.title, year: b.year ?? new Date().getFullYear(), lessons: b.lessons });
  }

  async function addPub() {
    const name = newPub.trim(); if (!name) return;
    const { data: ins, error } = await supabase.from('publishers').insert({ name }).select('id').single();
    if (error) { setMsg({ t: 'err', s: error.message.includes('duplicate') ? '이미 있는 출판사예요.' : error.message }); return; }
    setNewPub(''); setMsg({ t: 'ok', s: '출판사를 추가했어요' }); if (ins && sel) setF((x) => ({ ...x, publisher_id: ins.id })); load();
  }
  async function delPub(p: Pub) {
    if (books?.some((b) => b.publisher_id === p.id)) { setMsg({ t: 'err', s: '교재가 있는 출판사는 지울 수 없어요.' }); return; }
    if (!confirm(`출판사 "${p.name}"을(를) 지울까요?`)) return;
    const { error } = await supabase.from('publishers').delete().eq('id', p.id);
    if (error) setMsg({ t: 'err', s: error.message }); else load();
  }

  async function save() {
    if (!f.publisher_id || !f.title.trim()) { setMsg({ t: 'err', s: '출판사와 교재 이름을 입력해 주세요.' }); return; }
    setBusy(true);
    try {
      let cover = cur?.cover_url ?? null;
      if (file) {
        const blob = await shrink(file); const path = `cover-${Date.now()}.png`;
        const up = await supabase.storage.from('book-covers').upload(path, blob, { contentType: 'image/png' });
        if (up.error) throw new Error('표지 업로드 실패: ' + up.error.message);
        cover = supabase.storage.from('book-covers').getPublicUrl(path).data.publicUrl;
      }
      const row = { publisher_id: f.publisher_id, grade: f.grade, title: f.title.trim(), year: f.year || null, lessons: f.lessons, cover_url: cover };
      const r = sel === 'new' ? await supabase.from('books').insert(row).select('id').single() : await supabase.from('books').update(row).eq('id', sel!).select('id').single();
      if (r.error) throw new Error(r.error.message);
      setMsg({ t: 'ok', s: '저장했어요' }); setFile(null); await load(); setSel(r.data.id);
    } catch (e) { setMsg({ t: 'err', s: (e as Error).message }); } finally { setBusy(false); }
  }

  /** 목차 글을 붙여 넣어 단원을 만든다. "LESSON 1 제목" / "Review 1" 줄을 읽고, 이미 있는 단원은 건드리지 않는다. 줄 순서가 책 안의 순서가 된다. */
  async function makeUnits() {
    if (!cur) return;
    setBusy(true);
    try {
      const byNo = new Map(cur.units.map((u) => [u.no, u]));
      const ins: { book_id: string; no: number; title: string; kind: string; seq: number }[] = [];
      const upd: { no: number; title: string; seq: number }[] = [];
      toc.split('\n').map((l) => l.trim()).filter(Boolean).forEach((l, i) => {
        const m = l.match(/^lesson\s*(\d+)\s*[:.\-]?\s*(.*)$/i); const r = l.match(/^review\s*(\d+)/i);
        const no = m ? +m[1] : r ? 100 + +r[1] : 0; if (!no) return;
        const title = m ? (m[2] || `Lesson ${m[1]}`) : l; const ex = byNo.get(no);
        if (!ex) ins.push({ book_id: cur.id, no, title, kind: m ? 'lesson' : 'review', seq: i + 1 });
        else if (ex.title !== title || ex.seq !== i + 1) upd.push({ no, title, seq: i + 1 });
      });
      if (!ins.length && !upd.length) { setMsg({ t: 'ok', s: '바뀐 내용이 없어요' }); return; }
      if (ins.length) { const r = await supabase.from('units').insert(ins); if (r.error) throw new Error(r.error.message); }
      for (const u of upd) { const r = await supabase.from('units').update({ title: u.title, seq: u.seq }).eq('book_id', cur.id).eq('no', u.no); if (r.error) throw new Error(r.error.message); }
      setMsg({ t: 'ok', s: `추가 ${ins.length}개, 수정 ${upd.length}개` }); load();
    } catch (e) { setMsg({ t: 'err', s: (e as Error).message }); } finally { setBusy(false); }
  }
  async function delBook() {
    if (!cur || cur.units.length > 0) { setMsg({ t: 'err', s: '단원이 있는 교재는 지울 수 없어요.' }); return; }
    if (!confirm(`교재 "${cur.title}"을(를) 지울까요?`)) return;
    const { error } = await supabase.from('books').delete().eq('id', cur.id);
    if (error) setMsg({ t: 'err', s: error.message }); else { setSel(null); load(); }
  }

  const preview = file ? URL.createObjectURL(file) : cur?.cover_url ?? null;
  return (
    <>
      <PageHead title="교재 관리" sub="출판사 → 학년 → 교재(책 1권 = 한 학년, 12 Lesson). 교재마다 표지를 등록해요." />
      {msg?.t === 'err' && <p className="mx-err">{msg.s}</p>}
      {msg?.t === 'ok' && <div className="mx-toast" role="status">{msg.s}</div>}
      {!books ? <p className="mx-muted">불러오는 중…</p> : (
        <div className="mx-grid">
          <div className="mx-card">
            <div className="mx-row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <div className="mx-sec-t" style={{ margin: 0 }}>교재 ({books.length})</div>
              <button className="mx-btn" onClick={() => pick('new')} disabled={!pubs.length}>교재 추가</button>
            </div>
            {!pubs.length && <p className="mx-muted">먼저 출판사를 등록해 주세요. (교재 추가 후 출판사 옆 [관리] 버튼에서도 가능해요)</p>}
            <table className="mx-fixed">
              <colgroup><col style={{ width: 64 }} /><col style={{ width: '22%' }} /><col style={{ width: 56 }} /><col /><col style={{ width: 72 }} /></colgroup>
              <thead><tr><th>표지</th><th>출판사</th><th>학년</th><th>교재 이름</th><th>단원</th></tr></thead>
              <tbody>{books.map((b) => (
                <tr key={b.id} className={'mx-click' + (sel === b.id ? ' mx-sel' : '')} onClick={() => pick(b)}>
                  <td>{b.cover_url ? <img src={b.cover_url} alt="" style={{ height: 44, display: 'block' }} /> : <span className="mx-muted">없음</span>}</td>
                  <td>{pubName(b.publisher_id)}</td><td>{b.grade}</td><td>{b.title}</td><td>{b.units.filter((u) => u.kind === 'lesson').length} / {b.lessons}</td>
                </tr>))}</tbody>
            </table>
            {!books.length && <p className="mx-muted">등록된 교재가 없어요.</p>}
          </div>
          <div className="mx-card">
            {!sel ? <p className="mx-muted">왼쪽에서 교재를 고르거나 [교재 추가]를 눌러 주세요.</p> : (
              <>
                <div className="mx-sec-t">{sel === 'new' ? '새 교재' : '교재 정보'}</div>
                <div className="mx-row" style={{ alignItems: 'flex-start', gap: 24, flexWrap: 'nowrap' }}>
                  <div style={{ width: 150, flex: 'none' }}>
                    {preview ? <img src={preview} alt="표지" style={{ width: '100%', border: '1px solid #ddd', display: 'block' }} /> : <div className="mx-muted" style={{ border: '1px dashed #ccc', padding: '60px 0', textAlign: 'center' }}>표지 없음</div>}
                    <input type="file" accept="image/*" style={{ marginTop: 8, width: '100%' }} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  </div>
                  <div className="mx-f" style={{ flex: 1, minWidth: 0 }}>
                    <label>출판사
                      <span className="mx-row" style={{ flexWrap: 'nowrap' }}>
                        <select value={f.publisher_id} onChange={(e) => setF({ ...f, publisher_id: e.target.value })}><option value="">선택</option>{pubs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                        <button type="button" className="mx-btn sec" onClick={() => setPubOpen(true)}>관리</button>
                      </span>
                    </label>
                    <label>학년 <select value={f.grade} onChange={(e) => setF({ ...f, grade: +e.target.value })}>{[1, 2, 3, 4, 5, 6].map((g) => <option key={g} value={g}>{g}학년</option>)}</select></label>
                    <label>교재 이름 <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
                    <label>연도 <input type="number" value={f.year ?? ''} onChange={(e) => setF({ ...f, year: +e.target.value })} /></label>
                    <label>Lesson 수 <input type="number" min={1} max={30} value={f.lessons} onChange={(e) => setF({ ...f, lessons: +e.target.value })} /></label>
                    <div className="mx-row">
                      <button className="mx-btn" disabled={busy} onClick={save}>저장</button>
                      {sel !== 'new' && <button className="mx-btn sec" disabled={busy} onClick={delBook}>교재 삭제</button>}
                    </div>
                  </div>
                </div>
                {sel !== 'new' && (
                  <div style={{ marginTop: 18 }}>
                    <div className="mx-sec-t">단원 목차</div>
                    <p className="mx-muted">현재 등록된 단원이 한 줄에 하나씩 채워져 있어요. 줄을 고치거나 추가·순서 변경한 뒤 [목차 반영]을 누르면 새 단원은 만들고, 제목·순서가 바뀐 단원은 수정해요. (형식: LESSON 1 제목 / Review 1. 줄을 지워도 기존 단원은 삭제되지 않아요)</p>
                    <textarea rows={7} style={{ width: '100%', boxSizing: 'border-box' }} value={toc} onChange={(e) => setToc(e.target.value)} />
                    <button className="mx-btn" disabled={busy || !toc.trim()} onClick={makeUnits}>목차 반영</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {pubOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setPubOpen(false)}>
          <div className="mx-card" style={{ width: 420, maxWidth: '92vw', margin: 0 }} onClick={(e) => e.stopPropagation()}>
            <div className="mx-sec-t">출판사 관리</div>
            <table>
              <tbody>{pubs.map((p) => (
                <tr key={p.id}><td>{p.name}</td><td className="mx-act"><button className="mx-btn sec" onClick={() => delPub(p)}>삭제</button></td></tr>))}</tbody>
            </table>
            {!pubs.length && <p className="mx-muted">등록된 출판사가 없어요.</p>}
            <div className="mx-row" style={{ marginTop: 10 }}>
              <input value={newPub} placeholder="출판사 이름" autoFocus onChange={(e) => setNewPub(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPub()} />
              <button className="mx-btn" onClick={addPub} disabled={!newPub.trim()}>추가</button>
              <span style={{ flex: 1 }} />
              <button className="mx-btn sec" onClick={() => setPubOpen(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
