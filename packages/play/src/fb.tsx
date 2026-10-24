import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** 정답 안내("정답이에요!") 자리: 화면 아래 [다음/결과 보기] 버튼 왼쪽. 모든 템플릿이 같은 자리를 쓴다. */
export const FbSlot = createContext<HTMLElement | null>(null);
export function Fb({ className, children }: { className: string; children?: ReactNode }) {
  const slot = useContext(FbSlot);
  const p = <p className={className}>{children}</p>;
  return slot ? createPortal(p, slot) : p;
}
