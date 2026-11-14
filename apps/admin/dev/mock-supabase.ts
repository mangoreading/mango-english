/* 관리 화면 확인용 가짜 supabase (로그인·서버 없이 화면만 띄운다). 실제 코드는 건드리지 않는다. */
type Row = Record<string, any>;
let seq = 1000;
const uid = (p: string) => `${p}-${++seq}`;
export const db: Record<string, Row[]> = {
  publishers: [{ id: 'pub1', name: '비상교육' }, { id: 'pub-test', name: '테스트' }],
  flow_templates: [{ id: 'tpl1', name: '비상 초5 표준', note: '', publisher_id: 'pub1', grade: 5 }],
  activity_types: [
    ['vocabcard', '낱말 카드', 'Word Cards', 'vocab'], ['listenpick', '듣고 고르기', 'Listen & Pick', 'listen'], ['scene', '장면 영상 보기', 'Scene story', 'listen'],
    ['mtext', '글 읽고 따라 읽기', 'Model Text', 'read'], ['pread', '소리 내어 읽기', 'Passage Read Aloud', 'read'], ['aitalk', 'AI 자유 대화', 'AI Free Talk', 'speak'],
    ['rephrase', '문장 바꿔 말하기', 'Rephrase', 'speak'], ['mastery', '마스터리 체크', 'Mastery Check', 'check'],
  ].map(([key, name_ko, name_en, category], i) => ({ key, name_ko, name_en, category, importance: null, active: true, sort: i })),
  flow_lessons: [], flow_steps: [], items: [],
};
(function seed() {
  const defs: Array<[string, string, string?][]> = [
    [['vocabcard', 'Word Cards'], ['listenpick', 'Listen & Pick'], ['rephrase', 'Rephrase'], ['mastery', 'Mastery Check']],
    [['scene', 'Scene story'], ['rephrase', 'Rephrase'], ['aitalk', 'AI Free Talk']],
    [['mtext', 'Model Text'], ['pread', 'Passage Read Aloud'], ['rephrase', 'Rephrase']],
  ] as any;
  defs.forEach((steps, li) => {
    const lid = `les${li + 1}`;
    db.flow_lessons.push({ id: lid, template_id: 'tpl1', unit_id: null, no: li + 1, en: `Lesson ${li + 1}`, ko: `${li + 1}차시`, goal: '', color: '#2f6fed', track: 'core', src_id: null });
    steps.forEach(([kind, name], si) => db.flow_steps.push({ id: `${lid}-s${si + 1}`, lesson_id: lid, pos: si + 1, name_en: name, name_ko: name, minutes: 2 + si, qty: 1 + si, special: null, src_id: null, kind, study: true, homework: si === 1, ref_step_id: null, opts: {} }));
  });
  db.flow_steps.find((s) => s.id === 'les3-s3')!.ref_step_id = 'les1-s3';
  db.flow_steps.find((s) => s.id === 'les1-s4')!.special = 'diagnostic';
})();

class Q implements PromiseLike<any> {
  private f: Array<(r: Row) => boolean> = []; private ord?: [string, boolean]; private lim?: number; private act: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: any; private one = false; private head = false; private cols = '*'; private cnt = false;
  constructor(private t: string) {}
  select(c = '*', o?: any) { if (this.act === 'select') this.cols = c; if (o?.head) this.head = true; if (o?.count) this.cnt = true; return this; }
  insert(p: any) { this.act = 'insert'; this.payload = p; return this; }
  update(p: any) { this.act = 'update'; this.payload = p; return this; }
  delete() { this.act = 'delete'; return this; }
  eq(k: string, v: any) { this.f.push((r) => r[k] === v); return this; }
  order(k: string, o?: any) { this.ord = [k, o?.ascending !== false]; return this; }
  limit(n: number) { this.lim = n; return this; }
  single() { this.one = true; return this; }
  private embed(r: Row) {
    const out = { ...r };
    if (this.t === 'flow_lessons' && /flow_steps/.test(this.cols)) out.flow_steps = db.flow_steps.filter((s) => s.lesson_id === r.id).map((s) => ({ ...s }));
    if (this.t === 'flow_templates' && /publishers/.test(this.cols)) out.publishers = db.publishers.find((p) => p.id === r.publisher_id) ?? null;
    return out;
  }
  private run() {
    const tab = (db[this.t] ??= []);
    if (this.act === 'insert') {
      const arr = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((p: Row) => ({ id: uid(this.t), ...p }));
      tab.push(...arr);
      return { data: this.one ? arr[0] : arr, error: null };
    }
    const hit = tab.filter((r) => this.f.every((fn) => fn(r)));
    if (this.act === 'update') { hit.forEach((r) => Object.assign(r, this.payload)); return { data: hit, error: null }; }
    if (this.act === 'delete') { db[this.t] = tab.filter((r) => !hit.includes(r)); return { data: null, error: null }; }
    let rows = hit.map((r) => this.embed(r));
    if (this.ord) { const [k, asc] = this.ord; rows.sort((a, b) => (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * (asc ? 1 : -1)); }
    if (this.lim) rows = rows.slice(0, this.lim);
    if (this.head) return { data: null, count: rows.length, error: null };
    return { data: this.one ? rows[0] ?? null : rows, count: this.cnt ? rows.length : undefined, error: null };
  }
  then<A, B>(ok?: (v: any) => A, bad?: (e: any) => B) { return Promise.resolve().then(() => this.run()).then(ok, bad); }
}
export const configured = true;
export const configProblem = '';
export const supabase = {
  from: (t: string) => new Q(t),
  rpc: async () => ({ data: null, error: null }),
  auth: { signOut: async () => ({}) },
} as any;
