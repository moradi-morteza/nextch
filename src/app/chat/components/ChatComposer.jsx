"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ChatComposer.module.scss";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import MicNoneRoundedIcon from '@mui/icons-material/MicNoneRounded';
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VoiceRecorder from "./VoiceRecorder.jsx";
import VideoRecorder from "./VideoRecorder.jsx";

export default function ChatComposer({ onSendMessage, onVoiceMessage, onVideoMessage, onSendImage, onSendImages, onSendFile, maxUploadMB = 5, showCommands = false }) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [cancelSlide, setCancelSlide] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [imagePreview, setImagePreview] = useState(null); // single
  const [images, setImages] = useState([]); // multiple [{url,file,width,height}]
  const [caption, setCaption] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [filePreview, setFilePreview] = useState(null); // for file attachments
  const [isMobile, setIsMobile] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const pointerStartX = useRef(0);
  const recordTimerRef = useRef(null);
  const attachMenuRef = useRef(null);

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
    onSendMessage?.(value);
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
          onVoiceMessage?.({ url, blob, duration: recordSecs });
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

  // Detect device capabilities
  useEffect(() => {
    // Check if mobile device
    const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(checkMobile);

    // Check camera availability
    const checkCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasVideoDevice = devices.some(device => device.kind === 'videoinput');
          setHasCamera(hasVideoDevice);
        }
      } catch (error) {
        setHasCamera(false);
      }
    };
    
    checkCamera();
  }, []);

  // Close attach menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) {
        setShowAttachMenu(false);
      }
    };
    if (showAttachMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAttachMenu]);

  const onPickImages = async (evt) => {
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
    setShowAttachMenu(false);
  };

  const onPickFile = (evt) => {
    const file = evt.target.files?.[0];
    evt.target.value = "";
    if (!file) return;
    const limit = 10 * 1024 * 1024; // 10MB for files
    if (file.size > limit) {
      alert("File size must be less than 10MB");
      return;
    }
    setFilePreview({ file, name: file.name, size: file.size, type: file.type });
    setShowAttachMenu(false);
  };

  const onCameraCapture = async (evt) => {
    const file = evt.target.files?.[0];
    evt.target.value = "";
    if (!file) return;
    const limit = maxUploadMB * 1024 * 1024;
    if (file.size > limit) {
      alert(`Image must be less than ${maxUploadMB}MB`);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImagePreview({url, file, width: img.width, height: img.height});
      setImages([]);
    };
    img.src = url;
    setShowAttachMenu(false);
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

  const cancelFile = () => {
    setFilePreview(null);
    setCaption("");
  };

  const sendFile = () => {
    if (!filePreview) return;
    onSendFile?.({ file: filePreview.file, name: filePreview.name, size: filePreview.size, type: filePreview.type, caption });
    setFilePreview(null);
    setCaption("");
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

  const truncateFileName = (fileName, maxLength = 15) => {
    if (fileName.length <= maxLength) return fileName;
    const extension = fileName.split('.').pop();
    const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.slice(0, maxLength - extension.length - 4); // -4 for "..." and "."
    return `${truncatedName}...${extension}`;
  };

  return (
    <div className={`tg-bottombar shrink-0 ${styles.root}`}>
      <div className="mx-auto max-w-3xl px-2">
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
        ) : filePreview ? (
          <div className="w-full flex items-start gap-2 py-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <InsertDriveFileRoundedIcon sx={{ fontSize: 20, color: 'white' }} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-800" dir="ltr" title={filePreview.name}>
                  {truncateFileName(filePreview.name)}
                </span>
                <span className="text-xs text-gray-500">{(filePreview.size / 1024 / 1024).toFixed(1)}MB</span>
              </div>
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
                <IconButton onClick={cancelFile} size="small">لغو</IconButton>
                <IconButton onClick={sendFile} color="primary" size="small">ارسال</IconButton>
              </div>
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
            <Tooltip title="Record video">
              <IconButton aria-label="Record video" size="medium" sx={{ p: 0.5 }} onClick={() => setShowVideoRecorder(true)}>
                <VideocamRoundedIcon fontSize="medium" />
              </IconButton>
            </Tooltip>
            <textarea
              ref={textAreaRef}
              dir="rtl"
              rows={1}
              className="flex-1 min-w-0 bg-transparent outline-none text-[16px] text-right placeholder:text-gray-400 px-2 resize-none leading-6 self-center"
              placeholder="اینجا بنویسید ..."
              value={text}
              onChange={(e) => { setText(e.target.value); }}
              onKeyDown={onKeyDown}
            />
            {text.trim().length === 0 && (
              <div className="relative" ref={attachMenuRef}>
                <Tooltip title="Attach file">
                  <IconButton 
                    aria-label="Attach" 
                    size="medium" 
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                    sx={{ p: 0.5 }}
                  >
                    <AttachFileRoundedIcon sx={{ fontSize: 24 }} titleAccess="Attach" />
                  </IconButton>
                </Tooltip>
                {showAttachMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border p-1 min-w-[160px]">
                    {/* Camera option - only show on mobile with camera */}
                    {isMobile && hasCamera && (
                      <label className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer">
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onCameraCapture} />
                        <PhotoCameraRoundedIcon sx={{ fontSize: 20, color: '#666' }} />
                        <span className="text-sm text-gray-700">دوربین</span>
                      </label>
                    )}
                    
                    {/* Images option - different labels for mobile vs desktop */}
                    <label className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer">
                      <input type="file" accept="image/*" multiple className="hidden" onChange={onPickImages} />
                      {isMobile ? (
                        <>
                          <PhotoLibraryRoundedIcon sx={{ fontSize: 20, color: '#666' }} />
                          <span className="text-sm text-gray-700">گالری</span>
                        </>
                      ) : (
                        <>
                          <ImageRoundedIcon sx={{ fontSize: 20, color: '#666' }} />
                          <span className="text-sm text-gray-700">تصاویر</span>
                        </>
                      )}
                    </label>
                    
                    {/* File option - always available */}
                    <label className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer">
                      <input type="file" className="hidden" onChange={onPickFile} />
                      <InsertDriveFileRoundedIcon sx={{ fontSize: 20, color: '#666' }} />
                      <span className="text-sm text-gray-700">فایل</span>
                    </label>
                  </div>
                )}
              </div>
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
                  aria-label="Open recorder"
                  onClick={() => setShowRecorder(true)}
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
      {showRecorder && (
        <VoiceRecorder
          open
          onClose={() => setShowRecorder(false)}
          onSubmit={({ url, blob, duration }) => {
            onVoiceMessage?.({ url, duration, blob });
            setShowRecorder(false);
          }}
        />
      )}
      {showVideoRecorder && (
        <VideoRecorder
          open
          onClose={() => setShowVideoRecorder(false)}
          onSubmit={({ url, blob, duration, width, height }) => {
            onVideoMessage?.({ url, duration, width, height, blob });
            setShowVideoRecorder(false);
          }}
        />
      )}
    </div>
  );
}
