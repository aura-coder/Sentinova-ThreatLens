type Props = {
  title: string;
  value: string | number;
  color?: string;
};

export default function StatCard({
  title,
  value,
  color = "text-white",
}: Props) {
  return (
    <div className="glass rounded-3xl p-5 shadow-xl shadow-black/20 hover:scale-[1.02] transition-all duration-300">
      <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
        {title}
      </div>

      <div className={`text-3xl font-bold ${color}`}>
        {value}
      </div>
    </div>
  );
}