import React from 'react';
import { cn } from '../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'recessed';
}

export const Card: React.FC<CardProps> = ({ children, className, variant = 'default', ...props }) => {
  return (
    <div 
      {...props}
      className={cn(
        "rounded-lg p-8 transition-all duration-300",
        variant === 'default' ? "bg-surface-container-lowest shadow-ambient" : "bg-surface-container-low",
        className
      )}
    >
      {children}
    </div>
  );
};

export const Headline: React.FC<{ children: React.ReactNode; className?: string; level?: 1 | 2 | 3 }> = ({ children, className, level = 2 }) => {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
  const sizes = {
    1: "text-5xl font-extrabold leading-[1.1] tracking-[-0.03em]",
    2: "text-3xl font-bold leading-tight tracking-[-0.02em]",
    3: "text-xl font-semibold leading-snug tracking-[-0.01em]"
  };
  
  return (
    <Tag className={cn("font-display text-on-surface", sizes[level], className)}>
      {children}
    </Tag>
  );
};

export const Label: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <span className={cn("text-[11px] font-semibold uppercase tracking-[0.08em] text-on-surface/60", className)}>
      {children}
    </span>
  );
};

export const Button: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary';
  className?: string;
}> = ({ children, onClick, variant = 'primary', className }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-6 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm",
        variant === 'primary' 
          ? "bg-primary text-white hover:bg-primary-container shadow-sm" 
          : "bg-surface-container-highest text-on-surface hover:bg-surface-container-high",
        className
      )}
    >
      {children}
    </button>
  );
};
