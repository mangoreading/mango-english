// 레이아웃 검수용 진입점: 페이지에서 window.__qa.render(items, vocab) 로 화면을 바꿔 가며 그린다.
import { createRoot, type Root } from 'react-dom/client';
import { NativePlayer } from '@mango/play';
import '@mango/play/styles.css';

let root: Root | null = null; let n = 0;
(window as any).__qa = {
  render(items: any[], vocab: any[]) {
    if (!root) root = createRoot(document.getElementById('root')!);
    n++;
    root.render(<div key={n} style={{ position: 'fixed', inset: 0 }}><NativePlayer quiet title="QA" items={items} vocab={vocab as any} onResult={() => {}} onFinish={() => {}} /></div>);
  },
};
