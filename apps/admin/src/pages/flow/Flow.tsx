import { useEffect, useState } from 'react';
import { supabase } from '../../shared/supabase';
import { PageHead, openPreview } from '../../shared/ui';
import { CATEGORIES, catLabel } from '../kinds/Kinds';
import { isNativeKind, NATIVE_SAMPLES, SAMPLE_VOCAB } from '../../shared/samples';

interface Step { id: string; lesson_id: string; pos: number; name_en: string; name_ko: string; minutes: number | null; special: string | null; src_id: string | null; kind: string | null; qty: number | null }
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
          <table>
            <thead><tr><th style={{ width: 28 }} /><th style={{ width: 36 }}>#</th><th style={{ width: 108 }}>미리보기</th><th>활동 (영문)</th><th>활동 (한글)</th><th style={{ width: 200 }}>활동 템플릿</th><th style={{ width: 60 }}>문항 수</th><th style={{ width: 60 }}>분</th><th style={{ width: 90 }}>구분</th>{owner.kind === 'unit' && <th style={{ width: 60 }}>문항</th>}<th style={{ width: 150 }} /></tr></thead>
            <tbody>
              {l.flow_steps.map((s, i) => (
                <tr key={s.id} style={{ opacity: drag?.lesson === l.id && drag.from === i ? 0.4 : 1, boxShadow: over?.lesson === l.id && over.at === i ? 'inset 0 3px 0 var(--navy)' : over?.lesson === l.id && over.at === l.flow_steps.length && i === l.flow_steps.length - 1 ? 'inset 0 -3px 0 var(--navy)' : undefined }}
                  onDragOver={(e) => { if (drag?.lesson !== l.id) return; e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); const at = e.clientY < r.top + r.height / 2 ? i : i + 1; if (over?.at !== at || over.lesson !== l.id) setOver({ lesson: l.id, at }); }}
                  onDrop={(e) => { if (drag?.lesson !== l.id) return; e.preventDefault(); void reorder(l, drag.from, over?.lesson === l.id ? over.at : i); }}>
                  <td className="mx-muted" draggable title="끌어서 순서 바꾸기" style={{ cursor: 'grab', userSelect: 'none', textAlign: 'center', fontSize: 18 }}
                    onDragStart={(e) => { setDrag({ lesson: l.id, from: i }); e.dataTransfer.effectAllowed = 'move'; const tr = e.currentTarget.closest('tr'); if (tr) e.dataTransfer.setDragImage(tr, 20, 20); }}
                    onDragEnd={() => { setDrag(null); setOver(null); }}>⠿</td>
                  <td>{i + 1}</td>
                  <td>{s.kind && isNativeKind(s.kind) && <button type="button" style={{ padding: 0, border: 0, background: 'none', cursor: 'pointer' }} title="눌러서 샘플 보기" onClick={() => void sample(s.kind!, s.name_ko || s.name_en)}><img className="mx-lthumb" src={`/thumbs/${s.kind}.jpg`} alt="샘플 미리보기" loading="lazy" /></button>}</td>
                  <td><Txt value={s.name_en} onSave={(v) => updStep(s.id, { name_en: v })} /></td>
                  <td><Txt value={s.name_ko} onSave={(v) => updStep(s.id, { name_ko: v })} /></td>
                  <td><select className="mx-cell" value={s.kind ?? ''} onChange={(e) => updStep(s.id, { kind: e.target.value || null })}><option value="">(지정 안 함)</option>{kinds.map((k) => <option key={k.key} value={k.key}>{k.name_ko}</option>)}</select></td>
                  <td><Txt value={s.qty == null ? '' : String(s.qty)} w={44} onSave={(v) => updStep(s.id, { qty: v === '' ? null : Math.max(0, parseInt(v, 10) || 0) })} /></td>
                  <td><Txt value={s.minutes == null ? '' : String(s.minutes)} w={44} onSave={(v) => updStep(s.id, { minutes: v === '' ? null : Math.max(0, parseInt(v, 10) || 0) })} /></td>
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
                      <span><b>{k.name_ko}</b>{k.importance ? <span className="mx-muted"> · {k.importance}</span> : null}<br /><span className="mx-muted" style={{ fontSize: 12 }}>{k.name_en}</span></span>
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
      const nl = await supabase.from('flow_lessons').insert({ template_id: n.data.id, no: l.no, en: l.en, ko: l.ko, goal: l.goal, color: l.color, track: l.track ?? 'core' }).select('id').single();
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
