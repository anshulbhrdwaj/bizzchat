import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Play, Pause, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  fileName?: string;
}

interface Props {
  items: MediaItem[];
  initialIndex?: number;
  onClose: () => void;
}

export default function MediaViewer({ items, initialIndex = 0, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dragStart = useRef<{ x: number; startIndex: number } | null>(null);

  const current = items[index];

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [index]);

  const prev = () => { setIndex(i => Math.max(0, i - 1)); setZoom(1); };
  const next = () => { setIndex(i => Math.min(items.length - 1, i + 1)); setZoom(1); };

  const handleDragEnd = (e: any, info: any) => {
    if (info.offset.x < -80) next();
    else if (info.offset.x > 80) prev();
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[900] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.96)', backdropFilter: 'blur(20px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <p className="text-white/70 text-sm">
          {items.length > 1 ? `${index + 1} of ${items.length}` : current.fileName || 'Media'}
        </p>

        <a
          href={current.url}
          download={current.fileName || 'media'}
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
        >
          <Download className="w-5 h-5" />
        </a>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Prev / Next buttons */}
        {index > 0 && (
          <button
            onClick={prev}
            className="absolute left-4 z-10 p-2 rounded-full hover:bg-white/10 text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {index < items.length - 1 && (
          <button
            onClick={next}
            className="absolute right-4 z-10 p-2 rounded-full hover:bg-white/10 text-white transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            drag={current.type === 'image' ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full flex items-center justify-center"
          >
            {/* Image */}
            {current.type === 'image' && (
              <div
                className="relative"
                style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease' }}
              >
                <img
                  src={current.url}
                  alt="Media"
                  className="max-w-full max-h-[80vh] object-contain rounded-lg select-none"
                  draggable={false}
                />
              </div>
            )}

            {/* Video */}
            {current.type === 'video' && (
              <div className="relative w-full max-h-[80vh] flex flex-col">
                <video
                  ref={videoRef}
                  src={current.url}
                  className="max-w-full max-h-[70vh] mx-auto rounded-lg"
                  onTimeUpdate={() => setProgress(videoRef.current?.currentTime || 0)}
                  onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                  onEnded={() => setPlaying(false)}
                  onClick={togglePlay}
                />
                {/* Video controls */}
                <div className="flex items-center gap-3 px-6 py-3">
                  <button onClick={togglePlay} className="text-white">
                    {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={duration || 1}
                    value={progress}
                    onChange={e => {
                      const t = parseFloat(e.target.value);
                      setProgress(t);
                      if (videoRef.current) videoRef.current.currentTime = t;
                    }}
                    className="flex-1 accent-blue-400"
                  />
                  <span className="text-white/60 text-xs font-mono">
                    {formatTime(progress)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
            )}

            {/* Audio / Document */}
            {(current.type === 'audio' || current.type === 'document') && (
              <div
                className="flex flex-col items-center gap-4 p-8 rounded-2xl"
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}
              >
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
                  style={{ background: 'var(--bg-input)' }}>
                  {current.type === 'audio' ? '🎵' : '📄'}
                </div>
                <p className="text-white text-sm font-medium text-center max-w-xs">
                  {current.fileName || 'File'}
                </p>
                {current.type === 'audio' && (
                  <audio src={current.url} controls className="mt-2" />
                )}
                {current.type === 'document' && (
                  <a
                    href={current.url}
                    download={current.fileName}
                    className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: 'var(--accent-gradient)' }}
                  >
                    Download
                  </a>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Zoom controls for images */}
      {current.type === 'image' && (
        <div className="flex-shrink-0 flex items-center justify-center gap-4 py-3">
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-white/60 text-sm">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(4, z + 0.25))}
            className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Thumbnail strip (for multiple images) */}
      {items.length > 1 && (
        <div className="flex-shrink-0 flex justify-center gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { setIndex(i); setZoom(1); }}
              className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden transition-all"
              style={{
                border: i === index ? '2px solid var(--accent-primary)' : '2px solid transparent',
                opacity: i === index ? 1 : 0.5,
              }}
            >
              {item.type === 'image'
                ? <img src={item.url} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-xl bg-white/10">
                    {item.type === 'video' ? '🎬' : '📄'}
                  </div>
              }
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
