-- 0032: 6차시 v0.2 (인호 결정 2026-10-26: 차시당 25분, 체크·맞춤 보강은 6차시, AI 자유대화 포함)
-- 차시 이름은 아이용 행동 이름. 같은 표현을 차시마다 다른 과제로 반복(듣고 따라 → 대답 → 먼저 질문 → 글에서 알기 → 내 글 → 새 상황).
do $$
declare t uuid; u9 uuid; l record; s record; n_items int; ul uuid;
begin
  select id into t from flow_templates where name = '비상 초5 6차시';
  if t is null then raise exception '비상 초5 6차시 템플릿이 없어요'; end if;

  update flow_lessons f set en = v.en, ko = v.ko, goal = v.goal
  from (values
    (1,'Listen & Learn',     '듣고 익혀요',   '핵심 단어와 표현의 뜻을 알고 따라 말해요'),
    (2,'Listen & Respond',   '듣고 대답해요', '배운 질문을 듣고 짧게 대답해요'),
    (3,'Ask & Answer',       '묻고 답해요',   '질문과 대답을 바꾸어 짧은 대화를 해요'),
    (4,'Read & Understand',  '읽고 알아봐요', '배운 표현이 들어간 짧은 글을 이해해요'),
    (5,'Write My Story',     '내 이야기를 써요','배운 표현으로 내 이야기를 써요'),
    (6,'Try It Yourself',    '직접 해봐요',   '새로운 상황에서 듣고 말하고 읽고 쓰고, 부족한 곳을 채워요')
  ) as v(no,en,ko,goal) where f.template_id = t and f.no = v.no;

  delete from flow_steps where lesson_id in (select id from flow_lessons where template_id = t);

  insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes, kind, qty, special)
  select fl.id, st.pos, st.name_en, st.name_ko, st.minutes, st.kind, st.qty, st.special
  from (values
    (1,0,'Learning Goal',        '학습목표',                    1, 'goal',      1, null),
    (1,1,'Word Repeat',          '단어 듣고 따라 말하기',       5, 'wrepeat',   7, null),
    (1,2,'Word-Meaning Choice',  '단어-뜻 고르기',              4, 'wchoice',   5, null),
    (1,3,'Key Expressions',      '핵심표현 듣고 따라 읽기',     4, 'kexp',      4, null),
    (1,4,'Sentence Drill',       '문장 바꿔 말하기 (질문·대답)', 6, 'sdrill',    6, null),
    (1,5,'Listen & Choose',      '듣고 고르기 (그림)',          5, 'lchpic',    4, null),
    (2,0,'Quick Recall',         '지난 표현 떠올리기 (듣고 고르기)', 3, 'lchpic', 3, null),
    (2,1,'Listen & Choose',      '듣고 정보 구분하기',          5, 'lchtext',   4, null),
    (2,2,'Tap & Listen',         '문장 눌러 듣기',              3, 'tapl',      5, null),
    (2,3,'Listen & Speak',       '듣고 대답하기',               6, 'lspeak',    4, null),
    (2,4,'Role Play',            '역할 나눠 말하기',            8, 'role',      2, null),
    (3,0,'Sentence Drill',       '문장 바꿔 말하기 (복습)',     4, 'sdrill',    4, null),
    (3,1,'Look & Speak',         '그림 보고 먼저 질문하기',     5, 'lookspeak', 3, null),
    (3,2,'Listen & Speak',       '질문 듣고 대답하기 (정답 숨김)', 5, 'lspeak',  3, null),
    (3,3,'Role Play',            '역할 바꾸어 대화하기 (A/B)',  6, 'role',      2, null),
    (3,4,'AI Free Talk',         'AI 자유대화',                 5, 'aitalk',    1, null),
    (4,0,'Passage Read Aloud',   '글 듣고 읽기',                5, 'pread',     2, null),
    (4,1,'Story Quiz (Choice)',  '글 읽고 답하기 (선택)',       5, 'sqchoice',  3, null),
    (4,2,'Story Quiz (T/F)',     '글 읽고 답하기 (T/F)',        3, 'sqtf',      3, null),
    (4,3,'Story Cloze',          '글 빈칸 채우기',              4, 'scloze',    3, null),
    (4,4,'Read Aloud',           '따라 읽기 평가',              4, 'raloud',    3, null),
    (4,5,'Listen & Speak',       '글 속 상황에 대답하기',       4, 'lspeak',    2, null),
    (5,0,'Sentence Scramble',    '단어 배열로 문장 만들기',     4, 'sscram',    3, null),
    (5,1,'Write the Answer',     '문장 틀 보고 쓰기',           5, 'swrite',    3, null),
    (5,2,'Model Text',           '모범 글 읽기',                3, 'mtext',     1, null),
    (5,3,'Model Writing (Word Bank)', '모범 글 완성',           4, 'mwbank',    3, null),
    (5,4,'Model Writing (Free)', '나만의 글 쓰기',              6, 'mfree',     1, null),
    (5,5,'Look & Speak',         '내 글 속 물건 그림 보고 말하기', 3, 'lookspeak', 2, null),
    (6,0,'Check: Listen',        '체크 · 듣고 고르기',          2, 'lchpic',    2, 'diagnostic'),
    (6,1,'Check: Read',          '체크 · 글 읽고 답하기',       3, 'sqchoice',  2, 'diagnostic'),
    (6,2,'Check: Role Play',     '체크 · 새 상황 역할 대화',    4, 'role',      1, 'diagnostic'),
    (6,3,'Check: AI Talk',       '체크 · AI 자유대화',          5, 'aitalk',    1, 'diagnostic'),
    (6,4,'Check: Write',         '체크 · 문장 쓰기',            3, 'sbuild',    2, 'diagnostic'),
    (6,5,'Personalized Review',  '결과에 따른 맞춤 보강',       8, null,        null, 'adaptive')
  ) as st(lno,pos,name_en,name_ko,minutes,kind,qty,special)
  join flow_lessons fl on fl.no = st.lno and fl.template_id = t;

  -- Lesson 9 의 흐름도 새 틀로 교체 (문항이 하나도 연결돼 있지 않을 때만)
  select u.id into u9 from units u join books b on b.id = u.book_id where b.title = '비상교육 초5 영어' and u.no = 9;
  if u9 is not null then
    select count(*) into n_items from items i join flow_steps fs on fs.id = i.step_id join flow_lessons fl on fl.id = fs.lesson_id where fl.unit_id = u9;
    if n_items = 0 then
      delete from flow_lessons where unit_id = u9;
      perform apply_flow_template(t, u9);
    end if;
  end if;
end $$;
