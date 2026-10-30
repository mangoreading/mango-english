// 원서(Pre) 콘텐츠 변환기: Pre_Level_Prototype.html 의 ALL_BOOKS + books/*.js  →  reading_import.json
// 사용: node tools/reading/convert.mjs <원서폴더> <출력.json>
// 출력 파일에는 책 본문 텍스트가 들어 있으므로 공개 저장소에 커밋하지 않는다(관리자 '원서 가져오기'로 올린다).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error('사용: node convert.mjs <원서폴더> <출력.json>'); process.exit(1); }

const html = fs.readFileSync(path.join(src, 'Pre_Level_Prototype.html'), 'utf8');
const metaRe = /\{\s*id:\s*'([A-Z_]+)',\s*title:\s*'([^']*)',\s*emoji:\s*'([^']*)',\s*week:\s*(\d+),[^}]*?coverImg:\s*'([^']*)'(?:,\s*ar:\s*'([^']*)')?/g;
const metas = [...html.matchAll(metaRe)].map((m) => ({ code: m[1], title: m[2], emoji: m[3], week: +m[4], coverImg: m[5], ar: m[6] ?? null }));
if (!metas.length) throw new Error('ALL_BOOKS 를 찾지 못했어요');

// 원본 데이터의 알려진 경로 오류: 눈송이 1쪽은 실제 파일이 png
const FIX = { 'assets/pages/the_snowflake/1.jpg': 'assets/pages/the_snowflake/1.png' };

const sandbox = { window: {} };
vm.createContext(sandbox);
for (const f of fs.readdirSync(path.join(src, 'books')).filter((x) => x.endsWith('.js'))) {
  vm.runInContext(fs.readFileSync(path.join(src, 'books', f), 'utf8'), sandbox, { filename: f });
}
const B = sandbox.window.MR_BOOKS;

const images = [];
const ext = (p) => (p.match(/\.(jpg|jpeg|png)$/i)?.[1] ?? 'jpg').toLowerCase();
const books = metas.map((m, ord) => {
  const d = B[m.code];
  if (!d) throw new Error(`${m.code}: books/*.js 에 내용이 없어요`);
  const coverSrc = FIX[d.cover] ?? d.cover;
  const coverDest = `covers/${m.code}.${ext(coverSrc)}`;
  images.push({ src: coverSrc.replace(/^assets\//, ''), dest: coverDest });
  const pages = d.pages.map((p, i) => {
    const s = FIX[p.img] ?? p.img;
    const dest = `pages/${m.code}/${i + 1}.${ext(s)}`;
    images.push({ src: s.replace(/^assets\//, ''), dest });
    return { img: dest, text: p.text };
  });
  return {
    code: m.code, level: 'PRE', title: d.title || m.title, emoji: m.emoji, week: m.week, ord, ar: d.ar ?? m.ar, cover: coverDest,
    content: { warmup: d.warmup, phonics: d.phonics, keyWords: d.keyWords, pages, quizzes: d.quizzes, traceSentences: d.traceSentences, speakSentences: d.speakSentences },
  };
});

// 형식 점검
const errs = [];
for (const b of books) {
  const c = b.content;
  if (!c.pages.length) errs.push(`${b.code}: 페이지 없음`);
  c.quizzes.forEach((q, i) => { if (q.options.filter((o) => o.correct).length !== 1) errs.push(`${b.code}: 퀴즈 ${i + 1} 정답이 1개가 아님`); });
}
if (errs.length) { console.error(errs.join('\n')); process.exit(2); }

fs.writeFileSync(out, JSON.stringify({ version: 1, books, images }, null, 1));
console.log(`책 ${books.length}권, 이미지 ${images.length}개 → ${out}`);
