import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      console.log('[DEBUG] Modal opened with title:', title);
      
      // Add escape key handler
      const handleEscapeKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen, title, onClose]);

  if (!isOpen) return null;

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[DEBUG] Modal: Confirm button clicked');
    onConfirm();
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[DEBUG] Modal: Cancel button clicked');
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the overlay, not on the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="flex min-h-screen items-center justify-center p-4 text-center"
        onClick={handleOverlayClick}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleOverlayClick}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* Modal */}
        <div 
          className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:w-full sm:max-w-lg w-full max-w-[95%]"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="dialog"
          aria-labelledby="modal-title"
        >
          <div className="px-6 py-4">
            <h3 id="modal-title" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              onKeyDown={(e) => e.key === 'Enter' && handleCancel(e as unknown as React.MouseEvent)}
              className="w-full sm:w-auto rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500 mb-2 sm:mb-0"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm(e as unknown as React.MouseEvent)}
              className="w-full sm:w-auto rounded-lg px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}