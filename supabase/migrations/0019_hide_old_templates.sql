-- 기획서(PDF) 밖의 옛 활동 12종은 새 문항을 만들 수 없게 숨긴다.
-- (기존 Unit 2 문항이 아직 이 종류를 쓰고 있어 행을 지우지는 않는다. 단원이 새 템플릿으로 바뀐 뒤 삭제 가능)
update public.activity_types set active = false
 where key in ('learn','text','brief','choose','match','build','fill','write','compose','speak','fade','dialog');
