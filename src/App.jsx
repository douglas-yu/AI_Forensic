import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import ImageForensics from '@/pages/ImageForensics';
import VideoForensics from '@/pages/VideoForensics';
import AudioForensics from '@/pages/AudioForensics';
import AIDetection from '@/pages/AIDetection';
import History from '@/pages/History';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/image-forensics" element={<ImageForensics />} />
          <Route path="/video-forensics" element={<VideoForensics />} />
          <Route path="/audio-forensics" element={<AudioForensics />} />
          <Route path="/ai-detection" element={<AIDetection />} />
          <Route path="/history" element={<History />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;