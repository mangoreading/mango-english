-- 0009: 어휘 활동 템플릿 6종 등록 + 단어 그림 저장소 + 테스트 단원(템플릿 확인용)
-- 활동 종류 등록
insert into activity_types(key, name_ko, description, sort) values
  ('vcards',  '단어 카드 보기',   '그림·단어·뜻 카드를 눌러 소리 듣고 따라 하기', 21),
  ('vtype1',  '단어 따라 쓰기',   '단어를 한 개씩 보면서 직접 써 보기', 22),
  ('vspell',  '철자 완성',        '앞부분만 보이는 단어를 글자를 눌러 완성', 23),
  ('vmatch',  '단어-뜻 매칭',     '영어 단어와 한글 뜻 짝 맞추기', 24),
  ('vsound',  '소리-단어 매칭',   '소리를 듣고 알맞은 단어 찾기', 25),
  ('vwrite',  '그림 보고 쓰기',   '그림과 뜻을 보고 여러 단어를 한 화면에서 쓰기', 26)
on conflict (key) do nothing;

-- 단어 그림 저장소(공개 읽기, 본사만 올리기/수정/삭제)
insert into storage.buckets (id, name, public) values ('word-images', 'word-images', true) on conflict (id) do nothing;
create policy wi_hq_insert on storage.objects for insert to authenticated with check (bucket_id = 'word-images' and is_hq());
create policy wi_hq_update on storage.objects for update to authenticated using (bucket_id = 'word-images' and is_hq()) with check (bucket_id = 'word-images' and is_hq());
create policy wi_hq_delete on storage.objects for delete to authenticated using (bucket_id = 'word-images' and is_hq());

-- ===== 테스트 단원: 기획서 p29~34 의 어휘 활동 6종 =====
insert into publishers(name) values ('테스트') on conflict (name) do nothing;
insert into books(publisher_id, grade, title, year)
  select id, 5, '템플릿 테스트', 2026 from publishers where name = '테스트'
  and not exists (select 1 from books where title = '템플릿 테스트');
insert into units(book_id, no, title, goals, status)
  select b.id, 1, 'Words Template Test', '{}'::jsonb, 'approved' from books b where b.title = '템플릿 테스트'
on conflict (book_id, no) do nothing;

-- 단어 (기획서의 그림 사용: cap=모자 그림, pants=반바지 그림)
insert into vocab(key, en, ko, image_path) values
  ('cap', 'cap', '모자', 'word/hat.png'),
  ('pants', 'pants', '바지', 'word/shorts.png')
on conflict (key) do nothing;
insert into unit_vocab(unit_id, vocab_id)
  select u.id, v.id from units u join books b on b.id = u.book_id, vocab v
  where b.title = '템플릿 테스트' and u.no = 1 and v.key in ('cap','jacket','socks','shoes','pants','sunglasses')
on conflict do nothing;

-- 흐름: 1차시 ② Words (5개 화면), 3차시 ① Words (1개 화면)
insert into flow_lessons(unit_id, no, en, ko, goal, color)
  select u.id, x.no, 'Words', '단어', '단원 단어를 익혀요.', 'mango' from units u join books b on b.id = u.book_id, (values (1), (3)) as x(no)
  where b.title = '템플릿 테스트' and u.no = 1
  and not exists (select 1 from flow_lessons fl where fl.unit_id = u.id);
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes)
  select fl.id, 0, case fl.no when 1 then '② Words' else '① Words' end, '단어 익히기', 5
  from flow_lessons fl join units u on u.id = fl.unit_id join books b on b.id = u.book_id
  where b.title = '템플릿 테스트' and u.no = 1
  and not exists (select 1 from flow_steps s where s.lesson_id = fl.id);

-- 문항 (3개 레벨에 같은 내용을 넣어 둠 — 관리자에서 고치세요)
insert into items(unit_id, lesson, act_idx, level, template, tag, payload, status, step_id)
select u.id, x.lesson, x.idx, lv.l::item_level, x.kind, 'vocab', x.payload::jsonb, 'approved', s.id
from units u join books b on b.id = u.book_id
cross join (values ('CORE'), ('SUPPORT'), ('ADVANCED')) lv(l)
cross join (values
  (1, 0, 'vcards', '{"k":"vcards","tag":"vocab","words":["cap","jacket","socks","shoes","pants","sunglasses"]}'),
  (1, 1, 'vtype1', '{"k":"vtype1","tag":"vocab","words":["cap","jacket","socks","shoes","pants","sunglasses"]}'),
  (1, 2, 'vspell', '{"k":"vspell","tag":"vocab","word":"sunglasses","shown":6}'),
  (1, 3, 'vmatch', '{"k":"vmatch","tag":"vocab","words":["cap","jacket","socks","shoes","pants","sunglasses"]}'),
  (1, 4, 'vsound', '{"k":"vsound","tag":"vocab","words":["cap","jacket","socks","shoes","pants","sunglasses"]}'),
  (3, 0, 'vwrite', '{"k":"vwrite","tag":"vocab","words":["cap","jacket","socks","shoes","pants","sunglasses"]}')
) as x(lesson, idx, kind, payload)
join flow_lessons fl on fl.unit_id = u.id and fl.no = x.lesson
join flow_steps s on s.lesson_id = fl.id and s.pos = 0
where b.title = '템플릿 테스트' and u.no = 1
  and not exists (select 1 from items i where i.unit_id = u.id);

select publish_unit(u.id) from units u join books b on b.id = u.book_id where b.title = '템플릿 테스트' and u.no = 1;
