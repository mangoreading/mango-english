import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const configured = Boolean(url && key);
// 공개용(Publishable) 키만 사용한다. Secret key 는 절대 앱에 넣지 않는다.
export const supabase = createClient(url ?? 'http://localhost', key ?? 'missing');
