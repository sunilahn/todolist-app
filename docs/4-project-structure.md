# 프로젝트 구조 설계 원칙 - Todolist-App

| 항목 | 내용 |
|------|------|
| 문서 버전 | v1.2 |
| 작성일 | 2026-05-13 |
| 참조 문서 | docs/2-prd.md (v1.4) |
| 상태 | 초안 |

### 적용 기술 스택

#### 프론트엔드

| 구분 | 기술 | 버전 |
|------|------|------|
| 언어 | TypeScript | 5.x |
| UI 프레임워크 | React | 19 |
| 빌드 도구 | Vite | 6.x |
| 서버 상태 관리 | TanStack Query (React Query) | v5 |
| 클라이언트 상태 관리 | Zustand | 5.x |
| CSS 프레임워크 | Tailwind CSS | v3 |
| HTTP 클라이언트 | Axios | 1.x |
| 라우팅 | React Router | v7 |
| 폼 관리 | React Hook Form | 7.x |
| 테스트 | Vitest + React Testing Library | - |

#### 백엔드

| 구분 | 기술 | 버전 |
|------|------|------|
| 런타임 | Node.js | 22 LTS |
| 언어 | TypeScript | 5.x |
| 웹 프레임워크 | Express | 5.x |
| DB 클라이언트 | pg (node-postgres) — **ORM 금지** | 8.x |
| 인증 | jsonwebtoken + bcrypt | - |
| 입력 검증 | Zod | 3.x |
| 로깅 | Winston | 3.x |
| API 문서 | swagger-jsdoc | 6.x |
| 테스트 | Jest + Supertest | - |

#### 데이터베이스 / 인프라

| 구분 | 기술 | 버전 |
|------|------|------|
| 데이터베이스 | PostgreSQL | 17 |
| DB 커넥션 | pg.Pool (싱글톤) | - |
| 패키지 매니저 | pnpm | - |
| 컨테이너 | Docker + docker-compose | - |
| 이메일 | Nodemailer + SMTP | - |

---

## 목차

1. [공통 최상위 원칙 (All Stacks)](#1-공통-최상위-원칙-all-stacks)
2. [레이어/의존성 원칙](#2-레이어의존성-원칙)
3. [코드/네이밍 원칙](#3-코드네이밍-원칙)
4. [테스트/품질 원칙](#4-테스트품질-원칙)
5. [설정/보안/운영 원칙](#5-설정보안운영-원칙)
6. [백엔드 디렉토리 구조](#6-백엔드-디렉토리-구조)
7. [프론트엔드 디렉토리 구조](#7-프론트엔드-디렉토리-구조)
8. [모노레포 vs 분리 레포 구조 결정](#8-모노레포-vs-분리-레포-구조-결정)
9. [변경 이력](#9-변경-이력)

---

## 1. 공통 최상위 원칙 (All Stacks)

프론트엔드와 백엔드를 막론하고 코드베이스 전체에 적용되는 최상위 설계 원칙이다.

### 1.1 단일 책임 원칙 (Single Responsibility Principle)

하나의 모듈, 클래스, 함수는 단 하나의 책임만 가진다. 예를 들어 `todoService.ts`는 할일 비즈니스 로직만 담당하며, HTTP 요청 처리나 DB 쿼리 실행 코드를 포함하지 않는다.

### 1.2 관심사 분리 (Separation of Concerns)

UI 렌더링, 상태 관리, API 통신, 비즈니스 로직, 데이터 접근은 각각 분리된 레이어에서 처리한다. 동일한 파일 또는 함수 내에 여러 관심사를 혼재시키지 않는다.

### 1.3 레이어 간 단방향 의존

상위 레이어는 하위 레이어를 참조할 수 있으나, 하위 레이어가 상위 레이어를 역참조하는 구조를 금지한다. 의존 방향의 역전은 반드시 인터페이스 또는 콜백을 통해 처리한다.

### 1.4 TypeScript strict 모드 필수

프론트엔드와 백엔드 양측 모두 `tsconfig.json`에서 `"strict": true`를 설정하여 타입 안전성을 보장한다. `any` 타입 사용은 원칙적으로 금지하며, 불가피한 경우 `// eslint-disable` 주석과 함께 이유를 명시한다.

### 1.5 환경 변수 기반 설정, 하드코딩 금지

데이터베이스 접속 정보, API 엔드포인트, 포트 번호 등 환경에 따라 달라지는 모든 설정값은 환경 변수로 관리한다. 소스코드에 직접 값을 기재하는 하드코딩을 금지한다.

### 1.6 시크릿/민감정보 소스코드 포함 금지

JWT 시크릿, DB 비밀번호, 외부 서비스 API 키 등 모든 민감 정보는 `.env` 파일 또는 시크릿 관리 시스템에서 로드한다. `.env` 파일은 반드시 `.gitignore`에 포함하여 형상관리 저장소에 업로드되지 않도록 한다.

### 1.7 코드 일관성: ESLint + Prettier 강제

프로젝트 루트 및 각 패키지에 ESLint와 Prettier를 설정하고 CI/CD 파이프라인에서 lint 검사를 통과하지 못하면 머지를 차단한다. 팀 전체가 동일한 코드 스타일을 유지하기 위해 에디터 설정(`.editorconfig`)도 함께 관리한다.

---

## 2. 레이어/의존성 원칙

### 2.1 백엔드 레이어 (3-tier)

백엔드는 다음 4단계 레이어로 구성되며, 요청은 위에서 아래로 단방향으로 흐른다.

```
Router → Controller → Service → Repository → DB
```

#### Router (라우터)

- Express 라우터를 사용하여 HTTP 메서드와 URL 경로를 정의한다.
- 미들웨어(JWT 인증, 입력 검증, 로깅 등)를 연결하는 역할만 담당한다.
- 비즈니스 로직을 포함하지 않는다. Controller 함수를 호출하는 것이 유일한 책임이다.

#### Controller (컨트롤러)

- HTTP 요청 객체(`req`)에서 파라미터, 바디, 헤더를 추출하여 Service에 전달한다.
- Service의 반환값을 HTTP 응답 객체(`res`)로 변환하여 클라이언트에 응답한다.
- 비즈니스 로직을 직접 구현하지 않는다. Service 호출과 HTTP 응답 변환이 유일한 책임이다.
- 예외 발생 시 전역 에러 핸들러 미들웨어로 위임한다.

#### Service (서비스)

- 비즈니스 로직 전담 레이어다. 도메인 규칙(상태 전이 검증, 권한 검증, 날짜 기준 계산 등)을 구현한다.
- 예: `TODO-008` 상태 전이 매트릭스 검증, `TEAM-002` 마지막 ADMIN 보호, `TODO-009` KST 날짜 기준 계산
- 복수의 Repository를 조합하거나, 트랜잭션을 조율하여 데이터 일관성을 보장한다.
- DB에 직접 접근하지 않는다. 반드시 Repository를 경유한다.

#### Repository (레포지토리)

- DB 쿼리를 전담하는 레이어다.
- `pg` 라이브러리(node-postgres)를 직접 사용하여 SQL 쿼리를 작성한다.
- ORM(TypeORM, Prisma, Sequelize 등) 사용을 금지한다.
- 비즈니스 로직을 포함하지 않는다. 단순 CRUD 및 조건 조회 SQL 실행이 유일한 책임이다.
- 트랜잭션이 필요한 경우 `pg.PoolClient`를 Service로부터 전달받아 동일 트랜잭션 내에서 실행한다.

#### 레이어 간 역방향 참조 금지

Repository가 Service를 import하거나, Controller가 Repository를 직접 호출하는 구조를 금지한다. 의존 방향은 항상 `Router → Controller → Service → Repository` 단방향을 유지한다.

### 2.2 프론트엔드 레이어

프론트엔드는 다음 레이어로 구성된다.

```
Page → Feature/Component → Hook → API Client → Server
```

#### Page (페이지)

- React Router의 라우트 단위 컴포넌트다. URL 경로와 1:1로 대응한다.
- 레이아웃 구성과 Feature 컴포넌트 조합이 주 역할이며, 직접적인 비즈니스 로직이나 API 호출을 포함하지 않는다.
- 예: `LoginPage.tsx`, `DashboardPage.tsx`, `TodoListPage.tsx`

#### Feature/Component (피처/컴포넌트)

- 도메인 단위 기능 모음이다. `features/` 아래 도메인별로 구성하며, 각 도메인의 UI 컴포넌트를 포함한다.
- 공통 UI 컴포넌트(`components/`)와 구분되며, 도메인 종속적인 표현 로직을 담는다.
- 예: `features/todo/components/TodoList.tsx`, `features/auth/components/LoginForm.tsx`

#### Hook (훅)

- TanStack Query를 활용한 서버 상태 관리 훅과 Zustand 스토어 접근 훅을 포함한다.
- 서버로부터 데이터를 가져오거나, 뮤테이션을 수행하는 비즈니스 흐름을 캡슐화한다.
- 예: `useTodos.ts`, `useCreateTodo.ts`, `useAuth.ts`

#### API Client (API 클라이언트)

- axios 인스턴스를 기반으로 실제 HTTP 요청 함수를 구현한다.
- 인터셉터를 통해 공통 인증 헤더(Authorization) 추가, 토큰 갱신, 에러 응답 파싱을 처리한다.
- 예: `features/todo/api/todoApi.ts`

### 2.3 의존성 방향 규칙

| 원칙 | 설명 |
|------|------|
| 상위 레이어만 하위 레이어 참조 | Page → Feature, Feature → Hook, Hook → API Client 방향만 허용 |
| 도메인 로직은 Service에만 존재 | 백엔드 비즈니스 규칙은 Service 레이어에 집중 |
| DB 직접 접근은 Repository에만 허용 | Service, Controller에서 `pg` 직접 사용 금지 |
| 프론트엔드 서버 상태는 TanStack Query 관리 | 서버 데이터를 Zustand에 직접 저장하는 패턴 금지 |
| 프론트엔드 클라이언트 상태는 Zustand 관리 | 인증 상태, UI 상태 등 서버와 무관한 상태에 사용 |

---

## 3. 코드/네이밍 원칙

### 3.1 파일명 규칙

| 파일 유형 | 규칙 | 예시 |
|-----------|------|------|
| React 컴포넌트 | PascalCase, `.tsx` 확장자 | `TodoList.tsx`, `TodoCard.tsx`, `LoginForm.tsx` |
| React 훅 | camelCase, `use` prefix, `.ts` 확장자 | `useTodos.ts`, `useAuth.ts`, `useCreateTodo.ts` |
| 백엔드 서비스 | camelCase, `.service.ts` suffix | `todoService.ts`, `authService.ts` |
| 백엔드 레포지토리 | camelCase, `.repository.ts` suffix | `todoRepository.ts`, `userRepository.ts` |
| 백엔드 컨트롤러 | camelCase, `.controller.ts` suffix | `todoController.ts`, `authController.ts` |
| 백엔드 라우터 | kebab-case, `.router.ts` suffix | `todo-router.ts`, `auth-router.ts` |
| 타입/인터페이스 정의 | PascalCase, `.types.ts` suffix | `TodoStatus.ts`, `UserDto.ts`, `todo.types.ts` |
| 미들웨어 | camelCase, `.middleware.ts` suffix | `auth.middleware.ts`, `error.middleware.ts` |
| 유틸리티 | camelCase, `.ts` 확장자 | `dateUtils.ts`, `jwtUtils.ts` |
| 상수 파일 | camelCase 또는 도메인명, `.ts` 확장자 | `todoConstants.ts`, `errorCodes.ts` |

### 3.2 변수/함수명 규칙

**함수명**: 동사+목적어 형태로 작성한다.

| 패턴 | 예시 |
|------|------|
| 생성 | `createTodo`, `createTeam`, `createCategory` |
| 조회 (단건) | `findTodoById`, `findUserByEmail`, `findTeamById` |
| 조회 (목록) | `findTodosByUserId`, `findTodayTodos`, `findTeamMembers` |
| 수정 | `updateTodo`, `updateTodoStatus`, `updateUserProfile` |
| 삭제 | `deleteTodo`, `deleteTeam`, `deleteCategory` |
| 검증 | `validateTodoStatusTransition`, `validateTeamMembership` |
| 발송 | `sendTeamInviteNotification`, `sendDueDateReminder` |

**Boolean 변수**: `is`, `has`, `can` prefix를 사용한다.

```typescript
const isRead: boolean;         // 알림 읽음 여부 (Notification.is_read)
const hasPermission: boolean;  // 권한 보유 여부
const canDelete: boolean;      // 삭제 가능 여부
const isExpired: boolean;      // 초대 만료 여부
```

**상수**: UPPER_SNAKE_CASE를 사용한다.

```typescript
const MAX_PAGE_SIZE = 100;
const JWT_ACCESS_TOKEN_EXPIRES_IN = '1h';
const JWT_REFRESH_TOKEN_EXPIRES_IN = '7d';
const PASSWORD_RESET_LINK_EXPIRES_MINUTES = 30;
const TODO_STATUS = { PLANNED: 'PLANNED', IN_PROGRESS: 'IN_PROGRESS', DONE: 'DONE', ON_HOLD: 'ON_HOLD' } as const;
```

**DB 컬럼명**: snake_case를 사용한다 (PostgreSQL 관례).

```sql
user_id, due_date, is_read, created_at, updated_at,
actor_user_id, before_value, after_value, owner_type
```

**TypeScript 인터페이스**: I prefix를 사용하지 않으며, 순수 PascalCase를 사용한다.

```typescript
// 올바른 예
interface Todo { ... }
interface CreateTodoRequest { ... }
interface ApiResponse<T> { ... }

// 금지된 예
interface ITodo { ... }
```

### 3.3 API 엔드포인트 네이밍 (REST)

REST 설계 원칙에 따라 명사 복수형 리소스를 사용한다.

**개인 리소스**

| HTTP 메서드 | 엔드포인트 | 설명 |
|-------------|------------|------|
| `GET` | `/todos` | 할일 목록 조회 |
| `POST` | `/todos` | 할일 생성 |
| `GET` | `/todos/:id` | 할일 상세 조회 |
| `PATCH` | `/todos/:id` | 할일 수정 |
| `DELETE` | `/todos/:id` | 할일 삭제 |
| `PATCH` | `/todos/:id/status` | 진행 상태 변경 |
| `GET` | `/todos/today` | 오늘 할일 조회 (KST 기준) |
| `GET` | `/todos/this-week` | 이번 주 할일 조회 (KST 기준) |
| `GET` | `/categories` | 카테고리 목록 조회 |
| `POST` | `/categories` | 카테고리 생성 |
| `PATCH` | `/categories/:id` | 카테고리 수정 |
| `DELETE` | `/categories/:id` | 카테고리 삭제 |

**팀 중첩 리소스**

| HTTP 메서드 | 엔드포인트 | 설명 |
|-------------|------------|------|
| `GET` | `/teams` | 내 팀 목록 조회 |
| `POST` | `/teams` | 팀 생성 |
| `GET` | `/teams/:teamId` | 팀 상세 조회 |
| `PATCH` | `/teams/:teamId` | 팀 정보 수정 |
| `DELETE` | `/teams/:teamId` | 팀 삭제 |
| `GET` | `/teams/:teamId/todos` | 팀 할일 목록 조회 |
| `GET` | `/teams/:teamId/members` | 팀 멤버 목록 조회 |
| `PATCH` | `/teams/:teamId/members/:userId/role` | 팀 멤버 역할 변경 |
| `DELETE` | `/teams/:teamId/members/:userId` | 팀 멤버 추방 |
| `POST` | `/teams/:teamId/invitations` | 팀 초대 생성 |
| `PATCH` | `/invitations/:invitationId/accept` | 팀 초대 수락 |
| `PATCH` | `/invitations/:invitationId/decline` | 팀 초대 거절 |

**인증/알림**

| HTTP 메서드 | 엔드포인트 | 설명 |
|-------------|------------|------|
| `POST` | `/auth/register` | 회원가입 |
| `POST` | `/auth/login` | 로그인 |
| `POST` | `/auth/logout` | 로그아웃 |
| `POST` | `/auth/refresh` | 액세스 토큰 갱신 |
| `POST` | `/auth/password-reset/request` | 비밀번호 재설정 요청 |
| `POST` | `/auth/password-reset/confirm` | 비밀번호 재설정 확인 |
| `GET` | `/users/me` | 내 정보 조회 |
| `PATCH` | `/users/me` | 내 정보 수정 |
| `DELETE` | `/users/me` | 회원 탈퇴 |
| `GET` | `/notifications` | 알림 목록 조회 |
| `PATCH` | `/notifications/:id/read` | 알림 읽음 처리 |
| `PATCH` | `/notifications/read-all` | 전체 알림 읽음 처리 |

**에러 응답 포맷**

```json
{
  "code": "ERROR_CODE",
  "message": "오류 설명"
}
```

### 3.4 도메인 기반 그룹핑

도메인 정의서(v1.3)에서 정의된 서브도메인(Identity & Access, Todo Management, Category, Team Collaboration, Notification, Audit)을 코드 구조에 직접 반영한다.

**백엔드 모듈 단위**

| 모듈 | 포함 엔티티 | 비즈니스 규칙 |
|------|------------|--------------|
| `auth` | AuthToken | AUTH-001~006, USR-002, USR-005 |
| `user` | User | USR-001~003, USR-005 |
| `todo` | Todo, TodoStatus | TODO-001~010 |
| `category` | Category | CAT-001~004 |
| `team` | Team, TeamMember, TeamInvitation | TEAM-001~005, INV-001~005 |
| `notification` | Notification | NOTIF-001~003 |
| `audit` | AuditLog | AUD-001~004 |

**프론트엔드 features 단위**

```
features/
├── auth/         # 로그인, 회원가입, 비밀번호 재설정
├── todo/         # 할일 CRUD, 상태 변경, 오늘/이번주 할일
├── category/     # 카테고리 CRUD
├── team/         # 팀 생성, 멤버 초대·역할 관리
└── notification/ # 알림 목록, 읽음 처리
```

---

## 4. 테스트/품질 원칙

### 4.1 테스트 파일 위치

소스 파일과 동일 디렉토리 또는 `__tests__/` 하위 디렉토리에 위치시킨다.

```
# 동일 디렉토리 방식 (권장)
modules/todo/
├── todo.service.ts
├── todo.service.test.ts
├── todo.repository.ts
└── todo.repository.test.ts

# __tests__ 방식
tests/
├── unit/
│   └── todo/
│       └── todoService.test.ts
└── integration/
    └── todo/
        └── todoRepository.test.ts
```

### 4.2 단위 테스트 (Unit Test)

Service 레이어의 핵심 비즈니스 로직을 우선적으로 단위 테스트로 검증한다.

**필수 단위 테스트 대상**

| 도메인 | 테스트 대상 비즈니스 규칙 |
|--------|--------------------------|
| Todo | `TODO-008` 상태 전이 매트릭스 (PLANNED→IN_PROGRESS, PLANNED→DONE 금지 등) |
| Todo | `TODO-002` 종료일 >= 시작일 검증 |
| Todo | `TODO-005/006/009` KST 기준 오늘/이번주 날짜 범위 계산 |
| Team | `TEAM-002` 마지막 ADMIN 보호 (역할 변경 시도, 탈퇴 시도) |
| Team | `TEAM-001` 팀 생성 시 자동 ADMIN 부여 |
| Invitation | `INV-002` 중복 초대 방지 (이미 소속 또는 PENDING 초대 존재) |
| Invitation | `INV-005` 만료된 초대 수락 불가 |
| Category | `CAT-001` 동일 소유자 내 카테고리명 중복 검증 |
| Auth | `AUTH-002/003` 할일 소유권 및 팀 역할 권한 검증 |

### 4.3 통합 테스트 (Integration Test)

Repository 레이어는 실제 PostgreSQL(테스트 전용 DB 인스턴스)에 연결하여 테스트한다. DB Mock을 사용하지 않는다.

- 테스트 실행 전 시드 데이터 삽입
- 각 테스트 케이스 실행 후 트랜잭션 롤백 또는 데이터 정리
- 연결 풀(`pg.Pool`) 설정은 테스트 환경 `.env.test`에서 분리 관리

### 4.4 E2E 테스트

핵심 사용자 시나리오를 E2E 테스트로 커버한다.

| 시나리오 | 검증 내용 |
|---------|-----------|
| 회원가입 → 로그인 흐름 | SC-A01, SC-A02 |
| 할일 CRUD 전체 흐름 | SC-T01, SC-T02, SC-T03, SC-T04 |
| 진행 상태 전이 | SC-T05 (허용/금지 전이 모두 검증) |
| 팀 생성 → 멤버 초대 → 수락 흐름 | SC-M01, SC-M02, SC-M03 |
| 알림 읽음 처리 | SC-N01 |

### 4.5 커버리지 목표

| 레이어 | 커버리지 목표 |
|--------|--------------|
| Service (비즈니스 로직) | 80% 이상 |
| Repository | 통합 테스트로 핵심 쿼리 검증 |
| Controller | 통합 테스트로 HTTP 응답 검증 |

### 4.6 PR 머지 조건

Pull Request 머지 전 다음 항목이 모두 통과해야 한다.

1. `eslint` 검사 통과 (lint 에러 0건)
2. `tsc --noEmit` 타입 검사 통과
3. 단위 테스트 전체 통과
4. Service 레이어 커버리지 80% 이상 유지

---

## 5. 설정/보안/운영 원칙

### 5.1 환경별 설정 파일

```
.env.development    # 개발 환경
.env.test           # 테스트 환경 (CI/CD 포함)
.env.production     # 운영 환경
.env.example        # 필요한 환경 변수 목록 (값 없이 키만 기재, 형상관리 포함)
```

- 모든 `.env.*` 파일은 `.gitignore`에 반드시 포함한다. `.env.example`만 형상관리 저장소에 포함한다.
- 애플리케이션 시작 시 필수 환경 변수 존재 여부를 검증하고, 누락된 경우 즉시 프로세스를 종료한다.

**필수 환경 변수 목록**

```
# DB
DATABASE_URL
DATABASE_POOL_MIN
DATABASE_POOL_MAX

# JWT
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT
NODE_ENV

# Email (비밀번호 재설정)
EMAIL_SERVICE_API_KEY
EMAIL_FROM_ADDRESS
```

### 5.2 비밀번호 보안

- 비밀번호는 `bcrypt` 알고리즘으로 해싱하여 저장한다. 평문 저장을 절대 금지한다. (`USR-002`)
- bcrypt 작업 인수(work factor)는 최소 12 이상을 권장한다.
- 비밀번호는 로그, 감사 로그, 응답 바디 어디에도 노출하지 않는다.
- 비밀번호 정책: 최소 8자, 영문자·숫자·특수문자 각 1자 이상 포함 (`USR-002-1`)

### 5.3 JWT 관리

- 액세스 토큰 유효 기간: 1시간 (`AUTH-006`)
- 리프레시 토큰 유효 기간: 7일 (`AUTH-006`)
- JWT 시크릿은 환경 변수로 관리하며 소스코드에 포함하지 않는다.
- 리프레시 토큰은 PostgreSQL 테이블에 저장하여 무효화(로그아웃, 탈퇴) 시 즉시 폐기할 수 있도록 한다.
- 만료 또는 유효하지 않은 토큰으로 요청 시 HTTP `401 Unauthorized`를 반환한다.

### 5.4 HTTPS

- 운영 환경에서 HTTPS를 필수로 적용한다. HTTP 접근 시 HTTPS로 리다이렉트한다. (`PRD 4.2`)
- HTTPS 종료는 리버스 프록시(nginx) 또는 로드밸런서 레벨에서 처리한다.
- 로컬 개발 환경에서는 HTTPS를 선택적으로 적용한다.

### 5.5 DB 커넥션 풀

- `pg.Pool`을 사용하여 커넥션 풀을 관리한다. ORM 사용을 금지한다.
- 풀 인스턴스는 싱글톤으로 관리한다. 요청마다 새 Pool을 생성하는 것을 금지한다.
- 500 CCU 목표(`PRD 4.1`)에 맞게 풀 크기를 설정한다.

```typescript
// config/database.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: parseInt(process.env.DATABASE_POOL_MIN || '5'),
  max: parseInt(process.env.DATABASE_POOL_MAX || '20'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 5.6 감사 로그 (Audit Log)

도메인 정의서의 `AUD-001~004` 규칙에 따라 다음 엔티티의 생성·수정·삭제 이벤트를 `AuditLog`에 기록한다.

| 대상 엔티티 | 기록 이벤트 |
|------------|------------|
| User | 정보 수정, 탈퇴(하드 삭제) |
| Todo | CREATE, UPDATE, DELETE |
| Category | CREATE, UPDATE, DELETE |
| Team | CREATE, UPDATE, DELETE |
| TeamMember | 역할 변경(UPDATE), 초대 수락(CREATE), 추방/탈퇴(DELETE) |
| TeamInvitation | CREATE, ACCEPTED, DECLINED, EXPIRED |

**감사 로그 저장 금지 항목** (`AUD-003`)

- `password_hash` 및 모든 형태의 비밀번호
- JWT 액세스 토큰, 리프레시 토큰
- 비밀번호 재설정 링크/토큰
- User 삭제 이벤트에서 이메일·이름 등 개인정보 (마스킹 처리 또는 제외)

- `actor_user_id`는 nullable로 관리하여 사용자 하드 삭제 후에도 감사 로그가 보존되도록 한다. (`AUD-004`)

### 5.7 입력 검증 및 SQL 인젝션 방지

- 모든 API 요청의 바디, 파라미터, 쿼리스트링은 `validate.middleware.ts`에서 스키마 기반으로 검증한다.
- `pg` 라이브러리의 파라미터 바인딩(`$1`, `$2` 형식)을 사용하여 SQL 인젝션을 방지한다. 문자열 연결 방식의 쿼리 조립을 금지한다.

```typescript
// 올바른 예 (파라미터 바인딩)
const result = await pool.query(
  'SELECT * FROM todos WHERE user_id = $1 AND status = $2',
  [userId, status]
);

// 금지된 예 (문자열 연결)
const result = await pool.query(
  `SELECT * FROM todos WHERE user_id = '${userId}'`
);
```

---

## 6. 백엔드 디렉토리 구조

도메인 기반 모듈형 구조를 채택한다. 각 도메인 모듈은 router, controller, service, repository, types를 동일 디렉토리 내에 응집하여 관리한다.

```
backend/
├── src/
│   ├── app.ts                        # Express 앱 초기화, 미들웨어 등록, 라우터 마운트
│   ├── server.ts                     # HTTP 서버 진입점, 포트 바인딩, 종료 처리
│   ├── config/
│   │   ├── env.ts                    # 환경 변수 로드 및 필수 변수 존재 여부 시작 시 검증
│   │   └── database.ts               # pg.Pool 싱글톤 인스턴스 생성 및 내보내기
│   ├── middlewares/
│   │   ├── auth.middleware.ts        # JWT 액세스 토큰 검증, req.user에 사용자 정보 주입
│   │   ├── error.middleware.ts       # 전역 에러 핸들러, 에러 유형별 HTTP 상태 코드 매핑
│   │   └── validate.middleware.ts    # 요청 바디/파라미터 스키마 검증 (Joi 또는 Zod 활용)
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.router.ts        # POST /auth/register, /login, /logout, /refresh 등 라우트 정의
│   │   │   ├── auth.controller.ts    # 인증 요청/응답 처리, 토큰 발급 응답
│   │   │   ├── auth.service.ts       # 로그인 검증, JWT 생성·갱신·무효화, 비밀번호 재설정 로직
│   │   │   └── auth.types.ts         # LoginRequest, TokenPayload, AuthTokens 등 타입 정의
│   │   ├── user/
│   │   │   ├── user.router.ts        # GET/PATCH /users/me, DELETE /users/me 라우트 정의
│   │   │   ├── user.controller.ts    # 사용자 정보 조회·수정·탈퇴 요청/응답 처리
│   │   │   ├── user.service.ts       # USR-001~003 규칙 구현, bcrypt 해싱, 탈퇴 시 하드 삭제
│   │   │   ├── user.repository.ts    # users 테이블 CRUD 쿼리
│   │   │   └── user.types.ts         # User, CreateUserRequest, UpdateUserRequest 등 타입 정의
│   │   ├── todo/
│   │   │   ├── todo.router.ts        # /todos, /todos/:id, /todos/:id/status 등 라우트 정의
│   │   │   ├── todo.controller.ts    # 할일 CRUD, 상태 변경, 오늘/이번주 조회 요청/응답 처리
│   │   │   ├── todo.service.ts       # TODO-001~010 규칙 구현, 상태 전이 매트릭스 검증, KST 날짜 계산
│   │   │   ├── todo.repository.ts    # todos 테이블 CRUD, 날짜 범위 조회, 검색·필터 쿼리
│   │   │   └── todo.types.ts         # Todo, TodoStatus, CreateTodoRequest, UpdateTodoRequest 등
│   │   ├── category/
│   │   │   ├── category.router.ts    # /categories 라우트 정의
│   │   │   ├── category.controller.ts
│   │   │   ├── category.service.ts   # CAT-001~004 규칙 구현, 삭제 시 category_id NULL 처리
│   │   │   ├── category.repository.ts # categories 테이블 CRUD, 소유자 기반 조회
│   │   │   └── category.types.ts     # Category, OwnerType, CreateCategoryRequest 등
│   │   ├── team/
│   │   │   ├── team.router.ts        # /teams, /teams/:teamId, /teams/:teamId/members 등
│   │   │   ├── team.controller.ts
│   │   │   ├── team.service.ts       # TEAM-001~005, INV-001~005 규칙 구현, ADMIN 최소 유지 검증
│   │   │   ├── team.repository.ts    # teams, team_members, team_invitations 테이블 쿼리
│   │   │   └── team.types.ts         # Team, TeamMember, TeamRole, TeamInvitation, InvitationStatus 등
│   │   ├── notification/
│   │   │   ├── notification.router.ts  # /notifications, /notifications/:id/read 라우트
│   │   │   ├── notification.controller.ts
│   │   │   ├── notification.service.ts # NOTIF-001~003 규칙 구현, 알림 생성·읽음 처리
│   │   │   ├── notification.repository.ts # notifications 테이블 CRUD
│   │   │   └── notification.types.ts   # Notification, NotificationType 등
│   │   └── audit/
│   │       ├── audit.service.ts        # AUD-001~004 규칙 구현, 엔티티 변경 이력 기록
│   │       ├── audit.repository.ts     # audit_logs 테이블 INSERT 쿼리
│   │       └── audit.types.ts          # AuditLog, ChangeType, EntityType 등
│   ├── shared/
│   │   ├── types/
│   │   │   ├── api.types.ts            # ApiResponse<T>, PaginatedResponse<T>, ErrorResponse 공통 타입
│   │   │   └── pagination.types.ts     # Pagination, PaginationQuery 타입
│   │   ├── utils/
│   │   │   ├── dateUtils.ts            # KST 날짜 변환, 오늘/이번주 날짜 범위 계산 (TODO-009)
│   │   │   ├── jwtUtils.ts             # JWT 생성·검증·파싱 유틸
│   │   │   └── passwordUtils.ts        # bcrypt 해싱·비교 유틸
│   │   └── errors/
│   │       ├── AppError.ts             # 커스텀 에러 기본 클래스 (statusCode, code 포함)
│   │       ├── NotFoundError.ts        # 404 Not Found
│   │       ├── ForbiddenError.ts       # 403 Forbidden
│   │       ├── UnauthorizedError.ts    # 401 Unauthorized
│   │       ├── ConflictError.ts        # 409 Conflict
│   │       └── UnprocessableError.ts   # 422 Unprocessable Entity (비즈니스 규칙 위반)
│   └── db/
│       └── seeds/                      # 개발·테스트용 시드 데이터 SQL
├── tests/
│   ├── unit/                           # Service 레이어 단위 테스트
│   │   ├── todo/
│   │   │   └── todoService.test.ts
│   │   ├── team/
│   │   │   └── teamService.test.ts
│   │   └── ...
│   └── integration/                    # Repository 레이어 실제 DB 연결 통합 테스트
│       ├── todo/
│       │   └── todoRepository.test.ts
│       └── ...
├── .env.example                        # 필요한 환경 변수 키 목록 (값 없이)
├── package.json
└── tsconfig.json
```

### 주요 디렉토리/파일 역할 요약

| 경로 | 역할 |
|------|------|
| `src/app.ts` | Express 앱 생성, 미들웨어 체인 구성, 모든 라우터 마운트 |
| `src/server.ts` | `app.ts`에서 생성된 앱으로 HTTP 서버 시작, graceful shutdown 처리 |
| `src/config/env.ts` | `dotenv` 로드, 필수 환경 변수 누락 시 시작 시점에 오류 발생 |
| `src/config/database.ts` | `pg.Pool` 싱글톤 생성, 커넥션 풀 설정 |
| `src/middlewares/auth.middleware.ts` | `Authorization: Bearer` 헤더에서 JWT 추출·검증, `req.user` 주입 |
| `src/middlewares/error.middleware.ts` | Express 4단계 에러 핸들러, `AppError` 서브클래스별 HTTP 상태 코드 응답 |
| `src/modules/{domain}/` | 각 도메인 모듈. router → controller → service → repository 레이어 응집 |
| `src/shared/errors/` | HTTP 상태 코드별 커스텀 에러 클래스, Service에서 throw하여 에러 핸들러로 전파 |
| `src/shared/utils/dateUtils.ts` | KST(UTC+9) 날짜 계산 유틸. `TODO-009` 준수를 위해 모든 날짜 관련 로직 집중 |
| `src/db/seeds/` | 개발 환경 초기 데이터 및 테스트 픽스처 |

---

## 7. 프론트엔드 디렉토리 구조

도메인별 `features/` 구조를 채택하며, 공통 UI 컴포넌트와 도메인 종속 컴포넌트를 분리한다.

```
frontend/
├── src/
│   ├── main.tsx                        # Vite 진입점. ReactDOM.createRoot, QueryClientProvider, 라우터 마운트
│   ├── App.tsx                         # 최상위 라우터 설정. 인증 여부에 따른 라우트 보호 처리
│   ├── assets/                         # 정적 파일 (이미지, 폰트, SVG 아이콘 등)
│   ├── components/                     # 도메인에 종속되지 않는 공통 UI 컴포넌트
│   │   ├── Button.tsx                  # 공통 버튼 컴포넌트 (variant, size, loading 상태)
│   │   ├── Modal.tsx                   # 공통 모달 컴포넌트
│   │   ├── Input.tsx                   # 공통 입력 필드 컴포넌트
│   │   ├── Badge.tsx                   # 진행 상태·역할 표시용 뱃지
│   │   ├── Spinner.tsx                 # 로딩 스피너
│   │   └── Pagination.tsx             # 목록 페이지네이션
│   ├── features/                       # 도메인별 기능 모듈
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx       # 이메일·비밀번호 로그인 폼 (SC-A02)
│   │   │   │   └── RegisterForm.tsx    # 회원가입 폼 (SC-A01)
│   │   │   ├── hooks/
│   │   │   │   ├── useLogin.ts         # TanStack Query mutation: POST /auth/login
│   │   │   │   ├── useRegister.ts      # TanStack Query mutation: POST /auth/register
│   │   │   │   └── useLogout.ts        # TanStack Query mutation: POST /auth/logout
│   │   │   ├── stores/
│   │   │   │   └── authStore.ts        # Zustand: 액세스 토큰, 사용자 정보 클라이언트 상태
│   │   │   ├── api/
│   │   │   │   └── authApi.ts          # login, register, logout, refresh 함수
│   │   │   └── types.ts                # LoginRequest, RegisterRequest, AuthUser 등
│   │   ├── todo/
│   │   │   ├── components/
│   │   │   │   ├── TodoList.tsx        # 할일 목록 표시
│   │   │   │   ├── TodoCard.tsx        # 할일 카드 (진행 상태 색상 구분)
│   │   │   │   ├── TodoForm.tsx        # 할일 생성·수정 폼
│   │   │   │   └── TodoStatusSelect.tsx # 상태 전이 매트릭스 기반 선택 드롭다운 (TODO-008)
│   │   │   ├── hooks/
│   │   │   │   ├── useTodos.ts         # TanStack Query query: GET /todos
│   │   │   │   ├── useTodayTodos.ts    # TanStack Query query: GET /todos/today
│   │   │   │   ├── useThisWeekTodos.ts # TanStack Query query: GET /todos/this-week
│   │   │   │   ├── useCreateTodo.ts    # TanStack Query mutation: POST /todos
│   │   │   │   ├── useUpdateTodo.ts    # TanStack Query mutation: PATCH /todos/:id
│   │   │   │   ├── useDeleteTodo.ts    # TanStack Query mutation: DELETE /todos/:id
│   │   │   │   └── useUpdateTodoStatus.ts # TanStack Query mutation: PATCH /todos/:id/status
│   │   │   ├── api/
│   │   │   │   └── todoApi.ts
│   │   │   └── types.ts                # Todo, TodoStatus, CreateTodoRequest 등
│   │   ├── category/
│   │   │   ├── components/
│   │   │   │   ├── CategoryList.tsx
│   │   │   │   └── CategoryForm.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useCategories.ts
│   │   │   │   ├── useCreateCategory.ts
│   │   │   │   ├── useUpdateCategory.ts
│   │   │   │   └── useDeleteCategory.ts
│   │   │   ├── api/
│   │   │   │   └── categoryApi.ts
│   │   │   └── types.ts
│   │   ├── team/
│   │   │   ├── components/
│   │   │   │   ├── TeamList.tsx
│   │   │   │   ├── TeamMemberList.tsx
│   │   │   │   └── InviteMemberForm.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useTeams.ts
│   │   │   │   ├── useTeamMembers.ts
│   │   │   │   ├── useCreateTeam.ts
│   │   │   │   ├── useInviteMember.ts
│   │   │   │   ├── useAcceptInvitation.ts
│   │   │   │   └── useDeclineInvitation.ts
│   │   │   ├── api/
│   │   │   │   └── teamApi.ts
│   │   │   └── types.ts                # Team, TeamMember, TeamRole, TeamInvitation 등
│   │   └── notification/
│   │       ├── components/
│   │       │   ├── NotificationList.tsx
│   │       │   └── NotificationItem.tsx
│   │       ├── hooks/
│   │       │   ├── useNotifications.ts
│   │       │   └── useMarkAsRead.ts
│   │       ├── api/
│   │       │   └── notificationApi.ts
│   │       └── types.ts
│   ├── pages/                          # React Router 라우트 단위 페이지 컴포넌트
│   │   ├── LoginPage.tsx               # /login
│   │   ├── RegisterPage.tsx            # /register
│   │   ├── DashboardPage.tsx           # / (오늘 할일, 이번주 할일 요약)
│   │   ├── TodoListPage.tsx            # /todos (전체 목록, 검색, 필터)
│   │   ├── TodoDetailPage.tsx          # /todos/:id
│   │   ├── CategoryPage.tsx            # /categories
│   │   ├── TeamPage.tsx                # /teams
│   │   ├── TeamDetailPage.tsx          # /teams/:teamId
│   │   ├── NotificationPage.tsx        # /notifications
│   │   ├── ProfilePage.tsx             # /profile
│   │   └── PasswordResetPage.tsx       # /password-reset
│   ├── router/
│   │   ├── index.tsx                   # createBrowserRouter 설정
│   │   └── ProtectedRoute.tsx          # 인증 여부에 따라 /login으로 리다이렉트하는 가드 컴포넌트
│   ├── lib/
│   │   ├── axios.ts                    # axios 인스턴스 생성, 요청 인터셉터(Authorization 헤더), 응답 인터셉터(401 시 토큰 갱신)
│   │   └── queryClient.ts             # TanStack Query QueryClient 생성 및 기본 옵션 설정
│   └── shared/
│       ├── types/
│       │   ├── api.types.ts            # ApiResponse<T>, PaginatedResponse<T>, ErrorResponse 공통 타입
│       │   └── common.types.ts         # UUID, DateString 등 공통 원시 타입
│       ├── utils/
│       │   ├── dateUtils.ts            # 날짜 포맷, KST 표시 유틸
│       │   └── errorUtils.ts          # API 에러 메시지 파싱 유틸
│       └── constants/
│           ├── todoStatus.ts           # TODO_STATUS enum 상수, 상태 전이 매트릭스 (TODO-008)
│           ├── teamRole.ts             # TEAM_ROLE enum 상수 (ADMIN, MEMBER, VIEWER)
│           └── routes.ts              # 라우트 경로 상수 (ROUTES.LOGIN, ROUTES.DASHBOARD 등)
├── public/                             # index.html, favicon, robots.txt 등 정적 파일
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts                      # Vite 빌드 설정, 환경 변수 접두사(VITE_) 설정, 프록시 설정
```

### 주요 디렉토리/파일 역할 요약

| 경로 | 역할 |
|------|------|
| `src/main.tsx` | Vite 진입점. `QueryClientProvider`, `RouterProvider` 루트 마운트 |
| `src/App.tsx` | 최상위 라우터 구성. 인증 필요 라우트는 `ProtectedRoute`로 감싼다 |
| `src/components/` | 도메인 독립적인 재사용 가능한 UI 컴포넌트 (Button, Modal, Input 등) |
| `src/features/{domain}/` | 도메인별 컴포넌트, 훅, 스토어, API 함수, 타입을 응집하여 관리 |
| `src/features/{domain}/hooks/` | TanStack Query를 활용한 서버 상태 관리 훅. 데이터 fetching, mutation, 캐시 무효화 담당 |
| `src/features/auth/stores/authStore.ts` | Zustand 스토어. 액세스 토큰, 현재 로그인 사용자 정보 등 클라이언트 상태 관리 |
| `src/features/{domain}/api/` | axios 인스턴스를 사용한 API 호출 함수 모음. 훅에서만 호출한다 |
| `src/pages/` | URL 라우트 단위 페이지 컴포넌트. Feature 컴포넌트를 조합하여 레이아웃 구성 |
| `src/router/ProtectedRoute.tsx` | 미인증 사용자를 `/login`으로 리다이렉트하는 라우트 가드 |
| `src/lib/axios.ts` | axios 기본 인스턴스. 모든 요청에 `Authorization: Bearer` 헤더 자동 추가, 401 응답 시 리프레시 토큰으로 자동 갱신 처리 |
| `src/lib/queryClient.ts` | TanStack Query 전역 설정 (staleTime, retry 정책, 에러 처리 등) |
| `src/shared/constants/todoStatus.ts` | `TODO-008` 상태 전이 매트릭스를 프론트엔드에서도 정의하여 UI에서 허용된 상태만 표시 |

---

## 8. 모노레포 vs 분리 레포 구조 결정

```
todolist-app/           # 루트 (모노레포 방식)
├── frontend/
├── backend/
├── docs/
└── README.md
```

이 프로젝트는 단일 Git 저장소 내에 `frontend/`와 `backend/`를 함께 관리하는 **모노레포(monorepo) 방식**을 채택한다. 프론트엔드와 백엔드가 공유하는 타입 정의(예: `TodoStatus`, `TeamRole`, `ApiResponse`) 및 공통 상수를 `shared/` 패키지 또는 단순 디렉토리로 손쉽게 참조할 수 있고, API 계약 변경이 발생했을 때 동일 커밋에서 프론트·백엔드를 동시에 수정하여 불일치를 방지할 수 있다는 이점이 있다. 또한 단일 팀이 두 영역을 함께 개발하는 초기 단계에서는 PR 리뷰, CI 파이프라인, 환경 설정을 하나의 저장소에서 통합 관리하는 것이 운영 오버헤드를 낮춘다.

---

## 9. 변경 이력

| 버전 | 날짜 | 변경자 | 변경 내용 |
|------|------|--------|-----------|
| v1.0 | 2026-05-13 | Architect | 초안 작성 (도메인 정의서 v1.3, PRD v1.3 기반) |
| v1.1 | 2026-05-13 | Reviewer | 기술 스택 일관성 검토 반영: 문서 상단에 기술 스택 버전 표(React 19, TanStack Query v5, PostgreSQL 17 등) 추가 |
| v1.2 | 2026-05-13 | Reviewer | 확정된 기술 스택 전면 반영: 프론트엔드(Tailwind CSS v3, Axios 1.x, React Router v7, React Hook Form 7.x, Vitest+RTL, Zustand 5.x, Vite 6.x), 백엔드(Node.js 22 LTS, Express 5.x, pg 8.x, Zod 3.x, Winston 3.x, swagger-jsdoc 6.x, Jest+Supertest), 인프라(pnpm, Docker+docker-compose, Nodemailer+SMTP) 버전 명시. DB 마이그레이션 도구 제외. |
