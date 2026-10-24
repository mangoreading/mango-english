-- 0013: 활동 템플릿 1단계 11종 등록 (선택·T/F·듣고 고르기·짝짓기·글 읽고 답하기)
insert into activity_types(key, name_ko, name_en, description, category, sort) values
  ('wchoice',  '뜻 고르기',               'Word Choice',             '한글 뜻(또는 영어 단어)을 보고 알맞은 보기를 4지선다로 고르기', '어휘', 27),
  ('pchoice',  '그림 보고 고르기',        'Picture Choice',          '그림을 보고 알맞은 말을 고르기', '어휘', 28),
  ('dchoice',  '대화 고르기',             'Dialogue Choice',         '대화를 읽고 알맞은 말을 고르기', '읽기', 40),
  ('tf',       '맞으면 True, 틀리면 False', 'True or False',          '대화·글과 문장이 일치하는지 True/False로 고르기', '읽기', 41),
  ('lchtext',  '듣고 고르기 (글 4칸)',    'Listen & Choose (Text)',  '듣고 가로 4칸 글 보기에서 정답 고르기, 힌트=스크립트', '듣기', 50),
  ('lchpic',   '듣고 고르기 (그림 4칸)',  'Listen & Choose (Picture)','듣고 가로 4칸 그림 보기에서 정답 고르기', '듣기', 51),
  ('lchlist',  '듣고 고르기 (세로형)',    'Listen & Choose (List)',  '듣고 세로 목록 보기에서 정답 고르기', '듣기', 52),
  ('lmatch',   '듣고 짝짓기',             'Listen & Match',          '소리를 듣고 알맞은 짝(사람-물건 등) 연결하기', '듣기', 53),
  ('sqchoice', '글 읽고 답하기 (선택)',   'Story Quiz (Choice)',     '글을 읽고 질문에 4지선다로 답하기, 본문 해석·힌트 제공', '읽기', 60),
  ('sqtf',     '글 읽고 답하기 (T/F)',    'Story Quiz (T/F)',        '글을 읽고 여러 문장의 T/F 판단하기', '읽기', 61),
  ('sqmulti',  '글 읽고 답하기 (복수선택)', 'Story Quiz (Multi)',     '글을 읽고 알맞은 보기를 모두 고르기', '읽기', 62)
on conflict (key) do nothing;
