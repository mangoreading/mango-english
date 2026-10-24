-- 0020: 테스트 단원 "Template Samples" — 활동 템플릿 44종을 하나씩 담은 확인용 단원 (영역별 1개 차시, 템플릿당 1개 활동)
-- 단원/콘텐츠에서 이 단원을 열어 미리보기·발행·학습앱 확인에 쓴다.
insert into publishers(name) values ('테스트') on conflict (name) do nothing;
insert into books(publisher_id, grade, title, year)
  select id, 5, '템플릿 테스트', 2026 from publishers where name = '테스트'
  and not exists (select 1 from books where title = '템플릿 테스트');
insert into units(book_id, no, title, goals, status)
  select b.id, 2, 'Template Samples (전체 템플릿 확인용)', '{}'::jsonb, 'approved' from books b where b.title = '템플릿 테스트'
on conflict (book_id, no) do nothing;

-- 샘플 그림용 단어 (앱에 들어 있는 그림 사용)
insert into vocab(key, en, ko, image_path) values
  ('cup','cup','컵','word/cup.svg'),('ball','ball','공','word/ball.svg'),('bag','bag','가방','word/bag.svg'),('book','book','책','word/book.svg'),
  ('umbrella','umbrella','우산','word/umbrella.svg'),('gloves','gloves','장갑','word/gloves.svg'),('watch','watch','손목시계','word/watch.svg'),
  ('glasses','glasses','안경','word/glasses.svg'),('jeans','jeans','청바지','word/jeans.svg'),
  ('hat','hat','모자','word/hat.png'),('shorts','shorts','반바지','word/shorts.png')
on conflict (key) do update set image_path = coalesce(vocab.image_path, excluded.image_path);
insert into unit_vocab(unit_id, vocab_id)
  select u.id, v.id from units u join books b on b.id = u.book_id, vocab v
  where b.title = '템플릿 테스트' and u.no = 2
    and v.key in ('cap','jacket','socks','shoes','pants','sunglasses','cup','ball','bag','book','umbrella','gloves','watch','glasses','jeans','hat','shorts')
on conflict do nothing;

-- 흐름: 영역별 1개 차시, 템플릿마다 활동 1개
insert into flow_lessons(unit_id, no, en, ko, goal, color)
  select u.id, x.no, x.en, x.ko, '템플릿 화면을 확인해요.', 'mango' from units u join books b on b.id = u.book_id,
  (values (1, '어휘', '어휘'), (2, '표현', '표현'), (3, '듣기', '듣기'), (4, '말하기', '말하기'), (5, '읽기', '읽기'), (6, '쓰기', '쓰기')) as x(no, en, ko)
  where b.title = '템플릿 테스트' and u.no = 2 and not exists (select 1 from flow_lessons fl where fl.unit_id = u.id);
insert into flow_steps(lesson_id, pos, name_en, name_ko, minutes)
  select fl.id, x.pos, x.en, x.ko, 3 from flow_lessons fl join units u on u.id = fl.unit_id join books b on b.id = u.book_id,
  (values
    (1, 0, '단어 카드 보기', '단어 카드 보기'),
    (1, 1, '단어 따라 쓰기', '단어 따라 쓰기'),
    (1, 2, '철자 완성', '철자 완성'),
    (1, 3, '단어-뜻 매칭', '단어-뜻 매칭'),
    (1, 4, '소리-단어 매칭', '소리-단어 매칭'),
    (1, 5, '그림 보고 쓰기', '그림 보고 쓰기'),
    (1, 6, '뜻 고르기', '뜻 고르기'),
    (1, 7, '그림 보고 고르기', '그림 보고 고르기'),
    (1, 8, '단어 듣고 따라 말하기', '단어 듣고 따라 말하기'),
    (2, 0, '학습목표', '학습목표'),
    (2, 1, '핵심표현 듣고 따라 읽기', '핵심표현 듣고 따라 읽기'),
    (3, 0, '듣고 고르기 (글 4칸)', '듣고 고르기 (글 4칸)'),
    (3, 1, '듣고 고르기 (세로형)', '듣고 고르기 (세로형)'),
    (3, 2, '듣고 짝짓기', '듣고 짝짓기'),
    (3, 3, '문장 듣고 고르기(카드)', '문장 듣고 고르기(카드)'),
    (3, 4, '듣고 익히기 (그림)', '듣고 익히기 (그림)'),
    (3, 5, '듣고 익히기 (글)', '듣고 익히기 (글)'),
    (3, 6, '듣고 쓰기', '듣고 쓰기'),
    (4, 0, '문장 눌러 듣기', '문장 눌러 듣기'),
    (4, 1, '문장 바꿔 말하기', '문장 바꿔 말하기'),
    (4, 2, '그림 보고 말하기', '그림 보고 말하기'),
    (4, 3, '우리말 보고 영어로 말하기', '우리말 보고 영어로 말하기'),
    (4, 4, '듣고 대답하기', '듣고 대답하기'),
    (4, 5, '따라 읽기 평가', '따라 읽기 평가'),
    (4, 6, '역할 나눠 말하기', '역할 나눠 말하기'),
    (4, 7, '발표 영상 찍기', '발표 영상 찍기'),
    (4, 8, 'AI 자유대화', 'AI 자유대화'),
    (5, 0, '대화 고르기', '대화 고르기'),
    (5, 1, '맞으면 True, 틀리면 False', '맞으면 True, 틀리면 False'),
    (5, 2, '글 읽고 답하기 (선택)', '글 읽고 답하기 (선택)'),
    (5, 3, '글 읽고 답하기 (T/F)', '글 읽고 답하기 (T/F)'),
    (5, 4, '글 읽고 답하기 (복수선택)', '글 읽고 답하기 (복수선택)'),
    (5, 5, '글 듣고 읽기', '글 듣고 읽기'),
    (5, 6, '글 빈칸 채우기', '글 빈칸 채우기'),
    (6, 0, '모범 글 읽기', '모범 글 읽기'),
    (6, 1, '문장 쓰기 (우리말→영어)', '문장 쓰기 (우리말→영어)'),
    (6, 2, '정답 써 보기', '정답 써 보기'),
    (6, 3, '빈칸 단어 쓰기', '빈칸 단어 쓰기'),
    (6, 4, '대화 완성하기', '대화 완성하기'),
    (6, 5, '문장 만들기', '문장 만들기'),
    (6, 6, '문장 순서 맞추기', '문장 순서 맞추기'),
    (6, 7, '모범 글 완성 (보기)', '모범 글 완성 (보기)'),
    (6, 8, '나만의 글 쓰기', '나만의 글 쓰기'),
    (6, 9, '글 요약·쓰기', '글 요약·쓰기')
  ) as x(lesson, pos, en, ko)
  where b.title = '템플릿 테스트' and u.no = 2 and fl.no = x.lesson
    and not exists (select 1 from flow_steps s where s.lesson_id = fl.id);

-- 문항: 템플릿마다 샘플 1개 (3개 레벨 모두)
insert into items(unit_id, lesson, act_idx, level, template, tag, payload, status, step_id)
select u.id, x.lesson, x.pos * 100, lv.l::item_level, x.kind, x.tag, x.payload::jsonb, 'approved', s.id
from units u join books b on b.id = u.book_id
cross join (values ('CORE'), ('SUPPORT'), ('ADVANCED')) lv(l)
cross join (values
  (1, 0, 'vcards', 'vocab', '{"k":"vcards","tag":"vocab","words":["cap","jacket","socks","shoes","pants","sunglasses"]}'),
  (1, 1, 'vtype1', 'vocab', '{"k":"vtype1","tag":"vocab","words":["cap","jacket","socks","shoes","pants","sunglasses"]}'),
  (1, 2, 'vspell', 'vocab', '{"k":"vspell","tag":"vocab","word":"sunglasses","shown":6}'),
  (1, 3, 'vmatch', 'vocab', '{"k":"vmatch","tag":"vocab","words":["cap","jacket","socks","shoes","pants","sunglasses"]}'),
  (1, 4, 'vsound', 'vocab', '{"k":"vsound","tag":"vocab","words":["cap","jacket","socks","shoes","pants","sunglasses"]}'),
  (1, 5, 'vwrite', 'vocab', '{"k":"vwrite","tag":"vocab","words":["cap","jacket","socks","shoes","pants","sunglasses"]}'),
  (1, 6, 'wchoice', 'vocab', '{"k":"wchoice","tag":"vocab","word":"shoes","dir":"ko2en","wrong":["import","promote","anticipate"]}'),
  (1, 7, 'pchoice', 'vocab', '{"k":"pchoice","tag":"vocab","pic":"pants","opts":[{"t":"this pants"},{"t":"the pants"},{"t":"these pants"},{"t":"a pants"}],"a":2}'),
  (1, 8, 'wrepeat', 'vocab', '{"k":"wrepeat","tag":"vocab","words":["cap","jacket","socks","shoes","pants","sunglasses"]}'),
  (2, 0, 'goal', 'expr', '{"k":"goal","tag":"expr","title":"Ask and answer about [[prices]].","ko":"물건의 가격을 묻고 답할 수 있어요.","pic":"shoes","items":[{"en":"How much are these socks?","ko":"이 양말은 얼마예요?"},{"en":"They''re two thousand won.","ko":"2,000원이에요."},{"en":"May I help you?","ko":"도와 드릴까요?"}]}'),
  (2, 1, 'kexp', 'listen', '{"k":"kexp","tag":"listen","items":[{"en":"How much is it?","ko":"이것은 얼마예요?","label":"가격 묻기"},{"en":"It''s five thousand won.","ko":"5,000원이에요.","label":"가격 답하기"},{"en":"How much are they?","ko":"그것들은 얼마예요?"},{"en":"They''re two thousand won.","ko":"2,000원이에요."},{"en":"I''ll take it.","ko":"그걸로 할게요."}]}'),
  (3, 0, 'lchtext', 'listen', '{"k":"lchtext","pic":"jacket","tag":"listen","q":"재킷의 가격은 얼마인가요?","say":"How much is this jacket? It''s fourteen dollars.","opts":[{"t":"thirty-five dollars"},{"t":"sixteen dollars"},{"t":"fourteen dollars"},{"t":"seventeen dollars"}],"a":2,"hint":["How much is this jacket?","It''s fourteen dollars."]}'),
  (3, 1, 'lchlist', 'listen', '{"k":"lchlist","pic":"umbrella","tag":"listen","q":"재킷의 가격은 얼마인가요?","say":"How much is this jacket? It''s nine thousand won.","opts":[{"t":"Three thousand won"},{"t":"Four thousand won"},{"t":"Nine thousand won"},{"t":"Six thousand won"}],"a":2,"hint":["How much is this jacket?","It''s nine thousand won."]}'),
  (3, 2, 'lmatch', 'listen', '{"k":"lmatch","tag":"listen","pairs":[{"left":"Lily","say":"I want these shoes.","right":"shoes"},{"left":"Ken","say":"I want those sunglasses.","right":"sunglasses"},{"left":"Mia","say":"I want a pair of shorts.","right":"shorts"},{"left":"Tom","say":"I want a hat.","right":"hat"}]}'),
  (3, 3, 'lsent', 'listen', '{"k":"lsent","tag":"listen","items":[{"en":"How much are these socks?","ko":"이 양말은 얼마예요?"},{"en":"They''re two thousand won.","ko":"2,000원이에요"},{"en":"May I help you?","ko":"도와 드릴까요?"},{"en":"Yes, please.","ko":"네, 부탁해요."}]}'),
  (3, 4, 'lcardp', 'listen', '{"k":"lcardp","tag":"listen","items":[{"en":"cap","ko":"모자","pic":"cap"},{"en":"jacket","ko":"재킷","pic":"jacket"},{"en":"socks","ko":"양말","pic":"socks"},{"en":"shoes","ko":"신발","pic":"shoes"},{"en":"pants","ko":"바지","pic":"pants"},{"en":"sunglasses","ko":"선글라스","pic":"sunglasses"}]}'),
  (3, 5, 'lcardt', 'listen', '{"k":"lcardt","tag":"listen","items":[{"en":"How much is it?","ko":"이것은 얼마예요?"},{"en":"It''s five thousand won.","ko":"5,000원이에요."},{"en":"May I help you?","ko":"도와 드릴까요?"},{"en":"Yes, please.","ko":"네, 부탁해요."},{"en":"I''ll take it.","ko":"그걸로 할게요."},{"en":"Here you are.","ko":"여기 있어요."}]}'),
  (3, 6, 'lwrite', 'listen', '{"k":"lwrite","pic":"watch","tag":"listen","q":"Siya의 일과에 맞게 시각을 적어 봅시다.","say":"Siya goes to school at eight thirty. She has a violin class at four. She goes home at five fifteen.","rows":[{"label":"go to school","ans":"8:30"},{"label":"have a violin class","ans":"4:00"},{"label":"go home","ans":"5:15"}],"hint":["go to school → 학교에 가요","go home → 집에 가요"]}'),
  (4, 0, 'tapl', 'speak', '{"k":"tapl","tag":"speak","items":[{"en":"How much is it?","ko":"이것은 얼마예요?"},{"en":"It''s five thousand won.","ko":"5,000원이에요."},{"en":"How much are they?","ko":"그것들은 얼마예요?"},{"en":"They''re two thousand won.","ko":"2,000원이에요."},{"en":"I''ll take it.","ko":"그걸로 할게요."}]}'),
  (4, 1, 'sdrill', 'speak', '{"k":"sdrill","pic":"shoes","tag":"speak","tpl":"How much are these {}?","words":["shorts","sunglasses","pants","shoes","socks","jeans"]}'),
  (4, 2, 'lookspeak', 'speak', '{"k":"lookspeak","tag":"speak","pic":"jacket","label":"jacket","price":"$16,000","target":"How much are these jackets?","hint":["How much are ~?"]}'),
  (4, 3, 'saykor', 'speak', '{"k":"saykor","pic":"jacket","tag":"speak","ko":"16,000원입니다.","target":"They''re sixteen thousand won.","hint":["They''re ~."]}'),
  (4, 4, 'lspeak', 'speak', '{"k":"lspeak","pic":"sunglasses","tag":"speak","ask":"How much are these sunglasses?","ko":"Ken의 가게 / 선글라스 13,000원","target":"They''re thirteen thousand won.","hint":["They''re ~ won."]}'),
  (4, 5, 'raloud', 'speak', '{"k":"raloud","pic":"jacket","tag":"speak","target":"It''s fifteen thousand won.","stars":true,"fluency":true}'),
  (4, 6, 'role', 'speak', '{"k":"role","tag":"speak","pic":"jacket","price":"$ 6,000","lines":["A: May I help you?","B: Yes, please. How much are {{these jackets}}?","A: [[They are two thousand]] dollars.","B: I''ll pick them."]}'),
  (4, 7, 'present', 'speak', '{"k":"present","pic":"book","tag":"speak","text":["Do you want [[cool pants]]?","These pants are [[blue]] and [[yellow]].","Look at the [[beautiful butterflies]].","They were [[twenty]] dollars.","Now, they are [[ten]] dollars.","Take them now!"]}'),
  (4, 8, 'aitalk', 'speak', '{"k":"aitalk","pic":"watch","tag":"speak","situation":"You are Omar. You want to buy the watch.","role":"a watch shop clerk","open":"Hello! Can I help you?","script":[{"ai":"It''s fifteen thousand won.","hint":"How much ~~~? 로 시작해보세요"},{"ai":"They''re two thousand won.","hint":"How much are they? 라고 물어보세요"},{"ai":"Thank you! Here you are.","hint":"I''ll take it. 이라고 말해 보세요"}],"turns":3}'),
  (5, 0, 'dchoice', 'read', '{"k":"dchoice","tag":"read","lines":["A: May I help you?","B: Yes, please. How much are these socks?","A: ______"],"opts":[{"t":"They''re two thousand won."},{"t":"It''s two thousand won."},{"t":"I like socks."},{"t":"Here you are."}],"a":0}'),
  (5, 1, 'tf', 'read', '{"k":"tf","pic":"book","tag":"read","lines":["A: How much is the book?","B: It''s nine thousand won."],"stmt":"These sunglasses are thirteen thousand won.","a":false,"hint":["A: How much is the book?","B: It''s nine thousand won."]}'),
  (5, 2, 'sqchoice', 'read', '{"k":"sqchoice","pic":"bag","tag":"read","title":"Be a Good Shopper","text":["I''m at the shopping center.","Oh! This phone case is cool.","How much is it?","It''s on sale now.","It''s only 5,000 won.","I want to buy it."],"ko":"나는 쇼핑센터에 있어. 와! 이 휴대폰 케이스 멋지다. 얼마예요? 지금 세일 중이야. 겨우 5,000원이야. 사고 싶어.","q":"How much is the phone case?","opts":[{"t":"5,000 won"},{"t":"4,000 won"},{"t":"9,000 won"},{"t":"15,000 won"}],"a":0,"hint":["five thousand won"]}'),
  (5, 3, 'sqtf', 'read', '{"k":"sqtf","pic":"cup","tag":"read","text":["Jake, wait! You need to think first.","Do you NEED it?","Or do you just WANT it?","Please don''t buy it.","You already have a nice phone case."],"q":"Q1. 글의 내용과 일치하면 T, 아니면 F를 선택하세요.","items":[{"t":"Jake should think first.","a":true},{"t":"Jake has no phone case.","a":false},{"t":"The writer wants Jake to buy it.","a":false}]}'),
  (5, 4, 'sqmulti', 'read', '{"k":"sqmulti","pic":"gloves","tag":"read","text":["It''s my sister''s birthday tomorrow.","I want to buy a hairpin for her.","How much is it?","It''s 8,000 won.","Oh, no! I used all my money for this week."],"q":"Q1. 글의 내용과 맞는 것을 모두 선택하세요.","items":[{"t":"Tomorrow is the writer''s birthday."},{"t":"The writer wants a hairpin for her sister.","ok":true},{"t":"The hairpin is 8,000 won.","ok":true},{"t":"The writer has a lot of money."}]}'),
  (5, 5, 'pread', 'read', '{"k":"pread","pic":"ball","tag":"read","text":["Today is Class Bazaar Day. Mina has a shop.","She sells a cap, a book, and gloves.","Ken comes to her shop. He asks, \"How much is the book?\"","Mina says, \"It''s nine thousand won.\"","---","Ken asks, \"How much are the gloves?\"","\"They''re four thousand won.\"","Ken says, \"I''ll take the gloves. Here you are.\"","Mina says, \"Thank you!\""],"ko":"오늘은 학급 바자회 날이야. 미나는 가게가 있어. 모자, 책, 장갑을 팔아.\n켄이 가게에 와서 \"책은 얼마예요?\"라고 물어. 미나는 \"9,000원이에요.\"라고 말해.\n---\n켄이 \"장갑은 얼마예요?\"라고 물어. \"4,000원이에요.\"\n켄은 \"장갑을 살게요. 여기 있어요.\"라고 말해. 미나는 \"고마워요!\"라고 말해."}'),
  (5, 6, 'scloze', 'read', '{"k":"scloze","pic":"bag","tag":"read","lines":["That''s too bad, Emily.","You bought many cookies yesterday.","Use a money {}.","You can check and {} your money."],"ans":["planner","save"],"extra":["want","sale"],"hint":["save : 절약하다"]}'),
  (6, 0, 'mtext', 'write', '{"k":"mtext","pic":"shoes","tag":"write","title":"SALE","text":["Look at these [[bright shoes]].","How much are [[these shoes]]?","They''re [[20,000 won]].","They''re on sale."],"explain":["먼저 {{상품과 특징}}을 얘기합니다.","가격 질문을 하고","{{가격을 제시}}합니다.","세일 중임을 얘기합니다."],"ko":"이 밝은 신발을 보세요.\n이 신발은 얼마예요?\n2만 원이에요.\n세일 중이에요."}'),
  (6, 1, 'sbuild', 'write', '{"k":"sbuild","pic":"cup","tag":"write","ko":"이거 얼마예요?","ans":"How much is it?"}'),
  (6, 2, 'swrite', 'write', '{"k":"swrite","pic":"socks","tag":"write","ko":"이 양말은 얼마예요?","ans":"How much are these socks?","starter":"How much"}'),
  (6, 3, 'sfill', 'write', '{"k":"sfill","pic":"socks","tag":"write","ko":"이 양말은 얼마예요?","tpl":"How much {} these socks?","ans":"are"}'),
  (6, 4, 'dfill', 'write', '{"k":"dfill","tag":"write","pic":"jacket","tag2":"$60","lines":["A: How much are these {}?","B: They are {} dollars."],"ans":["jackets|jacket","sixty"]}'),
  (6, 5, 'sscram', 'write', '{"k":"sscram","pic":"shoes","tag":"write","ko":"신발은 얼마인가요?","ans":"How much are these shoes?"}'),
  (6, 6, 'sorder', 'write', '{"k":"sorder","pic":"cap","tag":"write","items":[{"en":"How much is it?","ko":"이것은 얼마인가요?"},{"en":"It''s five thousand won.","ko":"이것은 5,000원이에요."},{"en":"How much are they?","ko":"그것들은 얼마예요?"},{"en":"They''re two thousand won.","ko":"이것들은 2,000원이에요."},{"en":"I''ll take it.","ko":"그걸로 할게요."}]}'),
  (6, 7, 'mwbank', 'write', '{"k":"mwbank","pic":"shoes","tag":"write","lines":["Look at these {} shoes.","How much are {}?","They''re {} won.","{} on sale."],"ans":["bright","these shoes","twenty thousand","They''re"],"extra":[]}'),
  (6, 8, 'mfree', 'write', '{"k":"mfree","pic":"pants","tag":"write","topic":"pants","lines":["Look at {}.","How much {}?","{} won.","{} on sale."],"hint":["Look at these cool pants."]}'),
  (6, 9, 'swrt', 'write', '{"k":"swrt","pic":"book","tag":"write","title":"내 글 체크리스트","rules":[{"label":"물건 이름 (book)","re":"book"},{"label":"가격 (…won)","re":"won"},{"label":"사겠다고 말하기 (I''ll take…)","re":"i''?ll take"}],"minSent":3,"starter":"I want to buy a book.","hint":["How much ~? 로 시작해 보세요"]}')
) as x(lesson, pos, kind, tag, payload)
join flow_lessons fl on fl.unit_id = u.id and fl.no = x.lesson
join flow_steps s on s.lesson_id = fl.id and s.pos = x.pos
where b.title = '템플릿 테스트' and u.no = 2
  and not exists (select 1 from items i where i.unit_id = u.id);

select publish_unit(u.id) from units u join books b on b.id = u.book_id where b.title = '템플릿 테스트' and u.no = 2;
