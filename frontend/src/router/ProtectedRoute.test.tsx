import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute';

beforeEach(() => {
  useAuthStore.setState({ accessToken: null, refreshToken: null });
});

function ProtectedWrapper({ initialPath }: { initialPath: string }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>대시보드</div>} />
          <Route path="/todos" element={<div>할일 목록</div>} />
        </Route>
        <Route path="/login" element={<div>로그인 페이지</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function PublicWrapper({ initialPath }: { initialPath: string }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<div>로그인 페이지</div>} />
          <Route path="/register" element={<div>회원가입 페이지</div>} />
        </Route>
        <Route path="/dashboard" element={<div>대시보드</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('비인증 상태에서 /dashboard 접근 시 /login으로 리다이렉트', () => {
    render(<ProtectedWrapper initialPath="/dashboard" />);
    expect(screen.getByText('로그인 페이지')).toBeInTheDocument();
  });

  it('인증 상태에서 /dashboard 접근 시 콘텐츠 렌더링', () => {
    useAuthStore.setState({ accessToken: 'valid-token', refreshToken: null });
    render(<ProtectedWrapper initialPath="/dashboard" />);
    expect(screen.getByText('대시보드')).toBeInTheDocument();
  });

  it('비인증 상태에서 /todos 접근 시 /login으로 리다이렉트', () => {
    render(<ProtectedWrapper initialPath="/todos" />);
    expect(screen.getByText('로그인 페이지')).toBeInTheDocument();
  });

  it('인증 상태에서 /todos 접근 시 콘텐츠 렌더링', () => {
    useAuthStore.setState({ accessToken: 'valid-token', refreshToken: null });
    render(<ProtectedWrapper initialPath="/todos" />);
    expect(screen.getByText('할일 목록')).toBeInTheDocument();
  });
});

describe('PublicOnlyRoute', () => {
  it('비인증 상태에서 /login 접근 시 콘텐츠 렌더링', () => {
    render(<PublicWrapper initialPath="/login" />);
    expect(screen.getByText('로그인 페이지')).toBeInTheDocument();
  });

  it('인증 상태에서 /login 접근 시 /dashboard로 리다이렉트', () => {
    useAuthStore.setState({ accessToken: 'valid-token', refreshToken: null });
    render(<PublicWrapper initialPath="/login" />);
    expect(screen.getByText('대시보드')).toBeInTheDocument();
  });

  it('비인증 상태에서 /register 접근 시 콘텐츠 렌더링', () => {
    render(<PublicWrapper initialPath="/register" />);
    expect(screen.getByText('회원가입 페이지')).toBeInTheDocument();
  });

  it('인증 상태에서 /register 접근 시 /dashboard로 리다이렉트', () => {
    useAuthStore.setState({ accessToken: 'valid-token', refreshToken: null });
    render(<PublicWrapper initialPath="/register" />);
    expect(screen.getByText('대시보드')).toBeInTheDocument();
  });
});
