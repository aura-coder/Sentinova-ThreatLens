async function getData() {
  try {
    const res = await fetch("http://localhost:8000/api/v1/indicators", { cache: "no-store" });
    if (!res.ok) return { items: [], total: 0 };
    return res.json();
  } catch (err) {
    return { items: [], total: 0 };
  }
}

export default async function IndicatorsPage() {
  const data = await getData();
  const items = Array.isArray(data) ? data : (data.items || []);
  const total = Array.isArray(data) ? data.length : (data.total || items.length);

  return (
    <div className="p-8 max-w-7xl mx-auto text-white font-mono">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">LIVE THREAT INDICATORS ({total})</h1>
      </div>
      <div className="border border-[#30363d] bg-[#0d1117] p-4">
        {items.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No indicators found.</p>
        ) : (
          <div className="space-y-2">
            {items.map((ind: any, i: number) => (
              <div key={ind.id || i} className="flex items-center justify-between border-b border-[#30363d] py-2 px-3 text-xs hover:bg-[#161b22]">
                <span className="text-red-400 font-bold w-28 shrink-0">Score: {ind.severity_score}</span>
                <span className="truncate flex-1 mx-4 font-mono">{ind.value}</span>
                <span className="text-yellow-400 w-24 text-center uppercase shrink-0">{ind.type}</span>
                <span className="text-green-400 w-20 text-right uppercase shrink-0">{ind.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
