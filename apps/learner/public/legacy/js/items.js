/* Mango English · Unit 2 물건 그림 (60x40, 단순화 line 일러스트) — MG.flag(id)가 물건 id도 그려 줍니다 */
(function () {
  const MG = window.MG;
  const S = 'stroke="#1F2A44" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const bg = (c) => `<rect width="60" height="40" fill="${c}"/>`;
  const PIC = {
    cap: () => bg('#FFE9D6') + `<path d="M13 27a17 15 0 0 1 34 0z" fill="#FF7A59" ${S}/><path d="M38 27h13a3 3 0 0 1-3 4H16" fill="#FF9B7D" ${S}/><circle cx="30" cy="12.5" r="2" fill="#fff" ${S}/><path d="M30 14v13" ${S} fill="none"/>`,
    cup: () => bg('#E3F4FF') + `<path d="M17 14h22l-2 18a3 3 0 0 1-3 2H22a3 3 0 0 1-3-2z" fill="#fff" ${S}/><path d="M39 17h4a4 4 0 0 1 0 9h-5" fill="none" ${S}/><path d="M18 20h20" ${S} stroke="#3A9BFF"/><path d="M24 6q-2 3 0 5M31 6q-2 3 0 5" fill="none" ${S}/>`,
    ball: () => bg('#E8F7EC') + `<circle cx="30" cy="20" r="15" fill="#fff" ${S}/><path d="M30 5v30M15 20h30" fill="none" ${S}/><path d="M18 9q8 11 0 22M42 9q-8 11 0 22" fill="none" ${S} stroke="#22B07D"/>`,
    bag: () => bg('#F2E9FF') + `<rect x="14" y="14" width="32" height="21" rx="4" fill="#7B61FF" ${S}/><path d="M22 14v-3a8 8 0 0 1 16 0v3" fill="none" ${S}/><path d="M14 22h32" fill="none" ${S} stroke="#fff"/><rect x="27" y="20" width="6" height="5" rx="1.5" fill="#FFC233" ${S}/>`,
    socks: () => bg('#FFE7EE') + `<path d="M14 6h12v16l9 4a6 6 0 0 1-3 11H20a6 6 0 0 1-6-6z" fill="#fff" ${S}/><path d="M14 11h12M14 16h12" fill="none" ${S} stroke="#FF5C7A"/><path d="M36 10h10v14l5 3a5 5 0 0 1-2.5 9H40a5 5 0 0 1-5-5" fill="#FFD1DC" ${S}/>`,
    shoes: () => bg('#E6F6F6') + `<path d="M8 28V15l8 4 5-5 5 4h8c7 0 15 4 17 10v4H8z" fill="#12B5C2" ${S}/><path d="M8 33h44" fill="none" ${S}/><path d="M22 19l3 4M28 21l2 4" fill="none" ${S} stroke="#fff"/>`,
    book: () => bg('#FFF3D6') + `<path d="M12 9a3 3 0 0 1 3-3h14v28H15a3 3 0 0 0-3 3z" fill="#FFC233" ${S}/><path d="M48 9a3 3 0 0 0-3-3H31v28h14a3 3 0 0 1 3 3z" fill="#FFE08A" ${S}/><path d="M17 12h8M17 17h8M36 12h8M36 17h8" fill="none" ${S}/>`,
    umbrella: () => bg('#E3F4FF') + `<path d="M8 22a22 16 0 0 1 44 0q-4-4-7.3 0Q41 18 37 22q-3-4-7-4t-7 4q-4-4-7.7 0Q12 18 8 22z" fill="#3A9BFF" ${S}/><path d="M30 6v0M30 22v12a4 4 0 0 1-8 0" fill="none" ${S}/>`,
    gloves: () => bg('#FFEBD6') + `<path d="M12 36V19a3 3 0 0 1 6 0V9a3 3 0 0 1 6 0v10V7a3 3 0 0 1 6 0v12V9a3 3 0 0 1 6 0v14l4-4a3 3 0 0 1 4 4l-7 12v1z" fill="#FF9F1C" ${S}/><path d="M13 31h25" fill="none" ${S} stroke="#fff"/>`,
    watch: () => bg('#EAF0FF') + `<path d="M23 12l2-8h10l2 8M23 28l2 8h10l2-8" fill="#9CB4FF" ${S}/><circle cx="30" cy="20" r="11" fill="#fff" ${S}/><path d="M30 13v7l5 3" fill="none" ${S}/>`,
    glasses: () => bg('#F3EBE0') + `<circle cx="19" cy="22" r="9" fill="#E3F4FF" ${S}/><circle cx="41" cy="22" r="9" fill="#E3F4FF" ${S}/><path d="M28 21q2-2 4 0M10 20L6 14M50 20l4-6" fill="none" ${S}/>`,
    pants: () => bg('#E9EEFF') + `<path d="M17 5h26l3 31H33l-3-16-3 16H14z" fill="#5B7BFF" ${S}/><path d="M17 10h26" fill="none" ${S} stroke="#fff"/><path d="M30 10v10" fill="none" ${S}/>`,
    hat: () => bg('#FFF3D6') + `<ellipse cx="30" cy="27" rx="22" ry="6" fill="#FFC233" ${S}/><path d="M16 26q0-16 14-16t14 16" fill="#FFD966" ${S}/><path d="M16.5 22q13.5 4 27 0" fill="none" ${S} stroke="#FF7A59"/><circle cx="40" cy="13" r="2.5" fill="#FF7A59" ${S}/>`,
    sunglasses: () => bg('#E9F1FF') + `<path d="M6 15h48" fill="none" ${S}/><path d="M9 15h18a1 1 0 0 1 1 1v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8z" fill="#1F2A44" ${S}/><path d="M33 15h18a1 1 0 0 1 1 1v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8z" fill="#1F2A44" ${S}/><path d="M28 18q2-2 4 0" fill="none" ${S}/><path d="M13 19l4-1M37 19l4-1" fill="none" ${S} stroke="#fff"/>`,
    jacket: () => bg('#FFE7EE') + `<path d="M21 6l9 4 9-4 10 6 4 22h-7l-1-12v18H15V16l-1 12H7l4-22z" fill="#FF5C7A" ${S}/><path d="M30 10v26" fill="none" ${S}/><path d="M24 22h4M32 22h4" fill="none" ${S} stroke="#fff"/>`,
    shorts: () => bg('#E3F4FF') + `<path d="M13 8h34l3 24H34l-4-11-4 11H10z" fill="#3A9BFF" ${S}/><path d="M13 12h34" fill="none" ${S} stroke="#fff"/><path d="M30 8v13" fill="none" ${S}/>`,
    won: () => bg('#FFF3D6') + `<circle cx="30" cy="20" r="14" fill="#FFC233" ${S}/><path d="M22 14l3 12 5-9 5 9 3-12M20 18h20M20 23h20" fill="none" ${S}/>`,
  };
  MG.ITEMPIC = PIC;
  const orig = MG.flag;
  const WIMG = {hat:1,sunglasses:1,jacket:1,shorts:1,socks:1,shoes:1};
  MG.flag = (code, cls = '') => WIMG[code]
    ? `<img class="flag item wimg ${cls}" src="img/word/${code}.png" alt="" draggable="false">`
    : PIC[code]
    ? `<svg class="flag item ${cls}" viewBox="0 0 60 40" aria-hidden="true"><defs><clipPath id="iclip"><rect width="60" height="40" rx="5"/></clipPath></defs><g clip-path="url(#iclip)">${PIC[code]()}</g><rect x=".5" y=".5" width="59" height="39" rx="4.5" fill="none" stroke="rgba(31,42,68,.18)"/></svg>`
    : orig(code, cls);
})();
