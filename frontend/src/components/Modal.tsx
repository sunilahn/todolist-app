import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className = '' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`relative bg-white rounded-xl shadow-xl w-full max-w-[520px] min-w-[360px] p-6 animate-modal-in ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 id="modal-title" className="text-lg text-neutral-900 mb-4">
            {title}
          </h2>
        )}
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-colors duration-fast"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
