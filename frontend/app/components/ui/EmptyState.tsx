import { ShieldCheck } from "lucide-react";

export default function EmptyState({ title, description, actionText, onAction }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-2xl bg-[#38bdf8]/10 border border-[#38bdf8]/30 mb-4">
        <ShieldCheck size={32} className="text-[#38bdf8]" />
      </div>
      <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
      <p className="text-sm text-[#8b949e] max-w-sm mb-6">{description}</p>
      {actionText && (
        <button onClick={onAction} className="px-4 py-2 bg-[#38bdf8] text-black text-xs font-bold uppercase rounded-lg hover:bg-[#2eaadc]">
          {actionText}
        </button>
      )}
    </div>
  );
}
