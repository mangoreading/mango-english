import { useEffect, useState } from 'react';
import { ActivityItem, KINDS } from '@mango/schema';

type Obj = Record<string, any>;
type Col = { k: string; label: string; t: 'text' | 'area' | 'bool' | 'sel' | 'lines' | 're'; opts?: [string, string][]; w?: number; when?: (r: Obj) => boolean };
type Field =
  | { k: string; label: string; t: 'text' | 'area' | 'num' | 'bool' | 'lines' | 'tag' | 'words' | 'vwords' | 'vword'; help?: string; req?: boolean }
  | { k: string; label: string; t: 'rows'; cols: Col[]; blank: () => Obj; help?: string; req?: boolean }
  | { k: string; label: string; t: 'choices'; ans?: string; help?: string; req?: boolean }
  | { k: string; label: string; t: 'obj'; fields: Field[]; help?: string; req?: boolean };

export const KIND_NAME: Record<string, string> = {
  learn: '학습 카드', text: '지문', brief: '미션 안내', choose: '고르기', match: '짝 맞추기', build: '배열하기',
  fill: '빈칸 채우기', write: '쓰기', compose: '작문', speak: '말하기', fade: '점점 지우기', dialog: '대화',
  vcards: '단어 카드 보기', vtype1: '단어 따라 쓰기', vspell: '철자 완성', vmatch: '단어-뜻 매칭', vsound: '소리-단어 매칭', vwrite: '그림 보고 쓰기',
  wchoice: '뜻 고르기', pchoice: '그림 보고 고르기', dchoice: '대화 고르기', tf: 'True or False', lchtext: '듣고 고르기 (글 4칸)', lchpic: '듣고 고르기 (그림 4칸)', lchlist: '듣고 고르기 (세로형)',
  lookspeak: '그림 보고 말하기', saykor: '우리말 보고 영어로 말하기', lspeak: '듣고 대답하기', raloud: '따라 읽기 평가', role: '역할 나눠 말하기', present: '발표 영상 찍기', aitalk: 'AI 자유대화',
  sbuild: '문장 쓰기 (우리말→영어)', swrite: '정답 써 보기', sfill: '빈칸 단어 쓰기', dfill: '대화 완성하기', sscram: '문장 만들기', sorder: '문장 순서 맞추기',
  mwbank: '모범 글 완성 (보기)', scloze: '글 빈칸 채우기', lwrite: '듣고 쓰기', mfree: '나만의 글 쓰기', swrt: '글 요약·쓰기',
  goal: '학습목표', kexp: '핵심표현 듣고 따라 읽기', tapl: '문장 눌러 듣기', lsent: '문장 듣고 고르기(카드)', lcardp: '듣고 익히기 (그림)', lcardt: '듣고 익히기 (글)',
  scene: '장면 영상 보기', wrepeat: '단어 듣고 따라 말하기', sdrill: '문장 바꿔 말하기', pread: '글 듣고 읽기', mtext: '모범 글 읽기',
  lmatch: '듣고 짝짓기', sqchoice: '글 읽고 답하기 (선택)', sqtf: '글 읽고 답하기 (T/F)', sqmulti: '글 읽고 답하기 (복수선택)',
};
export interface VocabOpt { key: string; en: string; ko: string; image_path?: string | null }
export const TAGS: [string, string][] = [['vocab', '어휘'], ['expr', '표현'], ['listen', '듣기'], ['speak', '말하기'], ['read', '읽기'], ['write', '쓰기']];

const persona = (req: boolean): Field => ({ k: 'persona', label: '말하는 사람', t: 'obj', req, fields: [{ k: 'key', label: '인물 코드', t: 'text', req: true }, { k: 'line', label: '상황 한 줄', t: 'text', req: true }] });
const typed: Field[] = [
  { k: 'q', label: '문제', t: 'text' }, { k: 'ans', label: '정답', t: 'text', req: true }, { k: 'alts', label: '다른 정답(한 줄에 하나)', t: 'lines' },
  { k: 'ko', label: '한글 뜻', t: 'text' }, { k: 'fb', label: '정답 후 설명', t: 'text' }, { k: 'wide', label: '넓은 입력칸', t: 'bool' },
];

const VINST: Field = { k: 'inst', label: '안내 문구 (비우면 기본 문구)', t: 'text' };
const VW = (label = '단어 (순서대로)'): Field => ({ k: 'words', label, t: 'vwords', req: true });
const HINT: Field = { k: 'hint', label: '힌트 (한 줄에 하나, 비우면 힌트 버튼 없음)', t: 'lines' };
const OPTS: Field = { k: 'opts', label: '보기 (정답 선택)', t: 'choices', ans: 'a', req: true };
const STORY: Field[] = [
  { k: 'title', label: '글 제목', t: 'text' }, { k: 'text', label: '본문 (한 줄에 한 문장)', t: 'lines', req: true }, { k: 'ko', label: '한글 번역 (있으면 "해석 보기" 버튼)', t: 'area' },
];
const EXROWS = (label: string, pic = false, lab = false, grp = false): Field => ({ k: 'items', label, t: 'rows', req: true, blank: () => ({ en: '', ko: '' }), cols: [
  { k: 'en', label: '영어 (강조: [[파랑]] {{빨강}})', t: 'text' }, { k: 'ko', label: '한글', t: 'text' },
  ...(pic ? [{ k: 'pic', label: '그림(단원 단어)', t: 'text' as const, w: 120 }] : []), ...(lab ? [{ k: 'label', label: '설명 (오른쪽에 표시, 선택)', t: 'text' as const, w: 170 }] : []), ...(grp ? [{ k: 'group', label: '소제목 (같은 소제목끼리 묶임)', t: 'text' as const, w: 190 }] : [])] });
const SPEC2: Record<string, Field[]> = {
  goal: [{ k: 'title', label: '학습목표 (2~3줄 분량, 강조: [[파랑]])', t: 'area', req: true }, { k: 'ko', label: '학습목표 보충 설명 (선택)', t: 'text' }, { k: 'pic', label: '왼쪽 아래 그림 (선택: 단원 단어 key 또는 이미지 주소)', t: 'text' }, { k: 'head', label: '오른쪽 제목 (비우면 "핵심표현")', t: 'text' }, EXROWS('핵심표현 (최대 5~6개)', false, false, true), VINST],
  kexp: [EXROWS('핵심 표현 (말풍선, 최대 5개)', false, true), VINST],
  tapl: [EXROWS('문장 (눌러서 듣기)'), VINST],
  lsent: [EXROWS('문장 카드'), VINST],
  lcardp: [EXROWS('카드 (그림+문장, 최대 6개 권장)', true), VINST],
  lcardt: [EXROWS('카드 (문장, 최대 6개 권장)'), VINST],
  scene: [{ k: 'title', label: '제목 (선택)', t: 'text' },
    { k: 'scenes', label: '장면 (위에서 아래로 이어짐 · 그림은 단원 단어 key 또는 이미지 주소)', t: 'rows', req: true, blank: () => ({ who: '', en: '', ko: '', pic: '' }), cols: [{ k: 'who', label: '말하는 사람', t: 'text', w: 110 }, { k: 'en', label: '영어 대사', t: 'text' }, { k: 'ko', label: '한글 해석 (선택)', t: 'text' }, { k: 'pic', label: '그림', t: 'text', w: 160 }] },
    { k: 'sub', label: '자막 (en: 영어 · enko: 영어+한글 · none: 없음, 비우면 영어)', t: 'text' }, { k: 'replay', label: '다시 보기 횟수 (비우면 2)', t: 'num' }, { k: 'explain', label: '해설 (한 줄에 하나, 강조 [[파랑]] · 문항을 푼 뒤 "해석과 해설" 화면에 보여요)', t: 'lines' },
    { k: 'qs', label: '확인 문항 (선택, 영상을 다 본 뒤 풀어요)', t: 'rows', blank: () => ({ q: '', ans: '', wrong: [] }), cols: [{ k: 'q', label: '질문', t: 'text' }, { k: 'ans', label: '정답', t: 'text', w: 170 }, { k: 'wrong', label: '오답 (한 줄에 하나, 1~3개)', t: 'lines', w: 220 }] }, VINST],
  wrepeat: [VW('따라 말할 단어'), VINST],
  sdrill: [{ k: 'tpl', label: '문장 ({} 가 바꿔 넣을 자리, 예: How much are these {}?)', t: 'text', req: true }, { k: 'words', label: '바꿔 넣을 단어 (한 줄에 하나)', t: 'lines', req: true }, VINST],
  pread: [{ k: 'text', label: '본문 (한 줄에 한 문장, "---" 줄은 쪽 나눔)', t: 'lines', req: true }, { k: 'ko', label: '해설·번역 (쪽 나눔은 "---" 한 줄)', t: 'area' }, VINST],
  mtext: [{ k: 'title', label: '제목 (예: SALE)', t: 'text' }, { k: 'text', label: '본문 (한 줄에 한 문장, 강조 [[파랑]] {{빨강}})', t: 'lines', req: true }, { k: 'explain', label: '해설 (한 줄에 하나, 강조 가능)', t: 'lines' }, { k: 'ko', label: '해석(한글 번역)', t: 'area' }, VINST],
};
const ANSW = (label = '정답 (여러 정답은 | 로 구분)'): Field => ({ k: 'ans', label, t: 'text', req: true });
const SPEC3: Record<string, Field[]> = {
  sbuild: [{ k: 'ko', label: '우리말 문장', t: 'text' }, ANSW('정답 문장'), { k: 'alts', label: '다른 정답 (한 줄에 하나)', t: 'lines' }, { k: 'hint', label: '힌트 (비우면 첫 글자 힌트 자동)', t: 'lines' }, VINST],
  swrite: [{ k: 'ko', label: '우리말 문장', t: 'text' }, { k: 'tpl', label: '문장 틀 (캡슐에 보임, 빈칸은 {} 예: How much {} these socks?)', t: 'text' }, ANSW('정답 문장'), { k: 'alts', label: '다른 정답 (한 줄에 하나)', t: 'lines' }, { k: 'starter', label: '시작 힌트 (예: How much~)', t: 'text' }, { k: 'hint', label: '힌트 (비우면 자동)', t: 'lines' }, VINST],
  sfill: [{ k: 'ko', label: '우리말 뜻', t: 'text' }, { k: 'tpl', label: '문장 ({} 가 빈칸, 예: How much {} these socks?)', t: 'text', req: true }, ANSW('빈칸 정답'), { k: 'hint', label: '힌트 (비우면 자동)', t: 'lines' }, VINST],
  dfill: [{ k: 'pic', label: '그림(단원 단어, 선택)', t: 'vword' }, { k: 'tag2', label: '가격표 글자 (선택, 예: $60)', t: 'text' }, { k: 'lines', label: '대화 (한 줄에 한 문장, {} 가 빈칸)', t: 'lines', req: true }, { k: 'ans', label: '빈칸 정답 (빈칸 순서대로 한 줄에 하나, 여러 정답은 |)', t: 'lines', req: true }, { k: 'blankHints', label: '빈칸별 힌트 (빈칸 순서대로 한 줄에 하나. 학생이 그 빈칸을 할 차례에 보여요)', t: 'lines' }, { k: 'hint', label: '힌트', t: 'lines' }, VINST],
  sscram: [{ k: 'ko', label: '우리말 문장', t: 'text' }, ANSW('정답 문장'), { k: 'extra', label: '헷갈리게 섞을 단어 (한 줄에 하나, 선택)', t: 'lines' }, { k: 'alts', label: '다른 정답 (한 줄에 하나)', t: 'lines' }, { k: 'hint', label: '힌트', t: 'lines' }, VINST],
  sorder: [EXROWS('올바른 순서대로 입력 (화면에서는 섞여요)'), VINST],
  mwbank: [{ k: 'lines', label: '글 (한 줄에 한 문장, {} 가 빈칸)', t: 'lines', req: true }, { k: 'ans', label: '빈칸 정답 (빈칸 순서대로 한 줄에 하나)', t: 'lines', req: true }, { k: 'extra', label: '오답 보기 (한 줄에 하나, 선택)', t: 'lines' }, { k: 'blankHints', label: '빈칸별 힌트 (빈칸 순서대로 한 줄에 하나. 학생이 그 빈칸을 할 차례에 보여요)', t: 'lines' }, { k: 'hint', label: '힌트', t: 'lines' }, VINST],
  scloze: [{ k: 'lines', label: '글 (한 줄에 한 문장, {} 가 빈칸)', t: 'lines', req: true }, { k: 'ans', label: '빈칸 정답 (빈칸 순서대로 한 줄에 하나)', t: 'lines', req: true }, { k: 'extra', label: '오답 보기 (한 줄에 하나, 선택)', t: 'lines' }, { k: 'blankHints', label: '빈칸별 힌트 (빈칸 순서대로 한 줄에 하나. 학생이 그 빈칸을 할 차례에 보여요)', t: 'lines' }, { k: 'hint', label: '힌트', t: 'lines' }, VINST],
  lwrite: [{ k: 'q', label: '질문', t: 'text' }, { k: 'say', label: '들려줄 글 (전체)', t: 'area', req: true }, { k: 'h1', label: '왼쪽 열 제목 (비우면 시간)', t: 'text' }, { k: 'h2', label: '오른쪽 열 제목 (비우면 일과)', t: 'text' },
    { k: 'rows', label: '표 (오른쪽 글 · 왼쪽 정답)', t: 'rows', req: true, blank: () => ({ label: '', ans: '' }), cols: [{ k: 'label', label: '오른쪽 글', t: 'text' }, { k: 'ans', label: '정답 (예: 7:30)', t: 'text', w: 140 }] }, { k: 'hint', label: '힌트', t: 'lines' }, VINST],
  mfree: [{ k: 'topicLabel', label: '주제 칸 이름표 (비우면 상품, 학생이 직접 씀)', t: 'text' }, { k: 'lines', label: '글의 틀 (한 줄에 한 문장, {} 가 쓸 자리)', t: 'lines', req: true }, { k: 'lineHints', label: '줄별 힌트 (글의 틀과 같은 순서로 한 줄에 하나. 학생이 그 줄을 쓸 때 보여요)', t: 'lines' }, { k: 'hint', label: '전체 힌트 (줄별 힌트가 없을 때 보여요)', t: 'lines' }, VINST],
  swrt: [{ k: 'title', label: '체크리스트 제목', t: 'text' }, { k: 'rules', label: '체크 규칙 (쓰면 자동으로 켜져요)', t: 'rows', req: true, blank: () => ({ label: '' }), cols: [{ k: 'label', label: '규칙 설명', t: 'text' }, { k: 're', label: '찾을 패턴 (정규식, 예: how much)', t: 'text', w: 220 }] },
    { k: 'minSent', label: '최소 문장 수', t: 'num' }, { k: 'starter', label: '입력칸 안내 글', t: 'text' }, { k: 'hint', label: '힌트', t: 'lines' }, VINST],
};
const SPEC4: Record<string, Field[]> = {
  lookspeak: [{ k: 'pic', label: '그림(단원 단어)', t: 'vword' }, { k: 'label', label: '그림 이름표 (예: jacket)', t: 'text' }, { k: 'price', label: '가격표 글자 (예: $16,000)', t: 'text' }, { k: 'target', label: '말할 문장', t: 'text', req: true }, { k: 'pass', label: '통과 기준 0.3~1 (비우면 0.7)', t: 'num' }, { k: 'hint', label: '힌트', t: 'lines' }, VINST],
  saykor: [{ k: 'ko', label: '우리말 문장', t: 'text', req: true }, { k: 'koHl', label: '빨갛게 강조할 부분 (우리말 문장 안의 글자, 선택)', t: 'text' }, { k: 'target', label: '말할 영어 문장', t: 'text', req: true }, { k: 'pass', label: '통과 기준 0.3~1 (비우면 0.7)', t: 'num' }, { k: 'hint', label: '힌트', t: 'lines' }, VINST],
  lspeak: [{ k: 'ask', label: '들려줄 질문 (비우면 말할 문장)', t: 'text' }, { k: 'ko', label: '상황 설명 (예: Ken의 가게 / 선글라스 13,000원)', t: 'text' }, { k: 'target', label: '말할 대답 문장', t: 'text', req: true }, { k: 'pass', label: '통과 기준 0.3~1 (비우면 0.7)', t: 'num' }, { k: 'hint', label: '힌트', t: 'lines' }, VINST],
  raloud: [{ k: 'target', label: '따라 읽을 문장', t: 'text', req: true }, { k: 'stars', label: '정확도 별점 보이기 (옵션)', t: 'bool' }, { k: 'fluency', label: '유창성 별점 보이기 (옵션)', t: 'bool' }, VINST],
  role: [{ k: 'pic', label: '그림(단원 단어, 선택)', t: 'vword' }, { k: 'price', label: '가격표 글자 (선택)', t: 'text' }, { k: 'lines', label: '대화 (한 줄에 한 문장, "A: May I help you?" 형식, 강조 [[파랑]] {{빨강}})', t: 'lines', req: true }, VINST],
  present: [{ k: 'text', label: '발표 글 (한 줄에 한 문장, 강조 [[파랑]])', t: 'lines', req: true }, VINST],
  aitalk: [{ k: 'situation', label: '상황 (학생에게 보이는 글)', t: 'text', req: true }, { k: 'role', label: 'AI 역할 (예: 시계 가게 점원)', t: 'text' }, { k: 'open', label: 'AI 첫 말 (선택)', t: 'text' }, { k: 'turns', label: '대화 횟수 (비우면 대본 수)', t: 'num' },
    { k: 'script', label: 'AI 대본 (AI 연결이 없을 때 쓰는 답, 차례대로)', t: 'rows', blank: () => ({ ai: '' }), cols: [{ k: 'ai', label: 'AI 말', t: 'text' }, { k: 'hint', label: '학생에게 줄 힌트', t: 'text', w: 240 }] }, VINST],
};
const SPEC: Record<string, Field[]> = {
  ...SPEC2,
  ...SPEC4,
  ...SPEC3,
  wchoice: [{ k: 'word', label: '단어', t: 'vword', req: true }, { k: 'dir', label: '방향 (en2ko: 영어→뜻(기본), ko2en: 뜻→영어)', t: 'text' }, { k: 'wrong', label: '오답 보기 (한 줄에 하나, 1~5개)', t: 'lines', req: true }, VINST],
  pchoice: [{ k: 'pic', label: '그림(단원 단어)', t: 'vword', req: true }, { k: 'q', label: '질문 (비우면 기본 문구)', t: 'text' }, OPTS, HINT, VINST],
  dchoice: [{ k: 'q', label: '질문', t: 'text' }, { k: 'pic', label: '그림(단원 단어, 선택)', t: 'vword' }, { k: 'lines', label: '대화 (한 줄에 한 문장)', t: 'lines' }, OPTS, VINST],
  tf: [{ k: 'lines', label: '대화·글 (선택, 한 줄에 한 문장)', t: 'lines' }, { k: 'stmt', label: '판단할 문장', t: 'text', req: true }, { k: 'a', label: '정답이 True 예요', t: 'bool' }, HINT, VINST],
  lchtext: [{ k: 'q', label: '질문', t: 'text' }, { k: 'say', label: '들려줄 문장', t: 'text', req: true }, OPTS, HINT, VINST],
  lchpic: [{ k: 'q', label: '질문', t: 'text' }, { k: 'say', label: '들려줄 문장', t: 'text', req: true }, OPTS, HINT, VINST],
  lchlist: [{ k: 'q', label: '질문', t: 'text' }, { k: 'say', label: '들려줄 문장', t: 'text', req: true }, OPTS, HINT, VINST],
  lmatch: [{ k: 'pairs', label: '짝 (왼쪽 이름 · 들려줄 말 · 오른쪽 정답)', t: 'rows', req: true, blank: () => ({ left: '', right: '' }), cols: [{ k: 'left', label: '왼쪽(소리)', t: 'text', w: 160 }, { k: 'say', label: '들려줄 말 (비우면 왼쪽 글)', t: 'text' }, { k: 'right', label: '오른쪽 짝', t: 'text', w: 200 }] }, VINST],
  sqchoice: [...STORY, { k: 'q', label: '질문', t: 'text', req: true }, OPTS, HINT, VINST],
  sqtf: [...STORY, { k: 'q', label: '질문 (비우면 기본 문구)', t: 'text' }, { k: 'items', label: '판단할 문장들', t: 'rows', req: true, blank: () => ({ t: '' }), cols: [{ k: 't', label: '문장', t: 'text' }, { k: 'a', label: '정답이 T', t: 'bool', w: 80 }] }, HINT, VINST],
  sqmulti: [...STORY, { k: 'q', label: '질문 (비우면 기본 문구)', t: 'text' }, { k: 'items', label: '보기들 (정답 모두 체크)', t: 'rows', req: true, blank: () => ({ t: '' }), cols: [{ k: 't', label: '보기', t: 'text' }, { k: 'ok', label: '정답', t: 'bool', w: 70 }] }, HINT, VINST],
  vcards: [VW('카드에 넣을 단어'), VINST],
  vtype1: [VW('따라 쓸 단어'), VINST],
  vspell: [{ k: 'word', label: '단어', t: 'vword', req: true }, { k: 'shown', label: '처음부터 보여줄 글자 수 (비우면 절반)', t: 'num' }, { k: 'extra', label: '헷갈리게 섞을 글자 (선택, 예: xz)', t: 'text' }, VINST],
  vmatch: [VW('매칭할 단어'), VINST],
  vsound: [VW('매칭할 단어'), VINST],
  vwrite: [VW('쓸 단어'), VINST],
  learn: [
    { k: 'title', label: '제목', t: 'text', req: true },
    { k: 'cards', label: '카드', t: 'rows', req: true, blank: () => ({ en: '', ko: '' }), cols: [
      { k: 'flag', label: '그림 코드', t: 'text', w: 100 }, { k: 'en', label: '영어', t: 'text' }, { k: 'ko', label: '한글', t: 'text' }, { k: 'say', label: '읽어줄 문장', t: 'text' }] },
  ],
  text: [
    { k: 'title', label: '제목', t: 'text' }, { k: 'text', label: '영어 지문', t: 'area', req: true }, { k: 'ko', label: '한글 번역', t: 'area' }, { k: 'book', label: '출처(원서 코드)', t: 'text' },
  ],
  brief: [
    { k: 'title', label: '제목', t: 'text', req: true }, { k: 'text', label: '안내 문장', t: 'area', req: true }, { k: 'people', label: '등장 인물 코드(한 줄에 하나)', t: 'lines' },
  ],
  choose: [
    { k: 'q', label: '문제', t: 'area', req: true },
    { k: 'opts', label: '보기 (정답 선택)', t: 'choices', ans: 'a', req: true },
    { k: 'say', label: '들려줄 문장(듣기 문제)', t: 'text' }, { k: 'script', label: '들려줄 대화(한 줄에 하나)', t: 'lines' },
    { k: 'blank', label: '문제 속 빈칸 표시', t: 'bool' }, { k: 'bubble', label: '말풍선 문장', t: 'text' }, { k: 'pic', label: '그림 코드', t: 'text' }, { k: 'fb', label: '정답 후 설명', t: 'text' },
  ],
  match: [
    { k: 'title', label: '제목', t: 'text', req: true },
    { k: 'pairs', label: '왼쪽 항목 (그림코드 / 들려줄 말)', t: 'rows', req: true, blank: () => ({ key: '', say: '' }), cols: [{ k: 'key', label: '그림 코드', t: 'text', w: 140 }, { k: 'say', label: '들려줄 문장', t: 'text' }] },
    { k: 'right', label: '오른쪽 보기 (한 줄에 하나, 왼쪽과 같은 순서)', t: 'lines', req: true },
  ],
  build: [
    { k: 'ko', label: '한글 뜻', t: 'text' }, { k: 'ans', label: '정답 문장', t: 'text', req: true }, { k: 'words', label: '섞을 단어 (공백으로 구분)', t: 'words', req: true },
  ],
  fill: typed, write: typed,
  compose: [
    { k: 'title', label: '제목', t: 'text', req: true }, { k: 'kind', label: '종류 메모', t: 'text' }, persona(false),
    { k: 'rules', label: '체크 규칙', t: 'rows', req: true, blank: () => ({ label: '' }), cols: [{ k: 'label', label: '규칙 설명', t: 'text' }, { k: 're', label: '패턴(정규식)', t: 're' }] },
    { k: 'minSent', label: '최소 문장 수', t: 'num' }, { k: 'sample', label: '예시 답안', t: 'area', req: true }, { k: 'starter', label: '시작 문장', t: 'text' }, { k: 'tip', label: '팁', t: 'text' },
  ],
  speak: [
    { k: 'prompt', label: '안내 문구', t: 'text' }, { k: 'target', label: '따라 말할 문장', t: 'text', req: true }, { k: 'disp', label: '화면 표시 문장(다르게 보일 때)', t: 'text' },
    { k: 'accept', label: '인정 답(한 줄에 하나)', t: 'lines' }, { k: 'ask', label: '먼저 들려줄 질문', t: 'text' },
    { k: 'hide', label: '문장 숨기기', t: 'bool' }, { k: 'listen', label: '먼저 듣기', t: 'bool' }, { k: 'autoplay', label: '자동 재생', t: 'bool' },
  ],
  fade: [
    { k: 'target', label: '목표 문장', t: 'text', req: true }, { k: 'ask', label: '먼저 들려줄 질문', t: 'text' }, { k: 'accept', label: '인정 답(한 줄에 하나)', t: 'lines' },
    { k: 'q1', label: '1단계 문구', t: 'text' }, { k: 'prompt3', label: '3단계 문구', t: 'text' }, { k: 'opts', label: '보기 (정답 선택)', t: 'choices', ans: 'a' }, { k: 'fb', label: '정답 후 설명', t: 'text' },
  ],
  dialog: [
    persona(true),
    { k: 'ai', label: 'AI 상대', t: 'obj', fields: [{ k: 'key', label: '인물 코드', t: 'text' }, { k: 'shop', label: '가게 역할', t: 'bool' }] },
    { k: 'turns', label: '대화 순서', t: 'rows', req: true, blank: () => ({ who: 'ai', text: '' }), cols: [
      { k: 'who', label: '누가', t: 'sel', opts: [['ai', 'AI'], ['me', '나']], w: 70 },
      { k: 'text', label: 'AI 말', t: 'text', when: (r) => r.who === 'ai' },
      { k: 'accept', label: '인정 답(한 줄에 하나)', t: 'lines', when: (r) => r.who === 'me' },
      { k: 'opts', label: '보기(한 줄에 하나, 선택)', t: 'lines', when: (r) => r.who === 'me' },
      { k: 're', label: '패턴(정규식)', t: 're', when: (r) => r.who === 'me' }] },
    { k: 'free', label: '자유 대화', t: 'obj', fields: [{ k: 'n', label: '자유 대화 횟수', t: 'num' }] },
  ],
};
/** 오른쪽 위 보조 그림(선택)을 쓸 수 있는 템플릿 */
for (const k of ['tf', 'lchtext', 'lchlist', 'sqchoice', 'sqtf', 'sqmulti', 'pread', 'mtext', 'aitalk', 'mfree', 'saykor', 'lspeak', 'raloud', 'sbuild', 'swrite', 'sscram', 'sfill', 'mwbank', 'scloze', 'swrt', 'sdrill', 'present', 'lwrite', 'sorder'])
  if (SPEC[k] && !SPEC[k].some((f) => f.k === 'pic')) SPEC[k] = [...SPEC[k], { k: 'pic', label: '보조 그림 (단원 단어, 선택)', t: 'vword' }];
const COMMON: Field[] = [
  { k: 'tag', label: '영역', t: 'tag' }, { k: 'lo', label: '학습목표 코드', t: 'text' }, { k: 'flag', label: '상황 그림 코드', t: 'text' },
  { k: 'ctx', label: '말하는 사람 카드', t: 'obj', fields: [{ k: 'key', label: '인물 코드', t: 'text' }, { k: 'line', label: '상황 한 줄', t: 'text' }] },
];

/** 한 템플릿의 입력 항목 목록 (관리자 '활동 템플릿' 화면에서 보여 준다) */
export function specOf(kind: string): { label: string; req: boolean; type: string }[] {
  const T: Record<string, string> = { text: '한 줄 글', area: '여러 줄 글', num: '숫자', bool: '체크', lines: '여러 줄 목록', tag: '선택', words: '단어 나열', vwords: '단원 단어 고르기', vword: '단원 단어 하나', rows: '표(여러 행)', choices: '보기 목록', obj: '묶음' };
  return (SPEC[kind] ?? []).map((f) => ({ label: f.label.replace(/\s*\(.*\)\s*$/, ''), req: !!f.req, type: T[f.t] ?? f.t }));
}

export function defaultItem(kind: string): Obj {
  switch (kind) {
    case 'learn': return { k: 'learn', title: '', cards: [{ en: '', ko: '' }] };
    case 'text': return { k: 'text', text: '' };
    case 'brief': return { k: 'brief', title: '', text: '', people: [] };
    case 'choose': return { k: 'choose', q: '', opts: [{ t: '' }, { t: '' }, { t: '' }], a: 0 };
    case 'match': return { k: 'match', title: '', pairs: [{ key: '', say: '' }, { key: '', say: '' }], right: ['', ''] };
    case 'build': return { k: 'build', ans: '', words: [] };
    case 'fill': case 'write': return { k: kind, ans: '' };
    case 'compose': return { k: 'compose', title: '', rules: [{ label: '' }], minSent: 1, sample: '' };
    case 'vcards': case 'vtype1': case 'vmatch': case 'vsound': case 'vwrite': return { k: kind, tag: 'vocab', words: [] };
    case 'vspell': return { k: 'vspell', tag: 'vocab', word: '' };
    case 'lookspeak': case 'lspeak': case 'raloud': return { k: kind, tag: 'speak', target: '' };
    case 'saykor': return { k: 'saykor', tag: 'speak', ko: '', target: '' };
    case 'role': return { k: 'role', tag: 'speak', lines: [] };
    case 'present': return { k: 'present', tag: 'speak', text: [] };
    case 'scene': return { k: 'scene', tag: 'listen', scenes: [{ who: '', en: '', ko: '', pic: '' }, { who: '', en: '', ko: '', pic: '' }] };
    case 'aitalk': return { k: 'aitalk', tag: 'speak', situation: '', script: [{ ai: '' }] };
    case 'sbuild': case 'swrite': return { k: kind, tag: 'write', ans: '' };
    case 'sfill': return { k: 'sfill', tag: 'write', tpl: '{}', ans: '' };
    case 'dfill': return { k: 'dfill', tag: 'write', lines: [], ans: [] };
    case 'sscram': return { k: 'sscram', tag: 'write', ans: '' };
    case 'sorder': return { k: 'sorder', tag: 'write', items: [{ en: '', ko: '' }, { en: '', ko: '' }] };
    case 'mwbank': case 'scloze': return { k: kind, tag: kind === 'scloze' ? 'read' : 'write', lines: [], ans: [] };
    case 'lwrite': return { k: 'lwrite', tag: 'listen', say: '', rows: [{ label: '', ans: '' }] };
    case 'mfree': return { k: 'mfree', tag: 'write', lines: [] };
    case 'swrt': return { k: 'swrt', tag: 'write', rules: [{ label: '' }] };
    case 'goal': return { k: 'goal', tag: 'expr', title: '', items: [{ en: '', ko: '' }] };
    case 'kexp': case 'tapl': case 'lsent': case 'lcardp': case 'lcardt': return { k: kind, tag: kind === 'tapl' ? 'speak' : 'listen', items: [{ en: '', ko: '' }, { en: '', ko: '' }] };
    case 'wrepeat': return { k: 'wrepeat', tag: 'vocab', words: [] };
    case 'sdrill': return { k: 'sdrill', tag: 'speak', tpl: '{}', words: [] };
    case 'pread': return { k: 'pread', tag: 'read', text: [] };
    case 'mtext': return { k: 'mtext', tag: 'write', text: [] };
    case 'wchoice': return { k: 'wchoice', tag: 'vocab', word: '', dir: 'en2ko', wrong: [] };
    case 'pchoice': return { k: 'pchoice', tag: 'vocab', pic: '', opts: [{ t: '' }, { t: '' }, { t: '' }, { t: '' }], a: 0 };
    case 'dchoice': return { k: 'dchoice', tag: 'read', lines: [], opts: [{ t: '' }, { t: '' }, { t: '' }, { t: '' }], a: 0 };
    case 'tf': return { k: 'tf', tag: 'read', stmt: '' };
    case 'lchtext': case 'lchpic': case 'lchlist': return { k: kind, tag: 'listen', say: '', opts: [{ t: '' }, { t: '' }, { t: '' }, { t: '' }], a: 0 };
    case 'lmatch': return { k: 'lmatch', tag: 'listen', pairs: [{ left: '', right: '' }, { left: '', right: '' }] };
    case 'sqchoice': return { k: 'sqchoice', tag: 'read', text: [], q: '', opts: [{ t: '' }, { t: '' }, { t: '' }, { t: '' }], a: 0 };
    case 'sqtf': return { k: 'sqtf', tag: 'read', text: [], items: [{ t: '' }, { t: '' }] };
    case 'sqmulti': return { k: 'sqmulti', tag: 'read', text: [], items: [{ t: '' }, { t: '' }, { t: '' }] };
    case 'speak': return { k: 'speak', target: '' };
    case 'fade': return { k: 'fade', target: '' };
    default: return { k: 'dialog', persona: { key: '', line: '' }, turns: [{ who: 'ai', text: '' }, { who: 'me', accept: [] }] };
  }
}

const blankish = (v: unknown) => v === '' || v == null || (Array.isArray(v) && v.length === 0);
const pathOf = (f: Field) => f.k;
function allFields(kind: string): Field[] { return [...(SPEC[kind] ?? []), ...COMMON]; }

/** 검증: JSON 오류를 한글 안내로 바꿔 돌려준다 */
export function validate(obj: Obj): { ok: boolean; problems: string[] } {
  const r = ActivityItem.safeParse(obj);
  if (r.success) return { ok: true, problems: [] };
  const fields = allFields(obj.k);
  const out: string[] = [];
  for (const i of r.error.issues) {
    const p = i.path.map(String);
    let label = '';
    let list: Field[] | undefined = fields; let colList: Col[] | undefined;
    const parts: string[] = [];
    for (const seg of p) {
      if (/^\d+$/.test(seg)) { parts.push(`${Number(seg) + 1}번째`); continue; }
      const f: any = list?.find((x) => x.k === seg) ?? colList?.find((x) => x.k === seg);
      parts.push(f?.label ?? seg);
      list = f?.fields; colList = f?.cols;
    }
    label = parts.join(' › ') || '문항';
    let msg = i.message;
    if (i.code === 'invalid_type' && (i as any).received === 'undefined') msg = '비어 있어요';
    else if (i.code === 'invalid_type') msg = '형식이 맞지 않아요';
    else if (i.code === 'too_small') msg = (i as any).type === 'string' ? '비어 있어요' : `최소 ${(i as any).minimum}개가 필요해요`;
    else if (i.code === 'invalid_union') msg = '형식이 맞지 않아요';
    out.push(`${label}: ${msg}`);
  }
  return { ok: false, problems: [...new Set(out)].slice(0, 8) };
}

export function ItemForm({ obj, onChange, keys, vocab }: { obj: Obj; onChange: (o: Obj) => void; keys: string[]; vocab: VocabOpt[] }) {
  const set = (k: string, v: unknown) => { const n = { ...obj }; if (blankish(v)) delete n[k]; else n[k] = v; onChange(n); };
  return (
    <div className="mx-form">
      <datalist id="mx-keys">{keys.map((k) => <option key={k} value={k} />)}</datalist>
      {(SPEC[obj.k] ?? []).map((f) => <FieldRow key={pathOf(f)} f={f} v={obj[f.k]} root={obj} set={set} vocab={vocab} />)}
      <details className="mx-more"><summary>공통 항목 (영역·학습목표·그림·말하는 사람)</summary>
        {COMMON.map((f) => <FieldRow key={pathOf(f)} f={f} v={obj[f.k]} root={obj} set={set} />)}
      </details>
    </div>
  );
}

function FieldRow({ f, v, root, set, vocab }: { f: Field; v: any; root: Obj; set: (k: string, v: unknown) => void; vocab?: VocabOpt[] }) {
  const lab = <span className="mx-fl">{f.label}{f.req && <em>*</em>}</span>;
  if (f.t === 'bool') return <label className="mx-f mx-chk"><input type="checkbox" checked={!!v} onChange={(e) => set(f.k, e.target.checked ? true : undefined)} />{f.label}</label>;
  if (f.t === 'text') return <label className="mx-f">{lab}<input list={/그림|code|flag|key|인물/i.test(f.label) || f.k === 'flag' ? 'mx-keys' : undefined} value={v ?? ''} onChange={(e) => set(f.k, e.target.value)} /></label>;
  if (f.t === 'area') return <label className="mx-f">{lab}<textarea className="mx-ta" value={v ?? ''} onChange={(e) => set(f.k, e.target.value)} /></label>;
  if (f.t === 'vword') return (
    <label className="mx-f">{lab}<select value={v ?? ''} onChange={(e) => set(f.k, e.target.value || undefined)}>
      <option value="">(단어 선택)</option>{(vocab ?? []).map((w) => <option key={w.key} value={w.key}>{w.en} · {w.ko}</option>)}
      {v && !(vocab ?? []).some((w) => w.key === v) && <option value={v}>{v} (단원 어휘에 없음)</option>}</select></label>
  );
  if (f.t === 'vwords') {
    const sel: string[] = v ?? []; const rest = (vocab ?? []).filter((w) => !sel.includes(w.key));
    const info = (k: string) => (vocab ?? []).find((w) => w.key === k);
    return (
      <div className="mx-f">{lab}
        {!(vocab ?? []).length && <p className="mx-err">이 단원에 등록된 단어가 없어요. "단어" 탭에서 먼저 단어를 추가해 주세요.</p>}
        <table className="mx-mini"><tbody>{sel.map((k, i) => (
          <tr key={k + i}><td style={{ width: 28 }}>{i + 1}</td><td>{info(k) ? <>{info(k)!.en} <span className="mx-muted">{info(k)!.ko}</span></> : <span className="mx-err">{k} (단원 어휘에 없음)</span>}</td>
            <td className="mx-act">
              <button type="button" className="mx-btn sec" disabled={i === 0} onClick={() => { const n = [...sel]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set(f.k, n); }}>↑</button>
              <button type="button" className="mx-btn sec" onClick={() => set(f.k, sel.filter((_, j) => j !== i))}>×</button></td></tr>))}</tbody></table>
        <div className="mx-row">
          <select value="" onChange={(e) => { if (e.target.value) set(f.k, [...sel, e.target.value]); }}><option value="">+ 단어 추가…</option>{rest.map((w) => <option key={w.key} value={w.key}>{w.en} · {w.ko}</option>)}</select>
          <button type="button" className="mx-btn sec" disabled={!rest.length} onClick={() => set(f.k, [...sel, ...rest.map((w) => w.key)])}>남은 단어 모두 추가</button>
        </div>
      </div>
    );
  }
  if (f.t === 'num') return <label className="mx-f">{lab}<input type="number" min={0} style={{ width: 90 }} value={v ?? ''} onChange={(e) => set(f.k, e.target.value === '' ? undefined : Number(e.target.value))} /></label>;
  if (f.t === 'tag') return <label className="mx-f">{lab}<select value={v ?? ''} onChange={(e) => set(f.k, e.target.value || undefined)}><option value="">(없음)</option>{TAGS.map(([a, b]) => <option key={a} value={a}>{b}</option>)}</select></label>;
  if (f.t === 'lines') return <label className="mx-f">{lab}<Lines v={v} onChange={(a) => set(f.k, a)} /></label>;
  if (f.t === 'words') return (
    <div className="mx-f">{lab}
      <div className="mx-row"><input style={{ flex: 1 }} value={(v ?? []).join(' ')} onChange={(e) => set(f.k, e.target.value.split(/\s+/).filter(Boolean))} />
        <button type="button" className="mx-btn sec" onClick={() => set(f.k, String(root.ans ?? '').split(/\s+/).filter(Boolean).sort(() => Math.random() - 0.5))}>정답에서 섞어 만들기</button></div>
    </div>
  );
  if (f.t === 'obj') {
    const o = v ?? {};
    const setSub = (k: string, x: unknown) => { const n = { ...o }; if (blankish(x)) delete n[k]; else n[k] = x; set(f.k, Object.keys(n).length || f.req ? n : undefined); };
    return <fieldset className="mx-fs"><legend>{f.label}{f.req && <em>*</em>}</legend>{f.fields.map((s) => <FieldRow key={s.k} f={s} v={o[s.k]} root={o} set={setSub} />)}</fieldset>;
  }
  if (f.t === 'choices') {
    const opts: { t: string; flag?: string }[] = v ?? [];
    const upd = (i: number, patch: Obj) => { const n = opts.map((o, j) => (j === i ? { ...o, ...patch } : o)).map((o) => (o.flag === '' ? { t: o.t } : o)); set(f.k, n); };
    const ans = f.ans ? (root[f.ans] as number | undefined) : undefined;
    return (
      <div className="mx-f">{lab}
        <table className="mx-mini"><thead><tr>{f.ans && <th style={{ width: 40 }}>정답</th>}<th>보기</th><th style={{ width: 120 }}>그림 코드</th><th style={{ width: 36 }} /></tr></thead>
          <tbody>{opts.map((o, i) => (
            <tr key={i}>
              {f.ans && <td><input type="radio" checked={ans === i} onChange={() => set(f.ans!, i)} /></td>}
              <td><input className="mx-cell" value={o.t} onChange={(e) => upd(i, { t: e.target.value })} /></td>
              <td><input className="mx-cell" list="mx-keys" value={o.flag ?? ''} onChange={(e) => upd(i, { flag: e.target.value })} /></td>
              <td><button type="button" className="mx-btn sec" onClick={() => { set(f.k, opts.filter((_, j) => j !== i)); if (f.ans && ans != null && ans >= i && ans > 0) set(f.ans, ans === i ? 0 : ans - 1); }}>×</button></td>
            </tr>))}</tbody></table>
        <button type="button" className="mx-btn sec" onClick={() => set(f.k, [...opts, { t: '' }])}>+ 보기 추가</button>
      </div>
    );
  }
  const rf = f as Extract<Field, { t: 'rows' }>;
  const rows: Obj[] = v ?? [];
  const updRow = (i: number, patch: Obj) => set(f.k, rows.map((r, j) => {
    if (j !== i) return r;
    const n = { ...r, ...patch };
    Object.keys(n).forEach((k) => { if (blankish(n[k]) && k !== 'who' && !rf.cols.find((c) => c.k === k && ['en', 'ko', 'key', 'say', 'label', 'text'].includes(k))) delete n[k]; });
    if (patch.who === 'ai') return { who: 'ai', text: n.text ?? '' };
    if (patch.who === 'me') return { who: 'me', accept: n.accept ?? [] };
    return n;
  }));
  return (
    <div className="mx-f">{lab}
      <table className="mx-mini"><thead><tr><th style={{ width: 28 }}>#</th>{rf.cols.map((c) => <th key={c.k} style={c.w ? { width: c.w } : undefined}>{c.label}</th>)}<th style={{ width: 80 }} /></tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i}><td>{i + 1}</td>
            {rf.cols.map((c) => <td key={c.k}>{c.when && !c.when(r) ? '' : <Cell c={c} r={r} onChange={(x) => updRow(i, { [c.k]: x })} />}</td>)}
            <td className="mx-act">
              <button type="button" className="mx-btn sec" disabled={i === 0} onClick={() => { const n = [...rows]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set(f.k, n); }}>↑</button>
              <button type="button" className="mx-btn sec" onClick={() => set(f.k, rows.filter((_, j) => j !== i))}>×</button>
            </td></tr>))}</tbody></table>
      <button type="button" className="mx-btn sec" onClick={() => set(f.k, [...rows, rf.blank()])}>+ 행 추가</button>
    </div>
  );
}

function Cell({ c, r, onChange }: { c: Col; r: Obj; onChange: (v: unknown) => void }) {
  const v = r[c.k];
  if (c.t === 'sel') return <select value={v ?? ''} onChange={(e) => onChange(e.target.value)}>{c.opts!.map(([a, b]) => <option key={a} value={a}>{b}</option>)}</select>;
  if (c.t === 'bool') return <input type="checkbox" checked={!!v} onChange={(e) => onChange(e.target.checked || undefined)} />;
  if (c.t === 'lines') return <Lines v={v} onChange={onChange} rows={2} />;
  if (c.t === 're') return <input className="mx-cell" placeholder="예: how much" value={v?.source ?? ''} onChange={(e) => onChange(e.target.value ? { source: e.target.value, flags: v?.flags ?? 'i' } : undefined)} />;
  return <input className="mx-cell" list={c.k === 'key' || c.k === 'flag' ? 'mx-keys' : undefined} value={v ?? ''} onChange={(e) => onChange(e.target.value)} />;
}

/** 한 줄에 하나씩 입력하는 목록 칸. 입력 중 원문(빈 줄 포함)을 따로 보관하고, 바깥에서 값이 바뀌면 다시 맞춘다 */
function Lines({ v, onChange, rows }: { v?: string[]; onChange: (a: string[]) => void; rows?: number }) {
  const parse = (x: string) => x.split('\n').map((q) => q.trim()).filter(Boolean);
  const joined = (v ?? []).join('\n');
  const [t, setT] = useState(joined);
  useEffect(() => { if (parse(t).join('\n') !== joined) setT(joined); /* eslint-disable-next-line */ }, [joined]);
  return <textarea className="mx-ta" rows={rows ?? 3} value={t} onChange={(e) => { setT(e.target.value); onChange(parse(e.target.value)); }} />;
}
export { KINDS };
