// QR컨텐츠(9) 탭 = 교과서 QR 음원·영상 스크립트 (교과서 원문). lesson_no, title, body, memo(활동 메모), remark(Mango 변경 여부)
const n = (s) => s.replace(/[’‘]/g, "'").replace(/(\d)won\b/g, '$1 won').split('\n').map((l) => l.trim()).filter((l) => l !== '').join('\n');
const CH = '유사하게 변경 필요';
const rows = [
  [1, '음원1', 'How much is this jacket?\nIt’s ten thousand won.', "단원의 주제를 소개하기 위한 영상\n(1차시의 학습목표가 '말을 듣고 이해하기'로 규정)", ''],
  [1, '음원2', 'May I help you?\nYes, please\nHow much are these shoes?\nThey’re forty thousand won.', '', ''],
  [1, '영상 (1/2)', 'Let’s buy things for our hiking trip this weekend\nI love shopping\nDad, we can buy things on this note.\nMay I help you\nYes, please\nI’m looking for some shorts.\nWe have many cool shorts here.\nHow about these shorts\nThey’re nice.\nI like the color.\nHow much are these shorts?\nThey’re 15,000 won.\nGood.\nI’ll take them ', '', CH],
  [1, '영상 (2/2)', 'This hat is nice\nIt’s only 5,000 won\nLook at these socks.\nThey’ll be great for hiking\nI’ll take them, too.\n40,000 won?\nHow much are these socks?\nThey’re 20,000 won.\n20,000won for socks?\nOh, no', '', CH],
  [2, '영상1', "They're so funny\nLook at these sunglasses.\nThey look like mouse.\nThey're so funny\nMay I try them on?\nSure, go ahead.\nHow much are these sunglasses?\nThey're 3,000 won.\nThey're on sale.\nCool.\nI'll take them.", 'Look and speak 영상\n(영상을 보고, 한글로 질문2를 함)\n\n1)민서가 고른 선글라스의 가격은 얼마인가요?\n2) 점원이 Pablo에게 도움을 제안할 때,뭐라고 말했나요?', CH],
  [2, '영상2', "May I help you?\nYes, please\nI'm looking for a jacket.\nHow much is this jacket?\nIt's 15,000 won.\nTry on the jacket with these sunglasses.\nWow. You look great.", '', CH],
  [2, '영상3', "May I help you?\nYes, please.\nHow much are these socks?\nThey're 2,000 won.", 'Speak more 영상 (교재에 있음)', ''],
  [5, '음원', "Hello.\nWe are group one.\nWelcome to the Funny hat shop.\nLook at this cat hat.\nIt has two ears.\nHow much is this hat?\nIt's 10,000 won.\nDo you like this hat?\nThank you very much.", 'Watch and think의 샘플영상', CH],
  [6, '1번 음원', "<no. 1>\nA : how much is this jacket\nB : it's thirty thousand won.\n<no. 2>\nA : How much are these shoes?\nB: They're fifty thousand won.", '', ''],
  [6, '2번 음원', "<no. 1>\nA : How much is this hat?\nB : It's fifteen thousand won.\n<no. 2>\nA: May I help you\nB: How much are these socks?\nA : They're ten thousand won.\n", '', ''],
  [6, '3번 음원', "<no. 1>\nA : How much are these sunglasses?\nB : They're twenty thousand won.\n<no. 2>\nA : May I help you\nB : yes please.\nA : How much are these shorts?\nB : They're twenty-five thousand won.", '', ''],
  [6, '4번 음원', "<no. 1>\nA : How much are these shoes?\nB: They're thirty thousand won.\n<no. 2>\nA : How much is this jacket?\nB : It's fifty thousand won.", '', ''],
];
module.exports = { SRC: rows.map(([lesson_no, title, body, memo, remark], i) => ({ lesson_no, sort: i + 1, title, body: n(body), memo, remark })) };
