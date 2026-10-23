import { useEffect, useState } from 'react';
import { ActivityItem, KINDS } from '@mango/schema';

type Obj = Record<string, any>;
type Col = { k: string; label: string; t: 'text' | 'area' | 'bool' | 'sel' | 'lines' | 're'; opts?: [string, string][]; w?: number; when?: (r: Obj) => boolean };
type Field =
  | { k: string; label: string; t: 'text' | 'area' | 'num' | 'bool' | 'lines' | 'tag' | 'words'; help?: string; req?: boolean }
  | { k: string; label: string; t: 'rows'; cols: Col[]; blank: () => Obj; help?: string; req?: boolean }
  | { k: string; label: string; t: 'choices'; ans?: string; help?: string; req?: boolean }
  | { k: string; label: string; t: 'obj'; fields: Field[]; help?: string; req?: boolean };

export const KIND_NAME: Record<string, string> = {
  learn: '학습 카드', text: '지문', brief: '미션 안내', choose: '고르기', match: '짝 맞추기', build: '배열하기',
  fill: '빈칸 채우기', write: '쓰기', compose: '작문', speak: '말하기', fade: '점점 지우기', dialog: '대화',
};
export const TAGS: [string, string][] = [['vocab', '어휘'], ['expr', '표현'], ['listen', '듣기'], ['speak', '말하기'], ['read', '읽기'], ['write', '쓰기']];

const persona = (req: boolean): Field => ({ k: 'persona', label: '말하는 사람', t: 'obj', req, fields: [{ k: 'key', label: '인물 코드', t: 'text', req: true }, { k: 'line', label: '상황 한 줄', t: 'text', req: true }] });
const typed: Field[] = [
  { k: 'q', label: '문제', t: 'text' }, { k: 'ans', label: '정답', t: 'text', req: true }, { k: 'alts', label: '다른 정답(한 줄에 하나)', t: 'lines' },
  { k: 'ko', label: '한글 뜻', t: 'text' }, { k: 'fb', label: '정답 후 설명', t: 'text' }, { k: 'wide', label: '넓은 입력칸', t: 'bool' },
];

const SPEC: Record<string, Field[]> = {
  learn: [
    { k: 'title', label: '제목', t: 'text', req: true },
    { k: 'cards', label: '카드', t: 'rows', req: true, blank: () => ({ en: '', ko: '' }), cols: [
      { k: 'flag', label: '그림 코드', t: 'text', w: 100 }, { k: 'en', label: '영어', t: 'text' }, { k: 'ko', label: '한글', t: 'text' }, { k: 'say', label: '읽어줄 문장', t: 'text' }] },
  ],
  text: [
    { k: 'title', label: '제목', t: 'text' }, { k: 'text', label: '영어 지문', t: 'area', req: true }, { k: 'ko', label: '한글 번역', t: 'area' }, { k: 'book', label: '출처(원서 코드)', t: 'text' },
  ],
  brief: [
    { k: 'title', label: '제목', t: 'text', req: true }, { k: 'text', label: '안내 문장', t: 'area', req: true }, { k: 'people', label: '등장 인물 코드(한 줄에 하나)', t: 'lines' },
  ],
  choose: [
    { k: 'q', label: '문제', t: 'area', req: true },
    { k: 'opts', label: '보기 (정답 선택)', t: 'choices', ans: 'a', req: true },
    { k: 'say', label: '들려줄 문장(듣기 문제)', t: 'text' }, { k: 'script', label: '들려줄 대화(한 줄에 하나)', t: 'lines' },
    { k: 'blank', label: '문제 속 빈칸 표시', t: 'bool' }, { k: 'bubble', label: '말풍선 문장', t: 'text' }, { k: 'pic', label: '그림 코드', t: 'text' }, { k: 'fb', label: '정답 후 설명', t: 'text' },
  ],
  match: [
    { k: 'title', label: '제목', t: 'text', req: true },
    { k: 'pairs', label: '왼쪽 항목 (그림코드 / 들려줄 말)', t: 'rows', req: true, blank: () => ({ key: '', say: '' }), cols: [{ k: 'key', label: '그림 코드', t: 'text', w: 140 }, { k: 'say', label: '들려줄 문장', t: 'text' }] },
    { k: 'right', label: '오른쪽 보기 (한 줄에 하나, 왼쪽과 같은 순서)', t: 'lines', req: true },
  ],
  build: [
    { k: 'ko', label: '한글 뜻', t: 'text' }, { k: 'ans', label: '정답 문장', t: 'text', req: true }, { k: 'words', label: '섞을 단어 (공백으로 구분)', t: 'words', req: true },
  ],
  fill: typed, write: typed,
  compose: [
    { k: 'title', label: '제목', t: 'text', req: true }, { k: 'kind', label: '종류 메모', t: 'text' }, persona(false),
    { k: 'rules', label: '체크 규칙', t: 'rows', req: true, blank: () => ({ label: '' }), cols: [{ k: 'label', label: '규칙 설명', t: 'text' }, { k: 're', label: '패턴(정규식)', t: 're' }] },
    { k: 'minSent', label: '최소 문장 수', t: 'num' }, { k: 'sample', label: '예시 답안', t: 'area', req: true }, { k: 'starter', label: '시작 문장', t: 'text' }, { k: 'tip', label: '팁', t: 'text' },
  ],
  speak: [
    { k: 'prompt', label: '안내 문구', t: 'text' }, { k: 'target', label: '따라 말할 문장', t: 'text', req: true }, { k: 'disp', label: '화면 표시 문장(다르게 보일 때)', t: 'text' },
    { k: 'accept', label: '인정 답(한 줄에 하나)', t: 'lines' }, { k: 'ask', label: '먼저 들려줄 질문', t: 'text' },
    { k: 'hide', label: '문장 숨기기', t: 'bool' }, { k: 'listen', label: '먼저 듣기', t: 'bool' }, { k: 'autoplay', label: '자동 재생', t: 'bool' },
  ],
  fade: [
    { k: 'target', label: '목표 문장', t: 'text', req: true }, { k: 'ask', label: '먼저 들려줄 질문', t: 'text' }, { k: 'accept', label: '인정 답(한 줄에 하나)', t: 'lines' },
    { k: 'q1', label: '1단계 문구', t: 'text' }, { k: 'prompt3', label: '3단계 문구', t: 'text' }, { k: 'opts', label: '보기 (정답 선택)', t: 'choices', ans: 'a' }, { k: 'fb', label: '정답 후 설명', t: 'text' },
  ],
  dialog: [
    persona(true),
    { k: 'ai', label: 'AI 상대', t: 'obj', fields: [{ k: 'key', label: '인물 코드', t: 'text' }, { k: 'shop', label: '가게 역할', t: 'bool' }] },
    { k: 'turns', label: '대화 순서', t: 'rows', req: true, blank: () => ({ who: 'ai', text: '' }), cols: [
      { k: 'who', label: '누가', t: 'sel', opts: [['ai', 'AI'], ['me', '나']], w: 70 },
      { k: 'text', label: 'AI 말', t: 'text', when: (r) => r.who === 'ai' },
      { k: 'accept', label: '인정 답(한 줄에 하나)', t: 'lines', when: (r) => r.who === 'me' },
      { k: 'opts', label: '보기(한 줄에 하나, 선택)', t: 'lines', when: (r) => r.who === 'me' },
      { k: 're', label: '패턴(정규식)', t: 're', when: (r) => r.who === 'me' }] },
    { k: 'free', label: '자유 대화', t: 'obj', fields: [{ k: 'n', label: '자유 대화 횟수', t: 'num' }] },
  ],
};
const COMMON: Field[] = [
  { k: 'tag', label: '영역', t: 'tag' }, { k: 'lo', label: '학습목표 코드', t: 'text' }, { k: 'flag', label: '상황 그림 코드', t: 'text' },
  { k: 'ctx', label: '말하는 사람 카드', t: 'obj', fields: [{ k: 'key', label: '인물 코드', t: 'text' }, { k: 'line', label: '상황 한 줄', t: 'text' }] },
];

export function defaultItem(kind: string): Obj {
  switch (kind) {
    case 'learn': return { k: 'learn', title: '', cards: [{ en: '', ko: '' }] };
    case 'text': return { k: 'text', text: '' };
    case 'brief': return { k: 'brief', title: '', text: '', people: [] };
    case 'choose': return { k: 'choose', q: '', opts: [{ t: '' }, { t: '' }, { t: '' }], a: 0 };
    case 'match': return { k: 'match', title: '', pairs: [{ key: '', say: '' }, { key: '', say: '' }], right: ['', ''] };
    case 'build': return { k: 'build', ans: '', words: [] };
    case 'fill': case 'write': return { k: kind, ans: '' };
    case 'compose': return { k: 'compose', title: '', rules: [{ label: '' }], minSent: 1, sample: '' };
    case 'speak': return { k: 'speak', target: '' };
    case 'fade': return { k: 'fade', target: '' };
    default: return { k: 'dialog', persona: { key: '', line: '' }, turns: [{ who: 'ai', text: '' }, { who: 'me', accept: [] }] };
  }
}

const blankish = (v: unknown) => v === '' || v == null || (Array.isArray(v) && v.length === 0);
const pathOf = (f: Field) => f.k;
function allFields(kind: string): Field[] { return [...(SPEC[kind] ?? []), ...COMMON]; }

/** 검증: JSON 오류를 한글 안내로 바꿔 돌려준다 */
export function validate(obj: Obj): { ok: boolean; problems: string[] } {
  const r = ActivityItem.safeParse(obj);
  if (r.success) return { ok: true, problems: [] };
  const fields = allFields(obj.k);
  const out: string[] = [];
  for (const i of r.error.issues) {
    const p = i.path.map(String);
    let label = '';
    let list: Field[] | undefined = fields; let colList: Col[] | undefined;
    const parts: string[] = [];
    for (const seg of p) {
      if (/^\d+$/.test(seg)) { parts.push(`${Number(seg) + 1}번째`); continue; }
      const f: any = list?.find((x) => x.k === seg) ?? colList?.find((x) => x.k === seg);
      parts.push(f?.label ?? seg);
      list = f?.fields; colList = f?.cols;
    }
    label = parts.join(' › ') || '문항';
    let msg = i.message;
    if (i.code === 'invalid_type' && (i as any).received === 'undefined') msg = '비어 있어요';
    else if (i.code === 'invalid_type') msg = '형식이 맞지 않아요';
    else if (i.code === 'too_small') msg = (i as any).type === 'string' ? '비어 있어요' : `최소 ${(i as any).minimum}개가 필요해요`;
    else if (i.code === 'invalid_union') msg = '형식이 맞지 않아요';
    out.push(`${label}: ${msg}`);
  }
  return { ok: false, problems: [...new Set(out)].slice(0, 8) };
}

export function ItemForm({ obj, onChange, keys }: { obj: Obj; onChange: (o: Obj) => void; keys: string[] }) {
  const set = (k: string, v: unknown) => { const n = { ...obj }; if (blankish(v)) delete n[k]; else n[k] = v; onChange(n); };
  return (
    <div className="mx-form">
      <datalist id="mx-keys">{keys.map((k) => <option key={k} value={k} />)}</datalist>
      {(SPEC[obj.k] ?? []).map((f) => <FieldRow key={pathOf(f)} f={f} v={obj[f.k]} root={obj} set={set} />)}
      <details className="mx-more"><summary>공통 항목 (영역·학습목표·그림·말하는 사람)</summary>
        {COMMON.map((f) => <FieldRow key={pathOf(f)} f={f} v={obj[f.k]} root={obj} set={set} />)}
      </details>
    </div>
  );
}

function FieldRow({ f, v, root, set }: { f: Field; v: any; root: Obj; set: (k: string, v: unknown) => void }) {
  const lab = <span className="mx-fl">{f.label}{f.req && <em>*</em>}</span>;
  if (f.t === 'bool') return <label className="mx-f mx-chk"><input type="checkbox" checked={!!v} onChange={(e) => set(f.k, e.target.checked ? true : undefined)} />{f.label}</label>;
  if (f.t === 'text') return <label className="mx-f">{lab}<input list={/그림|code|flag|key|인물/i.test(f.label) || f.k === 'flag' ? 'mx-keys' : undefined} value={v ?? ''} onChange={(e) => set(f.k, e.target.value)} /></label>;
  if (f.t === 'area') return <label className="mx-f">{lab}<textarea className="mx-ta" value={v ?? ''} onChange={(e) => set(f.k, e.target.value)} /></label>;
  if (f.t === 'num') return <label className="mx-f">{lab}<input type="number" min={1} style={{ width: 90 }} value={v ?? ''} onChange={(e) => set(f.k, e.target.value === '' ? undefined : Number(e.target.value))} /></label>;
  if (f.t === 'tag') return <label className="mx-f">{lab}<select value={v ?? ''} onChange={(e) => set(f.k, e.target.value || undefined)}><option value="">(없음)</option>{TAGS.map(([a, b]) => <option key={a} value={a}>{b}</option>)}</select></label>;
  if (f.t === 'lines') return <label className="mx-f">{lab}<Lines v={v} onChange={(a) => set(f.k, a)} /></label>;
  if (f.t === 'words') return (
    <div className="mx-f">{lab}
      <div className="mx-row"><input style={{ flex: 1 }} value={(v ?? []).join(' ')} onChange={(e) => set(f.k, e.target.value.split(/\s+/).filter(Boolean))} />
        <button type="button" className="mx-btn sec" onClick={() => set(f.k, String(root.ans ?? '').split(/\s+/).filter(Boolean).sort(() => Math.random() - 0.5))}>정답에서 섞어 만들기</button></div>
    </div>
  );
  if (f.t === 'obj') {
    const o = v ?? {};
    const setSub = (k: string, x: unknown) => { const n = { ...o }; if (blankish(x)) delete n[k]; else n[k] = x; set(f.k, Object.keys(n).length || f.req ? n : undefined); };
    return <fieldset className="mx-fs"><legend>{f.label}{f.req && <em>*</em>}</legend>{f.fields.map((s) => <FieldRow key={s.k} f={s} v={o[s.k]} root={o} set={setSub} />)}</fieldset>;
  }
  if (f.t === 'choices') {
    const opts: { t: string; flag?: string }[] = v ?? [];
    const upd = (i: number, patch: Obj) => { const n = opts.map((o, j) => (j === i ? { ...o, ...patch } : o)).map((o) => (o.flag === '' ? { t: o.t } : o)); set(f.k, n); };
    const ans = f.ans ? (root[f.ans] as number | undefined) : undefined;
    return (
      <div className="mx-f">{lab}
        <table className="mx-mini"><thead><tr>{f.ans && <th style={{ width: 40 }}>정답</th>}<th>보기</th><th style={{ width: 120 }}>그림 코드</th><th style={{ width: 36 }} /></tr></thead>
          <tbody>{opts.map((o, i) => (
            <tr key={i}>
              {f.ans && <td><input type="radio" checked={ans === i} onChange={() => set(f.ans!, i)} /></td>}
              <td><input className="mx-cell" value={o.t} onChange={(e) => upd(i, { t: e.target.value })} /></td>
              <td><input className="mx-cell" list="mx-keys" value={o.flag ?? ''} onChange={(e) => upd(i, { flag: e.target.value })} /></td>
              <td><button type="button" className="mx-btn sec" onClick={() => { set(f.k, opts.filter((_, j) => j !== i)); if (f.ans && ans != null && ans >= i && ans > 0) set(f.ans, ans === i ? 0 : ans - 1); }}>×</button></td>
            </tr>))}</tbody></table>
        <button type="button" className="mx-btn sec" onClick={() => set(f.k, [...opts, { t: '' }])}>+ 보기 추가</button>
      </div>
    );
  }
  const rf = f as Extract<Field, { t: 'rows' }>;
  const rows: Obj[] = v ?? [];
  const updRow = (i: number, patch: Obj) => set(f.k, rows.map((r, j) => {
    if (j !== i) return r;
    const n = { ...r, ...patch };
    Object.keys(n).forEach((k) => { if (blankish(n[k]) && k !== 'who' && !rf.cols.find((c) => c.k === k && ['en', 'ko', 'key', 'say', 'label', 'text'].includes(k))) delete n[k]; });
    if (patch.who === 'ai') return { who: 'ai', text: n.text ?? '' };
    if (patch.who === 'me') return { who: 'me', accept: n.accept ?? [] };
    return n;
  }));
  return (
    <div className="mx-f">{lab}
      <table className="mx-mini"><thead><tr><th style={{ width: 28 }}>#</th>{rf.cols.map((c) => <th key={c.k} style={c.w ? { width: c.w } : undefined}>{c.label}</th>)}<th style={{ width: 80 }} /></tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i}><td>{i + 1}</td>
            {rf.cols.map((c) => <td key={c.k}>{c.when && !c.when(r) ? '' : <Cell c={c} r={r} onChange={(x) => updRow(i, { [c.k]: x })} />}</td>)}
            <td className="mx-act">
              <button type="button" className="mx-btn sec" disabled={i === 0} onClick={() => { const n = [...rows]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set(f.k, n); }}>↑</button>
              <button type="button" className="mx-btn sec" onClick={() => set(f.k, rows.filter((_, j) => j !== i))}>×</button>
            </td></tr>))}</tbody></table>
      <button type="button" className="mx-btn sec" onClick={() => set(f.k, [...rows, rf.blank()])}>+ 행 추가</button>
    </div>
  );
}

function Cell({ c, r, onChange }: { c: Col; r: Obj; onChange: (v: unknown) => void }) {
  const v = r[c.k];
  if (c.t === 'sel') return <select value={v ?? ''} onChange={(e) => onChange(e.target.value)}>{c.opts!.map(([a, b]) => <option key={a} value={a}>{b}</option>)}</select>;
  if (c.t === 'bool') return <input type="checkbox" checked={!!v} onChange={(e) => onChange(e.target.checked || undefined)} />;
  if (c.t === 'lines') return <Lines v={v} onChange={onChange} rows={2} />;
  if (c.t === 're') return <input className="mx-cell" placeholder="예: how much" value={v?.source ?? ''} onChange={(e) => onChange(e.target.value ? { source: e.target.value, flags: v?.flags ?? 'i' } : undefined)} />;
  return <input className="mx-cell" list={c.k === 'key' || c.k === 'flag' ? 'mx-keys' : undefined} value={v ?? ''} onChange={(e) => onChange(e.target.value)} />;
}

/** 한 줄에 하나씩 입력하는 목록 칸. 입력 중 원문(빈 줄 포함)을 따로 보관하고, 바깥에서 값이 바뀌면 다시 맞춘다 */
function Lines({ v, onChange, rows }: { v?: string[]; onChange: (a: string[]) => void; rows?: number }) {
  const parse = (x: string) => x.split('\n').map((q) => q.trim()).filter(Boolean);
  const joined = (v ?? []).join('\n');
  const [t, setT] = useState(joined);
  useEffect(() => { if (parse(t).join('\n') !== joined) setT(joined); /* eslint-disable-next-line */ }, [joined]);
  return <textarea className="mx-ta" rows={rows ?? 3} value={t} onChange={(e) => { setT(e.target.value); onChange(parse(e.target.value)); }} />;
}
export { KINDS };
