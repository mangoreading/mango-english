-- 0007: 흐름에서 차시를 8개 넘게 만들 수 있으므로 items.lesson 범위를 1~20으로 넓힌다.
alter table items drop constraint if exists items_lesson_check;
alter table items add constraint items_lesson_check check (lesson between 1 and 20);
