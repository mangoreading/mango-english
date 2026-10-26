import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { PreviewPage } from './shared/ui';
import './shared/ai';
import './styles.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode>{location.hash.startsWith('#preview') ? <PreviewPage /> : <App />}</React.StrictMode>);
