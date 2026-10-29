// 비상교육 초5 영어 Lesson 9 — 1~6차시 CORE 문항 (직접 쓴 연습 문항. 교과서 문장을 그대로 옮기지 않음)
// 키 = "차시-칸 번호(pos)". 값 = 문항 배열. 칸 번호/종류는 '비상 초5 6차시' 템플릿과 같아야 한다 (마이그레이션에서 검사).
const W = ['hat', 'sunglasses', 'jacket', 'shorts', 'socks', 'shoes'];
const KO = { hat: '모자', sunglasses: '선글라스', jacket: '재킷', shorts: '반바지', socks: '양말', shoes: '신발' };
const ex = (en, ko, label, group) => ({ en, ko, ...(label ? { label } : {}), ...(group ? { group } : {}) });
const opt = (t, flag) => (flag ? { t, flag } : { t });
const L = {}; // key -> {kind, tag, items}
const add = (key, kind, tag, items) => { L[key] = { kind, tag, items: items.map((p) => ({ k: kind, tag, ...p })) }; };

/* ===== 1차시: 가격 묻고 답하기 소개 ===== */
add('1-0', 'goal', 'expr', [{ title: '가격을 묻고 답해요', ko: 'Lesson 9 · 이 단원에서 할 수 있는 것', head: 'I can ask and answer about prices.', pic: 'socks',
  items: [ex('How much is this hat?', '이 모자는 얼마예요?', '', '가격 묻기'), ex('How much are these socks?', '이 양말은 얼마예요?', '', '가격 묻기'), ex("It's ten thousand won.", '10,000원이에요.', '', '가격 답하기'), ex("They're two thousand won.", '2,000원이에요.', '', '가격 답하기')] }]);
add('1-1', 'wrepeat', 'vocab', [{ words: W }]);
const wc = (word, dir, wrong) => ({ word, dir, wrong });
add('1-2', 'wchoice', 'vocab', [
  wc('hat', 'en2ko', ['양말', '신발', '반바지']), wc('socks', 'en2ko', ['모자', '재킷', '선글라스']), wc('shoes', 'en2ko', ['반바지', '양말', '재킷']),
  wc('sunglasses', 'ko2en', ['shorts', 'shoes', 'socks']), wc('jacket', 'ko2en', ['hat', 'shoes', 'shorts']), wc('shorts', 'ko2en', ['socks', 'jacket', 'sunglasses'])]);
add('1-3', 'kexp', 'expr', [{ items: [ex('How much is this hat?', '이 모자는 얼마예요?', '물건 하나의 가격 묻기'), ex('How much are these socks?', '이 양말은 얼마예요?', '물건 여러 개의 가격 묻기'), ex("It's ten thousand won.", '10,000원이에요.', '하나일 때 대답'), ex("They're two thousand won.", '2,000원이에요.', '여러 개일 때 대답')] }]);
add('1-4', 'sdrill', 'speak', [
  { pic: 'socks', tpl: 'How much are these {}?', words: ['socks', 'shoes', 'shorts', 'sunglasses'] },
  { pic: 'hat', tpl: 'How much is this {}?', words: ['hat', 'jacket'] },
  { pic: 'socks', tpl: "They're {} won.", words: ['two thousand', 'thirteen thousand', 'fifteen thousand', 'fifty thousand'] }]);
add('1-5', 'scene', 'listen', [{ title: '미나와 엄마의 가게 나들이', sub: 'en', replay: 2, review: true, pic: 'hat',
  scenes: [
    { who: 'Mina', en: 'Mom, I need a hat for the trip.', ko: '엄마, 저 여행에 쓸 모자가 필요해요.' },
    { who: 'Clerk', en: 'Hello! May I help you?', ko: '안녕하세요! 도와드릴까요?' },
    { who: 'Mom', en: 'Yes, please. How much is this hat?', ko: '네. 이 모자는 얼마예요?' },
    { who: 'Clerk', en: "It's ten thousand won.", ko: '10,000원이에요.' },
    { who: 'Mina', en: 'And how much are these shorts?', ko: '그리고 이 반바지는 얼마예요?' },
    { who: 'Clerk', en: "They're fifteen thousand won.", ko: '15,000원이에요.' },
    { who: 'Mina', en: 'How much are these shoes?', ko: '이 신발은 얼마예요?' },
    { who: 'Clerk', en: "They're fifty thousand won.", ko: '50,000원이에요.' },
    { who: 'Mom', en: "Oh, that's too much. We'll take the hat and the shorts.", ko: '아, 너무 비싸네요. 모자와 반바지로 할게요.' },
    { who: 'Mina', en: 'Thank you, Mom!', ko: '고마워요, 엄마!' },
    { who: 'Clerk', en: 'Thank you! Have a nice day!', ko: '감사합니다! 좋은 하루 보내세요!' }],
  explain: ['물건이 하나일 때는 How much is this …?, 여러 개일 때는 How much are these …? 라고 물어요.', '대답은 하나면 It\'s …, 여러 개면 They\'re … 로 시작해요.', '가격은 숫자 뒤에 won 을 붙여요. (ten thousand won = 10,000원)'],
  qs: [{ q: '미나네 가족이 산 물건이 아닌 것은?', ans: '신발', wrong: ['모자', '반바지'] }, { q: '모자는 얼마였나요?', ans: '10,000원', wrong: ['15,000원', '50,000원'] }] }]);
add('1-6', 'vmatch', 'vocab', [{ words: ['hat', 'jacket', 'shoes'] }, { words: ['shorts', 'socks', 'sunglasses'] }, { words: ['hat', 'socks', 'sunglasses'] }]);

/* ===== 2차시: 듣고 가격 구분하기 ===== */
add('2-0', 'vcards', 'vocab', [{ words: W }]);
add('2-1', 'tapl', 'listen', [{ items: [ex('May I help you?', '도와드릴까요?'), ex('Yes, please.', '네, 부탁해요.'), ex('How much is this hat?', '이 모자는 얼마예요?'), ex("It's ten thousand won.", '10,000원이에요.'), ex('How much are these socks?', '이 양말은 얼마예요?'), ex("They're two thousand won.", '2,000원이에요.')] }]);
const qr = (key, others, say) => ({ q: '무엇의 가격을 말하고 있나요?', say, replay: 2, opts: [key, ...others].map((k) => opt(k, k)), a: 0 });
const sh = (a, b) => ({ ...a, _o: b });
// 보기 순서를 섞기 위해 정답 위치를 항목마다 다르게 둔다
const qrot = (key, others, say, a) => { const o = [...others]; o.splice(a, 0, key); return { q: '무엇의 가격을 말하고 있나요?', say, replay: 2, opts: o.map((k) => opt(k, k)), a }; };
add('2-2', 'lchpic', 'listen', [
  qrot('socks', ['hat', 'shoes', 'shorts'], "Hana(girl): How much are these socks?\nClerk(woman): They're two thousand won.", 0),
  qrot('hat', ['jacket', 'socks', 'sunglasses'], "Tom(boy): How much is this hat?\nClerk(woman): It's ten thousand won.", 1),
  qrot('shoes', ['shorts', 'hat', 'jacket'], "Mina(girl): How much are these shoes?\nClerk(woman): They're fifty thousand won.", 2),
  qrot('sunglasses', ['socks', 'shoes', 'shorts'], "Dad(man): How much are these sunglasses?\nClerk(woman): They're thirteen thousand won.", 3),
  qrot('jacket', ['hat', 'sunglasses', 'shoes'], "Hana(girl): How much is this jacket?\nClerk(woman): It's thirty thousand won.", 0),
  qrot('shorts', ['socks', 'hat', 'jacket'], "Tom(boy): How much are these shorts?\nClerk(woman): They're fifteen thousand won.", 2)]);
add('2-3', 'lcardt', 'listen', [
  { items: [ex('two thousand won', '2,000원'), ex('five thousand won', '5,000원'), ex('ten thousand won', '10,000원'), ex('twenty thousand won', '20,000원'), ex('thirty thousand won', '30,000원'), ex('fifty thousand won', '50,000원')] },
  { items: [ex('thirteen thousand won', '13,000원', '', '-teen (끝이 teen)'), ex('thirty thousand won', '30,000원', '', '-ty (끝이 ty)'), ex('fifteen thousand won', '15,000원', '', '-teen (끝이 teen)'), ex('fifty thousand won', '50,000원', '', '-ty (끝이 ty)'), ex('fourteen thousand won', '14,000원', '', '-teen (끝이 teen)'), ex('forty thousand won', '40,000원', '', '-ty (끝이 ty)')] }]);
add('2-4', 'lmatch', 'listen', [{ pairs: [
  { left: "They're two thousand won.", right: '2,000원' }, { left: "They're thirteen thousand won.", right: '13,000원' },
  { left: "It's thirty thousand won.", right: '30,000원' }, { left: "They're fifteen thousand won.", right: '15,000원' }] }]);
const lt = (q, say, opts, a) => ({ q, say, replay: 2, opts: opts.map((t) => opt(t)), a });
add('2-5', 'lchtext', 'listen', [
  lt('하나가 산 물건과 가격은?', "Hana(girl): Hello. How much are these sunglasses?\nClerk(woman): They're thirteen thousand won.\nHana(girl): OK. I'll take them.", ['선글라스 - 13,000원', '선글라스 - 30,000원', '재킷 - 13,000원', '양말 - 3,000원'], 0),
  lt('아빠가 고른 물건과 가격은?', "Dad(man): Excuse me. How much is this jacket?\nClerk(woman): It's thirty thousand won.\nDad(man): That's good. I'll take it.", ['재킷 - 13,000원', '재킷 - 30,000원', '반바지 - 30,000원', '재킷 - 3,000원'], 1),
  lt('톰이 산 물건과 가격은?', "Tom(boy): How much are these socks?\nClerk(woman): They're two thousand won.\nTom(boy): Great. I'll take two.", ['양말 - 20,000원', '신발 - 2,000원', '양말 - 2,000원', '양말 - 12,000원'], 2),
  lt('반바지는 얼마인가요?', "Mina(girl): How much are these shorts?\nClerk(woman): They're fifteen thousand won.\nMina(girl): Fifteen? Not fifty?\nClerk(woman): No, fifteen thousand won.", ['5,000원', '50,000원', '15,000원', '12,000원'], 2),
  lt('모자의 세일 가격은?', "Mom(woman): How much is this hat?\nClerk(woman): It's on sale today. It's eight thousand won.\nMom(woman): Oh, nice!", ['10,000원', '18,000원', '80,000원', '8,000원'], 3),
  lt('신발은 얼마인가요?', "Dad(man): How much are these shoes?\nClerk(woman): They're forty thousand won.\nDad(man): Forty? That's too much.", ['14,000원', '4,000원', '50,000원', '40,000원'], 3)]);
add('2-6', 'scene', 'listen', [{ title: '하나네 가족의 쇼핑', sub: 'en', replay: 2, review: true, pic: 'sunglasses',
  scenes: [
    { who: 'Clerk', en: 'Hello! May I help you?', ko: '안녕하세요! 도와드릴까요?' },
    { who: 'Hana', en: 'Yes, please. How much are these sunglasses?', ko: '네. 이 선글라스는 얼마예요?' },
    { who: 'Clerk', en: "They're thirteen thousand won.", ko: '13,000원이에요.' },
    { who: 'Hana', en: 'Dad, I like them.', ko: '아빠, 이거 마음에 들어요.' },
    { who: 'Dad', en: 'OK. And how much is this jacket?', ko: '좋아. 그럼 이 재킷은 얼마예요?' },
    { who: 'Clerk', en: "It's thirty thousand won.", ko: '30,000원이에요.' },
    { who: 'Tom', en: 'Dad, how much are these socks?', ko: '아빠, 이 양말은 얼마예요?' },
    { who: 'Clerk', en: "They're two thousand won.", ko: '2,000원이에요.' },
    { who: 'Dad', en: "We'll take all of them.", ko: '전부 살게요.' },
    { who: 'Hana', en: 'Thank you, Dad!', ko: '고마워요, 아빠!' },
    { who: 'Tom', en: 'Thank you!', ko: '고맙습니다!' }],
  qs: [{ q: '하나가 고른 물건은?', ans: '선글라스', wrong: ['재킷', '양말'] }, { q: '재킷은 얼마였나요?', ans: '30,000원', wrong: ['13,000원', '2,000원'] }, { q: '톰이 산 것은?', ans: '양말', wrong: ['모자', '신발'] }] }]);

/* ===== 3차시: 말하기 (sdrill 은 1차시 문항 참조) ===== */
add('3-1', 'raloud', 'speak', ['May I help you?', 'Yes, please.', 'How much are these socks?', "They're two thousand won.", 'How much is this hat?'].map((target) => ({ target, stars: true, fluency: true })));
const ls = (k, t, price) => ({ pic: k, label: k, price, target: t });
add('3-2', 'lookspeak', 'speak', [
  ls('socks', 'How much are these socks?', '2,000원'), ls('hat', 'How much is this hat?', '10,000원'), ls('shoes', 'How much are these shoes?', '50,000원'),
  ls('jacket', 'How much is this jacket?', '30,000원'), ls('shorts', 'How much are these shorts?', '15,000원'), ls('sunglasses', 'How much are these sunglasses?', '13,000원')]);
const sp = (ask, ko, target) => ({ ask, ko, target });
add('3-3', 'lspeak', 'speak', [
  sp('How much are these socks?', '2,000원이라고 대답해요', "They're two thousand won."), sp('How much is this hat?', '10,000원이라고 대답해요', "It's ten thousand won."),
  sp('How much are these shoes?', '50,000원이라고 대답해요', "They're fifty thousand won."), sp('How much is this jacket?', '30,000원이라고 대답해요', "It's thirty thousand won."),
  sp('How much are these shorts?', '15,000원이라고 대답해요', "They're fifteen thousand won."), sp('How much are these sunglasses?', '13,000원이라고 대답해요', "They're thirteen thousand won.")]);
add('3-4', 'role', 'speak', [
  { pic: 'socks', price: '2,000원', lines: ['A: May I help you?', 'B: Yes, please. How much are these {{socks}}?', "A: They're [[two thousand won]].", 'B: Thank you.'] },
  { pic: 'hat', price: '10,000원', lines: ['A: May I help you?', 'B: Yes, please. How much is this {{hat}}?', "A: It's [[ten thousand won]].", "B: I'll take it."] }]);
add('3-5', 'aitalk', 'speak', [{ situation: '옷 가게에서 점원에게 물건 값을 물어봐요', role: '점원 (Clerk)', open: 'Hello! May I help you?', turns: 3,
  hints: ['Yes, please. How much is this hat?', 'How much are these shoes?', 'Thank you. I\'ll take the hat.'],
  script: [{ ai: "Sure. It's ten thousand won." }, { ai: "They're fifty thousand won." }, { ai: 'Great! Thank you!' }] }]);
const sk = (ko, target, koHl) => ({ ko, target, ...(koHl ? { koHl } : {}) });
add('3-6', 'saykor', 'speak', [
  sk('이 양말은 얼마예요?', 'How much are these socks?', '얼마'), sk('이 모자는 얼마예요?', 'How much is this hat?', '얼마'), sk('2,000원이에요. (양말)', "They're two thousand won.", '2,000원'),
  sk('10,000원이에요. (모자)', "It's ten thousand won.", '10,000원'), sk('이 신발은 얼마예요?', 'How much are these shoes?', '얼마'), sk('30,000원이에요. (재킷)', "It's thirty thousand won.", '30,000원')]);

/* ===== 4차시: 읽기 ===== */
const P1 = ['Happy Shop Sale!', 'Come to Happy Shop today.', 'We have hats, shorts, and socks.', '---', 'The hat is ten thousand won.', 'The shorts are fifteen thousand won.', 'The socks are only two thousand won.'];
const P1KO = '해피 숍 세일!\n오늘 해피 숍에 오세요.\n모자, 반바지, 양말이 있어요.\n---\n모자는 10,000원이에요.\n반바지는 15,000원이에요.\n양말은 딱 2,000원이에요.';
const P2 = ['Mina has ten thousand won.', 'She wants a new hat.', 'But she needs socks for school.', '---', 'The socks are two thousand won.', 'The hat is ten thousand won.', 'Mina buys two pairs of socks.', 'Now she has six thousand won.'];
const P2KO = '미나는 10,000원이 있어요.\n미나는 새 모자를 갖고 싶어요.\n하지만 학교에 신고 갈 양말이 필요해요.\n---\n양말은 2,000원이에요.\n모자는 10,000원이에요.\n미나는 양말 두 켤레를 사요.\n이제 미나에게는 6,000원이 남았어요.';
add('4-0', 'pread', 'read', [{ text: P1, ko: P1KO }, { text: P2, ko: P2KO }]);
add('4-1', 'sqtf', 'read', [{ title: 'Happy Shop', text: P1.filter((x) => x !== '---'), ko: P1KO.replace(/\n---\n/g, '\n'), items: [{ t: 'Happy Shop has hats.', a: true }, { t: 'The socks are fifteen thousand won.', a: false }, { t: 'The shorts are fifteen thousand won.', a: true }] }]);
const P2T = P2.filter((x) => x !== '---'); const P2K = P2KO.replace(/\n---\n/g, '\n');
add('4-2', 'sqchoice', 'read', [
  { title: "Mina's Money", text: P2T, ko: P2K, q: 'What does Mina need for school?', opts: [opt('Socks.'), opt('A hat.'), opt('Shorts.')], a: 0 },
  { title: "Mina's Money", text: P2T, ko: P2K, q: 'How much money does Mina have at the end?', opts: [opt('Ten thousand won.'), opt('Six thousand won.'), opt('Two thousand won.')], a: 1 }]);
add('4-3', 'scloze', 'read', [
  { lines: ['The shorts are {} thousand won.', 'The socks are only {} thousand won.'], ans: ['fifteen', 'two'], extra: ['fifty', 'twelve'], blankHints: ['15,000원', '2,000원'] },
  { lines: ['Mina has {} thousand won.', 'She needs {} for school.'], ans: ['ten', 'socks'], extra: ['hat', 'twenty'], blankHints: ['10,000원', '학교에 신고 갈 것'] }]);
const FL = ["Tom's Flea Market", 'Hats are eight thousand won.', 'Jackets are thirty thousand won.', 'Shoes are on sale.', 'They are forty thousand won today.'];
const FLK = '톰의 벼룩시장\n모자는 8,000원이에요.\n재킷은 30,000원이에요.\n신발은 세일 중이에요.\n오늘은 40,000원이에요.';
add('4-4', 'sqmulti', 'read', [
  { title: "Tom's Flea Market", text: FL, ko: FLK, q: '글의 내용과 맞는 것을 모두 골라요.', items: [{ t: 'You can buy a hat here.', ok: true }, { t: 'Jackets are twenty thousand won.', ok: false }, { t: 'Shoes are forty thousand won today.', ok: true }, { t: 'Socks are on sale.', ok: false }] },
  { title: "Tom's Flea Market", text: FL, ko: FLK, q: '글의 내용과 맞는 것을 모두 골라요.', items: [{ t: 'The hat is eight thousand won.', ok: true }, { t: 'The jacket is thirty thousand won.', ok: true }, { t: 'The shoes are not on sale.', ok: false }, { t: 'The shop is closed today.', ok: false }] }]);
add('4-5', 'sqtf', 'read', [{ title: "Dad's Sunglasses", text: ['Dad goes to a shop.', 'He wants sunglasses.', 'They are thirteen thousand won.', 'He has fifteen thousand won.', 'He buys them.'], ko: '아빠는 가게에 가요.\n아빠는 선글라스를 원해요.\n선글라스는 13,000원이에요.\n아빠는 15,000원이 있어요.\n아빠는 선글라스를 사요.',
  items: [{ t: 'Dad buys sunglasses.', a: true }, { t: 'Dad has twenty thousand won.', a: false }, { t: 'The sunglasses are thirteen thousand won.', a: true }] }]);

/* ===== 5차시: 쓰기 ===== */
const sw = (ko, ans, o = {}) => ({ ko, ans, ...o });
add('5-0', 'swrite', 'write', [
  sw('이 모자는 얼마예요?', 'How much is this hat?', { starter: 'How much' }), sw('이 신발은 얼마예요?', 'How much are these shoes?', { starter: 'How much' }),
  sw('2,000원이에요. (양말)', "They're two thousand won.", { alts: ['They are two thousand won.'], starter: "They're" }), sw('10,000원이에요. (모자)', "It's ten thousand won.", { alts: ['It is ten thousand won.'], starter: "It's" }),
  sw('이 반바지는 얼마예요?', 'How much are these shorts?', { tpl: 'How much {} these shorts?' }), sw('13,000원이에요. (선글라스)', "They're thirteen thousand won.", { alts: ['They are thirteen thousand won.'], starter: "They're" })]);
const sc = (ko, ans, extra) => ({ ko, ans, extra });
add('5-1', 'sscram', 'write', [
  sc('이 양말은 얼마예요?', 'How much are these socks?', ['is']), sc('이 재킷은 얼마예요?', 'How much is this jacket?', ['are']), sc('15,000원이에요.', "They're fifteen thousand won.", ['fifty']),
  sc('30,000원이에요.', "It's thirty thousand won.", ['thirteen']), sc('도와드릴까요?', 'May I help you?', ['we']), sc('이 신발은 얼마예요?', 'How much are these shoes?', ['this'])]);
const df = (pic, tag2, lines, ans, blankHints) => ({ pic, tag2, lines, ans, blankHints });
add('5-2', 'dfill', 'write', [
  df('socks', '2,000원', ['A: How much {} these socks?', "B: {} two thousand won."], ['are', "They're"], ['is / are', "It's / They're"]),
  df('hat', '10,000원', ['A: How much {} this hat?', "B: {} ten thousand won."], ['is', "It's"], ['is / are', "It's / They're"]),
  df('shorts', '15,000원', ['A: How much are {} shorts?', "B: They're {} thousand won."], ['these', 'fifteen'], ['this / these', '15']),
  df('jacket', '30,000원', ['A: How much is {} jacket?', "B: It's {} thousand won."], ['this', 'thirty'], ['this / these', '30'])]);
add('5-3', 'mtext', 'read', [
  { title: "Mina's Shop", text: ["Welcome to Mina's Shop!", 'Look at these socks.', "They're two thousand won.", 'Look at this hat.', "It's ten thousand won.", 'Come and buy!'],
    explain: ['Look at these / this 로 물건을 소개해요. (여러 개 → these, 하나 → this)', "가격은 They're / It's … won 으로 말해요.", '마지막에 Come and buy! 로 손님을 불러요.'],
    ko: '미나의 가게에 오신 걸 환영해요!\n이 양말을 보세요.\n2,000원이에요.\n이 모자를 보세요.\n10,000원이에요.\n와서 사세요!' },
  { title: "Tom's Shop", text: ["Welcome to Tom's Shop!", 'These sunglasses are thirteen thousand won.', 'This jacket is thirty thousand won.', 'These shoes are on sale today.', 'They are forty thousand won.', 'See you soon!'],
    explain: ['가격을 문장 앞에 쓰는 방법: These sunglasses are … / This jacket is … 처럼 물건 + are/is + 가격.', 'on sale 은 "세일 중"이라는 뜻이에요.'],
    ko: '톰의 가게에 오신 걸 환영해요!\n이 선글라스는 13,000원이에요.\n이 재킷은 30,000원이에요.\n이 신발은 오늘 세일 중이에요.\n40,000원이에요.\n곧 만나요!' }]);
add('5-4', 'mwbank', 'write', [
  { lines: ["Welcome to Mina's Shop!", 'These {} are two thousand won.', 'This {} is ten thousand won.'], ans: ['socks', 'hat'], extra: ['shoes', 'jacket'], blankHints: ['2,000원', '10,000원'] },
  { lines: ['Look at {} shoes.', '{} are forty thousand won.', 'Come and {}!'], ans: ['these', 'They', 'buy'], extra: ['this', 'It', 'go'], blankHints: ['여러 개', '여러 개', '사다'] }]);
add('5-5', 'mfree', 'write', [{ topicLabel: '상품', topic: 'socks',
  lines: ['Welcome to my shop!', 'Look at these {}.', "They're {} won.", 'Look at this {}.', "It's {} won.", 'Come and buy!'],
  lineHints: ['', '여러 개인 물건 (예: socks, shorts)', '가격 (예: two thousand)', '하나인 물건 (예: hat, jacket)', '가격 (예: ten thousand)', ''] }]);
add('5-6', 'present', 'write', [{ text: ['Welcome to my shop!', 'Look at these socks.', "They're two thousand won.", 'Look at this hat.', "It's ten thousand won.", 'Come and buy!'] }]);
add('5-7', 'swrt', 'write', [{ title: '내 가게 소개글 쓰기', minSent: 3, starter: 'Welcome to my shop! ',
  rules: [{ label: '가격을 묻는 문장 (How much …?)', re: 'how much' }, { label: "가격을 답하는 문장 (They're / It's … won)", re: "(they're|they are|it's|it is)\\s.*won" }, { label: '손님을 부르는 문장 (Welcome / Come and buy)', re: 'welcome|come and' }] }]);

/* ===== 6차시: 종합 ===== */
add('6-0', 'kexp', 'expr', [{ items: [ex('May I help you?', '도와드릴까요?'), ex('Yes, please.', '네, 부탁해요.'), ex('How much is this …? / How much are these …?', '이 …은(는) 얼마예요?'), ex("It's … won. / They're … won.", '…원이에요.')] }]);
add('6-1', 'lchpic', 'listen', [
  qrot('jacket', ['hat', 'shoes', 'shorts'], "Tom(boy): How much is this jacket?\nClerk(woman): It's thirty thousand won.", 1),
  qrot('sunglasses', ['socks', 'hat', 'jacket'], "Hana(girl): How much are these sunglasses?\nClerk(woman): They're thirteen thousand won.", 2),
  qrot('socks', ['shoes', 'shorts', 'hat'], "Dad(man): How much are these socks?\nClerk(woman): They're two thousand won.", 0)]);
add('6-2', 'lmatch', 'listen', [{ pairs: [
  { left: "It's ten thousand won.", right: '10,000원' }, { left: "They're fifty thousand won.", right: '50,000원' },
  { left: "It's eight thousand won.", right: '8,000원' }, { left: "They're forty thousand won.", right: '40,000원' }] }]);
add('6-3', 'lspeak', 'speak', [
  sp('How much is this jacket?', '30,000원이라고 대답해요', "It's thirty thousand won."), sp('How much are these shorts?', '15,000원이라고 대답해요', "They're fifteen thousand won."),
  sp('How much is this hat?', '8,000원이라고 대답해요', "It's eight thousand won."), sp('How much are these sunglasses?', '13,000원이라고 대답해요', "They're thirteen thousand won."),
  sp('May I help you?', '"네, 부탁해요"라고 대답해요', 'Yes, please.')]);
add('6-4', 'sbuild', 'write', [
  { ko: '이 재킷은 얼마예요?', ans: 'How much is this jacket?', starter: 'How much' }, { ko: '이 신발은 50,000원이에요.', ans: "They're fifty thousand won.", alts: ['They are fifty thousand won.'], starter: "They're" },
  { ko: '이 반바지는 얼마예요?', ans: 'How much are these shorts?', starter: 'How much' }]);
add('6-5', 'sqchoice', 'read', [
  { title: 'At the Shop', text: ['Tom and his dad are at a shop.', 'Tom likes the jacket.', "It's thirty thousand won.", 'Dad has twenty thousand won.', "So they buy socks. They're two thousand won."], ko: '톰과 아빠는 가게에 있어요.\n톰은 재킷이 마음에 들어요.\n재킷은 30,000원이에요.\n아빠에게는 20,000원이 있어요.\n그래서 그들은 양말을 사요. 양말은 2,000원이에요.', q: 'What does Tom like?', opts: [opt('The jacket.'), opt('The hat.'), opt('The shoes.')], a: 0 },
  { title: 'At the Shop', text: ['Tom and his dad are at a shop.', 'Tom likes the jacket.', "It's thirty thousand won.", 'Dad has twenty thousand won.', "So they buy socks. They're two thousand won."], ko: '', q: 'How much is the jacket?', opts: [opt('Thirteen thousand won.'), opt('Thirty thousand won.'), opt('Twenty thousand won.')], a: 1 },
  { title: 'At the Shop', text: ['Tom and his dad are at a shop.', 'Tom likes the jacket.', "It's thirty thousand won.", 'Dad has twenty thousand won.', "So they buy socks. They're two thousand won."], ko: '', q: 'What do they buy?', opts: [opt('A hat.'), opt('Shorts.'), opt('Socks.')], a: 2 }]);
add('6-6', 'role', 'speak', [
  { pic: 'jacket', price: '30,000원', lines: ['A: Hello! May I help you?', 'B: Yes, please. How much is this {{jacket}}?', "A: It's [[thirty thousand won]].", 'B: Thank you.'] },
  { pic: 'shorts', price: '15,000원', lines: ['A: May I help you?', 'B: Yes, please. How much are these {{shorts}}?', "A: They're [[fifteen thousand won]].", "B: I'll take them."] }]);
add('6-7', 'aitalk', 'speak', [
  { situation: '양말 가게에서 값을 물어봐요', role: '점원 (Clerk)', open: 'Hello! May I help you?', turns: 3, hints: ['Yes, please. How much are these socks?', 'How much are these shoes?', 'Thank you.'], script: [{ ai: "They're two thousand won." }, { ai: "They're fifty thousand won." }, { ai: 'You\'re welcome!' }] },
  { situation: '선글라스 가게에서 값을 물어봐요', role: '점원 (Clerk)', open: 'Hi! May I help you?', turns: 3, hints: ['Yes, please. How much are these sunglasses?', 'How much is this hat?', 'Thank you.'], script: [{ ai: "They're thirteen thousand won." }, { ai: "It's ten thousand won." }, { ai: 'Have a nice day!' }] },
  { situation: '재킷 가게에서 값을 물어봐요', role: '점원 (Clerk)', open: 'Hello! May I help you?', turns: 3, hints: ['Yes, please. How much is this jacket?', 'How much are these shorts?', 'Thank you.'], script: [{ ai: "It's thirty thousand won." }, { ai: "They're fifteen thousand won." }, { ai: 'Thank you! Come again!' }] }]);

module.exports = { L, KO };
