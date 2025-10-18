import { ButtonHTMLAttributes, ReactNode } from 'react';

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

/**
 * Retro neon button with hover glow effect
 */
export function NeonButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: NeonButtonProps) {
  const variantStyles = {
    primary: 'border-accent text-accent hover:bg-accent hover:text-background',
    secondary: 'border-accent text-accent hover:bg-accent hover:text-background',
    danger: 'border-error text-error hover:bg-error hover:text-background',
  };

  return (
    <button
      className={`neon-button ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}


