-- 0090: 장면 이미지(영상용)를 이미지 제작 화면에서 바로 올려 장면 문항의 그림 칸에 연결하기 위한 공개 저장 공간.
-- 읽기는 누구나(학생 앱이 주소로 불러옴), 올리기·바꾸기·지우기는 본사(hq)만.
insert into storage.buckets (id, name, public, file_size_limit) values ('scene-images', 'scene-images', true, 10485760) on conflict (id) do nothing;
drop policy if exists si_hq_insert on storage.objects;
create policy si_hq_insert on storage.objects for insert to authenticated with check (bucket_id = 'scene-images' and is_hq());
drop policy if exists si_hq_update on storage.objects;
create policy si_hq_update on storage.objects for update to authenticated using (bucket_id = 'scene-images' and is_hq()) with check (bucket_id = 'scene-images' and is_hq());
drop policy if exists si_hq_delete on storage.objects;
create policy si_hq_delete on storage.objects for delete to authenticated using (bucket_id = 'scene-images' and is_hq());
