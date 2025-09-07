"use client";

import { useMemo, useEffect, useState } from "react";
import { getMediaUrl } from "../../../utils/mediaStorage";

export default function VideoMessage({ url, mediaId, width, height, duration, variant = 'me', timestamp }) {
  const [videoUrl, setVideoUrl] = useState(url);
  const [loading, setLoading] = useState(false);
  
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

  if (loading) {
    return (
      <div className="flex flex-col items-start gap-1" style={{ maxWidth: `${maxW}px` }}>
        <div className="rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center" style={{ maxWidth: `${maxW}px`, maxHeight: `${maxH}px`, minHeight: '120px' }}>
          <div className="text-sm text-gray-500">Loading video...</div>
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

  return (
    <div className="flex flex-col items-start gap-1" style={{ maxWidth: `${maxW}px` }}>
      <div className="rounded-lg overflow-hidden" style={{ maxWidth: `${maxW}px`, maxHeight: `${maxH}px` }}>
        <video
          src={videoUrl}
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

