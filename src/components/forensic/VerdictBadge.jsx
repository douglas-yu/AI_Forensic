import { ShieldCheck, ShieldAlert, ShieldQuestion, ShieldX, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const VERDICT_CONFIG = {
  authentic: {
    icon: ShieldCheck,
    label: "Authentic",
    color: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-400/30",
  },
  likely_authentic: {
    icon: ShieldCheck,
    label: "Likely Authentic",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/30",
  },
  inconclusive: {
    icon: ShieldQuestion,
    label: "Inconclusive",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/30",
  },
  likely_manipulated: {
    icon: ShieldAlert,
    label: "Likely Manipulated",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/30",
  },
  manipulated: {
    icon: ShieldX,
    label: "Manipulated",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
  },
  ai_generated: {
    icon: Bot,
    label: "AI Generated",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/30",
  },
};

export default function VerdictBadge({ verdict, size = "md" }) {
  const config = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.inconclusive;
  const Icon = config.icon;

  const sizes = {
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-3 py-1.5 text-sm gap-1.5",
    lg: "px-4 py-2 text-base gap-2",
  };

  return (
    <div className={cn(
      "inline-flex items-center rounded-md font-mono font-medium border",
      config.bg, config.border, config.color,
      sizes[size]
    )}>
      <Icon className={cn(size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4")} />
      <span>{config.label}</span>
    </div>
  );
}