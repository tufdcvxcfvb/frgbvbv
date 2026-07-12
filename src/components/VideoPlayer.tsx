import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Maximize, 
  Minimize, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Settings, 
  Tv, 
  Volume1,
  RotateCw,
  Gauge
} from 'lucide-react';
import toast from 'react-hot-toast';

interface VideoPlayerProps {
  url: string;
  lectureId: string;
  title: string;
  onEnded?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, lectureId, title, onEnded }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1); // 0 to 1
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showRatesList, setShowRatesList] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const controlsTimeoutRef = useRef<any>(null);

  const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // Initialize and load video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset states
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    const isHls = url.includes('.m3u8');

    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          // Ready to play
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (Safari)
        video.src = url;
      }
    } else {
      // Direct MP4
      video.src = url;
    }

    // Auto-Resume playback position
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      const savedTime = localStorage.getItem(`playback_pos_${lectureId}`);
      if (savedTime) {
        const parsedTime = parseFloat(savedTime);
        if (parsedTime > 0 && parsedTime < video.duration - 2) {
          video.currentTime = parsedTime;
          toast.success(`Resumed from ${formatTime(parsedTime)}`, { id: 'resume-toast' });
        }
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url, lectureId]);

  // Track time and save playback position
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Persist position every 3 seconds to avoid writing too frequently
      if (Math.round(video.currentTime) % 3 === 0) {
        localStorage.setItem(`playback_pos_${lectureId}`, video.currentTime.toString());
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      localStorage.removeItem(`playback_pos_${lectureId}`);
      if (onEnded) onEnded();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [lectureId, onEnded]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcuts if user is typing in inputs
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      switch (e.key.toLowerCase()) {
        case ' ': // Space - Play/Pause
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowright': // ArrowRight - Forward 5s
          e.preventDefault();
          seekForward();
          break;
        case 'arrowleft': // ArrowLeft - Backward 5s
          e.preventDefault();
          seekBackward();
          break;
        case 'arrowup': // ArrowUp - Volume Up
          e.preventDefault();
          adjustVolume(0.05);
          break;
        case 'arrowdown': // ArrowDown - Volume Down
          e.preventDefault();
          adjustVolume(-0.05);
          break;
        case 'f': // F - Fullscreen
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm': // M - Mute/Unmute
          e.preventDefault();
          toggleMute();
          break;
        case 'p': // P - Picture-in-Picture
          e.preventDefault();
          togglePip();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [volume, isMuted, isFullscreen, isPip]);

  // Controls auto-hide
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowRatesList(false);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Play error:', err);
      });
    }
    handleMouseMove();
  };

  const seekForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 5, duration);
      handleMouseMove();
    }
  };

  const seekBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 5, 0);
      handleMouseMove();
    }
  };

  const adjustVolume = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = Math.min(Math.max(volume + delta, 0), 1);
    setVolume(newVolume);
    video.volume = newVolume;
    setIsMuted(newVolume === 0);
    video.muted = newVolume === 0;
    toast.success(`Volume: ${Math.round(newVolume * 100)}%`, { id: 'vol-toast', duration: 800 });
    handleMouseMove();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    const nextMute = !isMuted;
    setIsMuted(nextMute);
    video.muted = nextMute;
    if (!nextMute && volume === 0) {
      setVolume(0.5);
      video.volume = 0.5;
    }
    handleMouseMove();
  };

  const handleVolumeSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const val = parseFloat(e.target.value);
    setVolume(val);
    video.volume = val;
    setIsMuted(val === 0);
    video.muted = val === 0;
    handleMouseMove();
  };

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const seekTo = parseFloat(e.target.value);
    video.currentTime = seekTo;
    setCurrentTime(seekTo);
    handleMouseMove();
  };

  const handleRateChange = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    setPlaybackRate(rate);
    video.playbackRate = rate;
    setShowRatesList(false);
    toast.success(`Speed: ${rate}x`, { id: 'speed-toast', duration: 1000 });
    handleMouseMove();
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
    handleMouseMove();
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePip = async () => {
    const video = videoRef.current;
    if (!video || !document.pictureInPictureEnabled) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPip(false);
      } else {
        await video.requestPictureInPicture();
        setIsPip(true);
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
    handleMouseMove();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full aspect-video bg-black rounded-2xl border border-white/10 overflow-hidden shadow-2xl group select-none"
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        playsInline
      />

      {/* Floating Large Central Play/Pause Button on Idle hover */}
      {(!isPlaying || showControls) && (
        <div 
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-all cursor-pointer z-10"
        >
          <div className="p-5 bg-indigo-600/90 text-white rounded-full hover:scale-115 active:scale-95 transition shadow-2xl hover:bg-indigo-500">
            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
          </div>
        </div>
      )}

      {/* Glassmorphic Top Bar Info Overlay */}
      <div 
        className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent transition-all duration-300 flex items-center justify-between z-20 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold">SECURE PLAYER</span>
          <span className="text-sm font-semibold text-white truncate max-w-[280px] sm:max-w-[450px]">{title}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] bg-red-500/20 border border-red-500/30 px-2.5 py-1 rounded-full text-red-400 font-mono">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
          <span>ENCRYPTED PREVIEW</span>
        </div>
      </div>

      {/* Glassmorphic Controls Bottom Panel */}
      <div 
        className={`absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 to-transparent transition-all duration-300 flex flex-col gap-3 z-20 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Seek timeline */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleTimelineChange}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-2 transition-all outline-none"
            style={{
              background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((currentTime / (duration || 100)) * 100).toFixed(2)}%, rgba(255, 255, 255, 0.2) ${((currentTime / (duration || 100)) * 100).toFixed(2)}%, rgba(255, 255, 255, 0.2) 100%)`
            }}
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button 
              onClick={togglePlay}
              className="text-white hover:text-indigo-400 transition transform active:scale-90"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>

            {/* Seek Back/Forward */}
            <button 
              onClick={seekBackward}
              className="text-slate-300 hover:text-white transition"
              title="Backward 5s"
            >
              <RotateCcw size={16} />
            </button>
            <button 
              onClick={seekForward}
              className="text-slate-300 hover:text-white transition"
              title="Forward 5s"
            >
              <RotateCw size={16} />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 group/volume">
              <button 
                onClick={toggleMute}
                className="text-white hover:text-indigo-400 transition"
              >
                {isMuted ? <VolumeX size={18} /> : volume > 0.5 ? <Volume2 size={18} /> : <Volume1 size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeSlider}
                className="w-0 group-hover/volume:w-16 h-1 bg-white/20 rounded appearance-none cursor-pointer accent-indigo-500 transition-all overflow-hidden"
              />
            </div>

            {/* Timer display */}
            <div className="text-xs font-mono text-slate-300">
              {formatTime(currentTime)} <span className="text-slate-500">/</span> {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Playback speed menu */}
            <div className="relative">
              <button 
                onClick={() => setShowRatesList(!showRatesList)}
                className="flex items-center gap-1 text-slate-300 hover:text-white text-xs bg-white/10 px-2 py-1 rounded-md hover:bg-white/15 transition border border-white/5"
                title="Playback Speed"
              >
                <Gauge size={14} />
                <span>{playbackRate}x</span>
              </button>

              {showRatesList && (
                <div className="absolute bottom-10 right-0 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5 min-w-[80px] z-30">
                  {rates.map(rate => (
                    <button
                      key={rate}
                      onClick={() => handleRateChange(rate)}
                      className={`w-full text-left px-3 py-1 text-xs rounded-lg transition ${
                        playbackRate === rate 
                          ? 'bg-indigo-600/90 text-white font-semibold' 
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Picture-in-Picture */}
            {document.pictureInPictureEnabled && (
              <button 
                onClick={togglePip}
                className="text-slate-300 hover:text-indigo-400 transition"
                title="Picture-in-Picture"
              >
                <Tv size={18} />
              </button>
            )}

            {/* Fullscreen */}
            <button 
              onClick={toggleFullscreen}
              className="text-white hover:text-indigo-400 transition"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
