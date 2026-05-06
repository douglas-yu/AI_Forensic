import { cn } from "@/lib/utils";
import { Database } from "lucide-react";

export default function MetadataPanel({ metadata }) {
  if (!metadata) return null;

  const entries = Object.entries(metadata).filter(([_, v]) => v && v !== "N/A" && v !== "Unknown");
  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-mono font-semibold text-foreground tracking-wider flex items-center gap-2">
        <Database className="w-3.5 h-3.5 text-primary" />
        METADATA EXTRACTED
      </h3>
      <div className="bg-secondary/30 rounded-lg border border-border/50 overflow-hidden">
        {entries.map(([key, value], i) => {
          if (typeof value === "object") {
            return Object.entries(value).filter(([_, v]) => v).map(([subKey, subValue], j) => (
              <div key={`${key}-${subKey}`} className={cn(
                "flex items-center justify-between px-4 py-2.5 text-xs",
                (i + j) % 2 === 0 ? "bg-transparent" : "bg-secondary/20"
              )}>
                <span className="font-mono text-muted-foreground uppercase tracking-wider">{subKey.replace(/_/g, " ")}</span>
                <span className="font-medium text-foreground text-right max-w-[60%] truncate">{String(subValue)}</span>
              </div>
            ));
          }
          return (
            <div key={key} className={cn(
              "flex items-center justify-between px-4 py-2.5 text-xs",
              i % 2 === 0 ? "bg-transparent" : "bg-secondary/20"
            )}>
              <span className="font-mono text-muted-foreground uppercase tracking-wider">{key.replace(/_/g, " ")}</span>
              <span className="font-medium text-foreground text-right max-w-[60%] truncate">{String(value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}