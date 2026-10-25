// ChatGPT 에서 하던 "시안 → 요소 분리 → HTML/CSS" 작업을 OpenAI API(Responses)로 돌린다.
// 입력: 환경변수 PROMPT_FILE(요청문 파일), REF_IMAGES(쉼표로 구분한 참고 이미지 경로), OUT_DIR, MODEL
// 도구: code_interpreter(파이썬 실행: 이미지 자르기·SVG/HTML 작성) + image_generation(그림 생성)
import fs from 'node:fs';
import path from 'node:path';

const key = process.env.OPENAI_API_KEY;
if (!key) { fs.mkdirSync(process.env.OUT_DIR || 'design/out/run', { recursive: true }); fs.writeFileSync((process.env.OUT_DIR || 'design/out/run') + '/error.txt', 'OPENAI_API_KEY 가 비어 있어요 (Secrets 이름/등록 확인)'); process.exit(0); }
const model = process.env.MODEL || 'gpt-5';
const out = process.env.OUT_DIR || 'design/out/run';
fs.mkdirSync(out, { recursive: true });
const prompt = fs.readFileSync(process.env.PROMPT_FILE, 'utf8');
const refs = (process.env.REF_IMAGES || '').split(',').map((s) => s.trim()).filter(Boolean);

const content = [{ type: 'input_text', text: prompt }];
for (const r of refs) {
  const ext = path.extname(r).slice(1).toLowerCase().replace('jpg', 'jpeg');
  content.push({ type: 'input_image', image_url: `data:image/${ext || 'png'};base64,` + fs.readFileSync(r).toString('base64') });
}
const body = { model, input: [{ role: 'user', content }], tools: [{ type: 'code_interpreter', container: { type: 'auto' } }, { type: 'image_generation', background: 'auto' }] };
const H = { Authorization: 'Bearer ' + key, 'content-type': 'application/json' };

const r = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: H, body: JSON.stringify(body) });
const txt = await r.text();
fs.writeFileSync(path.join(out, 'response.json'), txt);
if (!r.ok) { fs.writeFileSync(path.join(out, 'error.txt'), `OpenAI 오류 ${r.status}\n${txt.slice(0, 2000)}`); console.error('OpenAI 오류', r.status, txt.slice(0, 600)); process.exit(0); } // 오류 내용도 저장소에 남겨 확인할 수 있게 함
const d = JSON.parse(txt);

let n = 0; const files = [];
for (const o of d.output ?? []) {
  if (o.type === 'image_generation_call' && o.result) { const f = path.join(out, `generated_${++n}.png`); fs.writeFileSync(f, Buffer.from(o.result, 'base64')); files.push(f); }
  if (o.type === 'message') for (const c of o.content ?? []) {
    if (c.type === 'output_text') {
      fs.appendFileSync(path.join(out, 'answer.md'), c.text + '\n');
      for (const a of c.annotations ?? []) if (a.type === 'container_file_citation') {
        const u = `https://api.openai.com/v1/containers/${a.container_id}/files/${a.file_id}/content`;
        const fr = await fetch(u, { headers: { Authorization: 'Bearer ' + key } });
        if (fr.ok) { const f = path.join(out, path.basename(a.filename || a.file_id)); fs.writeFileSync(f, Buffer.from(await fr.arrayBuffer())); files.push(f); }
        else console.error('파일 받기 실패', a.filename, fr.status);
      }
    }
  }
}
console.log('저장한 파일:', files.length, files.join(', '));
console.log('사용량:', JSON.stringify(d.usage ?? {}));
