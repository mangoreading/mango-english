import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../shared/supabase';
import { PageHead } from '../../shared/ui';

const WORD_STYLE = 'A single cute 3D glossy emoji-style icon of the object, soft rounded shapes, bright friendly colors, soft shading, centered, no text, no shadow on the ground, transparent background, no background elements, kids educational illustration.';
const SCENE_STYLE = 'A bright, friendly children\'s picture-book illustration for an English lesson, flat soft colors, rounded shapes, clean composition, consistent characters, no text unless asked.';
type Preset = 'word' | 'scene' | 'free';
const PRESETS: Record<Preset, { name: string; style: string; size: string; bg: string }> = {
  word: { name: '단어 그림 (3D 아이콘)', style: WORD_STYLE, size: '1024x1024', bg: 'transparent' },
  scene: { name: '장면 이미지 (영상용)', style: SCENE_STYLE, size: '1536x1024', bg: 'opaque' },
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

/** 300×300 으로 줄인다 (투명 배경 유지, 비율 유지하며 가운데 맞춤) */
async function shrink300(b64: string): Promise<string> {
  const bmp = await createImageBitmap(toBlob(b64)); const c = document.createElement('canvas'); c.width = 300; c.height = 300;
  const k = Math.min(300 / bmp.width, 300 / bmp.height); const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
  c.getContext('2d')!.drawImage(bmp, Math.round((300 - w) / 2), Math.round((300 - h) / 2), w, h);
  const u = c.toDataURL('image/png'); return u.slice(u.indexOf(',') + 1);
}
const apiSize = (s: string) => (s === '300x300' ? '1024x1024' : s);

export function Studio() {
  const [preset, setPreset] = useState<Preset>('word');
  const [style, setStyle] = useState(PRESETS.word.style);
  const [word, setWord] = useState(''); const [ko, setKo] = useState('');
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState(PRESETS.word.size); const [bg, setBg] = useState(PRESETS.word.bg);
  const [quality, setQuality] = useState('medium'); const [n, setN] = useState(1);
  const [refs, setRefs] = useState<{ id: number; b64: string }[]>([]);
  const [imgs, setImgs] = useState<Img[]>([]);
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<{ t: 'ok' | 'err'; s: string } | null>(null);
  const [dir, setDir] = useState<any>(null); const [auto, setAuto] = useState(false); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [editId, setEditId] = useState<number | null>(null); const [oldT, setOldT] = useState(''); const [newT, setNewT] = useState(''); const [editExtra, setEditExtra] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { void kvGet('dir').then((h) => { if (h) setDir(h); }); }, []);
  function pickPreset(p: Preset) { setPreset(p); setStyle(PRESETS[p].style); setSize(PRESETS[p].size); setBg(PRESETS[p].bg); }

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
  function fullPrompt() {
    const obj = word.trim() ? `Object: "${word.trim()}"${ko.trim() ? ` (${ko.trim()})` : ''}.` : '';
    return [style.trim(), obj, prompt.trim()].filter(Boolean).join(' ');
  }
  async function generate() {
    const p = fullPrompt(); if (!p) { setMsg({ t: 'err', s: '프롬프트(또는 단어)를 입력해 주세요.' }); return; }
    setBusy(true); setMsg(null);
    let out = await call({ prompt: p, size: apiSize(size), quality, background: bg, n, refs: refs.map((r) => r.b64) });
    if (out && size === '300x300') out = await Promise.all(out.map(shrink300));
    setBusy(false); if (!out) return;
    const base = safe(word || prompt.slice(0, 24) || 'image');
    const made = out.map((b64, i) => ({ id: ++uid, b64, name: out.length > 1 ? `${base}_${i + 1}` : base }));
    setImgs((xs) => [...made, ...xs]); setMsg({ t: 'ok', s: `${made.length}장 만들었어요.` });
    if (auto) for (const m of made) await saveLocal(m);
  }
  async function editText(im: Img) {
    if (!newT.trim()) { setMsg({ t: 'err', s: '바꿀 글자를 입력해 주세요.' }); return; }
    const p = `Edit this image: ${oldT.trim() ? `replace the text "${oldT.trim()}" with "${newT.trim()}"` : `add the text "${newT.trim()}" where it fits`}. Spell the text exactly as given, same font style and position. Keep everything else in the image exactly the same.${editExtra.trim() ? ' ' + editExtra.trim() : ''}`;
    setBusy(true); setMsg(null);
    let out = await call({ prompt: p, size: apiSize(size), quality, background: 'auto', n: 1, refs: [im.b64] });
    if (out && size === '300x300') out = await Promise.all(out.map(shrink300));
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
          <label className="mx-f">스타일 문장 (그림 톤을 맞추는 고정 문장, 고쳐도 돼요)<textarea className="mx-st-ta" rows={5} value={style} onChange={(e) => setStyle(e.target.value)} /></label>
          {preset === 'word' && <div className="mx-row"><label className="mx-f" style={{ flex: 1 }}>영어 단어<input value={word} onChange={(e) => setWord(e.target.value)} placeholder="예: socks" /></label><label className="mx-f" style={{ flex: 1 }}>한글 뜻(선택)<input value={ko} onChange={(e) => setKo(e.target.value)} placeholder="예: 양말" /></label></div>}
          <label className="mx-f">프롬프트 {preset === 'word' ? '(추가 설명, 선택)' : '(만들 그림 설명)'}<textarea className="mx-st-ta" rows={5} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={preset === 'scene' ? '예: 가게에서 점원에게 모자 가격을 묻는 여자아이와 엄마. 가게 안, 모자가 진열된 선반.' : '예: 파란색 줄무늬 양말'} /></label>
          <div className="mx-f">참고 이미지 (최대 4장 — 올리면 이 그림을 바탕으로 만들어요)
            <div className="mx-row" style={{ marginTop: 6 }}>
              {refs.map((r) => <span key={r.id} className="mx-st-ref"><img src={'data:image/png;base64,' + r.b64} alt="참고" /><button onClick={() => setRefs((xs) => xs.filter((x) => x.id !== r.id))} aria-label="빼기">×</button></span>)}
              {refs.length < 4 && <button className="mx-btn sec" onClick={() => fileRef.current?.click()}>+ 올리기</button>}
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => void addRefs(e.target.files)} />
            </div></div>
          <div className="mx-row">
            <label className="mx-f">크기<select value={size} onChange={(e) => setSize(e.target.value)}><option value="300x300">작게 300×300 (단어 그림용)</option><option value="1024x1024">정사각 1024×1024</option><option value="1536x1024">가로 1536×1024 (장면)</option><option value="1024x1536">세로 1024×1536</option></select></label>
            <label className="mx-f">배경<select value={bg} onChange={(e) => setBg(e.target.value)}><option value="transparent">투명</option><option value="opaque">불투명</option><option value="auto">자동</option></select></label>
            <label className="mx-f">품질<select value={quality} onChange={(e) => setQuality(e.target.value)}><option value="low">낮음(저렴)</option><option value="medium">보통</option><option value="high">높음(비쌈)</option></select></label>
            <label className="mx-f">개수<select value={n} onChange={(e) => setN(Number(e.target.value))}>{[1, 2, 3, 4].map((v) => <option key={v}>{v}</option>)}</select></label>
          </div>
          <div className="mx-row" style={{ marginTop: 8 }}>
            <button className="mx-btn" disabled={busy} onClick={generate}>{busy ? '만드는 중… (30초 안팎)' : refs.length ? '참고 이미지로 만들기' : '만들기'}</button>
            <span className="mx-muted">{refs.length ? '참고 이미지 있음 → 수정/참고 모드' : ''}</span>
          </div>
          <div className="mx-card" style={{ marginTop: 12, background: '#fafafa' }}>
            <b>저장 위치 (내 컴퓨터)</b>
            <div className="mx-row" style={{ marginTop: 6 }}>
              {hasDir ? <><button className="mx-btn sec" onClick={chooseDir}>폴더 선택</button><span>{dir ? <b>{dir.name}</b> : <span className="mx-muted">선택 안 함 → 내려받기 폴더로 저장</span>}</span></>
                : <span className="mx-muted">이 브라우저는 폴더 선택을 지원하지 않아요(크롬/엣지에서 가능). 저장하면 내려받기 폴더로 저장돼요.</span>}
              <label style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}><input type="checkbox" style={{ width: 'auto' }} checked={auto} onChange={(e) => setAuto(e.target.checked)} /> 만들면 자동 저장</label>
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
