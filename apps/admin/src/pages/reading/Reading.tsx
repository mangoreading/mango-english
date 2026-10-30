import { useState } from 'react';
import { PageHead } from '../../shared/ui';
import { BookEditor } from './Editor';
import { ImportBooks } from './Import';
import { BookList } from './List';
import { ReadingStatus } from './Status';
import { WordImages } from './Words';

type Sub = 'list' | 'words' | 'status' | 'import';
/** 원서 관리: 목록 → 책 편집, 학습 현황, 일괄 가져오기 */
export function Reading() {
  const [sub, setSub] = useState<Sub>('list'); const [edit, setEdit] = useState<string | null>(null); const [nonce, setNonce] = useState(0);
  if (edit) return <BookEditor code={edit} onBack={() => { setEdit(null); setNonce((n) => n + 1); }} />;
  return (
    <>
      <PageHead title="원서 관리" sub="Pre/Basic 원서의 순서·공개를 관리하고 내용을 편집해요" />
      <div className="mx-seg">{([['list', '원서 목록'], ['words', '단어 이미지'], ['status', '학습 현황'], ['import', '일괄 가져오기']] as [Sub, string][]).map(([k, n]) => <button key={k} className={sub === k ? 'on' : ''} onClick={() => setSub(k)}>{n}</button>)}</div>
      {sub === 'list' && <BookList onEdit={setEdit} nonce={nonce} />}
      {sub === 'words' && <WordImages />}
      {sub === 'status' && <ReadingStatus />}
      {sub === 'import' && <ImportBooks onDone={() => setNonce((n) => n + 1)} />}
    </>
  );
}
