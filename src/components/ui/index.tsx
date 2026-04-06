import React from 'react';
import { type LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  isLoading?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon: Icon,
  isLoading,
  className = '',
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-sky/50 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-brand-blue-primary text-white hover:bg-brand-blue-primary/80 active:scale-95 shadow-lg shadow-brand-blue-primary/20",
    secondary: "bg-brand-lime text-brand-blue-dark hover:bg-brand-lime/80 active:scale-95 shadow-lg shadow-brand-lime/20",
    outline: "border-2 border-brand-sky/30 text-brand-sky hover:bg-brand-sky/10",
    ghost: "text-white/70 hover:text-white hover:bg-white/10"
  };

  const sizes = {
    sm: "px-4 py-1.5 text-sm",
    md: "px-6 py-2.5 text-base",
    lg: "px-8 py-3.5 text-lg"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : Icon && <Icon className="w-5 h-5 mr-2" />}
      {children}
    </button>
  );
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className = '', onClick, hoverable = true }: CardProps) {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-brand-blue-dark/50 backdrop-blur-sm border border-white/10 p-6 rounded-2xl 
        ${hoverable ? 'hover:border-brand-sky/40 hover:bg-brand-blue-dark/70 cursor-pointer transition-all hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-brand-sky/10' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  error?: string;
  isTextArea?: boolean;
  rows?: number;
}

export function Input({ label, error, isTextArea, className = '', ...props }: InputProps) {
  const Component = isTextArea ? 'textarea' : 'input';
  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-medium text-white/50 px-1">
        {label}
      </label>
      <Component 
        className={`
          bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white
          focus:outline-none focus:border-brand-sky transition-colors
          placeholder:text-white/20
          ${error ? 'border-red-500/50 focus:border-red-500' : ''}
          ${className}
        `}
        {...(props as any)}
      />
      {error && <span className="text-sm text-red-500/80 px-1">{error}</span>}
    </div>
  );
}
