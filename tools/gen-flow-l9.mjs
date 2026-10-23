// MVP 의 Lesson 9 차시/활동 구성을 읽어 0006 흐름 마이그레이션을 만든다.
// 사용법: node tools/gen-flow-l9.mjs > supabase/migrations/0006_flow.sql
import vm from 'node:vm'; import fs from 'node:fs';
const A = process.env.MVP_JS || '/mnt/user-data/outputs/app/js/';
const w = { console, setTimeout }; w.window = w; w.MG = {}; vm.createContext(w);
for (const f of ['icons', 'items', 'content', 'content2']) vm.runInContext(fs.readFileSync(A + f + '.js', 'utf8'), w);
const U = w.MG.UNITS[2];
const q = (s) => "'" + String(s ?? '').replace(/'/g, "''") + "'";
const o = [];
o.push(fs.readFileSync(new URL('./flow-head.sql', import.meta.url), 'utf8'));
o.push("-- ===== 기본 템플릿: 비상 초5 표준 (Lesson 9 의 구성에서 추출) =====");
o.push("insert into flow_templates(name, note) values ('비상 초5 표준', 'Lesson 9 구성에서 만든 기본 흐름') on conflict (name) do nothing;");
const tpl = "(select id from flow_templates where name='비상 초5 표준')";
const LS = [...U.LESSONS, { no: 7, en: 'Lesson Check', ko: '단원 종합 점검', goal: '단원 전체를 점검하고 내 약점을 찾는다.', c: 'navy' }, { no: 8, en: 'Personalized Mastery', ko: '내 결과에 맞춘 보강', goal: '7차시 결과에 맞춰 부족한 부분을 보강한다.', c: 'grape' }];
for (const ls of LS) {
  o.push(`insert into flow_lessons(template_id, no, en, ko, goal, color) values (${tpl}, ${ls.no}, ${q(ls.en)}, ${q(ls.ko)}, ${q(ls.goal)}, ${q(ls.c)});`);
  const acts = ls.no === 7 ? [{ t: 'Lesson Check', ko: '단원 종합 점검', min: 10, special: 'diagnostic' }]
    : ls.no === 8 ? [{ t: 'Personalized Review', ko: '맞춤 복습', min: 10, special: 'adaptive' }]
    : (ls.acts || []).map((a) => ({ t: a.t, ko: a.ko, min: a.min }));
  acts.forEach((a, i) => o.push(`insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, special) select id, ${i}, ${q(a.t)}, ${q(a.ko)}, ${a.min ?? 'null'}, ${a.special ? q(a.special) : 'null'} from flow_lessons where template_id=${tpl} and no=${ls.no};`));
}
o.push(fs.readFileSync(new URL('./flow-tail.sql', import.meta.url), 'utf8'));
console.log(o.join('\n'));
