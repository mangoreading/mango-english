-- 활동 템플릿에 영어 이름 추가
alter table public.activity_types add column if not exists name_en text not null default '';
update public.activity_types set name_en = v.n from (values
  ('vcards','Word Cards'),('vtype1','Word Typing'),('vspell','Spelling Completion'),('vmatch','Word-Meaning Match'),
  ('vsound','Sound-Word Match'),('vwrite','Picture Writing'),
  ('learn','Learning Cards'),('text','Reading Text'),('brief','Mission Brief'),('choose','Multiple Choice'),
  ('match','Matching'),('build','Sentence Building'),('fill','Fill in the Blanks'),('write','Writing'),
  ('compose','Composition'),('speak','Speaking'),('fade','Fade-out Practice'),('dialog','Dialogue')
) as v(k,n) where activity_types.key = v.k and activity_types.name_en = '';
