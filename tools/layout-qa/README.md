# 레이아웃 검수 도구 (layout-qa)

학습 플레이어 화면이 깨지지 않았는지 **푸시 전에** 자동으로 확인한다.

```
node tools/layout-qa/run.mjs                 # L9 대표 문항 전체(약 2.5분) → tools/layout-qa/out/report.md
node tools/layout-qa/run.mjs --quick         # 변형 없이 기본 화면만
node tools/layout-qa/run.mjs --only mtext,mwbank   # 템플릿 골라서
node tools/layout-qa/run.mjs --compare       # baseline.json 과 화면이 달라진 문항 표시
node tools/layout-qa/run.mjs --save-baseline # 지금 화면을 기준으로 저장
```

- 입력: `content/l9v2` 의 실제 문항 + 변형(긴 문장 / 선택 요소(삽화) 없음) × 화면 폭 1280·1024·800
- 자동 검사: 화면 밖으로 나감(offscreen), 서로 겹침(overlap), 가로 스크롤(hscroll), 글 잘림(clipped), 너무 작은 글/버튼(warn)
- 결과: `out/report.md`(결함 목록), `out/shots/*.png`(스크린샷), `out/result.json`
- 이 도구는 **객관적 결함만** 본다. "보기 좋은가/편한가" 판단은 사람이 한다 → 결정된 규칙은 `docs/layout-rules.md` 에 쌓는다.
- baseline.json 은 이 개발 환경(글꼴 포함)에서 만든 값이다. 다른 PC에서는 화면이 조금씩 달라 `--compare` 가 어긋날 수 있다.
- playwright 가 필요하다(전역 설치돼 있으면 자동 사용).
