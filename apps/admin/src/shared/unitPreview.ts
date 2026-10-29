import { supabase } from './supabase';
import { isNativeKind } from './samples';
import type { PreviewData } from './ui';

/** 단원 전체 미리보기 데이터: 차시별로 학습 흐름 순서대로 문항(초안 포함, CORE)을 모은다. 참조 활동은 원본 문항을 쓴다. */
export async function buildUnitPreview(unitId: string, title: string): Promise<PreviewData | string> {
  const fl = await supabase.from('flow_lessons').select('no,track,ko,en,flow_steps(id,pos,ref_step_id)').eq('unit_id', unitId).order('no');
  if (fl.error) return '학습 흐름을 불러오지 못했어요: ' + fl.error.message;
  const it = await supabase.from('items').select('step_id,act_idx,created_at,payload').eq('unit_id', unitId).eq('level', 'CORE').order('act_idx').order('created_at').limit(3000);
  if (it.error) return '문항을 불러오지 못했어요: ' + it.error.message;
  const v = await supabase.from('unit_vocab').select('vocab(key,en,ko,image_path)').eq('unit_id', unitId);
  const by = new Map<string, Record<string, any>[]>(); // eslint-disable-line @typescript-eslint/no-explicit-any
  ((it.data ?? []) as any[]).forEach((x) => { if (x.step_id && isNativeKind(x.payload?.k)) by.set(x.step_id, [...(by.get(x.step_id) ?? []), x.payload]); }); // eslint-disable-line @typescript-eslint/no-explicit-any
  const lessons = ((fl.data ?? []) as any[]).filter((l) => l.track === 'core' || true).map((l) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    no: l.no as number, title: (l.ko || l.en || '') as string,
    items: [...(l.flow_steps ?? [])].sort((a: any, b: any) => a.pos - b.pos).flatMap((s: any) => by.get(s.ref_step_id ?? s.id) ?? []), // eslint-disable-line @typescript-eslint/no-explicit-any
  })).filter((l) => l.items.length);
  if (!lessons.length) return '이 단원에는 아직 재생할 문항이 없어요.';
  const vocab = ((v.data ?? []) as any[]).map((r) => r.vocab).filter(Boolean).map((x: any) => ({ key: x.key, en: x.en, ko: x.ko, image: x.image_path ?? null })); // eslint-disable-line @typescript-eslint/no-explicit-any
  return { kind: 'native', items: lessons[0].items, lessons, vocab, title };
}
