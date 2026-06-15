export function SeverityBadge({ level }: { level: string }) {
  const isCritical = level === "Critical" || level === "High";
  
  const colors: Record<string, string> = {
    Safe: "bg-[#8B5CF6]/10 text-[#A855F7] border-[#8B5CF6]/25",
    Moderate: "bg-[#FCAF45]/10 text-[#FCAF45] border-[#FCAF45]/25",
    High: "bg-[#E1306C]/10 text-[#EC4899] border-[#E1306C]/30",
    Critical: "bg-[#FD1D1D]/12 text-[#FCAF45] border-[#FD1D1D]/40",
    Low: "bg-[#8B5CF6]/10 text-[#A855F7] border-[#8B5CF6]/25",
    Medium: "bg-[#FCAF45]/10 text-[#FCAF45] border-[#FCAF45]/25",
    Clean: "bg-[#8B5CF6]/10 text-[#A855F7] border-[#8B5CF6]/25",
  };

  const dotColors: Record<string, string> = {
    Safe: "bg-[#A855F7]",
    Moderate: "bg-[#FCAF45]",
    High: "bg-[#EC4899]",
    Critical: "bg-[#FD1D1D]",
    Low: "bg-[#A855F7]",
    Medium: "bg-[#FCAF45]",
    Clean: "bg-[#A855F7]",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold tracking-wide uppercase ${colors[level] || "bg-[#8B5CF6]/10 text-[#A855F7] border-[#8B5CF6]/20"}`}>
      {isCritical && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[level]}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColors[level]}`}></span>
        </span>
      )}
      {!isCritical && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[level] || "bg-[#A855F7]"}`} />}
      {level}
    </span>
  );
}
