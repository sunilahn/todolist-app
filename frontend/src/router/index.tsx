import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import PasswordResetPage from '@/pages/PasswordResetPage';
import DashboardPage from '@/pages/DashboardPage';
import TodoListPage from '@/pages/TodoListPage';
import TodoDetailPage from '@/pages/TodoDetailPage';
import CategoryPage from '@/pages/CategoryPage';
import TeamPage from '@/pages/TeamPage';
import TeamDetailPage from '@/pages/TeamDetailPage';
import NotificationPage from '@/pages/NotificationPage';
import ProfilePage from '@/pages/ProfilePage';
import NotFoundPage from '@/pages/NotFoundPage';
import { Layout } from '@/components/Layout';

export const router = createBrowserRouter([
  { index: true, element: <Navigate to="/dashboard" replace /> },
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/password-reset', element: <PasswordResetPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/todos', element: <TodoListPage /> },
          { path: '/todos/:id', element: <TodoDetailPage /> },
          { path: '/categories', element: <CategoryPage /> },
          { path: '/teams', element: <TeamPage /> },
          { path: '/teams/:id', element: <TeamDetailPage /> },
          { path: '/notifications', element: <NotificationPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
