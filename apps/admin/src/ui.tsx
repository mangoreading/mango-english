import type { ReactNode } from 'react';

/** 페이지 상단 제목 + 한 줄 설명 */
export function PageHead({ title, sub }: { title: string; sub?: ReactNode }) {
  return <div className="mx-ph"><h1>{title}</h1>{sub && <p>{sub}</p>}</div>;
}
