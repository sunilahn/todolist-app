type BadgeVariant =
  | 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'ON_HOLD'
  | 'ADMIN' | 'MEMBER' | 'VIEWER'
  | 'team';

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  PLANNED: 'bg-neutral-100 text-neutral-700',
  IN_PROGRESS: 'bg-primary-light text-primary',
  DONE: 'bg-success-light text-success',
  ON_HOLD: 'bg-warning-light text-[#b06000]',
  ADMIN: 'bg-primary-light text-primary',
  MEMBER: 'bg-success-light text-success',
  VIEWER: 'bg-neutral-100 text-neutral-500',
  team: 'bg-neutral-100 text-neutral-700 border border-neutral-300',
};

const defaultLabels: Partial<Record<BadgeVariant, string>> = {
  PLANNED: '예정',
  IN_PROGRESS: '진행중',
  DONE: '완료',
  ON_HOLD: '보류',
  ADMIN: '관리자',
  MEMBER: '멤버',
  VIEWER: '뷰어',
};

const baseClasses = 'inline-flex items-center h-[22px] px-2.5 rounded-full text-sm font-medium whitespace-nowrap';

export function Badge({ variant, label, className = '' }: BadgeProps) {
  const displayLabel = label ?? defaultLabels[variant] ?? variant;

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {displayLabel}
    </span>
  );
}
