import { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import { PageHead } from './ui';
import { specOf } from './ItemForm';
import { openPreview } from './ui';
import { NativePlayer } from '@mango/play';
import { NATIVE_SAMPLES, SAMPLE_VOCAB, isNativeKind } from './samples';

export const CATEGORIES = ['어휘', '표현', '듣기', '말하기', '읽기', '쓰기', '공통'];
export interface KindRow { key: string; name_ko: string; name_en?: string; description: string; category: string; sort: number; active: boolean }

/** 활동 템플릿 관리: 목록(영역별), 이름·설명·영역·사용 여부 수정, 입력 항목과 사용 현황 보기 */
export function Types() {
  const [rows, setRows] = useState<KindRow[] | null>(null);
  const [use, setUse] = useState<Record<string, { items: number; units: number }>>({});
  const [selKey, setSelKey] = useState<string | null>(null);
  const [cat, setCat] = useState('전체');
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; s: string } | null>(null);

  async function load() {
    const r = await supabase.from('activity_types').select('key,name_ko,name_en,description,category,sort,active');
    if (r.error) { setMsg({ t: 'err', s: r.error.message }); return; }
    setRows(((r.data ?? []) as KindRow[]).sort((a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) || a.sort - b.sort));
    const it = await supabase.from('items').select('template,unit_id').limit(20000);
    const m: Record<string, { items: number; units: Set<string> }> = {};
    ((it.data ?? []) as { template: string; unit_id: string }[]).forEach((x) => { const e = (m[x.template] ??= { items: 0, units: new Set() }); e.items++; e.units.add(x.unit_id); });
    setUse(Object.fromEntries(Object.entries(m).map(([k, v]) => [k, { items: v.items, units: v.units.size }])));
  }
  useEffect(() => { void load(); }, []);

  const shown = useMemo(() => (rows ?? []).filter((r) => cat === '전체' || r.category === cat), [rows, cat]);
  const sel = rows?.find((r) => r.key === selKey) ?? null;

  return (
    <>
      <PageHead title="활동 템플릿" sub="문항이 쓰는 활동 화면의 종류예요. 이름·설명·영역·사용 여부를 여기서 관리하고, 새 템플릿이 필요하면 Claude에게 요청해 주세요." />
      {msg && <p className={msg.t === 'ok' ? 'mx-ok' : 'mx-err'}>{msg.s}</p>}
      <div className="mx-seg">
        {['전체', ...CATEGORIES].map((c) => <button key={c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{c}</button>)}
      </div>
      {!rows ? <p className="mx-muted">불러오는 중…</p> : (
        <div className="mx-grid">
          <div className="mx-card">
            <table>
              <thead><tr><th className="mx-no">No</th><th>영역</th><th>한글 이름</th><th>영어 이름</th><th>코드</th><th>설명</th><th>문항</th><th>단원</th><th>상태</th></tr></thead>
              <tbody>
                {shown.map((r, n) => (
                  <tr key={r.key} className={'mx-click' + (r.key === selKey ? ' mx-sel' : '')} onClick={() => setSelKey(r.key)}>
                    <td className="mx-no">{n + 1}</td><td>{r.category}</td><td><b>{r.name_ko}</b></td><td>{r.name_en}</td><td><code>{r.key}</code></td><td className="mx-muted">{r.description}</td>
                    <td>{use[r.key]?.items ?? 0}</td><td>{use[r.key]?.units ?? 0}</td>
                    <td><span className={'mx-chip ' + (r.active ? 'approved' : 'draft')}>{r.active ? '사용' : '숨김'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!shown.length && <p className="mx-muted">이 영역에는 템플릿이 없어요.</p>}
          </div>
          <div className="mx-card">
            {sel ? <Detail key={sel.key} row={sel} use={use[sel.key]} onSaved={(m) => { setMsg(m); void load(); }} /> : <p className="mx-muted">왼쪽에서 템플릿을 선택하면 입력 항목과 사용 현황을 보고 고칠 수 있어요.</p>}
          </div>
        </div>
      )}
    </>
  );
}

function Detail({ row, use, onSaved }: { row: KindRow; use?: { items: number; units: number }; onSaved: (m: { t: 'ok' | 'err'; s: string }) => void }) {
  const [f, setF] = useState(row);
  const dirty = JSON.stringify(f) !== JSON.stringify(row);
  const fields = specOf(row.key);
  const [pmsg, setPmsg] = useState('');
  async function sample() {
    setPmsg('');
    const err = await openPreview(async () => {
      if (isNativeKind(row.key)) return { kind: 'native', items: [NATIVE_SAMPLES[row.key]], vocab: SAMPLE_VOCAB, title: row.name_ko };
      const r = await supabase.from('items').select('payload').eq('template', row.key).eq('status', 'approved').limit(1);
      const p = r.data?.[0]?.payload;
      if (!p) return '아직 승인된 문항이 없어서 보여줄 샘플이 없어요. 이 템플릿으로 문항을 하나 만들어 승인한 뒤 다시 눌러 주세요.';
      return { kind: 'legacy', items: [p], level: 'CORE', title: row.name_ko };
    });
    if (err) setPmsg(err);
  }
  async function save() {
    const { error } = await supabase.from('activity_types').update({ name_ko: f.name_ko.trim(), name_en: (f.name_en ?? '').trim(), description: f.description, category: f.category, active: f.active }).eq('key', row.key);
    onSaved(error ? { t: 'err', s: '저장 실패: ' + error.message } : { t: 'ok', s: '저장했어요.' });
  }
  return (
    <>
      <h3>{row.name_ko} <code className="mx-muted">{row.key}</code></h3>
      <div className="mx-form">
        <div className="mx-prev">
          {isNativeKind(row.key) && (
            <button type="button" className="mx-thumb" onClick={sample} title="눌러서 크게 보기" aria-label="샘플 미리보기 화면 (눌러서 크게 보기)">
              <div className="mx-thumb-in"><NativePlayer key={row.key} title={row.name_ko} items={[NATIVE_SAMPLES[row.key]]} vocab={SAMPLE_VOCAB} onResult={() => {}} onFinish={() => {}} /></div>
            </button>
          )}
          <div className="mx-prev-side">
            <button type="button" className="mx-btn" onClick={sample}>▶ 샘플 미리보기</button>
            <span className="mx-muted">학습앱과 같은 화면(1280×800)으로 직접 눌러 볼 수 있어요.</span>
          </div>
        </div>
        <div className="mx-row">
          <label className="mx-f"><span className="mx-fl">한글 이름</span><input value={f.name_ko} onChange={(e) => setF({ ...f, name_ko: e.target.value })} /></label>
          <label className="mx-f"><span className="mx-fl">영어 이름</span><input value={f.name_en ?? ''} onChange={(e) => setF({ ...f, name_en: e.target.value })} /></label>
        </div>
        <label className="mx-f"><span className="mx-fl">설명</span><textarea className="mx-ta" rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
        <div className="mx-row">
          <label className="mx-f"><span className="mx-fl">영역</span><select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="mx-f mx-chk" style={{ marginTop: 18 }}><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />사용 (끄면 새 문항을 만들 때 목록에서 숨겨요)</label>
        </div>
        <div className="mx-f"><span className="mx-fl">입력 항목 (이 템플릿으로 문항을 만들 때 채우는 칸)</span>
          <table className="mx-mini"><thead><tr><th>항목</th><th>형식</th><th style={{ width: 50 }}>필수</th></tr></thead>
            <tbody>{fields.map((x, i) => <tr key={i}><td>{x.label}</td><td className="mx-muted">{x.type}</td><td>{x.req ? '●' : ''}</td></tr>)}</tbody></table>
          <span className="mx-muted">입력 항목을 바꾸거나 늘리려면 Claude에게 요청해 주세요. (화면 코드와 함께 바뀌어요)</span>
        </div>
        {pmsg && <p className="mx-err">{pmsg}</p>}
        <p className="mx-muted">사용 현황: 문항 {use?.items ?? 0}개 · 단원 {use?.units ?? 0}개</p>
        <div className="mx-row"><button className="mx-btn" disabled={!dirty || !f.name_ko.trim()} onClick={save}>저장</button><button className="mx-btn sec" disabled={!dirty} onClick={() => setF(row)}>되돌리기</button></div>
      </div>
    </>
  );
}
