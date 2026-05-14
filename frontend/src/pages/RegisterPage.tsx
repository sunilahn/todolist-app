import { Link } from 'react-router-dom';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { ROUTES } from '@/shared/constants/routes';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-neutral-900 mb-6">Todolist-App</h1>
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-lg font-semibold text-neutral-800 mb-6">회원가입</h2>
          <RegisterForm />
          <div className="mt-4 text-sm text-center text-neutral-500">
            이미 계정이 있으신가요?{' '}
            <Link to={ROUTES.LOGIN} className="text-primary hover:underline">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
