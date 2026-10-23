import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ActivityItem } from '@mango/schema';
import { configProblem, configured, supabase } from './supabase';
import { preview } from './legacy';
import { Templates, Types, UnitFlow } from './Flow';

type Status = 'draft' | 'review' | 'approved' | 'rejected';
const STATUSES: Status[] = ['draft', 'review', 'approved', 'rejected'];
const STATUS_KO: Record<Status, string> = { draft: '초안', review: '검수중', approved: '승인', rejected: '반려' };

interface UnitRow { id: string; no: number; title: string; status: string; version: number; books: { title: string; grade: number; publishers: { name: string } | null } | null }
interface ItemRow { id: string; unit_id: string; lesson: number; act_idx: number; level: string; template: string; tag: string | null; status: Status; version: number; payload: Record<string, unknown> }

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!configured) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  if (!configured) return <Shell><div className="mx-card"><h3>설정이 필요해요</h3><p className="mx-muted">{configProblem}</p></div></Shell>;
  if (!ready) return <Shell><p className="mx-muted">불러오는 중…</p></Shell>;
  return <Shell session={session}>{session ? <Gate session={session} /> : <Login />}</Shell>;
}

function Shell({ children, session }: { children: React.ReactNode; session?: Session | null }) {
  return (
    <div className="mx-shell">
      <header className="mx-top">
        <b className="mx-brand">Mango English<small>관리자</small></b>
        {session && <span className="mx-who">{session.user.email}<button className="mx-link" onClick={() => supabase.auth.signOut()}>로그아웃</button></span>}
      </header>
      <main>{children}</main>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('');
    const r = await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false); if (r.error) setMsg(r.error.message);
  }
  return (
    <form className="mx-card mx-login" onSubmit={submit}>
      <h3>관리자 로그인</h3>
      <label>이메일<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
      <label>비밀번호<input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" /></label>
      {msg && <p className="mx-err">{msg}</p>}
      <button className="mx-btn" disabled={busy}>로그인</button>
      <p className="mx-muted">본사 계정만 사용할 수 있어요. 계정 만들기는 학습앱(app 주소)에서 가입한 뒤 본사 권한을 받아야 해요.</p>
    </form>
  );
}

/** 본사(hq) 권한 확인 */
function Gate({ session }: { session: Session }) {
  const [role, setRole] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle().then(({ data }) => setRole((data?.role as string) ?? null));
  }, [session.user.id]);
  if (role === undefined) return <p className="mx-muted">권한 확인 중…</p>;
  if (role !== 'hq_admin' && role !== 'hq_editor') {
    return <div className="mx-card"><h3>권한이 없어요</h3><p className="mx-muted">이 계정({session.user.email})은 본사 권한이 없어요. 현재 권한: {role ?? '없음'}. 본사 권한 부여는 Supabase SQL Editor에서 할 수 있어요.</p></div>;
  }
  return <Main uid={session.user.id} />;
}

function Main({ uid }: { uid: string }) {
  const [tab, setTab] = useState<'units' | 'tpl' | 'types'>('units');
  return (
    <>
      <nav className="mx-nav">
        {([['units', '단원·콘텐츠'], ['tpl', '흐름 템플릿'], ['types', '활동 종류']] as const).map(([k, n]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{n}</button>)}
      </nav>
      {tab === 'units' && <Units uid={uid} />}
      {tab === 'tpl' && <Templates />}
      {tab === 'types' && <Types />}
    </>
  );
}

function Units({ uid }: { uid: string }) {
  const [units, setUnits] = useState<UnitRow[] | null>(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<UnitRow | null>(null);
  useEffect(() => {
    supabase.from('units').select('id,no,title,status,version,books(title,grade,publishers(name))').order('no').then(({ data, error }) => {
      if (error) setErr(error.message); else setUnits((data ?? []) as unknown as UnitRow[]);
    });
  }, []);
  if (err) return <p className="mx-err">{err}</p>;
  if (!units) return <p className="mx-muted">불러오는 중…</p>;
  if (open) return <UnitEditor unit={open} uid={uid} onBack={() => setOpen(null)} />;
  return (
    <>
      <h1>콘텐츠 관리</h1>
      <div className="mx-card">
        <table>
          <thead><tr><th>출판사</th><th>교재</th><th>학년</th><th>Lesson</th><th>제목</th><th>상태</th></tr></thead>
          <tbody>
            {units.map((u) => (
              <tr key={u.id} className="mx-click" onClick={() => setOpen(u)}>
                <td>{u.books?.publishers?.name}</td><td>{u.books?.title}</td><td>{u.books?.grade}</td><td>{u.no}</td><td>{u.title}</td>
                <td><span className={`mx-chip ${u.status}`}>{STATUS_KO[u.status as Status] ?? u.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!units.length && <p className="mx-muted">등록된 단원이 없어요.</p>}
      </div>
    </>
  );
}

function UnitEditor({ unit, uid, onBack }: { unit: UnitRow; uid: string; onBack: () => void }) {
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; s: string } | null>(null);
  const [level, setLevel] = useState('CORE'); const [lesson, setLesson] = useState('all'); const [status, setStatus] = useState('all'); const [q, setQ] = useState('');
  const [selId, setSelId] = useState<string | null>(null);
  const [bundleVer, setBundleVer] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'flow' | 'items'>('flow');

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from('items').select('id,unit_id,lesson,act_idx,level,template,tag,status,version,payload').eq('unit_id', unit.id).order('lesson').order('act_idx').limit(5000);
    if (error) setMsg({ t: 'err', s: error.message }); else setItems((data ?? []) as unknown as ItemRow[]);
    const b = await supabase.from('unit_bundles').select('version').eq('unit_id', unit.id).order('version', { ascending: false }).limit(1);
    setBundleVer(b.data?.[0]?.version ?? null);
    setLoading(false);
  }
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, []);

  const shown = useMemo(() => items.filter((i) =>
    (level === 'all' || i.level === level) && (lesson === 'all' || String(i.lesson) === lesson) && (status === 'all' || i.status === status)
    && (!q || JSON.stringify(i.payload).toLowerCase().includes(q.toLowerCase()))), [items, level, lesson, status, q]);
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
    if (!window.confirm(`승인된 ${counts.approved ?? 0}개 문항으로 새 버전을 발행할까요? 학습앱에 바로 반영돼요.`)) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('publish_unit', { p_unit: unit.id });
    setBusy(false);
    if (error) setMsg({ t: 'err', s: '발행 실패: ' + error.message }); else { setMsg({ t: 'ok', s: `발행했어요. 버전 ${data}` }); setBundleVer(data as number); }
  }

  const lessons = [...new Set(items.map((i) => i.lesson))].sort((a, b) => a - b);
  return (
    <>
      <button className="mx-link" onClick={onBack}>← 단원 목록</button>
      <h1>Lesson {unit.no} · {unit.title}</h1>
      <nav className="mx-nav">
        <button className={tab === 'flow' ? 'on' : ''} onClick={() => setTab('flow')}>학습 흐름</button>
        <button className={tab === 'items' ? 'on' : ''} onClick={() => setTab('items')}>문항</button>
      </nav>
      {tab === 'flow' && <UnitFlow unitId={unit.id} />}
      {tab === 'items' && <>
      <div className="mx-card">
        <div className="mx-row">
          <span>전체 {items.length}문항</span>
          {STATUSES.map((s) => <span key={s} className={`mx-chip ${s}`}>{STATUS_KO[s]} {counts[s] ?? 0}</span>)}
          <span className="mx-muted">발행 버전: {bundleVer ?? '없음'}</span>
          <span style={{ flex: 1 }} />
          <button className="mx-btn go" disabled={busy || !(counts.approved ?? 0)} onClick={publish}>발행</button>
        </div>
        {msg && <p className={msg.t === 'ok' ? 'mx-ok' : 'mx-err'}>{msg.s}</p>}
      </div>
      <div className="mx-card">
        <div className="mx-row">
          <label>레벨<select value={level} onChange={(e) => setLevel(e.target.value)}><option value="all">전체</option><option>CORE</option><option>SUPPORT</option><option>ADVANCED</option></select></label>
          <label>차시<select value={lesson} onChange={(e) => setLesson(e.target.value)}><option value="all">전체</option>{lessons.map((l) => <option key={l} value={l}>{l}차시</option>)}</select></label>
          <label>상태<select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">전체</option>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_KO[s]}</option>)}</select></label>
          <label>검색<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="문항 내용에서 찾기" /></label>
          <span style={{ flex: 1 }} />
          <span className="mx-muted">목록 {shown.length}개 일괄:</span>
          {(['review', 'approved', 'rejected'] as Status[]).map((s) => <button key={s} className="mx-btn sec" disabled={busy || !shown.length} onClick={() => bulk(s)}>{STATUS_KO[s]}</button>)}
        </div>
      </div>
      <div className="mx-grid">
        <div className="mx-card mx-scroll">
          {loading ? <p className="mx-muted">불러오는 중…</p> : (
            <table>
              <thead><tr><th>차시</th><th>레벨</th><th>활동</th><th>유형</th><th>내용</th><th>상태</th></tr></thead>
              <tbody>
                {shown.map((i) => (
                  <tr key={i.id} className={'mx-click' + (i.id === selId ? ' mx-sel' : '')} onClick={() => setSelId(i.id)}>
                    <td>{i.lesson}</td><td>{i.level}</td><td>{Math.floor(i.act_idx / 100) + 1}-{(i.act_idx % 100) + 1}</td><td>{i.template}</td>
                    <td className="mx-muted">{summary(i.payload)}</td>
                    <td><span className={`mx-chip ${i.status}`}>{STATUS_KO[i.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="mx-card">
          {sel ? <Editor key={sel.id} item={sel} uid={uid} onSaved={(m) => { setMsg(m); void load(); }} /> : <p className="mx-muted">왼쪽에서 문항을 선택하면 내용을 보고 고칠 수 있어요.</p>}
        </div>
      </div>
      </>}
    </>
  );
}

function summary(p: Record<string, unknown>): string {
  const t = (p.q ?? p.title ?? p.prompt ?? p.target ?? p.ko ?? p.text ?? '') as string;
  return String(t).replace(/\s+/g, ' ').slice(0, 60);
}

function Editor({ item, uid, onSaved }: { item: ItemRow; uid: string; onSaved: (m: { t: 'ok' | 'err'; s: string }) => void }) {
  const [text, setText] = useState(JSON.stringify(item.payload, null, 2));
  const [status, setStatus] = useState<Status>(item.status);
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);

  function check(): Record<string, unknown> | null {
    let obj: unknown;
    try { obj = JSON.parse(text); } catch (e) { setProblem('JSON 형식이 올바르지 않아요: ' + (e as Error).message); return null; }
    const r = ActivityItem.safeParse(obj);
    if (!r.success) { setProblem(r.error.issues.slice(0, 4).map((i) => `${i.path.join('.') || '(전체)'}: ${i.message}`).join('\n')); return null; }
    setProblem(''); return obj as Record<string, unknown>;
  }
  async function save() {
    const obj = check(); if (!obj) return;
    setBusy(true);
    const { error } = await supabase.from('items').update({
      payload: obj, template: obj.k as string, tag: (obj.tag as string) ?? null, status, reviewed_by: uid, version: item.version + 1, updated_at: new Date().toISOString(),
    }).eq('id', item.id);
    setBusy(false);
    onSaved(error ? { t: 'err', s: '저장 실패: ' + error.message } : { t: 'ok', s: '저장했어요. (발행해야 학습앱에 반영돼요)' });
  }
  async function doPreview() { const obj = check(); if (obj) await preview([obj], item.level); }

  return (
    <>
      <h3>{item.template} · {item.lesson}차시 · {item.level}</h3>
      <div className="mx-row" style={{ marginBottom: 8 }}>
        <label>상태<select value={status} onChange={(e) => setStatus(e.target.value as Status)}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_KO[s]}</option>)}</select></label>
        <span className="mx-muted">버전 {item.version}</span>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      {problem && <pre className="mx-err" style={{ whiteSpace: 'pre-wrap' }}>{problem}</pre>}
      <div className="mx-row" style={{ marginTop: 10 }}>
        <button className="mx-btn sec" onClick={() => { check(); }}>검증</button>
        <button className="mx-btn sec" onClick={doPreview}>미리보기</button>
        <button className="mx-btn" disabled={busy} onClick={save}>저장</button>
      </div>
    </>
  );
}
