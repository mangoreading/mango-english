-- 0016: 활동 템플릿 4단계 7종 등록 (말하기: 말소리 인식·녹화·AI 대화)
insert into activity_types(key, name_ko, name_en, description, category, sort) values
  ('lookspeak', '그림 보고 말하기',        'Look & Speak',     '그림과 문장을 보고 마이크로 따라 말하기, 단어별 일치 표시', '말하기', 32),
  ('saykor',    '우리말 보고 영어로 말하기', 'Say It in English', '우리말 문장을 보고 영어로 말하기', '말하기', 33),
  ('lspeak',    '듣고 대답하기',           'Listen & Speak',   '질문을 듣고 알맞은 대답을 마이크로 말하기', '말하기', 34),
  ('raloud',    '따라 읽기 평가',          'Read Aloud',       '듣고 따라 읽은 뒤 단어별 정확도(색)와 별점으로 확인, 2차 시도', '말하기', 35),
  ('role',      '역할 나눠 말하기',        'Role Play',        'A/B 역할을 골라 내 차례엔 말하고 상대 차례엔 듣기', '말하기', 36),
  ('present',   '발표 영상 찍기',          'Presentation',     '내 글을 보며 카메라로 발표 영상 녹화 (영상은 기기 안에서만)', '말하기', 37),
  ('aitalk',    'AI 자유대화',             'AI Free Talk',     '상황에 맞게 AI와 영어로 대화하기 (AI 연결 전에는 대본으로 진행)', '말하기', 38)
on conflict (key) do nothing;
