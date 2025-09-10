import { useLang } from '../../../hooks/useLang.js';

export default function ChatHeader({ title = "Morteza", status = "online", avatar = "M" }) {
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
      <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
        <div className="size-9 rounded-full bg-blue-500 text-white grid place-items-center font-semibold">
          {avatar}
        </div>
        <div className="leading-tight">
          <div className="font-medium">{title}</div>
          <div className="text-xs text-gray-500">{getStatusText(status)}</div>
        </div>
      </div>
    </header>
  );
}

