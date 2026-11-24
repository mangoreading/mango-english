// 5·6차시
const { S, W, ex, opt } = require('./part1.cjs');
require('./part2.cjs');
const TAG = { dfill: 'write', mtext: 'read', sscram: 'write', mwbank: 'write', mfree: 'write', present: 'write', aitalk: 'speak', vwrite: 'vocab', lchlist: 'listen', lpmatch: 'listen', lblank: 'listen', looktalk: 'speak', dfillt: 'write', sqset: 'read', sbuild: 'write', lnum: 'listen' };
const step = (lesson, pos, en, ko, min, kind, qty, hw, items) => S.push({ lesson, pos, en, ko, min, kind, qty, hw: !!hw, tag: TAG[kind], items: items.map((p) => ({ k: kind, tag: TAG[kind], ...p })) });

/* ===== 5차시 Master & Expand ===== */
const dfp = (pic, tag2, lines, ans, blankHints) => ({ pic, tag2, lines, ans, blankHints });
const PL = ['A: How much {} {} {}?', "B: They're {} won."]; const SG = ['A: How much {} {} {}?', "B: It's {} won."];
const bh = (n) => ['is / are', 'this / these', '물건 이름', n];
step(5, 0, 'Complete the Dialogue (Picture)', '대화 완성하기 (그림)', 4, 'dfill', 6, false, [
  dfp('shorts', '15,000원', PL, ['are', 'these', 'shorts', 'fifteen thousand'], bh('15,000 을 영어로 써요.')),
  dfp('hat', '10,000원', SG, ['is', 'this', 'hat', 'ten thousand'], bh('10,000 을 영어로 써요.')),
  dfp('socks', '2,000원', PL, ['are', 'these', 'socks', 'two thousand'], bh('2,000 을 영어로 써요.')),
  dfp('jacket', '30,000원', SG, ['is', 'this', 'jacket', 'thirty thousand'], bh('30,000 을 영어로 써요.')),
  dfp('shoes', '50,000원', PL, ['are', 'these', 'shoes', 'fifty thousand'], bh('50,000 을 영어로 써요.')),
  dfp('sunglasses', '13,000원', PL, ['are', 'these', 'sunglasses', 'thirteen thousand'], bh('13,000 을 영어로 써요.'))]);
const MD1 = { title: 'Funny Hat Shop', illus: 'illus/l9-5-cat-hat.png', text: ['Look at this [[Cat Hat]].', 'It has [[two ears]].', 'How much is [[this hat]]?', "It's [[10,000 won]]."],
  explain: ['{{상품}}을 소개하고 특징을 말합니다.', '가격을 묻는 질문을 하고', '{{가격을 제시}}합니다.'], ko: '이 고양이 모자를 보세요.\n귀가 두 개 있어요.\n이 모자는 얼마예요?\n10,000원이에요.' };
const MD2 = { title: 'Funny Sunglasses Shop', illus: 'illus/l9-5-star-sunglasses.png', text: ['Look at these [[Star Sunglasses]].', 'They have [[big stars]].', 'How much are [[these sunglasses]]?', "They're [[13,000 won]]."],
  explain: ['{{상품}}을 소개하고 특징을 말합니다.', '가격을 묻는 질문을 하고', '{{가격을 제시}}합니다.', '여러 개일 때는 these / are / They\'re 를 써요.'], ko: '이 별 선글라스를 보세요.\n큰 별이 있어요.\n이 선글라스는 얼마예요?\n13,000원이에요.' };
step(5, 1, 'Model Text', '모범 글 읽기', 3, 'mtext', 2, false, [MD1, MD2]);
const sc = (ko, ans, extra) => ({ ko, ans, extra });
step(5, 2, 'Sentence Scramble', '문장 만들기', 3, 'sscram', 4, true, [
  sc('이 고양이 모자를 보세요.', 'Look at this Cat Hat.', ['these']), sc('귀가 두 개 있어요.', 'It has two ears.', ['have']),
  sc('이 모자는 얼마예요?', 'How much is this hat?', ['are']), sc('10,000원이에요.', "It's 10,000 won.", ['They']) ]);
step(5, 3, 'Model Writing (Word Bank)', '모범 글 완성 (보기)', 3, 'mwbank', 2, false, [
  { illus: 'illus/l9-5-cat-hat.png', lines: ['Look at this {} Hat.', 'It has {} ears.', 'How much {} this hat?', "It's {} won."], ans: ['Cat', 'two', 'is', '10,000'], extra: ['These', 'three'], blankHints: ['동물 이름이에요.', '귀의 수예요.', 'this 와 짝이 되는 말이에요.', '가격이에요.'] },
  { illus: 'illus/l9-5-star-sunglasses.png', lines: ['Look at these {} sunglasses.', 'They have {} stars.', 'How much {} these sunglasses?', "They're {} won."], ans: ['Star', 'big', 'are', '13,000'], extra: ['Moon', 'is'], blankHints: ['모양 이름이에요.', '별이 어떤지 말해요.', 'these 와 짝이 되는 말이에요.', '가격이에요.'] }]);
step(5, 4, 'Model Writing (Free)', '나만의 글 쓰기', 4, 'mfree', 2, false, [
  { illus: 'illus/l9-5-cat-hat.png', topicLabel: '상품', topic: 'hat', lines: ['Look at this {}.', 'It has {}.', 'How much is this hat?', "It's {} won."], lineHints: ['모자 이름을 써요. (예: Cat Hat, Funny Hat)', '모자의 특징을 써요. (예: two ears)', '', '가격을 써요. (예: ten thousand)'], hint: ['Look at this Cat Hat.'] },
  { illus: 'illus/l9-5-star-sunglasses.png', topicLabel: '상품', topic: 'sunglasses', lines: ['Look at these {}.', 'They have {}.', 'How much are these sunglasses?', "They're {} won."], lineHints: ['선글라스 이름을 써요. (예: Star Sunglasses)', '선글라스의 특징을 써요. (예: big stars)', '', '가격을 써요. (예: thirteen thousand)'], hint: ['Look at these Star Sunglasses.'] }]);
step(5, 5, 'Presentation', '발표 영상 찍기', 3, 'present', 1, false, [{ text: ['Look at this [[Cat Hat]].', 'It has [[two ears]].', 'How much is this hat?', "It's [[10,000 won]]."] }]);
step(5, 6, 'AI Free Talk', 'AI 자유대화', 4, 'aitalk', 1, true, [{ situation: '옷 가게에서 점원에게 물건 값을 묻고, 사고 싶은 물건을 말해요', role: '점원 (Clerk)', open: 'Hello! May I help you?', turns: 3,
  hints: ['Yes, please. How much is this jacket?', 'How much are these shorts?', 'Thank you.'], script: [{ ai: "Sure. It's thirty thousand won." }, { ai: "They're fifteen thousand won." }, { ai: 'Great! Thank you!' }] }]);

/* ===== 6차시 Check-up (교과서 문항 + 새로 만든 문항으로 2배) ===== */
step(6, 0, 'Picture Writing', '그림 보고 쓰기', 3, 'vwrite', 6, false, [{ words: W }]);
const lc = (q, say, opts, a) => ({ q, say, replay: 2, opts: opts.map((t) => opt(t)), a });
step(6, 1, 'Listen & Choose (List)', '듣고 고르기 (세로형)', 3, 'lchlist', 4, false, [
  lc('재킷의 가격은 얼마인가요?', "Jina(girl): How much is this jacket?\nClerk(woman): It's thirty thousand won.", ['Thirteen thousand won', 'Thirty thousand won', 'Three thousand won', 'Fifty thousand won'], 1),
  lc('신발의 가격은 얼마인가요?', "Tom(boy): How much are these shoes?\nClerk(woman): They're fifty thousand won.", ['Fifteen thousand won', 'Forty thousand won', 'Fifty thousand won', 'Five thousand won'], 2),
  lc('모자의 가격은 얼마인가요?', "Ken(boy): How much is this hat?\nClerk(woman): It's ten thousand won.", ['Ten thousand won', 'Eighteen thousand won', 'Eight thousand won', 'Twenty thousand won'], 0),
  lc('양말의 가격은 얼마인가요?', "Mia(girl): How much are these socks?\nClerk(woman): They're two thousand won.", ['Twelve thousand won', 'Twenty thousand won', 'Two thousand won', 'Five thousand won'], 2)]);
step(6, 2, 'Listen & Match (Picture)', '듣고 그림·글 연결하기', 3, 'lpmatch', 4, false, [
  { inst: '잘 듣고, 물건과 가격표를 연결해 보세요.', say: "No.1\nLily(girl): How much is this hat?\nClerk(woman): It's fifteen thousand won.\nNo.2\nClerk(woman): May I help you?\nKen(boy): How much are these socks?\nClerk(woman): They're ten thousand won.", pairs: [{ pic: 'hat', right: '₩ 15,000' }, { pic: 'socks', right: '₩ 10,000' }], extra: ['₩ 50,000'], hint: ['숫자를 듣고 가격표를 찾아요. 예: fifteen thousand → 15,000'] },
  { inst: '잘 듣고, 물건과 가격표를 연결해 보세요.', say: "No.1\nMia(girl): How much is this jacket?\nClerk(woman): It's thirty thousand won.\nNo.2\nClerk(woman): May I help you?\nTom(boy): How much are these shoes?\nClerk(woman): They're forty thousand won.", pairs: [{ pic: 'jacket', right: '₩ 30,000' }, { pic: 'shoes', right: '₩ 40,000' }], extra: ['₩ 14,000'], hint: ['숫자를 듣고 가격표를 찾아요. 예: thirty thousand → 30,000'] }]);
step(6, 3, 'Listen & Write (Blank)', '듣고 빈칸 쓰기', 3, 'lblank', 4, false, [
  { inst: "잘 듣고, 어떤 물건의 가격을 묻고 있는지 써 봅니다.", say: "Lily(girl): How much are these sunglasses?\nClerk(woman): They're twenty thousand won.", lines: ["How much are these {}?"], ans: ["sunglasses"], hint: ["물건 이름을 써요. s로 끝나요."] },
  { inst: "잘 듣고, 어떤 물건의 가격을 묻고 있는지 써 봅니다.", say: "Clerk(woman): May I help you?\nKen(boy): Yes, please. How much are these shorts?\nClerk(woman): They're twenty-five thousand won.", lines: ["How much are these {}?"], ans: ["shorts"], hint: ["물건 이름을 써요. s로 끝나요."] },
  { inst: "잘 듣고, 어떤 물건의 가격을 묻고 있는지 써 봅니다.", say: "Tom(boy): How much is this hat?\nClerk(woman): It's ten thousand won.", lines: ["How much is this {}?"], ans: ["hat"], hint: ["물건 이름을 써요. 하나인지 여러 개인지 잘 들어요."] },
  { inst: "잘 듣고, 어떤 물건의 가격을 묻고 있는지 써 봅니다.", say: "Clerk(woman): May I help you?\nMia(girl): Yes, please. How much are these socks?\nClerk(woman): They're two thousand won.", lines: ["How much are these {}?"], ans: ["socks"], hint: ["물건 이름을 써요. 하나인지 여러 개인지 잘 들어요."] }]);
const lk = (pic, label, price, q, a) => ({ pic, label, price, turns: [{ target: q }, { target: a }], hint: ['How much are ~? / They\'re ~ won.'] });
step(6, 4, 'Look & Talk', '그림 보고 대화하기', 3, 'looktalk', 4, true, [
  lk('shoes', 'shoes', '₩30,000', 'How much are these shoes?', "They're thirty thousand won."), lk('jacket', 'jacket', '₩50,000', 'How much is this jacket?', "It's fifty thousand won."),
  lk('sunglasses', 'sunglasses', '₩13,000', 'How much are these sunglasses?', "They're thirteen thousand won."), lk('hat', 'hat', '₩10,000', 'How much is this hat?', "It's ten thousand won.")]);
step(6, 5, 'Sentence Scramble', '문장 만들기', 3, 'sscram', 6, false, [
  { ans: 'May I help you?', extra: ['we'] }, { ans: 'Yes, please.', extra: ['no'] }, { ans: 'How much is this hat?', extra: ['are'] },
  { ans: 'How much are these socks?', extra: ['is'] }, { ans: "It's ten thousand won.", extra: ['They'] }, { ans: "They're two thousand won.", extra: ['It'] }]);
const dt = (cue, lines, ans) => ({ cue, lines, ans });
step(6, 6, 'Complete the Dialogue (Text Cue)', '대화 완성하기 (글 단서)', 3, 'dfillt', 4, false, [
  dt('반바지 • 15,000원', ['A: {} {} are these shorts?', 'B: {} 15,000 won.'], ['How', 'much', "They're|They are"]),
  dt('모자 • 10,000원', ['A: How much {} this {}?', 'B: {} 10,000 won.'], ['is', 'hat', "It's|It is"]),
  dt('양말 • 2,000원', ['A: How much {} these {}?', 'B: {} 2,000 won.'], ['are', 'socks', "They're|They are"]),
  dt('재킷 • 30,000원', ['A: May I help you?', 'B: Yes, please. How much {} this {}?', 'A: {} 30,000 won.'], ['is', 'jacket', "It's|It is"])]);
step(6, 7, 'Story Check', '글 읽고 답하기', 3, 'sqset', 2, false, [{ title: "Dad's Birthday", pic: 'socks',
  text: ["Today is my dad's birthday.", 'I want to buy socks for him.', 'How much are these socks?', "They're 6,000 won.", 'Oh, no! I have only 4,000 won.', 'I bought many stickers yesterday.'],
  ko: '오늘은 우리 아빠의 생일이야.\n나는 아빠께 양말을 사 드리고 싶어.\n이 양말은 얼마예요?\n6,000원이에요.\n아, 이런! 나는 4,000원밖에 없어.\n나는 어제 스티커를 많이 샀어.',
  explain: ["[[Today is my dad's birthday.]]에서 누구의 생일인지 알 수 있어요.", '[[I bought many stickers yesterday.]]는 "어제 스티커를 많이 샀다"는 뜻이에요.'],
  qs: [{ t: 'mc', q: '오늘은 누구의 생일인가요?', ans: '아빠', wrong: ['엄마', '여동생'], hint: '첫 번째 문장을 읽어 보세요.', ev: '1' },
       { t: 'mc', q: '글쓴이가 어제 산 것은 무엇인가요?', ans: '스티커', wrong: ['양말', '과자'], hint: 'yesterday 가 나오는 문장을 찾아 보세요.', ev: '6' }] }]);
const sb = (ko, ans, alts, starter) => ({ ko, ans, ...(alts ? { alts } : {}), ...(starter ? { starter } : {}) });
step(6, 8, 'Sentence Build-up', '문장 쓰기 (우리말→영어)', 3, 'sbuild', 6, true, [
  sb('도와드릴까요?', 'May I help you?', null, 'May'), sb('네, 부탁해요.', 'Yes, please.', null, 'Yes'), sb('이 모자는 얼마예요?', 'How much is this hat?', null, 'How much'),
  sb('이 양말은 얼마예요?', 'How much are these socks?', null, 'How much'), sb('10,000원이에요. (모자)', "It's ten thousand won.", ['It is ten thousand won.'], "It's"),
  sb('2,000원이에요. (양말)', "They're two thousand won.", ['They are two thousand won.'], "They're")]);
const ln = (q, opts, ans) => ({ q, opts, ans, plays: 2, inst: '들려주는 말에 이어질 말을 골라요.' });
step(6, 9, 'Listen & Choose (Number)', '듣고 번호 고르기', 3, 'lnum', 4, true, [
  ln('May I help you?', ['Yes, please.', "They're ten thousand won.", 'How much is it?'], 1),
  ln('How much are these socks?', ["It's two thousand won.", "They're two thousand won.", 'Yes, please.'], 2),
  ln('How much is this hat?', ["They're ten thousand won.", "It's ten thousand won.", "I'll take them."], 2),
  ln('How much are these shorts?', ['Yes, please.', "It's fifteen thousand won.", "They're fifteen thousand won."], 3)]);

module.exports = { S };
