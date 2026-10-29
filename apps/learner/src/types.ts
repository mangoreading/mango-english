export type Level = 'CORE' | 'SUPPORT' | 'ADVANCED';
export interface Bundle {
  unit: { id: string; no: number; title: string; goals: Record<string, { ko: string }>; version: number };
  vocab: { key: string; en: string; ko: string; image: string | null }[];
  flow?: { no: number; track?: string; en: string; ko: string; goal: string; color: string; steps: { id: string; name_en: string; name_ko: string; min: number | null; special: string | null; kind?: string | null; study?: boolean; homework?: boolean; ref?: string | null }[] }[];
  items: Partial<Record<Level, Record<string, unknown[]>>>;
}
export interface BundleRow { unit_id: string; version: number; bundle: Bundle; published_at: string }
