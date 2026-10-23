import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { configured, supabase } from './supabase';
import type { BundleRow, Level } from './types';

const LEVELS: Level[] = ['CORE', 'SUPPORT', 'ADVANCED'];
const LEVEL_KO: Record<Level, string> = { CORE: '기본', SUPPORT: '도움', ADVANCED: '도전' };

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!configured) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!configured) return <Shell><Notice title="설정이 필요해요">VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY 환경변수가 없어요.</Notice></Shell>;
  if (!ready) return <Shell><p className="muted">불러오는 중…</p></Shell>;
  return <Shell session={session}>{session ? <Units /> : <Login />}</Shell>;
}

function Shell({ children, session }: { children: React.ReactNode; session?: Session | null }) {
  return (
    <div className="shell">
      <header className="top">
        <b className="brand">Mango English</b>
        {session && (
          <span className="who">
            {session.user.email}
            <button className="link" onClick={() => supabase.auth.signOut()}>로그아웃</button>
          </span>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="card"><h2>{title}</h2><p className="muted">{children}</p></div>;
}

function Login() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('');
    const r = mode === 'in'
      ? await supabase.auth.signInWithPassword({ email, password: pw })
      : await supabase.auth.signUp({ email, password: pw });
    setBusy(false);
    if (r.error) setMsg(r.error.message);
    else if (mode === 'up' && !r.data.session) setMsg('가입 확인 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요.');
  }

  return (
    <form className="card login" onSubmit={submit}>
      <h2>{mode === 'in' ? '로그인' : '회원가입'}</h2>
      <label>이메일<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
      <label>비밀번호<input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} /></label>
      {msg && <p className="err">{msg}</p>}
      <button className="btn" disabled={busy}>{mode === 'in' ? '로그인' : '가입하기'}</button>
      <button type="button" className="link" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMsg(''); }}>
        {mode === 'in' ? '처음이에요 → 회원가입' : '이미 계정이 있어요 → 로그인'}
      </button>
    </form>
  );
}

function Units() {
  const [rows, setRows] = useState<BundleRow[] | null>(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<BundleRow | null>(null);

  useEffect(() => {
    supabase.from('latest_bundles').select('unit_id, version, bundle, published_at').then(({ data, error }) => {
      if (error) setErr(error.message); else setRows((data ?? []) as BundleRow[]);
    });
  }, []);

  if (err) return <Notice title="단원을 불러오지 못했어요">{err}</Notice>;
  if (!rows) return <p className="muted">단원을 불러오는 중…</p>;
  if (open) return <UnitView row={open} onBack={() => setOpen(null)} />;
  if (!rows.length) return <Notice title="발행된 단원이 없어요">관리자가 단원을 발행하면 여기에 나타나요.</Notice>;

  return (
    <>
      <h1>학습할 Lesson 선택</h1>
      <div className="grid">
        {rows.map((r) => (
          <button key={r.unit_id} className="unit" onClick={() => setOpen(r)}>
            <span className="chip">LESSON {r.bundle.unit.no}</span>
            <b>{r.bundle.unit.title}</b>
            <span className="muted">버전 {r.version} · 어휘 {r.bundle.vocab.length}개</span>
          </button>
        ))}
      </div>
    </>
  );
}

function UnitView({ row, onBack }: { row: BundleRow; onBack: () => void }) {
  const [level, setLevel] = useState<Level>('CORE');
  const b = row.bundle;
  const lessons = b.items[level] ?? {};
  const nos = Object.keys(lessons).sort((a, c) => Number(a) - Number(c));
  return (
    <>
      <button className="link" onClick={onBack}>← 목록으로</button>
      <h1>Lesson {b.unit.no} · {b.unit.title}</h1>
      <div className="tabs">
        {LEVELS.map((l) => <button key={l} className={l === level ? 'tab on' : 'tab'} onClick={() => setLevel(l)}>{LEVEL_KO[l]} ({l})</button>)}
      </div>
      <div className="card">
        <h3>차시별 문항 수</h3>
        <ul className="lessons">
          {nos.map((n) => <li key={n}><b>{n}차시</b><span>{(lessons[n] as unknown[]).length}문항</span></li>)}
        </ul>
        <p className="muted">활동 화면은 다음 단계에서 순서대로 연결돼요. 지금은 DB에서 단원을 잘 받아오는지 확인하는 화면이에요.</p>
      </div>
      <div className="card">
        <h3>이 Lesson의 단어</h3>
        <div className="vocab">{b.vocab.map((v) => <span key={v.key} className="chip">{v.en} · {v.ko}</span>)}</div>
      </div>
    </>
  );
}
