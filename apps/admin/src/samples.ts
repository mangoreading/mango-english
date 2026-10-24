import type { VWord } from '@mango/play';
import type { VocabOpt } from './ItemForm';

const NATIVE = ['vcards', 'vtype1', 'vspell', 'vmatch', 'vsound', 'vwrite', 'wchoice', 'pchoice', 'dchoice', 'tf', 'lchtext', 'lchpic', 'lchlist', 'lmatch', 'sqchoice', 'sqtf', 'sqmulti'];
export const isNativeKind = (k: string) => NATIVE.includes(k);

/** 샘플 미리보기용 단어 (앱에 들어 있는 그림 사용) */
export const SAMPLE_VOCAB: VWord[] = [
  { key: 'cap', en: 'cap', ko: '모자', image: 'word/hat.png' }, { key: 'jacket', en: 'jacket', ko: '재킷', image: 'word/jacket.png' },
  { key: 'socks', en: 'socks', ko: '양말', image: 'word/socks.png' }, { key: 'shoes', en: 'shoes', ko: '신발', image: 'word/shoes.png' },
  { key: 'pants', en: 'pants', ko: '바지', image: 'word/shorts.png' }, { key: 'sunglasses', en: 'sunglasses', ko: '선글라스', image: 'word/sunglasses.png' },
];
const W = SAMPLE_VOCAB.map((v) => v.key);
/** 어휘 6종의 샘플 문항 */
export const NATIVE_SAMPLES: Record<string, Record<string, unknown>> = {
  vcards: { k: 'vcards', tag: 'vocab', words: W }, vtype1: { k: 'vtype1', tag: 'vocab', words: W },
  vspell: { k: 'vspell', tag: 'vocab', word: 'sunglasses', shown: 6 }, vmatch: { k: 'vmatch', tag: 'vocab', words: W },
  vsound: { k: 'vsound', tag: 'vocab', words: W }, vwrite: { k: 'vwrite', tag: 'vocab', words: W },
  wchoice: { k: 'wchoice', tag: 'vocab', word: 'shoes', dir: 'ko2en', wrong: ['import', 'promote', 'anticipate'] },
  pchoice: { k: 'pchoice', tag: 'vocab', pic: 'pants', opts: [{ t: 'this pants' }, { t: 'the pants' }, { t: 'these pants' }, { t: 'a pants' }], a: 2 },
  dchoice: { k: 'dchoice', tag: 'read', lines: ['A: May I help you?', 'B: Yes, please. How much are these socks?', 'A: ______'], opts: [{ t: "They're two thousand won." }, { t: "It's two thousand won." }, { t: 'I like socks.' }, { t: 'Here you are.' }], a: 0 },
  tf: { k: 'tf', tag: 'read', lines: ['A: How much is the book?', "B: It's nine thousand won."], stmt: 'These sunglasses are thirteen thousand won.', a: false, hint: ['A: How much is the book?', "B: It's nine thousand won."] },
  lchtext: { k: 'lchtext', tag: 'listen', q: '재킷의 가격은 얼마인가요?', say: "How much is this jacket? It's fourteen dollars.", opts: [{ t: 'thirty-five dollars' }, { t: 'sixteen dollars' }, { t: 'fourteen dollars' }, { t: 'seventeen dollars' }], a: 2, hint: ['How much is this jacket?', "It's fourteen dollars."] },
  lchpic: { k: 'lchpic', tag: 'listen', q: '손님이 가격을 물은 물건은 무엇일까요?', say: 'Hello! May I help you? Yes, please. How much are these socks?', opts: [{ t: 'cap', flag: 'cap' }, { t: 'jacket', flag: 'jacket' }, { t: 'socks', flag: 'socks' }, { t: 'sunglasses', flag: 'sunglasses' }], a: 2, hint: ['Hello! May I help you?', 'Yes, please. How much are these socks?'] },
  lchlist: { k: 'lchlist', tag: 'listen', q: '재킷의 가격은 얼마인가요?', say: "How much is this jacket? It's nine thousand won.", opts: [{ t: 'Three thousand won' }, { t: 'Four thousand won' }, { t: 'Nine thousand won' }, { t: 'Six thousand won' }], a: 2, hint: ['How much is this jacket?', "It's nine thousand won."] },
  lmatch: { k: 'lmatch', tag: 'listen', pairs: [{ left: 'Lily', say: 'I want these shoes.', right: 'shoes' }, { left: 'Ken', say: 'I want those sunglasses.', right: 'sunglasses' }, { left: 'Mia', say: 'I want a pair of shorts.', right: 'shorts' }, { left: 'Tom', say: 'I want a hat.', right: 'hat' }] },
  sqchoice: { k: 'sqchoice', tag: 'read', title: 'Be a Good Shopper', text: ["I'm at the shopping center.", 'Oh! This phone case is cool.', 'How much is it?', "It's on sale now.", "It's only 5,000 won.", 'I want to buy it.'], ko: '나는 쇼핑센터에 있어. 와! 이 휴대폰 케이스 멋지다. 얼마예요? 지금 세일 중이야. 겨우 5,000원이야. 사고 싶어.', q: 'How much is the phone case?', opts: [{ t: '5,000 won' }, { t: '4,000 won' }, { t: '9,000 won' }, { t: '15,000 won' }], a: 0, hint: ['five thousand won'] },
  sqtf: { k: 'sqtf', tag: 'read', text: ['Jake, wait! You need to think first.', 'Do you NEED it?', 'Or do you just WANT it?', "Please don't buy it.", 'You already have a nice phone case.'], q: 'Q1. 글의 내용과 일치하면 T, 아니면 F를 선택하세요.', items: [{ t: 'Jake should think first.', a: true }, { t: 'Jake has no phone case.', a: false }, { t: 'The writer wants Jake to buy it.', a: false }] },
  sqmulti: { k: 'sqmulti', tag: 'read', text: ["It's my sister's birthday tomorrow.", 'I want to buy a hairpin for her.', 'How much is it?', "It's 8,000 won.", 'Oh, no! I used all my money for this week.'], q: 'Q1. 글의 내용과 맞는 것을 모두 선택하세요.', items: [{ t: "Tomorrow is the writer's birthday." }, { t: 'The writer wants a hairpin for her sister.', ok: true }, { t: 'The hairpin is 8,000 won.', ok: true }, { t: 'The writer has a lot of money.' }] },
};

/** 문항이 쓰는 단어를 단원 단어 목록에서 찾아 그림까지 붙여 돌려준다 */
export function nativeVocab(item: Record<string, any>, vocab: VocabOpt[]): VWord[] { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!['vcards', 'vtype1', 'vspell', 'vmatch', 'vsound', 'vwrite', 'wchoice'].includes(item.k)) return vocab.map((v) => ({ key: v.key, en: v.en, ko: v.ko, image: v.image_path ?? null })); // 문장형은 그림 찾기용으로 전체 전달
  const keys: string[] = item.k === 'vspell' || item.k === 'wchoice' ? [item.word] : item.words ?? [];
  return keys.map((k) => vocab.find((v) => v.key === k)).filter(Boolean).map((v) => ({ key: v!.key, en: v!.en, ko: v!.ko, image: v!.image_path ?? null }));
}
