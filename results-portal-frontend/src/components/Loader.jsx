export default function Loader({ label = "Fetching your result..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-3 h-3 rounded-full bg-portal-accent animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-portal-navy font-medium">Please wait…</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
