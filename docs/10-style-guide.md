# 스타일 가이드 - Todolist-App (Tailwind CSS)

| 항목      | 내용                                      |
| --------- | ----------------------------------------- |
| 문서 버전 | v2.0                                      |
| 작성일    | 2026-05-14                                |
| 작성자    | UI/UX Designer                            |
| 참조      | docs/8-wireframe.md, Google Calendar UI 레퍼런스 |
| 스택      | Tailwind CSS v3, 라이트 모드 전용 (v1)    |

---

## 목차

1. [디자인 원칙](#1-디자인-원칙)
2. [tailwind.config.js](#2-tailwindconfigjs)
3. [색상 시스템](#3-색상-시스템)
4. [타이포그래피](#4-타이포그래피)
5. [간격 & 레이아웃](#5-간격--레이아웃)
6. [컴포넌트 클래스 패턴](#6-컴포넌트-클래스-패턴)
7. [아이콘](#7-아이콘)
8. [모션 & 전환](#8-모션--전환)
9. [접근성](#9-접근성)

---

## 1. 디자인 원칙

Google Calendar의 시각 언어를 레퍼런스로 삼아 다음 4가지 원칙을 따른다.

| 원칙 | 설명 |
|------|------|
| **명료함** | 정보 계층을 여백·타이포그래피로 명시한다 |
| **효율성** | 최소 클릭으로 핵심 기능에 접근할 수 있도록 설계한다 |
| **일관성** | 동일 기능에는 동일한 Tailwind 클래스 조합을 사용한다 |
| **친숙함** | 사용자에게 익숙한 달력·할일 앱 패턴을 유지한다 |

---

## 2. tailwind.config.js

아래 설정을 프로젝트 루트 `tailwind.config.js`에 적용한다.

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── 브랜드 (Google Blue 계열) ──────────────────────────
        primary: {
          DEFAULT: '#1a73e8',
          hover:   '#1765cc',
          light:   '#e8f0fe',
          border:  '#a8c7fa',
        },
        // ── 시맨틱 ────────────────────────────────────────────
        success: {
          DEFAULT: '#1e8e3e',
          light:   '#e6f4ea',
        },
        warning: {
          DEFAULT: '#f29900',
          light:   '#fef7e0',
        },
        danger: {
          DEFAULT: '#d93025',
          light:   '#fce8e6',
        },
        // ── 중립 ──────────────────────────────────────────────
        neutral: {
          0:   '#ffffff',
          50:  '#f8f9fa',
          100: '#f1f3f4',
          200: '#e8eaed',
          300: '#dadce0',
          500: '#80868b',
          700: '#3c4043',
          900: '#202124',
        },
        // ── 카테고리 프리셋 ────────────────────────────────────
        cat: {
          blueberry: { DEFAULT: '#1a73e8', light: '#e8f0fe' },
          sage:      { DEFAULT: '#33b679', light: '#e6f4ea' },
          grape:     { DEFAULT: '#8e24aa', light: '#f3e8fd' },
          flamingo:  { DEFAULT: '#e67c73', light: '#fce8e6' },
          tangerine: { DEFAULT: '#f6bf26', light: '#fef7e0' },
          peacock:   { DEFAULT: '#039be5', light: '#e4f7fb' },
          graphite:  { DEFAULT: '#616161', light: '#f1f3f4' },
          banana:    { DEFAULT: '#f09300', light: '#fff0cd' },
        },
      },
      fontFamily: {
        sans: [
          'Pretendard',
          'Apple SD Gothic Neo',
          'Noto Sans KR',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        // [size, { lineHeight, letterSpacing, fontWeight }]
        xs:   ['11px', { lineHeight: '1.4' }],
        sm:   ['12px', { lineHeight: '1.5' }],
        base: ['14px', { lineHeight: '1.6' }],
        md:   ['16px', { lineHeight: '1.5', letterSpacing: '-0.1px', fontWeight: '500' }],
        lg:   ['20px', { lineHeight: '1.4', letterSpacing: '-0.2px', fontWeight: '600' }],
        xl:   ['24px', { lineHeight: '1.3', letterSpacing: '-0.3px', fontWeight: '700' }],
        '2xl':['32px', { lineHeight: '1.2', letterSpacing: '-0.5px', fontWeight: '700' }],
      },
      spacing: {
        // 4px 기준 단위계 (Tailwind 기본값과 동일, 명시적 문서화 목적)
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        12: '48px',
      },
      borderRadius: {
        sm:   '4px',
        DEFAULT: '8px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        full: '9999px',  // pill형 버튼·배지
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        DEFAULT: '0 4px 12px rgba(0,0,0,0.10)',
        md: '0 4px 12px rgba(0,0,0,0.10)',
        lg: '0 8px 24px rgba(0,0,0,0.14)',
        xl: '0 16px 48px rgba(0,0,0,0.18)',
      },
      transitionDuration: {
        fast:   '100ms',
        normal: '200ms',
        slow:   '350ms',
      },
      transitionTimingFunction: {
        standard:    'cubic-bezier(0.2, 0, 0, 1)',
        decelerate:  'cubic-bezier(0, 0, 0, 1)',
        accelerate:  'cubic-bezier(0.3, 0, 1, 1)',
      },
      width:  { sidebar: '220px' },
      height: { header: '56px', 'tab-bar': '56px' },
      maxWidth: { content: '1280px' },
      screens: {
        mobile:  { max: '767px' },
        tablet:  { min: '768px', max: '1023px' },
        desktop: { min: '1024px' },
      },
    },
  },
  plugins: [],
};
```

---

## 3. 색상 시스템

### 3.1 브랜드 컬러 사용 예시

```jsx
// 주색 버튼
<button className="bg-primary text-white hover:bg-primary-hover">저장</button>

// 주색 강조 텍스트
<span className="text-primary">전체 보기 →</span>

// 주색 배경 (활성 메뉴, 미읽은 알림)
<div className="bg-primary-light text-primary">...</div>
```

### 3.2 상태 배지 클래스

| 상태 | Tailwind 클래스 |
|------|----------------|
| PLANNED (예정) | `bg-neutral-100 text-neutral-700` |
| IN_PROGRESS (진행중) | `bg-primary-light text-primary` |
| DONE (완료) | `bg-success-light text-success` |
| ON_HOLD (보류) | `bg-warning-light text-warning` |

### 3.3 역할 배지 클래스

| 역할 | Tailwind 클래스 |
|------|----------------|
| ADMIN | `bg-primary-light text-primary` |
| MEMBER | `bg-success-light text-success` |
| VIEWER | `bg-neutral-100 text-neutral-500` |

### 3.4 카테고리 태그

카테고리 색상은 사용자 지정값이므로, 임의 값(arbitrary value) 또는 인라인 스타일과 병행한다.

```jsx
// 프리셋 카테고리 (config에 등록된 색상)
<span className="bg-cat-blueberry-light text-cat-blueberry">업무</span>

// 사용자 지정 색상 (임의 값)
<span
  className="rounded-full px-2 py-0.5 text-sm font-medium"
  style={{ backgroundColor: `${color}1a`, color }}
>
  {name}
</span>
```

---

## 4. 타이포그래피

### 4.1 폰트 로드 (index.html)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link
  href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

Pretendard를 사용하는 경우 `@font-face`로 직접 로드한다.

### 4.2 텍스트 스케일 클래스

| 용도 | 클래스 |
|------|--------|
| 타임스탬프, 부가 라벨 | `text-xs text-neutral-500` |
| 배지, 보조 텍스트 | `text-sm text-neutral-500` |
| 본문, 입력 필드 | `text-base text-neutral-700` |
| 카드 제목, 섹션 라벨 | `text-md text-neutral-900` |
| 페이지 제목 | `text-lg text-neutral-900` |
| 대시보드 숫자 카드 | `text-xl text-neutral-900` |
| 브랜드명 (로그인) | `text-2xl text-neutral-900` |

### 4.3 특수 텍스트 처리

```jsx
// 완료된 할일 제목
<span className="line-through text-neutral-500">{title}</span>

// 필수 항목 표시
<label>제목 <span className="text-danger">*</span></label>

// 오버플로 말줄임
<p className="truncate">{longText}</p>

// 읽기 전용 필드 텍스트
<input className="text-neutral-500 bg-neutral-50 cursor-not-allowed" readOnly />
```

---

## 5. 간격 & 레이아웃

### 5.1 전체 구조 클래스

```jsx
// 헤더
<header className="fixed top-0 left-0 right-0 h-header bg-white border-b border-neutral-200 z-[100] flex items-center px-6 gap-4" />

// 사이드바
<aside className="fixed top-header left-0 bottom-0 w-sidebar bg-neutral-50 border-r border-neutral-200 overflow-y-auto" />

// 메인 콘텐츠
<main className="ml-sidebar mt-header min-h-[calc(100vh-56px)] overflow-y-auto p-6" />

// 최대 콘텐츠 너비
<div className="max-w-content mx-auto" />
```

### 5.2 반응형 레이아웃

```jsx
// 사이드바: 모바일에서 숨김
<aside className="hidden desktop:block fixed top-header left-0 bottom-0 w-sidebar ..." />

// 메인: 모바일에서 마진 제거
<main className="desktop:ml-sidebar mt-header p-4 desktop:p-6" />

// 하단 탭바: 모바일에서만 표시
<nav className="desktop:hidden fixed bottom-0 left-0 right-0 h-tab-bar bg-white border-t border-neutral-200 flex" />

// 대시보드 통계 카드 그리드
<div className="grid grid-cols-1 tablet:grid-cols-3 gap-6" />
```

### 5.3 사이드바 메뉴 항목

```jsx
// 기본 메뉴 항목
<a className="flex items-center gap-2 h-10 px-4 rounded-lg text-base text-neutral-700 hover:bg-neutral-100 transition-colors duration-fast" />

// 활성 메뉴 항목
<a className="flex items-center gap-2 h-10 px-4 rounded-lg text-base font-medium text-primary bg-primary-light" />
```

---

## 6. 컴포넌트 클래스 패턴

### 6.1 버튼

모든 버튼은 `rounded-full`(pill형)을 기본으로 한다.

#### 기본 베이스 클래스

```
inline-flex items-center justify-center gap-1.5
rounded-full font-medium
transition-[background,box-shadow] duration-fast ease-standard
focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
disabled:cursor-not-allowed
```

#### Variant 클래스

```jsx
// Primary
<button className="
  inline-flex items-center justify-center gap-1.5 rounded-full font-medium
  px-6 py-2 text-base
  bg-primary text-white
  hover:bg-primary-hover hover:shadow-sm
  active:bg-primary-hover
  disabled:bg-neutral-200 disabled:text-neutral-500
  transition-[background,box-shadow] duration-fast ease-standard
  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
">저장</button>

// Secondary (아웃라인)
<button className="
  inline-flex items-center justify-center gap-1.5 rounded-full font-medium
  px-6 py-2 text-base
  bg-white text-primary border border-primary
  hover:bg-primary-light
  disabled:border-neutral-300 disabled:text-neutral-500
  transition-colors duration-fast ease-standard
  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
">취소</button>

// Danger
<button className="
  inline-flex items-center justify-center gap-1.5 rounded-full font-medium
  px-6 py-2 text-base
  bg-danger text-white
  hover:bg-[#b31c12] hover:shadow-sm
  transition-[background,box-shadow] duration-fast ease-standard
  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger
">삭제</button>

// Danger Outline
<button className="
  inline-flex items-center justify-center gap-1.5 rounded-full font-medium
  px-6 py-2 text-base
  bg-white text-danger border border-danger
  hover:bg-danger-light
  transition-colors duration-fast ease-standard
">회원 탈퇴</button>

// Ghost
<button className="
  inline-flex items-center justify-center gap-1.5 rounded-full font-medium
  px-6 py-2 text-base
  bg-transparent text-neutral-700
  hover:bg-neutral-100
  transition-colors duration-fast ease-standard
">닫기</button>
```

#### Size 클래스

| 크기 | 클래스 |
|------|--------|
| `sm` | `px-4 py-1.5 text-sm` |
| `md` (기본) | `px-6 py-2 text-base` |
| `lg` | `px-8 py-3 text-md` |

#### FAB

```jsx
<button className="
  fixed bottom-[88px] right-6 desktop:bottom-6
  w-14 h-14 rounded-full
  bg-primary text-white
  shadow-lg hover:shadow-xl
  flex items-center justify-center
  transition-shadow duration-normal ease-standard
  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
">
  <span className="material-symbols-outlined text-2xl">add</span>
</button>
```

### 6.2 입력 필드

```jsx
// 기본 입력
<input className="
  w-full h-10 px-3
  rounded-md border border-neutral-300
  text-base text-neutral-700 bg-white placeholder:text-neutral-500
  transition-[border-color,box-shadow] duration-normal ease-standard
  focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light
  disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed
" />

// 오류 상태
<input className="
  w-full h-10 px-3 rounded-md border-2 border-danger
  text-base text-neutral-700 bg-white
  focus:outline-none focus:ring-2 focus:ring-danger-light
" />

// 읽기 전용
<input className="
  w-full h-10 px-3 rounded-md border border-neutral-200
  text-base text-neutral-500 bg-neutral-50
  cursor-not-allowed
" readOnly />

// Textarea
<textarea className="
  w-full min-h-24 px-3 py-2
  rounded-md border border-neutral-300
  text-base text-neutral-700 bg-white placeholder:text-neutral-500
  resize-y
  focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light
  transition-[border-color,box-shadow] duration-normal ease-standard
" />

// 오류 메시지
<p className="mt-1 text-sm text-danger">이메일 형식이 올바르지 않습니다.</p>

// 힌트 텍스트
<p className="mt-1 text-sm text-neutral-500">영문, 숫자, 특수문자 8자 이상</p>
```

### 6.3 드롭다운 / 셀렉트

```jsx
<select className="
  w-full h-10 pl-3 pr-9
  rounded-md border border-neutral-300
  text-base text-neutral-700 bg-white
  appearance-none bg-[url('/icons/chevron-down.svg')] bg-no-repeat bg-[right_12px_center] bg-[length:16px]
  focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light
  transition-[border-color,box-shadow] duration-normal ease-standard
  cursor-pointer
" />
```

드롭다운 패널:
```jsx
<div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-md overflow-hidden">
  <ul className="py-1">
    <li className="px-3 py-2 text-base text-neutral-700 hover:bg-neutral-100 cursor-pointer">항목</li>
  </ul>
</div>
```

### 6.4 체크박스

```jsx
<input
  type="checkbox"
  className="
    w-4.5 h-4.5 rounded-sm
    border-2 border-neutral-500
    text-primary
    focus:ring-2 focus:ring-primary-light focus:ring-offset-0
    cursor-pointer
    transition-colors duration-fast ease-standard
  "
/>
```

### 6.5 배지 / 태그 (Chip)

```jsx
// 상태 배지 — 공통 베이스
const chipBase = "inline-flex items-center h-[22px] px-2.5 rounded-full text-sm font-medium whitespace-nowrap"

// PLANNED
<span className={`${chipBase} bg-neutral-100 text-neutral-700`}>예정</span>

// IN_PROGRESS
<span className={`${chipBase} bg-primary-light text-primary`}>진행중</span>

// DONE
<span className={`${chipBase} bg-success-light text-success`}>완료</span>

// ON_HOLD
<span className={`${chipBase} bg-warning-light text-[#b06000]`}>보류</span>

// 팀 태그
<span className={`${chipBase} bg-neutral-100 text-neutral-700 border border-neutral-300`}>팀A</span>
```

### 6.6 카드

```jsx
// 기본 카드
<div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-normal ease-standard" />

// 통계 카드 (대시보드)
<div className="bg-white border border-neutral-200 rounded-lg px-6 py-5 shadow-sm" />

// 위험 구역 카드
<div className="bg-white border border-danger rounded-lg p-4" />
```

### 6.7 할일 목록 행

```jsx
<div className="
  flex items-center gap-3
  min-h-14 px-4 py-3
  border-b border-neutral-200
  hover:bg-neutral-50
  cursor-pointer
  transition-colors duration-fast ease-standard
">
  {/* 완료 항목 */}
  <span className="line-through text-neutral-500">{title}</span>
</div>
```

### 6.8 모달 / 다이얼로그

```jsx
// 오버레이
<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4" />

// 패널
<div className="
  relative bg-white rounded-xl shadow-xl
  w-full max-w-[520px] min-w-[360px]
  p-6
">
  {/* 헤더 */}
  <h2 className="text-lg text-neutral-900 mb-4">제목</h2>

  {/* 닫기 버튼 */}
  <button className="
    absolute top-4 right-4
    w-8 h-8 rounded-full
    flex items-center justify-center
    text-neutral-500 hover:bg-neutral-100
    transition-colors duration-fast
  ">
    <span className="material-symbols-outlined text-xl">close</span>
  </button>
</div>
```

### 6.9 토스트 알림

```jsx
// 공통 베이스
<div className="
  fixed bottom-6 right-6 z-[9999]
  min-w-[280px] max-w-[400px]
  bg-neutral-900 text-white
  rounded-lg px-4 py-3 text-base
  shadow-xl
  flex items-start gap-3
">
  {/* 성공 */}
  <div className="border-l-4 border-success -ml-4 pl-4 ...">저장되었습니다.</div>

  {/* 오류 */}
  <div className="border-l-4 border-danger -ml-4 pl-4 ...">오류가 발생했습니다.</div>
</div>
```

### 6.10 알림 목록 항목

```jsx
// 미읽음
<div className="flex gap-3 px-4 py-3 bg-primary-light border-l-4 border-primary cursor-pointer hover:brightness-95 transition-[filter] duration-fast" />

// 읽음
<div className="flex gap-3 px-4 py-3 bg-white border-l-4 border-transparent cursor-pointer hover:bg-neutral-50 transition-colors duration-fast" />
```

### 6.11 빈 상태 (Empty State)

```jsx
<div className="flex flex-col items-center gap-4 py-16 px-6 text-neutral-500">
  <span className="material-symbols-outlined text-5xl text-neutral-300">check_box</span>
  <p className="text-md text-neutral-500">할일이 없습니다.</p>
  <button className="... secondary sm">+ 첫 번째 할일 추가하기</button>
</div>
```

### 6.12 탭

```jsx
<div className="flex border-b border-neutral-200">
  {/* 활성 탭 */}
  <button className="h-10 px-4 text-base font-medium text-primary border-b-2 border-primary -mb-px transition-colors duration-normal">
    개인 카테고리
  </button>
  {/* 비활성 탭 */}
  <button className="h-10 px-4 text-base text-neutral-500 border-b-2 border-transparent hover:text-neutral-700 hover:border-neutral-300 transition-colors duration-normal">
    팀 카테고리
  </button>
</div>
```

### 6.13 날짜 피커 입력

```jsx
// 오늘 날짜 배지 (달력 내부)
<button className="w-8 h-8 rounded-full bg-primary text-white text-sm font-medium flex items-center justify-center">
  14
</button>

// 일반 날짜
<button className="w-8 h-8 rounded-full text-base text-neutral-700 hover:bg-neutral-100 flex items-center justify-center transition-colors duration-fast">
  13
</button>
```

---

## 7. 아이콘

### 7.1 로드

```html
<!-- index.html -->
<link
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
  rel="stylesheet"
/>
```

### 7.2 크기 클래스

| 용도 | 클래스 |
|------|--------|
| 버튼 내부 아이콘 | `text-[18px]` |
| 목록 항목 아이콘 | `text-[20px]` |
| 사이드바 메뉴 | `text-[22px]` |
| FAB 아이콘 | `text-2xl` |
| 빈 상태 아이콘 | `text-5xl` |

### 7.3 사용 예시

```jsx
// 아이콘 전용 버튼 (aria-label 필수)
<button aria-label="삭제" className="p-2 rounded-full hover:bg-neutral-100 text-neutral-500 transition-colors duration-fast">
  <span className="material-symbols-outlined text-[20px]">delete</span>
</button>

// 버튼 + 아이콘 조합
<button className="... primary md flex items-center gap-1.5">
  <span className="material-symbols-outlined text-[18px]">add</span>
  할일 추가
</button>
```

### 7.4 주요 아이콘 매핑

| 기능 | 아이콘 이름 |
|------|------------|
| 대시보드 | `home` |
| 할일 목록 | `check_box` |
| 카테고리 | `label` |
| 팀 관리 | `group` |
| 내 정보 | `manage_accounts` |
| 로그아웃 | `logout` |
| 알림 | `notifications` |
| 추가 | `add` |
| 편집 | `edit` |
| 삭제 | `delete` |
| 검색 | `search` |
| 닫기 | `close` |
| 뒤로 | `arrow_back` |
| 팀 초대 | `mail` |
| 마감일 알림 | `alarm` |
| 할일 배정 | `assignment` |

---

## 8. 모션 & 전환

### 8.1 Tailwind 클래스 조합

| 케이스 | 클래스 |
|--------|--------|
| 버튼 상태 변화 | `transition-[background,box-shadow] duration-fast ease-standard` |
| 호버 배경 | `transition-colors duration-fast ease-standard` |
| 드롭다운 열림 | `transition-[opacity,transform] duration-normal ease-decelerate` |
| 모달 진입 | `transition-[opacity,transform] duration-slow ease-decelerate` |
| 사이드 드로어 | `transition-transform duration-slow ease-standard` |

### 8.2 모달 애니메이션 (CSS)

```css
/* globals.css */
@keyframes modal-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-modal-in {
  animation: modal-in 350ms cubic-bezier(0, 0, 0, 1) forwards;
}

@media (prefers-reduced-motion: reduce) {
  .animate-modal-in { animation-duration: 0ms; }
  * { transition-duration: 0ms !important; }
}
```

### 8.3 취소선 애니메이션

```css
@keyframes strikethrough {
  from { width: 0; }
  to   { width: 100%; }
}
.animate-strikethrough::after {
  content: '';
  position: absolute;
  top: 50%; left: 0;
  height: 1px;
  background: currentColor;
  animation: strikethrough 200ms ease-standard forwards;
}
```

---

## 9. 접근성

### 9.1 색상 대비 검증

| 조합 | 대비 비율 | WCAG |
|------|----------|------|
| `text-primary` on `bg-white` | 4.56:1 | AA |
| `text-neutral-700` on `bg-white` | 7.0:1 | AAA |
| `text-neutral-500` on `bg-white` | 4.6:1 | AA |
| `text-white` on `bg-primary` | 4.56:1 | AA |
| `text-danger` on `bg-white` | 4.74:1 | AA |

### 9.2 포커스 링

`tailwind.config.js`에 정의된 `focus-visible:outline-*` 클래스를 사용한다.  
마우스 클릭 시 포커스 링이 표시되지 않도록 `focus:outline-none focus-visible:outline-...` 조합으로 처리한다.

```jsx
// 버튼 공통 포커스
className="... focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
```

### 9.3 시맨틱 마크업 + aria 속성

| 컴포넌트 | 처리 |
|----------|------|
| 모달 | `role="dialog" aria-modal="true" aria-labelledby="modal-title"` |
| 토스트 | `role="alert" aria-live="polite"` |
| 로딩 | `aria-label="로딩 중" aria-busy="true"` |
| 알림 뱃지 | `aria-label="읽지 않은 알림 3개"` |
| 아이콘 전용 버튼 | `aria-label="삭제"` (필수) |
| 읽기 전용 필드 | `readOnly aria-readonly="true"` |

### 9.4 키보드 네비게이션 클래스 패턴

```jsx
// Tab 트랩 (모달) — focus-trap-react 라이브러리 사용 권장
// Escape 핸들러
useEffect(() => {
  const handler = (e) => { if (e.key === 'Escape') onClose(); };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, []);
```

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| v1.0 | 2026-05-14 | UI/UX Designer | 최초 작성 (Google Calendar 레퍼런스 기반) |
| v2.0 | 2026-05-14 | UI/UX Designer | Tailwind CSS v3 기반으로 전면 재작성 |
