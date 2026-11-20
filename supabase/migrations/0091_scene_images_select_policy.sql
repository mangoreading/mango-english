-- 0091: scene-images 저장 공간에 본사(hq) 읽기 정책 추가 (올리기 때 기존 파일 확인·덮어쓰기에 필요)
drop policy if exists si_hq_select on storage.objects;
create policy si_hq_select on storage.objects for select to authenticated using (bucket_id = 'scene-images' and is_hq());
