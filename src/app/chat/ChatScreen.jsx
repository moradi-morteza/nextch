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
    makeAudio({
      url: "https://budget.storage.iran.liara.space/sample.m4a",
      duration: 6,
      from: "them"
    }),
    makeVideo({
      url: "https://budget.storage.iran.liara.space/Recording%202025-01-11%20100153.mp4",
      duration: 45,
      width: 720,
      height: 1280,
      from: "them"
    }),
    makeSystem({ text: "سلام دوست گرامی شما میتوانید در این گفتگو به خوبی شرکت کنید و بهترین و برترین نمایشن نامه های یی که برای شما نوشته شده است را پیدا کنید." }),
  ]);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState(new Set());
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    const scrollToBottom = () => {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    };
    
    // Scroll immediately
    scrollToBottom();
    
    // Also scroll after a delay to account for video/media loading
    const timeoutId = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);

  const handleSend = (value) => {
    const newMessageId = Date.now();
    setMessages((m) => [
      ...m,
      { id: newMessageId, type: "text", content: value, from: "me", ts: newMessageId },
    ]);
    setNewMessageIds(prev => new Set([...prev, newMessageId]));
  };

  const handleVoice = ({ url, blob, duration }) => {
    const newMessageId = Date.now();
    setMessages((m) => [
      ...m,
      { id: newMessageId, type: "audio", content: url, blob, from: "me", ts: newMessageId, duration },
    ]);
    setNewMessageIds(prev => new Set([...prev, newMessageId]));
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
          <div className="max-w-3xl mx-auto w-full">
            <ul className="space-y-1.5">
              {messages.map((m, index) => (
                <MessageItem
                  key={m.id}
                  message={m}
                  selectionMode={selectionMode}
                  isSelected={selectedMessages.includes(m.id)}
                  onSelect={() => handleMessageSelect(m.id)}
                  isNewMessage={newMessageIds.has(m.id)}
                  messageIndex={index}
                />
              ))}
            </ul>
          </div>
        </ChatBackground>

        <ChatComposer
          onSendMessage={(text) => {
            const newMessageId = Date.now();
            const newMessage = { ...makeText({ text }), id: newMessageId };
            setMessages((m) => [...m, newMessage]);
            setNewMessageIds(prev => new Set([...prev, newMessageId]));
          }}
          onVoiceMessage={({ mediaId, duration, url }) => {
            const newMessageId = Date.now();
            const newMessage = { ...makeAudio({ mediaId, duration, url }), id: newMessageId };
            setMessages((m) => [...m, newMessage]);
            setNewMessageIds(prev => new Set([...prev, newMessageId]));
          }}
          onVideoMessage={({ mediaId, duration, width, height, url }) => {
            const newMessageId = Date.now();
            const newMessage = { ...makeVideo({ mediaId, duration, width, height, url }), id: newMessageId };
            setMessages((m) => [...m, newMessage]);
            setNewMessageIds(prev => new Set([...prev, newMessageId]));
          }}
          onSendImage={({ url, caption, width, height }) => {
            const newMessageId = Date.now();
            const newMessage = { ...makeImage({ image: { url, width, height }, caption }), id: newMessageId };
            setMessages((m) => [...m, newMessage]);
            setNewMessageIds(prev => new Set([...prev, newMessageId]));
          }}
          onSendImages={({ items, caption }) => {
            const newMessageId = Date.now();
            const newMessage = {
              ...(items.length <= 1
                ? makeImage({ image: items[0], caption })
                : makeImageGroup({ images: items, caption })),
              id: newMessageId
            };
            setMessages((m) => [...m, newMessage]);
            setNewMessageIds(prev => new Set([...prev, newMessageId]));
          }}
          onSendFile={({ file, name, size, type, caption }) => {
            const newMessageId = Date.now();
            const newMessage = { ...makeFile({ file, name, size, type, caption }), id: newMessageId };
            setMessages((m) => [...m, newMessage]);
            setNewMessageIds(prev => new Set([...prev, newMessageId]));
          }}
          maxUploadMB={MAX_UPLOAD_MB}
          showCommands={false}
        />
      </main>
    </ThemeProvider>
  );
}
