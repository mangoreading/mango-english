import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { configProblem, configured, supabase } from './supabase';
import type { BundleRow, Level } from './types';
import { NativePlayer, isNative, type NativeResult, type VWord } from '@mango/play';
import '@mango/play/styles.css';
import { ReportView } from './Report';
import { areaOf, buildReport, practiceFor, type StepRef } from './reportCalc';
import { books, lesson8, lessonMeta, playActivity, tallyTags, type BookMeta, type PlayResult, type TagStats } from './legacy';

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
interface LMeta { no: number; en: string; ko: string; goal: string; color: string; acts: { t: string; ko: string; min: number; study: boolean; hw: boolean }[] }
interface Prog { stars: number; ok: number; total: number; detail?: { tags: TagStats; plan: unknown; review: number; correct: number; total: number } | null }
const pkey = (lv: string, no: number, i: number) => `${lv}:${no}:${i}`;
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(3 - n);

function UnitView({ row, onBack }: { row: BundleRow; onBack: () => void }) {
  const lvKey = 'mg:level';
  const [level, setLevelState] = useState<Level>(() => { try { const v = localStorage.getItem(lvKey) as Level; return LEVELS.includes(v) ? v : 'CORE'; } catch { return 'CORE'; } });
  const setLevel = (l: Level) => { setLevelState(l); try { localStorage.setItem(lvKey, l); } catch { /* 무시 */ } };
  const [meta, setMeta] = useState<LMeta[]>([]);
  const [err, setErr] = useState('');
  const [prog, setProg] = useState<Record<string, Prog>>({});
  const [bk, setBk] = useState<{ list: BookMeta[]; items: (i: number) => unknown[] } | null>(null);
  const [l8, setL8] = useState<{ acts: { t: string; ko: string; min: number }[]; items: (i: number) => unknown[] } | null>(null);
  const b = row.bundle;
  const hasAdaptive = !!b.flow?.some((l) => l.steps.some((s) => s.special === 'adaptive'));
  const [nat, setNat] = useState<{ nonce: number; title: string; items: Record<string, any>[]; nextLabel?: string; lesson: number; idx: number; next?: () => void } | null>(null);
  const lessons = (b.items[level] ?? {}) as Record<string, Acts>;

  const loadProg = async () => {
    const { data, error } = await supabase.from('activity_progress').select('level, lesson, act_idx, stars, ok, total, detail').eq('unit_id', b.unit.id);
    if (error) { setErr('진도를 불러오지 못했어요: ' + error.message); return; }
    const m: Record<string, Prog> = {};
    (data ?? []).forEach((r: any) => { m[pkey(r.level, r.lesson, r.act_idx)] = { stars: r.stars, ok: r.ok, total: r.total, detail: r.detail }; });
    setProg(m);
  };
  useEffect(() => {
    void loadProg();
    if (b.flow) {
      setMeta(b.flow.map((l) => ({ no: l.no, en: l.en, ko: l.ko, goal: l.goal, color: l.color, acts: l.steps.map((s) => ({ t: s.name_en, ko: s.name_ko, min: s.min ?? 0, study: s.study !== false, hw: !!s.homework })) })));
      if (hasAdaptive) books().then(setBk).catch(() => {});
    } else {
      lessonMeta().then(setMeta).catch((e) => setErr(String(e.message || e)));
      books().then(setBk).catch(() => {});
    }
    /* eslint-disable-next-line */
  }, []);

  const test = prog[pkey(level, 7, 0)];
  useEffect(() => {
    setL8(null);
    if (hasAdaptive && test?.detail) lesson8(level, test.detail.plan, test.detail.tags).then(setL8).catch((e) => setErr(String(e.message || e)));
  }, [level, test?.detail]);

  async function save(lesson: number, idx: number, res: PlayResult) {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return;
    const scored = res.results.filter((r) => r.tag);
    const ok = scored.filter((r) => r.ok).length, total = scored.length;
    const pct = total ? ok / total : 1;
    const st = hasAdaptive && lesson === 7 ? 3 : pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
    if (scored.length && lesson < 90) {
      await supabase.from('attempts').insert(scored.map((r) => ({ user_id: uid, unit_id: b.unit.id, lesson, tag: r.tag, ok: r.ok, hints: r.hint ?? 0 })));
    }
    const prev = prog[pkey(level, lesson, idx)];
    const detail = hasAdaptive && lesson === 7 ? await tallyTags(res.results) : null;
    const row = { user_id: uid, unit_id: b.unit.id, level, lesson, act_idx: idx, stars: Math.max(st, prev?.stars ?? 0), ok, total, detail };
    const { error } = await supabase.from('activity_progress').upsert(row);
    if (error) setErr('진도를 저장하지 못했어요: ' + error.message); else void loadProg();
  }

  function run(lesson: number, idx: number, title: string, items: unknown[], color: string | undefined, next: (() => void) | undefined, nextLabel?: string) {
    if (items.length && items.every(isNative)) {
      setNat({ nonce: Date.now(), title, items: items as Record<string, any>[], nextLabel, lesson, idx, next });
      return;
    }
    playActivity({
      title, items, level, test: hasAdaptive && lesson === 7, color, nextLabel,
      onResult: (res) => { void save(lesson, idx, res); },
      onFinish: (action) => { if (action === 'next' && next) next(); else if (action === 'again') run(lesson, idx, title, items, color, next, nextLabel); },
      onExit: () => {},
    }).catch((e) => setErr(String(e.message || e)));
  }

  /** 다음 '학습' 활동 번호(숙제 전용 활동은 건너뜀). 없으면 -1 */
  const nextStudy = (no: number, idx: number) => { const m = meta.find((x) => x.no === no); const n = (lessons[String(no)] ?? []).length; for (let i = idx + 1; i < n; i++) if (m?.acts[i]?.study !== false) return i; return -1; };
  /** 차시 안에서 지금 활동이 '학습' 활동 중 몇 번째인지 (숙제 전용 활동은 세지 않음) */
  const stepPos = (no: number, idx: number) => { const m = meta.find((x) => x.no === no); if (!m) return undefined; const n = (lessons[String(no)] ?? []).length; const ids: number[] = []; for (let i = 0; i < n; i++) if (m.acts[i]?.study !== false) ids.push(i); const cur = ids.indexOf(idx); return cur < 0 ? undefined : { cur, total: ids.length }; };
  const reportNo = (() => { const core = (b.flow ?? []).filter((l) => (l.track ?? 'core') === 'core'); return core.length ? core[core.length - 1].no : -1; })();
  function start(no: number, idx: number) {
    const acts = lessons[String(no)] ?? [];
    const m = meta.find((x) => x.no === no);
    if (!acts[idx]) return;
    const ni = nextStudy(no, idx);
    const toReport = ni < 0 && no === reportNo;
    run(no, idx, `${no}차시 : ${m?.acts[idx]?.t ?? 'Activity'}`, acts[idx], m?.color,
      ni >= 0 ? () => start(no, ni) : toReport ? () => setRep(true) : undefined, ni >= 0 ? m?.acts[ni]?.t ?? '다음 활동' : toReport ? '결과 보기' : undefined);
  }
  function start8(idx: number) {
    if (!l8) return;
    const hasNext = idx + 1 < l8.acts.length;
    run(8, idx, `8차시 · ${l8.acts[idx].t}`, l8.items(idx), 'grape', hasNext ? () => start8(idx + 1) : undefined, hasNext ? l8.acts[idx + 1].t : undefined);
  }
  function startBook(i: number) {
    if (!bk) return;
    run(90, i, bk.list[i].title, bk.items(i), 'leaf', undefined);
  }

  // 결과 리포트(마지막 core 차시 = 6차시 결과를 영역별로)
  const [rep, setRep] = useState(false);
  const progAt = (no: number, idx: number) => { const p = prog[pkey(level, no, idx)]; return p ? { ok: p.ok, total: p.total } : undefined; };
  const report0 = b.flow ? buildReport(b.flow, progAt) : null;
  const hasItems = (no: number, idx: number) => ((lessons[String(no)] ?? [])[idx] ?? []).length > 0;
  /** [더 연습해요]: 고른 활동들을 차례로 풀고, 끝나면 결과 화면으로 돌아온다 */
  function practiceSeq(list: StepRef[], i = 0) {
    const r = list[i]; if (!r) { setRep(true); return; }
    const acts = lessons[String(r.no)] ?? []; const more = i + 1 < list.length;
    run(r.no, r.idx, `더 연습해요 · ${r.name}`, acts[r.idx], undefined, more ? () => practiceSeq(list, i + 1) : () => setRep(true), more ? list[i + 1].name : '결과 보기');
  }
  function retryStep(r: StepRef) { const acts = lessons[String(r.no)] ?? []; run(r.no, r.idx, `${r.no}차시 · ${r.name}`, acts[r.idx], undefined, () => setRep(true), '결과 보기'); }

  // 이어하기: 가장 먼저 끝내지 못한 활동
  const nos = Object.keys(lessons).map(Number).sort((a, c) => a - c);
  let resume: { no: number; idx: number } | null = null;
  for (const no of nos) { const n = lessons[String(no)].length; for (let i = 0; i < n && !resume; i++) if (!prog[pkey(level, no, i)] && meta.find((x) => x.no === no)?.acts[i]?.study !== false) resume = { no, idx: i }; if (resume) break; }
  const studyN = (no: number) => lessons[String(no)].filter((_, i) => meta.find((x) => x.no === no)?.acts[i]?.study !== false).length;
  const doneCount = (no: number) => lessons[String(no)].filter((_, i) => prog[pkey(level, no, i)] && meta.find((x) => x.no === no)?.acts[i]?.study !== false).length;

  if (rep && report0) return (<>
    <ReportView title={`Lesson ${b.unit.no} · ${b.unit.title}`} report={report0} practice={(a) => practiceFor(a.area, b.flow, hasItems, report0.reportLesson)}
      onPractice={(_a, list) => { setRep(false); practiceSeq(list); }} onRetry={(r) => { setRep(false); retryStep(r); }} onBack={() => setRep(false)} />
  </>);
  return (
    <>
      <button className="mx-link" onClick={onBack}>← 목록으로</button>
      <h1>Lesson {b.unit.no} · {b.unit.title}</h1>
      <div className="mx-tabs">
        {LEVELS.map((l) => <button key={l} className={l === level ? 'mx-tab mx-on' : 'mx-tab'} onClick={() => setLevel(l)}>{LEVEL_KO[l]} ({l})</button>)}
      </div>
      {err && <p className="mx-err">{err}</p>}
      {meta.length > 0 && resume && (
        <button className="mx-btn mx-resume" onClick={() => start(resume!.no, resume!.idx)}>
          {Object.keys(prog).some((k) => k.startsWith(level + ':')) ? '이어하기' : '시작하기'} → {resume.no}차시 · {meta.find((x) => x.no === resume!.no)?.acts[resume.idx]?.t}
        </button>
      )}
      {nos.map((no) => {
        const m = meta.find((x) => x.no === no);
        const acts = lessons[String(no)];
        const dc = doneCount(no);
        return (
          <div className="mx-card" key={no}>
            <h3>{no}차시 · {m?.en ?? ''} <span className="mx-muted">{m?.ko}</span> <span className={dc === studyN(no) ? 'mx-chip mx-ok' : 'mx-chip'}>{dc}/{studyN(no)}</span>{no === reportNo && report0 && <button className="mx-link" style={{ marginLeft: 12 }} onClick={() => setRep(true)}>결과 보기</button>}</h3>
            {m && <p className="mx-muted">{m.goal}</p>}
            <div className="mx-acts">
              {acts.map((a, i) => {
                const p = prog[pkey(level, no, i)];
                return (
                  <button key={i} className={p ? 'mx-act mx-done' : 'mx-act'} onClick={() => start(no, i)}>
                    <b>{p ? '✓ ' : ''}{m?.acts[i]?.t ?? `활동 ${i + 1}`}{m?.acts[i]?.study === false ? ' · 숙제' : ''}</b>
                    <span className="mx-muted">{m?.acts[i]?.ko} · {a.length}문항{p && no !== 7 ? ` · ${stars(p.stars)}` : ''}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {hasAdaptive && <div className="mx-card">
        <h3>8차시 · Personalized Mastery <span className="mx-muted">내 결과에 맞춘 보강</span></h3>
        {!test ? <p className="mx-muted">7차시 Lesson Check를 마치면 내 결과에 맞는 8차시가 열려요.</p> : !l8 ? <p className="mx-muted">불러오는 중…</p> : (
          <div className="mx-acts">
            {l8.acts.map((a, i) => {
              const p = prog[pkey(level, 8, i)];
              return (
                <button key={i} className={p ? 'mx-act mx-done' : 'mx-act'} onClick={() => start8(i)}>
                  <b>{p ? '✓ ' : ''}{a.t}</b><span className="mx-muted">{a.ko}{p ? ` · ${stars(p.stars)}` : ''}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>}

      {hasAdaptive && bk && (
        <div className="mx-card">
          <h3>Reading Pack <span className="mx-muted">원서 읽기 (차시 학습과 별도)</span></h3>
          <div className="mx-acts">
            {bk.list.filter((x) => x.level === level).map((x) => {
              const p = prog[pkey(level, 90, x.idx)];
              return (
                <button key={x.id} className={p ? 'mx-act mx-done' : 'mx-act'} onClick={() => startBook(x.idx)}>
                  <b>{p ? '✓ ' : ''}{x.title}</b><span className="mx-muted">{x.ko}{p ? ` · ${stars(p.stars)}` : ''}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {nat && (
        <NativePlayer key={nat.nonce} scope={b.unit.id + '|' + nat.lesson} title={nat.title} items={nat.items} vocab={b.vocab as VWord[]} nextLabel={nat.nextLabel} step={stepPos(nat.lesson, nat.idx)}
          onResult={(r: NativeResult) => { void save(nat.lesson, nat.idx, { results: r.results, total: r.total, scored: r.scored }); }}
          onFinish={(act) => { const n = nat; setNat(null); if (act === 'next' && n.next) n.next(); else if (act === 'again') run(n.lesson, n.idx, n.title, n.items, undefined, n.next, n.nextLabel); }} />
      )}
    </>
  );
}
