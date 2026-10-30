import { useEffect, useState } from 'react';
import { supabase } from '../../shared/supabase';
import { emptyContent, type RBookRow } from './shared';

const COLS = 'id,code,level,title,emoji,week,ord,ar,cover_path,status,version,updated_at';

/** 원서 목록: 주차·순서·제목·AR·공개 상태를 바로 고치고, 책을 눌러 내용을 편집해요 */
export function BookList({ onEdit, nonce }: { onEdit: (code: string) => void; nonce: number }) {
  const [rows, setRows] = useState<RBookRow[] | null>(null); const [level, setLevel] = useState<'PRE' | 'BASIC'>('PRE');
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; s: string } | null>(null);
  const [add, setAdd] = useState<{ code: string; title: string; week: number } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null); const [overId, setOverId] = useState<string | null>(null);
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
  /** 끌어서 순서 바꾸기: 놓은 자리에 끼워 넣고, 같은 단계의 ord 값을 순서대로 다시 배정한다 */
  async function drop(targetId: string) {
    const from = dragId; setDragId(null); setOverId(null);
    if (!from || from === targetId) return;
    const arr = [...list]; const i = arr.findIndex((r) => r.id === from), j = arr.findIndex((r) => r.id === targetId);
    if (i < 0 || j < 0) return;
    const [m] = arr.splice(i, 1); arr.splice(j, 0, m);
    const ords = list.map((r) => r.ord);            // 기존 ord 값(오름차순)을 새 순서에 다시 나눠 준다
    const next = arr.map((r, k) => ({ ...r, ord: ords[k] }));
    const changed = next.filter((r) => r.ord !== list.find((x) => x.id === r.id)!.ord);
    setRows((x) => (x ? x.map((r) => next.find((n) => n.id === r.id) ?? r).sort((p, q) => (p.level === q.level ? p.ord - q.ord : p.level.localeCompare(q.level))) : x));
    const res = await Promise.all(changed.map((r) => supabase.from('reading_books').update({ ord: r.ord }).eq('id', r.id)));
    const e = res.find((r) => r.error)?.error; if (e) { setMsg({ t: 'err', s: e.message }); load(); } else setMsg({ t: 'ok', s: '순서를 바꿨어요' });
  }
  /** 1280×800 별도 창에서 학습 화면으로 미리 본다 */
  function preview(code: string) {
    const w = window.open('', 'mgReadPreview', `popup=yes,width=1280,height=800,left=${Math.max(0, (screen.width - 1280) / 2)},top=${Math.max(0, (screen.height - 800) / 2)}`);
    if (!w) { setMsg({ t: 'err', s: '팝업이 막혀 있어요. 주소창 오른쪽의 팝업 차단을 풀고 다시 눌러 주세요.' }); return; }
    w.location.href = '/#readpreview=' + encodeURIComponent(code); w.focus();
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
  const list = (rows ?? []).filter((r) => r.level === level);
  const pub = list.filter((r) => r.status === 'published').length;
  return (
    <div className="mx-card">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <div className="mx-seg" style={{ margin: 0 }}>{(['PRE', 'BASIC'] as const).map((l) => <button key={l} className={level === l ? 'on' : ''} onClick={() => setLevel(l)}>{l === 'PRE' ? 'Pre' : 'Basic'}</button>)}</div>
        <span className="mx-muted">{list.length}권 · 공개 {pub}권 · ⠿ 를 끌어서 순서를 바꿔요</span>
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
          <thead><tr><th style={{ width: 90 }}>순서</th><th>주차</th><th>이모지</th><th>제목</th><th>AR</th><th>버전</th><th>상태</th><th /></tr></thead>
          <tbody>{list.map((r, i) => (
            <tr key={r.id} onDragOver={(e) => { if (dragId) { e.preventDefault(); setOverId(r.id); } }} onDrop={(e) => { e.preventDefault(); void drop(r.id); }}
              style={{ opacity: dragId === r.id ? 0.4 : 1, boxShadow: overId === r.id && dragId && dragId !== r.id ? 'inset 0 3px 0 var(--navy)' : undefined }}>
              <td>
                <span draggable title="끌어서 순서 바꾸기" style={{ cursor: 'grab', userSelect: 'none', fontSize: 18, marginRight: 8, color: 'var(--sub)' }}
                  onDragStart={(e) => { setDragId(r.id); e.dataTransfer.effectAllowed = 'move'; const tr = (e.target as HTMLElement).closest('tr'); if (tr) e.dataTransfer.setDragImage(tr, 10, 10); }}
                  onDragEnd={() => { setDragId(null); setOverId(null); }}>⠿</span>{i + 1}
              </td>
              <td><input className="mx-cell" type="number" min={1} style={{ width: 60 }} defaultValue={r.week} onBlur={(e) => { const v = Math.max(1, +e.target.value || 1); if (v !== r.week) patch(r, { week: v }); }} /></td>
              <td><input className="mx-cell" style={{ width: 56 }} defaultValue={r.emoji ?? ''} onBlur={(e) => { if (e.target.value !== (r.emoji ?? '')) patch(r, { emoji: e.target.value }); }} /></td>
              <td style={{ minWidth: 240 }}>{r.title}</td>
              <td><input className="mx-cell" style={{ width: 60 }} defaultValue={r.ar ?? ''} onBlur={(e) => { const v = e.target.value.trim() || null; if (v !== r.ar) patch(r, { ar: v }); }} /></td>
              <td>v{r.version}</td>
              <td><select value={r.status} onChange={(e) => patch(r, { status: e.target.value as 'draft' | 'published' })}><option value="published">공개</option><option value="draft">비공개</option></select></td>
              <td style={{ textAlign: 'right' }}><button className="mx-btn" onClick={() => onEdit(r.code)}>Edit</button> <button className="mx-btn sec" onClick={() => preview(r.code)}>미리보기</button></td>
            </tr>))}</tbody>
        </table>)}
    </div>
  );
}
