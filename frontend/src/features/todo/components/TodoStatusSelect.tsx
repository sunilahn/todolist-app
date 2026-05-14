import { ALLOWED_TRANSITIONS, TODO_STATUS_LABELS } from '@/shared/constants/todoStatus';
import type { TodoStatus } from '@/shared/constants/todoStatus';

interface TodoStatusSelectProps {
  currentStatus: TodoStatus;
  onChange: (status: TodoStatus) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function TodoStatusSelect({
  currentStatus,
  onChange,
  disabled = false,
  loading = false,
}: TodoStatusSelectProps) {
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus];

  return (
    <select
      value={currentStatus}
      disabled={disabled || loading}
      onChange={(e) => onChange(e.target.value as TodoStatus)}
      className="h-10 pl-3 pr-9 rounded-md border border-neutral-300 text-base text-neutral-700 bg-white appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-[border-color,box-shadow] duration-normal ease-standard cursor-pointer disabled:bg-neutral-100 disabled:cursor-not-allowed"
    >
      <option value={currentStatus} disabled>
        {TODO_STATUS_LABELS[currentStatus]}
      </option>
      {allowedNext.map((status) => (
        <option key={status} value={status}>
          {TODO_STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}
