-- 0010: 활동 템플릿(활동 종류)에 "영역" 분류를 추가한다. 관리자에서 이름/설명/영역/순서/사용 여부를 고칠 수 있다.
alter table activity_types add column if not exists category text not null default '공통';
update activity_types set category = case key
  when 'vcards' then '어휘' when 'vtype1' then '어휘' when 'vspell' then '어휘' when 'vmatch' then '어휘' when 'vsound' then '어휘' when 'vwrite' then '어휘'
  when 'speak' then '말하기' when 'fade' then '말하기' when 'dialog' then '말하기'
  when 'text' then '읽기'
  when 'build' then '쓰기' when 'fill' then '쓰기' when 'write' then '쓰기' when 'compose' then '쓰기'
  else '공통' end;
