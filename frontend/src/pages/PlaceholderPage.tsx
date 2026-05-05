export default function PlaceholderPage({ title = "Page" }: { title?: string }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
      <p className="text-slate-500 mt-2">This section is coming soon.</p>
    </div>
  );
}