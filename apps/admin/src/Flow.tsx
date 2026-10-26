import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { PageHead } from './ui';

interface Step { id: string; lesson_id: string; pos: number; name_en: string; name_ko: string; minutes: number | null; special: string | null; src_id: string | null; kind: string | null; qty: number | null }
interface Lesson { id: string; no: number; en: string; ko: string; goal: string; color: string; src_id: string | null; flow_steps: Step[] }
export type Owner = { kind: 'template'; id: string } | { kind: 'unit'; id: string };

const SPECIAL_KO: Record<string, string> = { diagnostic: '체크', adaptive: '맞춤' };

/** 흐름 편집기: 템플릿/단원 공용. 차시 > 활동 목록을 표로 보여주고 바로 고친다. */
export function FlowEditor({ owner }: { owner: Owner }) {
  const [ls, setLs] = useState<Lesson[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [kinds, setKinds] = useState<{ key: string; name_ko: string }[]>([]);
  useEffect(() => { supabase.from('activity_types').select('key,name_ko,active,sort').eq('active', true).order('sort').then((r) => setKinds((r.data ?? []) as { key: string; name_ko: string }[])); }, []);
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
  async function move(l: Lesson, i: number, d: -1 | 1) {
    const a = l.flow_steps[i], b = l.flow_steps[i + d]; if (!a || !b) return;
    await run(supabase.from('flow_steps').update({ pos: b.pos }).eq('id', a.id));
    await run(supabase.from('flow_steps').update({ pos: a.pos }).eq('id', b.id));
  }
  async function addStep(l: Lesson) {
    const pos = l.flow_steps.length ? Math.max(...l.flow_steps.map((s) => s.pos)) + 1 : 0;
    await run(supabase.from('flow_steps').insert({ lesson_id: l.id, pos, name_en: 'New Activity', name_ko: '새 활동', minutes: 5 }));
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
            <b>{l.no}차시</b>
            <Txt value={l.en} w={200} onSave={(v) => updLesson(l.id, { en: v })} />
            <Txt value={l.ko} w={200} onSave={(v) => updLesson(l.id, { ko: v })} />
            <span style={{ flex: 1 }} />
            {owner.kind === 'unit' && !l.src_id && <span className="mx-tag">추가됨</span>}
            <button className="mx-btn sec" onClick={() => delLesson(l)}>차시 삭제</button>
          </div>
          <table>
            <thead><tr><th style={{ width: 36 }}>#</th><th>활동 (영문)</th><th>활동 (한글)</th><th style={{ width: 200 }}>활동 템플릿</th><th style={{ width: 60 }}>문항 수</th><th style={{ width: 60 }}>분</th><th style={{ width: 90 }}>구분</th>{owner.kind === 'unit' && <th style={{ width: 60 }}>문항</th>}<th style={{ width: 150 }} /></tr></thead>
            <tbody>
              {l.flow_steps.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td><Txt value={s.name_en} onSave={(v) => updStep(s.id, { name_en: v })} /></td>
                  <td><Txt value={s.name_ko} onSave={(v) => updStep(s.id, { name_ko: v })} /></td>
                  <td><select className="mx-cell" value={s.kind ?? ''} onChange={(e) => updStep(s.id, { kind: e.target.value || null })}><option value="">(지정 안 함)</option>{kinds.map((k) => <option key={k.key} value={k.key}>{k.name_ko}</option>)}</select></td>
                  <td><Txt value={s.qty == null ? '' : String(s.qty)} w={44} onSave={(v) => updStep(s.id, { qty: v === '' ? null : Math.max(0, parseInt(v, 10) || 0) })} /></td>
                  <td><Txt value={s.minutes == null ? '' : String(s.minutes)} w={44} onSave={(v) => updStep(s.id, { minutes: v === '' ? null : Math.max(0, parseInt(v, 10) || 0) })} /></td>
                  <td>{s.special ? <span className="mx-tag">{SPECIAL_KO[s.special]}</span> : owner.kind === 'unit' && !s.src_id ? <span className="mx-tag">추가됨</span> : ''}</td>
                  {owner.kind === 'unit' && <td>{counts[s.id] ?? 0}</td>}
                  <td className="mx-act">
                    <button className="mx-btn sec" disabled={i === 0} onClick={() => move(l, i, -1)}>↑</button>
                    <button className="mx-btn sec" disabled={i === l.flow_steps.length - 1} onClick={() => move(l, i, 1)}>↓</button>
                    <button className="mx-btn sec" onClick={() => delStep(s)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="mx-btn sec" style={{ marginTop: 8 }} onClick={() => addStep(l)}>+ 활동 추가</button>
        </div>
      ))}
      <button className="mx-btn" onClick={addLesson}>+ 차시 추가</button>
    </>
  );
}

/** 입력 후 포커스를 벗어나거나 Enter 를 누르면 저장되는 칸 */
function Txt({ value, onSave, w }: { value: string; onSave: (v: string) => void; w?: number }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  const commit = () => { if (v !== value) onSave(v); };
  return <input className="mx-cell" style={w ? { width: w } : undefined} value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />;
}

interface TplRow { id: string; name: string; note: string }
/** 흐름 템플릿 화면 */
export function Templates() {
  const [list, setList] = useState<TplRow[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [err, setErr] = useState('');
  async function load() {
    const r = await supabase.from('flow_templates').select('id,name,note').order('name');
    if (r.error) setErr(r.error.message); else { setList(r.data as TplRow[]); if (!sel && r.data?.length) setSel(r.data[0].id); }
  }
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, []);
  async function add() {
    const name = window.prompt('새 템플릿 이름'); if (!name) return;
    const r = await supabase.from('flow_templates').insert({ name }).select('id').single();
    if (r.error) setErr(r.error.message); else { setSel(r.data.id); await load(); }
  }
  async function dup() {
    const cur = list?.find((t) => t.id === sel); if (!cur) return;
    const name = window.prompt('복제할 새 템플릿 이름', cur.name + ' (복사)'); if (!name) return;
    const n = await supabase.from('flow_templates').insert({ name }).select('id').single();
    if (n.error) { setErr(n.error.message); return; }
    const src = await supabase.from('flow_lessons').select('*, flow_steps(*)').eq('template_id', cur.id).order('no');
    for (const l of (src.data ?? []) as unknown as Lesson[]) {
      const nl = await supabase.from('flow_lessons').insert({ template_id: n.data.id, no: l.no, en: l.en, ko: l.ko, goal: l.goal, color: l.color }).select('id').single();
      if (nl.error) { setErr(nl.error.message); return; }
      const steps = l.flow_steps.map((s) => ({ lesson_id: nl.data.id, pos: s.pos, name_en: s.name_en, name_ko: s.name_ko, minutes: s.minutes, special: s.special, kind: s.kind, qty: s.qty }));
      if (steps.length) await supabase.from('flow_steps').insert(steps);
    }
    setSel(n.data.id); await load();
  }
  async function del() {
    const cur = list?.find((t) => t.id === sel); if (!cur) return;
    if (!window.confirm(`템플릿 "${cur.name}"을 삭제할까요? 이미 단원에 적용된 흐름에는 영향이 없어요.`)) return;
    const r = await supabase.from('flow_templates').delete().eq('id', cur.id);
    if (r.error) setErr(r.error.message); else { setSel(null); await load(); }
  }
  if (err) return <p className="mx-err">{err}</p>;
  if (!list) return <p className="mx-muted">불러오는 중…</p>;
  return (
    <>
      <PageHead title="흐름 템플릿" sub="새 단원에 처음 복사되는 기본 흐름이에요. 여기를 고쳐도 이미 만들어진 단원의 흐름은 바뀌지 않아요." />
      <div className="mx-row" style={{ margin: '10px 0' }}>
        <label className="mx-inline">템플릿<select value={sel ?? ''} onChange={(e) => setSel(e.target.value)}>{list.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <button className="mx-btn sec" onClick={add}>+ 새 템플릿</button>
        <button className="mx-btn sec" disabled={!sel} onClick={dup}>복제</button>
        <button className="mx-btn sec" disabled={!sel} onClick={del}>삭제</button>
      </div>
      {sel ? <FlowEditor owner={{ kind: 'template', id: sel }} /> : <p className="mx-muted">템플릿이 없어요.</p>}
    </>
  );
}

interface TplOpt { id: string; name: string }
/** 단원에 흐름이 없을 때 템플릿 적용 */
export function ApplyTemplate({ unitId, onDone }: { unitId: string; onDone: () => void }) {
  const [opts, setOpts] = useState<TplOpt[]>([]); const [sel, setSel] = useState(''); const [err, setErr] = useState('');
  useEffect(() => { supabase.from('flow_templates').select('id,name').order('name').then((r) => { setOpts((r.data ?? []) as TplOpt[]); setSel(r.data?.[0]?.id ?? ''); }); }, []);
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
