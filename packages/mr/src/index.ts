// 원서(Pre) 학습 화면: MVP(Pre_Level_Prototype.html)를 그대로 옮긴 것. 학습앱과 관리자 미리보기가 같이 쓴다.
// 사용: <div className="mr-root" dangerouslySetInnerHTML={{ __html: MR_MARKUP }} /> 를 그린 뒤 startMr(ctx) 를 부르고, 끝나면 돌려받은 함수를 호출한다.
export { startMr, type MrCtx } from './mrEngine';
export { MR_MARKUP } from './mrMarkup';

/** 화면 테마. 'lime' = 라임 그린 + 포레스트 그린(새 디자인), 'classic' = 기존 망고 톤.
 *  되돌리기: 아래 값을 'classic' 으로 바꾸거나, 주소 뒤에 ?theme=classic 을 붙인다(?theme=lime 으로 다시 전환, 브라우저에 기억됨). */
export const MR_DEFAULT_THEME: 'lime' | 'classic' = 'lime';
export function mrThemeClass(): string {
  let t: string = MR_DEFAULT_THEME;
  try {
    const q = new URLSearchParams(location.search).get('theme');
    if (q === 'classic' || q === 'lime') localStorage.setItem('mr_theme', q);
    const v = localStorage.getItem('mr_theme');
    if (v === 'classic' || v === 'lime') t = v;
  } catch { /* 기본값 */ }
  return t === 'lime' ? 'mr-theme-lime' : '';
}
import './mr.css';
import './theme-lime.css';
