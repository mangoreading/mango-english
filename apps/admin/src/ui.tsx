import { useEffect, useState, type ReactNode } from 'react';
import { NativePlayer, type VWord } from '@mango/play';
import '@mango/play/styles.css';

/** 페이지 상단 제목 + 한 줄 설명 */
export function PageHead({ title, sub }: { title: string; sub?: ReactNode }) {
  return <div className="mx-ph"><h1>{title}</h1>{sub && <p>{sub}</p>}</div>;
}

/* ===== 활동 미리보기 (학습앱과 같은 재생 화면을 관리자에서 띄운다) ===== */

let opener: ((s: { items: Record<string, any>[]; vocab: VWord[] } | null) => void) | null = null; // eslint-disable-line @typescript-eslint/no-explicit-any
/** 어휘 6종 문항 미리보기 열기. vocab 은 문항이 쓰는 단어(그림 포함). */
export function showNative(items: Record<string, any>[], vocab: VWord[]) { opener?.({ items, vocab }); } // eslint-disable-line @typescript-eslint/no-explicit-any
export function PreviewLayer() {
  const [s, setS] = useState<{ items: Record<string, any>[]; vocab: VWord[] } | null>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [n, setN] = useState(0);
  useEffect(() => { opener = setS; return () => { opener = null; }; }, []);
  if (!s) return null;
  return <NativePlayer key={n} title="미리보기" items={s.items} vocab={s.vocab} onResult={() => {}} onFinish={(a) => { if (a === 'again') setN(n + 1); else setS(null); }} />;
}
