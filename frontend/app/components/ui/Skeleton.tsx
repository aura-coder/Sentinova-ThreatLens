export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-[#1c1c1c] border border-[#30363d] rounded-xl ${className}`}></div>
  );
}
