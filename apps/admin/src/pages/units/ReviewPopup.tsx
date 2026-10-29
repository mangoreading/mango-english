import { useEffect, useMemo, useState } from 'react';
import { NativePlayer } from '@mango/play';
import '@mango/play/styles.css';
import { supabase } from '../../shared/supabase';
import { isNativeKind } from '../../shared/samples';

type Status = 'draft' | 'review' | 'approved' | 'rejected';
const KO: Record<Status, string> = { draft: '초안', review: '검수중', approved: '승인', rejected: '반려' };
interface Step { id: string; pos: number; name: string; ref: string | null; homework: boolean; study: boolean }
interface Lesson { no: number; ko: string; steps: Step[] }
interface It { id: string; step_id: string | null; level: string; status: Status; payload: Record<string, any>; review_note: string | null } // eslint-disable-line @typescript-eslint/no-explicit-any

const brief = (p: Record<string, any>) => String(p.q ?? p.title ?? p.target ?? p.ko ?? p.tpl ?? p.say ?? p.situation ?? p.ans ?? p.words?.join(', ') ?? p.word ?? p.items?.[0]?.en ?? p.text?.[0] ?? p.scenes?.[0]?.en ?? '').replace(/\s+/g, ' ').slice(0, 60); // eslint-disable-line @typescript-eslint/no-explicit-any

export function popupUrl(unitId: string) { return '/#review=' + unitId; }
/** 클릭 직후 1620×800 창을 연다: 학생 화면 1280×800 + 오른쪽 검수 패널 (팝업 차단 회피) */
export function openReviewPopup(unitId: string): string | null {
  const W = Math.min(1280 + 340, screen.availWidth), H = Math.min(800, screen.availHeight); // 학생 화면 1280 + 오른쪽 검수 패널 340
  const w = window.open(popupUrl(unitId), 'mgReview', `popup=yes,width=${W},height=${H},left=${Math.max(0, (screen.availWidth - W) / 2)},top=${Math.max(0, (screen.availHeight - H) / 2)}`);
  if (!w) return '팝업이 막혀 있어요. 주소창 오른쪽의 팝업 차단을 풀고 다시 눌러 주세요.';
  w.focus(); return null;
}

/** 별도 창: 왼쪽 = 학생 화면 그대로 재생, 오른쪽 = 문항별 승인/반려/메모 */
export function ReviewPopup({ unitId }: { unitId: string }) {
  const [state, setState] = useState<'load' | 'nologin' | 'ready'>('load');
  const [uid, setUid] = useState('');
  const [title, setTitle] = useState('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [items, setItems] = useState<It[]>([]);
  const [vocab, setVocab] = useState<{ key: string; en: string; ko: string; image: string | null }[]>([]);
  const [lno, setLno] = useState(1); const [stepId, setStepId] = useState(''); const [only, setOnly] = useState<string | null>(null); const [run, setRun] = useState(0);
  const [msg, setMsg] = useState(''); const [level, setLevel] = useState('CORE');

  useEffect(() => { (async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) { setState('nologin'); return; }
    setUid(s.session.user.id);
    const u = await supabase.from('units').select('no,title').eq('id', unitId).maybeSingle();
    if (u.data) { setTitle(`Lesson ${u.data.no} · ${u.data.title}`); document.title = '검수 · ' + u.data.title; }
    const fl = await supabase.from('flow_lessons').select('no,ko,en,flow_steps(id,pos,name_en,name_ko,ref_step_id,homework,study)').eq('unit_id', unitId).order('no');
    const ls: Lesson[] = ((fl.data ?? []) as any[]).map((l) => ({ no: l.no, ko: l.ko || l.en, // eslint-disable-line @typescript-eslint/no-explicit-any
      steps: (l.flow_steps ?? []).map((x: any) => ({ id: x.id, pos: x.pos, name: x.name_ko || x.name_en, ref: x.ref_step_id, homework: x.homework, study: x.study })).sort((a: Step, b: Step) => a.pos - b.pos) })); // eslint-disable-line @typescript-eslint/no-explicit-any
    setLessons(ls); if (ls[0]) { setLno(ls[0].no); setStepId(ls[0].steps[0]?.id ?? ''); }
    const it = await supabase.from('items').select('id,step_id,level,status,payload,review_note').eq('unit_id', unitId).order('act_idx').order('created_at').limit(3000);
    setItems((it.data ?? []) as unknown as It[]);
    const v = await supabase.from('unit_vocab').select('vocab(key,en,ko,image_path)').eq('unit_id', unitId);
    setVocab(((v.data ?? []) as any[]).map((r) => r.vocab).filter(Boolean).map((x: any) => ({ key: x.key, en: x.en, ko: x.ko, image: x.image_path ?? null }))); // eslint-disable-line @typescript-eslint/no-explicit-any
    setState('ready');
  })(); }, [unitId]);

  const lesson = lessons.find((l) => l.no === lno);
  const step = lesson?.steps.find((s) => s.id === stepId);
  const itemsOf = (s?: Step) => (s ? items.filter((i) => i.step_id === (s.ref ?? s.id) && i.level === level) : []);
  const cur = itemsOf(step);
  const play = only ? cur.filter((i) => i.id === only) : cur;
  const payloads = useMemo(() => play.map((i) => i.payload), [play.map((i) => i.id).join(',')]); // eslint-disable-line
  const all = lessons.flatMap((l) => l.steps.map((s) => ({ ...s, lno: l.no })));
  const idx = all.findIndex((s) => s.id === stepId);
  function go(d: number) { const n = all[idx + d]; if (!n) return; setLno(n.lno); setStepId(n.id); setOnly(null); setRun((k) => k + 1); }
  function pickLesson(no: number) { const l = lessons.find((x) => x.no === no); if (!l) return; setLno(no); setStepId(l.steps[0]?.id ?? ''); setOnly(null); setRun((k) => k + 1); }

  async function setStatus(ids: string[], to: Status) {
    if (!ids.length) return;
    const { error } = await supabase.from('items').update({ status: to, reviewed_by: uid, updated_at: new Date().toISOString() }).in('id', ids);
    if (error) setMsg('저장 실패: ' + error.message); else { setMsg(`${ids.length}개 → ${KO[to]}`); setItems((xs) => xs.map((x) => (ids.includes(x.id) ? { ...x, status: to } : x))); }
  }
  async function saveNote(id: string, note: string) {
    const { error } = await supabase.from('items').update({ review_note: note || null }).eq('id', id);
    if (error) setMsg('메모 저장 실패: ' + error.message); else setItems((xs) => xs.map((x) => (x.id === id ? { ...x, review_note: note || null } : x)));
  }

  if (state === 'load') return <p style={{ padding: 40 }}>불러오는 중…</p>;
  if (state === 'nologin') return <p style={{ padding: 40 }}>로그인이 필요해요. 관리자 화면에 로그인한 뒤 다시 열어 주세요.</p>;
  const ro = !!step?.ref;
  return (
    <div className="mx-rp">
      <div className="mx-rp-stage">
        {!payloads.length ? <p className="mx-muted" style={{ padding: 30 }}>이 활동에는 {level} 문항이 없어요.</p>
          : !isNativeKind(payloads[0]?.k) ? <p className="mx-muted" style={{ padding: 30 }}>이 종류({payloads[0]?.k})는 여기서 재생할 수 없어요.</p>
          : <NativePlayer key={`${stepId}:${only ?? 'all'}:${run}`} title={`${lno}차시 · ${step?.name ?? ''}`} items={payloads} vocab={vocab} onResult={() => {}} onFinish={(a) => { if (a === 'again') setRun((k) => k + 1); else go(1); }} />}
      </div>
      <aside className="mx-rp-side">
        <div className="mx-rp-h"><b>{title}</b>
          <select value={level} onChange={(e) => { setLevel(e.target.value); setOnly(null); setRun((k) => k + 1); }}><option>CORE</option><option>SUPPORT</option><option>ADVANCED</option></select></div>
        <div className="mx-rp-tabs">{lessons.map((l) => <button key={l.no} className={l.no === lno ? 'on' : ''} title={l.ko} onClick={() => pickLesson(l.no)}>{l.no}</button>)}</div>
        <div className="mx-rp-nav">
          <button disabled={idx <= 0} onClick={() => go(-1)}>◀</button>
          <select value={stepId} onChange={(e) => { setStepId(e.target.value); setOnly(null); setRun((k) => k + 1); }}>
            {lesson?.steps.map((s) => { const xs = itemsOf(s); const ok = xs.filter((i) => i.status === 'approved').length; return <option key={s.id} value={s.id}>{s.pos + 1}. {s.name}{s.homework && !s.study ? ' (숙제)' : ''} · {ok}/{xs.length}</option>; })}
          </select>
          <button disabled={idx >= all.length - 1} onClick={() => go(1)}>▶</button>
        </div>
        <div className="mx-rp-bar">
          <button onClick={() => { setOnly(null); setRun((k) => k + 1); }}>{only ? '전체 이어보기' : '처음부터'}</button>
          {!ro && <><button onClick={() => setStatus(cur.map((i) => i.id), 'approved')}>이 활동 모두 승인</button>
            <button onClick={() => lesson && window.confirm(`${lno}차시 전체를 승인할까요?`) && setStatus(lesson.steps.filter((s) => !s.ref).flatMap((s) => itemsOf(s).map((i) => i.id)), 'approved')}>차시 전체 승인</button></>}
        </div>
        {ro && <p className="mx-muted" style={{ margin: '4px 10px' }}>다른 차시 문항을 참조하는 활동이에요. 승인·메모는 원본 활동에서 해 주세요.</p>}
        {msg && <p className="mx-rp-msg">{msg}</p>}
        <div className="mx-rp-list">
          {cur.map((i, n) => (
            <div key={i.id} className={'mx-rp-it' + (only === i.id ? ' on' : '')}>
              <div className="mx-rp-r1"><button className="mx-rp-no" title="이 문항만 재생" onClick={() => { setOnly(i.id); setRun((k) => k + 1); }}>{n + 1}</button>
                <span className="mx-rp-t">{brief(i.payload)}</span><span className={`mx-chip ${i.status}`}>{KO[i.status]}</span></div>
              {!ro && <div className="mx-rp-r2">
                <button className="ok" onClick={() => setStatus([i.id], 'approved')}>승인</button><button onClick={() => setStatus([i.id], 'review')}>검수중</button><button className="bad" onClick={() => setStatus([i.id], 'rejected')}>반려</button></div>}
              {!ro && <input defaultValue={i.review_note ?? ''} placeholder="메모 (고칠 점)" onBlur={(e) => e.target.value !== (i.review_note ?? '') && saveNote(i.id, e.target.value)} />}
            </div>))}
          {!cur.length && <p className="mx-muted" style={{ padding: 10 }}>문항이 없어요.</p>}
        </div>
      </aside>
    </div>
  );
}
