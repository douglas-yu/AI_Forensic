import { useState, useCallback } from "react";
import { Upload, FileImage, FileVideo, FileAudio, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MEDIA_CONFIGS = {
  image: { accept: "image/*", icon: FileImage, label: "Drop image file or click to upload", formats: "PNG, JPEG, WEBP, BMP, TIFF" },
  video: { accept: "video/*", icon: FileVideo, label: "Drop video file or click to upload", formats: "MP4, AVI, MOV, WEBM" },
  audio: { accept: "audio/*", icon: FileAudio, label: "Drop audio file or click to upload", formats: "MP3, WAV, FLAC, OGG, AAC" },
  any: { accept: "image/*,video/*,audio/*", icon: Upload, label: "Drop any media file or click to upload", formats: "Images, Videos, or Audio files" },
};

export default function MediaUploader({ mediaType = "any", onFileSelected, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const config = MEDIA_CONFIGS[mediaType];

  const handleFile = useCallback((file) => {
    if (!file) return;
    const type = file.type.startsWith("image") ? "image" : file.type.startsWith("video") ? "video" : "audio";

    if (type === "image") {
      const url = URL.createObjectURL(file);
      setPreview({ type: "image", url, name: file.name });
    } else {
      setPreview({ type, name: file.name });
    }

    onFileSelected({ file, file_name: file.name, media_type: type });
  }, [onFileSelected]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const clearPreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const Icon = config.icon;
  const inputId = "file-input-" + mediaType;

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById(inputId)?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300",
          isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border/50 hover:border-primary/40 hover:bg-secondary/30",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{config.label}</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{config.formats}</p>
          </div>
        </div>
        <input
          id={inputId}
          type="file"
          accept={config.accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
          disabled={disabled}
        />
      </div>

      {preview && (
        <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border/50">
          {preview.type === "image" && preview.url && (
            <img src={preview.url} alt="preview" className="w-12 h-12 rounded object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{preview.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{preview.type} file — ready for analysis</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); clearPreview(); }}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}