export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  PASSWORD_RESET: '/password-reset',
  DASHBOARD: '/dashboard',
  TODOS: '/todos',
  TODO_DETAIL: (id: string) => `/todos/${id}`,
  CATEGORIES: '/categories',
  TEAMS: '/teams',
  TEAM_DETAIL: (id: string) => `/teams/${id}`,
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile',
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
