import { useEffect, useState } from 'react';
import { supabase } from '../../shared/supabase';
import { emptyContent, type RBookRow } from './shared';

const COLS = 'id,code,level,title,emoji,week,ord,ar,cover_path,status,version,updated_at';

/** 원서 목록: 주차·순서·제목·AR·공개 상태를 바로 고치고, 책을 눌러 내용을 편집해요 */
export function BookList({ onEdit, nonce }: { onEdit: (code: string) => void; nonce: number }) {
  const [rows, setRows] = useState<RBookRow[] | null>(null); const [level, setLevel] = useState<'PRE' | 'BASIC'>('PRE');
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; s: string } | null>(null);
  const [add, setAdd] = useState<{ code: string; title: string; week: number } | null>(null);
  useEffect(() => { if (msg?.t === 'ok') { const id = setTimeout(() => setMsg(null), 1500); return () => clearTimeout(id); } }, [msg]);
  async function load() {
    const { data, error } = await supabase.from('reading_books').select(COLS).order('level').order('ord');
    if (error) setMsg({ t: 'err', s: error.message }); else setRows((data ?? []) as RBookRow[]);
  }
  useEffect(() => { load(); }, [nonce]); // eslint-disable-line

  async function patch(r: RBookRow, p: Partial<RBookRow>) {
    setRows((x) => x?.map((b) => (b.id === r.id ? { ...b, ...p } : b)) ?? x);
    const { error } = await supabase.from('reading_books').update({ ...p, updated_at: new Date().toISOString() }).eq('id', r.id);
    if (error) { setMsg({ t: 'err', s: error.message }); load(); }
  }
  async function swap(list: RBookRow[], i: number, d: number) {
    const a = list[i], b = list[i + d]; if (!a || !b) return;
    const [r1, r2] = await Promise.all([supabase.from('reading_books').update({ ord: b.ord }).eq('id', a.id), supabase.from('reading_books').update({ ord: a.ord }).eq('id', b.id)]);
    if (r1.error || r2.error) setMsg({ t: 'err', s: (r1.error ?? r2.error)!.message }); load();
  }
  async function setAll(status: 'draft' | 'published') {
    const ids = list.map((r) => r.id); if (!ids.length) return;
    if (!confirm(`${level} ${ids.length}권을 모두 ${status === 'published' ? '공개' : '비공개'}로 바꿀까요?`)) return;
    const { error } = await supabase.from('reading_books').update({ status }).in('id', ids);
    if (error) setMsg({ t: 'err', s: error.message }); else { setMsg({ t: 'ok', s: '바꿨어요' }); load(); }
  }
  async function create() {
    if (!add) return;
    const code = add.code.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    if (!code || !add.title.trim()) { setMsg({ t: 'err', s: '코드와 제목을 입력해 주세요' }); return; }
    if (rows?.some((r) => r.code === code)) { setMsg({ t: 'err', s: '이미 있는 코드예요' }); return; }
    const ord = Math.max(-1, ...(rows ?? []).filter((r) => r.level === level).map((r) => r.ord)) + 1;
    const { error } = await supabase.from('reading_books').insert({ code, level, title: add.title.trim(), week: add.week, ord, status: 'draft', content: emptyContent(add.title.trim()) });
    if (error) { setMsg({ t: 'err', s: error.message }); return; }
    setAdd(null); onEdit(code);
  }
  async function del(r: RBookRow) {
    if (r.status === 'published') { setMsg({ t: 'err', s: '공개 중인 책은 먼저 비공개로 바꿔 주세요' }); return; }
    if (!confirm(`「${r.title}」을(를) 삭제할까요?\n학생 진도와 영상 기록도 함께 지워져요.`)) return;
    const { error } = await supabase.from('reading_books').delete().eq('id', r.id);
    if (error) setMsg({ t: 'err', s: error.message }); else load();
  }

  const list = (rows ?? []).filter((r) => r.level === level);
  const pub = list.filter((r) => r.status === 'published').length;
  return (
    <div className="mx-card">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <div className="mx-seg" style={{ margin: 0 }}>{(['PRE', 'BASIC'] as const).map((l) => <button key={l} className={level === l ? 'on' : ''} onClick={() => setLevel(l)}>{l === 'PRE' ? 'Pre' : 'Basic'}</button>)}</div>
        <span className="mx-muted">{list.length}권 · 공개 {pub}권</span>
        <span style={{ flex: 1 }} />
        {msg && <span className={msg.t === 'ok' ? 'mx-ok' : 'mx-err'}>{msg.s}</span>}
        <button className="mx-btn sec" onClick={() => setAll('published')} disabled={!list.length}>전체 공개</button>
        <button className="mx-btn sec" onClick={() => setAll('draft')} disabled={!list.length}>전체 비공개</button>
        <button className="mx-btn" onClick={() => setAdd({ code: '', title: '', week: list.length ? list[list.length - 1].week : 1 })}>+ 책 추가</button>
      </div>
      {add && (
        <div className="mx-box" style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
          <label>코드 (영문, 예: THE_CAKE)<input value={add.code} onChange={(e) => setAdd({ ...add, code: e.target.value })} /></label>
          <label>제목<input value={add.title} onChange={(e) => setAdd({ ...add, title: e.target.value })} /></label>
          <label>주차<input type="number" min={1} style={{ width: 80 }} value={add.week} onChange={(e) => setAdd({ ...add, week: Math.max(1, +e.target.value || 1) })} /></label>
          <button className="mx-btn" onClick={create}>만들고 편집하기</button><button className="mx-btn sec" onClick={() => setAdd(null)}>취소</button>
        </div>)}
      {!rows ? <p className="mx-muted">불러오는 중…</p> : !list.length ? <p className="mx-muted">이 단계에는 아직 책이 없어요.</p> : (
        <table>
          <thead><tr><th>순서</th><th>주차</th><th>이모지</th><th>제목</th><th>코드</th><th>AR</th><th>버전</th><th>상태</th><th /></tr></thead>
          <tbody>{list.map((r, i) => (
            <tr key={r.id}>
              <td><button className="mx-btn sec" disabled={i === 0} onClick={() => swap(list, i, -1)}>↑</button> <button className="mx-btn sec" disabled={i === list.length - 1} onClick={() => swap(list, i, 1)}>↓</button> {i + 1}</td>
              <td><input className="mx-cell" type="number" min={1} style={{ width: 60 }} defaultValue={r.week} onBlur={(e) => { const v = Math.max(1, +e.target.value || 1); if (v !== r.week) patch(r, { week: v }); }} /></td>
              <td><input className="mx-cell" style={{ width: 56 }} defaultValue={r.emoji ?? ''} onBlur={(e) => { if (e.target.value !== (r.emoji ?? '')) patch(r, { emoji: e.target.value }); }} /></td>
              <td><input className="mx-cell" style={{ minWidth: 220 }} defaultValue={r.title} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== r.title) patch(r, { title: v }); }} /></td>
              <td className="mx-muted">{r.code}</td>
              <td><input className="mx-cell" style={{ width: 60 }} defaultValue={r.ar ?? ''} onBlur={(e) => { const v = e.target.value.trim() || null; if (v !== r.ar) patch(r, { ar: v }); }} /></td>
              <td>v{r.version}</td>
              <td><select value={r.status} onChange={(e) => patch(r, { status: e.target.value as 'draft' | 'published' })}><option value="published">공개</option><option value="draft">비공개</option></select></td>
              <td><button className="mx-btn" onClick={() => onEdit(r.code)}>내용 편집</button> <button className="mx-btn sec" onClick={() => del(r)}>삭제</button></td>
            </tr>))}</tbody>
        </table>)}
    </div>
  );
}
