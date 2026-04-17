-- v11: Realtime publication 명시적 활성화
-- (Supabase 기본 publication 'supabase_realtime'에 테이블 추가)

-- 메시지 실시간 구독
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 대화방 마지막 메시지 갱신 실시간
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- 알림 실시간 구독
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 주문 상태 변경 실시간 (구매자/판매자 양쪽 추적)
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- 참고: 이미 추가되어 있다면 "relation already member of publication" 에러가 날 수 있음.
-- 그 경우 이 파일은 건너뛰어도 무방함.
