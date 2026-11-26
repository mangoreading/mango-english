// 3·4차시 (Lesson 1 흐름: 3차시 pos 1,2,5,7,8,10,11,12,13 / 4차시 pos 0~4)
const { S, ex, opt } = require('./part1.cjs');
const TAG = { raloud: 'speak', dreadt: 'speak', sscram: 'write', saykor: 'speak', lookspeak: 'speak', mtext: 'read', sqtf: 'read', scloze: 'read', mfree: 'write', sfill: 'write', sscramr: 'write', lspeak: 'speak', pread: 'read' };
const step = (lesson, pos, kind, qty, items) => S.push({ lesson, pos, kind, qty, tag: TAG[kind], items: items.map((p) => ({ k: kind, tag: TAG[kind], ...p })) });

/* ===== 3차시 Ask & Answer ===== */
step(3, 1, 'raloud', 11, [
  'Where are you from?', "I'm from Korea.", "I'm from Brazil.", "I'm from Egypt.", "I'm from France.", "I'm from Thailand.", "I'm from the U.S.",
  'How do you spell your name?', 'H-A-N-A.', 'Nice to meet you.', 'My name is Leo.'].map((target) => ({ target, stars: true, fluency: true })));
step(3, 2, 'dreadt', 4, [
  { lines: ['A: Where are you from?', "B: I'm from Korea.", 'A: Nice to meet you.'] },
  { lines: ['A: Where are you from?', "B: I'm from Brazil.", 'A: Cool!'] },
  { lines: ['A: How do you spell your name?', 'B: H-A-N-A.', 'A: Thank you.'] },
  { lines: ["A: Hi, I'm Chloe.", 'B: Hi, Chloe. Where are you from?', "A: I'm from France."] }]);
const sc = (ko, ans, extra) => ({ ko, ans, extra });
step(3, 5, 'sscram', 6, [
  sc('너는 어느 나라에서 왔니?', 'Where are you from?', ['is']), sc('나는 프랑스에서 왔어.', "I'm from France.", ['in']),
  sc('너의 이름은 철자가 어떻게 되니?', 'How do you spell your name?', ['does']), sc('나는 이집트에서 왔어.', "I'm from Egypt.", ['at']),
  sc('만나서 반가워.', 'Nice to meet you.', ['see']), sc('나는 미국에서 왔어.', "I'm from the U.S.", ['a'])]);
const sk = (ko, target, koHl) => ({ ko, target, ...(koHl ? { koHl } : {}) });
step(3, 7, 'saykor', 6, [
  sk('너는 어느 나라에서 왔니?', 'Where are you from?', '어느 나라'), sk('나는 한국에서 왔어.', "I'm from Korea.", '한국'),
  sk('너의 이름은 철자가 어떻게 되니?', 'How do you spell your name?', '철자'), sk('내 이름 철자는 H-A-N-A야.', 'H-A-N-A.', 'H-A-N-A'),
  sk('내 이름 철자는 L-E-O야.', 'L-E-O.', 'L-E-O'), sk('나는 미국에서 왔어.', "I'm from the U.S.", '미국')]);
const ls = (k, label, t) => ({ pic: k, label, target: t });
step(3, 8, 'lookspeak', 6, [
  ls('korea', 'Hana', "I'm from Korea."), ls('brazil', 'Leo', "I'm from Brazil."), ls('france', 'Chloe', "I'm from France."),
  ls('egypt', 'Amir', "I'm from Egypt."), ls('thailand', 'Kai', "I'm from Thailand."), ls('us', 'Tom', "I'm from the U.S.")]);
const MT1 = { title: 'Name Card', text: ['Hello. My name is [[Leo]].', '[[L-E-O]].', "I'm from [[Brazil]].", 'Nice to meet you.'],
  explain: ['먼저 {{이름}}을 말하며 인사합니다.', '이름의 {{철자}}를 알파벳 하나씩 말합니다.', '{{어느 나라}}에서 왔는지 말합니다.', '처음 만난 친구에게 인사합니다.'], ko: '안녕. 내 이름은 레오야.\nL-E-O야.\n나는 브라질에서 왔어.\n만나서 반가워.' };
const MT2 = { title: 'Name Card', text: ['Hello. My name is [[Zoe]].', '[[Z-O-E]].', "I'm from the [[U.S.]].", 'Nice to meet you.'],
  explain: ['먼저 {{이름}}을 말하며 인사합니다.', '이름의 {{철자}}를 알파벳 하나씩 말합니다.', '{{어느 나라}}에서 왔는지 말합니다.', '처음 만난 친구에게 인사합니다.', '미국은 the U.S. 처럼 the 를 붙여요.'], ko: '안녕. 내 이름은 조이야.\nZ-O-E야.\n나는 미국에서 왔어.\n만나서 반가워.' };
const plain = (t) => t.replace(/\[\[|\]\]|\{\{|\}\}/g, '');
step(3, 10, 'mtext', 2, [MT1, MT2]);
step(3, 11, 'sqtf', 2, [
  { title: 'Name Card', text: MT1.text.map(plain), ko: MT1.ko, pic: 'brazil', items: [{ t: 'Leo is from Brazil.', a: true }, { t: 'Leo is from Egypt.', a: false }, { t: "Leo's name is L-E-O.", a: true }] },
  { title: 'Name Card', text: MT2.text.map(plain), ko: MT2.ko, pic: 'us', items: [{ t: 'Zoe is from the U.S.', a: true }, { t: 'Zoe is from Brazil.', a: false }, { t: "Zoe's name is Z-O-E.", a: true }] }]);
const cz = (lines, ans, extra, blankHints) => ({ lines, ans, extra, blankHints });
step(3, 12, 'scloze', 3, [
  cz(['A: {} are you from?', "B: I'm {} Korea."], ['Where', 'from'], ['What', 'in'], ['질문하는 말이에요.', '출신을 말할 때 쓰는 말이에요.']),
  cz(['A: How do you {} your name?', 'B: {}.'], ['spell', 'H-A-N-A'], ['say', 'H-A-N-O'], ['철자를 묻는 말이에요.', '알파벳을 하나씩 써요.']),
  cz(['A: Where are {} from?', "B: I'm from the {}."], ['you', 'U.S.'], ['we', 'U.K.'], ['상대방을 가리키는 말이에요.', '나라 이름이에요.'])]);
step(3, 13, 'mfree', 2, [
  { topicLabel: '나라', topic: 'korea', lines: ['Hello. My name is {}.', '{}.', "I'm from {}."], lineHints: ['내 이름을 써요. (예: Hana)', '내 이름의 철자를 알파벳 하나씩 - 로 이어 써요. (예: H-A-N-A)', '나라 이름은 대문자로 시작해요. (예: Korea)'], hint: ['Hello. My name is Hana.'] },
  { topicLabel: '나라', topic: 'brazil', lines: ["Hi, I'm {}.", '{}.', "I'm from {}."], lineHints: ['내 이름을 써요. (예: Leo)', '내 이름의 철자를 알파벳 하나씩 - 로 이어 써요. (예: L-E-O)', '나라 이름은 대문자로 시작해요. (예: Brazil)'], hint: ["Hi, I'm Leo."] }]);

/* ===== 4차시 Read & Understand ===== */
const sf = (ko, tpl, ans) => ({ ko, tpl, ans });
step(4, 0, 'sfill', 10, [
  sf('너는 어느 나라에서 왔니?', 'Where {} you from?', 'are'), sf('나는 프랑스에서 왔어.', "I'm {} France.", 'from'),
  sf('나는 브라질에서 왔어.', "I'm from {}.", 'Brazil'), sf('너의 이름은 철자가 어떻게 되니?', 'How do you {} your name?', 'spell'),
  sf('나는 한국에서 왔어.', "I'm from {}.", 'Korea'), sf('너는 어느 나라에서 왔니?', 'Where are {} from?', 'you'),
  sf('내 이름의 철자를 말해요. (Leo)', '{}.', 'L-E-O'), sf('나는 미국에서 왔어.', "I'm from the {}.", 'U.S.'),
  sf('내 이름의 철자를 말해요. (Amir)', '{}.', 'A-M-I-R'), sf('만나서 반가워.', 'Nice to {} you.', 'meet')]);
const sr = (q, ans, extra) => ({ q, ans, extra });
step(4, 1, 'sscramr', 3, [
  sr('Where are you from?', "I'm from Korea.", ['in']), sr('Nice to meet you.', 'Nice to meet you, too.', ['see']), sr('Hi, I\'m Leo. Where are you from?', "I'm from Brazil.", ['at'])]);
const sp = (ask, ko, target) => ({ ask, ko, target });
step(4, 2, 'lspeak', 6, [
  sp('Where are you from?', '한국에서 왔다고 대답해요', "I'm from Korea."), sp('Where are you from?', '프랑스에서 왔다고 대답해요', "I'm from France."), sp('Where are you from?', '이집트에서 왔다고 대답해요', "I'm from Egypt."),
  sp('Where are you from?', '미국에서 왔다고 대답해요', "I'm from the U.S."), sp('How do you spell your name? (이름: Leo)', '이름 철자를 말해요', 'L-E-O.'), sp('How do you spell your name? (이름: Tom)', '이름 철자를 말해요', 'T-O-M.')]);
step(4, 3, 'pread', 2, [{
  text: ['Hi! My name is Hana.', "I'm from Korea.", "I'm a student.", 'I like drawing.', '---', 'This is my pen pal, Leo.', "He's from Brazil.", 'He likes soccer.', 'Where are you from?'],
  ko: '안녕! 내 이름은 하나야.\n나는 한국에서 왔어.\n나는 학생이야.\n나는 그림 그리기를 좋아해.\n---\n이쪽은 내 펜팔 친구 레오야.\n레오는 브라질에서 왔어.\n레오는 축구를 좋아해.\n너는 어느 나라에서 왔니?',
  qs: [{ t: 'mc', q: 'Where is Leo from?', ans: 'Brazil', wrong: ['Korea', 'France'] }, { t: 'tf', lines: ['Hana is from Korea. | T', 'Hana likes soccer. | F', 'Leo likes soccer. | T'] }] }]);
step(4, 4, 'pread', 2, [{
  text: ["I'm from Egypt.", 'I live near the big pyramids.', 'I like riding camels.', 'I can run fast.', 'Who am I?', '---', "I'm Amir.", 'How do you spell my name?', 'A-M-I-R.'],
  ko: '나는 이집트에서 왔어.\n나는 큰 피라미드 근처에 살아.\n나는 낙타 타는 것을 좋아해.\n나는 빨리 달릴 수 있어.\n나는 누구일까?\n---\n나는 아미르야.\n내 이름은 철자가 어떻게 될까?\nA-M-I-R.',
  qs: [{ t: 'mc', q: 'Where is Amir from?', ans: 'Egypt', wrong: ['Thailand', 'Brazil'] }, { t: 'tf', lines: ['Amir likes riding camels. | T', 'Amir is from France. | F', 'Amir can run fast. | T'] }] }]);

module.exports = { S, plain };
