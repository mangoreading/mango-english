import type { VWord } from '@mango/play';
import type { VocabOpt } from '../pages/units/ItemForm';

const NATIVE = ['vcards', 'vtype1', 'vspell', 'vmatch', 'vsound', 'vwrite', 'wchoice', 'pchoice', 'dchoice', 'tf', 'lchtext', 'lchpic', 'lchlist', 'lmatch', 'sqchoice', 'sqtf', 'sqmulti', 'goal', 'scene', 'lecture', 'wsent', 'lnum', 'kexp', 'tapl', 'lsent', 'lcardp', 'lcardt', 'wrepeat', 'sdrill', 'pread', 'mtext', 'sbuild', 'swrite', 'sfill', 'dfill', 'sscram', 'sorder', 'mwbank', 'scloze', 'lwrite', 'mfree', 'swrt', 'lookspeak', 'saykor', 'lspeak', 'raloud', 'role', 'present', 'aitalk'];
export const isNativeKind = (k: string) => NATIVE.includes(k);

/** 샘플 미리보기용 단어 (앱에 들어 있는 그림 사용) */
export const SAMPLE_VOCAB: VWord[] = [
  { key: 'cap', en: 'cap', ko: '모자', image: 'word/hat.png' }, { key: 'jacket', en: 'jacket', ko: '재킷', image: 'word/jacket.png' },
  { key: 'socks', en: 'socks', ko: '양말', image: 'word/socks.png' }, { key: 'shoes', en: 'shoes', ko: '신발', image: 'word/shoes.png' },
  { key: 'pants', en: 'pants', ko: '바지', image: 'word/shorts.png' }, { key: 'sunglasses', en: 'sunglasses', ko: '선글라스', image: 'word/sunglasses.png' },
  { key: 'cup', en: 'cup', ko: '컵', image: 'word/cup.svg' }, { key: 'ball', en: 'ball', ko: '공', image: 'word/ball.svg' },
  { key: 'bag', en: 'bag', ko: '가방', image: 'word/bag.svg' }, { key: 'book', en: 'book', ko: '책', image: 'word/book.svg' },
  { key: 'umbrella', en: 'umbrella', ko: '우산', image: 'word/umbrella.svg' }, { key: 'gloves', en: 'gloves', ko: '장갑', image: 'word/gloves.svg' },
  { key: 'watch', en: 'watch', ko: '손목시계', image: 'word/watch.svg' }, { key: 'glasses', en: 'glasses', ko: '안경', image: 'word/glasses.svg' },
  { key: 'jeans', en: 'jeans', ko: '청바지', image: 'word/jeans.svg' },
  { key: 'jackettag', en: 'jacket', ko: '재킷', image: 'word/jacket_tag.png' }, // 이름표·가격표가 그려진 그림 (그림 보고 말하기·역할극·대화 완성 샘플용)
];
const W = SAMPLE_VOCAB.slice(0, 6).map((v) => v.key);
/** 어휘 6종의 샘플 문항 */
export const NATIVE_SAMPLES: Record<string, Record<string, unknown>> = {
  vcards: { k: 'vcards', tag: 'vocab', words: W }, vtype1: { k: 'vtype1', tag: 'vocab', words: W },
  vspell: { k: 'vspell', tag: 'vocab', word: 'sunglasses', shown: 6 }, vmatch: { k: 'vmatch', tag: 'vocab', words: W },
  vsound: { k: 'vsound', tag: 'vocab', words: W }, vwrite: { k: 'vwrite', tag: 'vocab', words: W },
  lookspeak: { k: 'lookspeak', tag: 'speak', pic: 'jackettag', target: 'How much are these jackets?', hint: ['How much are ~?'] },
  saykor: { k: 'saykor', tag: 'speak', ko: '16,000원입니다.', koHl: '16,000원', target: "They're sixteen thousand won.", hint: ["They're ~."] },
  lspeak: { k: 'lspeak', tag: 'speak', ask: 'How much are these sunglasses?', ko: 'Ken의 가게 / 선글라스 13,000원', target: "They're thirteen thousand won.", hint: ["They're ~ won."] },
  raloud: { k: 'raloud', tag: 'speak', target: "It's fifteen thousand won.", stars: true, fluency: true },
  role: { k: 'role', tag: 'speak', pic: 'jackettag', lines: ['A: May I help you?', 'B: Yes, please. How much are {{these jackets}}?', 'A: [[They are sixteen thousand]] dollars.', "B: I'll take them."] },
  present: { k: 'present', tag: 'speak', text: ['Do you want [[cool pants]]?', 'These pants are [[blue]] and [[yellow]].', 'Look at the [[beautiful butterflies]].', 'They were [[twenty]] dollars.', 'Now, they are [[ten]] dollars.', 'Take them now!'] },
  aitalk: { k: 'aitalk', tag: 'speak', situation: 'You are Omar. You want to buy the watch.', role: 'a watch shop clerk', open: 'Hello! Can I help you?', script: [{ ai: "It's fifteen thousand won.", hint: 'How much ~~~? 로 시작해보세요' }, { ai: "They're two thousand won.", hint: 'How much are they? 라고 물어보세요' }, { ai: 'Thank you! Here you are.', hint: "I'll take it. 이라고 말해 보세요" }], turns: 3 },
  sbuild: { k: 'sbuild', tag: 'write', ko: '이거 얼마예요?', ans: 'How much is it?' },
  swrite: { k: 'swrite', tag: 'write', ko: '이 양말은 얼마예요?', tpl: 'How much {} these socks?', ans: 'How much are these socks?', starter: 'How much' },
  sfill: { k: 'sfill', tag: 'write', ko: '이 양말은 얼마예요?', tpl: 'How much {} these socks?', ans: 'are' },
  dfill: { k: 'dfill', tag: 'write', pic: 'jackettag', lines: ['A: How much are these {}?', 'B: They are {} dollars.'], ans: ['jackets|jacket', 'sixteen thousand'], blankHints: ['가격표를 보세요. 재킷이 여러 벌이라 these 다음 말이 복수형이어야 해요.', '가격표의 $16,000 을 영어 숫자 낱말로 써요. (예: ten thousand)'] },
  sscram: { k: 'sscram', tag: 'write', ko: '신발은 얼마인가요?', ans: 'How much are these shoes?' },
  sorder: { k: 'sorder', tag: 'write', items: [{ en: 'How much is it?', ko: '이것은 얼마인가요?' }, { en: "It's five thousand won.", ko: '이것은 5,000원이에요.' }, { en: 'How much are they?', ko: '그것들은 얼마예요?' }, { en: "They're two thousand won.", ko: '이것들은 2,000원이에요.' }, { en: "I'll take it.", ko: '그걸로 할게요.' }] },
  mwbank: { k: 'mwbank', tag: 'write', lines: ['Look at these {} shoes.', 'How much are {}?', "They're {} won.", '{} on sale.'], ans: ['bright', 'these shoes', 'twenty thousand', "They're"], extra: [], blankHints: ['shoes 를 꾸며 주는 말이에요. 어떤 신발인지 떠올려 보세요.', 'are 다음에는 복수 명사가 와요.', '가격을 말하는 자리예요. won 앞에 숫자가 와요.', '문장 맨 앞이라 대문자로 시작하고, 뒤의 on sale 과 이어져요.'] },
  scloze: { k: 'scloze', tag: 'read', lines: ["That's too bad, Emily.", 'You bought many cookies yesterday.', 'Use a money {}.', 'You can check and {} your money.'], ans: ['planner', 'save'], extra: ['want', 'sale'], hint: ['save : 절약하다'] },
  lwrite: { k: 'lwrite', tag: 'listen', q: 'Siya의 일과에 맞게 시각을 적어 봅시다.', say: 'Siya goes to school at eight thirty. She has a violin class at four. She goes home at five fifteen.', rows: [{ label: 'go to school', ans: '8:30' }, { label: 'have a violin class', ans: '4:00' }, { label: 'go home', ans: '5:15' }], hint: ['go to school → 학교에 가요', 'go home → 집에 가요'] },
  mfree: { k: 'mfree', tag: 'write', lines: ['Look at {}.', 'How much {}?', '{} won.', '{} on sale.'], lineHints: ['물건 이름 앞에 this/these 와 꾸미는 말을 써요. (예: these cool pants)', '가격을 묻는 말이에요. How much 다음에 is it / are they / are these ~ 가 와요.', '가격을 말해요. (예: Twenty thousand)', '세일 중이라는 말이에요. (예: They’re / It’s)'], hint: ['Look at these cool pants.'] },
  swrt: { k: 'swrt', tag: 'write', title: '내 글 체크리스트', rules: [{ label: '물건 이름 (book)', re: 'book' }, { label: '가격 (…won)', re: 'won' }, { label: "사겠다고 말하기 (I'll take…)", re: "i'?ll take" }], minSent: 3, starter: 'I want to buy a book.', hint: ['How much ~? 로 시작해 보세요'] },
  goal: { k: 'goal', tag: 'expr', title: '가게에서 물건의 가격을 묻고 답하며, 사고 싶은 물건을 말할 수 있어요.', pic: 'bag', items: [{ en: 'How much are these socks?', ko: '양말은 얼마인가요?', group: '물건의 가격 묻고 답하기' }, { en: "They're two thousand won.", ko: '이것은 2,000원이에요.', group: '물건의 가격 묻고 답하기' }, { en: 'May I help you?', ko: '도와드릴까요?', group: '도움 제안하고 답하기' }, { en: 'Yes, please.', ko: '네', group: '도움 제안하고 답하기' }] },
  kexp: { k: 'kexp', tag: 'listen', items: [{ en: 'How much are these shorts?', ko: '이 바지는 얼마인가요?', label: '가격을 묻는 질문' }, { en: "They're sixty-five dollars.", ko: '65달러예요.', label: '가격을 말함' }, { en: "They're expensive.", ko: '비싸네요', label: '의견을 나타냄' }, { en: "They're two thousand won.", ko: '이것들은 2,000원이에요' }, { en: "I'll take it. / Here you are.", ko: '그걸로 할게요. / 여기 있어요.' }] },
  tapl: { k: 'tapl', tag: 'speak', items: [{ en: 'How much is it?', ko: '이것은 얼마예요?' }, { en: "It's five thousand won.", ko: '5,000원이에요.' }, { en: 'How much are they?', ko: '그것들은 얼마예요?' }, { en: "They're two thousand won.", ko: '2,000원이에요.' }, { en: "I'll take it.", ko: '그걸로 할게요.' }] },
  lsent: { k: 'lsent', tag: 'listen', items: [{ en: 'How much are these socks?', ko: '이 양말은 얼마예요?' }, { en: "They're two thousand won.", ko: '2,000원이에요' }, { en: 'May I help you?', ko: '도와 드릴까요?' }, { en: 'Yes, please.', ko: '네, 부탁해요.' }] },
  lcardp: { k: 'lcardp', tag: 'listen', items: [{ en: 'cap', ko: '모자', pic: 'cap' }, { en: 'jacket', ko: '재킷', pic: 'jacket' }, { en: 'socks', ko: '양말', pic: 'socks' }, { en: 'shoes', ko: '신발', pic: 'shoes' }, { en: 'pants', ko: '바지', pic: 'pants' }, { en: 'sunglasses', ko: '선글라스', pic: 'sunglasses' }] },
  lcardt: { k: 'lcardt', tag: 'listen', items: [{ en: 'How much is it?', ko: '이것은 얼마예요?' }, { en: "It's five thousand won.", ko: '5,000원이에요.' }, { en: 'May I help you?', ko: '도와 드릴까요?' }, { en: 'Yes, please.', ko: '네, 부탁해요.' }, { en: "I'll take it.", ko: '그걸로 할게요.' }, { en: 'Here you are.', ko: '여기 있어요.' }] },
  wrepeat: { k: 'wrepeat', tag: 'vocab', words: W },
  sdrill: { k: 'sdrill', pic: 'shoes', tag: 'speak', tpl: 'How much are these {}?', words: ['shorts', 'sunglasses', 'pants', 'shoes', 'socks', 'jeans'] },
  lnum: { k: 'lnum', tag: 'listen', q: 'How much are these jackets?', opts: ['It\'s ten thousand won.', 'They\'re ten thousand won.', 'It\'s twenty thousand won.', 'They\'re twenty thousand won.'], ans: 2 },
  wsent: { k: 'wsent', tag: 'vocab', cards: [
    { word: 'cap', sent: 'How much is this cap?', ko: '이 모자는 얼마예요?', pic: 'cap' },
    { word: 'jacket', sent: 'How much is this jacket?', ko: '이 재킷은 얼마예요?', pic: 'jacket' },
    { word: 'socks', sent: 'How much are these socks?', ko: '이 양말은 얼마예요?', pic: 'socks' },
    { word: 'shoes', sent: 'How much are these shoes?', ko: '이 신발은 얼마예요?', pic: 'shoes' }] },
  lecture: { k: 'lecture', tag: 'expr', title: 'Lesson 9', slides: [
    { head: '가게에서는 이렇게 말해요', pic: 'hat', text: ['가게에 가면 점원이 먼저 말을 걸어요.', '이번 Lesson에서는 물건의 [[가격]]을 묻고 대답하는 말을 배워요.'], cards: ['May I help you? | 도와드릴까요? | 점원', 'Yes, please. | 네, 부탁해요. | 손님', 'How much is this hat? | 이 모자는 얼마예요? | 손님'] },
    { head: '도움을 주고받는 표현', text: ['[[May I help you?]]는 \'도와드릴까요?\'라는 뜻이에요.', '도움이 필요하면 [[Yes, please.]]라고 대답해요. please가 붙으면 부탁하는 말이라 더 공손해요.'], cards: ['May I help you? | 도와드릴까요? | 묻는 말', 'Yes, please. | 네, 부탁해요. | 대답', 'Thank you. | 고맙습니다. | 마무리 인사'] },
    { head: '가격 묻기 ① 하나일 때', pic: 'hat', text: ['얼마인지 물을 때는 [[How much]]로 시작해요.', '가까이 있는 물건 하나는 [[this]], 동사는 [[is]]를 써요.'], formula: ['How much + {{is}} + this + 물건?', "It's + 가격 + won."], cards: ['How much is this hat? | 이 모자는 얼마예요?', "It's ten thousand won. | 10,000원이에요."] },
    { head: '가격 묻기 ② 여러 개일 때', pic: 'socks', text: ['물건이 여러 개이면 this는 these로, is는 are로, It\'s는 They\'re로 바뀌어요.'], table: ['| 하나 | 여러 개', '가리킬 때 | this | these', '동사 | is | are', '대답 | It\'s | They\'re'], tip: 'sunglasses, shorts, socks, shoes는 두 개가 한 짝이라서 [[these]]를 써요.' },
    { head: '가격 읽는 법', text: ['숫자를 영어로 읽고, 뒤에 [[won]]을 붙여요. 천 단위로 끊어서 읽으면 쉬워요.'], cards: ['two thousand won | 2,000원', 'ten thousand won | 10,000원', 'thirteen thousand won | 13,000원', 'fifty thousand won | 50,000원'] },
    { head: '정리해요', text: ['이번 Lesson에서 배울 단어는 hat, sunglasses, jacket, shorts, socks, shoes예요.', '이제 단어와 표현을 직접 듣고 말해 볼까요?'], cards: ['How much are these socks? | 이 양말은 얼마예요?', "They're two thousand won. | 2,000원이에요."] }] },
  scene: { k: 'scene', tag: 'listen', title: '미나와 엄마의 가게 나들이', sub: 'en', replay: 2, review: true, pic: 'hat',
  scenes: [
    { pic: 'scene/l9-1-1.jpg', who: 'Mina', en: 'Mom, I need a hat for the trip.', ko: '엄마, 저 여행에 쓸 모자가 필요해요.' },
    { pic: 'scene/l9-1-2.jpg', who: 'Clerk', en: 'Hello! May I help you?', ko: '안녕하세요! 도와드릴까요?' },
    { pic: 'scene/l9-1-2.jpg', who: 'Mom', en: 'Yes, please. How much is this hat?', ko: '네. 이 모자는 얼마예요?' },
    { pic: 'scene/l9-1-3.jpg', who: 'Clerk', en: "It's ten thousand won.", ko: '10,000원이에요.' },
    { pic: 'scene/l9-1-4.jpg', who: 'Mina', en: 'And how much are these shorts?', ko: '그리고 이 반바지는 얼마예요?' },
    { pic: 'scene/l9-1-4.jpg', who: 'Clerk', en: "They're fifteen thousand won.", ko: '15,000원이에요.' },
    { pic: 'scene/l9-1-5.jpg', who: 'Mina', en: 'How much are these shoes?', ko: '이 신발은 얼마예요?' },
    { pic: 'scene/l9-1-5.jpg', who: 'Clerk', en: "They're fifty thousand won.", ko: '50,000원이에요.' },
    { pic: 'scene/l9-1-6.jpg', who: 'Mom', en: "Oh, that's too much. We'll take the hat and the shorts.", ko: '아, 너무 비싸네요. 모자와 반바지로 할게요.' },
    { pic: 'scene/l9-1-7.jpg', who: 'Mina', en: 'Thank you, Mom!', ko: '고마워요, 엄마!' },
    { pic: 'scene/l9-1-7.jpg', who: 'Clerk', en: 'Thank you! Have a nice day!', ko: '감사합니다! 좋은 하루 보내세요!' }],
  explain: ['물건이 하나일 때는 How much is this …?, 여러 개일 때는 How much are these …? 라고 물어요.', '대답은 하나면 It\'s …, 여러 개면 They\'re … 로 시작해요.', '가격은 숫자 뒤에 won 을 붙여요. (ten thousand won = 10,000원)'],
  qs: [{ q: '미나네 가족이 산 물건이 아닌 것은?', ans: '신발', wrong: ['모자', '반바지'] }, { q: '모자는 얼마였나요?', ans: '10,000원', wrong: ['15,000원', '50,000원'] }] },
  pread: { k: 'pread', pic: 'ball', tag: 'read', text: ['Today is Class Bazaar Day. Mina has a shop.', 'She sells a cap, a book, and gloves.', 'Ken comes to her shop. He asks, "How much is the book?"', 'Mina says, "It\'s nine thousand won."', '---', 'Ken asks, "How much are the gloves?"', '"They\'re four thousand won."', 'Ken says, "I\'ll take the gloves. Here you are."', 'Mina says, "Thank you!"'], ko: '오늘은 학급 바자회 날이야. 미나는 가게가 있어. 모자, 책, 장갑을 팔아.\n켄이 가게에 와서 "책은 얼마예요?"라고 물어. 미나는 "9,000원이에요."라고 말해.\n---\n켄이 "장갑은 얼마예요?"라고 물어. "4,000원이에요."\n켄은 "장갑을 살게요. 여기 있어요."라고 말해. 미나는 "고마워요!"라고 말해.' },
  mtext: { k: 'mtext', tag: 'write', title: 'SALE', text: ['Look at these [[bright shoes]].', 'How much are [[these shoes]]?', "They're [[20,000 won]].", "They're on sale."], explain: ['먼저 {{상품과 특징}}을 얘기합니다.', '가격 질문을 하고', '{{가격을 제시}}합니다.', '세일 중임을 얘기합니다.'], ko: '이 밝은 신발을 보세요.\n이 신발은 얼마예요?\n2만 원이에요.\n세일 중이에요.' },
  wchoice: { k: 'wchoice', tag: 'vocab', word: 'shoes', dir: 'en2ko', wrong: ['반바지', '양말', '재킷'] },
  pchoice: { k: 'pchoice', tag: 'vocab', pic: 'pants', opts: [{ t: 'this pants' }, { t: 'the pants' }, { t: 'these pants' }, { t: 'a pants' }], a: 2 },
  dchoice: { k: 'dchoice', tag: 'read', lines: ['A: May I help you?', 'B: Yes, please. How much are these socks?', 'A: ______'], opts: [{ t: "They're two thousand won." }, { t: "It's two thousand won." }, { t: 'I like socks.' }, { t: 'Here you are.' }], a: 0 },
  tf: { k: 'tf', pic: 'book', tag: 'read', lines: ['A: How much is the book?', "B: It's nine thousand won."], stmt: 'The book is eight thousand won.', a: false, hint: ['A: How much is the book?', "B: It's nine thousand won."] },
  lchtext: { k: 'lchtext', tag: 'listen', q: '재킷의 가격은 얼마인가요?', say: "Clerk(woman): May I help you?\nJina(girl): Yes, please. How much is this jacket?\nClerk: It's nine thousand won.\nJina(girl): Good. I'll take it.", replay: 2, opts: [{ t: 'Three thousand won' }, { t: 'Four thousand won' }, { t: 'Nine thousand won' }, { t: 'Six thousand won' }], a: 2, hint: ['May I help you?', 'How much is this jacket?', "It's nine thousand won."] },
  lchpic: { k: 'lchpic', tag: 'listen', q: '손님이 가격을 물은 물건은 무엇일까요?', say: 'Hello! May I help you? Yes, please. How much are these socks?', opts: [{ t: 'cap', flag: 'cap' }, { t: 'jacket', flag: 'jacket' }, { t: 'socks', flag: 'socks' }, { t: 'sunglasses', flag: 'sunglasses' }], a: 2, hint: ['Hello! May I help you?', 'Yes, please. How much are these socks?'] },
  lchlist: { k: 'lchlist', tag: 'listen', q: '재킷의 가격은 얼마인가요?', say: "How much is this jacket? It's nine thousand won.", opts: [{ t: 'Three thousand won' }, { t: 'Four thousand won' }, { t: 'Nine thousand won' }, { t: 'Six thousand won' }], a: 2, hint: ['How much is this jacket?', "It's nine thousand won."] },
  lmatch: { k: 'lmatch', tag: 'listen', pairs: [{ left: 'Lily', say: 'I want these shoes.', right: 'shoes' }, { left: 'Ken', say: 'I want those sunglasses.', right: 'sunglasses' }, { left: 'Mia', say: 'I want a pair of shorts.', right: 'shorts' }, { left: 'Tom', say: 'I want a hat.', right: 'hat' }] },
  sqchoice: { k: 'sqchoice', pic: 'bag', tag: 'read', title: 'Be a Good Shopper', text: ["I'm at the shopping center.", 'Oh! This phone case is cool.', 'How much is it?', "It's on sale now.", "It's only 5,000 won.", 'I want to buy it.'], ko: '나는 쇼핑센터에 있어.\n와! 이 휴대폰 케이스 멋지다.\n얼마예요?\n지금 세일 중이야.\n겨우 5,000원이야.\n사고 싶어.', q: 'How much is the phone case?', opts: [{ t: '5,000 won' }, { t: '4,000 won' }, { t: '9,000 won' }, { t: '15,000 won' }], a: 0, hint: ['five thousand won'] },
  sqtf: { k: 'sqtf', pic: 'cup', tag: 'read', ko: '제이크, 잠깐! 먼저 생각해 봐.\n정말 필요해?\n아니면 그냥 갖고 싶은 거야?\n사지 마.\n넌 이미 멋진 폰 케이스가 있잖아.', text: ['Jake, wait! You need to think first.', 'Do you NEED it?', 'Or do you just WANT it?', "Please don't buy it.", 'You already have a nice phone case.'], q: 'Q1. 글의 내용과 일치하면 T, 아니면 F를 선택하세요.', items: [{ t: 'Jake should think first.', a: true }, { t: 'Jake has no phone case.', a: false }, { t: 'The writer wants Jake to buy it.', a: false }] },
  sqmulti: { k: 'sqmulti', pic: 'gloves', tag: 'read', ko: '내일은 내 여동생의 생일이야.\n나는 동생에게 머리핀을 사 주고 싶어.\n얼마예요?\n8,000원이에요.\n아, 이런! 이번 주에 용돈을 다 썼어.', text: ["It's my sister's birthday tomorrow.", 'I want to buy a hairpin for her.', 'How much is it?', "It's 8,000 won.", 'Oh, no! I used all my money for this week.'], q: 'Q1. 글의 내용과 맞는 것을 모두 선택하세요.', items: [{ t: "Tomorrow is the writer's birthday." }, { t: 'The writer wants a hairpin for her sister.', ok: true }, { t: 'The hairpin is 8,000 won.', ok: true }, { t: 'The writer has a lot of money.' }] },
};

/** 문항이 쓰는 단어를 단원 단어 목록에서 찾아 그림까지 붙여 돌려준다 */
export function nativeVocab(item: Record<string, any>, vocab: VocabOpt[]): VWord[] { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!['vcards', 'vtype1', 'vspell', 'vmatch', 'vsound', 'vwrite', 'wchoice', 'wrepeat'].includes(item.k)) return vocab.map((v) => ({ key: v.key, en: v.en, ko: v.ko, image: v.image_path ?? null })); // 문장형은 그림 찾기용으로 전체 전달
  const keys: string[] = item.k === 'vspell' || item.k === 'wchoice' ? [item.word] : item.words ?? [];
  return keys.map((k) => vocab.find((v) => v.key === k)).filter(Boolean).map((v) => ({ key: v!.key, en: v!.en, ko: v!.ko, image: v!.image_path ?? null }));
}
