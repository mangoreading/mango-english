// 5·6차시 (Lesson 1 흐름: 5차시 pos 0~6 / 6차시 pos 0~8, 12, 13)
const { S, W, ex, opt } = require('./part1.cjs');
require('./part2.cjs');
const TAG = { dfill: 'write', mtext: 'read', sscram: 'write', mwbank: 'write', mfree: 'write', present: 'write', aitalk: 'speak', vwrite: 'vocab', lchlist: 'listen', lpmatch: 'listen', lblank: 'listen', looktalk: 'speak', dfillt: 'write', sqset: 'read', lmatch: 'listen', sbuild: 'write', lnum: 'listen' };
const step = (lesson, pos, kind, qty, items) => S.push({ lesson, pos, kind, qty, tag: TAG[kind], items: items.map((p) => ({ k: kind, tag: TAG[kind], ...p })) });

/* ===== 5차시 Master & Expand (나의 영웅 소개하기) ===== */
const dfp = (pic, tag2, lines, ans, blankHints) => ({ pic, tag2, lines, ans, blankHints });
const FR = ['A: {} are you from?', "B: I'm {} {}."];
const bh = ['질문하는 말이에요.', '출신을 말할 때 쓰는 말이에요.', '나라 이름이에요.'];
step(5, 0, 'dfill', 6, [
  dfp('korea', '한국', FR, ['Where', 'from', 'Korea'], bh), dfp('brazil', '브라질', FR, ['Where', 'from', 'Brazil'], bh), dfp('france', '프랑스', FR, ['Where', 'from', 'France'], bh),
  dfp('egypt', '이집트', FR, ['Where', 'from', 'Egypt'], bh), dfp('thailand', '태국', FR, ['Where', 'from', 'Thailand'], bh),
  dfp('us', '미국', ['A: Where are you {}?', "B: I'm from the {}."], ['from', 'U.S.'], ['질문 끝에 오는 말이에요.', '나라 이름이에요.'])]);
const MDX = ['먼저 {{이름}}을 말합니다.', '이름의 {{철자}}를 알파벳 하나씩 말합니다.', '{{출신 나라}}를 말합니다.', '처음 만난 친구에게 인사합니다.'];
const MD1 = { title: 'My Hero', text: ['My name is [[Max]].', '[[M-A-X]].', "I'm from [[Brazil]].", 'Nice to meet you.'], explain: MDX, ko: '내 이름은 맥스야.\nM-A-X야.\n나는 브라질에서 왔어.\n만나서 반가워.' };
const MD2 = { title: 'My Hero', text: ['My name is [[Zia]].', '[[Z-I-A]].', "I'm from [[Egypt]].", 'Nice to meet you.'], explain: MDX, ko: '내 이름은 지아야.\nZ-I-A야.\n나는 이집트에서 왔어.\n만나서 반가워.' };
step(5, 1, 'mtext', 2, [MD1, MD2]);
const sc = (ko, ans, extra) => ({ ko, ans, extra });
step(5, 2, 'sscram', 4, [
  sc('내 이름은 맥스야.', 'My name is Max.', ['is a']), sc('나는 브라질에서 왔어.', "I'm from Brazil.", ['in']),
  sc('너의 이름은 철자가 어떻게 되니?', 'How do you spell your name?', ['does']), sc('너는 어느 나라에서 왔니?', 'Where are you from?', ['is'])]);
const MWL = ['My name is {}.', '{}.', "I'm from {}."];
const MWH = ['영웅의 이름이에요.', '이름의 철자를 알파벳 하나씩 말해요.', '나라 이름이에요.'];
step(5, 3, 'mwbank', 2, [
  { lines: MWL, ans: ['Max', 'M-A-X', 'Brazil'], extra: ['Leo', 'France'], blankHints: MWH },
  { lines: MWL, ans: ['Zia', 'Z-I-A', 'Egypt'], extra: ['Kai', 'Korea'], blankHints: MWH }]);
const MFH = ['나의 영웅 이름을 써요. (예: Max)', '영웅 이름의 철자를 알파벳 하나씩 - 로 이어 써요. (예: M-A-X)', '나라 이름은 대문자로 시작해요. (예: Brazil)'];
step(5, 4, 'mfree', 2, [
  { topicLabel: '나의 영웅', topic: 'brazil', lines: MWL, lineHints: MFH, hint: ['My name is Max.'] },
  { topicLabel: '나의 영웅', topic: 'egypt', lines: MWL, lineHints: MFH, hint: ['My name is Zia.'] }]);
step(5, 5, 'present', 1, [{ text: MD1.text }]);
step(5, 6, 'aitalk', 1, [{ situation: '새로 만난 친구에게 어느 나라에서 왔는지와 이름의 철자를 묻고 답해요', role: '새 친구 (New Friend)', open: "Hi! I'm Alex. Nice to meet you.", turns: 3,
  hints: ["Nice to meet you, too. Where are you from?", 'How do you spell your name?', "I'm from Korea."], script: [{ ai: "I'm from Canada. How about you?" }, { ai: 'A-L-E-X. And how do you spell your name?' }, { ai: 'Great! Nice to meet you!' }] }]);

/* ===== 6차시 Check-up ===== */
step(6, 0, 'vwrite', 6, [{ words: W }]);
const lc = (q, say, opts, a) => ({ q, say, replay: 2, opts: opts.map((t) => opt(t)), a });
const FROM = (who, tag, c) => `Teacher(woman): Where are you from?\n${who}(${tag}): I'm from ${c}.`;
step(6, 1, 'lchlist', 4, [
  lc('어느 나라에서 왔나요?', FROM('Mina', 'girl', 'Korea'), ['Brazil', 'Korea', 'Egypt', 'France'], 1),
  lc('어느 나라에서 왔나요?', FROM('Tom', 'boy', 'the U.S.'), ['Thailand', 'Korea', 'the U.S.', 'Egypt'], 2),
  lc('이름의 철자는 무엇인가요?', 'Teacher(woman): How do you spell your name?\nMia(girl): M-I-A.', ['M-I-A', 'M-I-O', 'N-I-A', 'M-A-I'], 0),
  lc('이름의 철자는 무엇인가요?', 'Teacher(man): How do you spell your name?\nKen(boy): K-E-N.', ['K-A-N', 'C-E-N', 'K-E-M', 'K-E-N'], 3)]);
step(6, 2, 'lpmatch', 4, [
  { inst: '잘 듣고, 나라와 친구의 이름을 연결해 보세요.', say: "No.1\nTeacher(woman): Where are you from?\nHana(girl): I'm from Korea.\nNo.2\nTeacher(woman): Where are you from?\nLeo(boy): I'm from Brazil.", pairs: [{ pic: 'korea', right: 'Hana' }, { pic: 'brazil', right: 'Leo' }], extra: ['Tom'], hint: ['나라를 말한 친구의 이름을 찾아요.'] },
  { inst: '잘 듣고, 나라와 친구의 이름을 연결해 보세요.', say: "No.1\nTeacher(man): Where are you from?\nAmir(boy): I'm from Egypt.\nNo.2\nTeacher(man): Where are you from?\nChloe(girl): I'm from France.", pairs: [{ pic: 'egypt', right: 'Amir' }, { pic: 'france', right: 'Chloe' }], extra: ['Kai'], hint: ['나라를 말한 친구의 이름을 찾아요.'] }]);
step(6, 3, 'lblank', 4, [
  { inst: '잘 듣고, 어느 나라에서 왔는지 써 봅니다.', say: "Teacher(woman): Where are you from?\nKai(boy): I'm from Thailand.", lines: ["I'm from {}."], ans: ['Thailand'], hint: ['나라 이름을 써요. 대문자로 시작해요.'] },
  { inst: '잘 듣고, 어느 나라에서 왔는지 써 봅니다.', say: "Teacher(man): Where are you from?\nZoe(girl): I'm from the U.S.", lines: ["I'm from the {}."], ans: ['U.S.'], hint: ['미국을 말하는 나라 이름을 써요.'] },
  { inst: '잘 듣고, 이름의 철자를 써 봅니다.', say: "Teacher(woman): How do you spell your name?\nAmy(girl): A-M-Y.", lines: ['{}.'], ans: ['A-M-Y'], hint: ['알파벳을 하나씩 - 로 이어서 써요.'] },
  { inst: '잘 듣고, 이름의 철자를 써 봅니다.', say: "Teacher(man): How do you spell your name?\nEmily(girl): E-M-I-L-Y.", lines: ['{}.'], ans: ['E-M-I-L-Y'], hint: ['알파벳을 하나씩 - 로 이어서 써요.'] }]);
const lk = (pic, label, q, a) => ({ pic, label, turns: [{ target: q }, { target: a }], hint: ['Where are you from? / I\'m from ~.'] });
step(6, 4, 'looktalk', 4, [
  lk('korea', 'Hana', 'Where are you from?', "I'm from Korea."), lk('france', 'Chloe', 'Where are you from?', "I'm from France."),
  lk('egypt', 'Amir', 'Where are you from?', "I'm from Egypt."), lk('us', 'Tom', 'Where are you from?', "I'm from the U.S.")]);
step(6, 5, 'sscram', 6, [
  { ans: 'Where are you from, Mina?', extra: ['is'] }, { ans: "I'm from Thailand.", extra: ['in'] }, { ans: 'How do you spell your name?', extra: ['say'] },
  { ans: 'Nice to meet you, too.', extra: ['see'] }, { ans: "I'm from the U.S.", extra: ['a'] }, { ans: 'My name is Tom.', extra: ['am'] }]);
const dt = (cue, lines, ans) => ({ cue, lines, ans });
step(6, 6, 'dfillt', 4, [
  dt('프랑스 • Chloe', ['A: {} are you from?', "B: {} from France."], ['Where', "I'm|I am"]),
  dt('한국 • Hana', ['A: Where are you {}?', "B: I'm {} Korea."], ['from', 'from']),
  dt('태국 • Kai', ['A: Where {} you from?', "B: I'm from {}."], ['are', 'Thailand']),
  dt('이름 철자 • Leo', ['A: How do you {} your name?', 'B: {}.'], ['spell', 'L-E-O'])]);
step(6, 7, 'sqset', 2, [
  { title: 'Pen Pal', pic: 'brazil', text: ['Hello! My name is Mia.', "I'm from the U.S.", 'I like pizza.', '---', 'My pen pal is Lucas.', "He's from Brazil.", 'He likes soccer.'],
    ko: '안녕! 내 이름은 미아야.\n나는 미국에서 왔어.\n나는 피자를 좋아해.\n---\n내 펜팔 친구는 루카스야.\n루카스는 브라질에서 왔어.\n루카스는 축구를 좋아해.',
    explain: ['[[I\'m from the U.S.]]에서 미아가 어느 나라에서 왔는지 알 수 있어요.', '[[pen pal]]은 편지나 메시지를 주고받는 친구예요.'],
    qs: [{ t: 'mc', q: '미아는 어느 나라에서 왔나요?', ans: '미국', wrong: ['브라질', '한국'], hint: '두 번째 문장을 읽어 보세요.', ev: '2' }, { t: 'mc', q: '루카스가 좋아하는 것은 무엇인가요?', ans: '축구', wrong: ['피자', '음악'], hint: 'likes 가 나오는 문장을 찾아 보세요.', ev: '7' }] },
  { title: 'Who Am I?', pic: 'thailand', text: ["I'm from Thailand.", 'I like animals.', 'I can ride an elephant.', 'Who am I?', '---', 'My name is Kai.', 'K-A-I.'],
    ko: '나는 태국에서 왔어.\n나는 동물을 좋아해.\n나는 코끼리를 탈 수 있어.\n나는 누구일까?\n---\n내 이름은 카이야.\nK-A-I.',
    explain: ['[[I\'m from Thailand.]]에서 나라를 알 수 있어요.', '[[I can …]]은 "나는 …을 할 수 있어"라는 뜻이에요.'],
    qs: [{ t: 'mc', q: '카이는 어느 나라에서 왔나요?', ans: '태국', wrong: ['이집트', '프랑스'], hint: '첫 번째 문장을 읽어 보세요.', ev: '1' }, { t: 'tf', lines: ['Kai likes animals. | T', 'Kai is from Korea. | F', "Kai's name is K-A-I. | T"], hint: '나라와 이름 철자를 확인해 보세요.', ev: '1,2,7' }] }]);
step(6, 8, 'lmatch', 6, [{ pairs: [
  { left: 'Hana', say: "Where are you from? I'm from Korea.", right: 'korea' }, { left: 'Leo', say: "Where are you from? I'm from Brazil.", right: 'brazil' },
  { left: 'Chloe', say: "Where are you from? I'm from France.", right: 'france' }, { left: 'Amir', say: "Where are you from? I'm from Egypt.", right: 'egypt' },
  { left: 'Kai', say: "Where are you from? I'm from Thailand.", right: 'thailand' }, { left: 'Tom', say: "Where are you from? I'm from the U.S.", right: 'us' }] }]);
const sb = (ko, ans, alts, starter) => ({ ko, ans, ...(alts ? { alts } : {}), ...(starter ? { starter } : {}) });
step(6, 12, 'sbuild', 4, [
  sb('레오, 너는 어느 나라에서 왔니?', 'Where are you from, Leo?', null, 'Where'), sb('나는 이집트에서 왔어.', "I'm from Egypt.", ["I am from Egypt."], "I'm"),
  sb('내 이름은 카이야.', 'My name is Kai.', null, 'My'), sb('너의 이름은 철자가 어떻게 되니?', 'How do you spell your name?', null, 'How')]);
const ln = (q, opts, ans) => ({ q, opts, ans, plays: 2, inst: '들려주는 말에 이어질 말을 골라요.' });
step(6, 13, 'lnum', 3, [
  ln('Where are you from?', ["I'm Leo.", "I'm from Brazil.", 'L-E-O.'], 2),
  ln('How do you spell your name?', ['H-A-N-A.', "I'm from Korea.", 'Nice to meet you.'], 1),
  ln('Hi, I\'m Kai. Nice to meet you.', ["I'm from Thailand.", 'Nice to meet you, too.', 'K-A-I.'], 2)]);

module.exports = { S };
