import { useEffect, useMemo, useRef, useState } from 'react';
import { say, saySeq, stopSeq, shuffle, startRecording, canRecord, getStt, useSpeaking } from '@mango/play';
import { supabase } from '../supabase';
import { STEPS, STEP_KO, type RBook, type RProg } from './types';
import { useSignedUrls } from './useImages';

type Patch = Partial<Pick<RProg, 'step_reached' | 'completed' | 'taps' | 'quiz_ok' | 'quiz_total' | 'speak_stars'>>;
const words = (t: string) => t.replace(/\s*\/\s*/g, ' ').split(/\s+/).filter(Boolean);
const clean = (w: string) => w.toLowerCase().replace(/[^a-z']/g, '');
const lines = (t: string) => t.split('/').map((s) => s.trim()).filter(Boolean);

/** 원서(Pre) 9단계 학습. 5~6세용: 탭만 사용, 큰 글자, 오답에도 부드럽게. */
export function Reader({ book, prog, onPatch, onExit }: { book: RBook; prog: RProg | null; onPatch: (p: Patch) => void; onExit: () => void }) {
  const c = book.content;
  const [step, setStep] = useState(0);
  const [taps, setTaps] = useState(prog?.taps ?? 0);
  const quiz = useRef({ ok: 0, total: 0 });
  const stars = useRef(0);
  const urls = useSignedUrls([book.cover_path, ...c.pages.map((p) => p.img)]);

  useEffect(() => () => { stopSeq(); try { speechSynthesis.cancel(); } catch { /* 무시 */ } }, []);
  function go(n: number) {
    stopSeq();
    setStep(n);
    const patch: Patch = { step_reached: Math.max(prog?.step_reached ?? 0, n) };
    if (n === STEPS.length - 1) patch.completed = true;
    if (n >= 5) { patch.quiz_ok = quiz.current.ok; patch.quiz_total = quiz.current.total; }
    if (n >= 7) patch.speak_stars = stars.current;
    patch.taps = taps;
    onPatch(patch);
  }
  const next = () => go(Math.min(STEPS.length - 1, step + 1));
  const prev = () => go(Math.max(0, step - 1));

  return (
    <div className="rd">
      <header className="rd-top">
        <button className="rd-x" onClick={onExit} aria-label="나가기">✕</button>
        <b className="rd-title">{book.emoji} {book.title}</b>
        <div className="rd-dots">{STEPS.map((_, i) => <i key={i} className={i < step ? 'done' : i === step ? 'on' : ''} />)}</div>
      </header>
      <div className="rd-tag">STEP {step}. {STEPS[step].toUpperCase()} · {STEP_KO[step]}</div>
      <section className="rd-body">
        {step === 0 && <Warm book={book} cover={book.cover_path ? urls[book.cover_path] : undefined} />}
        {step === 1 && <Phonics book={book} />}
        {step === 2 && <Keys book={book} />}
        {step === 3 && <Read book={book} urls={urls} onTap={(w) => setTaps((s) => { void w; return s + 1; })} />}
        {step === 4 && <Quiz book={book} onResult={(ok, total) => { quiz.current = { ok, total }; }} />}
        {step === 5 && <Trace book={book} />}
        {step === 6 && <Speak book={book} onStars={(n) => { stars.current = n; }} />}
        {step === 7 && <Portfolio book={book} />}
        {step === 8 && <Celebrate book={book} stars={stars.current} />}
      </section>
      <footer className="rd-nav">
        <button className="rd-btn sec" onClick={prev} disabled={step === 0}>← 이전</button>
        {step < STEPS.length - 1 ? <button className="rd-btn" onClick={next}>다음 →</button> : <button className="rd-btn" onClick={onExit}>책 목록으로</button>}
      </footer>
    </div>
  );
}

/* ---------- STEP 0 ---------- */
function Warm({ book, cover }: { book: RBook; cover?: string }) {
  const w = book.content.warmup;
  useEffect(() => { say(book.title); }, [book.title]);
  return (
    <div className="rd-warm">
      {cover ? <img className="rd-cover" src={cover} alt={book.title} onClick={() => say(book.title)} /> : <div className="rd-cover rd-emoji">{book.emoji}</div>}
      <h1 onClick={() => say(w.title)}>{w.title}</h1>
      <p className="rd-lead" dangerouslySetInnerHTML={{ __html: w.lead }} />
      <div className="rd-chars">{w.characters.map((ch) => (
        <button key={ch.name} className="rd-char" onClick={() => say(ch.name)}>
          <span className="rd-ce">{ch.emoji}</span><b>{ch.name}</b><small>{ch.tag}</small><em>{ch.desc}</em>
        </button>))}</div>
    </div>
  );
}

/* ---------- STEP 1 ---------- */
function Phonics({ book }: { book: RBook }) {
  const [t, setT] = useState(0); const p = book.content.phonics[t];
  return (
    <div className="rd-ph">
      <div className="rd-tabs">{book.content.phonics.map((x, i) => <button key={i} className={i === t ? 'on' : ''} onClick={() => { setT(i); say(x.letter.replace('-', '')); }}>{x.letter}</button>)}</div>
      <div className="rd-big" onClick={() => say(p.letter.replace('-', ''))}>{p.letter}</div>
      <p className="rd-hint">{p.hint}</p>
      <div className="rd-cards">
        {p.cvc?.map((x) => <button key={x.word} className="rd-card" onClick={() => say(x.word)}><span>{x.pic}</span><b>{x.word}</b></button>)}
        {p.rhyme?.map((w) => <button key={w} className="rd-card" onClick={() => say(w)}><b>{w}</b></button>)}
      </div>
    </div>
  );
}

/* ---------- STEP 2 ---------- */
function Keys({ book }: { book: RBook }) {
  const ks = book.content.keyWords; const [i, setI] = useState(0); const [s, setS] = useState(0);
  const k = ks[i];
  function tap() { const n = (s + 1) % 3; setS(n); if (n <= 1) say(k.word); }
  function move(d: number) { setI((x) => (x + d + ks.length) % ks.length); setS(0); }
  return (
    <div className="rd-key">
      <button className="rd-arrow" onClick={() => move(-1)} aria-label="이전 단어">‹</button>
      <button className="rd-kcard" onClick={tap}>
        <span className="rd-ke">{k.emoji}</span>
        {s >= 1 && <b className="rd-kw">{k.word}</b>}
        {s === 1 && <small>{k.spell}</small>}
        {s === 2 && <><b className="rd-kk">{k.kor}</b><small>{k.scene}</small></>}
        {s === 0 && <small>눌러 보세요</small>}
      </button>
      <button className="rd-arrow" onClick={() => move(1)} aria-label="다음 단어">›</button>
      <div className="rd-pips">{ks.map((_, n) => <i key={n} className={n === i ? 'on' : ''} />)}</div>
    </div>
  );
}

/* ---------- STEP 3 ---------- */
type Mode = 'listen' | 'echo' | 'read';
function Read({ book, urls, onTap }: { book: RBook; urls: Record<string, string>; onTap: (w: string) => void }) {
  const pages = book.content.pages; const [pi, setPi] = useState(0); const [mode, setMode] = useState<Mode>('listen');
  const [cur, setCur] = useState(-1); const [playing, setPlaying] = useState(false); const [wait, setWait] = useState(false);
  const seen = useRef(new Set<string>());
  const pg = pages[pi]; const ls = lines(pg.text);
  useEffect(() => { stopSeq(); setCur(-1); setPlaying(false); setWait(false); }, [pi, mode]);
  function play() {
    if (playing) { stopSeq(); setPlaying(false); setCur(-1); return; }
    setPlaying(true);
    saySeq(ls, { onLine: (i) => { setCur(i); setWait(false); }, onDone: () => { setPlaying(false); setCur(-1); setWait(false); },
      gap: (i) => { if (mode !== 'echo') return 500; setWait(true); return Math.max(2500, words(ls[i]).length * 800); } });
  }
  function tapWord(w: string) { say(w.replace(/[^\w']/g, '')); const k = clean(w); if (k && !seen.current.has(k)) { seen.current.add(k); onTap(k); } }
  return (
    <div className="rd-read">
      <div className="rd-modes">{([['listen', '🎧 듣기'], ['echo', '🔁 따라 읽기'], ['read', '🙋 내가 읽기']] as [Mode, string][]).map(([m, l]) => <button key={m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>{l}</button>)}</div>
      <div className="rd-page">
        {urls[pg.img] ? <img src={urls[pg.img]} alt={`${pi + 1}쪽`} /> : <div className="rd-noimg">그림을 불러오는 중…</div>}
        <div className="rd-text">
          {ls.map((l, li) => <div key={li} className={'rd-line' + (cur === li ? ' hot' : '')}>{l.split(' ').map((w, wi) => <span key={wi} className="rd-w" onClick={() => tapWord(w)}>{w} </span>)}</div>)}
          {wait && <div className="rd-echo">🎤 따라 읽어 보세요!</div>}
        </div>
      </div>
      <div className="rd-pager">
        <button className="rd-arrow" onClick={() => setPi((x) => Math.max(0, x - 1))} disabled={pi === 0}>‹</button>
        {mode !== 'read' && <button className="rd-btn" onClick={play}>{playing ? '■ 멈춤' : '▶ 들려주기'}</button>}
        <span className="rd-pn">{pi + 1} / {pages.length}</span>
        <button className="rd-arrow" onClick={() => setPi((x) => Math.min(pages.length - 1, x + 1))} disabled={pi === pages.length - 1}>›</button>
      </div>
      <p className="rd-hint">{mode === 'read' ? '모르는 단어를 누르면 소리가 나요.' : '단어를 눌러도 소리를 들을 수 있어요.'}</p>
    </div>
  );
}

/* ---------- STEP 4 ---------- */
function Quiz({ book, onResult }: { book: RBook; onResult: (ok: number, total: number) => void }) {
  const qs = book.content.quizzes; const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null); const [tried, setTried] = useState(false); const [done, setDone] = useState(false);
  const firstOk = useRef(0);
  const q = qs[i];
  useEffect(() => { say(q.q); }, [q.q]);
  function pick(n: number) {
    if (done) return;
    const ok = !!q.options[n].correct;
    setPicked(n);
    if (!tried) { setTried(true); if (ok) firstOk.current++; }
    if (ok) { setDone(true); say('Great job!'); onResult(firstOk.current, i + 1); } else say('Try again!');
  }
  function nx() { setI(i + 1); setPicked(null); setTried(false); setDone(false); }
  return (
    <div className="rd-quiz">
      <div className="rd-q" onClick={() => say(q.q)}>🔊 {q.q}</div>
      <div className="rd-opts">{q.options.map((o, n) => {
        const st = picked === n ? (o.correct ? 'right' : 'wrong') : '';
        return <button key={n} className={'rd-opt ' + st} onClick={() => pick(n)}><span>{o.pic}</span><b>{o.label}</b>{st === 'right' && <em>✓</em>}{st === 'wrong' && <em>↺</em>}</button>;
      })}</div>
      <div className="rd-pips">{qs.map((_, n) => <i key={n} className={n < i ? 'done' : n === i ? 'on' : ''} />)}</div>
      {done && i < qs.length - 1 && <button className="rd-btn" onClick={nx}>다음 문제</button>}
      {done && i === qs.length - 1 && <p className="rd-ok">🎉 모두 풀었어요!</p>}
    </div>
  );
}

/* ---------- STEP 5 ---------- */
function Trace({ book }: { book: RBook }) {
  const ss = book.content.traceSentences; const [i, setI] = useState(0);
  const target = useMemo(() => words(ss[i]), [ss, i]);
  const bank = useMemo(() => shuffle(target.map((w, k) => ({ w, k }))), [target]);
  const [placed, setPlaced] = useState<number[]>([]); const [shake, setShake] = useState(false);
  const full = placed.length === target.length;
  function tap(b: { w: string; k: number }) {
    if (placed.includes(b.k) || full) return;
    const want = target[placed.length];
    if (b.w === want) {
      const np = [...placed, b.k]; setPlaced(np); say(b.w);
      if (np.length === target.length) setTimeout(() => say(ss[i]), 500);
    } else { setShake(true); setTimeout(() => setShake(false), 400); say('Try again!'); }
  }
  function nx() { setI(i + 1); setPlaced([]); }
  return (
    <div className="rd-trace">
      <p className="rd-guide">{ss[i]}</p>
      <div className={'rd-drop' + (full ? ' full' : '') + (shake ? ' shake' : '')}>{placed.map((k) => <span key={k}>{target[k]}</span>)}{!placed.length && <small>순서대로 눌러 문장을 만들어요</small>}</div>
      <div className="rd-bank">{bank.map((b) => <button key={b.k} className="rd-chip" disabled={placed.includes(b.k)} onClick={() => tap(b)}>{b.w}</button>)}</div>
      <div className="rd-row">
        <button className="rd-btn sec" onClick={() => setPlaced([])}>↺ 다시</button>
        {full && i < ss.length - 1 && <button className="rd-btn" onClick={nx}>다음 문장</button>}
        {full && i === ss.length - 1 && <span className="rd-ok">🎉 모두 만들었어요!</span>}
      </div>
    </div>
  );
}

/* ---------- STEP 6 ---------- */
function score(target: string, heard: string): number {
  const t = words(target).map(clean).filter(Boolean); const h = new Set(words(heard).map(clean));
  return t.length ? t.filter((w) => h.has(w)).length / t.length : 0;
}
function Speak({ book, onStars }: { book: RBook; onStars: (n: number) => void }) {
  const ss = book.content.speakSentences; const [i, setI] = useState(0);
  const [res, setRes] = useState<number[]>([]); const [state, setState] = useState<'idle' | 'rec' | 'busy'>('idle'); const [msg, setMsg] = useState('');
  const speaking = useSpeaking(); const recRef = useRef<ReturnType<typeof startRecording> | null>(null);
  const s = ss[i]; const myStars = res[i];
  const canMic = canRecord() && !!getStt();
  useEffect(() => () => { try { recRef.current?.cancel(); } catch { /* 무시 */ } }, []);
  useEffect(() => { onStars(res.reduce((a, b) => a + (b ?? 0), 0)); }, [res, onStars]);
  function setStars(n: number) { setRes((r) => { const x = [...r]; x[i] = Math.max(x[i] ?? 0, n); return x; }); }
  function rec() {
    if (state === 'rec') { recRef.current?.stop(); return; }
    if (state !== 'idle' || speaking) return;
    setMsg(''); setState('rec');
    const r = startRecording({}); recRef.current = r;
    r.result.then(async (wav) => {
      setState('busy');
      try {
        const info = await getStt()!(wav, s.text);
        const sc = score(s.text, info.text);
        setStars(sc >= 0.9 ? 4 : sc >= 0.7 ? 3 : sc >= 0.5 ? 2 : 1);
        setMsg(sc >= 0.7 ? 'Great job!' : 'Good try! 한 번 더 해 볼까요?');
      } catch { setMsg('잘 듣지 못했어요. 다시 해 볼까요?'); }
      setState('idle');
    }).catch((e) => { setState('idle'); setMsg(e === 'denied' ? '마이크 사용을 허용해 주세요.' : '소리가 잘 들리지 않았어요. 다시 해 볼까요?'); });
  }
  function nx() { setI(i + 1); setMsg(''); }
  return (
    <div className="rd-speak">
      <div className="rd-se">{s.emoji}</div>
      <p className="rd-sent">{s.text}</p><p className="rd-kor">{s.kor}</p>
      <div className="rd-row">
        <button className="rd-btn sec" onClick={() => say(s.text)}>🔊 듣기</button>
        {canMic
          ? <button className={'rd-btn' + (state === 'rec' ? ' rec' : '')} onClick={rec} disabled={state === 'busy' || (speaking && state === 'idle')}>{state === 'rec' ? '■ 끝' : state === 'busy' ? '확인 중…' : '🎤 말하기'}</button>
          : <button className="rd-btn" onClick={() => { setStars(2); setMsg('Good job!'); }}>소리 내어 읽었어요</button>}
      </div>
      <div className="rd-stars">{[1, 2, 3, 4].map((n) => <span key={n} className={(myStars ?? 0) >= n ? 'on' : ''}>★</span>)}</div>
      {msg && <p className="rd-msg">{msg}</p>}
      <div className="rd-pips">{ss.map((_, n) => <i key={n} className={n < i ? 'done' : n === i ? 'on' : ''} />)}</div>
      {myStars != null && i < ss.length - 1 && <button className="rd-btn" onClick={nx}>다음 문장</button>}
    </div>
  );
}

/* ---------- STEP 7 ---------- */
function Portfolio({ book }: { book: RBook }) {
  const video = useRef<HTMLVideoElement>(null); const stream = useRef<MediaStream | null>(null); const mr = useRef<MediaRecorder | null>(null); const chunks = useRef<Blob[]>([]);
  const [st, setSt] = useState<'idle' | 'ready' | 'rec' | 'done' | 'saved'>('idle'); const [url, setUrl] = useState(''); const [blob, setBlob] = useState<Blob | null>(null); const [err, setErr] = useState('');
  const script = book.content.speakSentences.map((s) => s.text).join(' ');
  useEffect(() => () => { stream.current?.getTracks().forEach((t) => t.stop()); if (url) URL.revokeObjectURL(url); }, [url]);
  async function cam() {
    setErr('');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true }); stream.current = s;
      if (video.current) { video.current.srcObject = s; void video.current.play(); }
      setSt('ready');
    } catch { setErr('카메라와 마이크를 허용해 주세요.'); }
  }
  function start() {
    if (!stream.current || typeof MediaRecorder === 'undefined') { setErr('이 기기에서는 녹화를 지원하지 않아요.'); return; }
    chunks.current = [];
    const r = new MediaRecorder(stream.current); mr.current = r;
    r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
    r.onstop = () => { const b = new Blob(chunks.current, { type: r.mimeType || 'video/webm' }); setBlob(b); setUrl(URL.createObjectURL(b)); setSt('done'); stream.current?.getTracks().forEach((t) => t.stop()); };
    r.start(); setSt('rec');
  }
  async function save() {
    if (!blob) return;
    const { data: u } = await supabase.auth.getUser(); if (!u.user) { setErr('로그인이 필요해요.'); return; }
    const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
    const path = `${u.user.id}/reading/${book.code}-${Date.now()}.${ext}`;
    const up = await supabase.storage.from('outputs').upload(path, blob, { contentType: blob.type || 'video/webm' });
    if (up.error) { setErr('저장하지 못했어요: ' + up.error.message); return; }
    const ins = await supabase.from('reading_videos').insert({ user_id: u.user.id, book_id: book.id, video_path: path });
    if (ins.error) { setErr('저장하지 못했어요: ' + ins.error.message); return; }
    setSt('saved');
  }
  return (
    <div className="rd-port">
      <p className="rd-script">{script}</p>
      {st !== 'done' && st !== 'saved' && <video ref={video} className="rd-video" playsInline muted />}
      {(st === 'done' || st === 'saved') && <video className="rd-video" src={url} controls playsInline />}
      <div className="rd-row">
        {st === 'idle' && <button className="rd-btn" onClick={cam}>📷 카메라 켜기</button>}
        {st === 'ready' && <button className="rd-btn rec" onClick={start}>● 녹화 시작</button>}
        {st === 'rec' && <button className="rd-btn rec" onClick={() => mr.current?.stop()}>■ 끝내기</button>}
        {st === 'done' && <><button className="rd-btn sec" onClick={() => { setSt('idle'); setUrl(''); setBlob(null); }}>다시 녹화</button><button className="rd-btn" onClick={save}>저장하기</button></>}
        {st === 'saved' && <span className="rd-ok">🎬 저장했어요! 부모님/선생님만 볼 수 있어요.</span>}
      </div>
      {err && <p className="rd-err">{err}</p>}
      <p className="rd-hint">건너뛰어도 괜찮아요.</p>
    </div>
  );
}

/* ---------- STEP 8 ---------- */
function Celebrate({ book, stars }: { book: RBook; stars: number }) {
  useEffect(() => { say('Hooray! I can read this book!'); }, []);
  const bits = useMemo(() => Array.from({ length: 36 }, (_, i) => ({ i, l: Math.random() * 100, d: Math.random() * 1.5, e: ['🎉', '⭐', '🥳', '✨'][i % 4] })), []);
  return (
    <div className="rd-cele">
      {bits.map((b) => <span key={b.i} className="rd-conf" style={{ left: b.l + '%', animationDelay: b.d + 's' }}>{b.e}</span>)}
      <div className="rd-badge">🏅</div>
      <h1>I can read {book.title}!</h1>
      <div className="rd-stars big">{[1, 2, 3, 4, 5].map((n) => <span key={n} className="on">★</span>)}</div>
      {stars > 0 && <p className="rd-hint">말하기 별 {stars}개를 모았어요</p>}
      <button className="rd-btn sec" onClick={() => say('Hooray! I can read this book!')}>🎉 한 번 더!</button>
    </div>
  );
}
