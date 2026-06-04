import { ReactNode } from "react";

interface RetroWindowProps {
  title: string;
  onClose: () => void;
  width?: number;
  children: ReactNode;
  zIndex?: number;
  offsetX?: number;
  offsetY?: number;
  maxHeightVh?: number;
}

const RetroWindow = ({
  title,
  onClose,
  width = 560,
  children,
  zIndex = 50,
  offsetX = 0,
  offsetY = 0,
  maxHeightVh = 92,
}: RetroWindowProps) => {
  return (
    <div
      className="absolute"
      style={{
        zIndex,
        left: `calc(50% + ${offsetX}px)`,
        top: `calc(50% + ${offsetY}px)`,
        transform: 'translate(-50%, -50%)',
        width,
        maxWidth: '96vw',
        maxHeight: `${maxHeightVh}vh`,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        fontFamily: '"Tw Cen MT","Century Gothic",system-ui,sans-serif',
      }}
    >
      {/* Title bar */}
      <div
        className="h-7 flex items-center justify-between px-2 text-white text-xs flex-shrink-0"
        style={{ background: 'linear-gradient(180deg,#2b3a55 0%,#1a2540 100%)', borderTopLeftRadius: 3, borderTopRightRadius: 3, boxSizing: 'border-box' }}
      >
        <span className="px-1">{title}</span>
        <div className="flex items-center gap-1">
          <button className="w-5 h-5 hover:bg-white/20 leading-none">_</button>
          <button className="w-5 h-5 hover:bg-white/20 leading-none text-[10px]">▢</button>
          <button onClick={onClose} className="w-5 h-5 hover:bg-red-600 leading-none">×</button>
        </div>
      </div>
      {/* Body */}
      <div
        className="p-5 overflow-auto"
        style={{
          background: '#cfdbe9',
          border: '1px solid #2b3a55',
          borderTop: 'none',
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          boxSizing: 'border-box',
          flex: '1 1 auto',
          minHeight: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const RetroButton = ({
  children, onClick, primary, className = '', disabled,
}: { children: ReactNode; onClick?: () => void; primary?: boolean; className?: string; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-1 text-sm border ${className}`}
    style={{
      background: disabled ? '#d8d8d8' : 'linear-gradient(180deg,#f0f0f0 0%,#c8c8c8 100%)',
      borderColor: '#7a7a7a',
      color: disabled ? '#888' : '#111',
      borderRadius: 2,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
      minWidth: primary ? 80 : 70,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
  >
    {children}
  </button>
);

export const RetroInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`px-2 py-1 text-sm bg-white border ${props.className || ''}`}
    style={{ borderColor: '#6a7a8a', borderRadius: 1, boxSizing: 'border-box', ...props.style }}
  />
);

export const RetroLabel = ({ children, color = '#1a3a6a' }: { children: ReactNode; color?: string }) => (
  <span className="text-sm font-semibold" style={{ color }}>{children}</span>
);

export default RetroWindow;
