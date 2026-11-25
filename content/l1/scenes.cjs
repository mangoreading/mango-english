// Lesson 1 영상 4편의 장면 이미지 프롬프트 (장면 = 대사 줄 묶음). 인물 설명·화풍은 admin 이미지 제작 화면이 자동으로 붙인다.
const CAMP = 'an outdoor summer camp field with colorful tents, green trees and a decorated welcome gate with no text';
const ROOM = 'a bright elementary school classroom with desks, a clean blackboard with no writing, and a world map on the wall with no text';
const LIB = 'a cozy school library with tall bookshelves and a wooden front desk';
const PARK = 'a sunny city park with green grass, trees and a soccer field';
const NOTE = ' No text, no letters, no numbers anywhere in the picture.';
// [lesson, pos, seq, lines, desc_ko, prompt]
const rows = [
  [1, 7, 1, '1-2', '캠프 입구에서 그린 선생님이 두 팔을 벌려 아이들을 환영하는 장면', `Ms. Green opens her arms to welcome a group of smiling children (Hana, Leo, Chloe and Tom) with small backpacks, in front of ${CAMP}.`],
  [1, 7, 2, '3-4', '하나가 손을 흔들며 자기소개를 하고, 친구들이 웃으며 듣는 장면', `Hana waves hello and smiles while introducing herself, the other children listen happily, ${CAMP}.`],
  [1, 7, 3, '5-6', '레오가 손을 흔들며 인사하고 하나와 웃으며 악수하는 장면', `Leo waves and smiles, then shakes hands with Hana, ${CAMP}.`],
  [1, 7, 4, '7-8', '하나가 궁금한 얼굴로 묻고, 레오가 자랑스럽게 지구본을 들고 대답하는 장면', `Hana asks Leo with a curious face, Leo proudly holds a small plain globe with no text, ${CAMP}.`],
  [1, 7, 5, '9-10', '레오가 클로이에게 묻고, 클로이가 작은 파랑·하양·빨강 깃발을 들고 웃으며 대답하는 장면', `Leo turns to Chloe with a question, Chloe smiles and holds a small flag with blue, white and red vertical stripes, ${CAMP}.`],
  [1, 7, 6, '11-12', '톰이 모자를 흔들며 인사하고, 그린 선생님과 아이들이 박수 치며 환영하는 장면', `Tom waves his red cap and smiles, Ms. Green and the children clap happily to welcome everyone, ${CAMP}.`],
  [1, 8, 1, '1-2', '그린이 아닌 브라운 선생님이 아침 인사를 하고 새 친구가 왔다고 알리는 장면', `Mr. Brown stands at the front of ${ROOM}, greets the class with a smile and gestures toward the classroom door, Hana and Leo sit at their desks.`],
  [1, 8, 2, '3-4', '아미르가 교실 앞에서 쑥스럽지만 웃으며 인사하는 장면', `Amir stands at the front of ${ROOM}, waves shyly with a happy smile, Mr. Brown stands beside him.`],
  [1, 8, 3, '5-7', '하나가 아미르에게 묻고, 아미르가 대답하고, 레오가 엄지를 세우며 놀라워하는 장면', `Hana turns to Amir with a friendly question, Amir answers with a proud smile, Leo gives a thumbs up, ${ROOM}.`],
  [1, 8, 4, '8-9', '브라운 선생님이 묻고, 아미르가 칠판 앞에서 손가락으로 글자 쓰는 시늉을 하며 대답하는 장면', `Mr. Brown asks Amir kindly, Amir answers while writing in the air with his finger, ${ROOM}.`],
  [1, 8, 5, '10', '선생님과 반 친구들이 박수 치며 아미르를 환영하는 장면', `Mr. Brown and the class clap and welcome Amir with big smiles, ${ROOM}.`],
  [2, 3, 1, '1-2', '사서 선생님이 카운터에서 웃으며 인사하고, 카이도 웃으며 인사하는 장면', `Ms. Park the librarian smiles and greets Kai at the front desk, Kai smiles back, ${LIB}.`],
  [2, 3, 2, '3-4', '사서 선생님이 이름을 묻고, 카이가 대답하는 장면', `Ms. Park asks Kai a question with a gentle smile, Kai answers happily while holding a blank library card, ${LIB}.`],
  [2, 3, 3, '5-6', '사서 선생님이 종이를 내밀며 이름 철자를 묻고, 카이가 손가락으로 하나씩 세며 대답하는 장면', `Ms. Park holds out a blank paper and a pencil, Kai counts letters on his fingers while answering, ${LIB}.`],
  [2, 3, 4, '7-9', '카이가 도서관 카드를 받고, 사서 선생님이 두 팔을 벌려 환영하는 장면', `Kai happily receives a blank library card, Ms. Park opens her arms to welcome him, books and bookshelves behind, ${LIB}.`],
  [2, 4, 1, '1-2', '유나가 조이에게 손을 흔들며 새 친구를 데려오는 장면', `Yuna waves to Zoe and brings Lucas, who holds a soccer ball, ${PARK}.`],
  [2, 4, 2, '3-5', '루카스가 인사하고, 조이가 궁금한 얼굴로 묻고, 루카스가 웃으며 대답하는 장면', `Lucas greets Zoe, Zoe asks him with a curious face, Lucas answers with a big smile, ${PARK}.`],
  [2, 4, 3, '6-8', '조이가 악수하며 반가워하고, 철자를 묻자 루카스가 손가락으로 세며 대답하는 장면', `Zoe shakes hands with Lucas happily, then Lucas counts letters on his fingers, ${PARK}.`],
  [2, 4, 4, '9', '유나가 아이들을 부르고 루카스가 공을 들어 올리며 모두 축구하러 달려가는 장면', `Yuna calls Zoe and Lucas to come and play, Lucas lifts the soccer ball, the three run happily toward the field, ${PARK}.`],
].map(([lesson, pos, seq, lines, desc_ko, prompt]) => ({ lesson, pos, seq, lines, desc_ko, prompt: prompt + NOTE, file_name: `l1-${lesson}-${pos}-${seq}` }));
// 장면 설명 보정(오타 방지): 영상 ②의 1번 설명
rows[6].desc_ko = '브라운 선생님이 아침 인사를 하고 새 친구가 왔다고 알리는 장면';
const CHARS = [
  { name: 'Ms. Green', desc: 'Cartoon woman camp leader in her 30s, light-skinned, short auburn hair, green polo shirt with a whistle on a cord, warm welcoming smile' },
  { name: 'Hana', desc: 'Cartoon girl about 11 years old, light-skinned, long straight black hair in a ponytail, yellow hoodie, bright cheerful smile' },
  { name: 'Leo', desc: 'Cartoon boy about 11 years old, tan skin, short curly dark hair, green and yellow soccer jersey, friendly grin' },
  { name: 'Chloe', desc: 'Cartoon girl about 11 years old, light-skinned, wavy blonde hair under a navy beret, navy striped shirt, gentle smile' },
  { name: 'Tom', desc: 'Cartoon boy about 11 years old, light-skinned, short sandy-brown hair with freckles, red baseball cap, blue hoodie' },
  { name: 'Mr. Brown', desc: 'Cartoon man teacher in his 40s, dark-brown skin, short black hair and glasses, gray cardigan over a white shirt, kind smile' },
  { name: 'Amir', desc: 'Cartoon boy about 11 years old, medium-brown skin, short black hair, light blue t-shirt, school backpack, shy but happy smile' },
  { name: 'Ms. Park', desc: 'Cartoon librarian woman in her 30s, light-skinned, black bob haircut, round glasses, mint cardigan, blank name badge on a lanyard' },
  { name: 'Kai', desc: 'Cartoon boy about 11 years old, tan skin, straight black hair, orange t-shirt, curious smile' },
  { name: 'Yuna', desc: 'Cartoon girl about 11 years old, light-skinned, short black bob with a red hairpin, white t-shirt and denim overalls, energetic smile' },
  { name: 'Zoe', desc: 'Cartoon girl about 11 years old, dark-brown skin, curly hair in two puffs, purple jacket, cheerful expression' },
  { name: 'Lucas', desc: 'Cartoon boy about 11 years old, tan skin, short wavy dark-brown hair, blue t-shirt, holding a soccer ball, happy grin' },
];
const WORD_PROMPTS = [['brazil', 'Brazil', '브라질'], ['egypt', 'Egypt', '이집트'], ['france', 'France', '프랑스'], ['korea', 'Korea', '한국'], ['thailand', 'Thailand', '태국'], ['us', 'U.S.', '미국']]
  .map(([key, en, ko]) => ({ kind: 'word', key, en, ko, prompt: `Show the national flag of ${en === 'U.S.' ? 'the United States' : en} waving on a small flagpole (the flag only, no text).` }));
module.exports = { SCENES: rows, CHARS, WORD_PROMPTS };
