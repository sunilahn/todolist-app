# 프론트엔드 통합 가이드 - Todolist-App

| 항목      | 내용                                                                 |
| --------- | -------------------------------------------------------------------- |
| 문서 버전 | v1.0                                                                 |
| 작성일    | 2026-05-14                                                           |
| 참조 문서 | docs/2-prd.md (v1.5), docs/4-project-structure.md (v1.3), docs/6-erd.md (v1.1) |
| 상태      | 초안                                                                 |

---

## 목차

1. [기본 설정](#1-기본-설정)
2. [Axios 인스턴스 설정](#2-axios-인스턴스-설정)
3. [에러 응답 처리](#3-에러-응답-처리)
4. [인증 모듈 (Auth)](#4-인증-모듈-auth)
5. [사용자 모듈 (User)](#5-사용자-모듈-user)
6. [할일 모듈 (Todo)](#6-할일-모듈-todo)
7. [카테고리 모듈 (Category)](#7-카테고리-모듈-category)
8. [팀 모듈 (Team)](#8-팀-모듈-team)
9. [알림 모듈 (Notification)](#9-알림-모듈-notification)
10. [TypeScript 타입 정의](#10-typescript-타입-정의)

---

## 1. 기본 설정

### 서버 주소

| 환경 | Base URL |
|------|----------|
| 개발 | `http://localhost:3000` |
| API prefix | `/api` |
| Swagger UI | `http://localhost:3000/api-docs` |
| 헬스체크 | `http://localhost:3000/health` |

모든 API 요청은 `http://localhost:3000/api` 를 기준으로 한다.

### 인증 헤더

인증이 필요한 모든 요청에 다음 헤더를 포함한다.

```
Authorization: Bearer <accessToken>
```

### 날짜 형식

- 요청 시: `YYYY-MM-DD` (예: `2026-05-14`)
- 응답 시 timestamp: ISO 8601 (예: `2026-05-14T00:00:00.000Z`)
- 날짜 기준: **KST (UTC+9)** — 오늘/이번 주 조회 시 서버에서 KST 기준으로 처리

---

## 2. Axios 인스턴스 설정

```typescript
// src/lib/axios.ts
import axios from 'axios';
import { useAuthStore } from '../features/auth/stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
  withCredentials: true,
});

// 요청 인터셉터 — accessToken 자동 주입
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터 — 401 시 토큰 갱신 후 재시도
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'}/auth/refresh`,
          { refreshToken }
        );

        const newAccessToken = data.accessToken;
        useAuthStore.getState().setAccessToken(newAccessToken);

        failedQueue.forEach(({ resolve }) => resolve(newAccessToken));
        failedQueue = [];

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        failedQueue.forEach(({ reject }) => reject(refreshError));
        failedQueue = [];
        useAuthStore.getState().clear(); // 로그아웃 처리
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 프론트엔드 환경변수

```
# .env
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 3. 에러 응답 처리

### 에러 응답 형식

모든 API 에러는 동일한 JSON 구조로 반환된다.

```typescript
// 일반 에러 (4xx, 5xx)
{
  "code": "ERROR_CODE",
  "message": "오류 설명"
}

// 입력값 검증 실패 (400)
{
  "code": "VALIDATION_ERROR",
  "message": "Required; String must contain at least 1 character(s)",
  "details": [
    {
      "code": "too_small",
      "path": ["body", "title"],
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

### 에러 코드 목록

| `code` | HTTP 상태 | 설명 |
|--------|-----------|------|
| `VALIDATION_ERROR` | 400 | 요청 바디/파라미터 형식 오류 |
| `UNAUTHORIZED` | 401 | 미인증 또는 토큰 만료 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `NOT_FOUND` | 404 | 리소스를 찾을 수 없음 |
| `CONFLICT` | 409 | 중복 데이터 (이메일, 카테고리명 등) |
| `UNPROCESSABLE` | 422 | 비즈니스 규칙 위반 (상태 전이 오류, 마지막 ADMIN 등) |
| `INTERNAL_SERVER_ERROR` | 500 | 서버 내부 오류 |

### TanStack Query 에러 처리 패턴

```typescript
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

interface ApiError {
  code: string;
  message: string;
  details?: unknown[];
}

const { mutate } = useMutation({
  mutationFn: createTodo,
  onError: (error: AxiosError<ApiError>) => {
    const apiError = error.response?.data;
    if (apiError?.code === 'CONFLICT') {
      // 중복 처리
    } else if (apiError?.code === 'VALIDATION_ERROR') {
      // 검증 오류 처리
    }
  },
});
```

---

## 4. 인증 모듈 (Auth)

Base path: `/auth`

### 4.1 회원가입

```
POST /auth/register
```

**요청**

```typescript
{
  email: string;       // 이메일 형식
  name: string;        // 1~100자
  password: string;    // 8자 이상, 영문+숫자+특수문자 각 1자 이상
}
```

**응답 `201`**

```typescript
{
  userId: string;      // UUID
  email: string;
  name: string;
  createdAt: string;   // ISO 8601
}
```

**오류**

| 상황 | code | HTTP |
|------|------|------|
| 중복 이메일 | `CONFLICT` | 409 |
| 비밀번호 형식 불일치 | `VALIDATION_ERROR` | 400 |

> 가입 완료 시 기본 카테고리 6개 자동 생성: 업무, 개인, 학습, 회의, 프로젝트, 긴급 업무

---

### 4.2 로그인

```
POST /auth/login
```

**요청**

```typescript
{
  email: string;
  password: string;
}
```

**응답 `200`**

```typescript
{
  accessToken: string;    // JWT, 1시간 유효
  refreshToken: string;   // JWT, 7일 유효
}
```

> `accessToken`은 메모리(Zustand)에, `refreshToken`은 로컬스토리지 또는 HttpOnly 쿠키에 저장 권장

**오류**

| 상황 | code | HTTP |
|------|------|------|
| 이메일/비밀번호 불일치 | `UNAUTHORIZED` | 401 |

---

### 4.3 로그아웃

```
POST /auth/logout
```

**요청**

```typescript
{
  refreshToken: string;
}
```

**응답 `204`** (바디 없음)

> 서버에서 `refresh_tokens.revoked_at` 설정. 클라이언트는 토큰 삭제 후 로그인 페이지로 이동.

---

### 4.4 액세스 토큰 갱신

```
POST /auth/refresh
```

**요청**

```typescript
{
  refreshToken: string;
}
```

**응답 `200`**

```typescript
{
  accessToken: string;   // 새 accessToken (refreshToken은 갱신 안 됨)
}
```

**오류**

| 상황 | code | HTTP |
|------|------|------|
| refreshToken 만료/무효/폐기 | `UNAUTHORIZED` | 401 |

---

### 4.5 비밀번호 재설정 요청

```
POST /auth/password-reset/request
```

**요청**

```typescript
{
  email: string;
}
```

**응답 `200`**

```typescript
{
  message: string;   // "비밀번호 재설정 이메일이 발송되었습니다."
}
```

> 존재하지 않는 이메일도 동일하게 200 반환 (이메일 노출 방지)

---

### 4.6 비밀번호 재설정 확인

```
POST /auth/password-reset/confirm
```

**요청**

```typescript
{
  token: string;          // 이메일 링크의 쿼리 파라미터 token 값
  newPassword: string;    // 8자 이상, 영문+숫자+특수문자 각 1자 이상
}
```

**응답 `200`**

```typescript
{
  message: string;   // "비밀번호가 성공적으로 변경되었습니다."
}
```

**오류**

| 상황 | code | HTTP |
|------|------|------|
| 만료된 토큰 | `UNPROCESSABLE` | 422 |

---

## 5. 사용자 모듈 (User)

Base path: `/users` — 모든 엔드포인트 **인증 필요**

### 5.1 내 정보 조회

```
GET /users/me
```

**응답 `200`**

```typescript
{
  userId: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### 5.2 내 정보 수정

```
PATCH /users/me
```

**요청**

```typescript
{
  name: string;   // 1~100자
}
```

**응답 `200`** — 수정된 사용자 객체 (5.1과 동일)

---

### 5.3 회원 탈퇴

```
DELETE /users/me
```

**응답 `204`** (바디 없음)

> 즉시 하드 삭제. 복구 불가. 관련 refresh_tokens 전체 폐기.

---

## 6. 할일 모듈 (Todo)

Base path: `/todos` — 모든 엔드포인트 **인증 필요**

### 6.1 할일 생성

```
POST /todos
```

**요청**

```typescript
{
  title: string;           // 필수, 1~500자
  description?: string;    // 선택
  status?: TodoStatus;     // 선택, 기본값: "PLANNED"
  startDate?: string;      // 선택, "YYYY-MM-DD"
  dueDate?: string;        // 선택, "YYYY-MM-DD", dueDate >= startDate
  categoryId?: string;     // 선택, UUID
  teamId?: string;         // 선택, UUID — 팀 할일 생성 시 지정
}
```

**응답 `201`** — 할일 객체 ([6.5 할일 객체](#65-할일-객체-스키마) 참조)

**오류**

| 상황 | code | HTTP |
|------|------|------|
| VIEWER 역할로 팀 할일 생성 | `FORBIDDEN` | 403 |
| dueDate < startDate | `VALIDATION_ERROR` | 400 |

---

### 6.2 할일 목록 조회

```
GET /todos
```

**쿼리 파라미터**

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|-------|------|
| `status` | `string` | — | 상태 필터 (`PLANNED` \| `IN_PROGRESS` \| `DONE` \| `ON_HOLD`) |
| `categoryId` | `string` (UUID) | — | 카테고리 필터 |
| `teamId` | `string` (UUID) | — | 팀 할일 필터 (팀 멤버만 유효) |
| `startDate` | `YYYY-MM-DD` | — | 기간 필터 시작 (`dueDate >= startDate`) |
| `endDate` | `YYYY-MM-DD` | — | 기간 필터 종료 (`dueDate <= endDate`) |
| `search` | `string` | — | 제목 키워드 검색 (대소문자 무시) |
| `page` | `number` | `1` | 페이지 번호 |
| `limit` | `number` | `20` | 페이지당 개수 |

**응답 `200`**

```typescript
{
  todos: Todo[];   // 할일 배열
  total: number;   // 전체 레코드 수 (페이지네이션 미적용 합계)
  page: number;
  limit: number;
}
```

**정렬:** `dueDate ASC` (null은 마지막), `createdAt DESC`

**범위:** 내 개인 할일 + 소속 팀 할일 모두

---

### 6.3 오늘 할일 조회

```
GET /todos/today
```

**응답 `200`** — `Todo[]`

> 조건: `start_date ≤ 오늘(KST) ≤ due_date`

---

### 6.4 이번 주 할일 조회

```
GET /todos/this-week
```

**응답 `200`** — `Todo[]`

> 조건: `due_date`가 이번 주 월요일~일요일(KST) 사이

---

### 6.5 할일 단건 조회

```
GET /todos/:id
```

**응답 `200`** — `Todo` 객체

---

### 6.6 할일 수정

```
PATCH /todos/:id
```

**요청** (모든 필드 선택, 지정한 필드만 변경)

```typescript
{
  title?: string;
  description?: string;
  status?: TodoStatus;
  startDate?: string;     // "YYYY-MM-DD"
  dueDate?: string;       // "YYYY-MM-DD"
  categoryId?: string;    // UUID 또는 null (카테고리 제거)
}
```

**응답 `200`** — 수정된 `Todo` 객체

> 이 엔드포인트는 상태 전이 규칙을 검증하지 않는다. 상태 변경은 `/todos/:id/status`를 사용할 것.

---

### 6.7 할일 상태 변경

```
PATCH /todos/:id/status
```

**요청**

```typescript
{
  status: TodoStatus;   // 필수
}
```

**응답 `200`** — 수정된 `Todo` 객체

**상태 전이 규칙**

| 현재 상태 | 허용되는 전이 |
|-----------|--------------|
| `PLANNED` | `IN_PROGRESS`, `ON_HOLD` |
| `IN_PROGRESS` | `DONE`, `ON_HOLD` |
| `DONE` | `IN_PROGRESS` |
| `ON_HOLD` | `PLANNED`, `IN_PROGRESS` |

**오류**

| 상황 | code | HTTP |
|------|------|------|
| 허용되지 않은 상태 전이 | `UNPROCESSABLE` | 422 |

---

### 6.8 할일 삭제

```
DELETE /todos/:id
```

**응답 `204`** (바디 없음)

---

### 6.9 할일 객체 스키마

```typescript
interface Todo {
  todoId: string;
  userId: string | null;      // 개인 할일: userId, 팀 할일: null
  teamId: string | null;      // 팀 할일: teamId, 개인 할일: null
  categoryId: string | null;
  title: string;
  description: string | null;
  status: TodoStatus;
  startDate: string | null;   // "YYYY-MM-DD"
  dueDate: string | null;     // "YYYY-MM-DD"
  createdAt: string;          // ISO 8601
  updatedAt: string;          // ISO 8601
}

type TodoStatus = 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'ON_HOLD';
```

---

## 7. 카테고리 모듈 (Category)

Base path: `/categories` — 모든 엔드포인트 **인증 필요**

### 7.1 카테고리 생성

```
POST /categories
```

**요청**

```typescript
{
  name: string;       // 필수, 1~100자
  color?: string;     // 선택, "#RRGGBB" 형식 (예: "#FF5733")
  teamId?: string;    // 선택, UUID — 팀 카테고리 생성 시 지정
}
```

**응답 `201`** — 카테고리 객체 ([7.5 스키마](#75-카테고리-객체-스키마) 참조)

**오류**

| 상황 | code | HTTP |
|------|------|------|
| 동일 소유자 내 이름 중복 | `CONFLICT` | 409 |
| 색상 형식 오류 | `VALIDATION_ERROR` | 400 |
| ADMIN 아닌 역할이 팀 카테고리 생성 | `FORBIDDEN` | 403 |

---

### 7.2 카테고리 목록 조회

```
GET /categories
```

**응답 `200`** — `Category[]`

> 범위: 내 개인 카테고리 + 소속 팀 카테고리 모두. 정렬: `createdAt ASC`

---

### 7.3 카테고리 수정

```
PATCH /categories/:id
```

**요청**

```typescript
{
  name?: string;      // 1~100자
  color?: string;     // "#RRGGBB" 또는 명시적 null (색상 제거)
}
```

**응답 `200`** — 수정된 카테고리 객체

**오류**

| 상황 | code | HTTP |
|------|------|------|
| 타인의 개인 카테고리 수정 | `FORBIDDEN` | 403 |
| ADMIN 아닌 역할이 팀 카테고리 수정 | `FORBIDDEN` | 403 |
| 이름 중복 | `CONFLICT` | 409 |

---

### 7.4 카테고리 삭제

```
DELETE /categories/:id
```

**응답 `204`** (바디 없음)

> 이 카테고리를 참조하는 할일의 `categoryId`는 자동으로 `null` 처리된다.

---

### 7.5 카테고리 객체 스키마

```typescript
interface Category {
  categoryId: string;
  ownerId: string;            // userId (개인) 또는 teamId (팀)
  ownerType: 'USER' | 'TEAM';
  name: string;
  color: string | null;       // "#RRGGBB"
  createdAt: string;          // ISO 8601
}
```

---

## 8. 팀 모듈 (Team)

Base path: `/teams`, `/invitations` — 모든 엔드포인트 **인증 필요**

### 8.1 팀 생성

```
POST /teams
```

**요청**

```typescript
{
  name: string;   // 필수, 1~100자
}
```

**응답 `201`** — 팀 객체 ([8.9 스키마](#89-팀-관련-객체-스키마) 참조)

> 생성자는 자동으로 `ADMIN` 역할로 팀에 가입된다.

---

### 8.2 소속 팀 목록 조회

```
GET /teams
```

**응답 `200`** — `Team[]`

---

### 8.3 팀 단건 조회

```
GET /teams/:teamId
```

**응답 `200`** — `Team` 객체

---

### 8.4 팀 정보 수정

```
PATCH /teams/:teamId
```

**요청**

```typescript
{
  name: string;   // 필수, 1~100자
}
```

**응답 `200`** — 수정된 팀 객체

**권한:** ADMIN만

---

### 8.5 팀 삭제

```
DELETE /teams/:teamId
```

**응답 `204`** (바디 없음)

**권한:** ADMIN만

> 팀 카테고리, 팀 할일, 팀 멤버, 팀 초대가 모두 삭제된다.

---

### 8.6 팀 멤버 목록 조회

```
GET /teams/:teamId/members
```

**응답 `200`**

```typescript
Array<{
  teamMemberId: string;
  teamId: string;
  userId: string;
  role: TeamRole;           // 'ADMIN' | 'MEMBER' | 'VIEWER'
  joinedAt: string;         // ISO 8601
}>
```

**정렬:** `joinedAt ASC`

---

### 8.7 멤버 역할 변경

```
PATCH /teams/:teamId/members/:userId/role
```

**요청**

```typescript
{
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';   // 필수
}
```

**응답 `200`** — 수정된 멤버 객체

**권한:** ADMIN만

**오류**

| 상황 | code | HTTP |
|------|------|------|
| 마지막 ADMIN의 역할 변경 시도 | `UNPROCESSABLE` | 422 |

---

### 8.8 팀 탈퇴

```
DELETE /teams/:teamId/members/me
```

**응답 `204`** (바디 없음)

**오류**

| 상황 | code | HTTP |
|------|------|------|
| 마지막 ADMIN의 탈퇴 시도 | `UNPROCESSABLE` | 422 |

---

### 8.9 멤버 추방

```
DELETE /teams/:teamId/members/:userId
```

**응답 `204`** (바디 없음)

**권한:** ADMIN만

---

### 8.10 팀 초대 생성

```
POST /teams/:teamId/invitations
```

**요청**

```typescript
{
  invitedUserId: string;          // 필수, UUID
  role: 'MEMBER' | 'VIEWER';     // 필수 (ADMIN은 초대 불가)
}
```

**응답 `201`** — 초대 객체 ([8.11 스키마](#811-초대-객체-스키마) 참조)

**권한:** ADMIN만

**오류**

| 상황 | code | HTTP |
|------|------|------|
| 이미 팀 멤버인 사용자 | `CONFLICT` | 409 |
| PENDING 초대가 이미 존재 | `CONFLICT` | 409 |

> 초대 생성 시 피초대자에게 `TEAM_INVITE` 알림이 자동 발송된다.

---

### 8.11 초대 목록 조회

```
GET /teams/:teamId/invitations
```

**응답 `200`** — `Invitation[]`

**권한:** ADMIN만

**정렬:** `createdAt DESC`

---

### 8.12 초대 수락

```
PATCH /invitations/:invitationId/accept
```

**응답 `200`**

```typescript
{
  message: string;   // "초대를 수락했습니다."
}
```

**오류**

| 상황 | code | HTTP |
|------|------|------|
| 만료된 초대 | `UNPROCESSABLE` | 422 |
| 이미 팀 멤버 | `CONFLICT` | 409 |

> 수락 시 관련 `TEAM_INVITE` 알림이 자동으로 읽음 처리된다.

---

### 8.13 초대 거절

```
PATCH /invitations/:invitationId/decline
```

**응답 `200`**

```typescript
{
  message: string;   // "초대를 거절했습니다."
}
```

---

### 8.14 팀 관련 객체 스키마

```typescript
interface Team {
  teamId: string;
  name: string;
  createdBy: string;    // 생성자 userId
  createdAt: string;
  updatedAt: string;
}

type TeamRole = 'ADMIN' | 'MEMBER' | 'VIEWER';

interface Invitation {
  invitationId: string;
  teamId: string;
  invitedUserId: string;
  invitedBy: string;          // 초대자 userId
  role: 'MEMBER' | 'VIEWER';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  expiresAt: string;          // ISO 8601 (생성일 + 7일)
  createdAt: string;
  respondedAt: string | null;
}
```

---

## 9. 알림 모듈 (Notification)

Base path: `/notifications` — 모든 엔드포인트 **인증 필요**

### 9.1 알림 목록 조회

```
GET /notifications
```

**응답 `200`**

```typescript
Array<{
  notificationId: string;
  userId: string;
  type: NotificationType;
  message: string;
  referenceId: string | null;   // type에 따른 관련 엔티티 ID
  isRead: boolean;
  createdAt: string;            // ISO 8601
}>
```

**정렬:** `createdAt DESC` (최신순)

**알림 유형**

| `type` | `referenceId` | 설명 |
|--------|---------------|------|
| `TEAM_INVITE` | `invitationId` | 팀 초대 수신 시 |
| `DUE_DATE_REMINDER` | `todoId` | 마감일 1일 전 자동 발송 |
| `TODO_ASSIGNED` | — | 미구현 |

---

### 9.2 단건 알림 읽음 처리

```
PATCH /notifications/:id/read
```

**응답 `200`** — 읽음 처리된 알림 객체 (`isRead: true`)

---

### 9.3 전체 알림 읽음 처리

```
PATCH /notifications/read-all
```

**응답 `204`** (바디 없음)

> `/notifications/read-all`은 `/notifications/:id/read`보다 **앞에 등록**되어 있어 라우트 충돌 없음.

---

## 10. TypeScript 타입 정의

프로젝트에서 공통으로 사용하는 타입을 `src/shared/types/` 아래에 정의한다.

```typescript
// src/shared/types/api.types.ts

/** 에러 응답 */
export interface ApiError {
  code: string;
  message: string;
  details?: ZodIssue[];
}

/** 페이지네이션 응답 (할일 목록) */
export interface PaginatedResponse<T> {
  todos: T[];
  total: number;
  page: number;
  limit: number;
}
```

```typescript
// src/features/auth/types.ts

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
```

```typescript
// src/features/todo/types.ts

export type TodoStatus = 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'ON_HOLD';

export interface Todo {
  todoId: string;
  userId: string | null;
  teamId: string | null;
  categoryId: string | null;
  title: string;
  description: string | null;
  status: TodoStatus;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  status?: TodoStatus;
  startDate?: string;
  dueDate?: string;
  categoryId?: string;
  teamId?: string;
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  status?: TodoStatus;
  startDate?: string;
  dueDate?: string;
  categoryId?: string | null;
}

export interface TodoListQuery {
  status?: TodoStatus;
  categoryId?: string;
  teamId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/** 상태 전이 매트릭스 */
export const ALLOWED_STATUS_TRANSITIONS: Record<TodoStatus, TodoStatus[]> = {
  PLANNED: ['IN_PROGRESS', 'ON_HOLD'],
  IN_PROGRESS: ['DONE', 'ON_HOLD'],
  DONE: ['IN_PROGRESS'],
  ON_HOLD: ['PLANNED', 'IN_PROGRESS'],
};
```

```typescript
// src/features/category/types.ts

export interface Category {
  categoryId: string;
  ownerId: string;
  ownerType: 'USER' | 'TEAM';
  name: string;
  color: string | null;
  createdAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  color?: string;
  teamId?: string;
}
```

```typescript
// src/features/team/types.ts

export type TeamRole = 'ADMIN' | 'MEMBER' | 'VIEWER';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface Team {
  teamId: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  teamMemberId: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: string;
}

export interface Invitation {
  invitationId: string;
  teamId: string;
  invitedUserId: string;
  invitedBy: string;
  role: 'MEMBER' | 'VIEWER';
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  respondedAt: string | null;
}
```

```typescript
// src/features/notification/types.ts

export type NotificationType = 'DUE_DATE_REMINDER' | 'TEAM_INVITE' | 'TODO_ASSIGNED';

export interface Notification {
  notificationId: string;
  userId: string;
  type: NotificationType;
  message: string;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
}
```

---

## 변경 이력

| 버전 | 날짜       | 변경자           | 변경 내용                          |
|------|------------|------------------|------------------------------------|
| v1.0 | 2026-05-14 | Backend Developer | 초안 작성. 백엔드 구현 코드 기반으로 전체 API 명세, axios 설정, 에러 처리, TypeScript 타입 정의 작성 |
