/**
 * MVP 활동 엔진 브리지 (임시).
 * 정적 MVP 의 활동 화면 코드(engine.js)를 그대로 불러와 DB 번들 데이터로 구동한다.
 * 이후 활동별로 React 정식 구현으로 교체한다. 필요할 때만(처음 재생할 때) 로드한다.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
let loading: Promise<any> | null = null;

function addScript(src: string) {
  return new Promise<void>((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = () => res(); s.onerror = () => rej(new Error('스크립트를 불러오지 못했어요: ' + src));
    document.head.appendChild(s);
  });
}

export function loadLegacy(): Promise<any> {
  if (!loading) {
    loading = (async () => {
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = '/legacy/css/app.css'; link.id = 'legacy-css';
      document.head.appendChild(link);
      for (const f of ['icons', 'items', 'content', 'content2', 'engine']) await addScript(`/legacy/js/${f}.js`);
      const MG = (window as any).MG;
      MG.useUnit(2); // Lesson 9 의 인물·AI·표현 설정 (임시: 이후 DB 로 이동)
      return MG;
    })();
  }
  return loading;
}

export interface PlayResult { results: { tag?: string; ok: boolean; hint?: number; lo?: string }[]; total: number; scored: number }

/** 활동 하나(문항 배열)를 재생한다. 끝나면 결과 화면을 보여 주고 onFinish 로 알린다. */
export async function playActivity(opts: {
  title: string; items: unknown[]; level: string; test?: boolean; color?: string;
  nextLabel?: string; // 다음 활동이 있으면 버튼 이름
  onResult: (res: PlayResult) => void;
  onFinish: (action: 'next' | 'again' | 'exit') => void;
  onExit: () => void;
}) {
  const MG = await loadLegacy();
  MG.play({
    title: opts.title, items: opts.items, level: opts.level, mode: opts.test ? 'test' : 'practice', color: opts.color || 'mango',
    onExit: opts.onExit,
    onDone: (res: PlayResult, root: HTMLElement, close: () => void) => {
      const ok = res.results.filter((r) => r.ok).length, sc = res.scored || res.results.length;
      const pct = sc ? ok / sc : 1;
      const st = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
      const title = st === 3 ? '완벽해요!' : st === 2 ? '잘했어요!' : '끝까지 해냈어요!';
      const stars = [1, 2, 3].map((n) => `<span style="font-size:44px;color:${n <= st ? '#FFC000' : '#D9DEE8'}">★</span>`).join('');
      root.innerHTML = `<div class="result"><div class="r-card">${MG.mascot(st === 1 ? 'happy' : 'cheer', 140)}<h1 class="disp">${title}</h1>
        <div class="r-stars">${stars}</div>
        <div class="r-sum"><div><b>${opts.test ? '-' : ok + '/' + sc}</b><span>첫 시도 정답</span></div><div><b>+${ok * 5}</b><span>포인트</span></div><div><b>${res.total}</b><span>문항</span></div></div>
        <div class="r-btns">${opts.nextLabel ? `<button class="btn big" id="r1">다음: ${opts.nextLabel}</button>` : ''}<button class="btn ghost" id="r2">다시 하기</button><button class="btn ghost" id="r0">나가기</button></div></div></div>`;
      const q = (s: string) => root.querySelector(s) as HTMLElement | null;
      if (q('#r1')) q('#r1')!.onclick = () => { close(); opts.onFinish('next'); };
      q('#r2')!.onclick = () => { close(); opts.onFinish('again'); };
      q('#r0')!.onclick = () => { close(); opts.onFinish('exit'); };
      opts.onResult(res);
    },
  });
}

/** 레거시 콘텐츠에서 차시/활동 이름을 읽는다 (임시) */
export async function lessonMeta() {
  const MG = await loadLegacy();
  return (MG.LESSONS as any[]).map((l) => ({ no: l.no, en: l.en, ko: l.ko, goal: l.goal, color: l.c, acts: (l.acts || []).map((a: any) => ({ t: a.t, ko: a.ko, min: a.min })) }))
    .concat([{ no: 7, en: 'Lesson Check', ko: '성취 확인', goal: '새 문항으로 짧게 확인해요.', color: 'sun', acts: [{ t: 'Lesson Check', ko: '성취 확인', min: 10 }] }]);
}

/* ---------- 7차시 결과 → 8차시 맞춤, Reading Pack (레거시 엔진의 규칙 사용) ---------- */
export type TagStats = Record<string, { c: number; t: number }>;

export async function tallyTags(results: PlayResult['results']) {
  const MG = await loadLegacy();
  const tags: TagStats = {};
  Object.keys(MG.TAGS).forEach((t) => (tags[t] = { c: 0, t: 0 }));
  let review = 0;
  results.forEach((r: any) => { if (r.tag && tags[r.tag]) { tags[r.tag].t++; if (r.ok) tags[r.tag].c++; } if (r.review) review++; });
  const plan = MG.makePlan(tags);
  const correct = Object.values(tags).reduce((s, x) => s + x.c, 0);
  const total = Object.values(tags).reduce((s, x) => s + x.t, 0);
  return { tags, plan, review, correct, total };
}

export async function lesson8(level: string, plan: unknown, tags: TagStats) {
  const MG = await loadLegacy();
  const acts = (MG.l8Acts(plan, tags) as any[]).map((a) => ({ t: a.t, ko: a.ko, min: a.min }));
  const items = (idx: number) => MG.actItems({ no: 8 }, idx, level, plan, tags, {}) as unknown[];
  return { acts, items };
}

export interface BookMeta { idx: number; id: string; title: string; ko: string; level: string }
export async function books(): Promise<{ list: BookMeta[]; items: (idx: number) => unknown[] }> {
  const MG = await loadLegacy();
  const list = (MG.BOOKS as any[]).map((b, idx) => ({ idx, id: b.id, title: b.title, ko: b.ko, level: b.L }));
  return { list, items: (idx: number) => MG.bookItems(MG.BOOKS[idx]) as unknown[] };
}
