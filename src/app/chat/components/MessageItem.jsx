import styles from "./MessageItem.module.scss";
import { IMAGE_MAX_WIDTH_PX, IMAGE_MAX_HEIGHT_PX } from "../config.js";
import dynamic from "next/dynamic";
import { useState } from "react";
import ImageSlider from "./ImageSlider.jsx";

const AudioMessage = dynamic(() => import("./AudioMessage.jsx"), { ssr: false });

export default function MessageItem({ message }) {
  const isMe = message.from === "me";
  const isSystem = message.type === 'system' || message.from === 'system';
  const [showSlider, setShowSlider] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const openSlider = (images, idx = 0) => {
    if (!images || images.length === 0) return;
    setStartIndex(idx);
    setShowSlider(true);
  };
  return (
    <li className={`flex items-center ${isSystem ? 'justify-center' : isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={
          isSystem
            ? "px-2 py-2 text-[14px] leading-4 rounded-lg bg-black/45 text-white mx-auto backdrop-blur-sm"
            : `${styles.bubble} px-3 py-2 text-[15px] leading-snug rounded-2xl shadow-sm ${
                isMe ? `${styles.me} bubble-me` : `${styles.them} bubble-them`
              }`
        }
        style={
          isSystem
            ? undefined
            : { direction: 'rtl', unicodeBidi: 'isolate-override', minWidth: '50%' }
        }
      >
        {isSystem ? (
          <span className="whitespace-pre-wrap text-center block">{message.content}</span>
        ) : message.type === "text" ? (
          <span className="whitespace-pre-wrap break-words text-right block">
            {message.content}
          </span>
        ) : message.type === "image" ? (
          <div className="flex flex-col items-start gap-1" style={{ maxWidth: IMAGE_MAX_WIDTH_PX + 'px', minWidth: '50%' }}>
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
                className="block w-full h-auto cursor-zoom-in"
                style={{ maxHeight: IMAGE_MAX_HEIGHT_PX + "px", objectFit: "contain" }}
                onClick={() => openSlider([{ url: message.content, caption: message.caption }], 0)}
              />
            </div>
            {message.caption && (
              <span className="text-right block whitespace-pre-wrap break-words break-words" style={{ maxWidth: IMAGE_MAX_WIDTH_PX + 'px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {message.caption}
              </span>
            )}
          </div>
        ) : message.type === "image_group" ? (
          <div className="flex flex-col items-start gap-1" style={{ maxWidth: IMAGE_MAX_WIDTH_PX + 'px', minWidth: '50%' }}>
            <div className="grid gap-1" style={{ gridTemplateColumns: (message.images?.length || 0) <= 1 ? '1fr' : '1fr 1fr' }}>
              {(message.images || []).slice(0,4).map((img, idx)=> (
                <div key={idx} className={(message.images?.length===3 && idx===0)? 'col-span-2 md:col-span-1 row-span-2':''} style={{ overflow:'hidden', borderRadius:'10px', maxWidth:'280px', maxHeight:'180px' }}>
                  <img src={img.url} alt={`img-${idx}`} className="w-full h-full object-cover block cursor-zoom-in" onClick={() => openSlider(message.images, idx)} />
                </div>
              ))}
              {message.images && message.images.length>4 && (
                <div className="relative cursor-zoom-in" style={{ overflow:'hidden', borderRadius:'10px', maxWidth:'280px', maxHeight:'180px' }} onClick={() => openSlider(message.images, 4)}>
                  <img src={message.images[4].url} alt="more" className="w-full h-full object-cover block opacity-70" />
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
        ) : message.type === "audio" ? (
          <AudioMessage url={message.content} duration={message.meta?.duration} variant={isMe ? 'me' : 'them'} />
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
        {showSlider && (
          <ImageSlider
            images={(message.type === 'image_group' ? message.images : [{ url: message.content, caption: message.caption }])}
            startIndex={startIndex}
            onClose={() => setShowSlider(false)}
          />
        )}
        {!isSystem && (
          <div className="mt-1 text-[11px] text-gray-500 text-right">
            {new Date(message.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>
    </li>
  );
}
