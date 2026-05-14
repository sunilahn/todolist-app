import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { requestPasswordReset, confirmPasswordReset } from '@/features/auth/api/auth.api';
import { getErrorMessage, isUnprocessableError } from '@/shared/utils/errorUtils';
import { ROUTES } from '@/shared/constants/routes';

const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

interface RequestFormValues {
  email: string;
}

interface ConfirmFormValues {
  newPassword: string;
  newPasswordConfirm: string;
}

function PasswordResetRequestForm() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<RequestFormValues>();

  const mutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: () => {
      setSentEmail(getValues('email'));
      setSent(true);
    },
    onError: (error) => {
      setFormError(getErrorMessage(error));
    },
  });

  if (sent) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-neutral-700">
          <span className="font-medium">{sentEmail}</span>로 이메일을 전송했습니다.
        </p>
        <p className="text-sm text-neutral-500">이메일을 확인하여 비밀번호를 재설정해주세요.</p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setSent(false);
            setFormError(null);
          }}
        >
          다시 전송하기
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit((data) => { setFormError(null); mutation.mutate(data); })} noValidate className="flex flex-col gap-4">
      {formError && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}
      <Input
        label="이메일"
        type="email"
        placeholder="가입한 이메일을 입력해주세요"
        error={errors.email?.message}
        {...register('email', {
          required: '이메일을 입력해주세요.',
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: '올바른 이메일 형식을 입력해주세요.',
          },
        })}
      />
      <Button type="submit" variant="primary" loading={mutation.isPending} className="w-full">
        재설정 링크 이메일 전송
      </Button>
    </form>
  );
}

interface PasswordResetConfirmFormProps {
  token: string;
}

function PasswordResetConfirmForm({ token }: PasswordResetConfirmFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ConfirmFormValues>();

  const newPassword = watch('newPassword');

  const mutation = useMutation({
    mutationFn: confirmPasswordReset,
    onSuccess: () => {
      setIsSuccess(true);
    },
    onError: (error) => {
      if (isUnprocessableError(error)) {
        setIsExpired(true);
      } else {
        setFormError(getErrorMessage(error));
      }
    },
  });

  if (isExpired) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-danger font-medium">재설정 링크가 만료되었습니다.</p>
        <p className="text-sm text-neutral-500">비밀번호 재설정을 다시 요청해주세요.</p>
        <Link to={ROUTES.PASSWORD_RESET}>
          <Button type="button" variant="secondary" className="w-full">
            재설정 다시 요청하기
          </Button>
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-neutral-700 font-medium">비밀번호가 재설정되었습니다.</p>
        <Link to={ROUTES.LOGIN}>
          <Button type="button" variant="primary" className="w-full">
            로그인하기
          </Button>
        </Link>
      </div>
    );
  }

  const onSubmit = ({ newPassword: pw }: ConfirmFormValues) => {
    setFormError(null);
    mutation.mutate({ token, newPassword: pw });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {formError && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}
      <Input
        label="새 비밀번호"
        type="password"
        placeholder="영문, 숫자, 특수문자 8자 이상"
        hint="영문, 숫자, 특수문자를 포함하여 8자 이상"
        error={errors.newPassword?.message}
        {...register('newPassword', {
          required: '새 비밀번호를 입력해주세요.',
          pattern: {
            value: PASSWORD_REGEX,
            message: '영문, 숫자, 특수문자를 포함하여 8자 이상 입력해주세요.',
          },
        })}
      />
      <Input
        label="새 비밀번호 확인"
        type="password"
        placeholder="새 비밀번호를 다시 입력해주세요"
        error={errors.newPasswordConfirm?.message}
        {...register('newPasswordConfirm', {
          required: '새 비밀번호 확인을 입력해주세요.',
          validate: (value) => value === newPassword || '비밀번호가 일치하지 않습니다.',
        })}
      />
      <Button type="submit" variant="primary" loading={mutation.isPending} className="w-full">
        비밀번호 재설정
      </Button>
    </form>
  );
}

export default function PasswordResetPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-neutral-900 mb-6">Todolist-App</h1>
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-lg font-semibold text-neutral-800 mb-6">비밀번호 재설정</h2>
          {token ? <PasswordResetConfirmForm token={token} /> : <PasswordResetRequestForm />}
          <div className="mt-4 text-sm text-center">
            <Link to={ROUTES.LOGIN} className="text-primary hover:underline">
              로그인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
