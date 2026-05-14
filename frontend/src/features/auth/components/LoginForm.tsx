import { useForm } from 'react-hook-form';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useLogin } from '../hooks/useLogin';
import type { LoginRequest } from '../types/auth.types';

export function LoginForm() {
  const { login, isLoading, formError, setFormError } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>();

  const onSubmit = (data: LoginRequest) => {
    setFormError(null);
    login(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {formError && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}
      <Input
        label="이메일"
        type="email"
        placeholder="example@email.com"
        error={errors.email?.message}
        {...register('email', {
          required: '이메일을 입력해주세요.',
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: '올바른 이메일 형식을 입력해주세요.',
          },
        })}
      />
      <Input
        label="비밀번호"
        type="password"
        placeholder="비밀번호를 입력해주세요"
        error={errors.password?.message}
        {...register('password', {
          required: '비밀번호를 입력해주세요.',
        })}
      />
      <Button type="submit" variant="primary" loading={isLoading} className="w-full mt-2">
        로그인
      </Button>
    </form>
  );
}
