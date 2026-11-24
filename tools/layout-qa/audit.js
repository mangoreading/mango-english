// 페이지 안에서 실행되는 검사 함수(문자열로 주입). 결과: [{t, sev, el, d}]
(function () {
  const vw = innerWidth, vh = innerHeight, out = [];
  const root = document.querySelector('.nv-overlay') || document.body;
  const desc = (e) => (e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 3).join('.') : '') + (e.textContent ? ` "${e.textContent.trim().slice(0, 24)}"` : ''));
  const shown = (e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0'; };
  const IGNORE = '.nv-price, .nv-pill, .nv-star, .nv-picwrap .nv-tag, [data-qa-ignore]';
  if (document.querySelector('.nv-hint') && /단원 어휘에 없어요/.test(document.body.innerText)) out.push({ t: 'vocab-missing', sev: 'fail', el: 'harness', d: '검수용 단어 목록에 없는 그림 key (도구 설정 확인)' });
  // 1) 가로 스크롤 / 화면 밖
  if (document.documentElement.scrollWidth > vw + 1) out.push({ t: 'hscroll', sev: 'fail', el: 'document', d: `${document.documentElement.scrollWidth}>${vw}` });
  for (const e of root.querySelectorAll('*')) {
    const cs = getComputedStyle(e);
    if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && e.scrollWidth > e.clientWidth + 2) out.push({ t: 'hscroll', sev: 'fail', el: desc(e), d: `${e.scrollWidth}>${e.clientWidth}` });
    if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && e.scrollHeight > e.clientHeight + 2 && e.classList.contains('nv-body')) out.push({ t: 'vscroll', sev: 'warn', el: desc(e), d: `${e.scrollHeight}>${e.clientHeight}` });
  }
  // 2) 보이는 조각 모으기: 이미지·버튼·입력칸·글(글 조각은 글자 범위 크기로)
  const boxes = [];
  const add = (e, r, kind) => { if (r.width < 2 || r.height < 2) return; boxes.push({ e, kind, l: r.left, t: r.top, r: r.right, b: r.bottom }); };
  for (const e of root.querySelectorAll('img, button, input, textarea, select, video, canvas')) { if (!shown(e) || e.closest(IGNORE)) continue; add(e, e.getBoundingClientRect(), e.tagName === 'IMG' ? 'img' : 'ctl'); }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.trim()) continue; const p = n.parentElement; if (!p || !shown(p) || p.closest(IGNORE) || p.closest('button')) continue;
    const rg = document.createRange(); rg.selectNodeContents(n); const r = rg.getBoundingClientRect(); add(p, r, 'text');
  }
  for (const b of boxes) {
    if (b.l < -1 || b.r > vw + 1) out.push({ t: 'offscreen', sev: 'fail', el: desc(b.e), d: `x ${Math.round(b.l)}..${Math.round(b.r)} / ${vw}` });
    else if (b.b > vh + 1 && !b.e.closest('.nv-body, .nv-rv, .nv-chat, [style*="overflow"]')) out.push({ t: 'below-fold', sev: 'warn', el: desc(b.e), d: `y ${Math.round(b.b)} / ${vh}` });
  }
  // 3) 겹침: 서로 포함 관계가 아닌 조각끼리 면적이 겹치면
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], c = boxes[j]; if (a.e === c.e || a.e.contains(c.e) || c.e.contains(a.e)) continue;
    const w = Math.min(a.r, c.r) - Math.max(a.l, c.l), h = Math.min(a.b, c.b) - Math.max(a.t, c.t); if (w <= 3 || h <= 3) continue;
    const small = Math.min((a.r - a.l) * (a.b - a.t), (c.r - c.l) * (c.b - c.t)); if (w * h < small * 0.2) continue;
    out.push({ t: 'overlap', sev: 'fail', el: desc(a.e) + '  ×  ' + desc(c.e), d: `${Math.round(w)}x${Math.round(h)}px` });
  }
  // 4) 잘린 글, 너무 작은 글/버튼
  for (const e of root.querySelectorAll('*')) {
    if (!shown(e)) continue; const cs = getComputedStyle(e);
    if ((cs.overflowX === 'hidden' || cs.textOverflow === 'ellipsis') && e.scrollWidth > e.clientWidth + 2 && e.childElementCount === 0 && e.textContent.trim().length >= 4 && parseFloat(cs.fontSize) > 0 && parseFloat(cs.textIndent) >= 0 && !e.closest('.nv-x, .nv-star, .nv-bulb, .nv-ic')) out.push({ t: 'clipped', sev: 'fail', el: desc(e), d: `${e.scrollWidth}>${e.clientWidth}` });
    if (e.childElementCount === 0 && e.textContent.trim() && parseFloat(cs.fontSize) < 11 && !e.closest(IGNORE)) out.push({ t: 'small-font', sev: 'warn', el: desc(e), d: cs.fontSize });
    if ((e.tagName === 'BUTTON') && Math.min(e.getBoundingClientRect().width, e.getBoundingClientRect().height) < 24) out.push({ t: 'small-target', sev: 'warn', el: desc(e), d: `${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}` });
  }
  // 같은 항목 중복 제거
  const seen = new Set(); return out.filter((o) => { const k = o.t + '|' + o.el; if (seen.has(k)) return false; seen.add(k); return true; });
})()
