export type Level = 'CORE' | 'SUPPORT' | 'ADVANCED';
export interface Bundle {
  unit: { id: string; no: number; title: string; goals: Record<string, { ko: string }>; version: number };
  vocab: { key: string; en: string; ko: string; image: string | null }[];
  items: Partial<Record<Level, Record<string, unknown[]>>>;
}
export interface BundleRow { unit_id: string; version: number; bundle: Bundle; published_at: string }
