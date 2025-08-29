"use client";

import { useEffect, useRef, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import ChatHeader from "./components/ChatHeader.jsx";
import ChatBackground from "./components/ChatBackground.jsx";
import MessageItem from "./components/MessageItem.jsx";
import ChatComposer from "./components/ChatComposer.jsx";

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { id: 1, type: "text", content: "Hi!", from: "them", ts: Date.now() - 600000 },
    { id: 2, type: "text", content: "This looks like Telegram.", from: "me", ts: Date.now() - 300000 },
  ]);
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const handleSend = (value) => {
    setMessages((m) => [
      ...m,
      { id: Date.now(), type: "text", content: value, from: "me", ts: Date.now() },
    ]);
  };

  const handleVoice = ({ url, blob, duration }) => {
    setMessages((m) => [
      ...m,
      { id: Date.now(), type: "audio", content: url, blob, from: "me", ts: Date.now(), duration },
    ]);
  };

  const theme = createTheme({
    palette: {
      primary: { main: "#3390ec" },
    },
    shape: { borderRadius: 12 },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <main className="h-[100dvh] w-full flex flex-col bg-white overflow-hidden">
        <ChatHeader title="Morteza" status="online" avatar="M" />

        <ChatBackground scrollRef={listRef} image="/background.jpg">
          <ul className="space-y-1.5">
            {messages.map((m) => (
              <MessageItem key={m.id} message={m} />
            ))}
          </ul>
        </ChatBackground>

        <ChatComposer onSend={handleSend} onVoice={handleVoice} showCommands={false} />
      </main>
    </ThemeProvider>
  );
}
