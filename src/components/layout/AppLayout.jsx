import { Outlet, Link, useLocation } from "react-router-dom";
import { Shield, Image, Video, AudioLines, Home, History, ScanSearch } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: Home, label: "Dashboard" },
  { path: "/image-forensics", icon: Image, label: "Image" },
  { path: "/video-forensics", icon: Video, label: "Video" },
  { path: "/audio-forensics", icon: AudioLines, label: "Audio" },
  { path: "/ai-detection", icon: ScanSearch, label: "AI Detect" },
  { path: "/history", icon: History, label: "History" },
];

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="h-14 border-b border-border/50 flex items-center px-4 md:px-6 gap-3 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <span className="font-mono font-bold text-sm tracking-wider text-foreground hidden sm:block">
            FORENSIQ
          </span>
          <span className="text-[10px] font-mono text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded border border-primary/20 hidden sm:block">
            v2.0
          </span>
        </div>

        <nav className="flex items-center gap-1 ml-4 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse-glow" />
          <span className="text-[10px] font-mono text-muted-foreground hidden sm:block">SYSTEM ONLINE</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        <div className="scanline pointer-events-none fixed inset-0 z-10 opacity-30" />
        <Outlet />
      </main>
    </div>
  );
}