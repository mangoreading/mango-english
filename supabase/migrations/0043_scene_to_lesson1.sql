-- 0043: 장면 영상을 CORE 1차시 마지막으로 옮긴다(듣고 그림 고르기 대체). 확인 문항은 한글 2문항, 영상 뒤 해석과 해설을 보여 준다.
do $$
declare l record; v_step uuid; u9 uuid; old uuid;
begin
  select u.id into u9 from units u join books b on b.id = u.book_id where b.title = '비상교육 초5 영어' and u.no = 9;
  -- 1) 확장(8번)에 넣었던 장면 영상 활동은 일단 지우고(문항은 아래에서 1차시 활동으로 옮김), 2) 1차시의 '듣고 그림 고르기'를 장면 영상으로 바꾼다
  for l in select * from flow_lessons where no = 1 loop
    select id into old from flow_steps where lesson_id = l.id and kind = 'lchpic' order by pos limit 1;
    if old is not null then
      insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, kind, qty, study, homework)
        select lesson_id, pos, 'Scene Story', '장면 영상 보기', 5, 'scene', 1, true, false from flow_steps where id = old returning id into v_step;
      if u9 is not null and l.unit_id = u9 then
        update items set step_id = v_step, lesson = 1, act_idx = 500
          where id = (select i.id from items i join flow_steps s on s.id = i.step_id join flow_lessons fl on fl.id = s.lesson_id where fl.unit_id = u9 and fl.no = 8 and s.kind = 'scene' limit 1);
        delete from items where step_id = old;
      end if;
      delete from flow_steps where id = old;
    end if;
  end loop;
  delete from flow_steps s using flow_lessons fl where fl.id = s.lesson_id and fl.no = 8 and s.kind = 'scene'
    and not exists (select 1 from items i where i.step_id = s.id);
  if u9 is not null then
    update items set payload = payload || jsonb_build_object('qs', '[{"q": "지나가 산 물건은 무엇인가요?", "ans": "선글라스", "wrong": ["신발", "재킷", "모자"]}, {"q": "지나가 \"Oh, no!\"라고 말한 이유는 무엇인가요?", "ans": "신발 가격이 너무 비싸서", "wrong": ["선글라스를 잃어버려서", "가게가 문을 닫아서", "재킷이 너무 작아서"]}]'::jsonb, 'explain', '["[[May I help you?]] 점원이 손님에게 도움이 필요한지 물어요. 대답은 [[Yes, please.]]", "[[How much are these sunglasses?]] 여러 개인 물건의 가격을 물을 때 써요.", "[[They''re twelve thousand won.]] 가격은 They''re ~ won. 으로 대답해요.", "[[I''m looking for ~]] 는 ''~을 찾고 있어요'', [[How about these?]] 는 ''이건 어때요?''라는 뜻이에요. (이번에 새로 만난 표현)"]'::jsonb, 'sub', 'en')
      where unit_id = u9 and template = 'scene';
  end if;
end $$;
