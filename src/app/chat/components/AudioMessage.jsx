"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import IconButton from "@mui/material/IconButton";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import { getMediaUrl } from "../../../utils/mediaStorage";
import mediaManager from "../../../utils/mediaManager";
import { useLang } from "../../../hooks/useLang.js";

export default function AudioMessage({ url, mediaId, duration, variant = 'me', timestamp }) {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(url);
  const [loading, setLoading] = useState(!!mediaId && !url);
  const audioUrlRef = useRef(null);
  const { t } = useLang();
  const uniqueMediaId = useRef(`audio-${Date.now()}-${Math.random()}`).current;
  
  const colorFor = (v, isPlaying) =>
    v === 'me'
      ? { wave: '#a7e0a0', progress: isPlaying ? '#2e7d32' : '#4f7d46' }
      : { wave: '#cbd5e1', progress: isPlaying ? '#2563eb' : '#64748b' };

  // Load audio URL from IndexedDB if mediaId is provided
  useEffect(() => {
    if (mediaId && !url) {
      let cancelled = false;
      setLoading(true);
      
      getMediaUrl(mediaId)
        .then(mediaUrl => {
          if (!cancelled) {
            // Clean up previous URL
            if (audioUrlRef.current && audioUrlRef.current !== url) {
              URL.revokeObjectURL(audioUrlRef.current);
            }
            audioUrlRef.current = mediaUrl;
            setAudioUrl(mediaUrl);
            setLoading(false);
          }
        })
        .catch(error => {
          if (!cancelled) {
            console.error('Failed to load audio from IndexedDB:', error);
            setLoading(false);
          }
        });
        
      return () => {
        cancelled = true;
      };
    } else if (url) {
      setAudioUrl(url);
      setLoading(false);
    }
  }, [mediaId, url]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrlRef.current && audioUrlRef.current !== url) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, [url]);

  useEffect(() => {
    if (!containerRef.current || !audioUrl || loading) return;
    
    setReady(false);
    
    // Create a wavesurfer instance like in official docs
    const baseColors = colorFor(variant, playing);
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: baseColors.wave,
      progressColor: baseColors.progress,
      cursorColor: "transparent",
      height: 32,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      normalize: true,
      interact: true,
      url: audioUrl,
    });
    wavesurferRef.current = ws;
    
    const onReady = () => {
      setReady(true);
      setPlaying(false);
      // Register with media manager when ready
      if (ws.getMediaElement()) {
        mediaManager.register(ws.getMediaElement(), uniqueMediaId);
      }
    };
    const onTime = (t) => setCurrentTime(t);
    const onFinish = () => {
      setPlaying(false);
      mediaManager.ended(ws.getMediaElement(), uniqueMediaId);
    };
    const onPlay = () => {
      setPlaying(true);
      if (ws.getMediaElement()) {
        mediaManager.play(ws.getMediaElement(), uniqueMediaId);
      }
    };
    const onPause = () => {
      setPlaying(false);
      if (ws.getMediaElement()) {
        mediaManager.pause(ws.getMediaElement(), uniqueMediaId);
      }
    };
    
    ws.on("ready", onReady);
    ws.on("timeupdate", onTime);
    ws.on("finish", onFinish);
    ws.on("play", onPlay);
    ws.on("pause", onPause);
    
    return () => {
      ws.un("ready", onReady);
      ws.un("timeupdate", onTime);
      ws.un("finish", onFinish);
      ws.un("play", onPlay);
      ws.un("pause", onPause);
      // Unregister from media manager
      mediaManager.unregister(uniqueMediaId);
      ws.destroy();
    };
  }, [audioUrl, variant, loading]);

  // Update colors on play state or side change
  useEffect(() => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    const c = colorFor(variant, playing);
    ws.setOptions({ progressColor: c.progress, waveColor: c.wave });
  }, [playing, variant]);

  const toggle = async () => {
    const ws = wavesurferRef.current;
    if (!ws || !ready) return;
    
    try {
      if (!playing && ws.getMediaElement()) {
        // Use media manager to pause other media first
        mediaManager.play(ws.getMediaElement(), uniqueMediaId);
      }
      // playPause returns a promise in v7
      await ws.playPause();
      // State is managed by event listeners now
    } catch (error) {
      console.error('Error toggling audio playback:', error);
      setPlaying(false);
    }
  };

  const fmt = (s) => {
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(Math.floor(s % 60)).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-1 w-full" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-[120px] pb-2 flex items-center justify-center">
            <div className="text-sm text-gray-500" dir="rtl">در حال بارگذاری صوت...</div>
          </div>
          <button
            disabled
            className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-400 transition-colors"
            aria-label={t('aria.loading')}
          >
            <PlayArrowRoundedIcon sx={{ fontSize: 32, color: 'white' }} />
          </button>
        </div>
        <div className="flex justify-between items-center text-[11px] text-gray-500">
          {timestamp && (
            <span>{new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          )}
          <span>{fmt(duration || 0)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 w-full" dir="rtl">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-[120px] pb-2">
          <div ref={containerRef} style={{ width: '100%', height: 32, maxHeight: 32, overflow: 'hidden' }} />
        </div>
        <button
          onClick={toggle}
          disabled={!ready}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 transition-colors"
          aria-label={playing ? t('aria.pause') : t('aria.play')}
        >
          {playing ? (
            <PauseRoundedIcon sx={{ fontSize: 30, color: 'white' }} />
          ) : (
            <PlayArrowRoundedIcon sx={{ fontSize: 32, color: 'white' }} />
          )}
        </button>
      </div>
      <div className="flex justify-between items-center text-[11px] text-gray-500">
        {timestamp && (
          <span>{new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        )}
        <span>{fmt(currentTime || duration || 0)}</span>
      </div>
    </div>
  );
}
