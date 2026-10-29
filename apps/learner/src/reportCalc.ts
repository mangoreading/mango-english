/** 6차시(Wrap-up) 결과 리포트 계산: 6차시 활동 결과를 듣기·말하기·읽기·쓰기 영역별로 모으고, 약한 영역의 연습 활동을 고른다 */
export type Area = 'listening' | 'speaking' | 'reading' | 'writing';
export const AREAS: Area[] = ['listening', 'speaking', 'reading', 'writing'];
export const AREA_KO: Record<Area, string> = { listening: '듣기', speaking: '말하기', reading: '읽기', writing: '쓰기' };
export const AREA_ICON: Record<Area, string> = { listening: '🎧', speaking: '🗣️', reading: '📖', writing: '✏️' };
const HOME_LESSON: Record<Area, number> = { listening: 2, speaking: 3, reading: 4, writing: 5 }; // 그 영역을 주로 연습하는 차시

const KIND_AREA: Record<string, Area> = {
  lchpic: 'listening', lchtext: 'listening', lchlist: 'listening', lmatch: 'listening', lcardt: 'listening', lcardp: 'listening', lsent: 'listening',
  lookspeak: 'speaking', saykor: 'speaking', lspeak: 'speaking', raloud: 'speaking', role: 'speaking', aitalk: 'speaking', sdrill: 'speaking', present: 'speaking',
  pread: 'reading', sqchoice: 'reading', sqtf: 'reading', sqmulti: 'reading', scloze: 'reading', dchoice: 'reading', tf: 'reading',
  sbuild: 'writing', swrite: 'writing', sfill: 'writing', dfill: 'writing', sscram: 'writing', sorder: 'writing', mwbank: 'writing', mfree: 'writing', swrt: 'writing', lwrite: 'writing', vwrite: 'writing',
};
export const areaOf = (kind?: string | null): Area | null => (kind ? KIND_AREA[kind] ?? null : null);

export interface FlowStep { id: string; name_en: string; name_ko: string; kind?: string | null; study?: boolean; homework?: boolean }
export interface FlowLesson { no: number; track?: string; ko: string; steps: FlowStep[] }
export interface StepProg { ok: number; total: number }
export interface StepRef { no: number; idx: number; name: string }
export interface StepResult extends StepRef { ok: number; total: number; pct: number | null }
export interface AreaResult { area: Area; ok: number; total: number; pct: number | null; steps: StepResult[]; level: 'good' | 'mid' | 'low' | 'none' }
export interface Report { areas: AreaResult[]; ok: number; total: number; pct: number | null; stars: 1 | 2 | 3; complete: boolean; reportLesson: number }

export const GOOD = 80; // 이 이상이면 잘했어요
const MID = 60;
export const levelOf = (pct: number | null): AreaResult['level'] => (pct == null ? 'none' : pct >= GOOD ? 'good' : pct >= MID ? 'mid' : 'low');

/** 마지막 core 차시(보통 6차시)의 학습(study) 활동 결과로 리포트를 만든다. 아직 한 활동도 안 했으면 null */
export function buildReport(flow: FlowLesson[] | undefined, prog: (no: number, idx: number) => StepProg | undefined): Report | null {
  const core = (flow ?? []).filter((l) => (l.track ?? 'core') === 'core');
  const last = core.length ? core[core.length - 1] : null; if (!last) return null;
  const steps = last.steps.map((s, idx) => ({ s, idx })).filter(({ s }) => s.study !== false);
  const byArea: Record<Area, StepResult[]> = { listening: [], speaking: [], reading: [], writing: [] };
  let doneAny = false, complete = true;
  for (const { s, idx } of steps) {
    const a = areaOf(s.kind); const p = prog(last.no, idx);
    if (p) doneAny = true; else if (a) complete = false;
    if (!a) continue;
    byArea[a].push({ no: last.no, idx, name: s.name_ko || s.name_en, ok: p?.ok ?? 0, total: p?.total ?? 0, pct: p && p.total > 0 ? Math.round((p.ok / p.total) * 100) : null });
  }
  if (!doneAny) return null;
  const areas: AreaResult[] = AREAS.filter((a) => byArea[a].length).map((a) => {
    const ok = byArea[a].reduce((x, r) => x + r.ok, 0), total = byArea[a].reduce((x, r) => x + r.total, 0); const pct = total > 0 ? Math.round((ok / total) * 100) : null;
    return { area: a, ok, total, pct, steps: byArea[a], level: levelOf(pct) };
  });
  const ok = areas.reduce((x, r) => x + r.ok, 0), total = areas.reduce((x, r) => x + r.total, 0); const pct = total > 0 ? Math.round((ok / total) * 100) : null;
  return { areas, ok, total, pct, stars: pct == null ? 1 : pct >= 90 ? 3 : pct >= 70 ? 2 : 1, complete, reportLesson: last.no };
}

/** 약한 영역의 [더 연습해요]에 쓸 활동 고르기(최대 3개): 보충 차시의 같은 영역 활동 → 그 영역을 주로 연습하는 차시 → 다른 차시 순. 문항이 있는 것만 */
export function practiceFor(area: Area, flow: FlowLesson[] | undefined, hasItems: (no: number, idx: number) => boolean, reportLesson: number): StepRef[] {
  const out: (StepRef & { rank: number })[] = [];
  (flow ?? []).forEach((l) => {
    const tr = l.track ?? 'core'; if (tr === 'challenge' || l.no === reportLesson) return;
    l.steps.forEach((s, idx) => {
      if (s.study === false && tr === 'core') return;
      if (areaOf(s.kind) !== area || !hasItems(l.no, idx)) return;
      out.push({ no: l.no, idx, name: s.name_ko || s.name_en, rank: (tr === 'support' ? 0 : l.no === HOME_LESSON[area] ? 1 : 2) * 100 + l.no });
    });
  });
  return out.sort((a, b) => a.rank - b.rank).slice(0, 3).map(({ rank: _r, ...x }) => x);
}
