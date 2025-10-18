import { ReactNode } from 'react';

interface TerminalPanelProps {
  children: ReactNode;
  className?: string;
  header?: string;
}

/**
 * Terminal-style panel with green border and glow effect
 */
export function TerminalPanel({ children, className = '', header }: TerminalPanelProps) {
  return (
    <div className={`terminal-panel ${className}`}>
      {header && (
        <div className="border-b-2 border-accent pb-2 mb-4">
          <h2 className="system-header">{header}</h2>
        </div>
      )}
      {children}
    </div>
  );
}


