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
type Preset = 'word' | 'scene' | 'unit' | 'free';
const PRESETS: Record<Preset, { name: string; style: string; size: string; bg: string }> = {
  word: { name: '단어 그림 (3D 아이콘)', style: WORD_STYLE, size: '300x300', bg: 'transparent' },
  scene: { name: '장면 이미지 (영상용)', style: SCENE_STYLE, size: '1280x720', bg: 'opaque' },
  unit: { name: '단원 단어·삽화 (DB)', style: WORD_STYLE, size: '300x300', bg: 'transparent' },
  free: { name: '자유', style: '', size: '1024x1024', bg: 'auto' },
};
interface Img { id: number; b64: string; name: string; saved?: string; applied?: string; up?: { kind: 'word' | 'illus'; key: string } }
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
  '600x600': { api: '1024x1024', w: 600, h: 600 },
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
  unit: [['300x300', '단어 300×300']],
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
  const [dir, setDir] = useState<any>(null); const [auto, setAuto] = useState(true); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [editId, setEditId] = useState<number | null>(null); const [oldT, setOldT] = useState(''); const [newT, setNewT] = useState(''); const [editExtra, setEditExtra] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { void kvGet('dir').then((h) => { if (h) setDir(h); }); void (async () => { const ps: Prof[] | undefined = await kvGet('profiles'); const c: string | undefined = await kvGet('profCur'); const list = Array.isArray(ps) && ps.length ? ps : [DEFAULT_PROF]; const pr = list.find((x) => x.name === c) ?? list[0]; setProfs(list); setCur(pr.name); setChars(pr.chars); setAvoid(pr.avoid); setSceneStyle(pr.style); setProfLoaded(true); })(); }, []);
  /** 화면에서 고친 장면 설정(스타일·인물·피할 것)을 지금 고른 세트에 자동 저장 */
  useEffect(() => { if (!profLoaded) return; setProfs((xs) => { const next = xs.map((x) => (x.name === cur ? { ...x, style: sceneStyle, avoid, chars } : x)); void kvSet('profiles', next); void kvSet('profCur', cur); return next; }); }, [sceneStyle, avoid, chars, cur, profLoaded]);
  function pickProf(name: string) { const pr = profs.find((x) => x.name === name); if (!pr) return; setCur(name); setChars(pr.chars); setAvoid(pr.avoid); setSceneStyle(pr.style); if (preset === 'scene') setStyle(pr.style); const da = dbArts.find((x) => x.name === name); if (da) void loadBaseRefs(da); }
  function newProf() { const nm = (window.prompt('새 스타일 세트 이름 (예: 천재교육 초4 L3). 지금 내용을 복사해서 시작해요.') ?? '').trim(); if (!nm) return; if (profs.some((x) => x.name === nm)) { setMsg({ t: 'err', s: '같은 이름의 세트가 이미 있어요.' }); return; } setProfs((xs) => [...xs, { name: nm, style: sceneStyle, avoid, chars }]); setCur(nm); }
  function delProf() { if (profs.length < 2) { setMsg({ t: 'err', s: '세트는 하나 이상 있어야 해요.' }); return; } if (!window.confirm(`'${cur}' 세트를 지울까요?`)) return; const rest = profs.filter((x) => x.name !== cur); setProfs(rest); void kvSet('profiles', rest); pickProf(rest[0].name); }

  const saveChars = (next: Char[]) => setChars(next);

  /* ----- DB 에 저장된 장면 프롬프트: Lesson·장면 활동을 고르면 불러오고, 고친 내용은 저장 ----- */
  interface DbStep { id: string; unit_id: string; book: string; label: string; n: number }
  interface DbArt { id: string; name: string; style: string; avoid: string; chars: Char[]; refs?: string[] }
  const [dbSteps, setDbSteps] = useState<DbStep[]>([]); const [dbArts, setDbArts] = useState<DbArt[]>([]); const [dbSel, setDbSel] = useState(''); const [dbBook, setDbBook] = useState(''); const [dbLoaded, setDbLoaded] = useState(false);
  const [dbRows, setDbRows] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  interface ScriptLine { who?: string; en: string; ko?: string }
  const [scripts, setScripts] = useState<Record<string, { title: string; scenes: ScriptLine[] }[]>>({}); // step_id → 학생에게 보이는 장면 스크립트(확인용)
  const [lessonChars, setLessonChars] = useState<Record<string, Char[]>>({}); // unit_id → 그 단원 전용 인물
  async function loadDb() {
    const st = await supabase.from('flow_steps').select('id,pos,name_ko,flow_lessons!inner(no,unit_id,units!inner(no,books(title,grade,publishers(name))))').in('kind', ['scene', 'scenerep']).not('flow_lessons.unit_id', 'is', null);
    const pr = await supabase.from('scene_prompts').select('*').order('seq'); const ar = await supabase.from('art_styles').select('*').order('name'); const lc = await supabase.from('lesson_chars').select('unit_id,chars');
    const stIds = ((st.data ?? []) as { id: string }[]).map((x) => x.id); const it = stIds.length ? await supabase.from('items').select('step_id,act_idx,payload').in('step_id', stIds).order('act_idx') : { data: [], error: null };
    if (it.error) setMsg({ t: 'err', s: '스크립트를 불러오지 못했어요: ' + it.error.message });
    const scm: Record<string, { title: string; scenes: ScriptLine[] }[]> = {}; for (const x of (it.data ?? []) as { step_id: string; payload: { title?: string; scenes?: ScriptLine[] } }[]) { if (Array.isArray(x.payload?.scenes)) (scm[x.step_id] ??= []).push({ title: x.payload.title ?? '', scenes: x.payload.scenes }); } setScripts(scm);
    if (st.error || pr.error || ar.error || lc.error) { setMsg({ t: 'err', s: 'DB 프롬프트를 불러오지 못했어요: ' + (st.error ?? pr.error ?? ar.error ?? lc.error)!.message }); return; }
    const lcm: Record<string, Char[]> = {}; for (const x of (lc.data ?? []) as { unit_id: string; chars: Char[] }[]) lcm[x.unit_id] = Array.isArray(x.chars) ? x.chars : []; setLessonChars(lcm);
    const rows = (pr.data ?? []) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    const list = ((st.data ?? []) as any[]).map((x) => { const l = x.flow_lessons; const u = l?.units; return { id: x.id as string, unit_id: l?.unit_id as string, t: u?.books ? `${u.books.publishers?.name ?? ''} 초${u.books.grade} 영어`.trim() : '', un: u?.no ?? 0, ln: l?.no ?? 0, pos: x.pos as number, name: x.name_ko as string, n: rows.filter((r) => r.step_id === x.id).length }; }) // eslint-disable-line @typescript-eslint/no-explicit-any
      .sort((a, b) => a.t.localeCompare(b.t) || a.un - b.un || a.ln - b.ln || a.pos - b.pos)
      .map((x) => ({ id: x.id, unit_id: x.unit_id, n: x.n, book: x.t || '(책 이름 없음)', label: `Lesson ${x.un} · ${x.ln}차시-${x.pos + 1} ${x.name}` }));
    setDbSteps(list); { const bs = Array.from(new Set(list.map((x) => x.book))); if (bs.length === 1) setDbBook((cur0) => cur0 || bs[0]); } setDbRows(rows); setDbArts((ar.data ?? []) as DbArt[]); setDbLoaded(true);
  }
  useEffect(() => { if (preset === 'scene' && !dbLoaded) void loadDb(); }, [preset, dbLoaded]); // eslint-disable-line react-hooks/exhaustive-deps
  function applyArt(a: DbArt) {
    const pr: Prof = { name: a.name, style: a.style, avoid: a.avoid, chars: Array.isArray(a.chars) ? a.chars : [] };
    setProfs((xs) => (xs.some((x) => x.name === a.name) ? xs.map((x) => (x.name === a.name ? pr : x)) : [...xs, pr]));
    setCur(a.name); setChars(pr.chars); setAvoid(pr.avoid); setSceneStyle(pr.style); setStyle(pr.style);
    void loadBaseRefs(a);
  }
  /** 스타일 세트에 저장된 기준 참고 이미지를 내려받아 참고 이미지 칸에 채운다 */
  async function loadBaseRefs(a: DbArt | undefined) {
    const paths = a?.refs ?? []; if (!paths.length) { setRefs([]); return; }
    const got: { id: number; b64: string }[] = [];
    for (const pa of paths.slice(0, 4)) { const d = await supabase.storage.from('art-refs').download(pa); if (d.error || !d.data) { setMsg({ t: 'err', s: '기준 이미지를 불러오지 못했어요: ' + (d.error?.message ?? pa) }); continue; } try { got.push({ id: ++uid, b64: await fileToB64(d.data) }); } catch { /* 건너뜀 */ } }
    setRefs(got);
  }
  async function saveBaseRefs() {
    if (!refs.length) { setMsg({ t: 'err', s: '저장할 참고 이미지를 먼저 올려 주세요.' }); return; }
    const a = await supabase.from('art_styles').upsert({ name: cur, style: sceneStyle, avoid }, { onConflict: 'name' }).select('id,refs').single();
    if (a.error) { setMsg({ t: 'err', s: '스타일 세트를 저장하지 못했어요: ' + a.error.message }); return; }
    const id = a.data.id as string; const oldPaths = (a.data.refs ?? []) as string[]; const paths: string[] = []; const t0 = Date.now();
    for (let i = 0; i < refs.length; i++) { const bin = atob(refs[i].b64); const u8 = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u8[k] = bin.charCodeAt(k); const pa = `${id}/${t0}-${i + 1}.png`; const up = await supabase.storage.from('art-refs').upload(pa, new Blob([u8], { type: 'image/png' }), { contentType: 'image/png' }); if (up.error) { setMsg({ t: 'err', s: '기준 이미지를 올리지 못했어요: ' + up.error.message }); return; } paths.push(pa); }
    const u2 = await supabase.from('art_styles').update({ refs: paths }).eq('id', id); if (u2.error) { setMsg({ t: 'err', s: '기준 이미지 경로를 저장하지 못했어요: ' + u2.error.message }); return; }
    if (oldPaths.length) await supabase.storage.from('art-refs').remove(oldPaths);
    setMsg({ t: 'ok', s: `스타일 세트 '${cur}'의 기준 이미지 ${paths.length}장을 저장했어요.` }); setDbLoaded(false);
  }
  function pickDb(id: string) {
    setDbSel(id); if (!id) return;
    const rows = dbRows.filter((r) => r.step_id === id).sort((a, b) => a.seq - b.seq);
    if (!rows.length) { setPrompt(''); setMsg({ t: 'ok', s: '이 활동에는 저장된 프롬프트가 아직 없어요. 아래 "장면" 칸에 쓰고 [DB에 저장]을 눌러 주세요.' }); return; }
    setPrompt(rows.map((r) => `${r.file_name ? r.file_name + ' | ' : ''}${r.prompt}`).join('\n'));
    const a = dbArts.find((x) => x.id === rows[0].style_id); if (a) applyArt(a);
    const stp = dbSteps.find((x) => x.id === id); const lc = stp ? lessonChars[stp.unit_id] : undefined; if (lc && lc.length) setChars(lc);
    setMsg({ t: 'ok', s: `프롬프트 ${rows.length}개를 불러왔어요.${a ? ` 스타일 세트: ${a.name}` : ''}` });
  }
  async function saveDb() {
    const stp = dbSteps.find((x) => x.id === dbSel); if (!stp) { setMsg({ t: 'err', s: '먼저 위에서 Lesson·장면 활동을 골라 주세요.' }); return; }
    const lines = prompt.split('\n').map((l) => l.trim()).filter(Boolean); if (!lines.length) { setMsg({ t: 'err', s: '저장할 장면이 없어요.' }); return; }
    const a = await supabase.from('art_styles').upsert({ name: cur, style: sceneStyle, avoid }, { onConflict: 'name' }).select('id').single();
    const lcu = await supabase.from('lesson_chars').upsert({ unit_id: stp.unit_id, chars, updated_at: new Date().toISOString() }, { onConflict: 'unit_id' }); if (lcu.error) { setMsg({ t: 'err', s: '이 Lesson의 인물을 저장하지 못했어요: ' + lcu.error.message }); return; }
    if (a.error) { setMsg({ t: 'err', s: '스타일 세트를 저장하지 못했어요: ' + a.error.message }); return; }
    const old = dbRows.filter((r) => r.step_id === dbSel);
    const rows = lines.map((l, i) => { const k = l.indexOf('|'); const named = k > 0 && k < 40; const o = old.find((r) => r.seq === i + 1); return { unit_id: stp.unit_id, step_id: dbSel, seq: i + 1, prompt: (named ? l.slice(k + 1) : l).trim(), file_name: named ? l.slice(0, k).trim() : o?.file_name ?? '', lines: o?.lines ?? '', desc_ko: o?.desc_ko ?? '', style_id: a.data.id }; });
    const up = await supabase.from('scene_prompts').upsert(rows, { onConflict: 'step_id,seq' }); if (up.error) { setMsg({ t: 'err', s: '프롬프트를 저장하지 못했어요: ' + up.error.message }); return; }
    if (old.length > rows.length) await supabase.from('scene_prompts').delete().eq('step_id', dbSel).gt('seq', rows.length);
    setMsg({ t: 'ok', s: `DB에 저장했어요 (프롬프트 ${rows.length}개 · 스타일 세트 ${cur} · 이 Lesson 인물 ${chars.length}명).` }); setDbLoaded(false);
  }
  const lineNums = (txt: string): number[] => { const nums: number[] = []; for (const part of String(txt ?? '').split(',')) { const m = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/); if (!m) continue; const a = Number(m[1]); const b = m[2] ? Number(m[2]) : a; for (let k = a; k <= b; k++) nums.push(k); } return nums; };
  /** 만든 이미지를 서버에 올리고, 고른 장면 활동 문항에서 그 장면의 대사 줄 그림 칸(pic)에 주소를 채운다 */
  async function applyImg(im: Img, quiet = false): Promise<boolean> {
    const fail = (t: string) => { setMsg({ t: 'err', s: t }); if (!quiet) setApplyRes({ t: 'err', s: t }); return false; };
    const stp = dbSteps.find((x) => x.id === dbSel); if (!stp) return fail('먼저 위 ① 불러오기에서 Lesson·장면 활동을 골라 주세요.');
    const base = im.name.replace(/_edit$/, '').replace(/_\d+$/, '');
    const row = dbRows.find((x) => x.step_id === dbSel && safe(String(x.file_name ?? '')) === base);
    if (!row) return fail(`이미지 이름 '${im.name}'이 이 활동의 장면 프롬프트 파일 이름과 맞지 않아요. (이름 끝의 _1, _edit은 무시해요)`);
    const nums = lineNums(row.lines); if (!nums.length) return fail(`장면 '${row.file_name}'에 연결된 대사 줄이 없어요.`);
    const it = await supabase.from('items').select('id,payload,version').eq('step_id', dbSel).order('act_idx');
    if (it.error) return fail('문항을 불러오지 못했어요: ' + it.error.message);
    const item = ((it.data ?? []) as { id: string; payload: { scenes?: { pic?: string }[] }; version: number }[]).find((x) => Array.isArray(x.payload?.scenes) && x.payload.scenes.length);
    if (!item) return fail('이 활동에 장면 문항이 없어요.');
    const sc = item.payload.scenes!; if (nums.some((n) => n > sc.length)) return fail(`대사 줄 ${row.lines}이(가) 스크립트 줄 수(${sc.length})를 넘어요.`);
    const bin = atob(im.b64); const u8 = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u8[k] = bin.charCodeAt(k);
    const path = `${stp.unit_id}/${base}-${Date.now()}.png`;
    const up = await supabase.storage.from('scene-images').upload(path, new Blob([u8], { type: 'image/png' }), { contentType: 'image/png' }); if (up.error) return fail('이미지를 올리지 못했어요: ' + up.error.message);
    const url = supabase.storage.from('scene-images').getPublicUrl(path).data.publicUrl;
    const next = { ...item.payload, scenes: sc.map((l, i) => (nums.includes(i + 1) ? { ...l, pic: url } : l)) };
    const u = await supabase.from('items').update({ payload: next, version: item.version + 1, updated_at: new Date().toISOString() }).eq('id', item.id); if (u.error) return fail('문항에 연결하지 못했어요: ' + u.error.message);
    setImgs((xs) => xs.map((x) => (x.id === im.id ? { ...x, applied: `대사 ${row.lines}` } : x)));
    if (!quiet) { const m = { t: 'ok' as const, s: `적용했어요: 대사 ${row.lines}에 이 그림이 연결됐어요. (문항 발행 후 학습앱에 반영돼요)` }; setMsg(m); setApplyRes(m); }
    return true;
  }
  /** 적용 결과를 이미지 목록 위(버튼 바로 아래)에 보여 준다 */
  const [applying, setApplying] = useState(''); const [applyRes, setApplyRes] = useState<{ t: 'ok' | 'err'; s: string } | null>(null);
  async function runApplyAll(label: string, todo: Img[], fn: (im: Img) => Promise<boolean>) {
    if (!todo.length) { setApplyRes({ t: 'err', s: imgs.length ? '새로 적용할 이미지가 없어요. (이미 적용했거나, 이 화면에서 만든 이미지가 아니에요)' : '적용할 이미지가 없어요.' }); return; }
    setApplyRes(null); let ok = 0; const fails: string[] = [];
    for (let i = 0; i < todo.length; i++) { setApplying(`적용 중… ${i + 1}/${todo.length}`); setMsg(null); if (await fn(todo[i])) ok++; else fails.push(todo[i].name); }
    setApplying('');
    setApplyRes(fails.length ? { t: 'err', s: `${label}: ${ok}장 적용, ${fails.length}장 실패 (${fails.join(', ')}). 실패 이유는 왼쪽 아래 빨간 글을 확인해 주세요.` } : { t: 'ok', s: `${label}: ${ok}장을 적용했어요. 각 이미지에 '단원에 적용됨'이 표시돼요. (문항 승인·발행 후 학습앱에 반영돼요)` });
  }
  async function applyAll() { await runApplyAll('장면 이미지', imgs.filter((x) => !x.applied), (im) => applyImg(im, true)); }
  /** 장면 프롬프트의 '대사 줄'(예: 1-3, 5-6) 기준으로 스크립트를 장면별로 묶는다. 어느 장면에도 없는 줄은 '그 밖의 대사'로 */
  function scriptGroups(stepId: string, sc: ScriptLine[]): { head: string; lines: (ScriptLine & { n: number })[] }[] {
    const rows = dbRows.filter((r) => r.step_id === stepId).sort((x, y) => x.seq - y.seq);
    const all = sc.map((l, i) => ({ ...l, n: i + 1 })); if (!rows.length) return [{ head: '대사 전체', lines: all }];
    const used = new Set<number>(); const out: { head: string; lines: (ScriptLine & { n: number })[] }[] = [];
    for (const r of rows) {
      const nums = lineNums(r.lines);
      const ls = all.filter((l) => nums.includes(l.n)); ls.forEach((l) => used.add(l.n));
      out.push({ head: `장면 ${r.seq}${r.file_name ? ' · ' + r.file_name : ''} (대사 ${r.lines || '-'})${r.desc_ko ? ' — ' + r.desc_ko : ''}`, lines: ls });
    }
    const rest = all.filter((l) => !used.has(l.n)); if (rest.length) out.push({ head: '그 밖의 대사 (장면에 연결 안 됨)', lines: rest });
    return out;
  }

  /* ----- 단원 단어·삽화: DB(image_prompts)의 프롬프트를 불러와 만들고, 단어는 vocab.image_path · 삽화는 문항 illus 에 적용 ----- */
  interface UpRow { kind: 'word' | 'illus'; key: string; en: string; ko: string; prompt: string; seq: number }
  const [upUnits, setUpUnits] = useState<{ id: string; label: string }[]>([]); const [upSel, setUpSel] = useState(''); const [upRows, setUpRows] = useState<UpRow[]>([]); const [upLoaded, setUpLoaded] = useState(false);
  async function loadUpUnits() {
    const r = await supabase.from('units').select('id,no,kind,books(title,grade,publishers(name))').eq('kind', 'lesson');
    if (r.error) { setMsg({ t: 'err', s: '단원 목록을 불러오지 못했어요: ' + r.error.message }); return; }
    const list = ((r.data ?? []) as any[]).map((u) => ({ id: u.id as string, no: u.no as number, t: u.books ? `${u.books.publishers?.name ?? ''} 초${u.books.grade} 영어`.trim() : '' })).sort((a, b) => a.t.localeCompare(b.t) || a.no - b.no); // eslint-disable-line @typescript-eslint/no-explicit-any
    setUpUnits(list.map((x) => ({ id: x.id, label: `${x.t} · Lesson ${x.no}` }))); setUpLoaded(true);
  }
  useEffect(() => { if (preset === 'unit' && !upLoaded) void loadUpUnits(); }, [preset, upLoaded]); // eslint-disable-line react-hooks/exhaustive-deps
  async function pickUp(id: string) {
    setUpSel(id); setUpRows([]); if (!id) return;
    const r = await supabase.from('image_prompts').select('kind,key,en,ko,prompt,seq').eq('unit_id', id).order('kind').order('seq');
    if (r.error) { setMsg({ t: 'err', s: '프롬프트를 불러오지 못했어요: ' + r.error.message }); return; }
    const rows = (r.data ?? []) as UpRow[]; setUpRows(rows);
    setMsg({ t: 'ok', s: rows.length ? `단어 ${rows.filter((x) => x.kind === 'word').length}개 · 삽화 ${rows.filter((x) => x.kind === 'illus').length}개를 불러왔어요.` : '이 단원에는 저장된 단어·삽화 프롬프트가 아직 없어요. 아래 [+ 단어]/[+ 삽화]로 추가하고 [DB에 저장]을 눌러 주세요.' });
  }
  async function saveUp() {
    if (!upSel) return;
    const rows = upRows.filter((x) => x.key.trim()).map((x, i) => ({ unit_id: upSel, kind: x.kind, key: x.key.trim(), en: x.en, ko: x.ko, prompt: x.prompt, seq: i + 1 }));
    const del = await supabase.from('image_prompts').delete().eq('unit_id', upSel); if (del.error) { setMsg({ t: 'err', s: '저장하지 못했어요: ' + del.error.message }); return; }
    if (rows.length) { const up = await supabase.from('image_prompts').insert(rows); if (up.error) { setMsg({ t: 'err', s: '저장하지 못했어요: ' + up.error.message }); return; } }
    setMsg({ t: 'ok', s: `DB에 저장했어요 (${rows.length}개).` });
  }
  const upPrompt = (r: UpRow) => (r.kind === 'word'
    ? [WORD_STYLE, r.en.trim() ? `Object: "${r.en.trim()}"${r.ko.trim() ? ` (${r.ko.trim()})` : ''}.` : '', r.prompt.trim()].filter(Boolean).join(' ')
    : [WORD_STYLE.replace('of the object', 'of the subject'), r.prompt.trim()].filter(Boolean).join(' '));
  async function generateUp(only?: UpRow) {
    const todo = only ? [only] : upRows.filter((x) => x.key.trim()); if (!todo.length) { setMsg({ t: 'err', s: '만들 항목이 없어요.' }); return; }
    setBusy(true); setMsg(null); let made = 0, fail = 0;
    for (let j = 0; j < todo.length; j++) {
      const r = todo[j]; setProg(todo.length > 1 ? `${j + 1}/${todo.length} 만드는 중… (${r.key})` : '');
      const sz = r.kind === 'word' ? '300x300' : '600x600';
      let out = await call({ prompt: upPrompt(r), size: apiSize(sz), quality, background: 'transparent', n: 1, refs: [] });
      if (!out) { fail++; continue; }
      out = await shrinkIf(sz, out);
      const im: Img = { id: ++uid, b64: out[0], name: `${r.kind}-${safe(r.key)}`, up: { kind: r.kind, key: r.key.trim() } };
      setImgs((xs) => [im, ...xs]); made++; if (auto) await saveLocal(im);
    }
    setBusy(false); setProg(''); if (made) setMsg({ t: fail ? 'err' : 'ok', s: `${made}장 만들었어요.` + (fail ? ` (${fail}건 실패)` : '') });
  }
  /** 만든 그림을 올리고 단어는 vocab.image_path, 삽화는 이 단원 문항의 illus(파일 이름이 key 와 같은 것)에 연결한다 */
  async function applyUp(im: Img, quiet = false): Promise<boolean> {
    const fail = (t: string) => { setMsg({ t: 'err', s: t }); if (!quiet) setApplyRes({ t: 'err', s: t }); return false; };
    if (!im.up) return fail('이 이미지는 단원 단어·삽화로 만든 것이 아니에요.'); if (!upSel) return fail('먼저 단원을 골라 주세요.');
    const bin = atob(im.b64); const u8 = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u8[k] = bin.charCodeAt(k);
    const path = `${upSel}/${im.up.kind}-${safe(im.up.key)}-${Date.now()}.png`;
    const upl = await supabase.storage.from('scene-images').upload(path, new Blob([u8], { type: 'image/png' }), { contentType: 'image/png' }); if (upl.error) return fail('이미지를 올리지 못했어요: ' + upl.error.message);
    const url = supabase.storage.from('scene-images').getPublicUrl(path).data.publicUrl;
    let label = '';
    if (im.up.kind === 'word') {
      const v = await supabase.from('vocab').update({ image_path: url }).eq('key', im.up.key).select('key'); if (v.error) return fail('단어에 연결하지 못했어요: ' + v.error.message);
      if (!v.data?.length) return fail(`vocab 에 '${im.up.key}' 단어가 없어요.`); label = `단어 ${im.up.key}`;
    } else {
      const it = await supabase.from('items').select('id,payload,version').eq('unit_id', upSel); if (it.error) return fail('문항을 불러오지 못했어요: ' + it.error.message);
      const re = new RegExp('(^|/)' + im.up.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(-\\d+)?\\.png$');
      const hit = ((it.data ?? []) as { id: string; payload: { illus?: string }; version: number }[]).filter((x) => typeof x.payload?.illus === 'string' && re.test(x.payload.illus));
      if (!hit.length) return fail(`문항 중 삽화 칸(illus)이 '${im.up.key}.png' 인 것이 없어요. 문항 편집에서 삽화 칸에 illus/${im.up.key}.png 를 먼저 넣어 주세요.`);
      for (const x of hit) { const u = await supabase.from('items').update({ payload: { ...x.payload, illus: url }, version: x.version + 1, updated_at: new Date().toISOString() }).eq('id', x.id); if (u.error) return fail('문항에 연결하지 못했어요: ' + u.error.message); }
      label = `삽화 ${im.up.key} → 문항 ${hit.length}개`;
    }
    setImgs((xs) => xs.map((x) => (x.id === im.id ? { ...x, applied: label } : x)));
    if (!quiet) { const m = { t: 'ok' as const, s: `적용했어요: ${label}. (문항 승인·발행 후 학습앱에 반영돼요)` }; setMsg(m); setApplyRes(m); }
    return true;
  }
  async function applyAllUp() { await runApplyAll('단원 단어·삽화', imgs.filter((x) => x.up && !x.applied), (im) => applyUp(im, true)); }
  function clearAll() {
    const unsaved = imgs.filter((x) => !x.saved).length;
    if (!window.confirm(unsaved ? `저장하지 않은 이미지가 ${unsaved}장 있어요. 그래도 ${imgs.length}장을 모두 지울까요?` : `만든 이미지 ${imgs.length}장을 모두 지울까요? (저장된 파일은 그대로 있어요)`)) return;
    setImgs([]); setEditId(null);
  }
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

  const refBlock = (
          <div className="mx-f">참고 이미지 (최대 4장){preset === 'scene' ? ' — 스타일 세트의 기준 이미지가 자동으로 붙어요(배경이 단순한 인물·화풍 샘플 권장)' : ' — 올리면 이 그림을 바탕으로 만들어요'}
            {preset === 'scene' && refs.length > 0 && (
              <div className="mx-seg" style={{ marginTop: 6 }}>
                <button className={refMode === 'style' ? 'on' : ''} onClick={() => setRefMode('style')}>화풍만 참고 (장면은 새로)</button>
                <button className={refMode === 'edit' ? 'on' : ''} onClick={() => setRefMode('edit')}>이 그림을 고치기</button>
              </div>)}
            {preset === 'scene' && <div className="mx-row" style={{ marginTop: 6 }}><span className="mx-muted">스타일 세트 '{cur}' 기준 이미지: {dbArts.find((x) => x.name === cur)?.refs?.length ?? 0}장 저장됨</span>
              <button className="mx-btn sec" disabled={!refs.length} onClick={saveBaseRefs}>지금 이미지를 기준으로 저장</button>
              <button className="mx-btn sec" disabled={!dbArts.find((x) => x.name === cur)?.refs?.length} onClick={() => void loadBaseRefs(dbArts.find((x) => x.name === cur))}>기준 이미지 불러오기</button></div>}
            <div className="mx-row" style={{ marginTop: 6 }}>
              {refs.map((r) => <span key={r.id} className="mx-st-ref"><img src={'data:image/png;base64,' + r.b64} alt="참고" /><button onClick={() => setRefs((xs) => xs.filter((x) => x.id !== r.id))} aria-label="빼기">×</button></span>)}
              {refs.length < 4 && <button className="mx-btn sec" onClick={() => fileRef.current?.click()}>+ 올리기</button>}
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => void addRefs(e.target.files)} />
            </div></div>
  );
  const optBlock = (
          <div className="mx-row">
            <label className="mx-f">크기<select value={size} onChange={(e) => setSize(e.target.value)}>{(SIZES[preset] ?? SIZES.free).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
            <label className="mx-f">배경<select value={bg} onChange={(e) => setBg(e.target.value)}><option value="transparent">투명</option><option value="opaque">불투명</option><option value="auto">자동</option></select></label>
            <label className="mx-f">품질<select value={quality} onChange={(e) => setQuality(e.target.value)}><option value="low">낮음(저렴)</option><option value="medium">보통</option><option value="high">높음(비쌈)</option></select></label>
            <label className="mx-f">개수<select value={n} onChange={(e) => setN(Number(e.target.value))}>{[1, 2, 3, 4].map((v) => <option key={v}>{v}</option>)}</select></label>
          </div>
  );
  const genBlock = (
          <div className="mx-row" style={{ marginTop: 8 }}>
            <button className="mx-btn" disabled={busy} onClick={generate}>{busy ? (prog || '만드는 중… (30초 안팎)') : preset === 'word' ? `단어 ${rows.filter((r) => r.en.trim()).length}개 만들기` : preset === 'scene' ? `장면 ${prompt.split('\n').filter((l) => l.trim()).length}장 만들기` : refs.length ? '참고 이미지로 만들기' : '만들기'}</button>
            <span className="mx-muted">{refs.length ? (preset === 'scene' ? (refMode === 'style' ? '참고 이미지는 화풍만 따라 해요' : '참고 이미지를 바탕으로 고쳐요') : '참고 이미지 있음 → 수정/참고 모드') : ''}</span>
          </div>
  );
  const saveInner = (
    <>
            <div className="mx-row" style={{ marginTop: 6 }}>
              {hasDir ? <><button className="mx-btn sec" onClick={chooseDir}>폴더 선택</button><span>{dir ? <b>{dir.name}</b> : <span className="mx-muted">선택 안 함 → 내려받기 폴더로 저장</span>}</span></>
                : <span className="mx-muted">이 브라우저는 폴더 선택을 지원하지 않아요(크롬/엣지에서 가능). 저장하면 내려받기 폴더로 저장돼요.</span>}
              <label className="mx-inline" style={{ whiteSpace: 'nowrap' }}><input type="checkbox" style={{ width: 'auto', padding: 0 }} checked={auto} onChange={(e) => setAuto(e.target.checked)} /> 만들면 자동 저장</label>
            </div>
    </>
  );
  return (
    <>
      <PageHead title="이미지/영상 제작" sub="단어 그림과 영상(장면)용 이미지를 만들어요. 참고 이미지를 올리면 그 그림을 바탕으로 만들고, 글자가 있는 그림은 글자만 고칠 수 있어요." />
      <div className="mx-grid" style={{ gridTemplateColumns: '1fr 1.3fr' }}>
        <div className="mx-card">
          <div className="mx-seg">{(Object.keys(PRESETS) as Preset[]).map((p) => <button key={p} className={preset === p ? 'on' : ''} onClick={() => pickPreset(p)}>{PRESETS[p].name}</button>)}</div>
          {preset !== 'scene' && preset !== 'unit' && <label className="mx-f">스타일 문장 (그림 톤을 맞추는 고정 문장, 고쳐도 돼요)<textarea className="mx-st-ta" rows={5} value={style} onChange={(e) => setStyle(e.target.value)} /></label>}
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
              <section className="mx-sc">
                <h3><i>1</i>불러오기</h3>
                <div className="mx-sc-r"><span className="mx-sc-l">책</span>
                  <select value={dbBook} onChange={(e) => { setDbBook(e.target.value); setDbSel(''); }}><option value="">책 선택…</option>{Array.from(new Set(dbSteps.map((x) => x.book))).map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                <div className="mx-sc-r"><span className="mx-sc-l">Lesson·활동</span>
                  <select value={dbSel} disabled={!dbBook} onChange={(e) => pickDb(e.target.value)}><option value="">{dbBook ? 'Lesson·활동 선택… (프롬프트·스타일 세트가 자동으로 채워져요)' : '먼저 책을 고르세요'}</option>{dbSteps.filter((x) => x.book === dbBook).map((x) => <option key={x.id} value={x.id}>{x.label}{x.n ? ` (프롬프트 ${x.n}개)` : ' (없음)'}</option>)}</select>
                  <button className="mx-btn sec" disabled={!dbSel} onClick={saveDb}>DB에 저장</button></div>
                <div className="mx-sc-r"><span className="mx-sc-l">스타일 세트</span>
                  <select value={cur} onChange={(e) => pickProf(e.target.value)}>{profs.map((x) => <option key={x.name}>{x.name}</option>)}</select>
                  <button className="mx-btn sec" onClick={newProf}>+ 새 세트</button><button className="mx-link" onClick={delProf}>지우기</button></div>
              </section>
              <section className="mx-sc">
                <details className="mx-fold" open>
                  <summary><i className="mx-num">2</i>스크립트 <span className="mx-muted">학생에게 보이는 영문 대사 · 확인용 (프롬프트에는 쓰이지 않아요)</span></summary>
                {!dbSel ? <p className="mx-muted" style={{ margin: 0 }}>위에서 Lesson·활동을 고르면 스크립트가 보여요.</p>
                  : !(scripts[dbSel]?.length) ? <p className="mx-muted" style={{ margin: 0 }}>이 활동에 등록된 스크립트가 없어요.</p>
                    : scripts[dbSel].map((sc, k) => (
                      <div key={k} className="mx-script">
                        {sc.title && <b>{sc.title}</b>}
                        {scriptGroups(dbSel, sc.scenes).map((g, gi) => (
                          <div key={gi} className="mx-script-g">
                            <div className="mx-script-h">{g.head}</div>
                            <ol>{g.lines.map((l) => <li key={l.n} value={l.n}>{l.who && <span className="mx-script-who">{l.who}</span>}{l.en}</li>)}</ol>
                          </div>))}
                      </div>))}
              </details>
              </section>
              <section className="mx-sc">
                <h3><i>3</i>장면 <span className="mx-muted">한 줄 = 한 장면 · '파일이름 | 설명' 형식 가능</span></h3>
                <textarea className="mx-st-ta" rows={9} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={"예:\n1-8-1 | Jun and Mom walk in front of a clothing store. The setting is a clothing store, not a school.\n1-8-2 | The clerk greets Jun and Mom inside the shop."} />
              </section>
              <section className="mx-sc">
                <h3><i>4</i>화풍·인물 <span className="mx-muted">화풍은 스타일 세트(책 단위), 인물은 Lesson 단위로 [DB에 저장]돼요</span></h3>
                <details className="mx-fold">
                  <summary>화풍 (스타일 문장 · 피할 것)</summary>
                  <label className="mx-f">스타일 문장<textarea className="mx-st-ta" rows={5} value={style} onChange={(e) => { setStyle(e.target.value); setSceneStyle(e.target.value); }} /></label>
                  <label className="mx-f">피할 것 (네거티브)<textarea className="mx-st-ta" rows={2} value={avoid} onChange={(e) => setAvoid(e.target.value)} /></label>
                </details>
                <details className="mx-fold">
                  <summary>등장인물 (이 Lesson) {chars.length}명 <span className="mx-muted">{chars.map((c) => c.name).filter(Boolean).join(', ')}</span></summary>
                  <p className="mx-muted" style={{ margin: '4px 0 6px' }}>장면 줄에 이름이 나오면 그 인물 설명이 자동으로 붙어요.</p>
                  <table className="mx-st-words"><tbody>
                    {chars.map((c, i) => (
                      <tr key={i}><td style={{ width: 90 }}><input value={c.name} onChange={(e) => saveChars(chars.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} placeholder="이름" /></td>
                        <td><input value={c.desc} onChange={(e) => saveChars(chars.map((x, k) => (k === i ? { ...x, desc: e.target.value } : x)))} placeholder="외모 설명 (영어)" /></td>
                        <td><button className="mx-link" onClick={() => saveChars(chars.filter((_, k) => k !== i))} aria-label="인물 지우기">×</button></td></tr>))}
                  </tbody></table>
                  <div className="mx-row" style={{ marginTop: 6 }}><button className="mx-btn sec" onClick={() => saveChars([...chars, { name: '', desc: '' }])}>+ 인물 추가</button><button className="mx-link" onClick={() => saveChars(DEFAULT_CHARS)}>기본 인물로 되돌리기</button></div>
                </details>
                <details className="mx-fold">
                  <summary>참고 이미지 {refs.length}장 <span className="mx-muted">스타일 세트 기준 이미지 · 배경이 단순한 인물/화풍 샘플 권장</span></summary>
                  {refBlock}
                </details>
              </section>
              <section className="mx-sc">
                <h3><i>5</i>이미지 크기</h3>
                {optBlock}
              </section>
              <section className="mx-sc">
                <h3><i>6</i>저장 위치 <span className="mx-muted">내 컴퓨터</span></h3>
                {saveInner}
              </section>
              <div className="mx-sc-go">{genBlock}</div>
            </>
          ) : preset === 'unit' ? (
            <>
              <section className="mx-sc">
                <h3><i>1</i>단원 고르기 <span className="mx-muted">프롬프트는 DB에 있어요. 단어 그림은 단어(vocab)에, 삽화는 문항의 삽화 칸에 적용돼요</span></h3>
                <div className="mx-sc-r"><span className="mx-sc-l">단원</span>
                  <select value={upSel} onChange={(e) => void pickUp(e.target.value)}><option value="">단원 선택…</option>{upUnits.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
                  <button className="mx-btn sec" disabled={!upSel} onClick={saveUp}>DB에 저장</button></div>
              </section>
              <section className="mx-sc">
                <h3><i>2</i>단어·삽화 목록 <span className="mx-muted">단어: 키(vocab key)·영어·한글 / 삽화: 파일 이름(예: l9-5-cat-hat)·설명</span></h3>
                {!upSel ? <p className="mx-muted" style={{ margin: 0 }}>위에서 단원을 고르면 목록이 보여요.</p> : (
                  <table className="mx-st-words"><tbody>
                    {upRows.map((r, i) => (
                      <tr key={i}><td className="mx-muted">{r.kind === 'word' ? '단어' : '삽화'}</td>
                        <td><input value={r.key} onChange={(e) => setUpRows((xs) => xs.map((x, k) => (k === i ? { ...x, key: e.target.value } : x)))} placeholder={r.kind === 'word' ? 'key (예: socks)' : '파일 이름'} /></td>
                        {r.kind === 'word' && <td><input value={r.en} onChange={(e) => setUpRows((xs) => xs.map((x, k) => (k === i ? { ...x, en: e.target.value } : x)))} placeholder="영어" /></td>}
                        {r.kind === 'word' && <td><input value={r.ko} onChange={(e) => setUpRows((xs) => xs.map((x, k) => (k === i ? { ...x, ko: e.target.value } : x)))} placeholder="한글" /></td>}
                        <td colSpan={r.kind === 'word' ? 1 : 2}><input value={r.prompt} onChange={(e) => setUpRows((xs) => xs.map((x, k) => (k === i ? { ...x, prompt: e.target.value } : x)))} placeholder={r.kind === 'word' ? '추가 설명(선택)' : '그림 설명 (영어)'} /></td>
                        <td><button className="mx-btn sec" disabled={busy} onClick={() => void generateUp(r)}>만들기</button> <button className="mx-link" onClick={() => setUpRows((xs) => xs.filter((_, k) => k !== i))} aria-label="지우기">×</button></td></tr>))}
                  </tbody></table>)}
                <div className="mx-row" style={{ marginTop: 6 }}><button className="mx-btn sec" disabled={!upSel} onClick={() => setUpRows((xs) => [...xs, { kind: 'word', key: '', en: '', ko: '', prompt: '', seq: xs.length + 1 }])}>+ 단어</button><button className="mx-btn sec" disabled={!upSel} onClick={() => setUpRows((xs) => [...xs, { kind: 'illus', key: '', en: '', ko: '', prompt: '', seq: xs.length + 1 }])}>+ 삽화</button></div>
              </section>
              <section className="mx-sc">
                <h3><i>3</i>만들기 <span className="mx-muted">단어 300×300 · 삽화 600×600 · 투명 배경</span></h3>
                <div className="mx-row"><label className="mx-f">품질<select value={quality} onChange={(e) => setQuality(e.target.value)}><option value="low">낮음(저렴)</option><option value="medium">보통</option><option value="high">높음(비쌈)</option></select></label></div>
                <div className="mx-row" style={{ marginTop: 8 }}><button className="mx-btn" disabled={busy || !upSel} onClick={() => void generateUp()}>{busy ? (prog || '만드는 중…') : `전부 ${upRows.filter((x) => x.key.trim()).length}장 만들기`}</button></div>
                {saveInner}
              </section>
            </>
          ) : (
            <label className="mx-f">프롬프트 {preset === 'word' ? '(추가 설명, 선택)' : '(만들 그림 설명)'}<textarea className="mx-st-ta" rows={5} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="예: 파란색 줄무늬 양말" /></label>
          )}
          {preset !== 'scene' && preset !== 'unit' && <>
            {refBlock}
            {optBlock}
            {genBlock}
            <div className="mx-card" style={{ marginTop: 12, background: '#fafafa' }}><b>저장 위치 (내 컴퓨터)</b><div style={{ marginTop: 6 }}>{saveInner}</div></div>
          </>}
          {msg && <p className={msg.t === 'ok' ? 'mx-ok' : 'mx-err'}>{msg.s}</p>}
        </div>
        <div className="mx-card">
          <div className="mx-row" style={{ justifyContent: 'space-between' }}>
            <span><b>만든 이미지 {imgs.length}장</b> <span className="mx-muted">(이 화면을 닫으면 사라져요. 필요한 건 꼭 저장하세요)</span></span>
            {imgs.length > 0 && <span className="mx-row">{preset === 'unit' && <button className="mx-btn" disabled={!upSel || !!applying} onClick={applyAllUp}>{applying || '모두 이 단원에 적용'}</button>}{preset === 'scene' && <button className="mx-btn" disabled={!dbSel || !!applying} onClick={applyAll}>{applying || '모두 이 단원에 적용'}</button>}<button className="mx-btn sec" onClick={clearAll}>모두 지우기</button></span>}
          </div>
          {imgs.length > 0 && ((preset === 'scene' && !dbSel) || (preset === 'unit' && !upSel)) && <p className="mx-muted" style={{ margin: '6px 0 0' }}>적용하려면 왼쪽에서 {preset === 'scene' ? "① 불러오기의 Lesson·활동" : '단원'}을 먼저 고르세요.</p>}
          {applying && <p className="mx-muted" style={{ margin: '6px 0 0' }}>{applying} (닫지 말고 기다려 주세요)</p>}
          {applyRes && <p className={applyRes.t === 'ok' ? 'mx-ok' : 'mx-err'} style={{ margin: '6px 0 0' }}>{applyRes.s}</p>}
          <div className="mx-st-grid">
            {imgs.map((im) => (
              <div key={im.id} className="mx-st-card">
                <img src={'data:image/png;base64,' + im.b64} alt={im.name} />
                <input value={im.name} onChange={(e) => setImgs((xs) => xs.map((x) => (x.id === im.id ? { ...x, name: e.target.value } : x)))} aria-label="파일 이름" />
                <div className="mx-row">
                  <button className="mx-btn" onClick={() => saveLocal(im)}>저장</button>
                  <button className="mx-btn sec" onClick={() => { setEditId(editId === im.id ? null : im.id); setOldT(''); setNewT(''); }}>글자 수정</button>
                  {preset === 'scene' && <button className="mx-btn sec" disabled={!dbSel} onClick={() => void applyImg(im)}>이 단원에 적용</button>}
                  {im.up && <button className="mx-btn sec" disabled={!upSel} onClick={() => void applyUp(im)}>이 단원에 적용</button>}
                  <button className="mx-link" onClick={() => setImgs((xs) => xs.filter((x) => x.id !== im.id))} aria-label="이 이미지 지우기">지우기</button>
                  <button className="mx-btn sec" disabled={refs.length >= 4} onClick={() => setRefs((xs) => [...xs, { id: ++uid, b64: im.b64 }])}>참고로 쓰기</button>
                </div>
                {im.saved && <span className="mx-ok">저장됨: {im.saved}</span>}
                {im.applied && <span className="mx-ok">단원에 적용됨: {im.applied}</span>}
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
