"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import { getMediaUrl } from "../../../utils/mediaStorage";
import mediaManager from "../../../utils/mediaManager";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import CircularProgress from '@mui/material/CircularProgress';

export default function VideoMessage({ url, mediaId, width, height, duration, variant = 'me', timestamp }) {
  const [videoUrl, setVideoUrl] = useState(url);
  const [loading, setLoading] = useState(!!mediaId && !url); // Loading if we need to fetch from IndexedDB
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false); // This handles video data loading
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const uniqueMediaId = useRef(`video-${Date.now()}-${Math.random()}`).current;
  
  const fmt = (s) => {
    const mm = String(Math.floor((s || 0) / 60)).padStart(2, "0");
    const ss = String(Math.floor((s || 0) % 60)).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  // Load video URL from IndexedDB if mediaId is provided
  useEffect(() => {
    if (mediaId && !url) {
      setLoading(true);
      getMediaUrl(mediaId)
        .then(mediaUrl => {
          setVideoUrl(mediaUrl);
          setLoading(false);
        })
        .catch(error => {
          console.error('Failed to load video from IndexedDB:', error);
          setLoading(false);
        });
    }
  }, [mediaId, url]);

  // Constrain video area similar to images; keep aspect, fit to container
  const maxW = 280; // align with IMAGE_MAX_WIDTH_PX
  const maxH = 380; // align with IMAGE_MAX_HEIGHT_PX
  const style = useMemo(() => ({
    maxWidth: `${maxW}px`,
    maxHeight: `${maxH}px`,
    width: "100%",
    height: "auto",
  }), []);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        // Use media manager to handle multiple media
        mediaManager.play(videoRef.current, uniqueMediaId);
        videoRef.current.play();
      }
    }
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
    mediaManager.play(videoRef.current, uniqueMediaId);
  };
  
  const handleVideoPause = () => {
    setIsPlaying(false);
    mediaManager.pause(videoRef.current, uniqueMediaId);
  };
  
  const handleVideoEnded = () => {
    setIsPlaying(false);
    mediaManager.ended(videoRef.current, uniqueMediaId);
  };
  
  const handleVideoLoaded = () => setVideoLoaded(true);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if (containerRef.current.webkitRequestFullscreen) {
          await containerRef.current.webkitRequestFullscreen();
        } else if (containerRef.current.mozRequestFullScreen) {
          await containerRef.current.mozRequestFullScreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Register/unregister with media manager
  useEffect(() => {
    if (videoRef.current) {
      mediaManager.register(videoRef.current, uniqueMediaId);
    }
    
    return () => {
      mediaManager.unregister(uniqueMediaId);
    };
  }, [uniqueMediaId]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative rounded-lg overflow-hidden ${isFullscreen ? 'bg-black w-full h-full' : ''}`} 
      style={isFullscreen ? {} : { maxWidth: `${maxW}px`, maxHeight: `${maxH}px` }}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        playsInline
        controls={isFullscreen} // Show native controls in fullscreen
        className="block w-full h-auto"
        style={isFullscreen ? { width: '100%', height: '100%', objectFit: 'contain' } : style}
        onPlay={handleVideoPlay}
        onPause={handleVideoPause}
        onEnded={handleVideoEnded}
        onLoadedData={handleVideoLoaded}
      />
      
      {/* Loading state - clean and elegant */}
      {(loading || !videoLoaded) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm">
          <CircularProgress 
            size={40} 
            thickness={3}
            sx={{ 
              color: 'white',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }} 
          />
          <span className="text-white text-sm mt-2 font-medium bg-black/30 px-2 py-1 rounded" dir="rtl">
            در حال بارگذاری...
          </span>
        </div>
      )}
      
      {/* Custom play button overlay (only when loaded and not loading) */}
      {!isFullscreen && !loading && videoLoaded && !isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
          onClick={handlePlayPause}
        >
          <div className="bg-white/90 hover:bg-white rounded-full p-3 transition-all duration-200 transform hover:scale-110 shadow-lg">
            <PlayArrowIcon sx={{ fontSize: 32, color: '#374151' }} />
          </div>
        </div>
      )}
      
      {/* Pause button when playing (only in normal mode) */}
      {!isFullscreen && isPlaying && videoLoaded && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity duration-200"
          onClick={handlePlayPause}
        >
          <div className="bg-black/50 hover:bg-black/70 rounded-full p-2 transition-all duration-200">
            <PauseIcon sx={{ fontSize: 28, color: 'white' }} />
          </div>
        </div>
      )}
      
      {/* Fullscreen button (only when video is loaded and not in fullscreen) */}
      {!isFullscreen && !loading && videoLoaded && (
        <div className="absolute top-2 right-2">
          <div 
            className="bg-black/50 hover:bg-black/70 rounded-full p-1.5 cursor-pointer transition-all duration-200"
            onClick={toggleFullscreen}
          >
            <FullscreenIcon sx={{ fontSize: 20, color: 'white' }} />
          </div>
        </div>
      )}
      
      {/* Exit fullscreen button */}
      {isFullscreen && (
        <div className="absolute top-4 right-4 z-10">
          <div 
            className="bg-black/70 hover:bg-black/90 rounded-full p-2 cursor-pointer transition-all duration-200"
            onClick={toggleFullscreen}
          >
            <FullscreenExitIcon sx={{ fontSize: 24, color: 'white' }} />
          </div>
        </div>
      )}
      
      {/* Duration and time overlay (only in normal mode) */}
      {!isFullscreen && (
        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center pointer-events-none">
          <span className="text-xs text-white bg-black/50 px-2 py-1 rounded backdrop-blur-sm">{fmt(duration)}</span>
          {timestamp && (
            <span className="text-xs text-white bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
              {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

