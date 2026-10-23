import type { VWord } from '@mango/play';
import type { VocabOpt } from './ItemForm';

const NATIVE = ['vcards', 'vtype1', 'vspell', 'vmatch', 'vsound', 'vwrite'];
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
};

/** 문항이 쓰는 단어를 단원 단어 목록에서 찾아 그림까지 붙여 돌려준다 */
export function nativeVocab(item: Record<string, any>, vocab: VocabOpt[]): VWord[] { // eslint-disable-line @typescript-eslint/no-explicit-any
  const keys: string[] = item.k === 'vspell' ? [item.word] : item.words ?? [];
  return keys.map((k) => vocab.find((v) => v.key === k)).filter(Boolean).map((v) => ({ key: v!.key, en: v!.en, ko: v!.ko, image: v!.image_path ?? null }));
}
