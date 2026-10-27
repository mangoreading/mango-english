import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../shared/supabase';
import { PageHead } from '../../shared/ui';
import { specOf } from '../units/ItemForm';
import { openPreview } from '../../shared/ui';
import { NativePlayer } from '@mango/play';
import { NATIVE_SAMPLES, SAMPLE_VOCAB, isNativeKind } from '../../shared/samples';

export const CATEGORIES = ['어휘', '표현', '듣기', '말하기', '읽기', '쓰기', '공통'];
/** 영역 표시 이름 (DB에는 한글 값 그대로 저장) */
export const CAT_EN: Record<string, string> = { 어휘: 'Vocab', 표현: 'Expression', 듣기: 'Listening', 말하기: 'Speaking', 읽기: 'Reading', 쓰기: 'Writing', 공통: 'Common' };
export const catLabel = (c: string) => CAT_EN[c] ?? c;
export interface KindRow { key: string; name_ko: string; name_en?: string; version?: number; description: string; category: string; sort: number; active: boolean; importance?: string | null }

/** 활동 템플릿 관리: 목록(영역별), 이름·설명·영역·사용 여부 수정, 입력 항목과 사용 현황 보기 */
export function Types() {
  const [rows, setRows] = useState<KindRow[] | null>(null);
  const [use, setUse] = useState<Record<string, { items: number; units: number; old: number }>>({});
  const [selKey, setSelKey] = useState<string | null>(null);
  const [cat, setCat] = useState('전체');
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; s: string } | null>(null);
  useEffect(() => { if (msg?.t !== 'ok') return; const id = setTimeout(() => setMsg(null), 1200); return () => clearTimeout(id); }, [msg]);

  async function load() {
    const r = await supabase.from('activity_types').select('key,name_ko,name_en,version,description,category,sort,active,importance');
    if (r.error) { setMsg({ t: 'err', s: r.error.message }); return; }
    setRows(((r.data ?? []) as KindRow[]).sort((a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) || a.sort - b.sort));
    const it = await supabase.from('items').select('template,unit_id,tpl_ver').limit(20000);
    const ver = Object.fromEntries(((r.data ?? []) as KindRow[]).map((k) => [k.key, k.version ?? 1]));
    const m: Record<string, { items: number; units: Set<string>; old: number }> = {};
    ((it.data ?? []) as { template: string; unit_id: string; tpl_ver: number }[]).forEach((x) => { const e = (m[x.template] ??= { items: 0, units: new Set(), old: 0 }); e.items++; e.units.add(x.unit_id); if (x.tpl_ver < (ver[x.template] ?? 1)) e.old++; });
    setUse(Object.fromEntries(Object.entries(m).map(([k, v]) => [k, { items: v.items, units: v.units.size, old: v.old }])));
  }
  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => (rows ?? []).filter((r) => !OLD12.includes(r.key)), [rows]);
  const shown = useMemo(() => visible.filter((r) => cat === '전체' || r.category === cat), [rows, cat]);
  const sel = rows?.find((r) => r.key === selKey) ?? null;

  return (
    <>
      <PageHead title="활동 템플릿" sub="문항이 쓰는 활동 화면의 종류예요. 이름·설명·영역·사용 여부를 여기서 관리하고, 새 템플릿이 필요하면 Claude에게 요청해 주세요." />
      {msg?.t === 'err' && <p className="mx-err">{msg.s}</p>}
      {msg?.t === 'ok' && <div className="mx-toast" role="status">{msg.s}</div>}
      <div className="mx-seg mx-seg-n">
        {['전체', ...CATEGORIES].map((c) => <button key={c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{c === '전체' ? 'All' : catLabel(c)} ({c === '전체' ? visible.length : visible.filter((x) => x.category === c).length})</button>)}
      </div>
      {!rows ? <p className="mx-muted">불러오는 중…</p> : (
        <div className="mx-grid">
          <div className="mx-card">
            <table className="mx-fixed">
              <colgroup><col style={{ width: 40 }} /><col style={{ width: '12%' }} /><col style={{ width: 84 }} /><col style={{ width: '24%' }} /><col /><col style={{ width: 96 }} /><col style={{ width: 56 }} /><col style={{ width: 64 }} /></colgroup>
              <thead><tr><th className="mx-no">No</th><th>영역</th><th>미리보기</th><th>한글 이름</th><th>영어 이름</th><th>중요도</th><th>버전</th><th>상태</th></tr></thead>
              <tbody>
                {shown.map((r, n) => (
                  <tr key={r.key} className={'mx-click' + (r.key === selKey ? ' mx-sel' : '')} onClick={() => setSelKey(r.key)}>
                    <td className="mx-no">{n + 1}</td><td>{catLabel(r.category)}</td><td>{isNativeKind(r.key) && <img className="mx-lthumb" src={`/thumbs/${r.key}.jpg`} alt="" loading="lazy" />}</td><td>{r.name_ko}</td><td>{r.name_en}</td><td>{r.importance ?? ''}</td><td>v{r.version ?? 1}</td>
                    
                    <td><span className={'mx-chip mx-chip-k ' + (r.active ? 'approved' : 'draft')}>{r.active ? '사용' : '숨김'}</span></td>
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

/** 기획서(PDF) 밖의 옛 12종: 목록에서 숨긴다(기존 Unit 2 문항이 아직 쓰고 있어 삭제하지 않음) */
const OLD12 = ['learn', 'text', 'brief', 'choose', 'match', 'build', 'fill', 'write', 'compose', 'speak', 'fade', 'dialog'];
function Detail({ row, use, onSaved }: { row: KindRow; use?: { items: number; units: number; old: number }; onSaved: (m: { t: 'ok' | 'err'; s: string }) => void }) {
  const [f, setF] = useState(row);
  const dirty = JSON.stringify(f) !== JSON.stringify(row);
  const fields = specOf(row.key);
  const [pmsg, setPmsg] = useState('');
  const [hist, setHist] = useState<{ version: number; level: string; note: string; created_at: string }[]>([]);
  useEffect(() => { void supabase.from('activity_type_versions').select('version,level,note,created_at').eq('key', row.key).order('version', { ascending: false }).then((r) => setHist((r.data ?? []) as typeof hist)); /* eslint-disable-next-line */ }, [row.key, row.version]);
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
    const { error } = await supabase.from('activity_types').update({ name_ko: f.name_ko.trim(), name_en: (f.name_en ?? '').trim(), description: f.description, category: f.category, importance: f.importance || null, active: f.active }).eq('key', row.key);
    onSaved(error ? { t: 'err', s: '저장 실패: ' + error.message } : { t: 'ok', s: '저장했어요.' });
  }
  const lvKo = (l: string) => (l === 'breaking' ? '깨지는 변경' : l === 'compatible' ? '호환 변경' : '안전 변경');
  return (
    <>
      <h3>{row.name_ko} <code className="mx-muted">{row.key}</code></h3>

      <section className="mx-sec">
        <div className="mx-sec-t">샘플 미리보기</div>
        <div className="mx-sec-b">
          <div className="mx-prev">
            {isNativeKind(row.key) && (
              <button type="button" className="mx-thumb" onClick={sample} title="눌러서 크게 보기" aria-label="샘플 미리보기 화면 (눌러서 크게 보기)">
                <div className="mx-thumb-in"><NativePlayer quiet key={row.key} title={row.name_ko} items={[NATIVE_SAMPLES[row.key]]} vocab={SAMPLE_VOCAB} onResult={() => {}} onFinish={() => {}} /></div>
              </button>
            )}
            <div className="mx-prev-side"><button type="button" className="mx-btn" onClick={sample}>▶ 샘플 미리보기</button></div>
          </div>
          {pmsg && <p className="mx-err">{pmsg}</p>}
        </div>
      </section>

      <section className="mx-sec">
        <div className="mx-sec-t">한글 이름 / 영어 이름</div>
        <div className="mx-sec-b mx-form">
          <div className="mx-row">
            <label className="mx-f"><span className="mx-fl">한글 이름</span><input value={f.name_ko} onChange={(e) => setF({ ...f, name_ko: e.target.value })} /></label>
            <label className="mx-f"><span className="mx-fl">영어 이름</span><input value={f.name_en ?? ''} onChange={(e) => setF({ ...f, name_en: e.target.value })} /></label>
          </div>
        </div>
      </section>

      <section className="mx-sec">
        <div className="mx-sec-t">설명</div>
        <div className="mx-sec-b mx-form">
          <textarea className="mx-ta" rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </div>
      </section>

      <section className="mx-sec">
        <div className="mx-sec-t">영역</div>
        <div className="mx-sec-b mx-form">
          <div className="mx-row">
            <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}</select>
            <select value={f.importance ?? ''} onChange={(e) => setF({ ...f, importance: e.target.value })}><option value="">중요도 없음</option>{['필수', '최우선 핵심', '핵심', '보조', '확장'].map((c) => <option key={c} value={c}>{c}</option>)}</select>
            <label className="mx-f mx-chk"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />사용 (끄면 새 문항을 만들 때 목록에서 숨겨요)</label>
          </div>
        </div>
      </section>

      <div className="mx-row mx-savebar"><button className="mx-btn" disabled={!dirty || !f.name_ko.trim()} onClick={save}>저장</button><button className="mx-btn sec" disabled={!dirty} onClick={() => setF(row)}>되돌리기</button><span className="mx-muted">{dirty ? '이름·설명·영역에 저장하지 않은 변경이 있어요.' : ''}</span></div>

      <section className="mx-sec">
        <div className="mx-sec-t">입력 항목 <small>이 템플릿으로 문항을 만들 때 채우는 칸</small></div>
        <div className="mx-sec-b">
          <table className="mx-mini"><thead><tr><th>항목</th><th>형식</th><th style={{ width: 50 }}>필수</th></tr></thead>
            <tbody>{fields.map((x, i) => <tr key={i}><td>{x.label}</td><td className="mx-muted">{x.type}</td><td>{x.req ? '●' : ''}</td></tr>)}</tbody></table>
          <p className="mx-muted mx-note">입력 항목을 바꾸거나 늘리려면 Claude에게 요청해 주세요. (화면 코드와 함께 바뀌어요)</p>
        </div>
      </section>

      <section className="mx-sec">
        <div className="mx-sec-t">버전과 변경 영향</div>
        <div className="mx-sec-b">
          <p className="mx-stat">현재 <b>v{row.version ?? 1}</b> · 문항 <b>{use?.items ?? 0}</b>개 · 단원 <b>{use?.units ?? 0}</b>개{use?.old ? <> · <b className="mx-warn">옛 버전 문항 {use.old}개 (재검토 필요)</b></> : null}</p>
          <p className="mx-muted mx-note">입력 항목을 바꾸면 위 범위가 영향을 받아요. 이미 발행된 단원은 다시 발행하기 전까지 학습앱에서 그대로예요.</p>
          <table className="mx-mini"><thead><tr><th>버전</th><th>종류</th><th>내용</th><th>날짜</th></tr></thead>
            <tbody>{hist.map((h) => <tr key={h.version}><td>v{h.version}</td><td>{lvKo(h.level)}</td><td className="mx-muted">{h.note}</td><td className="mx-muted">{h.created_at.slice(0, 10)}</td></tr>)}</tbody></table>
        </div>
      </section>
    </>
  );
}
