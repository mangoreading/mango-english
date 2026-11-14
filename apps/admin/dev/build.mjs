// 사용법: node dev/build.mjs  → dev/out/ 에 확인용 화면 번들 생성 (실제 supabase 대신 mock-supabase 사용)
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
mkdirSync(path.join(here, 'out'), { recursive: true });
await build({
  entryPoints: [path.join(here, 'entry.tsx')], bundle: true, outfile: path.join(here, 'out/app.js'), jsx: 'automatic', logLevel: 'error',
  loader: { '.svg': 'dataurl', '.png': 'dataurl', '.jpg': 'dataurl', '.woff2': 'dataurl' },
  define: { 'import.meta.env.VITE_SUPABASE_URL': '"http://x"', 'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': '"x"', 'import.meta.env.DEV': 'false', 'import.meta.env.MODE': '"development"' },
  alias: { '@mango/schema': path.join(here, '../../../packages/schema/src/index.ts'), '@mango/play': path.join(here, '../../../packages/play/src'), '@mango/mr': path.join(here, '../../../packages/mr/src'), react: path.join(here, '../node_modules/react'), 'react-dom': path.join(here, '../node_modules/react-dom'), zod: path.join(here, '../node_modules/zod') },
  plugins: [{ name: 'mock-supabase', setup(b) { b.onResolve({ filter: /shared\/supabase$/ }, () => ({ path: path.join(here, 'mock-supabase.ts') })); } }],
});
writeFileSync(path.join(here, 'out/index.html'), '<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="app.css"><div id="root"></div><script src="app.js"></script>');
console.log('ok');
