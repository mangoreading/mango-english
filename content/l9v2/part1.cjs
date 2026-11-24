// Lesson 9 재작성 (Flow(5)_수정본.xlsx 기준) — 1·2차시. 각 step = { lesson, pos, en, ko, min, kind, qty, hw, items[] }
const W = ['hat', 'sunglasses', 'jacket', 'shorts', 'socks', 'shoes'];
const ex = (en, ko, label, group) => ({ en, ko, ...(label ? { label } : {}), ...(group ? { group } : {}) });
const opt = (t, flag) => (flag ? { t, flag } : { t });
const TAG = { goal: 'expr', lecture: 'expr', vcards: 'vocab', wrepeat: 'vocab', wchoice: 'vocab', kexp: 'expr', sdrill: 'speak', scene: 'listen', scenerep: 'listen', lchpic: 'listen', vmatch: 'vocab', wsent: 'vocab', tapl: 'speak', lcardt: 'listen', lmatch: 'listen', lchtext: 'listen', lmwrite: 'listen', lnum: 'listen', role: 'speak' };
const S = [];
const step = (lesson, pos, en, ko, min, kind, qty, hw, items) => S.push({ lesson, pos, en, ko, min, kind, qty, hw: !!hw, tag: TAG[kind], items: items.map((p) => ({ k: kind, tag: TAG[kind], ...p })) });

/* ===== 1차시 Listen & Learn ===== */
step(1, 0, 'Learning Goal', '학습목표', 1, 'goal', 1, false, [{
  title: '가게에서 물건의 가격을 묻고 답하며, 사고 싶은 물건을 말할 수 있어요.', pic: 'socks',
  items: [ex('How much are these socks?', '이 양말은 얼마예요?', '', '물건의 가격 묻고 답하기'), ex("They're two thousand won.", '2,000원이에요.', '', '물건의 가격 묻고 답하기'), ex('May I help you?', '도와드릴까요?', '', '도움 제안하고 답하기'), ex('Yes, please.', '네, 부탁해요.', '', '도움 제안하고 답하기')] }]);
step(1, 1, 'Lecture Slides', '강의 슬라이드', 3, 'lecture', 1, false, [{ title: 'Lesson 9', slides: [
  { head: '가게에서는 이렇게 말해요', pic: 'hat', text: ['가게에 가면 점원이 먼저 말을 걸어요.', '이번 Lesson에서는 물건의 [[가격]]을 묻고 대답하는 말을 배워요.'], cards: ['May I help you? | 도와드릴까요? | 점원', 'Yes, please. | 네, 부탁해요. | 손님', 'How much is this hat? | 이 모자는 얼마예요? | 손님'] },
  { head: '도움을 주고받는 표현', text: ['[[May I help you?]]는 \'도와드릴까요?\'라는 뜻이에요.', '도움이 필요하면 [[Yes, please.]]라고 대답해요. please가 붙으면 부탁하는 말이라 더 공손해요.'], cards: ['May I help you? | 도와드릴까요? | 묻는 말', 'Yes, please. | 네, 부탁해요. | 대답'] },
  { head: '가격 묻고 답하기 ① 하나일 때', pic: 'jacket', text: ['얼마인지 물을 때는 [[How much]]로 시작해요.', '가까이 있는 물건 하나는 [[this]], 동사는 [[is]]를 써요.'], formula: ['How much + {{is}} + this + 물건?', "It's + 가격 + won."], cards: ['How much is this jacket? | 이 재킷은 얼마예요?', "It's thirty thousand won. | 30,000원이에요."] },
  { head: '가격 묻고 답하기 ② 여러 개일 때', pic: 'shoes', text: ['물건이 여러 개이면 this는 these로, is는 are로, It\'s는 They\'re로 바뀌어요.'], formula: ['How much + {{are}} + these + 물건들?', "They're + 가격 + won."], cards: ['How much are these shoes? | 이 신발은 얼마예요?', "They're fifty thousand won. | 50,000원이에요."], tip: 'sunglasses, shorts, socks, shoes는 두 개가 한 짝이라서 [[these]]를 써요.' },
  { head: 'This / These, is / are 의 차이', text: ['물건이 하나인지 여러 개인지에 따라 말이 달라져요.'], table: ['| 하나 | 여러 개', '가리킬 때 | this | these', '동사 | is | are', '대답 | It\'s | They\'re'], tip: '가격은 숫자를 영어로 읽고 뒤에 [[won]]을 붙여요. (ten thousand won = 10,000원)' }] }]);
step(1, 2, 'Word Cards', '단어 카드 보기', 2, 'vcards', 1, false, [{ words: W }]);
step(1, 3, 'Word Repeat', '단어 듣고 따라 말하기', 3, 'wrepeat', 6, false, [{ words: W }]);
const wc = (word, dir, wrong) => ({ word, dir, wrong });
step(1, 4, 'Word-Meaning Choice', '단어-뜻 고르기', 3, 'wchoice', 6, false, [
  wc('hat', 'en2ko', ['양말', '신발', '반바지']), wc('socks', 'en2ko', ['모자', '재킷', '선글라스']), wc('shoes', 'en2ko', ['반바지', '양말', '재킷']),
  wc('sunglasses', 'ko2en', ['shorts', 'shoes', 'socks']), wc('jacket', 'ko2en', ['hat', 'shoes', 'shorts']), wc('shorts', 'ko2en', ['socks', 'jacket', 'sunglasses'])]);
step(1, 5, 'Key Expressions', '핵심표현 듣고 따라 읽기', 2, 'kexp', 1, false, [{ items: [
  ex('May I help you?', '도와드릴까요?', '도움을 제안하는 말'), ex('Yes, please.', '네, 부탁해요.', '도움을 받겠다는 대답'),
  ex('How much is this jacket?', '이 재킷은 얼마예요?', '물건 하나의 가격 묻기'), ex("It's ten thousand won.", '10,000원이에요.', '하나일 때 대답'),
  ex('How much are these shoes?', '이 신발은 얼마예요?', '물건 여러 개의 가격 묻기'), ex("They're forty thousand won.", '40,000원이에요.', '여러 개일 때 대답')] }]);
step(1, 6, 'Sentence Drill', '문장 바꿔 말하기', 3, 'sdrill', 4, true, [
  { pic: 'socks', tpl: 'How much are these {}?', words: ['socks', 'shoes', 'shorts', 'sunglasses'] },
  { pic: 'hat', tpl: 'How much is this {}?', words: ['hat', 'jacket'] },
  { pic: 'hat', tpl: "It's {} thousand won.", words: ['ten', 'twenty', 'thirty', 'fifty'] },
  { pic: 'socks', tpl: "They're {} thousand won.", words: ['two', 'thirteen', 'fifteen', 'forty'] }]);
// 1차시 영상: 교과서 영상과 비슷한 상황·표현으로 다시 쓴 장면 (그림은 이후 추가)
step(1, 7, 'Scene Story', '장면 영상 보기', 4, 'scene', 2, false, [{ title: '학교 소풍 준비 쇼핑 ①', sub: 'en', replay: 2, review: true, pic: 'sunglasses',
  scenes: [
    { who: 'Jun', en: "Let's buy things for our school trip tomorrow!", ko: '내일 학교 소풍에 쓸 물건을 사자!' },
    { who: 'Jun', en: 'I love shopping!', ko: '나는 쇼핑이 정말 좋아!' },
    { who: 'Mom', en: 'Jun, we can buy things on this list.', ko: '준아, 이 목록에 있는 것만 살 수 있어.' },
    { who: 'Clerk', en: 'May I help you?', ko: '도와드릴까요?' },
    { who: 'Mom', en: 'Yes, please.', ko: '네, 부탁해요.' },
    { who: 'Jun', en: "I'm looking for some sunglasses.", ko: '저는 선글라스를 찾고 있어요.' },
    { who: 'Clerk', en: 'We have many cool sunglasses here.', ko: '여기에 멋진 선글라스가 많이 있어요.' },
    { who: 'Clerk', en: 'How about these sunglasses?', ko: '이 선글라스는 어때요?' },
    { who: 'Jun', en: "They're nice. I like the color.", ko: '멋지네요. 색깔이 마음에 들어요.' },
    { who: 'Jun', en: 'How much are these sunglasses?', ko: '이 선글라스는 얼마예요?' },
    { who: 'Clerk', en: "They're 13,000 won.", ko: '13,000원이에요.' },
    { who: 'Mom', en: 'Good.', ko: '좋아.' },
    { who: 'Jun', en: "I'll take them.", ko: '이걸로 살게요.' }],
  explain: ['[[May I help you?]]는 가게에서 점원이 "도와드릴까요?"라고 말을 거는 표현이에요.', '여러 개(sunglasses)의 가격은 [[How much are these …?]]로 묻고, [[They\'re … won.]]으로 대답해요.', '사겠다고 말할 때는 [[I\'ll take them.]]이라고 해요.'],
  qs: [{ t: 'mc', q: "점원이 \"May I help you?\"라고 말한 뜻은 무엇인가요?", ans: "도와드릴까요?", wrong: ["이 선글라스는 얼마예요?", "이걸로 살게요."] }, { t: 'mc', q: "준이가 \"How much are these sunglasses?\"라고 물은 뜻은 무엇인가요?", ans: "이 선글라스는 얼마예요?", wrong: ["이 선글라스는 어때요?", "저는 선글라스를 찾고 있어요."] }, { t: 'mc', q: "선글라스의 가격은 얼마인가요?", ans: "13,000원", wrong: ["15,000원", "3,000원"] }] }]);
step(1, 8, 'Scene Story', '장면 영상 보기', 4, 'scene', 2, false, [{ title: '학교 소풍 준비 쇼핑 ②', sub: 'en', replay: 2, review: true, pic: 'shoes',
  scenes: [
    { who: 'Jun', en: 'This hat is nice.', ko: '이 모자 멋지다.' },
    { who: 'Jun', en: "It's only 8,000 won.", ko: '겨우 8,000원이야.' },
    { who: 'Jun', en: 'Look at these shoes.', ko: '이 신발 좀 봐.' },
    { who: 'Jun', en: "They'll be great for hiking.", ko: '하이킹할 때 신으면 아주 좋겠다.' },
    { who: 'Jun', en: "I'll take them, too.", ko: '이것도 살래.' },
    { who: 'Mom', en: '58,000 won?', ko: '58,000원이라고?' },
    { who: 'Jun', en: 'How much are these shoes?', ko: '이 신발은 얼마예요?' },
    { who: 'Clerk', en: "They're 50,000 won.", ko: '50,000원이에요.' },
    { who: 'Mom', en: '50,000 won for shoes?', ko: '신발이 50,000원이라고?' },
    { who: 'Jun', en: 'Oh, no!', ko: '아, 이런!' }],
  explain: ['[[How much are these shoes?]]처럼 shoes는 두 짝이라 these와 are를 써요.', '가격은 숫자를 읽고 마지막에 [[won]]을 붙여요.', '[[Oh, no!]]는 곤란하거나 놀랐을 때 하는 말이에요.'],
  qs: [{ t: 'mc', q: "모자는 얼마인가요?", ans: "8,000원", wrong: ["5,000원", "18,000원"] }, { t: 'mc', q: "신발의 가격을 물을 때 알맞은 말은 무엇인가요?", ans: "How much are these shoes?", wrong: ["How much is this shoes?", "How much are this shoes?"] }, { t: 'mc', q: "엄마가 깜짝 놀란 까닭은 무엇인가요?", ans: "신발이 50,000원이라서", wrong: ["모자가 너무 싸서", "신발이 없어서"] }] }]);
const qrot = (key, others, say, a) => { const o = [...others]; o.splice(a, 0, key); return { q: '무엇의 가격을 말하고 있나요?', say, replay: 2, opts: o.map((k) => opt(k, k)), a }; };
step(1, 9, 'Listen & Choose (Picture)', '듣고 고르기 (그림 4칸)', 3, 'lchpic', 6, true, [
  qrot('socks', ['hat', 'shoes', 'shorts'], "Hana(girl): How much are these socks?\nClerk(woman): They're two thousand won.", 0),
  qrot('hat', ['jacket', 'socks', 'sunglasses'], "Tom(boy): How much is this hat?\nClerk(woman): It's ten thousand won.", 1),
  qrot('shoes', ['shorts', 'hat', 'jacket'], "Mina(girl): How much are these shoes?\nClerk(woman): They're fifty thousand won.", 2),
  qrot('sunglasses', ['socks', 'shoes', 'shorts'], "Dad(man): How much are these sunglasses?\nClerk(woman): They're thirteen thousand won.", 3),
  qrot('jacket', ['hat', 'sunglasses', 'shoes'], "Hana(girl): How much is this jacket?\nClerk(woman): It's thirty thousand won.", 0),
  qrot('shorts', ['socks', 'hat', 'jacket'], "Tom(boy): How much are these shorts?\nClerk(woman): They're fifteen thousand won.", 2)]);
step(1, 10, 'Word-meaning Match', '단어-뜻 짝 맞추기', 2, 'vmatch', 1, true, [{ words: W }]);

/* ===== 2차시 Listen & Speak ===== */
const wsc = (word, wko, sent, ko) => ({ word, wko, sent, ko, pic: word });
step(2, 0, 'Word & Sentence Repeat', '단어·문장 듣고 따라 말하기', 3, 'wsent', 6, false, [{ cards: [
  wsc('hat', '모자', 'How much is this hat?', '이 모자는 얼마예요?'), wsc('sunglasses', '선글라스', 'How much are these sunglasses?', '이 선글라스는 얼마예요?'),
  wsc('jacket', '재킷', 'How much is this jacket?', '이 재킷은 얼마예요?'), wsc('shorts', '반바지', 'How much are these shorts?', '이 반바지는 얼마예요?'),
  wsc('socks', '양말', 'How much are these socks?', '이 양말은 얼마예요?'), wsc('shoes', '신발', 'How much are these shoes?', '이 신발은 얼마예요?')] }]);
step(2, 1, 'Tap & Listen', '문장 눌러 듣기', 2, 'tapl', 1, false, [{ items: [
  ex('May I help you?', '도와드릴까요?'), ex('Yes, please.', '네, 부탁해요.'), ex('How much is this jacket?', '이 재킷은 얼마예요?'),
  ex("It's ten thousand won.", '10,000원이에요.'), ex('How much are these shoes?', '이 신발은 얼마예요?'), ex("They're forty thousand won.", '40,000원이에요.')] }]);
step(2, 2, 'Listen & Learn (Text)', '듣고 익히기 (글)', 2, 'lcardt', 1, false, [{ inst: '가격을 말하는 법을 익혀요.', items: [
  ex("It's five thousand won.", '5,000원이에요.'), ex("It's eight thousand won.", '8,000원이에요.'), ex("It's fifty thousand won.", '50,000원이에요.'),
  ex("They're forty thousand won.", '40,000원이에요.'), ex("They're fifteen thousand won.", '15,000원이에요.'), ex("They're twenty-five thousand won.", '25,000원이에요.')] }]);
step(2, 3, 'Scene Story + Repeat', '장면 영상 보기 + 따라 말하기', 4, 'scenerep', 2, false, [{ title: '웃기게 생긴 신발', sub: 'en', replay: 2, review: true, pic: 'shoes',
  scenes: [
    { who: 'Mia', en: "They're so funny.", ko: '정말 웃기게 생겼다.' },
    { who: 'Mia', en: 'Look at these shoes.', ko: '이 신발 좀 봐.' },
    { who: 'Mia', en: 'They look like boats.', ko: '배처럼 생겼어.' },
    { who: 'Mia', en: "They're so funny.", ko: '정말 웃기게 생겼다.' },
    { who: 'Mia', en: 'May I try them on?', ko: '신어 봐도 될까요?' },
    { who: 'Clerk', en: 'Sure, go ahead.', ko: '그럼요, 신어 보세요.' },
    { who: 'Mia', en: 'How much are these shoes?', ko: '이 신발은 얼마예요?' },
    { who: 'Clerk', en: "They're 7,000 won.", ko: '7,000원이에요.' },
    { who: 'Clerk', en: "They're on sale.", ko: '세일 중이에요.' },
    { who: 'Mia', en: 'Cool.', ko: '좋아요.' },
    { who: 'Mia', en: "I'll take them.", ko: '이걸로 살게요.' }],
  explain: ["[[How much are these shoes?]]는 신발 여러 개의 가격을 묻는 말이에요. these와 are를 써요.", "가격은 [[They're 7,000 won.]]처럼 [[They're … won.]]으로 말해요.", "[[on sale]]은 \"세일 중\"이라는 뜻이에요.", "\"May I try them on?(신어 봐도 될까요?)\", \"Sure, go ahead.(그럼요, 신어 보세요.)\"는 이 장면에서만 나오는 말이에요. 뜻만 알아 두세요."],
  qs: [{ t: 'mc', q: "How much are the shoes?", ans: "They're 7,000 won.", wrong: ["They're 17,000 won.", "They're 70,000 won."] }, { t: 'mc', q: "What does Mia say to ask the price?", ans: "How much are these shoes?", wrong: ["May I try them on?", "I'll take them."] }, { t: 'mc', q: "What does the clerk say about the price?", ans: "They're on sale.", wrong: ["Sure, go ahead.", "You look great."] }] }]);
step(2, 4, 'Scene Story + Repeat', '장면 영상 보기 + 따라 말하기', 4, 'scenerep', 2, false, [{ title: '반바지를 찾아요', sub: 'en', replay: 2, review: true, pic: 'shorts',
  scenes: [
    { who: 'Clerk', en: 'May I help you?', ko: '도와드릴까요?' },
    { who: 'Pablo', en: 'Yes, please.', ko: '네, 부탁해요.' },
    { who: 'Pablo', en: "I'm looking for shorts.", ko: '저는 반바지를 찾고 있어요.' },
    { who: 'Pablo', en: 'How much are these shorts?', ko: '이 반바지는 얼마예요?' },
    { who: 'Clerk', en: "They're 12,000 won.", ko: '12,000원이에요.' },
    { who: 'Clerk', en: 'Try on the shorts with this hat.', ko: '이 모자와 같이 입어 보세요.' },
    { who: 'Pablo', en: 'Wow.', ko: '와.' },
    { who: 'Clerk', en: 'You look great.', ko: '정말 멋져 보여요.' }],
  explain: ["[[May I help you?]]는 점원이 \"도와드릴까요?\"라고 묻는 말이에요.", "도움이 필요하면 [[Yes, please.]]라고 대답해요.", "[[How much are these shorts?]]로 가격을 묻고, [[They're … won.]]으로 대답해요.", "\"I'm looking for shorts.(반바지를 찾고 있어요.)\", \"Try on …(입어 보세요)\", \"You look great.(멋져 보여요)\"는 이 장면에서만 나오는 말이에요. 뜻만 알아 두세요."],
  qs: [{ t: 'mc', q: "What does the clerk say to offer help?", ans: "May I help you?", wrong: ["How much are these shorts?", "You look great."] }, { t: 'mc', q: "What is Pablo looking for?", ans: "Shorts.", wrong: ["A jacket.", "Socks."] }, { t: 'mc', q: "How much are the shorts?", ans: "They're 12,000 won.", wrong: ["They're 2,000 won.", "They're 20,000 won."] }] }]);
step(2, 5, 'Listen & Match', '듣고 짝짓기', 2, 'lmatch', 4, false, [{ pairs: [
  { left: 'Lily', say: "How much is this hat? It's ten thousand won.", right: 'hat' }, { left: 'Ken', say: "How much are these socks? They're two thousand won.", right: 'socks' },
  { left: 'Mia', say: "How much are these shorts? They're fifteen thousand won.", right: 'shorts' }, { left: 'Tom', say: "How much are these shoes? They're fifty thousand won.", right: 'shoes' }] }]);
const lt = (q, say, opts, a) => ({ q, say, replay: 2, opts: opts.map((t) => opt(t)), a });
const dlg = (who, whoTag, ask, price, ans) => `Clerk(woman): May I help you?\n${who}(${whoTag}): Yes, please. ${ask}\nClerk(woman): ${price}\n${who}(${whoTag}): Good. ${ans}`;
step(2, 6, 'Listen & Choose', '듣고 고르기 (글 4칸)', 3, 'lchtext', 6, true, [
  lt('재킷은 얼마인가요?', dlg('Hana', 'girl', 'How much is this jacket?', "It's thirty thousand won.", "I'll take it."), ['3,000원', '13,000원', '30,000원', '50,000원'], 2),
  lt('신발은 얼마인가요?', dlg('Dad', 'man', 'How much are these shoes?', "They're forty thousand won.", "I'll take them."), ['14,000원', '40,000원', '4,000원', '50,000원'], 1),
  lt('모자는 얼마인가요?', dlg('Tom', 'boy', 'How much is this hat?', "It's ten thousand won.", "I'll take it."), ['10,000원', '18,000원', '8,000원', '100,000원'], 0),
  lt('선글라스는 얼마인가요?', dlg('Mina', 'girl', 'How much are these sunglasses?', "They're thirteen thousand won.", "I'll take them."), ['30,000원', '3,000원', '13,000원', '15,000원'], 2),
  lt('양말은 얼마인가요?', dlg('Ken', 'boy', 'How much are these socks?', "They're two thousand won.", "I'll take them."), ['12,000원', '20,000원', '5,000원', '2,000원'], 3),
  lt('반바지는 얼마인가요?', dlg('Mom', 'woman', 'How much are these shorts?', "They're fifteen thousand won.", "I'll take them."), ['50,000원', '15,000원', '5,000원', '25,000원'], 1)]);
step(2, 7, 'Listen & Matching (Write)', '듣고 짝지어 쓰기', 2, 'lmwrite', 4, false, [{ pre: '₩', pairs: [
  { left: 'Lily', say: "Lily: How much is this jacket?\nClerk: It's thirty thousand won.", ans: '30,000' }, { left: 'Ken', say: "Ken: How much are these sunglasses?\nClerk: They're thirteen thousand won.", ans: '13,000' },
  { left: 'Mia', say: "Mia: How much are these socks?\nClerk: They're two thousand won.", ans: '2,000' }, { left: 'Tom', say: "Tom: How much are these shoes?\nClerk: They're forty thousand won.", ans: '40,000' }],
  hint: ['숫자를 듣고 가격을 적어요. 예: ten thousand → 10,000'] }]);
const ln = (q, opts, ans) => ({ q, opts, ans, plays: 2, inst: '들려주는 말에 이어질 말을 골라요.' });
step(2, 8, 'Listen & Choose (Number)', '듣고 번호 고르기', 3, 'lnum', 5, true, [
  ln('May I help you?', ['Yes, please.', "It's expensive.", "It's twenty thousand won."], 1),
  ln('How much is this jacket?', ['Yes, please.', "It's twenty thousand won.", "They're twenty thousand won."], 2),
  ln('How much is this jacket?', ["They're thirty thousand won.", "I'll take it.", "It's thirty thousand won."], 3),
  ln('How much are these shoes?', ["They're forty thousand won.", "It's forty thousand won.", 'May I help you?'], 1),
  ln('How much are these shoes?', ['Yes, please.', "They're fifty thousand won.", "It's fifty thousand won."], 2)]);
step(2, 9, 'Role Play', '역할 나눠 말하기', 4, 'role', 2, false, [
  { pic: 'jacket', price: '40,000원', lines: ['A: May I help you?', 'B: Yes, please. How much is this {{jacket}}?', "A: It's [[forty thousand won]].", "B: I'll take it."] },
  { pic: 'shorts', price: '16,000원', lines: ['A: May I help you?', 'B: Yes, please. How much are these {{shorts}}?', "A: They're [[sixteen thousand won]].", "B: I'll take them."] }]);

module.exports = { S, W, ex, opt, lt, qrot, ln };
