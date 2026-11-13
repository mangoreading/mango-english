-- 0073: 본문 세트 템플릿(Scene story · Model Text · Passage Read Aloud): 확인 문항(T/F·선다, 최대 3개)을 선택으로 붙일 수 있게 됨
select public.bump_template_version('mtext', 'safe', '확인 문항(T/F·3~4지 선다, 최대 3개, 선택) 추가 — 본문 세트 템플릿');
select public.bump_template_version('pread', 'safe', '확인 문항(T/F·3~4지 선다, 최대 3개, 선택) 추가 — 본문 세트 템플릿');
select public.bump_template_version('scene', 'safe', '확인 문항에 종류(선다/T-F) 추가');
select public.bump_template_version('scenerep', 'safe', '확인 문항에 종류(선다/T-F) 추가');
update public.activity_types set description = '【세트】 본문 + 확인 문항(T/F·선다, 최대 3개, 선택)이 한 활동으로 묶여 있어요. 문항을 풀 때도 "본문 보기"로 본문을 다시 볼 수 있어요. ' || coalesce(description, '')
  where key in ('mtext', 'pread', 'scene', 'scenerep') and coalesce(description, '') not like '【세트】%';
