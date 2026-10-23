// MVP(app/js/content2.js)의 Lesson 9 데이터를 SQL 시드로 변환한다. 사용법: node tools/gen-seed-l9.mjs > supabase/migrations/0002_seed_lesson9.sql
import vm from 'node:vm'; import fs from 'node:fs';
const A = process.env.MVP_JS || '/mnt/user-data/outputs/app/js/';
const w = { console, setTimeout }; w.window = w; w.MG = {}; vm.createContext(w);
for (const f of ['icons', 'items', 'content', 'content2']) vm.runInContext(fs.readFileSync(A + f + '.js', 'utf8'), w);
const U = w.MG.UNITS[2];
const rep = (k, v) => (Object.prototype.toString.call(v) === '[object RegExp]' ? { source: v.source, flags: v.flags } : v);
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const j = (o) => '$j$' + JSON.stringify(o, rep) + '$j$::jsonb';
const out = [];
out.push('-- 0002: Lesson 9 (비상교육 초5 "How Much Are These Socks?") 시드 — gen-seed-l9.mjs 로 생성');
out.push("insert into publishers(name) values ('비상교육') on conflict (name) do nothing;");
out.push(`insert into books(publisher_id, grade, title, year) select id, 5, '비상교육 초5 영어', 2026 from publishers where name='비상교육' and not exists (select 1 from books b where b.title='비상교육 초5 영어');`);
out.push(`insert into units(book_id, no, title, goals, status) select b.id, 9, ${q(U.UNIT.title || 'How Much Are These Socks?')}, ${j(U.LO || [])}, 'approved' from books b where b.title='비상교육 초5 영어' on conflict (book_id, no) do nothing;`);
const vocab = [['hat', 'hat', '모자'], ['sunglasses', 'sunglasses', '선글라스'], ['jacket', 'jacket', '재킷'], ['shorts', 'shorts', '반바지'], ['socks', 'socks', '양말'], ['shoes', 'shoes', '신발']];
for (const [k, en, ko] of vocab) out.push(`insert into vocab(key,en,ko,image_path) values (${q(k)},${q(en)},${q(ko)},${q('word/' + k + '.png')}) on conflict (key) do nothing;`);
out.push(`insert into unit_vocab(unit_id, vocab_id) select u.id, v.id from units u join books b on b.id=u.book_id, vocab v where b.title='비상교육 초5 영어' and u.no=9 and v.key in (${vocab.map((v) => q(v[0])).join(',')}) on conflict do nothing;`);
out.push(`delete from items where unit_id=(select u.id from units u join books b on b.id=u.book_id where b.title='비상교육 초5 영어' and u.no=9);`);
let n = 0;
const row = (lesson, idx, lv, it) => {
  n++;
  out.push(`insert into items(unit_id, lesson, act_idx, level, template, tag, payload, status) select u.id, ${lesson}, ${idx}, ${q(lv)}, ${q(it.k)}, ${it.tag ? q(it.tag) : 'null'}, ${j(it)}, 'approved' from units u join books b on b.id=u.book_id where b.title='비상교육 초5 영어' and u.no=9;`);
};
for (const lv of ['CORE', 'SUPPORT', 'ADVANCED']) {
  for (const ls of U.LESSONS) {
    if (ls.no >= 7) continue;
    for (let a = 0; a < ls.acts.length; a++) U.actItems(ls, a, lv, null, null, {}).forEach((it, i) => row(ls.no, a * 100 + i, lv, it));
  }
  U.testItems(lv).forEach((it, i) => row(7, i, lv, it));
}
console.log(out.join('\n'));
console.error('items:', n);
