import { useEffect, useState } from 'react';
import { supabase } from '../../shared/supabase';
import { PageHead, openPreview } from '../../shared/ui';
import { CATEGORIES, catLabel } from '../kinds/Kinds';
import { isNativeKind, isSetKind, NATIVE_SAMPLES, SAMPLE_VOCAB } from '../../shared/samples';

interface Step { id: string; lesson_id: string; pos: number; name_en: string; name_ko: string; minutes: number | null; special: string | null; src_id: string | null; kind: string | null; qty: number | null; homework?: boolean; study?: boolean; ref_step_id?: string | null }
interface Lesson { id: string; no: number; track?: string; en: string; ko: string; goal: string; color: string; src_id: string | null; flow_steps: Step[] }
export type Owner = { kind: 'template'; id: string } | { kind: 'unit'; id: string };

interface KindOpt { key: string; name_ko: string; name_en?: string; category?: string; importance?: string | null }
const SPECIAL_KO: Record<string, string> = { diagnostic: '체크', adaptive: '맞춤' };

/** 흐름 편집기: 템플릿/단원 공용. 차시 > 활동 목록을 표로 보여주고 바로 고친다. */
export function FlowEditor({ owner }: { owner: Owner }) {
  const [ls, setLs] = useState<Lesson[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [kinds, setKinds] = useState<KindOpt[]>([]);
  const [pick, setPick] = useState<Lesson | null>(null);
  useEffect(() => { supabase.from('activity_types').select('key,name_ko,name_en,category,importance,active,sort').eq('active', true).order('sort').then((r) => setKinds((r.data ?? []) as KindOpt[])); }, []);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; s: string } | null>(null);
  const col = owner.kind === 'template' ? 'template_id' : 'unit_id';

  async function load() {
    const r = await supabase.from('flow_lessons').select('*, flow_steps(*)').eq(col, owner.id).order('no');
    if (r.error) { setMsg({ t: 'err', s: r.error.message }); return; }
    const rows = (r.data ?? []) as unknown as Lesson[];
    rows.forEach((l) => l.flow_steps.sort((a, b) => a.pos - b.pos));
    setLs(rows);
    if (owner.kind === 'unit') {
      const it = await supabase.from('items').select('step_id').eq('unit_id', owner.id).limit(5000);
      const c: Record<string, number> = {};
      (it.data ?? []).forEach((x: { step_id: string | null }) => { if (x.step_id) c[x.step_id] = (c[x.step_id] ?? 0) + 1; });
      setCounts(c);
    }
  }
  useEffect(() => { setLs(null); void load(); /* eslint-disable-next-line */ }, [owner.id]);

  async function run(p: PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await p;
    if (error) setMsg({ t: 'err', s: error.message }); else setMsg(null);
    await load();
  }
  const updLesson = (id: string, patch: Partial<Lesson>) => run(supabase.from('flow_lessons').update(patch).eq('id', id));
  const updStep = (id: string, patch: Partial<Step>) => run(supabase.from('flow_steps').update(patch).eq('id', id));
  const [drag, setDrag] = useState<{ lesson: string; from: number } | null>(null);
  const [over, setOver] = useState<{ lesson: string; at: number } | null>(null);
  /** 드래그해서 from 번째 활동을 to 번째 자리(0..n)로 옮긴다 */
  async function reorder(l: Lesson, from: number, to: number) {
    setDrag(null); setOver(null);
    const arr = [...l.flow_steps];
    const [m] = arr.splice(from, 1);
    arr.splice(to > from ? to - 1 : to, 0, m);
    if (arr.every((x, k) => x.id === l.flow_steps[k].id)) return;
    const res = await Promise.all(arr.map((x, k) => (x.pos === k ? Promise.resolve({ error: null }) : supabase.from('flow_steps').update({ pos: k }).eq('id', x.id))));
    const err = res.find((r) => r.error)?.error as { message: string } | null | undefined;
    if (err) setMsg({ t: 'err', s: err.message }); else setMsg(null);
    await load();
  }
  /** 활동 템플릿을 바꾸면, 이름을 직접 고치지 않은 경우(이전 템플릿 이름 그대로/새 활동) 활동 이름도 새 템플릿 이름으로 바꾼다 */
  function changeKind(s: Step, key: string) {
    const nk = kinds.find((k) => k.key === key); const ok = kinds.find((k) => k.key === s.kind);
    const same = (a: string, b?: string) => !!b && a.trim() === b.trim();
    const untouched = (s.name_en === 'New Activity' && s.name_ko === '새 활동') || (!!ok && same(s.name_ko, ok.name_ko) && (same(s.name_en, ok.name_en) || same(s.name_en, ok.name_ko)));
    const patch: Partial<Step> = { kind: key || null };
    if (nk && untouched) { patch.name_ko = nk.name_ko; patch.name_en = nk.name_en || nk.name_ko; }
    void updStep(s.id, patch);
  }
  async function sample(key: string, title: string) {
    const err = await openPreview(() => ({ kind: 'native', items: [NATIVE_SAMPLES[key]], vocab: SAMPLE_VOCAB, title }));
    if (err) setMsg({ t: 'err', s: err });
  }
  async function addStep(l: Lesson, k?: KindOpt) {
    const pos = l.flow_steps.length ? Math.max(...l.flow_steps.map((s) => s.pos)) + 1 : 0;
    setPick(null);
    await run(supabase.from('flow_steps').insert(k
      ? { lesson_id: l.id, pos, name_en: k.name_en || k.name_ko, name_ko: k.name_ko, minutes: 5, kind: k.key, qty: 3 }
      : { lesson_id: l.id, pos, name_en: 'New Activity', name_ko: '새 활동', minutes: 5 }));
  }
  async function delStep(s: Step) {
    const n = counts[s.id] ?? 0;
    if (!window.confirm(n ? `이 활동에는 문항 ${n}개가 연결돼 있어요. 삭제하면 문항은 남지만 어느 활동에도 속하지 않게 돼요. 삭제할까요?` : `"${s.name_ko || s.name_en}" 활동을 삭제할까요?`)) return;
    await run(supabase.from('flow_steps').delete().eq('id', s.id));
  }
  async function addLesson() {
    const no = ls && ls.length ? Math.max(...ls.map((l) => l.no)) + 1 : 1;
    await run(supabase.from('flow_lessons').insert({ [col]: owner.id, no, en: 'New Lesson', ko: '새 차시' }));
  }
  async function delLesson(l: Lesson) {
    const n = l.flow_steps.reduce((a, s) => a + (counts[s.id] ?? 0), 0);
    if (!window.confirm(`${l.no}차시와 활동 ${l.flow_steps.length}개를 삭제할까요?${n ? ` 연결된 문항 ${n}개는 남지만 활동에서 분리돼요.` : ''}`)) return;
    await run(supabase.from('flow_lessons').delete().eq('id', l.id));
  }

  if (!ls) return <p className="mx-muted">불러오는 중…</p>;
  return (
    <>
      {msg && <p className={msg.t === 'ok' ? 'mx-ok' : 'mx-err'}>{msg.s}</p>}
      {ls.map((l) => (
        <div className="mx-box" key={l.id}>
          <div className="mx-row mx-head">
            <b>{l.track === 'support' ? '보충' : l.track === 'challenge' ? '확장' : `${l.no}차시`}</b>
            <Txt value={l.en} w={200} onSave={(v) => updLesson(l.id, { en: v })} />
            <Txt value={l.ko} w={200} onSave={(v) => updLesson(l.id, { ko: v })} />
            <span style={{ flex: 1 }} />
            {l.track && l.track !== 'core' && <span className="mx-muted">활동 모음 · 권장 최대 {l.track === 'support' ? 5 : 3}개{l.flow_steps.length > (l.track === 'support' ? 5 : 3) ? ' (초과)' : ''}</span>}
            {owner.kind === 'unit' && !l.src_id && <span className="mx-tag">추가됨</span>}
            <button className="mx-btn sec" onClick={() => delLesson(l)}>차시 삭제</button>
          </div>
          <table className="mx-fixed" style={{ minWidth: 1000 }}>
            <colgroup><col style={{ width: 26 }} /><col style={{ width: 36 }} /><col style={{ width: 116 }} /><col style={{ width: '17%' }} /><col style={{ width: '19%' }} /><col style={{ width: '24%' }} /><col style={{ width: 68 }} /><col style={{ width: 60 }} /><col style={{ width: 56 }} /><col style={{ width: 56 }} /><col style={{ width: 150 }} /><col style={{ width: 68 }} />{owner.kind === 'unit' && <col style={{ width: 56 }} />}<col style={{ width: 84 }} /></colgroup>
            <thead><tr><th /><th>#</th><th>미리보기</th><th>활동 (영문)</th><th>활동 (한글)</th><th>활동 템플릿</th><th>문항 수</th><th>분</th><th>학습</th><th>숙제</th><th>문항 출처</th><th>구분</th>{owner.kind === 'unit' && <th>문항</th>}<th /></tr></thead>
            <tbody>
              {l.flow_steps.map((s, i) => (
                <tr key={s.id} style={{ opacity: drag?.lesson === l.id && drag.from === i ? 0.4 : 1, boxShadow: over?.lesson === l.id && over.at === i ? 'inset 0 3px 0 var(--navy)' : over?.lesson === l.id && over.at === l.flow_steps.length && i === l.flow_steps.length - 1 ? 'inset 0 -3px 0 var(--navy)' : undefined }}
                  onDragOver={(e) => { if (drag?.lesson !== l.id) return; e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); const at = e.clientY < r.top + r.height / 2 ? i : i + 1; if (over?.at !== at || over.lesson !== l.id) setOver({ lesson: l.id, at }); }}
                  onDrop={(e) => { if (drag?.lesson !== l.id) return; e.preventDefault(); void reorder(l, drag.from, over?.lesson === l.id ? over.at : i); }}>
                  <td className="mx-muted" draggable title="끌어서 순서 바꾸기" style={{ cursor: 'grab', userSelect: 'none', textAlign: 'center', fontSize: 16, padding: '0 2px' }}
                    onDragStart={(e) => { setDrag({ lesson: l.id, from: i }); e.dataTransfer.effectAllowed = 'move'; const tr = e.currentTarget.closest('tr'); if (tr) e.dataTransfer.setDragImage(tr, 20, 20); }}
                    onDragEnd={() => { setDrag(null); setOver(null); }}>⠿</td>
                  <td>{i + 1}</td>
                  <td>{s.kind && isNativeKind(s.kind) && <button type="button" style={{ padding: 0, border: 0, background: 'none', cursor: 'pointer' }} title="눌러서 샘플 보기" onClick={() => void sample(s.kind!, s.name_ko || s.name_en)}><img className="mx-lthumb" src={`/thumbs/${s.kind}.jpg`} alt="샘플 미리보기" loading="lazy" /></button>}</td>
                  <td><Txt value={s.name_en} onSave={(v) => updStep(s.id, { name_en: v })} /></td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ flex: 1, minWidth: 0 }}><Txt value={s.name_ko} onSave={(v) => updStep(s.id, { name_ko: v })} /></div>{isSetKind(s.kind) && <span className="mx-setbadge" style={{ flexShrink: 0 }}>세트</span>}</div></td>
                  <td><select className="mx-cell" value={s.kind ?? ''} onChange={(e) => changeKind(s, e.target.value)}><option value="">(지정 안 함)</option>{kinds.map((k) => <option key={k.key} value={k.key}>{k.name_ko}{isSetKind(k.key) ? ' (세트)' : ''}</option>)}</select></td>
                  <td><Txt value={s.qty == null ? '' : String(s.qty)} w={44} onSave={(v) => updStep(s.id, { qty: v === '' ? null : Math.max(0, parseInt(v, 10) || 0) })} /></td>
                  <td><Txt value={s.minutes == null ? '' : String(s.minutes)} w={44} onSave={(v) => updStep(s.id, { minutes: v === '' ? null : Math.max(0, parseInt(v, 10) || 0) })} /></td>
                  <td style={{ textAlign: 'center' }}><input type="checkbox" checked={s.study !== false} title="수업(학습)에서 하는 활동" onChange={(e) => updStep(s.id, { study: e.target.checked })} /></td>
                  <td style={{ textAlign: 'center' }}><input type="checkbox" checked={!!s.homework} title="숙제로 낼 수 있는 활동" onChange={(e) => updStep(s.id, { homework: e.target.checked })} /></td>
                  <td>{(() => { const all = ls.flatMap((x) => x.flow_steps.map((y, i) => ({ y, no: x.no, i: i + 1 }))); const src = all.find((z) => z.y.id === s.ref_step_id); const cands = all.filter((z) => z.y.id !== s.id && z.y.kind && z.y.kind === s.kind);
                    return (<>
                      
                      {src || cands.length ? <select className="mx-cell" value={s.ref_step_id ?? ''} title={src ? `${src.no}차시 ${src.i}번째 활동(${src.y.name_ko || src.y.name_en})의 문항을 그대로 씁니다` : "다른 활동의 문항을 그대로 가져다 쓸 때 고르세요"} onChange={(e) => updStep(s.id, { ref_step_id: e.target.value || null })}>
                    <option value="">[연결 없음]</option>
                    {all.filter((z) => z.y.id !== s.id && z.y.kind && z.y.kind === s.kind).map((z) => <option key={z.y.id} value={z.y.id} title={z.y.name_ko || z.y.name_en}>{z.no}차시-{z.i}</option>)}
                  </select> : <span className="mx-muted" title="같은 종류의 다른 활동이 없어서 연결할 대상이 없어요">-</span>}
                    </>); })()}</td>
                  <td>{s.special ? <span className="mx-tag">{SPECIAL_KO[s.special]}</span> : owner.kind === 'unit' && !s.src_id ? <span className="mx-tag">추가됨</span> : ''}</td>
                  {owner.kind === 'unit' && <td>{counts[s.id] ?? 0}</td>}
                  <td className="mx-act">
                    <button className="mx-btn sec" onClick={() => delStep(s)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="mx-btn sec" style={{ marginTop: 8 }} onClick={() => setPick(l)}>+ 활동 추가</button>
        </div>
      ))}
      <button className="mx-btn" onClick={addLesson}>+ 차시 추가</button>
      {pick && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setPick(null)}>
          <div className="mx-card" style={{ width: 720, maxWidth: '94vw', maxHeight: '86vh', overflow: 'auto', margin: 0 }} onClick={(e) => e.stopPropagation()}>
            <div className="mx-row" style={{ justifyContent: 'space-between' }}>
              <div className="mx-sec-t" style={{ margin: 0 }}>활동 템플릿 선택 · {pick.no}차시</div>
              <button className="mx-btn sec" onClick={() => setPick(null)}>닫기</button>
            </div>
            {CATEGORIES.filter((c) => kinds.some((k) => k.category === c)).map((c) => (
              <div key={c} style={{ marginTop: 12 }}>
                <div className="mx-muted" style={{ fontWeight: 700, marginBottom: 6 }}>{catLabel(c)}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 8 }}>
                  {kinds.filter((k) => k.category === c).map((k) => (
                    <button key={k.key} type="button" className="mx-btn sec" style={{ display: 'flex', gap: 10, alignItems: 'center', textAlign: 'left', padding: 6, fontWeight: 400 }} onClick={() => addStep(pick, k)}>
                      {isNativeKind(k.key) ? <img className="mx-lthumb" style={{ flex: 'none', width: 72, height: 45 }} src={`/thumbs/${k.key}.jpg`} alt="" loading="lazy" /> : <span style={{ width: 72, height: 45, flex: 'none' }} />}
                      <span><b>{k.name_ko}</b>{isSetKind(k.key) && <span className="mx-setbadge">세트</span>}{k.importance ? <span className="mx-muted"> · {k.importance}</span> : null}<br /><span className="mx-muted" style={{ fontSize: 12 }}>{k.name_en}</span></span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ marginTop: 14 }}><button className="mx-btn sec" onClick={() => void addStep(pick)}>템플릿 없이 빈 활동 추가</button></div>
          </div>
        </div>
      )}
    </>
  );
}

/** 입력 후 포커스를 벗어나거나 Enter 를 누르면 저장되는 칸 */
function Txt({ value, onSave, w }: { value: string; onSave: (v: string) => void; w?: number }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  const commit = () => { if (v !== value) onSave(v); };
  return <input className="mx-cell" style={w ? { width: '100%', maxWidth: w, boxSizing: 'border-box' } : undefined} value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />;
}

interface TplRow { id: string; name: string; note: string; publisher_id: string | null; grade: number | null }
interface PubRow { id: string; name: string }
const GRADES = [3, 4, 5, 6];
const HIDDEN_PUBS = ['테스트']; // 어휘 템플릿 시험용으로 만든 가짜 출판사는 목록에서 숨긴다
/** 흐름 템플릿 화면: 앞쪽은 출판사 × 학년 목록, 칸이나 템플릿을 누르면 편집 화면 */
export function Templates() {
  const [list, setList] = useState<TplRow[] | null>(null);
  const [pubs, setPubs] = useState<PubRow[]>([]);
  const [sel, setSel] = useState<string | null>(null); // null 이면 목록 화면
  const [form, setForm] = useState<{ pub: string; grade: number; name: string } | null>(null);
  const [err, setErr] = useState('');
  async function load() {
    const [t, p] = await Promise.all([
      supabase.from('flow_templates').select('id,name,note,publisher_id,grade').order('name'),
      supabase.from('publishers').select('id,name').order('name'),
    ]);
    if (t.error) setErr(t.error.message); else if (p.error) setErr(p.error.message);
    else { setList(t.data as TplRow[]); setPubs((p.data as PubRow[]).filter((x) => !HIDDEN_PUBS.includes(x.name))); }
  }
  useEffect(() => { void load(); }, []);
  const pubName = (id: string | null) => pubs.find((x) => x.id === id)?.name ?? '미분류';
  async function add(publisher_id: string, grade: number, name: string) {
    const r = await supabase.from('flow_templates').insert({ name, publisher_id, grade }).select('id').single();
    if (r.error) setErr(r.error.message); else { await load(); setSel(r.data.id); }
  }
  async function dup(cur: TplRow) {
    const name = window.prompt('복제할 새 템플릿 이름', cur.name + ' (복사)'); if (!name) return;
    const n = await supabase.from('flow_templates').insert({ name, publisher_id: cur.publisher_id, grade: cur.grade }).select('id').single();
    if (n.error) { setErr(n.error.message); return; }
    const src = await supabase.from('flow_lessons').select('*, flow_steps(*)').eq('template_id', cur.id).order('no');
    const idMap: Record<string, string> = {}; const refs: { id: string; ref: string }[] = [];
    for (const l of (src.data ?? []) as unknown as Lesson[]) {
      const nl = await supabase.from('flow_lessons').insert({ template_id: n.data.id, no: l.no, en: l.en, ko: l.ko, goal: l.goal, color: l.color, track: l.track ?? 'core' }).select('id').single();
      if (nl.error) { setErr(nl.error.message); return; }
      const rows = [...l.flow_steps].sort((x, y) => x.pos - y.pos);
      const steps = rows.map((s) => ({ lesson_id: nl.data.id, pos: s.pos, name_en: s.name_en, name_ko: s.name_ko, minutes: s.minutes, special: s.special, kind: s.kind, qty: s.qty, homework: s.homework ?? false, study: s.study ?? true, opts: (s as unknown as { opts?: unknown }).opts ?? {} }));
      if (steps.length) {
        const ins = await supabase.from('flow_steps').insert(steps).select('id,pos');
        if (ins.error) { setErr(ins.error.message); return; }
        rows.forEach((s) => { const m = ins.data?.find((x) => x.pos === s.pos); if (m) { idMap[s.id] = m.id; if (s.ref_step_id) refs.push({ id: m.id, ref: s.ref_step_id }); } });
      }
    }
    for (const r of refs) if (idMap[r.ref]) await supabase.from('flow_steps').update({ ref_step_id: idMap[r.ref] }).eq('id', r.id); // 문항 출처 연결도 복사본 안의 활동으로 이어 준다
    await load(); setSel(n.data.id);
  }
  async function del(cur: TplRow) {
    if (!window.confirm(`템플릿 "${cur.name}"을 삭제할까요? 이미 단원에 적용된 흐름에는 영향이 없어요.`)) return;
    const r = await supabase.from('flow_templates').delete().eq('id', cur.id);
    if (r.error) setErr(r.error.message); else { setSel(null); await load(); }
  }
  async function addPub() {
    const name = window.prompt('새 출판사 이름'); if (!name?.trim()) return;
    const r = await supabase.from('publishers').insert({ name: name.trim() });
    if (r.error) setErr(r.error.message); else await load();
  }
  if (err) return <p className="mx-err">{err}</p>;
  if (!list) return <p className="mx-muted">불러오는 중…</p>;
  const cur = list.find((t) => t.id === sel) ?? null;
  if (cur) {
    const sibs = list.filter((t) => t.publisher_id === cur.publisher_id && t.grade === cur.grade);
    return (
      <>
        <PageHead title="흐름 템플릿" sub="새 단원에 처음 복사되는 기본 흐름이에요. 여기를 고쳐도 이미 만들어진 단원의 흐름은 바뀌지 않아요." />
        <div className="mx-row" style={{ margin: '10px 0' }}>
          <button className="mx-btn sec" onClick={() => setSel(null)}>← 목록</button>
          <b style={{ margin: '0 4px' }}>{pubName(cur.publisher_id)} · {cur.grade ? '초' + cur.grade + ' 영어' : '학년 미정'}</b>
          <label className="mx-inline">템플릿<select value={cur.id} onChange={(e) => setSel(e.target.value)}>{sibs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
          <button className="mx-btn sec" onClick={() => dup(cur)}>복제</button>
          <button className="mx-btn sec" onClick={() => del(cur)}>삭제</button>
        </div>
        <FlowEditor owner={{ kind: 'template', id: cur.id }} />
      </>
    );
  }
  const shown = [...list].sort((x, y) => pubName(x.publisher_id).localeCompare(pubName(y.publisher_id)) || (x.grade ?? 0) - (y.grade ?? 0) || x.name.localeCompare(y.name));
  return (
    <>
      <PageHead title="흐름 템플릿" sub="교재(출판사·학년)별 기본 흐름이에요. 이름을 눌러 편집하고, 새 단원에는 여기서 복사돼요." />
      <div className="mx-box">
        <div className="mx-row" style={{ marginBottom: 8 }}>
          {!form ? <button className="mx-btn sec" onClick={() => setForm({ pub: pubs[0]?.id ?? '', grade: 5, name: '' })}>+ 새 템플릿</button> : (
            <>
              <select value={form.pub} onChange={(e) => setForm({ ...form, pub: e.target.value })} aria-label="출판사">{pubs.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
              <button type="button" className="mx-btn sec" onClick={addPub}>+ 출판사</button>
              <select value={form.grade} onChange={(e) => setForm({ ...form, grade: Number(e.target.value) })} aria-label="학년">{GRADES.map((g) => <option key={g} value={g}>{g}학년</option>)}</select>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="템플릿 이름" aria-label="템플릿 이름" />
              <button className="mx-btn" disabled={!form.pub || !form.name.trim()} onClick={() => { const f = form; setForm(null); void add(f.pub, f.grade, f.name.trim()); }}>만들기</button>
              <button className="mx-btn sec" onClick={() => setForm(null)}>취소</button>
            </>
          )}
        </div>
        {shown.length === 0 && <p className="mx-muted">템플릿이 없어요.</p>}
        <table>
          <thead><tr><th style={{ width: 200 }}>교재</th><th>템플릿</th><th>메모</th><th style={{ width: 150 }} /></tr></thead>
          <tbody>
            {shown.map((t) => (
              <tr key={t.id}>
                <td>{pubName(t.publisher_id)}{t.grade ? ` · 초${t.grade} 영어` : ''}</td>
                <td><button type="button" className="mx-link" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'inherit', fontWeight: 700, textDecoration: 'underline' }} onClick={() => setSel(t.id)}>{t.name}</button></td>
                <td className="mx-muted">{t.note}</td>
                <td><button className="mx-btn sec" style={{ padding: '2px 8px', marginRight: 4 }} onClick={() => dup(t)}>복제</button><button className="mx-btn sec" style={{ padding: '2px 8px' }} onClick={() => del(t)}>삭제</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

interface TplOpt { id: string; name: string }
/** 단원에 흐름이 없을 때 템플릿 적용 */
export function ApplyTemplate({ unitId, onDone }: { unitId: string; onDone: () => void }) {
  const [opts, setOpts] = useState<TplOpt[]>([]); const [sel, setSel] = useState(''); const [err, setErr] = useState('');
  useEffect(() => { supabase.from('flow_templates').select('id,name,grade,publishers(name)').order('name').then((r) => { const rows = ((r.data ?? []) as unknown as { id: string; name: string; grade: number | null; publishers: { name: string } | null }[]).map((t) => ({ id: t.id, name: `${t.publishers?.name ?? '미분류'}${t.grade ? ' · ' + t.grade + '학년' : ''} · ${t.name}` })); setOpts(rows); setSel(rows[0]?.id ?? ''); }); }, []);
  async function apply() {
    const r = await supabase.rpc('apply_flow_template', { p_template: sel, p_unit: unitId });
    if (r.error) setErr(r.error.message); else onDone();
  }
  return (
    <div className="mx-box">
      <p>이 단원에는 아직 흐름이 없어요. 템플릿을 적용하면 차시와 활동이 복사돼요.</p>
      <div className="mx-row"><select value={sel} onChange={(e) => setSel(e.target.value)}>{opts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select><button className="mx-btn" disabled={!sel} onClick={apply}>템플릿 적용</button></div>
      {err && <p className="mx-err">{err}</p>}
    </div>
  );
}

/** 단원 흐름 탭: 흐름이 있으면 편집기, 없으면 템플릿 적용 */
export function UnitFlow({ unitId }: { unitId: string }) {
  const [has, setHas] = useState<boolean | null>(null);
  const check = () => { supabase.from('flow_lessons').select('id', { count: 'exact', head: true }).eq('unit_id', unitId).then((r) => setHas((r.count ?? 0) > 0)); };
  useEffect(check, [unitId]);
  if (has === null) return <p className="mx-muted">불러오는 중…</p>;
  if (!has) return <ApplyTemplate unitId={unitId} onDone={check} />;
  return <FlowEditor owner={{ kind: 'unit', id: unitId }} />;
}
