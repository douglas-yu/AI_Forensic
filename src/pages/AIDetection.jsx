import { useState } from "react";
import { ScanSearch } from "lucide-react";
import MediaUploader from "@/components/forensic/MediaUploader";
import AnalysisRunner from "@/components/forensic/AnalysisRunner";
import AnalysisResults from "@/components/forensic/AnalysisResults";

export default function AIDetection() {
  const [fileData, setFileData] = useState(null);
  const [report, setReport] = useState(null);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
          <ScanSearch className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">AI Content Detection</h1>
          <p className="text-xs text-muted-foreground font-mono">UNIVERSAL AI-GENERATED CONTENT DETECTION • ALL MEDIA TYPES</p>
        </div>
      </div>

      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
        <p className="text-xs text-primary/80 font-mono leading-relaxed">
          Upload any image, video, or audio file. The system will analyze it for indicators of AI generation 
          including GAN artifacts, diffusion model signatures, TTS patterns — all locally in your browser.
        </p>
      </div>

      <div className="p-6 bg-card rounded-xl border border-border/50">
        <MediaUploader mediaType="any" onFileSelected={(data) => { setFileData(data); setReport(null); }} />
      </div>

      {fileData && (
        <AnalysisRunner fileData={fileData} analysisType="ai_detection" onComplete={setReport} />
      )}

      <AnalysisResults report={report} />
    </div>
  );
}