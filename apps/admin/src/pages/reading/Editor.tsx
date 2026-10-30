import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../../shared/supabase';
import { Preview } from './Preview';
import { move, signReading, spellOf, uploadReadingImage, validate, type RBook, type RContent, type RKey, type RPhonics, type RQuiz } from './shared';

const TABS = ['기본 정보', '0 Warm Up', '1 Phonics', '2 Key Words', '3 Read Aloud', '4 Quiz', '5 Write', '6 Speak'] as const;

const F = ({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) => <label style={{ flex: wide ? '1 1 100%' : '1 1 200px' }}>{label}{children}</label>;
const Row = ({ i, n, onMove, onDel, children }: { i: number; n: number; onMove: (d: number) => void; onDel: () => void; children: ReactNode }) => (
  <div className="mx-box" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
    <b style={{ minWidth: 26, paddingTop: 24 }}>{i + 1}</b>
    <div style={{ flex: 1, display: 'flex', gap: 10, flexWrap: 'wrap' }}>{children}</div>
    <div style={{ display: 'flex', gap: 4, paddingTop: 18 }}>
      <button className="mx-btn sec" disabled={i === 0} onClick={() => onMove(-1)}>↑</button>
      <button className="mx-btn sec" disabled={i === n - 1} onClick={() => onMove(1)}>↓</button>
      <button className="mx-btn sec" onClick={onDel}>삭제</button>
    </div>
  </div>
);
const upd = <T,>(a: T[], i: number, p: Partial<T>): T[] => a.map((x, k) => (k === i ? { ...x, ...p } : x));

/** 원서 책 편집: 9단계(0~6 내용 + 기본 정보). 저장하면 버전이 올라가고, 공개된 책은 바로 학습자에게 반영돼요. */
export function BookEditor({ code, onBack }: { code: string; onBack: () => void }) {
  const [book, setBook] = useState<RBook | null>(null); const [orig, setOrig] = useState('');
  const [tab, setTab] = useState<(typeof TABS)[number]>('기본 정보');
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; s: string } | null>(null); const [busy, setBusy] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({}); const [prev, setPrev] = useState(false);

  useEffect(() => { if (msg?.t === 'ok') { const id = setTimeout(() => setMsg(null), 1800); return () => clearTimeout(id); } }, [msg]);
  useEffect(() => {
    supabase.from('reading_books').select('id,code,level,title,emoji,week,ord,ar,cover_path,status,version,updated_at,content').eq('code', code).maybeSingle().then(({ data, error }) => {
      if (error || !data) { setMsg({ t: 'err', s: error?.message ?? '책을 찾지 못했어요' }); return; }
      setBook(data as unknown as RBook); setOrig(JSON.stringify(data));
    });
  }, [code]);
  const paths = useMemo(() => (book ? [book.cover_path ?? '', ...book.content.pages.map((p) => p.img)] : []), [book]);
  useEffect(() => { if (paths.some((p) => p && !urls[p])) signReading(paths).then((u) => setUrls((o) => ({ ...o, ...u }))); }, [paths]); // eslint-disable-line
  if (!book) return <div className="mx-card">{msg ? <p className="mx-err">{msg.s}</p> : <p className="mx-muted">불러오는 중…</p>}<button className="mx-btn sec" onClick={onBack}>← 목록</button></div>;

  const c = book.content; const dirty = JSON.stringify({ ...book, version: undefined, updated_at: undefined }) !== JSON.stringify({ ...JSON.parse(orig), version: undefined, updated_at: undefined });
  const errs = validate(c);
  const set = (p: Partial<RContent>) => setBook({ ...book, content: { ...c, ...p } });
  const meta = (p: Partial<RBook>) => setBook({ ...book, ...p });

  async function save() {
    if (!book) return;
    if (errs.length) { setMsg({ t: 'err', s: '저장 전에 고쳐 주세요: ' + errs[0] + (errs.length > 1 ? ` 외 ${errs.length - 1}건` : '') }); return; }
    setBusy(true);
    const nv = book.version + 1;
    const { error } = await supabase.from('reading_books').update({ title: book.title, emoji: book.emoji, week: book.week, ar: book.ar, cover_path: book.cover_path, content: book.content, version: nv, updated_at: new Date().toISOString() }).eq('id', book.id);
    setBusy(false);
    if (error) { setMsg({ t: 'err', s: error.message }); return; }
    const nb = { ...book, version: nv }; setBook(nb); setOrig(JSON.stringify(nb)); setMsg({ t: 'ok', s: `저장했어요 (v${nv})` });
  }
  async function pickImage(kind: 'pages' | 'covers', file: File | undefined, apply: (path: string) => void) {
    if (!file) return;
    try { setMsg({ t: 'ok', s: '이미지를 올리는 중…' }); const p = await uploadReadingImage(book!.code, kind, file); setUrls((o) => ({ ...o, ...{ [p]: URL.createObjectURL(file) } })); apply(p); setMsg({ t: 'ok', s: '이미지를 올렸어요. 저장하면 반영돼요' }); }
    catch (e) { setMsg({ t: 'err', s: (e as Error).message }); }
  }
  const go = (t: (typeof TABS)[number]) => { setTab(t); window.scrollTo(0, 0); };
  const badge = (t: (typeof TABS)[number]) => (errs.some((e) => e.startsWith(t.split(' ').slice(1).join(' '))) ? ' ⚠' : '');

  return (
    <>
      {prev && <Preview book={book} onClose={() => setPrev(false)} />}
      <div className="mx-card" style={{ position: 'sticky', top: 64, zIndex: 4, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="mx-btn sec" onClick={() => { if (!dirty || confirm('저장하지 않은 변경이 있어요. 목록으로 나갈까요?')) onBack(); }}>← 목록</button>
        <b style={{ fontSize: 18 }}>{book.emoji} {book.title}</b><span className="mx-muted">{book.code} · v{book.version} · {book.status === 'published' ? '공개 중' : '비공개'}</span>
        <span style={{ flex: 1 }} />
        {msg && <span className={msg.t === 'ok' ? 'mx-ok' : 'mx-err'}>{msg.s}</span>}
        <button className="mx-btn sec" onClick={() => setPrev(true)}>👁 학습 화면 미리보기</button>
        <button className="mx-btn" disabled={busy || !dirty} onClick={save}>{dirty ? '저장' : '저장됨'}</button>
      </div>
      {book.status === 'published' && <p className="mx-muted">⚠ 공개 중인 책이에요. 저장하면 학습자 화면에 바로 반영돼요.</p>}
      <div className="mx-seg" style={{ flexWrap: 'wrap' }}>{TABS.map((t) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => go(t)}>{t}{badge(t)}</button>)}</div>

      {tab === '기본 정보' && (
        <div className="mx-card" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <F label="제목"><input value={book.title} onChange={(e) => meta({ title: e.target.value })} /></F>
          <F label="이모지"><input value={book.emoji ?? ''} onChange={(e) => meta({ emoji: e.target.value })} /></F>
          <F label="주차"><input type="number" min={1} value={book.week} onChange={(e) => meta({ week: Math.max(1, +e.target.value || 1) })} /></F>
          <F label="AR 레벨"><input value={book.ar ?? ''} onChange={(e) => meta({ ar: e.target.value || null })} /></F>
          <F label="표지 이미지" wide>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              {book.cover_path && urls[book.cover_path] ? <img src={urls[book.cover_path]} alt="표지" style={{ height: 150, borderRadius: 10, border: '1px solid var(--line)' }} /> : <span className="mx-muted">표지 없음</span>}
              <input type="file" accept="image/jpeg,image/png" onChange={(e) => pickImage('covers', e.target.files?.[0], (p) => meta({ cover_path: p }))} />
            </div>
          </F>
          <p className="mx-muted" style={{ flex: '1 1 100%' }}>순서와 공개 여부는 목록에서 바꿔요.</p>
        </div>
      )}

      {tab === '0 Warm Up' && (
        <div className="mx-card">
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <F label="큰 제목(영문)"><input value={c.warmup.title} onChange={(e) => set({ warmup: { ...c.warmup, title: e.target.value } })} /></F>
            <F label="소개 문구 (한글, <b> <br/> 사용 가능)" wide><textarea style={{ minHeight: 90 }} value={c.warmup.lead} onChange={(e) => set({ warmup: { ...c.warmup, lead: e.target.value } })} /></F>
          </div>
          <h3 style={{ marginTop: 16 }}>등장인물</h3>
          {c.warmup.characters.map((ch, i) => (
            <Row key={i} i={i} n={c.warmup.characters.length} onMove={(d) => set({ warmup: { ...c.warmup, characters: move(c.warmup.characters, i, d) } })} onDel={() => set({ warmup: { ...c.warmup, characters: c.warmup.characters.filter((_, k) => k !== i) } })}>
              <F label="영어 이름 (누르면 읽어줘요)"><input value={ch.name} onChange={(e) => set({ warmup: { ...c.warmup, characters: upd(c.warmup.characters, i, { name: e.target.value }) } })} /></F>
              <F label="이모지"><input value={ch.emoji} onChange={(e) => set({ warmup: { ...c.warmup, characters: upd(c.warmup.characters, i, { emoji: e.target.value }) } })} /></F>
              <F label="역할 (한글)"><input value={ch.tag} onChange={(e) => set({ warmup: { ...c.warmup, characters: upd(c.warmup.characters, i, { tag: e.target.value }) } })} /></F>
              <F label="설명 (한글)" wide><input value={ch.desc} onChange={(e) => set({ warmup: { ...c.warmup, characters: upd(c.warmup.characters, i, { desc: e.target.value }) } })} /></F>
            </Row>))}
          <button className="mx-btn sec" onClick={() => set({ warmup: { ...c.warmup, characters: [...c.warmup.characters, { name: '', emoji: '', tag: '', desc: '' }] } })}>+ 등장인물 추가</button>
        </div>
      )}

      {tab === '1 Phonics' && (
        <div className="mx-card">
          <p className="mx-muted">CVC 단어형(글자 + 그림 단어)과 라임형(끝소리가 같은 단어들)이 있어요.</p>
          {c.phonics.map((p, i) => {
            const isRhyme = !!p.rhyme; const sp = (x: Partial<RPhonics>) => set({ phonics: upd(c.phonics, i, x) });
            return (
              <Row key={i} i={i} n={c.phonics.length} onMove={(d) => set({ phonics: move(c.phonics, i, d) })} onDel={() => set({ phonics: c.phonics.filter((_, k) => k !== i) })}>
                <F label="유형"><select value={isRhyme ? 'rhyme' : 'cvc'} onChange={(e) => sp(e.target.value === 'rhyme' ? { rhyme: p.rhyme ?? [], cvc: undefined } : { cvc: p.cvc ?? [], rhyme: undefined })}><option value="cvc">CVC 단어</option><option value="rhyme">라임</option></select></F>
                <F label={isRhyme ? '라임 (예: -ie)' : '글자 (예: i)'}><input value={p.letter} onChange={(e) => sp({ letter: e.target.value })} /></F>
                <F label="안내 (한글)"><input value={p.hint} onChange={(e) => sp({ hint: e.target.value })} /></F>
                {isRhyme
                  ? <F label="라임 단어 (쉼표로 구분, 첫 단어가 큰 글자로 나와요)" wide><input value={(p.rhyme ?? []).join(', ')} onChange={(e) => sp({ rhyme: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} /></F>
                  : <div style={{ flex: '1 1 100%' }}>
                      {(p.cvc ?? []).map((w, k) => (
                        <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                          <input placeholder="단어" value={w.word} onChange={(e) => sp({ cvc: upd(p.cvc!, k, { word: e.target.value }) })} />
                          <input placeholder="이모지" style={{ width: 90 }} value={w.pic} onChange={(e) => sp({ cvc: upd(p.cvc!, k, { pic: e.target.value }) })} />
                          <button className="mx-btn sec" onClick={() => sp({ cvc: p.cvc!.filter((_, z) => z !== k) })}>✕</button>
                        </div>))}
                      <button className="mx-btn sec" onClick={() => sp({ cvc: [...(p.cvc ?? []), { word: '', pic: '' }] })}>+ 단어 추가</button>
                    </div>}
              </Row>);
          })}
          <button className="mx-btn sec" onClick={() => set({ phonics: [...c.phonics, { letter: '', hint: '', cvc: [] }] })}>+ Phonics 추가</button>
        </div>
      )}

      {tab === '2 Key Words' && (
        <div className="mx-card">
          {c.keyWords.map((k, i) => {
            const sk = (x: Partial<RKey>) => set({ keyWords: upd(c.keyWords, i, x) });
            return (
              <Row key={i} i={i} n={c.keyWords.length} onMove={(d) => set({ keyWords: move(c.keyWords, i, d) })} onDel={() => set({ keyWords: c.keyWords.filter((_, z) => z !== i) })}>
                <F label="이모지"><input value={k.emoji} onChange={(e) => sk({ emoji: e.target.value })} /></F>
                <F label="영어 단어"><input value={k.word} onChange={(e) => sk({ word: e.target.value })} /></F>
                <F label="철자 (예: L · I · K · E)"><div style={{ display: 'flex', gap: 6 }}><input style={{ flex: 1 }} value={k.spell} onChange={(e) => sk({ spell: e.target.value })} /><button className="mx-btn sec" onClick={() => sk({ spell: spellOf(k.word) })}>자동</button></div></F>
                <F label="뜻 (한글)"><input value={k.kor} onChange={(e) => sk({ kor: e.target.value })} /></F>
                <F label="이야기 속 상황 (한글)" wide><input value={k.scene} onChange={(e) => sk({ scene: e.target.value })} /></F>
              </Row>);
          })}
          <button className="mx-btn sec" onClick={() => set({ keyWords: [...c.keyWords, { emoji: '', word: '', spell: '', kor: '', scene: '' }] })}>+ 단어 추가</button>
        </div>
      )}

      {tab === '3 Read Aloud' && (
        <div className="mx-card">
          <p className="mx-muted">글에서 <b>/</b> 는 줄바꿈이에요 (예: Big Pig likes to dream / about apple pie). 이미지는 jpg·png.</p>
          {c.pages.map((p, i) => (
            <Row key={i} i={i} n={c.pages.length} onMove={(d) => set({ pages: move(c.pages, i, d) })} onDel={() => { if (confirm(`${i + 1}쪽을 삭제할까요?`)) set({ pages: c.pages.filter((_, z) => z !== i) }); }}>
              <div style={{ flex: '0 0 220px' }}>
                {urls[p.img] ? <img src={urls[p.img]} alt={`${i + 1}쪽`} style={{ width: 220, borderRadius: 10, border: '1px solid var(--line)' }} /> : <div className="mx-muted" style={{ width: 220, height: 150, display: 'grid', placeItems: 'center', background: 'var(--soft)', borderRadius: 10 }}>이미지 없음</div>}
                <input type="file" accept="image/jpeg,image/png" style={{ width: '100%', marginTop: 6 }} onChange={(e) => pickImage('pages', e.target.files?.[0], (path) => set({ pages: upd(c.pages, i, { img: path }) }))} />
              </div>
              <F label="페이지 글" wide><textarea style={{ minHeight: 120, flex: 1 }} value={p.text} onChange={(e) => set({ pages: upd(c.pages, i, { text: e.target.value }) })} /></F>
            </Row>))}
          <button className="mx-btn sec" onClick={() => set({ pages: [...c.pages, { img: '', text: '' }] })}>+ 페이지 추가</button>
        </div>
      )}

      {tab === '4 Quiz' && (
        <div className="mx-card">
          {c.quizzes.map((q, i) => {
            const sq = (x: Partial<RQuiz>) => set({ quizzes: upd(c.quizzes, i, x) });
            return (
              <Row key={i} i={i} n={c.quizzes.length} onMove={(d) => set({ quizzes: move(c.quizzes, i, d) })} onDel={() => set({ quizzes: c.quizzes.filter((_, z) => z !== i) })}>
                <F label="질문 (영어)" wide><input value={q.q} onChange={(e) => sq({ q: e.target.value })} /></F>
                <div style={{ flex: '1 1 100%' }}>
                  {q.options.map((o, k) => (
                    <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                      <input type="radio" name={`q${i}`} checked={!!o.correct} onChange={() => sq({ options: q.options.map((x, z) => ({ ...x, correct: z === k ? true : undefined })) })} title="정답" />
                      <input placeholder="보기" style={{ flex: 1 }} value={o.label} onChange={(e) => sq({ options: upd(q.options, k, { label: e.target.value }) })} />
                      <input placeholder="이모지" style={{ width: 90 }} value={o.pic} onChange={(e) => sq({ options: upd(q.options, k, { pic: e.target.value }) })} />
                      <button className="mx-btn sec" onClick={() => sq({ options: q.options.filter((_, z) => z !== k) })}>✕</button>
                    </div>))}
                  <button className="mx-btn sec" onClick={() => sq({ options: [...q.options, { label: '', pic: '' }] })}>+ 보기 추가</button> <span className="mx-muted">동그라미를 누른 보기가 정답이에요</span>
                </div>
              </Row>);
          })}
          <button className="mx-btn sec" onClick={() => set({ quizzes: [...c.quizzes, { q: '', options: [{ label: '', pic: '', correct: true }, { label: '', pic: '' }] }] })}>+ 문제 추가</button>
        </div>
      )}

      {tab === '5 Write' && (
        <div className="mx-card">
          <p className="mx-muted">학생이 단어를 순서대로 눌러 만드는 문장이에요. 단어는 공백으로 나뉘어요.</p>
          {c.traceSentences.map((s, i) => (
            <Row key={i} i={i} n={c.traceSentences.length} onMove={(d) => set({ traceSentences: move(c.traceSentences, i, d) })} onDel={() => set({ traceSentences: c.traceSentences.filter((_, z) => z !== i) })}>
              <F label="문장 (영어)" wide><input value={s} onChange={(e) => set({ traceSentences: c.traceSentences.map((x, z) => (z === i ? e.target.value : x)) })} /></F>
            </Row>))}
          <button className="mx-btn sec" onClick={() => set({ traceSentences: [...c.traceSentences, ''] })}>+ 문장 추가</button>
        </div>
      )}

      {tab === '6 Speak' && (
        <div className="mx-card">
          <p className="mx-muted">말하기(STEP 6)와 영상 찍기(STEP 7)에서 읽는 문장이에요.</p>
          {c.speakSentences.map((s, i) => (
            <Row key={i} i={i} n={c.speakSentences.length} onMove={(d) => set({ speakSentences: move(c.speakSentences, i, d) })} onDel={() => set({ speakSentences: c.speakSentences.filter((_, z) => z !== i) })}>
              <F label="영어 문장" wide><input value={s.text} onChange={(e) => set({ speakSentences: upd(c.speakSentences, i, { text: e.target.value }) })} /></F>
              <F label="한글 뜻"><input value={s.kor} onChange={(e) => set({ speakSentences: upd(c.speakSentences, i, { kor: e.target.value }) })} /></F>
              <F label="이모지"><input value={s.emoji} onChange={(e) => set({ speakSentences: upd(c.speakSentences, i, { emoji: e.target.value }) })} /></F>
            </Row>))}
          <button className="mx-btn sec" onClick={() => set({ speakSentences: [...c.speakSentences, { text: '', kor: '', emoji: '' }] })}>+ 문장 추가</button>
        </div>
      )}
      {errs.length > 0 && <div className="mx-card"><b className="mx-err">저장 전 확인할 것 {errs.length}건</b><ul>{errs.slice(0, 8).map((e, i) => <li key={i}>{e}</li>)}</ul></div>}
    </>
  );
}
