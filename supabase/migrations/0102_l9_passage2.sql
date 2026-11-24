-- 0102: L9 4차시 두 번째 'Passage Read Aloud' 글을 핵심 표현 중심으로 교체
--  · 기존(미나의 생일: 과거형·snacks·money diary 등 단원 밖 표현) -> May I help you? / Yes, please. / How much is this hat? / It's ~ won. / How much are these socks? / They're ~ won.
--  · 첫 줄이 "It's my brother's birthday tomorrow." 인 pread 문항의 text·ko·qs 만 교체 (상태는 그대로)
do $do$
declare v_unit uuid; v_cnt int; v_n int;
begin
  select count(*), min(u.id::text)::uuid into v_cnt, v_unit from units u join books b on b.id = u.book_id left join publishers pb on pb.id = b.publisher_id where u.no = 9 and u.kind = 'lesson' and b.grade = 5 and (pb.name like '%비상%' or b.title like '%비상%');
  if v_cnt <> 1 then raise notice 'L9 unit lookup: % match(es) - skipped', v_cnt; return; end if;
  update items set payload = payload || $j${"text": ["Today is my brother's birthday.", "I am at a shop.", "May I help you?", "Yes, please. How much is this hat?", "It's 12,000 won.", "---", "And how much are these socks?", "They're 2,000 won.", "I want this hat and these socks.", "Thank you!"], "ko": "오늘은 내 남동생의 생일이야.\n나는 가게에 있어.\n도와드릴까요?\n네, 부탁해요. 이 모자는 얼마예요?\n12,000원이에요.\n---\n그리고 이 양말은 얼마예요?\n2,000원이에요.\n이 모자와 이 양말을 갖고 싶어요.\n감사합니다!", "qs": [{"t": "mc", "q": "How much is the hat?", "ans": "It's 12,000 won.", "wrong": ["It's 2,000 won.", "It's 20,000 won."]}, {"t": "tf", "lines": ["Today is the writer's brother's birthday. | T", "The hat is 12,000 won. | T", "The socks are 12,000 won. | F"]}]}$j$::jsonb
   where unit_id = v_unit and template = 'pread' and payload->'text'->>0 = 'It''s my brother''s birthday tomorrow.';
  get diagnostics v_n = row_count;
  raise notice '4차시 두 번째 글 교체: % item(s)', v_n;
end $do$;
