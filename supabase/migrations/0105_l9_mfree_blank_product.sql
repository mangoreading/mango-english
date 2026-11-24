-- 0105: L9 5차시 'Model Writing (Free)' — 상품 이름을 3번째 줄에서도 학생이 쓰게 하고, 그림(illus) 제거
--  · 1번(단수 틀): How much is this {}?  / 2번(복수 틀): How much are these {}?
--  · 학생이 고른 상품과 본문이 어긋나지 않게 줄별 힌트에 "단수/복수 상품" 안내를 넣는다
--  · 문항 상태(승인 여부)는 그대로 둔다 -> 학습자에게는 재발행해야 반영된다
do $do$
declare v_unit uuid; v_cnt int; v_n int; v_t int := 0;
begin
  select count(*), min(u.id::text)::uuid into v_cnt, v_unit from units u join books b on b.id = u.book_id left join publishers pb on pb.id = b.publisher_id where u.no = 9 and u.kind = 'lesson' and b.grade = 5 and (pb.name like '%비상%' or b.title like '%비상%');
  if v_cnt <> 1 then raise notice 'L9 unit lookup: % match(es) - skipped', v_cnt; return; end if;

  update items set payload = (payload - 'illus') || $j${"lines": ["Look at this {}.", "It has {}.", "How much is this {}?", "It's {} won."], "lineHints": ["단수 상품 이름을 써요. (예: Cat Hat, jacket)", "상품의 특징을 써요. (예: two ears)", "위에서 쓴 상품 이름을 다시 써요. (this 와 어울리는 한 개짜리 상품)", "가격을 써요. (예: ten thousand)"], "hint": ["Look at this Cat Hat."]}$j$::jsonb
   where unit_id = v_unit and template = 'mfree' and payload->'lines'->>0 = 'Look at this {}.';
  get diagnostics v_n = row_count; v_t := v_t + v_n; raise notice 'mfree 단수: %', v_n;

  update items set payload = (payload - 'illus') || $j${"lines": ["Look at these {}.", "They have {}.", "How much are these {}?", "They're {} won."], "lineHints": ["복수 상품 이름을 써요. (예: Star Sunglasses, shoes)", "상품의 특징을 써요. (예: big stars)", "위에서 쓴 상품 이름을 다시 써요. (these 와 어울리는 여러 개짜리 상품)", "가격을 써요. (예: thirteen thousand)"], "hint": ["Look at these Star Sunglasses."]}$j$::jsonb
   where unit_id = v_unit and template = 'mfree' and payload->'lines'->>0 = 'Look at these {}.';
  get diagnostics v_n = row_count; v_t := v_t + v_n; raise notice 'mfree 복수: %', v_n;
  raise notice '0105 합계: % item(s) (기대값 2)', v_t;
end $do$;
