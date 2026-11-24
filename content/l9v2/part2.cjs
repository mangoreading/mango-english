// 3·4차시
const { S, ex, opt } = require('./part1.cjs');
const TAG = { raloud: 'speak', dreadt: 'speak', sscram: 'write', saykor: 'speak', lookspeak: 'speak', mtext: 'read', sqset: 'read', scloze: 'read', mfree: 'write', sfill: 'write', sscramr: 'write', lspeak: 'speak', pread: 'read' };
const step = (lesson, pos, en, ko, min, kind, qty, hw, items) => S.push({ lesson, pos, en, ko, min, kind, qty, hw: !!hw, tag: TAG[kind], items: items.map((p) => ({ k: kind, tag: TAG[kind], ...p })) });

/* ===== 3차시 Ask & Answer ===== */
step(3, 0, 'Read Aloud', '따라 읽기 평가', 3, 'raloud', 11, false, [
  'How much is this hat?', 'How much is this jacket?', 'This is ten thousand won.', 'This is thirty thousand won.',
  'How much are these socks?', 'How much are these shoes?', 'They are two thousand won.', 'They are fifty thousand won.',
  'May I help you?', 'How about these shorts?', "I'll take them."].map((target) => ({ target, stars: true, fluency: true })));
step(3, 1, 'Read & Speak (Text)', '대화 따라 읽기 (글)', 3, 'dreadt', 4, false, [
  { lines: ['A: How much are these shorts?', 'B: They are forty thousand won.', "A: They're expensive."] },
  { lines: ['A: How much is this hat?', 'B: This is eight thousand won.', "A: I'll take it."] },
  { lines: ['A: How much are these socks?', 'B: They are two thousand won.', "A: I'll take them."] },
  { lines: ['A: May I help you?', 'B: Yes, please. How much is this jacket?', 'A: This is thirty thousand won.'] }]);
const sc = (ko, ans, extra) => ({ ko, ans, extra });
step(3, 2, 'Sentence Scramble', '문장 만들기', 3, 'sscram', 6, false, [
  sc('이 양말은 얼마예요?', 'How much are these socks?', ['is']), sc('양말은 16,000원이에요.', 'They are sixteen thousand won.', ['It']),
  sc('이 모자는 얼마예요?', 'How much is this hat?', ['are']), sc('이것은 40,000원이에요.', 'This is forty thousand won.', ['They']),
  sc('도와드릴까요?', 'May I help you?', ['we']), sc('이 신발은 얼마예요?', 'How much are these shoes?', ['this'])]);
const sk = (ko, target, koHl) => ({ ko, target, ...(koHl ? { koHl } : {}) });
step(3, 3, 'Say in English', '우리말 보고 영어로 말하기', 3, 'saykor', 6, true, [
  sk('이 양말은 얼마예요?', 'How much are these socks?', '얼마'), sk('양말은 16,000원이에요.', 'They are sixteen thousand won.', '16,000원'),
  sk('이 모자는 얼마예요?', 'How much is this hat?', '얼마'), sk('이것은 40,000원이에요.', 'This is forty thousand won.', '40,000원'),
  sk('도와드릴까요?', 'May I help you?'), sk('이 신발은 얼마예요?', 'How much are these shoes?', '얼마')]);
const ls = (k, t, price) => ({ pic: k, label: k, price, target: t });
step(3, 4, 'Look & Speak', '그림 보고 말하기', 3, 'lookspeak', 6, true, [
  ls('socks', 'How much are these socks?', '₩2,000'), ls('hat', 'How much is this hat?', '₩10,000'), ls('shoes', 'How much are these shoes?', '₩50,000'),
  ls('jacket', 'How much is this jacket?', '₩30,000'), ls('shorts', 'How much are these shorts?', '₩15,000'), ls('sunglasses', 'How much are these sunglasses?', '₩13,000')]);
const MT1 = { title: 'SALE', text: ['Look at these [[bright shoes]].', 'How much are [[these shoes]]?', "They're [[20,000 won]].", "They're on sale."],
  explain: ['먼저 {{상품과 특징}}을 얘기합니다.', '가격을 묻는 질문을 하고', '{{가격을 제시}}합니다.', '세일 중임을 얘기합니다.'], ko: '이 밝은 신발을 보세요.\n이 신발은 얼마예요?\n20,000원이에요.\n세일 중이에요.' };
const MT2 = { title: 'SALE', text: ['Look at these [[funny socks]].', 'How much are [[these socks]]?', "They're [[2,000 won]].", "They're on sale."],
  explain: ['먼저 {{상품과 특징}}을 얘기합니다.', '가격을 묻는 질문을 하고', '{{가격을 제시}}합니다.', '세일 중임을 얘기합니다.'], ko: '이 웃기게 생긴 양말을 보세요.\n이 양말은 얼마예요?\n2,000원이에요.\n세일 중이에요.' };
step(3, 5, 'Model Text', '모범 글 읽기', 2, 'mtext', 2, false, [MT1, MT2]);
const plain = (t) => t.replace(/\[\[|\]\]|\{\{|\}\}/g, '');
step(3, 6, 'Story Quiz (T/F)', '글 읽고 답하기', 3, 'sqset', 2, false, [
  { title: 'SALE', text: MT1.text.map(plain), ko: MT1.ko, pic: 'shoes', explain: ['[[bright]]은 "밝은"이라는 뜻이에요.', '[[on sale]]은 "세일 중"이라는 뜻이에요.'],
    qs: [{ t: 'tf', lines: ['The shoes are bright. | T', 'The shoes are 10,000 won. | F', 'The shoes are on sale. | T'], hint: '가격과 sale 이 나오는 문장을 찾아 보세요.', ev: '3,4' }] },
  { title: 'SALE', text: MT2.text.map(plain), ko: MT2.ko, pic: 'socks', explain: ['[[funny]]는 "웃기게 생긴"이라는 뜻이에요.', '[[on sale]]은 "세일 중"이라는 뜻이에요.'],
    qs: [{ t: 'tf', lines: ['The socks are funny. | T', 'The socks are 20,000 won. | F', 'The socks are not on sale. | F'], hint: '가격과 sale 이 나오는 문장을 찾아 보세요.', ev: '3,4' }] }]);
const cz = (lines, ans, extra, blankHints) => ({ lines, ans, extra, blankHints });
step(3, 7, 'Story Cloze', '글 빈칸 채우기', 3, 'scloze', 3, false, [
  cz(['A: May I help you?', 'B: Yes, please. How much {} {} {}?', 'A: This is {} {} won.'], ['is', 'this', 'jacket', 'thirty', 'thousand'], ['are', 'these'], ['is / are', 'this / these', '물건 이름', '30', '단위']),
  cz(['A: May I help you?', 'B: Yes, please. How much {} {} {}?', 'A: This is {} {} won.'], ['is', 'this', 'hat', 'ten', 'thousand'], ['are', 'these'], ['is / are', 'this / these', '물건 이름', '10', '단위']),
  cz(['A: May I help you?', 'B: Yes, please. How much {} {} {}?', 'A: They are {} {} won.'], ['are', 'these', 'shoes', 'fifty', 'thousand'], ['is', 'this'], ['is / are', 'this / these', '물건 이름', '50', '단위'])]);
step(3, 8, 'Model Writing (Free)', '나만의 글 쓰기', 4, 'mfree', 2, false, [
  { topicLabel: '상품', topic: 'shoes', lines: ['Look at {}.', 'How much {}?', '{} won.', '{} on sale.'], lineHints: ['물건 이름 앞에 this/these 와 꾸미는 말을 써요. (예: these bright shoes)', '가격을 묻는 말이에요. (예: are these shoes)', '가격을 말해요. (예: Twenty thousand)', '세일 중이라는 말이에요. (예: They\'re)'], hint: ['Look at these bright shoes.'] },
  { topicLabel: '상품', topic: 'hat', lines: ['Look at {}.', 'How much {}?', '{} won.', '{} on sale.'], lineHints: ['물건 이름 앞에 this 와 꾸미는 말을 써요. (예: this cool hat)', '가격을 묻는 말이에요. (예: is this hat)', '가격을 말해요. (예: Ten thousand)', '세일 중이라는 말이에요. (예: It\'s)'], hint: ['Look at this cool hat.'] }]);

/* ===== 4차시 Read & Understand ===== */
const sf = (ko, tpl, ans) => ({ ko, tpl, ans });
step(4, 0, 'Fill the Blank', '빈칸 단어 쓰기', 4, 'sfill', 10, true, [
  sf('이 양말은 얼마예요?', 'How much {} these socks?', 'are'), sf('이 반바지는 얼마예요?', 'How much {} these shorts?', 'are'),
  sf('이 신발은 얼마예요?', 'How much are {}?', 'these shoes'), sf('이 선글라스는 얼마예요?', 'How much are {}?', 'these sunglasses'),
  sf('양말은 16,000원이에요.', 'They {} sixteen thousand won.', 'are'),
  sf('이 재킷은 얼마예요?', 'How much {} this jacket?', 'is'), sf('이 모자는 얼마예요?', 'How much {} this hat?', 'is'),
  sf('이것은 40,000원이에요.', 'This {} forty thousand won.', 'is'),
  sf('신발은 50,000원이에요.', 'They are {} won.', 'fifty thousand'), sf('선글라스는 20,000원이에요.', 'They are {} won.', 'twenty thousand')]);
const sr = (q, ans, extra) => ({ q, ans, extra });
step(4, 1, 'Sentence Build-up (Read & Reply)', '문장 만들기 (보고 이어질 말)', 3, 'sscramr', 3, false, [
  sr('How much are these socks?', 'They are sixteen thousand won.', ['It']), sr('How much is this hat?', 'This is forty thousand won.', ['They']), sr('May I help you?', 'Yes, please.', ['No'])]);
const sp = (ask, ko, target) => ({ ask, ko, target });
step(4, 2, 'Listen & Speak', '듣고 대답하기', 3, 'lspeak', 6, true, [
  sp('How much are these socks?', '가게 / 양말 13,000원', "They're thirteen thousand won."), sp('How much are these shoes?', '가게 / 신발 40,000원', "They're forty thousand won."), sp('How much are these shorts?', '가게 / 반바지 15,000원', "They're fifteen thousand won."),
  sp('How much is this hat?', '가게 / 모자 15,000원', "It's fifteen thousand won."), sp('How much is this jacket?', '가게 / 재킷 30,000원', "It's thirty thousand won."), sp('How much is this hat?', '가게 / 모자 8,000원', "It's eight thousand won.")]);
step(4, 3, 'Passage Read Aloud', '글 듣고 읽기', 5, 'pread', 2, false, [{
  text: ["I'm at the sports shop.", 'Oh! These shoes are cool.', 'How much are they?', "They're on sale now.", "They're only 20,000 won.", 'I want to buy them.', '---', 'Tom, wait! You need to think first.', 'Do you NEED them?', 'Or do you just WANT them?', "Please don't buy them.", 'You already have nice shoes.'],
  ko: '나는 운동용품 가게에 있어.\n와! 이 신발 멋지다.\n얼마예요?\n지금 세일 중이야.\n겨우 20,000원이야.\n사고 싶어.\n---\n톰, 잠깐! 먼저 생각해 봐.\n정말 필요해?\n아니면 그냥 갖고 싶은 거야?\n사지 마.\n넌 이미 멋진 신발이 있잖아.',
  qs: [{ t: 'mc', q: 'How much are the shoes?', ans: '20,000 won', wrong: ['2,000 won', '12,000 won'] }, { t: 'tf', lines: ['The writer is at a sports shop. | T', 'The shoes are not on sale. | F', 'Tom already has nice shoes. | T'] }] }]);
step(4, 4, 'Passage Read Aloud', '글 듣고 읽기', 5, 'pread', 2, false, [{
  text: ["Today is my brother's birthday.", "I am at a shop.", "May I help you?", "Yes, please. How much is this hat?", "It's 12,000 won.", "---", "And how much are these socks?", "They're 2,000 won.", "I want this hat and these socks.", "Thank you!"],
  ko: "오늘은 내 남동생의 생일이야.\n나는 가게에 있어.\n도와드릴까요?\n네, 부탁해요. 이 모자는 얼마예요?\n12,000원이에요.\n---\n그리고 이 양말은 얼마예요?\n2,000원이에요.\n이 모자와 이 양말을 갖고 싶어요.\n감사합니다!",
  qs: [{"t": "mc", "q": "How much is the hat?", "ans": "It's 12,000 won.", "wrong": ["It's 2,000 won.", "It's 20,000 won."]}, {"t": "tf", "lines": ["Today is the writer's brother's birthday. | T", "The hat is 12,000 won. | T", "The socks are 12,000 won. | F"]}] }]);

module.exports = { S };
