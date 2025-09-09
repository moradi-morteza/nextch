"use client";

import { useEffect, useRef, useState } from "react";
import { saveMedia } from "../../../utils/mediaStorage";
import { newId } from "../messages";

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
      setErrMsg("میکروفون فقط در HTTPS یا localhost کار می‌کند. لطفاً از https استفاده کنید یا از localhost باز کنید.");
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
        setErrMsg("دسترسی به میکروفون رد شد. لطفاً در تنظیمات مرورگر اجازه دهید.");
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
      alert("دسترسی به میکروفون لازم است. اگر از طریق Wi-Fi استفاده می‌کنید، از HTTPS استفاده کنید.");
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
    mr.onstop = async () => {
      stopTimer();
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      
      try {
        // Generate unique ID for the media
        const mediaId = newId();
        
        // Save to IndexedDB
        await saveMedia(mediaId, blob, {
          type: 'audio',
          duration: seconds,
          mimeType: blob.type,
        });
        
        // Pass the media ID instead of URL/blob
        onSubmit?.({ 
          mediaId, 
          duration: seconds,
          type: 'audio'
        });
        
        // cleanup
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
        mediaRecorderRef.current = null;
        streamRef.current = null;
        chunksRef.current = [];
        onClose?.();
      } catch (error) {
        console.error('Failed to save audio to IndexedDB:', error);
        // Fallback to old behavior
        const url = URL.createObjectURL(blob);
        onSubmit?.({ url, blob, duration: seconds });
        // cleanup
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
        mediaRecorderRef.current = null;
        streamRef.current = null;
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
      <div className="w-[min(520px,92vw)] p-4 text-center text-white relative" dir="rtl">
        {/* Recording ripple effect */}
        {recording && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="recording-ripple"></div>
            <div className="recording-ripple delay-1"></div>
            <div className="recording-ripple delay-2"></div>
          </div>
        )}
        
        <div className="flex items-center justify-center gap-3 mb-4 relative z-10">
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
        
        <div className="text-base text-white/90 mb-3 font-medium">
          {recording && !paused ? 'در حال ضبط...' : 'ضبط صوت'}
        </div>
        {errMsg && (
          <div className="mx-auto mb-4 max-w-md text-[13px] text-red-300 bg-red-500/10 p-2 rounded-lg">{errMsg}</div>
        )}

        {/* Waveform visualization when recording or paused indicator */}
        {recording && !paused && (
          <div className="flex items-center justify-center gap-1 mb-4 h-8">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-red-400 rounded-full waveform-bar"
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
        )}
        
        {/* Paused indicator */}
        {recording && paused && (
          <div className="flex items-center justify-center mb-4 h-8">
            <div className="bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500/30">
              <span className="text-yellow-400 font-medium">متوقف شد</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 relative z-10">
          {!recording ? (
            <button 
              onClick={requestAndStart} 
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
        .recording-ripple {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100px;
          height: 100px;
          border: 2px solid rgba(239, 68, 68, 0.3);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          animation: ripple 2s infinite;
        }
        
        .recording-ripple.delay-1 {
          animation-delay: 0.7s;
        }
        
        .recording-ripple.delay-2 {
          animation-delay: 1.4s;
        }
        
        @keyframes ripple {
          0% {
            width: 100px;
            height: 100px;
            opacity: 0.8;
          }
          100% {
            width: 300px;
            height: 300px;
            opacity: 0;
          }
        }
        
        .waveform-bar {
          height: 4px;
          animation: waveform 1.2s ease-in-out infinite;
        }
        
        @keyframes waveform {
          0%, 100% { height: 4px; }
          50% { height: 24px; }
        }
      `}</style>
    </div>
  );
}
