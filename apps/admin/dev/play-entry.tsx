import { createRoot } from 'react-dom/client';
import { NativePlayer } from '@mango/play';
import '@mango/play/styles.css';
import { NATIVE_SAMPLES, SAMPLE_VOCAB } from '../src/shared/samples';
const k = new URLSearchParams(location.search).get('k') || 'sqset';
createRoot(document.getElementById('root')!).render(<div style={{ width: 960, height: 600, margin: 10, position: 'relative' }}><NativePlayer quiet title={k} items={[NATIVE_SAMPLES[k]]} vocab={SAMPLE_VOCAB} onResult={() => {}} onFinish={() => {}} /></div>);
