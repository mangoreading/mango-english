-- 0022: 어휘 템플릿 이름·설명을 바뀐 동작에 맞게 정리
update public.activity_types set name_ko = '단어-뜻 고르기', name_en = 'Word-Meaning Choice',
  description = '단어(또는 한글 뜻)를 보고 2×2 보기에서 알맞은 뜻(또는 단어)을 고르기. 문제 상자의 토글로 방향 변경, 단어 소리 자동 재생' where key = 'wchoice';
update public.activity_types set description = '카드가 열리면 소리가 자동으로 나오고, 그림·단어·뜻을 보며 단어를 한 개씩 따라 쓰기' where key = 'vtype1';
update public.activity_types set description = '그림과 뜻을 보고 여러 단어를 한 화면에서 쓰기. 맞게 쓰면 바로 확인(확인 버튼 없음)' where key = 'vwrite';
update public.activity_types set description = '그림·단어·뜻 카드를 한 장씩 넘기며 소리를 듣고 따라 말하기. 카드가 열리면 소리 자동 재생, 카드를 누르면 다시 재생' where key = 'wrepeat';
