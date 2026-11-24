// 레이아웃 검수: node tools/layout-qa/run.mjs [--quick] [--only kind1,kind2] [--save-baseline] [--compare]
//  1) node tools/layout-qa/build.mjs 로 번들을 먼저 만든다(이 스크립트가 자동으로 실행)
//  2) L9 대표 문항 + 변형(긴 문장/그림 없음)을 여러 화면 폭에서 그리고 자동 검사
//  3) out/report.md, out/shots/*.png, out/result.json 생성. --compare 는 baseline.json 과 화면이 달라진 문항을 알려 준다
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url'; import { execFileSync } from 'node:child_process';
const here = path.dirname(fileURLToPath(import.meta.url)); const root = path.resolve(here, '../..'); const out = path.join(here, 'out'); const req = createRequire(import.meta.url);
const args = process.argv.slice(2); const flag = (f) => args.includes(f); const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
let chromium; try { ({ chromium } = req('playwright')); } catch { ({ chromium } = req(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright'))); }
execFileSync('node', [path.join(here, 'build.mjs')], { stdio: 'inherit' });
const { allCases } = req('./cases.cjs'); const auditSrc = fs.readFileSync(path.join(here, 'audit.js'), 'utf8');
const VPS = (opt('--vp') ? opt('--vp').split(',') : ['1280x800', '1024x700', '800x600']).map((s) => s.split('x').map(Number));
let cases = allCases(flag('--quick')); if (opt('--only')) { const o = opt('--only').split(','); cases = cases.filter((c) => o.some((k) => c.id === k || c.id.startsWith(k + '.'))); }
// 단어/장면 그림 목록(문항의 pic key 용)
const imgDir = path.join(root, 'apps/learner/public/img'); const vocab = [];
for (const d of ['word', 'scene']) for (const f of fs.readdirSync(path.join(imgDir, d))) { const k = f.replace(/\.[a-z]+$/, ''); vocab.push({ key: k, en: k, ko: k, image: d + '/' + f }); }
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const srv = http.createServer((q, s) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = u.startsWith('/img/') ? path.join(root, 'apps/learner/public', u) : path.join(out, u === '/' ? 'index.html' : u); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
await new Promise((r) => srv.listen(0, r)); const port = srv.address().port;
const shots = path.join(out, 'shots'); fs.rmSync(shots, { recursive: true, force: true }); fs.mkdirSync(shots, { recursive: true });
const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: VPS[0][0], height: VPS[0][1] } }); const page = await ctx.newPage();
await page.addInitScript(() => { let a = 12345; Math.random = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
await page.goto(`http://localhost:${port}/`); await page.addStyleTag({ content: '*{animation:none!important;transition:none!important;caret-color:transparent!important}' });
const results = []; const hashes = {};
for (const c of cases) for (const [w, h] of VPS) {
  await page.setViewportSize({ width: w, height: h }); errs.length = 0;
  await page.evaluate(([it, vo]) => window.__qa.render([it], vo), [c.item, vocab]); await page.waitForTimeout(350);
  const issues = await page.evaluate(auditSrc); const name = `${c.id}__${c.variant}__${w}x${h}`;
  const buf = await page.screenshot({ path: path.join(shots, name + '.png') }); hashes[name] = crypto.createHash('sha1').update(buf).digest('hex');
  if (errs.length) issues.push({ t: 'js-error', sev: 'fail', el: 'page', d: errs[0] });
  results.push({ name, id: c.id, variant: c.variant, vp: `${w}x${h}`, issues });
}
await browser.close(); srv.close();
fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify(results, null, 1));
const bf = path.join(here, 'baseline.json');
if (flag('--save-baseline')) { fs.writeFileSync(bf, JSON.stringify(hashes, null, 1)); console.log('baseline saved:', Object.keys(hashes).length); }
const base = fs.existsSync(bf) ? JSON.parse(fs.readFileSync(bf, 'utf8')) : null;
const changed = flag('--compare') && base ? Object.keys(hashes).filter((k) => base[k] && base[k] !== hashes[k]) : [];
const fails = results.filter((r) => r.issues.some((i) => i.sev === 'fail')); const warns = results.filter((r) => !r.issues.some((i) => i.sev === 'fail') && r.issues.length);
let md = `# 레이아웃 검수 결과\n\n- 검사 화면: ${results.length}장 (문항 ${cases.length}종 × 화면 폭 ${VPS.map((v) => v.join('x')).join(', ')})\n- 결함(fail) 있는 화면: **${fails.length}장** / 주의(warn)만 있는 화면: ${warns.length}장\n`;
if (flag('--compare')) md += `- 기준 대비 달라진 화면: **${changed.length}장**${base ? '' : ' (baseline.json 없음)'}\n`;
const byId = new Map(); for (const r of fails) { const a = byId.get(r.id) || []; a.push(r); byId.set(r.id, a); }
md += '\n## 결함 목록 (문항별)\n'; for (const [id, rs] of byId) { md += `\n### ${id}\n`; for (const r of rs) { md += `- \`${r.variant}\` ${r.vp} → shots/${r.name}.png\n`; for (const i of r.issues.filter((x) => x.sev === 'fail')) md += `  - **${i.t}**: ${i.el} (${i.d})\n`; } }
if (changed.length) md += '\n## 기준 대비 달라진 화면\n' + changed.map((k) => `- ${k}`).join('\n') + '\n';
md += '\n## 주의(warn) 요약\n'; const wc = {}; for (const r of results) for (const i of r.issues.filter((x) => x.sev === 'warn')) wc[i.t] = (wc[i.t] || 0) + 1; md += Object.entries(wc).map(([k, v]) => `- ${k}: ${v}건`).join('\n') + '\n';
fs.writeFileSync(path.join(out, 'report.md'), md); try { execFileSync('python3', [path.join(here, 'sheets.py')], { stdio: 'inherit' }); } catch { console.log('(sheets.py 실패: PIL 필요)'); } console.log(md.split('\n').slice(0, 8).join('\n')); console.log('report:', path.join(out, 'report.md'));
process.exitCode = fails.length ? 1 : 0;
