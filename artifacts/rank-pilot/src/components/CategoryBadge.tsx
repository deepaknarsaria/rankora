import clsx from "clsx";

export function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    SEO: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    AEO: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    GEO: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  };

  const fallback = "bg-primary/10 text-primary border-primary/20";

  return (
    <span
      className={clsx(
        "px-3 py-1 text-[11px] font-extrabold rounded-full border tracking-widest uppercase shadow-sm",
        colors[category] || fallback
      )}
    >
      {category}
    </span>
  );
}
