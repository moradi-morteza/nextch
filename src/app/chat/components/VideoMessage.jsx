"use client";

import { useMemo } from "react";

export default function VideoMessage({ url, width, height, duration, variant = 'me', timestamp }) {
  const fmt = (s) => {
    const mm = String(Math.floor((s || 0) / 60)).padStart(2, "0");
    const ss = String(Math.floor((s || 0) % 60)).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  // Constrain video area similar to images; keep aspect, fit to container
  const maxW = 280; // align with IMAGE_MAX_WIDTH_PX
  const maxH = 380; // align with IMAGE_MAX_HEIGHT_PX
  const style = useMemo(() => ({
    maxWidth: `${maxW}px`,
    maxHeight: `${maxH}px`,
    width: "100%",
    height: "auto",
  }), []);

  return (
    <div className="flex flex-col items-start gap-1" style={{ maxWidth: `${maxW}px` }}>
      <div className="rounded-lg overflow-hidden" style={{ maxWidth: `${maxW}px`, maxHeight: `${maxH}px` }}>
        <video
          src={url}
          controls
          playsInline
          className="block w-full h-auto"
          style={style}
        />
      </div>
      <div className="flex justify-between items-center w-full text-[11px] text-gray-500">
        {timestamp && (
          <span>{new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        )}
        <span>{fmt(duration)}</span>
      </div>
    </div>
  );
}

