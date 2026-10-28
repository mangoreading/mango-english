/**
 * Mango English 활동 아이템 스키마 v0.1
 * - 정적 MVP(app/js/engine.js)의 kind 13종을 그대로 정식 타입으로 옮긴 것.
 * - DB(items.payload)에는 이 스키마로 검증된 JSON만 저장한다.
 * - 정규식/함수는 JSON에 저장할 수 없으므로 Pattern({source, flags}) 형태로 저장한다.
 *   (MVP의 dialog.turns[].re, compose.rules[].re 는 직렬화 시 {} 로 사라지므로 이관 때 pattern 으로 재작성 필요)
 */
import { z } from 'zod';

export const Level = z.enum(['CORE', 'SUPPORT', 'ADVANCED']);
export type Level = z.infer<typeof Level>;

/** 영역 태그: 어휘/표현/듣기/말하기/읽기/쓰기 */
export const Tag = z.enum(['vocab', 'expr', 'listen', 'speak', 'read', 'write']);
export type Tag = z.infer<typeof Tag>;

/** 차시 1~8 (6=통합 미션(비점수), 7=Check, 8=맞춤) */
export const LessonNo = z.number().int().min(1).max(20);

export const Pattern = z.object({ source: z.string(), flags: z.string().default('i') });

/** vocab 마스터 id (이미지 키). 예: "hat" */
const AssetKey = z.string().min(1);

const base = {
  tag: Tag.optional(),
  /** 학습목표 코드 (예: LO2) */
  lo: z.string().optional(),
  /** 화면에 먼저 보여 주는 상황 그림/문맥 */
  flag: AssetKey.optional(),
  /** 말하는 사람 카드 (people 키 + 상황 한 줄) */
  ctx: z.object({ key: z.string(), line: z.string() }).optional(),
};

const Opt = z.object({ t: z.string(), flag: AssetKey.optional() });

export const Learn = z.object({
  ...base, k: z.literal('learn'), title: z.string(),
  cards: z.array(z.object({ flag: AssetKey.optional(), en: z.string(), ko: z.string(), say: z.string().optional() })).min(1),
});

export const Text = z.object({
  ...base, k: z.literal('text'), title: z.string().optional(), text: z.string(), ko: z.string().nullable().optional(), book: z.string().optional(),
});

export const Brief = z.object({
  ...base, k: z.literal('brief'), title: z.string(), text: z.string(), people: z.array(z.string()).default([]),
});

export const Choose = z.object({
  ...base, k: z.literal('choose'),
  q: z.string(), opts: z.array(Opt).min(2).max(6), a: z.number().int().min(0),
  say: z.string().optional(), script: z.array(z.string()).optional(),
  blank: z.boolean().optional(), bubble: z.string().optional(), pic: z.string().optional(),
  fb: z.string().optional(),
});

export const Match = z.object({
  ...base, k: z.literal('match'), title: z.string(),
  pairs: z.array(z.object({ key: z.string(), say: z.string() })).min(2),
  right: z.array(z.string()).min(2),
});

export const Build = z.object({
  ...base, k: z.literal('build'), ko: z.string().optional(), ans: z.string(), words: z.array(z.string()).min(2),
});

const Typed = {
  ...base, q: z.string().optional(), ans: z.string(), alts: z.array(z.string()).optional(), ko: z.string().optional(),
  fb: z.string().optional(), wide: z.boolean().optional(),
};
export const Fill = z.object({ ...Typed, k: z.literal('fill') });
export const Write = z.object({ ...Typed, k: z.literal('write') });

export const Compose = z.object({
  ...base, k: z.literal('compose'), title: z.string(), kind: z.string().optional(),
  persona: z.object({ key: z.string(), line: z.string() }).optional(),
  rules: z.array(z.object({ label: z.string(), re: Pattern.optional() })).min(1),
  minSent: z.number().int().min(1).default(1), sample: z.string(), starter: z.string().optional(), tip: z.string().optional(),
});

export const Speak = z.object({
  ...base, k: z.literal('speak'), prompt: z.string().optional(), target: z.string(), disp: z.string().optional(),
  accept: z.array(z.string()).optional(), ask: z.string().optional(), hide: z.boolean().optional(),
  listen: z.boolean().optional(), autoplay: z.boolean().optional(),
});

export const Fade = z.object({
  ...base, k: z.literal('fade'), target: z.string(), ask: z.string().optional(), accept: z.array(z.string()).optional(),
  q1: z.string().optional(), prompt3: z.string().optional(), opts: z.array(Opt).optional(), a: z.number().int().optional(), fb: z.string().optional(),
});

export const Dialog = z.object({
  ...base, k: z.literal('dialog'),
  persona: z.object({ key: z.string(), line: z.string() }),
  ai: z.object({ key: z.string(), shop: z.boolean().optional() }).optional(),
  turns: z.array(z.union([
    z.object({ who: z.literal('ai'), text: z.string() }),
    z.object({ who: z.literal('me'), accept: z.array(z.string()), opts: z.array(z.string()).nullable().optional(), re: Pattern.optional() }),
  ])).min(2),
  free: z.object({ n: z.number().int().min(1) }).nullable().optional(),
});


/* ===== 어휘 활동 템플릿 6종 (Mango English 활동 기획서 p29~34) =====
 * 단어는 단원 어휘(vocab)의 key 로 참조한다. 그림·한글 뜻은 번들의 vocab 에서 가져온다. */
const VKeys = z.array(z.string().min(1)).min(2).max(9);
const vbase = { ...base, inst: z.string().optional() };
/** 단어 카드 보기 (소리 듣고 따라 하기) */
export const VCards = z.object({ ...vbase, k: z.literal('vcards'), words: VKeys });
/** 단어 한 개씩 보고 따라 쓰기 */
export const VType1 = z.object({ ...vbase, k: z.literal('vtype1'), words: VKeys });
/** 철자 완성: 앞부분만 보이고 나머지 글자를 눌러 완성 */
export const VSpell = z.object({ ...vbase, k: z.literal('vspell'), word: z.string().min(1), shown: z.number().int().min(0).optional(), extra: z.string().optional() });
/** 단어 ↔ 한글 뜻 매칭 */
export const VMatch = z.object({ ...vbase, k: z.literal('vmatch'), words: VKeys });
/** 소리 ↔ 단어 매칭 */
export const VSound = z.object({ ...vbase, k: z.literal('vsound'), words: VKeys });
/** 그림 보고 쓰기 (여러 단어를 한 화면에서) */
export const VWrite = z.object({ ...vbase, k: z.literal('vwrite'), words: VKeys });

/* ===== 1단계: 고르기 · True/False · 듣고 고르기 · 짝짓기 · 글 읽고 답하기 ===== */
const hint = z.array(z.string()).optional();
const T1 = { ...base, inst: z.string().optional(), /** 화면 오른쪽 위에 보이는 그림(단원 단어 key, 선택) */ pic: z.string().optional() };
/** 뜻 고르기: 단원 단어 1개 + 오답 보기. dir=ko2en 이면 한글 뜻을 보고 영어를, en2ko 면 반대로 */
export const WChoice = z.object({ ...T1, k: z.literal('wchoice'), word: z.string().min(1), dir: z.enum(['ko2en', 'en2ko']).optional(), wrong: z.array(z.string().min(1)).min(1).max(5) });
/** 그림 보고 고르기 */
export const PChoice = z.object({ ...T1, k: z.literal('pchoice'), q: z.string().optional(), pic: z.string().min(1), opts: z.array(Opt).min(2).max(6), a: z.number().int().min(0), hint });
/** 대화 고르기 */
export const DChoice = z.object({ ...T1, k: z.literal('dchoice'), q: z.string().optional(), pic: z.string().optional(), lines: z.array(z.string()).optional(), opts: z.array(Opt).min(2).max(6), a: z.number().int().min(0) });
/** True or False */
export const TrueFalse = z.object({ ...T1, k: z.literal('tf'), lines: z.array(z.string()).optional(), stmt: z.string().min(1), a: z.boolean().optional(), hint });
/** 듣고 고르기 3종 (글 4칸 / 그림 4칸 / 세로 목록) */
const lch = { ...T1, q: z.string().optional(), say: z.string().min(1), opts: z.array(Opt).min(2).max(6), a: z.number().int().min(0), hint };
export const LChText = z.object({ ...lch, k: z.literal('lchtext') });
export const LChPic = z.object({ ...lch, k: z.literal('lchpic') });
export const LChList = z.object({ ...lch, k: z.literal('lchlist') });
/** 듣고 짝짓기 */
export const LMatch = z.object({ ...T1, k: z.literal('lmatch'), pairs: z.array(z.object({ left: z.string().min(1), say: z.string().optional(), right: z.string().min(1) })).min(2).max(6) });
/** 글 읽고 답하기 3종 */
const sq = { ...T1, title: z.string().optional(), text: z.array(z.string().min(1)).min(1), ko: z.string().optional(), q: z.string().optional(), hint };
export const SqChoice = z.object({ ...sq, k: z.literal('sqchoice'), q: z.string().min(1), opts: z.array(Opt).min(2).max(6), a: z.number().int().min(0) });
export const SqTF = z.object({ ...sq, k: z.literal('sqtf'), items: z.array(z.object({ t: z.string().min(1), a: z.boolean().optional() })).min(1).max(6) });
export const SqMulti = z.object({ ...sq, k: z.literal('sqmulti'), items: z.array(z.object({ t: z.string().min(1), ok: z.boolean().optional() })).min(2).max(6) });

/* ===== 2단계: 듣고 익히기 · 따라 말하기 · 학습목표 · 문장 바꿔 말하기 · 글 듣고 읽기 · 모범 글 =====
 * 강조 표기: [[파랑]] {{빨강}}. 본문의 '---' 줄은 쪽 나눔. */
const Ex = z.object({ en: z.string().min(1), ko: z.string().optional(), pic: z.string().optional(), label: z.string().optional(), group: z.string().optional() });
const exs = (n: number) => z.array(Ex).min(n).max(8);
export const Goal = z.object({ ...T1, k: z.literal('goal'), title: z.string().min(1), ko: z.string().optional(), pic: z.string().optional(), head: z.string().optional(), items: exs(1) });
export const KExp = z.object({ ...T1, k: z.literal('kexp'), items: exs(1) });
export const TapL = z.object({ ...T1, k: z.literal('tapl'), items: exs(1) });
export const LSent = z.object({ ...T1, k: z.literal('lsent'), items: exs(1) });
export const LCardP = z.object({ ...T1, k: z.literal('lcardp'), items: exs(1) });
export const LCardT = z.object({ ...T1, k: z.literal('lcardt'), items: exs(1) });
export const WRepeat = z.object({ ...vbase, k: z.literal('wrepeat'), words: VKeys });
export const SDrill = z.object({ ...T1, k: z.literal('sdrill'), tpl: z.string().refine((v) => v.includes('{}'), '문장에 {} (바꿀 자리)가 있어야 해요'), words: z.array(z.string().min(1)).min(2).max(10) });
export const PRead = z.object({ ...T1, k: z.literal('pread'), text: z.array(z.string().min(1)).min(1), ko: z.string().optional() });
/** 장면 영상: 그림·대사가 이어지는 30초 안팎의 짧은 장면 + (선택) 확인 문항 */
export const Scene = z.object({ ...T1, k: z.literal('scene'), title: z.string().optional(),
  scenes: z.array(z.object({ who: z.string().optional(), en: z.string().min(1), ko: z.string().optional(), pic: z.string().optional() })).min(2).max(14),
  sub: z.enum(['en', 'enko', 'none']).optional(), replay: z.number().int().min(0).max(5).optional(),
  qs: z.array(z.object({ q: z.string().min(1), ans: z.string().min(1), wrong: z.array(z.string().min(1)).min(1).max(3) })).max(4).optional() });
export const MText = z.object({ ...T1, k: z.literal('mtext'), title: z.string().optional(), text: z.array(z.string().min(1)).min(1), explain: z.array(z.string()).optional(), ko: z.string().optional() });

/* ===== 3단계: 쓰기류 =====  빈칸은 {} (정답은 ans 에 순서대로, "|" 로 여러 정답) */
const alts = z.array(z.string()).optional();
export const SBuild = z.object({ ...T1, k: z.literal('sbuild'), ko: z.string().optional(), ans: z.string().min(1), alts, hint, starter: z.string().optional(), tpl: z.string().optional() });
export const SWrite = z.object({ ...T1, k: z.literal('swrite'), ko: z.string().optional(), ans: z.string().min(1), alts, hint, starter: z.string().optional() });
export const SFill = z.object({ ...T1, k: z.literal('sfill'), ko: z.string().optional(), tpl: z.string().refine((v) => v.includes('{}'), '문장에 {} (빈칸)가 있어야 해요'), ans: z.string().min(1), hint });
export const DFill = z.object({ ...T1, k: z.literal('dfill'), pic: z.string().optional(), tag2: z.string().optional(), lines: z.array(z.string().min(1)).min(1), ans: z.array(z.string().min(1)).min(1), blankHints: z.array(z.string()).optional(), hint });
export const SScram = z.object({ ...T1, k: z.literal('sscram'), ko: z.string().optional(), ans: z.string().min(1), extra: z.array(z.string()).optional(), alts, hint });
export const SOrder = z.object({ ...T1, k: z.literal('sorder'), items: z.array(z.object({ en: z.string().min(1), ko: z.string().optional() })).min(2).max(8) });
export const MWBank = z.object({ ...T1, k: z.literal('mwbank'), lines: z.array(z.string().min(1)).min(1), ans: z.array(z.string().min(1)).min(1), extra: z.array(z.string()).optional(), blankHints: z.array(z.string()).optional(), hint });
export const SCloze = z.object({ ...T1, k: z.literal('scloze'), lines: z.array(z.string().min(1)).min(1), ans: z.array(z.string().min(1)).min(1), extra: z.array(z.string()).optional(), blankHints: z.array(z.string()).optional(), hint });
export const LWrite = z.object({ ...T1, k: z.literal('lwrite'), q: z.string().optional(), say: z.string().min(1), h1: z.string().optional(), h2: z.string().optional(), rows: z.array(z.object({ label: z.string().min(1), ans: z.string().min(1) })).min(1).max(6), hint });
export const MFree = z.object({ ...T1, k: z.literal('mfree'), topic: z.string().optional(), topicLabel: z.string().optional(), lines: z.array(z.string().min(1)).min(1), lineHints: z.array(z.string()).optional(), hint });
export const SWrt = z.object({ ...T1, k: z.literal('swrt'), title: z.string().optional(), rules: z.array(z.object({ label: z.string().min(1), re: z.string().optional() })).min(1), minSent: z.number().int().min(1).optional(), starter: z.string().optional(), hint });

/* ===== 4단계: 말하기 ===== */
const sp = { ...T1, target: z.string().min(1), pass: z.number().min(0.3).max(1).optional(), hint };
export const LookSpeak = z.object({ ...sp, k: z.literal('lookspeak'), pic: z.string().optional(), label: z.string().optional(), price: z.string().optional() });
export const SayKor = z.object({ ...sp, k: z.literal('saykor'), ko: z.string().min(1), koHl: z.string().optional() });
export const LSpeak = z.object({ ...sp, k: z.literal('lspeak'), ask: z.string().optional(), ko: z.string().optional() });
export const RAloud = z.object({ ...T1, k: z.literal('raloud'), target: z.string().min(1), stars: z.boolean().optional(), fluency: z.boolean().optional() });
export const Role = z.object({ ...T1, k: z.literal('role'), pic: z.string().optional(), price: z.string().optional(), lines: z.array(z.string().regex(/^\s*[A-Za-z]+\s*[:：]/, '"A: 문장" 형식이어야 해요')).min(2).max(10) });
export const Present = z.object({ ...T1, k: z.literal('present'), text: z.array(z.string().min(1)).min(1) });
export const AiTalk = z.object({ ...T1, k: z.literal('aitalk'), situation: z.string().min(1), role: z.string().optional(), open: z.string().optional(), turns: z.number().int().min(1).max(10).optional(), script: z.array(z.object({ ai: z.string().min(1), hint: z.string().optional() })).optional(), hints: z.array(z.string()).optional() });

export const ActivityItem = z.discriminatedUnion('k', [
  Learn, Text, Brief, Choose, Match, Build, Fill, Write, Compose, Speak, Fade, Dialog,
  VCards, VType1, VSpell, VMatch, VSound, VWrite,
  LookSpeak, SayKor, LSpeak, RAloud, Role, Present, AiTalk,
  SBuild, SWrite, SFill, DFill, SScram, SOrder, MWBank, SCloze, LWrite, MFree, SWrt,
  Goal, KExp, TapL, LSent, LCardP, LCardT, Scene, WRepeat, SDrill, PRead, MText,
  WChoice, PChoice, DChoice, TrueFalse, LChText, LChPic, LChList, LMatch, SqChoice, SqTF, SqMulti,
]).superRefine((v, ctx) => {
  if (v.k === 'choose' && v.a >= v.opts.length) ctx.addIssue({ code: 'custom', path: ['a'], message: 'a(정답 index)가 opts 범위를 벗어났어요' });
  if ((v.k === 'pchoice' || v.k === 'dchoice' || v.k === 'lchtext' || v.k === 'lchpic' || v.k === 'lchlist' || v.k === 'sqchoice') && v.a >= v.opts.length) ctx.addIssue({ code: 'custom', path: ['a'], message: '정답 번호가 보기 범위를 벗어났어요' });
  const blanks = (ls: string[]) => ls.join('\n').split('{}').length - 1;
  if ((v.k === 'dfill' || v.k === 'mwbank' || v.k === 'scloze') && blanks(v.lines) !== v.ans.length) ctx.addIssue({ code: 'custom', path: ['ans'], message: `빈칸({}) ${blanks(v.lines)}개와 정답 ${v.ans.length}개가 달라요` });
  if (v.k === 'mfree' && blanks(v.lines) < 1) ctx.addIssue({ code: 'custom', path: ['lines'], message: '빈칸 {} 이 하나 이상 있어야 해요' });
  if (v.k === 'sqmulti' && !v.items.some((x) => x.ok)) ctx.addIssue({ code: 'custom', path: ['items'], message: '정답이 하나 이상 있어야 해요' });
  if (v.k === 'vspell' && v.shown !== undefined && v.shown >= v.word.length) ctx.addIssue({ code: 'custom', path: ['shown'], message: '보이는 글자 수는 단어 길이보다 작아야 해요' });
  if (v.k === 'build' && v.ans.split(/\s+/).sort().join(' ') !== [...v.words].sort().join(' ')) ctx.addIssue({ code: 'custom', path: ['words'], message: 'words 를 합치면 ans 와 같아야 해요' });
});
export type ActivityItem = z.infer<typeof ActivityItem>;
export type Kind = ActivityItem['k'];
export const KINDS = ['learn', 'text', 'brief', 'choose', 'match', 'build', 'fill', 'write', 'compose', 'speak', 'fade', 'dialog', 'vcards', 'vtype1', 'vspell', 'vmatch', 'vsound', 'vwrite',
  'lookspeak', 'saykor', 'lspeak', 'raloud', 'role', 'present', 'aitalk',
  'sbuild', 'swrite', 'sfill', 'dfill', 'sscram', 'sorder', 'mwbank', 'scloze', 'lwrite', 'mfree', 'swrt',
  'goal', 'scene', 'kexp', 'tapl', 'lsent', 'lcardp', 'lcardt', 'wrepeat', 'sdrill', 'pread', 'mtext',
  'wchoice', 'pchoice', 'dchoice', 'tf', 'lchtext', 'lchpic', 'lchlist', 'lmatch', 'sqchoice', 'sqtf', 'sqmulti'] as const;

/** 아이템 상태 (검수 워크플로) */
export const ItemStatus = z.enum(['draft', 'review', 'approved', 'rejected']);

/** DB items 한 행에 대응 */
export const ItemRow = z.object({
  id: z.string().uuid().optional(),
  unit_id: z.string().uuid(),
  lesson: LessonNo,
  act_idx: z.number().int().min(0),
  level: Level,
  template: z.enum(KINDS),
  payload: ActivityItem,
  status: ItemStatus.default('draft'),
}).refine((v) => v.template === v.payload.k, { message: 'template 과 payload.k 가 달라요' });
export type ItemRow = z.infer<typeof ItemRow>;

/** 단원 소스(입력 데이터): 여기서 활동이 자동 생성된다 */
export const UnitSource = z.object({
  vocab: z.array(z.object({ id: AssetKey, en: z.string(), ko: z.string() })),
  expressions: z.array(z.object({ en: z.string(), ko: z.string() })),
  dialogs: z.array(z.object({ title: z.string(), lines: z.array(z.object({ who: z.string(), text: z.string(), ko: z.string().optional() })) })),
  passages: z.array(z.object({ title: z.string(), text: z.string(), ko: z.string().optional() })).default([]),
  goals: z.array(z.object({ lo: z.string(), ko: z.string() })),
});
export type UnitSource = z.infer<typeof UnitSource>;
