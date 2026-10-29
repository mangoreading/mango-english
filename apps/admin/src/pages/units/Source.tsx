import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../shared/supabase';

interface Src { id: string; kind: 'scan' | 'script'; lesson_no: number | null; sort: number; title: string; body: string; memo: string; remark: string; file_path: string | null }

/** 교과서 자료: 쪽 스캔 보관 + QR 음원·영상 스크립트 표. 본사 전용(학습앱에는 나가지 않아요). */
export function Source({ unitId, uid }: { unitId: string; uid: string }) {
  const [rows, setRows] = useState<Src[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const [big, setBig] = useState<string | null>(null);
  const [paste, setPaste] = useState(''); const [showPaste, setShowPaste] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  async function load() {
    const r = await supabase.from('unit_sources').select('*').eq('unit_id', unitId).order('sort').order('created_at');
    if (r.error) { setMsg('불러오기 실패: ' + r.error.message + ' (마이그레이션 0051 이 적용됐는지 확인하세요)'); return; }
    const xs = (r.data ?? []) as Src[]; setRows(xs);
    const paths = xs.filter((x) => x.file_path).map((x) => x.file_path!);
    if (paths.length) {
      const s = await supabase.storage.from('textbook').createSignedUrls(paths, 3600);
      const m: Record<string, string> = {}; (s.data ?? []).forEach((d) => { if (d.path && d.signedUrl) m[d.path] = d.signedUrl; }); setUrls(m);
    }
  }
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [unitId]);
  const scans = rows.filter((x) => x.kind === 'scan'); const scripts = rows.filter((x) => x.kind === 'script');

  async function onFiles(fl: FileList | null) {
    if (!fl?.length) return; setBusy(true); setMsg('');
    let n = 0; let sort = Math.max(0, ...scans.map((s) => s.sort)) + 1;
    for (const f of Array.from(fl)) {
      const path = `${unitId}/${Date.now()}-${n}-${f.name.replace(/[^\w.\-]+/g, '_')}`;
      const up = await supabase.storage.from('textbook').upload(path, f, { contentType: f.type || 'image/jpeg' });
      if (up.error) { setMsg('업로드 실패: ' + up.error.message); break; }
      const ins = await supabase.from('unit_sources').insert({ unit_id: unitId, kind: 'scan', sort: sort++, title: f.name.replace(/\.[^.]+$/, ''), file_path: path, created_by: uid });
      if (ins.error) { setMsg('저장 실패: ' + ins.error.message); break; }
      n++;
    }
    setBusy(false); if (file.current) file.current.value = ''; if (n) setMsg(`${n}장 올렸어요.`); void load();
  }
  async function patch(id: string, p: Partial<Src>) {
    const { error } = await supabase.from('unit_sources').update(p).eq('id', id);
    if (error) setMsg('저장 실패: ' + error.message); else setRows((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));
  }
  async function del(s: Src) {
    if (!window.confirm('이 자료를 삭제할까요? 되돌릴 수 없어요.')) return;
    if (s.file_path) await supabase.storage.from('textbook').remove([s.file_path]);
    const { error } = await supabase.from('unit_sources').delete().eq('id', s.id);
    if (error) setMsg('삭제 실패: ' + error.message); else void load();
  }
  async function addScript(p: Partial<Src> = {}) {
    const sort = Math.max(0, ...scripts.map((s) => s.sort)) + 1;
    const { error } = await supabase.from('unit_sources').insert({ unit_id: unitId, kind: 'script', sort, title: '음원', created_by: uid, ...p });
    if (error) setMsg('추가 실패: ' + error.message); else void load();
  }
  async function importPaste() {
    // 엑셀/표에서 복사한 줄: 차시 ⇥ 구분 ⇥ 스크립트 ⇥ 활동 메모 ⇥ Remark
    const lines = paste.split(/\r?\n/).map((l) => l.split('\t')).filter((c) => c.some((x) => x.trim()));
    if (!lines.length) return;
    let sort = Math.max(0, ...scripts.map((s) => s.sort)) + 1;
    const recs = lines.map((c) => ({ unit_id: unitId, kind: 'script', sort: sort++, lesson_no: parseInt(c[0]) || null, title: (c[1] ?? '').trim(), body: (c[2] ?? '').trim(), memo: (c[3] ?? '').trim(), remark: (c[4] ?? '').trim(), created_by: uid }));
    const { error } = await supabase.from('unit_sources').insert(recs);
    if (error) setMsg('붙여넣기 실패: ' + error.message); else { setMsg(`${recs.length}줄을 추가했어요.`); setPaste(''); setShowPaste(false); void load(); }
  }

  return (
    <>
      <div className="mx-card">
        <div className="mx-row"><b>교과서 쪽 스캔 {scans.length}장</b><span className="mx-muted">본사만 볼 수 있고 학생 앱에는 나가지 않아요 · 저작권 자료라 문항에 그대로 옮기지 않아요</span><span style={{ flex: 1 }} />
          <input ref={file} type="file" accept="image/*,application/pdf" multiple hidden onChange={(e) => void onFiles(e.target.files)} />
          <button className="mx-btn" disabled={busy} onClick={() => file.current?.click()}>{busy ? '올리는 중…' : '+ 스캔 올리기'}</button></div>
        {msg && <p className="mx-ok">{msg}</p>}
        <div className="mx-src-grid">
          {scans.map((s) => (
            <div key={s.id} className="mx-src-card">
              {s.file_path && urls[s.file_path] ? (/\.pdf$/i.test(s.file_path) ? <a href={urls[s.file_path]} target="_blank" rel="noreferrer">PDF 열기</a> : <img src={urls[s.file_path]} alt={s.title} onClick={() => setBig(urls[s.file_path!])} />) : <div className="mx-muted">불러오는 중…</div>}
              <input defaultValue={s.title} placeholder="쪽 / 제목 (예: p.126)" onBlur={(e) => e.target.value !== s.title && patch(s.id, { title: e.target.value })} />
              <div className="mx-row"><select value={s.lesson_no ?? ''} onChange={(e) => patch(s.id, { lesson_no: e.target.value ? Number(e.target.value) : null })}><option value="">차시 없음</option>{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}차시</option>)}</select>
                <button className="mx-link" onClick={() => del(s)}>삭제</button></div>
              <input defaultValue={s.memo} placeholder="메모" onBlur={(e) => e.target.value !== s.memo && patch(s.id, { memo: e.target.value })} />
            </div>))}
        </div>
        {!scans.length && <p className="mx-muted">아직 올린 스캔이 없어요. 교재 쪽을 사진/스캔 파일로 올려 두면 문항을 검수할 때 같이 볼 수 있어요.</p>}
      </div>
      <div className="mx-card mx-scroll">
        <div className="mx-row"><b>QR 음원·영상 스크립트 {scripts.length}줄</b><span style={{ flex: 1 }} />
          <button className="mx-btn sec" onClick={() => setShowPaste(!showPaste)}>표 붙여넣기</button><button className="mx-btn" onClick={() => addScript()}>+ 줄 추가</button></div>
        {showPaste && <div style={{ marginTop: 8 }}><p className="mx-muted">엑셀·표에서 복사해 붙여넣으세요. 열 순서: 차시 | 구분(음원/영상) | 스크립트 | 활동 메모 | Remark</p>
          <textarea rows={6} value={paste} onChange={(e) => setPaste(e.target.value)} spellCheck={false} /><div className="mx-row" style={{ marginTop: 6 }}><button className="mx-btn" onClick={importPaste}>추가</button><button className="mx-btn sec" onClick={() => setShowPaste(false)}>닫기</button></div></div>}
        <table>
          <thead><tr><th style={{ width: 70 }}>차시</th><th style={{ width: 90 }}>구분</th><th>스크립트</th><th style={{ width: 200 }}>활동 메모</th><th style={{ width: 160 }}>Remark</th><th style={{ width: 50 }} /></tr></thead>
          <tbody>{scripts.map((s) => (
            <tr key={s.id}>
              <td><select value={s.lesson_no ?? ''} onChange={(e) => patch(s.id, { lesson_no: e.target.value ? Number(e.target.value) : null })}><option value="">-</option>{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}</select></td>
              <td><select value={s.title} onChange={(e) => patch(s.id, { title: e.target.value })}>{['음원', '영상', s.title].filter((v, i, a) => v && a.indexOf(v) === i).map((v) => <option key={v}>{v}</option>)}</select></td>
              <td><textarea rows={3} defaultValue={s.body} onBlur={(e) => e.target.value !== s.body && patch(s.id, { body: e.target.value })} /></td>
              <td><textarea rows={3} defaultValue={s.memo} onBlur={(e) => e.target.value !== s.memo && patch(s.id, { memo: e.target.value })} /></td>
              <td><textarea rows={3} defaultValue={s.remark} onBlur={(e) => e.target.value !== s.remark && patch(s.id, { remark: e.target.value })} /></td>
              <td><button className="mx-link" onClick={() => del(s)}>삭제</button></td></tr>))}</tbody>
        </table>
        {!scripts.length && <p className="mx-muted">스크립트 표가 비어 있어요. 위의 "표 붙여넣기"로 한 번에 넣을 수 있어요.</p>}
      </div>
      {big && <div className="mx-src-big" onClick={() => setBig(null)}><img src={big} alt="" /></div>}
    </>
  );
}
