/* 마이크 녹음(말하기 평가용): 말이 끝나면 자동으로 멈추고, 16kHz 모노 WAV 로 돌려준다.
   소리 크기만으로 말의 시작·끝을 판단한다(간단한 무음 감지). */
export type RecErr = 'denied' | 'nospeech' | 'silent' | 'error';
export interface Recording { stop: () => void; cancel: () => void; result: Promise<Blob> }

export const canRecord = () => { try { return !!navigator.mediaDevices?.getUserMedia && !!(window.AudioContext || (window as any).webkitAudioContext); } catch { return false; } }; // eslint-disable-line @typescript-eslint/no-explicit-any

function toWav(f32: Float32Array, rate: number): Blob {
  const buf = new ArrayBuffer(44 + f32.length * 2); const v = new DataView(buf);
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + f32.length * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, f32.length * 2, true);
  for (let i = 0; i < f32.length; i++) { const s = Math.max(-1, Math.min(1, f32[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
  return new Blob([buf], { type: 'audio/wav' });
}
function down(f32: Float32Array, from: number, to: number): Float32Array {
  if (from <= to) return f32;
  const ratio = from / to; const n = Math.floor(f32.length / ratio); const out = new Float32Array(n);
  for (let i = 0; i < n; i++) { const a = Math.floor(i * ratio), b = Math.min(f32.length, Math.floor((i + 1) * ratio)); let s = 0; for (let j = a; j < b; j++) s += f32[j]; out[i] = s / Math.max(1, b - a); }
  return out;
}

export function startRecording(opt: { maxMs?: number; noSpeechMs?: number; endSilenceMs?: number } = {}): Recording {
  const maxMs = opt.maxMs ?? 15000, noSpeechMs = opt.noSpeechMs ?? 7000, endSilenceMs = opt.endSilenceMs ?? 1200;
  let finish: (b: Blob) => void = () => undefined, fail: (e: RecErr) => void = () => undefined;
  const result = new Promise<Blob>((res, rej) => { finish = res; fail = rej; });
  let done = false; let cleanup = () => undefined as void; let wantStop = false; let endNow: (() => void) | null = null;
  const stop = () => { wantStop = true; endNow?.(); };   // 버튼을 누르면 다음 소리 조각을 기다리지 않고 바로 끝낸다
  const cancel = () => { if (done) return; done = true; cleanup(); fail('error'); };
  (async () => {
    let stream: MediaStream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } }); }
    catch (e) { if (!done) { done = true; fail((e as DOMException)?.name === 'NotAllowedError' ? 'denied' : 'error'); } return; }
    const AC = window.AudioContext || (window as any).webkitAudioContext; // eslint-disable-line @typescript-eslint/no-explicit-any
    const ctx: AudioContext = new AC(); try { await ctx.resume(); } catch { /* 무시 */ } const src = ctx.createMediaStreamSource(stream); const proc = ctx.createScriptProcessor(4096, 1, 1);
    const chunks: Float32Array[] = []; const t0 = Date.now(); const lows: number[] = []; let peak = 0, spoke = false, lastVoice = 0, voiced = 0;
    cleanup = () => { try { proc.disconnect(); src.disconnect(); stream.getTracks().forEach((t) => t.stop()); void ctx.close(); } catch { /* 무시 */ } };
    const end = () => {
      if (done) return; done = true; cleanup();
      if (peak < 0.004) { fail('silent'); return; }            // 마이크 소리가 거의 안 들어옴(다른 마이크가 선택됐거나 음소거)
      // 말을 감지하지 못했어도 소리가 있었다면 Azure 에 보내 판단을 맡긴다
      let n = 0; for (const c of chunks) n += c.length; const all = new Float32Array(n); let o = 0; for (const c of chunks) { all.set(c, o); o += c.length; }
      finish(toWav(down(all, ctx.sampleRate, 16000), Math.min(16000, ctx.sampleRate)));
    };
    endNow = end; if (wantStop) { end(); return; }
    proc.onaudioprocess = (e) => {
      if (done) return;
      const d = e.inputBuffer.getChannelData(0); chunks.push(new Float32Array(d));
      let s = 0; for (let i = 0; i < d.length; i++) s += d[i] * d[i]; const rms = Math.sqrt(s / d.length); const now = Date.now() - t0;
      peak = Math.max(peak, rms);
      if (now < 400) { lows.push(rms); return; }                        // 처음 0.4초는 주변 소음 크기 측정
      const floor = lows.length ? Math.min(...lows) : 0;                // 말을 바로 시작해도 흔들리지 않게 가장 조용한 값 기준
      const thr = Math.max(0.006, floor * 2.5);
      if (rms > thr) { voiced++; lastVoice = now; if (voiced >= 2) spoke = true; }
      if (wantStop || now > maxMs || (!spoke && now > noSpeechMs) || (spoke && now - lastVoice > endSilenceMs)) end();
    };
    src.connect(proc); proc.connect(ctx.destination);
  })();
  return { stop, cancel, result };
}
