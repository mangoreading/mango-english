import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { configProblem, configured, supabase } from './supabase';
import type { BundleRow, Level } from './types';
import { lessonMeta, playActivity, type PlayResult } from './legacy';

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

  if (!configured) return <Shell><Notice title="설정이 필요해요">{configProblem}</Notice></Shell>;
  if (!ready) return <Shell><p className="mx-muted">불러오는 중…</p></Shell>;
  return <Shell session={session}>{session ? <Units /> : <Login />}</Shell>;
}

function Shell({ children, session }: { children: React.ReactNode; session?: Session | null }) {
  return (
    <div className="mx-shell">
      <header className="mx-top">
        <b className="mx-brand">Mango English</b>
        {session && (
          <span className="mx-who">
            {session.user.email}
            <button className="mx-link" onClick={() => supabase.auth.signOut()}>로그아웃</button>
          </span>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="mx-card"><h2>{title}</h2><p className="mx-muted">{children}</p></div>;
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
    <form className="mx-card mx-login" onSubmit={submit}>
      <h2>{mode === 'in' ? '로그인' : '회원가입'}</h2>
      <label>이메일<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
      <label>비밀번호<input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} /></label>
      {msg && <p className="mx-err">{msg}</p>}
      <button className="mx-btn" disabled={busy}>{mode === 'in' ? '로그인' : '가입하기'}</button>
      <button type="button" className="mx-link" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMsg(''); }}>
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
  if (!rows) return <p className="mx-muted">단원을 불러오는 중…</p>;
  if (open) return <UnitView row={open} onBack={() => setOpen(null)} />;
  if (!rows.length) return <Notice title="발행된 단원이 없어요">관리자가 단원을 발행하면 여기에 나타나요.</Notice>;

  return (
    <>
      <h1>학습할 Lesson 선택</h1>
      <div className="mx-grid">
        {rows.map((r) => (
          <button key={r.unit_id} className="mx-unit" onClick={() => setOpen(r)}>
            <span className="mx-chip">LESSON {r.bundle.unit.no}</span>
            <b>{r.bundle.unit.title}</b>
            <span className="mx-muted">버전 {r.version} · 어휘 {r.bundle.vocab.length}개</span>
          </button>
        ))}
      </div>
    </>
  );
}

type Acts = unknown[][];
interface LMeta { no: number; en: string; ko: string; goal: string; color: string; acts: { t: string; ko: string; min: number }[] }

function UnitView({ row, onBack }: { row: BundleRow; onBack: () => void }) {
  const [level, setLevel] = useState<Level>('CORE');
  const [meta, setMeta] = useState<LMeta[]>([]);
  const [err, setErr] = useState('');
  const b = row.bundle;
  const lessons = (b.items[level] ?? {}) as Record<string, Acts>;

  useEffect(() => { lessonMeta().then(setMeta).catch((e) => setErr(String(e.message || e))); }, []);

  async function save(no: number, res: PlayResult) {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return;
    const rows = res.results.filter((r) => r.tag).map((r) => ({ user_id: uid, unit_id: b.unit.id, lesson: no, tag: r.tag, ok: r.ok, hints: r.hint ?? 0 }));
    if (rows.length) await supabase.from('attempts').insert(rows);
  }

  function start(no: number, idx: number) {
    const acts = lessons[String(no)] ?? [];
    const m = meta.find((x) => x.no === no);
    const act = acts[idx];
    if (!act) return;
    const hasNext = idx + 1 < acts.length;
    playActivity({
      title: `${no}차시 · ${m?.acts[idx]?.t ?? 'Activity'}`, items: act, level, test: no === 7, color: m?.color,
      nextLabel: hasNext ? m?.acts[idx + 1]?.t ?? '다음 활동' : undefined,
      onResult: (res) => { void save(no, res); },
      onFinish: (action) => { if (action === 'next') start(no, idx + 1); else if (action === 'again') start(no, idx); },
      onExit: () => {},
    }).catch((e) => setErr(String(e.message || e)));
  }

  const nos = Object.keys(lessons).map(Number).sort((a, c) => a - c);
  return (
    <>
      <button className="mx-link" onClick={onBack}>← 목록으로</button>
      <h1>Lesson {b.unit.no} · {b.unit.title}</h1>
      <div className="mx-tabs">
        {LEVELS.map((l) => <button key={l} className={l === level ? 'mx-tab mx-on' : 'mx-tab'} onClick={() => setLevel(l)}>{LEVEL_KO[l]} ({l})</button>)}
      </div>
      {err && <p className="mx-err">{err}</p>}
      {nos.map((no) => {
        const m = meta.find((x) => x.no === no);
        const acts = lessons[String(no)];
        return (
          <div className="mx-card" key={no}>
            <h3>{no}차시 · {m?.en ?? ''} <span className="mx-muted">{m?.ko}</span></h3>
            {m && <p className="mx-muted">{m.goal}</p>}
            <div className="mx-acts">
              {acts.map((a, i) => (
                <button key={i} className="mx-act" onClick={() => start(no, i)}>
                  <b>{m?.acts[i]?.t ?? `활동 ${i + 1}`}</b>
                  <span className="mx-muted">{m?.acts[i]?.ko} · {a.length}문항</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
      <p className="mx-muted">8차시(맞춤 보강)는 다음 단계에서 연결해요.</p>
    </>
  );
}
