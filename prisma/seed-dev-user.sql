-- 로컬 개발용 사용자(D-11). web이 개발 모드에서 이 ID를 x-dev-user-id로 보낸다(apps/web/src/app/providers.tsx).
-- 실행: npm run db:seed:dev. 운영 DB에서는 실행하지 않는다(운영 UserGuard는 항상 401이라 쓰이지도 않는다).
INSERT INTO users (id) VALUES ('00000000-0000-4000-8000-000000000001') ON CONFLICT (id) DO NOTHING;
