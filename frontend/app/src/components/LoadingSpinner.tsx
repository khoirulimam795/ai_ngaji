interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = '#4fff00',
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div 
        className={`${sizeClasses[size]} rounded-full border-2 border-white/10 animate-spin`}
        style={{ 
          borderTopColor: color,
          borderRightColor: color
        }}
      />
      {text && (
        <p className="text-sm text-[#8B9DAF] animate-pulse">{text}</p>
      )}
    </div>
  );
}