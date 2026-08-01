type Props = {
  title: string;
  value: string | number;
  color?: string;
};

export default function StatCard({ title, value, color = "text-foreground" }: Props) {
  return (
    <div className="bg-secondary/40 border border-border rounded-lg p-5">
      <div className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">
        {title}
      </div>
      <div className={`text-3xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}