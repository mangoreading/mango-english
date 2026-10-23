/* Mango English · 에셋: line 아이콘 / 단순화 국기 / 마스코트 / 아바타 */
(function () {
  const MG = (window.MG = window.MG || {});

  /* ---------- line icons (24x24, stroke) ---------- */
  const P = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
    books: '<path d="M4 19V6a2 2 0 0 1 2-2h4v15"/><path d="M10 19V4h4a2 2 0 0 1 2 2v13"/><path d="M3 20h18"/><path d="M18 8l2.5.8-2 10.7"/>',
    headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>',
    pencil: '<path d="M4 20l1-4L16 5l3 3L8 19l-4 1z"/><path d="M14 7l3 3"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    volume: '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>',
    play: '<path d="M8 5l11 7-11 7z"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    chevL: '<path d="M15 5l-7 7 7 7"/>',
    chevR: '<path d="M9 5l7 7-7 7"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    chat: '<path d="M4 5h16v11H9l-5 4V5z"/><path d="M8 10h8M8 13h5"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 13v4M8 20h8M9 17h6"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    sparkles: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1-4 4-6 8-6s7 2 8 6"/>',
    star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.5 9.7l5.9-.8z"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    sprout: '<path d="M12 21v-9"/><path d="M12 12c0-4-3-6-7-6 0 4 3 6 7 6z"/><path d="M12 14c0-3 2-5 6-5 0 3-2 5-6 5z"/>',
    tree: '<path d="M12 21v-6"/><path d="M12 15c-4 0-7-2.5-7-6 0-2 1.3-3.6 3-4 .7-1.7 2.2-2.5 4-2.5s3.3.8 4 2.5c1.7.4 3 2 3 4 0 3.5-3 6-7 6z"/>',
    rocket: '<path d="M12 3c3 2 5 5.5 5 9l-2 3H9l-2-3c0-3.5 2-7 5-9z"/><circle cx="12" cy="10" r="1.6"/><path d="M9 15l-3 3v3l3-2M15 15l3 3v3l-3-2M12 15v5"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    abc: '<path d="M3 18L7.5 6 12 18M4.8 14h5.4"/><path d="M19 12a3 3 0 1 0 0 5.2M19 11v7"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM8.5 13l2 2 3.5-4"/>',
    flagSmall: '<path d="M6 21V4M6 5h12l-2.5 4 2.5 4H6"/>',
    swap: '<path d="M7 7h12M15 3l4 4-4 4M17 17H5M9 13l-4 4 4 4"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    send: '<path d="M21 3L3 10.5l7 3 3 7z"/><path d="M10 13.5L21 3"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    skip: '<path d="M5 5l9 7-9 7zM18 5v14"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
    graph: '<path d="M3 17l5-6 4 3 8-9"/><path d="M3 21h18"/>',
  };
  MG.icon = (name, size = 24, cls = '') =>
    `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;

  /* ---------- simplified flag illustrations (3:2) ---------- */
  function star(cx, cy, r, n = 5, inner = 0.4, rot = -90) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = ((rot + (i * 180) / n) * Math.PI) / 180;
      const rr = i % 2 ? r * inner : r;
      pts.push((cx + rr * Math.cos(a)).toFixed(2) + ',' + (cy + rr * Math.sin(a)).toFixed(2));
    }
    return pts.join(' ');
  }
  function tri(x, y, rot, broken) {
    let s = '';
    for (let i = 0; i < 3; i++) {
      const yy = y + i * 2.6;
      if (broken) s += `<rect x="${x}" y="${yy}" width="4" height="1.4" fill="#1b1b1b"/><rect x="${x + 5}" y="${yy}" width="4" height="1.4" fill="#1b1b1b"/>`;
      else s += `<rect x="${x}" y="${yy}" width="9" height="1.4" fill="#1b1b1b"/>`;
    }
    return `<g transform="rotate(${rot} ${x + 4.5} ${y + 3})">${s}</g>`;
  }
  const FLAGS = {
    kr: () =>
      `<rect width="60" height="40" fill="#fff"/><path d="M22 20a8 8 0 0 1 16 0z" fill="#CD2E3A"/><path d="M22 20a8 8 0 0 0 16 0z" fill="#0047A0"/><circle cx="26" cy="20" r="4" fill="#CD2E3A"/><circle cx="34" cy="20" r="4" fill="#0047A0"/>` +
      tri(7, 6, -34, false) + tri(44, 6, 34, true) + tri(7, 28, 34, true) + tri(44, 28, -34, false),
    jp: () => `<rect width="60" height="40" fill="#fff"/><circle cx="30" cy="20" r="10" fill="#BC002D"/>`,
    cn: () =>
      `<rect width="60" height="40" fill="#DE2910"/><polygon points="${star(11, 11, 6.5)}" fill="#FFDE00"/><polygon points="${star(21, 4.5, 2, 5, 0.4, -40)}" fill="#FFDE00"/><polygon points="${star(25, 9.5, 2, 5, 0.4, -10)}" fill="#FFDE00"/><polygon points="${star(25, 15.5, 2, 5, 0.4, 10)}" fill="#FFDE00"/><polygon points="${star(21, 20, 2, 5, 0.4, 30)}" fill="#FFDE00"/>`,
    ca: () =>
      `<rect width="60" height="40" fill="#fff"/><rect width="15" height="40" fill="#D52B1E"/><rect x="45" width="15" height="40" fill="#D52B1E"/><path d="M30 8l2.2 4.6 3.6-1.4-1.2 6.4 3.6-2.8.8 2.4 3.4-.6-1.8 4.2 1.6 1.2-6.6 5.2.5 2.6-5.1-.8.1 5.4h-2.2l.1-5.4-5.1.8.5-2.6-6.6-5.2 1.6-1.2-1.8-4.2 3.4.6.8-2.4 3.6 2.8-1.2-6.4 3.6 1.4z" fill="#D52B1E"/>`,
    us: () => {
      let s = '<rect width="60" height="40" fill="#fff"/>';
      for (let i = 0; i < 13; i += 2) s += `<rect y="${(i * 40) / 13}" width="60" height="${40 / 13}" fill="#B22234"/>`;
      s += '<rect width="26" height="21.5" fill="#3C3B6E"/>';
      for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) s += `<circle cx="${3.2 + c * 4.9}" cy="${3.4 + r * 4.9}" r="1" fill="#fff"/>`;
      return s;
    },
    au: () =>
      `<rect width="60" height="40" fill="#00247D"/><g><path d="M0 0l30 20M30 0L0 20" stroke="#fff" stroke-width="3.4"/><path d="M0 0l30 20M30 0L0 20" stroke="#CF142B" stroke-width="1.2"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="5.4"/><path d="M15 0v20M0 10h30" stroke="#CF142B" stroke-width="3.2"/></g><polygon points="${star(15, 31, 5.5, 7, 0.5)}" fill="#fff"/><polygon points="${star(44, 7, 2.4, 7, 0.5)}" fill="#fff"/><polygon points="${star(37, 17, 2.4, 7, 0.5)}" fill="#fff"/><polygon points="${star(51, 17, 2.4, 7, 0.5)}" fill="#fff"/><polygon points="${star(44, 32, 2.8, 7, 0.5)}" fill="#fff"/>`,
    in: () => {
      let spokes = '';
      for (let i = 0; i < 12; i++) spokes += `<path d="M30 20L${(30 + 4.2 * Math.cos((i * Math.PI) / 6)).toFixed(2)} ${(20 + 4.2 * Math.sin((i * Math.PI) / 6)).toFixed(2)}" stroke="#000080" stroke-width=".5"/>`;
      return `<rect width="60" height="13.4" fill="#FF9933"/><rect y="13.3" width="60" height="13.4" fill="#fff"/><rect y="26.6" width="60" height="13.4" fill="#138808"/><circle cx="30" cy="20" r="4.2" fill="none" stroke="#000080" stroke-width=".8"/>${spokes}`;
    },
    br: () => `<rect width="60" height="40" fill="#009C3B"/><path d="M30 4L55 20 30 36 5 20z" fill="#FFDF00"/><circle cx="30" cy="20" r="8.4" fill="#002776"/><path d="M22.2 18.2q8-3 15.8 3" fill="none" stroke="#fff" stroke-width="1.6"/>`,
    fr: () => `<rect width="20" height="40" fill="#0055A4"/><rect x="20" width="20" height="40" fill="#fff"/><rect x="40" width="20" height="40" fill="#EF4135"/>`,
    eg: () => `<rect width="60" height="13.4" fill="#CE1126"/><rect y="13.3" width="60" height="13.4" fill="#fff"/><rect y="26.6" width="60" height="13.4" fill="#111"/><circle cx="30" cy="20" r="3" fill="#C09300"/>`,
    mx: () => `<rect width="20" height="40" fill="#006847"/><rect x="20" width="20" height="40" fill="#fff"/><rect x="40" width="20" height="40" fill="#CE1126"/><circle cx="30" cy="20" r="4.2" fill="#A6753B"/><path d="M26 24q4 3 8 0" fill="none" stroke="#006847" stroke-width="1"/>`,
    es: () => `<rect width="60" height="40" fill="#AA151B"/><rect y="10" width="60" height="20" fill="#F1BF00"/>`,
  };
  MG.flag = (code, cls = '') =>
    `<svg class="flag ${cls}" viewBox="0 0 60 40" aria-hidden="true"><defs><clipPath id="fclip"><rect width="60" height="40" rx="5"/></clipPath></defs><g clip-path="url(#fclip)">${(FLAGS[code] || FLAGS.jp)()}</g><rect x=".5" y=".5" width="59" height="39" rx="4.5" fill="none" stroke="rgba(31,42,68,.18)"/></svg>`;

  /* ---------- mascot: Mango ---------- */
  MG.mascot = (mood = 'happy', size = 120, cls = '') => {
    const eyes =
      mood === 'cheer' || mood === 'happy'
        ? '<path d="M38 60q6-9 12 0M70 60q6-9 12 0" fill="none" stroke="#1F2A44" stroke-width="3.2" stroke-linecap="round"/>'
        : mood === 'sleep'
        ? '<path d="M38 60h12M70 60h12" stroke="#1F2A44" stroke-width="3.2" stroke-linecap="round"/>'
        : '<circle cx="44" cy="60" r="5" fill="#1F2A44"/><circle cx="76" cy="60" r="5" fill="#1F2A44"/><circle cx="45.6" cy="58.4" r="1.6" fill="#fff"/><circle cx="77.6" cy="58.4" r="1.6" fill="#fff"/>';
    const mouth =
      mood === 'cheer'
        ? '<path d="M48 74q12 20 24 0z" fill="#E94B5C" stroke="#1F2A44" stroke-width="3" stroke-linejoin="round"/>'
        : mood === 'think'
        ? '<path d="M52 80h16" stroke="#1F2A44" stroke-width="3.2" stroke-linecap="round"/>'
        : mood === 'sleep'
        ? '<circle cx="60" cy="80" r="3" fill="none" stroke="#1F2A44" stroke-width="2.6"/>'
        : '<path d="M50 74q10 10 20 0" fill="none" stroke="#1F2A44" stroke-width="3.2" stroke-linecap="round"/>';
    return `<svg class="mascot ${cls}" width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true">
      <ellipse cx="60" cy="112" rx="30" ry="5" fill="rgba(31,42,68,.12)"/>
      <path d="M60 22C88 18 106 40 104 68C102 96 80 112 58 108C34 104 16 86 18 62C20 38 38 24 60 22Z" fill="#FFC233" stroke="#1F2A44" stroke-width="3" stroke-linejoin="round"/>
      <path d="M104 68C102 96 80 112 58 108C80 100 94 86 98 62Z" fill="#FF9F1C" opacity=".55"/>
      <path d="M60 22C56 10 66 3 82 6C82 19 72 25 60 22Z" fill="#2FBF71" stroke="#1F2A44" stroke-width="3" stroke-linejoin="round"/>
      <path d="M60 22C59 16 59 12 61 8" fill="none" stroke="#1F2A44" stroke-width="3" stroke-linecap="round"/>
      ${eyes}<circle cx="32" cy="72" r="5.5" fill="#FF7A8A" opacity=".55"/><circle cx="88" cy="72" r="5.5" fill="#FF7A8A" opacity=".55"/>${mouth}
      ${mood === 'think' ? '<path d="M96 36q4 6 0 9q-4-3 0-9z" fill="#8FD3FF" stroke="#1F2A44" stroke-width="2"/>' : ''}
    </svg>`;
  };

  /* ---------- avatar: 외모 대신 이니셜 (출신 추측 방지) ---------- */
  MG.avatar = (name, color, size = 56) =>
    `<span class="avatar" style="--av:${color};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.46)}px">${name[0]}</span>`;
})();
