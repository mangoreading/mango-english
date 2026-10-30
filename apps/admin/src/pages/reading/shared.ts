import { supabase } from '../../shared/supabase';

export interface RChar { name: string; emoji: string; tag: string; desc: string }
export interface RPhonics { letter: string; hint: string; cvc?: { word: string; pic: string }[]; rhyme?: string[] }
export interface RKey { emoji: string; word: string; spell: string; kor: string; scene: string }
export interface RPage { img: string; text: string }
export interface RQuiz { q: string; options: { label: string; pic: string; correct?: boolean }[] }
export interface RSpeak { text: string; kor: string; emoji: string }
export interface RContent {
  warmup: { title: string; lead: string; characters: RChar[] };
  phonics: RPhonics[]; keyWords: RKey[]; pages: RPage[]; quizzes: RQuiz[]; traceSentences: string[]; speakSentences: RSpeak[];
}
export interface RBookRow { id: string; code: string; level: 'PRE' | 'BASIC'; title: string; emoji: string | null; week: number; ord: number; ar: string | null; cover_path: string | null; status: 'draft' | 'published'; version: number; updated_at: string }
export interface RBook extends RBookRow { content: RContent }

export const emptyContent = (title: string): RContent => ({
  warmup: { title: title.toUpperCase(), lead: '', characters: [] }, phonics: [], keyWords: [], pages: [], quizzes: [], traceSentences: [], speakSentences: [],
});

/** 비공개 버킷 'reading' 의 경로 → 임시 주소 */
export async function signReading(paths: string[], secs = 3600): Promise<Record<string, string>> {
  const out: Record<string, string> = {}; const want = [...new Set(paths.filter(Boolean))];
  for (let i = 0; i < want.length; i += 100) {
    const { data } = await supabase.storage.from('reading').createSignedUrls(want.slice(i, i + 100), secs);
    for (const r of data ?? []) if (r.path && r.signedUrl) out[r.path] = r.signedUrl;
  }
  return out;
}

/** 이미지 올리기: 같은 경로를 덮어쓰지 않고 새 경로로 올려 화면에 바로 반영되게 한다 */
export async function uploadReadingImage(code: string, kind: 'pages' | 'covers', file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace('jpeg', 'jpg');
  if (!['jpg', 'png'].includes(ext)) throw new Error('jpg 또는 png 이미지만 올릴 수 있어요');
  const path = `${kind}/${code}/${kind === 'covers' ? 'cover-' : 'p'}${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('reading').upload(path, file, { contentType: ext === 'png' ? 'image/png' : 'image/jpeg' });
  if (error) throw error;
  return path;
}

export const spellOf = (w: string) => w.toUpperCase().split('').join(' · ');
export function move<T>(a: T[], i: number, d: number): T[] {
  const j = i + d; if (j < 0 || j >= a.length) return a;
  const r = [...a]; [r[i], r[j]] = [r[j], r[i]]; return r;
}

/** 저장 전 점검: 학습앱에서 깨질 수 있는 것을 막는다 */
export function validate(c: RContent): string[] {
  const e: string[] = [];
  if (!c.pages.length) e.push('Read Aloud: 페이지가 하나도 없어요');
  c.pages.forEach((p, i) => { if (!p.text.trim()) e.push(`Read Aloud ${i + 1}쪽: 글이 비어 있어요`); if (!p.img) e.push(`Read Aloud ${i + 1}쪽: 이미지가 없어요`); });
  c.phonics.forEach((p, i) => { if (!p.letter.trim()) e.push(`Phonics ${i + 1}: 글자가 비어 있어요`); if (!(p.cvc?.length || p.rhyme?.length)) e.push(`Phonics ${i + 1}: 단어가 없어요`); });
  c.keyWords.forEach((k, i) => { if (!k.word.trim() || !k.kor.trim()) e.push(`Key Words ${i + 1}: 영어 단어와 뜻이 필요해요`); });
  c.quizzes.forEach((q, i) => {
    if (!q.q.trim()) e.push(`Quiz ${i + 1}: 질문이 비어 있어요`);
    if (q.options.length < 2) e.push(`Quiz ${i + 1}: 보기는 2개 이상이어야 해요`);
    if (q.options.filter((o) => o.correct).length !== 1) e.push(`Quiz ${i + 1}: 정답을 정확히 1개 골라 주세요`);
    if (q.options.some((o) => !o.label.trim())) e.push(`Quiz ${i + 1}: 비어 있는 보기가 있어요`);
  });
  c.traceSentences.forEach((s, i) => { if (!s.trim()) e.push(`Write ${i + 1}: 문장이 비어 있어요`); });
  c.speakSentences.forEach((s, i) => { if (!s.text.trim()) e.push(`Speak ${i + 1}: 영어 문장이 비어 있어요`); });
  return e;
}
