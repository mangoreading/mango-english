import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../shared/supabase';
import { PageHead } from '../../shared/ui';

const WORD_STYLE = 'A single cute 3D glossy emoji-style icon of the object, soft rounded shapes, bright friendly colors, soft shading, centered, no text, no shadow on the ground, transparent background, no background elements, kids educational illustration.';
const SCENE_STYLE = 'Semi-flat digital storybook illustration in the style of a modern international English-language textbook animation: soft textured shading and subtle grain, clean smooth outlines, warm saturated colors with fresh greens and sky blues, large expressive round eyes, rosy cheeks, natural proportions of upper-elementary children, diverse international cast, detailed but uncluttered background, no text, no letters, no numbers.';
const SCENE_AVOID = 'text, letters, words, numbers, watermark, logo, Korean or East Asian setting, hanbok, Korean signs, manga style, anime style, chibi, realistic photo, 3D render, scary, dark, extra fingers, distorted faces, brand names';
/** 장면에 이름이 나오면 자동으로 들어가는 인물 (고쳐서 쓸 수 있고, 이 브라우저에 기억돼요) */
interface Char { name: string; desc: string }
/** 스타일 세트: 책(출판사·학년·Lesson)마다 화풍·인물·피할 것을 따로 저장해 두고 골라 쓴다 */
interface Prof { name: string; style: string; avoid: string; chars: Char[] }
const DEFAULT_CHARS: Char[] = [
  { name: 'Jun', desc: 'Cartoon boy about 11 years old, light-skinned, wavy dark brown hair with a side fringe, thin round glasses, navy blue puffer hoodie with white drawstrings, bright talkative smile' },
  { name: 'Mom', desc: 'Cartoon mother in her late 30s, light-skinned, shoulder-length wavy chestnut hair, olive green cardigan and jeans, calm kind expression' },
  { name: 'Clerk', desc: 'Cartoon shop clerk woman, medium-brown skin, dark curly hair tied back, coral apron with a blank name badge, friendly smile' },
  { name: 'Sam', desc: 'Cartoon boy about 11 years old, light-skinned, tousled brown hair, light blue button shirt, curious expression' },
  { name: 'Pablo', desc: 'Cartoon boy about 11 years old, tan skin, dark wavy hair, orange t-shirt, cheerful expression' },
];
const DEFAULT_PROF: Prof = { name: '비상 초5 영어 L9', style: SCENE_STYLE, avoid: SCENE_AVOID, chars: DEFAULT_CHARS };
type Preset = 'word' | 'scene' | 'free';
const PRESETS: Record<Preset, { name: string; style: string; size: string; bg: string }> = {
  word: { name: '단어 그림 (3D 아이콘)', style: WORD_STYLE, size: '300x300', bg: 'transparent' },
  scene: { name: '장면 이미지 (영상용)', style: SCENE_STYLE, size: '1280x720', bg: 'opaque' },
  free: { name: '자유', style: '', size: '1024x1024', bg: 'auto' },
};
interface Img { id: number; b64: string; name: string; saved?: string }
let uid = 0;

/* ----- 로컬 저장: 폴더를 한 번 고르면 기억(IndexedDB)해 두고 거기에 저장. 지원 안 되면 내려받기 ----- */
const hasDir = typeof (window as any).showDirectoryPicker === 'function'; // eslint-disable-line @typescript-eslint/no-explicit-any
function idb(): Promise<IDBDatabase> { return new Promise((res, rej) => { const r = indexedDB.open('mx-studio', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function kvGet(k: string): Promise<any> { try { const d = await idb(); return await new Promise((res) => { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(undefined); }); } catch { return undefined; } } // eslint-disable-line @typescript-eslint/no-explicit-any
async function kvSet(k: string, v: unknown) { try { const d = await idb(); d.transaction('kv', 'readwrite').objectStore('kv').put(v, k); } catch { /* 저장 못 해도 동작에는 문제 없음 */ } }
const toBlob = (b64: string) => new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], { type: 'image/png' });
const safe = (s: string) => (s.trim().replace(/[^\w\-.가-힣 ]+/g, '').replace(/\s+/g, '_') || 'image');

/** 업로드한 이미지를 변 1024px 이내 PNG(base64)로 줄인다 */
async function fileToB64(f: Blob): Promise<string> {
  const bmp = await createImageBitmap(f); const k = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  const url = c.toDataURL('image/png'); return url.slice(url.indexOf(',') + 1);
}

/** 작은 크기 선택지: OpenAI 가 지원하는 큰 크기로 만든 뒤 이 크기로 줄인다 (투명 배경 유지, 비율 유지하며 가운데 맞춤) */
const SMALL: Record<string, { api: string; w: number; h: number; crop?: boolean }> = {
  '200x200': { api: '1024x1024', w: 200, h: 200 },
  '300x300': { api: '1024x1024', w: 300, h: 300 },
  '768x512': { api: '1536x1024', w: 768, h: 512 },
  '512x768': { api: '1024x1536', w: 512, h: 768 },
  /** 16:9: 1536×1024 로 만든 뒤 위·아래를 잘라 맞춘다(장면 영상 화면 비율) */
  '1280x720': { api: '1536x1024', w: 1280, h: 720, crop: true },
  '768x432': { api: '1536x1024', w: 768, h: 432, crop: true },
};
async function shrinkTo(b64: string, w0: number, h0: number, crop = false): Promise<string> {
  const bmp = await createImageBitmap(toBlob(b64)); const c = document.createElement('canvas'); c.width = w0; c.height = h0;
  const k = (crop ? Math.max : Math.min)(w0 / bmp.width, h0 / bmp.height); const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
  c.getContext('2d')!.drawImage(bmp, Math.round((w0 - w) / 2), Math.round((h0 - h) / 2), w, h);
  const u = c.toDataURL('image/png'); return u.slice(u.indexOf(',') + 1);
}
/** 프리셋별 크기 선택지: 단어 그림은 정사각, 장면 이미지는 화면 비율(16:9 · 3:2 · 2:3)로 구분 */
const SIZES: Record<string, [string, string][]> = {
  word: [['200x200', '단어 그림 200×200'], ['300x300', '단어 그림 300×300']],
  scene: [['1280x720', '16:9 가로 1280×720 (위·아래가 잘려요)'], ['768x432', '16:9 가로 768×432 (위·아래가 잘려요)'], ['1536x1024', '3:2 가로 1536×1024'], ['768x512', '3:2 가로 768×512'], ['1024x1536', '2:3 세로 1024×1536'], ['512x768', '2:3 세로 512×768']],
  free: [['300x300', '300×300'], ['1024x1024', '정사각 1024×1024'], ['1280x720', '16:9 가로 1280×720'], ['1536x1024', '3:2 가로 1536×1024'], ['1024x1536', '2:3 세로 1024×1536']],
};
const apiSize = (s: string) => SMALL[s]?.api ?? s;
/** 16:9 로 자르는 크기는 위·아래가 잘리므로, 중요한 인물·물건이 가운데에 오도록 프롬프트에 덧붙인다 */
const WIDE_HINT = ' Wide 16:9 cinematic composition: keep faces, hands and key objects well inside the frame, away from the top and bottom edges.';
const withHint = (p: string, size: string) => (SMALL[size]?.crop ? p + WIDE_HINT : p);
const shrinkIf = (size: string, xs: string[]) => (SMALL[size] ? Promise.all(xs.map((x) => shrinkTo(x, SMALL[size].w, SMALL[size].h, SMALL[size].crop))) : Promise.resolve(xs));

export function Studio() {
  const [preset, setPreset] = useState<Preset>('word');
  const [style, setStyle] = useState(PRESETS.word.style);
  const [rows, setRows] = useState<{ en: string; ko: string }[]>(() => Array.from({ length: 6 }, () => ({ en: '', ko: '' })));
  const [prog, setProg] = useState('');
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState(PRESETS.word.size); const [bg, setBg] = useState(PRESETS.word.bg);
  const [quality, setQuality] = useState('medium'); const [n, setN] = useState(1);
  const [refs, setRefs] = useState<{ id: number; b64: string }[]>([]);
  const [refMode, setRefMode] = useState<'style' | 'edit'>('style'); // 장면 이미지: 참고 이미지를 '화풍만' 따라 할지, '이 그림을 고칠지'
  const [chars, setChars] = useState<Char[]>(DEFAULT_CHARS); const [avoid, setAvoid] = useState(SCENE_AVOID);
  const [profs, setProfs] = useState<Prof[]>([DEFAULT_PROF]); const [cur, setCur] = useState(DEFAULT_PROF.name); const [profLoaded, setProfLoaded] = useState(false); const [sceneStyle, setSceneStyle] = useState(SCENE_STYLE);
  const [imgs, setImgs] = useState<Img[]>([]);
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<{ t: 'ok' | 'err'; s: string } | null>(null);
  const [dir, setDir] = useState<any>(null); const [auto, setAuto] = useState(false); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [editId, setEditId] = useState<number | null>(null); const [oldT, setOldT] = useState(''); const [newT, setNewT] = useState(''); const [editExtra, setEditExtra] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { void kvGet('dir').then((h) => { if (h) setDir(h); }); void (async () => { const ps: Prof[] | undefined = await kvGet('profiles'); const c: string | undefined = await kvGet('profCur'); const list = Array.isArray(ps) && ps.length ? ps : [DEFAULT_PROF]; const pr = list.find((x) => x.name === c) ?? list[0]; setProfs(list); setCur(pr.name); setChars(pr.chars); setAvoid(pr.avoid); setSceneStyle(pr.style); setProfLoaded(true); })(); }, []);
  /** 화면에서 고친 장면 설정(스타일·인물·피할 것)을 지금 고른 세트에 자동 저장 */
  useEffect(() => { if (!profLoaded) return; setProfs((xs) => { const next = xs.map((x) => (x.name === cur ? { ...x, style: sceneStyle, avoid, chars } : x)); void kvSet('profiles', next); void kvSet('profCur', cur); return next; }); }, [sceneStyle, avoid, chars, cur, profLoaded]);
  function pickProf(name: string) { const pr = profs.find((x) => x.name === name); if (!pr) return; setCur(name); setChars(pr.chars); setAvoid(pr.avoid); setSceneStyle(pr.style); if (preset === 'scene') setStyle(pr.style); }
  function newProf() { const nm = (window.prompt('새 스타일 세트 이름 (예: 천재교육 초4 L3). 지금 내용을 복사해서 시작해요.') ?? '').trim(); if (!nm) return; if (profs.some((x) => x.name === nm)) { setMsg({ t: 'err', s: '같은 이름의 세트가 이미 있어요.' }); return; } setProfs((xs) => [...xs, { name: nm, style: sceneStyle, avoid, chars }]); setCur(nm); }
  function delProf() { if (profs.length < 2) { setMsg({ t: 'err', s: '세트는 하나 이상 있어야 해요.' }); return; } if (!window.confirm(`'${cur}' 세트를 지울까요?`)) return; const rest = profs.filter((x) => x.name !== cur); setProfs(rest); void kvSet('profiles', rest); pickProf(rest[0].name); }

  const saveChars = (next: Char[]) => setChars(next);
  function pickPreset(p: Preset) { setPreset(p); setStyle(p === 'scene' ? sceneStyle : PRESETS[p].style); setSize(PRESETS[p].size); setBg(PRESETS[p].bg); }

  async function chooseDir() {
    try { const h = await (window as any).showDirectoryPicker({ mode: 'readwrite' }); setDir(h); await kvSet('dir', h); setMsg({ t: 'ok', s: `저장 폴더: ${h.name}` }); } // eslint-disable-line @typescript-eslint/no-explicit-any
    catch { /* 취소 */ }
  }
  async function saveLocal(im: Img): Promise<boolean> {
    const name = safe(im.name) + '.png'; const blob = toBlob(im.b64);
    if (dir) {
      try {
        let perm = await dir.queryPermission?.({ mode: 'readwrite' });
        if (perm !== 'granted') perm = await dir.requestPermission?.({ mode: 'readwrite' });
        if (perm !== 'granted') throw new Error('폴더 쓰기 권한이 필요해요');
        const fh = await dir.getFileHandle(name, { create: true }); const w = await fh.createWritable(); await w.write(blob); await w.close();
        setImgs((xs) => xs.map((x) => (x.id === im.id ? { ...x, saved: `${dir.name}/${name}` } : x))); return true;
      } catch (e) { setMsg({ t: 'err', s: '폴더에 저장하지 못했어요: ' + (e as Error).message + ' → 내려받기로 저장할게요.' }); }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    setImgs((xs) => xs.map((x) => (x.id === im.id ? { ...x, saved: '내려받기: ' + name } : x))); return true;
  }

  async function call(body: Record<string, unknown>): Promise<string[] | null> {
    const { data, error } = await supabase.functions.invoke('gen-image', { body });
    if (error) { let m = error.message; try { const j = await (error as any).context?.json?.(); if (j?.error) m = j.error; } catch { /* 그대로 */ } setMsg({ t: 'err', s: m }); return null; } // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!data?.images?.length) { setMsg({ t: 'err', s: data?.error ?? '그림을 받지 못했어요' }); return null; }
    return data.images as string[];
  }
  function fullPrompt(w?: { en: string; ko: string }) {
    const obj = w?.en.trim() ? `Object: "${w.en.trim()}"${w.ko.trim() ? ` (${w.ko.trim()})` : ''}.` : '';
    return [style.trim(), obj, prompt.trim()].filter(Boolean).join(' ');
  }
  /** 장면 이미지: 한 줄 = 한 장면 ('파일이름 | 설명' 형식도 가능). 줄에 나온 이름의 인물을 자동으로 붙인다 */
  function sceneJobs(): { p: string; base: string }[] {
    return prompt.split('\n').map((l) => l.trim()).filter(Boolean).map((l, i) => {
      const k = l.indexOf('|'); const named = k > 0 && k < 40; const text = (named ? l.slice(k + 1) : l).trim(); const base = safe(named ? l.slice(0, k) : text.slice(0, 24) || 'scene' + (i + 1));
      const who = chars.filter((c) => c.name.trim() && new RegExp('\\b' + c.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(text));
      const rule = refs.length && refMode === 'style' ? 'Create ONE new illustration. The attached reference images are for ART STYLE ONLY (line quality, coloring, soft shading, face and eye design). Do NOT copy their scenes, backgrounds, buildings, objects, composition or people.\n\n' : '';
      const p = [rule + `SCENE (draw exactly this): ${text}`, who.length ? 'Show only these characters, no other people. CHARACTERS (keep consistent):\n' + who.map((c) => `- ${c.name}: ${c.desc}`).join('\n') : '', `STYLE: ${style.trim()}`, avoid.trim() ? `AVOID: ${avoid.trim()}` : ''].filter(Boolean).join('\n\n');
      return { p, base };
    });
  }
  async function generate() {
    const words = preset === 'word' ? rows.filter((r) => r.en.trim()) : [];
    if (preset === 'word' && !words.length) { setMsg({ t: 'err', s: '단어를 한 개 이상 입력해 주세요.' }); return; }
    if (preset === 'scene' && !sceneJobs().length) { setMsg({ t: 'err', s: '장면을 한 줄 이상 입력해 주세요.' }); return; }
    if (preset !== 'word' && preset !== 'scene' && !fullPrompt()) { setMsg({ t: 'err', s: '프롬프트를 입력해 주세요.' }); return; }
    setBusy(true); setMsg(null);
    const jobs: { p: string; base: string }[] = preset === 'word' ? words.map((w) => ({ p: fullPrompt(w), base: safe(w.en) })) : preset === 'scene' ? sceneJobs() : [{ p: fullPrompt(), base: safe(prompt.slice(0, 24) || 'image') }];
    let made = 0; let fail = 0;
    for (let j = 0; j < jobs.length; j++) {
      setProg(jobs.length > 1 ? `${j + 1}/${jobs.length} 만드는 중… (${jobs[j].base})` : '');
      let out = await call({ prompt: withHint(jobs[j].p, size), size: apiSize(size), quality, background: bg, n, refs: refs.map((r) => r.b64) });
      if (!out) { fail++; continue; }   // 오류 메시지는 call 이 이미 보여 줌. 남은 단어는 계속 만든다
      out = await shrinkIf(size, out);
      const add = out.map((b64, i) => ({ id: ++uid, b64, name: out!.length > 1 ? `${jobs[j].base}_${i + 1}` : jobs[j].base }));
      setImgs((xs) => [...add, ...xs]); made += add.length;
      if (auto) for (const m of add) await saveLocal(m);
    }
    setBusy(false); setProg('');
    if (made) setMsg({ t: fail ? 'err' : 'ok', s: `${made}장 만들었어요.` + (fail ? ` (${fail}건은 실패했어요. 위 오류를 확인해 주세요)` : '') });
  }
  async function editText(im: Img) {
    if (!newT.trim()) { setMsg({ t: 'err', s: '바꿀 글자를 입력해 주세요.' }); return; }
    const p = `Edit this image: ${oldT.trim() ? `replace the text "${oldT.trim()}" with "${newT.trim()}"` : `add the text "${newT.trim()}" where it fits`}. Spell the text exactly as given, same font style and position. Keep everything else in the image exactly the same.${editExtra.trim() ? ' ' + editExtra.trim() : ''}`;
    setBusy(true); setMsg(null);
    let out = await call({ prompt: withHint(p, size), size: apiSize(size), quality, background: 'auto', n: 1, refs: [im.b64] });
    if (out) out = await shrinkIf(size, out);
    setBusy(false); if (!out) return;
    const made = { id: ++uid, b64: out[0], name: im.name + '_edit' };
    setImgs((xs) => [made, ...xs]); setEditId(null); setMsg({ t: 'ok', s: '글자를 고친 새 이미지를 만들었어요. (원본은 그대로 있어요)' });
    if (auto) await saveLocal(made);
  }
  async function addRefs(fl: FileList | null) {
    if (!fl?.length) return; const add: { id: number; b64: string }[] = [];
    for (const f of Array.from(fl)) { if (refs.length + add.length >= 4) break; try { add.push({ id: ++uid, b64: await fileToB64(f) }); } catch { setMsg({ t: 'err', s: `${f.name} 을(를) 읽지 못했어요.` }); } }
    setRefs((xs) => [...xs, ...add]); if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <>
      <PageHead title="이미지/영상 제작" sub="단어 그림과 영상(장면)용 이미지를 만들어요. 참고 이미지를 올리면 그 그림을 바탕으로 만들고, 글자가 있는 그림은 글자만 고칠 수 있어요." />
      <div className="mx-grid" style={{ gridTemplateColumns: '1fr 1.3fr' }}>
        <div className="mx-card">
          <div className="mx-seg">{(Object.keys(PRESETS) as Preset[]).map((p) => <button key={p} className={preset === p ? 'on' : ''} onClick={() => pickPreset(p)}>{PRESETS[p].name}</button>)}</div>
          <label className="mx-f">스타일 문장 (그림 톤을 맞추는 고정 문장, 고쳐도 돼요)<textarea className="mx-st-ta" rows={5} value={style} onChange={(e) => { setStyle(e.target.value); if (preset === 'scene') setSceneStyle(e.target.value); }} /></label>
          {preset === 'word' && (
            <div className="mx-f">단어 (한 번에 여러 개 — 채운 줄만 만들어요)
              <table className="mx-st-words"><tbody>
                {rows.map((r, i) => (
                  <tr key={i}><td className="mx-muted">{i + 1}</td>
                    <td><input value={r.en} onChange={(e) => setRows((xs) => xs.map((x, k) => (k === i ? { ...x, en: e.target.value } : x)))} placeholder="영어 단어 (예: socks)" /></td>
                    <td><input value={r.ko} onChange={(e) => setRows((xs) => xs.map((x, k) => (k === i ? { ...x, ko: e.target.value } : x)))} placeholder="한글 뜻 (선택)" /></td>
                    <td><button className="mx-link" onClick={() => setRows((xs) => (xs.length > 1 ? xs.filter((_, k) => k !== i) : xs))} aria-label="줄 지우기">×</button></td></tr>))}
              </tbody></table>
              <div className="mx-row"><button className="mx-btn sec" onClick={() => setRows((xs) => [...xs, { en: '', ko: '' }])}>+ 행 추가</button><button className="mx-link" onClick={() => setRows(Array.from({ length: 6 }, () => ({ en: '', ko: '' })))}>모두 비우기</button></div>
            </div>)}
          {preset === 'scene' ? (
            <>
              <div className="mx-f">스타일 세트 (책·출판사마다 화풍·인물·피할 것을 따로 저장해요. 아래에서 고치면 이 세트에 자동 저장돼요)
                <div className="mx-row"><select value={cur} onChange={(e) => pickProf(e.target.value)}>{profs.map((x) => <option key={x.name}>{x.name}</option>)}</select><button className="mx-btn sec" onClick={newProf}>+ 새 세트 (지금 내용 복사)</button><button className="mx-link" onClick={delProf}>이 세트 지우기</button></div></div>
              <label className="mx-f">장면 (한 줄에 한 장면 — 여러 줄이면 한 번에 여러 장 만들어요. '파일이름 | 장면 설명' 형식도 돼요)
                <textarea className="mx-st-ta" rows={8} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={"예:\n1-8-1 | Jun and Mom walk in front of a clothing store. The setting is a clothing store, not a school.\n1-8-2 | The clerk greets Jun and Mom inside the shop."} /></label>
              <div className="mx-f">인물 (장면 줄에 이름이 나오면 그 인물 설명이 자동으로 붙어요 · 이 브라우저에 기억돼요)
                <table className="mx-st-words"><tbody>
                  {chars.map((c, i) => (
                    <tr key={i}><td style={{ width: 90 }}><input value={c.name} onChange={(e) => saveChars(chars.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} placeholder="이름" /></td>
                      <td><input value={c.desc} onChange={(e) => saveChars(chars.map((x, k) => (k === i ? { ...x, desc: e.target.value } : x)))} placeholder="외모 설명 (영어)" /></td>
                      <td><button className="mx-link" onClick={() => saveChars(chars.filter((_, k) => k !== i))} aria-label="인물 지우기">×</button></td></tr>))}
                </tbody></table>
                <div className="mx-row"><button className="mx-btn sec" onClick={() => saveChars([...chars, { name: '', desc: '' }])}>+ 인물 추가</button><button className="mx-link" onClick={() => saveChars(DEFAULT_CHARS)}>기본 인물로 되돌리기</button></div>
              </div>
              <label className="mx-f">피할 것 (네거티브)<textarea className="mx-st-ta" rows={2} value={avoid} onChange={(e) => setAvoid(e.target.value)} /></label>
            </>
          ) : (
            <label className="mx-f">프롬프트 {preset === 'word' ? '(추가 설명, 선택)' : '(만들 그림 설명)'}<textarea className="mx-st-ta" rows={5} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="예: 파란색 줄무늬 양말" /></label>
          )}
          <div className="mx-f">참고 이미지 (최대 4장){preset === 'scene' ? ' — 화풍 참고로 쓸지, 이 그림을 고칠지 아래에서 골라요' : ' — 올리면 이 그림을 바탕으로 만들어요'}
            {preset === 'scene' && refs.length > 0 && (
              <div className="mx-seg" style={{ marginTop: 6 }}>
                <button className={refMode === 'style' ? 'on' : ''} onClick={() => setRefMode('style')}>화풍만 참고 (장면은 새로)</button>
                <button className={refMode === 'edit' ? 'on' : ''} onClick={() => setRefMode('edit')}>이 그림을 고치기</button>
              </div>)}
            <div className="mx-row" style={{ marginTop: 6 }}>
              {refs.map((r) => <span key={r.id} className="mx-st-ref"><img src={'data:image/png;base64,' + r.b64} alt="참고" /><button onClick={() => setRefs((xs) => xs.filter((x) => x.id !== r.id))} aria-label="빼기">×</button></span>)}
              {refs.length < 4 && <button className="mx-btn sec" onClick={() => fileRef.current?.click()}>+ 올리기</button>}
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => void addRefs(e.target.files)} />
            </div></div>
          <div className="mx-row">
            <label className="mx-f">크기<select value={size} onChange={(e) => setSize(e.target.value)}>{(SIZES[preset] ?? SIZES.free).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
            <label className="mx-f">배경<select value={bg} onChange={(e) => setBg(e.target.value)}><option value="transparent">투명</option><option value="opaque">불투명</option><option value="auto">자동</option></select></label>
            <label className="mx-f">품질<select value={quality} onChange={(e) => setQuality(e.target.value)}><option value="low">낮음(저렴)</option><option value="medium">보통</option><option value="high">높음(비쌈)</option></select></label>
            <label className="mx-f">개수<select value={n} onChange={(e) => setN(Number(e.target.value))}>{[1, 2, 3, 4].map((v) => <option key={v}>{v}</option>)}</select></label>
          </div>
          <div className="mx-row" style={{ marginTop: 8 }}>
            <button className="mx-btn" disabled={busy} onClick={generate}>{busy ? (prog || '만드는 중… (30초 안팎)') : preset === 'word' ? `단어 ${rows.filter((r) => r.en.trim()).length}개 만들기` : preset === 'scene' ? `장면 ${prompt.split('\n').filter((l) => l.trim()).length}장 만들기` : refs.length ? '참고 이미지로 만들기' : '만들기'}</button>
            <span className="mx-muted">{refs.length ? (preset === 'scene' ? (refMode === 'style' ? '참고 이미지는 화풍만 따라 해요' : '참고 이미지를 바탕으로 고쳐요') : '참고 이미지 있음 → 수정/참고 모드') : ''}</span>
          </div>
          <div className="mx-card" style={{ marginTop: 12, background: '#fafafa' }}>
            <b>저장 위치 (내 컴퓨터)</b>
            <div className="mx-row" style={{ marginTop: 6 }}>
              {hasDir ? <><button className="mx-btn sec" onClick={chooseDir}>폴더 선택</button><span>{dir ? <b>{dir.name}</b> : <span className="mx-muted">선택 안 함 → 내려받기 폴더로 저장</span>}</span></>
                : <span className="mx-muted">이 브라우저는 폴더 선택을 지원하지 않아요(크롬/엣지에서 가능). 저장하면 내려받기 폴더로 저장돼요.</span>}
              <label className="mx-inline" style={{ whiteSpace: 'nowrap' }}><input type="checkbox" style={{ width: 'auto', padding: 0 }} checked={auto} onChange={(e) => setAuto(e.target.checked)} /> 만들면 자동 저장</label>
            </div>
          </div>
          {msg && <p className={msg.t === 'ok' ? 'mx-ok' : 'mx-err'}>{msg.s}</p>}
        </div>
        <div className="mx-card">
          <b>만든 이미지 {imgs.length}장</b> <span className="mx-muted">(이 화면을 닫으면 사라져요. 필요한 건 꼭 저장하세요)</span>
          <div className="mx-st-grid">
            {imgs.map((im) => (
              <div key={im.id} className="mx-st-card">
                <img src={'data:image/png;base64,' + im.b64} alt={im.name} />
                <input value={im.name} onChange={(e) => setImgs((xs) => xs.map((x) => (x.id === im.id ? { ...x, name: e.target.value } : x)))} aria-label="파일 이름" />
                <div className="mx-row">
                  <button className="mx-btn" onClick={() => saveLocal(im)}>저장</button>
                  <button className="mx-btn sec" onClick={() => { setEditId(editId === im.id ? null : im.id); setOldT(''); setNewT(''); }}>글자 수정</button>
                  <button className="mx-btn sec" disabled={refs.length >= 4} onClick={() => setRefs((xs) => [...xs, { id: ++uid, b64: im.b64 }])}>참고로 쓰기</button>
                </div>
                {im.saved && <span className="mx-ok">저장됨: {im.saved}</span>}
                {editId === im.id && (
                  <div className="mx-st-edit">
                    <input value={oldT} onChange={(e) => setOldT(e.target.value)} placeholder="지금 그림 속 글자 (비우면 새로 추가)" />
                    <input value={newT} onChange={(e) => setNewT(e.target.value)} placeholder="바꿀 글자 (예: 15,000 won)" />
                    <input value={editExtra} onChange={(e) => setEditExtra(e.target.value)} placeholder="추가 요청 (선택)" />
                    <button className="mx-btn" disabled={busy} onClick={() => editText(im)}>{busy ? '고치는 중…' : '이 글자로 고치기'}</button>
                    <span className="mx-muted">AI가 그림을 다시 그리므로 글자 외 부분이 조금 달라질 수 있어요. 원본은 남겨요.</span>
                  </div>)}
              </div>))}
          </div>
          {!imgs.length && <p className="mx-muted">왼쪽에서 프롬프트를 쓰고 "만들기"를 눌러 보세요.</p>}
        </div>
      </div>
    </>
  );
}
