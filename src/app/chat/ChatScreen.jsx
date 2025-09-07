"use client";

import { useEffect, useRef, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import ChatHeader from "./components/ChatHeader.jsx";
import ChatBackground from "./components/ChatBackground.jsx";
import MessageItem from "./components/MessageItem.jsx";
import ChatComposer from "./components/ChatComposer.jsx";
import { makeText, makeImage, makeImageGroup, makeAudio, makeVideo, makeFile, makeSystem } from "./messages.js";
import { MAX_UPLOAD_MB } from "./config.js";
import IconButton from "@mui/material/IconButton";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    makeSystem({ text: "Today" }),
    makeText({ text: "سلام دوست من یه خبر خوب برات دارم ویزایی که منتظرش بودی بالاخره صادر شد!", from: "them" }),
    makeText({ text: "درورد بر تو حالت خوبه؟ واقعا ای جان" }),
    makeSystem({ text: "سلام دوست گرامی شما میتوانید در این گفتگو به خوبی شرکت کنید و بهترین و برترین نمایشن نامه های یی که برای شما نوشته شده است را پیدا کنید." }),
  ]);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
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

  const handleMessageSelect = (messageId) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedMessages([messageId]);
    } else {
      setSelectedMessages(prev => 
        prev.includes(messageId) 
          ? prev.filter(id => id !== messageId)
          : [...prev, messageId]
      );
    }
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedMessages([]);
  };

  const handleDeleteSelected = () => {
    setMessages(prev => prev.filter(msg => !selectedMessages.includes(msg.id)));
    setSelectionMode(false);
    setSelectedMessages([]);
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
        {selectionMode ? (
          <div className="flex items-center justify-between px-4 py-3 bg-white shadow-md">
            <div className="flex items-center gap-2">
              <IconButton onClick={handleCancelSelection} size="small" sx={{ color: '#666' }}>
                <CloseRoundedIcon />
              </IconButton>
              <span className="text-sm font-medium text-gray-800">{selectedMessages.length} انتخاب شده</span>
            </div>
            <IconButton onClick={handleDeleteSelected} size="small" sx={{ color: '#ef4444' }}>
              <DeleteRoundedIcon />
            </IconButton>
          </div>
        ) : (
          <ChatHeader title="Morteza" status="online" avatar="M" />
        )}

        <ChatBackground scrollRef={listRef}>
          <ul className="space-y-1.5">
            {messages.map((m) => (
              <MessageItem 
                key={m.id} 
                message={m} 
                selectionMode={selectionMode}
                isSelected={selectedMessages.includes(m.id)}
                onSelect={() => handleMessageSelect(m.id)}
              />
            ))}
          </ul>
        </ChatBackground>

        <ChatComposer
          onSendMessage={(text) =>
            setMessages((m) => [...m, makeText({ text })])
          }
          onVoiceMessage={({ mediaId, duration, url }) =>
            setMessages((m) => [...m, makeAudio({ mediaId, duration, url })])
          }
          onVideoMessage={({ mediaId, duration, width, height, url }) =>
            setMessages((m) => [...m, makeVideo({ mediaId, duration, width, height, url })])
          }
          onSendImage={({ url, caption, width, height }) =>
            setMessages((m) => [...m, makeImage({ image: { url, width, height }, caption })])
          }
          onSendImages={({ items, caption }) =>
            setMessages((m) => [
              ...m,
              items.length <= 1
                ? makeImage({ image: items[0], caption })
                : makeImageGroup({ images: items, caption }),
            ])
          }
          onSendFile={({ file, name, size, type, caption }) =>
            setMessages((m) => [...m, makeFile({ file, name, size, type, caption })])
          }
          maxUploadMB={MAX_UPLOAD_MB}
          showCommands={false}
        />
      </main>
    </ThemeProvider>
  );
}
