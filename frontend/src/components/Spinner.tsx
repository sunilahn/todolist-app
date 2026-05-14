interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-8 h-8',
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label="로딩 중"
      className={`${sizeClasses[size]} border-2 border-current border-t-transparent rounded-full animate-spin inline-block ${className}`}
    />
  );
}
