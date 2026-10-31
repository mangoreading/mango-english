-- Lesson 9 5차시 '문장 쓰기(swrite)': 문장 틀(tpl)을 6문항 모두에 넣고 다시 발행
do $do$
declare v_unit uuid; v_n int; v_ver int;
begin
  select u.id into v_unit from units u join books b on b.id = u.book_id where b.title = '비상교육 초5 영어' and u.no = 9;
  if v_unit is null then raise exception 'L9 unit not found'; end if;
  update items i set payload = i.payload || jsonb_build_object('tpl', t.tpl)
    from (values
      ('How much is this hat?',            'How much {} this hat?'),
      ('How much are these shoes?',        'How much {} these shoes?'),
      ('They''re two thousand won.',       '{} two thousand won.'),
      ('It''s ten thousand won.',          '{} ten thousand won.'),
      ('How much are these shorts?',       'How much {} these shorts?'),
      ('They''re thirteen thousand won.',  '{} thirteen thousand won.')
    ) as t(ans, tpl)
   where i.unit_id = v_unit and i.template = 'swrite' and i.payload->>'ans' = t.ans;
  get diagnostics v_n = row_count;
  if v_n <> 6 then raise exception 'swrite tpl: expected 6 rows, got %', v_n; end if;
  v_ver := publish_unit(v_unit);
  raise notice 'L9 swrite tpl updated %, published v%', v_n, v_ver;
end $do$;
