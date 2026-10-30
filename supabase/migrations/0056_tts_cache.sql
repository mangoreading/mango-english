-- 0056: 만든 음성(TTS) 저장소. 서버 함수(tts)만 읽고 쓴다(정책 없음 = 일반 사용자 접근 불가).
insert into storage.buckets (id, name, public, file_size_limit) values ('tts-cache', 'tts-cache', false, 5242880) on conflict (id) do nothing;
