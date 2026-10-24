-- 0024: 쓰기 템플릿 입력 항목 추가 (모두 선택 항목이라 기존 문항 그대로 동작)
select public.bump_template_version('swrite', 'compatible', '문장 틀(tpl, 선택): 캡슐에 빈칸 문장을 보여 줌');
select public.bump_template_version('mfree', 'compatible', '줄별 힌트(lineHints, 선택) 추가, 주제 칸은 학생이 직접 입력(topic 은 더 이상 쓰지 않음)');
select public.bump_template_version('swrt', 'compatible', '체크리스트를 AI가 글 내용을 보고 자동 체크(AI 없으면 찾을 패턴으로 대신)');
select public.bump_template_version('dfill', 'compatible', '빈칸별 힌트(blankHints, 선택) 추가');
select public.bump_template_version('mwbank', 'compatible', '빈칸별 힌트(blankHints, 선택) 추가');
select public.bump_template_version('scloze', 'compatible', '빈칸별 힌트(blankHints, 선택) 추가');
