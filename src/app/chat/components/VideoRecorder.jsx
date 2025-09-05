"use client";

import { useEffect, useRef, useState } from "react";

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
      setErrMsg("Camera works over HTTPS or localhost only. Use https or open on localhost.");
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
        setErrMsg("Camera/microphone permission denied. Please allow access in browser/site settings.");
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
      alert("Unable to start recording. Check camera/mic permissions.");
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
    mr.onstop = () => {
      stopTimer();
      const firstTrack = streamRef.current?.getVideoTracks?.()[0];
      const settings = firstTrack?.getSettings?.() || {};
      const blob = new Blob(chunksRef.current, { type: mr.mimeType || "video/webm" });
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
      <div className="w-[min(560px,94vw)] p-4 text-white">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className={`inline-block rounded-full ${recording ? 'bg-red-500 fade-dot' : 'bg-white/50'}`} style={{ width: 12, height: 12 }} />
          <span className="font-mono text-lg">{mm}:{ss}</span>
        </div>
        <div className="text-sm text-white/80 mb-2 text-center">Video recorder</div>
        {errMsg && <div className="mx-auto mb-3 max-w-md text-[12px] text-red-300 text-center">{errMsg}</div>}

        {/* Preview frame: square-ish/portrait rectangle with cover fit */}
        <div className="mx-auto mb-3 w-full max-w-md rounded-xl overflow-hidden bg-black/60 ring-1 ring-white/10" style={{ aspectRatio: '3 / 4' }}>
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        </div>

        <div className="flex items-center justify-center gap-3">
          {!recording ? (
            <button onClick={start} className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600">{granted ? 'Start' : 'Allow & Start'}</button>
          ) : (
            <>
              <button onClick={pause} className="px-4 py-2 rounded bg-white/10 text-white hover:bg-white/20">{paused ? 'Resume' : 'Pause'}</button>
              <button onClick={stopAndSubmit} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500">Submit</button>
            </>
          )}
          <button onClick={cancel} className="px-4 py-2 rounded bg-white/10 text-white hover:bg-white/20">Cancel</button>
        </div>
      </div>

      <style jsx>{`
        .fade-dot { animation: fadeInOut 1.8s ease-in-out infinite; }
        @keyframes fadeInOut { 0%, 100% { opacity: 0.10; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
