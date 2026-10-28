import { useEffect, useRef, useState } from 'react';
import { getStt } from './common';
import { canRecord, startRecording, type Recording } from './rec';

/* 마이크 테스트: 소리 크기 막대로 마이크가 들어오는지 보고, 'Hello' 를 말하면 인식 서버까지 확인한다. */
type Phase = 'idle' | 'rec' | 'chk' | 'done';
export function MicTest({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('idle'); const [level, setLevel] = useState(0); const [msg, setMsg] = useState(''); const [good, setGood] = useState<boolean | null>(null); const [heard, setHeard] = useState('');
  const rec = useRef<Recording | null>(null); const [url, setUrl] = useState('');
  useEffect(() => () => { try { rec.current?.cancel(); } catch { /* 무시 */ } }, []);
  function start() {
    if (!canRecord()) { setPhase('done'); setGood(false); setMsg('이 기기에서는 마이크를 쓸 수 없어요.'); return; }
    setPhase('rec'); setGood(null); setMsg(''); setHeard(''); setUrl((u) => { if (u) URL.revokeObjectURL(u); return ''; });
    const r = startRecording({ maxMs: 7000, noSpeechMs: 5000, onLevel: setLevel }); rec.current = r;
    r.result.then(async (wav) => {
      setLevel(0); setUrl(URL.createObjectURL(wav)); const h = getStt();
      if (!h) { setPhase('done'); setGood(true); setMsg('마이크 소리가 잘 들어와요!'); return; }
      setPhase('chk');
      try {
        const info = await h(wav, 'Hello'); setHeard(info.text); setPhase('done');
        if (/hello/i.test(info.text)) { setGood(true); setMsg('마이크가 잘 작동해요!'); }
        else { setGood(false); setMsg("소리는 들어오지만 'Hello'로 알아듣지 못했어요. 마이크에 조금 더 가까이, 또박또박 다시 해 보세요."); }
      } catch { setPhase('done'); setGood(false); setMsg('소리는 잘 들어오지만 음성 인식 서버에 연결하지 못했어요. 잠시 뒤 다시 해 보세요.'); }
    }).catch((c) => {
      setLevel(0); setPhase('done'); setGood(false);
      setMsg(c === 'denied' ? '마이크 사용이 막혀 있어요. 주소창의 마이크 허용을 눌러 주세요.' : c === 'silent' || c === 'nospeech' ? '마이크 소리가 거의 들어오지 않아요. 마이크가 켜져 있는지, 올바른 마이크가 선택됐는지 확인해 주세요.' : '마이크를 시작하지 못했어요. 다시 해 보세요.');
    });
  }
  return (
    <div className="nv-mtmod" role="dialog" aria-label="마이크 테스트" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="nv-mtbox">
        <b className="nv-mttitle">마이크 테스트</b>
        <p className="nv-mttext">{phase === 'idle' ? "시작을 누르고 'Hello'라고 말해 보세요." : phase === 'rec' ? "듣고 있어요… 'Hello'라고 말해 보세요." : phase === 'chk' ? '확인하고 있어요…' : msg}</p>
        <span className="nv-lvl nv-lvl-big" aria-hidden="true">{Array.from({ length: 15 }).map((_, k) => <i key={k} className={phase === 'rec' && Math.min(1, level * 7) > k / 15 ? 'on' : ''} />)}</span>
        {phase === 'done' && heard && <p className="nv-mtheard">들린 말: “{heard}”</p>}
        {(phase === 'chk' || phase === 'done') && url && <audio className="nv-mtaudio" controls src={url} aria-label="내 목소리 다시 듣기" />}
        {phase === 'done' && good != null && <p className={'nv-mtres ' + (good ? 'ok' : 'bad')}>{good ? '✓' : '✕'}</p>}
        <div className="nv-mtbtns">
          {(phase === 'idle' || phase === 'done') && <button type="button" className="nv-btn" onClick={start}>{phase === 'idle' ? '시작' : '다시 해 보기'}</button>}
          {phase === 'rec' && <button type="button" className="nv-btn" onClick={() => rec.current?.stop()}>그만</button>}
          <button type="button" className="nv-btn nv-ghost" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
