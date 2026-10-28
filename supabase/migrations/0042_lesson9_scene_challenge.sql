-- 0042: Lesson 9 확장 활동 "장면 영상 보기" (직접 쓴 대본, 초안). 흐름 템플릿·단원 흐름의 8번 확장 차시 맨 앞에 활동을 추가한다.
do $$
declare l record; v_step uuid; u9 uuid;
begin
  select u.id into u9 from units u join books b on b.id = u.book_id where b.title = '비상교육 초5 영어' and u.no = 9;
  for l in select * from flow_lessons where no = 8 and track = 'challenge' loop
    if not exists (select 1 from flow_steps where lesson_id = l.id and kind = 'scene') then
      update flow_steps set pos = pos + 1 where lesson_id = l.id;
      insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, kind, qty)
        values (l.id, 0, 'Scene Story', '장면 영상 보기', 4, 'scene', 1) returning id into v_step;
      if u9 is not null and l.unit_id = u9 then
        insert into items(unit_id, lesson, act_idx, level, template, tag, payload, status, step_id)
          values (u9, 8, 0, 'CORE', 'scene', 'listen', '{"k": "scene", "tag": "listen", "title": "Let''s Get Ready for the Beach", "sub": "en", "replay": 2, "scenes": [{"who": "Jina", "en": "Let''s get ready for our beach trip tomorrow.", "ko": "내일 해변 여행 갈 준비를 하자.", "pic": "jacket"}, {"who": "Joon", "en": "I can''t wait!", "ko": "너무 기대돼!", "pic": "jacket"}, {"who": "Jina", "en": "Joon, let''s check this list.", "ko": "준, 이 목록을 확인해 보자.", "pic": "jacket"}, {"who": "Clerk", "en": "May I help you?", "ko": "도와드릴까요?", "pic": "jacket"}, {"who": "Jina", "en": "Yes, please.", "ko": "네, 부탁해요.", "pic": "jacket"}, {"who": "Jina", "en": "I''m looking for sunglasses.", "ko": "선글라스를 찾고 있어요.", "pic": "sunglasses"}, {"who": "Clerk", "en": "We have many nice sunglasses here. How about these?", "ko": "여기 멋진 선글라스가 많아요. 이건 어떠세요?", "pic": "sunglasses"}, {"who": "Jina", "en": "They''re cool! I like the shape.", "ko": "멋지네요! 모양이 마음에 들어요.", "pic": "sunglasses"}, {"who": "Jina", "en": "How much are these sunglasses?", "ko": "이 선글라스는 얼마예요?", "pic": "sunglasses"}, {"who": "Clerk", "en": "They''re twelve thousand won.", "ko": "12,000원이에요.", "pic": "sunglasses"}, {"who": "Jina", "en": "That''s good. I''ll take them.", "ko": "좋네요. 그걸로 할게요.", "pic": "sunglasses"}, {"who": "Joon", "en": "This jacket is nice.", "ko": "이 재킷 멋지다.", "pic": "jacket"}, {"who": "Clerk", "en": "It''s only nine thousand won.", "ko": "9,000원밖에 안 해요.", "pic": "jacket"}, {"who": "Joon", "en": "Look at these shoes. They''ll be great for walking on the beach.", "ko": "이 신발 봐. 해변을 걸을 때 딱 좋겠다.", "pic": "shoes"}, {"who": "Joon", "en": "I''ll take them, too.", "ko": "이것도 살래.", "pic": "shoes"}, {"who": "Jina", "en": "Wait. How much are these shoes?", "ko": "잠깐. 이 신발은 얼마예요?", "pic": "shoes"}, {"who": "Clerk", "en": "They''re fifty thousand won.", "ko": "50,000원이에요.", "pic": "shoes"}, {"who": "Joon", "en": "Fifty thousand won for shoes?", "ko": "신발이 50,000원이라고?", "pic": "shoes"}, {"who": "Jina", "en": "Oh, no!", "ko": "이런!", "pic": "shoes"}], "qs": [{"q": "How much are the sunglasses?", "ans": "twelve thousand won", "wrong": ["two thousand won", "thirteen thousand won", "twenty thousand won"]}, {"q": "How much are the shoes?", "ans": "fifty thousand won", "wrong": ["fifteen thousand won", "five thousand won", "forty thousand won"]}, {"q": "Why does Jina say, \"Oh, no!\"?", "ans": "The shoes are too expensive.", "wrong": ["The shop is closed.", "She lost her list.", "The jacket is too small."]}]}'::jsonb, 'draft', v_step);
      end if;
    end if;
  end loop;
end $$;
