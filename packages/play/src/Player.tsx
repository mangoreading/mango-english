import { useMemo, useState } from 'react';
import { FbSlot, ProgCtx, type CardProg } from './fb';
import { imgSrc, setQuiet, TEXT_KINDS, type LessonCtx, type Res, type VWord } from './common';
import { VCards, VMatch, VSound, VSpell, VType1, VWrite } from './kinds';
import { AiTalk, LookSpeak, LookTalk, LSpeak, Present, RAloud, ReadAlong, Role, SayKor } from './kinds5';
import { setOutputScope } from './outputs';
import { DFill, LBlank, LPMatch, LWrite, LMWrite, LPWrite, MFree, MWBank, SBuild, SCloze, SFill, SOrder, SScram, SWrite, SWrt } from './kinds4';
import { SceneStory } from './kinds6';
import { SqSet, SqTF, withQuiz } from './kinds8';
import { Lecture, WordSent, LNum } from './kinds7';
import { MicTest } from './mictest';
import { KIND_META } from './kindmeta';
import { Goal, KExp, LCardP, LCardT, LSent, MText, PRead, SDrill, TapL, WRepeat } from './kinds3';
import { DChoice, LChList, LChPic, LChText, LMatch, PChoice, SqChoice, SqMulti, TrueFalse, WChoice } from './kinds2';

export interface NativeResult { results: Res[]; total: number; scored: number }
interface Props {
  title: string; items: Record<string, any>[]; vocab: VWord[]; nextLabel?: string; /** 차시 안에서 지금 활동의 위치 (헤더 위쪽 막대 + '활동 n/N') */ step?: { cur: number; total: number }; quiet?: boolean; ctx?: LessonCtx; scope?: string; /* 같은 차시 안에서 산출물(내 글)을 나누는 구분값 */ // eslint-disable-line @typescript-eslint/no-explicit-any
  onResult: (r: NativeResult) => void;
  onFinish: (a: 'next' | 'again' | 'exit') => void;
}
/** 말하기 지시문의 '영어로 말해 보세요' 부분을 파랗게 강조 (mango 스킨) */
function hl(t: string, on: boolean) { const m = on ? t.match(/^(.*?)((?:영어로 |따라 )?말해 보세요.*)$/) : null; return m ? <>{m[1]}<span className="nv-hl">{m[2]}</span></> : t; }
const KIND = { scene: SceneStory, scenerep: SceneStory, sscraml: SScram, sscramlr: SScram, sscramr: SScram, lecture: Lecture, wsent: WordSent, lnum: LNum, lookspeak: LookSpeak, looktalk: LookTalk, saykor: SayKor, lspeak: LSpeak, raloud: RAloud, role: Role, dreadp: ReadAlong, dreadt: ReadAlong, present: Present, aitalk: AiTalk, sbuild: SBuild, swrite: SWrite, sfill: SFill, dfill: DFill, dfillt: DFill, sscram: SScram, sorder: SOrder, mwbank: MWBank, scloze: SCloze, lwrite: LWrite, mfree: MFree, swrt: SWrt, goal: Goal, kexp: KExp, tapl: TapL, lsent: LSent, lcardp: LCardP, lcardt: LCardT, sdrill: SDrill, pread: withQuiz(PRead), mtext: withQuiz(MText), wrepeat: WRepeat, vcards: VCards, vtype1: VType1, vspell: VSpell, vmatch: VMatch, vsound: VSound, vwrite: VWrite,
  wchoice: WChoice, pchoice: PChoice, dchoice: DChoice, tf: TrueFalse, lchtext: LChText, lchpic: LChPic, lchlist: LChList, lmatch: LMatch, lmwrite: LMWrite, lpwrite: LPWrite, lblank: LBlank, lpmatch: LPMatch,
  sqchoice: SqChoice, sqtf: SqTF, sqmulti: SqMulti, sqset: SqSet } as const;

/** 어휘 활동 6종 재생기: 문항(화면)을 차례로 보여 주고, 끝나면 결과 화면을 보여 준다. */
export function NativePlayer({ title, items, vocab, nextLabel, step, quiet, scope, ctx, onResult, onFinish }: Props) {
  setQuiet(!!quiet); setOutputScope(scope ?? 'preview');
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);
  const [all, setAll] = useState<Res[]>([]);
  const [fin, setFin] = useState(false);
  const [pts, setPts] = useState(0);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [prog, setProg] = useState<CardProg>(null);
  const [mt, setMt] = useState(false);
  const byKey = useMemo(() => new Map(vocab.map((v) => [v.key, v])), [vocab]);
  const it = items[i]; const meta = KIND_META[it?.k] ?? {};

  if (fin) {
    const scored = all.filter((r) => r.tag); const ok = scored.filter((r) => r.ok).length;
    const pct = scored.length ? ok / scored.length : 1; const st = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
    return (
      <div className="nv-overlay"><div className="nv-result">
        <h1>{st === 3 ? '완벽해요!' : st === 2 ? '잘했어요!' : '끝까지 해냈어요!'}</h1>
        <div className="nv-stars">{[1, 2, 3].map((n) => <span key={n} style={{ color: n <= st ? '#FFC000' : '#D9DEE8' }}>★</span>)}</div>
        <p className="nv-sum">{scored.length ? `첫 시도 정답 ${ok}/${scored.length}` : '모든 단어를 익혔어요'} · 포인트 +{pts}</p>
        <div className="nv-btns">
          <button className="nv-btn nv-btn-lg" onClick={() => onFinish('next')}>{nextLabel ? `다음: ${nextLabel}` : '다음'}</button>
          <button className="nv-btn nv-ghost" onClick={() => onFinish('again')}>다시 하기</button>
        </div>
      </div></div>
    );
  }

  const keys: string[] = it.k === 'vspell' || it.k === 'wchoice' ? [it.word] : TEXT_KINDS.includes(it.k) ? [] : it.words ?? [];
  const words = keys.map((k) => byKey.get(k)).filter(Boolean) as VWord[];
  const Comp = KIND[it.k as keyof typeof KIND];
  const last = i === items.length - 1;
  function onDone(res: Res[]) { setAll((a) => [...a, ...res]); setPts((p) => p + 5 * Math.max(1, res.filter((r) => r.ok).length)); setDone(true); }
  function next() {
    if (last) { const results = all; onResult({ results, total: items.length, scored: results.filter((r) => r.tag).length }); setFin(true); }
    else { setI(i + 1); setDone(false); }
  }

  return (
    <div className="nv-overlay" data-bgimg={meta.vocabBg ? "v" : undefined} data-hd={meta.speak ? 'bg' : undefined} data-skin={meta.speak ? 'mango' : meta.bgSkin ? 'mangobg' : undefined}>
      <div className="nv-head">
        <button className="nv-x" onClick={() => onFinish('exit')} aria-label="나가기">‹</button>
        <b>{title}</b>{step && step.total > 0 && <span className="nv-stepno">활동 {step.cur + 1}/{step.total}</span>}
        {(() => {
          const n = prog ? prog.n : items.length, c = prog ? prog.cur : i;   // 지금 활동 안의 문항 위치
          const inner = n > 10 ? <b className="nv-ind-n">{Math.min(c + 1, n)}/{n}</b> : Array.from({ length: n }, (_, k) => <i key={k} className={'nv-ic ' + (k < c ? 'd1' : k === c ? 'd2' : '')} />);
          return (
            <span className="nv-ind" aria-label={step ? `활동 ${step.cur + 1}/${step.total}, 문항 ${Math.min(c + 1, n)}/${n}` : `문항 ${Math.min(c + 1, n)}/${n}`}>
              {step && step.total > 0 && Array.from({ length: step.cur }, (_, k) => <i key={'a' + k} className="nv-ia d1" />)}
              <span className="nv-ic-grp">{inner}</span>
              {step && step.total > 0 && Array.from({ length: Math.max(0, step.total - step.cur - 1) }, (_, k) => <i key={'z' + k} className="nv-ia" />)}
            </span>
          );
        })()}
        <span className="nv-pts"><i className="nv-star">★</i> 포인트 : +{pts}</span>
      </div>
      <div className="nv-instrow">
      <p className="nv-inst"><span>{hl(meta.lch && it.q ? it.q : it.inst || (it.k === 'lnum' && it.pic ? '잘 듣고, 그림에 알맞은 답을 선택해 주세요.' : (it.k === 'mtext' || it.k === 'pread') && it.qs?.length ? '글을 읽고 문제를 풀어 보세요.' : meta.inst) || '', !!meta.speak || !!meta.bgSkin)}{meta.instSub && <small>{meta.instSub}</small>}</span></p>
        {meta.mic && <button type="button" className="nv-mtbtn" onClick={() => setMt(true)}><i aria-hidden="true">🎤</i> 마이크 테스트</button>}
      </div>
      <ProgCtx.Provider value={setProg}>
      <FbSlot.Provider value={slot}>
      {!Comp || words.length !== keys.length
        ? <p className="nv-hint">이 문항에 쓰인 단어가 단원 어휘에 없어요. 관리자에서 단어를 확인해 주세요. ({keys.filter((k) => !byKey.has(k)).join(', ')})</p>
        : <Comp key={i} item={it} words={words} vocab={vocab} ctx={ctx} pic={(k) => (k ? byKey.get(k)?.image ?? null : null)} onDone={onDone} />}
      </FbSlot.Provider>
      </ProgCtx.Provider>
      {it.pic && !meta.ownPic && !meta.noSide && byKey.get(it.pic)?.image && <img className="nv-sidepic" src={imgSrc(byKey.get(it.pic)!.image)} alt="" draggable={false} />}
      {mt && <MicTest onClose={() => setMt(false)} />}
      <div className="nv-foot"><span className="nv-fbslot" ref={setSlot} /><button className="nv-btn nv-btn-lg" disabled={!done} onClick={next}>{last ? '결과 보기' : '다음'}</button></div>
    </div>
  );
}
