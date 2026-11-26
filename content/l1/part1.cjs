// 비상교육 초5 영어 Lesson 1 "Where Are You From?" — 1·2차시. 각 step = { lesson, pos, kind, qty, items[] }
// 흐름(차시·활동 위치·종류)은 admin 에 이미 있는 Lesson 1 흐름을 따른다. 여기서는 문항(items)만 만든다.
const W = ['brazil', 'egypt', 'france', 'korea', 'thailand', 'us'];
const VOCAB = [['brazil', 'Brazil', '브라질'], ['egypt', 'Egypt', '이집트'], ['france', 'France', '프랑스'], ['korea', 'Korea', '한국'], ['thailand', 'Thailand', '태국'], ['us', 'U.S.', '미국']];
const ex = (en, ko, label, group) => ({ en, ko, ...(label ? { label } : {}), ...(group ? { group } : {}) });
const opt = (t, flag) => (flag ? { t, flag } : { t });
const TAG = { goal: 'expr', lecture: 'expr', vcards: 'vocab', wrepeat: 'vocab', wchoice: 'vocab', kexp: 'expr', sdrill: 'speak', scene: 'listen', scenerep: 'listen', lchpic: 'listen', vmatch: 'vocab', wsent: 'vocab', tapl: 'speak', lcardt: 'listen', lmatch: 'listen', lchtext: 'listen', lmwrite: 'listen', lnum: 'listen', role: 'speak' };
const S = [];
const step = (lesson, pos, kind, qty, items) => S.push({ lesson, pos, kind, qty, tag: TAG[kind], items: items.map((p) => ({ k: kind, tag: TAG[kind], ...p })) });
const G1 = '출신 국가 묻고 답하기', G2 = '이름의 철자 묻고 답하기';

/* ===== 1차시 Listen & Learn ===== */
step(1, 0, 'goal', 1, [{ title: '나라와 이름의 철자를 묻고 답할 수 있어요.', pic: 'france',
  items: [ex('Where are you from?', '너는 어느 나라에서 왔니?', '', G1), ex("I'm from France.", '나는 프랑스에서 왔어.', '', G1), ex('How do you spell your name?', '너의 이름은 철자가 어떻게 되니?', '', G2), ex('H-A-N-A.', 'H-A-N-A야.', '', G2)] }]);
step(1, 1, 'lecture', 1, [{ title: 'Lesson 1', slides: [
  { head: '새로 만난 친구에게 이렇게 말해요', illus: 'illus/l1-lec-1.png', text: ['새 친구를 만나면 어느 나라에서 왔는지 궁금해요.', '이번 Lesson에서는 [[출신 나라]]와 [[이름의 철자]]를 묻고 대답하는 말을 배워요.'], cards: ['Where are you from? | 너는 어느 나라에서 왔니? | 묻는 말', "I'm from France. | 나는 프랑스에서 왔어. | 대답"] },
  { head: '출신 나라 묻고 답하기', illus: 'illus/l1-lec-2.png', text: ['어느 나라에서 왔는지 물을 때는 [[Where are you from?]]이라고 해요.', '대답은 [[I\'m from]] 뒤에 나라 이름을 붙여요.'], formula: ['{{Where}} + are + you + from?', "I'm + from + 나라 이름."], cards: ["Where are you from? | 너는 어느 나라에서 왔니?", "I'm from Korea. | 나는 한국에서 왔어."], tip: '나라 이름은 항상 [[대문자]]로 시작해요. (Korea, Brazil, Egypt)' },
  { head: '나라 이름 알아 두기', text: ['이번 Lesson에서 만나는 나라들이에요.'], table: ['영어 | 우리말', 'Brazil | 브라질', 'Egypt | 이집트', 'France | 프랑스', 'Korea | 한국', 'Thailand | 태국', 'the U.S. | 미국'], tip: '미국은 [[I\'m from the U.S.]]처럼 앞에 [[the]]를 붙여 말해요.' },
  { head: '이름의 철자 묻고 답하기', illus: 'illus/l1-lec-3.png', text: ['이름을 어떻게 쓰는지 물을 때는 [[How do you spell your name?]]이라고 해요.', '대답은 알파벳을 하나씩 읽어요. 글자 사이에 짧게 쉬어요.'], formula: ['How + do + you + {{spell}} + your name?', 'A-M-Y.'], cards: ['How do you spell your name? | 너의 이름은 철자가 어떻게 되니? | 묻는 말', 'A-M-Y. | A-M-Y야. | 대답'], tip: '내 이름은 [[My name is Amy.]] 또는 [[I\'m Amy.]]라고 소개해요.' },
  { head: '정리해요', text: ['묻는 말과 대답을 짝지어 기억해요.'], table: ['묻는 말 | 대답', 'Where are you from? | I\'m from Egypt.', 'How do you spell your name? | A-M-I-R.'], tip: '질문을 들으면 [[어느 나라]]인지, [[이름 철자]]인지 먼저 생각해요.' }] }]);
step(1, 2, 'vcards', 1, [{ words: W }]);
step(1, 3, 'wrepeat', 6, [{ words: W }]);
const wc = (word, dir, wrong) => ({ word, dir, wrong });
step(1, 4, 'wchoice', 6, [
  wc('brazil', 'en2ko', ['이집트', '프랑스', '태국']), wc('france', 'en2ko', ['한국', '브라질', '미국']), wc('thailand', 'en2ko', ['이집트', '한국', '프랑스']),
  wc('egypt', 'ko2en', ['Brazil', 'France', 'Korea']), wc('korea', 'ko2en', ['Thailand', 'Egypt', 'France']), wc('us', 'ko2en', ['Brazil', 'Thailand', 'Korea'])]);
step(1, 5, 'kexp', 1, [{ items: [
  ex('Where are you from?', '너는 어느 나라에서 왔니?', '출신 나라를 묻는 말'), ex("I'm from Egypt.", '나는 이집트에서 왔어.', '출신 나라를 말하는 대답'),
  ex('How do you spell your name?', '너의 이름은 철자가 어떻게 되니?', '이름의 철자를 묻는 말'), ex('A-M-I-R.', 'A-M-I-R이야.', '철자를 말하는 대답')] }]);
step(1, 6, 'sdrill', 4, [
  { pic: 'brazil', tpl: "I'm from {}.", words: ['Brazil', 'Egypt', 'France', 'Korea'] },
  { pic: 'thailand', tpl: 'Where are you from, {}?', words: ['Hana', 'Leo', 'Chloe', 'Tom'] },
  { pic: 'korea', tpl: 'My name is {}.', words: ['Hana', 'Leo', 'Chloe', 'Amir'] },
  { pic: 'france', tpl: '{}.', words: ['H-A-N-A', 'L-E-O', 'T-O-M', 'K-A-I'] }]);

// 영상 ① 새 친구 만나는 캠프 (그림 6장: 대사 1-2, 3-4, 5-6, 7-8, 9-10, 11-12)
const V1 = [
  { who: 'Ms. Green', en: 'Welcome to World Friends Camp!', ko: '세계 친구들 캠프에 온 걸 환영해요!' },
  { who: 'Ms. Green', en: "Let's say hello to our new friends.", ko: '새 친구들에게 인사해요.' },
  { who: 'Hana', en: 'Hello. My name is Hana.', ko: '안녕. 내 이름은 하나야.' },
  { who: 'Hana', en: 'Nice to meet you.', ko: '만나서 반가워.' },
  { who: 'Leo', en: "Hi, I'm Leo.", ko: '안녕, 나는 레오야.' },
  { who: 'Leo', en: 'Nice to meet you, too.', ko: '나도 만나서 반가워.' },
  { who: 'Hana', en: 'Where are you from, Leo?', ko: '레오, 너는 어느 나라에서 왔니?' },
  { who: 'Leo', en: "I'm from Brazil.", ko: '나는 브라질에서 왔어.' },
  { who: 'Leo', en: 'Where are you from, Chloe?', ko: '클로이, 너는 어느 나라에서 왔니?' },
  { who: 'Chloe', en: "I'm from France.", ko: '나는 프랑스에서 왔어.' },
  { who: 'Tom', en: "Hi, I'm Tom. I'm from the U.S.", ko: '안녕, 나는 톰이야. 나는 미국에서 왔어.' },
  { who: 'Ms. Green', en: 'Welcome, everyone!', ko: '모두 환영해요!' }];
step(1, 7, 'scene', 3, [{ title: '세계 친구들 캠프 ①', sub: 'en', replay: 2, review: true, pic: 'france', scenes: V1,
  explain: ['[[Where are you from?]]은 "너는 어느 나라에서 왔니?"라고 묻는 말이에요.', '대답은 [[I\'m from]] 뒤에 나라 이름을 붙여요. (I\'m from Brazil.)', '미국은 [[I\'m from the U.S.]]처럼 the 를 붙여 말해요.', '"Welcome to … (…에 온 걸 환영해요)", "Let\'s say hello (인사해요)"는 이 장면에서만 나오는 말이에요. 뜻만 알아 두세요.'],
  qs: [{ t: 'mc', q: "레오가 \"I'm from Brazil.\"이라고 말한 뜻은 무엇인가요?", ans: '나는 브라질에서 왔어.', wrong: ['나는 프랑스에서 왔어.', '나는 레오야.'] }, { t: 'mc', q: '클로이는 어느 나라에서 왔나요?', ans: '프랑스', wrong: ['브라질', '미국'] }, { t: 'mc', q: '톰은 어느 나라에서 왔나요?', ans: '미국', wrong: ['한국', '이집트'] }] }]);
// 영상 ② 새로 온 친구 (그림 5장: 대사 1-2, 3-4, 5-7, 8-9, 10)
const V2 = [
  { who: 'Mr. Brown', en: 'Good morning, class.', ko: '좋은 아침이에요, 여러분.' },
  { who: 'Mr. Brown', en: 'We have a new friend today.', ko: '오늘 새 친구가 왔어요.' },
  { who: 'Amir', en: "Hello. I'm Amir.", ko: '안녕. 나는 아미르야.' },
  { who: 'Amir', en: 'Nice to meet you all.', ko: '모두 만나서 반가워.' },
  { who: 'Hana', en: 'Hi, Amir. Where are you from?', ko: '안녕, 아미르. 너는 어느 나라에서 왔니?' },
  { who: 'Amir', en: "I'm from Egypt.", ko: '나는 이집트에서 왔어.' },
  { who: 'Leo', en: 'Cool!', ko: '멋지다!' },
  { who: 'Mr. Brown', en: 'How do you spell your name?', ko: '이름의 철자가 어떻게 되니?' },
  { who: 'Amir', en: 'A-M-I-R.', ko: 'A-M-I-R이에요.' },
  { who: 'Mr. Brown', en: 'Welcome, Amir.', ko: '환영해요, 아미르.' }];
step(1, 8, 'scene', 3, [{ title: '새로 온 친구', sub: 'en', replay: 2, review: true, pic: 'egypt', scenes: V2,
  explain: ['[[Nice to meet you all.]]은 여러 명에게 "모두 만나서 반가워."라고 인사하는 말이에요.', '이름의 철자는 [[How do you spell your name?]]으로 묻고, 알파벳을 하나씩 읽어 대답해요. (A-M-I-R.)', '[[Where are you from?]]에는 [[I\'m from]] 뒤에 나라 이름을 붙여 대답해요.', '"Good morning(좋은 아침)", "We have a new friend(새 친구가 왔어요)", "Cool!(멋지다!)"은 이 장면에서만 나오는 말이에요. 뜻만 알아 두세요.'],
  qs: [{ t: 'mc', q: '아미르는 어느 나라에서 왔나요?', ans: '이집트', wrong: ['태국', '브라질'] }, { t: 'mc', q: "선생님이 \"How do you spell your name?\"이라고 물은 뜻은 무엇인가요?", ans: '이름의 철자가 어떻게 되니?', wrong: ['너는 어느 나라에서 왔니?', '만나서 반가워.'] }, { t: 'mc', q: '아미르의 이름 철자는 무엇인가요?', ans: 'A-M-I-R', wrong: ['A-M-Y', 'A-N-I-R'] }] }]);
const qrot = (key, others, say, a) => { const o = [...others]; o.splice(a, 0, key); return { q: '어느 나라에서 왔다고 말하고 있나요?', say, replay: 2, opts: o.map((k) => opt(k, k)), a }; };
step(1, 9, 'lchpic', 6, [
  qrot('korea', ['brazil', 'egypt', 'france'], "Teacher(woman): Where are you from?\nHana(girl): I'm from Korea.", 0),
  qrot('france', ['thailand', 'korea', 'us'], "Chloe(girl): Hi, I'm Chloe.\nTom(boy): Where are you from?\nChloe(girl): I'm from France.", 1),
  qrot('egypt', ['brazil', 'korea', 'thailand'], "Hana(girl): Where are you from?\nAmir(boy): I'm from Egypt.", 2),
  qrot('us', ['france', 'egypt', 'brazil'], "Leo(boy): Where are you from?\nTom(boy): I'm from the U.S.", 3),
  qrot('thailand', ['us', 'korea', 'france'], "Teacher(man): Where are you from, Kai?\nKai(boy): I'm from Thailand.", 0),
  qrot('brazil', ['egypt', 'us', 'thailand'], "Zoe(girl): Where are you from?\nLucas(boy): I'm from Brazil.", 2)]);
step(1, 10, 'vmatch', 1, [{ words: W }]);

/* ===== 2차시 Listen & Speak ===== */
const wsc = (word, wko, sent, ko, pic) => ({ word, wko, sent, ko, pic });
step(2, 0, 'wsent', 6, [{ cards: [
  wsc('Brazil', '브라질', "I'm from Brazil.", '나는 브라질에서 왔어.', 'brazil'), wsc('Egypt', '이집트', "I'm from Egypt.", '나는 이집트에서 왔어.', 'egypt'),
  wsc('France', '프랑스', "I'm from France.", '나는 프랑스에서 왔어.', 'france'), wsc('Korea', '한국', "I'm from Korea.", '나는 한국에서 왔어.', 'korea'),
  wsc('Thailand', '태국', "I'm from Thailand.", '나는 태국에서 왔어.', 'thailand'), wsc('U.S.', '미국', "I'm from the U.S.", '나는 미국에서 왔어.', 'us')] }]);
step(2, 1, 'tapl', 1, [{ items: [
  ex('Where are you from?', '너는 어느 나라에서 왔니?'), ex("I'm from Korea.", '나는 한국에서 왔어.'), ex('How do you spell your name?', '너의 이름은 철자가 어떻게 되니?'),
  ex('H-A-N-A.', 'H-A-N-A야.'), ex("I'm from the U.S.", '나는 미국에서 왔어.'), ex('L-E-O.', 'L-E-O야.')] }]);
step(2, 2, 'lcardt', 1, [{ inst: '출신 나라를 말하는 법을 익혀요.', items: [
  ex("I'm from Brazil.", '나는 브라질에서 왔어.'), ex("I'm from Egypt.", '나는 이집트에서 왔어.'), ex("I'm from France.", '나는 프랑스에서 왔어.'),
  ex("I'm from Korea.", '나는 한국에서 왔어.'), ex("I'm from Thailand.", '나는 태국에서 왔어.'), ex("I'm from the U.S.", '나는 미국에서 왔어.')] }]);
// 영상 ③ 도서관 카드 만들기 (그림 4장: 대사 1-2, 3-4, 5-6, 7-9)
const V3 = [
  { who: 'Ms. Park', en: 'Hello. Nice to meet you.', ko: '안녕. 만나서 반가워.' },
  { who: 'Kai', en: 'Nice to meet you, too.', ko: '저도 만나서 반가워요.' },
  { who: 'Ms. Park', en: "What's your name?", ko: '이름이 뭐니?' },
  { who: 'Kai', en: 'My name is Kai.', ko: '제 이름은 카이예요.' },
  { who: 'Ms. Park', en: 'How do you spell your name?', ko: '이름의 철자가 어떻게 되니?' },
  { who: 'Kai', en: 'K-A-I.', ko: 'K-A-I예요.' },
  { who: 'Ms. Park', en: 'Where are you from, Kai?', ko: '카이, 너는 어느 나라에서 왔니?' },
  { who: 'Kai', en: "I'm from Thailand.", ko: '저는 태국에서 왔어요.' },
  { who: 'Ms. Park', en: 'Welcome to our library!', ko: '우리 도서관에 온 걸 환영해!' }];
step(2, 3, 'scenerep', 2, [{ title: '도서관 카드 만들기', sub: 'en', replay: 2, review: true, pic: 'thailand', scenes: V3,
  explain: ['이름의 철자는 [[How do you spell your name?]]으로 묻고, [[K-A-I.]]처럼 알파벳을 하나씩 말해요.', '[[Where are you from?]]에는 [[I\'m from Thailand.]]처럼 대답해요.', '"What\'s your name?(이름이 뭐니?)", "My name is …(제 이름은 …예요)", "Welcome to …(…에 온 걸 환영해)"은 이 장면에서만 나오는 말이에요. 뜻만 알아 두세요.'],
  qs: [{ t: 'mc', q: 'What does Ms. Park say to ask the spelling?', ans: 'How do you spell your name?', wrong: ["What's your name?", 'Where are you from?'] }, { t: 'mc', q: "How do you spell Kai's name?", ans: 'K-A-I', wrong: ['K-I-A', 'C-A-I'] }, { t: 'mc', q: 'Where is Kai from?', ans: 'Thailand.', wrong: ['Korea.', 'Brazil.'] }] }]);
// 영상 ④ 공원에서 새 친구 소개 (그림 4장: 대사 1-2, 3-5, 6-8, 9)
const V4 = [
  { who: 'Yuna', en: 'Hi, Zoe.', ko: '안녕, 조이.' },
  { who: 'Yuna', en: 'This is my new friend, Lucas.', ko: '이쪽은 내 새 친구 루카스야.' },
  { who: 'Lucas', en: "Hi, I'm Lucas.", ko: '안녕, 나는 루카스야.' },
  { who: 'Zoe', en: 'Where are you from?', ko: '너는 어느 나라에서 왔니?' },
  { who: 'Lucas', en: "I'm from Brazil.", ko: '나는 브라질에서 왔어.' },
  { who: 'Zoe', en: 'Nice to meet you, Lucas.', ko: '만나서 반가워, 루카스.' },
  { who: 'Zoe', en: 'How do you spell your name?', ko: '이름의 철자가 어떻게 되니?' },
  { who: 'Lucas', en: 'L-U-C-A-S.', ko: 'L-U-C-A-S야.' },
  { who: 'Yuna', en: "Come here. Let's play soccer together.", ko: '이리 와. 같이 축구하자.' }];
step(2, 4, 'scenerep', 2, [{ title: '공원에서 새 친구', sub: 'en', replay: 2, review: true, pic: 'brazil', scenes: V4,
  explain: ['[[Where are you from?]]에는 [[I\'m from Brazil.]]처럼 [[I\'m from]] 뒤에 나라 이름을 붙여 대답해요.', '이름의 철자는 [[How do you spell your name?]]으로 묻고, 알파벳을 하나씩 말해요. (L-U-C-A-S.)', '"This is my new friend(이쪽은 내 새 친구야)", "Let\'s play soccer(축구하자)"는 이 장면에서만 나오는 말이에요. 뜻만 알아 두세요.'],
  qs: [{ t: 'mc', q: 'Where is Lucas from?', ans: 'Brazil.', wrong: ['France.', 'Egypt.'] }, { t: 'mc', q: 'What does Zoe say to ask where he is from?', ans: 'Where are you from?', wrong: ['How do you spell your name?', 'Nice to meet you, Lucas.'] }, { t: 'mc', q: "How do you spell Lucas's name?", ans: 'L-U-C-A-S', wrong: ['L-U-K-A-S', 'L-O-C-A-S'] }] }]);
step(2, 5, 'lmatch', 4, [{ pairs: [
  { left: 'Hana', say: "Where are you from? I'm from Korea.", right: 'korea' }, { left: 'Leo', say: "Where are you from? I'm from Brazil.", right: 'brazil' },
  { left: 'Chloe', say: "Where are you from? I'm from France.", right: 'france' }, { left: 'Kai', say: "Where are you from? I'm from Thailand.", right: 'thailand' }] }]);
const lt = (q, say, opts, a) => ({ q, say, replay: 2, opts: opts.map((t) => opt(t)), a });
const cd = (who, tag, c) => `Teacher(woman): Where are you from?\n${who}(${tag}): I'm from ${c}.`;
const sp = (who, tag, letters) => `Teacher(woman): How do you spell your name?\n${who}(${tag}): ${letters}.`;
step(2, 6, 'lchtext', 6, [
  lt('어느 나라에서 왔나요?', cd('Hana', 'girl', 'Korea'), ['Brazil', 'Korea', 'Egypt', 'France'], 1),
  lt('어느 나라에서 왔나요?', cd('Leo', 'boy', 'Brazil'), ['Thailand', 'France', 'Brazil', 'Egypt'], 2),
  lt('어느 나라에서 왔나요?', cd('Amir', 'boy', 'Egypt'), ['Egypt', 'Korea', 'Thailand', 'Brazil'], 0),
  lt('이름의 철자는 무엇인가요?', sp('Hana', 'girl', 'H-A-N-A'), ['H-A-N-A', 'H-A-N-N-A', 'H-A-M-A', 'H-O-N-A'], 0),
  lt('이름의 철자는 무엇인가요?', sp('Leo', 'boy', 'L-E-O'), ['L-O-E', 'L-E-A', 'L-E-O', 'R-E-O'], 2),
  lt('이름의 철자는 무엇인가요?', sp('Tom', 'boy', 'T-O-M'), ['D-O-M', 'T-O-M', 'T-A-M', 'T-O-N'], 1)]);
step(2, 7, 'lmwrite', 4, [{ pairs: [
  { left: 'Hana', say: "Hana: Where are you from?\nChloe: I'm from France.", ans: 'France' }, { left: 'Leo', say: "Leo: Where are you from?\nKai: I'm from Thailand.", ans: 'Thailand' },
  { left: 'Zoe', say: "Zoe: How do you spell your name?\nLucas: L-U-C-A-S.", ans: 'L-U-C-A-S' }, { left: 'Tom', say: "Tom: How do you spell your name?\nYuna: Y-U-N-A.", ans: 'Y-U-N-A' }],
  hint: ['들은 나라 이름이나 알파벳을 써요. 나라 이름은 대문자로 시작해요. 예: Korea'] }]);
const ln = (q, opts, ans) => ({ q, opts, ans, plays: 2, inst: '들려주는 말에 이어질 말을 골라요.' });
step(2, 8, 'lnum', 5, [
  ln('Where are you from?', ["I'm Hana.", "I'm from Korea.", 'H-A-N-A.'], 2),
  ln('Where are you from?', ["I'm from Egypt.", 'A-M-I-R.', 'Nice to meet you.'], 1),
  ln('How do you spell your name?', ["I'm from France.", 'L-E-O.', "I'm Leo."], 2),
  ln('How do you spell your name?', ['T-O-M.', "I'm from the U.S.", 'Where are you from?'], 1),
  ln('Hi, I\'m Chloe. Where are you from?', ["I'm from France.", 'C-H-L-O-E.', 'Nice to meet you, too.'], 1)]);
step(2, 9, 'role', 2, [
  { pic: 'korea', lines: ['A: Hello. Where are you from?', "B: I'm from {{Korea}}.", 'A: How do you spell your name?', 'B: [[H-A-N-A]].'] },
  { pic: 'brazil', lines: ['A: Hi. Where are you from?', "B: I'm from {{Brazil}}.", 'A: How do you spell your name?', 'B: [[L-E-O]].'] }]);

module.exports = { S, W, VOCAB, ex, opt, lt, ln, G1, G2 };
