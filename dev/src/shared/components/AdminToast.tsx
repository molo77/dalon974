"use client";

import { useState, useEffect } from 'react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface AdminToastProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        handleRemove();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const getToastStyles = () => {
    const baseStyles = "transform transition-all duration-300 ease-in-out";
    const visibilityStyles = isVisible && !isLeaving 
      ? "translate-x-0 opacity-100" 
      : "translate-x-full opacity-0";
    
    return `${baseStyles} ${visibilityStyles}`;
  };

  const getIconAndColors = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          bgColor: "bg-gradient-to-r from-green-500 to-emerald-500",
          borderColor: "border-green-200",
          textColor: "text-green-800"
        };
      case 'error':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          bgColor: "bg-gradient-to-r from-red-500 to-red-600",
          borderColor: "border-red-200",
          textColor: "text-red-800"
        };
      case 'warning':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          bgColor: "bg-gradient-to-r from-yellow-500 to-orange-500",
          borderColor: "border-yellow-200",
          textColor: "text-yellow-800"
        };
      case 'info':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: "bg-gradient-to-r from-blue-500 to-cyan-500",
          borderColor: "border-blue-200",
          textColor: "text-blue-800"
        };
    }
  };

  const { icon, bgColor, borderColor, textColor } = getIconAndColors();

  return (
    <div className={`${getToastStyles()} max-w-sm w-full bg-white shadow-lg rounded-2xl border ${borderColor} overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center text-white shadow-lg`}>
            {icon}
          </div>
          <div className="ml-3 flex-1">
            <h4 className={`text-sm font-semibold ${textColor}`}>
              {toast.title}
            </h4>
            <p className="text-sm text-slate-600 mt-1">
              {toast.message}
            </p>
          </div>
          <button
            onClick={handleRemove}
            className="ml-4 flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminToast({ toasts, onRemove }: AdminToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// Hook pour gérer les toasts
export function useAdminToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id, duration: toast.duration || 5000 };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (title: string, message: string) => {
    addToast({ type: 'success', title, message });
  };

  const showError = (title: string, message: string) => {
    addToast({ type: 'error', title, message });
  };

  const showWarning = (title: string, message: string) => {
    addToast({ type: 'warning', title, message });
  };

  const showInfo = (title: string, message: string) => {
    addToast({ type: 'info', title, message });
  };

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}
