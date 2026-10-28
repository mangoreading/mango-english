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
/** 화자 이름으로 목소리를 고른다. 같은 이름은 언제나 같은 목소리. */
function voiceFor(who?: string): string {
  if (!who) return FEMALE[0];
  const w = who.toLowerCase().trim();
  if (/^(clerk|seller|shopkeeper|teacher|woman|lady|mom|mother|mum)/.test(w)) return FEMALE[hash(w) % FEMALE.length];
  if (/^(dad|father|grandpa|man|mr)/.test(w)) return MALE[hash(w) % MALE.length];
  if (/^(boy|girl|kid|child)/.test(w)) return CHILD;
  const all = [CHILD, ...MALE, ...FEMALE];
  return all[hash(w) % all.length];
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

    const body = lines.map((l) => `<voice name="${voiceFor(l.who)}"><prosody rate="${RATE}">${esc(l.t)}</prosody><break time="450ms"/></voice>`).join('');
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">${body}</speak>`;

    const r = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'mango-english' },
      body: ssml,
    });
    if (!r.ok) throw new Error('Azure 오류 ' + r.status + ' ' + (await r.text()).slice(0, 200));
    return new Response(await r.arrayBuffer(), { headers: { ...CORS, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=86400' } });
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
