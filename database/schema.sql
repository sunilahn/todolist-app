-- =============================================================================
-- Todolist-App Database Schema
-- 참조: docs/6-erd.md (v1.0), docs/2-prd.md (v1.4)
-- PostgreSQL 17
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()


-- ---------------------------------------------------------------------------
-- Enum Types
-- ---------------------------------------------------------------------------
CREATE TYPE todo_status AS ENUM ('PLANNED', 'IN_PROGRESS', 'DONE', 'ON_HOLD');

CREATE TYPE team_role AS ENUM ('ADMIN', 'MEMBER', 'VIEWER');

CREATE TYPE invitation_status AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

CREATE TYPE invitation_role AS ENUM ('MEMBER', 'VIEWER');

CREATE TYPE notification_type AS ENUM ('DUE_DATE_REMINDER', 'TEAM_INVITE', 'TODO_ASSIGNED');

CREATE TYPE category_owner_type AS ENUM ('USER', 'TEAM');

CREATE TYPE audit_entity_type AS ENUM ('User', 'Todo', 'Category', 'Team', 'TeamMember', 'TeamInvitation');

CREATE TYPE audit_change_type AS ENUM ('CREATE', 'UPDATE', 'DELETE');


-- ---------------------------------------------------------------------------
-- Table: users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    user_id         UUID            NOT NULL DEFAULT gen_random_uuid(),
    email           VARCHAR(255)    NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_users PRIMARY KEY (user_id),
    CONSTRAINT uq_users_email UNIQUE (email)
);

COMMENT ON TABLE  users               IS '인증 사용자. 탈퇴 시 즉시 하드 삭제 (USR-003).';
COMMENT ON COLUMN users.email         IS '로그인 이메일. 시스템 전체 유일 (USR-001).';
COMMENT ON COLUMN users.password_hash IS 'bcrypt 해시 비밀번호. 평문 저장 금지 (USR-002). 감사 로그 제외 대상 (AUD-003).';


-- ---------------------------------------------------------------------------
-- Table: teams
-- ---------------------------------------------------------------------------
CREATE TABLE teams (
    team_id     UUID            NOT NULL DEFAULT gen_random_uuid(),
    name        VARCHAR(100)    NOT NULL,
    created_by  UUID            NOT NULL,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_teams PRIMARY KEY (team_id),
    CONSTRAINT fk_teams_created_by FOREIGN KEY (created_by)
        REFERENCES users (user_id)
        ON DELETE RESTRICT  -- 생성자 삭제 전 팀 삭제 필요
);

COMMENT ON TABLE  teams            IS '협업 그룹. 생성자는 자동으로 ADMIN 부여 (TEAM-001).';
COMMENT ON COLUMN teams.created_by IS '팀 생성자. 사용자 탈퇴(하드 삭제) 전 팀 처리 필요 (RESTRICT).';


-- ---------------------------------------------------------------------------
-- Table: categories
-- ---------------------------------------------------------------------------
-- owner_id 는 users.user_id 또는 teams.team_id 를 가리키는 polymorphic FK.
-- DB 수준 FK 제약 없이 owner_type 으로 구분하며 애플리케이션 레이어에서 무결성 관리.
CREATE TABLE categories (
    category_id UUID                    NOT NULL DEFAULT gen_random_uuid(),
    owner_id    UUID                    NOT NULL,
    owner_type  category_owner_type     NOT NULL,
    name        VARCHAR(100)            NOT NULL,
    color       VARCHAR(7),                         -- HEX 코드 #RRGGBB (CAT-004)
    created_at  TIMESTAMPTZ             NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_categories PRIMARY KEY (category_id),
    -- 동일 소유자 범위 내 카테고리명 중복 불가 (CAT-001)
    CONSTRAINT uq_categories_owner_name UNIQUE (owner_id, owner_type, name),
    CONSTRAINT ck_categories_color CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$')
);

COMMENT ON TABLE  categories            IS '할일 분류 그룹. USER 또는 TEAM 소유 (CAT-001~004).';
COMMENT ON COLUMN categories.owner_id   IS 'Polymorphic FK. owner_type=USER 이면 users.user_id, TEAM 이면 teams.team_id 참조.';
COMMENT ON COLUMN categories.owner_type IS '소유 주체 유형. USER | TEAM.';
COMMENT ON COLUMN categories.color      IS 'HEX 색상 코드 (#RRGGBB). nullable (CAT-004).';


-- ---------------------------------------------------------------------------
-- Table: todos
-- ---------------------------------------------------------------------------
CREATE TABLE todos (
    todo_id     UUID            NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID,                               -- nullable: 팀 탈퇴·삭제 시 NULL (TEAM-004, TODO-010)
    team_id     UUID,                               -- nullable: 개인 할일은 NULL (TODO-010)
    category_id UUID,                               -- nullable: 카테고리 삭제 시 NULL (CAT-002)
    title       VARCHAR(500)    NOT NULL,
    description TEXT,
    status      todo_status     NOT NULL DEFAULT 'PLANNED',
    start_date  DATE,
    due_date    DATE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_todos PRIMARY KEY (todo_id),
    CONSTRAINT fk_todos_user FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE SET NULL,     -- 사용자 탈퇴(하드 삭제) 시 user_id = NULL
    CONSTRAINT fk_todos_team FOREIGN KEY (team_id)
        REFERENCES teams (team_id)
        ON DELETE CASCADE,      -- 팀 삭제 시 팀 할일 함께 삭제 (TEAM-005)
    CONSTRAINT fk_todos_category FOREIGN KEY (category_id)
        REFERENCES categories (category_id)
        ON DELETE SET NULL,     -- 카테고리 삭제 시 category_id = NULL (CAT-002)
    -- due_date >= start_date (TODO-002)
    CONSTRAINT ck_todos_date_order CHECK (
        start_date IS NULL OR due_date IS NULL OR due_date >= start_date
    ),
    -- 개인 할일: user_id NOT NULL, team_id NULL / 팀 할일: team_id NOT NULL (TODO-010)
    CONSTRAINT ck_todos_ownership CHECK (
        (team_id IS NULL AND user_id IS NOT NULL)   -- 개인 할일
        OR
        (team_id IS NOT NULL)                        -- 팀 할일 (user_id nullable)
    )
);

COMMENT ON TABLE  todos             IS '할일 단위. 개인(team_id=NULL)과 팀(team_id NOT NULL) 구분 (TODO-010).';
COMMENT ON COLUMN todos.user_id     IS '개인 할일 소유자 또는 팀 할일 생성자. 팀 탈퇴·삭제 시 NULL (TEAM-004).';
COMMENT ON COLUMN todos.team_id     IS '팀 할일 소속 팀. 개인 할일은 NULL. 팀 삭제 시 CASCADE (TEAM-005).';
COMMENT ON COLUMN todos.category_id IS '카테고리. 카테고리 삭제 시 SET NULL (CAT-002).';
COMMENT ON COLUMN todos.status      IS '진행 상태. 전이 매트릭스는 서비스 레이어에서 검증 (TODO-008).';
COMMENT ON COLUMN todos.due_date    IS '마감일. KST(UTC+9) 기준으로 오늘/이번 주 조회에 사용 (TODO-009).';


-- ---------------------------------------------------------------------------
-- Table: team_members
-- ---------------------------------------------------------------------------
CREATE TABLE team_members (
    team_member_id  UUID        NOT NULL DEFAULT gen_random_uuid(),
    team_id         UUID        NOT NULL,
    user_id         UUID        NOT NULL,
    role            team_role   NOT NULL DEFAULT 'MEMBER',
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_team_members PRIMARY KEY (team_member_id),
    CONSTRAINT fk_team_members_team FOREIGN KEY (team_id)
        REFERENCES teams (team_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_team_members_user FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE,
    -- 동일 팀 중복 가입 불가 (TEAM-003)
    CONSTRAINT uq_team_members_team_user UNIQUE (team_id, user_id)
);

COMMENT ON TABLE  team_members          IS '사용자-팀 N:M 연결. 팀 역할(ADMIN/MEMBER/VIEWER) 관리 (TEAM-002, TEAM-003).';
COMMENT ON COLUMN team_members.role     IS '팀 내 역할. ADMIN 최소 1명 유지 규칙은 서비스 레이어에서 검증 (TEAM-002).';
COMMENT ON COLUMN team_members.joined_at IS '초대 수락 시점 (INV-003).';


-- ---------------------------------------------------------------------------
-- Table: team_invitations
-- ---------------------------------------------------------------------------
CREATE TABLE team_invitations (
    invitation_id   UUID                NOT NULL DEFAULT gen_random_uuid(),
    team_id         UUID                NOT NULL,
    invited_user_id UUID                NOT NULL,
    invited_by      UUID                NOT NULL,
    role            invitation_role     NOT NULL,
    status          invitation_status   NOT NULL DEFAULT 'PENDING',
    expires_at      TIMESTAMPTZ         NOT NULL,
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    responded_at    TIMESTAMPTZ,                    -- 수락/거절 시각. EXPIRED 처리 시 NULL 유지 가능

    CONSTRAINT pk_team_invitations PRIMARY KEY (invitation_id),
    CONSTRAINT fk_team_invitations_team FOREIGN KEY (team_id)
        REFERENCES teams (team_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_team_invitations_invited_user FOREIGN KEY (invited_user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_team_invitations_invited_by FOREIGN KEY (invited_by)
        REFERENCES users (user_id)
        ON DELETE RESTRICT
);

COMMENT ON TABLE  team_invitations                  IS '팀 초대 요청. ADMIN만 생성 가능 (INV-001). 상태: PENDING→ACCEPTED|DECLINED|EXPIRED.';
COMMENT ON COLUMN team_invitations.invited_by       IS '초대를 생성한 ADMIN. 삭제 전 초대 처리 필요 (RESTRICT).';
COMMENT ON COLUMN team_invitations.role             IS '수락 시 team_members에 부여되는 역할. MEMBER 또는 VIEWER만 가능 (INV-001).';
COMMENT ON COLUMN team_invitations.expires_at       IS '초대 만료 일시. 만료 초대는 수락 불가 (INV-005).';
COMMENT ON COLUMN team_invitations.responded_at     IS '수락 또는 거절 처리 시각 (nullable).';


-- ---------------------------------------------------------------------------
-- Table: notifications
-- ---------------------------------------------------------------------------
CREATE TABLE notifications (
    notification_id UUID                NOT NULL DEFAULT gen_random_uuid(),
    user_id         UUID                NOT NULL,
    type            notification_type   NOT NULL,
    message         TEXT                NOT NULL,   -- 알림 내용
    reference_id    UUID,                           -- polymorphic: invitation_id, todo_id 등 (nullable)
    is_read         BOOLEAN             NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_notifications PRIMARY KEY (notification_id),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
);

COMMENT ON TABLE  notifications              IS '인앱 알림. 마감 1일 전·팀 초대·할일 배정 유형 지원 (NOTIF-001~003).';
COMMENT ON COLUMN notifications.message      IS '알림 본문 내용 (NOT NULL).';
COMMENT ON COLUMN notifications.reference_id IS 'Polymorphic 참조. type별로 참조 엔티티가 다름 (DB FK 없음, 앱 레이어 관리).';
COMMENT ON COLUMN notifications.is_read      IS '읽음 여부. 기본값 false. 사용자 확인 시 true (NOTIF-003).';


-- ---------------------------------------------------------------------------
-- Table: audit_logs
-- ---------------------------------------------------------------------------
CREATE TABLE audit_logs (
    audit_log_id    UUID                NOT NULL DEFAULT gen_random_uuid(),
    entity_type     audit_entity_type   NOT NULL,
    entity_id       UUID                NOT NULL,
    change_type     audit_change_type   NOT NULL,
    actor_user_id   UUID,                           -- nullable: 사용자 하드 삭제 후 NULL 허용 (AUD-004)
    before_value    JSONB,                          -- CREATE 시 NULL
    after_value     JSONB,                          -- DELETE 시 NULL
    metadata        JSONB,                          -- IP, User-Agent 등 추가 컨텍스트
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_audit_logs PRIMARY KEY (audit_log_id),
    -- actor_user_id: 사용자 하드 삭제 후 고아 참조 허용 → FK 없이 nullable UUID로 관리
    -- 감사 로그는 삭제하지 않는 것을 원칙으로 함 (불변 이력)
    CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_user_id)
        REFERENCES users (user_id)
        ON DELETE SET NULL
);

COMMENT ON TABLE  audit_logs                IS '변경 이력 불변 로그. 6개 엔티티의 CUD 이벤트 기록 (AUD-001~004).';
COMMENT ON COLUMN audit_logs.actor_user_id  IS '변경 수행자. 사용자 하드 삭제 시 SET NULL (AUD-004).';
COMMENT ON COLUMN audit_logs.before_value   IS '변경 전 스냅샷(JSONB). CREATE 시 NULL. 민감정보 제외 (AUD-003).';
COMMENT ON COLUMN audit_logs.after_value    IS '변경 후 스냅샷(JSONB). DELETE 시 NULL. 민감정보 제외 (AUD-003).';
COMMENT ON COLUMN audit_logs.metadata       IS 'IP, User-Agent 등 추가 컨텍스트 (JSONB, nullable).';


-- ---------------------------------------------------------------------------
-- Table: refresh_tokens
-- ---------------------------------------------------------------------------
CREATE TABLE refresh_tokens (
    token_id    UUID            NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID            NOT NULL,
    token_hash  VARCHAR(255)    NOT NULL,
    expires_at  TIMESTAMPTZ     NOT NULL,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    revoked_at  TIMESTAMPTZ,                        -- NULL=유효, NOT NULL=폐기 (로그아웃·탈퇴)

    CONSTRAINT pk_refresh_tokens PRIMARY KEY (token_id),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE   -- 사용자 탈퇴(하드 삭제) 시 토큰도 함께 삭제
);

COMMENT ON TABLE  refresh_tokens              IS '리프레시 토큰. 로그아웃·탈퇴 시 즉시 무효화 (AUTH-006).';
COMMENT ON COLUMN refresh_tokens.token_hash   IS '실제 토큰 대신 해시값 저장. DB 탈취 시 토큰 노출 방지.';
COMMENT ON COLUMN refresh_tokens.revoked_at   IS 'NULL=유효. NOT NULL=폐기. 로그아웃·탈퇴 시 현재 시각으로 설정.';


-- =============================================================================
-- Indexes
-- =============================================================================

-- users
CREATE INDEX idx_users_email ON users (email);

-- todos
CREATE INDEX idx_todos_user_id     ON todos (user_id);
CREATE INDEX idx_todos_team_id     ON todos (team_id);
CREATE INDEX idx_todos_category_id ON todos (category_id);
CREATE INDEX idx_todos_status      ON todos (status);
CREATE INDEX idx_todos_due_date    ON todos (due_date);                 -- 오늘/이번 주 조회 (TODO-005, TODO-006)
CREATE INDEX idx_todos_title_trgm  ON todos USING gin (title gin_trgm_ops); -- 제목 키워드 검색 (UC-T09). pg_trgm 확장 필요

-- categories
CREATE INDEX idx_categories_owner  ON categories (owner_id, owner_type);

-- team_members
CREATE INDEX idx_team_members_team ON team_members (team_id);
CREATE INDEX idx_team_members_user ON team_members (user_id);

-- team_invitations
CREATE INDEX idx_team_invitations_team         ON team_invitations (team_id);
CREATE INDEX idx_team_invitations_invited_user ON team_invitations (invited_user_id);
CREATE INDEX idx_team_invitations_status       ON team_invitations (status);

-- notifications
CREATE INDEX idx_notifications_user     ON notifications (user_id);
CREATE INDEX idx_notifications_is_read  ON notifications (user_id, is_read);
CREATE INDEX idx_notifications_created  ON notifications (created_at DESC);    -- 최신순 정렬 (NOTIF-003)

-- audit_logs
CREATE INDEX idx_audit_logs_entity      ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor       ON audit_logs (actor_user_id);
CREATE INDEX idx_audit_logs_created     ON audit_logs (created_at DESC);

-- refresh_tokens
CREATE INDEX idx_refresh_tokens_user    ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_hash    ON refresh_tokens (token_hash);


-- =============================================================================
-- NOTE: pg_trgm 확장이 필요한 경우 아래 명령을 먼저 실행
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- (idx_todos_title_trgm 인덱스는 pg_trgm 활성화 후 생성 가능)
-- =============================================================================
