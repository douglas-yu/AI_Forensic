import { useState, useEffect } from "react";
import { loadReports, deleteReport } from "@/utils/localReports";
import VerdictBadge from "@/components/forensic/VerdictBadge";
import AnalysisResults from "@/components/forensic/AnalysisResults";
import { History as HistoryIcon, Image, Video, AudioLines, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const MEDIA_ICONS = { image: Image, video: Video, audio: AudioLines };

export default function History() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [mediaFilter, setMediaFilter] = useState("all");
  const [verdictFilter, setVerdictFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    setReports(loadReports());
  }, []);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    deleteReport(id);
    setReports(loadReports());
  };

  const filtered = reports.filter((r) => {
    if (mediaFilter !== "all" && r.media_type !== mediaFilter) return false;
    if (verdictFilter !== "all" && r.verdict !== verdictFilter) return false;
    if (search && !r.file_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
          <HistoryIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Analysis History</h1>
          <p className="text-xs text-muted-foreground font-mono">{reports.length} REPORTS STORED LOCALLY</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-card border-border/50"
          />
        </div>
        <Select value={mediaFilter} onValueChange={setMediaFilter}>
          <SelectTrigger className="w-32 h-9 text-xs bg-card border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Media</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
          </SelectContent>
        </Select>
        <Select value={verdictFilter} onValueChange={setVerdictFilter}>
          <SelectTrigger className="w-40 h-9 text-xs bg-card border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Verdicts</SelectItem>
            <SelectItem value="authentic">Authentic</SelectItem>
            <SelectItem value="likely_authentic">Likely Authentic</SelectItem>
            <SelectItem value="inconclusive">Inconclusive</SelectItem>
            <SelectItem value="likely_manipulated">Likely Manipulated</SelectItem>
            <SelectItem value="manipulated">Manipulated</SelectItem>
            <SelectItem value="ai_generated">AI Generated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <HistoryIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No analyses found</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Run an analysis first to see results here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((report) => {
            const MediaIcon = MEDIA_ICONS[report.media_type] || Image;
            return (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={cn(
                  "p-4 bg-card rounded-lg border border-border/50 flex items-center gap-4 cursor-pointer",
                  "hover:border-primary/20 transition-all group"
                )}
              >
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <MediaIcon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{report.file_name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    {report.analysis_type?.replace(/_/g, " ").toUpperCase()} • {report.created_date ? format(new Date(report.created_date), "MMM d, yyyy HH:mm") : ""}
                  </p>
                </div>
                <VerdictBadge verdict={report.verdict} size="sm" />
                {report.confidence_score != null && (
                  <span className="text-xs font-mono text-muted-foreground hidden sm:block">{report.confidence_score}%</span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive/60 hover:text-destructive"
                  onClick={(e) => handleDelete(e, report.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-background border-border">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">
              {selectedReport?.file_name} — {selectedReport?.analysis_type?.replace(/_/g, " ").toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          <AnalysisResults report={selectedReport} />
        </DialogContent>
      </Dialog>
    </div>
  );
}