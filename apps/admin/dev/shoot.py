# 사용법: python3 dev/shoot.py [view] [out.png]  (먼저 node dev/build.mjs)
import sys, subprocess, time, os
from playwright.sync_api import sync_playwright
view = sys.argv[1] if len(sys.argv) > 1 else 'editor'
out = sys.argv[2] if len(sys.argv) > 2 else f'/tmp/admin-{view}.png'
d = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
srv = subprocess.Popen(['python3', '-m', 'http.server', '8131', '-d', d], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1360, 'height': 900}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(f'http://localhost:8131/index.html?view={view}'); pg.wait_for_timeout(1200)
        pg.screenshot(path=out, full_page=True); print(out, 'errors:', errs); b.close()
finally:
    srv.terminate()
