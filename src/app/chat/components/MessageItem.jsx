export default function MessageItem({ message }) {
  const isMe = message.from === "me";
  return (
    <li className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] px-3 py-2 text-[15px] leading-snug rounded-2xl shadow-sm ${
          isMe ? "rounded-br-sm bubble-me" : "rounded-bl-sm bubble-them"
        }`}
      >
        {message.type === "text" ? (
          <span>{message.content}</span>
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

