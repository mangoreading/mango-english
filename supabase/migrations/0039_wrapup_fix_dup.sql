-- 0039: 6차시 읽기 체크 3번째 문항이 4차시 문항과 같은 질문이라 다른 질문으로 교체
update public.items i set payload = i.payload || '{"q":"Who says, \"May I help you?\"","opts":[{"t":"Mina"},{"t":"Ken"},{"t":"Sora"},{"t":"the clerk"}],"a":0,"pic":"socks","hint":["Ken comes to her shop. Mina says, \"May I help you?\""]}'::jsonb
where i.lesson = 6 and i.template = 'sqchoice' and i.act_idx = 202 and i.status = 'draft'
  and i.payload->>'q' = 'How much are the socks?';
