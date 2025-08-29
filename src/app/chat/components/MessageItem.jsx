import styles from "./MessageItem.module.scss";

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
