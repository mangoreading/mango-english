# design — ChatGPT 방식 시안 제작 (API 자동화)
1. `design/prompts/<이름>.md` 에 요청문을 쓴다 (ChatGPT 에 쓰던 문장 그대로).
2. 참고 시안 이미지는 `design/ref/` 에 올린다.
3. GitHub → Actions → **design-gen** → Run workflow 에서 이름·요청문 경로·참고 이미지를 넣어 실행한다.
4. 결과는 `design/out/<이름>/` (answer.md, 이미지, 파일들, response.json).
필요: GitHub Secrets `OPENAI_API_KEY`.
