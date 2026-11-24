-- 0101: L9 2차시 장면(Scene + Repeat) 2개의 '해석과 해설'을 핵심 표현 중심으로 정리
--  · 핵심 표현(May I help you? / Yes, please. / How much are these ~? / They're ~ won. / on sale)만 강조하고,
--    교재 영상에만 나오는 표현(May I try them on? 등)은 뜻만 짧게 알려 준다. 장면·대사·문항은 그대로.
do $do$
declare v_unit uuid; v_cnt int; v_n int; r record;
begin
  select count(*), min(u.id::text)::uuid into v_cnt, v_unit from units u join books b on b.id = u.book_id left join publishers pb on pb.id = b.publisher_id where u.no = 9 and u.kind = 'lesson' and b.grade = 5 and (pb.name like '%비상%' or b.title like '%비상%');
  if v_cnt <> 1 then raise notice 'L9 unit lookup: % match(es) - skipped', v_cnt; return; end if;
  for r in select * from jsonb_each($j${"웃기게 생긴 신발": ["[[How much are these shoes?]]는 신발 여러 개의 가격을 묻는 말이에요. these와 are를 써요.", "가격은 [[They're 7,000 won.]]처럼 [[They're … won.]]으로 말해요.", "[[on sale]]은 \"세일 중\"이라는 뜻이에요.", "\"May I try them on?(신어 봐도 될까요?)\", \"Sure, go ahead.(그럼요, 신어 보세요.)\"는 이 장면에서만 나오는 말이에요. 뜻만 알아 두세요."], "반바지를 찾아요": ["[[May I help you?]]는 점원이 \"도와드릴까요?\"라고 묻는 말이에요.", "도움이 필요하면 [[Yes, please.]]라고 대답해요.", "[[How much are these shorts?]]로 가격을 묻고, [[They're … won.]]으로 대답해요.", "\"I'm looking for shorts.(반바지를 찾고 있어요.)\", \"Try on …(입어 보세요)\", \"You look great.(멋져 보여요)\"는 이 장면에서만 나오는 말이에요. 뜻만 알아 두세요."]}$j$::jsonb) loop
    update items set payload = jsonb_set(payload, '{explain}', r.value)
     where unit_id = v_unit and template = 'scenerep' and payload->>'title' = r.key;
    get diagnostics v_n = row_count;
    raise notice '% : % item(s) updated', r.key, v_n;
  end loop;
end $do$;
