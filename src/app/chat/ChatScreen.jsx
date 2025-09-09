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
    makeText({ text: "سلام وقت بخیر، من می‌خواستم بدونم برای کاهش وزن چه رژیمی بهتره؟" }),
    makeText({ text: "آیا لازمه حتما نان و برنج رو کامل حذف کنم؟ من بعضی وقتا خیلی هوس شیرینی می‌کنم، باید کلا قطعش کنم؟" }),
    makeText({ text: "فعالیت بدنی من کمه، این موضوع چقدر توی رژیم اثر داره؟" }),




    makeText({ text: "سلام، وقت شما هم بخیر. اول اینکه هیچ رژیمی قرار نیست خیلی سختگیرانه باشه، هدف تعادل هست نه حذف کامل.", from: "them" }),
    makeText({ text: "نان و برنج رو لازم نیست حذف کنید، فقط مقدار و نوعش مهمه. نان سبوس‌دار یا برنج قهوه‌ای بهتره. \n شیرینی رو می‌تونید گهگاهی و در مقدار کم مصرف کنید، ولی جایگزین‌های سالم مثل میوه خشک یا شکلات تلخ بهتر هست. \n فعالیت بدنی خیلی تأثیر داره؛ حتی پیاده‌روی نیم ساعت در روز می‌تونه نتیجه رژیم رو چند برابر کنه.", from: "them" }),
    makeText({ text: "پیشنهاد می‌کنم یک برنامه شخصی‌سازی‌شده با توجه به قد، وزن و شرایط بدنیتون تنظیم بشه تا بهترین نتیجه رو بگیرید.", from: "them" }),

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

  // Initial scroll to bottom on mount and content changes
  useEffect(() => {
    if (!listRef.current) return;

    const scrollToBottom = () => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    };

    // Multiple attempts to ensure we get to bottom
    const timeouts = [
      setTimeout(scrollToBottom, 0),      // Immediate
      setTimeout(scrollToBottom, 50),     // After render
      setTimeout(scrollToBottom, 200),    // After animations start
      setTimeout(scrollToBottom, 500),    // After animations complete
      setTimeout(scrollToBottom, 1000),   // Final insurance
    ];

    // Also observe content size changes
    let resizeObserver;
    if (listRef.current) {
      resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(scrollToBottom);
      });
      resizeObserver.observe(listRef.current);
    }

    return () => {
      timeouts.forEach(clearTimeout);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []); // Only run on mount

  // Scroll to bottom when messages change (for new messages)
  useEffect(() => {
    if (!listRef.current) return;
    const scrollToBottom = () => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    };

    // Scroll immediately and after delay for media loading
    scrollToBottom();
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
      <main className="h-[100dvh] w-full flex flex-col bg-white overflow-x-hidden">
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
                  totalMessages={messages.length}
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
