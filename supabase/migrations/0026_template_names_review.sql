-- 0026: 템플릿 이름·영역 점검 반영 (2026-10-26)
update public.activity_types set name_ko = '문장 듣고 익히기', name_en = 'Listen & Learn (Sentence)' where key = 'lsent';
update public.activity_types set name_ko = '글 읽고 내 글 쓰기' where key = 'swrt';
update public.activity_types set name_ko = 'True/False 고르기' where key = 'tf';
update public.activity_types set name_ko = '단어 배열로 문장 만들기' where key = 'sscram';
update public.activity_types set name_ko = '문장 틀 보고 쓰기',
  description = '우리말을 보고, 빈칸이 있는 문장 틀을 참고해 영어 문장을 입력칸에 쓰기. 시작 힌트 제공' where key = 'swrite';
update public.activity_types set description = '우리말을 보고 영어 문장 전체를 캡슐 안에 직접 써서 완성, 첫 글자 힌트' where key = 'sbuild';
update public.activity_types set description = '문장 안의 빈칸에 들어갈 단어만 써 넣기' where key = 'sfill';
update public.activity_types set category = '표현' where key = 'tapl';
