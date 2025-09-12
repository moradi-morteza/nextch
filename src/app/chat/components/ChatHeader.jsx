import { useLang } from '@/hooks/useLang';
import { useRouter } from 'next/navigation';
import SendIcon from '@mui/icons-material/Send';
import Avatar from '@mui/material/Avatar';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
export default function ChatHeader({
  title = "Morteza",
  status = "online",
  avatar = "M",
  showBackButton = false,
  avatarUrl = null,
  showSendButton = false,
  onSendConversation = null,
  sendingConversation = false
}) {
  const router = useRouter();
  const { t } = useLang();

  const getStatusText = (status) => {
    if (status === "online") return t('status.online');
    if (status === "offline") return t('status.offline');
    if (status === "typing") return t('status.typing');
    if (status === "recording") return t('status.recording');
    return status;
  };

  return (
    <header className="w-full tg-topbar shrink-0">
      <div className="mx-auto max-w-3xl px-3 py-2 flex items-center gap-2" dir="rtl">
        {showBackButton && (
          <button
            onClick={() => router.back()}
            className="ml-1 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowForwardIosIcon className="text-gray-700" sx={{ fontSize: 20 }} />
          </button>
        )}

        <Avatar
          src={avatarUrl}
          alt={title}
          className="w-8 h-8"
          sx={{ width: 32, height: 32 }}
        >
          {avatar}
        </Avatar>

        <div className="leading-tight flex-1 text-right">
          <div className="font-medium text-gray-900 text-sm">{title}</div>
          <div className="text-xs text-gray-500">{getStatusText(status)}</div>
        </div>

        {showSendButton && (
          <button
            onClick={onSendConversation}
            disabled={sendingConversation}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
          >
            {sendingConversation ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>ارسال...</span>
              </>
            ) : (
              <>
                <SendIcon sx={{ fontSize: 16 }} />
                <span>ارسال</span>
              </>
            )}
          </button>
        )}
      </div>
    </header>
  );
}

