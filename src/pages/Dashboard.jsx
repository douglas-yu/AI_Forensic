import { useState, useEffect } from "react";
import { loadReports } from "@/utils/localReports";
import ToolCard from "@/components/forensic/ToolCard";
import VerdictBadge from "@/components/forensic/VerdictBadge";
import { Image, Video, AudioLines, ScanSearch, Shield, Activity, FileSearch, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { motion } from "framer-motion";

const tools = [
  { icon: Image, title: "Image Forensics", description: "ELA, noise analysis, clone detection, metadata extraction, and AI generation detection for images.", path: "/image-forensics" },
  { icon: Video, title: "Video Forensics", description: "Deepfake detection, frame analysis, metadata extraction, and AI generation detection for videos.", path: "/video-forensics" },
  { icon: AudioLines, title: "Audio Forensics", description: "Spectral analysis, voice pattern detection, and AI voice detection for audio files.", path: "/audio-forensics" },
  { icon: ScanSearch, title: "AI Content Detection", description: "Universal AI-generated content detection across all media types with confidence scoring.", path: "/ai-detection" },
];

export default function Dashboard() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    setReports(loadReports());
  }, []);

  const recentReports = reports.slice(0, 5);
  const stats = {
    total: reports.length,
    authentic: reports.filter(r => r.verdict === "authentic" || r.verdict === "likely_authentic").length,
    suspicious: reports.filter(r => ["manipulated", "likely_manipulated", "ai_generated"].includes(r.verdict)).length,
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-secondary/30 border border-border/50 p-6 md:p-10"
      >
        <div className="grid-pattern absolute inset-0 opacity-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-xs font-mono text-primary tracking-widest">FORENSIQ ANALYSIS SUITE</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2 tracking-tight">
            AI Media Forensic Detection
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Advanced forensic analysis tools running entirely in your browser — no uploads, no servers, full privacy. 
            Detect AI-generated content, deepfakes, image manipulation, and audio forgery.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            {[
              { label: "Total Analyses", value: stats.total, icon: Activity },
              { label: "Authentic", value: stats.authentic, icon: Shield },
              { label: "Suspicious", value: stats.suspicious, icon: FileSearch },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 px-4 py-2.5 bg-secondary/40 rounded-lg border border-border/50">
                <stat.icon className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-lg font-mono font-bold text-foreground">{stat.value}</p>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tools Grid */}
      <div>
        <h2 className="text-sm font-mono font-semibold text-foreground tracking-wider mb-4 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          FORENSIC TOOLS
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {tools.map((tool) => (
            <ToolCard key={tool.path} {...tool} />
          ))}
        </div>
      </div>

      {/* Recent Analyses */}
      {recentReports.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono font-semibold text-foreground tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-primary" />
              RECENT ANALYSES
            </h2>
            <Link to="/history" className="text-xs text-primary hover:underline font-mono flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentReports.map((report) => (
              <div key={report.id} className="p-4 bg-card rounded-lg border border-border/50 flex items-center gap-4 hover:border-primary/20 transition-all">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  {report.media_type === "image" && <Image className="w-4 h-4 text-muted-foreground" />}
                  {report.media_type === "video" && <Video className="w-4 h-4 text-muted-foreground" />}
                  {report.media_type === "audio" && <AudioLines className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{report.file_name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    {report.analysis_type?.replace(/_/g, " ").toUpperCase()} • {report.created_date ? format(new Date(report.created_date), "MMM d, HH:mm") : ""}
                  </p>
                </div>
                <VerdictBadge verdict={report.verdict} size="sm" />
                {report.confidence_score != null && (
                  <span className="text-xs font-mono text-muted-foreground hidden sm:block">{report.confidence_score}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}