import { useState } from "react";
import { AudioLines } from "lucide-react";
import MediaUploader from "@/components/forensic/MediaUploader";
import AnalysisTypePicker from "@/components/forensic/AnalysisTypePicker";
import AnalysisRunner from "@/components/forensic/AnalysisRunner";
import AnalysisResults from "@/components/forensic/AnalysisResults";

export default function AudioForensics() {
  const [fileData, setFileData] = useState(null);
  const [analysisType, setAnalysisType] = useState("full_forensic");
  const [report, setReport] = useState(null);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
          <AudioLines className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Audio Forensics</h1>
          <p className="text-xs text-muted-foreground font-mono">SPECTRAL ANALYSIS • VOICE PATTERN • AI VOICE DETECTION</p>
        </div>
      </div>

      <div className="p-6 bg-card rounded-xl border border-border/50">
        <MediaUploader mediaType="audio" onFileSelected={(data) => { setFileData(data); setReport(null); }} />
      </div>

      {fileData && (
        <div className="p-6 bg-card rounded-xl border border-border/50">
          <AnalysisTypePicker mediaType="audio" selected={analysisType} onSelect={setAnalysisType} />
        </div>
      )}

      {fileData && (
        <AnalysisRunner fileData={fileData} analysisType={analysisType} onComplete={setReport} />
      )}

      <AnalysisResults report={report} />
    </div>
  );
}