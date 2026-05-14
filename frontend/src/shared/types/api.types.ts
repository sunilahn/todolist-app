export interface ApiError {
  code: string;
  message: string;
  details?: ZodIssue[];
}

interface ZodIssue {
  code: string;
  path: string[];
  message: string;
}

export interface PaginatedResponse<T> {
  todos: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: ZodIssue[];
}
