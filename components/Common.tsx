
import React, { InputHTMLAttributes, ButtonHTMLAttributes, ReactNode, useState } from 'react';

export const Button = ({ className = '', variant = 'primary', size = 'md', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost', size?: 'sm' | 'md' | 'lg' }) => {
  const baseStyle = "font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center";
  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  const variants = {
    primary: "bg-primary text-white hover:bg-indigo-600 focus:ring-primary border border-transparent shadow-sm",
    secondary: "bg-white dark:bg-darkSurface text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-500 shadow-sm",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-transparent focus:ring-red-500",
    ghost: "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
  };
  
  return <button className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />;
};

export const Input = React.forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`w-full px-3 py-2 bg-white dark:bg-darkSurface border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all ${className}`}
    {...props}
  />
));

export const PasswordInput = React.forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className = '', ...props }, ref) => {
  const [isVisible, setIsVisible] = useState(false);

  // Handlers for "hold to see" behavior
  const showPassword = (e: React.MouseEvent | React.TouchEvent) => {
    // We prevent default to avoid losing focus on the input, which feels jarring
    if (e.type !== 'touchstart') e.preventDefault(); 
    setIsVisible(true);
  };

  const hidePassword = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsVisible(false);
  };

  return (
    <div className="relative w-full">
      <Input
        ref={ref}
        {...props}
        type={isVisible ? "text" : "password"}
        className={`${className} pr-10`} 
      />
      <button
        type="button"
        tabIndex={-1}
        className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none cursor-pointer"
        onMouseDown={showPassword}
        onMouseUp={hidePassword}
        onMouseLeave={hidePassword}
        onTouchStart={showPassword}
        onTouchEnd={hidePassword}
        title="Hold to show password"
        style={{ touchAction: 'none' }}
      >
        <span className="material-icons-round select-none pointer-events-none text-xl">
          {isVisible ? 'visibility' : 'visibility_off'}
        </span>
      </button>
    </div>
  );
});

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-darkSurface rounded-2xl shadow-2xl w-full md:max-w-lg max-h-[90vh] flex flex-col transform transition-all animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <span className="material-icons-round text-xl block">close</span>
          </button>
        </div>
        <div className="p-5 overflow-y-auto custom-scrollbar">
           {children}
        </div>
      </div>
    </div>
  );
};

interface AvatarProps {
  name: string;
  url?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({ name, url, size = 'md' }) => {
  const sizes = { sm: 'w-7 h-7 text-[10px]', md: 'w-9 h-9 text-xs', lg: 'w-14 h-14 text-base' };
  return (
    <div className={`${sizes[size]} rounded-full relative shrink-0`}>
       {url ? (
         <img src={url} alt={name} className="w-full h-full rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm" />
       ) : (
         <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold border-2 border-white dark:border-gray-800 shadow-sm">
           {name ? name.substring(0, 2).toUpperCase() : 'U'}
         </div>
       )}
    </div>
  );
};
