import { Spinner } from '@/components/Spinner';
import { TodoCard } from './TodoCard';
import type { Todo } from '../types/todo.types';
import type { Category } from '@/features/category/types/category.types';

interface TodoListProps {
  todos: Todo[];
  categories?: Category[];
  isLoading?: boolean;
  onTodoClick?: (todo: Todo) => void;
}

function findCategory(todo: Todo, categories?: Category[]): { name: string; color: string | null } | null {
  if (!todo.categoryId || !categories) return null;
  const cat = categories.find((c) => c.categoryId === todo.categoryId);
  return cat ? { name: cat.name, color: cat.color } : null;
}

export function TodoList({ todos, categories, isLoading = false, onTodoClick }: TodoListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 px-6 text-neutral-500">
        <p className="text-md text-neutral-500">할일이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
      {todos.map((todo) => {
        const category = findCategory(todo, categories);
        return (
          <TodoCard
            key={todo.todoId}
            todo={todo}
            categoryName={category?.name}
            categoryColor={category?.color}
            onClick={() => onTodoClick?.(todo)}
          />
        );
      })}
    </div>
  );
}
