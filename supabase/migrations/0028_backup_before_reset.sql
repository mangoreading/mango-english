-- 0028: 6차시 개편 전 현재 콘텐츠를 DB 안의 backup_20261026 스키마에 복사해 둔다 (삭제 아님, 외부 노출 없음)
create schema if not exists backup_20261026;
create table if not exists backup_20261026.items as select * from public.items;
create table if not exists backup_20261026.unit_bundles as select * from public.unit_bundles;
create table if not exists backup_20261026.flow_templates as select * from public.flow_templates;
create table if not exists backup_20261026.flow_lessons as select * from public.flow_lessons;
create table if not exists backup_20261026.flow_steps as select * from public.flow_steps;
create table if not exists backup_20261026.units as select * from public.units;
create table if not exists backup_20261026.progress as select * from public.progress;
create table if not exists backup_20261026.attempts as select * from public.attempts;
create table if not exists backup_20261026.activity_progress as select * from public.activity_progress;
revoke all on schema backup_20261026 from anon, authenticated;
