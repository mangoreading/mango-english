import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

function validUrl(u?: string) { try { return !!u && /^https?:\/\//.test(u) && !!new URL(u); } catch { return false; } }

export const configured = Boolean(key) && validUrl(url);
/** 설정이 잘못됐을 때 화면에 보여 줄 안내 */
export const configProblem = !url || !key
  ? '환경변수 VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY 가 비어 있어요.'
  : !validUrl(url) ? 'VITE_SUPABASE_URL 이 https:// 로 시작하는 올바른 주소가 아니에요.' : '';
// 공개용(Publishable) 키만 사용한다. Secret key 는 절대 앱에 넣지 않는다.
export const supabase = createClient(configured ? (url as string) : 'http://localhost', key ?? 'missing');
