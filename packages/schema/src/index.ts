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
export const LessonNo = z.number().int().min(1).max(8);

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

export const ActivityItem = z.discriminatedUnion('k', [
  Learn, Text, Brief, Choose, Match, Build, Fill, Write, Compose, Speak, Fade, Dialog,
]).superRefine((v, ctx) => {
  if (v.k === 'choose' && v.a >= v.opts.length) ctx.addIssue({ code: 'custom', path: ['a'], message: 'a(정답 index)가 opts 범위를 벗어났어요' });
  if (v.k === 'build' && v.ans.split(/\s+/).sort().join(' ') !== [...v.words].sort().join(' ')) ctx.addIssue({ code: 'custom', path: ['words'], message: 'words 를 합치면 ans 와 같아야 해요' });
});
export type ActivityItem = z.infer<typeof ActivityItem>;
export type Kind = ActivityItem['k'];
export const KINDS = ['learn', 'text', 'brief', 'choose', 'match', 'build', 'fill', 'write', 'compose', 'speak', 'fade', 'dialog'] as const;

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
