// Mango English 음성 합성(TTS): 문장이나 여러 줄 지문을 Azure 음성으로 바꿔 mp3 로 돌려준다.
// Azure 키는 Supabase 비밀 값 AZURE_SPEECH_KEY / AZURE_SPEECH_REGION(없으면 koreacentral) 에서만 읽는다.
// 로그인한 사용자만 쓸 수 있고, 한 번에 보낼 수 있는 글자 수를 제한해 비용을 보호한다.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const REGION = Deno.env.get('AZURE_SPEECH_REGION') ?? 'koreacentral';
const RATE = Deno.env.get('TTS_RATE') ?? '-12%'; // 초등학생 듣기용으로 조금 천천히
const MAX_CHARS = 900;
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const FEMALE = ['en-US-JennyNeural', 'en-US-AriaNeural'];
const MALE = ['en-US-GuyNeural', 'en-US-DavisNeural'];
const CHILD = 'en-US-AnaNeural';
const hash = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
/** 화자 이름으로 목소리를 고른다. 이름 뒤 괄호로 지정하면 그대로 따른다: Jina(girl) · Joon(boy) · Mom(woman) · Dad(man).
 *  괄호가 없으면 Clerk·Mom 같은 어른 이름만 성인 목소리, 나머지는 아이(여자) 목소리. 남자아이는 남성 목소리의 높낮이를 올려 만든다. */
function voiceFor(who?: string): { voice: string; pitch?: string } {
  if (!who) return { voice: FEMALE[0] };
  const m = who.trim().match(/^(.*?)\s*\(\s*([a-z]+)\s*\)\s*$/i);
  const name = (m ? m[1] : who).toLowerCase().trim(); const tag = m ? m[2].toLowerCase() : '';
  if (tag === 'girl' || tag === 'child') return { voice: CHILD };
  if (tag === 'boy') return { voice: MALE[0], pitch: '+22%' };
  if (tag === 'woman' || tag === 'female') return { voice: FEMALE[hash(name) % FEMALE.length] };
  if (tag === 'man' || tag === 'male') return { voice: MALE[hash(name) % MALE.length] };
  if (/^(clerk|seller|shopkeeper|teacher|woman|lady|mom|mother|mum)/.test(name)) return { voice: FEMALE[hash(name) % FEMALE.length] };
  if (/^(dad|father|grandpa|man|mr)/.test(name)) return { voice: MALE[hash(name) % MALE.length] };
  if (/^(boy)/.test(name)) return { voice: MALE[0], pitch: '+22%' };
  return { voice: CHILD };
}
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: 'Bearer ' + token } } });
    const { data: u } = await asUser.auth.getUser(token);
    if (!u?.user) return json({ error: '로그인이 필요해요' }, 401);

    const key = Deno.env.get('AZURE_SPEECH_KEY');
    if (!key) return json({ error: 'AZURE_SPEECH_KEY 가 설정되어 있지 않아요' }, 500);

    const b = await req.json();
    const lines: { who?: string; t: string }[] = (Array.isArray(b.lines) ? b.lines : [{ who: b.who, t: b.text }])
      .map((l: { who?: unknown; t?: unknown }) => ({ who: l.who ? String(l.who).slice(0, 20) : undefined, t: String(l.t ?? '').trim() }))
      .filter((l: { t: string }) => l.t);
    if (!lines.length) return json({ error: '읽을 글이 없어요' }, 400);
    if (lines.reduce((n, l) => n + l.t.length, 0) > MAX_CHARS) return json({ error: '글이 너무 길어요' }, 400);

    // 속도: 호출한 쪽이 '-30%' 처럼 지정할 수 있다(원서 읽기). 범위 밖이면 기본값.
    const rateIn = typeof b.rate === 'string' && /^[+-]?\d{1,3}%$/.test(b.rate) && Math.abs(parseInt(b.rate)) <= 50 ? b.rate : RATE;
    const body = lines.map((l) => { const v = voiceFor(l.who); return `<voice name="${v.voice}"><prosody rate="${rateIn}"${v.pitch ? ` pitch="${v.pitch}"` : ''}>${esc(l.t)}</prosody><break time="450ms"/></voice>`; }).join('');
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">${body}</speak>`;

    // 같은 글·목소리·속도는 한 번만 만들고 저장해 둔다(비용·지연 절약). 저장소: 비공개 버킷 tts-cache (서버만 접근)
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ssml)))).map((x) => x.toString(16).padStart(2, '0')).join('');
    const path = `${hash}.mp3`;
    const prefetch = b.prefetch === true;      // 미리 만들어 저장만 하기(본사 전용): 소리는 돌려주지 않고 결과만 알려 준다
    if (prefetch) {
      const { data: pr } = await asUser.from('profiles').select('role').eq('id', u.user.id).maybeSingle();
      if (!['hq_admin', 'hq_editor'].includes(String(pr?.role))) return json({ error: '본사 권한이 필요해요' }, 403);
    }
    let audio: ArrayBuffer | null = null;
    try { const { data } = await admin.storage.from('tts-cache').download(path); if (data) audio = await data.arrayBuffer(); } catch { /* 없으면 새로 만든다 */ }
    const hit = !!audio;
    if (!audio) {
      const r = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: 'POST',
        headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'mango-english' },
        body: ssml,
      });
      if (!r.ok) throw new Error('Azure 오류 ' + r.status + ' ' + (await r.text()).slice(0, 200));
      audio = await r.arrayBuffer();
      try { await admin.storage.from('tts-cache').upload(path, audio, { contentType: 'audio/mpeg', upsert: false }); } catch { /* 저장 실패해도 소리는 돌려준다 */ }
    }
    if (prefetch) return json({ cached: hit });
    return new Response(audio, { headers: { ...CORS, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=86400', 'X-Cache': hit ? 'HIT' : 'MISS' } });
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
