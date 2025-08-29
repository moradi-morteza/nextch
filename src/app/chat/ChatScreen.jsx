"use client";

import { useEffect, useRef, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import ChatHeader from "./components/ChatHeader.jsx";
import ChatBackground from "./components/ChatBackground.jsx";
import MessageItem from "./components/MessageItem.jsx";
import ChatComposer from "./components/ChatComposer.jsx";
import { makeText, makeImage, makeImageGroup, makeAudio, makeSystem } from "./messages.js";
import { MAX_UPLOAD_MB } from "./config.js";

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    makeSystem({ text: "Today" }),
    makeText({ text: "سلام دوست من یه خبر خوب برات دارم ویزایی که منتظرش بودی بالاخره صادر شد!", from: "them" }),
    makeText({ text: "درورد بر تو حالت خوبه؟ واقعا ای جان" }),
    makeSystem({ text: "سلام دوست گرامی شما میتوانید در این گفتگو به خوبی شرکت کنید و بهترین و برترین نمایشن نامه های یی که برای شما نوشته شده است را پیدا کنید." }),
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
    typography: {
      fontFamily:
        '"Yekan Bakh FaNum", -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontFamily:
              '"Yekan Bakh FaNum", -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji"',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <main className="h-[100dvh] w-full flex flex-col bg-white overflow-hidden">
        <ChatHeader title="Morteza" status="online" avatar="M" />

        <ChatBackground scrollRef={listRef}>
          <ul className="space-y-1.5">
            {messages.map((m) => (
              <MessageItem key={m.id} message={m} />
            ))}
          </ul>
        </ChatBackground>

        <ChatComposer
          onSendMessage={(text) =>
            setMessages((m) => [...m, makeText({ text })])
          }
          onVoiceMessage={({ url, duration }) =>
            setMessages((m) => [...m, makeAudio({ url, duration })])
          }
          onSendImages={({ items, caption }) =>
            setMessages((m) => [
              ...m,
              items.length <= 1
                ? makeImage({ image: items[0], caption })
                : makeImageGroup({ images: items, caption }),
            ])
          }
          maxUploadMB={MAX_UPLOAD_MB}
          showCommands={false}
        />
      </main>
    </ThemeProvider>
  );
}
