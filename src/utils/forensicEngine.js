// Pure client-side forensic analysis engine
// Uses Canvas API, Web Audio API, FileReader, and heuristic algorithms

// Image Analysis Utilities

export async function loadImageData(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      URL.revokeObjectURL(url);
      resolve({ imageData, width: img.width, height: img.height, canvas, ctx });
    };
    img.src = url;
  });
}

export function computeELA(imageData) {
  const { data, width, height } = imageData;
  const blockSize = 8;
  const blockVariances = [];
  for (let by = 0; by < Math.floor(height / blockSize); by++) {
    for (let bx = 0; bx < Math.floor(width / blockSize); bx++) {
      let sum = 0, sumSq = 0, count = 0;
      for (let py = 0; py < blockSize; py++) {
        for (let px = 0; px < blockSize; px++) {
          const idx = ((by * blockSize + py) * width + (bx * blockSize + px)) * 4;
          const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          sum += lum; sumSq += lum * lum; count++;
        }
      }
      const mean = sum / count;
      const variance = sumSq / count - mean * mean;
      blockVariances.push(variance);
    }
  }
  const avgVariance = blockVariances.reduce((a, b) => a + b, 0) / blockVariances.length;
  const maxVariance = Math.max(...blockVariances);
  const outlierThreshold = avgVariance * 3;
  const outlierBlocks = blockVariances.filter(v => v > outlierThreshold).length;
  const outlierRatio = outlierBlocks / blockVariances.length;
  return { avgVariance, maxVariance, outlierRatio, blockCount: blockVariances.length };
}

export function analyzeNoisePattern(imageData) {
  const { data, width, height } = imageData;
  const regionSize = Math.floor(Math.min(width, height) / 8);
  const regions = [];
  for (let ry = 0; ry < 8; ry++) {
    for (let rx = 0; rx < 8; rx++) {
      let noiseSum = 0, count = 0;
      const startX = rx * regionSize;
      const startY = ry * regionSize;
      for (let y = startY + 1; y < Math.min(startY + regionSize - 1, height - 1); y++) {
        for (let x = startX + 1; x < Math.min(startX + regionSize - 1, width - 1); x++) {
          const center = ((y * width + x) * 4);
          const right = ((y * width + x + 1) * 4);
          const down = (((y + 1) * width + x) * 4);
          const lc = (data[center] + data[center+1] + data[center+2]) / 3;
          const lr = (data[right] + data[right+1] + data[right+2]) / 3;
          const ld = (data[down] + data[down+1] + data[down+2]) / 3;
          noiseSum += Math.abs(lc - lr) + Math.abs(lc - ld);
          count++;
        }
      }
      regions.push(count > 0 ? noiseSum / count : 0);
    }
  }
  const mean = regions.reduce((a, b) => a + b, 0) / regions.length;
  const variance = regions.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / regions.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 0;
  return { regions, mean, stdDev, cv };
}

export function detectCloneRegions(imageData) {
  const { data, width, height } = imageData;
  const blockSize = 16;
  const step = 8;
  const blocks = [];
  for (let y = 0; y <= height - blockSize; y += step) {
    for (let x = 0; x <= width - blockSize; x += step) {
      let hash = 0;
      for (let by = 0; by < blockSize; by += 4) {
        for (let bx = 0; bx < blockSize; bx += 4) {
          const idx = ((y + by) * width + (x + bx)) * 4;
          hash = ((hash * 31) + (data[idx] >> 3) + (data[idx+1] >> 3) + (data[idx+2] >> 3)) & 0xFFFFFF;
        }
      }
      blocks.push({ x, y, hash });
    }
  }
  const hashMap = {};
  let duplicates = 0;
  for (const b of blocks) {
    if (hashMap[b.hash]) {
      const other = hashMap[b.hash];
      const dist = Math.sqrt((b.x - other.x) ** 2 + (b.y - other.y) ** 2);
      if (dist > blockSize * 2) duplicates++;
    } else {
      hashMap[b.hash] = b;
    }
  }
  const duplicateRatio = duplicates / blocks.length;
  return { duplicates, totalBlocks: blocks.length, duplicateRatio };
}

export function extractColorStats(imageData) {
  const { data, width, height } = imageData;
  let rSum = 0, gSum = 0, bSum = 0;
  let rSq = 0, gSq = 0, bSq = 0;
  const pixels = width * height;
  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i]; gSum += data[i+1]; bSum += data[i+2];
    rSq += data[i] ** 2; gSq += data[i+1] ** 2; bSq += data[i+2] ** 2;
  }
  const rMean = rSum / pixels, gMean = gSum / pixels, bMean = bSum / pixels;
  const rStd = Math.sqrt(rSq / pixels - rMean ** 2);
  const gStd = Math.sqrt(gSq / pixels - gMean ** 2);
  const bStd = Math.sqrt(bSq / pixels - bMean ** 2);
  const channelCorrelation = Math.abs(rMean - gMean) + Math.abs(gMean - bMean) + Math.abs(rMean - bMean);
  return { rMean, gMean, bMean, rStd, gStd, bStd, channelCorrelation };
}

export function detectGANArtifacts(imageData) {
  const { data, width, height } = imageData;
  let checkerScore = 0;
  const sampleSize = Math.min(width - 2, 200);
  for (let y = 1; y < Math.min(height - 1, 200); y++) {
    for (let x = 1; x < sampleSize; x++) {
      const idx = (y * width + x) * 4;
      const idxL = (y * width + x - 1) * 4;
      const idxR = (y * width + x + 1) * 4;
      const lum = (v) => 0.299 * data[v] + 0.587 * data[v+1] + 0.114 * data[v+2];
      const c = lum(idx), l = lum(idxL), r = lum(idxR);
      if ((c > l && c > r) || (c < l && c < r)) checkerScore++;
    }
  }
  const totalChecked = Math.min(height - 2, 200) * (sampleSize - 1);
  const checkerRatio = checkerScore / totalChecked;
  return { checkerRatio };
}

// Metadata Extraction

export async function extractImageMetadata(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = { format: file.type, size: formatBytes(file.size), name: file.name };
      const buffer = e.target.result;
      const view = new DataView(buffer);
      if (view.getUint16(0) === 0xFFD8) {
        result.format_detail = "JPEG";
        const exif = parseJpegExif(buffer);
        Object.assign(result, exif);
      } else if (view.getUint32(0) === 0x89504E47) {
        result.format_detail = "PNG";
        const png = parsePngMeta(buffer);
        Object.assign(result, png);
      } else if (view.getUint16(0) === 0x4949 || view.getUint16(0) === 0x4D4D) {
        result.format_detail = "TIFF";
      }
      resolve(result);
    };
    reader.readAsArrayBuffer(file);
  });
}

function parseJpegExif(buffer) {
  const view = new DataView(buffer);
  const meta = {};
  let offset = 2;
  while (offset < buffer.byteLength - 2) {
    const marker = view.getUint16(offset);
    if (marker === 0xFFDA) break;
    if (marker === 0xFFE1) {
      const segLen = view.getUint16(offset + 2);
      const exifStr = String.fromCharCode(...new Uint8Array(buffer, offset + 4, 6));
      if (exifStr.startsWith("Exif")) {
        meta.exif_present = true;
        const littleEndian = view.getUint16(offset + 10) === 0x4949;
        const ifdOffset = view.getUint32(offset + 14, littleEndian);
        const ifdStart = offset + 10 + ifdOffset;
        if (ifdStart < buffer.byteLength - 2) {
          const numEntries = view.getUint16(ifdStart, littleEndian);
          for (let i = 0; i < Math.min(numEntries, 20); i++) {
            const entryOffset = ifdStart + 2 + i * 12;
            if (entryOffset + 12 > buffer.byteLength) break;
            const tag = view.getUint16(entryOffset, littleEndian);
            const count = view.getUint32(entryOffset + 4, littleEndian);
            try {
              if (tag === 0x010F) meta.camera_make = readExifString(buffer, view, entryOffset + 8, count, littleEndian);
              if (tag === 0x0110) meta.camera_model = readExifString(buffer, view, entryOffset + 8, count, littleEndian);
              if (tag === 0x0132) meta.date_modified = readExifString(buffer, view, entryOffset + 8, count, littleEndian);
              if (tag === 0x9003) meta.date_original = readExifString(buffer, view, entryOffset + 8, count, littleEndian);
              if (tag === 0x0131) meta.software = readExifString(buffer, view, entryOffset + 8, count, littleEndian);
            } catch {}
          }
        }
      }
      offset += 2 + segLen;
    } else if ((marker & 0xFF00) === 0xFF00) {
      const segLen = view.getUint16(offset + 2);
      offset += 2 + segLen;
    } else {
      offset++;
    }
  }
  return meta;
}

function readExifString(buffer, view, offset, count, le) {
  if (count <= 4) {
    const chars = [];
    for (let i = 0; i < count; i++) chars.push(String.fromCharCode(view.getUint8(offset + i)));
    return chars.join("").replace(/\0/g, "").trim();
  }
  const strOffset = view.getUint32(offset, le);
  const chars = [];
  for (let i = 0; i < Math.min(count, 64); i++) {
    const c = view.getUint8(strOffset + i);
    if (c === 0) break;
    chars.push(String.fromCharCode(c));
  }
  return chars.join("").trim();
}

function parsePngMeta(buffer) {
  const view = new DataView(buffer);
  const meta = {};
  let offset = 8;
  while (offset < buffer.byteLength - 8) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(
      view.getUint8(offset + 4), view.getUint8(offset + 5),
      view.getUint8(offset + 6), view.getUint8(offset + 7)
    );
    if (type === "IHDR") {
      meta.width = view.getUint32(offset + 8);
      meta.height = view.getUint32(offset + 12);
      meta.bit_depth = view.getUint8(offset + 16);
    }
    if (type === "tEXt") {
      const chunk = new Uint8Array(buffer, offset + 8, length);
      const text = String.fromCharCode(...chunk);
      const parts = text.split("\0");
      if (parts.length >= 2) meta[parts[0].toLowerCase()] = parts[1];
    }
    if (type === "IEND") break;
    offset += 12 + length;
  }
  return meta;
}

// Audio Analysis

export async function analyzeAudioFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  audioCtx.close();

  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;
  const numChannels = audioBuffer.numberOfChannels;

  let sumSq = 0;
  for (let i = 0; i < channelData.length; i++) sumSq += channelData[i] ** 2;
  const rms = Math.sqrt(sumSq / channelData.length);

  const windowSize = Math.floor(sampleRate * 0.1);
  const windowRMS = [];
  for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
    let wSq = 0;
    for (let j = 0; j < windowSize; j++) wSq += channelData[i + j] ** 2;
    windowRMS.push(Math.sqrt(wSq / windowSize));
  }
  const maxRMS = Math.max(...windowRMS);
  const minRMS = Math.min(...windowRMS.filter(v => v > 0.001));
  const dynamicRange = 20 * Math.log10(maxRMS / (minRMS || 0.0001));

  let zcr = 0;
  for (let i = 1; i < channelData.length; i++) {
    if ((channelData[i] >= 0) !== (channelData[i - 1] >= 0)) zcr++;
  }
  const zcrRate = zcr / channelData.length;

  const fftSize = 2048;
  const sample = channelData.slice(0, Math.min(fftSize * 10, channelData.length));
  const spectralBands = computeSpectralBands(sample, fftSize, sampleRate);

  let silentSamples = 0;
  for (let i = 0; i < channelData.length; i++) {
    if (Math.abs(channelData[i]) < 0.01) silentSamples++;
  }
  const silenceRatio = silentSamples / channelData.length;

  return { duration: duration.toFixed(2), sampleRate, numChannels, rms, dynamicRange: dynamicRange.toFixed(1), zcrRate, silenceRatio, spectralBands, windowRMS };
}

function computeSpectralBands(samples, fftSize, sampleRate) {
  const N = Math.min(fftSize, samples.length);
  const magnitudes = new Float32Array(N / 2);
  for (let k = 0; k < N / 2; k++) {
    let re = 0, im = 0;
    const step = Math.max(1, Math.floor(N / 256));
    for (let n = 0; n < N; n += step) {
      const angle = (2 * Math.PI * k * n) / N;
      re += samples[n] * Math.cos(angle);
      im -= samples[n] * Math.sin(angle);
    }
    magnitudes[k] = Math.sqrt(re * re + im * im);
  }
  const bands = { sub: 0, low: 0, mid: 0, high: 0, presence: 0, air: 0 };
  const freqRes = sampleRate / N;
  for (let k = 0; k < magnitudes.length; k++) {
    const freq = k * freqRes;
    if (freq < 80) bands.sub += magnitudes[k];
    else if (freq < 300) bands.low += magnitudes[k];
    else if (freq < 2000) bands.mid += magnitudes[k];
    else if (freq < 6000) bands.high += magnitudes[k];
    else if (freq < 12000) bands.presence += magnitudes[k];
    else bands.air += magnitudes[k];
  }
  return bands;
}

// Analysis Scoring

export function scoreImageAnalysis(type, ela, noise, clone, colorStats, ganArt, metadata) {
  const findings = [];
  let suspicionScore = 0;

  if (type === "ela" || type === "full_forensic") {
    const elaScore = Math.min(100, ela.outlierRatio * 500);
    const severity = elaScore > 60 ? "high" : elaScore > 30 ? "medium" : elaScore > 10 ? "low" : "info";
    findings.push({
      category: "Error Level Analysis",
      title: "Compression Inconsistency",
      description: elaScore > 30
        ? `Significant compression level variations detected across ${(ela.outlierRatio * 100).toFixed(1)}% of image blocks, suggesting possible editing or compositing.`
        : `Compression levels appear consistent across the image. Minor variations (${(ela.outlierRatio * 100).toFixed(1)}%) are within normal range.`,
      severity,
      score: Math.round(elaScore)
    });
    suspicionScore += elaScore * 0.3;
  }

  if (type === "noise_analysis" || type === "full_forensic") {
    const noiseCV = noise.cv;
    const noiseScore = Math.min(100, noiseCV * 200);
    const severity = noiseScore > 60 ? "high" : noiseScore > 35 ? "medium" : noiseScore > 15 ? "low" : "info";
    findings.push({
      category: "Noise Pattern",
      title: "Noise Uniformity Analysis",
      description: noiseScore > 35
        ? `High noise inconsistency detected (CV: ${noiseCV.toFixed(3)}). Regions with markedly different noise levels may indicate image compositing or local editing.`
        : `Noise distribution appears relatively uniform across regions (CV: ${noiseCV.toFixed(3)}), consistent with an authentic single-source image.`,
      severity,
      score: Math.round(noiseScore)
    });
    suspicionScore += noiseScore * 0.25;
  }

  if (type === "clone_detection" || type === "full_forensic") {
    const cloneScore = Math.min(100, clone.duplicateRatio * 300);
    const severity = cloneScore > 50 ? "critical" : cloneScore > 30 ? "high" : cloneScore > 15 ? "medium" : "info";
    findings.push({
      category: "Clone Detection",
      title: "Copy-Move Forgery Analysis",
      description: cloneScore > 30
        ? `${clone.duplicates} potentially duplicated image regions found (${(clone.duplicateRatio * 100).toFixed(1)}% of blocks). This may indicate copy-move forgery.`
        : `No significant copy-move patterns detected. Only ${clone.duplicates} block hash collisions in ${clone.totalBlocks} analyzed blocks.`,
      severity,
      score: Math.round(cloneScore)
    });
    suspicionScore += cloneScore * 0.25;
  }

  if (type === "ai_detection" || type === "full_forensic") {
    const ganScore = Math.min(100, ganArt.checkerRatio * 150);
    const colorScore = Math.min(100, colorStats.channelCorrelation / 2);
    const aiScore = (ganScore + colorScore) / 2;
    const severity = aiScore > 60 ? "high" : aiScore > 35 ? "medium" : aiScore > 15 ? "low" : "info";
    findings.push({
      category: "AI Detection",
      title: "GAN/Diffusion Artifact Analysis",
      description: aiScore > 35
        ? `Potential AI-generation indicators detected: checkerboard ratio ${(ganArt.checkerRatio * 100).toFixed(1)}%, unusual channel correlations. These patterns are associated with GAN or diffusion model outputs.`
        : `Low AI-generation indicators. Checkerboard pattern ratio (${(ganArt.checkerRatio * 100).toFixed(1)}%) and channel statistics are within natural ranges.`,
      severity,
      score: Math.round(aiScore)
    });
    suspicionScore += aiScore * 0.2;
  }

  if (type === "metadata" || type === "full_forensic") {
    const hasSoftware = metadata?.software && !["", "N/A"].includes(metadata.software);
    const hasCamera = metadata?.camera_model;
    const hasExif = metadata?.exif_present;
    const suspiciousSoftware = hasSoftware && /photoshop|gimp|lightroom|affinity|canva|midjourney|stable.diffusion|dall-e|firefly/i.test(metadata.software);
    const metaScore = suspiciousSoftware ? 70 : hasCamera ? 10 : hasExif ? 20 : 40;
    findings.push({
      category: "Metadata",
      title: "EXIF / Metadata Integrity",
      description: hasCamera
        ? `Camera metadata present: ${metadata.camera_model || ""}${metadata.camera_make ? " by " + metadata.camera_make : ""}. ${metadata.date_original ? "Capture date: " + metadata.date_original + "." : ""} ${hasSoftware ? "Edited with: " + metadata.software : "No editing software detected."}`
        : hasExif
        ? `EXIF data present but camera information missing — may indicate metadata was stripped or file was re-saved. ${hasSoftware ? "Software: " + metadata.software : ""}`
        : "No EXIF metadata found. This is common for AI-generated images, screenshots, or files that have been processed to remove metadata.",
      severity: suspiciousSoftware ? "high" : hasCamera ? "info" : "medium",
      score: metaScore
    });
    suspicionScore += metaScore * 0.2;
  }

  return { findings, suspicionScore };
}

export function scoreAudioAnalysis(type, audioStats) {
  const findings = [];
  let suspicionScore = 0;

  if (type === "spectral" || type === "full_forensic") {
    const bands = audioStats.spectralBands;
    const total = Object.values(bands).reduce((a, b) => a + b, 0) || 1;
    const midRatio = bands.mid / total;
    const airRatio = bands.air / total;
    const ttsIndicator = airRatio < 0.02 && midRatio > 0.6;
    const spectralScore = ttsIndicator ? 65 : airRatio < 0.05 ? 35 : 15;
    findings.push({
      category: "Spectral Analysis",
      title: "Frequency Distribution Analysis",
      description: ttsIndicator
        ? `Unusual spectral distribution detected: very low high-frequency content (air band: ${(airRatio * 100).toFixed(1)}%) with mid-frequency dominance (${(midRatio * 100).toFixed(1)}%). This pattern is associated with TTS and synthetic voices.`
        : `Spectral distribution appears natural. Mid frequencies: ${(midRatio * 100).toFixed(1)}%, Air band: ${(airRatio * 100).toFixed(1)}%. No strong TTS or synthesis artifacts detected.`,
      severity: ttsIndicator ? "high" : spectralScore > 30 ? "medium" : "info",
      score: spectralScore
    });
    suspicionScore += spectralScore * 0.4;
  }

  if (type === "voice_pattern" || type === "full_forensic") {
    const { dynamicRange, silenceRatio, zcrRate } = audioStats;
    const drNum = parseFloat(dynamicRange);
    const lowDynamic = drNum < 15;
    const highSilence = silenceRatio > 0.4;
    const abnormalZCR = zcrRate < 0.01 || zcrRate > 0.15;
    const voiceScore = (lowDynamic ? 35 : 0) + (highSilence ? 25 : 0) + (abnormalZCR ? 20 : 0);
    findings.push({
      category: "Voice Pattern",
      title: "Voice Naturalness Analysis",
      description: voiceScore > 40
        ? `Multiple voice authenticity flags: ${lowDynamic ? "low dynamic range (" + dynamicRange + "dB), " : ""}${highSilence ? "high silence ratio (" + (silenceRatio * 100).toFixed(0) + "%), " : ""}${abnormalZCR ? "abnormal zero-crossing rate. " : ""}These may indicate AI voice synthesis.`
        : `Voice pattern appears natural. Dynamic range: ${dynamicRange}dB, Silence ratio: ${(silenceRatio * 100).toFixed(0)}%. No strong synthetic voice indicators.`,
      severity: voiceScore > 50 ? "high" : voiceScore > 25 ? "medium" : "info",
      score: Math.min(100, voiceScore)
    });
    suspicionScore += Math.min(100, voiceScore) * 0.4;
  }

  if (type === "ai_detection" || type === "full_forensic") {
    const { rms } = audioStats;
    const tooUniform = rms > 0.2 && rms < 0.35;
    const aiScore = tooUniform ? 45 : 20;
    findings.push({
      category: "AI Detection",
      title: "Synthetic Audio Indicators",
      description: tooUniform
        ? `RMS energy (${rms.toFixed(3)}) is suspiciously uniform, which can indicate normalized AI-generated audio. Natural recordings typically show more variation.`
        : `RMS energy levels (${rms.toFixed(3)}) show natural variation consistent with real recordings.`,
      severity: aiScore > 40 ? "medium" : "info",
      score: aiScore
    });
    suspicionScore += aiScore * 0.2;
  }

  return { findings, suspicionScore };
}

export function deriveVerdict(suspicionScore) {
  if (suspicionScore < 15) return { verdict: "authentic", confidence: Math.round(90 - suspicionScore) };
  if (suspicionScore < 30) return { verdict: "likely_authentic", confidence: Math.round(75 - suspicionScore / 2) };
  if (suspicionScore < 50) return { verdict: "inconclusive", confidence: Math.round(60) };
  if (suspicionScore < 70) return { verdict: "likely_manipulated", confidence: Math.round(50 + suspicionScore / 5) };
  return { verdict: "manipulated", confidence: Math.round(60 + suspicionScore / 5) };
}

export function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}