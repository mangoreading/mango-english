// 검수 문항 만들기: L9 실제 문항(content/l9v2) + 변형(긴 문장, 선택 요소 없음)
const { S } = require('../../content/l9v2/part3.cjs');
const STRETCH_KEYS = new Set(['text', 'lines', 'en', 'target', 'q', 'say', 'title', 'sent', 'right', 'situation', 'open', 'cue']);
const TAIL = ' and then we all went to a very big shop near our school';
const clone = (o) => JSON.parse(JSON.stringify(o));
/** 화면에 보이는 영어 문장 뒤에 긴 꼬리를 붙여 줄바꿈·넘침을 시험한다(빈칸/정답 데이터는 그대로) */
function stretch(o, key) {
  if (typeof o === 'string') return STRETCH_KEYS.has(key) && o !== '---' && o.length > 3 ? o + TAIL : o;
  if (Array.isArray(o)) return o.map((x) => (typeof x === 'string' ? stretch(x, key) : stretch(x, undefined)));
  if (o && typeof o === 'object') { const r = {}; for (const k of Object.keys(o)) r[k] = stretch(o[k], k); return r; }
  return o;
}
/** 템플릿별로 대표 문항: 첫 문항 + 글이 가장 긴 문항(다르면) */
function reps() {
  const by = new Map();
  for (const st of S) for (const it of st.items) { const a = by.get(it.k) || []; a.push({ it, st }); by.set(it.k, a); }
  const out = [];
  for (const [k, arr] of by) {
    const first = arr[0]; const longest = arr.slice().sort((a, b) => JSON.stringify(b.it).length - JSON.stringify(a.it).length)[0];
    out.push({ id: `${k}`, item: first.it, step: first.st }); if (longest !== first) out.push({ id: `${k}.long-src`, item: longest.it, step: longest.st });
  }
  return out;
}
function allCases(quick) {
  const cs = [];
  for (const r of reps()) {
    cs.push({ id: r.id, variant: 'base', item: r.item });
    cs.push({ id: r.id, variant: 'long', item: stretch(clone(r.item)) });
    if (r.item.illus) { const b = clone(r.item); delete b.illus; cs.push({ id: r.id, variant: 'noillus', item: b }); }
  }
  return quick ? cs.filter((c) => c.variant === 'base') : cs;
}
module.exports = { allCases, stretch };
