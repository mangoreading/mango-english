import { useEffect, useState, type ReactNode } from 'react';
import { NativePlayer, type VWord } from '@mango/play';
import '@mango/play/styles.css';

/** 페이지 상단 제목 + 한 줄 설명 */
export function PageHead({ title, sub }: { title: string; sub?: ReactNode }) {
  return <div className="mx-ph"><h1>{title}</h1>{sub && <p>{sub}</p>}</div>;
}

/* ===== 활동 미리보기: 1280×800 별도 창에서 학습앱과 같은 화면으로 재생한다 ===== */
export interface PreviewData { kind: 'native' | 'legacy'; items: Record<string, any>[]; vocab?: VWord[]; level?: string; title?: string; lessons?: { no: number; title: string; items: Record<string, any>[] }[] } // eslint-disable-line @typescript-eslint/no-explicit-any
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
  const [n, setN] = useState(0); const [ln, setLn] = useState(0);
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
  const ls = d.lessons; const items = ls ? ls[ln]?.items ?? [] : d.items;
  const pl = <NativePlayer key={`${ln}:${n}`} title={ls ? `${d.title ?? ''} · ${ls[ln]?.no}차시` : d.title ?? '미리보기'} items={items} vocab={d.vocab ?? []} onResult={() => {}} onFinish={(a) => { if (a === 'again') setN(n + 1); else if (ls && ln < ls.length - 1) { setLn(ln + 1); setN(0); } else window.close(); }} />;
  if (!ls) return pl;
  return (
    <>
      {pl}
      <div style={{ position: 'fixed', left: 12, bottom: 12, zIndex: 99999, display: 'flex', gap: 6, padding: '6px 10px', background: 'rgba(31,42,68,.92)', borderRadius: 20, alignItems: 'center' }}>
        {ls.map((l, i) => <button key={l.no} title={l.title} onClick={() => { setLn(i); setN(0); }} style={{ padding: '4px 12px', borderRadius: 14, border: 0, cursor: 'pointer', background: i === ln ? '#ffb100' : '#e8ebf2', fontWeight: 700 }}>{l.no}차시</button>)}
      </div>
    </>
  );
}
