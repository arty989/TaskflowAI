
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { removeToast } from '../store/uiSlice';

const ToastItem = ({ id, message, type, duration = 5000 }: { id: string, message: string, type: 'success' | 'error' | 'info', duration?: number }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(removeToast(id));
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, dispatch]);

  const icons = {
    success: 'check_circle',
    error: 'error',
    info: 'info'
  };

  const colors = {
    success: 'bg-white dark:bg-darkSurface border-l-4 border-green-500 text-gray-800 dark:text-white',
    error: 'bg-white dark:bg-darkSurface border-l-4 border-red-500 text-gray-800 dark:text-white',
    info: 'bg-white dark:bg-darkSurface border-l-4 border-blue-500 text-gray-800 dark:text-white'
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500'
  };

  return (
    <div className={`${colors[type]} shadow-lg rounded-lg p-4 mb-3 flex items-start gap-3 min-w-[300px] max-w-md animate-in slide-in-from-right-full duration-300 pointer-events-auto`}>
      <span className={`material-icons-round ${iconColors[type]} mt-0.5`}>{icons[type]}</span>
      <div className="flex-1">
        <p className="text-sm font-medium leading-relaxed">{message}</p>
      </div>
      <button 
        onClick={() => dispatch(removeToast(id))}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        <span className="material-icons-round text-sm">close</span>
      </button>
    </div>
  );
};

export const ToastContainer = () => {
  const { toasts } = useSelector((state: RootState) => state.ui);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  );
};
