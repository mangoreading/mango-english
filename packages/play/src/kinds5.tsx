import { useEffect, useMemo, useRef, useState } from 'react';
import { aiHandlers, imgSrc, say, sayThen, type KindProps } from './common';
import { Hint } from './hint';

/* ===== 4단계 템플릿: 말하기 (그림 보고 말하기 · 우리말 보고 말하기 · 듣고 대답하기 · 따라 읽기 · 역할극 · 발표 · AI 대화) =====
   말소리 인식은 브라우저의 음성 인식(SpeechRecognition)을 쓴다. 지원하지 않는 브라우저에서는 '말했어요' 버튼으로 대신한다. */
type SR = { start: () => void; stop: () => void; abort: () => void; lang: string; interimResults: boolean; maxAlternatives: number; onresult: (e: any) => void; onerror: (e: any) => void; onend: () => void }; // eslint-disable-line @typescript-eslint/no-explicit-any
const SRClass = (): (new () => SR) | null => { try { const w = window as any; return w.SpeechRecognition || w.webkitSpeechRecognition || null; } catch { return null; } }; // eslint-disable-line @typescript-eslint/no-explicit-any
export const micSupported = () => !!SRClass();
const clean = (s: string) => s.toLowerCase().replace(/[’‘`]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();
const words = (s: string) => clean(s).split(' ').filter(Boolean);
/** 목표 문장의 단어별 일치 여부 (들린 문장에 그 단어가 있으면 맞음) */
export function grade(target: string, heard: string): { w: string; ok: boolean }[] {
  const pool = words(heard);
  return target.split(/\s+/).filter(Boolean).map((t) => { const c = clean(t); const i = pool.indexOf(c); if (i >= 0) { pool.splice(i, 1); return { w: t, ok: true }; } return { w: t, ok: !c }; });
}
/** 유창성 별점(추정): 빠뜨리지 않고(완성도) 알맞은 속도로(단어당 0.3~0.9초) 이어 읽었는지. 출시 전 Azure 발음평가의 실제 유창성 점수로 교체 예정 */
export function fluency(cover: number, target: string, ms: number): number {
  const n = Math.max(1, target.split(/\s+/).filter(Boolean).length); const per = Math.max(0, ms - 700) / n / 1000; // 시작 지연 0.7초 제외
  const pace = per < 0.15 ? 0.5 : per < 0.3 ? 0.5 + ((per - 0.15) / 0.15) * 0.5 : per <= 0.9 ? 1 : per <= 1.6 ? 1 - ((per - 0.9) / 0.7) * 0.5 : 0.5;
  return Math.max(1, Math.min(5, Math.round(5 * cover * pace)));
}
const pct = (g: { ok: boolean }[]) => (g.length ? g.filter((x) => x.ok).length / g.length : 0);

/** 마이크 훅: start() 하면 한 번 듣고 결과 문장을 돌려준다 */
function useMic(onText: (t: string) => void) {
  const [on, setOn] = useState(false); const [err, setErr] = useState(''); const rec = useRef<SR | null>(null);
  useEffect(() => () => { try { rec.current?.abort(); } catch { /* */ } }, []);
  function start() {
    const C = SRClass(); if (!C) { setErr('nosupport'); return; }
    try {
      const r = new C(); rec.current = r; r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 3;
      let got = false;
      r.onresult = (e: any) => { got = true; const a = Array.from(e.results[0] as ArrayLike<{ transcript: string }>).map((x) => x.transcript); onText(a.join(' | ')); }; // eslint-disable-line @typescript-eslint/no-explicit-any
      r.onerror = (e: any) => { setErr(e.error === 'not-allowed' ? 'denied' : e.error === 'no-speech' ? 'nospeech' : 'error'); setOn(false); }; // eslint-disable-line @typescript-eslint/no-explicit-any
      r.onend = () => { setOn(false); if (!got) setErr((x) => x || 'nospeech'); };
      setErr(''); setOn(true); r.start();
    } catch { setErr('error'); setOn(false); }
  }
  const stop = () => { try { rec.current?.stop(); } catch { /* */ } };
  return { on, err, start, stop };
}
const ERRMSG: Record<string, string> = { nosupport: '이 브라우저는 말소리 인식을 지원하지 않아요. 소리 내어 읽고 아래 버튼을 눌러 주세요.', denied: '마이크 사용이 막혀 있어요. 주소창의 마이크 허용을 눌러 주세요.', nospeech: '소리가 들리지 않았어요. 다시 말해 보세요.', error: '잘 듣지 못했어요. 다시 한번 말해 보세요.' };

const MicBtn = ({ on, onClick, label }: { on: boolean; onClick: () => void; label?: string }) => (
  <div className="nv-micwrap">
    <button type="button" className={'nv-mic' + (on ? ' on' : '')} onClick={onClick} aria-label="말하기">🎤</button>
    <span>{on ? '듣고 있어요… 말해 보세요' : label ?? '버튼을 눌러 소리내어 말해보세요'}</span>
  </div>
);
const Words = ({ g }: { g: { w: string; ok: boolean }[] }) => <span className="nv-gw">{g.map((x, i) => <span key={i} className={x.ok ? 'ok' : 'bad'}>{x.w} </span>)}</span>;

/** 말하기 3종: lookspeak(그림) / saykor(우리말) / lspeak(듣고 대답) */
function Speak({ item, pic, onDone, mode }: KindProps & { mode: 'look' | 'kor' | 'listen' }) {
  const target: string = item.target ?? ''; const need: number = item.pass ?? 0.7;
  const [g, setG] = useState<{ w: string; ok: boolean }[] | null>(null); const [heard, setHeard] = useState(''); const [tries, setTries] = useState(0); const [ok, setOk] = useState(false);
  const mic = useMic((t) => {
    const opts = t.split(' | '); const best = opts.map((o) => grade(target, o)).sort((a, b) => pct(b) - pct(a))[0];
    setHeard(opts[0]); setG(best); setTries((n) => n + 1);
    if (pct(best) >= need) { setOk(true); onDone([{ tag: 'speak', ok: tries === 0 }]); }
  });
  const src = pic(item.pic);
  const self = () => { setOk(true); onDone([{ tag: 'speak', ok: true }]); };
  return (
    <div className="nv-body">
      {mode === 'listen' && <button type="button" className="nv-listen" onClick={() => say(item.ask ?? target)}>🔊 <b>듣기</b></button>}
      {mode === 'look' && src && <div className="nv-picwrap"><img className="nv-img nv-img-md" src={imgSrc(src)} alt="" draggable={false} />{item.label && <span className="nv-pill">{item.label}</span>}{item.price && <span className="nv-price">{item.price}</span>}</div>}
      {mode !== 'look' && item.ko && <div className="nv-kobar">{item.ko}</div>}
      <div className={'nv-capsule nv-capsule-sp' + (ok ? ' nv-okc' : '')}>
        <b>{g ? <Words g={g} /> : target}</b>
        <button className="nv-spk" onClick={() => say(target)} aria-label="듣기">🔊</button>
      </div>
      {g && <p className="nv-heard">들린 말: “{heard}” · 일치 {Math.round(pct(g) * 100)}%</p>}
      {!ok && <MicBtn on={mic.on} onClick={mic.on ? mic.stop : mic.start} />}
      {ok ? <p className="nv-fbmsg on">잘했어요! 👏</p> : mic.err && <p className="nv-fbmsg on nv-fbbad">{ERRMSG[mic.err]}</p>}
      {!ok && (mic.err === 'nosupport' || mic.err === 'denied' || tries >= 3) && <button className="nv-btn nv-ghost" onClick={self}>소리 내어 말했어요</button>}
      <Hint lines={item.hint ?? []} kind={item.k} item={item} ctx={() => ({ input: heard, wrong: tries })} />
    </div>
  );
}
export const LookSpeak = (p: KindProps) => <Speak {...p} mode="look" />;
export const SayKor = (p: KindProps) => <Speak {...p} mode="kor" />;
export const LSpeak = (p: KindProps) => <Speak {...p} mode="listen" />;

/** 따라 읽기: 듣기 → 말하기 → 단어별 결과(색) → 약한 단어를 짚어 다시 듣고 한 번 더 */
export function RAloud({ item, onDone }: KindProps) {
  const target: string = item.target ?? ''; const [round, setRound] = useState(1); const [g, setG] = useState<{ w: string; ok: boolean }[] | null>(null);
  const [fin, setFin] = useState(false); const firstOk = useRef(true);
  const t0 = useRef(0); const [flu, setFlu] = useState(0);
  const mic = useMic((t) => {
    const opts = t.split(' | '); const best = opts.map((o) => grade(target, o)).sort((a, b) => pct(b) - pct(a))[0]; setG(best); setFlu(fluency(pct(best), target, Date.now() - t0.current));
    if (round === 1) { firstOk.current = pct(best) >= 0.7; if (pct(best) >= 0.95) { setFin(true); onDone([{ tag: 'speak', ok: true }]); } else setRound(2); }
    else { setFin(true); onDone([{ tag: 'speak', ok: firstOk.current }]); }
  });
  const bads = g?.filter((x) => !x.ok).map((x) => x.w.replace(/[^\w']/g, '')) ?? []; const stars = g ? Math.round(pct(g) * 5) : 0;
  const startMic = () => { t0.current = Date.now(); mic.start(); };
  return (
    <div className="nv-body">
      <div className="nv-ra">
        <div className="nv-ra-t">{g ? <Words g={g} /> : target}</div>
        {g && <div className="nv-ra-r">
          {item.stars && <p className="nv-stars5">정확도 : {[1, 2, 3, 4, 5].map((n) => <span key={n} className={n <= stars ? 'on' : ''}>★</span>)}</p>}
          {item.fluency && <p className="nv-stars5">유창성 : {[1, 2, 3, 4, 5].map((n) => <span key={n} className={n <= flu ? 'on' : ''}>★</span>)}</p>}
          <p className="nv-ra-m">{fin ? (bads.length ? <>잘했어요! 다음에는 <b>{bads.join(', ')}</b> 를 더 또박또박 말해 봐요.</> : '아주 정확해요! 👏') : <>문장을 다시 한번 들어보면서 {bads.map((b) => <b key={b}>{b} </b>)}를 정확히 발음해 보세요.</>}</p>
        </div>}
      </div>
      <div className="nv-ra-btns">
        <button className="nv-spkc" onClick={() => say(target)} aria-label="듣기">🔊<sup>{fin ? '' : round === 1 ? '1st' : '2nd'}</sup></button>
        {!fin && <MicBtn on={mic.on} onClick={mic.on ? mic.stop : startMic} label={round === 1 ? '먼저 들어 본 뒤, 마이크를 눌러 따라 읽어요' : '한 번 더 읽어 볼까요?'} />}
      </div>
      {!fin && mic.err && <p className="nv-fbmsg on nv-fbbad">{ERRMSG[mic.err]}</p>}
      {!fin && (mic.err === 'nosupport' || mic.err === 'denied') && <button className="nv-btn nv-ghost" onClick={() => { setFin(true); onDone([{ tag: 'speak', ok: true }]); }}>소리 내어 읽었어요</button>}
    </div>
  );
}

/** 역할극: 역할(A/B)을 고르고, 내 차례에는 말하고 상대 차례에는 들려준다 */
export function Role({ item, pic, onDone }: KindProps) {
  const lines: { who: string; text: string }[] = (item.lines ?? []).map((l: string) => { const m = l.match(/^\s*([A-Za-z]+)\s*[:：]\s*(.*)$/); return m ? { who: m[1].toUpperCase(), text: m[2] } : { who: '', text: l }; });
  const roles = [...new Set(lines.map((l) => l.who).filter(Boolean))].slice(0, 2);
  const [me, setMe] = useState<string | null>(null); const [pos, setPos] = useState(-1); const [g, setG] = useState<{ w: string; ok: boolean }[] | null>(null); const fired = useRef(false);
  const [wait, setWait] = useState(false);
  const mine = pos >= 0 && pos < lines.length && lines[pos].who === me;
  const mic = useMic((t) => { const best = t.split(' | ').map((o) => grade(lines[pos].text, o)).sort((a, b) => pct(b) - pct(a))[0]; setG(best); if (pct(best) >= 0.6) setTimeout(() => adv(pos), 700); });
  function adv(from: number) {
    setG(null); const n = from + 1; setPos(n);
    if (n >= lines.length) { if (!fired.current) { fired.current = true; onDone([{ tag: 'speak', ok: true }]); } return; }
    if (lines[n].who !== me) { setWait(true); sayThen(lines[n].text, () => { setWait(false); adv(n); }); }
  }
  function begin(r: string) { setMe(r); setPos(-1); setTimeout(() => { setPos(0); if (lines[0].who !== r) { setWait(true); sayThen(lines[0].text, () => { setWait(false); setPos(0); (document.activeElement as HTMLElement | null)?.blur(); advFrom(0, r); }); } }, 0); }
  function advFrom(from: number, r: string) { setG(null); const n = from + 1; setPos(n); if (n >= lines.length) { if (!fired.current) { fired.current = true; onDone([{ tag: 'speak', ok: true }]); } return; } if (lines[n].who !== r) { setWait(true); sayThen(lines[n].text, () => { setWait(false); advFrom(n, r); }); } }
  const src = pic(item.pic);
  if (!me) return (
    <div className="nv-body">
      {src && <div className="nv-picwrap"><img className="nv-img nv-img-md" src={imgSrc(src)} alt="" draggable={false} />{item.price && <span className="nv-price">{item.price}</span>}</div>}
      <p className="nv-q">내가 맡을 역할을 골라 보세요</p>
      <div className="nv-tfrow">{roles.map((r) => <button key={r} className="nv-opt nv-tf" onClick={() => begin(r)}>{r} 역할</button>)}</div>
    </div>
  );
  return (
    <div className="nv-body">
      {src && <div className="nv-picwrap"><img className="nv-img nv-img-md" src={imgSrc(src)} alt="" draggable={false} />{item.price && <span className="nv-price">{item.price}</span>}</div>}
      <div className="nv-dlgbig">
        {lines.map((l, i) => (
          <p key={i} className={(i === pos ? 'cur ' : '') + (l.who === me ? 'me' : '') + (i > pos ? ' later' : '')}><b>{l.who ? l.who + ' :' : ''}</b> {i === pos && g && l.who === me ? <Words g={g} /> : <Rich2 t={l.text} />}</p>))}
      </div>
      {pos >= lines.length ? <p className="nv-fbmsg on">역할극을 마쳤어요! 👏</p> : mine ? <>
        <MicBtn on={mic.on} onClick={mic.on ? mic.stop : mic.start} label="내 차례예요. 마이크를 누르고 말해 보세요" />
        {mic.err && <p className="nv-fbmsg on nv-fbbad">{ERRMSG[mic.err]}</p>}
        {(mic.err === 'nosupport' || mic.err === 'denied') && <button className="nv-btn nv-ghost" onClick={() => adv(pos)}>말했어요</button>}
      </> : <p className="nv-hint">{wait ? '상대 차례예요. 잘 들어 보세요…' : ''}</p>}
    </div>
  );
}
const Rich2 = ({ t }: { t: string }) => <>{t.split(/(\[\[.*?\]\]|\{\{.*?\}\})/g).map((p, i) => (p.startsWith('[[') ? <span key={i} className="nv-cb">{p.slice(2, -2)}</span> : p.startsWith('{{') ? <span key={i} className="nv-cr">{p.slice(2, -2)}</span> : p))}</>;

/** 발표 영상 찍기: 대본을 보며 카메라로 녹화한다. 영상은 이 기기 안에서만 다시 볼 수 있다 */
export function Present({ item, onDone }: KindProps) {
  const lines: string[] = item.text ?? []; const vid = useRef<HTMLVideoElement>(null); const rec = useRef<MediaRecorder | null>(null); const chunks = useRef<Blob[]>([]); const stream = useRef<MediaStream | null>(null);
  const [state, setState] = useState<'idle' | 'ready' | 'rec' | 'done'>('idle'); const [sec, setSec] = useState(0); const [url, setUrl] = useState(''); const [err, setErr] = useState('');
  useEffect(() => () => { stream.current?.getTracks().forEach((t) => t.stop()); }, []);
  useEffect(() => { if (state !== 'rec') return; const id = setInterval(() => setSec((s) => s + 1), 1000); return () => clearInterval(id); }, [state]);
  async function open() {
    try { const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); stream.current = s; if (vid.current) { vid.current.srcObject = s; void vid.current.play(); } setState('ready'); setErr(''); }
    catch { setErr('카메라·마이크를 열 수 없어요. 허용해 주세요. 어려우면 아래 버튼으로 건너뛸 수 있어요.'); }
  }
  function start() { if (!stream.current) return; chunks.current = []; const r = new MediaRecorder(stream.current); rec.current = r; r.ondataavailable = (e) => chunks.current.push(e.data);
    r.onstop = () => { const u = URL.createObjectURL(new Blob(chunks.current, { type: 'video/webm' })); setUrl(u); setState('done'); stream.current?.getTracks().forEach((t) => t.stop()); onDone([{ tag: 'speak', ok: true }]); };
    setSec(0); r.start(); setState('rec'); }
  const mm = (n: number) => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
  return (
    <div className="nv-body nv-bodyw">
      <div className="nv-pres">
        <div className="nv-script">{lines.map((l, i) => <p key={i}><Rich2 t={l} /></p>)}</div>
        <div className="nv-cam">
          {state === 'done' ? <video src={url} controls playsInline /> : <video ref={vid} muted playsInline />}
          {state === 'idle' && <div className="nv-camph">카메라를 켜고 발표해 볼까요?</div>}
          {state === 'rec' && <span className="nv-rect">● {mm(sec)}</span>}
        </div>
      </div>
      <div className="nv-ra-btns">
        {state === 'idle' && <button className="nv-btn" onClick={open}>카메라 켜기</button>}
        {state === 'ready' && <button className="nv-recb" onClick={start} aria-label="녹화 시작" />}
        {state === 'rec' && <button className="nv-recb on" onClick={() => rec.current?.stop()} aria-label="녹화 끝내기" />}
        {state === 'done' && <p className="nv-fbmsg on">발표를 마쳤어요! 👏 (영상은 이 기기에만 있어요)</p>}
        {(state === 'idle' || state === 'ready') && err && <button className="nv-btn nv-ghost" onClick={() => { setState('done'); onDone([{ tag: 'speak', ok: true }]); }}>건너뛰기</button>}
      </div>
      {err && state === 'idle' && <p className="nv-fbmsg on nv-fbbad">{err}</p>}
    </div>
  );
}

/** AI 자유대화: 상황을 보고 영어로 대화한다. AI 연결이 있으면 AI가, 없으면 문항에 적힌 대본이 답한다 */
export function AiTalk({ item, onDone }: KindProps) {
  const script: { ai: string; hint?: string }[] = item.script ?? []; const turns: number = item.turns ?? Math.max(2, script.length || 3);
  const [msgs, setMsgs] = useState<{ who: 'ai' | 'me'; text: string }[]>(item.open ? [{ who: 'ai', text: item.open }] : []); const [v, setV] = useState(''); const [busy, setBusy] = useState(false); const [n, setN] = useState(0); const [fin, setFin] = useState(false);
  const end = useRef<HTMLDivElement>(null); const fired = useRef(false);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs]);
  useEffect(() => { if (msgs.length === 1 && item.open) say(item.open); /* eslint-disable-next-line */ }, []);
  const mic = useMic((t) => setV(t.split(' | ')[0]));
  async function send() {
    const text = v.trim(); if (!text || busy || fin) return; setV(''); const h = [...msgs, { who: 'me' as const, text }]; setMsgs(h); setBusy(true);
    let reply = script[n]?.ai ?? 'Good! Tell me more.';
    try { if (aiHandlers.chat) reply = await aiHandlers.chat({ situation: item.situation ?? '', role: item.role, history: h }); } catch { /* 대본으로 대신 */ }
    const nn = n + 1; setN(nn); setMsgs([...h, { who: 'ai', text: reply }]); say(reply); setBusy(false);
    if (nn >= turns && !fired.current) { fired.current = true; setFin(true); onDone([{ tag: 'speak', ok: true }]); }
  }
  const nextHint = item.hints?.[n] ?? script[n - 1]?.hint;
  return (
    <div className="nv-body nv-bodyw">
      {item.situation && <div className="nv-kobar nv-sit">{item.situation}</div>}
      <div className="nv-chat">
        {msgs.map((m, i) => <div key={i} className={'nv-msg ' + m.who}>{m.who === 'me' && <em>me</em>}<span>{m.text}</span></div>)}
        {busy && <div className="nv-msg ai"><span className="nv-typing">…</span></div>}<div ref={end} />
      </div>
      {!fin ? <div className="nv-chatin">
        <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void send(); }} placeholder="여기에 타이핑하거나 말로 얘기해보세요" autoCapitalize="off" spellCheck={false} />
        {micSupported() && <button type="button" className={'nv-mic nv-mic-s' + (mic.on ? ' on' : '')} onClick={mic.on ? mic.stop : mic.start} aria-label="말하기">🎤</button>}
        <button type="button" className="nv-send" disabled={!v.trim() || busy} onClick={() => void send()} aria-label="보내기">➤</button>
      </div> : <p className="nv-fbmsg on">대화를 잘 마쳤어요! 👏</p>}
      {nextHint && !fin && <p className="nv-chathint">💡 <b>{nextHint}</b></p>}
    </div>
  );
}
void useMemo;
