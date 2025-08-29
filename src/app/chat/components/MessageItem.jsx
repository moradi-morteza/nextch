import styles from "./MessageItem.module.scss";
import { IMAGE_MAX_WIDTH_PX, IMAGE_MAX_HEIGHT_PX } from "../config.js";

export default function MessageItem({ message }) {
  const isMe = message.from === "me";
  return (
    <li className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`${styles.bubble} px-3 py-2 text-[15px] leading-snug rounded-2xl shadow-sm ${
          isMe ? `${styles.me} bubble-me` : `${styles.them} bubble-them`
        }`}
        style={{ direction: 'rtl', unicodeBidi: 'isolate-override' }}
      >
        {message.type === "text" ? (
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
                className="block w-full h-auto"
                style={{ maxHeight: IMAGE_MAX_HEIGHT_PX + "px", objectFit: "contain" }}
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
                  <img src={img.url} alt={`img-${idx}`} className="w-full h-full object-cover block" />
                </div>
              ))}
              {message.images && message.images.length>4 && (
                <div className="relative" style={{ overflow:'hidden', borderRadius:'10px', maxWidth:'280px', maxHeight:'180px' }}>
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
        ) : (
          <audio controls className="max-w-full" src={message.content} />
        )}
        <div className="mt-1 text-[11px] text-gray-500 text-right">
          {new Date(message.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </li>
  );
}
