import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'destructive' | 'outline' | 'ghost'; // เพิ่ม ghost
  size?: 'sm' | 'md' | 'lg' | 'icon'; // เพิ่ม icon
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseClasses = 'rounded-lg font-medium transition-all duration-200 flex items-center justify-center';
    
    const sizeClasses = {
      sm: 'px-3 py-1 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
      icon: 'p-2', 
    };

    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 active:scale-95',
      danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-95',
      destructive: 'bg-red-600 text-white hover:bg-red-700 active:scale-95',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 active:scale-95',
      ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 active:scale-95',
    };

    return (
      <button
        ref={ref}
        className={`
          ${baseClasses} 
          ${sizeClasses[size]} 
          ${variantClasses[variant]} 
          ${size === 'icon' ? 'aspect-square' : ''} 
          ${className || ''}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';