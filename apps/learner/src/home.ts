import type { BundleRow } from './types';

export interface UnitInfo { unit_id: string; unit_no: number; unit_title: string; book_id: string; book_title: string; grade: number; publisher: string; version: number; bundle: BundleRow['bundle'] }
export interface ProgRow { unit_id: string; level: string; lesson: number; act_idx: number; stars: number; ok: number; total: number; updated_at: string }
export interface ActInfo { idx: number; t: string; ko: string; min: number; n: number; study: boolean; done: boolean; stars: number }
export interface LessonInfo { no: number; en: string; ko: string; goal: string; acts: ActInfo[]; studyN: number; doneN: number }
export interface ExtraProg { lessons: LessonInfo[]; total: number; done: number; firstNo: number | null }
export interface UnitProg { extra: ExtraProg; lessons: LessonInfo[]; total: number; done: number; pct: number; started: boolean; complete: boolean; current: { no: number; idx: number } | null; last: string | null }

/** 한 단원의 기본(CORE) 학습 진행: 차시(core)별 학습 활동 수/완료 수, 지금 해야 할 활동. 숙제 전용·문항 없는 활동은 세지 않는다. */
export function unitProgress(u: UnitInfo, rows: ProgRow[]): UnitProg {
  const mine = rows.filter((r) => r.unit_id === u.unit_id && r.level === 'CORE');
  const doneAt = new Map(mine.map((r) => [r.lesson * 1000 + r.act_idx, r]));
  const items = (u.bundle.items.CORE ?? {}) as Record<string, unknown[][]>;
  const mkLessons = (pred: (track: string) => boolean): LessonInfo[] => (u.bundle.flow ?? []).filter((l) => pred(l.track ?? 'core')).map((l) => {
    const acts: ActInfo[] = l.steps.map((s, idx) => {
      const p = doneAt.get(l.no * 1000 + idx);
      return { idx, t: s.name_ko || s.name_en, ko: s.name_en, min: s.min ?? 0, n: (items[String(l.no)]?.[idx] ?? []).length, study: s.study !== false, done: !!p, stars: p?.stars ?? 0 };
    });
    const st = acts.filter((a) => a.study && a.n > 0);
    return { no: l.no, en: l.en, ko: l.ko, goal: l.goal, acts, studyN: st.length, doneN: st.filter((a) => a.done).length };
  }).filter((l) => l.studyN > 0);
  const lessons = mkLessons((t) => t === 'core');
  const extraL = mkLessons((t) => t !== 'core');                       // 보충(support)·확장(challenge) 차시
  const extra: ExtraProg = { lessons: extraL, total: extraL.reduce((x, l) => x + l.studyN, 0), done: extraL.reduce((x, l) => x + l.doneN, 0), firstNo: extraL[0]?.no ?? null };
  const total = lessons.reduce((x, l) => x + l.studyN, 0), done = lessons.reduce((x, l) => x + l.doneN, 0);
  let current: UnitProg['current'] = null;
  for (const l of lessons) { if (current) break; const a = l.acts.find((x) => x.study && x.n > 0 && !x.done); if (a) current = { no: l.no, idx: a.idx }; }
  const last = mine.reduce<string | null>((m, r) => (!m || r.updated_at > m ? r.updated_at : m), null);
  return { extra, lessons, total, done, pct: total ? Math.round((done / total) * 100) : 0, started: mine.length > 0, complete: total > 0 && done >= total, current, last };
}

/** 지금 학습 중인 단원: 가장 최근에 공부한 단원(끝났으면 그 다음 미완료 단원), 기록이 없으면 첫 단원 */
export function currentUnit(units: UnitInfo[], rows: ProgRow[]): UnitInfo | null {
  if (!units.length) return null;
  const sorted = [...units].sort((a, b) => a.unit_no - b.unit_no);
  const prog = new Map(sorted.map((u) => [u.unit_id, unitProgress(u, rows)]));
  const touched = sorted.filter((u) => prog.get(u.unit_id)!.started).sort((a, b) => (prog.get(b.unit_id)!.last ?? '').localeCompare(prog.get(a.unit_id)!.last ?? ''));
  if (!touched.length) return sorted[0];
  const t = touched[0];
  if (!prog.get(t.unit_id)!.complete) return t;
  return sorted.find((u) => u.unit_no > t.unit_no && !prog.get(u.unit_id)!.complete) ?? t;
}
