export function urgencyStyle(style: "red" | "orange" | "green" | "purple"): string {
  switch (style) {
    case "red":
      return "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30 transition-all duration-100";
    case "orange":
      return "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/30 transition-all duration-100";
    case "green":
      return "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30 transition-all duration-100";
    case "purple":
      return "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-purple-500/30 transition-all duration-100";
    default:
      return "";
  }
}
