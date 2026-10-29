import { useEffect, useMemo, useState } from 'react';
import { NativePlayer } from '@mango/play';
import { supabase } from '../../shared/supabase';
import { isNativeKind, nativeVocab } from '../../shared/samples';
import { openPreview } from '../../shared/ui';
import type { VocabOpt } from './ItemForm';
import type { Status } from './Items';

const STATUS_KO: Record<Status, string> = { draft: '초안', review: '검수중', approved: '승인', rejected: '반려' };
interface Step { id: string; pos: number; name: string; kind: string; minutes: number | null; study: boolean; homework: boolean; ref: string | null }
interface Lesson { no: number; en: string; ko: string; track: string; steps: Step[] }
interface It { id: string; step_id: string | null; act_idx: number; created_at: string; level: string; template: string; status: Status; payload: Record<string, any>; review_note: string | null } // eslint-disable-line @typescript-eslint/no-explicit-any

function brief(p: Record<string, any>): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (Array.isArray(p.words)) return p.words.join(', ');
  if (typeof p.word === 'string') return p.word;
  return String(p.q ?? p.title ?? p.target ?? p.ko ?? p.tpl ?? p.say ?? p.situation ?? p.ans ?? p.items?.[0]?.en ?? p.text?.[0] ?? p.scenes?.[0]?.en ?? '').replace(/\s+/g, ' ').slice(0, 70);
}

/** 학생이 보는 화면 그대로 활동을 재생하면서 문항별로 승인/반려/메모를 남기는 검수 화면 */
export function Review({ unitId, uid }: { unitId: string; uid: string }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [items, setItems] = useState<It[]>([]);
  const [vocab, setVocab] = useState<VocabOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [lno, setLno] = useState(1); const [stepId, setStepId] = useState<string>(''); const [only, setOnly] = useState<string | null>(null); const [runKey, setRunKey] = useState(0);
  const [level, setLevel] = useState('CORE');

  async function load() {
    const fl = await supabase.from('flow_lessons').select('no,en,ko,track,flow_steps(id,pos,name_en,name_ko,kind,minutes,study,homework,ref_step_id)').eq('unit_id', unitId).order('no');
    const ls: Lesson[] = ((fl.data ?? []) as any[]).map((l) => ({ no: l.no, en: l.en, ko: l.ko, track: l.track, // eslint-disable-line @typescript-eslint/no-explicit-any
      steps: (l.flow_steps ?? []).map((s: any) => ({ id: s.id, pos: s.pos, name: s.name_ko || s.name_en, kind: s.kind, minutes: s.minutes, study: s.study, homework: s.homework, ref: s.ref_step_id })).sort((a: Step, b: Step) => a.pos - b.pos) })); // eslint-disable-line @typescript-eslint/no-explicit-any
    setLessons(ls);
    const it = await supabase.from('items').select('id,step_id,act_idx,created_at,level,template,status,payload,review_note').eq('unit_id', unitId).order('act_idx').order('created_at').limit(3000);
    setItems((it.data ?? []) as unknown as It[]);
    const v = await supabase.from('unit_vocab').select('vocab(key,en,ko,image_path)').eq('unit_id', unitId);
    setVocab(((v.data ?? []) as any[]).map((r) => r.vocab).filter(Boolean)); // eslint-disable-line @typescript-eslint/no-explicit-any
    setLoading(false);
  }
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [unitId]);

  const lesson = lessons.find((l) => l.no === lno) ?? lessons[0];
  useEffect(() => { if (lesson && !lesson.steps.some((s) => s.id === stepId)) { setStepId(lesson.steps[0]?.id ?? ''); setOnly(null); } }, [lesson, stepId]);
  const step = lesson?.steps.find((s) => s.id === stepId);
  const srcOf = (s: Step) => s.ref ?? s.id;
  const stepItems = (s?: Step) => (s ? items.filter((i) => i.step_id === srcOf(s) && i.level === level) : []);
  const cur = stepItems(step);
  const playItems = only ? cur.filter((i) => i.id === only) : cur;
  const refStep = step?.ref ? lessons.flatMap((l) => l.steps.map((s) => ({ ...s, lno: l.no }))).find((s) => s.id === step.ref) : null;

  const payloads = useMemo(() => playItems.map((i) => i.payload), [playItems.map((i) => i.id + i.status).join(',')]); // eslint-disable-line
  const pv = useMemo(() => (payloads[0] ? nativeVocab(payloads[0], vocab) : []), [payloads, vocab]);

  async function setStatus(ids: string[], to: Status) {
    if (!ids.length) return;
    const { error } = await supabase.from('items').update({ status: to, reviewed_by: uid, updated_at: new Date().toISOString() }).in('id', ids);
    if (error) setMsg('저장 실패: ' + error.message); else { setMsg(`${ids.length}개 → ${STATUS_KO[to]}`); setItems((xs) => xs.map((x) => (ids.includes(x.id) ? { ...x, status: to } : x))); }
  }
  async function saveNote(id: string, note: string) {
    const { error } = await supabase.from('items').update({ review_note: note || null }).eq('id', id);
    if (error) setMsg('메모 저장 실패: ' + error.message); else setItems((xs) => xs.map((x) => (x.id === id ? { ...x, review_note: note || null } : x)));
  }
  async function popup(scope: 'step' | 'lesson') {
    const list = scope === 'step' ? playItems : lesson.steps.flatMap((s) => stepItems(s));
    const err = await openPreview(() => {
      const ok = list.filter((i) => isNativeKind(i.payload.k));
      if (!ok.length) return '재생할 문항이 없어요.';
      return { kind: 'native', items: ok.map((i) => i.payload), vocab: vocab.map((v) => ({ key: v.key, en: v.en, ko: v.ko, image: v.image_path ?? null })), title: scope === 'step' ? `${lesson.no}차시 · ${step?.name ?? ''}` : `${lesson.no}차시 전체` };
    });
    if (err) setMsg(err);
  }
  const allSteps = lessons.flatMap((l) => l.steps.map((s) => ({ ...s, lno: l.no })));
  const idx = allSteps.findIndex((s) => s.id === stepId);
  function go(d: number) { const n = allSteps[idx + d]; if (!n) return; setLno(n.lno); setStepId(n.id); setOnly(null); setRunKey((k) => k + 1); }
  const stat = (s: Step) => { const xs = stepItems(s); const c = { approved: 0, rejected: 0, other: 0 }; xs.forEach((x) => { if (x.status === 'approved') c.approved++; else if (x.status === 'rejected') c.rejected++; else c.other++; }); return { n: xs.length, ...c }; };
  const lessonIds = (l: Lesson) => l.steps.filter((s) => !s.ref).flatMap((s) => stepItems(s).map((i) => i.id));

  if (loading) return <p className="mx-muted">불러오는 중…</p>;
  if (!lesson) return <p className="mx-muted">이 단원에는 학습 흐름이 없어요.</p>;
  return (
    <div className="mx-rv">
      <div className="mx-card mx-rv-top">
        <div className="mx-row">
          <label>레벨<select value={level} onChange={(e) => setLevel(e.target.value)}><option>CORE</option><option>SUPPORT</option><option>ADVANCED</option></select></label>
          <div className="mx-seg">{lessons.map((l) => <button key={l.no} className={l.no === lno ? 'on' : ''} onClick={() => { setLno(l.no); setOnly(null); setRunKey((k) => k + 1); }}>{l.no}차시</button>)}</div>
          <span style={{ flex: 1 }} />
          <span className="mx-muted">이 차시 전체:</span>
          <button className="mx-btn sec" onClick={() => setStatus(lessonIds(lesson), 'review')}>검수중</button>
          <button className="mx-btn" onClick={() => window.confirm(`${lesson.no}차시의 모든 문항(${lessonIds(lesson).length}개)을 승인할까요?`) && setStatus(lessonIds(lesson), 'approved')}>모두 승인</button>
        </div>
        <p className="mx-muted" style={{ margin: '6px 0 0' }}>{lesson.ko || lesson.en}{msg && <b style={{ marginLeft: 12 }}>{msg}</b>}</p>
      </div>
      <div className="mx-rv-grid">
        <div className="mx-card mx-rv-steps">
          {lesson.steps.map((s) => { const st = stat(s); return (
            <button key={s.id} className={'mx-rv-step' + (s.id === stepId ? ' on' : '')} onClick={() => { setStepId(s.id); setOnly(null); setRunKey((k) => k + 1); }}>
              <b>{s.name}</b>
              <span className="mx-muted">{s.homework && !s.study ? '숙제' : s.minutes ? s.minutes + '분' : ''}{s.ref ? ' · 참조' : ''}</span>
              <span className="mx-rv-dots">{st.n ? <><i className="ok">{st.approved}</i><i className="bad">{st.rejected}</i><i>{st.other}</i></> : <em>문항 없음</em>}</span>
            </button>); })}
        </div>
        <div className="mx-rv-main">
          <div className="mx-row" style={{ marginBottom: 8 }}>
            <button className="mx-btn sec" disabled={idx <= 0} onClick={() => go(-1)}>◀ 이전 활동</button>
            <b>{lesson.no}차시 · {step?.name}</b>
            {only ? <button className="mx-link" onClick={() => { setOnly(null); setRunKey((k) => k + 1); }}>전체 이어서 보기</button> : <span className="mx-muted">{cur.length}문항 이어서 재생</span>}
            <span style={{ flex: 1 }} />
            <button className="mx-btn sec" onClick={() => popup('step')}>새 창(1280×800)</button>
            <button className="mx-btn sec" onClick={() => popup('lesson')}>차시 전체 새 창</button>
            <button className="mx-btn sec" onClick={() => setRunKey((k) => k + 1)}>처음부터</button>
            <button className="mx-btn" disabled={idx >= allSteps.length - 1} onClick={() => go(1)}>다음 활동 ▶</button>
          </div>
          {refStep && <p className="mx-muted">이 활동은 {refStep.lno}차시 · {refStep.name} 의 문항을 그대로 써요.</p>}
          <div className="mx-rv-stage">
            {!playItems.length ? <p className="mx-muted" style={{ padding: 24 }}>이 활동에는 {level} 문항이 아직 없어요.</p>
              : !isNativeKind(payloads[0]?.k) ? <p className="mx-muted" style={{ padding: 24 }}>이 종류({payloads[0]?.k})는 여기서 재생할 수 없어요. 문항 탭의 미리보기를 써 주세요.</p>
              : <NativePlayer key={`${stepId}:${only ?? 'all'}:${runKey}`} title={step?.name ?? ''} items={payloads} vocab={pv} onResult={() => {}} onFinish={(a) => { if (a === 'again') setRunKey((k) => k + 1); }} />}
          </div>
          <div className="mx-card" style={{ marginTop: 12 }}>
            <div className="mx-row"><b>문항 {cur.length}개</b><span className="mx-muted">번호를 누르면 그 문항만 재생해요</span>
              <span style={{ flex: 1 }} />
              {!step?.ref && <button className="mx-btn sec" disabled={!cur.length} onClick={() => setStatus(cur.map((i) => i.id), 'approved')}>이 활동 모두 승인</button>}</div>
            {cur.map((i, n) => (
              <div key={i.id} className={'mx-rv-item' + (only === i.id ? ' on' : '')}>
                <button className="mx-rv-no" onClick={() => { setOnly(i.id); setRunKey((k) => k + 1); }}>{n + 1}</button>
                <div className="mx-rv-txt"><span>{brief(i.payload)}</span>
                  <input className="mx-rv-note" defaultValue={i.review_note ?? ''} placeholder="메모 (고칠 점)" disabled={!!step?.ref} onBlur={(e) => e.target.value !== (i.review_note ?? '') && saveNote(i.id, e.target.value)} /></div>
                <span className={`mx-chip ${i.status}`}>{STATUS_KO[i.status]}</span>
                {!step?.ref && <span className="mx-rv-btns">
                  <button className="mx-btn" onClick={() => setStatus([i.id], 'approved')}>승인</button>
                  <button className="mx-btn sec" onClick={() => setStatus([i.id], 'review')}>검수중</button>
                  <button className="mx-btn sec" onClick={() => setStatus([i.id], 'rejected')}>반려</button></span>}
              </div>))}
          </div>
        </div>
      </div>
    </div>
  );
}
