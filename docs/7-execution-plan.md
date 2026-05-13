# 실행계획서 (Execution Plan) - Todolist-App

| 항목      | 내용                                                                                       |
| --------- | ------------------------------------------------------------------------------------------ |
| 문서 버전 | v1.0                                                                                       |
| 작성일    | 2026-05-13                                                                                 |
| 참조 문서 | docs/2-prd.md (v1.4), docs/4-project-structure.md (v1.2), docs/6-erd.md (v1.0)            |
| 상태      | 초안                                                                                       |

---

## 목차

1. [전체 태스크 개요](#1-전체-태스크-개요)
2. [실행 순서 및 의존성 흐름](#2-실행-순서-및-의존성-흐름)
3. [데이터베이스 (Database)](#3-데이터베이스-database)
4. [백엔드 (Backend)](#4-백엔드-backend)
5. [프론트엔드 (Frontend)](#5-프론트엔드-frontend)
6. [변경 이력](#6-변경-이력)

---

## 1. 전체 태스크 개요

| ID     | 태스크 제목                                     | 예상 기간 | 선행 태스크         |
| ------ | ----------------------------------------------- | --------- | ------------------- |
| DB-001 | 개발 환경 Docker Compose 설정                   | 1일       | 없음                |
| DB-002 | pg_trgm 확장 활성화                             | 0.5일     | DB-001              |
| DB-003 | schema.sql DDL 실행 및 검증                     | 1일       | DB-001, DB-002      |
| DB-004 | 개발용 시드 데이터 작성                         | 1일       | DB-003              |
| DB-005 | 통합 테스트용 테스트 DB 설정                    | 1일       | DB-001, DB-003      |
| DB-006 | DB 커넥션 풀 설정 및 검증                       | 1일       | DB-001, DB-003      |
| BE-001 | 백엔드 프로젝트 초기화 및 개발 환경 구성        | 1일       | 없음                |
| BE-002 | 공통 인프라 (DB Pool, 에러 클래스, 로깅, 검증)  | 2일       | BE-001              |
| BE-003 | 인증 모듈 (auth)                                | 3일       | BE-002, DB-003      |
| BE-004 | 사용자 모듈 (user)                              | 2일       | BE-002, BE-003      |
| BE-005 | 할일 모듈 (todo)                                | 3일       | BE-002, BE-003      |
| BE-006 | 카테고리 모듈 (category)                        | 2일       | BE-002, BE-003      |
| BE-007 | 팀 모듈 (team)                                  | 4일       | BE-002, BE-003, BE-008 |
| BE-008 | 알림 모듈 (notification)                        | 2일       | BE-002, BE-003      |
| BE-009 | 감사 로그 모듈 (audit)                          | 2일       | BE-004~BE-007       |
| BE-010 | API 문서 (Swagger)                              | 1일       | BE-003~BE-008       |
| BE-011 | 통합 테스트 구성 및 모듈별 테스트 구현          | 3일       | BE-003~BE-009       |
| FE-001 | 프론트엔드 프로젝트 초기화 및 개발 환경 구성    | 1일       | 없음                |
| FE-002 | 공통 인프라 (axios, QueryClient, 공유 타입/상수) | 1일       | FE-001              |
| FE-003 | 공통 UI 컴포넌트 라이브러리                     | 2일       | FE-001              |
| FE-004 | 라우팅 설정 및 ProtectedRoute 구현              | 1일       | FE-002              |
| FE-005 | 인증 Feature (로그인, 회원가입, 비밀번호 재설정) | 3일       | FE-003, FE-004, BE-003 |
| FE-006 | 할일 Feature (CRUD, 상태 전이, 검색/필터)       | 4일       | FE-003, FE-005, BE-005 |
| FE-007 | 카테고리 Feature (CRUD 및 할일 필터 연동)       | 2일       | FE-003, FE-005, BE-006 |
| FE-008 | 팀 Feature (팀 관리, 멤버 초대, 역할 제어)      | 4일       | FE-003, FE-005, FE-006, BE-007 |
| FE-009 | 알림 Feature (목록 조회, 읽음 처리, 뱃지)       | 2일       | FE-003, FE-005, BE-008 |
| FE-010 | 내 정보 Feature (프로필 조회/수정, 회원 탈퇴)   | 1일       | FE-003, FE-005, BE-004 |
| FE-011 | 대시보드 페이지                                 | 1일       | FE-003, FE-006      |
| FE-012 | Vitest + RTL 설정 및 주요 단위 테스트           | 2일       | FE-003~FE-006       |

**총 태스크 수**: 29개 | **총 예상 기간**: 병렬 진행 시 약 4~5주

---

## 2. 실행 순서 및 의존성 흐름

```
[Phase 1 — 기반 구축] (병렬 가능)
  DB-001 ──► DB-002 ──► DB-003 ──► DB-004
                              └──► DB-005
                              └──► DB-006
  BE-001 ──► BE-002
  FE-001 ──► FE-002 ──► FE-004
         └──► FE-003

[Phase 2 — 핵심 모듈] (DB-003, BE-002 완료 후)
  BE-002 + DB-003 ──► BE-003 (인증)
  FE-003 + FE-004 + BE-003 ──► FE-005 (인증 UI)

[Phase 3 — 도메인 모듈] (BE-003, FE-005 완료 후, 병렬 가능)
  BE-003 ──► BE-004 (user)       FE-005 + BE-004 ──► FE-010
  BE-003 ──► BE-005 (todo)       FE-005 + BE-005 ──► FE-006
  BE-003 ──► BE-006 (category)   FE-005 + BE-006 ──► FE-007
  BE-003 ──► BE-008 (notification) FE-005 + BE-008 ──► FE-009
  BE-008 ──► BE-007 (team)       FE-006 + BE-007 ──► FE-008

[Phase 4 — 통합 및 마무리]
  BE-004~BE-007 ──► BE-009 (audit)
  BE-003~BE-008 ──► BE-010 (swagger)
  BE-003~BE-009 ──► BE-011 (test)
  FE-006 ──► FE-011 (dashboard)
  FE-003~FE-006 ──► FE-012 (test)
```

---

## 3. 데이터베이스 (Database)

---

### DB-001: 개발 환경 Docker Compose 설정

**설명**: PostgreSQL 17 컨테이너를 포함한 `docker-compose.yml`을 프로젝트 루트에 작성한다. 개발용 DB(`todolist_dev`)와 테스트용 DB(`todolist_test`)를 별도 데이터베이스로 구성하고, 볼륨 마운트, 포트 매핑(5432), 헬스체크, 환경 변수(POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB)를 포함한다.

**산출물**
- `docker-compose.yml` (프로젝트 루트)
- `.env.example` (DB 관련 환경 변수 키 포함)
- `.env.development` (로컬 개발용 실제 값, gitignore 대상)

**의존성**
- 없음

**완료 조건**
- [ ] `docker compose up -d` 실행 후 컨테이너 상태가 `healthy`로 전환된다
- [ ] `psql -h localhost -U <user> -d todolist_dev` 로 연결 성공한다
- [ ] `psql -h localhost -U <user> -d todolist_test` 로 연결 성공한다
- [ ] `docker compose down -v` 후 재기동해도 동일하게 동작한다
- [ ] `.env.example`에 `DATABASE_URL`, `DATABASE_POOL_MIN`, `DATABASE_POOL_MAX` 키가 존재한다

---

### DB-002: pg_trgm 확장 활성화

**설명**: 할일 제목 키워드 검색(UC-T09)을 위해 `pg_trgm` 확장을 `todolist_dev`와 `todolist_test` 데이터베이스 양쪽에 활성화한다. `database/schema.sql` 상단 Extensions 섹션에 `CREATE EXTENSION IF NOT EXISTS pg_trgm;` 구문을 추가한다.

**산출물**
- `database/schema.sql` (pg_trgm 활성화 구문 추가)

**의존성**
- [ ] DB-001: 개발 환경 Docker Compose 설정

**완료 조건**
- [ ] `todolist_dev`에서 `SELECT * FROM pg_extension WHERE extname = 'pg_trgm';` 결과 1건 반환된다
- [ ] `todolist_test`에서 동일 쿼리 결과 1건 반환된다
- [ ] pg_trgm 활성화 후 `idx_todos_title_trgm` 인덱스 생성이 오류 없이 완료된다

---

### DB-003: schema.sql DDL 실행 및 검증

**설명**: `database/schema.sql` 전체를 `todolist_dev` 데이터베이스에 실행하여 전체 테이블(9개), Enum 타입(8개), 제약조건, 인덱스를 생성한다. idempotent 실행을 위해 `IF NOT EXISTS` 구문 적용 여부를 검토하고 FK 의존성 순서가 올바른지 확인한다.

**산출물**
- 실행 완료된 `todolist_dev` 스키마 (DB 상태)
- `database/schema.sql` (최종 검증본)

**의존성**
- [ ] DB-001: 개발 환경 Docker Compose 설정
- [ ] DB-002: pg_trgm 확장 활성화

**완료 조건**
- [ ] `\dt` 명령으로 9개 테이블 전체 확인된다 (users, teams, categories, todos, team_members, team_invitations, notifications, audit_logs, refresh_tokens)
- [ ] `\dT` 명령으로 8개 Enum 타입 전체 확인된다 (todo_status, team_role, invitation_status, invitation_role, notification_type, category_owner_type, audit_entity_type, audit_change_type)
- [ ] `\d todos` 명령으로 `ck_todos_date_order`, `ck_todos_ownership` CHECK 제약조건이 존재함을 확인한다
- [ ] `categories` 테이블에 `uq_categories_owner_name` UNIQUE 제약조건이 존재한다
- [ ] `team_members` 테이블에 `uq_team_members_team_user` UNIQUE 제약조건이 존재한다
- [ ] `idx_todos_title_trgm` 인덱스가 존재한다
- [ ] schema.sql을 초기화 후 재실행해도 오류 없이 완료된다

---

### DB-004: 개발용 시드 데이터 작성

**설명**: 개발 환경에서 즉시 활용 가능한 시드 데이터를 작성한다. users 3건, teams 2건, team_members 4건(ADMIN·MEMBER·VIEWER 포함), categories 10건 이상(기본 6종 포함), todos 15건 이상(개인/팀/상태별/날짜별), team_invitations 2건(PENDING·EXPIRED), notifications 3건 이상을 삽입한다. 비밀번호는 bcrypt 해시값(`Test1234!` 기준)을 하드코딩한다.

**산출물**
- `database/seeds/dev_seed.sql`

**의존성**
- [ ] DB-003: schema.sql DDL 실행 및 검증

**완료 조건**
- [ ] `psql -f database/seeds/dev_seed.sql` 실행 후 오류 0건이다
- [ ] `SELECT COUNT(*) FROM users;` → 3 이상이다
- [ ] `SELECT COUNT(*) FROM todos;` → 15 이상이다
- [ ] `SELECT COUNT(*) FROM categories;` → 10 이상이다
- [ ] `SELECT status, COUNT(*) FROM todos GROUP BY status;` 에서 PLANNED, IN_PROGRESS, DONE, ON_HOLD 각 1건 이상 존재한다
- [ ] KST 기준 오늘 `start_date <= CURRENT_DATE <= due_date` 조건에 해당하는 todo가 1건 이상 존재한다
- [ ] 신규 사용자 기본 카테고리 6종(업무, 개인, 학습, 회의, 프로젝트, 긴급 업무)이 모두 존재한다

---

### DB-005: 통합 테스트용 테스트 DB 설정

**설명**: `todolist_test` DB에 schema.sql을 적용하고, Jest + Supertest 통합 테스트용 픽스처 스크립트와 teardown 헬퍼를 작성한다. `.env.test`로 연결 정보를 분리 관리하며, `NODE_ENV=test` 시 테스트 DB를 참조하도록 구성한다.

**산출물**
- `database/seeds/test_fixture.sql` (users 2건, team 1건, categories 6건)
- `.env.test`
- `backend/tests/helpers/dbHelper.ts`

**의존성**
- [ ] DB-001: 개발 환경 Docker Compose 설정
- [ ] DB-003: schema.sql DDL 실행 및 검증

**완료 조건**
- [ ] `todolist_test` DB에서 `\dt` 명령으로 9개 테이블 전체 확인된다
- [ ] `.env.test`의 `DATABASE_URL`이 `todolist_test`를 가리킨다
- [ ] `NODE_ENV=test` 환경으로 서버 기동 시 `todolist_test` DB에 연결됨을 로그에서 확인한다
- [ ] `dbHelper.ts`의 teardown 함수 호출 시 테스트 데이터가 정리되어 다음 테스트에 영향을 주지 않는다
- [ ] 2회 연속 테스트 실행 시 결과가 동일하다 (테스트 격리 보장)

---

### DB-006: DB 커넥션 풀 설정 및 검증

**설명**: `backend/src/config/database.ts`에 `pg.Pool` 싱글톤을 구현한다. 500 CCU 목표(PRD 4.1)에 맞게 `max: 20`, `min: 5`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 2000`을 기본값으로 설정하고, 환경 변수로 오버라이드 가능하도록 한다.

**산출물**
- `backend/src/config/database.ts`
- `backend/src/config/env.ts` (DATABASE_URL 등 필수 변수 검증 포함)

**의존성**
- [ ] DB-001: 개발 환경 Docker Compose 설정
- [ ] DB-003: schema.sql DDL 실행 및 검증

**완료 조건**
- [ ] `database.ts`를 여러 모듈에서 import해도 `pg.Pool` 인스턴스가 단 1개만 생성된다 (싱글톤)
- [ ] `DATABASE_URL` 환경 변수 누락 시 서버 시작 단계에서 오류 출력 후 프로세스가 종료된다
- [ ] `pool.query('SELECT 1')` 실행 성공한다
- [ ] `DATABASE_POOL_MAX` 환경 변수로 풀 최대 크기를 오버라이드할 수 있다
- [ ] 서버 기동 후 DB 연결 상태가 헬스체크(`GET /health`) 또는 로그로 확인된다

---

## 4. 백엔드 (Backend)

---

### BE-001: 프로젝트 초기화 및 개발 환경 구성

**설명**: `backend/` 디렉토리에 Node.js 22 LTS + TypeScript 5.x + Express 5.x 기반 프로젝트를 초기화한다. pnpm 워크스페이스 설정, `tsconfig.json` (`strict: true`), ESLint, Prettier, `.editorconfig`, `.env.example`, `src/app.ts`, `src/server.ts` (graceful shutdown 포함)를 작성한다.

**산출물**
- `backend/package.json`, `backend/tsconfig.json`, `backend/.eslintrc.*`, `backend/.prettierrc`
- `backend/.env.example`
- `backend/src/app.ts`, `backend/src/server.ts`
- `pnpm-workspace.yaml` (루트)

**의존성**
- 없음

**완료 조건**
- [ ] `pnpm install` 실행 시 오류 없이 의존성이 설치된다
- [ ] `tsc --noEmit` 실행 시 타입 오류가 0건이다
- [ ] `pnpm lint` 실행 시 ESLint 오류가 0건이다
- [ ] 서버 실행 후 `GET /health` 요청에 200 응답이 반환된다
- [ ] `tsconfig.json`에 `"strict": true`가 설정되어 있다
- [ ] `.env.example`에 `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PORT`, `NODE_ENV`, `EMAIL_SERVICE_API_KEY`, `EMAIL_FROM_ADDRESS`, `DATABASE_POOL_MIN`, `DATABASE_POOL_MAX`가 모두 명시되어 있다

---

### BE-002: 공통 인프라 구성

**설명**: 애플리케이션 공통 기반 구성요소를 구현한다. 필수 환경변수 시작 시점 검증(`env.ts`), `pg.Pool` 싱글톤(`database.ts`), 커스텀 에러 클래스 계층(`AppError` 및 서브클래스 5종), 전역 에러 핸들러 미들웨어, Zod 기반 요청 검증 미들웨어, Winston 구조화 로거, KST 날짜 유틸(`dateUtils.ts`)을 구현한다.

**산출물**
- `backend/src/config/env.ts`, `backend/src/config/database.ts`
- `backend/src/shared/errors/` (AppError, NotFoundError, ForbiddenError, UnauthorizedError, ConflictError, UnprocessableError)
- `backend/src/middlewares/error.middleware.ts`, `backend/src/middlewares/validate.middleware.ts`
- `backend/src/shared/types/api.types.ts`
- `backend/src/shared/utils/dateUtils.ts`

**의존성**
- [ ] BE-001: 프로젝트 초기화 및 개발 환경 구성

**완료 조건**
- [ ] 필수 환경변수 누락 시 서버 시작 단계에서 오류 메시지를 출력하며 프로세스가 종료된다
- [ ] `pg.Pool` 인스턴스가 싱글톤으로 생성된다
- [ ] `NotFoundError` throw 시 HTTP 404, `UnauthorizedError`는 401, `ForbiddenError`는 403, `ConflictError`는 409, `UnprocessableError`는 422로 응답된다
- [ ] 에러 응답 포맷이 `{"code": "...", "message": "..."}` 형식으로 통일된다
- [ ] Zod 스키마 검증 실패 시 HTTP 400과 함께 구체적인 필드 오류 메시지가 반환된다
- [ ] `dateUtils.ts`의 KST 기준 오늘/이번주 날짜 범위 계산 함수 단위 테스트가 통과한다
- [ ] Winston 로거가 요청 정보를 구조화된 JSON 포맷으로 출력한다

---

### BE-003: 인증 모듈 (auth)

**설명**: 회원가입, 로그인, 로그아웃, 액세스 토큰 갱신, 비밀번호 재설정 요청/확인을 구현한다. bcrypt(work factor 12 이상) 해싱, JWT 액세스 토큰(1h)/리프레시 토큰(7d) 발급, 리프레시 토큰 DB 저장/검증/폐기(`revoked_at`), Nodemailer 비밀번호 재설정 이메일(30분 유효), 회원가입 시 기본 카테고리 6종 자동 생성(CAT-003)을 구현한다.

**산출물**
- `backend/src/modules/auth/` (router, controller, service, types)
- `backend/src/middlewares/auth.middleware.ts`
- `backend/src/shared/utils/jwtUtils.ts`, `backend/src/shared/utils/passwordUtils.ts`

**의존성**
- [ ] BE-002: 공통 인프라 구성
- [ ] DB-003: schema.sql DDL 실행 및 검증

**완료 조건**
- [ ] `POST /auth/register` 비밀번호 정책 위반(8자 미만, 영문·숫자·특수문자 각 미포함) 시 400이 반환된다
- [ ] `POST /auth/register` 성공 시 201이 반환되고 users 테이블에 bcrypt 해시된 비밀번호가 저장된다
- [ ] `POST /auth/register` 성공 시 기본 카테고리 6종이 categories 테이블에 생성된다 (CAT-003)
- [ ] 중복 이메일로 회원가입 시 409가 반환된다
- [ ] `POST /auth/login` 성공 시 200과 함께 `access_token`, `refresh_token`이 반환된다
- [ ] `POST /auth/logout` 시 해당 리프레시 토큰에 `revoked_at`이 설정된다
- [ ] `POST /auth/refresh` 시 유효한 리프레시 토큰으로 새 액세스 토큰이 발급된다
- [ ] 폐기되거나 만료된 리프레시 토큰으로 갱신 요청 시 401이 반환된다
- [ ] 비밀번호 재설정 링크 발송 후 30분 경과 시 422가 반환된다
- [ ] `auth.middleware.ts`가 유효한 Bearer 토큰에서 `req.user`에 사용자 정보를 주입한다
- [ ] 인증 핵심 비즈니스 로직(토큰 검증, 비밀번호 해싱) 단위 테스트가 통과한다

---

### BE-004: 사용자 모듈 (user)

**설명**: 내 정보 조회, 수정, 회원 탈퇴(즉시 하드 삭제)를 구현한다. 탈퇴 시 `refresh_tokens` 전체 폐기 후 `users` 테이블에서 행을 삭제한다. 응답 바디에 `password_hash`를 포함하지 않는다.

**산출물**
- `backend/src/modules/user/` (router, controller, service, repository, types)

**의존성**
- [ ] BE-002: 공통 인프라 구성
- [ ] BE-003: 인증 모듈 (auth.middleware.ts 필요)

**완료 조건**
- [ ] `GET /users/me` 요청 시 인증된 사용자 정보가 200으로 반환된다 (password_hash 제외)
- [ ] `PATCH /users/me` 요청 시 수정 가능한 항목이 변경되고 200이 반환된다
- [ ] `DELETE /users/me` 요청 시 users 테이블에서 해당 행이 즉시 삭제된다 (소프트 삭제 없음, USR-003)
- [ ] 회원 탈퇴 후 해당 사용자의 refresh_tokens가 모두 폐기된다
- [ ] 인증 토큰 없이 접근 시 401이 반환된다
- [ ] 응답 바디에 `password_hash`가 절대 포함되지 않는다

---

### BE-005: 할일 모듈 (todo)

**설명**: 할일 CRUD, 상태 전이, 오늘/이번주 조회, 검색·필터·정렬을 구현한다. TODO-008 상태 전이 매트릭스(PLANNED→DONE 불가, IN_PROGRESS→PLANNED 불가, DONE→IN_PROGRESS 허용 등), TODO-009 KST 날짜 계산, TODO-010 개인/팀 할일 소유 구분, AUTH-002 소유자 검증, AUTH-003 팀 ADMIN·MEMBER 권한 검증을 구현한다.

**산출물**
- `backend/src/modules/todo/` (router, controller, service, repository, types)
- `backend/tests/unit/todo/todoService.test.ts`
- `backend/tests/integration/todo/todoRepository.test.ts`

**의존성**
- [ ] BE-002: 공통 인프라 구성
- [ ] BE-003: 인증 모듈 (auth.middleware.ts 필요)

**완료 조건**
- [ ] `POST /todos` 제목 누락 시 400이 반환된다 (TODO-001)
- [ ] `POST /todos` `due_date < start_date` 시 400이 반환된다 (TODO-002)
- [ ] `PATCH /todos/:id/status` 허용되지 않은 전이(예: PLANNED→DONE) 시 422가 반환된다 (TODO-008)
- [ ] `PATCH /todos/:id/status` DONE→IN_PROGRESS 전이가 200으로 성공한다
- [ ] `GET /todos/today` KST 기준 오늘 날짜 범위 할일이 반환된다 (TODO-009)
- [ ] `GET /todos/this-week` KST 기준 이번주 월~일 `due_date` 해당 할일이 반환된다
- [ ] 다른 사용자의 개인 할일 수정/삭제 시 403이 반환된다 (AUTH-002)
- [ ] VIEWER 역할 사용자가 팀 할일 생성 시 403이 반환된다 (AUTH-003)
- [ ] 상태 전이 매트릭스 전체 케이스(허용/불가) 단위 테스트가 통과한다

---

### BE-006: 카테고리 모듈 (category)

**설명**: 카테고리 CRUD와 소유자 권한 검증을 구현한다. CAT-001 동일 소유자 내 카테고리명 중복 불가, CAT-002 삭제 시 `todos.category_id` SET NULL, CAT-004 HEX #RRGGBB 색상 형식 검증을 구현한다. 사용자 카테고리는 해당 사용자만, 팀 카테고리는 해당 팀 ADMIN만 생성·수정·삭제 가능하다.

**산출물**
- `backend/src/modules/category/` (router, controller, service, repository, types)

**의존성**
- [ ] BE-002: 공통 인프라 구성
- [ ] BE-003: 인증 모듈 (auth.middleware.ts 필요)

**완료 조건**
- [ ] 동일 소유자 내 중복 카테고리명 생성 시 409가 반환된다 (CAT-001)
- [ ] 색상 필드에 `#RRGGBB` 형식이 아닌 값 입력 시 400이 반환된다 (CAT-004)
- [ ] `DELETE /categories/:id` 성공 후 해당 카테고리를 참조하는 todos의 `category_id`가 NULL로 변경된다 (CAT-002)
- [ ] 팀 카테고리에 대해 MEMBER·VIEWER 역할 사용자가 생성·수정·삭제 시 403이 반환된다
- [ ] 다른 사용자의 개인 카테고리 수정/삭제 시 403이 반환된다
- [ ] `GET /categories` 요청 시 인증된 사용자의 카테고리만 반환된다

---

### BE-007: 팀 모듈 (team)

**설명**: 팀 CRUD, 멤버 초대·수락·거절, 역할 변경, 추방, 탈퇴를 구현한다. TEAM-001~005, INV-001~005, AUTH-003~005, NOTIF-002(초대 시 TEAM_INVITE 알림 발송) 규칙을 구현한다. 팀 삭제 트랜잭션(할일·카테고리 연쇄 삭제)을 `pg.PoolClient`로 관리한다.

**산출물**
- `backend/src/modules/team/` (router, controller, service, repository, types)
- `backend/tests/unit/team/teamService.test.ts`

**의존성**
- [ ] BE-002: 공통 인프라 구성
- [ ] BE-003: 인증 모듈 (auth.middleware.ts 필요)
- [ ] BE-008: 알림 모듈 (팀 초대 시 TEAM_INVITE 알림 발송 필요)

**완료 조건**
- [ ] `POST /teams` 성공 시 team_members 테이블에 생성자가 ADMIN으로 삽입된다 (TEAM-001)
- [ ] MEMBER·VIEWER가 초대 생성 시도 시 403이 반환된다 (INV-001)
- [ ] 기존 소속 사용자 또는 PENDING 초대가 있는 사용자 초대 시 409가 반환된다 (INV-002, TEAM-003)
- [ ] 초대 수락 시 team_members 레코드가 생성되고 `status`가 ACCEPTED로 변경된다 (INV-003)
- [ ] 만료된 초대 수락 시도 시 422가 반환되고 `status`가 EXPIRED로 변경된다 (INV-005)
- [ ] 초대 거절 시 `status`가 DECLINED로 변경되고 team_members에 삽입되지 않는다 (INV-004)
- [ ] 마지막 ADMIN의 역할 변경 시도 시 422가 반환된다 (TEAM-002)
- [ ] `DELETE /teams/:teamId` 성공 시 해당 팀의 todos 및 categories가 함께 삭제된다 (TEAM-005)
- [ ] 팀 탈퇴 시 해당 사용자가 생성한 팀 할일의 `user_id`가 NULL로 변경된다 (TEAM-004)
- [ ] TEAM-001, TEAM-002, INV-002, INV-005 단위 테스트가 통과한다

---

### BE-008: 알림 모듈 (notification)

**설명**: 인앱 알림 목록 조회(최신순), 단건/전체 읽음 처리를 구현한다. NOTIF-001 마감일 1일 전 `DUE_DATE_REMINDER` 자동 발송(KST 기준 스케줄러), NOTIF-002 팀 초대 시 `TEAM_INVITE` 알림 생성, NOTIF-003 읽음 처리를 구현한다.

**산출물**
- `backend/src/modules/notification/` (router, controller, service, repository, types)

**의존성**
- [ ] BE-002: 공통 인프라 구성
- [ ] BE-003: 인증 모듈 (auth.middleware.ts 필요)

**완료 조건**
- [ ] `GET /notifications` 요청 시 인증된 사용자의 알림이 `created_at` 내림차순으로 반환된다
- [ ] `PATCH /notifications/:id/read` 요청 시 해당 알림의 `is_read`가 true로 변경된다
- [ ] `PATCH /notifications/read-all` 요청 시 사용자의 모든 미읽음 알림이 읽음 처리된다
- [ ] 다른 사용자의 알림에 대해 읽음 처리 시 403이 반환된다
- [ ] 팀 초대 생성 시 notifications 테이블에 `type=TEAM_INVITE`, `reference_id=invitation_id` 레코드가 삽입된다 (NOTIF-002)
- [ ] 마감일 1일 전 스케줄러가 실행되면 KST 기준 해당 할일에 `DUE_DATE_REMINDER` 알림이 생성된다 (NOTIF-001)

---

### BE-009: 감사 로그 모듈 (audit)

**설명**: 6개 엔티티(User, Todo, Category, Team, TeamMember, TeamInvitation)의 CUD 이벤트를 `audit_logs` 테이블에 기록한다. AUD-003 민감정보(password_hash, 인증 토큰) 제외, User 삭제 이벤트에서 이메일·이름 마스킹, AUD-004 `actor_user_id` nullable 관리를 구현한다.

**산출물**
- `backend/src/modules/audit/` (service, repository, types)

**의존성**
- [ ] BE-004: 사용자 모듈
- [ ] BE-005: 할일 모듈
- [ ] BE-006: 카테고리 모듈
- [ ] BE-007: 팀 모듈

**완료 조건**
- [ ] Todo 생성 시 `audit_logs`에 `change_type=CREATE`, `entity_type=Todo` 레코드가 삽입된다
- [ ] Todo 수정 시 `before_value`와 `after_value`가 JSONB로 기록된다
- [ ] Todo 삭제 시 `after_value=NULL`인 레코드가 삽입된다
- [ ] User 탈퇴 이벤트의 audit_log에 이메일·이름이 마스킹되거나 제외되어 있다 (AUD-003)
- [ ] `before_value`, `after_value`에 `password_hash`, 인증 토큰이 포함되지 않는다 (AUD-003)
- [ ] `actor_user_id=NULL`인 감사 로그 레코드가 정상적으로 저장된다 (AUD-004)
- [ ] 6개 엔티티 전체의 CUD 이벤트가 기록됨을 통합 테스트로 확인한다

---

### BE-010: API 문서 (Swagger)

**설명**: `swagger-jsdoc` 6.x + `swagger-ui-express`를 설정하여 `/api-docs` 경로에 Swagger UI를 마운트한다. 각 모듈의 라우터 파일에 JSDoc `@swagger` 주석으로 엔드포인트별 요청/응답 스키마, 파라미터, 에러 코드를 문서화한다.

**산출물**
- `backend/src/config/swagger.ts`
- 각 `*.router.ts` 파일 내 `@swagger` JSDoc 주석

**의존성**
- [ ] BE-003: 인증 모듈
- [ ] BE-004: 사용자 모듈
- [ ] BE-005: 할일 모듈
- [ ] BE-006: 카테고리 모듈
- [ ] BE-007: 팀 모듈
- [ ] BE-008: 알림 모듈

**완료 조건**
- [ ] 서버 실행 후 `GET /api-docs` 접근 시 Swagger UI가 정상 렌더링된다
- [ ] PRD 섹션 3에 정의된 전체 엔드포인트(auth 6개, user 3개, todo 8개, category 4개, team 12개, notification 3개)가 Swagger UI에 문서화되어 있다
- [ ] 각 엔드포인트에 요청 바디 스키마, 응답 예시(200/400/401/403/404/409/422), Bearer 인증 정보가 명시되어 있다
- [ ] Swagger UI에서 직접 API 호출 테스트가 가능하다

---

### BE-011: 통합 테스트 구성 및 모듈별 테스트 구현

**설명**: Jest + Supertest 기반 통합 테스트 환경을 구성하고, auth/user/todo/category/team/notification 모듈별 HTTP 엔드포인트 통합 테스트를 작성한다. PRD 핵심 시나리오를 커버하며 Service 레이어 커버리지 80% 이상을 달성한다.

**산출물**
- `backend/jest.config.ts`
- `backend/tests/integration/` (auth, user, todo, category, team, notification 각 테스트 파일)

**의존성**
- [ ] BE-003: 인증 모듈
- [ ] BE-004: 사용자 모듈
- [ ] BE-005: 할일 모듈
- [ ] BE-006: 카테고리 모듈
- [ ] BE-007: 팀 모듈
- [ ] BE-008: 알림 모듈
- [ ] BE-009: 감사 로그 모듈
- [ ] DB-005: 통합 테스트용 테스트 DB 설정

**완료 조건**
- [ ] `pnpm test` 실행 시 모든 Jest 단위 테스트 및 통합 테스트가 통과한다
- [ ] Service 레이어 코드 커버리지가 80% 이상이다
- [ ] `POST /auth/register` → `POST /auth/login` → `GET /users/me` 흐름 통합 테스트가 통과한다
- [ ] `POST /todos` → `PATCH /todos/:id/status` → `DELETE /todos/:id` 흐름 통합 테스트가 통과한다
- [ ] `POST /teams` → `POST /teams/:teamId/invitations` → `PATCH /invitations/:id/accept` 흐름 통합 테스트가 통과한다
- [ ] 허용되지 않은 상태 전이 시도 시 422 응답을 통합 테스트로 검증한다
- [ ] 각 테스트 실행 후 테스트 DB 데이터가 정리되어 테스트 간 격리가 보장된다
- [ ] `tsc --noEmit` 및 ESLint 검사가 테스트 파일 포함 오류 0건으로 통과한다

---

## 5. 프론트엔드 (Frontend)

---

### FE-001: 프로젝트 초기화 및 개발 환경 구성

**설명**: pnpm 모노레포 워크스페이스 하위에 `frontend/` 패키지를 생성하고, Vite 6.x + React 19 + TypeScript 5.x 프로젝트를 초기화한다. Tailwind CSS v3 설정, ESLint, Prettier, path alias(`@/`), `.env.example`을 포함한다.

**산출물**
- `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`
- `frontend/tailwind.config.ts`, `frontend/postcss.config.js`
- `frontend/.eslintrc.cjs`, `frontend/.prettierrc`, `frontend/.env.example`
- `frontend/src/main.tsx`, `frontend/src/App.tsx`

**의존성**
- 없음

**완료 조건**
- [ ] `pnpm --filter frontend dev` 실행 시 Vite 개발 서버가 정상 구동된다
- [ ] `pnpm --filter frontend build` 실행 시 타입 오류 없이 빌드가 완료된다
- [ ] `pnpm --filter frontend lint` 실행 시 ESLint 에러가 0건이다
- [ ] Tailwind CSS 유틸리티 클래스가 HTML에 적용되어 스타일이 반영된다
- [ ] `@/` path alias로 `src/` 하위 모듈을 import할 수 있다
- [ ] `tsconfig.json`에 `"strict": true`가 설정되어 있다

---

### FE-002: 공통 인프라 — axios, QueryClient, 공유 타입/상수

**설명**: axios 인스턴스에 요청 인터셉터(Authorization 헤더 자동 주입)와 응답 인터셉터(401 감지 시 토큰 갱신 재시도, 실패 시 authStore 초기화 및 `/login` 리다이렉트)를 구현한다. TanStack Query QueryClient 설정, 공유 타입·상수·유틸을 작성한다.

**산출물**
- `frontend/src/lib/axios.ts`, `frontend/src/lib/queryClient.ts`
- `frontend/src/shared/types/` (api.types.ts, common.types.ts)
- `frontend/src/shared/constants/` (todoStatus.ts — 상태 전이 매트릭스 포함, teamRole.ts, routes.ts)
- `frontend/src/shared/utils/` (dateUtils.ts, errorUtils.ts)

**의존성**
- [ ] FE-001: 프로젝트 초기화 및 개발 환경 구성

**완료 조건**
- [ ] axios 인스턴스가 모든 요청에 `Authorization: Bearer <token>` 헤더를 자동으로 추가한다
- [ ] 401 응답 수신 시 `/auth/refresh`를 호출하여 새 액세스 토큰으로 원래 요청을 자동 재시도한다
- [ ] 리프레시 토큰도 만료된 경우 authStore를 초기화하고 `/login`으로 리다이렉트한다
- [ ] `todoStatus.ts`의 `ALLOWED_TRANSITIONS` 매트릭스가 PRD TODO-008의 허용 전이표와 일치한다
- [ ] `ApiResponse<T>`, `PaginatedResponse<T>`, `ErrorResponse` 타입이 BE API 응답 포맷과 일치한다

---

### FE-003: 공통 UI 컴포넌트 라이브러리

**설명**: 도메인에 종속되지 않는 재사용 가능한 공통 UI 컴포넌트를 `src/components/`에 구현한다. Button(variant, size, loading, disabled), Input(label, error 메시지, ref 전달), Modal(오버레이, ESC/클릭 닫기), Badge(상태/역할별 색상), Spinner, Pagination을 구현한다. 모든 컴포넌트는 TypeScript 인터페이스 명시 및 접근성(aria 속성) 준수를 적용한다.

**산출물**
- `frontend/src/components/` (Button.tsx, Input.tsx, Modal.tsx, Badge.tsx, Spinner.tsx, Pagination.tsx)

**의존성**
- [ ] FE-001: 프로젝트 초기화 및 개발 환경 구성

**완료 조건**
- [ ] Button이 `loading=true`일 때 Spinner를 표시하고 클릭 이벤트를 차단한다
- [ ] Input이 `error` prop 전달 시 빨간 테두리와 에러 메시지를 표시한다
- [ ] Modal이 ESC 키 및 오버레이 클릭으로 닫힌다
- [ ] Badge가 PLANNED/IN_PROGRESS/DONE/ON_HOLD, ADMIN/MEMBER/VIEWER 각각 다른 색상으로 렌더링된다
- [ ] TypeScript strict 모드에서 컴파일 오류가 없다
- [ ] Chrome 최신 버전에서 모든 컴포넌트 렌더링이 정상이다

---

### FE-004: 라우팅 설정 및 ProtectedRoute 구현

**설명**: React Router v7의 `createBrowserRouter`로 전체 라우트 맵을 정의하고, 인증이 필요한 모든 라우트를 `ProtectedRoute`로 감싸 미인증 사용자를 `/login`으로 리다이렉트한다. `main.tsx`에 `QueryClientProvider`와 `RouterProvider`를 마운트한다.

**산출물**
- `frontend/src/router/index.tsx`, `frontend/src/router/ProtectedRoute.tsx`
- `frontend/src/main.tsx` (Provider 마운트)

**의존성**
- [ ] FE-002: 공통 인프라

**완료 조건**
- [ ] 비인증 상태에서 보호 라우트(`/dashboard`, `/todos`, `/teams` 등) 접근 시 `/login`으로 리다이렉트된다
- [ ] 인증된 상태에서 `/login`, `/register` 접근 시 `/dashboard`로 리다이렉트된다
- [ ] 존재하지 않는 경로 접근 시 404 처리가 된다
- [ ] 브라우저 뒤로가기/앞으로가기 시 라우팅이 정상 동작한다
- [ ] Chrome에서 모든 라우트 전환이 정상 렌더링된다

---

### FE-005: 인증 Feature — 로그인, 회원가입, 비밀번호 재설정

**설명**: 인증 관련 API 함수, Zustand authStore, TanStack Query 훅(useLogin, useRegister, useLogout), 폼 컴포넌트(LoginForm, RegisterForm)를 구현한다. React Hook Form 7.x로 폼 유효성을 관리하며 비밀번호 재설정은 요청 단계(이메일 입력)와 확인 단계(새 비밀번호 입력) 두 화면으로 구성한다.

**산출물**
- `frontend/src/features/auth/` (api, stores, hooks, components, types)
- `frontend/src/pages/` (LoginPage.tsx, RegisterPage.tsx, PasswordResetPage.tsx)

**의존성**
- [ ] FE-003: 공통 UI 컴포넌트 라이브러리
- [ ] FE-004: 라우팅 설정 및 ProtectedRoute 구현
- [ ] BE-003: 인증 API 완료

**완료 조건**
- [ ] 올바른 자격증명으로 로그인 후 `/dashboard`로 리다이렉트된다
- [ ] 잘못된 자격증명 입력 시 에러 메시지가 폼에 표시된다
- [ ] 비밀번호 정책 미충족 시 유효성 에러가 표시된다 (USR-002-1)
- [ ] 중복 이메일 회원가입 시 409 에러 메시지가 표시된다
- [ ] 로그아웃 후 authStore가 초기화되고 `/login`으로 이동한다
- [ ] 만료된 재설정 링크 접근 시 만료 안내 메시지와 재요청 버튼이 표시된다
- [ ] Chrome에서 전체 인증 흐름이 정상 동작한다

---

### FE-006: 할일 Feature — CRUD, 상태 전이, 검색/필터

**설명**: 할일 관련 API 함수, TanStack Query 훅 7종, UI 컴포넌트(TodoList, TodoCard, TodoForm, TodoStatusSelect)를 구현한다. TodoStatusSelect는 `ALLOWED_TRANSITIONS` 매트릭스를 참조하여 현재 상태에서 전환 가능한 상태만 드롭다운에 노출한다 (TODO-008). TodoListPage에 키워드 검색, 상태/카테고리/마감일 범위 필터, 페이지네이션을 구현한다.

**산출물**
- `frontend/src/features/todo/` (api, hooks 7종, components 4종, types)
- `frontend/src/pages/` (TodoListPage.tsx, TodoDetailPage.tsx)

**의존성**
- [ ] FE-003: 공통 UI 컴포넌트 라이브러리
- [ ] FE-005: 인증 Feature
- [ ] BE-005: 할일 API 완료

**완료 조건**
- [ ] 할일 목록이 `due_date` 오름차순으로 표시된다 (TODO-007)
- [ ] 제목 미입력 저장 시도 시 인라인 에러가 표시된다 (TODO-001)
- [ ] 종료일이 시작일보다 이른 경우 유효성 에러가 표시된다 (TODO-002)
- [ ] TodoStatusSelect에서 현재 상태가 PLANNED인 경우 IN_PROGRESS, ON_HOLD만 표시된다 (DONE 비노출)
- [ ] 허용되지 않은 상태 전이 시도 시 서버 422 에러 메시지가 표시된다
- [ ] 생성/수정/삭제 후 TanStack Query 캐시가 무효화되어 목록이 자동 갱신된다
- [ ] 삭제 버튼 클릭 시 확인 Modal이 표시되고 취소 시 삭제가 진행되지 않는다
- [ ] Chrome에서 할일 CRUD 전체 흐름이 정상 동작한다

---

### FE-007: 카테고리 Feature — CRUD 및 할일 필터 연동

**설명**: 카테고리 관련 API 함수, TanStack Query 훅 4종, UI 컴포넌트(CategoryList, CategoryForm)를 구현한다. HEX 색상 코드 유효성 검사, 카테고리 삭제 시 경고 Modal, 카테고리별 할일 필터 연동을 포함한다.

**산출물**
- `frontend/src/features/category/` (api, hooks 4종, components 2종, types)
- `frontend/src/pages/CategoryPage.tsx`

**의존성**
- [ ] FE-003: 공통 UI 컴포넌트 라이브러리
- [ ] FE-005: 인증 Feature
- [ ] BE-006: 카테고리 API 완료

**완료 조건**
- [ ] 동일 소유자 내 중복 카테고리명 입력 시 409 에러 메시지가 표시된다 (CAT-001)
- [ ] 색상 코드가 `#RRGGBB` 형식이 아닌 경우 폼 유효성 에러가 표시된다 (CAT-004)
- [ ] 카테고리 삭제 시 "속한 할일의 카테고리가 해제됩니다" 안내 Modal이 표시된다 (CAT-002)
- [ ] 카테고리 클릭 시 해당 카테고리로 필터링된 할일 목록이 표시된다
- [ ] 생성/수정/삭제 후 카테고리 목록 캐시가 자동 갱신된다
- [ ] Chrome에서 카테고리 CRUD 전체 흐름이 정상 동작한다

---

### FE-008: 팀 Feature — 팀 관리, 멤버 초대, 역할 제어

**설명**: 팀 관련 API 함수, TanStack Query 훅 7종, UI 컴포넌트(TeamList, TeamMemberList, InviteMemberForm)를 구현한다. 역할별 기능 제어(VIEWER는 할일 생성·수정·삭제 버튼 비노출, ADMIN이 아닌 경우 초대·역할 변경·추방 버튼 비노출)를 UI에 적용한다. 팀 삭제/탈퇴 각각 내용이 다른 확인 Modal을 표시한다.

**산출물**
- `frontend/src/features/team/` (api, hooks 7종, components 3종, types)
- `frontend/src/pages/` (TeamPage.tsx, TeamDetailPage.tsx)

**의존성**
- [ ] FE-003: 공통 UI 컴포넌트 라이브러리
- [ ] FE-005: 인증 Feature
- [ ] FE-006: 할일 Feature (팀 할일 목록 표시 연동)
- [ ] BE-007: 팀 API 완료

**완료 조건**
- [ ] 팀 생성 후 생성자가 ADMIN으로 팀 상세 페이지에 표시된다 (TEAM-001)
- [ ] 이미 팀 소속 사용자 초대 시 409 에러 메시지가 표시된다 (TEAM-003)
- [ ] VIEWER 역할로 팀 상세 페이지 진입 시 할일 생성·수정·삭제 버튼이 비노출된다 (AUTH-004)
- [ ] MEMBER 역할로 진입 시 멤버 초대·역할 변경·추방 버튼이 비노출된다 (AUTH-005)
- [ ] 마지막 ADMIN 역할 변경 시도 시 422 에러 메시지가 표시된다 (TEAM-002)
- [ ] 팀 삭제·탈퇴 각각 내용이 다른 확인 Modal이 표시된다 (TEAM-004, TEAM-005)
- [ ] Chrome에서 팀 생성-초대-수락/거절 흐름이 정상 동작한다

---

### FE-009: 알림 Feature — 목록 조회, 읽음 처리, 미읽음 뱃지

**설명**: 알림 관련 API 함수, TanStack Query 훅(useNotifications, useMarkAsRead), UI 컴포넌트(NotificationList, NotificationItem)를 구현한다. 미읽음 알림 시각적 강조, 내비게이션 미읽음 수 뱃지, 전체 읽음 처리 버튼, 알림 클릭 시 유형별 페이지 이동을 구현한다.

**산출물**
- `frontend/src/features/notification/` (api, hooks 2종, components 2종, types)
- `frontend/src/pages/NotificationPage.tsx`

**의존성**
- [ ] FE-003: 공통 UI 컴포넌트 라이브러리
- [ ] FE-005: 인증 Feature
- [ ] BE-008: 알림 API 완료

**완료 조건**
- [ ] 알림 목록이 최신순으로 표시된다 (NOTIF-003)
- [ ] `is_read=false` 알림이 시각적으로 강조되어 표시된다
- [ ] 내비게이션 알림 아이콘에 미읽음 알림 수가 뱃지로 표시된다
- [ ] 알림 클릭 시 `is_read`가 true로 변경되고 적절한 페이지로 이동한다
- [ ] "전체 읽음 처리" 버튼 클릭 시 모든 알림의 강조 표시가 해제된다
- [ ] 알림이 없는 경우 "알림이 없습니다" 메시지가 표시된다
- [ ] Chrome에서 알림 목록 조회 및 읽음 처리가 정상 동작한다

---

### FE-010: 내 정보 Feature — 프로필 조회/수정, 회원 탈퇴

**설명**: 사용자 API 함수, TanStack Query 훅(useProfile, useUpdateProfile, useDeleteAccount)을 구현한다. React Hook Form으로 수정 폼을 관리하며, 회원 탈퇴 시 확인 Modal에서 비밀번호 본인 확인 후 탈퇴를 진행한다. 탈퇴 성공 후 authStore를 초기화하고 `/login`으로 이동한다.

**산출물**
- `frontend/src/features/user/` (api, hooks 3종)
- `frontend/src/pages/ProfilePage.tsx`

**의존성**
- [ ] FE-003: 공통 UI 컴포넌트 라이브러리
- [ ] FE-005: 인증 Feature
- [ ] BE-004: 사용자 API 완료

**완료 조건**
- [ ] ProfilePage 진입 시 현재 사용자의 이메일과 이름이 표시된다
- [ ] 이름 수정 후 저장 시 "정보가 수정되었습니다" 메시지가 표시되고 화면이 갱신된다
- [ ] 회원 탈퇴 버튼 클릭 시 "모든 데이터가 즉시 삭제되며 복구할 수 없습니다" 안내 Modal이 표시된다
- [ ] 탈퇴 Modal에서 잘못된 비밀번호 입력 시 에러가 표시된다
- [ ] 탈퇴 성공 후 authStore가 초기화되고 `/login`으로 이동한다
- [ ] Chrome에서 프로필 조회·수정 및 탈퇴 흐름이 정상 동작한다

---

### FE-011: 대시보드 페이지

**설명**: `DashboardPage` (`/dashboard`)를 구현한다. 오늘 할일(useTodayTodos)과 이번 주 할일(useThisWeekTodos) 데이터를 요약 카드 형태로 표시하고, 진행 상태 분포(PLANNED/IN_PROGRESS/DONE/ON_HOLD 각 건수)를 포함한다. 데이터가 없는 경우 안내 메시지를 표시하며 로딩 중에는 Spinner를 표시한다.

**산출물**
- `frontend/src/pages/DashboardPage.tsx`

**의존성**
- [ ] FE-003: 공통 UI 컴포넌트 라이브러리
- [ ] FE-006: 할일 Feature (useTodayTodos, useThisWeekTodos 훅 재사용)

**완료 조건**
- [ ] 로그인 후 `/dashboard`로 리다이렉트되며 오늘 할일·이번 주 할일 요약 카드가 렌더링된다
- [ ] 오늘 할일이 없는 경우 "오늘 해당하는 할일이 없습니다" 메시지가 표시된다
- [ ] 이번 주 할일이 없는 경우 "이번 주 해당하는 할일이 없습니다" 메시지가 표시된다
- [ ] 로딩 중 Spinner 컴포넌트가 표시된다
- [ ] 데스크톱 및 모바일 뷰포트에서 레이아웃이 깨지지 않는다
- [ ] Chrome에서 대시보드 렌더링이 정상이다

---

### FE-012: Vitest + RTL 설정 및 주요 단위 테스트

**설명**: Vitest와 React Testing Library를 설정하고, 핵심 컴포넌트·훅·유틸리티 단위 테스트를 작성한다. 테스트 대상: TodoStatusSelect(상태 전이 매트릭스 기반 옵션 렌더링), Button(loading/disabled 상태), Modal(열기/닫기/ESC), ProtectedRoute(미인증 리다이렉트), `ALLOWED_TRANSITIONS` 매트릭스 정합성, errorUtils, authStore 동작.

**산출물**
- `frontend/vitest.config.ts`, `frontend/src/setupTests.ts`
- `frontend/src/components/Button.test.tsx`, `frontend/src/components/Modal.test.tsx`
- `frontend/src/router/ProtectedRoute.test.tsx`
- `frontend/src/features/todo/components/TodoStatusSelect.test.tsx`
- `frontend/src/shared/constants/todoStatus.test.ts`
- `frontend/src/shared/utils/errorUtils.test.ts`
- `frontend/src/features/auth/stores/authStore.test.ts`

**의존성**
- [ ] FE-003: 공통 UI 컴포넌트 라이브러리
- [ ] FE-004: 라우팅 설정 및 ProtectedRoute 구현
- [ ] FE-005: 인증 Feature
- [ ] FE-006: 할일 Feature

**완료 조건**
- [ ] `pnpm --filter frontend test` 실행 시 모든 테스트가 통과한다
- [ ] TodoStatusSelect 테스트에서 PLANNED 상태 기준으로 DONE이 렌더링되지 않음을 검증한다 (TODO-008)
- [ ] `ALLOWED_TRANSITIONS` 매트릭스 테스트에서 PRD TODO-008의 허용/금지 전이 케이스가 모두 검증된다
- [ ] ProtectedRoute 테스트에서 미인증 상태 접근 시 `/login` 리다이렉트가 검증된다
- [ ] Button 테스트에서 `loading=true` 시 클릭 이벤트 핸들러가 호출되지 않음을 검증한다
- [ ] `pnpm --filter frontend test --coverage` 실행 시 주요 컴포넌트·유틸 커버리지가 85% 이상이다

---

## 6. 변경 이력

| 버전 | 날짜       | 변경자            | 변경 내용                                                                                     |
| ---- | ---------- | ----------------- | --------------------------------------------------------------------------------------------- |
| v1.0 | 2026-05-13 | Project Planner   | 초안 작성. docs/2-prd.md (v1.4), docs/4-project-structure.md (v1.2), docs/6-erd.md (v1.0) 기반으로 DB(6개), BE(11개), FE(12개) 총 29개 태스크 도출. 각 태스크별 완료 조건 및 의존성 체크박스 포함. |

---

_본 문서는 Todolist-App 1차 출시를 위한 실행계획서로, 태스크 착수 전 팀 검토·승인 과정을 거쳐 확정된다. 실제 개발 진행 중 의존성 및 일정은 조정될 수 있다._
