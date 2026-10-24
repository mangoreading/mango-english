-- 0015: 활동 템플릿 3단계 11종 등록 (쓰기류)
insert into activity_types(key, name_ko, name_en, description, category, sort) values
  ('sbuild', '문장 쓰기 (우리말→영어)', 'Sentence Build-up',          '우리말을 보고 영어 문장을 캡슐 안에 써서 완성, 첫 글자 힌트', '쓰기', 71),
  ('swrite', '정답 써 보기',            'Write the Answer',           '우리말을 보고 영어 문장을 입력칸에 쓰기, 시작 힌트', '쓰기', 72),
  ('sfill',  '빈칸 단어 쓰기',          'Fill the Blank',             '문장의 빈칸에 들어갈 단어 쓰기', '쓰기', 73),
  ('dfill',  '대화 완성하기',           'Complete the Dialogue',      '그림을 보고 A/B 대화의 빈칸을 채워 완성', '쓰기', 74),
  ('sscram', '문장 만들기',             'Sentence Scramble',          '섞인 단어 칩을 순서대로 눌러 문장 만들기', '쓰기', 75),
  ('sorder', '문장 순서 맞추기',        'Sentence Ordering',          '문장(대화)을 끌어서 올바른 순서로 나열하기', '쓰기', 76),
  ('mwbank', '모범 글 완성 (보기)',     'Model Writing (Word Bank)',  '보기 단어를 골라 모범 글의 빈칸 채우기', '쓰기', 77),
  ('scloze', '글 빈칸 채우기',          'Story Cloze',                '글을 읽고 보기 단어로 빈칸 채우기', '읽기', 64),
  ('lwrite', '듣고 쓰기',               'Listen & Write',             '들은 내용을 표의 빈칸(시각 등)에 쓰기', '듣기', 57),
  ('mfree',  '나만의 글 쓰기',          'Model Writing (Free)',       '글의 틀 빈칸을 내 말로 채워 글 완성', '쓰기', 78),
  ('swrt',   '글 요약·쓰기',            'Story Writing',              '체크리스트를 보며 내 글 쓰기, 규칙이 쓰는 동안 자동 체크', '쓰기', 79)
on conflict (key) do nothing;
