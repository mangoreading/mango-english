// Mango English 단어 그림 생성: 관리자가 단어를 주면 OpenAI 이미지 모델로 그림 한 장을 만들어 돌려준다.
// OpenAI 키는 Supabase 비밀 값 OPENAI_API_KEY 에서만 읽는다(앱·GitHub 에는 없음). 본사(hq) 계정만 쓸 수 있다.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const MODEL = Deno.env.get('OPENAI_IMAGE_MODEL') ?? 'gpt-image-2.5-flare';
const QUALITY = Deno.env.get('OPENAI_IMAGE_QUALITY') ?? 'low'; // low / medium / high (비용 차이)
const DAILY_LIMIT = Number(Deno.env.get('IMAGE_DAILY_LIMIT') ?? '60'); // 하루 생성 횟수 상한 (비용 보호)
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const cut = (s: unknown, n: number) => String(s ?? '').slice(0, n);

// 기존 단어 그림(이모지풍 3D 아이콘)과 톤을 맞추는 고정 문장
const STYLE = 'A single cute 3D glossy emoji-style icon of the object, soft rounded shapes, bright friendly colors, soft shading, centered, no text, no shadow on the ground, transparent background, no background elements, kids educational illustration.';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: 'Bearer ' + token } } });
    const { data: u } = await asUser.auth.getUser(token);
    if (!u?.user) return json({ error: '로그인이 필요해요' }, 401);
    const { data: hq } = await asUser.rpc('is_hq');
    if (!hq) return json({ error: '본사 관리자만 그림을 만들 수 있어요' }, 403);

    const key = Deno.env.get('OPENAI_API_KEY');
    if (!key) return json({ error: 'OPENAI_API_KEY 가 설정되어 있지 않아요' }, 500);

    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const b = await req.json();
    // 이미지 제작 화면: 자유 프롬프트 + 참고 이미지(수정 모드) + 크기/품질/배경/개수
    if (b.prompt !== undefined) {
      const prompt = cut(b.prompt, 3000).trim();
      if (!prompt) return json({ error: '프롬프트를 입력해 주세요' }, 400);
      const size = ['1024x1024', '1536x1024', '1024x1536'].includes(b.size) ? b.size : '1024x1024';
      const quality = ['low', 'medium', 'high'].includes(b.quality) ? b.quality : QUALITY;
      const background = b.background === 'opaque' ? 'opaque' : b.background === 'transparent' ? 'transparent' : 'auto';
      const count = Math.min(4, Math.max(1, Number(b.n) || 1));
      const refs: string[] = Array.isArray(b.refs) ? b.refs.slice(0, 4).map((x: unknown) => String(x)) : [];
      const outs: string[] = [];
      for (let i = 0; i < count; i++) {
        const { data: used, error: ue } = await admin.rpc('image_use', { p_user: u.user.id });
        if (ue) throw ue;
        if ((used as number) > DAILY_LIMIT) { if (outs.length) break; return json({ error: '오늘 만들 수 있는 그림 수를 모두 썼어요' }, 429); }
        let r: Response;
        if (refs.length) {
          const fd = new FormData();
          fd.append('model', MODEL); fd.append('prompt', prompt); fd.append('size', size); fd.append('quality', quality); fd.append('background', background); fd.append('output_format', 'png'); fd.append('n', '1');
          refs.forEach((x, k) => { const bin = Uint8Array.from(atob(x), (c) => c.charCodeAt(0)); fd.append('image[]', new Blob([bin], { type: 'image/png' }), `ref${k}.png`); });
          r = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { Authorization: 'Bearer ' + key }, body: fd });
        } else {
          r = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST', headers: { Authorization: 'Bearer ' + key, 'content-type': 'application/json' },
            body: JSON.stringify({ model: MODEL, prompt, size, quality, background, output_format: 'png', n: 1 }),
          });
        }
        if (!r.ok) throw new Error('OpenAI 오류 ' + r.status + ' ' + cut(await r.text(), 300));
        const d = await r.json(); const x = d.data?.[0]?.b64_json;
        if (!x) throw new Error('OpenAI 가 그림을 보내지 않았어요');
        outs.push(x);
      }
      return json({ images: outs });
    }
    const { data: n, error: e1 } = await admin.rpc('image_use', { p_user: u.user.id });
    if (e1) throw e1;
    if ((n as number) > DAILY_LIMIT) return json({ error: '오늘 만들 수 있는 그림 수를 모두 썼어요' }, 429);
    const word = cut(b.word, 60).trim();
    if (!word) return json({ error: '단어를 입력해 주세요' }, 400);
    const extra = cut(b.extra, 200).trim();
    const prompt = `${STYLE} Object: "${word}"${b.ko ? ` (${cut(b.ko, 40)})` : ''}.${extra ? ' ' + extra : ''}`;

    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST', headers: { Authorization: 'Bearer ' + key, 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, prompt, size: '1024x1024', quality: QUALITY, background: 'transparent', output_format: 'png', n: 1 }),
    });
    if (!r.ok) throw new Error('OpenAI 오류 ' + r.status + ' ' + cut(await r.text(), 300));
    const d = await r.json();
    const b64 = d.data?.[0]?.b64_json;
    if (!b64) throw new Error('OpenAI 가 그림을 보내지 않았어요');
    return json({ image: b64, used: n });
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
