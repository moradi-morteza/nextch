"use client";

import { useEffect, useRef, useState } from "react";

export default function VoiceRecorder({ open = false, onClose, onSubmit }) {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

  const [granted, setGranted] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    // reset state when opened
    setRecording(false);
    setPaused(false);
    setSeconds(0);
    chunksRef.current = [];

    // Inform if context is insecure (e.g., http over LAN)
    if (!window.isSecureContext) {
      setErrMsg("Microphone works over HTTPS or localhost only. Use https or open on this device via localhost.");
    } else {
      setErrMsg("");
    }

    // Prime permission right after user opened the overlay (counts as gesture)
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setGranted(true);
      } catch (e) {
        setGranted(false);
        setErrMsg("Microphone permission denied. Please allow access in the browser/site settings.");
      }
    })();
  }, [open]);

  const tick = () => {
    setSeconds((s) => s + 1);
  };
  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(tick, 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const requestAndStart = async () => {
    try {
      const stream =
        streamRef.current || (await navigator.mediaDevices.getUserMedia({ audio: true }));
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : undefined;
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      startTimer();
      setRecording(true);
      setPaused(false);
    } catch (e) {
      alert("Microphone access is required. If on phone via Wi‑Fi, use HTTPS or a dev tunnel.");
      console.error(e);
      onClose?.();
    }
  };

  const pause = () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    if (!paused) {
      mr.pause();
      stopTimer();
      setPaused(true);
    } else {
      mr.resume();
      startTimer();
      setPaused(false);
    }
  };

  const cancel = () => {
    stopTimer();
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    mediaRecorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    chunksRef.current = [];
    onClose?.();
  };

  const stopAndSubmit = () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    mr.onstop = () => {
      stopTimer();
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      onSubmit?.({ url, blob, duration: seconds });
      // cleanup
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
      streamRef.current = null;
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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center" role="dialog" aria-modal>
      <div className="w-[min(520px,92vw)] rounded-2xl bg-white shadow-xl p-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className={`inline-block rounded-full ${recording ? 'bg-red-500 fade-dot' : 'bg-gray-300'} `} style={{ width: 12, height: 12 }} />
          <span className="font-mono text-lg">{mm}:{ss}</span>
        </div>
        <div className="text-sm text-gray-500 mb-2">Voice recorder</div>
        {errMsg && (
          <div className="mx-auto mb-3 max-w-md text-[12px] text-red-600">{errMsg}</div>
        )}

        <div className="flex items-center justify-center gap-3">
          {!recording ? (
            <button onClick={requestAndStart} className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600">{granted ? 'Start' : 'Allow & Start'}</button>
          ) : (
            <>
              <button onClick={pause} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">
                {paused ? 'Resume' : 'Pause'}
              </button>
              <button onClick={stopAndSubmit} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500">Submit</button>
            </>
          )}
          <button onClick={cancel} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">Cancel</button>
        </div>
      </div>
      <style jsx>{` // fade in fade out record animation
        .fade-dot { animation: fadeInOut 1.8s ease-in-out infinite; }
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.10; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
