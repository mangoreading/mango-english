import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../shared/supabase';

interface Word { id: string; key: string; en: string; ko: string; image_path: string | null }
/** 단어 그림 주소: 'word/hat.png'(앱 내장) 또는 업로드된 전체 주소 */
export const wordImg = (p?: string | null) => (!p ? '' : /^https?:/.test(p) ? p : '/img/' + p);
const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** 이미지를 가로세로 512px 이내로 줄여 PNG 로 만든다 (파일이 너무 커지는 것을 막는다) */
async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 512 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  return await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('이미지를 변환하지 못했어요'))), 'image/png'));
}
/** AI(OpenAI)로 단어 그림을 만든다 → PNG 파일 */
async function genImage(word: string, ko: string, extra: string): Promise<File> {
  const { data, error } = await supabase.functions.invoke('gen-image', { body: { word, ko, extra } });
  if (error) { let m = error.message; try { const j = await (error as any).context?.json?.(); if (j?.error) m = j.error; } catch { /* 그대로 */ } throw new Error(m); }
  if (!data?.image) throw new Error(data?.error ?? '그림을 받지 못했어요');
  const bin = atob(data.image as string); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  // 300x300 투명 PNG 로 줄인다 (배경은 투명 유지)
  const bmp = await createImageBitmap(new Blob([u8], { type: 'image/png' }));
  const c = document.createElement('canvas'); c.width = 300; c.height = 300;
  const k = Math.min(300 / bmp.width, 300 / bmp.height);
  const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
  c.getContext('2d')!.drawImage(bmp, Math.round((300 - w) / 2), Math.round((300 - h) / 2), w, h);
  const blob: Blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('이미지를 변환하지 못했어요'))), 'image/png'));
  return new File([blob], word + '.png', { type: 'image/png' });
}
async function upload(key: string, file: File): Promise<string> {
  const blob = await shrink(file);
  const path = `${key}-${Date.now()}.png`;
  const { error } = await supabase.storage.from('word-images').upload(path, blob, { contentType: 'image/png', upsert: false });
  if (error) throw new Error('그림 업로드 실패: ' + error.message);
  return supabase.storage.from('word-images').getPublicUrl(path).data.publicUrl;
}

/** 단원 단어 관리: 단어 추가(그림 업로드), 뜻 고치기, 그림 바꾸기, 단원에서 빼기 */
export function UnitVocab({ unitId }: { unitId: string }) {
  const [words, setWords] = useState<Word[] | null>(null);
  const [others, setOthers] = useState<Word[]>([]);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; s: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [en, setEn] = useState(''); const [ko, setKo] = useState(''); const [key, setKey] = useState(''); const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [gen, setGen] = useState<{ target: Word | 'new'; word: string; ko: string } | null>(null);
  const [extra, setExtra] = useState(''); const [prev, setPrev] = useState<File | null>(null); const [prevUrl, setPrevUrl] = useState(''); const [genBusy, setGenBusy] = useState(false);
  useEffect(() => { if (!prev) { setPrevUrl(''); return; } const u = URL.createObjectURL(prev); setPrevUrl(u); return () => URL.revokeObjectURL(u); }, [prev]);
  function openGen(target: Word | 'new') {
    const word = target === 'new' ? en.trim() : target.en; const ko2 = target === 'new' ? ko.trim() : target.ko;
    if (!word) { setMsg({ t: 'err', s: '먼저 영어 단어를 입력해 주세요.' }); return; }
    setGen({ target, word, ko: ko2 }); setPrev(null); setExtra(''); setMsg(null);
  }
  async function makeImg() {
    if (!gen) return; setGenBusy(true); setMsg(null);
    try { setPrev(await genImage(gen.word, gen.ko, extra)); } catch (e) { fail(e); } finally { setGenBusy(false); }
  }
  async function useImg() {
    if (!gen || !prev) return;
    if (gen.target === 'new') { setFile(prev); setMsg({ t: 'ok', s: '그림을 골랐어요. 아래 [추가]를 누르면 단어와 함께 저장돼요.' }); }
    else await changeImage(gen.target, prev);
    setGen(null); setPrev(null);
  }

  async function load() {
    const uv = await supabase.from('unit_vocab').select('vocab(id,key,en,ko,image_path)').eq('unit_id', unitId);
    const mine = ((uv.data ?? []) as any[]).map((r) => r.vocab as Word).filter(Boolean).sort((a, b) => a.en.localeCompare(b.en));
    setWords(mine);
    const all = await supabase.from('vocab').select('id,key,en,ko,image_path').order('en').limit(2000);
    setOthers(((all.data ?? []) as Word[]).filter((w) => !mine.some((m) => m.id === w.id)));
  }
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [unitId]);

  const fail = (e: unknown) => setMsg({ t: 'err', s: (e as Error).message });
  async function add() {
    const k = key || slug(en); if (!en.trim() || !ko.trim() || !k) { setMsg({ t: 'err', s: '영어 단어와 한글 뜻을 입력해 주세요.' }); return; }
    setBusy(true); setMsg(null);
    try {
      const image = file ? await upload(k, file) : null;
      const ins = await supabase.from('vocab').insert({ key: k, en: en.trim(), ko: ko.trim(), image_path: image }).select('id').single();
      if (ins.error) throw new Error(ins.error.message.includes('duplicate') ? `코드 "${k}"가 이미 있어요. 아래 "기존 단어 추가"에서 골라 주세요.` : ins.error.message);
      const link = await supabase.from('unit_vocab').insert({ unit_id: unitId, vocab_id: ins.data.id });
      if (link.error) throw new Error(link.error.message);
      setEn(''); setKo(''); setKey(''); setFile(null); if (fileRef.current) fileRef.current.value = '';
      setMsg({ t: 'ok', s: `"${en}"를 추가했어요.` }); await load();
    } catch (e) { fail(e); } finally { setBusy(false); }
  }
  async function addExisting(id: string) {
    if (!id) return;
    const r = await supabase.from('unit_vocab').insert({ unit_id: unitId, vocab_id: id });
    if (r.error) fail(r.error); else await load();
  }
  async function patch(w: Word, p: Partial<Word>) {
    const r = await supabase.from('vocab').update(p).eq('id', w.id);
    if (r.error) fail(r.error); else { setMsg({ t: 'ok', s: '저장했어요. (발행해야 학습앱에 반영돼요)' }); await load(); }
  }
  async function changeImage(w: Word, f: File) {
    setBusy(true);
    try { await patch(w, { image_path: await upload(w.key, f) }); } catch (e) { fail(e); } finally { setBusy(false); }
  }
  async function remove(w: Word) {
    if (!window.confirm(`"${w.en}"를 이 단원에서 뺄까요? (단어 자체는 남아 있어요. 이 단어를 쓰는 문항이 있으면 먼저 고쳐 주세요)`)) return;
    const r = await supabase.from('unit_vocab').delete().eq('unit_id', unitId).eq('vocab_id', w.id);
    if (r.error) fail(r.error); else await load();
  }

  if (!words) return <p className="mx-muted">불러오는 중…</p>;
  return (
    <>
      {msg && <p className={msg.t === 'ok' ? 'mx-ok' : 'mx-err'}>{msg.s}</p>}
      <div className="mx-card">
        <h3>단어 추가</h3>
        <div className="mx-row" style={{ alignItems: 'flex-end' }}>
          <label>영어<input value={en} onChange={(e) => setEn(e.target.value)} placeholder="sunglasses" /></label>
          <label>한글 뜻<input value={ko} onChange={(e) => setKo(e.target.value)} placeholder="선글라스" /></label>
          <label>코드 (비우면 자동)<input value={key} onChange={(e) => setKey(e.target.value)} placeholder={slug(en) || 'sunglasses'} /></label>
          <label>그림 (선택)<input ref={fileRef} type="file" accept="image/*" style={{ height: 38, boxSizing: 'border-box' }} onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
          <button className="mx-btn sec" style={{ height: 38 }} disabled={busy} onClick={() => openGen('new')}>AI로 그림 만들기</button>
          <button className="mx-btn" style={{ height: 38 }} disabled={busy} onClick={add}>추가</button>
        </div>
        {file && <p className="mx-muted" style={{ margin: '8px 0 0' }}>선택된 그림: {file.name}</p>}
        <div className="mx-row" style={{ marginTop: 10 }}>
          <select value="" onChange={(e) => void addExisting(e.target.value)}><option value="">기존 단어 추가… (다른 단원에서 쓴 단어)</option>{others.map((o) => <option key={o.id} value={o.id}>{o.en} · {o.ko}</option>)}</select>
        </div>
      </div>
      {gen && (
        <div className="mx-card">
          <h3>AI 그림 만들기 · {gen.word}{gen.ko ? ` (${gen.ko})` : ''}</h3>
          <div className="mx-row">
            <label style={{ flex: 1 }}>추가 설명 (선택, 영어) <input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="예: a pink baseball jacket with white sleeves" /></label>
            <button className="mx-btn" disabled={genBusy} onClick={makeImg}>{genBusy ? '만드는 중… (10~30초)' : prev ? '다시 만들기' : '만들기'}</button>
            <button className="mx-btn sec" disabled={genBusy} onClick={() => { setGen(null); setPrev(null); }}>닫기</button>
          </div>
          {prevUrl && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
              <img src={prevUrl} alt="" style={{ width: 200, height: 200, objectFit: 'contain', border: '1px solid #ddd', borderRadius: 12, background: '#fff' }} />
              <button className="mx-btn" disabled={busy} onClick={useImg}>{gen.target === 'new' ? '이 그림 사용' : '이 그림으로 바꾸기'}</button>
            </div>
          )}
          <p className="mx-muted" style={{ margin: '10px 0 0' }}>만들 때마다 비용이 들어요. 마음에 안 들면 추가 설명을 적고 다시 만들어 보세요.</p>
        </div>
      )}
      <div className="mx-card">
        <table>
          <thead><tr><th style={{ width: 70 }}>그림</th><th>영어</th><th>한글 뜻</th><th>코드</th><th style={{ width: 280 }} /></tr></thead>
          <tbody>
            {words.map((w) => (
              <tr key={w.id}>
                <td>{w.image_path ? <img src={wordImg(w.image_path)} alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} /> : <span className="mx-muted">없음</span>}</td>
                <td><Cell value={w.en} onSave={(v) => patch(w, { en: v })} /></td>
                <td><Cell value={w.ko} onSave={(v) => patch(w, { ko: v })} /></td>
                <td className="mx-muted">{w.key}</td>
                <td className="mx-act">
                  <label className="mx-btn sec" style={{ display: 'inline-block', cursor: 'pointer' }}>그림 바꾸기<input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void changeImage(w, f); e.target.value = ''; }} /></label>
                  <button className="mx-btn sec" onClick={() => openGen(w)}>AI 그림</button>
                  <button className="mx-btn sec" onClick={() => remove(w)}>단원에서 빼기</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!words.length && <p className="mx-muted">이 단원에 등록된 단어가 없어요.</p>}
      </div>
    </>
  );
}

function Cell({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return <input className="mx-cell" value={v} onChange={(e) => setV(e.target.value)} onBlur={() => { if (v.trim() && v !== value) onSave(v.trim()); else setV(value); }} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />;
}
