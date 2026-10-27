-- 0040: 단어-뜻 고르기 기본 방향을 영어 단어 → 한글 뜻(en2ko)으로. Lesson 9 초안 문항도 같은 방향으로 맞춘다.
update public.items set payload = payload || jsonb_build_object('dir', 'en2ko', 'wrong',
  case payload->>'word'
    when 'socks' then '["장갑","청바지","시계"]'::jsonb
    when 'hat' then '["양말","책","우산"]'::jsonb
    when 'shoes' then '["반바지","양말","재킷"]'::jsonb
    when 'sunglasses' then '["안경","시계","공"]'::jsonb
    when 'jacket' then '["청바지","모자","바지"]'::jsonb
    else payload->'wrong' end)
where template = 'wchoice' and status = 'draft' and payload->>'word' in ('socks','hat','shoes','sunglasses','jacket')
  and unit_id = (select u.id from public.units u join public.books b on b.id = u.book_id where b.title = '비상교육 초5 영어' and u.no = 9);
