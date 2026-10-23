/* Mango English · 콘텐츠 엔진
 * Unit 1 "Where Are You From?" (초5 샘플) — 레벨(SUPPORT/CORE/ADVANCED)별 1~6차시, 7차시 Test, 8차시 보강/심화
 * 문항은 '생성기(G)'가 레벨 파라미터로 만들고, 모든 문항에는 영역 태그(tag)가 붙어 Test 집계와 8차시 구성에 쓰입니다.
 */
(function () {
  const MG = (window.MG = window.MG || {});

  /* ---------- 기본 데이터 ---------- */
  MG.TAGS = {
    vocab: { ko: '어휘', icon: 'abc', c: 'mango' },
    expr: { ko: '표현', icon: 'chat', c: 'grape' },
    listen: { ko: '듣기', icon: 'headphones', c: 'sky' },
    speak: { ko: '말하기', icon: 'mic', c: 'berry' },
    read: { ko: '읽기', icon: 'book', c: 'leaf' },
    write: { ko: '쓰기', icon: 'pencil', c: 'teal' },
  };
  const CO = (MG.COUNTRIES = {
    kr: { en: 'Korea', ko: '한국' }, cn: { en: 'China', ko: '중국' }, jp: { en: 'Japan', ko: '일본' },
    ca: { en: 'Canada', ko: '캐나다' }, us: { en: 'the United States', ko: '미국' }, au: { en: 'Australia', ko: '호주' },
    in: { en: 'India', ko: '인도' }, br: { en: 'Brazil', ko: '브라질' }, fr: { en: 'France', ko: '프랑스' },
    eg: { en: 'Egypt', ko: '이집트' }, mx: { en: 'Mexico', ko: '멕시코' }, es: { en: 'Spain', ko: '스페인' },
  });
  const POOL = {
    SUPPORT: ['kr', 'jp', 'cn', 'ca', 'us', 'au'],
    CORE: ['kr', 'jp', 'cn', 'ca', 'us', 'au', 'in', 'br', 'fr', 'eg'],
    ADVANCED: ['kr', 'jp', 'cn', 'ca', 'us', 'au', 'in', 'br', 'fr', 'eg', 'mx', 'es'],
  };
  const PEOPLE = (MG.PEOPLE = {
    mina: { n: 'Mina', c: 'kr', g: 'she', city: 'Seoul', like: 'drawing', col: '#FF7A59' },
    ken: { n: 'Ken', c: 'jp', g: 'he', city: 'Tokyo', like: 'soccer', col: '#3A9BFF' },
    lily: { n: 'Lily', c: 'ca', g: 'she', city: 'Toronto', like: 'swimming', col: '#22B07D' },
    tom: { n: 'Tom', c: 'us', g: 'he', city: 'New York', like: 'basketball', col: '#7B61FF' },
    mia: { n: 'Mia', c: 'au', g: 'she', city: 'Sydney', like: 'dancing', col: '#FF5C7A' },
    wei: { n: 'Wei', c: 'cn', g: 'he', city: 'Beijing', like: 'ping-pong', col: '#12B5C2' },
    priya: { n: 'Priya', c: 'in', g: 'she', city: 'Delhi', like: 'cooking', col: '#F59E0B' },
    leo: { n: 'Leo', c: 'br', g: 'he', city: 'Rio', like: 'music', col: '#16A34A' },
    sofia: { n: 'Sofia', c: 'fr', g: 'she', city: 'Paris', like: 'painting', col: '#D946EF' },
    omar: { n: 'Omar', c: 'eg', g: 'he', city: 'Cairo', like: 'history', col: '#0EA5E9' },
    diego: { n: 'Diego', c: 'mx', g: 'he', city: 'Mexico City', like: 'guitar', col: '#EF4444' },
    ana: { n: 'Ana', c: 'es', g: 'she', city: 'Madrid', like: 'tennis', col: '#EA580C' },
  });
  const cEn = (id) => CO[id].en;
  const isS = (L) => L === 'SUPPORT';
  const isA = (L) => L === 'ADVANCED';
  const by = (L, s, c, a) => (L === 'SUPPORT' ? s() : L === 'CORE' ? c() : a());
  const F = (...p) => p.flat();
  const UP = { SUPPORT: 'CORE', CORE: 'ADVANCED', ADVANCED: 'ADVANCED' };

  MG.UNIT = {
    no: 1,
    title: 'Where Are You From?',
    sub: '출신 국가를 묻고 답하기',
    goal: '다른 나라 친구에게 출신 국가를 묻고 답하며, 처음 만난 친구를 소개할 수 있어요.',
    exp: [
      { en: 'Where are you from?', ko: '너는 어디 출신이니?' },
      { en: "I'm from Korea.", ko: '나는 한국 출신이야.' },
      { en: 'Are you from Canada?', ko: '너는 캐나다 출신이니?' },
      { en: "Yes, I am. / No, I'm not.", ko: '응, 맞아. / 아니, 아니야.' },
      { en: 'Nice to meet you.', ko: '만나서 반가워.' },
    ],
  };
  MG.LEVELS = {
    SUPPORT: { ko: '쏙쏙 기초', desc: '도움을 받아 이해하고, 마지막엔 혼자 말해요', icon: 'sprout', words: '국가 6개', read: '20~40단어', write: '문장 완성 → 한 문장' },
    CORE: { ko: '탄탄 기본', desc: '핵심 표현을 스스로 말하고 써요', icon: 'tree', words: '국가 10개', read: '50~80단어', write: '2~3문장' },
    ADVANCED: { ko: '쑥쑥 도전', desc: '빠르게 확인하고 새 상황으로 넓혀요', icon: 'rocket', words: '국가 12개+', read: '100~150단어', write: '4~6문장' },
  };

  /* ---------- 시드 난수 (같은 Activity는 같은 문항) ---------- */
  function rng(seed) {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    const next = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const shuf = (arr) => { const x = arr.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
    return {
      next, shuf,
      pick: (arr) => arr[Math.floor(next() * arr.length)],
      take(arr, n) { let out = []; while (out.length < n) out = out.concat(shuf(arr)); return out.slice(0, n); },
    };
  }
  MG.rng = rng;

  const peopleIn = (L) => Object.keys(PEOPLE).filter((k) => POOL[L].includes(PEOPLE[k].c));
  const typed = (L) => POOL[L].filter((id) => id !== 'us');
  const fo = (id) => ({ t: cEn(id), flag: id, sub: CO[id].ko });
  function countryOpts(L, correct, r, n = 3, forced) {
    const others = forced || r.shuf(POOL[L].filter((x) => x !== correct)).slice(0, n - 1);
    const ids = r.shuf([correct, ...others]);
    return { opts: ids.map(fo), a: ids.indexOf(correct) };
  }
  const tg = (items, tag) => items.map((i) => (i.tag === undefined || tag ? { ...i, tag: tag || i.tag } : i));

  /* ---------- 문항 생성기 ---------- */
  const G = {};
  G.cards = (L, n) => ({ k: 'learn', title: '나라 이름을 눌러서 들어 보세요', cards: POOL[L].slice(0, n).map((id) => ({ flag: id, en: cEn(id), ko: CO[id].ko })) });
  G.exprCards = (L) => ({
    k: 'learn', title: '핵심 표현을 눌러서 들어 보세요',
    cards: [
      { icon: 'chat', en: 'Where are you from?', ko: '너는 어디 출신이니?' },
      { icon: 'flag', en: "I'm from Korea.", ko: '나는 한국 출신이야.' },
      { icon: 'swap', en: 'Are you from Canada?', ko: '너는 캐나다 출신이니?' },
      { icon: 'check', en: "Yes, I am. / No, I'm not.", ko: '응, 맞아. / 아니, 아니야.', say: "Yes, I am. No, I'm not." },
      { icon: 'sparkles', en: 'Nice to meet you.', ko: '만나서 반가워.' },
    ].slice(0, isS(L) ? 4 : 5),
  });

  G.hearFlag = (L, n, r, o = {}) => r.take(POOL[L], n).map((id) => {
    const { opts, a } = countryOpts(L, id, r);
    return { k: 'choose', tag: o.sentence ? 'listen' : 'vocab', say: o.sentence ? `I'm from ${cEn(id)}.` : cEn(id), q: o.sentence ? '들은 문장의 나라를 고르세요' : '들은 나라를 고르세요', opts, a, fb: `${cEn(id)} = ${CO[id].ko}`, ...(o.reteach ? { reteach: { k: 'learn', title: '틀린 나라만 다시 익혀요', cards: [{ flag: id, en: cEn(id), ko: CO[id].ko }] } } : {}) };
  });
  G.seeName = (L, n, r) => r.take(POOL[L], n).map((id) => {
    const names = r.shuf(POOL[L].filter((x) => x !== id)).slice(0, 2);
    const ids = r.shuf([id, ...names]);
    return { k: 'choose', tag: 'vocab', flag: id, q: '이 나라의 이름은 무엇일까요?', opts: ids.map((x) => ({ t: cEn(x) })), a: ids.indexOf(id), fb: `${cEn(id)} = ${CO[id].ko}` };
  });
  G.sayCountry = (L, n, r) => r.take(POOL[L], n).map((id) => ({ k: 'speak', tag: 'speak', flag: id, prompt: '이 나라 이름을 영어로 말해 보세요', target: cEn(id), accept: [cEn(id), cEn(id).replace('the ', '')], hide: !isS(L), listen: true }));
  G.context = (L, n, r) => r.take(peopleIn(L), n).map((k) => {
    const p = PEOPLE[k]; const { opts, a } = countryOpts(L, p.c, r);
    return { k: 'choose', tag: 'vocab', bubble: `${p.n} says, "I'm from ${cEn(p.c)}."`, q: `Where is ${p.n} from?`, opts, a, fb: `${p.n} → ${cEn(p.c)}` };
  });

  const EXPR_BANK = [
    { q: '"Where are you from?"는 무엇을 묻는 말일까요?', o: ['어느 나라 출신인지', '몇 살인지', '이름이 무엇인지'], fb: '출신 나라를 물을 때 써요.' },
    { q: '"I\'m from Korea."는 무슨 뜻일까요?', o: ['나는 한국 출신이에요.', '나는 한국에 가요.', '나는 한국어를 해요.'], fb: "I'm from ~ = 나는 ~ 출신이에요." },
    { q: '"Are you from Canada?"에 "Yes, I am."이라고 하면?', o: ['캐나다 출신이 맞아요', '캐나다 출신이 아니에요', '캐나다에 가고 싶어요'], fb: 'Yes, I am. = 응, 맞아.' },
    { q: '"No, I\'m not."은 언제 쓰나요?', o: ['아니라고 대답할 때', '처음 만났을 때', '고맙다고 말할 때'], fb: "No, I'm not. = 아니, 아니야." },
    { q: '"Nice to meet you."는 언제 쓰나요?', o: ['처음 만나서 인사할 때', '헤어질 때', '사과할 때'], fb: '처음 만났을 때 하는 인사예요.' },
    { q: '"Nice to meet you, too."는 어떤 말에 대한 대답일까요?', o: ['Nice to meet you.', 'Where are you from?', 'Are you from Japan?'], fb: '"만나서 반가워"에는 "나도 반가워(too)"라고 답해요.' },
  ];
  const EXPR_ADV = [
    { q: 'Are you from Japan?에 어울리지 않는 대답은?', o: ['Nice to meet you, too.', 'Yes, I am.', "No, I'm not."], fb: '출신을 묻는 질문에는 Yes/No로 답해요.' },
    { q: '올바른 문장은?', o: ["I'm from Brazil.", 'I from Brazil.', 'I am Brazil from.'], fb: "I'm from + 나라 이름" },
    { q: '상대가 "No, I\'m not."이라고 했어요. 이어지는 말로 자연스러운 것은?', o: ["I'm from Spain.", 'Yes, I am.', 'Nice to meet you, too.'], fb: '아니라고 한 뒤에는 실제 출신을 말해요.' },
    { q: '"Where are you from?"과 "Are you from Spain?"의 차이는?', o: ['앞은 나라를 묻고, 뒤는 Yes/No로 확인해요', '둘 다 이름을 물어요', '둘 다 나이를 물어요'], fb: 'Where → 어디, Are you → 맞는지 확인' },
  ];
  G.exprMeaning = (L, n, r) => r.take(EXPR_BANK, n).map((x) => ({ k: 'choose', tag: 'expr', q: x.q, opts: x.o.map((t) => ({ t })), a: 0, fb: x.fb }));
  G.exprAdv = (L, n, r) => r.take(EXPR_ADV, n).map((x) => ({ k: 'choose', tag: 'expr', q: x.q, opts: x.o.map((t) => ({ t })), a: 0, fb: x.fb }));

  function dlgAudio(L, r) {
    const ids = r.take(peopleIn(L), 3); const [p1, p2, p3] = ids.map((k) => PEOPLE[k]);
    let lines, q, a, forced;
    if (isS(L)) {
      lines = [`Hi! I'm ${p1.n}. Where are you from?`, `I'm ${p2.n}. I'm from ${cEn(p2.c)}.`]; q = `Where is ${p2.n} from?`; a = p2.c;
    } else if (!isA(L)) {
      lines = ['Hi! Nice to meet you.', `Nice to meet you, too. I'm ${p2.n}. Where are you from?`, `I'm ${p1.n}. I'm from ${cEn(p1.c)}.`, `Oh, are you from ${p1.city}?`, 'Yes, I am.']; q = `Where is ${p1.n} from?`; a = p1.c;
    } else {
      lines = [`Hi, I'm ${p1.n}. Are you from ${cEn(p3.c)}?`, `No, I'm not. I'm ${p2.n}. I'm from ${cEn(p2.c)}. Where are you from?`, `I'm from ${cEn(p1.c)}.`, 'Nice to meet you.', 'Nice to meet you, too.']; q = `Where is ${p2.n} from?`; a = p2.c; forced = [p3.c, p1.c];
    }
    const { opts, a: ai } = countryOpts(L, a, r, 3, forced);
    return { k: 'choose', tag: 'listen', say: lines.join(' '), script: lines, q, opts, a: ai, fb: `정답은 ${cEn(a)}!` };
  }
  G.listenDialog = (L, n, r) => Array.from({ length: n }, () => dlgAudio(L, r));
  G.match = (L, n, r) => {
    const keys = r.take(peopleIn(L), n);
    return { k: 'match', tag: 'listen', title: '소개를 듣고 인물과 나라를 연결하세요', pairs: keys.map((k) => ({ key: k, say: `I'm ${PEOPLE[k].n}. I'm from ${cEn(PEOPLE[k].c)}.` + (isA(L) ? ` I like ${PEOPLE[k].like}.` : '') })), right: r.shuf(keys.map((k) => PEOPLE[k].c)) };
  };
  G.respond = (L, n, r, o = {}) => r.take(peopleIn(L), n).map((k, i) => {
    const p = PEOPLE[k]; const yes = i % 2 === 0;
    const other = r.pick(POOL[L].filter((x) => x !== p.c)); const askId = yes ? p.c : other;
    const question = `Are you from ${cEn(askId)}?`; const ctx = { key: k, line: `You are ${p.n} from ${cEn(p.c)}.` };
    if ((isS(L) || o.choose) && !o.speak) return { k: 'choose', tag: 'listen', say: question, ctx, q: '알맞은 대답을 고르세요', opts: [{ t: 'Yes, I am.' }, { t: "No, I'm not." }], a: yes ? 0 : 1, fb: yes ? `${p.n}은(는) ${cEn(p.c)} 출신이니까 Yes!` : `${p.n}은(는) ${cEn(p.c)} 출신이니까 No!` };
    const target = yes ? 'Yes, I am.' : "No, I'm not.";
    return { k: 'speak', tag: 'speak', ctx, ask: question, prompt: '질문을 듣고 대답해 보세요', target, accept: yes ? [target] : [target, `No, I'm not. I'm from ${cEn(p.c)}.`], hide: true, listen: false };
  });
  const FOLLOW = [
    { b: "I'm from Brazil.", o: ['Are you from Rio?', 'I am Brazil.', 'Goodbye.'] },
    { b: "No, I'm not. I'm from Spain.", o: ['Oh, are you from Madrid?', 'Yes, I am.', 'Nice to meet you, too.'] },
    { b: "I'm from Korea.", o: ["Oh! I'm from Korea, too!", "I'm not from Korea.", 'Where are you from?'] },
    { b: 'Nice to meet you.', o: ['Nice to meet you, too.', 'Yes, I am.', "No, I'm not."] },
  ];
  G.followUp = (L, n, r) => r.take(FOLLOW, n).map((x) => ({ k: 'choose', tag: 'expr', say: x.b, bubble: x.b, q: '자연스럽게 이어지는 말을 고르세요', opts: x.o.map((t) => ({ t })), a: 0 }));

  const REP = [
    () => 'Where are you from?', (id) => `I'm from ${cEn(id)}.`, (id) => `Are you from ${cEn(id)}?`,
    () => 'Yes, I am.', () => "No, I'm not.", () => 'Nice to meet you.',
  ];
  G.repeat = (L, n, r) => r.take(REP, n).map((f) => {
    const id = r.pick(POOL[L]); const t = f(id);
    return { k: 'speak', tag: 'speak', prompt: '듣고 따라 말해 보세요', target: t, accept: [t], listen: true, autoplay: true, hide: !isS(L), flag: /from (?!the$)/.test(t) && t.includes(cEn(id)) ? id : undefined };
  });
  G.patternDrill = (L, n, r) => {
    if (isS(L)) return r.take(typed(L), n).map((id) => ({ k: 'fill', tag: 'expr', flag: id, q: "I'm from ___.", ans: cEn(id), hintAuto: true, fb: `I'm from ${cEn(id)}.` }));
    if (!isA(L)) {
      const bank = [(id) => ({ q: `Are you ___ ${cEn(id)}?`, ans: 'from', flag: id }), () => ({ q: 'Yes, I ___.', ans: 'am' }), () => ({ q: "No, I'm ___.", ans: 'not' }), () => ({ q: 'Where are you ___?', ans: 'from' }), (id) => ({ q: `I'm ___ ${cEn(id)}.`, ans: 'from', flag: id }), (id) => ({ q: `___ you from ${cEn(id)}?`, ans: 'Are', flag: id })];
      return r.take(bank, n).map((f) => { const x = f(r.pick(typed(L))); return { k: 'fill', tag: 'expr', ...x }; });
    }
    const bank = ["Are you from Tokyo, Japan?", "No, I'm not. I'm from Brazil.", "Hi! I'm Mina. I'm from Korea.", 'Nice to meet you, too. Where are you from?', "Yes, I am. Are you from Canada?"];
    return r.take(bank, n).map((s) => ({ k: 'build', tag: 'expr', ans: s, words: s.split(' ') }));
  };
  G.guidedSpeak = (L, n, r) => r.take(peopleIn(L), n).map((k, i) => {
    const p = PEOPLE[k]; const ctx = { key: k, line: `${p.n} · ${cEn(p.c)}` };
    if (isS(L)) { const t = `I'm from ${cEn(p.c)}.`; return { k: 'speak', tag: 'speak', ctx, prompt: `${p.n}이(가) 되어 말해 보세요`, target: t, accept: [t], listen: true }; }
    if (!isA(L)) {
      if (i % 2 === 0) { const t = `Are you from ${cEn(p.c)}?`; return { k: 'speak', tag: 'speak', ctx, prompt: `${p.n}에게 출신을 확인하는 질문을 해 보세요`, target: t, accept: [t], hide: true }; }
      const t = `I'm from ${cEn(p.c)}.`; return { k: 'speak', tag: 'speak', ctx, prompt: `${p.n}이(가) 되어 출신을 말해 보세요`, target: t, accept: [t, `I am from ${cEn(p.c)}.`], hide: true };
    }
    const t = `Nice to meet you. Where are you from?`;
    return { k: 'speak', tag: 'speak', ctx, prompt: `처음 만난 ${p.n}에게 인사하고 출신을 물어보세요`, target: t, accept: [t, 'Where are you from?', `Nice to meet you. Are you from ${cEn(p.c)}?`], hide: true };
  });
  G.dialog = (L, n, r, o = {}) => Array.from({ length: n }, () => {
    const k = r.pick(peopleIn(L)); const p = PEOPLE[k]; const C = cEn(p.c);
    const ak = p.c === 'ca' ? 'ken' : 'lily'; const ap = PEOPLE[ak]; const AC = cEn(ap.c);
    const O = cEn(r.pick(POOL[L].filter((x) => x !== p.c && x !== ap.c)));
    const me = (accept, opts) => ({ who: 'me', accept, opts });
    let turns;
    if (isS(L)) {
      turns = [
        { who: 'ai', text: 'Hi! Nice to meet you.' }, me(['Nice to meet you, too.'], ['Nice to meet you, too.', 'Thank you.', 'Goodbye.']),
        { who: 'ai', text: 'Where are you from?' }, me([`I'm from ${C}.`], [`I'm from ${C}.`, `I'm ${p.n}.`, 'Yes, I am.']),
        { who: 'ai', text: `Are you from ${O}?` }, me(["No, I'm not."], ["No, I'm not.", 'Yes, I am.', 'Nice to meet you.']),
      ];
      if (o.short) turns = turns.slice(0, 4);
      turns[turns.length - 1].ind = true; // 마지막 턴은 도움 없이
    } else if (!isA(L)) {
      turns = [
        { who: 'ai', text: 'Hi! Nice to meet you.' }, me(['Nice to meet you, too.']),
        { who: 'ai', text: 'Where are you from?' }, me([`I'm from ${C}.`, `I am from ${C}.`]),
        { who: 'ai', text: `Are you from ${O}?` }, me(["No, I'm not.", `No, I'm not. I'm from ${C}.`]),
        { who: 'ai', text: `Are you from ${C}?` }, me(['Yes, I am.']),
      ];
      if (o.short) turns = turns.slice(0, 6);
    } else {
      turns = [
        { who: 'ai', text: `Hi! I'm ${ap.n}. Nice to meet you.` }, me(['Nice to meet you, too.', `Nice to meet you, too. I'm ${p.n}.`]),
        { who: 'ai', text: 'Where are you from?' }, me([`I'm from ${C}.`, `I'm from ${p.city}, ${C}.`]),
        { who: 'ai', text: `Are you from ${O}?` }, me(["No, I'm not.", `No, I'm not. I'm from ${C}.`]),
        { who: 'ai', text: `Oh, I see. I'm from ${AC}.` }, { who: 'me', accept: [`Are you from ${ap.city}?`, `Where are you from in ${AC}?`], re: /\b(are you from|where (are|do) you (come )?from)\b/i },
        { who: 'ai', text: "Yes, I am! Let's be friends." }, { who: 'me', free: true, accept: ['Sure!'] },
      ];
      if (o.short) turns = turns.slice(0, 6);
      if (o.surprise) turns.push({ who: 'ai', text: `By the way, do you like ${ap.like}?` }, { who: 'me', accept: ['Yes, I do.', "No, I don't."], re: /\b(yes|no)\b/i });
    }
    return { k: 'dialog', tag: 'speak', lo: 'LO3', persona: { key: k, line: `You are ${p.n} from ${C}.` }, ai: { key: ak }, turns, free: o.free ? { n: o.free, example: `Are you from ${ap.city}?`, prompt: `Now ask me anything! I'm ${ap.n}. I'm from ${AC}.` } : null };
  });

  /* ---- 읽기 ---- */
  const QC = (q, id, w1, w2) => { const ids = [id, w1, w2]; return { k: 'choose', tag: 'read', q, opts: ids.map(fo), a: 0 }; };
  const QT = (q, a, w1, w2) => ({ k: 'choose', tag: 'read', q, opts: [a, w1, w2].map((t) => ({ t })), a: 0 });
  const PASS = {
    SUPPORT: {
      a: {
        text: "Hello! I'm Mina. I'm from Korea.\nThis is Ken. He is from Japan.\nWe are friends.\nNice to meet you!",
        ko: '안녕! 나는 미나야. 나는 한국 출신이야. 이쪽은 켄이야. 그는 일본 출신이야. 우리는 친구야. 만나서 반가워!',
        qs: [QC('Where is Mina from?', 'kr', 'jp', 'cn'), QC('Where is Ken from?', 'jp', 'kr', 'au'), QT('Who is from Japan?', 'Ken', 'Mina', 'Tom'), QT('Are Mina and Ken friends?', 'Yes, they are.', "No, they aren't.", 'I don\'t know.'), QT('"Nice to meet you!"는 언제 쓰는 말일까요?', '처음 만났을 때', '헤어질 때', '사과할 때')],
      },
      b: {
        text: "I'm Tom. I'm from the United States.\nThis is Lily. She is from Canada.\nTom and Lily are in the same class.\nThey say, \"Nice to meet you!\"",
        ko: '나는 톰이야. 나는 미국 출신이야. 이쪽은 릴리야. 그녀는 캐나다 출신이야. 톰과 릴리는 같은 반이야. 그들은 "만나서 반가워!"라고 말해.',
        qs: [QC('Where is Tom from?', 'us', 'ca', 'kr'), QC('Where is Lily from?', 'ca', 'us', 'jp'), QT('Are Tom and Lily in the same class?', 'Yes, they are.', "No, they aren't.", 'I don\'t know.')],
      },
      c: {
        text: 'This is Mia. She is from Australia.\nShe likes dancing.\nThis is Wei. He is from China.\nHe likes ping-pong.\nMia and Wei are new friends.',
        ko: '이쪽은 미아야. 그녀는 호주 출신이야. 그녀는 춤추기를 좋아해. 이쪽은 웨이야. 그는 중국 출신이야. 그는 탁구를 좋아해. 미아와 웨이는 새 친구야.',
        qs: [QC('Where is Mia from?', 'au', 'cn', 'ca'), QC('Where is Wei from?', 'cn', 'au', 'jp'), QT('What does Mia like?', 'Dancing', 'Ping-pong', 'Cooking')],
      },
    },
    CORE: {
      a: {
        text: 'Hello! My name is Mina. I\'m from Korea. I\'m in Class 5.\nToday I meet a new friend. His name is Ken.\nI ask, "Where are you from?"\nHe says, "I\'m from Japan."\nI ask, "Are you from Tokyo?"\nHe says, "Yes, I am."\nWe are happy. Nice to meet you, Ken!',
        ko: '안녕! 내 이름은 미나야. 나는 한국 출신이고 5반이야. 오늘 새 친구를 만나. 이름은 켄이야. 나는 "너는 어디 출신이니?"라고 물어. 그는 "나는 일본 출신이야."라고 말해. 나는 "도쿄 출신이니?"라고 물어. 그는 "응, 맞아."라고 말해. 우리는 행복해. 만나서 반가워, 켄!',
        qs: [QC('Where is Ken from?', 'jp', 'kr', 'ca'), QT('Is Ken from Tokyo?', 'Yes, he is.', "No, he isn't.", 'I don\'t know.'), QT('What does Mina ask first?', 'Where are you from?', 'Are you from Tokyo?', 'What is your name?'), QT('Which class is Mina in?', 'Class 5', 'Class 4', 'Class 6'), QT('How do they feel?', 'Happy', 'Sad', 'Tired')],
      },
      b: {
        text: 'Wei is from China. He likes ping-pong.\nPriya is from India. She likes cooking.\nWei and Priya are in the same class.\nToday they talk about their countries.\nWei says, "China is big."\nPriya says, "India is big, too!"\nThey are happy. It is a nice day.\nThey smile and say, "Let\'s be friends!"',
        ko: '웨이는 중국 출신이야. 그는 탁구를 좋아해. 프리야는 인도 출신이야. 그녀는 요리를 좋아해. 둘은 같은 반이야. 오늘 둘은 자기 나라에 대해 이야기해. 웨이는 "중국은 커."라고 말해. 프리야는 "인도도 커!"라고 말해. 둘은 행복해. 좋은 날이야. 둘은 웃으며 "친구가 되자!"라고 말해.',
        qs: [QC('Where is Priya from?', 'in', 'cn', 'br'), QT('What does Wei like?', 'Ping-pong', 'Cooking', 'Dancing'), QT('Are Wei and Priya in the same class?', 'Yes, they are.', "No, they aren't.", 'I don\'t know.')],
      },
      c: {
        text: 'Leo is from Brazil. He is a new student.\nSofia is from France. She is also new.\nThe teacher says, "Please say hello."\nLeo says, "Hello! I\'m Leo. I\'m from Brazil."\nSofia says, "Hi! I\'m Sofia. I\'m from France."\nThen Leo asks, "Are you from Spain?"\nSofia says, "No, I\'m not."\nEveryone says, "Welcome!"',
        ko: '레오는 브라질 출신이야. 그는 새 학생이야. 소피아는 프랑스 출신이야. 그녀도 새 학생이야. 선생님이 "인사해 보세요."라고 말해. 레오가 "안녕! 나는 레오야. 브라질 출신이야."라고 말해. 소피아가 "안녕! 나는 소피아야. 프랑스 출신이야."라고 말해. 그때 레오가 "스페인 출신이니?"라고 물어. 소피아는 "아니, 아니야."라고 말해. 모두 "환영해!"라고 말해.',
        qs: [QC('Where is Leo from?', 'br', 'fr', 'au'), QT('Is Sofia from Spain?', "No, she isn't.", 'Yes, she is.', 'I don\'t know.'), QT('What does the teacher say?', 'Please say hello.', 'Please sit down.', 'Please go home.')],
      },
    },
    ADVANCED: {
      a: {
        text: "Hello, everyone! My name is Mia. I'm from Sydney, Australia. I'm eleven years old, and I like dancing.\nThis is my friend Priya. She is from Delhi, India. Priya is also eleven, but she likes cooking.\nWe met at an International Day event last week. Priya asked me, \"Where are you from?\" I said, \"I'm from Australia.\" Then I asked her, \"Are you from China?\" She laughed and said, \"No, I'm not. I'm from India!\"\nMia says that Sydney is by the sea. Priya says Delhi is a big, busy city.\nNow we are good friends. We want to visit each other's countries someday.",
        ko: '모두 안녕! 내 이름은 미아야. 나는 호주 시드니 출신이고, 열한 살이며 춤추기를 좋아해. 이쪽은 내 친구 프리야야. 그녀는 인도 델리 출신이야. 프리야도 열한 살이지만 요리를 좋아해. 우리는 지난주 국제의 날 행사에서 만났어. 프리야가 "너는 어디 출신이니?"라고 물었고 나는 "호주 출신이야."라고 말했어. 그다음 내가 "중국 출신이니?"라고 묻자 그녀는 웃으며 "아니, 나는 인도 출신이야!"라고 말했어. 시드니는 바닷가에 있고, 델리는 크고 바쁜 도시야. 이제 우리는 좋은 친구야. 언젠가 서로의 나라를 방문하고 싶어.',
        qs: [QC('Where is Priya from?', 'in', 'cn', 'au'), QT('What does Priya like?', 'Cooking', 'Dancing', 'Swimming'), QT('Where did they meet?', 'At an International Day event', 'At a library', 'At a park'), QT('Why did Priya laugh?', 'Mia asked if she was from China, but she is from India.', 'Mia said a funny joke.', 'Priya forgot her name.'), QT('How are Mia and Priya now?', 'Good friends', 'Classmates only', 'Strangers')],
      },
      b: {
        text: "Tom and Omar are in Class 5-2. Tom is from New York in the United States. He is twelve, and he likes basketball. Omar is from Cairo in Egypt. He is twelve, too, but he likes history.\nOn Monday, the teacher asked, \"Who is new?\" Omar raised his hand. \"I'm new. I'm from Egypt,\" he said. Tom smiled and said, \"Nice to meet you, Omar! Are you from Cairo?\" \"Yes, I am!\" Omar said. \"How about you?\" \"I'm from the United States,\" Tom said. \"I'm from New York.\"\nThe two boys talked about their cities all day. They found one thing in common: they both love music.",
        ko: '톰과 오마르는 5-2반이야. 톰은 미국 뉴욕 출신으로 열두 살이고 농구를 좋아해. 오마르는 이집트 카이로 출신으로 역시 열두 살이지만 역사를 좋아해. 월요일에 선생님이 "새로 온 사람이 누구죠?"라고 물었고 오마르가 손을 들었어. "저예요. 이집트 출신이에요." 톰이 웃으며 "만나서 반가워, 오마르! 카이로 출신이니?"라고 물었고 오마르는 "응, 맞아! 너는?"이라고 했어. 톰은 "미국 출신이야. 뉴욕에서 왔어."라고 말했어. 둘은 하루 종일 자기 도시 이야기를 했고, 둘 다 음악을 좋아한다는 공통점을 찾았어.',
        qs: [QT('Who is new in the class?', 'Omar', 'Tom', 'The teacher'), QT('Where is Omar from?', 'Cairo, Egypt', 'New York, the United States', 'Sydney, Australia'), QT('What does Tom like?', 'Basketball', 'History', 'Cooking'), QT('What do Tom and Omar have in common?', 'They both love music.', 'They are from the same city.', 'They both like history.'), QT('Which sentence is true?', 'Tom and Omar are both twelve.', 'Omar is from New York.', 'Tom is new in class.')],
      },
      c: {
        text: "Today is Welcome Day at Sunrise Elementary School. Students from many countries stand in a circle. Ana is from Madrid, Spain. She likes tennis. Diego is from Mexico City, Mexico. He likes playing the guitar.\nAna asks Diego, \"Are you from Spain?\" Diego laughs. \"No, I'm not. I'm from Mexico. Spain and Mexico both speak Spanish, but they are different countries,\" he says. Ana nods. \"Oh, I see! Nice to meet you, Diego!\"\nAfter school, Ana and Diego play music together. Ana plays the piano, and Diego plays the guitar. They are very happy. Everyone claps. Their new song is called \"Hello, Friend.\"",
        ko: '오늘은 선라이즈 초등학교의 환영의 날이야. 여러 나라 학생들이 원을 만들어 서 있어. 아나는 스페인 마드리드 출신이고 테니스를 좋아해. 디에고는 멕시코시티 출신이고 기타 치기를 좋아해. 아나가 "스페인 출신이니?"라고 묻자 디에고는 웃으며 "아니, 나는 멕시코 출신이야. 스페인과 멕시코는 둘 다 스페인어를 쓰지만 다른 나라야."라고 말해. 아나는 "아, 알겠어! 만나서 반가워, 디에고!"라고 해. 방과 후 둘은 함께 음악을 연주해. 아나는 피아노, 디에고는 기타를 쳐. 둘은 아주 행복하고 모두 박수를 쳐. 새 노래의 제목은 "Hello, Friend"야.',
        qs: [QT('Where is Diego from?', 'Mexico City, Mexico', 'Madrid, Spain', 'Sydney, Australia'), QT('What does Ana like?', 'Tennis', 'Guitar', 'Cooking'), QT('Why did Diego say "No, I\'m not"?', 'He is from Mexico, not Spain.', 'He did not hear Ana.', 'He is from Madrid.'), QT('What do Ana and Diego do after school?', 'They play music together.', 'They play soccer.', 'They go to the library.')],
      },
    },
  };
  MG.PASS = PASS;
  G.passage = (L, key, only) => {
    const p = PASS[L][key];
    const qs = only ? p.qs.slice(0, only) : p.qs;
    return F({ k: 'text', text: p.text, ko: p.ko }, qs.map((q) => ({ ...q, opts: q.opts })));
  };
  G.passageQs = (L, key, n) => PASS[L][key].qs.slice(0, n || undefined);
  const SENT = {
    SUPPORT: "I'm Mina. I'm from Korea.\nI'm Ken. I'm from Japan.\nI'm Lily. I'm from Canada.\nI'm Tom. I'm from the United States.",
    CORE: "I'm Mina. I'm from Korea.\nAre you from Canada, Lily?\nYes, I am. I'm from Canada.\nAre you from China, Wei?\nNo, I'm not. I'm from Japan.",
    ADVANCED: "I'm Mia. I'm from Sydney, Australia. I like dancing.\nI'm Priya. I'm from Delhi, India. I like cooking.\nI'm Leo. I'm from Rio, Brazil. I like music.\nAre you from Seoul, Mina? Yes, I am!",
  };
  G.sentenceReading = (L) => ({ k: 'text', title: '문장을 눌러서 듣고 소리 내어 읽어 보세요', text: SENT[L], ko: null });
  G.readMatch = (L, n, r) => r.take(peopleIn(L), n).map((k) => {
    const p = PEOPLE[k];
    if (isA(L)) {
      const likes = r.shuf(Object.values(PEOPLE).map((x) => x.like).filter((x) => x !== p.like)).slice(0, 2);
      return { k: 'choose', tag: 'read', bubble: `I'm ${p.n}. I'm from ${p.city}, ${cEn(p.c)}. I like ${p.like}.`, q: `What does ${p.n} like?`, opts: [p.like, ...likes].map((t) => ({ t })), a: 0 };
    }
    const { opts, a } = countryOpts(L, p.c, r);
    return { k: 'choose', tag: 'read', bubble: `I'm ${p.n}. I'm from ${cEn(p.c)}.`, q: `${p.n}의 나라는 어디일까요?`, opts, a, fb: `${p.n} → ${cEn(p.c)}` };
  });
  G.cardsDecide = (L, n, r) => r.take(peopleIn(L), n).map((k, i) => {
    const p = PEOPLE[k]; const same = i % 2 === 0; const other = r.pick(POOL[L].filter((x) => x !== p.c));
    if (isA(L)) {
      const k2 = r.pick(peopleIn(L).filter((x) => x !== k)); const p2 = PEOPLE[k2];
      return { k: 'choose', tag: 'read', bubble: `${p.n}: I'm from ${cEn(p.c)}. I like ${p.like}.\n${p2.n}: I'm from ${cEn(p2.c)}. I like ${p2.like}.`, q: `Who likes ${i % 2 ? p.like : p2.like}?`, opts: [i % 2 ? p.n : p2.n, i % 2 ? p2.n : p.n, 'Both'].map((t) => ({ t })), a: 0 };
    }
    return { k: 'choose', tag: 'read', bubble: `Hi! I'm ${p.n}. I'm from ${cEn(p.c)}.`, q: `${p.n} is from ${cEn(same ? p.c : other)}.`, opts: [{ t: 'True (맞아요)' }, { t: 'False (달라요)' }], a: same ? 0 : 1 };
  });

  /* ---- 쓰기 ---- */
  G.build = (L, n, r) => {
    const bank = [(id) => [`I'm from ${cEn(id)}.`, `나는 ${CO[id].ko} 출신이야.`], (id) => [`Are you from ${cEn(id)}?`, `너는 ${CO[id].ko} 출신이니?`], () => ['Yes, I am.', '응, 맞아.'], () => ['Where are you from?', '너는 어디 출신이니?'], () => ["No, I'm not.", '아니, 아니야.'], () => ['Nice to meet you.', '만나서 반가워.']];
    const pool = isS(L) ? bank.slice(0, 3) : bank;
    return r.take(pool, n).map((f) => { const [s, ko] = f(r.pick(typed(L))); return { k: 'build', tag: 'write', ans: s, ko, words: s.split(' ') }; });
  };
  G.fill = (L, n, r) => {
    if (isS(L)) {
      const bank = [(id) => ({ q: `I'm ___ ${cEn(id)}.`, o: ['from', 'to', 'at'], flag: id }), () => ({ q: '___ you from Japan?', o: ['Are', 'Is', 'Am'] }), () => ({ q: 'Yes, I ___.', o: ['am', 'is', 'are'] }), () => ({ q: "No, I'm ___.", o: ['not', 'no', 'am'] }), () => ({ q: 'Where are you ___?', o: ['from', 'to', 'in'] })];
      return r.take(bank, n).map((f) => { const x = f(r.pick(typed(L))); return { k: 'choose', tag: 'write', flag: x.flag, q: x.q, blank: true, opts: x.o.map((t) => ({ t })), a: 0 }; });
    }
    if (!isA(L)) {
      const bank = [(id) => ({ q: `I'm ___ ${cEn(id)}.`, ans: 'from', flag: id }), (id) => ({ q: `Are you ___ ${cEn(id)}?`, ans: 'from', flag: id }), () => ({ q: 'Where ___ you from?', ans: 'are' }), () => ({ q: 'Yes, I ___.', ans: 'am' }), () => ({ q: "No, I'm ___.", ans: 'not' }), (id) => ({ q: `${r.pick(['Ken', 'Mina', 'Lily'])} ___ from ${cEn(id)}.`, ans: 'is', flag: id })];
      return r.take(bank, n).map((f) => ({ k: 'fill', tag: 'write', ...f(r.pick(typed(L))) }));
    }
    const bank = [
      { q: "A: Are you from Japan?\nB: ___", ans: "No, I'm not." }, { q: 'A: Where are you from?\nB: ___ Brazil.', ans: "I'm from", alts: ['I am from'] },
      { q: "A: Nice to meet you.\nB: ___", ans: 'Nice to meet you, too.' }, { q: "A: Are you from Canada?\nB: Yes, ___.", ans: 'I am' },
    ];
    return r.take(bank, n).map((x) => ({ k: 'fill', tag: 'write', ...x, wide: true }));
  };
  G.writeKo = (L, n, r) => {
    if (isA(L)) return r.take(peopleIn(L), n).map((k) => { const p = PEOPLE[k]; return { k: 'write', tag: 'write', ctx: { key: k, line: `${p.n} · ${cEn(p.c)}` }, ko: `카드를 보고 ${p.n}을(를) 소개하는 문장을 쓰세요`, ans: `${p.n} is from ${cEn(p.c)}.`, alts: [`${p.g === 'he' ? 'He' : 'She'} is from ${cEn(p.c)}.`] }; });
    const bank = [(id) => [`나는 ${CO[id].ko} 출신이야.`, `I'm from ${cEn(id)}.`, id], () => ['너는 어디 출신이니?', 'Where are you from?'], (id) => [`너는 ${CO[id].ko} 출신이니?`, `Are you from ${cEn(id)}?`, id], () => ['응, 맞아.', 'Yes, I am.'], () => ['아니, 아니야.', "No, I'm not."], () => ['만나서 반가워.', 'Nice to meet you.']];
    return r.take(bank, n).map((f) => { const [ko, ans, flag] = f(r.pick(typed(L))); return { k: 'write', tag: 'write', ko, ans, flag }; });
  };
  const RULE = {
    name: { label: "이름 문장 (I'm ...)", re: /\bi['’]?m\s+(?!from\b)[a-z]+/i },
    from: { label: "출신 문장 (I'm from ...)", re: /\bi['’]?m\s+from\s+(the\s+)?[a-z]+/i },
    like: { label: '좋아하는 것 (I like ...)', re: /\bi\s+like\s+[a-z-]+/i },
    ask: { label: '질문 한 개 (...?)', re: /\?/ },
  };
  G.compose = (L, kind, r, o = {}) => {
    if (kind === 'self') {
      if (isS(L)) return { k: 'compose', tag: 'write', kind, title: '나를 소개하는 글을 완성하세요', starter: "I'm ______. I'm from ______.", rules: [RULE.name, RULE.from], minSent: 2, sample: "I'm Mina. I'm from Korea." };
      if (!isA(L)) return { k: 'compose', tag: 'write', kind, title: '나를 소개하는 2~3문장을 써 보세요', rules: [RULE.name, RULE.from], minSent: 2, tip: "Nice to meet you.도 넣어 볼까요?", sample: "I'm Mina. I'm from Korea. Nice to meet you." };
      return { k: 'compose', tag: 'write', kind, title: '새 친구에게 보내는 자기소개 메시지를 4~6문장으로 써 보세요', rules: [RULE.name, RULE.from, RULE.like, RULE.ask], minSent: 4, sample: "Hi! I'm Mina. I'm from Seoul, Korea. I like drawing. Are you from Canada?" };
    }
    if (kind === 'compare') {
      const [a, b] = r.shuf(peopleIn(L)).slice(0, 2).map((k) => ({ ...PEOPLE[k], k }));
      return { k: 'compose', tag: 'write', kind, persona2: [a.k, b.k].map((k) => ({ key: k, line: `${PEOPLE[k].n} · ${cEn(PEOPLE[k].c)} · ${PEOPLE[k].like}` })), title: isA(L) ? '두 친구를 소개하는 글을 4~5문장으로 써 보세요' : '두 친구를 소개하는 글을 2~3문장으로 써 보세요', rules: [{ label: `${a.n} 이름과 나라`, test: (t) => new RegExp(`\\b${a.n}\\b[^.!?]*${cEn(a.c).replace('the ', '')}|${cEn(a.c).replace('the ', '')}[^.!?]*\\b${a.n}\\b`, 'i').test(t) }, { label: `${b.n} 이름과 나라`, test: (t) => new RegExp(`\\b${b.n}\\b[^.!?]*${cEn(b.c).replace('the ', '')}|${cEn(b.c).replace('the ', '')}[^.!?]*\\b${b.n}\\b`, 'i').test(t) }, ...(isA(L) ? [{ label: '좋아하는 것 (likes ...)', re: /\blikes?\s+[a-z-]+/i }] : [])], minSent: isA(L) ? 4 : 2, sample: isA(L) ? `${a.n} is from ${cEn(a.c)}. She likes ${a.like}. ${b.n} is from ${cEn(b.c)}. He likes ${b.like}.` : `${a.n} is from ${cEn(a.c)}. ${b.n} is from ${cEn(b.c)}.` };
    }
    const k = r.pick(peopleIn(L)); const p = PEOPLE[k]; const cn = cEn(p.c).replace('the ', '');
    const rules = [{ label: `${p.n} 또는 ${p.g === 'he' ? 'He' : 'She'}`, re: new RegExp(`\\b(${p.n}|${p.g})\\b`, 'i') }, { label: `나라 이름 (${cEn(p.c)}) 포함 "is from"`, re: new RegExp(`(is|'s)\\s+from\\s+(the\\s+)?${cn}`, 'i') }];
    if (isA(L)) rules.push({ label: '좋아하는 것 (likes ...)', re: /\blikes?\s+[a-z-]+/i });
    if (o.link) rules.push({ label: '연결 표현 (and / also / but)', re: /\b(and|also|but)\b/i });
    return { k: 'compose', tag: 'write', kind, persona: { key: k, line: `${p.n} · ${cEn(p.c)} · ${p.like}` }, title: isA(L) ? '새 친구를 소개하는 글을 3문장으로 써 보세요' : isS(L) ? '새 친구를 소개하는 문장을 써 보세요' : '새 친구를 소개하는 2문장을 써 보세요', rules, minSent: isA(L) ? 3 : isS(L) ? 1 : 2, sample: `${p.n} is from ${cEn(p.c)}.${isS(L) ? '' : ` ${p.g === 'he' ? 'He' : 'She'} likes ${p.like}${o.link ? ' and music' : ''}.`}${isA(L) ? " Let's be friends!" : ''}` };
  };
  /* ---------- v2.0 신규 생성기 ---------- */
  MG.LO = {
    LO1: { ko: '국가 이름 구별' }, LO2: { ko: '출신 질문하기' }, LO3: { ko: '긍정·부정 응답' },
    LO4: { ko: '대화·글 정보 파악' }, LO5: { ko: '말과 글로 소개' },
  };
  const isQ = (i) => i.k !== 'learn' && i.k !== 'text' && i.k !== 'brief' && i.k !== 'report' && i.tag;
  const takeScored = (items, n) => { const out = []; let c = 0; for (const it of items) { if (isQ(it)) { if (c >= n) break; c++; } out.push(it); } return out; };

  // 힌트 줄이기(SUPPORT): ① 선택 → ② 모델 따라 말하기 → ③ 독립 발화
  G.fade = (L, n, r, kind = 'from') => {
    if (kind === 'from') return r.take(typed(L), n).map((id) => {
      const C = cEn(id), O = cEn(r.pick(typed(L).filter((x) => x !== id)));
      const texts = r.shuf([`I'm from ${C}.`, `I'm from ${O}.`, 'Where are you from?']);
      return { k: 'fade', tag: 'speak', lo: 'LO3', flag: id, q1: '이 나라 사람이 하는 말을 고르세요', opts: texts.map((t) => ({ t })), a: texts.indexOf(`I'm from ${C}.`), target: `I'm from ${C}.`, accept: [`I'm from ${C}.`, `I am from ${C}.`], prompt3: '국기를 보고 도움 없이 말해 볼까요?' };
    });
    if (kind === 'ask') return r.take(peopleIn(L), n).map((k) => {
      const p = PEOPLE[k]; const texts = r.shuf(['Where are you from?', 'What is your name?', 'How old are you?']);
      return { k: 'fade', tag: 'speak', lo: 'LO2', ctx: { key: k, line: '처음 만난 친구' }, q1: '출신을 묻는 말은 무엇일까요?', opts: texts.map((t) => ({ t })), a: texts.indexOf('Where are you from?'), target: 'Where are you from?', accept: ['Where are you from?', `Are you from ${cEn(p.c)}?`], prompt3: `${p.n}에게 도움 없이 출신을 물어볼까요?` };
    });
    return r.take(peopleIn(L), n).map((k, i) => {
      const p = PEOPLE[k]; const yes = i % 2 === 0; const askId = yes ? p.c : r.pick(typed(L).filter((x) => x !== p.c));
      const target = yes ? 'Yes, I am.' : "No, I'm not.";
      return { k: 'fade', tag: 'speak', lo: 'LO3', ctx: { key: k, line: `You are ${p.n} from ${cEn(p.c)}.` }, ask: `Are you from ${cEn(askId)}?`, q1: '알맞은 대답을 고르세요', opts: [{ t: 'Yes, I am.' }, { t: "No, I'm not." }], a: yes ? 0 : 1, target, accept: yes ? [target] : [target, `No, I'm not. I'm from ${cEn(p.c)}.`], prompt3: '질문을 듣고 도움 없이 대답해 볼까요?' };
    });
  };
  // 인물/국기 카드로 질문·응답 (독립 발화)
  G.qa = (L, n, r, o = {}) => r.take(peopleIn(L), n).map((k, i) => {
    const p = PEOPLE[k], C = cEn(p.c); const ask = o.only ? o.only === 'ask' : i % 2 === 0;
    const base = { k: 'speak', tag: 'speak', hide: !o.show, listen: !!o.show, lo: ask ? 'LO2' : 'LO3' };
    if (o.flag) return ask
      ? { ...base, flag: p.c, prompt: '국기를 보고 출신을 확인하는 질문을 해 보세요', target: `Are you from ${C}?`, accept: [`Are you from ${C}?`] }
      : { ...base, flag: p.c, prompt: '이 나라 사람이 되어 출신을 말해 보세요', target: `I'm from ${C}.`, accept: [`I'm from ${C}.`, `I am from ${C}.`] };
    if (ask) return { ...base, ctx: { key: k, line: '처음 만난 친구' }, prompt: `${p.n}에게 출신을 물어보세요`, target: 'Where are you from?', accept: ['Where are you from?', `Are you from ${C}?`] };
    const t = isA(L) ? `I'm from ${p.city}, ${C}.` : `I'm from ${C}.`;
    return { ...base, ctx: { key: k, line: `You are ${p.n} from ${C}.` }, prompt: `${p.n}이(가) 되어 대답해 보세요`, target: t, accept: [t, `I'm from ${C}.`, `I am from ${C}.`] };
  });
  // 잘못된 추측을 정정하며 응답 (ADVANCED)
  G.respondFix = (L, n, r) => r.take(peopleIn(L), n).map((k) => {
    const p = PEOPLE[k], C = cEn(p.c), O = cEn(r.pick(POOL[L].filter((x) => x !== p.c)));
    const t = `No, I'm not. I'm from ${C}.`;
    return { k: 'speak', tag: 'speak', lo: 'LO3', ctx: { key: k, line: `You are ${p.n} from ${C}.` }, ask: `Are you from ${O}?`, prompt: '아니라고 말하고, 올바른 출신도 알려 주세요', target: t, accept: [t, `No, I am not. I'm from ${C}.`, `No, I'm not. I am from ${C}.`], hide: true, listen: false };
  });
  G.scene = (L, r) => {
    const d = dlgAudio(L, r);
    if (isS(L) || isA(L)) return [{ ...d, lo: 'LO4' }];
    return [{ ...d, lo: 'LO4', q: '두 친구는 무엇에 대해 이야기하고 있나요?', opts: [{ t: '출신 나라' }, { t: '좋아하는 음식' }, { t: '오늘 날씨' }], a: 0, fb: '출신 나라를 묻고 답하고 있어요.' }];
  };
  G.order = (L, n, r) => r.take(peopleIn(L), n).map((k) => {
    const C = cEn(PEOPLE[k].c); const w = isS(L) ? ['Hi!', 'Where are you from?', `I'm from ${C}.`] : ['Hi!', 'Nice to meet you.', 'Where are you from?', `I'm from ${C}.`];
    return { k: 'build', tag: 'expr', lo: 'LO2', ko: '인사 → 질문 → 대답 순서로 놓아 보세요', ans: w.join(' '), words: w };
  });
  G.readAloud = (L, n, r) => { const lines = SENT[L].split('\n'); return r.take(lines, n).map((t) => ({ k: 'speak', tag: 'read', lo: 'LO1', prompt: '소리 내어 읽어 보세요', target: t, accept: [t], hide: false, listen: isS(L) })); };
  G.readDialog = (L, n, r) => r.take(peopleIn(L), n).map((k, i) => {
    const p = PEOPLE[k], C = cEn(p.c); const { opts, a } = countryOpts(L, p.c, r);
    if (isA(L) && i % 2) return { k: 'choose', tag: 'read', lo: 'LO4', bubble: `A: Hi! I'm ${p.n}. Are you from Spain?\nB: No, I'm not. I'm from ${p.city}, ${C}.`, q: `Where is B from?`, opts, a };
    return { k: 'choose', tag: 'read', lo: 'LO4', bubble: `A: Where are you from?\nB: I'm from ${C}.`, q: 'B는 어느 나라 출신일까요?', opts, a, fb: `B → ${C}` };
  });
  const PRED = [
    { b: 'Title: A Letter to Omar', q: '이 글은 무엇에 대한 내용일까요?', o: ['편지로 자신을 소개하는 글', '요리 방법을 알려 주는 글', '날씨를 알려 주는 글'] },
    { b: 'Title: The International Day Mystery', q: '이 글에는 무엇이 나올까요?', o: ['여러 나라 친구들의 이야기', '수학 문제 풀이', '운동 규칙 설명'] },
    { b: 'Title: Welcome Day at Sunrise School', q: '이 글의 장면은 어디일까요?', o: ['여러 나라 학생이 모인 학교 행사', '조용한 도서관', '놀이공원 입구'] },
  ];
  G.predict = (L, n, r) => r.take(PRED, n).map((x) => ({ k: 'choose', tag: 'read', lo: 'LO4', bubble: x.b, q: x.q, opts: x.o.map((t) => ({ t })), a: 0 }));
  G.modelObs = (L, n, r) => {
    const bankA = [{ b: "A: I'm Mia. I'm from Australia.\nB: Hi! I'm Mia. I'm from Sydney, Australia. I like dancing. Are you from Seoul?", q: '정보가 더 자세한 소개는?', o: ['B', 'A', '같아요'], a: 0 }, { b: "A: Hello. I'm Leo. Brazil.\nB: Hello! I'm Leo. I'm from Rio, Brazil. I like music.", q: '좋은 소개글의 순서에 더 가까운 것은?', o: ['B (이름 → 출신 → 좋아하는 것)', 'A', '둘 다 아니에요'], a: 0 }];
    const bank = isA(L) ? bankA : isS(L)
      ? [{ b: "Hi! I'm Mina. I'm from Korea.", q: '나라를 알려 주는 문장은?', o: ["I'm from Korea.", "I'm Mina.", 'Hi!'], a: 0 }, { b: "Hi! I'm Ken. I'm from Japan.", q: '이름을 알려 주는 문장은?', o: ["I'm Ken.", "I'm from Japan.", 'Hi!'], a: 0 }]
      : [{ b: "Hi! I'm Mina. I'm from Korea. Nice to meet you.", q: '자기소개 글에 꼭 들어가는 정보는?', o: ['이름과 출신 나라', '나이와 주소', '가방과 연필'], a: 0 }, { b: "Hi! I'm Lily. I'm from Canada. Nice to meet you.", q: '글의 마지막 문장은 무슨 역할일까요?', o: ['만난 반가움을 전해요', '나라를 물어봐요', '이름을 알려 줘요'], a: 0 }];
    return bank.slice(0, n).map((x) => ({ k: 'choose', tag: 'write', lo: 'LO5', bubble: x.b, q: x.q, opts: x.o.map((t) => ({ t })), a: x.a }));
  };
  const ERR = [
    { w: 'I from Korea.', a: "I'm from Korea.", alts: ['I am from Korea.'] }, { w: 'Are you from Canada', a: 'Are you from Canada?', alts: [] },
    { w: 'Im from Japan.', a: "I'm from Japan.", alts: ['I am from Japan.'] }, { w: 'Yes I am', a: 'Yes, I am.', alts: [] },
  ];
  G.fixIt = (L, n, r) => r.take(ERR, n).map((x) => ({ k: 'write', tag: 'write', lo: 'LO5', ko: `틀린 곳을 고쳐 써 보세요: "${x.w}"`, ans: x.a, alts: x.alts }));
  const NAT = [
    { b: "I'm Leo. From Brazil. Are you Korea?", o: ["I'm Leo. I'm from Brazil. Are you from Korea?", "I Leo. I from Brazil.", "Leo Brazil. Korea you?"] },
    { b: 'Mia Australia. I like dance.', o: ["I'm Mia. I'm from Australia. I like dancing.", 'Mia is Australia from.', 'I Mia Australia dance.'] },
  ];
  G.natural = (L, n, r) => r.take(NAT, n).map((x) => ({ k: 'choose', tag: 'write', lo: 'LO5', bubble: x.b, q: '더 자연스러운 표현은?', opts: x.o.map((t) => ({ t })), a: 0 }));

  G.brief = (L, title, text, keys) => ({ k: 'brief', title, text, people: keys });

  /* ---------- 차시 구성 (v2.0: 학습 단계 → 수행 → 확인) ---------- */
  const act = (t, ko, min, icon, build, step) => ({ t, ko, min, icon, build, step });
  const brief6 = (L) => [G.brief(L, '국제 캠프에서 새 친구 만나기', by(L, () => '캠프에 새 친구들이 도착했어요. 듣고, 대화하고, 친구를 소개해 보세요!', () => '국제 캠프에서 친구들의 출신을 듣고, 대화하고, 친구 소개 카드를 완성해 보세요.', () => '여러 나라 친구들의 정보를 모아 대화하고, 친구들을 비교해 소개하는 글을 써 보세요.'), by(L, () => ['mina', 'ken', 'lily'], () => ['leo', 'sofia', 'omar', 'priya'], () => ['mia', 'wei', 'diego', 'ana', 'tom']))];

  /* 영역별 보강 문항 (8차시 · Homework · Spaced Review 공용) */
  const REM = {
    vocab: (L, r) => F(G.seeName(L, 3, r), G.hearFlag(L, 4, r)),
    expr: (L, r) => F(G.exprMeaning(L, 3, r), G.patternDrill(L, 4, r)),
    listen: (L, r) => F(G.hearFlag(L, 3, r, { sentence: 1 }), G.listenDialog(L, 2, r), [G.match(L, 3, r)], G.respond(L, 1, r, { choose: 1 })),
    speak: (L, r) => F(G.repeat(L, 3, r), G.qa(L, 3, r, { show: isS(L) }), G.dialog(L, 1, r, { short: true })),
    read: (L, r) => F(G.readMatch(L, 2, r), G.cardsDecide(L, 2, r), { k: 'text', text: PASS[L].b.text, ko: PASS[L].b.ko }, G.passageQs(L, 'b', 3)),
    write: (L, r) => F(G.build(L, 3, r), G.fill(L, 3, r), G.writeKo(L, 1, r)),
  };
  MG.REM = REM;
  // Spaced Review: 앞 차시에서 약했던 영역이 있으면 마지막 2문항을 그 영역으로 교체
  const rv = (L, r, c, base) => {
    const items = base(); const w = c && c.weak;
    if (!w || !REM[w]) return items;
    const extra = REM[w](L, rng('rv' + L + w)).filter(isQ).slice(0, 2);
    return [...items.slice(0, Math.max(items.length - 2, 1)), ...extra];
  };
  const rt = (items, tag) => items.map((i) => ({ ...i, tag }));

  MG.LESSONS = [
    { no: 1, en: 'Meet & Understand', ko: '만나서 국가·표현 알기', goal: '국가 이름을 알아듣고, 출신 국가를 묻고 답해요.', icon: 'abc', c: 'mango', tags: ['vocab', 'expr', 'speak'], lo: ['LO1', 'LO2', 'LO3'], acts: [
      act('Meet the Situation', '상황 만나기', 3, 'sparkles', (L, r) => G.scene(L, r), '상황'),
      act('Country Words', '국가 어휘 익히기', 5, 'globe', (L, r) => by(L, () => F(G.cards(L, 6), G.hearFlag(L, 4, r)), () => F(G.cards(L, 8), G.hearFlag(L, 3, r), G.sayCountry(L, 3, r)), () => G.hearFlag(L, 8, r, { reteach: true })), '이해'),
      act('Key Expressions', '핵심표현 발견', 4, 'chat', (L, r) => by(L, () => F(G.exprCards(L), G.listenDialog(L, 1, r), G.fade(L, 1, r, 'ask')), () => F(G.exprCards(L), G.listenDialog(L, 1, r), G.guidedSpeak(L, 2, r)), () => F(G.exprAdv(L, 2, r), G.respond(L, 1, r, { speak: 1 }), G.followUp(L, 1, r))), '모델링'),
      act('Pattern Practice', '패턴 연습', 5, 'swap', (L, r) => by(L, () => F(G.patternDrill(L, 3, r), G.fade(L, 2, r, 'from')), () => G.qa(L, 5, r, { flag: true }), () => G.qa(L, 5, r)), '연습'),
      act('First Chat', '첫 대화 미션', 5, 'chat', (L, r) => by(L, () => G.dialog(L, 1, r, { short: true }), () => G.dialog(L, 1, r), () => G.dialog(L, 1, r, { free: 1 })), '적용'),
      act('Mastery Check', 'Mastery Check', 3, 'clipboard', (L, r) => by(L, () => G.qa(L, 2, r), () => G.qa(L, 4, r, { flag: true }), () => F(G.qa(L, 2, r), G.followUp(L, 1, r))), '확인'),
    ], hw: (L, r) => by(L, () => F(G.hearFlag(L, 4, r), G.repeat(L, 2, r)), () => F(G.hearFlag(L, 2, r, { sentence: 1 }), G.qa(L, 3, r, { flag: true })), () => F(G.qa(L, 2, r), G.followUp(L, 2, r))), ind: (L, r) => G.qa(L, 2, r) },

    { no: 2, en: 'Listen & Respond', ko: '듣고 정보 구별하며 응답하기', goal: '대화를 듣고 출신 정보를 구별하며, Yes / No로 응답해요.', icon: 'headphones', c: 'sky', tags: ['listen', 'speak'], lo: ['LO3', 'LO4'], acts: [
      act('Spaced Review', '복습', 3, 'refresh', (L, r, c) => rv(L, r, c, () => by(L, () => G.repeat(L, 3, r), () => G.qa(L, 3, r, { flag: true }), () => G.respond(L, 3, r, { speak: 1 }))), '복습'),
      act('Listen to Dialogs', '대화 듣기', 4, 'headphones', (L, r) => G.listenDialog(L, 2, r), '이해'),
      act('Connect Info', '정보 연결', 5, 'link', (L, r) => by(L, () => [G.match(L, 3, r)], () => [G.match(L, 4, r)], () => [G.match(L, 4, r)]), '이해'),
      act('Yes / No Discovery', 'Yes / No 발견', 4, 'check', (L, r) => by(L, () => F(G.exprMeaning(L, 2, r), G.respond(L, 2, r)), () => F(G.exprMeaning(L, 2, r), G.respond(L, 2, r, { choose: 1 })), () => F(G.listenDialog(L, 1, r), G.exprAdv(L, 2, r))), '모델링'),
      act('Listen & Respond', '듣고 응답하기', 6, 'chat', (L, r) => by(L, () => G.fade(L, 3, r, 'resp'), () => G.respond(L, 5, r, { speak: 1 }), () => G.respondFix(L, 3, r)), '연습'),
      act('Listening Check', 'Listening Check', 3, 'clipboard', (L, r) => by(L, () => F(G.listenDialog(L, 2, r), G.respond(L, 1, r, { speak: 1 })), () => F(G.listenDialog(L, 1, r), G.respond(L, 1, r, { speak: 1 })), () => F(G.listenDialog(L, 2, r), G.respond(L, 1, r, { speak: 1 }))), '확인'),
    ], hw: (L, r) => by(L, () => F(G.respond(L, 3, r), G.repeat(L, 1, r)), () => F(G.listenDialog(L, 2, r), G.respond(L, 2, r, { speak: 1 })), () => F(G.listenDialog(L, 2, r), G.respondFix(L, 2, r))), ind: (L, r) => (isA(L) ? G.respondFix(L, 2, r) : G.respond(L, 2, r, { speak: 1 })) },

    { no: 3, en: 'Ask & Talk', ko: '처음 만난 친구와 대화하기', goal: '처음 만난 사람과 출신 국가를 묻고 답하는 대화를 독립적으로 해요.', icon: 'mic', c: 'berry', tags: ['speak', 'expr'], lo: ['LO2', 'LO3'], acts: [
      act('Spaced Review', '복습', 3, 'refresh', (L, r, c) => rv(L, r, c, () => by(L, () => G.repeat(L, 3, r), () => G.respond(L, 3, r, { speak: 1 }), () => F(G.respond(L, 2, r, { speak: 1 }), G.followUp(L, 2, r)))), '복습'),
      act('Dialog Model', '대화 모델 관찰', 3, 'eye', (L, r) => by(L, () => G.order(L, 2, r), () => G.order(L, 2, r), () => G.followUp(L, 3, r)), '모델링'),
      act('Pattern Drill', 'Pattern Drill', 5, 'swap', (L, r) => by(L, () => F(G.patternDrill(L, 3, r), G.qa(L, 1, r, { only: 'answer', show: true })), () => G.patternDrill(L, 6, r), () => F(G.patternDrill(L, 3, r), G.followUp(L, 2, r))), '연습'),
      act('Guided Role-play', 'Guided Role-play', 5, 'mic', (L, r) => by(L, () => G.dialog(L, 1, r), () => G.dialog(L, 1, r), () => F(G.qa(L, 3, r), G.dialog(L, 1, r, { short: true }))), '연습'),
      act('AI Free Talk', 'AI Free Talk', 6, 'chat', (L, r) => by(L, () => G.dialog(L, 1, r, { free: 1 }), () => G.dialog(L, 1, r, { free: 2 }), () => G.dialog(L, 1, r, { free: 4 })), '적용'),
      act('Speaking Check', 'Speaking Check', 3, 'clipboard', (L, r) => by(L, () => G.qa(L, 2, r), () => G.dialog(L, 1, r, { short: true }), () => G.dialog(L, 1, r, { short: true, surprise: true })), '확인'),
    ], hw: (L, r) => by(L, () => F(G.repeat(L, 3, r), G.qa(L, 1, r, { show: true })), () => G.qa(L, 3, r), () => F(G.dialog(L, 1, r, { free: 2 }), G.qa(L, 1, r))), ind: (L, r) => G.dialog(L, 1, r, { short: true }) },

    { no: 4, en: 'Read & Discover', ko: '자기소개 글 읽고 이해하기', goal: '자기소개 글을 읽고, 인물의 출신 국가와 주요 정보를 이해해요.', icon: 'book', c: 'leaf', tags: ['read'], lo: ['LO1', 'LO4'], acts: [
      act('Spaced Review', '복습', 3, 'refresh', (L, r, c) => rv(L, r, c, () => by(L, () => G.repeat(L, 3, r), () => F(G.readDialog(L, 2, r), G.respond(L, 1, r, { speak: 1 })), () => G.readDialog(L, 3, r))), '복습'),
      act('Reading Prep', '읽기 준비', 3, 'eye', (L, r) => by(L, () => rt(G.seeName(L, 3, r), 'read'), () => rt(G.exprMeaning(L, 3, r), 'read'), () => G.predict(L, 2, r)), '이해'),
      act('Sentence Reading', '문장 읽기', 4, 'book', (L, r) => by(L, () => F(G.sentenceReading(L), G.readAloud(L, 2, r)), () => F(G.sentenceReading(L), G.readAloud(L, 2, r)), () => F(G.sentenceReading(L), G.readAloud(L, 1, r), G.readMatch(L, 1, r))), '모델링'),
      act('Self-Introduction', '자기소개 지문', 7, 'books', (L, r) => F({ k: 'text', text: PASS[L].a.text, ko: PASS[L].a.ko }, G.passageQs(L, 'a', 2)), '이해'),
      act('Find the Info', '읽고 정보 찾기', 5, 'target', (L, r) => F({ k: 'text', text: PASS[L].a.text, ko: PASS[L].a.ko, title: '다시 읽고 정보를 찾아요' }, PASS[L].a.qs.slice(2, 5), by(L, () => G.readMatch(L, 2, r), () => G.cardsDecide(L, 2, r), () => G.cardsDecide(L, 2, r))), '연습'),
      act('Reading Check', 'Reading Check', 3, 'clipboard', (L, r) => F({ k: 'text', text: PASS[L].b.text, ko: PASS[L].b.ko, test: true }, G.passageQs(L, 'b', 3)), '확인'),
    ], hw: (L, r) => by(L, () => F(G.readMatch(L, 3, r), G.readAloud(L, 1, r)), () => G.readDialog(L, 3, r), () => G.cardsDecide(L, 3, r)), ind: (L, r) => G.readDialog(L, 2, r) },

    { no: 5, en: 'Write & Introduce', ko: '출신 정보를 글로 소개하기', goal: '출신 국가에 관한 질문·응답을 쓰고, 나나 친구를 소개하는 짧은 글을 써요.', icon: 'pencil', c: 'teal', tags: ['write'], lo: ['LO5'], acts: [
      act('Spaced Review', '복습', 3, 'refresh', (L, r, c) => rv(L, r, c, () => by(L, () => G.readMatch(L, 3, r), () => G.qa(L, 3, r), () => G.writeKo(L, 2, r))), '복습'),
      act('Writing Model', '쓰기 모델 관찰', 3, 'eye', (L, r) => G.modelObs(L, 2, r), '모델링'),
      act('Build Sentences', '문장 구성', 5, 'swap', (L, r) => by(L, () => G.build(L, 5, r), () => F(G.build(L, 2, r), G.writeKo(L, 3, r)), () => G.writeKo(L, 4, r)), '연습'),
      act('Guided Writing', 'Guided Writing', 5, 'pencil', (L, r) => by(L, () => F(G.patternDrill(L, 3, r), [G.compose(L, 'self', r)]), () => [G.compose(L, 'friend', r)], () => [G.compose(L, 'friend', r, { link: true })]), '연습'),
      act('Independent Writing', 'Independent Writing', 6, 'pencil', (L, r) => by(L, () => [G.compose(L, 'friend', r)], () => [G.compose(L, 'self', r)], () => [G.compose(L, 'self', r)]), '적용'),
      act('Writing Check', 'Writing Check', 3, 'clipboard', (L, r) => by(L, () => G.writeKo(L, 1, r), () => [G.compose(L, 'friend', r)], () => [G.compose(L, 'friend', r)]), '확인'),
    ], hw: (L, r) => by(L, () => F(G.patternDrill(L, 2, r), G.writeKo(L, 1, r)), () => G.writeKo(L, 3, r), () => [G.compose(L, 'self', r)]), ind: (L, r) => (isS(L) ? G.writeKo(L, 1, r) : [G.compose(L, 'friend', r)]) },

    { no: 6, en: 'Global Friends Mission', ko: '새 친구 만나기 미션', goal: '처음 보는 친구들과 출신 국가에 관해 대화하고, 모은 정보를 말과 글로 소개해요.', icon: 'flag', c: 'grape', tags: ['listen', 'speak', 'read', 'write'], lo: ['LO1', 'LO2', 'LO3', 'LO4', 'LO5'], acts: [
      act('Mission Briefing', 'Mission Briefing', 2, 'flag', (L, r) => brief6(L), '상황'),
      act('Listen & Identify', 'Listen & Identify', 4, 'headphones', (L, r) => by(L, () => [G.match(L, 2, r)], () => [G.match(L, 3, r)], () => [G.match(L, 4, r)]), '이해'),
      act('Read & Prepare', 'Read & Prepare', 4, 'eye', (L, r) => by(L, () => G.readMatch(L, 2, r), () => F(G.cardsDecide(L, 2, r), G.qa(L, 1, r, { only: 'ask' })), () => F(G.cardsDecide(L, 2, r), G.qa(L, 1, r, { only: 'ask' }))), '연습'),
      act('AI Meet & Talk', 'AI Meet & Talk', 8, 'chat', (L, r) => by(L, () => G.dialog(L, 2, r), () => G.dialog(L, 2, r), () => G.dialog(L, 2, r, { free: 2 })), '적용'),
      act('Friend Introduction', 'Friend Introduction', 4, 'pencil', (L, r) => by(L, () => [G.compose(L, 'friend', r)], () => [G.compose(L, 'compare', r)], () => [G.compose(L, 'compare', r)]), '적용'),
      act('Mission Reflection', 'Mission Reflection', 3, 'refresh', (L, r, c) => by(L, () => ((c && c.weak === 'vocab') ? G.sayCountry(L, 3, r) : G.repeat(L, 3, r)), () => G.fixIt(L, 2, r), () => G.natural(L, 2, r)), '정리'),
    ], hw: (L, r) => by(L, () => F(G.repeat(L, 3, r), G.qa(L, 2, r)), () => F(G.listenDialog(L, 1, r), G.respond(L, 2, r, { speak: 1 }), [G.compose(L, 'friend', r)]), () => F(G.dialog(L, 1, r, { free: 2 }), [G.compose(L, 'friend', r)])), ind: (L, r) => F(G.dialog(L, 1, r, { short: true }), [G.compose(L, 'friend', r)]) },
  ];

  /* ---------- 7차시 Test: 1~6차시 Check 계열 activity를 레벨별로 조합 (새 인물·국가로 출제, 힌트·피드백 없음) ---------- */
  MG.TEST = { no: 7, en: 'Lesson Test', ko: '성취 확인', goal: '1~6차시의 Check 활동을 한 번씩 풀어 영역별로 확인해요. 결과로 8차시가 정해져요.', icon: 'trophy', c: 'sun' };
  MG.testItems = (L) => {
    const r = rng('test-' + L);
    return F(
      G.seeName(L, 2, r), G.hearFlag(L, 1, r),                                            // Vocabulary 3 (Country Words / Mastery)
      isA(L) ? G.exprAdv(L, 2, r) : G.exprMeaning(L, 2, r), G.patternDrill(L, 1, r),       // Expressions 3 (Key Expressions / Pattern)
      G.hearFlag(L, 2, r, { sentence: 1 }), G.listenDialog(L, 1, r), G.respond(L, 1, r, { choose: 1 }), // Listening 4 (Listening Check)
      G.qa(L, 3, r),                                                                      // Speaking 3 (Speaking Check)
      { k: 'text', text: PASS[L].c.text, ko: PASS[L].c.ko, test: true }, G.passageQs(L, 'c', 3), G.readMatch(L, 1, r), // Reading 4 (Reading Check)
      G.build(L, 1, r), G.fill(L, 1, r), [G.compose(L, 'self', r)]                         // Writing 3 (Writing Check)
    );
  };

  /* ---------- 8차시: 보강 / 혼합 / 심화 ---------- */
  MG.makePlan = (tags) => {
    const list = Object.keys(MG.TAGS).map((t) => ({ tag: t, acc: tags[t] && tags[t].t ? tags[t].c / tags[t].t : 1 })).sort((a, b) => a.acc - b.acc);
    const weak = list.filter((x) => x.acc < 0.7);
    const avg = list.reduce((s, x) => s + x.acc, 0) / list.length;
    if (!weak.length && avg >= 0.85 && list[0].acc >= 0.75) return { type: 'challenge', tags: [], up: [], list };
    const pick = (weak.length ? weak : list.filter((x) => x.acc < 0.85)).slice(0, 2).map((x) => x.tag);
    const tgs = pick.length ? pick : [list[0].tag];
    const up = weak.length ? list.filter((x) => x.acc >= 0.9 && !tgs.includes(x.tag)).slice(-1).map((x) => x.tag) : [];
    return { type: up.length ? 'mixed' : 'boost', tags: tgs, up, list };
  };
  MG.l8Acts = (plan, tagStats) => {
    const report = act('결과 확인', '내 결과 보기', 3, 'chart', () => [{ k: 'report', data: { tags: tagStats, plan } }], '확인');
    if (plan.type === 'challenge') {
      return [report,
        act('Free Conversation', '자유 대화', 6, 'chat', (L, r) => { const U = UP[L]; return setLv(G.dialog(U, 1, r, { free: 3 }), U); }, '심화'),
        act('Writing Challenge', '글쓰기 도전', 6, 'pencil', (L, r) => { const U = UP[L]; return setLv([G.compose(U, 'self', r), G.compose(U, 'compare', r)], U); }, '심화'),
        act('Compare & Think', '비교하고 생각하기', 6, 'eye', (L, r) => { const U = UP[L]; return setLv(F(G.cardsDecide(U, 4, r), G.followUp(U, 3, r)), U); }, '심화'),
        act('Next Step', '다음 도전', 4, 'books', (L, r) => { const U = UP[L]; return F([G.brief('Reading Pack으로 한 걸음 더!', 'Test 결과가 아주 좋아요. 원서 Reading Pack에서 새로운 이야기를 읽어 보세요. 읽은 결과는 따로 기록돼요.', [])], setLv(G.qa(U, 2, r), U)); }, '심화'),
      ];
    }
    const [t1, t2] = [plan.tags[0], plan.tags[1] || plan.tags[0]];
    const mixedName = plan.type === 'mixed' ? ['Mixed Challenge', '보강 + 도전'] : ['Mixed Challenge', '섞어서 도전'];
    return [report,
      act(`Boost · ${MG.TAGS[t1].ko}`, `${MG.TAGS[t1].ko} 보강`, 6, MG.TAGS[t1].icon, (L, r) => takeScored(REM[t1](L, rng(`l8a-${L}-${t1}`)), 7), '보강'),
      act(`Boost · ${MG.TAGS[t2].ko}`, `${MG.TAGS[t2].ko} 보강`, 6, MG.TAGS[t2].icon, (L, r) => takeScored(REM[t2](L, rng(`l8b-${L}-${t2}${t1 === t2 ? 'x' : ''}`)), 7), '보강'),
      act(mixedName[0], mixedName[1], 6, 'sparkles', (L, r) => {
        const pool = F(REM[t1](L, rng('l8m1' + L)), REM[t2](L, rng('l8m2' + L))).filter(isQ);
        const base = r.take(pool, 4);
        if (plan.type !== 'mixed') return r.take(pool, 6);
        const U = UP[L]; const upItems = setLv(F(...plan.up.map((u) => REM[u](U, rng('l8u' + L + u)))).filter(isQ).slice(0, 2), U);
        return [...base, ...upItems];
      }, '도전'),
      act('Re-check', '다시 확인', 4, 'clipboard', (L, r) => F(REM[t1](L, rng('l8r' + L + t1)), REM[t2](L, rng('l8s' + L + t2))).filter(isQ).slice(0, 4), '확인'),
    ];
  };
  function setLv(items, lv) { return items.map((i) => ({ ...i, lv })); }

  /* ---------- API ---------- */
  MG.actItems = (lesson, idx, L, plan, tagStats, ctx) => {
    const r = rng(`${lesson.no}-${idx}-${L}`);
    if (lesson.no === 7) return MG.testItems(L);
    const acts = lesson.no === 8 ? MG.l8Acts(plan, tagStats) : lesson.acts;
    return acts[idx].build(L, r, ctx || {});
  };
  /* Homework: 공통 핵심 복습 30% · 개인별 취약점 보강 50% · 독립 적용 미션 20% */
  MG.hwItems = (lesson, L, opt = {}) => {
    const no = lesson.no, weak = (opt.weak || []).filter((t) => REM[t]);
    const common = takeScored(lesson.hw(L, rng(`hw-${no}-${L}`)), 3).map((i) => ({ ...i, part: 'common' }));
    let mid, part = 'weak';
    if (weak.length) {
      const pool = F(...weak.map((t) => REM[t](L, rng(`hwx-${no}-${L}-${t}`))));
      mid = takeScored(rng(`hwy-${no}-${L}`).shuf(pool.filter(isQ)).slice(0, 5), 5);
    } else {
      part = 'ext'; const U = UP[L], t = lesson.tags[0];
      mid = setLv(takeScored(REM[t](U, rng(`hwe-${no}-${L}`)), 5), U);
    }
    mid = mid.map((i) => ({ ...i, part }));
    const indep = takeScored(lesson.ind(L, rng(`hwi-${no}-${L}`)), 2).map((i) => ({ ...i, part: 'indep' }));
    return [...common, ...mid, ...indep];
  };

  /* ---------- Reading Pack (샘플 원서, 자체 제작 예시) ---------- */
  const B = (id, L, title, ko, icon, col, pages, qs) => ({ id, L, title, ko, icon, col, pages, qs });
  MG.BOOKS = [
    B('s1', 'SUPPORT', 'Hello, New Friend!', '안녕, 새 친구!', 'sprout', 'leaf', ["Hello! I'm Mina.\nI'm from Korea.", 'This is Lily.\nShe is from Canada.', 'Mina asks, "Where are you from?"\nLily says, "I\'m from Canada."', 'Nice to meet you, Lily!\n"Nice to meet you, too!"'], [QT('Where is Lily from?', 'Canada', 'Korea', 'Japan'), QT('Who asks the question?', 'Mina', 'Lily', 'Tom')]),
    B('s2', 'SUPPORT', 'The Flag Box', '깃발 상자', 'flag', 'sky', ['Look! A flag box!', 'A red circle. It is Japan.', 'Red and white. It is Canada.', 'Blue and stars. It is Australia.'], [QT('Which flag has a red circle?', 'Japan', 'Canada', 'Australia'), QT('What is in the box?', 'Flags', 'Books', 'Apples')]),
    B('c1', 'CORE', 'The New Student', '새로 온 친구', 'user', 'berry', ['Ben is new at school. He is nervous.', 'A girl says, "Hi! I\'m Jin. Where are you from?"', 'Ben says, "I\'m from Canada. Are you from Korea?"', 'Jin says, "Yes, I am. Nice to meet you!"', 'Now Ben is happy. He has a new friend.'], [QT('How does Ben feel at first?', 'Nervous', 'Angry', 'Sleepy'), QT('Where is Ben from?', 'Canada', 'Korea', 'Brazil'), QT('Is Jin from Korea?', 'Yes, she is.', "No, she isn't.", 'We don\'t know.')]),
    B('c2', 'CORE', 'Postcards from Friends', '친구들의 엽서', 'send', 'grape', ['Dear Mina, I\'m Ken. I\'m from Japan. Are you from Seoul?', 'Dear Mina, I\'m Sofia. I\'m from France. I like painting.', 'Dear Mina, I\'m Leo. I\'m from Brazil. I like music.', 'Mina reads the cards. She smiles. "I have friends in three countries!"'], [QT('Who is from France?', 'Sofia', 'Ken', 'Leo'), QT('What does Leo like?', 'Music', 'Painting', 'Soccer'), QT('How many friends send cards?', 'Three', 'Two', 'Five')]),
    B('a1', 'ADVANCED', 'The International Day Mystery', '국제의 날 미스터리', 'target', 'mango', ["On International Day, a small flag is on the teacher's desk. Nobody knows whose flag it is.", 'Mia says, "It is red, white, and blue. Is it from the United States?" Tom shakes his head. "No, I\'m not. I\'m from the United States, but my flag is bigger!"', 'Priya says, "It has a red circle. Is it from Japan?" Ken smiles. "Yes, it is mine! I\'m from Tokyo."', 'Ken says, "Thank you for finding it. Nice to meet you all!" Everyone laughs. The mystery is solved.'], [QT('Whose flag is it?', "Ken's", "Tom's", "Mia's"), QT('Why did Tom say "No, I\'m not"?', 'The flag was not his.', 'He was not at school.', 'He was not from the United States.'), QT('Where is Ken from?', 'Tokyo, Japan', 'Sydney, Australia', 'Delhi, India')]),
    B('a2', 'ADVANCED', 'A Letter to Omar', '오마르에게 보내는 편지', 'send', 'sky', ["Dear Omar, my name is Ana. I'm from Madrid, Spain. I'm twelve years old, and I like tennis.", 'Our teacher says you are from Cairo. Is that true? I want to know about Egypt. Are there big pyramids near your city?', 'I am sending a photo of my school. It is next to a small park. Where is your school?', 'Please write back soon. I hope we can be good friends. Your friend, Ana'], [QT('Where is Ana from?', 'Madrid, Spain', 'Cairo, Egypt', 'Mexico City, Mexico'), QT('What does Ana want to know about?', 'Egypt', 'Tennis', 'Her school'), QT('What does Ana hope?', 'To be good friends', 'To visit a park', 'To play tennis today')]),
  ];
  MG.bookItems = (b) => F(b.pages.map((t) => ({ k: 'text', text: t, ko: null, book: true })), b.qs);

  /* ---------- Unit 레지스트리: 현재 Unit의 콘텐츠를 MG.* 로 꽂아 쓴다 ---------- */
  MG.UNITS = MG.UNITS || {};
  MG.BANKS1 = { EXPR_BANK, EXPR_ADV, FOLLOW, PRED, ERR, NAT, SENT, POOL };
  MG.UNITS[1] = { UNIT: MG.UNIT, LESSONS: MG.LESSONS, TEST: MG.TEST, testItems: MG.testItems, l8Acts: MG.l8Acts, actItems: MG.actItems, hwItems: MG.hwItems, REM: MG.REM, LO: MG.LO, BOOKS: MG.BOOKS, bookItems: MG.bookItems, PASS: MG.PASS, PEOPLE: MG.PEOPLE, unitAi: null };
  MG.useUnit = (n) => { const u = MG.UNITS[n] || MG.UNITS[1]; Object.assign(MG, u); MG.curUnit = MG.UNITS[n] ? n : 1; return MG.curUnit; };
})();
