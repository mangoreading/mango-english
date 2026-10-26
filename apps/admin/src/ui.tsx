import { useEffect, useState, type ReactNode } from 'react';
import { NativePlayer, type VWord } from '@mango/play';
import '@mango/play/styles.css';

/** 페이지 상단 제목 + 한 줄 설명 */
export function PageHead({ title, sub }: { title: string; sub?: ReactNode }) {
  return <div className="mx-ph"><h1>{title}</h1>{sub && <p>{sub}</p>}</div>;
}

/* ===== 활동 미리보기: 1280×800 별도 창에서 학습앱과 같은 화면으로 재생한다 ===== */
export interface PreviewData { kind: 'native' | 'legacy'; items: Record<string, any>[]; vocab?: VWord[]; level?: string; title?: string } // eslint-disable-line @typescript-eslint/no-explicit-any
const KEY = 'mx:preview';

/** 팝업 차단을 피하려고 클릭 직후 창을 먼저 열고, 준비가 끝나면 내용을 채운다. prepare 가 문자열을 돌려주면 그 안내를 창에 보여 주고 닫는다. */
export async function openPreview(prepare: () => Promise<PreviewData | string> | PreviewData | string): Promise<string | null> {
  const w = window.open('', 'mgPreview', `popup=yes,width=1280,height=800,left=${Math.max(0, (screen.width - 1280) / 2)},top=${Math.max(0, (screen.height - 800) / 2)}`);
  if (!w) return '팝업이 막혀 있어요. 주소창 오른쪽의 팝업 차단을 풀고 다시 눌러 주세요.';
  w.document.title = '미리보기'; w.document.body.style.cssText = 'font-family:sans-serif;padding:40px;color:#555'; w.document.body.textContent = '불러오는 중…';
  const d = await prepare();
  if (typeof d === 'string') { w.close(); return d; }
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { w.close(); return '미리보기 데이터를 저장하지 못했어요.'; }
  w.location.href = '/#preview';
  w.focus();
  return null;
}

/** 별도 창(#preview)에서 보이는 화면 */
export function PreviewPage() {
  const [d] = useState<PreviewData | null>(() => { try { return JSON.parse(localStorage.getItem(KEY) ?? 'null'); } catch { return null; } });
  const [n, setN] = useState(0);
  const [go, setGo] = useState(false); // 브라우저는 클릭 없이는 소리를 막아서, 한 번 눌러야 자동 재생이 된다
  useEffect(() => {
    document.title = d?.title ?? '미리보기';
    if (d?.kind === 'legacy') {
      import('./legacy').then(({ loadLegacy }) => loadLegacy()).then((MG) => {
        MG.play({
          title: d.title ?? '미리보기', items: d.items, level: d.level ?? 'CORE', mode: 'practice', color: 'mango', onExit: () => window.close(),
          onDone: (_r: unknown, root: HTMLElement) => {
            root.innerHTML = '<div class="result"><div class="r-card"><h1 class="disp">미리보기 끝</h1><div class="r-btns"><button class="btn big" id="x">창 닫기</button></div></div></div>';
            (root.querySelector('#x') as HTMLElement).onclick = () => window.close();
          },
        });
      });
    }
  }, [d]);
  if (!d) return <p style={{ padding: 40 }}>미리보기 데이터가 없어요. 관리자 화면에서 미리보기 버튼을 다시 눌러 주세요.</p>;
  if (d.kind === 'legacy') return null;
  if (!go) return <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: '#F4F8FF' }}><button onClick={() => setGo(true)} style={{ font: 'inherit', fontSize: 22, padding: '18px 44px', borderRadius: 999, border: 0, background: '#3979f3', color: '#fff', cursor: 'pointer' }}>▶ 미리보기 시작</button></div>;
  return <NativePlayer key={n} title={d.title ?? '미리보기'} items={d.items} vocab={d.vocab ?? []} onResult={() => {}} onFinish={(a) => { if (a === 'again') setN(n + 1); else window.close(); }} />;
}
