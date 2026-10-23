import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { configProblem, configured, supabase } from './supabase';
import { Templates, Types, UnitFlow } from './Flow';
import { Items } from './Items';
import { UnitVocab } from './Vocab';
import { PageHead } from './ui';

export type Tab = 'units' | 'tpl' | 'types';
const TABS: [Tab, string][] = [['units', '단원·콘텐츠'], ['tpl', '흐름 템플릿'], ['types', '활동 종류']];
type Status = 'draft' | 'review' | 'approved' | 'rejected';
const STATUS_KO: Record<Status, string> = { draft: '초안', review: '검수중', approved: '승인', rejected: '반려' };

interface UnitRow { id: string; no: number; title: string; status: string; version: number; books: { title: string; grade: number; publishers: { name: string } | null } | null }

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>('units');
  useEffect(() => {
    if (!configured) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  if (!configured) return <Shell><div className="mx-card"><h3>설정이 필요해요</h3><p className="mx-muted">{configProblem}</p></div></Shell>;
  if (!ready) return <Shell><p className="mx-muted">불러오는 중…</p></Shell>;
  return <Shell session={session} tab={tab} setTab={setTab}>{session ? <Gate session={session} tab={tab} /> : <Login />}</Shell>;
}

function Shell({ children, session, tab, setTab }: { children: React.ReactNode; session?: Session | null; tab?: Tab; setTab?: (t: Tab) => void }) {
  return (
    <div className="mx-app">
      <header className="mx-top">
        <b className="mx-brand"><i />Mango English Admin</b>
        {session && setTab && <nav className="mx-menu">{TABS.map(([k, n]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{n}</button>)}</nav>}
        <span style={{ flex: 1 }} />
        {session && <span className="mx-who"><span>{session.user.email}</span><button className="mx-out" onClick={() => supabase.auth.signOut()}>로그아웃</button></span>}
      </header>
      <main className="mx-main">{children}</main>
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
function Gate({ session, tab }: { session: Session; tab: Tab }) {
  const [role, setRole] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle().then(({ data }) => setRole((data?.role as string) ?? null));
  }, [session.user.id]);
  if (role === undefined) return <p className="mx-muted">권한 확인 중…</p>;
  if (role !== 'hq_admin' && role !== 'hq_editor') {
    return <div className="mx-card"><h3>권한이 없어요</h3><p className="mx-muted">이 계정({session.user.email})은 본사 권한이 없어요. 현재 권한: {role ?? '없음'}. 본사 권한 부여는 Supabase SQL Editor에서 할 수 있어요.</p></div>;
  }
  return <Main uid={session.user.id} tab={tab} />;
}

function Main({ uid, tab }: { uid: string; tab: Tab }) {
  return (
    <>
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
      <PageHead title="단원·콘텐츠" sub="교재별 단원의 학습 흐름과 문항을 관리해요." />
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
  const [tab, setTab] = useState<'flow' | 'vocab' | 'items'>('flow');
  return (
    <>
      <PageHead title={`Lesson ${unit.no} · ${unit.title}`} sub={<button className="mx-link" onClick={onBack}>← 단원 목록</button>} />
      <div className="mx-seg">
        <button className={tab === 'flow' ? 'on' : ''} onClick={() => setTab('flow')}>학습 흐름</button>
        <button className={tab === 'vocab' ? 'on' : ''} onClick={() => setTab('vocab')}>단어</button>
        <button className={tab === 'items' ? 'on' : ''} onClick={() => setTab('items')}>문항</button>
      </div>
      {tab === 'flow' && <UnitFlow unitId={unit.id} />}
      {tab === 'vocab' && <UnitVocab unitId={unit.id} />}
      {tab === 'items' && <Items unitId={unit.id} uid={uid} />}
    </>
  );
}
