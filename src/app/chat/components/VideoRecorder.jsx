"use client";

import { useEffect, useRef, useState } from "react";
import { saveMedia } from "../../../utils/mediaStorage";
import { newId } from "../messages";

// Simple full-screen overlay video recorder using MediaRecorder + getUserMedia
export default function VideoRecorder({ open = false, onClose, onSubmit }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);
  const [errMsg, setErrMsg] = useState("");
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Reset
    setRecording(false);
    setPaused(false);
    setSeconds(0);
    chunksRef.current = [];

    if (!window.isSecureContext) {
      setErrMsg("دوربین فقط در HTTPS یا localhost کار می‌کند. لطفاً از https استفاده کنید یا از localhost باز کنید.");
    } else {
      setErrMsg("");
    }

    (async () => {
      try {
        // Prefer front camera for story-like recording
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setGranted(true);
      } catch (e) {
        console.error(e);
        setErrMsg("دسترسی به دوربین/میکروفون رد شد. لطفاً در تنظیمات مرورگر اجازه دهید.");
        setGranted(false);
      }
    })();
  }, [open]);

  useEffect(() => {
    return () => {
      // cleanup stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const tick = () => setSeconds((s) => s + 1);
  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(tick, 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const pickMime = () => {
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4", // Safari 14+ may support
    ];
    for (const m of candidates) {
      try {
        if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m;
      } catch {}
    }
    return undefined;
  };

  const start = () => {
    try {
      const stream = streamRef.current;
      if (!stream) throw new Error("No stream");
      const mime = pickMime();
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 2500_000 } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setPaused(false);
      startTimer();
    } catch (e) {
      console.error(e);
      alert("قادر به شروع ضبط نیست. دسترسی به دوربین/میکروفون را بررسی کنید.");
      onClose?.();
    }
  };

  const pause = () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") return;
    if (!paused) {
      mr.pause();
      setPaused(true);
      stopTimer();
    } else {
      mr.resume();
      setPaused(false);
      startTimer();
    }
  };

  const cancel = () => {
    stopTimer();
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      try { mr.stop(); } catch {}
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    onClose?.();
  };

  const stopAndSubmit = () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    mr.onstop = async () => {
      stopTimer();
      const firstTrack = streamRef.current?.getVideoTracks?.()[0];
      const settings = firstTrack?.getSettings?.() || {};
      const blob = new Blob(chunksRef.current, { type: mr.mimeType || "video/webm" });
      
      try {
        // Generate unique ID for the media
        const mediaId = newId();
        
        // Save to IndexedDB
        await saveMedia(mediaId, blob, {
          type: 'video',
          duration: seconds,
          width: settings.width,
          height: settings.height,
          mimeType: blob.type,
        });
        
        // Pass the media ID instead of URL/blob
        onSubmit?.({ 
          mediaId, 
          duration: seconds, 
          width: settings.width, 
          height: settings.height,
          type: 'video'
        });
        
        // cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        mediaRecorderRef.current = null;
        chunksRef.current = [];
        onClose?.();
      } catch (error) {
        console.error('Failed to save video to IndexedDB:', error);
        // Fallback to old behavior
        const url = URL.createObjectURL(blob);
        onSubmit?.({ url, blob, duration: seconds, width: settings.width, height: settings.height });
        // cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        mediaRecorderRef.current = null;
        chunksRef.current = [];
        onClose?.();
      }
    };
    try {
      mr.stop();
    } catch {}
  };

  if (!open) return null;

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center" role="dialog" aria-modal>
      <div className="w-[min(560px,94vw)] p-4 text-white relative" dir="rtl">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="relative flex items-center justify-center">
            <span className={`inline-block rounded-full transition-all duration-300 ${
              recording && !paused 
                ? 'bg-red-500 animate-pulse' 
                : recording && paused 
                ? 'bg-yellow-500' 
                : 'bg-white/50'
            }`} style={{ width: 12, height: 12 }} />
          </div>
          <span className={`font-mono text-xl transition-all duration-300 ${
            recording && !paused 
              ? 'text-red-400 scale-110' 
              : recording && paused 
              ? 'text-yellow-400 scale-105' 
              : 'text-white'
          }`}>{mm}:{ss}</span>
        </div>
        
        <div className="text-base text-white/90 mb-3 text-center font-medium">
          {recording && !paused ? 'در حال ضبط...' : 'ضبط ویدیو'}
        </div>
        {errMsg && <div className="mx-auto mb-4 max-w-md text-[13px] text-red-300 text-center bg-red-500/10 p-2 rounded-lg">{errMsg}</div>}

        {/* Preview frame with recording effects - responsive sizing */}
        <div className={`mx-auto mb-4 w-full max-w-md rounded-xl overflow-hidden bg-black/60 ring-1 transition-all duration-300 ${
          recording 
            ? 'ring-red-500 ring-2 shadow-lg shadow-red-500/30' 
            : 'ring-white/10'
        }`} style={{ 
          aspectRatio: '3 / 4',
          maxHeight: 'min(60vh, 400px)' // Limit height on desktop
        }}>
          <div className="relative w-full h-full">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            
            {/* Recording overlay effects */}
            {recording && (
              <>
                {/* Corner recording indicators */}
                <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/50 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-white font-medium">REC</span>
                </div>
                
                {/* Subtle vignette when recording */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-radial from-transparent via-transparent to-red-900/10"></div>
              </>
            )}
            
            {paused && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-white text-2xl font-bold bg-black/60 px-4 py-2 rounded-lg">
                  متوقف شد
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          {!recording ? (
            <button 
              onClick={start} 
              className="px-6 py-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all duration-200 transform hover:scale-105 shadow-lg font-medium"
            >
              {granted ? 'شروع ضبط' : 'اجازه و شروع'}
            </button>
          ) : (
            <>
              <button 
                onClick={pause} 
                className={`px-4 py-2 rounded-full transition-all duration-200 font-medium ${
                  paused 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
              >
                {paused ? 'ادامه' : 'توقف'}
              </button>
              <button 
                onClick={stopAndSubmit} 
                className="px-6 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-all duration-200 font-medium shadow-lg"
              >
                ارسال
              </button>
            </>
          )}
          <button 
            onClick={cancel} 
            className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-200 font-medium"
          >
            لغو
          </button>
        </div>
      </div>

      <style jsx>{`
        .bg-gradient-radial {
          background: radial-gradient(circle at center, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
}
