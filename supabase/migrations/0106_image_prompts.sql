-- 0106: 단원 단어 그림·삽화 프롬프트를 DB에 저장 (이미지 제작 화면 '단원 단어·삽화 (DB)' 탭이 불러와 만들고 적용)
--  · kind='word'  : key = vocab.key  -> 적용하면 vocab.image_path 를 새 그림 주소로 교체
--  · kind='illus' : key = 삽화 파일 이름(확장자 제외, 예: l9-5-cat-hat) -> 문항 payload.illus 가 이 이름인 문항에 연결
--  · 본사(hq) 전용. 그림 파일은 기존 공개 저장 공간 scene-images 에 올린다.
create table if not exists public.image_prompts (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  kind text not null check (kind in ('word','illus')),
  key text not null,
  en text not null default '',
  ko text not null default '',
  prompt text not null default '',
  seq int not null default 0,
  created_at timestamptz not null default now(),
  unique (unit_id, kind, key)
);
create index if not exists image_prompts_unit on public.image_prompts(unit_id);
alter table public.image_prompts enable row level security;
drop policy if exists image_prompts_hq on public.image_prompts; create policy image_prompts_hq on public.image_prompts for all using (is_hq()) with check (is_hq());

do $do$
declare v_unit uuid; v_cnt int; v_n int;
begin
  select count(*), min(u.id::text)::uuid into v_cnt, v_unit from units u join books b on b.id = u.book_id left join publishers pb on pb.id = b.publisher_id where u.no = 9 and u.kind = 'lesson' and b.grade = 5 and (pb.name like '%비상%' or b.title like '%비상%');
  if v_cnt <> 1 then raise notice 'L9 unit lookup: % match(es) - skipped', v_cnt; return; end if;
  insert into image_prompts(unit_id, kind, key, en, ko, prompt, seq) values
    (v_unit,'word','hat','hat','모자','',1),
    (v_unit,'word','sunglasses','sunglasses','선글라스','',2),
    (v_unit,'word','jacket','jacket','재킷','',3),
    (v_unit,'word','shorts','shorts','반바지','',4),
    (v_unit,'word','socks','socks','양말','',5),
    (v_unit,'word','shoes','shoes','신발','',6),
    (v_unit,'illus','l9-5-cat-hat','','','A funny hat shaped like a cute cat head with two pointed ears, soft orange and cream colors, whiskers, a playful and friendly look, the hat only, nothing else.',7),
    (v_unit,'illus','l9-5-star-sunglasses','','','A pair of funny sunglasses with big yellow star-shaped frames and dark lenses, playful and friendly look, the sunglasses only, nothing else.',8)
  on conflict (unit_id, kind, key) do nothing;
  select count(*) into v_n from image_prompts where unit_id = v_unit;
  raise notice 'L9 image_prompts: % (expected 8)', v_n;
end $do$;
