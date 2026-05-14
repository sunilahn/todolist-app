interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="페이지 네비게이션" className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="이전 페이지"
        className="px-3 py-1.5 text-sm text-neutral-700 rounded-full hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300 transition-colors duration-fast"
      >
        이전
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          aria-current={page === currentPage ? 'page' : undefined}
          className={
            page === currentPage
              ? 'w-8 h-8 text-sm font-medium bg-primary text-white rounded-full'
              : 'w-8 h-8 text-sm text-neutral-700 rounded-full hover:bg-neutral-100 transition-colors duration-fast'
          }
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="다음 페이지"
        className="px-3 py-1.5 text-sm text-neutral-700 rounded-full hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300 transition-colors duration-fast"
      >
        다음
      </button>
    </nav>
  );
}
