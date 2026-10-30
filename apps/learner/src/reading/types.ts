export interface RChar { name: string; emoji: string; tag: string; desc: string }
export interface RPhonics { letter: string; hint: string; cvc?: { word: string; pic: string }[]; rhyme?: string[] }
export interface RKey { emoji: string; word: string; spell: string; kor: string; scene: string }
export interface RPage { img: string; text: string }
export interface RQuiz { q: string; options: { label: string; pic: string; correct?: boolean }[] }
export interface RSpeak { text: string; kor: string; emoji: string }
export interface RContent {
  warmup: { title: string; lead: string; characters: RChar[] };
  phonics: RPhonics[]; keyWords: RKey[]; pages: RPage[]; quizzes: RQuiz[]; traceSentences: string[]; speakSentences: RSpeak[];
}
export interface RBook { id: string; code: string; level: 'PRE' | 'BASIC'; title: string; emoji: string | null; week: number; ord: number; ar: string | null; cover_path: string | null; content: RContent }
export interface RProg { book_id: string; step_reached: number; completed: boolean; taps: number; quiz_ok: number; quiz_total: number; speak_stars: number; updated_at: string }
export const STEPS = ['Warm Up', 'Phonics', 'Key Words', 'Read Aloud', 'Quiz', 'Write', 'Speak', 'Portfolio', 'Celebrate'] as const;
export const STEP_KO = ['표지와 친구들', '소리 찾기', '핵심 단어', '책 읽기', '퀴즈', '문장 만들기', '말해 보기', '내 목소리 녹화', '축하해요'];
