import { createRoot } from 'react-dom/client';
import '../src/styles.css';
import { FlowEditor, Templates } from '../src/pages/flow/Flow';

const q = new URLSearchParams(location.search);
const view = q.get('view') ?? 'editor';
createRoot(document.getElementById('root')!).render(
  <div className="mx-app"><main className="mx-main">
    {view === 'list' ? <Templates /> : <FlowEditor owner={{ kind: 'template', id: 'tpl1' }} />}
  </main></div>,
);
