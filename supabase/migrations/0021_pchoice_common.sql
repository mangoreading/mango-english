-- 0021: 그림 보고 고르기(pchoice)는 어휘가 아니라 공통 영역
update public.activity_types set category = '공통' where key = 'pchoice';
