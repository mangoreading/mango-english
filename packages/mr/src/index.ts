// 원서(Pre) 학습 화면: MVP(Pre_Level_Prototype.html)를 그대로 옮긴 것. 학습앱과 관리자 미리보기가 같이 쓴다.
// 사용: <div className="mr-root" dangerouslySetInnerHTML={{ __html: MR_MARKUP }} /> 를 그린 뒤 startMr(ctx) 를 부르고, 끝나면 돌려받은 함수를 호출한다.
export { startMr, type MrCtx } from './mrEngine';
export { MR_MARKUP } from './mrMarkup';
