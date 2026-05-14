import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center gap-4 py-16 px-6 text-neutral-500">
      <span className="material-symbols-outlined text-5xl text-neutral-300">search_off</span>
      <p className="text-lg text-neutral-900">404</p>
      <p className="text-md text-neutral-500">페이지를 찾을 수 없습니다.</p>
      <button
        onClick={() => navigate(ROUTES.DASHBOARD)}
        className="inline-flex items-center justify-center gap-1.5 rounded-full font-medium px-6 py-2 text-base bg-white text-primary border border-primary hover:bg-primary-light transition-colors duration-fast ease-standard focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        대시보드로 이동
      </button>
    </div>
  );
}
