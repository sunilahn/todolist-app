import { Link } from 'react-router-dom';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { ROUTES } from '@/shared/constants/routes';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-neutral-900 mb-6">Todolist-App</h1>
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-lg font-semibold text-neutral-800 mb-6">로그인</h2>
          <LoginForm />
          <div className="mt-4 flex flex-col gap-2 text-sm text-center">
            <Link to={ROUTES.PASSWORD_RESET} className="text-primary hover:underline">
              비밀번호를 잊으셨나요?
            </Link>
            <span className="text-neutral-500">
              계정이 없으신가요?{' '}
              <Link to={ROUTES.REGISTER} className="text-primary hover:underline">
                회원가입
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
