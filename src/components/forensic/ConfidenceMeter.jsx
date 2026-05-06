import { cn } from "@/lib/utils";

export default function ConfidenceMeter({ score, label = "Confidence" }) {
  const getColor = (s) => {
    if (s >= 80) return "text-green-400";
    if (s >= 60) return "text-yellow-400";
    if (s >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const getTrackColor = (s) => {
    if (s >= 80) return "bg-green-400";
    if (s >= 60) return "bg-yellow-400";
    if (s >= 40) return "bg-orange-400";
    return "bg-red-400";
  };

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(220 14% 14%)" strokeWidth="6" />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-all duration-1000", getColor(score))}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-2xl font-mono font-bold", getColor(score))}>{score}</span>
          <span className="text-[9px] font-mono text-muted-foreground">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}