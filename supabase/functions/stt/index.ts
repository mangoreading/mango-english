// Mango English 말하기 평가(STT): 학생이 녹음한 짧은 음성(WAV 16kHz 모노)을 Azure 로 보내 글자로 바꾸고,
// 읽어야 할 문장(x-ref)이 있으면 발음 평가(정확도·유창성·완성도)도 함께 돌려준다.
// Azure 키는 Supabase 비밀 값 AZURE_SPEECH_KEY / AZURE_SPEECH_REGION(없으면 koreacentral) 에서만 읽는다. 로그인한 사용자만 쓸 수 있다.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const REGION = Deno.env.get('AZURE_SPEECH_REGION') ?? 'koreacentral';
const MAX_BYTES = 700_000; // 16kHz 16bit 모노 약 20초
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ref', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

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

    const audio = new Uint8Array(await req.arrayBuffer());
    if (audio.length < 2000) return json({ error: '녹음이 너무 짧아요' }, 400);
    if (audio.length > MAX_BYTES) return json({ error: '녹음이 너무 길어요' }, 400);

    let ref = '';
    try { ref = decodeURIComponent(req.headers.get('x-ref') ?? '').slice(0, 300).trim(); } catch { /* 무시 */ }
    const headers: Record<string, string> = { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000', Accept: 'application/json' };
    if (ref) headers['Pronunciation-Assessment'] = btoa(JSON.stringify({ ReferenceText: ref, GradingSystem: 'HundredMark', Granularity: 'Word', EnableMiscue: true }));

    const r = await fetch(`https://${REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed&profanity=masked`, { method: 'POST', headers, body: audio });
    if (!r.ok) throw new Error('Azure 오류 ' + r.status + ' ' + (await r.text()).slice(0, 200));
    const d = await r.json();
    if (d.RecognitionStatus && d.RecognitionStatus !== 'Success') return json({ text: '', status: d.RecognitionStatus });
    const n = d.NBest?.[0] ?? {};
    const pa = n.PronunciationAssessment ?? {};
    return json({
      text: String(n.Display ?? d.DisplayText ?? ''), status: 'Success',
      accuracy: pa.AccuracyScore, fluency: pa.FluencyScore, completeness: pa.CompletenessScore, pron: pa.PronScore,
      words: Array.isArray(n.Words) ? n.Words.map((w: { Word: string; PronunciationAssessment?: { AccuracyScore?: number; ErrorType?: string } }) => ({ w: w.Word, acc: w.PronunciationAssessment?.AccuracyScore, err: w.PronunciationAssessment?.ErrorType })) : undefined,
    });
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
