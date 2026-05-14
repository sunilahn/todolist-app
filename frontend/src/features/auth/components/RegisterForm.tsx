import { useForm } from 'react-hook-form';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useRegister } from '../hooks/useRegister';
import type { RegisterRequest } from '../types/auth.types';

const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

interface RegisterFormValues extends RegisterRequest {
  passwordConfirm: string;
}

export function RegisterForm() {
  const { register: registerUser, isLoading, formError, setFormError } = useRegister();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>();

  const password = watch('password');

  const onSubmit = ({ passwordConfirm: _pc, ...data }: RegisterFormValues) => {
    setFormError(null);
    registerUser(data);
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
        placeholder="영문, 숫자, 특수문자 8자 이상"
        hint="영문, 숫자, 특수문자를 포함하여 8자 이상"
        error={errors.password?.message}
        {...register('password', {
          required: '비밀번호를 입력해주세요.',
          pattern: {
            value: PASSWORD_REGEX,
            message: '영문, 숫자, 특수문자를 포함하여 8자 이상 입력해주세요.',
          },
        })}
      />
      <Input
        label="비밀번호 확인"
        type="password"
        placeholder="비밀번호를 다시 입력해주세요"
        error={errors.passwordConfirm?.message}
        {...register('passwordConfirm', {
          required: '비밀번호 확인을 입력해주세요.',
          validate: (value) => value === password || '비밀번호가 일치하지 않습니다.',
        })}
      />
      <Input
        label="이름 (선택)"
        type="text"
        placeholder="이름을 입력해주세요"
        error={errors.name?.message}
        {...register('name')}
      />
      <Button type="submit" variant="primary" loading={isLoading} className="w-full mt-2">
        회원가입
      </Button>
    </form>
  );
}
