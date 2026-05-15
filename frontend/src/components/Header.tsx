import { useNotifications } from '@/features/notification/hooks/useNotifications';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';

export function Header() {
  const { data: notifications = [] } = useNotifications();
  const user = useAuthStore((s) => s.user);
  const { logout } = useLogout();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="fixed top-0 left-0 right-0 h-header bg-white border-b border-neutral-200 z-[100] flex items-center justify-between px-6">
      <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2">
        <span className="text-lg font-bold text-primary">Todolist</span>
      </Link>

      <div className="flex items-center gap-4">
        <Link
          to={ROUTES.NOTIFICATIONS}
          className="relative p-2 text-neutral-500 hover:bg-neutral-100 rounded-full transition-colors"
          aria-label={unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : '알림'}
        >
          <span className="material-symbols-outlined text-[24px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
          <span className="text-sm font-medium text-neutral-700">{user?.name || '사용자'}</span>
          <button
            onClick={logout}
            className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-full transition-colors"
            title="로그아웃"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
