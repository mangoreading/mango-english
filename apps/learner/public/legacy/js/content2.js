/* Mango English · 비상교육 초5 Lesson 9 "How Much Are These Socks?"  (CORE 중심 재작업)
 * - 범위는 교과서(어휘 6 · 표현 2 · this/these · Look at ~ · on sale)에 맞추고, 연습 활동은 자체 제작입니다(교과서 활동을 옮기지 않음).
 * - QR 음원/영상은 사용하지 않고 모든 듣기는 TTS(MG.say)로 재생합니다.
 * - CORE가 기준. SUPPORT = 같은 틀에서 쉬운 변형(어휘 4개·힌트 많음), ADVANCED = 같은 범위를 압축하고 확장/종합 과제를 더함.
 * - 7차시 Check는 Wrap Up 영역(듣기·말하기·읽기·쓰기)을 새 문항으로 짧게 확인, 6차시는 점수 없는 통합 미션, 8차시는 결과별 맞춤.
 */
(function () {
  const MG = window.MG;
  const rng = MG.rng;
  const isS = (L) => L === 'SUPPORT';
  const isA = (L) => L === 'ADVANCED';
  const by = (L, s, c, a) => (L === 'SUPPORT' ? s() : L === 'CORE' ? c() : a());
  const F = (...p) => p.flat();
  const UP = { SUPPORT: 'CORE', CORE: 'ADVANCED', ADVANCED: 'ADVANCED' };

  /* ---------- 기본 데이터 (교과서 L9) ---------- */
  const IT = {
    hat: { n: 'hat', a: 'a hat', ko: '모자', pl: 0, pr: 10000 },
    sunglasses: { n: 'sunglasses', a: 'sunglasses', ko: '선글라스', pl: 1, pr: 13000 },
    jacket: { n: 'jacket', a: 'a jacket', ko: '재킷', pl: 0, pr: 30000 },
    shorts: { n: 'shorts', a: 'shorts', ko: '반바지', pl: 1, pr: 15000 },
    socks: { n: 'socks', a: 'socks', ko: '양말', pl: 1, pr: 2000 },
    shoes: { n: 'shoes', a: 'shoes', ko: '신발', pl: 1, pr: 50000 },
  };
  Object.keys(IT).forEach((k) => (IT[k].en = IT[k].a));
  MG.ITEMS = IT;
  const POOL = {
    SUPPORT: ['hat', 'socks', 'shoes', 'jacket'],
    CORE: ['hat', 'sunglasses', 'jacket', 'shorts', 'socks', 'shoes'],
    ADVANCED: ['hat', 'sunglasses', 'jacket', 'shorts', 'socks', 'shoes'],
  };
  const PEOPLE = {
    mina: { n: 'Mina', c: 'hat', g: 'she', col: '#FF7A59' },
    ken: { n: 'Ken', c: 'sunglasses', g: 'he', col: '#3A9BFF' },
    lily: { n: 'Lily', c: 'jacket', g: 'she', col: '#22B07D' },
    tom: { n: 'Tom', c: 'shorts', g: 'he', col: '#7B61FF' },
    mia: { n: 'Mia', c: 'socks', g: 'she', col: '#FF5C7A' },
    wei: { n: 'Wei', c: 'shoes', g: 'he', col: '#12B5C2' },
  };
  const peopleIn = (L) => Object.keys(PEOPLE).filter((k) => POOL[L].includes(PEOPLE[k].c));

  /* ---------- 문장 도우미 ---------- */
  const W = { 2: 'two', 10: 'ten', 13: 'thirteen', 15: 'fifteen', 20: 'twenty', 30: 'thirty', 50: 'fifty', 5: 'five', 3: 'three', 7: 'seven' };
  const pw = (p) => `${W[p / 1000]} thousand`;
  const pd = (p) => String(p).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const pn = (id) => IT[id].n;
  const isv = (id) => (IT[id].pl ? 'are' : 'is');
  const itp = (id) => (IT[id].pl ? 'they' : 'it');
  const dm = (id) => (IT[id].pl ? 'these' : 'this');
  const D = (id) => `${dm(id)} ${pn(id)}`; // these socks / this hat
  const Q = (id) => `How much ${isv(id)} ${D(id)}?`;
  const QI = (id) => `How much ${isv(id)} ${itp(id)}?`;
  const QT = (id) => `How much ${isv(id)} the ${pn(id)}?`;
  const QX = (id) => [Q(id), QI(id), QT(id), `Yes, please. ${Q(id)}`];
  const LOOK = (id) => `Look at ${D(id)}.`;
  const AN = (id, p) => `${IT[id].pl ? "They're" : "It's"} ${pw(p || IT[id].pr)} won.`;
  const ANX = (id, p) => { p = p || IT[id].pr; const s = IT[id].pl ? "They're" : "It's"; return [AN(id, p), `${s} ${pd(p)} won.`, `${s} ${p} won.`, `${IT[id].pl ? 'They are' : 'It is'} ${pw(p)} won.`]; };
  const HELP = 'May I help you?';
  const YES = 'Yes, please.';
  const THX = 'Thank you.';
  const fo = (id) => ({ t: IT[id].a, flag: id, sub: IT[id].ko });
  const shopLine = (k) => `${PEOPLE[k].n}의 가게 · ${IT[PEOPLE[k].c].ko} ${pd(IT[PEOPLE[k].c].pr)}원`;
  function itemOpts(L, correct, r, n = 3, forced) {
    const others = forced || r.shuf(POOL[L].filter((x) => x !== correct)).slice(0, n - 1);
    const ids = r.shuf([correct, ...others]);
    return { opts: ids.map(fo), a: ids.indexOf(correct) };
  }
  const priceList = (L) => [...new Set(POOL[L].map((id) => IT[id].pr))];
  function priceOpts(L, p, r, mk = (x) => `${pd(x)} won`) {
    const others = r.shuf(priceList(L).filter((x) => x !== p)).slice(0, 2);
    const ps = r.shuf([p, ...others]);
    return { opts: ps.map((x) => ({ t: mk(x) })), a: ps.indexOf(p) };
  }
  const nameOpts = (L, id, r) => { const o = r.shuf(POOL[L].filter((x) => x !== id)).slice(0, 2); const ids = r.shuf([id, ...o]); return { opts: ids.map((x) => ({ t: IT[x].a })), a: ids.indexOf(id) }; };

  MG.LEVELS_U2 = {
    SUPPORT: { words: '단어 4개 · 힌트 많이', read: '15~30단어', write: '문장 완성 → 한 문장' },
    CORE: { words: '교과서 단어 6개 · 2~50천 원', read: '40~70단어', write: '2~3문장' },
    ADVANCED: { words: '같은 6개 + 확장 표현', read: '80~120단어', write: '4~5문장' },
  };

  const UNIT = {
    no: 9,
    title: 'How Much Are These Socks?',
    sub: '비상교육 초5 · Lesson 9 · 물건 가격 묻고 답하기',
    goal: '가게에서 "How much are these ~?"로 가격을 묻고 "They\'re ~ won."으로 답할 수 있어요.',
    hero: ['hat', 'socks', 'shoes', 'jacket'],
    exp: [
      { en: 'How much are these socks?', ko: '이 양말은 얼마예요?' },
      { en: "They're two thousand won.", ko: '2,000원이에요.' },
      { en: 'May I help you?', ko: '도와 드릴까요?' },
      { en: 'Yes, please.', ko: '네, 부탁해요.' },
    ],
    matchHint: '사람 카드를 누르면 말이 나와요. 그 사람이 가리키는 물건을 연결하세요.',
  };
  const LO = {
    LO1: { ko: '물건·가격 말 구별' }, LO2: { ko: '가격 묻기' }, LO3: { ko: '가격 말하고 도움 받기' },
    LO4: { ko: '대화·글 정보 파악' }, LO5: { ko: '말과 글로 표현' },
  };

  /* ---------- 문항 생성기 ---------- */
  const G = {};
  const takeScored = (items, n) => { const out = []; let c = 0; for (const it of items) { if (isQ(it)) { if (c >= n) break; c++; } out.push(it); } return out; };
  const isQ = (i) => i.k !== 'learn' && i.k !== 'text' && i.k !== 'brief' && i.k !== 'report' && i.tag;
  const setLv = (items, lv) => items.map((i) => ({ ...i, lv }));

  G.cards = (L, n) => ({ k: 'learn', title: '물건 이름을 눌러서 들어 보세요', cards: POOL[L].slice(0, n).map((id) => ({ flag: id, en: IT[id].a, ko: IT[id].ko, say: pn(id) })) });
  G.thisThese = () => ({ k: 'learn', title: 'this / these 를 들어 보세요', cards: [
    { flag: 'hat', en: 'this hat', ko: '이 모자 (한 개)', say: 'this hat' },
    { flag: 'jacket', en: 'this jacket', ko: '이 재킷 (한 개)', say: 'this jacket' },
    { flag: 'socks', en: 'these socks', ko: '이 양말 (여러 개·한 쌍)', say: 'these socks' },
    { flag: 'shoes', en: 'these shoes', ko: '이 신발 (여러 개·한 쌍)', say: 'these shoes' },
  ] });
  const PRICES = { SUPPORT: [2, 10, 30, 50], CORE: [2, 10, 13, 15, 30, 50], ADVANCED: [2, 10, 13, 15, 30, 50] };
  G.priceCards = (L) => ({ k: 'learn', title: '가격 읽는 법을 들어 보세요', cards: PRICES[L].map((x) => ({ flag: 'won', en: `${pw(x * 1000)} won`, ko: `${pd(x * 1000)}원` })) });
  G.exprCards = () => ({
    k: 'learn', title: '핵심 표현을 눌러서 들어 보세요',
    cards: [
      { icon: 'chat', en: 'How much are these socks?', ko: '이 양말은 얼마예요?' },
      { icon: 'flag', en: "They're two thousand won.", ko: '2,000원이에요.' },
      { icon: 'sparkles', en: 'May I help you?', ko: '도와 드릴까요?' },
      { icon: 'check', en: 'Yes, please.', ko: '네, 부탁해요.' },
    ],
  });

  G.hearItem = (L, n, r, o = {}) => r.take(POOL[L], n).map((id) => {
    const { opts, a } = itemOpts(L, id, r);
    return { k: 'choose', tag: o.sentence ? 'listen' : 'vocab', say: o.sentence ? LOOK(id) : pn(id), q: o.sentence ? '들은 문장의 물건을 고르세요' : '들은 물건을 고르세요', opts, a, fb: `${pn(id)} = ${IT[id].ko}`, ...(o.reteach ? { reteach: { k: 'learn', title: '틀린 물건만 다시 익혀요', cards: [{ flag: id, en: IT[id].a, ko: IT[id].ko, say: pn(id) }] } } : {}) };
  });
  G.seeName = (L, n, r) => r.take(POOL[L], n).map((id) => {
    const { opts, a } = nameOpts(L, id, r);
    return { k: 'choose', tag: 'vocab', flag: id, q: '이 물건의 이름은 무엇일까요?', opts, a, fb: `${pn(id)} = ${IT[id].ko}` };
  });
  G.sayItem = (L, n, r) => r.take(POOL[L], n).map((id) => ({ k: 'speak', tag: 'speak', flag: id, prompt: '이 물건 이름을 영어로 말해 보세요', target: pn(id), accept: [pn(id), IT[id].a], hide: !isS(L), listen: true }));
  G.hearPrice = (L, n, r, o = {}) => r.take(priceList(L), n).map((p) => {
    const { opts, a } = priceOpts(L, p, r);
    return { k: 'choose', tag: 'vocab', say: `${pw(p)} won`, q: '들은 가격을 고르세요', opts, a, fb: `${pw(p)} won = ${pd(p)}원`, ...(o.reteach ? { reteach: { k: 'learn', title: '틀린 가격만 다시 익혀요', cards: [{ flag: 'won', en: `${pw(p)} won`, ko: `${pd(p)}원` }] } } : {}) };
  });
  G.seePrice = (L, n, r) => r.take(priceList(L), n).map((p) => {
    const ps = r.shuf([p, ...r.shuf(priceList(L).filter((x) => x !== p)).slice(0, 2)]);
    return { k: 'choose', tag: 'vocab', bubble: `${pd(p)} won`, q: '이 가격을 영어로 읽으면?', opts: ps.map((x) => ({ t: `${pw(x)} won` })), a: ps.indexOf(p), fb: `${pd(p)}원 = ${pw(p)} won` };
  });
  /* this/these 구별: 물건을 보고 알맞은 말 고르기 */
  G.thisThesePick = (L, n, r) => r.take(POOL[L], n).map((id) => {
    const o = r.shuf([`${dm(id)} ${pn(id)}`, `${IT[id].pl ? 'this' : 'these'} ${pn(id)}`, `a ${pn(id)}s`.replace('a ', 'the ')]);
    return { k: 'choose', tag: 'expr', flag: id, q: '그림에 알맞은 말을 고르세요', opts: o.map((t) => ({ t })), a: o.indexOf(`${dm(id)} ${pn(id)}`), fb: IT[id].pl ? '여러 개·한 쌍 → these' : '한 개 → this' };
  });

  const EXPR_BANK = [
    { q: '"How much are these socks?"는 무엇을 묻는 말일까요?', o: ['가격이 얼마인지', '몇 개인지', '어디서 샀는지'], fb: 'How much ~? = 가격을 물어요.' },
    { q: '"They\'re two thousand won."은 무슨 뜻일까요?', o: ['2,000원이에요.', '2개예요.', '2살이에요.'], fb: "They're ~ won. = ~원이에요." },
    { q: '양말(socks)처럼 한 쌍인 물건을 가리킬 때는?', o: ['these', 'this', 'that'], fb: '여러 개·한 쌍 → these, 한 개 → this' },
    { q: '"May I help you?"는 누가 누구에게 하는 말일까요?', o: ['가게 주인이 손님에게', '손님이 주인에게', '친구가 친구에게 인사할 때'], fb: 'May I help you? = 도와 드릴까요?' },
    { q: '"Yes, please."는 어떤 뜻일까요?', o: ['네, 부탁해요.', '아니요, 괜찮아요.', '안녕히 가세요.'], fb: 'Yes, please. = 네, 부탁해요.' },
    { q: '"They\'re two thousand won."에서 They\'re는 무엇을 가리킬까요?', o: ['these socks 같은 여러 개인 물건', 'this hat 같은 한 개인 물건', '가게 주인'], fb: "They're = They are" },
  ];
  const EXPR_ADV = [
    { q: '"How much is this hat?"에 어울리는 대답은?', o: ["It's ten thousand won.", "They're ten thousand won.", "I'm from Korea."], fb: '한 개(hat) → It\'s ~' },
    { q: '선글라스(sunglasses)의 가격을 묻는 올바른 문장은?', o: ['How much are these sunglasses?', 'How much is these sunglasses?', 'How many is this sunglasses?'], fb: 'sunglasses는 한 쌍 → are, these' },
    { q: '"It\'s on sale."의 뜻으로 알맞은 것은?', o: ['할인 중이에요.', '품절이에요.', '새 상품이에요.'], fb: 'on sale = 할인 중' },
    { q: '"May I help you?"에 사고 싶은 물건을 보며 대답할 때 맞는 말은?', o: ['Yes, please.', 'Nice to meet you.', "I'm from Korea."], fb: '도움이 필요할 때 Yes, please.' },
    { q: '"That\'s expensive."의 뜻으로 알맞은 것은?', o: ['그거 비싸네요.', '그거 싸네요.', '그거 예쁘네요.'], fb: 'expensive = 비싼, cheap = 싼' },
  ];
  G.exprMeaning = (L, n, r) => r.take(EXPR_BANK, n).map((x) => ({ k: 'choose', tag: 'expr', q: x.q, opts: x.o.map((t) => ({ t })), a: 0, fb: x.fb }));
  G.exprAdv = (L, n, r) => r.take(EXPR_ADV, n).map((x) => ({ k: 'choose', tag: 'expr', q: x.q, opts: x.o.map((t) => ({ t })), a: 0, fb: x.fb }));

  function dlgAudio(L, r) {
    const [id, o2, o3] = r.take(POOL[L], 3);
    let lines, q, opts, a, fb;
    if (isS(L)) {
      lines = [`Hello! ${Q(id)}`, AN(id)]; q = '가격은 얼마일까요?';
      ({ opts, a } = priceOpts(L, IT[id].pr, r)); fb = `정답은 ${pd(IT[id].pr)}원!`;
    } else if (!isA(L)) {
      lines = [`Hello! ${HELP}`, `${YES} ${Q(id)}`, AN(id), THX];
      if (r.next() < 0.5) { q = '가격은 얼마일까요?'; ({ opts, a } = priceOpts(L, IT[id].pr, r)); fb = `정답은 ${pd(IT[id].pr)}원!`; }
      else { q = '손님이 가격을 물은 물건은 무엇일까요?'; ({ opts, a } = itemOpts(L, id, r)); fb = `정답은 ${IT[id].a}!`; }
    } else {
      const dear = IT[id].pr > IT[o2].pr ? id : o2;
      lines = [`Hello! ${HELP}`, `${YES} ${Q(id)}`, AN(id), `And ${Q(o2).replace('How', 'how')}`, AN(o2), `Hmm. ${THX}`];
      q = 'Which one is more expensive?'; ({ opts, a } = itemOpts(L, dear, r, 3, [dear === id ? o2 : id, o3])); fb = `정답은 ${IT[dear].a}!`;
    }
    return { k: 'choose', tag: 'listen', say: lines.join(' '), script: lines, q, opts, a, fb };
  }
  G.listenDialog = (L, n, r) => Array.from({ length: n }, () => dlgAudio(L, r));
  G.match = (L, n, r) => {
    const keys = r.take(peopleIn(L), n);
    return { k: 'match', tag: 'listen', title: '말을 듣고 사람과 가리키는 물건을 연결하세요', pairs: keys.map((k) => ({ key: k, say: `I'm ${PEOPLE[k].n}. ${LOOK(PEOPLE[k].c)}` + (isA(L) ? ` ${AN(PEOPLE[k].c)}` : '') })), right: r.shuf(keys.map((k) => PEOPLE[k].c)) };
  };
  G.respond = (L, n, r, o = {}) => r.take(peopleIn(L), n).map((k) => {
    const p = PEOPLE[k], id = p.c, ctx = { key: k, line: shopLine(k) };
    if ((isS(L) || o.choose) && !o.speak) {
      const ps = r.shuf([IT[id].pr, ...r.shuf(priceList(L).filter((x) => x !== IT[id].pr)).slice(0, 2)]);
      return { k: 'choose', tag: 'listen', say: Q(id), ctx, q: '알맞은 대답을 고르세요', opts: ps.map((x) => ({ t: AN(id, x) })), a: ps.indexOf(IT[id].pr), fb: `${pd(IT[id].pr)}원 = ${pw(IT[id].pr)} won` };
    }
    return { k: 'speak', tag: 'speak', ctx, ask: Q(id), prompt: '질문을 듣고 가격을 대답해 보세요', target: AN(id), accept: ANX(id), hide: true, listen: false };
  });
  const FOLLOW = [
    { b: HELP, o: [YES, 'Nice to meet you.', "No, I'm not."] },
    { b: "They're two thousand won.", o: ['Thank you.', 'Where are you from?', 'Yes, please.'] },
    { b: 'Look at these shoes.', o: ['How much are they?', 'Yes, I am.', 'Nice to meet you.'] },
    { b: "It's ten thousand won.", o: ['Thank you.', 'May I help you?', "I'm from Korea."] },
    { b: "It's thirty thousand won.", o: ["That's expensive!", "That's cheap!", 'Nice to meet you.'] },
  ];
  G.followUp = (L, n, r) => r.take(FOLLOW.slice(0, isA(L) ? 5 : 4), n).map((x) => ({ k: 'choose', tag: 'expr', say: x.b, bubble: x.b, q: '자연스럽게 이어지는 말을 고르세요', opts: x.o.map((t) => ({ t })), a: 0 }));

  const REP = [() => HELP, () => YES, (id) => Q(id), (id) => AN(id), (id) => LOOK(id), () => THX];
  G.repeat = (L, n, r) => r.take(REP, n).map((f) => {
    const id = r.pick(POOL[L]); const t = f(id);
    const withItem = /^(They're|It's|Look|How much)/.test(t);
    return { k: 'speak', tag: 'speak', prompt: '듣고 따라 말해 보세요', target: t, accept: /^(It's|They're)/.test(t) ? ANX(id) : /^How much/.test(t) ? [Q(id), QI(id)] : [t], listen: true, autoplay: true, hide: !isS(L), flag: withItem ? id : undefined };
  });
  G.patternDrill = (L, n, r) => {
    if (isS(L)) {
      const bank = [(id) => ({ q: `How ___ ${isv(id)} ${D(id)}?`, ans: 'much' }), (id) => ({ q: `${IT[id].pl ? "They're" : "It's"} ${pw(IT[id].pr)} ___.`, ans: 'won' }), (id) => ({ q: `Look ___ ${D(id)}.`, ans: 'at' }), () => ({ q: 'Yes, ___.', ans: 'please' })];
      return r.take(bank, n).map((f) => { const id = r.pick(POOL[L]); return { k: 'fill', tag: 'expr', flag: id, ...f(id), hintAuto: true }; });
    }
    if (!isA(L)) {
      const bank = [(id) => ({ q: `How much ___ ${D(id)}?`, ans: isv(id), flag: id }), (id) => ({ q: `Look at ___ ${pn(id)}.`, ans: dm(id), flag: id }), (id) => ({ q: `${IT[id].pl ? "They're" : "It's"} ${pw(IT[id].pr)} ___.`, ans: 'won', flag: id }), () => ({ q: 'May I ___ you?', ans: 'help' }), () => ({ q: 'Yes, ___.', ans: 'please' })];
      return r.take(bank, n).map((f) => ({ k: 'fill', tag: 'expr', ...f(r.pick(POOL[L])) }));
    }
    const bank = ['How much are these socks?', "They're two thousand won.", 'How much is this jacket?', "It's thirty thousand won.", 'May I help you? Yes, please.'];
    return r.take(bank, n).map((s) => ({ k: 'build', tag: 'expr', ans: s, words: s.split(' ') }));
  };
  G.guidedSpeak = (L, n, r) => r.take(peopleIn(L), n).map((k, i) => {
    const p = PEOPLE[k], id = p.c, ctx = { key: k, line: shopLine(k) };
    if (isS(L)) return { k: 'speak', tag: 'speak', ctx, prompt: `${p.n}이(가) 되어 가격을 말해 보세요`, target: AN(id), accept: ANX(id), listen: true };
    if (!isA(L)) {
      if (i % 2 === 0) return { k: 'speak', tag: 'speak', ctx, prompt: `${p.n}의 가게에서 가격을 물어보세요`, target: Q(id), accept: [Q(id), QI(id), QT(id)], hide: true };
      return { k: 'speak', tag: 'speak', ctx, prompt: `${p.n}이(가) 되어 가격을 말해 보세요`, target: AN(id), accept: ANX(id), hide: true };
    }
    return { k: 'speak', tag: 'speak', ctx, prompt: `도움을 받겠다고 말하고 가격을 물어보세요`, target: `${YES} ${Q(id)}`, accept: [`${YES} ${Q(id)}`, `${YES} ${QI(id)}`, `Yes, please. ${QT(id)}`], hide: true };
  });
  const reAsk = /how much (is|are) (it|they|this|these|the \w+)/i;
  G.dialog = (L, n, r, o = {}) => Array.from({ length: n }, () => {
    const k = r.pick(peopleIn(L)), p = PEOPLE[k], id = p.c;
    const ak = k === 'ken' ? 'lily' : 'ken', ap = PEOPLE[ak];
    const other = r.pick(POOL[L].filter((x) => x !== id && IT[x].pr !== IT[id].pr));
    const me = (accept, opts, extra) => ({ who: 'me', accept, opts, ...(extra || {}) });
    let turns;
    if (isS(L)) {
      turns = [
        { who: 'ai', text: 'Hello! Welcome to my store.' }, me(['Hi!', 'Hello!'], ['Hi!', 'Goodbye.', "I'm from Korea."]),
        { who: 'ai', text: HELP }, me([YES], [YES, 'Nice to meet you.', 'Goodbye.']),
        { who: 'ai', text: `Look at ${D(id)}.` }, me([QI(id), Q(id)], [QI(id), 'Nice to meet you.', YES]),
        { who: 'ai', text: AN(id) }, me([THX], [THX, QI(id), 'Goodbye.']),
      ];
      if (o.short) turns = turns.slice(2);
      turns[turns.length - 1].ind = true;
    } else if (!isA(L)) {
      turns = [
        { who: 'ai', text: `Hello! ${HELP}` }, me([YES, `${YES}`], null, { re: /yes,? please/i }),
        { who: 'ai', text: LOOK(id) }, me(QX(id), null, { re: reAsk }),
        { who: 'ai', text: AN(id) }, me([THX, 'Thanks.'], null, { re: /\b(thank|thanks)\b/i }),
        { who: 'ai', text: "You're welcome. Come again!" }, me(['Bye!', 'Goodbye.', 'See you.'], null, { re: /\b(bye|goodbye|see you)\b/i }),
      ];
      if (o.short) turns = turns.slice(0, 6);
    } else {
      turns = [
        { who: 'ai', text: `Hi! I'm ${ap.n}. ${HELP}` }, me([YES], null, { re: /yes,? please/i }),
        { who: 'ai', text: LOOK(id) }, me(QX(id), null, { re: reAsk }),
        { who: 'ai', text: AN(id) }, me(QX(other), null, { re: reAsk }),
        { who: 'ai', text: AN(other) }, me(["That's expensive.", "It's cheap.", 'I like it.'], null, { re: /\b(expensive|cheap|like|nice|good)\b/i }),
        { who: 'ai', text: `OK! Today ${IT[id].pl ? 'they are' : 'it is'} on sale. Look!` }, me([THX, 'Thanks.'], null, { re: /\b(thank|thanks|great|wow)\b/i }),
        { who: 'ai', text: 'Have a nice day!' },
      ];
      if (o.short) turns = turns.slice(0, 8);
      if (o.surprise) turns.push({ who: 'ai', text: 'By the way, is it a good price for you?' }, me(['Yes, it is.', "No, it isn't."], null, { re: /\b(yes|no|cheap|expensive|good)\b/i }));
    }
    const o3 = r.pick(POOL[L].filter((x) => x !== id && x !== other));
    return { k: 'dialog', tag: 'speak', lo: 'LO3', persona: { key: k, line: `You are ${p.n}. You are at a store. You want to know the price of ${D(id)}.` }, ai: { key: ak, shop: true }, turns, free: o.free ? { n: o.free, example: Q(o3), prompt: `Now ask me anything about my store! I'm ${ap.n}. I sell hats, sunglasses, jackets, shorts, socks, and shoes.` } : null };
  });

  /* ---- 읽기 ---- */
  const QC = (q, id, w1, w2) => ({ k: 'choose', tag: 'read', q, opts: [id, w1, w2].map(fo), a: 0 });
  const QT_ = (q, a, w1, w2) => ({ k: 'choose', tag: 'read', q, opts: [a, w1, w2].map((t) => ({ t })), a: 0 });
  const PASS = {
    SUPPORT: {
      a: {
        text: "Look at Mina's store!\nThis hat is ten thousand won.\nThese socks are two thousand won.\nCome and see!",
        ko: '미나의 가게를 봐! 이 모자는 10,000원이야. 이 양말은 2,000원이야. 와서 봐!',
        qs: [QC('Which one is ten thousand won?', 'hat', 'socks', 'shoes'), QT_('How much are the socks?', 'Two thousand won.', 'Ten thousand won.', 'Fifty thousand won.'), QT_('Whose store is it?', "Mina's store", "Ken's store", "Tom's store")],
      },
      b: {
        text: "Ken: May I help you?\nTom: Yes, please. How much are these shoes?\nKen: They're fifty thousand won.\nTom: Thank you.",
        ko: '켄: 도와 드릴까요? 톰: 네, 부탁해요. 이 신발은 얼마예요? 켄: 50,000원이에요. 톰: 고마워요.',
        qs: [QC('What does Tom ask about?', 'shoes', 'hat', 'socks'), QT_('How much are the shoes?', 'Fifty thousand won.', 'Two thousand won.', 'Ten thousand won.'), QT_('Who says "May I help you?"', 'Ken', 'Tom', 'Mia')],
      },
      c: {
        text: "Mia has a store.\nThe jacket is thirty thousand won.\nThe socks are two thousand won.\nWei says, \"How much are these socks?\"\n\"They're two thousand won,\" says Mia.",
        ko: '미아는 가게가 있어. 재킷은 30,000원이야. 양말은 2,000원이야. 웨이가 "이 양말은 얼마예요?"라고 말해. 미아가 "2,000원이에요."라고 해.',
        qs: [QC('What does Wei ask about?', 'socks', 'jacket', 'hat'), QT_('How much is the jacket?', 'Thirty thousand won.', 'Two thousand won.', 'Ten thousand won.'), QT_('Who has a store?', 'Mia', 'Wei', 'Ken')],
      },
    },
    CORE: {
      a: {
        text: "Welcome to Mina's Store!\nLook at this hat. It's ten thousand won.\nLook at these sunglasses. They're thirteen thousand won.\nLook at these shorts. They're fifteen thousand won.\nLook at these socks. They're two thousand won.\nCome and see!",
        ko: '미나의 가게에 어서 오세요! 이 모자는 10,000원, 선글라스는 13,000원, 반바지는 15,000원, 양말은 2,000원이에요. 와서 보세요!',
        qs: [QT_('Whose store is it?', "Mina's store", "Ken's store", "Lily's store"), QT_('How much is the hat?', 'Ten thousand won.', 'Thirteen thousand won.', 'Two thousand won.'), QT_('How much are the shorts?', 'Fifteen thousand won.', 'Thirteen thousand won.', 'Thirty thousand won.'), QC('Which one is two thousand won?', 'socks', 'hat', 'shorts'), QT_('How much are the sunglasses?', 'Thirteen thousand won.', 'Fifteen thousand won.', 'Ten thousand won.')],
      },
      b: {
        text: "Lily is at Wei's store.\nWei says, \"May I help you?\"\n\"Yes, please. How much are these shoes?\" asks Lily.\n\"They're fifty thousand won,\" says Wei.\n\"Oh, they're expensive. How much is this jacket?\"\n\"It's thirty thousand won.\"\nLily says, \"Thank you.\"",
        ko: '릴리가 웨이의 가게에 있어. 웨이가 "도와 드릴까요?"라고 해. 릴리는 "네, 부탁해요. 이 신발은 얼마예요?"라고 물어. "50,000원이에요." "비싸네요. 이 재킷은 얼마예요?" "30,000원이에요." 릴리는 "고마워요."라고 해.',
        qs: [QT_('Who asks about the price?', 'Lily', 'Wei', 'Mina'), QT_('How much are the shoes?', 'Fifty thousand won.', 'Thirty thousand won.', 'Ten thousand won.'), QT_('How much is the jacket?', 'Thirty thousand won.', 'Fifty thousand won.', 'Fifteen thousand won.')],
      },
      c: {
        text: "Tom and Ken are at a store.\nTom looks at some shorts. Ken looks at a hat.\nThe shorts are fifteen thousand won. The hat is ten thousand won.\nTom says, \"These shorts are nice.\"\nKen says, \"This hat is cheap.\"",
        ko: '톰과 켄이 가게에 있어. 톰은 반바지를, 켄은 모자를 봐. 반바지는 15,000원, 모자는 10,000원이야. 톰은 "이 반바지 멋지다."라고, 켄은 "이 모자는 싸다."라고 해.',
        qs: [QC('What does Ken look at?', 'hat', 'shorts', 'socks'), QT_('How much are the shorts?', 'Fifteen thousand won.', 'Ten thousand won.', 'Thirteen thousand won.'), QT_('What does Ken say about the hat?', 'It is cheap.', 'It is expensive.', 'It is big.')],
      },
    },
    ADVANCED: {
      a: {
        text: "Look at my store flyer!\nThe jacket is thirty thousand won. Today it's on sale. It's twenty thousand won.\nThe sunglasses are thirteen thousand won. The shorts are fifteen thousand won.\nThe sunglasses are cheaper than the shorts.\nCome and see my store!",
        ko: '내 가게 전단지를 봐! 재킷은 30,000원인데 오늘은 할인해서 20,000원이야. 선글라스는 13,000원, 반바지는 15,000원이야. 선글라스가 반바지보다 싸. 내 가게에 와서 봐!',
        qs: [QT_('How much is the jacket today?', 'Twenty thousand won', 'Thirty thousand won', 'Fifteen thousand won'), QT_('Why is the jacket cheaper today?', 'It is on sale.', 'It is old.', 'It is small.'), QT_('Which is cheaper?', 'The sunglasses', 'The shorts', 'They are the same.'), QT_('What is the text?', 'A store flyer', 'A letter', 'A diary')],
      },
      b: {
        text: "Mia: May I help you?\nLily: Yes, please. How much are these socks?\nMia: They're two thousand won. They're on sale today.\nLily: Great! And how much are these shoes?\nMia: They're fifty thousand won.\nLily: Oh, that's expensive. I'll look at the socks again. Thank you.",
        ko: '미아: 도와 드릴까요? 릴리: 네, 부탁해요. 이 양말은 얼마예요? 미아: 2,000원이에요. 오늘 할인 중이에요. 릴리: 좋아요! 그럼 이 신발은요? 미아: 50,000원이에요. 릴리: 비싸네요. 양말을 다시 볼게요. 고마워요.',
        qs: [QT_('What is on sale today?', 'The socks', 'The shoes', 'The hat'), QT_('How much are the shoes?', 'Fifty thousand won', 'Two thousand won', 'Thirty thousand won'), QT_('Why does Lily look at the socks again?', 'The shoes are expensive.', 'The socks are broken.', 'She likes the hat.'), QT_('Who says "May I help you?"', 'Mia', 'Lily', 'Ken')],
      },
      c: {
        text: "Wei wants a hat and shoes. The hat is ten thousand won. The shoes are fifty thousand won.\nWei says, \"These shoes are expensive, but they're nice.\"\nHis friend says, \"Look at this hat. It's cheaper.\"\nWei thinks for a moment. \"OK. This hat is better for me today.\"",
        ko: '웨이는 모자와 신발을 원해. 모자는 10,000원, 신발은 50,000원이야. 웨이는 "이 신발은 비싸지만 멋져."라고 해. 친구가 "이 모자를 봐. 더 싸."라고 해. 웨이는 잠깐 생각하고 "좋아. 오늘은 이 모자가 더 좋아."라고 해.',
        qs: [QT_('How much is the hat?', 'Ten thousand won', 'Fifty thousand won', 'Thirteen thousand won'), QT_('What does Wei say about the shoes?', 'They are expensive.', 'They are cheap.', 'They are small.'), QT_('Which is cheaper?', 'The hat', 'The shoes', 'They are the same.')],
      },
    },
  };
  G.passage = (L, key, only) => { const p = PASS[L][key]; return F({ k: 'text', text: p.text, ko: p.ko }, only ? p.qs.slice(0, only) : p.qs); };
  G.passageQs = (L, key, n) => PASS[L][key].qs.slice(0, n || undefined);
  const SENT = {
    SUPPORT: "Look at this hat.\nHow much is it?\nIt's ten thousand won.\nThank you.",
    CORE: "Look at these socks.\nHow much are these socks?\nThey're two thousand won.\nMay I help you?\nYes, please.",
    ADVANCED: "May I help you?\nYes, please. How much are these shoes?\nThey're fifty thousand won. They're on sale today.\nLook at this jacket. It's thirty thousand won.",
  };
  G.sentenceReading = (L) => ({ k: 'text', title: '문장을 눌러서 듣고 소리 내어 읽어 보세요', text: SENT[L], ko: null });
  G.readAloud = (L, n, r) => r.take(SENT[L].split('\n'), n).map((t) => ({ k: 'speak', tag: 'read', lo: 'LO1', prompt: '소리 내어 읽어 보세요', target: t, accept: [t], hide: false, listen: isS(L) }));
  G.readMatch = (L, n, r) => r.take(peopleIn(L), n).map((k) => {
    const p = PEOPLE[k], id = p.c;
    const { opts, a } = priceOpts(L, IT[id].pr, r);
    if (isA(L)) return { k: 'choose', tag: 'read', bubble: `A: ${HELP}\nB: ${YES} ${Q(id)}\nA: ${AN(id)}`, q: 'B가 묻는 물건의 가격은?', opts, a, fb: `${pd(IT[id].pr)}원` };
    return { k: 'choose', tag: 'read', bubble: `I'm ${p.n}. ${cap1(D(id))} ${isv(id)} ${pw(IT[id].pr)} won.`, q: `${IT[id].ko}의 가격은 얼마일까요?`, opts, a, fb: `${pn(id)} → ${pd(IT[id].pr)}원` };
  });
  function cap1(s) { return s[0].toUpperCase() + s.slice(1); }
  G.cardsDecide = (L, n, r) => r.take(peopleIn(L), n).map((k, i) => {
    const p = PEOPLE[k], id = p.c; const same = i % 2 === 0;
    const other = r.pick(priceList(L).filter((x) => x !== IT[id].pr));
    if (isA(L)) {
      const k2 = r.pick(peopleIn(L).filter((x) => PEOPLE[x].c !== id && IT[PEOPLE[x].c].pr !== IT[id].pr)); const id2 = PEOPLE[k2].c;
      const dear = IT[id].pr > IT[id2].pr ? id : id2;
      return { k: 'choose', tag: 'read', bubble: `${p.n}'s ${pn(id)}: ${pd(IT[id].pr)} won\n${PEOPLE[k2].n}'s ${pn(id2)}: ${pd(IT[id2].pr)} won`, q: 'Which one is more expensive?', opts: [`The ${pn(dear)}`, `The ${pn(dear === id ? id2 : id)}`, 'Both'].map((t) => ({ t })), a: 0 };
    }
    return { k: 'choose', tag: 'read', bubble: `${p.n}'s store\n${IT[id].a}: ${pd(IT[id].pr)} won`, q: `${cap1(D(id))} ${isv(id)} ${pw(same ? IT[id].pr : other)} won.`, opts: [{ t: 'True (맞아요)' }, { t: 'False (달라요)' }], a: same ? 0 : 1 };
  });
  /* 필요(need) vs 원함(want) — Story Time 주제를 자체 상황으로 */
  const NW = [
    { b: 'It is very cold today.\nYou have no jacket.', it: 'jacket', a: 'need' },
    { b: 'You have three pairs of socks.\nYou see new sunglasses. They are cool!', it: 'sunglasses', a: 'want' },
    { b: 'It is hot and sunny.\nYou have no hat.', it: 'hat', a: 'need' },
    { b: 'You have shoes.\nYou see new shoes. They are fifty thousand won.', it: 'shoes', a: 'want' },
  ];
  G.needWant = (L, n, r) => r.take(NW, n).map((x) => ({ k: 'choose', tag: 'read', lo: 'LO4', flag: x.it, bubble: x.b, q: `${IT[x.it].ko}은(는) 지금 need일까요, want일까요?`, opts: [{ t: 'need (꼭 필요해요)' }, { t: 'want (갖고 싶어요)' }], a: x.a === 'need' ? 0 : 1, fb: x.a === 'need' ? '꼭 필요하면 need' : '갖고 싶은 마음이면 want' }));

  /* ---- 쓰기 ---- */
  G.build = (L, n, r) => {
    const bank = [(id) => [Q(id), `${IT[id].ko}은(는) 얼마예요?`], (id) => [AN(id), `${pd(IT[id].pr)}원이에요.`], (id) => [LOOK(id), '이것을 보세요.'], () => [HELP, '도와 드릴까요?'], () => [YES, '네, 부탁해요.'], (id) => [Q(id), `${IT[id].ko}은(는) 얼마예요?`]];
    const pool = isS(L) ? bank.slice(0, 5) : bank;
    return r.take(pool, n).map((f) => { const [s, ko] = f(r.pick(POOL[L])); return { k: 'build', tag: 'write', ans: s, ko, words: s.split(' ') }; });
  };
  G.fill = (L, n, r) => {
    if (isS(L)) {
      const bank = [(id) => ({ q: `How much ___ ${D(id)}?`, o: IT[id].pl ? ['are', 'is', 'am'] : ['is', 'are', 'am'], flag: id }), () => ({ q: 'How ___ is it?', o: ['much', 'many', 'old'] }), (id) => ({ q: `${IT[id].pl ? "They're" : "It's"} ${pw(IT[id].pr)} ___.`, o: ['won', 'one', 'yes'], flag: id }), () => ({ q: 'Yes, ___.', o: ['please', 'sorry', 'bye'] }), (id) => ({ q: `Look ___ ${D(id)}.`, o: ['at', 'to', 'in'], flag: id })];
      return r.take(bank, n).map((f) => { const x = f(r.pick(POOL[L])); return { k: 'choose', tag: 'write', flag: x.flag, q: x.q, blank: true, opts: x.o.map((t) => ({ t })), a: 0 }; });
    }
    if (!isA(L)) {
      const bank = [(id) => ({ q: `How much ___ ${D(id)}?`, ans: isv(id), flag: id }), (id) => ({ q: `Look at ___ ${pn(id)}.`, ans: dm(id), flag: id }), (id) => ({ q: `${IT[id].pl ? "They're" : "It's"} ${pw(IT[id].pr)} ___.`, ans: 'won', flag: id }), () => ({ q: 'May I ___ you?', ans: 'help' }), () => ({ q: 'Yes, ___.', ans: 'please' })];
      return r.take(bank, n).map((f) => ({ k: 'fill', tag: 'write', ...f(r.pick(POOL[L])) }));
    }
    const bank = [
      { q: 'A: How much are these socks?\nB: ___ two thousand won.', ans: "They're", alts: ['They are'] },
      { q: "A: May I help you?\nB: ___, please. How much is this jacket?", ans: 'Yes' },
      { q: "A: How much are these shoes?\nB: They're fifty thousand won. They're ___ sale.", ans: 'on' },
      { q: "A: ___ much is this hat?\nB: It's ten thousand won.", ans: 'How' },
    ];
    return r.take(bank, n).map((x) => ({ k: 'fill', tag: 'write', ...x, wide: true }));
  };
  G.writeKo = (L, n, r) => {
    if (isA(L)) return r.take(peopleIn(L), n).map((k) => { const p = PEOPLE[k], id = p.c; return { k: 'write', tag: 'write', ctx: { key: k, line: shopLine(k) }, ko: `카드를 보고 ${p.n}의 물건 가격을 설명하는 문장을 쓰세요`, ans: `${cap1(D(id))} ${isv(id)} ${pw(IT[id].pr)} won.`, alts: [`${cap1(D(id))} ${isv(id)} ${pd(IT[id].pr)} won.`, `The ${pn(id)} ${isv(id)} ${pw(IT[id].pr)} won.`, AN(id)] }; });
    const bank = [(id) => [`${IT[id].ko}은(는) 얼마예요?`, Q(id), id], () => ['도와 드릴까요?', HELP], (id) => [`${pd(IT[id].pr)}원이에요.`, AN(id), id], () => ['네, 부탁해요.', YES], (id) => ['이것을 보세요.', LOOK(id), id]];
    return r.take(bank, n).map((f) => { const [ko, ans, flag] = f(r.pick(POOL[L])); return { k: 'write', tag: 'write', ko, ans, flag, alts: ans.startsWith('It') || ans.startsWith('They') ? ANX(flag, null).slice(1) : [] }; });
  };
  const RULE = {
    ask: { label: '가격 묻기 (How much ...?)', re: /how much (is|are)/i },
    yes: { label: 'Yes, please.', re: /yes,? please/i },
    won: { label: '가격 (... won)', re: /\bwon\b/i },
    look: { label: 'Look at ...', re: /look at/i },
    help: { label: 'May I help you?', re: /may i help you/i },
    op: { label: '느낌 말하기 (expensive / cheap)', re: /\b(expensive|cheap)\b/i },
    sale: { label: 'on sale', re: /on sale/i },
  };
  G.compose = (L, kind, r, o = {}) => {
    if (kind === 'self') {
      if (isS(L)) return { k: 'compose', tag: 'write', kind, title: '가격을 묻고 대답하는 말을 완성해 보세요', starter: "How much are these ______? They're two thousand won.", rules: [RULE.ask, RULE.won], minSent: 2, sample: "How much are these socks? They're two thousand won." };
      if (!isA(L)) return { k: 'compose', tag: 'write', kind, title: '가게에서 도움을 받아 가격을 묻는 대화를 2~3문장으로 써 보세요', rules: [RULE.yes, RULE.ask], minSent: 2, tip: "They're ... won.도 넣어 볼까요?", sample: 'May I help you? Yes, please. How much are these socks?' };
      return { k: 'compose', tag: 'write', kind, title: '두 물건의 가격을 묻고 비교하는 글을 4~5문장으로 써 보세요', rules: [RULE.ask, RULE.won, RULE.op], minSent: 4, sample: "How much are these shoes? They're fifty thousand won. How much are these socks? They're two thousand won. The shoes are expensive." };
    }
    if (kind === 'compare') {
      const [a, b] = r.shuf(peopleIn(L)).slice(0, 2).map((k) => ({ ...PEOPLE[k], k }));
      const ia = a.c, ib = b.c; const dear = IT[ia].pr > IT[ib].pr ? ia : ib, cheap = dear === ia ? ib : ia;
      return { k: 'compose', tag: 'write', kind, persona2: [a.k, b.k].map((k) => ({ key: k, line: shopLine(k) })), title: isA(L) ? '두 물건의 가격을 비교하는 글을 4문장으로 써 보세요' : '두 물건의 가격을 소개하는 글을 2~3문장으로 써 보세요', rules: [{ label: `${pn(ia)} 이름과 가격`, test: (t) => new RegExp(`\\b${pn(ia)}\\b[^.!?]*\\bwon\\b`, 'i').test(t) }, { label: `${pn(ib)} 이름과 가격`, test: (t) => new RegExp(`\\b${pn(ib)}\\b[^.!?]*\\bwon\\b`, 'i').test(t) }, ...(isA(L) ? [{ label: '비교 (expensive / cheap)', re: /\b(expensive|cheap)\b/i }] : [])], minSent: isA(L) ? 4 : 2, sample: isA(L) ? `The ${pn(ia)} ${isv(ia)} ${pw(IT[ia].pr)} won. The ${pn(ib)} ${isv(ib)} ${pw(IT[ib].pr)} won. The ${pn(dear)} ${isv(dear)} expensive. The ${pn(cheap)} ${isv(cheap)} cheap.` : `The ${pn(ia)} ${isv(ia)} ${pw(IT[ia].pr)} won. The ${pn(ib)} ${isv(ib)} ${pw(IT[ib].pr)} won.` };
    }
    // shop: 가게 전단지(자체 템플릿 — 교과서 광고문 틀을 그대로 쓰지 않고 가게 소개 카드로)
    const k = r.pick(peopleIn(L)), p = PEOPLE[k], id = p.c;
    const rules = [{ label: `물건 이름 (${pn(id)})`, re: new RegExp(`\\b${pn(id)}\\b`, 'i') }, RULE.won];
    if (!isS(L)) rules.push(RULE.look);
    if (isA(L)) rules.push(RULE.sale);
    return { k: 'compose', tag: 'write', kind, persona: { key: k, line: shopLine(k) }, title: isA(L) ? `${p.n}의 가게 소개 카드를 3문장으로 써 보세요 (할인 포함)` : isS(L) ? `${p.n}의 가게 물건과 가격을 한 문장으로 써 보세요` : `${p.n}의 가게 소개 카드를 써 보세요 (Look at ...)`, rules, minSent: isA(L) ? 3 : isS(L) ? 1 : 2, sample: isS(L) ? `${cap1(D(id))} ${isv(id)} ${pw(IT[id].pr)} won.` : `Look at ${D(id)}. ${AN(id)}${isA(L) ? ` ${IT[id].pl ? "They're" : "It's"} on sale.` : ''}` };
  };

  /* ---------- 신규 생성기 ---------- */
  G.fade = (L, n, r, kind = 'price') => {
    if (kind === 'price') return r.take(POOL[L], n).map((id) => {
      const wr = r.pick(priceList(L).filter((x) => x !== IT[id].pr));
      const texts = r.shuf([AN(id), AN(id, wr), THX]);
      return { k: 'fade', tag: 'speak', lo: 'LO3', flag: id, ctx: { key: Object.keys(PEOPLE).find((x) => PEOPLE[x].c === id) || 'mina', line: `${IT[id].ko} ${pd(IT[id].pr)}원` }, q1: `${IT[id].ko}은(는) ${pd(IT[id].pr)}원이에요. 알맞은 말은?`, opts: texts.map((t) => ({ t })), a: texts.indexOf(AN(id)), target: AN(id), accept: ANX(id), prompt3: '가격표를 보고 도움 없이 말해 볼까요?' };
    });
    if (kind === 'ask') return r.take(POOL[L], n).map((id) => {
      const texts = r.shuf([Q(id), 'Where are you from?', THX]);
      return { k: 'fade', tag: 'speak', lo: 'LO2', flag: id, q1: '가격을 묻는 말은 무엇일까요?', opts: texts.map((t) => ({ t })), a: texts.indexOf(Q(id)), target: Q(id), accept: [Q(id), QI(id), QT(id)], prompt3: '물건을 보고 도움 없이 가격을 물어볼까요?' };
    });
    return r.take(peopleIn(L), n).map((k) => {
      const id = PEOPLE[k].c; const wr = r.pick(priceList(L).filter((x) => x !== IT[id].pr));
      const o2 = r.shuf([AN(id), AN(id, wr)]);
      return { k: 'fade', tag: 'speak', lo: 'LO3', ctx: { key: k, line: shopLine(k) }, ask: Q(id), q1: '알맞은 대답을 고르세요', opts: o2.map((t) => ({ t })), a: o2.indexOf(AN(id)), target: AN(id), accept: ANX(id), prompt3: '질문을 듣고 도움 없이 대답해 볼까요?' };
    });
  };
  G.qa = (L, n, r, o = {}) => r.take(peopleIn(L), n).map((k, i) => {
    const p = PEOPLE[k], id = p.c; const ask = o.only ? o.only === 'ask' : i % 2 === 0;
    const base = { k: 'speak', tag: 'speak', hide: !o.show, listen: !!o.show, lo: ask ? 'LO2' : 'LO3' };
    if (o.flag) return ask
      ? { ...base, flag: id, prompt: '물건을 보고 가격을 물어보세요', target: Q(id), accept: [Q(id), QI(id), QT(id)] }
      : { ...base, flag: id, ctx: { key: k, line: shopLine(k) }, prompt: '가격표를 보고 대답해 보세요', target: AN(id), accept: ANX(id) };
    if (ask) return { ...base, ctx: { key: k, line: `${p.n}의 가게` }, prompt: `${p.n}의 가게에서 ${IT[id].ko}의 가격을 물어보세요`, target: Q(id), accept: [Q(id), QI(id), QT(id)] };
    return { ...base, ctx: { key: k, line: shopLine(k) }, prompt: `${p.n}이(가) 되어 가격을 대답해 보세요`, target: AN(id), accept: ANX(id) };
  });
  G.respondFix = (L, n, r) => r.take(peopleIn(L), n).map((k) => {
    const p = PEOPLE[k], id = p.c, wr = r.pick(priceList(L).filter((x) => x !== IT[id].pr));
    const ask = `${IT[id].pl ? 'Are they' : 'Is it'} ${pw(wr)} won?`;
    const no = IT[id].pl ? "No, they aren't." : "No, it isn't."; const no2 = IT[id].pl ? "No, they're not." : "No, it's not.";
    return { k: 'speak', tag: 'speak', lo: 'LO3', ctx: { key: k, line: shopLine(k) }, ask, prompt: '아니라고 말하고, 올바른 가격도 알려 주세요', target: `${no} ${AN(id)}`, accept: [`${no} ${AN(id)}`, `${no2} ${AN(id)}`, `${no} ${ANX(id)[1]}`, `${no2} ${ANX(id)[1]}`], hide: true, listen: false };
  });
  G.scene = (L, r) => {
    const d = dlgAudio(L, r);
    if (isS(L) || isA(L)) return [{ ...d, lo: 'LO4' }];
    return [{ ...d, lo: 'LO4', q: '두 사람은 무엇에 대해 이야기하고 있나요?', opts: [{ t: '물건의 가격' }, { t: '좋아하는 음식' }, { t: '오늘 날씨' }], a: 0, fb: '물건의 가격을 묻고 답하고 있어요.' }];
  };
  G.order = (L, n, r) => r.take(POOL[L], n).map((id) => {
    const w = isS(L) ? ['Hello!', Q(id), AN(id)] : [HELP, YES, Q(id), AN(id)];
    return { k: 'build', tag: 'expr', lo: 'LO2', ko: isS(L) ? '인사 → 질문 → 대답 순서로 놓아 보세요' : '도움 → 대답 → 질문 → 가격 순서로 놓아 보세요', ans: w.join(' '), words: w.join(' ').split(' ') };
  });
  G.readDialog = (L, n, r) => r.take(POOL[L], n).map((id, i) => {
    if (isA(L) && i % 2) { const o2 = r.pick(POOL[L].filter((x) => x !== id && IT[x].pr !== IT[id].pr)); const dear = IT[id].pr > IT[o2].pr ? id : o2; const { opts, a } = itemOpts(L, dear, r, 3, [dear === id ? o2 : id, r.pick(POOL[L].filter((x) => x !== id && x !== o2))]); return { k: 'choose', tag: 'read', lo: 'LO4', bubble: `A: ${Q(id)}\nB: ${AN(id)}\nA: ${Q(o2)}\nB: ${AN(o2)}`, q: 'Which one is more expensive?', opts, a }; }
    const { opts, a } = priceOpts(L, IT[id].pr, r);
    return { k: 'choose', tag: 'read', lo: 'LO4', bubble: `A: ${Q(id)}\nB: ${AN(id, IT[id].pr)}`, q: `${IT[id].ko}의 가격은 얼마일까요?`, opts, a, fb: `${pn(id)} → ${pd(IT[id].pr)}원` };
  });
  const PRED = [
    { b: "Title: Mina's Store", q: '이 글은 무엇에 대한 내용일까요?', o: ['가게의 물건과 가격을 소개하는 글', '운동회 규칙 설명', '날씨 일기'] },
    { b: 'Title: Be a Good Shopper', q: '이 글에는 무엇이 나올까요?', o: ['꼭 필요한 것과 갖고 싶은 것을 생각하는 이야기', '나라를 소개하는 글', '요리 방법'] },
    { b: 'Title: On Sale Today!', q: '이 글의 장면은 어디일까요?', o: ['할인하는 가게', '조용한 도서관', '놀이공원 입구'] },
  ];
  G.predict = (L, n, r) => r.take(PRED, n).map((x) => ({ k: 'choose', tag: 'read', lo: 'LO4', bubble: x.b, q: x.q, opts: x.o.map((t) => ({ t })), a: 0 }));
  G.modelObs = (L, n, r) => {
    const bank = isA(L)
      ? [{ b: "A: Shoes. Fifty.\nB: How much are these shoes? They're fifty thousand won. They're expensive.", q: '정보가 더 자세하고 자연스러운 글은?', o: ['B', 'A', '같아요'], a: 0 }, { b: "A: Jacket. On sale.\nB: Look at this jacket. It's thirty thousand won. It's on sale today.", q: '할인 정보까지 잘 표현한 글은?', o: ['B', 'A', '둘 다 아니에요'], a: 0 }]
      : isS(L)
        ? [{ b: "Look at this hat. It's ten thousand won.", q: '가격을 알려 주는 문장은?', o: ["It's ten thousand won.", 'Look at this hat.', 'Thank you.'], a: 0 }, { b: "How much are these socks? They're two thousand won.", q: '가격을 묻는 문장은?', o: ['How much are these socks?', "They're two thousand won.", 'Thank you.'], a: 0 }]
        : [{ b: "Look at these socks. They're two thousand won.", q: '가게 소개 글에 꼭 들어가는 정보는?', o: ['물건과 가격', '나이', '날씨'], a: 0 }, { b: "How much are these shorts? They're fifteen thousand won.", q: '"They\'re"는 어떤 물건을 가리킬까요?', o: ['these shorts 처럼 여러 개·한 쌍', 'this hat 처럼 한 개', '사람 한 명'], a: 0 }];
    return bank.slice(0, n).map((x) => ({ k: 'choose', tag: 'write', lo: 'LO5', bubble: x.b, q: x.q, opts: x.o.map((t) => ({ t })), a: x.a }));
  };
  const ERR = [
    { w: 'How much is these socks?', a: 'How much are these socks?', alts: [] }, { w: 'How much are this hat?', a: 'How much is this hat?', alts: [] },
    { w: 'It ten thousand won.', a: "It's ten thousand won.", alts: ['It is ten thousand won.'] }, { w: 'Look at this shoes.', a: 'Look at these shoes.', alts: [] },
  ];
  G.fixIt = (L, n, r) => r.take(ERR, n).map((x) => ({ k: 'write', tag: 'write', lo: 'LO5', ko: `틀린 곳을 고쳐 써 보세요: "${x.w}"`, ans: x.a, alts: x.alts }));
  const NAT = [
    { b: 'Socks. How much? Two thousand.', o: ["How much are these socks? They're two thousand won.", 'Socks how is much two.', 'Much socks are two.'] },
    { b: 'Hat. Look. Ten thousand.', o: ["Look at this hat. It's ten thousand won.", 'Hat look at ten is.', 'Thousand this hat look.'] },
  ];
  G.natural = (L, n, r) => r.take(NAT, n).map((x) => ({ k: 'choose', tag: 'write', lo: 'LO5', bubble: x.b, q: '더 자연스러운 표현은?', opts: x.o.map((t) => ({ t })), a: 0 }));
  G.brief = (L, title, text, keys) => ({ k: 'brief', title, text, people: keys });

  /* ---------- 차시 구성 ---------- */
  const act = (t, ko, min, icon, build, step) => ({ t, ko, min, icon, build, step });
  const brief6 = (L) => [G.brief(L, '나의 가게 미션', by(L, () => ['우리 가게를 열었어요. 손님이 되어 가격을 묻고, 가게 주인이 되어 가격을 말해 보세요!'][0], () => '가게 주인과 손님이 되어 말해 보고, 나만의 가게 소개 카드를 완성해 보세요.', () => '여러 가게의 가격을 비교하고 필요한 것과 갖고 싶은 것을 생각하며, 할인 정보를 담은 가게 소개 카드를 써 보세요.'), by(L, () => ['mina', 'mia', 'wei'], () => ['mina', 'ken', 'lily', 'tom'], () => ['mia', 'wei', 'lily', 'tom', 'ken']))];

  const REM = {
    vocab: (L, r) => F(G.seeName(L, 2, r), G.hearItem(L, 2, r), G.hearPrice(L, 2, r), G.seePrice(L, 1, r)),
    expr: (L, r) => F(G.exprMeaning(L, 3, r), G.thisThesePick(L, 2, r), G.patternDrill(L, 3, r)),
    listen: (L, r) => F(G.hearItem(L, 2, r, { sentence: 1 }), G.listenDialog(L, 2, r), [G.match(L, 3, r)], G.respond(L, 1, r, { choose: 1 })),
    speak: (L, r) => F(G.repeat(L, 3, r), G.qa(L, 3, r, { show: isS(L) }), G.dialog(L, 1, r, { short: true })),
    read: (L, r) => F(G.readMatch(L, 2, r), G.cardsDecide(L, 2, r), { k: 'text', text: PASS[L].b.text, ko: PASS[L].b.ko }, G.passageQs(L, 'b', 3)),
    write: (L, r) => F(G.build(L, 3, r), G.fill(L, 3, r), G.writeKo(L, 1, r)),
  };
  const rv = (L, r, c, base) => {
    const items = base(); const w = c && c.weak;
    if (!w || !REM[w]) return items;
    const extra = REM[w](L, rng('rv9' + L + w)).filter(isQ).slice(0, 2);
    return [...items.slice(0, Math.max(items.length - 2, 1)), ...extra];
  };
  const rt = (items, tag) => items.map((i) => ({ ...i, tag }));

  const LESSONS = [
    { no: 1, en: 'Meet & Understand', ko: '물건·가격 표현 알기', goal: '물건과 가격을 알아듣고, this/these로 가리키며 가격을 묻고 답하는 표현을 알아요.', icon: 'abc', c: 'mango', tags: ['vocab', 'expr', 'speak'], lo: ['LO1', 'LO2', 'LO3'], acts: [
      act('Meet the Store', '가게 상황 만나기', 3, 'sparkles', (L, r) => G.scene(L, r), '상황'),
      act('Item & Price Words', '물건·가격 어휘 익히기', 5, 'abc', (L, r) => by(L, () => F(G.cards(L, 4), G.hearItem(L, 3, r), G.priceCards(L), G.hearPrice(L, 2, r)), () => F(G.cards(L, 6), G.hearItem(L, 2, r), G.sayItem(L, 2, r), G.priceCards(L), G.hearPrice(L, 2, r)), () => F(G.hearItem(L, 4, r, { reteach: true }), G.hearPrice(L, 4, r, { reteach: true }))), '이해'),
      act('this & these', 'this / these 발견', 4, 'swap', (L, r) => by(L, () => F(G.thisThese(), G.thisThesePick(L, 3, r)), () => F(G.thisThese(), G.thisThesePick(L, 3, r)), () => F(G.thisThesePick(L, 3, r), G.exprAdv(L, 1, r))), '모델링'),
      act('Key Expressions', '핵심표현 발견', 4, 'chat', (L, r) => by(L, () => F(G.exprCards(L), G.listenDialog(L, 1, r), G.fade(L, 1, r, 'ask')), () => F(G.exprCards(L), G.listenDialog(L, 1, r), G.guidedSpeak(L, 2, r)), () => F(G.exprAdv(L, 2, r), G.respond(L, 1, r, { speak: 1 }), G.followUp(L, 1, r))), '모델링'),
      act('First Store Talk', '첫 가게 대화', 5, 'chat', (L, r) => by(L, () => G.dialog(L, 1, r, { short: true }), () => G.dialog(L, 1, r), () => G.dialog(L, 1, r, { free: 1 })), '적용'),
      act('Mastery Check', 'Mastery Check', 3, 'clipboard', (L, r) => by(L, () => G.qa(L, 2, r), () => G.qa(L, 4, r, { flag: true }), () => F(G.qa(L, 2, r), G.followUp(L, 1, r))), '확인'),
    ], hw: (L, r) => by(L, () => F(G.hearItem(L, 3, r), G.hearPrice(L, 1, r), G.repeat(L, 2, r)), () => F(G.hearItem(L, 2, r, { sentence: 1 }), G.qa(L, 3, r, { flag: true })), () => F(G.qa(L, 2, r), G.followUp(L, 2, r))), ind: (L, r) => G.qa(L, 2, r) },

    { no: 2, en: 'Listen & Respond', ko: '듣고 가격 정보 구별하며 응답하기', goal: '대화를 듣고 물건과 가격 정보를 구별하며, 가격을 대답해요.', icon: 'headphones', c: 'sky', tags: ['listen', 'speak'], lo: ['LO3', 'LO4'], acts: [
      act('Spaced Review', '복습', 3, 'refresh', (L, r, c) => rv(L, r, c, () => by(L, () => G.repeat(L, 3, r), () => G.qa(L, 3, r, { flag: true }), () => G.respond(L, 3, r, { speak: 1 }))), '복습'),
      act('Listen to Dialogs', '대화 듣기', 4, 'headphones', (L, r) => G.listenDialog(L, 2, r), '이해'),
      act('Connect Info', '정보 연결', 5, 'link', (L, r) => by(L, () => [G.match(L, 3, r)], () => [G.match(L, 4, r)], () => [G.match(L, 4, r)]), '이해'),
      act('Price or Item?', '가격·물건 구별', 4, 'check', (L, r) => by(L, () => F(G.exprMeaning(L, 2, r), G.respond(L, 2, r)), () => F(G.exprMeaning(L, 2, r), G.respond(L, 2, r, { choose: 1 })), () => F(G.listenDialog(L, 1, r), G.exprAdv(L, 2, r))), '모델링'),
      act('Listen & Respond', '듣고 응답하기', 6, 'chat', (L, r) => by(L, () => G.fade(L, 3, r, 'resp'), () => G.respond(L, 5, r, { speak: 1 }), () => G.respondFix(L, 3, r)), '연습'),
      act('Listening Check', 'Listening Check', 3, 'clipboard', (L, r) => by(L, () => F(G.listenDialog(L, 2, r), G.respond(L, 1, r, { speak: 1 })), () => F(G.listenDialog(L, 1, r), G.respond(L, 1, r, { speak: 1 })), () => F(G.listenDialog(L, 2, r), G.respond(L, 1, r, { speak: 1 }))), '확인'),
    ], hw: (L, r) => by(L, () => F(G.respond(L, 3, r), G.repeat(L, 1, r)), () => F(G.listenDialog(L, 2, r), G.respond(L, 2, r, { speak: 1 })), () => F(G.listenDialog(L, 2, r), G.respondFix(L, 2, r))), ind: (L, r) => (isA(L) ? G.respondFix(L, 2, r) : G.respond(L, 2, r, { speak: 1 })) },

    { no: 3, en: 'Ask & Talk', ko: '가게에서 가격 묻고 도움 받기', goal: '"May I help you?"에 "Yes, please."로 답하고, 가격을 묻고 답하는 대화를 독립적으로 해요.', icon: 'mic', c: 'berry', tags: ['speak', 'expr'], lo: ['LO2', 'LO3'], acts: [
      act('Spaced Review', '복습', 3, 'refresh', (L, r, c) => rv(L, r, c, () => by(L, () => G.repeat(L, 3, r), () => G.respond(L, 3, r, { speak: 1 }), () => F(G.respond(L, 2, r, { speak: 1 }), G.followUp(L, 2, r)))), '복습'),
      act('Dialog Model', '대화 모델 관찰', 3, 'eye', (L, r) => by(L, () => G.order(L, 2, r), () => G.order(L, 2, r), () => G.followUp(L, 3, r)), '모델링'),
      act('Pattern Drill', 'Pattern Drill', 5, 'swap', (L, r) => by(L, () => F(G.patternDrill(L, 3, r), G.qa(L, 1, r, { only: 'answer', show: true })), () => G.patternDrill(L, 5, r), () => F(G.patternDrill(L, 3, r), G.followUp(L, 2, r))), '연습'),
      act('Guided Role-play', 'Guided Role-play', 5, 'mic', (L, r) => by(L, () => G.dialog(L, 1, r), () => G.dialog(L, 1, r), () => F(G.qa(L, 3, r), G.dialog(L, 1, r, { short: true }))), '연습'),
      act('AI Free Talk', 'AI Free Talk', 6, 'chat', (L, r) => by(L, () => G.dialog(L, 1, r, { free: 1 }), () => G.dialog(L, 1, r, { free: 2 }), () => G.dialog(L, 1, r, { free: 4 })), '적용'),
      act('Speaking Check', 'Speaking Check', 3, 'clipboard', (L, r) => by(L, () => G.qa(L, 2, r), () => G.dialog(L, 1, r, { short: true }), () => G.dialog(L, 1, r, { short: true, surprise: true })), '확인'),
    ], hw: (L, r) => by(L, () => F(G.repeat(L, 3, r), G.qa(L, 1, r, { show: true })), () => G.qa(L, 3, r), () => F(G.dialog(L, 1, r, { free: 2 }), G.qa(L, 1, r))), ind: (L, r) => G.dialog(L, 1, r, { short: true }) },

    { no: 4, en: 'Read & Discover', ko: '가격표·가게 글 읽고 이해하기', goal: '가격표와 짧은 가게 글을 읽고, 물건과 가격 정보를 이해해요.', icon: 'book', c: 'leaf', tags: ['read'], lo: ['LO1', 'LO4'], acts: [
      act('Spaced Review', '복습', 3, 'refresh', (L, r, c) => rv(L, r, c, () => by(L, () => G.repeat(L, 3, r), () => F(G.readDialog(L, 2, r), G.respond(L, 1, r, { speak: 1 })), () => G.readDialog(L, 3, r))), '복습'),
      act('Reading Prep', '읽기 준비', 3, 'eye', (L, r) => by(L, () => rt(G.seeName(L, 3, r), 'read'), () => rt(G.exprMeaning(L, 3, r), 'read'), () => G.predict(L, 2, r)), '이해'),
      act('Sentence Reading', '문장 읽기', 4, 'book', (L, r) => by(L, () => F(G.sentenceReading(L), G.readAloud(L, 2, r)), () => F(G.sentenceReading(L), G.readAloud(L, 2, r)), () => F(G.sentenceReading(L), G.readAloud(L, 1, r), G.readMatch(L, 1, r))), '모델링'),
      act('Price Tag Reading', '가격표·가게 지문', 7, 'books', (L, r) => F({ k: 'text', text: PASS[L].a.text, ko: PASS[L].a.ko }, G.passageQs(L, 'a', 2)), '이해'),
      act('Find the Info', '읽고 정보 찾기', 5, 'target', (L, r) => F({ k: 'text', text: PASS[L].a.text, ko: PASS[L].a.ko, title: '다시 읽고 정보를 찾아요' }, PASS[L].a.qs.slice(2, 5), by(L, () => G.readMatch(L, 2, r), () => G.cardsDecide(L, 2, r), () => G.cardsDecide(L, 2, r))), '연습'),
      act('Reading Check', 'Reading Check', 3, 'clipboard', (L, r) => F({ k: 'text', text: PASS[L].b.text, ko: PASS[L].b.ko, test: true }, G.passageQs(L, 'b', 3)), '확인'),
    ], hw: (L, r) => by(L, () => F(G.readMatch(L, 3, r), G.readAloud(L, 1, r)), () => G.readDialog(L, 3, r), () => G.cardsDecide(L, 3, r)), ind: (L, r) => G.readDialog(L, 2, r) },

    { no: 5, en: 'Write & Share', ko: '가격 정보를 글로 쓰기', goal: '가격을 묻고 답하는 문장을 쓰고, 물건과 가격을 소개하는 짧은 글을 써요.', icon: 'pencil', c: 'teal', tags: ['write'], lo: ['LO5'], acts: [
      act('Spaced Review', '복습', 3, 'refresh', (L, r, c) => rv(L, r, c, () => by(L, () => G.readMatch(L, 3, r), () => G.qa(L, 3, r), () => G.writeKo(L, 2, r))), '복습'),
      act('Writing Model', '쓰기 모델 관찰', 3, 'eye', (L, r) => G.modelObs(L, 2, r), '모델링'),
      act('Build Sentences', '문장 구성', 5, 'swap', (L, r) => by(L, () => G.build(L, 5, r), () => F(G.build(L, 2, r), G.writeKo(L, 3, r)), () => G.writeKo(L, 4, r)), '연습'),
      act('Guided Writing', 'Guided Writing', 5, 'pencil', (L, r) => by(L, () => F(G.patternDrill(L, 3, r), [G.compose(L, 'self', r)]), () => [G.compose(L, 'friend', r)], () => [G.compose(L, 'friend', r)]), '연습'),
      act('Independent Writing', 'Independent Writing', 6, 'pencil', (L, r) => by(L, () => [G.compose(L, 'friend', r)], () => [G.compose(L, 'self', r)], () => [G.compose(L, 'self', r)]), '적용'),
      act('Writing Check', 'Writing Check', 3, 'clipboard', (L, r) => by(L, () => G.writeKo(L, 1, r), () => [G.compose(L, 'friend', r)], () => [G.compose(L, 'friend', r)]), '확인'),
    ], hw: (L, r) => by(L, () => F(G.patternDrill(L, 2, r), G.writeKo(L, 1, r)), () => G.writeKo(L, 3, r), () => [G.compose(L, 'self', r)]), ind: (L, r) => (isS(L) ? G.writeKo(L, 1, r) : [G.compose(L, 'friend', r)]) },

    { no: 6, en: 'My Store Mission', ko: '나의 가게 미션 (점수 없이 통합 연습)', goal: '듣고 읽고 말하고 쓴 것을 한데 모아, 나만의 가게를 열고 가격을 주고받아요. (평가는 7차시에서)', icon: 'flag', c: 'grape', tags: ['listen', 'speak', 'read', 'write'], lo: ['LO1', 'LO2', 'LO3', 'LO4', 'LO5'], acts: [
      act('Mission Briefing', 'Mission Briefing', 2, 'flag', (L, r) => brief6(L), '상황'),
      act('Listen & Identify', 'Listen & Identify', 4, 'headphones', (L, r) => by(L, () => [G.match(L, 2, r)], () => [G.match(L, 3, r)], () => [G.match(L, 4, r)]), '이해'),
      act('Need or Want?', '꼭 필요한 것? 갖고 싶은 것?', 4, 'eye', (L, r) => by(L, () => G.needWant(L, 2, r), () => F(G.needWant(L, 2, r), G.cardsDecide(L, 1, r)), () => F(G.needWant(L, 2, r), G.cardsDecide(L, 2, r))), '이해'),
      act('AI Store Talk', 'AI Store Talk', 8, 'chat', (L, r) => by(L, () => G.dialog(L, 2, r), () => G.dialog(L, 2, r), () => G.dialog(L, 2, r, { free: 2 })), '적용'),
      act('My Store Card', '나의 가게 소개 카드', 5, 'pencil', (L, r) => by(L, () => [G.compose(L, 'friend', r)], () => [G.compose(L, 'friend', r)], () => [G.compose(L, 'compare', r)]), '적용'),
      act('Mission Reflection', 'Mission Reflection', 3, 'refresh', (L, r, c) => by(L, () => ((c && c.weak === 'vocab') ? G.sayItem(L, 3, r) : G.repeat(L, 3, r)), () => G.fixIt(L, 2, r), () => G.natural(L, 2, r)), '정리'),
    ], hw: (L, r) => by(L, () => F(G.repeat(L, 3, r), G.qa(L, 2, r)), () => F(G.listenDialog(L, 1, r), G.respond(L, 2, r, { speak: 1 }), [G.compose(L, 'friend', r)]), () => F(G.dialog(L, 1, r, { free: 2 }), [G.compose(L, 'friend', r)])), ind: (L, r) => F(G.dialog(L, 1, r, { short: true }), [G.compose(L, 'friend', r)]) },
  ];
  const _compose = G.compose; G.compose = (L, kind, r, o) => _compose(L, kind === 'friend' ? 'shop' : kind, r, o);

  const TEST = { no: 7, en: 'Lesson Check', ko: '성취 확인', goal: '듣기·말하기·읽기·쓰기를 새 문항으로 짧게 확인해요. (교재 Wrap Up과 같은 영역, 다른 문제) 결과로 8차시가 정해져요.', icon: 'trophy', c: 'sun' };
  const testItems = (L) => {
    const r = rng('test9-' + L);
    return F(
      G.seeName(L, 1, r), G.hearPrice(L, 1, r),
      isA(L) ? G.exprAdv(L, 1, r) : G.exprMeaning(L, 1, r), G.thisThesePick(L, 1, r),
      G.hearItem(L, 1, r, { sentence: 1 }), G.listenDialog(L, 1, r), G.respond(L, 1, r, { choose: 1 }),
      G.qa(L, 2, r),
      { k: 'text', text: PASS[L].c.text, ko: PASS[L].c.ko, test: true }, G.passageQs(L, 'c', 3),
      G.build(L, 1, r), G.fill(L, 1, r), [G.compose(L, 'self', r)]
    );
  };

  const l8Acts = (plan, tagStats) => {
    const report = act('결과 확인', '내 결과 보기', 3, 'chart', () => [{ k: 'report', data: { tags: tagStats, plan } }], '확인');
    if (plan.type === 'challenge') {
      return [report,
        act('Free Store Talk', '자유 가게 대화', 6, 'chat', (L, r) => { const U = UP[L]; return setLv(G.dialog(U, 1, r, { free: 3 }), U); }, '심화'),
        act('Writing Challenge', '글쓰기 도전', 6, 'pencil', (L, r) => { const U = UP[L]; return setLv([G.compose(U, 'self', r), G.compose(U, 'compare', r)], U); }, '심화'),
        act('Compare & Think', '비교하고 생각하기', 6, 'eye', (L, r) => { const U = UP[L]; return setLv(F(G.cardsDecide(U, 4, r), G.followUp(U, 3, r)), U); }, '심화'),
        act('Next Step', '다음 도전', 4, 'books', (L, r) => { const U = UP[L]; return F([G.brief('Reading Pack으로 한 걸음 더!', 'Check 결과가 아주 좋아요. 원서 Reading Pack에서 새로운 이야기를 읽어 보세요. 읽은 결과는 따로 기록돼요.', [])], setLv(G.qa(U, 2, r), U)); }, '심화'),
      ];
    }
    const [t1, t2] = [plan.tags[0], plan.tags[1] || plan.tags[0]];
    const mixedName = plan.type === 'mixed' ? ['Mixed Challenge', '보강 + 도전'] : ['Mixed Challenge', '섞어서 도전'];
    return [report,
      act(`Boost · ${MG.TAGS[t1].ko}`, `${MG.TAGS[t1].ko} 보강`, 6, MG.TAGS[t1].icon, (L, r) => takeScored(REM[t1](L, rng(`l8a9-${L}-${t1}`)), 7), '보강'),
      act(`Boost · ${MG.TAGS[t2].ko}`, `${MG.TAGS[t2].ko} 보강`, 6, MG.TAGS[t2].icon, (L, r) => takeScored(REM[t2](L, rng(`l8b9-${L}-${t2}${t1 === t2 ? 'x' : ''}`)), 7), '보강'),
      act(mixedName[0], mixedName[1], 6, 'sparkles', (L, r) => {
        const pool = F(REM[t1](L, rng('l8m19' + L)), REM[t2](L, rng('l8m29' + L))).filter(isQ);
        const base = r.take(pool, 4);
        if (plan.type !== 'mixed') return r.take(pool, 6);
        const U = UP[L]; const upItems = setLv(F(...plan.up.map((u) => REM[u](U, rng('l8u9' + L + u)))).filter(isQ).slice(0, 2), U);
        return [...base, ...upItems];
      }, '도전'),
      act('Re-check', '다시 확인', 4, 'clipboard', (L, r) => F(REM[t1](L, rng('l8r9' + L + t1)), REM[t2](L, rng('l8s9' + L + t2))).filter(isQ).slice(0, 4), '확인'),
    ];
  };

  const actItems = (lesson, idx, L, plan, tagStats, ctx) => {
    const r = rng(`u9-${lesson.no}-${idx}-${L}`);
    if (lesson.no === 7) return testItems(L);
    const acts = lesson.no === 8 ? l8Acts(plan, tagStats) : lesson.acts;
    return acts[idx].build(L, r, ctx || {});
  };
  const hwItems = (lesson, L, opt = {}) => {
    const no = lesson.no, weak = (opt.weak || []).filter((t) => REM[t]);
    const common = takeScored(lesson.hw(L, rng(`hw9-${no}-${L}`)), 3).map((i) => ({ ...i, part: 'common' }));
    let mid, part = 'weak';
    if (weak.length) {
      const pool = F(...weak.map((t) => REM[t](L, rng(`hwx9-${no}-${L}-${t}`))));
      mid = takeScored(rng(`hwy9-${no}-${L}`).shuf(pool.filter(isQ)).slice(0, 5), 5);
    } else {
      part = 'ext'; const U = UP[L], t = lesson.tags[0];
      mid = setLv(takeScored(REM[t](U, rng(`hwe9-${no}-${L}`)), 5), U);
    }
    mid = mid.map((i) => ({ ...i, part }));
    const indep = takeScored(lesson.ind(L, rng(`hwi9-${no}-${L}`)), 2).map((i) => ({ ...i, part: 'indep' }));
    return [...common, ...mid, ...indep];
  };

  /* ---------- Reading Pack (원서: 교과서 밖 확장 · 자체 제작 예시) ---------- */
  const B = (id, L, title, ko, icon, col, pages, qs) => ({ id, L, title, ko, icon, col, pages, qs });
  const BOOKS = [
    B('u9s1', 'SUPPORT', 'Mina\'s Hat', '미나의 모자', 'sprout', 'leaf', ["This is Mina's store.\nLook at this hat.", 'The hat is ten thousand won.', 'Ken asks, "How much is this hat?"\nMina says, "It\'s ten thousand won."', 'Ken says, "Thank you!"'], [QT_('What does Mina sell?', 'A hat', 'Shoes', 'Socks'), QT_('How much is the hat?', 'Ten thousand won', 'Two thousand won', 'Fifty thousand won')]),
    B('u9s2', 'SUPPORT', 'Socks for Mom', '엄마를 위한 양말', 'star', 'berry', ['Lily wants socks for her mom.', '"How much are these socks?"\n"They\'re two thousand won."', '"Yes, please!" says Lily.', 'Lily gives the socks to her mom.\nMom says, "Thank you, Lily!"'], [QT_('Who are the socks for?', "Lily's mom", 'Lily', 'Ken'), QT_('How much are the socks?', 'Two thousand won', 'Ten thousand won', 'Fifty thousand won')]),
    B('u9c1', 'CORE', 'The Cold Day Jacket', '추운 날의 재킷', 'user', 'sky', ['It is a cold day. Tom has no jacket.', 'He sees a store. "How much is this jacket?" he asks.', '"It\'s thirty thousand won," says Wei.', 'Tom has only twenty thousand won. He is sad.', 'Wei smiles. "It\'s on sale today. Twenty thousand won!" Tom says, "Thank you!"'], [QT_('Why is Tom sad?', 'He has only twenty thousand won.', 'He lost his hat.', 'It is hot.'), QT_('How much is the jacket at first?', 'Thirty thousand won', 'Twenty thousand won', 'Ten thousand won'), QT_('How does the story end?', 'The jacket is twenty thousand won today.', 'Tom does not buy it.', 'Tom goes home.')]),
    B('u9c2', 'CORE', 'A Good Shopper', '똑똑한 쇼핑', 'send', 'grape', ['Mia has fifteen thousand won. She wants sunglasses.', 'The sunglasses are thirteen thousand won. They are cool!', 'But Mia has no socks. Her socks are old.', '"Socks are a need," she thinks. "Sunglasses are a want."', 'Mia buys the socks. They are two thousand won. She saves the rest.'], [QT_('How much are the sunglasses?', 'Thirteen thousand won', 'Two thousand won', 'Fifty thousand won'), QT_('What does Mia buy?', 'Socks', 'Sunglasses', 'Shoes'), QT_('Why does Mia buy socks?', 'She needs them.', 'They are cool.', 'They are on sale.')]),
    B('u9a1', 'ADVANCED', 'The Big Sale', '빅 세일', 'target', 'mango', ['The Sunrise Store has a big sale today.', 'The shoes are usually fifty thousand won, but today they are forty thousand won. "They are still expensive," says Wei.', 'The hat is usually ten thousand won, and today it is five thousand won. "What a good price!" says Ana.', 'Wei checks his money. He has thirty thousand won. He looks at the shorts instead.'], [QT_('Why is today special?', 'There is a big sale.', 'It is a holiday.', 'The store is new.'), QT_('How much are the shoes today?', 'Forty thousand won', 'Fifty thousand won', 'Thirty thousand won'), QT_('Why does Wei look at the shorts?', 'The shoes are too expensive for him.', 'He has no money.', 'The store is closed.')]),
    B('u9a2', 'ADVANCED', 'My Store Flyer', '나의 가게 전단지', 'send', 'sky', ['Diego makes a flyer for his store.', 'Look at these sunglasses. They are thirteen thousand won.', 'Look at this jacket. It is thirty thousand won. It is on sale today.', 'Diego puts the flyer on the school board. Many students come and see.'], [QT_('What does Diego make?', 'A flyer', 'A card', 'A letter'), QT_('What is on sale?', 'The jacket', 'The sunglasses', 'The hat'), QT_('Where does Diego put the flyer?', 'On the school board', 'At home', 'In the park')]),
  ];
  const bookItems = (b) => F(b.pages.map((t) => ({ k: 'text', text: t, ko: null, book: true })), b.qs);

  /* ---------- AI 가게 주인 (규칙 기반 · 나중에 Claude API로 교체) ---------- */
  const norm = (s) => String(s).toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();
  const findItem = (s, L) => {
    for (const id of POOL[L]) { const n = IT[id].n; if (new RegExp('\\b' + n + 's?\\b').test(s)) return id; }
    return null;
  };
  const ai = ({ persona, text, level }) => {
    const L = level || 'CORE', s = norm(text), R = (reply, intent) => ({ reply, ok: true, intent });
    const own = PEOPLE[persona.key].c; let m, id;
    if (/how much (is|are) (.+)/.test(s) || /\bwhat('s| is) the price\b/.test(s)) {
      id = findItem(s, L);
      if (!id && /\b(it|this|that|they|these|those)\b/.test(s)) id = own;
      if (id) return R(`${AN(id)}${level !== 'SUPPORT' && IT[id].pr >= 30000 ? " It's a little expensive." : ''}`, 'askPrice');
      return R("Sorry, I only have hats, sunglasses, jackets, shorts, socks, and shoes. Look around!", 'noItem');
    }
    if ((m = s.match(/do you have (a |an |any |some )?(.+)/))) {
      id = findItem(m[2], L);
      return id ? R(`Yes, I do! ${LOOK(id)} ${AN(id)}`, 'askHave') : R("Sorry, I don't have that.", 'noItem');
    }
    if (/\b(too expensive|expensive)\b/.test(s)) { const c = POOL[L].filter((x) => IT[x].pr < IT[own].pr)[0]; return R(c ? `How about ${D(c)}? ${AN(c)}` : "OK. It's on sale for you!", 'comment'); }
    if (/\b(cheap|good price)\b/.test(s)) return R('Thank you! It is a good price.', 'comment');
    if (/^yes,? please/.test(s) || /^yes\b.*please/.test(s)) return R(`OK. ${LOOK(own)}`, 'yesno');
    if (/may i help you/.test(s)) return R('Yes, please. How much are these?', 'greet');
    if (/i('ll| will) take/.test(s)) return R('Thank you! Come again!', 'take');
    if (/thank/.test(s)) return R("You're welcome!", 'greet');
    if (/^(hi|hello)\b/.test(s)) return R(`Hello! ${HELP}`, 'greet');
    if (/what.*(sell|have)|what do you have/.test(s)) return R(`I have ${POOL[L].slice(0, 4).map((x) => IT[x].a).join(', ')} and more.`, 'askStock');
    if (/^(yes|no)\b/.test(s)) return R('OK! Look at my store.', 'yesno');
    return { reply: "Sorry, I didn't get that. Let's talk about the store. May I help you?", ok: false, intent: 'offTopic' };
  };

  MG.UNITS = MG.UNITS || {};
  MG.BANKS2 = { EXPR_BANK, EXPR_ADV, FOLLOW, PRED, ERR, NAT, SENT, POOL };
  MG.UNITS[2] = { UNIT, LESSONS, TEST, testItems, l8Acts, actItems, hwItems, REM, LO, BOOKS, bookItems, PASS, PEOPLE, unitAi: ai };
})();
