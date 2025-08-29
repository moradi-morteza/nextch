"use client";

import { useEffect, useRef, useState } from "react";

export default function ChatScreen() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, type: "text", content: "Hi!", from: "them", ts: Date.now() - 600000 },
    { id: 2, type: "text", content: "This looks like Telegram.", from: "me", ts: Date.now() - 300000 },
  ]);
  const [recording, setRecording] = useState(false);
  const [cancelSlide, setCancelSlide] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const listRef = useRef(null);
  const pointerStartX = useRef(0);
  const recordTimerRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const playSendSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g).connect(ctx.destination);
      o.type = "triangle";
      o.frequency.setValueAtTime(660, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      o.start();
      o.stop(ctx.currentTime + 0.13);
    } catch {}
  };

  const handleSend = () => {
    const value = text.trim();
    if (!value) return;
    setMessages((m) => [
      ...m,
      { id: Date.now(), type: "text", content: value, from: "me", ts: Date.now() },
    ]);
    setText("");
    playSendSound();
  };

  const beginRecordTimer = () => {
    setRecordSecs(0);
    recordTimerRef.current = setInterval(() => {
      setRecordSecs((s) => s + 1);
    }, 1000);
  };
  const endRecordTimer = () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    recordTimerRef.current = null;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : undefined;
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        endRecordTimer();
        const blob = new Blob(chunksRef.current, { type: mime || "audio/webm" });
        if (!cancelSlide) {
          const url = URL.createObjectURL(blob);
          setMessages((m) => [
            ...m,
            { id: Date.now(), type: "audio", content: url, blob, from: "me", ts: Date.now() },
          ]);
        }
        setCancelSlide(false);
        // stop all tracks
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
      beginRecordTimer();
    } catch (err) {
      console.error("Mic permission/recording failed", err);
      alert("Unable to access microphone.");
    }
  };

  const stopRecording = (cancel = false) => {
    const mr = mediaRecorderRef.current;
    setCancelSlide(cancel);
    if (mr && mr.state !== "inactive") mr.stop();
    setRecording(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onMicPointerDown = (e) => {
    pointerStartX.current = e.clientX ?? (e.touches?.[0]?.clientX || 0);
    startRecording();
  };
  const onMicPointerMove = (e) => {
    if (!recording) return;
    const x = e.clientX ?? (e.touches?.[0]?.clientX || 0);
    const dx = pointerStartX.current - x; // slide left to cancel
    setCancelSlide(dx > 80);
  };
  const onMicPointerUp = () => {
    if (!recording) return;
    stopRecording(cancelSlide);
  };

  const formatTime = (s) => {
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    <main className="h-[100dvh] w-full flex flex-col bg-white overflow-hidden">
      {/* Header (fixed position within layout; does not scroll) */}
      <header className="w-full tg-topbar shrink-0">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <div className="size-9 rounded-full bg-blue-500 text-white grid place-items-center font-semibold">M</div>
          <div className="leading-tight">
            <div className="font-medium">Morteza</div>
            <div className="text-xs text-gray-500">online</div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <section
        ref={listRef}
        className="flex-1 overflow-y-auto mx-auto w-full max-w-3xl px-3 py-3 bg-center bg-no-repeat bg-cover tg-gradient-overlay"
        style={{ backgroundImage: "url(/background.jpg)" }}
      >
        <ul className="space-y-1.5">
          {messages.map((m) => (
            <li key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] px-3 py-2 text-[15px] leading-snug rounded-2xl shadow-sm ${
                  m.from === "me"
                    ? "bg-[#d1e9ff] text-gray-900 rounded-br-sm"
                    : "bg-[#f1f5f9] text-gray-900 rounded-bl-sm"
                }`}
              >
                {m.type === "text" ? (
                  <span>{m.content}</span>
                ) : (
                  <audio controls className="max-w-full" src={m.content} />
                )}
                <div className="mt-1 text-[11px] text-gray-500 text-right">{new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Composer — styled like Telegram bottom bar (non-scrolling) */}
      <div className="w-full tg-bottombar shrink-0">
        <div className="mx-auto max-w-3xl px-2">
          {/* Recording state replaces the input row */}
          {recording ? (
            <div className="h-14 flex items-center gap-3">
              <div className={`text-[13px] ${cancelSlide ? "text-red-600" : "text-gray-600"}`}>
                {cancelSlide ? "Release to cancel" : `Recording ${formatTime(recordSecs)} – slide left to cancel`}
              </div>
              <div className="ml-auto">
                <button
                  type="button"
                  aria-label="Release to stop"
                  onPointerMove={onMicPointerMove}
                  onPointerUp={onMicPointerUp}
                  onPointerCancel={() => stopRecording(true)}
                  className={`p-2 ${cancelSlide ? "text-red-600" : "text-blue-600"}`}
                >
                  {/* stop square */}
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-14 flex items-center gap-1">
              {/* Emoji on the far left */}
              <button type="button" aria-label="Emoji" className="p-2 text-gray-500 hover:text-gray-700">
                <span className="material-symbols-rounded text-[26px]">mood</span>
              </button>

              {/* Plain input area in the middle */}
              <input
                className="flex-1 bg-transparent outline-none text-[16px] placeholder:text-gray-400 px-2"
                placeholder="Message"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
              />

              {/* Commands and attach only when input empty (Telegram behavior) */}
              {text.trim().length === 0 && (
                <>
                  <button type="button" aria-label="Commands" className="p-2 text-gray-500 hover:text-gray-700">
                    <span className="material-symbols-rounded text-[24px]">smart_toy</span>
                  </button>
                  <label className="p-2 text-gray-500 hover:text-gray-700 cursor-pointer">
                    <input type="file" accept="image/*,video/*,audio/*" multiple className="hidden" />
                    <span className="material-symbols-rounded text-[24px]">attach_file</span>
                  </label>
                </>
              )}

              {/* Rightmost: Send when text, else Mic (hold to record) */}
              {text.trim().length > 0 ? (
                <button
                  type="button"
                  aria-label="Send"
                  onClick={handleSend}
                  className="p-2 text-[#3390ec]"
                >
                  <span className="material-symbols-rounded text-[28px]">send</span>
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="Hold to record"
                  onPointerDown={onMicPointerDown}
                  onPointerMove={onMicPointerMove}
                  onPointerUp={onMicPointerUp}
                  onPointerCancel={() => stopRecording(true)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <span className="material-symbols-rounded text-[26px]">mic</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
