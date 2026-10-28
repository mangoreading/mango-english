-- 0044: 확장(8번) 차시 맨 앞에 "장면 영상 보기" 활동 자리를 다시 추가 (내용은 문항을 입력할 때 넣음)
do $$
declare l record;
begin
  for l in select * from flow_lessons where no = 8 and track = 'challenge' loop
    if not exists (select 1 from flow_steps where lesson_id = l.id and kind = 'scene') then
      update flow_steps set pos = pos + 1 where lesson_id = l.id;
      insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, kind, qty, study, homework)
        values (l.id, 0, 'Scene Story', '장면 영상 보기', 4, 'scene', 1, true, false);
    end if;
  end loop;
end $$;
