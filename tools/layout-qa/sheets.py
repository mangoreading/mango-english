#!/usr/bin/env python3
"""out/shots 의 스크린샷을 문항별 한 장(sheet)으로 묶는다: 행=변형(base/long/noillus), 열=화면 폭. 결과: out/sheets/<id>.png"""
import os, re, sys, collections
from PIL import Image, ImageDraw
here = os.path.dirname(os.path.abspath(__file__)); shots = os.path.join(here, 'out', 'shots'); outd = os.path.join(here, 'out', 'sheets')
os.makedirs(outd, exist_ok=True)
groups = collections.defaultdict(dict)
for f in sorted(os.listdir(shots)):
    m = re.match(r'(.+)__(\w+)__(\d+x\d+)\.png$', f)
    if m: groups[m.group(1)][(m.group(2), m.group(3))] = os.path.join(shots, f)
W = 560
for gid, files in groups.items():
    variants = sorted({v for v, _ in files}, key=lambda v: ['base', 'long', 'noillus'].index(v) if v in ['base', 'long', 'noillus'] else 9)
    vps = sorted({p for _, p in files}, key=lambda p: -int(p.split('x')[0]))
    cells = {}
    for k, path in files.items():
        im = Image.open(path).convert('RGB'); cells[k] = im.resize((W, int(im.height * W / im.width)))
    rowh = [max(cells[(v, p)].height for p in vps if (v, p) in cells) + 24 for v in variants]
    sheet = Image.new('RGB', (W * len(vps) + 8 * (len(vps) + 1), sum(rowh) + 8), (235, 238, 244)); d = ImageDraw.Draw(sheet); y = 8
    for v, h in zip(variants, rowh):
        for i, p in enumerate(vps):
            x = 8 + i * (W + 8); d.text((x, y + 4), f'{gid}  [{v}]  {p}', fill=(20, 30, 60))
            if (v, p) in cells: sheet.paste(cells[(v, p)], (x, y + 20))
        y += h
    sheet.save(os.path.join(outd, gid + '.png'))
print('sheets:', len(groups))
