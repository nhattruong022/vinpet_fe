'use client';

import { useEffect } from 'react';

interface ToastProps {
  isVisible: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function Toast({
  isVisible,
  type,
  title,
  message,
  onClose,
  autoClose = true,
  autoCloseDelay = 3000
}: ToastProps) {
  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, autoCloseDelay, onClose]);

  if (!isVisible) return null;

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 min-w-80 max-w-md`}>
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            {icon}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-sm opacity-90">{message}</p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 text-white hover:text-gray-200 transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

