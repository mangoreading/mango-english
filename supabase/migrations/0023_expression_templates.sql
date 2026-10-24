-- 0023: 학습목표(goal)·핵심 표현(kexp) 화면을 기획서 p3~4 에 맞게 재구성. 입력 항목 추가는 호환 변경(기존 문항 그대로 동작)
select public.bump_template_version('goal', 'compatible', '핵심 표현 소제목(group) 추가, 학습목표 2~3줄·왼쪽 아래 그림(선택), 전체 듣기 아이콘');
select public.bump_template_version('kexp', 'compatible', '전체 듣기·한 버튼 위치 조정, 오른쪽 설명(label, 선택) 표시');
