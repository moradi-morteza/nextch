"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ChatComposer.module.scss";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import MoodRoundedIcon from "@mui/icons-material/MoodRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import MicNoneRoundedIcon from '@mui/icons-material/MicNoneRounded';
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";

export default function ChatComposer({ onSend, onVoice, onSendImage, onSendImages, maxUploadMB = 5, showCommands = false }) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [cancelSlide, setCancelSlide] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [imagePreview, setImagePreview] = useState(null); // single
  const [images, setImages] = useState([]); // multiple [{url,file,width,height}]
  const [caption, setCaption] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const pointerStartX = useRef(0);
  const recordTimerRef = useRef(null);

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
    onSend?.(value);
    setText("");
    playSendSound();
  };

  const beginRecordTimer = () => {
    setRecordSecs(0);
    recordTimerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
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
          onVoice?.({ url, blob, duration: recordSecs });
        }
        setCancelSlide(false);
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

  // Use a textarea so Enter inserts a newline. Send with Ctrl/Cmd+Enter.
  const textAreaRef = useRef(null);
  const onKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = () => {
    const el = textAreaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const max = 120; // px, ~6 lines
    el.style.height = Math.min(el.scrollHeight, max) + "px";
  };
  useEffect(() => { autoResize(); }, [text]);

  const onPickFiles = async (evt) => {
    const files = Array.from(evt.target.files || []);
    evt.target.value = "";
    if (!files.length) return;
    const limit = maxUploadMB * 1024 * 1024;
    const valids = files.filter((f) => f.type.startsWith("image/") && f.size <= limit);
    if (!valids.length) { alert(`Only images up to ${maxUploadMB}MB are allowed.`); return; }
    // Load sizes
    const metas = await Promise.all(valids.map((f) => new Promise((res)=>{ const url = URL.createObjectURL(f); const i=new Image(); i.onload=()=>res({url,file:f,width:i.width,height:i.height}); i.src=url; })));
    if (metas.length === 1) { setImagePreview(metas[0]); setImages([]); }
    else { setImages(metas); setImagePreview(null); }
  };

  const cancelImage = () => {
    if (imagePreview?.url) URL.revokeObjectURL(imagePreview.url);
    setImagePreview(null);
    setCaption("");
  };

  const sendImage = () => {
    if (!imagePreview) return;
    onSendImage?.({ url: imagePreview.url, caption, width: imagePreview.width, height: imagePreview.height });
    setImagePreview(null);
    setCaption("");
  };

  const cancelImages = () => { images.forEach(i=> i.url && URL.revokeObjectURL(i.url)); setImages([]); setCaption(""); };
  const sendImages = () => { if (!images.length) return; onSendImages?.({ items: images, caption }); setImages([]); setCaption(""); };

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
    <div className={`tg-bottombar shrink-0 ${styles.root}`}>
      <div className="mx-auto max-w-3xl px-3">
        {recording ? (
          <div className="h-14 flex items-center gap-3">
            <div className={`text-[13px] ${cancelSlide ? "text-red-600" : "text-gray-600"}`}>
              {cancelSlide ? "Release to cancel" : `Recording ${formatTime(recordSecs)} – slide left to cancel`}
            </div>
            <div className="ml-auto">
              <IconButton
                onPointerMove={onMicPointerMove}
                onPointerUp={onMicPointerUp}
                onPointerCancel={() => stopRecording(true)}
                color={cancelSlide ? "error" : "primary"}
                aria-label="Release to stop"
                size="large"
              >
                <StopRoundedIcon />
              </IconButton>
            </div>
          </div>
        ) : images.length > 0 ? (
          <div className="w-full flex items-start gap-2 py-2">
            <div className="relative">
              <img
                src={images[0].url}
                alt="preview-0"
                className="w-24 h-24 object-cover rounded-lg"
              />
              {images.length > 1 && (
                <div className="absolute bottom-1 right-1 px-2 py-0.5 rounded-full text-xs text-white"
                     style={{ background: 'rgba(0,0,0,0.6)' }}>
                  +{images.length - 1}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <textarea
                dir="rtl"
                rows={2}
                className="w-full bg-transparent outline-none text-[15px] text-right placeholder:text-gray-400 p-2 resize-none rounded-lg"
                placeholder="کپشن اختیاری"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
              <div className="mt-2 flex gap-2 justify-end">
                <IconButton onClick={cancelImages} size="small">لغو</IconButton>
                <IconButton onClick={sendImages} color="primary" size="small">ارسال</IconButton>
              </div>
            </div>
          </div>
        ) : imagePreview ? (
          <div className="w-full flex items-start gap-2 py-2">
            <img src={imagePreview.url} alt="preview" className="w-24 h-24 object-cover rounded-lg" />
            <div className="flex-1 min-w-0">
              <textarea
                dir="rtl"
                rows={2}
                className="w-full bg-transparent outline-none text-[15px] text-right placeholder:text-gray-400 p-2 resize-none rounded-lg"
                placeholder="کپشن اختیاری"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
              <div className="mt-2 flex gap-2 justify-end">
                <IconButton onClick={cancelImage} aria-label="Cancel" size="small">لغو</IconButton>
                <IconButton onClick={sendImage} aria-label="Send image" color="primary" size="small">ارسال</IconButton>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.row}>
            <Tooltip title="Emoji">
              <IconButton aria-label="Emoji" size="medium" sx={{ p: 0.5 }}>
                <MoodRoundedIcon fontSize="medium" />
              </IconButton>
            </Tooltip>
            <textarea
              ref={textAreaRef}
              dir="rtl"
              rows={1}
              className="flex-1 min-w-0 bg-transparent outline-none text-[16px] text-right placeholder:text-gray-400 px-2 resize-none leading-6"
              placeholder="اینجا بنویسید ..."
              value={text}
              onChange={(e) => { setText(e.target.value); }}
              onKeyDown={onKeyDown}
            />
            {text.trim().length === 0 && (
              <>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={onPickFiles} />
                  <Tooltip title="Attach file">
                    <IconButton aria-label="Attach" size="medium" component="span" sx={{ p: 0.5 }}>
                      <AttachFileRoundedIcon sx={{ fontSize: 24 }} titleAccess="Attach" />
                    </IconButton>
                  </Tooltip>
                </label>
              </>
            )}
            {text.trim().length > 0 ? (
              <Tooltip title="Send">
                <IconButton aria-label="Send" color="primary" onClick={handleSend} size="medium" sx={{ p: 0.5 }}>
                  <SendRoundedIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Hold to record">
                <IconButton
                  aria-label="Hold to record"
                  onPointerDown={onMicPointerDown}
                  onPointerMove={onMicPointerMove}
                  onPointerUp={onMicPointerUp}
                  onPointerCancel={() => stopRecording(true)}
                  size="medium"
                  sx={{ p: 0.5 }}
                >
                  <MicNoneRoundedIcon sx={{ fontSize: 26 }} titleAccess="Mic" />
                </IconButton>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
