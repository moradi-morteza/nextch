"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from 'next/navigation';
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
import { useLang } from "@/hooks/useLang";
import { useAuth } from '@/contexts/AuthContext';
import chatStorage from '@/utils/chatStorage';
import api from '@/utils/api';

export default function ChatScreen() {
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('user');
  const userDataParam = searchParams.get('userData');
  const conversationId = searchParams.get('conversationId');

  let targetUserData = null;
  if (userDataParam) {
    try {
      targetUserData = JSON.parse(decodeURIComponent(userDataParam));
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }

  const { t } = useLang();
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState(new Set());
  const [conversation, setConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingConversation, setSendingConversation] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const listRef = useRef(null);

  // Initialize conversation and load messages
  useEffect(() => {
    const initializeChat = async () => {
      if (!currentUser || !targetUserId) {
        setIsLoading(false);
        return;
      }

      // For new chats (no conversationId), we need targetUserData
      if (!conversationId && !targetUserData) {
        setIsLoading(false);
        return;
      }

      // Prevent multiple simultaneous initializations
      if (isInitializing) {
        return;
      }

      setIsInitializing(true);

      try {
        await chatStorage.init();

        let existingConversation = null;

        // If conversationId is provided, try to load that specific conversation
        if (conversationId) {
          try {
            const response = await api.get(`/conversation/${conversationId}`);
            existingConversation = response.data.conversation;

            // Save to local storage for offline access
            await chatStorage.saveConversation(existingConversation);
          } catch (error) {
            console.error('Error loading conversation from server:', error);
            // Try to find in local storage as fallback
            existingConversation = await chatStorage.getConversation(conversationId);
          }
        } else {
          // Try to find existing draft conversation with this recipient
          existingConversation = await chatStorage.getConversationByRecipient(targetUserId);
        }

        if (!existingConversation) {
          // Create new draft conversation
          existingConversation = chatStorage.createDraftConversation(
            currentUser.id,
            targetUserId,
            targetUserData
          );
          await chatStorage.saveConversation(existingConversation);
        }

        setConversation(existingConversation);

        // Load existing messages for this conversation
        let existingMessages = await chatStorage.getMessages(existingConversation.id);

        // If it's a non-draft conversation and we have limited local messages,
        // or if recipient is opening a pending conversation, fetch from server
        if (conversationId && (existingConversation.status !== 'draft' || existingMessages.length === 0)) {
          try {
            const response = await api.get(`/conversation/${conversationId}`);
            const serverMessages = response.data.conversation.messages || [];

            // Save server messages to local storage for offline access
            for (const serverMsg of serverMessages) {
              await chatStorage.saveMessage(serverMsg);
            }

            // Use server messages as the source of truth
            existingMessages = serverMessages;
          } catch (error) {
            console.error('Error loading messages from server:', error);
            // Fall back to local messages if server fetch fails
          }
        }

        const formattedMessages = existingMessages.map(msg => makeText({
          text: msg.body,
          from: msg.sender_id === currentUser.id ? 'me' : 'them',
          timestamp: new Date(msg.created_at).getTime()
        }));

        // Add system messages based on conversation status
        const messagesWithSystem = addSystemMessages(formattedMessages, existingConversation, currentUser);
        setMessages(messagesWithSystem);
        // Clear any existing new message flags since these are loaded from storage
        setNewMessageIds(new Set());
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setIsLoading(false);
        setIsInitializing(false);
      }
    };

    initializeChat();
  }, [currentUser, targetUserId, conversationId]); // Removed targetUserData to prevent infinite loops

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

  const handleSend = async (value) => {
    if (!conversation || !currentUser) return;

    // Check if user can send based on their role and conversation status
    const isStarter = conversation.starter_id === currentUser.id;
    const isRecipient = conversation.recipient_id === currentUser.id;

    // Determine which action to take based on role and status
    const canSendDraft = isStarter && conversation.status === 'draft';
    const canAnswer = isRecipient && conversation.status === 'pending_recipient';
    const canContinue = isStarter && conversation.status === 'pending_sender';

    if (!canSendDraft && !canAnswer && !canContinue) return;

    const messageText = value.trim();
    if (!messageText) return;

    // Create message for UI
    const uiMessage = {
      type: "text",
      content: messageText,
      from: "me",
      ts: Date.now()
    };

    // Add to UI immediately using helper
    const addedMessage = addNewMessage(uiMessage);

    try {
      // Create message for storage
      const storageMessage = chatStorage.createMessage(
        conversation.id,
        currentUser.id,
        messageText,
        'text'
      );

      // Save to IndexedDB
      await chatStorage.saveMessage(storageMessage);

      // Sync with server - use appropriate endpoint based on user role and status
      if (canAnswer) {
        // Recipient answering a pending_recipient conversation
        await api.post('/conversation/answer', {
          conversation_id: conversation.id,
          message: {
            type: 'text',
            body: messageText
          }
        });

        // Update conversation status to pending_sender locally
        const updatedConversation = { ...conversation, status: 'pending_sender' };
        await chatStorage.saveConversation(updatedConversation);
        setConversation(updatedConversation);

        // Update system messages
        setMessages(prevMessages => {
          const userMessages = prevMessages.filter(msg => msg.type !== 'system');
          return addSystemMessages(userMessages, updatedConversation, currentUser);
        });
      } else if (canContinue) {
        // Starter continuing a pending_sender conversation
        await api.post('/conversation/continue', {
          conversation_id: conversation.id,
          message: {
            type: 'text',
            body: messageText
          }
        });

        // Update conversation status to pending_recipient locally
        const updatedConversation = { ...conversation, status: 'pending_recipient' };
        await chatStorage.saveConversation(updatedConversation);
        setConversation(updatedConversation);

        // Update system messages
        setMessages(prevMessages => {
          const userMessages = prevMessages.filter(msg => msg.type !== 'system');
          return addSystemMessages(userMessages, updatedConversation, currentUser);
        });
      } else {
        // Starter adding draft messages
        await api.post('/conversation/message/draft', {
          conversation_id: conversation.id,
          starter_id: conversation.starter_id,
          recipient_id: conversation.recipient_id,
          recipient_data: conversation.recipient_data,
          message: {
            type: 'text',
            body: messageText,
            sender_id: currentUser.id
          }
        });
      }

    } catch (error) {
      console.error('Error saving message:', error);
      // Message is still visible in UI, just not synced
    }
  };

  const handleVoice = ({ url, blob, duration }) => {
    addNewMessage({
      type: "audio",
      content: url,
      blob,
      from: "me",
      ts: Date.now(),
      duration
    });
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

  const addSystemMessages = (messages, conversation, currentUser) => {
    if (!conversation) return messages;

    const systemMessages = [];

    // Add help message at top for draft conversations
    if (conversation.status === 'draft') {
      systemMessages.push(makeSystem({
        text: 'در این گفتگو می‌توانید پیام‌های خود را تایپ کنید. پس از اتمام پیام‌ها، روی دکمه "ارسال" کلیک کنید تا گفتگو ارسال شود.',
        id: 'system-help'
      }));
    }

    // Add all user messages
    const result = [...systemMessages, ...messages];

    // Add status message at end based on conversation status and user role
    if (conversation.status === 'pending_recipient') {
      if (conversation.starter_id === currentUser?.id) {
        result.push(makeSystem({
          text: 'گفتگو ارسال شده است و در انتظار پاسخ طرف مقابل می‌باشد.',
          id: 'system-pending-starter'
        }));
      } else {
        result.push(makeSystem({
          text: 'این سوال برای شما ارسال شده است. می‌توانید پاسخ خود را بنویسید.',
          id: 'system-pending-recipient'
        }));
      }
    }

    // Add status message for pending_sender conversations
    if (conversation.status === 'pending_sender') {
      if (conversation.starter_id === currentUser?.id) {
        result.push(makeSystem({
          text: 'طرف مقابل پاسخ داده است. می‌توانید گفتگو را ادامه دهید یا آن را بسته کنید.',
          id: 'system-pending-continue'
        }));
      } else {
        result.push(makeSystem({
          text: 'پاسخ شما ارسال شده است و در انتظار ادامه گفتگو از طرف مقابل می‌باشد.',
          id: 'system-answered-waiting'
        }));
      }
    }

    // Add status message for closed conversations
    if (conversation.status === 'closed') {
      result.push(makeSystem({
        text: 'این گفتگو بسته شده است.',
        id: 'system-closed'
      }));
    }

    return result;
  };

  const addNewMessage = (message) => {
    const newMessageId = Date.now();
    const messageWithId = { ...message, id: newMessageId };
    setMessages((m) => [...m, messageWithId]);
    setNewMessageIds(prev => new Set([...prev, newMessageId]));

    // Clear new message flag after animation completes
    setTimeout(() => {
      setNewMessageIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(newMessageId);
        return newSet;
      });
    }, 500);

    return messageWithId;
  };

  const handleSendConversation = async () => {
    if (!conversation || !currentUser || messages.length === 0) return;

    setSendingConversation(true);
    try {
      // Update conversation status to pending_recipient
      await api.post('/conversation/send', {
        conversation_id: conversation.id
      });

      // Update local storage
      const updatedConversation = { ...conversation, status: 'pending_recipient' };
      await chatStorage.saveConversation(updatedConversation);
      setConversation(updatedConversation);

      // Update messages to include new system message for pending_recipient status
      setMessages(prevMessages => {
        // Remove system messages and re-add with new status
        const userMessages = prevMessages.filter(msg => msg.type !== 'system');
        return addSystemMessages(userMessages, updatedConversation, currentUser);
      });

      // Optionally redirect or show success message
      console.log('Conversation sent successfully!');
    } catch (error) {
      console.error('Error sending conversation:', error);
    } finally {
      setSendingConversation(false);
    }
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
              <span className="text-sm font-medium text-gray-800">{selectedMessages.length} {t('chat.selectedMessages')}</span>
            </div>
            <IconButton onClick={handleDeleteSelected} size="small" sx={{ color: '#ef4444' }}>
              <DeleteRoundedIcon />
            </IconButton>
          </div>
        ) : (
          <ChatHeader
            title={targetUserData?.name || "Morteza"}
            status={targetUserData?.username || "Morteza"}
            avatar={targetUserData?.name?.charAt(0)?.toUpperCase() || "M"}
            showBackButton={!!targetUserId}
            avatarUrl={targetUserData?.avatar}
            showSendButton={conversation?.status === 'draft' && messages.length > 0}
            onSendConversation={handleSendConversation}
            sendingConversation={sendingConversation}
          />
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

        {((conversation?.starter_id === currentUser?.id && conversation?.status === 'draft') ||
          (conversation?.recipient_id === currentUser?.id && conversation?.status === 'pending_recipient') ||
          (conversation?.starter_id === currentUser?.id && conversation?.status === 'pending_sender')) ? (
          <ChatComposer
            onSendMessage={handleSend}
            onVoiceMessage={({ mediaId, duration, url }) => {
              addNewMessage(makeAudio({ mediaId, duration, url }));
            }}
            onVideoMessage={({ mediaId, duration, width, height, url }) => {
              addNewMessage(makeVideo({ mediaId, duration, width, height, url }));
            }}
            onSendImage={({ url, caption, width, height }) => {
              addNewMessage(makeImage({ image: { url, width, height }, caption }));
            }}
            onSendImages={({ items, caption }) => {
              const message = items.length <= 1
                ? makeImage({ image: items[0], caption })
                : makeImageGroup({ images: items, caption });
              addNewMessage(message);
            }}
            onSendFile={({ file, name, size, type, caption }) => {
              addNewMessage(makeFile({ file, name, size, type, caption }));
            }}
            maxUploadMB={MAX_UPLOAD_MB}
            showCommands={false}
          />
        ) : (
          <div className="bg-gray-100 px-4 py-3 text-center text-gray-600 text-sm">
            {conversation?.status === 'pending_recipient' && conversation?.starter_id === currentUser?.id && 'در انتظار پاسخ طرف مقابل...'}
            {conversation?.status === 'pending_sender' && conversation?.recipient_id === currentUser?.id && 'در انتظار ادامه گفتگو از طرف مقابل...'}
            {conversation?.status === 'closed' && 'این گفتگو بسته شده است'}
          </div>
        )}
      </main>
    </ThemeProvider>
  );
}
