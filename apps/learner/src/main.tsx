import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

window.addEventListener('error', (e) => {
  const r = document.getElementById('root');
  if (r && !r.childElementCount) r.innerHTML = '<pre style="padding:20px;white-space:pre-wrap">화면을 그리다 오류가 났어요:\n' + String(e.message) + '</pre>';
});

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
