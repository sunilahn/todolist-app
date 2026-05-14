-- =============================================================================
-- DB-004: 개발용 시드 데이터
-- 대상 DB : todolist_dev
-- 재실행 안전: 상단 TRUNCATE 로 기존 데이터 정리 후 삽입
-- 비밀번호: Test1234! (bcrypt cost 12)
-- =============================================================================

TRUNCATE
    audit_logs,
    refresh_tokens,
    notifications,
    team_invitations,
    team_members,
    todos,
    categories,
    teams,
    users
RESTART IDENTITY CASCADE;


-- Users (3건)
INSERT INTO users (user_id, email, name, password_hash, created_at, updated_at) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'alice@example.com',   'Alice',   '$2a$12$stVg.uuwFNIs5bTRUo73H.kZ3L5bpsnh01QBDZ/QbIBpRSFRoLkwm', NOW()-INTERVAL'30 days', NOW()-INTERVAL'1 day'),
    ('b0000000-0000-0000-0000-000000000002', 'bob@example.com',     'Bob',     '$2a$12$stVg.uuwFNIs5bTRUo73H.kZ3L5bpsnh01QBDZ/QbIBpRSFRoLkwm', NOW()-INTERVAL'25 days', NOW()-INTERVAL'2 days'),
    ('c0000000-0000-0000-0000-000000000003', 'charlie@example.com', 'Charlie', '$2a$12$stVg.uuwFNIs5bTRUo73H.kZ3L5bpsnh01QBDZ/QbIBpRSFRoLkwm', NOW()-INTERVAL'20 days', NOW()-INTERVAL'3 days');


-- Teams (2건)
INSERT INTO teams (team_id, name, created_by, created_at, updated_at) VALUES
    ('aa000000-0000-0000-0000-000000000001', 'Team Alpha', 'a0000000-0000-0000-0000-000000000001', NOW()-INTERVAL'28 days', NOW()-INTERVAL'5 days'),
    ('bb000000-0000-0000-0000-000000000002', 'Team Beta',  'b0000000-0000-0000-0000-000000000002', NOW()-INTERVAL'15 days', NOW()-INTERVAL'2 days');


-- team_members (5건): Alpha=alice(ADMIN)+bob(MEMBER)+charlie(VIEWER), Beta=bob(ADMIN)+alice(MEMBER)
INSERT INTO team_members (team_member_id, team_id, user_id, role, joined_at) VALUES
    ('e0000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'ADMIN',  NOW()-INTERVAL'28 days'),
    ('e0000000-0000-0000-0000-000000000002', 'aa000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'MEMBER', NOW()-INTERVAL'20 days'),
    ('e0000000-0000-0000-0000-000000000003', 'aa000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'VIEWER', NOW()-INTERVAL'10 days'),
    ('e0000000-0000-0000-0000-000000000004', 'bb000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'ADMIN',  NOW()-INTERVAL'15 days'),
    ('e0000000-0000-0000-0000-000000000005', 'bb000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'MEMBER', NOW()-INTERVAL'12 days');


-- categories (12건): alice 기본 6종(USER) + bob 2종(USER) + Team Alpha 2종(TEAM) + Team Beta 2종(TEAM)
INSERT INTO categories (category_id, owner_id, owner_type, name, color, created_at) VALUES
    ('ca000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'USER', '업무',     '#FF5733', NOW()-INTERVAL'29 days'),
    ('ca000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'USER', '개인',     '#33FF57', NOW()-INTERVAL'29 days'),
    ('ca000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'USER', '학습',     '#3357FF', NOW()-INTERVAL'29 days'),
    ('ca000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'USER', '회의',     '#FF33A8', NOW()-INTERVAL'29 days'),
    ('ca000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'USER', '프로젝트', '#FFC300', NOW()-INTERVAL'29 days'),
    ('ca000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'USER', '긴급업무', '#FF0000', NOW()-INTERVAL'29 days'),
    ('ca000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000002', 'USER', '업무',     '#FF8C00', NOW()-INTERVAL'24 days'),
    ('ca000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000002', 'USER', '개인',     '#00CED1', NOW()-INTERVAL'24 days'),
    ('ca000000-0000-0000-0000-000000000009', 'aa000000-0000-0000-0000-000000000001', 'TEAM', '스프린트', '#9B59B6', NOW()-INTERVAL'27 days'),
    ('ca000000-0000-0000-0000-000000000010', 'aa000000-0000-0000-0000-000000000001', 'TEAM', '버그수정', '#E74C3C', NOW()-INTERVAL'27 days'),
    ('ca000000-0000-0000-0000-000000000011', 'bb000000-0000-0000-0000-000000000002', 'TEAM', '기획',     '#1ABC9C', NOW()-INTERVAL'14 days'),
    ('ca000000-0000-0000-0000-000000000012', 'bb000000-0000-0000-0000-000000000002', 'TEAM', '마케팅',   '#F39C12', NOW()-INTERVAL'14 days');


-- todos (18건): PLANNED 6 / IN_PROGRESS 5 / DONE 4 / ON_HOLD 3
-- 개인 할일: user_id NOT NULL, team_id NULL
-- 팀  할일: team_id NOT NULL (user_id nullable)
-- 오늘 날짜(CURRENT_DATE) 포함 항목 다수 존재
INSERT INTO todos (todo_id, user_id, team_id, category_id, title, description, status, start_date, due_date, created_at, updated_at) VALUES
    ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', NULL,                                    'ca000000-0000-0000-0000-000000000001', '분기 보고서 초안 작성',      '3분기 성과 지표 취합',                 'PLANNED',     CURRENT_DATE,                   CURRENT_DATE+INTERVAL'3 days',  NOW()-INTERVAL'1 hour',   NOW()-INTERVAL'1 hour'),
    ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', NULL,                                    'ca000000-0000-0000-0000-000000000003', 'Node.js 강의 수강',          'Udemy 강의 섹션 5~8 완료',             'IN_PROGRESS', CURRENT_DATE-INTERVAL'5 days',  CURRENT_DATE+INTERVAL'10 days', NOW()-INTERVAL'5 days',   NOW()-INTERVAL'1 day'),
    ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', NULL,                                    'ca000000-0000-0000-0000-000000000002', '치과 예약',                  '다음 달 스케일링 예약',                 'DONE',        CURRENT_DATE-INTERVAL'10 days', CURRENT_DATE-INTERVAL'8 days',  NOW()-INTERVAL'10 days',  NOW()-INTERVAL'8 days'),
    ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', NULL,                                    'ca000000-0000-0000-0000-000000000005', '사이드 프로젝트 기획',       '모바일 앱 아이디어 구체화',             'ON_HOLD',     CURRENT_DATE-INTERVAL'15 days', CURRENT_DATE+INTERVAL'30 days', NOW()-INTERVAL'15 days',  NOW()-INTERVAL'7 days'),
    ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', NULL,                                    'ca000000-0000-0000-0000-000000000006', '서버 장애 긴급 패치 검토',   '프로덕션 메모리 누수 원인 파악',       'PLANNED',     CURRENT_DATE,                   CURRENT_DATE+INTERVAL'1 days',  NOW()-INTERVAL'2 hours',  NOW()-INTERVAL'2 hours'),
    ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', NULL,                                    'ca000000-0000-0000-0000-000000000004', '주간 팀 회의 아젠다 준비',   '다음 주 회의 아젠다 초안 작성',        'IN_PROGRESS', CURRENT_DATE-INTERVAL'2 days',  CURRENT_DATE+INTERVAL'5 days',  NOW()-INTERVAL'2 days',   NOW()-INTERVAL'6 hours'),
    ('d0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000002', NULL,                                    'ca000000-0000-0000-0000-000000000007', '클라이언트 제안서 작성',     'A사 리뉴얼 프로젝트 제안서 초안',      'PLANNED',     CURRENT_DATE+INTERVAL'1 days',  CURRENT_DATE+INTERVAL'7 days',  NOW()-INTERVAL'3 hours',  NOW()-INTERVAL'3 hours'),
    ('d0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000002', NULL,                                    'ca000000-0000-0000-0000-000000000008', '운동 루틴 세우기',           '주 3회 헬스장 스케줄 확정',             'DONE',        CURRENT_DATE-INTERVAL'7 days',  CURRENT_DATE-INTERVAL'5 days',  NOW()-INTERVAL'7 days',   NOW()-INTERVAL'5 days'),
    ('d0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000002', NULL,                                    'ca000000-0000-0000-0000-000000000007', '기술 블로그 포스팅',         'Redis 캐싱 전략 정리 글',              'ON_HOLD',     CURRENT_DATE-INTERVAL'20 days', CURRENT_DATE+INTERVAL'14 days', NOW()-INTERVAL'20 days',  NOW()-INTERVAL'10 days'),
    ('d0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000003', NULL,                                    NULL,                                    '독서 목록 정리',             '올해 읽을 책 20권 목록 작성',           'PLANNED',     CURRENT_DATE,                   CURRENT_DATE+INTERVAL'2 days',  NOW()-INTERVAL'4 hours',  NOW()-INTERVAL'4 hours'),
    ('d0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000009', 'Sprint 12 백로그 정리',      '이슈 트래커 우선순위 재조정',           'IN_PROGRESS', CURRENT_DATE-INTERVAL'3 days',  CURRENT_DATE+INTERVAL'4 days',  NOW()-INTERVAL'3 days',   NOW()-INTERVAL'12 hours'),
    ('d0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000002', 'aa000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000010', '로그인 페이지 UI 버그 수정', 'Chrome 최신 버전 레이아웃 깨짐 현상', 'PLANNED',     CURRENT_DATE,                   CURRENT_DATE+INTERVAL'2 days',  NOW()-INTERVAL'5 hours',  NOW()-INTERVAL'5 hours'),
    ('d0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000010', '데이터베이스 인덱스 최적화', 'slow query log 분석 후 복합 인덱스 추가', 'DONE',     CURRENT_DATE-INTERVAL'14 days', CURRENT_DATE-INTERVAL'10 days', NOW()-INTERVAL'14 days',  NOW()-INTERVAL'10 days'),
    ('d0000000-0000-0000-0000-000000000014', NULL,                                   'aa000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000009', 'CI/CD 파이프라인 재설계',    'GitHub Actions → ArgoCD 마이그레이션', 'ON_HOLD',     CURRENT_DATE-INTERVAL'30 days', CURRENT_DATE+INTERVAL'60 days', NOW()-INTERVAL'30 days',  NOW()-INTERVAL'20 days'),
    ('d0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000002', 'bb000000-0000-0000-0000-000000000002', 'ca000000-0000-0000-0000-000000000011', 'Q4 사업 계획서 작성',        '매출 목표 및 채용 계획 포함',           'PLANNED',     CURRENT_DATE+INTERVAL'3 days',  CURRENT_DATE+INTERVAL'14 days', NOW()-INTERVAL'1 day',    NOW()-INTERVAL'1 day'),
    ('d0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000002', 'ca000000-0000-0000-0000-000000000012', 'SNS 콘텐츠 캘린더 작성',     '10월 인스타그램·블로그 콘텐츠 일정 수립', 'IN_PROGRESS', CURRENT_DATE-INTERVAL'6 days', CURRENT_DATE+INTERVAL'8 days',  NOW()-INTERVAL'6 days',   NOW()-INTERVAL'18 hours'),
    ('d0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000002', 'bb000000-0000-0000-0000-000000000002', 'ca000000-0000-0000-0000-000000000011', '팀 온보딩 문서 작성',        '신규 합류 멤버를 위한 Wiki 페이지',    'DONE',        CURRENT_DATE-INTERVAL'12 days', CURRENT_DATE-INTERVAL'9 days',  NOW()-INTERVAL'12 days',  NOW()-INTERVAL'9 days'),
    ('d0000000-0000-0000-0000-000000000018', 'c0000000-0000-0000-0000-000000000003', NULL,                                    NULL,                                    '포트폴리오 업데이트',        'GitHub 프로필 및 개인 사이트 최신화',  'IN_PROGRESS', CURRENT_DATE-INTERVAL'4 days',  CURRENT_DATE+INTERVAL'6 days',  NOW()-INTERVAL'4 days',   NOW()-INTERVAL'2 hours');


-- team_invitations (2건): PENDING 1 + EXPIRED 1
INSERT INTO team_invitations (invitation_id, team_id, invited_user_id, invited_by, role, status, expires_at, created_at, responded_at) VALUES
    ('f1000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'MEMBER', 'PENDING', NOW()+INTERVAL'7 days', NOW()-INTERVAL'1 day',  NULL),
    ('f1000000-0000-0000-0000-000000000002', 'bb000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'VIEWER', 'EXPIRED', NOW()-INTERVAL'1 day',  NOW()-INTERVAL'8 days', NULL);


-- notifications (4건): DUE_DATE_REMINDER 2 + TEAM_INVITE 1 + TODO_ASSIGNED 1
INSERT INTO notifications (notification_id, user_id, type, message, reference_id, is_read, created_at) VALUES
    ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'DUE_DATE_REMINDER', '할일 [분기 보고서 초안 작성]의 마감일이 3일 후입니다.',                     'd0000000-0000-0000-0000-000000000001', FALSE, NOW()-INTERVAL'30 minutes'),
    ('f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'TEAM_INVITE',        'Team Alpha에 초대받았습니다. (역할: MEMBER)',                              'f1000000-0000-0000-0000-000000000001', FALSE, NOW()-INTERVAL'1 day'),
    ('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'TODO_ASSIGNED',      '할일 [Sprint 12 백로그 정리]이(가) Team Alpha에 등록되었습니다.',           'd0000000-0000-0000-0000-000000000011', TRUE,  NOW()-INTERVAL'3 days'),
    ('f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'DUE_DATE_REMINDER', '할일 [서버 장애 긴급 패치 검토]의 마감일이 1일 후입니다.',                  'd0000000-0000-0000-0000-000000000005', FALSE, NOW()-INTERVAL'10 minutes');
