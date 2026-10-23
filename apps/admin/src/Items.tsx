import { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import { openPreview } from './ui';
import { isNativeKind, nativeVocab } from './samples';
import { ItemForm, KIND_NAME, defaultItem, validate, type VocabOpt } from './ItemForm';
import type { KindRow } from './Kinds';

export type Status = 'draft' | 'review' | 'approved' | 'rejected';
const STATUSES: Status[] = ['draft', 'review', 'approved', 'rejected'];
const STATUS_KO: Record<Status, string> = { draft: '초안', review: '검수중', approved: '승인', rejected: '반려' };
const LEVELS = ['CORE', 'SUPPORT', 'ADVANCED'];

interface ItemRow { id: string; unit_id: string; lesson: number; act_idx: number; level: string; template: string; tag: string | null; status: Status; version: number; step_id: string | null; tpl_ver?: number; payload: Record<string, any> }
interface StepInfo { id: string; lessonNo: number; pos: number; name: string }
type Msg = { t: 'ok' | 'err'; s: string } | null;

function summary(p: Record<string, any>): string {
  if (Array.isArray(p.words)) return p.words.join(', ');
  if (typeof p.word === 'string') return p.word;
  const t = (p.q ?? p.title ?? p.prompt ?? p.target ?? p.ko ?? p.text ?? p.ans ?? p.cards?.[0]?.en ?? '') as string;
  return String(t).replace(/\s+/g, ' ').slice(0, 60);
}

export function Items({ unitId, uid }: { unitId: string; uid: string }) {
  const [items, setItems] = useState<ItemRow[]>([]);
  const [steps, setSteps] = useState<StepInfo[]>([]);
  const [vocab, setVocab] = useState<VocabOpt[]>([]);
  const keys = useMemo(() => vocab.map((v) => v.key), [vocab]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<Msg>(null);
  const [level, setLevel] = useState('CORE'); const [stepF, setStepF] = useState('all'); const [status, setStatus] = useState('all'); const [q, setQ] = useState('');
  const [selId, setSelId] = useState<string | null>(null);
  const [bundleVer, setBundleVer] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [kinds, setKinds] = useState<KindRow[]>([]);

  async function load() {
    setLoading(true);
    const it = await supabase.from('items').select('id,unit_id,lesson,act_idx,level,template,tag,status,version,step_id,tpl_ver,payload').eq('unit_id', unitId).order('lesson').order('act_idx').limit(5000);
    if (it.error) setMsg({ t: 'err', s: it.error.message }); else setItems((it.data ?? []) as unknown as ItemRow[]);
    const fl = await supabase.from('flow_lessons').select('no, flow_steps(id,pos,name_en,name_ko)').eq('unit_id', unitId).order('no');
    const st: StepInfo[] = [];
    ((fl.data ?? []) as any[]).forEach((l) => (l.flow_steps ?? []).forEach((s: any) => st.push({ id: s.id, lessonNo: l.no, pos: s.pos, name: s.name_ko || s.name_en })));
    st.sort((a, b) => a.lessonNo - b.lessonNo || a.pos - b.pos);
    setSteps(st);
    const at = await supabase.from('activity_types').select('key,name_ko,version,description,category,sort,active').eq('active', true).order('category').order('sort');
    setKinds((at.data ?? []) as KindRow[]);
    const v = await supabase.from('unit_vocab').select('vocab(key,en,ko,image_path)').eq('unit_id', unitId);
    setVocab(((v.data ?? []) as any[]).map((r) => r.vocab).filter(Boolean).sort((a: VocabOpt, b: VocabOpt) => a.en.localeCompare(b.en)));
    const b = await supabase.from('unit_bundles').select('version').eq('unit_id', unitId).order('version', { ascending: false }).limit(1);
    setBundleVer(b.data?.[0]?.version ?? null);
    setLoading(false);
  }
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [unitId]);

  const stepOf = useMemo(() => { const m: Record<string, StepInfo> = {}; steps.forEach((s) => { m[s.id] = s; }); return m; }, [steps]);
  const shown = useMemo(() => items.filter((i) =>
    (level === 'all' || i.level === level) && (stepF === 'all' || (stepF === 'none' ? !i.step_id : i.step_id === stepF)) && (status === 'all' || (status === 'stale' ? stale(i) : i.status === status))
    && (!q || JSON.stringify(i.payload).toLowerCase().includes(q.toLowerCase()))), [items, level, stepF, status, q]);
  const stale = (i: ItemRow) => (i.tpl_ver ?? 1) < (kinds.find((x) => x.key === i.template)?.version ?? 1);
  const kindName = (k: string) => kinds.find((x) => x.key === k)?.name_ko ?? KIND_NAME[k] ?? k;
  const sel = items.find((i) => i.id === selId) ?? null;
  const counts = useMemo(() => { const c: Record<string, number> = {}; items.forEach((i) => { c[i.status] = (c[i.status] ?? 0) + 1; }); return c; }, [items]);

  async function bulk(to: Status) {
    if (!shown.length) return;
    if (!window.confirm(`현재 목록의 ${shown.length}개 문항을 "${STATUS_KO[to]}"로 바꿀까요?`)) return;
    setBusy(true);
    const { error } = await supabase.from('items').update({ status: to, reviewed_by: uid, updated_at: new Date().toISOString() }).in('id', shown.map((i) => i.id));
    setBusy(false);
    if (error) setMsg({ t: 'err', s: error.message }); else { setMsg({ t: 'ok', s: `${shown.length}개를 "${STATUS_KO[to]}"로 바꿨어요.` }); void load(); }
  }
  async function publish() {
    const oldN = items.filter((i) => i.status === 'approved' && stale(i)).length;
    if (!window.confirm(`승인된 ${counts.approved ?? 0}개 문항으로 새 버전을 발행할까요? 학습앱에 바로 반영돼요.` + (oldN ? `\n\n주의: 템플릿이 바뀐 뒤 확인하지 않은(옛 버전) 승인 문항이 ${oldN}개 있어요. 그래도 발행할까요?` : ''))) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('publish_unit', { p_unit: unitId });
    setBusy(false);
    if (error) setMsg({ t: 'err', s: '발행 실패: ' + error.message }); else { setMsg({ t: 'ok', s: `발행했어요. 버전 ${data}` }); setBundleVer(data as number); }
  }
  async function create(lv: string, stepId: string, kind: string) {
    const st = stepOf[stepId]; if (!st) return;
    const inStep = items.filter((i) => i.step_id === stepId && i.level === lv);
    const act_idx = inStep.length ? Math.max(...inStep.map((i) => i.act_idx)) + 1 : st.pos * 100;
    const payload = defaultItem(kind);
    const r = await supabase.from('items').insert({ unit_id: unitId, lesson: st.lessonNo, act_idx, level: lv, template: kind, payload, status: 'draft', step_id: stepId, created_by: uid }).select('id').single();
    if (r.error) { setMsg({ t: 'err', s: '추가 실패: ' + r.error.message }); return; }
    setAdding(false); setLevel(lv); setStepF(stepId); setStatus('all'); setQ('');
    await load(); setSelId(r.data.id);
  }

  return (
    <>
      <div className="mx-card">
        <div className="mx-row">
          <span>전체 {items.length}문항</span>
          {STATUSES.map((s) => <span key={s} className={`mx-chip ${s}`}>{STATUS_KO[s]} {counts[s] ?? 0}</span>)}
          <span className="mx-muted">발행 버전: {bundleVer ?? '없음'}</span>
          <span style={{ flex: 1 }} />
          <button className="mx-btn go" disabled={busy || !(counts.approved ?? 0)} onClick={publish}>발행</button>
        </div>
        {msg && <p className={msg.t === 'ok' ? 'mx-ok' : 'mx-err'}>{msg.s}</p>}
        {items.some(stale) && <p className="mx-err">템플릿이 바뀐 뒤 확인하지 않은 문항이 {items.filter(stale).length}개 있어요. 상태 필터에서 "옛 버전"을 골라 확인하고 저장하면 최신 버전이 돼요.</p>}
      </div>
      <div className="mx-card">
        <div className="mx-row">
          <label>레벨<select value={level} onChange={(e) => setLevel(e.target.value)}><option value="all">전체</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></label>
          <label>활동<select value={stepF} onChange={(e) => setStepF(e.target.value)}><option value="all">전체</option><option value="none">(연결 안 됨)</option>{steps.map((s) => <option key={s.id} value={s.id}>{s.lessonNo}차시 · {s.name}</option>)}</select></label>
          <label>상태<select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">전체</option>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_KO[s]}</option>)}<option value="stale">옛 버전 (재검토 필요)</option></select></label>
          <label>검색<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="문항 내용에서 찾기" /></label>
          <span style={{ flex: 1 }} />
          <span className="mx-muted">목록 {shown.length}개 일괄:</span>
          {(['review', 'approved', 'rejected'] as Status[]).map((s) => <button key={s} className="mx-btn sec" disabled={busy || !shown.length} onClick={() => bulk(s)}>{STATUS_KO[s]}</button>)}
          <button className="mx-btn" onClick={() => setAdding(!adding)}>+ 문항 추가</button>
        </div>
        {adding && <AddBar kinds={kinds} steps={steps} level={level === 'all' ? 'CORE' : level} step={stepF} onAdd={create} onCancel={() => setAdding(false)} />}
      </div>
      <div className="mx-grid">
        <div className="mx-card mx-scroll">
          {loading ? <p className="mx-muted">불러오는 중…</p> : (
            <table>
              <thead><tr><th>차시</th><th>레벨</th><th>활동</th><th>종류</th><th>내용</th><th>상태</th></tr></thead>
              <tbody>
                {shown.map((i) => (
                  <tr key={i.id} className={'mx-click' + (i.id === selId ? ' mx-sel' : '')} onClick={() => setSelId(i.id)}>
                    <td>{i.lesson}</td><td>{i.level}</td><td>{i.step_id ? stepOf[i.step_id]?.name : <span className="mx-muted">(연결 안 됨)</span>}</td><td>{kindName(i.template)}</td>
                    <td className="mx-muted">{summary(i.payload)}</td>
                    <td><span className={`mx-chip ${i.status}`}>{STATUS_KO[i.status]}</span>{stale(i) && <span className="mx-chip review" style={{ marginLeft: 6 }} title="템플릿이 바뀐 뒤 아직 확인하지 않은 문항이에요">옛 버전</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && !shown.length && <p className="mx-muted">조건에 맞는 문항이 없어요.</p>}
        </div>
        <div className="mx-card">
          {sel ? <Editor kindName={kindName} key={sel.id + ':' + sel.version} item={sel} siblings={items.filter((i) => i.step_id === sel.step_id && i.level === sel.level)} steps={steps} keys={keys} vocab={vocab} uid={uid}
            onSaved={(m, id) => { setMsg(m); if (id === null) setSelId(null); void load(); }} /> : <p className="mx-muted">왼쪽에서 문항을 선택하면 내용을 보고 고칠 수 있어요.</p>}
        </div>
      </div>
    </>
  );
}

function AddBar({ kinds, steps, level, step, onAdd, onCancel }: { kinds: KindRow[]; steps: StepInfo[]; level: string; step: string; onAdd: (lv: string, step: string, kind: string) => void; onCancel: () => void }) {
  const [lv, setLv] = useState(level); const [st, setSt] = useState(steps.find((s) => s.id === step)?.id ?? steps[0]?.id ?? ''); const [kind, setKind] = useState('choose');
  if (!steps.length) return <p className="mx-err">이 단원에는 흐름(활동)이 없어요. "학습 흐름" 탭에서 먼저 활동을 만들어 주세요.</p>;
  return (
    <div className="mx-row" style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
      <label>레벨<select value={lv} onChange={(e) => setLv(e.target.value)}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></label>
      <label>활동<select value={st} onChange={(e) => setSt(e.target.value)}>{steps.map((s) => <option key={s.id} value={s.id}>{s.lessonNo}차시 · {s.name}</option>)}</select></label>
      <label>문항 종류<select value={kind} onChange={(e) => setKind(e.target.value)}>{[...new Set(kinds.map((k) => k.category))].map((c) => <optgroup key={c} label={c}>{kinds.filter((k) => k.category === c).map((k) => <option key={k.key} value={k.key}>{k.name_ko}</option>)}</optgroup>)}</select></label>
      <button className="mx-btn" onClick={() => onAdd(lv, st, kind)}>만들기</button>
      <button className="mx-btn sec" onClick={onCancel}>취소</button>
    </div>
  );
}

function Editor({ kindName, item, siblings, steps, keys, vocab, uid, onSaved }: { kindName: (k: string) => string; item: ItemRow; siblings: ItemRow[]; steps: StepInfo[]; keys: string[]; vocab: VocabOpt[]; uid: string; onSaved: (m: NonNullable<Msg>, id?: string | null) => void }) {
  const [obj, setObj] = useState<Record<string, any>>(item.payload);
  const [status, setStatus] = useState<Status>(item.status);
  const [stepId, setStepId] = useState(item.step_id ?? '');
  const [raw, setRaw] = useState<string | null>(null);   // 고급(JSON) 보기
  const [problems, setProblems] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(obj) !== JSON.stringify(item.payload) || status !== item.status || stepId !== (item.step_id ?? '');

  function current(): Record<string, any> | null {
    if (raw === null) return obj;
    try { return JSON.parse(raw); } catch (e) { setProblems(['JSON 형식이 올바르지 않아요: ' + (e as Error).message]); return null; }
  }
  function check(): Record<string, any> | null {
    const o = current(); if (!o) return null;
    const v = validate(o);
    const probs = [...v.problems];
    if (v.ok) {
      const used: string[] = o.k === 'vspell' ? [o.word] : (['vcards', 'vtype1', 'vmatch', 'vsound', 'vwrite'].includes(o.k) ? o.words : []);
      const miss = used.filter((k) => !keys.includes(k));
      if (miss.length) probs.push(`단원 어휘에 없는 단어예요: ${miss.join(', ')} ("단어" 탭에서 추가하세요)`);
    }
    setProblems(probs);
    return probs.length ? null : o;
  }
  async function save() {
    const o = check(); if (!o) return;
    setBusy(true);
    const st = steps.find((s) => s.id === stepId);
    const patch: Record<string, unknown> = { payload: o, template: o.k, tag: o.tag ?? null, status, reviewed_by: uid, version: item.version + 1, updated_at: new Date().toISOString() };
    if (stepId !== (item.step_id ?? '')) { patch.step_id = stepId || null; if (st) { patch.lesson = st.lessonNo; patch.act_idx = st.pos * 100 + 99; } }
    const { error } = await supabase.from('items').update(patch).eq('id', item.id);
    setBusy(false);
    onSaved(error ? { t: 'err', s: '저장 실패: ' + error.message } : { t: 'ok', s: '저장했어요. (발행해야 학습앱에 반영돼요)' });
  }
  async function move(d: -1 | 1) {
    const order = [...siblings].sort((a, b) => a.act_idx - b.act_idx);
    const i = order.findIndex((x) => x.id === item.id), o = order[i + d]; if (!o) return;
    const a = await supabase.from('items').update({ act_idx: o.act_idx }).eq('id', item.id);
    const b = await supabase.from('items').update({ act_idx: item.act_idx }).eq('id', o.id);
    onSaved(a.error || b.error ? { t: 'err', s: '이동 실패: ' + (a.error ?? b.error)!.message } : { t: 'ok', s: '순서를 바꿨어요.' });
  }
  async function dup() {
    const { error } = await supabase.from('items').insert({ unit_id: item.unit_id, lesson: item.lesson, act_idx: Math.max(...siblings.map((s) => s.act_idx)) + 1, level: item.level, template: item.template, tag: item.tag, payload: item.payload, status: 'draft', step_id: item.step_id, created_by: uid });
    onSaved(error ? { t: 'err', s: '복제 실패: ' + error.message } : { t: 'ok', s: '복제했어요(초안).' });
  }
  async function del() {
    if (!window.confirm('이 문항을 삭제할까요? 되돌릴 수 없어요.')) return;
    const { error } = await supabase.from('items').delete().eq('id', item.id);
    onSaved(error ? { t: 'err', s: '삭제 실패: ' + error.message } : { t: 'ok', s: '삭제했어요.' }, error ? undefined : null);
  }
  async function doPreview() {
    const o = check(); if (!o) return;
    const err = await openPreview(() => (isNativeKind(o.k) ? { kind: 'native', items: [o], vocab: nativeVocab(o, vocab), title: kindName(o.k) } : { kind: 'legacy', items: [o], level: item.level, title: kindName(o.k) }));
    if (err) setProblems([err]);
  }
  function toggleRaw() {
    if (raw === null) setRaw(JSON.stringify(obj, null, 2));
    else { try { setObj(JSON.parse(raw)); setRaw(null); setProblems([]); } catch (e) { setProblems(['JSON 형식이 올바르지 않아요: ' + (e as Error).message]); } }
  }

  return (
    <>
      <h3>{KIND_NAME[item.template] ?? item.template} · {item.lesson}차시 · {item.level}</h3>
      <div className="mx-row" style={{ marginBottom: 8 }}>
        <label>활동<select value={stepId} onChange={(e) => setStepId(e.target.value)}><option value="">(연결 안 됨)</option>{steps.map((s) => <option key={s.id} value={s.id}>{s.lessonNo}차시 · {s.name}</option>)}</select></label>
        <label>상태<select value={status} onChange={(e) => setStatus(e.target.value as Status)}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_KO[s]}</option>)}</select></label>
        <span className="mx-muted">버전 {item.version}</span>
        <span style={{ flex: 1 }} />
        <button className="mx-btn sec" onClick={() => move(-1)} disabled={dirty}>↑</button>
        <button className="mx-btn sec" onClick={() => move(1)} disabled={dirty}>↓</button>
        <button className="mx-btn sec" onClick={dup} disabled={dirty}>복제</button>
        <button className="mx-btn sec" onClick={del}>삭제</button>
      </div>
      {raw === null
        ? <ItemForm obj={obj} onChange={(o) => { setObj(o); setProblems([]); }} keys={keys} vocab={vocab} />
        : <textarea value={raw} onChange={(e) => setRaw(e.target.value)} spellCheck={false} />}
      {problems.length > 0 && <div className="mx-err">{problems.map((p, i) => <div key={i}>· {p}</div>)}</div>}
      <div className="mx-row" style={{ marginTop: 10 }}>
        <button className="mx-btn sec" onClick={() => { const o = check(); if (o) setProblems([]); }}>검증</button>
        <button className="mx-btn sec" onClick={doPreview}>미리보기</button>
        <button className="mx-btn" disabled={busy || !dirty && raw === null} onClick={save}>저장</button>
        <span style={{ flex: 1 }} />
        <button className="mx-link" onClick={toggleRaw}>{raw === null ? '고급: JSON 보기' : '← 폼으로 돌아가기'}</button>
      </div>
    </>
  );
}
