import { useEffect, useState } from 'react';
import { supabase } from '../../shared/supabase';

type Goals = Record<string, { ko: string }>;
const toText = (g: Goals | null) => Object.entries(g ?? {}).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })).map(([, v]) => v?.ko ?? '').join('\n');
const toGoals = (t: string): Goals => Object.fromEntries(t.split('\n').map((x) => x.trim()).filter(Boolean).map((ko, i) => ['LO' + (i + 1), { ko }]));

/** Lesson 학습목표: 한 줄에 하나. 학생 앱 메인 오른쪽 '이번 Lesson 학습목표'에 나온다(발행해야 반영). */
export function UnitGoals({ unitId }: { unitId: string }) {
  const [text, setText] = useState<string | null>(null);
  const [saved, setSaved] = useState('');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => {
    void (async () => {
      const r = await supabase.from('units').select('goals').eq('id', unitId).single();
      if (r.error) { setErr(r.error.message); setText(''); return; }
      const t = toText(r.data.goals as Goals); setText(t); setSaved(t);
    })();
  }, [unitId]);
  async function save() {
    setBusy(true); setErr(''); setMsg('');
    const goals = toGoals(text ?? '');
    const r = await supabase.from('units').update({ goals }).eq('id', unitId).select('id');
    setBusy(false);
    if (r.error) return setErr(r.error.message);
    if (!r.data?.length) return setErr('저장되지 않았어요(권한을 확인해 주세요).');
    setSaved(text ?? ''); setMsg(`저장했어요 (${Object.keys(goals).length}개). 학생 화면에는 '발행' 후에 나타나요.`);
  }
  if (text === null) return <p className="mx-muted">불러오는 중…</p>;
  const n = text.split('\n').filter((x) => x.trim()).length;
  return (
    <div className="mx-card">
      <h3>Lesson 학습목표</h3>
      <p className="mx-muted">한 줄에 목표 하나씩 적어요. 학생 앱 메인 오른쪽 “이번 Lesson 학습목표”에 번호와 함께 나와요.</p>
      <textarea className="mx-src-ta" rows={7} value={text} placeholder={'예)\n물건·가격 말 구별\n가격 묻기\n가격 말하고 도움 받기'} onChange={(e) => { setText(e.target.value); setMsg(''); }} />
      <div className="mx-row" style={{ marginTop: 10, gap: 12, alignItems: 'center' }}>
        <button className="mx-btn" disabled={busy || text === saved} onClick={() => void save()}>{busy ? '저장 중…' : '저장'}</button>
        <span className="mx-muted">{n}개{text !== saved ? ' · 저장 전' : ''}</span>
      </div>
      {msg && <p className="mx-ok">{msg}</p>}
      {err && <p className="mx-err">{err}</p>}
    </div>
  );
}
