// QR컨텐츠(1) 탭 = 교과서 QR 음원·영상 스크립트 (교과서 원문, 명백한 오타만 바로잡음). lesson_no, title, body, memo, remark
const fs = require('fs');
const raw = JSON.parse(fs.readFileSync(require('path').join(__dirname, 'qr_raw.json'), 'utf8'));
const fix = (s) => (s ?? '').replace(/[’‘]/g, "'").replace(/Tailand/g, 'Thailand').replace(/Brazile/g, 'Brazil').replace(/speell/g, 'spell').replace(/form\?/g, 'from?').replace(/\bminseo\b/g, 'Minseo')
  .split('\n').map((l) => l.trim()).filter((l) => l !== '').join('\n');
const names = { '영상': '영상 (1/2)' };
let k = 0;
const SRC = [];
raw.forEach(([lesson_no, title, body, memo, remark], i) => {
  if (title === null && lesson_no === 1) title = '영상 (2/2)';
  if (title === '영상') title = '영상 (1/2)';
  SRC.push({ lesson_no, sort: ++k, title: (title ?? '').trim(), body: fix(body), memo: memo ?? '', remark: remark ?? '' });
});
module.exports = { SRC };
