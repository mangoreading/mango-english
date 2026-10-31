import type { Tab } from './Home';

/** 화면 기준 1280×800. 창이 작으면 비율만 줄인다(교과서 홈은 높이까지 맞춰 한 화면에). 모바일 폭(820 이하)은 그대로. */
export function stageZoom(tab?: Tab): number {
  const w = window.innerWidth, h = window.innerHeight;
  if (w <= 820) return 1;
  return Math.min(1, w / 1280, !tab || tab === 'home' ? h / 800 : 1);
}
