// 검수용 번들 만들기: node tools/layout-qa/build.mjs  (결과: tools/layout-qa/out/)
import { build } from '../../apps/admin/node_modules/esbuild/lib/main.js';
import { mkdirSync, writeFileSync } from 'node:fs'; import { fileURLToPath } from 'node:url'; import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url)); const root = path.resolve(here, '../..'); const out = path.join(here, 'out');
mkdirSync(out, { recursive: true });
await build({
  entryPoints: [path.join(here, 'entry.tsx')], bundle: true, outfile: path.join(out, 'qa.js'), jsx: 'automatic', logLevel: 'error',
  loader: { '.svg': 'dataurl', '.png': 'dataurl', '.jpg': 'dataurl', '.woff2': 'dataurl' },
  define: { 'import.meta.env.VITE_SUPABASE_URL': '"http://x"', 'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': '"x"', 'import.meta.env.DEV': 'false', 'import.meta.env.MODE': '"development"' },
  alias: { '@mango/schema': path.join(root, 'packages/schema/src/index.ts'), '@mango/play': path.join(root, 'packages/play/src'), '@mango/mr': path.join(root, 'packages/mr/src'),
    react: path.join(root, 'apps/admin/node_modules/react'), 'react-dom': path.join(root, 'apps/admin/node_modules/react-dom'), zod: path.join(root, 'apps/admin/node_modules/zod') },
  nodePaths: [path.join(root, 'apps/admin/node_modules')],
  plugins: [{ name: 'mock-supabase', setup(b) { b.onResolve({ filter: /shared\/supabase$/ }, () => ({ path: path.join(root, 'apps/admin/dev/mock-supabase.ts') })); } }],
});
writeFileSync(path.join(out, 'index.html'), '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="qa.css"><div id="root"></div><script src="qa.js"></script>');
console.log('built', out);
