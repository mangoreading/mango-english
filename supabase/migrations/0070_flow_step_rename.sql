-- 0070: 템플릿 이름이 바뀐 것을 흐름(flow_steps)에도 반영 — 대화 완성하기 → 대화 완성하기 (그림)
-- 단계 이름이 예전 기본 이름 그대로인 것만 바꾼다(사용자가 따로 고친 이름은 그대로 둔다)
update public.flow_steps set name_ko = '대화 완성하기 (그림)' where kind = 'dfill' and name_ko = '대화 완성하기';
update public.flow_steps set name_en = 'Complete the Dialogue (Picture)' where kind = 'dfill' and name_en = 'Complete the Dialogue';
