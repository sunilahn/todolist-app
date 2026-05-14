import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Pagination } from '@/components/Pagination';
import { TodoList } from '@/features/todo/components/TodoList';
import { useTodos } from '@/features/todo/hooks/useTodos';
import { useCategories } from '@/features/category/hooks/useCategories';
import { ROUTES } from '@/shared/constants/routes';
import { ALL_STATUSES, TODO_STATUS_LABELS } from '@/shared/constants/todoStatus';
import type { TodoStatus } from '@/shared/constants/todoStatus';
import type { Todo } from '@/features/todo/types/todo.types';

const LIMIT = 20;

export default function TodoListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') ?? '';
  const status = (searchParams.get('status') as TodoStatus | null) ?? undefined;
  const categoryId = searchParams.get('categoryId') ?? undefined;
  const startDate = searchParams.get('startDate') ?? '';
  const endDate = searchParams.get('endDate') ?? '';
  const page = Number(searchParams.get('page') ?? '1');

  const { data, isLoading } = useTodos({
    search: search || undefined,
    status,
    categoryId,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit: LIMIT,
  });
  const { data: categories } = useCategories();

  const todos = data?.todos ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const updateParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.set('page', '1');
      return next;
    });
  };

  const handlePageChange = (p: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(p));
      return next;
    });
  };

  const handleTodoClick = (todo: Todo) => {
    navigate(ROUTES.TODO_DETAIL(todo.todoId));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg text-neutral-900">할일 목록</h1>
        <Button onClick={() => navigate(ROUTES.TODO_DETAIL('new'))}>
          할일 추가
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <Input
          placeholder="키워드 검색"
          value={search}
          onChange={(e) => updateParam('search', e.target.value)}
        />

        <div className="flex gap-3 flex-wrap">
          <select
            value={status ?? ''}
            onChange={(e) => updateParam('status', e.target.value)}
            className="h-10 pl-3 pr-9 rounded-md border border-neutral-300 text-base text-neutral-700 bg-white appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-[border-color,box-shadow] duration-normal ease-standard cursor-pointer"
          >
            <option value="">전체 상태</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TODO_STATUS_LABELS[s]}
              </option>
            ))}
          </select>

          <Input
            type="date"
            value={startDate}
            onChange={(e) => updateParam('startDate', e.target.value)}
            className="w-auto"
          />

          <Input
            type="date"
            value={endDate}
            onChange={(e) => updateParam('endDate', e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {!isLoading && (
        <p className="text-sm text-neutral-500">총 {total}개</p>
      )}

      <TodoList todos={todos} categories={categories} isLoading={isLoading} onTodoClick={handleTodoClick} />

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
