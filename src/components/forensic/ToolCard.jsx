import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export default function ToolCard({ icon: Icon, title, description, path, accentColor = "primary" }) {
  return (
    <Link to={path} className="group block">
      <div className={cn(
        "h-full p-5 bg-card rounded-xl border border-border/50 transition-all duration-300",
        "hover:border-primary/40 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5"
      )}>
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-center mb-4">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </Link>
  );
}