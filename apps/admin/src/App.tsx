import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { configProblem, configured, supabase } from './shared/supabase';
import { Types } from './pages/kinds/Kinds';
import { Templates } from './pages/flow/Flow';
import { Units } from './pages/units/Units';
import { Books } from './pages/books/Books';
import { Studio } from './pages/studio/Studio';
import { Reading } from './pages/reading/Reading';
import { PageHead } from './shared/ui';

export type Tab = 'books' | 'units' | 'tpl' | 'types' | 'studio' | 'reading';
const TABS: [Tab, string][] = [['books', '교재 관리'], ['units', '단원·콘텐츠'], ['tpl', '흐름 템플릿'], ['types', '활동 템플릿'], ['studio', '이미지/영상 제작'], ['reading', '원서']];


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
        <b className="mx-brand"><img src="/img/logo.png" alt="Mango English" /></b>
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
      {tab === 'books' && <Books />}
      {tab === 'units' && <Units uid={uid} />}
      {tab === 'tpl' && <Templates />}
      {tab === 'types' && <Types />}
      {tab === 'studio' && <Studio />}
      {tab === 'reading' && <Reading />}
    </>
  );
}
