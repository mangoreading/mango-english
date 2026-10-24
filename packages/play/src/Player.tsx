import { useMemo, useState } from 'react';
import { FbSlot } from './fb';
import { imgSrc, TEXT_KINDS, type Res, type VWord } from './common';
import { VCards, VMatch, VSound, VSpell, VType1, VWrite } from './kinds';
import { AiTalk, LookSpeak, LSpeak, Present, RAloud, Role, SayKor } from './kinds5';
import { DFill, LWrite, MFree, MWBank, SBuild, SCloze, SFill, SOrder, SScram, SWrite, SWrt } from './kinds4';
import { Goal, KExp, LCardP, LCardT, LSent, MText, PRead, SDrill, TapL, WRepeat } from './kinds3';
import { DChoice, LChList, LChPic, LChText, LMatch, PChoice, SqChoice, SqMulti, SqTF, TrueFalse, WChoice } from './kinds2';

export interface NativeResult { results: Res[]; total: number; scored: number }
interface Props {
  title: string; items: Record<string, any>[]; vocab: VWord[]; nextLabel?: string; // eslint-disable-line @typescript-eslint/no-explicit-any
  onResult: (r: NativeResult) => void;
  onFinish: (a: 'next' | 'again' | 'exit') => void;
}
const INST: Record<string, string> = {
  vcards: '제시하는 단어를 익히고, 소리를 들으며 따라해 보세요',
  vtype1: '단어를 직접 써보며 익히세요.',
  vspell: '단어를 완성해 보세요',
  vmatch: '단어와 한글 뜻을 매칭해 보세요.',
  vsound: '소리를 듣고 단어를 매칭해 보세요.',
  vwrite: '단어를 직접 써보며 익히세요.',
  lookspeak: '그림을 보고 말해 보세요.',
  saykor: '다음의 문장을 영어로 말해 보세요.',
  lspeak: '질문을 듣고 대답해 보세요.',
  raloud: '아래 문장을 듣고 따라 읽어보세요.',
  role: '다음 대화를 역할을 나눠 말해 보세요.',
  present: '내가 쓴 글을 발표해 보세요.',
  aitalk: '아래 상황에 맞게 대화를 진행해 보세요.',
  sbuild: '다음 문장을 영어로 써 보세요.',
  swrite: '다음 문장을 영어로 써 보세요.',
  sfill: '다음 문장에 들어갈 단어를 써 보세요.',
  dfill: '다음 그림을 보고 대화를 완성해 보세요.',
  sscram: '단어나 청크를 올바른 순서로 배열하여 문장을 완성해 봅시다.',
  sorder: '문장을 순서대로 나열해 보세요.',
  mwbank: '보기에서 알맞은 단어를 골라 글을 완성하세요.',
  scloze: '글을 읽고, 빈칸에 들어갈 내용을 채우세요.',
  lwrite: '잘 듣고, 알맞게 적어 봅시다.',
  mfree: '글을 완성해 보세요.',
  swrt: '글을 읽고, 내 글을 써 보세요.',
  goal: '',
  kexp: '핵심 표현을 듣고 따라 읽어 보세요.',
  tapl: '문장을 눌러 듣고 소리 내어 읽어 보세요.',
  lsent: '핵심 표현을 눌러서 들어 보세요.',
  lcardp: '핵심 표현을 눌러서 들어 보세요.',
  lcardt: '핵심 표현을 눌러서 들어 보세요.',
  sdrill: '핵심 표현을 듣고 반복적으로 따라 말해 보세요.',
  pread: '듣고 소리 내어 읽어 보세요.',
  mtext: '모범 글을 읽어 보세요.',
  wrepeat: '단어를 듣고 따라 말해 보세요.',
  wchoice: '알맞은 것을 골라 보세요.',
  pchoice: '그림에 알맞은 말을 고르세요.',
  dchoice: '대화를 읽고 알맞은 것을 고르세요.',
  tf: '일치하면 True, 일치하지 않으면 False 를 선택하세요.',
  lchtext: '잘 듣고, 알맞은 것을 고르세요.',
  lchpic: '잘 듣고, 알맞은 그림을 고르세요.',
  lchlist: '잘 듣고, 알맞은 것을 고르세요.',
  lmatch: '말을 듣고 알맞은 짝을 찾아 연결하세요.',
  sqchoice: '글을 읽고, 질문에 답해 보세요.',
  sqtf: '글을 읽고, 질문에 답해 보세요.',
  sqmulti: '글을 읽고, 질문에 답해 보세요.',
};
/** 그림을 문항 화면 안에서 직접 그리는 템플릿 (그 밖의 템플릿은 오른쪽 위에 보조 그림으로 보인다) */
/** 기획안에 보조 그림이 없는 템플릿(쓰기류): 문항에 pic 이 있어도 우상단 그림을 그리지 않는다 */
const NO_SIDE = ['sbuild', 'swrite', 'sfill', 'sscram', 'sorder', 'mwbank', 'scloze', 'mfree', 'swrt', 'mtext', 'lwrite'];
const OWN_PIC = ['lookspeak', 'role', 'pchoice', 'dchoice', 'dfill', 'goal', 'lcardp', 'lchpic', 'vcards', 'vtype1', 'vspell', 'vmatch', 'vsound', 'vwrite', 'wchoice', 'wrepeat'];
/** 듣고 고르기: 질문을 맨 위 안내 자리에 보여 준다 */
const LCH = ['lchtext', 'lchpic', 'lchlist', 'lwrite'];
const INST_SUB: Record<string, string> = { kexp: '(3번 반복해서 들어주세요)' };
const KIND = { lookspeak: LookSpeak, saykor: SayKor, lspeak: LSpeak, raloud: RAloud, role: Role, present: Present, aitalk: AiTalk, sbuild: SBuild, swrite: SWrite, sfill: SFill, dfill: DFill, sscram: SScram, sorder: SOrder, mwbank: MWBank, scloze: SCloze, lwrite: LWrite, mfree: MFree, swrt: SWrt, goal: Goal, kexp: KExp, tapl: TapL, lsent: LSent, lcardp: LCardP, lcardt: LCardT, sdrill: SDrill, pread: PRead, mtext: MText, wrepeat: WRepeat, vcards: VCards, vtype1: VType1, vspell: VSpell, vmatch: VMatch, vsound: VSound, vwrite: VWrite,
  wchoice: WChoice, pchoice: PChoice, dchoice: DChoice, tf: TrueFalse, lchtext: LChText, lchpic: LChPic, lchlist: LChList, lmatch: LMatch,
  sqchoice: SqChoice, sqtf: SqTF, sqmulti: SqMulti } as const;

/** 어휘 활동 6종 재생기: 문항(화면)을 차례로 보여 주고, 끝나면 결과 화면을 보여 준다. */
export function NativePlayer({ title, items, vocab, nextLabel, onResult, onFinish }: Props) {
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);
  const [all, setAll] = useState<Res[]>([]);
  const [fin, setFin] = useState(false);
  const [pts, setPts] = useState(0);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const byKey = useMemo(() => new Map(vocab.map((v) => [v.key, v])), [vocab]);
  const it = items[i];

  if (fin) {
    const scored = all.filter((r) => r.tag); const ok = scored.filter((r) => r.ok).length;
    const pct = scored.length ? ok / scored.length : 1; const st = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
    return (
      <div className="nv-overlay"><div className="nv-result">
        <h1>{st === 3 ? '완벽해요!' : st === 2 ? '잘했어요!' : '끝까지 해냈어요!'}</h1>
        <div className="nv-stars">{[1, 2, 3].map((n) => <span key={n} style={{ color: n <= st ? '#FFC000' : '#D9DEE8' }}>★</span>)}</div>
        <p className="nv-sum">{scored.length ? `첫 시도 정답 ${ok}/${scored.length}` : '모든 단어를 익혔어요'} · 포인트 +{pts}</p>
        <div className="nv-btns">
          {nextLabel && <button className="nv-btn nv-btn-lg" onClick={() => onFinish('next')}>다음: {nextLabel}</button>}
          <button className="nv-btn nv-ghost" onClick={() => onFinish('again')}>다시 하기</button>
          <button className="nv-btn nv-ghost" onClick={() => onFinish('exit')}>나가기</button>
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
    <div className="nv-overlay">
      <div className="nv-head">
        <button className="nv-x" onClick={() => onFinish('exit')} aria-label="나가기">‹</button>
        <b>{title}</b>
        <span className="nv-dots">{items.map((_, k) => <i key={k} className={k < i ? 'd1' : k === i ? 'd2' : ''} />)}</span>
        <span className="nv-pts">★ 포인트 : +{pts}</span>
      </div>
      <p className="nv-inst">{LCH.includes(it.k) && it.q ? it.q : it.inst || INST[it.k] || ''}{INST_SUB[it.k] && <small>{INST_SUB[it.k]}</small>}</p>
      <FbSlot.Provider value={slot}>
      {!Comp || words.length !== keys.length
        ? <p className="nv-hint">이 문항에 쓰인 단어가 단원 어휘에 없어요. 관리자에서 단어를 확인해 주세요. ({keys.filter((k) => !byKey.has(k)).join(', ')})</p>
        : <Comp key={i} item={it} words={words} vocab={vocab} pic={(k) => (k ? byKey.get(k)?.image ?? null : null)} onDone={onDone} />}
      </FbSlot.Provider>
      {it.pic && !OWN_PIC.includes(it.k) && !NO_SIDE.includes(it.k) && byKey.get(it.pic)?.image && <img className="nv-sidepic" src={imgSrc(byKey.get(it.pic)!.image)} alt="" draggable={false} />}
      <div className="nv-foot"><span className="nv-fbslot" ref={setSlot} /><button className="nv-btn nv-btn-lg" disabled={!done} onClick={next}>{last ? '결과 보기' : '다음'}</button></div>
    </div>
  );
}
