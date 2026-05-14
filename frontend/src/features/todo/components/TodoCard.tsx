import { Badge } from '@/components/Badge';
import { formatDate } from '@/shared/utils/dateUtils';
import type { Todo } from '../types/todo.types';

interface TodoCardProps {
  todo: Todo;
  categoryName?: string;
  categoryColor?: string | null;
  onClick?: () => void;
}

function DateRange({ startDate, dueDate }: { startDate: string | null; dueDate: string | null }) {
  if (startDate && dueDate) {
    return <>{formatDate(startDate)} ~ {formatDate(dueDate)}</>;
  }
  if (startDate) {
    return <>시작 {formatDate(startDate)}</>;
  }
  if (dueDate) {
    return <>마감 {formatDate(dueDate)}</>;
  }
  return null;
}

export function TodoCard({ todo, categoryName, categoryColor, onClick }: TodoCardProps) {
  const hasDate = todo.startDate || todo.dueDate;

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 min-h-14 px-4 py-3 border-b border-neutral-200 hover:bg-neutral-50 cursor-pointer transition-colors duration-fast ease-standard"
    >
      <Badge variant={todo.status} />
      <span
        className={
          todo.status === 'DONE'
            ? 'flex-1 text-base line-through text-neutral-500 truncate'
            : 'flex-1 text-base text-neutral-700 truncate'
        }
      >
        {todo.title}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        {categoryName && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-neutral-100 text-neutral-600">
            {categoryColor && (
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColor }} />
            )}
            {categoryName}
          </span>
        )}
        {hasDate && (
          <span className="text-sm text-neutral-500 whitespace-nowrap">
            <DateRange startDate={todo.startDate} dueDate={todo.dueDate} />
          </span>
        )}
      </div>
    </div>
  );
}
