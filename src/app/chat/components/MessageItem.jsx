import styles from "./MessageItem.module.scss";
import { IMAGE_MAX_WIDTH_PX, IMAGE_MAX_HEIGHT_PX } from "../config.js";
import dynamic from "next/dynamic";
import { useState } from "react";
import ImageSlider from "./ImageSlider.jsx";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";

const AudioMessage = dynamic(() => import("./AudioMessage.jsx"), { ssr: false });
const VideoMessage = dynamic(() => import("./VideoMessage.jsx"), { ssr: false });

export default function MessageItem({ message, selectionMode = false, isSelected = false, onSelect, isNewMessage = false, messageIndex = 0, totalMessages = 0 }) {
  const isMe = message.from === "me";
  const isSystem = message.type === 'system' || message.from === 'system';
  const [showSlider, setShowSlider] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const openSlider = (images, idx = 0) => {
    if (!images || images.length === 0) return;
    setStartIndex(idx);
    setShowSlider(true);
  };

  const truncateFileName = (fileName, maxLength = 35) => {
    if (!fileName || fileName.length <= maxLength) return fileName;
    const extension = fileName.split('.').pop();
    const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.slice(0, maxLength - extension.length - 4); // -4 for "..." and "."
    return `${truncatedName}...${extension}`;
  };

  const handleFileClick = (file, filename) => {
    if (file instanceof File || file instanceof Blob) {
      // Create temporary URL and download
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (typeof file === 'string') {
      // If it's already a URL, open it
      window.open(file, '_blank');
    }
  };
  const canSelect = isMe && !isSystem; // Only user's own non-system messages can be selected
  const [longPressTimer, setLongPressTimer] = useState(null);
  
  const handleMessageClick = (e) => {
    if (selectionMode && canSelect) {
      e.preventDefault();
      e.stopPropagation();
      onSelect?.();
    }
  };

  const handleRightClick = (e) => {
    if (canSelect && !selectionMode) {
      e.preventDefault();
      e.stopPropagation();
      onSelect?.();
    }
  };

  const handleTouchStart = (e) => {
    if (!canSelect) return;
    
    const timer = setTimeout(() => {
      if (!selectionMode) {
        e.preventDefault();
        e.stopPropagation();
        // Prevent text selection
        document.getSelection().removeAllRanges();
        onSelect?.();
      }
    }, 500);
    
    setLongPressTimer(timer);
  };

  const handleTouchEnd = (e) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleTouchMove = (e) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const isUnread = !message.is_read && !isMe && !isSystem;

  return (
    <li 
      className={`flex items-center ${isSystem ? 'justify-center' : isMe ? "justify-end" : "justify-start"} ${isNewMessage ? 'animate-slide-in' : 'animate-fade-in'} ${isUnread ? 'relative' : ''}`}
      style={{ animationDelay: isNewMessage ? '0ms' : `${(totalMessages - messageIndex - 1) * 50}ms` }}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full z-10"></div>
      )}
      {selectionMode && canSelect && (
        <div className="mr-2">
          <div 
            className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center cursor-pointer ${
              isSelected ? 'bg-green-500' : 'bg-transparent'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
          >
            {isSelected && (
              <CheckRoundedIcon sx={{ fontSize: 16, color: 'white' }} />
            )}
          </div>
        </div>
      )}
      <div
        className={
          isSystem || message.type === 'video'
            ? (isSystem ? "px-2 py-2 text-[14px] leading-4 rounded-lg bg-black/45 text-white mx-auto backdrop-blur-sm" : "")
            : `${styles.bubble} px-3 py-2 text-[15px] leading-snug rounded-2xl shadow-sm ${
                isMe ? `${styles.me} bubble-me` : `${styles.them} bubble-them`
              } ${selectionMode && canSelect ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-blue-400' : ''}`
        }
        onClick={handleMessageClick}
        onContextMenu={handleRightClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        style={{
          ...((isSystem || message.type === 'video') ? undefined : {
            direction: 'rtl',
            unicodeBidi: 'isolate-override',
            ...(message.type === 'audio' ? { minWidth: '50%' } : {}),
          }),
          ...(selectionMode && canSelect ? { userSelect: 'none', WebkitUserSelect: 'none' } : {})
        }}
      >
        {isSystem ? (
          <span className="whitespace-pre-wrap text-center block">{message.content}</span>
        ) : message.type === "text" ? (
          <span className="whitespace-pre-wrap break-words text-right block">
            {message.content}
          </span>
        ) : message.type === "image" ? (
          <div className="flex flex-col items-start gap-1" style={{ maxWidth: IMAGE_MAX_WIDTH_PX + 'px' }}>
            <div
              className="rounded-lg overflow-hidden"
              style={{
                maxWidth: IMAGE_MAX_WIDTH_PX + "px",
                maxHeight: IMAGE_MAX_HEIGHT_PX + "px",
              }}
            >
              <img
                src={message.content}
                alt={message.caption || "image"}
                className="block w-full h-auto cursor-zoom-in select-none"
                style={{ 
                  maxHeight: IMAGE_MAX_HEIGHT_PX + "px", 
                  objectFit: "contain",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  WebkitTouchCallout: "none"
                }}
                onClick={() => openSlider([{ url: message.content, caption: message.caption }], 0)}
                onContextMenu={(e) => e.preventDefault()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                draggable={false}
              />
            </div>
            {message.caption && (
              <span className="text-right block whitespace-pre-wrap break-words break-words" style={{ maxWidth: IMAGE_MAX_WIDTH_PX + 'px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {message.caption}
              </span>
            )}
          </div>
        ) : message.type === "image_group" ? (
          <div className="flex flex-col items-start gap-1" style={{ maxWidth: IMAGE_MAX_WIDTH_PX + 'px' }}>
            <div className="grid gap-1" style={{ gridTemplateColumns: (message.images?.length || 0) <= 1 ? '1fr' : '1fr 1fr' }}>
              {(message.images || []).slice(0,4).map((img, idx)=> (
                <div key={idx} className={(message.images?.length===3 && idx===0)? 'col-span-2 md:col-span-1 row-span-2':''} style={{ overflow:'hidden', borderRadius:'10px', maxWidth:'280px', maxHeight:'180px' }}>
                  <img 
                    src={img.url} 
                    alt={`img-${idx}`} 
                    className="w-full h-full object-cover block cursor-zoom-in select-none" 
                    onClick={() => openSlider(message.images, idx)}
                    onContextMenu={(e) => e.preventDefault()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    draggable={false}
                    style={{
                      userSelect: "none",
                      WebkitUserSelect: "none",
                      WebkitTouchCallout: "none"
                    }}
                  />
                </div>
              ))}
              {message.images && message.images.length>4 && (
                <div className="relative cursor-zoom-in" style={{ overflow:'hidden', borderRadius:'10px', maxWidth:'280px', maxHeight:'180px' }} onClick={() => openSlider(message.images, 4)}>
                  <img 
                    src={message.images[4].url} 
                    alt="more" 
                    className="w-full h-full object-cover block opacity-70 select-none"
                    onContextMenu={(e) => e.preventDefault()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    draggable={false}
                    style={{
                      userSelect: "none",
                      WebkitUserSelect: "none",
                      WebkitTouchCallout: "none"
                    }}
                  />
                  <div className="absolute inset-0 grid place-items-center text-white text-lg font-semibold" style={{ background:'rgba(0,0,0,0.4)' }}>+{message.images.length-4}</div>
                </div>
              )}
            </div>
            {message.caption && (
              <span className="text-right block whitespace-pre-wrap break-words" style={{ maxWidth: IMAGE_MAX_WIDTH_PX + 'px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {message.caption}
              </span>
            )}
          </div>
        ) : message.type === "file" ? (
          <div className="flex flex-col items-start gap-1 w-full" style={{ maxWidth: '300px' }}>
            <div 
              className="flex items-center gap-3 w-full cursor-pointer hover:bg-gray-50 rounded-lg p-1 transition-colors"
              onClick={() => handleFileClick(message.content, message.name)}
            >
              <div className="flex-1 min-w-0 overflow-hidden" dir="ltr">
                <div className="text-sm font-medium text-gray-800 truncate" title={message.name}>
                  {truncateFileName(message.name)}
                </div>
                <div className="text-xs text-gray-500">{message.size ? `${(message.size / 1024 / 1024).toFixed(1)}MB` : ''}</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <InsertDriveFileRoundedIcon sx={{ fontSize: 24, color: 'white' }} />
              </div>
            </div>
            {message.caption && (
              <span className="text-right block whitespace-pre-wrap break-words w-full" style={{ maxWidth: '300px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {message.caption}
              </span>
            )}
          </div>
        ) : message.type === "audio" ? (
          <AudioMessage 
            url={message.content} 
            mediaId={message.mediaId} 
            duration={message.meta?.duration} 
            variant={isMe ? 'me' : 'them'} 
            timestamp={message.ts} 
          />
        ) : message.type === "video" ? (
          <VideoMessage 
            url={message.content} 
            mediaId={message.mediaId} 
            duration={message.meta?.duration} 
            width={message.meta?.width} 
            height={message.meta?.height} 
            variant={isMe ? 'me' : 'them'} 
            timestamp={message.ts} 
          />
        ) : (
          <audio controls className="max-w-full" src={message.content} />
        )}
        {showSlider && (
          <ImageSlider
            images={(message.type === 'image_group' ? message.images : [{ url: message.content, caption: message.caption }])}
            startIndex={startIndex}
            onClose={() => setShowSlider(false)}
          />
        )}
        {!isSystem && message.type !== 'audio' && message.type !== 'video' && (
          <div className="mt-1 text-[11px] text-gray-500 text-right">
            {(() => {
              const date = new Date(message.ts);
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              return `${hours}:${minutes}`;
            })()}
          </div>
        )}
      </div>
    </li>
  );
}
