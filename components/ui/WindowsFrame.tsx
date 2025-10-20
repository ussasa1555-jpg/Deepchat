interface WindowsFrameProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  className?: string;
}

export const WindowsFrame = ({ 
  title, 
  children, 
  onClose, 
  onMinimize, 
  onMaximize,
  className = ""
}: WindowsFrameProps) => {
  return (
    <div className={`windows-frame ${className}`}>
      <div className="windows-titlebar">
        <span className="retro-title">{title}</span>
        <div className="windows-controls">
          <button className="windows-btn" onClick={onMinimize}>_</button>
          <button className="windows-btn" onClick={onMaximize}>□</button>
          <button className="windows-btn" onClick={onClose}>×</button>
        </div>
      </div>
      <div className="windows-content">
        {children}
      </div>
    </div>
  );
};













