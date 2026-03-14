interface StatusBarProps {
  message?: string
}

export function StatusBar({ message = '系统就绪' }: StatusBarProps) {
  return (
    <footer 
      className="h-6 px-3 flex items-center flex-shrink-0"
      style={{ backgroundColor: '#1E3A5F' }}
    >
      <span 
        className="text-xs"
        style={{ color: 'rgba(255, 255, 255, 0.8)' }}
      >
        {message}
      </span>
    </footer>
  )
}
