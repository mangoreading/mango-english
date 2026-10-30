import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

const cache = new Map<string, { url: string; exp: number }>();
/** 비공개 버킷 'reading' 의 이미지 경로들 → 1시간짜리 임시 주소. 이미 받은 것은 다시 요청하지 않는다. */
export function useSignedUrls(paths: (string | null | undefined)[]): Record<string, string> {
  const key = paths.filter(Boolean).join('|');
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    let alive = true;
    const want = [...new Set(paths.filter((p): p is string => !!p))];
    const now = Date.now();
    const out: Record<string, string> = {};
    const need: string[] = [];
    for (const p of want) { const c = cache.get(p); if (c && c.exp > now) out[p] = c.url; else need.push(p); }
    if (!need.length) { setMap(out); return; }
    supabase.storage.from('reading').createSignedUrls(need, 3600).then(({ data }) => {
      for (const r of data ?? []) if (r.path && r.signedUrl) { cache.set(r.path, { url: r.signedUrl, exp: now + 3300_000 }); out[r.path] = r.signedUrl; }
      if (alive) setMap({ ...out });
    });
    if (Object.keys(out).length) setMap({ ...out });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return map;
}
