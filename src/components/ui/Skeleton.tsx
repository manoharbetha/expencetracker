export const Skeleton = ({ className = 'h-4 w-full' }: { className?: string }) => (
  <div className={`rounded bg-[linear-gradient(90deg,#131920_25%,#1a2230_50%,#131920_75%)] bg-[length:200%_100%] animate-shimmer ${className}`} />
);
