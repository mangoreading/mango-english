-- 0100: L9 장면 영상(Scene) 4개의 확인 문항을 학습목표 표현 중심으로 교체
--  · 1차시 쇼핑 ①② / 2차시 '웃기게 생긴 신발'·'반바지를 찾아요' 의 qs 만 바꾼다 (장면·그림·대사는 그대로)
--  · 상태(승인 여부)는 건드리지 않는다. 발행(번들)에 반영하려면 재발행이 필요하다.
do $do$
declare v_unit uuid; v_cnt int; v_n int; r record;
begin
  select count(*), min(u.id::text)::uuid into v_cnt, v_unit from units u join books b on b.id = u.book_id left join publishers pb on pb.id = b.publisher_id where u.no = 9 and u.kind = 'lesson' and b.grade = 5 and (pb.name like '%비상%' or b.title like '%비상%');
  if v_cnt <> 1 then raise notice 'L9 unit lookup: % match(es) - skipped', v_cnt; return; end if;
  for r in select * from jsonb_each($j${"학교 소풍 준비 쇼핑 ①": [{"t": "mc", "q": "점원이 \"May I help you?\"라고 말한 뜻은 무엇인가요?", "ans": "도와드릴까요?", "wrong": ["이 선글라스는 얼마예요?", "이걸로 살게요."]}, {"t": "mc", "q": "준이가 \"How much are these sunglasses?\"라고 물은 뜻은 무엇인가요?", "ans": "이 선글라스는 얼마예요?", "wrong": ["이 선글라스는 어때요?", "저는 선글라스를 찾고 있어요."]}, {"t": "mc", "q": "선글라스의 가격은 얼마인가요?", "ans": "13,000원", "wrong": ["15,000원", "3,000원"]}], "학교 소풍 준비 쇼핑 ②": [{"t": "mc", "q": "모자는 얼마인가요?", "ans": "8,000원", "wrong": ["5,000원", "18,000원"]}, {"t": "mc", "q": "신발의 가격을 물을 때 알맞은 말은 무엇인가요?", "ans": "How much are these shoes?", "wrong": ["How much is this shoes?", "How much are this shoes?"]}, {"t": "mc", "q": "엄마가 깜짝 놀란 까닭은 무엇인가요?", "ans": "신발이 50,000원이라서", "wrong": ["모자가 너무 싸서", "신발이 없어서"]}], "웃기게 생긴 신발": [{"t": "mc", "q": "How much are the shoes?", "ans": "They're 7,000 won.", "wrong": ["They're 17,000 won.", "They're 70,000 won."]}, {"t": "mc", "q": "What does Mia say to ask the price?", "ans": "How much are these shoes?", "wrong": ["May I try them on?", "I'll take them."]}, {"t": "mc", "q": "What does the clerk say about the price?", "ans": "They're on sale.", "wrong": ["Sure, go ahead.", "You look great."]}], "반바지를 찾아요": [{"t": "mc", "q": "What does the clerk say to offer help?", "ans": "May I help you?", "wrong": ["How much are these shorts?", "You look great."]}, {"t": "mc", "q": "What is Pablo looking for?", "ans": "Shorts.", "wrong": ["A jacket.", "Socks."]}, {"t": "mc", "q": "How much are the shorts?", "ans": "They're 12,000 won.", "wrong": ["They're 2,000 won.", "They're 20,000 won."]}]}$j$::jsonb) loop
    update items set payload = jsonb_set(payload, '{qs}', r.value)
     where unit_id = v_unit and template in ('scene','scenerep') and payload->>'title' = r.key;
    get diagnostics v_n = row_count;
    raise notice '% : % item(s) updated', r.key, v_n;
  end loop;
end $do$;
