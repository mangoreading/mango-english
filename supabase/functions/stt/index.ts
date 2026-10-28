// Mango English 말하기 평가(STT): 학생이 녹음한 짧은 음성(WAV 16kHz 모노)을 Azure 로 보내 글자로 바꾸고,
// 읽어야 할 문장(x-ref)이 있으면 발음 평가(정확도·유창성·완성도)도 함께 돌려준다.
// Azure 키는 Supabase 비밀 값 AZURE_STT_KEY(없으면 AZURE_SPEECH_KEY) / AZURE_STT_REGION(없으면 AZURE_SPEECH_REGION, 그것도 없으면 koreacentral) 에서만 읽는다. 로그인한 사용자만 쓸 수 있다.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const REGION = Deno.env.get('AZURE_STT_REGION') ?? Deno.env.get('AZURE_SPEECH_REGION') ?? 'koreacentral';
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

    const key = Deno.env.get('AZURE_STT_KEY') ?? Deno.env.get('AZURE_SPEECH_KEY'); // STT 전용 키가 있으면 그것을, 없으면 공용 Speech 키를 쓴다
    if (!key) return json({ error: 'AZURE_STT_KEY 가 설정되어 있지 않아요' }, 500);

    const audio = new Uint8Array(await req.arrayBuffer());
    if (audio.length < 2000) return json({ error: '녹음이 너무 짧아요' }, 400);
    if (audio.length > MAX_BYTES) return json({ error: '녹음이 너무 길어요' }, 400);

    let ref = '';
    try { ref = decodeURIComponent(req.headers.get('x-ref') ?? '').slice(0, 300).trim(); } catch { /* 무시 */ }
    const headers: Record<string, string> = { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000', Accept: 'application/json' };
    if (ref) headers['Pronunciation-Assessment'] = btoa(JSON.stringify({ ReferenceText: ref, GradingSystem: 'HundredMark', Granularity: 'Word', Dimension: 'Comprehensive', EnableMiscue: true }));

    const r = await fetch(`https://${REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed&profanity=masked`, { method: 'POST', headers, body: audio });
    if (!r.ok) throw new Error('Azure 오류 ' + r.status + ' [' + (Deno.env.get('AZURE_STT_KEY') ? 'STT키' : '공용키') + ', ' + REGION + '] ' + (await r.text()).slice(0, 200));
    const d = await r.json();
    if (d.RecognitionStatus && d.RecognitionStatus !== 'Success') return json({ text: '', status: d.RecognitionStatus });
    const n = d.NBest?.[0] ?? {};
    // 점수는 응답 형태에 따라 NBest 바로 아래에 있거나 PronunciationAssessment 안에 있다. 두 곳 모두 읽는다.
    const pa = n.PronunciationAssessment ?? {};
    const num = (a: unknown, b: unknown) => (typeof a === 'number' ? a : typeof b === 'number' ? b : undefined);
    type W = { Word: string; AccuracyScore?: number; ErrorType?: string; PronunciationAssessment?: { AccuracyScore?: number; ErrorType?: string } };
    return json({
      text: String(n.Lexical ?? n.Display ?? d.DisplayText ?? ''), display: String(n.Display ?? d.DisplayText ?? ''), status: 'Success', // 채점에는 숫자를 글자로 읽은 형태(Lexical: fifteen thousand)를 쓴다. Display 는 15,000 처럼 숫자로 나온다
      accuracy: num(n.AccuracyScore, pa.AccuracyScore), fluency: num(n.FluencyScore, pa.FluencyScore), completeness: num(n.CompletenessScore, pa.CompletenessScore), pron: num(n.PronScore, pa.PronScore),
      dbg: { nk: Object.keys(n), wk: n.Words?.[0] ? Object.keys(n.Words[0]) : [] }, // 점수가 안 보일 때 원인을 찾기 위한 응답 구조(점수 값은 아님)
      words: Array.isArray(n.Words) ? n.Words.map((w: W) => ({ w: w.Word, acc: num(w.AccuracyScore, w.PronunciationAssessment?.AccuracyScore), err: w.ErrorType ?? w.PronunciationAssessment?.ErrorType })) : undefined,
    });
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
