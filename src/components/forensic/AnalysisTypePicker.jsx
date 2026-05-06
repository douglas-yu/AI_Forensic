import { cn } from "@/lib/utils";
import { 
  ScanSearch, Layers, Database, Waves, Copy, UserX, 
  AudioLines, Mic, Maximize 
} from "lucide-react";

const ANALYSIS_TYPES = {
  image: [
    { id: "full_forensic", icon: Maximize, label: "Full Forensic", desc: "Complete analysis" },
    { id: "ai_detection", icon: ScanSearch, label: "AI Detection", desc: "Detect AI generation" },
    { id: "ela", icon: Layers, label: "Error Level Analysis", desc: "Compression analysis" },
    { id: "metadata", icon: Database, label: "Metadata Extraction", desc: "EXIF & hidden data" },
    { id: "noise_analysis", icon: Waves, label: "Noise Analysis", desc: "Noise pattern checks" },
    { id: "clone_detection", icon: Copy, label: "Clone Detection", desc: "Copy-move forgery" },
  ],
  video: [
    { id: "full_forensic", icon: Maximize, label: "Full Forensic", desc: "Complete analysis" },
    { id: "ai_detection", icon: ScanSearch, label: "AI Detection", desc: "Detect AI generation" },
    { id: "deepfake", icon: UserX, label: "Deepfake Detection", desc: "Face swap analysis" },
    { id: "metadata", icon: Database, label: "Metadata Extraction", desc: "Container metadata" },
  ],
  audio: [
    { id: "full_forensic", icon: Maximize, label: "Full Forensic", desc: "Complete analysis" },
    { id: "ai_detection", icon: ScanSearch, label: "AI Detection", desc: "Detect AI voices" },
    { id: "spectral", icon: AudioLines, label: "Spectral Analysis", desc: "Frequency analysis" },
    { id: "voice_pattern", icon: Mic, label: "Voice Pattern", desc: "Voice authenticity" },
    { id: "metadata", icon: Database, label: "Metadata Extraction", desc: "Audio metadata" },
  ],
};

export default function AnalysisTypePicker({ mediaType, selected, onSelect }) {
  const types = ANALYSIS_TYPES[mediaType] || [];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-mono font-semibold text-foreground tracking-wider flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        SELECT ANALYSIS TYPE
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {types.map((type) => {
          const Icon = type.icon;
          const isSelected = selected === type.id;
          return (
            <button
              key={type.id}
              onClick={() => onSelect(type.id)}
              className={cn(
                "p-3 rounded-lg border text-left transition-all",
                isSelected
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-secondary/20 border-border/50 text-muted-foreground hover:border-primary/20 hover:text-foreground"
              )}
            >
              <Icon className={cn("w-4 h-4 mb-1.5", isSelected ? "text-primary" : "text-muted-foreground")} />
              <p className="text-xs font-medium">{type.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{type.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}