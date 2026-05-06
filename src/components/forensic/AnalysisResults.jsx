import VerdictBadge from "./VerdictBadge";
import ConfidenceMeter from "./ConfidenceMeter";
import FindingsPanel from "./FindingsPanel";
import MetadataPanel from "./MetadataPanel";
import { motion } from "framer-motion";

export default function AnalysisResults({ report }) {
  if (!report) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Verdict Header */}
      <div className="p-6 bg-card rounded-xl border border-border/50 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Analysis Complete</h2>
            <VerdictBadge verdict={report.verdict} size="lg" />
          </div>
          <ConfidenceMeter score={report.confidence_score || 0} />
        </div>
        {report.summary && (
          <div className="p-4 bg-secondary/30 rounded-lg border border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">{report.summary}</p>
          </div>
        )}
      </div>

      {/* Findings */}
      <div className="p-6 bg-card rounded-xl border border-border/50">
        <FindingsPanel findings={report.findings} />
      </div>

      {/* Metadata */}
      {report.metadata_extracted && (
        <div className="p-6 bg-card rounded-xl border border-border/50">
          <MetadataPanel metadata={report.metadata_extracted} />
        </div>
      )}
    </motion.div>
  );
}