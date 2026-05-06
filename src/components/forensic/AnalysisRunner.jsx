import { useState } from "react";
import { Loader2, Play, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  loadImageData,
  computeELA,
  analyzeNoisePattern,
  detectCloneRegions,
  extractColorStats,
  detectGANArtifacts,
  extractImageMetadata,
  analyzeAudioFile,
  scoreImageAnalysis,
  scoreAudioAnalysis,
  deriveVerdict,
  formatBytes,
} from "@/utils/forensicEngine";
import { saveReport } from "@/utils/localReports";

async function runImageAnalysis(fileData, analysisType) {
  const { file } = fileData;
  const [imgData, metadata] = await Promise.all([
    loadImageData(file),
    extractImageMetadata(file),
  ]);

  const ela = computeELA(imgData.imageData);
  const noise = analyzeNoisePattern(imgData.imageData);
  const clone = detectCloneRegions(imgData.imageData);
  const colorStats = extractColorStats(imgData.imageData);
  const ganArt = detectGANArtifacts(imgData.imageData);

  const { findings, suspicionScore } = scoreImageAnalysis(
    analysisType, ela, noise, clone, colorStats, ganArt, metadata
  );

  const { verdict, confidence } = deriveVerdict(suspicionScore);

  // Adjust verdict for ai_detection-specific run
  const finalVerdict = analysisType === "ai_detection" && suspicionScore > 40
    ? "ai_generated"
    : verdict;

  const summaryMap = {
    authentic: "The file shows strong indicators of authenticity with consistent compression, noise, and metadata patterns.",
    likely_authentic: "The file appears authentic with only minor anomalies that are within normal ranges.",
    inconclusive: "Mixed signals were found — some indicators suggest manipulation while others appear natural.",
    likely_manipulated: "Multiple forensic indicators suggest this file has been edited or composited.",
    manipulated: "Strong forensic evidence of manipulation detected across several analysis dimensions.",
    ai_generated: "Analysis detected significant patterns consistent with AI-generated imagery (GAN or diffusion model artifacts).",
  };

  const metaExtracted = {
    format: file.type || "Unknown",
    size: formatBytes(file.size),
    dimensions: `${imgData.width} × ${imgData.height}`,
    ...metadata,
  };

  return {
    file_name: file.name,
    media_type: "image",
    analysis_type: analysisType,
    verdict: finalVerdict,
    confidence_score: confidence,
    findings,
    metadata_extracted: metaExtracted,
    summary: summaryMap[finalVerdict],
  };
}

async function runAudioAnalysis(fileData, analysisType) {
  const { file } = fileData;
  const audioStats = await analyzeAudioFile(file);
  const { findings, suspicionScore } = scoreAudioAnalysis(analysisType, audioStats);
  const { verdict, confidence } = deriveVerdict(suspicionScore);

  const finalVerdict = analysisType === "ai_detection" && suspicionScore > 45
    ? "ai_generated"
    : verdict;

  const summaryMap = {
    authentic: "Audio forensics show natural voice patterns, consistent spectral distribution, and no synthesis artifacts.",
    likely_authentic: "Audio appears authentic with minor anomalies within expected natural variation.",
    inconclusive: "Some audio anomalies detected but insufficient evidence for a definitive verdict.",
    likely_manipulated: "Several forensic indicators suggest possible audio editing or splicing.",
    manipulated: "Strong evidence of audio manipulation — spectral or dynamic inconsistencies detected.",
    ai_generated: "Audio exhibits patterns consistent with TTS synthesis or AI voice generation.",
  };

  return {
    file_name: file.name,
    media_type: "audio",
    analysis_type: analysisType,
    verdict: finalVerdict,
    confidence_score: confidence,
    findings,
    metadata_extracted: {
      duration: audioStats.duration + "s",
      sample_rate: audioStats.sampleRate + " Hz",
      channels: audioStats.numChannels,
      dynamic_range: audioStats.dynamicRange + " dB",
      format: file.type || "Audio",
      size: formatBytes(file.size),
    },
    summary: summaryMap[finalVerdict],
  };
}

async function runVideoAnalysis(fileData, analysisType) {
  // For video: extract a frame and run image analysis + basic metadata
  const { file } = fileData;

  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.src = url;
    video.muted = true;
    video.currentTime = 1;

    video.onseeked = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const ela = computeELA(imageData);
      const noise = analyzeNoisePattern(imageData);
      const clone = detectCloneRegions(imageData);
      const colorStats = extractColorStats(imageData);
      const ganArt = detectGANArtifacts(imageData);

      const { findings, suspicionScore } = scoreImageAnalysis(
        analysisType === "deepfake" ? "full_forensic" : analysisType,
        ela, noise, clone, colorStats, ganArt, {}
      );

      // Add video-specific finding
      if (analysisType === "deepfake" || analysisType === "full_forensic") {
        const faceSwapScore = Math.round(Math.min(100, (ganArt.checkerRatio * 200 + noise.cv * 80)));
        findings.unshift({
          category: "Deepfake Detection",
          title: "Face Manipulation Indicators (Frame Sample)",
          description: faceSwapScore > 40
            ? `Frame analysis detected irregular pixel distributions and inconsistent noise patterns that may indicate face-swap or deepfake manipulation (score: ${faceSwapScore}/100). Note: Full deepfake detection requires specialized neural network models.`
            : `Sampled video frame shows no strong visual manipulation indicators (score: ${faceSwapScore}/100). Temporal analysis (across frames) not available in browser-only mode.`,
          severity: faceSwapScore > 60 ? "high" : faceSwapScore > 30 ? "medium" : "info",
          score: faceSwapScore,
        });
      }

      const { verdict, confidence } = deriveVerdict(suspicionScore);

      resolve({
        file_name: file.name,
        media_type: "video",
        analysis_type: analysisType,
        verdict: analysisType === "ai_detection" && suspicionScore > 45 ? "ai_generated" : verdict,
        confidence_score: confidence,
        findings,
        metadata_extracted: {
          format: file.type || "Video",
          size: formatBytes(file.size),
          resolution: `${canvas.width} × ${canvas.height}`,
          note: "Analysis based on sampled frame",
        },
        summary: `Video forensic analysis of a sampled frame. ${suspicionScore > 40 ? "Multiple anomalies detected suggesting possible manipulation." : "No strong manipulation indicators in the sampled frame."}`,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        file_name: file.name,
        media_type: "video",
        analysis_type: analysisType,
        verdict: "inconclusive",
        confidence_score: 0,
        findings: [{ category: "Error", title: "Frame Extraction Failed", description: "Could not decode video frames in this browser. Try a different format.", severity: "high", score: 0 }],
        metadata_extracted: { format: file.type, size: formatBytes(file.size) },
        summary: "Video could not be decoded for analysis.",
      });
    };

    video.load();
  });
}

const STEPS = ["Loading file...", "Extracting data...", "Running forensic checks...", "Scoring findings...", "Done"];

export default function AnalysisRunner({ fileData, analysisType, onComplete }) {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);

  const runAnalysis = async () => {
    if (!fileData?.file) return;
    setRunning(true);
    setStep(0);

    setStep(1);
    await new Promise(r => setTimeout(r, 100));
    setStep(2);

    let report;
    if (fileData.media_type === "image") {
      report = await runImageAnalysis(fileData, analysisType);
    } else if (fileData.media_type === "audio") {
      report = await runAudioAnalysis(fileData, analysisType);
    } else {
      report = await runVideoAnalysis(fileData, analysisType);
    }

    setStep(3);
    await new Promise(r => setTimeout(r, 100));

    const saved = saveReport(report);
    setStep(4);

    onComplete(saved);
    setRunning(false);
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={runAnalysis}
        disabled={!fileData?.file || running}
        className={cn(
          "w-full h-12 font-mono text-sm tracking-wider relative overflow-hidden",
          "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
        )}
        variant="outline"
      >
        {running ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{STEPS[step]}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            <span>RUN ANALYSIS</span>
          </div>
        )}
        {running && (
          <div
            className="absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-500"
            style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
          />
        )}
      </Button>

      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
        <Cpu className="w-3 h-3 text-primary/60" />
        <span>100% client-side — no data leaves your device</span>
      </div>
    </div>
  );
}