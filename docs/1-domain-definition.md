# 도메인 정의서 - Todolist-App

| 항목 | 내용 |
|------|------|
| 문서 버전 | v1.3 |
| 작성일 | 2026-05-12 |
| 작성자 | Business Analyst |
| 검토자 | 미정 |
| 승인자 | 미정 |
| 상태 | 초안 |

---

## 1. 프로젝트 개요

### 1.1 앱 목적

Todolist-App은 개인의 할일을 체계적으로 관리하고, 팀 멤버와 협업할 수 있도록 지원하는 할일 관리 웹 애플리케이션이다. 사용자는 할일을 생성·수정·삭제하고, 카테고리와 진행 상태로 분류하며, 팀 단위의 공유 환경에서 협업할 수 있다.

### 1.2 해결하는 문제

| REQ ID | 문제 | 해결 방향 |
|--------|------|-----------|
| REQ-001 | 개인별 할일을 체계적으로 관리할 수 있는 도구가 없다 | 할일 CRUD, 상태 관리, 카테고리 분류, 날짜 기반 보기 기능 제공 |
| REQ-002 | 팀 멤버와 할일을 공유하고 협업할 수 있는 도구가 없다 | 팀 생성, 멤버 초대, 팀별 권한 관리, 공유 할일 목록 기능 제공 |

### 1.3 목표 사용자

- 개인 업무 및 일정을 관리하려는 직장인, 학생
- 소규모 팀 단위로 업무 할일을 공유하고 추적하려는 팀 리더 및 팀원

---

## 2. 핵심 도메인 개념 (용어 정의)

| 용어 | 영문 | 정의 |
|------|------|------|
| 사용자 | User | 회원가입을 통해 계정을 생성하고 앱을 사용하는 주체. 이메일과 비밀번호로 인증한다. |
| 할일 | Todo | 사용자가 수행해야 할 작업 단위. 제목, 설명, 시작일, 종료일, 카테고리, 진행 상태를 포함한다. |
| 카테고리 | Category | 할일을 분류하기 위한 그룹. 사용자가 직접 생성·수정할 수 있으며 색상 태그를 적용할 수 있다. |
| 진행 상태 | Status | 할일의 현재 진행 단계. 예정, 진행 중, 완료, 보류 네 가지 상태로 구분한다. |
| 팀 | Team | 할일을 공유하고 협업하는 사용자 그룹. 팀 관리자가 멤버를 초대하고 권한을 부여한다. |
| 팀 역할 | Team Role | 팀 내 사용자의 권한 등급. 팀 관리자, 팀 멤버, 읽기 전용 사용자로 구분한다. |
| 팀 초대 | Team Invitation | 팀 관리자가 사용자를 팀에 합류시키기 위해 생성하는 초대 요청. 수락, 거절, 만료 상태를 가진다. |
| 팀 관리자 | Team Admin | 팀을 생성하거나 팀 소유자로부터 권한을 위임받은 사용자. 멤버 초대, 역할 변경, 팀 설정 변경 권한을 가진다. |
| 팀 멤버 | Team Member | 팀에 소속되어 팀 할일을 생성·수정·삭제할 수 있는 사용자. |
| 읽기 전용 사용자 | Viewer | 팀 할일을 조회만 할 수 있고 수정 권한이 없는 사용자. |
| 마감일 | Due Date | 할일을 완료해야 하는 날짜. 종료일과 동일하며 정렬 및 필터 기준으로 사용된다. |
| 오늘 할일 | Today's Todos | 오늘 날짜가 시작일과 종료일 사이에 해당하거나 마감일이 오늘인 할일 목록. |
| 이번 주 할일 | This Week's Todos | 현재 주(월~일) 내에 마감일이 포함된 할일 목록. |
| 인증 토큰 | Auth Token | 로그인 후 발급되는 JWT. 액세스 토큰(1시간)과 리프레시 토큰(7일)으로 구성되며 사용자 인증 상태를 유지하는 데 사용된다. 향후 OAuth2 소셜 로그인 확장 예정 (2차). |
| 알림 | Notification | 시스템이 사용자에게 발송하는 이벤트 메시지. 마감일 알림, 팀 초대, 할일 배정 유형이 있다. |
| 감사 로그 | Audit Log | 주요 엔티티의 생성·수정·삭제 이력을 추적하기 위한 변경 기록. |

---

## 3. 도메인 모델

### 3.1 핵심 엔티티 및 속성

**User (사용자)**

| 속성 | 타입 | 설명 |
|------|------|------|
| user_id | UUID | 사용자 고유 식별자 |
| email | String | 로그인 이메일 (유일값) |
| password_hash | String | 암호화된 비밀번호 |
| name | String | 사용자 이름 |
| created_at | DateTime | 가입일시 |
| updated_at | DateTime | 정보 수정일시 |

**Todo (할일)**

| 속성 | 타입 | 설명 |
|------|------|------|
| todo_id | UUID | 할일 고유 식별자 |
| user_id | UUID | 개인 할일 소유자 또는 팀 할일 생성자 (User FK, nullable) |
| team_id | UUID | 팀 할일 소유 팀 (Team FK, nullable) |
| category_id | UUID | 카테고리 (Category FK, nullable) |
| title | String | 할일 제목 |
| description | Text | 할일 설명 |
| start_date | Date | 시작일 |
| due_date | Date | 종료일 / 마감일 |
| status | Enum | 진행 상태 (PLANNED, IN_PROGRESS, DONE, ON_HOLD) |
| created_at | DateTime | 생성일시 |
| updated_at | DateTime | 수정일시 |

**Category (카테고리)**

| 속성 | 타입 | 설명 |
|------|------|------|
| category_id | UUID | 카테고리 고유 식별자 |
| owner_id | UUID | 생성자 (User FK 또는 Team FK) |
| owner_type | Enum | 소유 주체 유형 (USER, TEAM) |
| name | String | 카테고리명 (예: 업무, 개인, 학습) |
| color | String | 색상 태그 (HEX 코드) |
| created_at | DateTime | 생성일시 |

**Team (팀)**

| 속성 | 타입 | 설명 |
|------|------|------|
| team_id | UUID | 팀 고유 식별자 |
| name | String | 팀 이름 |
| description | Text | 팀 설명 |
| created_by | UUID | 팀 생성자 (User FK) |
| created_at | DateTime | 생성일시 |

**TeamMember (팀 멤버십)**

| 속성 | 타입 | 설명 |
|------|------|------|
| team_member_id | UUID | 멤버십 고유 식별자 |
| team_id | UUID | 팀 (Team FK) |
| user_id | UUID | 사용자 (User FK) |
| role | Enum | 역할 (ADMIN, MEMBER, VIEWER) |
| joined_at | DateTime | 팀 참여일시 |

**TeamInvitation (팀 초대)**

| 속성 | 타입 | 설명 |
|------|------|------|
| invitation_id | UUID | 초대 고유 식별자 |
| team_id | UUID | 초대 대상 팀 (Team FK) |
| invited_user_id | UUID | 초대받은 사용자 (User FK) |
| invited_by | UUID | 초대한 사용자 (User FK) |
| role | Enum | 수락 시 부여할 역할 (MEMBER, VIEWER) |
| status | Enum | 초대 상태 (PENDING, ACCEPTED, DECLINED, EXPIRED) |
| expires_at | DateTime | 초대 만료일시 |
| created_at | DateTime | 초대 생성일시 |
| responded_at | DateTime | 수락 또는 거절 일시 (nullable) |

**Notification (알림)**

| 속성 | 타입 | 설명 |
|------|------|------|
| notification_id | UUID | 알림 고유 식별자 |
| user_id | UUID | 수신 사용자 (User FK) |
| todo_id | UUID | 관련 할일 (nullable) |
| invitation_id | UUID | 관련 팀 초대 (nullable) |
| type | Enum | 알림 유형 (DUE_DATE_REMINDER, TEAM_INVITE, TODO_ASSIGNED) |
| message | String | 알림 내용 |
| is_read | Boolean | 읽음 여부 |
| created_at | DateTime | 생성일시 |

**AuditLog (감사 로그)**

| 속성 | 타입 | 설명 |
|------|------|------|
| audit_log_id | UUID | 감사 로그 고유 식별자 |
| entity_type | String | 대상 엔티티 유형 (User, Todo, Category, Team 등) |
| entity_id | UUID | 대상 엔티티 식별자 |
| change_type | Enum | 변경 유형 (CREATE, UPDATE, DELETE) |
| actor_user_id | UUID | 변경 수행 사용자 (nullable) |
| occurred_at | DateTime | 변경 발생 일시 |
| before_value | JSON | 변경 전 값 (nullable) |
| after_value | JSON | 변경 후 값 (nullable) |
| metadata | JSON | 추가 메타데이터 (nullable) |

### 3.2 엔티티 관계

```
User ──────────────────── Todo
 │  (1 : N, 개인 소유/생성자, nullable)
 │                          │
 │                          │ N : 1
 │                       Category
 │  (1 : N, 생성)
 │
 └──── TeamMember ──── Team ───── TeamInvitation
        (N : M 해소)    │
                        │ 1 : N
                       Todo (팀 할일)

User ──────────────────── Notification
     (1 : N, 수신)

User ──────────────────── AuditLog
     (1 : N, 변경 수행자, nullable)
```

| 관계 | 설명 |
|------|------|
| User - Todo | 한 사용자는 여러 개인 할일을 소유하거나 팀 할일 생성자로 참조될 수 있다 (1:N, nullable) |
| User - TeamMember | 한 사용자는 여러 팀에 소속될 수 있다 (1:N) |
| Team - TeamMember | 한 팀은 여러 멤버를 가진다 (1:N) |
| Team - Todo | 한 팀은 여러 팀 할일을 가진다 (1:N) |
| Team - TeamInvitation | 한 팀은 여러 초대를 가진다 (1:N) |
| User - TeamInvitation | 한 사용자는 여러 팀 초대를 받거나 생성할 수 있다 (1:N) |
| Category - Todo | 한 카테고리에 여러 할일이 속한다 (1:N) |
| User/Team - Category | 사용자 또는 팀이 카테고리를 소유한다 (소유 주체 다형성) |
| User - Notification | 한 사용자는 여러 알림을 받는다 (1:N) |
| TeamInvitation - Notification | 팀 초대 알림은 관련 초대를 참조할 수 있다 (1:N) |
| User - AuditLog | 한 사용자는 여러 변경 이력의 수행자로 기록될 수 있다 (1:N, nullable) |

---

## 4. 비즈니스 규칙

### 4.1 사용자 계정

| 규칙 ID | 규칙 내용 |
|---------|-----------|
| USR-001 | 이메일은 시스템 전체에서 유일해야 한다. 중복 이메일로 가입 시 오류를 반환한다. |
| USR-002 | 비밀번호는 반드시 암호화(해시)하여 저장해야 한다. 평문 비밀번호는 저장하지 않는다. |
| USR-002-1 | 비밀번호는 최소 8자 이상이며, 영문자·숫자·특수문자를 각 1자 이상 포함해야 한다. |
| USR-003 | 회원 탈퇴 시 사용자 데이터를 즉시 하드 삭제한다. (PRD NFR 데이터 보존 정책에 따라 소프트 삭제에서 변경) |
| USR-005 | 비밀번호 재설정 링크는 이메일로 발송되며, 발송 후 30분 이내에만 유효하다. 만료된 링크로 접근 시 재발송을 안내한다. |

### 4.2 인증 및 권한

| 규칙 ID | 규칙 내용 |
|---------|-----------|
| AUTH-001 | 인증된 사용자만 내 정보, 할일, 카테고리, 팀, 알림 API에 접근할 수 있다. |
| AUTH-002 | 사용자는 자신이 소유한 할일만 수정·삭제할 수 있다. |
| AUTH-003 | 팀 할일은 해당 팀의 ADMIN 또는 MEMBER 역할을 가진 사용자만 수정·삭제할 수 있다. |
| AUTH-004 | VIEWER 역할 사용자는 팀 할일을 조회만 할 수 있고 수정·삭제가 불가하다. |
| AUTH-005 | 팀 멤버 초대 및 역할 변경은 ADMIN 역할을 가진 사용자만 수행할 수 있다. |
| AUTH-006 | 인증 토큰(JWT)의 유효 기간은 액세스 토큰 1시간, 리프레시 토큰 7일이다. 만료 또는 유효하지 않은 토큰으로 요청 시 401 오류를 반환하고 재로그인을 요구한다. |

### 4.3 할일 관리

| 규칙 ID | 규칙 내용 |
|---------|-----------|
| TODO-001 | 할일 제목은 필수 입력 항목이다. |
| TODO-002 | 종료일(due_date)은 시작일(start_date)보다 같거나 이후여야 한다. |
| TODO-003 | 진행 상태는 PLANNED, IN_PROGRESS, DONE, ON_HOLD 중 하나여야 한다. |
| TODO-004 | 삭제된 할일은 복구할 수 없다 (하드 삭제). |
| TODO-005 | 오늘 할일은 오늘 날짜가 start_date 이상이고 due_date 이하인 할일을 반환한다. |
| TODO-006 | 이번 주 할일은 현재 주(월요일~일요일) 내에 due_date가 포함된 할일을 반환한다. |
| TODO-007 | 기본 정렬 기준은 due_date 오름차순(마감일 임박 순)이다. |
| TODO-008 | 진행 상태 전이는 아래 허용된 전이만 가능하다. 허용되지 않은 전이 시도 시 오류를 반환한다. |

**TODO-008 상태 전이 매트릭스**

| 현재 상태 \ 전환 가능 상태 | PLANNED | IN_PROGRESS | DONE | ON_HOLD |
|--------------------------|---------|-------------|------|---------|
| PLANNED                  | -       | O           | X    | O       |
| IN_PROGRESS              | X       | -           | O    | O       |
| DONE                     | X       | O           | -    | X       |
| ON_HOLD                  | O       | O           | X    | -       |

- O: 전이 허용 / X: 전이 불가 / -: 동일 상태 (해당 없음)
- DONE → IN_PROGRESS 전이는 재개(재작업) 상황에서 허용된다.

| 규칙 ID | 규칙 내용 |
|---------|-----------|
| TODO-009 | 오늘 할일 및 이번 주 할일 조회 시 날짜 기준은 서버의 UTC+9(KST) 기준으로 적용한다. |
| TODO-010 | 개인 할일은 user_id가 필수이고 team_id는 null이다. 팀 할일은 team_id가 필수이며, user_id는 생성자 참조로 사용하되 팀 귀속 또는 사용자 삭제 시 null일 수 있다. |

### 4.4 카테고리

| 규칙 ID | 규칙 내용 |
|---------|-----------|
| CAT-001 | 카테고리명은 동일 소유자(사용자 또는 팀) 내에서 중복될 수 없다. |
| CAT-002 | 카테고리가 삭제되면 해당 카테고리에 속한 할일의 category_id는 null로 처리된다. |
| CAT-003 | 시스템은 기본 카테고리(업무, 개인, 학습, 회의, 프로젝트, 긴급 업무)를 신규 사용자 가입 시 자동 생성한다. |
| CAT-004 | 색상 태그는 HEX 코드 형식(#RRGGBB)으로 저장한다. |

### 4.5 팀

| 규칙 ID | 규칙 내용 |
|---------|-----------|
| TEAM-001 | 팀 생성자는 자동으로 ADMIN 역할을 부여받는다. |
| TEAM-002 | 팀에는 최소 1명의 ADMIN이 항상 존재해야 한다. 마지막 ADMIN은 역할을 변경하거나 탈퇴할 수 없다. |
| TEAM-003 | 한 사용자는 동일 팀에 중복 가입할 수 없다. |
| TEAM-004 | 팀에서 탈퇴하면 해당 사용자가 생성한 팀 할일의 소유권은 팀에 귀속된다. |
| TEAM-005 | 팀이 삭제되면 해당 팀의 모든 할일과 카테고리도 함께 삭제된다. 단, 팀 멤버 개인의 할일은 영향을 받지 않는다. |

### 4.6 알림

| 규칙 ID | 규칙 내용 |
|---------|-----------|
| NOTIF-001 | 할일 마감일 1일 전 자동 알림을 발송한다. |
| NOTIF-002 | 팀 초대 발생 시 피초대자에게 알림을 발송한다. |
| NOTIF-003 | 읽지 않은 알림은 is_read=false로 관리하며, 사용자가 확인 시 true로 변경된다. |

### 4.7 팀 초대

| 규칙 ID | 규칙 내용 |
|---------|-----------|
| INV-001 | 팀 초대는 ADMIN 역할을 가진 사용자만 생성할 수 있다. |
| INV-002 | 이미 팀에 소속된 사용자 또는 동일 팀에 PENDING 초대가 있는 사용자는 다시 초대할 수 없다. |
| INV-003 | 초대 수락 시 TeamInvitation.status를 ACCEPTED로 변경하고 TeamMember를 생성한다. |
| INV-004 | 초대 거절 시 TeamInvitation.status를 DECLINED로 변경하며 TeamMember는 생성하지 않는다. |
| INV-005 | 만료된 초대는 수락할 수 없으며 status를 EXPIRED로 처리한다. |

### 4.8 감사 로그

| 규칙 ID | 규칙 내용 |
|---------|-----------|
| AUD-001 | User, Todo, Category, Team, TeamMember, TeamInvitation의 생성·수정·삭제 이벤트는 AuditLog로 기록한다. |
| AUD-002 | 감사 로그는 대상 엔티티, 엔티티 ID, 변경 유형, 수행자, 변경 일시, 변경 전·후 값을 저장한다. |
| AUD-003 | 비밀번호 해시, 인증 토큰, 비밀번호 재설정 링크 등 민감 정보는 감사 로그에 저장하지 않는다. User 삭제 이벤트는 이메일·이름 등 개인정보를 마스킹하거나 제외한다. |
| AUD-004 | 사용자 하드 삭제가 감사 로그 보존을 막지 않도록 actor_user_id는 nullable로 관리한다. |

---

## 5. 유스케이스 요약

### 5.1 액터 정의

| 액터 | 설명 |
|------|------|
| 비회원 | 회원가입 또는 로그인을 시도하는 미인증 사용자 |
| 인증된 사용자 | 로그인한 상태의 일반 사용자 |
| 팀 관리자 | 팀 내 ADMIN 역할을 가진 사용자 |
| 팀 멤버 | 팀 내 MEMBER 역할을 가진 사용자 |
| 읽기 전용 사용자 | 팀 내 VIEWER 역할을 가진 사용자 |
| 피초대 사용자 | 팀 초대를 받은 미소속 인증된 사용자 |
| 시스템 | 자동화된 내부 처리 주체 (토큰 검증, 알림 발송 등) |

### 5.2 유스케이스 목록

**계정 관리 (Account)**

| UC ID | 유스케이스 | 주요 액터 |
|-------|-----------|-----------|
| UC-A01 | 회원가입 | 비회원 |
| UC-A02 | 이메일 중복 확인 | 비회원 |
| UC-A03 | 로그인 | 비회원 |
| UC-A04 | 로그아웃 | 인증된 사용자 |
| UC-A05 | 내 정보 조회 | 인증된 사용자 |
| UC-A06 | 내 정보 수정 | 인증된 사용자 |
| UC-A07 | 비밀번호 재설정 요청 | 비회원 |
| UC-A08 | 비밀번호 재설정 | 비회원 (링크 접근) |
| UC-A09 | 회원 탈퇴 | 인증된 사용자 |

**할일 관리 (Todo)**

| UC ID | 유스케이스 | 주요 액터 |
|-------|-----------|-----------|
| UC-T01 | 할일 생성 | 인증된 사용자, 팀 멤버 |
| UC-T02 | 할일 수정 | 인증된 사용자, 팀 멤버 |
| UC-T03 | 할일 삭제 | 인증된 사용자, 팀 멤버 |
| UC-T04 | 할일 목록 조회 | 인증된 사용자 |
| UC-T05 | 할일 상세 조회 | 인증된 사용자 |
| UC-T06 | 진행 상태 변경 | 인증된 사용자, 팀 멤버 |
| UC-T07 | 오늘 할일 조회 | 인증된 사용자 |
| UC-T08 | 이번 주 할일 조회 | 인증된 사용자 |
| UC-T09 | 할일 검색 | 인증된 사용자 |
| UC-T10 | 할일 필터 적용 | 인증된 사용자 |

**카테고리 관리 (Category)**

| UC ID | 유스케이스 | 주요 액터 |
|-------|-----------|-----------|
| UC-C01 | 카테고리 생성 | 인증된 사용자, 팀 관리자 |
| UC-C02 | 카테고리 수정 | 인증된 사용자, 팀 관리자 |
| UC-C03 | 카테고리 삭제 | 인증된 사용자, 팀 관리자 |
| UC-C04 | 카테고리별 할일 목록 조회 | 인증된 사용자 |

**팀 관리 (Team)**

| UC ID | 유스케이스 | 주요 액터 |
|-------|-----------|-----------|
| UC-M01 | 팀 생성 | 인증된 사용자 |
| UC-M02 | 팀 멤버 초대 | 팀 관리자 |
| UC-M03 | 팀 멤버 역할 변경 | 팀 관리자 |
| UC-M04 | 팀 멤버 추방 | 팀 관리자 |
| UC-M05 | 팀 탈퇴 | 팀 멤버, 읽기 전용 사용자 |
| UC-M06 | 팀 할일 목록 조회 | 팀 멤버, 읽기 전용 사용자 |
| UC-M07 | 팀 정보 수정 | 팀 관리자 |
| UC-M08 | 팀 삭제 | 팀 관리자 |
| UC-M09 | 팀 초대 수락 | 피초대 사용자 |
| UC-M10 | 팀 초대 거절 | 피초대 사용자 |

**알림 관리 (Notification)**

| UC ID | 유스케이스 | 주요 액터 |
|-------|-----------|-----------|
| UC-N01 | 알림 목록 조회 | 인증된 사용자 |
| UC-N02 | 알림 읽음 처리 | 인증된 사용자 |

### 5.3 유스케이스-비즈니스 규칙 매핑

| UC ID | 유스케이스명 | 적용 규칙 | 관련 REQ |
|-------|------------|----------|---------|
| UC-A01 | 회원가입 | USR-001, USR-002, USR-002-1, CAT-003 | REQ-001 |
| UC-A02 | 이메일 중복 확인 | USR-001 | REQ-001 |
| UC-A03 | 로그인 | AUTH-006 | REQ-001 |
| UC-A04 | 로그아웃 | AUTH-006 | REQ-001 |
| UC-A05 | 내 정보 조회 | AUTH-001 | REQ-001 |
| UC-A06 | 내 정보 수정 | AUTH-001, USR-002, USR-002-1 | REQ-001 |
| UC-A07 | 비밀번호 재설정 요청 | USR-005 | REQ-001 |
| UC-A08 | 비밀번호 재설정 | USR-005, USR-002, USR-002-1 | REQ-001 |
| UC-A09 | 회원 탈퇴 | USR-003 | REQ-001 |
| UC-T01 | 할일 생성 | AUTH-001, AUTH-002, AUTH-003, TODO-001, TODO-002, TODO-003, TODO-010 | REQ-001, REQ-002 |
| UC-T02 | 할일 수정 | AUTH-001, AUTH-002, AUTH-003, TODO-001, TODO-002, TODO-003, TODO-010 | REQ-001, REQ-002 |
| UC-T03 | 할일 삭제 | AUTH-001, AUTH-002, AUTH-003, TODO-004 | REQ-001, REQ-002 |
| UC-T04 | 할일 목록 조회 | AUTH-001, AUTH-004, TODO-007 | REQ-001 |
| UC-T05 | 할일 상세 조회 | AUTH-001, AUTH-002, AUTH-003, AUTH-004 | REQ-001, REQ-002 |
| UC-T06 | 진행 상태 변경 | AUTH-001, AUTH-002, AUTH-003, TODO-003, TODO-008 | REQ-001, REQ-002 |
| UC-T07 | 오늘 할일 조회 | AUTH-001, TODO-005, TODO-009 | REQ-001 |
| UC-T08 | 이번 주 할일 조회 | AUTH-001, TODO-006, TODO-009 | REQ-001 |
| UC-T09 | 할일 검색 | AUTH-001 | REQ-001 |
| UC-T10 | 할일 필터 적용 | AUTH-001, TODO-007 | REQ-001 |
| UC-C01 | 카테고리 생성 | AUTH-001, CAT-001, CAT-004 | REQ-001, REQ-002 |
| UC-C02 | 카테고리 수정 | AUTH-001, CAT-001, CAT-004 | REQ-001, REQ-002 |
| UC-C03 | 카테고리 삭제 | AUTH-001, CAT-002 | REQ-001, REQ-002 |
| UC-C04 | 카테고리별 할일 목록 조회 | AUTH-001 | REQ-001 |
| UC-M01 | 팀 생성 | AUTH-001, TEAM-001 | REQ-002 |
| UC-M02 | 팀 멤버 초대 | AUTH-001, AUTH-005, TEAM-003, INV-001, INV-002, NOTIF-002 | REQ-002 |
| UC-M03 | 팀 멤버 역할 변경 | AUTH-001, AUTH-005, TEAM-002 | REQ-002 |
| UC-M04 | 팀 멤버 추방 | AUTH-001, AUTH-005, TEAM-002 | REQ-002 |
| UC-M05 | 팀 탈퇴 | AUTH-001, TEAM-002, TEAM-004 | REQ-002 |
| UC-M06 | 팀 할일 목록 조회 | AUTH-001, AUTH-003, AUTH-004 | REQ-002 |
| UC-M07 | 팀 정보 수정 | AUTH-001, AUTH-005 | REQ-002 |
| UC-M08 | 팀 삭제 | AUTH-001, AUTH-005, TEAM-005 | REQ-002 |
| UC-M09 | 팀 초대 수락 | AUTH-001, TEAM-003, INV-003, INV-005, NOTIF-002 | REQ-002 |
| UC-M10 | 팀 초대 거절 | AUTH-001, INV-004 | REQ-002 |
| UC-N01 | 알림 목록 조회 | AUTH-001, NOTIF-003 | REQ-001, REQ-002 |
| UC-N02 | 알림 읽음 처리 | AUTH-001, NOTIF-003 | REQ-001, REQ-002 |

---

## 6. 도메인 경계 (Bounded Context)

### 6.1 서브도메인 분리

```
┌─────────────────────────────────────────────────────────────────┐
│                        Todolist-App                             │
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────────────────────┐   │
│  │   Identity &     │    │        Todo Management           │   │
│  │ Access Context   │    │           Context                │   │
│  │                  │    │                                  │   │
│  │ - User           │    │ - Todo                           │   │
│  │ - AuthToken      │◄───│ - Status                         │   │
│  │ - Password       │    │ - DueDate / DateRange            │   │
│  └──────────────────┘    └──────────────────────────────────┘   │
│                                        ▲                         │
│  ┌──────────────────┐                  │                         │
│  │   Category       │──────────────────┘                        │
│  │   Context        │                                            │
│  │                  │    ┌──────────────────────────────────┐   │
│  │ - Category       │    │      Team Collaboration          │   │
│  │ - ColorTag       │◄───│           Context                │   │
│  └──────────────────┘    │                                  │   │
│                           │ - Team                           │   │
│                           │ - TeamMember                     │   │
│                           │ - TeamRole                       │   │
│                           │ - TeamInvitation                 │   │
│                           └──────────────────────────────────┘   │
│                                        ▲                         │
│  ┌──────────────────────────────────┐  │                         │
│  │      Notification Context        │──┘                        │
│  │                                  │                            │
│  │ - Notification                   │◄── Todo Management        │
│  │ - NotificationType               │                            │
│  └──────────────────────────────────┘                            │
│  ┌──────────────────────────────────┐                            │
│  │          Audit Context           │                            │
│  │ - AuditLog                       │                            │
│  └──────────────────────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 서브도메인 상세

| 서브도메인 | 유형 | 핵심 책임 | 주요 엔티티 |
|-----------|------|-----------|------------|
| Identity & Access | 핵심 지원 | 사용자 인증, 계정 관리, 권한 검증 | User, AuthToken |
| Todo Management | 핵심 도메인 | 할일 생성·수정·삭제, 상태 관리, 날짜 기반 조회 | Todo, Status |
| Category | 지원 도메인 | 할일 분류 체계 관리, 색상 태그 | Category |
| Team Collaboration | 핵심 도메인 | 팀 생성·관리, 멤버 권한, 팀 할일 공유 | Team, TeamMember, TeamInvitation |
| Notification | 지원 도메인 | 알림 발송·조회, 읽음 상태 관리 | Notification |
| Audit | 지원 도메인 | 주요 엔티티 변경 이력 기록 | AuditLog |

### 6.3 컨텍스트 간 의존 관계

| 방향 | 설명 |
|------|------|
| Todo Management → Identity & Access | 할일 접근 시 사용자 인증 상태 및 소유권 검증 |
| Todo Management → Category | 할일 생성·수정 시 카테고리 유효성 확인 |
| Team Collaboration → Identity & Access | 팀 기능 접근 시 사용자 인증 및 팀 역할 검증 |
| Team Collaboration → Todo Management | 팀 할일 생성·조회 시 Todo 도메인 활용 |
| Team Collaboration → Category | 팀 카테고리 생성·관리 시 Category 도메인 활용 |
| Notification → Todo Management | 마감일 알림 발송 시 Todo 도메인의 due_date 참조 |
| Notification → Team Collaboration | 팀 초대 알림 발송 시 TeamInvitation 이벤트 구독 |
| Audit → 전체 컨텍스트 | 주요 엔티티 변경 이벤트를 구독해 감사 로그 기록 |

---

## 7. 변경 이력

| 버전 | 날짜 | 변경자 | 변경 내용 | 영향 섹션 |
|------|------|--------|-----------|----------|
| v1.0 | 2026-05-12 | Business Analyst | 초안 작성 | 전체 |
| v1.1 | 2026-05-12 | Business Analyst | 추적성·완전성·검증가능성·유지보수성 개선: 유스케이스-규칙 매핑, 알림 도메인, 상태 전이 매트릭스, 인증 수치 명시, 변경 이력 추가 | 3, 4, 5, 6 |
| v1.2 | 2026-05-13 | Product Manager | PRD NFR 데이터 보존 정책 반영: USR-003 소프트 삭제 → 하드 삭제로 변경 | 4.1 |
| v1.3 | 2026-05-13 | Reviewer | 기술 스택 일관성 검토 반영: 인증 토큰 정의에서 "세션 식별자" 표현 제거, JWT 토큰 유효기간 및 OAuth2 확장 계획 명시 | 2 |
| v1.3 | 2026-05-13 | Product Manager | 탈퇴 이메일 재가입 금지 규칙 삭제, Todo.user_id nullable 반영, TeamInvitation 및 AuditLog 모델·규칙 추가, PRD 참조 버전 정합화 | 3, 4, 5, 6 |

---

*본 문서는 Todolist-App의 초안 도메인 정의서로, 상세 설계 단계에서 지속적으로 보완된다.*
