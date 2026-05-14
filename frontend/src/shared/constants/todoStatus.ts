export type TodoStatus = 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'ON_HOLD';

export const TODO_STATUS_LABELS: Record<TodoStatus, string> = {
  PLANNED: '예정',
  IN_PROGRESS: '진행중',
  DONE: '완료',
  ON_HOLD: '보류',
};

export const ALLOWED_TRANSITIONS: Record<TodoStatus, TodoStatus[]> = {
  PLANNED: ['IN_PROGRESS', 'ON_HOLD'],
  IN_PROGRESS: ['DONE', 'ON_HOLD'],
  DONE: ['IN_PROGRESS'],
  ON_HOLD: ['PLANNED', 'IN_PROGRESS'],
};

export const ALL_STATUSES: TodoStatus[] = ['PLANNED', 'IN_PROGRESS', 'DONE', 'ON_HOLD'];
