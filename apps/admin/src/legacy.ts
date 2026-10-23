/* eslint-disable @typescript-eslint/no-explicit-any */
// 미리보기용: MVP 활동 엔진(학습앱과 같은 화면)으로 문항 하나를 재생한다.
let loading: Promise<any> | null = null;
const addScript = (src: string) => new Promise<void>((res, rej) => {
  const s = document.createElement('script'); s.src = src; s.onload = () => res(); s.onerror = () => rej(new Error('불러오기 실패: ' + src)); document.head.appendChild(s);
});
export function loadLegacy(): Promise<any> {
  if (!loading) loading = (async () => {
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = '/legacy/css/app.css'; document.head.appendChild(link);
    for (const f of ['icons', 'items', 'content', 'content2', 'engine']) await addScript(`/legacy/js/${f}.js`);
    const MG = (window as any).MG; MG.useUnit(2); return MG;
  })();
  return loading;
}
export async function preview(items: unknown[], level: string) {
  const MG = await loadLegacy();
  MG.play({
    title: '미리보기', items, level, mode: 'practice', color: 'mango', onExit: () => {},
    onDone: (_res: unknown, root: HTMLElement, close: () => void) => {
      root.innerHTML = `<div class="result"><div class="r-card"><h1 class="disp">미리보기 끝</h1><div class="r-btns"><button class="btn big" id="x">닫기</button></div></div></div>`;
      (root.querySelector('#x') as HTMLElement).onclick = close;
    },
  });
}
