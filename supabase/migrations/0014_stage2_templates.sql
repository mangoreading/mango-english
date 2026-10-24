-- 0014: 활동 템플릿 2단계 10종 등록 (듣고 익히기 · 따라 말하기 · 학습목표 · 문장 바꿔 말하기 · 글 듣고 읽기 · 모범 글)
insert into activity_types(key, name_ko, name_en, description, category, sort) values
  ('goal',    '학습목표',               'Learning Goal',            '학습목표 문장과 핵심 표현을 한 화면에서 확인', '표현', 10),
  ('kexp',    '핵심표현 듣고 따라 읽기', 'Key Expression Listen',    '말풍선 표현을 눌러 듣고 따라 읽기, 전체 듣기·한글 토글', '표현', 11),
  ('tapl',    '문장 눌러 듣기',          'Tap & Listen',             '문장 상자를 눌러 소리를 듣고 소리 내어 읽기', '말하기', 30),
  ('lsent',   '문장 듣고 고르기(카드)',  'Listen & Pick Sentence',   '세로 문장 카드를 눌러 들으며 익히기', '듣기', 54),
  ('lcardp',  '듣고 익히기 (그림)',      'Listen & Learn (Picture)', '그림이 있는 카드를 눌러 듣고 익히기', '듣기', 55),
  ('lcardt',  '듣고 익히기 (글)',        'Listen & Learn (Text)',    '글 카드를 눌러 듣고 익히기', '듣기', 56),
  ('wrepeat', '단어 듣고 따라 말하기',   'Word Repeat',              '단어 카드를 한 장씩 넘기며 듣고 따라 말하기', '어휘', 29),
  ('sdrill',  '문장 바꿔 말하기',        'Sentence Drill',           '문장의 빈칸에 단어를 바꿔 넣으며 반복해서 말하기', '말하기', 31),
  ('pread',   '글 듣고 읽기',            'Passage Read Aloud',       '여러 쪽의 글을 넘기며 듣고 읽기, 해설 보기', '읽기', 63),
  ('mtext',   '모범 글 읽기',            'Model Text',               '모범 글(광고문 등)과 해설·해석을 나란히 보기', '쓰기', 70)
on conflict (key) do nothing;
