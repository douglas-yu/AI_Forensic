import { cn } from "@/lib/utils";
import { Info, AlertTriangle, ShieldAlert, XCircle, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const SEVERITY_CONFIG = {
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
  low: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" },
  medium: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
  high: { icon: ShieldAlert, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
  critical: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
};

export default function FindingsPanel({ findings }) {
  if (!findings?.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-mono font-semibold text-foreground tracking-wider flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        DETAILED FINDINGS
      </h3>
      <div className="space-y-2">
        {findings.map((finding, i) => {
          const config = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.info;
          const Icon = config.icon;

          return (
            <div
              key={i}
              className={cn(
                "p-3 rounded-lg border transition-all hover:scale-[1.005]",
                config.bg, config.border
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", config.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-medium text-foreground">{finding.title}</h4>
                    {finding.score != null && (
                      <span className={cn("text-xs font-mono", config.color)}>{finding.score}/100</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{finding.description}</p>
                  {finding.score != null && (
                    <Progress value={finding.score} className="h-1 mt-2 bg-secondary" />
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                      {finding.category}
                    </span>
                    <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded uppercase", config.bg, config.color)}>
                      {finding.severity}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}