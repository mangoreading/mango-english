/* Mango English · Activity 엔진
 * - 플레이어(MG.play): 문항 진행 / 하단 피드백 바 / 결과 수집
 * - 렌더러(MG.R[k]): learn, text, brief, report, choose, match, build, fill, write, compose, speak, dialog
 * 새 Activity 유형은 MG.R 에 렌더러를 하나 추가하면 모든 차시에서 재사용됩니다.
 */
(function () {
  const MG = window.MG;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = (s) => String(s).toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const br = (s) => esc(s).replace(/\n/g, '<br>');
  MG.esc = esc; MG.norm = norm;

  /* ---------- 음성 (TTS / 음성 인식) ---------- */
  let voice = null;
  function pickVoice() {
    try {
      const vs = speechSynthesis.getVoices();
      voice = vs.find((v) => /en[-_]US/i.test(v.lang) && /(Google|Samantha|Aria|Jenny|Natural)/i.test(v.name)) || vs.find((v) => /en[-_]US/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
    } catch (e) {}
  }
  try { speechSynthesis.onvoiceschanged = pickVoice; pickVoice(); } catch (e) {}
  MG.say = (t) => {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'en-US'; u.rate = 0.88; u.pitch = 1.05; if (voice) u.voice = voice;
      speechSynthesis.speak(u);
    } catch (e) {}
  };
  const stopSay = () => { try { speechSynthesis.cancel(); } catch (e) {} };
  MG.micOn = () => { try { const v = localStorage.getItem('mg2:mic'); if (v) return v === 'on'; } catch (e) {} return true; };
  const SRc = () => (MG.micOn() ? (window.SpeechRecognition || window.webkitSpeechRecognition) : undefined);
  const ratio = (heard, target) => {
    const t = norm(target).split(' '), h = norm(heard).split(' ');
    return t.filter((w) => h.includes(w)).length / t.length;
  };
  const speechOk = (alts, accept) => alts.some((a) => accept.some((t) => ratio(a, t) >= 0.5 && norm(a).split(' ').length <= norm(t).split(' ').length * 2));

  /* ---------- AI 대화 어댑터 (지금은 규칙 기반 · 나중에 Claude API로 교체) ----------
   * MG.ai.reply({ persona:{key}, level, history, text }) → Promise<{ reply, ok, intent }>
   * 실서비스에서는 서버(프록시)를 거쳐 Claude를 호출하고, 같은 형태({reply, ok, intent})로 돌려주면 됩니다.
   * 가드레일: 주제(출신 국가·자기소개) 안에서만 응답, 레벨별 쉬운 어휘, 벗어나면 부드럽게 복귀.
   */
  const findCountry = (txt) => {
    const s = norm(txt);
    for (const id in MG.COUNTRIES) { const e = norm(MG.COUNTRIES[id].en).replace(/^the /, ''); if (new RegExp('\\b' + e + '\\b').test(s)) return id; }
    if (/\b(usa|america|united states)\b/.test(s)) return 'us';
    return null;
  };
  const localReply = ({ persona, text, level }) => {
    const p = MG.PEOPLE[persona.key], C = MG.COUNTRIES[p.c].en, s = norm(text);
    const R = (reply, intent) => ({ reply, ok: true, intent });
    let m;
    if (/where (are|do) you (come )?from|where r you from/.test(s)) return R(level === 'SUPPORT' ? `I'm from ${C}.` : `I'm from ${p.city}, ${C}. How about you?`, 'askFrom');
    if ((m = s.match(/(are|r) you from (.+)/))) {
      const place = m[2], cid = findCountry(place);
      if (cid === p.c || norm(place).includes(norm(p.city))) return R(`Yes, I am! I'm from ${C}.`, 'askYes');
      if (cid) return R(`No, I'm not. I'm from ${C}.`, 'askNo');
      return R(`Hmm, I'm from ${C}. Where are you from?`, 'askOther');
    }
    if (/do you like (.+)/.test(s)) return R(`Yes, I do! I like ${p.like}.`, 'askLike');
    if (/what('s| is) your name|who are you/.test(s)) return R(`I'm ${p.n}. Nice to meet you!`, 'askName');
    if (/(i'm|i am) from/.test(s) || /^from /.test(s)) return R(`Oh, nice! ${level === 'SUPPORT' ? 'Nice to meet you.' : 'Are you from a big city?'}`, 'sayFrom');
    if ((m = s.match(/(my name is|i'm|i am) ([a-z]+)/)) && !/from|like/.test(m[2])) return R(`Nice to meet you, ${m[2][0].toUpperCase() + m[2].slice(1)}!`, 'sayName');
    if (/i like (.+)/.test(s)) return R(`Cool! I like ${p.like}, too.`, 'sayLike');
    if (/nice to meet you/.test(s)) return R('Nice to meet you, too!', 'greet');
    if (/^(yes|no)\b/.test(s)) return R(`I see! Where are you from?`, 'yesno');
    return { reply: `Sorry, I didn't get that. Let's talk about where we are from. Where are you from?`, ok: false, intent: 'offTopic' };
  };
  MG.ai = MG.ai || { reply: (ctx) => Promise.resolve(MG.unitAi ? MG.unitAi(ctx) : localReply(ctx)) };
  MG.LO_DEF = { vocab: 'LO1', expr: 'LO2', listen: 'LO4', speak: 'LO3', read: 'LO4', write: 'LO5' };

  const pcard = (ctx, small) => {
    const p = MG.PEOPLE[ctx.key];
    return `<div class="pcard ${small ? 'sm' : ''}">${MG.avatar(p.n, p.col, small ? 40 : 52)}<div><b>${p.n}</b><span>${esc(ctx.line)}</span></div>${MG.flag(p.c, 'mini')}</div>`;
  };
  MG.pcard = pcard;
  const listenBtn = (id = 'lis', label = '듣기') => `<button class="listen-btn" id="${id}">${MG.icon('volume', 26)}<span>${label}</span></button>`;

  /* ---------- 리포트 HTML (Test 결과 / 기록 화면 공용) ---------- */
  MG.reportHTML = (tags, plan, lo) => {
    const rows = Object.keys(MG.TAGS).map((t) => {
      const s = tags[t] || { c: 0, t: 0 }; const pct = s.t ? Math.round((s.c / s.t) * 100) : 0; const T = MG.TAGS[t];
      const weak = plan && plan.tags && plan.tags.includes(t);
      const strong = plan && plan.up && plan.up.includes(t);
      return `<div class="bar-row ${weak ? 'weak' : ''} ${strong ? 'strong' : ''}"><span class="bl" style="--tc:var(--${T.c})">${MG.icon(T.icon, 20)}${T.ko}</span><div class="track"><i style="width:${pct}%;background:var(--${T.c})"></i></div><b>${s.t ? pct + '%' : '-'}</b><em>${s.t ? s.c + '/' + s.t : ''}</em></div>`;
    }).join('');
    let planHtml = '';
    if (plan) {
      const names = plan.tags.map((t) => MG.TAGS[t].ko).join(' · ');
      const ups = (plan.up || []).map((t) => MG.TAGS[t].ko).join(' · ');
      planHtml = plan.type === 'challenge'
        ? `<div class="plan up">${MG.mascot('cheer', 72)}<div><b>8차시는 심화 도전!</b><span>모든 영역이 안정적이에요. 자유 대화와 글쓰기에 도전해요.</span></div></div>`
        : plan.type === 'mixed'
          ? `<div class="plan">${MG.mascot('cheer', 72)}<div><b>8차시는 ${names} 보강 + ${ups} 도전!</b><span>부족한 부분은 채우고, 잘하는 부분은 한 단계 더 올라가요.</span></div></div>`
          : `<div class="plan">${MG.mascot('happy', 72)}<div><b>8차시는 ${names} 보강!</b><span>부족한 부분을 집중해서 채우면 금방 쑥쑥 자라요.</span></div></div>`;
    }
    const indHtml = lo && lo.ind && lo.ind.t ? `<p class="ind-line">${MG.icon('sparkles', 18)}도움 없이 해낸 비율 <b>${Math.round((lo.ind.c / lo.ind.t) * 100)}%</b> <em>(${lo.ind.c}/${lo.ind.t})</em></p>` : '';
    const loHtml = lo && lo.los ? `<div class="lo-list">${Object.keys(MG.LO).map((k) => { const x = lo.los[k] || { c: 0, t: 0 }; const pct = x.t ? Math.round((x.c / x.t) * 100) : 0; return `<div class="lo-row"><span class="lo-k">${k}</span><span class="lo-n">${MG.LO[k].ko}</span><div class="track"><i style="width:${pct}%"></i></div><b>${x.t ? pct + '%' : '-'}</b></div>`; }).join('')}</div>` : '';
    let scoreHtml = '';
    const keys = Object.keys(MG.TAGS); const tot = keys.reduce((a, t) => { const s = tags[t] || { c: 0, t: 0 }; return [a[0] + s.c, a[1] + s.t]; }, [0, 0]);
    if (tot[1]) {
      const score = Math.round((tot[0] / tot[1]) * 100), n = keys.length, cx = 130, cy = 120, R = 80;
      const pt = (i, f) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [cx + R * f * Math.cos(a), cy + R * f * Math.sin(a)]; };
      const ring = (f) => keys.map((_, i) => pt(i, f).join(',')).join(' ');
      const vals = keys.map((t, i) => { const s = tags[t] || { c: 0, t: 0 }; return pt(i, s.t ? s.c / s.t : 0); });
      const dots = vals.map((v) => `<circle cx="${v[0]}" cy="${v[1]}" r="9" fill="#5B86F5" fill-opacity=".45"/>`).join('');
      const labels = keys.map((t, i) => { const [x, y] = pt(i, 1.3); return `<text x="${x}" y="${y + 4}" text-anchor="middle">${MG.TAGS[t].ko}</text>`; }).join('');
      const verdict = score >= 90 ? 'PERFECT!' : score >= 75 ? 'GREAT!' : score >= 60 ? 'GOOD!' : 'KEEP GOING!';
      scoreHtml = `<div class="score-panel"><div class="score-tab">${verdict}</div><div class="score-radar"><svg viewBox="0 0 260 240" role="img" aria-label="영역별 레이더 차트">${[0.25, 0.5, 0.75, 1].map((f) => `<polygon points="${ring(f)}" fill="none" stroke="#DDE3EE" stroke-width="1"/>`).join('')}${keys.map((_, i) => `<line x1="${cx}" y1="${cy}" x2="${pt(i, 1)[0]}" y2="${pt(i, 1)[1]}" stroke="#E6EAF2"/>`).join('')}<polygon points="${vals.map((v) => v.join(',')).join(' ')}" fill="#5B86F5" fill-opacity=".55" stroke="#4F7DF0" stroke-width="3" stroke-linejoin="round"/>${dots}${labels}</svg></div><div class="score-num"><small>SCORE</small><b>${score}</b></div></div>`;
    }
    return `<div class="report">${scoreHtml}<div class="bars">${rows}</div>${loHtml}${indHtml}${planHtml}</div>`;
  };

  /* ---------- 플레이어 ---------- */
  MG.play = function (cfg) {
    const root = document.createElement('div');
    root.className = 'pl'; root.dataset.color = cfg.color || 'mango';
    document.body.appendChild(root);
    const items = cfg.items;
    const ptsKey = () => { const d = new Date(); return 'mg2:pts:' + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
    const ptsGet = () => { try { return parseInt(localStorage.getItem(ptsKey()), 10) || 0; } catch (e) { return mem; } };
    let mem = 0;
    const ptsAdd = (n) => { mem += n; try { localStorage.setItem(ptsKey(), String(ptsGet() + n)); } catch (e) {} };
    let i = 0, misses = 0, tries = 0, hints = 0, fin = false, results = [], totalMiss = 0, handler = null, reviewFlag = false;
    root.innerHTML = `<header class="pl-top"><div class="pl-left"><button class="x-btn" id="px" aria-label="뒤로">${MG.icon('chevL', 22)}</button><div class="pl-label" id="plab"></div></div><div class="seg-bar" id="segs"></div><div class="pl-pts" id="ppts"></div></header>
      <main class="pl-stage" id="pstage"><div class="stage" id="stage"></div></main>
      <footer class="fbar idle" id="fbar"><div class="fb-in"><div class="fb-l" id="fbl"></div><button class="btn big" id="prim" hidden></button></div></footer>`;
    const $ = (s) => root.querySelector(s);
    const stage = $('#stage'), prim = $('#prim');
    $('#segs').innerHTML = items.map(() => '<i></i>').join('');
    $('#px').onclick = () => confirmExit();
    prim.onclick = () => handler && !prim.disabled && handler();
    const onKey = (e) => { if (e.key === 'Enter' && !prim.hidden && !prim.disabled && !['TEXTAREA', 'BUTTON'].includes(document.activeElement.tagName) && handler) { e.preventDefault(); handler(); } };
    document.addEventListener('keydown', onKey);
    const isLast = () => i === items.length - 1;
    const setBar = (state, msg, sub) => {
      $('#fbar').className = 'fbar ' + state;
      $('#fbl').innerHTML = state === 'ok' ? `${MG.mascot('cheer', 40)}<div><b>${esc(msg)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</div>` : state === 'no' ? `${MG.mascot('think', 40)}<div><b>${esc(msg)}</b></div>` : '';
    };
    function confirmExit() {
      const m = document.createElement('div'); m.className = 'modal-bg';
      m.innerHTML = `<div class="modal sm"><div class="m-mascot">${MG.mascot('sleep', 96)}</div><h3 class="disp">그만할까요?</h3><p>지금 하던 Activity는 저장되지 않아요.</p><div class="row"><button class="btn ghost" id="mc">계속하기</button><button class="btn" id="mq">나가기</button></div></div>`;
      root.appendChild(m);
      m.querySelector('#mc').onclick = () => m.remove();
      m.querySelector('#mq').onclick = () => { close(); cfg.onExit && cfg.onExit(); };
    }
    function close() { document.removeEventListener('keydown', onKey); stopSay(); root.remove(); }
    function show() {
      const it = items[i]; misses = 0; tries = 0; hints = 0; fin = false; reviewFlag = false; handler = null;
      prim.hidden = true; setBar('idle'); stage.innerHTML = ''; $('#pstage').scrollTop = 0;
      $('#segs').querySelectorAll('i').forEach((s, k) => { s.className = k < i ? 'done' : k === i ? 'cur' : ''; });
      $('#ppts').innerHTML = `${MG.icon('star', 22, 'fill')}<span>포인트 : ${ptsGet()}</span>`;
      const T = it.tag && MG.TAGS[it.tag];
      const PART = { common: '공통 복습', weak: '내 맞춤 보강', ext: '확장 미션', indep: '독립 미션' };
      $('#plab').innerHTML = it.part ? `<span class="tagchip part-${it.part}">${PART[it.part]}</span>` : cfg.mode === 'test' && T ? `<span class="tagchip" style="--tc:var(--${T.c})">${MG.icon(T.icon, 16)}${T.ko}</span>` : `<span class="muted">${esc(cfg.title || '')}</span>`;
      const api = {
        el: stage, it, root, L: it.lv || cfg.level, test: cfg.mode === 'test', say: MG.say, esc, norm,
        primary(label, fn, disabled) { prim.hidden = false; prim.textContent = label; prim.disabled = !!disabled; handler = fn; },
        clearPrimary() { prim.hidden = true; handler = null; },
        onFinish: null,
        hint() { hints++; }, resetMiss() { misses = 0; tries = 0; }, resetHint() { hints = 0; },
        reset() { fin = false; handler = null; prim.hidden = true; setBar('idle'); stage.innerHTML = ''; },
        miss(msg) { misses++; if (!api.test) setBar('no', msg || '다시 해볼까요?'); },
        missCount: () => misses,
        flagReview() { reviewFlag = true; },
        finish(msg, sub) {
          if (api.onFinish) { const f = api.onFinish; api.onFinish = null; setBar('ok', msg || '좋아요!', sub); api.primary('다음 단계', () => { api.reset(); f(); }); return; }
          if (fin) return; fin = true;
          if (api.test) { setBar('idle'); api.primary(isLast() ? '완료' : '다음', next); }
          else { setBar('ok', msg || ['잘했어요!', '멋져요!', '정답이에요!'][Math.floor(Math.random() * 3)], sub); api.primary(isLast() ? '완료' : '계속', next); }
        },
        info() { fin = true; setBar('idle'); api.primary(isLast() ? '완료' : '계속', next); },
        try(correct, o = {}) {
          tries++;
          if (correct) { api.finish(o.okMsg, o.sub); return 'done'; }
          misses++;
          if (api.test) { api.finish(); return 'done'; }
          if (o.reveal && tries >= 3) {
            setBar('ok', '정답을 알려 줄게요', o.reveal);
            if (api.onFinish) { const f = api.onFinish; api.onFinish = null; api.primary('다음 단계', () => { api.reset(); f(); }); }
            else { fin = true; api.primary(isLast() ? '완료' : '계속', next); }
            return 'reveal';
          }
          setBar('no', o.hint || '다시 해볼까요?');
          return 'retry';
        },
        tries: () => tries,
      };
      try { MG.R[it.k](api); } catch (e) { console.error('render error', it, e); api.info(); }
    }
    function next() {
      const it = items[i];
      if (it.tag && misses === 0) ptsAdd(5);
      if (it.tag) results.push({ tag: it.tag, ok: misses === 0, review: reviewFlag, k: it.k, lo: it.lo || MG.LO_DEF[it.tag], hint: hints, ind: misses === 0 && hints === 0, part: it.part });
      if (it.reteach && misses > 0) { items.splice(i + 1, 0, it.reteach); $('#segs').innerHTML = items.map(() => '<i></i>').join(''); }
      totalMiss += misses; i++;
      if (i >= items.length) { document.removeEventListener('keydown', onKey); stopSay(); cfg.onDone({ results, total: items.length, misses: totalMiss, scored: results.length }, root, close); }
      else show();
    }
    MG.current = () => ({ item: items[i], i, root });
    show();
    return { close };
  };

  /* ---------- 렌더러 ---------- */
  const R = (MG.R = {});

  R.learn = (a) => {
    const it = a.it;
    a.el.innerHTML = `<h2 class="q-big">${esc(it.title)}</h2><div class="lcards n${it.cards.length} ${it.cards.every((c) => !c.flag) ? 'bars' : ''}">${it.cards.map((c, k) => `<button class="lcard" data-i="${k}">${c.flag ? MG.flag(c.flag) : `<span class="lc-ic">${MG.icon(c.icon || 'chat', 36)}</span>`}<b>${esc(c.en)}</b><span>${esc(c.ko)}</span><i class="spk">${MG.icon('volume', 20)}</i></button>`).join('')}</div>`;
    a.el.querySelectorAll('.lcard').forEach((b) => (b.onclick = () => { MG.say(it.cards[b.dataset.i].say || it.cards[b.dataset.i].en); b.classList.add('heard'); }));
    a.info();
  };

  R.text = (a) => {
    const it = a.it, L = a.L, lines = it.text.split('\n');
    const showKo = it.ko && !a.test ? (L === 'ADVANCED' ? 'btn' : L === 'SUPPORT' ? 'open' : 'btn') : it.ko && a.test && L === 'SUPPORT' ? 'btn' : null;
    a.el.innerHTML = `<h2 class="q-big">${esc(it.title || (it.test ? '글을 읽고 문제를 풀어 보세요' : '소리 내어 읽어 보세요'))}</h2>
      <div class="passage ${it.book ? 'book' : ''}">${lines.map((l, k) => `<p class="ln" data-i="${k}" tabindex="0" role="button">${esc(l)}</p>`).join('')}</div>
      <div class="row center"><button class="listen-btn" id="all">${MG.icon('volume', 24)}<span>전체 듣기</span></button>${showKo === 'btn' ? `<button class="ghost-btn" id="kobtn">${MG.icon('eye', 20)}<span>해석 보기</span></button>` : ''}</div>
      ${showKo ? `<div class="ko-box" id="ko" ${showKo === 'btn' ? 'hidden' : ''}>${esc(it.ko)}</div>` : ''}`;
    a.el.querySelector('#all').onclick = () => MG.say(lines.join(' '));
    a.el.querySelectorAll('.ln').forEach((p) => { const f = () => { MG.say(lines[p.dataset.i]); p.classList.add('hot'); setTimeout(() => p.classList.remove('hot'), 900); }; p.onclick = f; p.onkeydown = (e) => { if (e.key === ' ') { e.preventDefault(); f(); } }; });
    const kb = a.el.querySelector('#kobtn'); if (kb) kb.onclick = () => { const k = a.el.querySelector('#ko'); k.hidden = !k.hidden; };
    a.info();
  };

  R.brief = (a) => {
    const it = a.it;
    a.el.innerHTML = `<div class="brief"><div class="brief-m">${MG.mascot('cheer', 130)}</div><div><span class="eyebrow">MISSION</span><h2 class="q-big left">${esc(it.title)}</h2><p class="brief-t">${esc(it.text)}</p>
      <div class="brief-p">${(it.people || []).map((k) => { const p = MG.PEOPLE[k]; return `<div class="bp">${MG.avatar(p.n, p.col, 46)}<b>${p.n}</b>${MG.flag(p.c, 'mini')}</div>`; }).join('')}</div></div></div>`;
    a.info();
  };

  R.report = (a) => {
    const d = a.it.data;
    a.el.innerHTML = `<h2 class="q-big">Test 결과를 확인해요</h2>${MG.reportHTML(d.tags, d.plan)}`;
    a.info();
  };

  R.choose = (a) => {
    const it = a.it, flags = it.opts.some((o) => o.flag);
    const ord = shuffle(it.opts.map((_, k) => k));
    let h = '';
    if (it.ctx) h += pcard(it.ctx);
    if (it.flag) h += `<div class="bigflag">${MG.flag(it.flag)}</div>`;
    if (it.pic) h += `<div class="pic">${it.pic}</div>`;
    if (it.bubble) h += `<div class="bub">${br(it.bubble)}${it.say ? `<button class="spk-btn" id="lis" aria-label="듣기">${MG.icon('volume', 22)}</button>` : ''}</div>`;
    const q = it.blank ? br(it.q).replace('___', '<span class="blank"></span>') : br(it.q);
    h += `<h2 class="q-big">${q}</h2>`;
    if (it.say && !it.bubble) h += listenBtn();
    if (it.script && a.L === 'SUPPORT') h += `<button class="ghost-btn" id="scr">${MG.icon('eye', 20)}<span>글자로 보기</span></button><div class="script" id="scrbox" hidden>${it.script.map((l) => `<p>${esc(l)}</p>`).join('')}</div>`;
    h += `<div class="opts ${flags ? 'flags' : it.opts.length === 2 ? 'two' : 'list'}">${ord.map((k) => { const o = it.opts[k]; return `<button class="opt" data-i="${k}">${o.flag ? `${MG.flag(o.flag)}<b>${esc(o.t)}</b>${o.sub ? `<span>${esc(o.sub)}</span>` : ''}` : `<b>${esc(o.t)}</b>`}</button>`; }).join('')}</div>`;
    a.el.innerHTML = h;
    const lis = a.el.querySelector('#lis');
    if (it.say) { lis.onclick = () => MG.say(it.say); setTimeout(() => MG.say(it.say), 350); }
    const scr = a.el.querySelector('#scr'); if (scr) scr.onclick = () => { a.hint(); a.el.querySelector('#scrbox').hidden = false; scr.hidden = true; };
    const lock = () => a.el.querySelectorAll('.opt').forEach((x) => (x.disabled = true));
    const reveal = () => { if (it.script && !a.el.querySelector('#scrbox')) a.el.querySelector('.opts').insertAdjacentHTML('afterend', `<div class="script">${it.script.map((l) => `<p>${esc(l)}</p>`).join('')}</div>`); else { const sb = a.el.querySelector('#scrbox'); if (sb) { sb.hidden = false; const s = a.el.querySelector('#scr'); if (s) s.hidden = true; } } };
    a.el.querySelectorAll('.opt').forEach((b) => (b.onclick = () => {
      const ok = +b.dataset.i === it.a;
      if (a.test) { b.classList.add('sel'); lock(); if (!ok) a.miss(); a.finish(); return; }
      if (ok) { b.classList.add('ok'); lock(); reveal(); a.finish(undefined, it.fb); }
      else { b.classList.add('no'); b.disabled = true; a.miss('다시 골라 볼까요?'); }
    }));
  };

  R.match = (a) => {
    const it = a.it, colors = ['mango', 'sky', 'berry', 'leaf', 'grape'];
    let selL = null, selR = null, n = 0;
    a.el.innerHTML = `<h2 class="q-big">${esc(it.title)}</h2><div class="match"><div class="mcol" id="ml">${it.pairs.map((p, k) => { const pe = MG.PEOPLE[p.key]; return `<button class="mcard" data-l="${k}">${MG.avatar(pe.n, pe.col, 44)}<b>${pe.n}</b><span class="plays" data-p="${k}">${MG.icon('volume', 22)}</span></button>`; }).join('')}</div><div class="mcol" id="mr">${it.right.map((id) => `<button class="mcard flagc" data-r="${id}">${MG.flag(id)}<b>${(MG.COUNTRIES[id] || MG.ITEMS[id]).en}</b></button>`).join('')}</div></div><p class="hint-t">${(MG.UNIT && MG.UNIT.matchHint) || '사람 카드를 누르면 소개가 나와요. 알맞은 나라를 연결하세요.'}</p>`;
    const L = a.el.querySelectorAll('[data-l]'), Rr = a.el.querySelectorAll('[data-r]');
    const paint = () => { L.forEach((x) => x.classList.toggle('sel', +x.dataset.l === selL)); Rr.forEach((x) => x.classList.toggle('sel', x.dataset.r === selR)); };
    const tryPair = () => {
      if (selL === null || selR === null) return;
      const lb = a.el.querySelector(`[data-l="${selL}"]`), rb = a.el.querySelector(`[data-r="${selR}"]`);
      if (MG.PEOPLE[it.pairs[selL].key].c === selR) {
        const c = colors[n % colors.length]; n++;
        [lb, rb].forEach((x) => { x.classList.remove('sel'); x.classList.add('done'); x.style.setProperty('--mc', `var(--${c})`); x.disabled = true; });
        selL = selR = null; paint();
        if (n === it.pairs.length) a.finish('모두 연결했어요!');
      } else { a.miss('다시 연결해 볼까요?'); [lb, rb].forEach((x) => { x.classList.add('shake'); setTimeout(() => x.classList.remove('shake'), 500); }); selL = selR = null; paint(); }
    };
    L.forEach((b) => (b.onclick = () => { selL = +b.dataset.l; MG.say(it.pairs[selL].say); paint(); tryPair(); }));
    a.el.querySelectorAll('.plays').forEach((s) => (s.onclick = (e) => { e.stopPropagation(); MG.say(it.pairs[+s.dataset.p].say); }));
    Rr.forEach((b) => (b.onclick = () => { selR = b.dataset.r; paint(); tryPair(); }));
  };

  R.build = (a) => {
    const it = a.it; let pool = shuffle(it.words.map((w, k) => ({ w, k }))), ans = [], locked = false;
    const draw = () => {
      a.el.innerHTML = `<h2 class="q-big">단어를 눌러 문장을 만들어 보세요</h2>${it.ko && a.L !== 'ADVANCED' ? `<p class="ko-line red">${esc(it.ko)}</p>` : ''}
        <div class="slot ${locked ? 'locked' : ''}">${ans.map((t, k) => `<button class="tile in" data-a="${k}">${esc(t.w)}</button>`).join('') || '<span class="ph">여기에 문장이 만들어져요</span>'}</div>
        <div class="tiles">${pool.map((t, k) => `<button class="tile" data-p="${k}">${esc(t.w)}</button>`).join('')}</div>`;
      if (locked) return;
      a.el.querySelectorAll('[data-p]').forEach((b) => (b.onclick = () => { ans.push(pool.splice(+b.dataset.p, 1)[0]); draw(); }));
      a.el.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => { pool.push(ans.splice(+b.dataset.a, 1)[0]); draw(); }));
      a.primary('확인', check, pool.length > 0);
    };
    const check = () => {
      const ok = ans.map((t) => t.w).join(' ') === it.ans;
      const r = a.try(ok, { hint: '순서를 다시 확인해 볼까요?', reveal: it.ans, sub: undefined });
      if (r !== 'retry') { locked = true; if (r === 'reveal') ans = it.words.map((w, k) => ({ w, k })), pool = []; draw(); a.say(it.ans); }
    };
    draw();
  };

  const accepts = (it) => [it.ans, ...(it.alts || [])].map(norm);
  const initials = (s) => s.split(' ').map((w) => w[0] + '_'.repeat(Math.max(w.length - 1, 0))).join(' ');
  const typedItem = (a, kind) => {
    const it = a.it, L = a.L, wide = it.wide || kind === 'write';
    let h = '';
    if (it.ctx) h += pcard(it.ctx);
    if (it.flag) h += `<div class="bigflag sm">${MG.flag(it.flag)}</div>`;
    if (kind === 'write') h += `<h2 class="q-big">${/틀린 곳/.test(it.ko) ? '틀린 곳을 고쳐 써 보세요' : '다음 문장을 영어로 써 보세요'}</h2><p class="ko-line red">${esc(it.ko.replace(/^틀린 곳을 고쳐 써 보세요: /, ''))}</p>`;
    else h += `<h2 class="q-big">다음 문장에 들어갈 단어를 써 보세요</h2><div class="sent-pill">${br(it.q).replace(/___/g, '<span class="blank"></span>')}</div>`;
    h += `<input class="field ${wide ? 'wide' : ''}" id="in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${kind === 'write' ? 'English sentence' : '정답을 써 보세요'}"><div class="hintline" id="hl"></div>`;
    if (L === 'CORE' && !a.test) h += `<button class="ghost-btn" id="hb">${MG.icon('bulb', 20)}<span>힌트</span></button>`;
    a.el.innerHTML = h;
    const inp = a.el.querySelector('#in'), hl = a.el.querySelector('#hl');
    const hint = () => { hl.textContent = '힌트: ' + initials(it.ans); };
    if (L === 'SUPPORT' && !a.test) hint();
    const hb = a.el.querySelector('#hb'); if (hb) hb.onclick = hint;
    let locked = false;
    const check = () => {
      if (locked || !inp.value.trim()) return;
      const ok = accepts(it).includes(norm(inp.value));
      const r = a.try(ok, { hint: a.tries() === 0 && L !== 'ADVANCED' ? `거의 다 왔어요! ${it.ans[0]}(으)로 시작해요` : '철자와 마침표를 확인해 볼까요?', reveal: it.ans, okMsg: '정답이에요!', sub: it.fb || it.ans });
      if (r !== 'retry') { locked = true; inp.disabled = true; if (r === 'reveal') inp.value = it.ans; MG.say(kind === 'write' ? it.ans : it.q ? it.q.replace('___', it.ans) : it.ans); }
    };
    inp.addEventListener('input', () => a.primary('확인', check, !inp.value.trim()));
    a.primary('확인', check, true);
    inp.focus();
  };
  R.fill = (a) => typedItem(a, 'fill');
  R.write = (a) => typedItem(a, 'write');

  const sentences = (t) => t.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.replace(/_/g, '').length > 1).length;
  R.compose = (a) => {
    const it = a.it; let locked = false;
    const rules = it.rules.map((r) => ({ label: r.label, ok: (t) => (r.re ? r.re.test(t) : r.test(t)) }));
    const all = [...rules, { label: `${it.minSent}문장 이상`, ok: (t) => sentences(t) >= it.minSent }];
    let h = '';
    if (it.persona) h += pcard(it.persona);
    if (it.persona2) h += `<div class="row center">${it.persona2.map((p) => pcard(p, true)).join('')}</div>`;
    h += `<h2 class="q-big">${esc(it.title)}</h2><div class="compose"><textarea class="field area" id="ta" spellcheck="false" placeholder="여기에 영어로 써 보세요">${esc(it.starter || '')}</textarea><ul class="checks" id="ck">${all.map((r, k) => `<li data-k="${k}">${MG.icon('check', 18)}<span>${esc(r.label)}</span></li>`).join('')}</ul></div>${it.tip ? `<p class="hint-t">${esc(it.tip)}</p>` : ''}<div class="sample" id="sm" hidden></div>`;
    a.el.innerHTML = h;
    const ta = a.el.querySelector('#ta');
    const update = () => { if (a.test) return; all.forEach((r, k) => a.el.querySelector(`[data-k="${k}"]`).classList.toggle('on', r.ok(ta.value))); };
    const check = () => {
      if (locked) return; const pass = all.every((r) => r.ok(ta.value));
      all.forEach((r, k) => a.el.querySelector(`[data-k="${k}"]`).classList.toggle('on', r.ok(ta.value)));
      const res = a.try(pass, { hint: '체크리스트에서 빠진 항목을 채워 볼까요?', reveal: it.sample, okMsg: '멋진 글이에요!' });
      if (res !== 'retry') { locked = true; ta.disabled = true; if (res === 'reveal' || a.test) { const sm = a.el.querySelector('#sm'); if (!a.test) { sm.hidden = false; sm.textContent = '예시: ' + it.sample; } } }
    };
    ta.addEventListener('input', () => { update(); a.primary('확인', check, !ta.value.trim()); });
    a.primary('확인', check, true); update(); ta.focus();
  };

  R.speak = (a) => {
    const it = a.it, L = a.L; let shown = !it.hide, done = false, rec = null, wrong = 0;
    const draw = () => {
      let h = '';
      if (it.ctx) h += pcard(it.ctx);
      if (it.flag) h += `<div class="bigflag sm">${MG.flag(it.flag)}</div>`;
      h += `<h2 class="q-big">${esc(it.prompt || '따라 말해 보세요')}</h2>`;
      h += `<div class="target ${shown ? '' : 'hidden'}">${shown ? esc(it.disp || it.target) : '· · · · ·'}</div>`;
      h += `<div class="row center">${it.ask ? `<button class="listen-btn" id="ask">${MG.icon('volume', 24)}<span>질문 듣기</span></button>` : ''}${it.listen && (shown || it.autoplay || L === 'SUPPORT') ? `<button class="listen-btn" id="lis">${MG.icon('volume', 24)}<span>듣기</span></button>` : ''}${!shown && L === 'CORE' && !a.test ? `<button class="ghost-btn" id="show">${MG.icon('bulb', 20)}<span>문장 보기</span></button>` : ''}</div>`;
      h += SRc() ? `<button class="mic" id="mic" aria-label="말하기">${MG.icon('mic', 40)}</button><p class="mic-t" id="mt">버튼을 누르고 영어로 말해 보세요</p><button class="ghost-btn" id="self" hidden>${MG.icon('check', 20)}<span>직접 확인하고 넘어가기</span></button>` : `<p class="mic-t" id="mt">소리 내어 말해 본 뒤 버튼을 눌러요</p><button class="btn" id="self">${MG.icon('mic', 22)}<span>말했어요</span></button>`;
      a.el.innerHTML = h;
      const q = (s) => a.el.querySelector(s);
      if (q('#ask')) q('#ask').onclick = () => MG.say(it.ask);
      if (q('#lis')) q('#lis').onclick = () => MG.say(it.target);
      if (q('#show')) q('#show').onclick = () => { shown = true; a.hint(); draw(); };
      if (q('#self')) q('#self').onclick = selfOk;
      if (q('#mic')) q('#mic').onclick = listen;
    };
    const selfOk = () => { if (done) return; done = true; if (a.test) { a.flagReview(); a.finish(); } else a.finish('잘했어요!', '소리 내어 말했어요'); lockUI(); };
    const lockUI = () => { const m = a.el.querySelector('#mic'); if (m) m.disabled = true; const s = a.el.querySelector('#self'); if (s) s.hidden = true; if (!shown) { shown = true; const t = a.el.querySelector('.target'); t.classList.remove('hidden'); t.textContent = it.target; } };
    let active = false, lastEnd = 0;
    const listen = () => {
      if (done) return; const S = SRc(); const mic = a.el.querySelector('#mic'), mt = a.el.querySelector('#mt');
      if (active) { try { rec && rec.abort(); } catch (e) {} return; } // 듣는 중에 또 누르면 중단 → 끝난 뒤 다시 누르면 시작
      const wait = Math.max(0, 450 - (Date.now() - lastEnd)); // 직전 인식이 완전히 끝난 뒤에 시작(크롬 aborted 방지)
      active = true; mic.classList.add('rec'); mt.classList.remove('bad'); mt.textContent = '듣고 있어요…';
      const finish = () => { active = false; lastEnd = Date.now(); mic.classList.remove('rec'); mic.disabled = !!done; };
      setTimeout(() => {
        try {
          stopSay(); rec = new S(); rec.lang = 'en-US'; rec.maxAlternatives = 3; rec.interimResults = false; rec.continuous = false;
          let got = false;
          rec.onresult = (e) => {
            got = true; const alts = [...e.results[0]].map((x) => x.transcript);
            const ok = speechOk(alts, it.accept || [it.target]);
            if (!ok) { mt.textContent = `다시 한번 말해 보세요 (들린 말: "${alts[0]}")`; mt.classList.add('bad'); return; }
            mt.textContent = `들린 말: "${alts[0]}"`; done = true; lockUI();
            if (a.test) { a.finish(); } else a.finish('정확해요!', `"${alts[0]}"`);
            const pb = a.root.querySelector('#prim'); if (pb && pb.textContent === '계속') pb.textContent = '확인';
          };
          rec.onerror = (e) => {
            got = true;
            if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(e.error)) mt.textContent = '마이크 연결을 확인하세요';
            else if (e.error === 'network') mt.textContent = '인터넷 연결을 확인하세요';
            else mt.textContent = '다시 한번 말해 보세요';
          };
          rec.onend = () => { if (!got && !done) mt.textContent = '다시 한번 말해 보세요'; finish(); };
          rec.start();
        } catch (e) { finish(); mt.textContent = '다시 한번 말해 보세요'; }
      }, wait);
    };
    draw();
    if (it.ask) setTimeout(() => MG.say(it.ask), 350);
    else if (it.autoplay) setTimeout(() => MG.say(it.target), 350);
  };

  /* 힌트 줄이기(SUPPORT): ① 선택 → ② 모델 듣고 따라 말하기 → ③ 도움 없이 독립 발화. 기록은 ③ 결과 기준 */
  R.fade = (a) => {
    const it = a.it; let stage = 0;
    const run = () => {
      stage++;
      if (stage === 1) {
        a.it = { k: 'choose', tag: it.tag, say: it.ask || it.target, ctx: it.ctx, flag: it.flag, q: it.q1, opts: it.opts, a: it.a, fb: it.fb };
        a.onFinish = run; R.choose(a); return;
      }
      if (stage === 2) {
        a.it = { k: 'speak', tag: it.tag, ctx: it.ctx, flag: it.flag, ask: it.ask, prompt: '듣고 따라 말해 보세요', target: it.target, accept: it.accept || [it.target], listen: true, autoplay: !it.ask, hide: false };
        a.onFinish = run; R.speak(a); return;
      }
      a.resetMiss(); a.resetHint();
      a.it = { k: 'speak', tag: it.tag, ctx: it.ctx, flag: it.flag, ask: it.ask, prompt: it.prompt3 || '이번에는 도움 없이 말해 볼까요?', target: it.target, accept: it.accept || [it.target], listen: false, hide: true };
      R.speak(a);
    };
    run();
  };

  R.dialog = (a) => {
    const it = a.it, L = a.L, turns = it.turns; let t = 0, wrongT = 0, freeOk = 0, freeBad = 0;
    a.el.innerHTML = `${pcard(it.persona)}<div class="chat" id="chat"></div><div class="reply" id="reply"></div>`;
    const chat = a.el.querySelector('#chat'), reply = a.el.querySelector('#reply');
    const bubble = (who, text) => { chat.insertAdjacentHTML('beforeend', `<div class="cb ${who}">${who === 'ai' ? `<span class="cb-av">${MG.mascot('happy', 40)}</span>` : ''}<p>${esc(text)}</p></div>`); chat.scrollTop = chat.scrollHeight; };
    const good = (turn, text) => turn.free ? text.trim().length > 0 : (turn.re && turn.re.test(text)) || (turn.accept || []).some((x) => norm(x) === norm(text) || ratio(text, x) >= 0.85 && norm(text).split(' ').length <= norm(x).split(' ').length + 1);
    const step = () => {
      if (t >= turns.length) { reply.innerHTML = ''; if (it.free && it.free.n) return freePhase(); a.finish('대화를 멋지게 끝냈어요!'); return; }
      const turn = turns[t];
      if (turn.who === 'ai') { bubble('ai', turn.text); MG.say(turn.text); t++; reply.innerHTML = ''; setTimeout(step, MG.fast ? 30 : 1100); return; }
      wrongT = 0; ask(turn);
    };
    const accept = (turn, text) => { bubble('me', text); t++; reply.innerHTML = ''; step(); };
    const inputRow = (ph) => `<div class="rrow">${SRc() ? `<button class="mic sm" id="rmic" aria-label="말하기">${MG.icon('mic', 28)}</button>` : ''}<input class="field" id="rin" autocomplete="off" spellcheck="false" placeholder="${ph}"><button class="btn" id="rsend">${MG.icon('send', 20)}</button></div><div class="hintline" id="rh"></div>`;
    const wireMic = (send, rh) => {
      const mic = reply.querySelector('#rmic'); if (!mic) return;
      mic.onclick = () => {
        try { stopSay(); const r = new (SRc())(); r.lang = 'en-US'; r.maxAlternatives = 3; mic.classList.add('rec');
          r.onresult = (e) => { mic.classList.remove('rec'); const alts = [...e.results[0]].map((x) => x.transcript); send(alts[0], alts); };
          r.onerror = () => { mic.classList.remove('rec'); rh.textContent = '마이크를 사용할 수 없어요. 글자로 입력해 보세요.'; }; r.onend = () => mic.classList.remove('rec'); r.start(); } catch (e) { rh.textContent = '글자로 입력해 보세요.'; }
      };
    };
    const ask = (turn) => {
      if (turn.ind) { a.resetMiss(); a.resetHint(); }
      if (L === 'SUPPORT' && turn.opts && !turn.ind) {
        a.hint();
        reply.innerHTML = `<p class="hint-t">알맞은 대답을 골라 보세요</p><div class="ropts">${shuffle(turn.opts).map((o) => `<button class="ropt" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
        reply.querySelectorAll('.ropt').forEach((b) => (b.onclick = () => { if (norm(b.dataset.o) === norm(turn.accept[0])) accept(turn, b.dataset.o); else { b.disabled = true; b.classList.add('no'); a.miss('다시 골라 볼까요?'); } }));
        return;
      }
      reply.innerHTML = inputRow(turn.ind ? '도움 없이 말하거나 써 보세요' : '말하거나 영어로 써서 대답해 보세요');
      const inp = reply.querySelector('#rin'), rh = reply.querySelector('#rh');
      const send = (txt, alts) => {
        const v = (txt || inp.value).trim(); if (!v) return;
        const hit = alts ? alts.find((x) => good(turn, x)) : null;
        if (good(turn, hit || v)) accept(turn, hit || v);
        else { wrongT++; a.miss('다시 말해 볼까요?'); inp.value = ''; if (wrongT >= 2 && !turn.free) { a.hint(); rh.innerHTML = `도움말: <b>${esc(turn.accept[0])}</b> <button class="link" id="use">이 문장으로 말하기</button>`; reply.querySelector('#use').onclick = () => { bubble('me', turn.accept[0]); t++; reply.innerHTML = ''; step(); }; } else if (L === 'CORE' && wrongT === 1 && turn.accept) { a.hint(); rh.textContent = `힌트: ${turn.accept[0].split(' ').slice(0, 2).join(' ')} …`; } }
      };
      reply.querySelector('#rsend').onclick = () => send();
      inp.onkeydown = (e) => { if (e.key === 'Enter') send(); };
      wireMic(send, rh);
      inp.focus();
    };
    /* 자유 대화 구간: 대본이 끝난 뒤, 주제(출신 국가·자기소개) 안에서 학생이 자유롭게 질문/말하기 */
    const freePhase = () => {
      const n = it.free.n; bubble('ai', it.free.prompt || 'Now you can ask me anything about where I am from!'); MG.say(it.free.prompt || 'Now you can ask me anything about where I am from!');
      const draw = () => {
        reply.innerHTML = `<p class="hint-t">자유 대화 ${freeOk}/${n} · 영어로 질문하거나 말해 보세요</p>${inputRow('예: Are you from ...?')}`;
        const inp = reply.querySelector('#rin'), rh = reply.querySelector('#rh');
        if (freeBad >= 2) { a.hint(); rh.innerHTML = `예시: <b>${esc(it.free.example || 'Are you from Seoul?')}</b>`; }
        if (freeBad >= 3) rh.innerHTML += ` <button class="link" id="skip">넘어가기</button>`;
        const sk = reply.querySelector('#skip'); if (sk) sk.onclick = () => { reply.innerHTML = ''; a.finish('여기까지 잘했어요!'); };
        const send = (txt) => {
          const v = (txt || inp.value).trim(); if (!v) return; inp.disabled = true;
          Promise.resolve(MG.ai.reply({ persona: it.persona, level: L, text: v })).then((res) => {
            bubble('me', v); bubble('ai', res.reply); MG.say(res.reply);
            if (res.ok) { freeOk++; freeBad = 0; } else { freeBad++; a.miss('주제에 맞게 말해 볼까요?'); }
            if (freeOk >= n) { reply.innerHTML = ''; a.finish('대화를 멋지게 이어갔어요!'); } else draw();
          });
        };
        reply.querySelector('#rsend').onclick = () => send();
        inp.onkeydown = (e) => { if (e.key === 'Enter') send(); };
        wireMic(send, rh);
        inp.focus();
      };
      draw();
    };
    step();
  };
})();
