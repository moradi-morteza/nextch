"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import IconButton from "@mui/material/IconButton";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";

export default function AudioMessage({ url, duration, variant = 'me' }) {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const colorFor = (v, isPlaying) =>
    v === 'me'
      ? { wave: '#a7e0a0', progress: isPlaying ? '#2e7d32' : '#4f7d46' }
      : { wave: '#cbd5e1', progress: isPlaying ? '#2563eb' : '#64748b' };

  useEffect(() => {
    if (!containerRef.current) return;
    // Create a wavesurfer instance like in official docs
    const baseColors = colorFor(variant, playing);
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: baseColors.wave,
      progressColor: baseColors.progress,
      cursorColor: "transparent",
      height: 44,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      normalize: true,
      interact: true,
      url,
    });
    wavesurferRef.current = ws;
    const onReady = () => setReady(true);
    const onTime = (t) => setCurrent(t);
    const onFinish = () => setPlaying(false);
    ws.on("ready", onReady);
    ws.on("timeupdate", onTime);
    ws.on("finish", onFinish);
    return () => {
      ws.un("ready", onReady);
      ws.un("timeupdate", onTime);
      ws.un("finish", onFinish);
      ws.destroy();
    };
  }, [url]);

  // Update colors on play state or side change
  useEffect(() => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    const c = colorFor(variant, playing);
    ws.setOptions({ progressColor: c.progress, waveColor: c.wave });
  }, [playing, variant]);

  const toggle = () => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    // playPause returns a promise in v7; but we only need state after call
    ws.playPause();
    setPlaying(ws.isPlaying());
  };

  const fmt = (s) => {
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(Math.floor(s % 60)).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    <div className="flex items-center gap-2 w-full" style={{ width: 240 }}>
      <IconButton onClick={toggle} disabled={!ready} size="small" aria-label={playing ? "Pause" : "Play"}>
        {playing ? <PauseRoundedIcon fontSize="small" /> : <PlayArrowRoundedIcon fontSize="small" />}
      </IconButton>
      <div className="flex-1 min-w-[120px]">
        <div ref={containerRef} style={{ width: '100%', height: 36 }} />
      </div>
      <div className="shrink-0 text-[12px] text-gray-700 font-mono text-right" style={{ width: 42 }}>
        {fmt(current || duration || 0)}
      </div>
    </div>
  );
}
