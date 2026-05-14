import React from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'danger-outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover hover:shadow-sm active:bg-primary-hover disabled:bg-neutral-200 disabled:text-neutral-500',
  secondary: 'bg-white text-primary border border-primary hover:bg-primary-light disabled:border-neutral-300 disabled:text-neutral-500',
  danger: 'bg-danger text-white hover:bg-[#b31c12] hover:shadow-sm',
  'danger-outline': 'bg-white text-danger border border-danger hover:bg-danger-light',
  ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-4 py-1.5 text-sm',
  md: 'px-6 py-2 text-base',
  lg: 'px-8 py-3 text-md',
};

const baseClasses =
  'inline-flex items-center justify-center gap-1.5 rounded-full font-medium ' +
  'transition-[background,box-shadow] duration-fast ease-standard ' +
  'focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ' +
  'disabled:cursor-not-allowed';

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={loading || disabled}
      aria-busy={loading ? 'true' : undefined}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
