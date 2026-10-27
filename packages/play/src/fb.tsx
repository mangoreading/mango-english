import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** 정답 안내("정답이에요!") 자리: 화면 아래 [다음/결과 보기] 버튼 왼쪽. 모든 템플릿이 같은 자리를 쓴다. */
export const FbSlot = createContext<HTMLElement | null>(null);
export function Fb({ className, children }: { className: string; children?: ReactNode }) {
  const slot = useContext(FbSlot);
  const p = <p className={className}>{children}</p>;
  return slot ? createPortal(p, slot) : p;
}

/** 카드를 `<` `>` 로 넘기는 활동: 화면 위쪽 진행 점을 문항 수 대신 카드 수로 보여 준다. */
export type CardProg = { n: number; cur: number } | null;
export const ProgCtx = createContext<((p: CardProg) => void) | null>(null);
export function useCardProgress(n: number, cur: number) {
  const set = useContext(ProgCtx);
  useEffect(() => { set?.({ n, cur }); }, [n, cur]); // eslint-disable-line
  useEffect(() => () => { set?.(null); }, []); // eslint-disable-line
}
