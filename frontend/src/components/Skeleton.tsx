interface SkeletonRowProps {
  cols?: number;
}

export function SkeletonRow({ cols = 6 }: SkeletonRowProps) {
  return (
    <tr className="border-b border-[#1e1e2e]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className="h-4 skeleton rounded w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg p-4">
      <div className="h-5 skeleton rounded w-3/4 mb-3" />
      <div className="h-8 skeleton rounded w-1/3 mb-2" />
      <div className="h-4 skeleton rounded w-1/2" />
    </div>
  );
}

export function LoadingState({ message = 'Loading markets...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <div className="w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mb-4" />
      <span>{message}</span>
    </div>
  );
}

export function ErrorState({ 
  message = 'Failed to load data', 
  onRetry 
}: { 
  message?: string; 
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-red-400 text-lg mb-2">API Unavailable</div>
      <div className="text-gray-500 mb-4">{message}</div>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-[#6366f1] text-white rounded-lg hover:bg-[#5558e3] transition"
          data-testid="retry-button"
        >
          Retry
        </button>
      )}
    </div>
  );
}
