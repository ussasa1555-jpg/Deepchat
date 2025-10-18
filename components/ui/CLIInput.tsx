'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

interface CLIInputProps extends InputHTMLAttributes<HTMLInputElement> {
  showCursor?: boolean;
}

/**
 * Command-line style input with optional blinking cursor
 */
export const CLIInput = forwardRef<HTMLInputElement, CLIInputProps>(
  ({ className = '', showCursor = false, ...props }, ref) => {
    return (
      <div className="flex items-center">
        <span className="text-accent mr-2">{'>'}</span>
        <input
          ref={ref}
          className={`cli-input flex-1 ${className}`}
          {...props}
        />
        {showCursor && <span className="cursor-blink ml-1" />}
      </div>
    );
  }
);

CLIInput.displayName = 'CLIInput';


