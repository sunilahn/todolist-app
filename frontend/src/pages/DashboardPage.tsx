import { Badge } from '@/components/Badge';
import { Spinner } from '@/components/Spinner';
import { useThisWeekTodos } from '@/features/todo/hooks/useThisWeekTodos';
import { useTodayTodos } from '@/features/todo/hooks/useTodayTodos';
import type { Todo } from '@/features/todo/types/todo.types';
import type { TodoStatus } from '@/shared/constants/todoStatus';
import { formatDate } from '@/shared/utils/dateUtils';

const STATUS_LABELS: Record<TodoStatus, string> = {
  PLANNED: '예정',
  IN_PROGRESS: '진행중',
  DONE: '완료',
  ON_HOLD: '보류',
};

const STATUS_ORDER: TodoStatus[] = ['PLANNED', 'IN_PROGRESS', 'DONE', 'ON_HOLD'];

function getStatusCounts(todos: Todo[]) {
  return STATUS_ORDER.reduce<Record<TodoStatus, number>>(
    (acc, status) => {
      acc[status] = todos.filter((todo) => todo.status === status).length;
      return acc;
    },
    {
      PLANNED: 0,
      IN_PROGRESS: 0,
      DONE: 0,
      ON_HOLD: 0,
    },
  );
}

function dedupeTodos(...todoGroups: Todo[][]): Todo[] {
  const todoMap = new Map<string, Todo>();

  todoGroups.flat().forEach((todo) => {
    todoMap.set(todo.todoId, todo);
  });

  return Array.from(todoMap.values());
}

function SummaryCard({
  title,
  count,
  description,
}: {
  title: string;
  count: number;
  description: string;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white px-6 py-5 shadow-sm">
      <p className="text-sm text-neutral-500">{title}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <strong className="text-2xl font-bold text-neutral-900">{count}</strong>
        <span className="text-sm text-neutral-500">{description}</span>
      </div>
    </section>
  );
}

function TodoPreviewSection({
  title,
  todos,
  emptyMessage,
}: {
  title: string;
  todos: Todo[];
  emptyMessage: string;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 px-6 py-4">
        <h2 className="text-md text-neutral-900">{title}</h2>
      </div>

      {todos.length === 0 ? (
        <div className="px-6 py-10 text-sm text-neutral-500">{emptyMessage}</div>
      ) : (
        <ul className="divide-y divide-neutral-200">
          {todos.map((todo) => (
            <li
              key={todo.todoId}
              className="flex flex-col gap-3 px-6 py-4 tablet:flex-row tablet:items-center tablet:justify-between"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Badge variant={todo.status} label={STATUS_LABELS[todo.status]} />
                <span
                  className={
                    todo.status === 'DONE'
                      ? 'truncate text-base text-neutral-500 line-through'
                      : 'truncate text-base text-neutral-700'
                  }
                >
                  {todo.title}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <span>{todo.teamId ? '팀 할 일' : '개인 할 일'}</span>
                <span className="text-neutral-300">/</span>
                <span>마감 {formatDate(todo.dueDate)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const todayQuery = useTodayTodos();
  const thisWeekQuery = useThisWeekTodos();

  const todayTodos = todayQuery.data ?? [];
  const thisWeekTodos = thisWeekQuery.data ?? [];
  const allTodos = dedupeTodos(todayTodos, thisWeekTodos);
  const statusCounts = getStatusCounts(allTodos);
  const isLoading = todayQuery.isLoading || thisWeekQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl text-neutral-900">대시보드</h1>
        <p className="text-sm text-neutral-500">
          오늘과 이번 주 할 일을 한눈에 확인하고 현재 진행 상태를 빠르게 파악할 수 있습니다.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 desktop:grid-cols-2">
        <SummaryCard
          title="오늘 할 일"
          count={todayTodos.length}
          description={todayTodos.length === 0 ? '등록된 일정 없음' : '오늘 기준 진행 항목'}
        />
        <SummaryCard
          title="이번 주 할 일"
          count={thisWeekTodos.length}
          description={thisWeekTodos.length === 0 ? '등록된 일정 없음' : '이번 주 마감 항목'}
        />
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:justify-between">
          <div>
            <h2 className="text-md text-neutral-900">진행 상태 분포</h2>
            <p className="mt-1 text-sm text-neutral-500">
              오늘과 이번 주 조회 결과를 기준으로 집계했습니다.
            </p>
          </div>
          <span className="text-sm text-neutral-500">총 {allTodos.length}건</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 desktop:grid-cols-4">
          {STATUS_ORDER.map((status) => (
            <div
              key={status}
              className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-4"
            >
              <Badge variant={status} label={STATUS_LABELS[status]} />
              <div className="mt-4 text-2xl font-bold text-neutral-900">
                {statusCounts[status]}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 desktop:grid-cols-2">
        <TodoPreviewSection
          title="오늘 할 일"
          todos={todayTodos}
          emptyMessage="오늘 해당하는 할일이 없습니다"
        />
        <TodoPreviewSection
          title="이번 주 할 일"
          todos={thisWeekTodos}
          emptyMessage="이번 주 해당하는 할일이 없습니다"
        />
      </div>
    </div>
  );
}
