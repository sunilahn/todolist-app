import { NavLink } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
}

function NavItem({ to, icon, label }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 h-11 px-4 rounded-lg text-base transition-colors ${
          isActive
            ? 'font-medium text-primary bg-primary-light'
            : 'text-neutral-700 hover:bg-neutral-100'
        }`
      }
    >
      <span className="material-symbols-outlined text-[22px]">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed top-header left-0 bottom-0 w-sidebar bg-neutral-50 border-r border-neutral-200 overflow-y-auto hidden desktop:block p-3">
      <nav className="flex flex-col gap-1">
        <NavItem to={ROUTES.DASHBOARD} icon="home" label="대시보드" />
        <NavItem to={ROUTES.TODOS} icon="check_box" label="할일 목록" />
        <NavItem to={ROUTES.CATEGORIES} icon="label" label="카테고리" />
        <NavItem to={ROUTES.TEAMS} icon="group" label="팀 관리" />
        
        <div className="my-4 border-t border-neutral-200" />
        
        <NavItem to={ROUTES.PROFILE} icon="manage_accounts" label="내 정보" />
      </nav>
    </aside>
  );
}
