import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { usePresenceStore } from "@/stores/presenceStore";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import { formatTimestamp } from "@/lib/utils";

export default function ChatListPage() {
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);
  const { chats, setChats } = useChatStore();
  const presence = usePresenceStore((s) => s.presence);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const { isLoading, error, refetch } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const { data } = await apiClient.get("/chats");
      setChats(data);
      return data;
    },
    refetchInterval: 30000,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return chats;
    const q = search.toLowerCase();
    return chats.filter((chat) => {
      const other = chat.members?.find((m: any) => m.user?.id !== userId);
      return (
        other?.user?.name?.toLowerCase().includes(q) ||
        chat.lastMessage?.content?.toLowerCase().includes(q)
      );
    });
  }, [chats, search, userId]);

  const getOtherUser = (chat: any) => {
    const member = chat.members?.find((m: any) => m.user?.id !== userId);
    return member?.user || { name: "Unknown", avatarUrl: null, id: "" };
  };

  /* ─── Loading ─────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-[#F0F2F5]">
        <ChatHeader
          showSearch={showSearch}
          search={search}
          onSearch={setSearch}
          onToggleSearch={setShowSearch}
        />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-4">
          <div className="mx-4 mt-4 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3.5 animate-pulse"
              >
                <div className="w-[50px] h-[50px] rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1">
                  <div className="h-4 w-32 rounded bg-gray-200 mb-2" />
                  <div className="h-3 w-48 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ─── Error ───────────────────────────────────────────── */
  if (error) {
    return (
      <div className="flex-1 flex flex-col bg-[#F0F2F5]">
        <ChatHeader
          showSearch={showSearch}
          search={search}
          onSearch={setSearch}
          onToggleSearch={setShowSearch}
        />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
          <p className="text-[15px] text-gray-600">Failed to load chats</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2.5 rounded-2xl bg-[#128C7E] text-white text-[14px] font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ─── Empty ───────────────────────────────────────────── */
  if (filtered.length === 0 && !search) {
    return (
      <div className="flex-1 flex flex-col bg-[#F0F2F5]">
        <ChatHeader
          showSearch={showSearch}
          search={search}
          onSearch={setSearch}
          onToggleSearch={setShowSearch}
        />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8">
          <span className="text-5xl mb-2">💬</span>
          <p className="text-[17px] font-semibold text-gray-800 text-center">
            No conversations yet
          </p>
          <p className="text-[14px] text-gray-500 text-center">
            Start chatting with businesses or contacts
          </p>
        </div>
      </div>
    );
  }

  /* ─── Chat List ───────────────────────────────────────── */
  return (
    <div className="flex-1 flex flex-col bg-[#F0F2F5] overflow-hidden">
      <ChatHeader
        showSearch={showSearch}
        search={search}
        onSearch={setSearch}
        onToggleSearch={setShowSearch}
      />

      <div className="flex-1 overflow-y-auto pb-20 md:pb-4">
        {filtered.length > 0 && (
          <div className="mx-4 mt-4 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {filtered.map((chat, idx) => {
              const other = getOtherUser(chat);
              const isOnline = presence[other.id]?.isOnline ?? other.isOnline;
              const lastMsg = chat.lastMessage;
              const unread = chat.unreadCount || 0;

              return (
                <button
                  key={chat.id}
                  onClick={() => navigate(`/chats/${chat.id}`)}
                  className={`w-full flex items-stretch text-left active:bg-gray-50 transition-colors bg-white ${idx < filtered.length - 1 ? 'border-b border-gray-50' : ''}`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0 pl-4 py-3 pr-3 flex items-center">
                    <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center overflow-hidden bg-gray-100">
                      {other.avatarUrl ? (
                        <img
                          src={other.avatarUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg
                          width="26"
                          height="26"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#8696A0"
                          strokeWidth="1.5"
                        >
                          <path
                            d="M20 21V19C20 16.24 15.5 15 12 15C8.5 15 4 16.24 4 19V21"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle
                            cx="12"
                            cy="8"
                            r="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    {isOnline && (
                      <div className="absolute bottom-3 right-2.5 w-3.5 h-3.5 rounded-full bg-[#25D366] border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 py-3.5 pr-4 flex flex-col justify-center">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span
                        className={`text-[16px] truncate ${unread > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-900"}`}
                      >
                        {other.name || other.phone}
                      </span>
                      <span
                        className={`text-[12px] shrink-0 ${unread > 0 ? "text-[#128C7E] font-semibold" : "text-gray-400"}`}
                      >
                        {lastMsg ? formatTimestamp(lastMsg.createdAt) : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-[14px] truncate flex-1 leading-snug ${unread > 0 ? "text-gray-700 font-medium" : "text-gray-500"}`}
                      >
                        {lastMsg?.isDeleted
                          ? "🚫 This message was deleted"
                          : lastMsg?.type === "TEXT"
                            ? lastMsg.content
                            : lastMsg?.type === "IMAGE"
                              ? "📷 Photo"
                              : lastMsg?.type === "PRODUCT_CARD"
                                ? "🛍️ Product"
                                : lastMsg?.type === "SHARED_CART"
                                  ? "🛒 Shared Cart"
                                  : lastMsg?.type === "ORDER_UPDATE"
                                    ? "📦 Order Update"
                                    : "Start a conversation"}
                      </p>
                      {unread > 0 && (
                        <span className="min-w-[20px] h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white px-1.5 bg-[#25D366]">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && search && (
          <div className="flex flex-col items-center py-16">
            <p className="text-[14px] text-gray-500">
              No chats matching "{search}"
            </p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate("/contacts")}
        className="fixed bottom-24 right-6 md:bottom-8 w-14 h-14 rounded-full flex items-center justify-center bg-[#25D366] shadow-lg shadow-green-500/25 z-10 active:scale-95 transition-transform"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92176 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.9C9.87812 3.30493 11.1801 2.99656 12.5 3H13C15.0843 3.11499 17.053 3.99476 18.5291 5.47086C20.0052 6.94696 20.885 8.91568 21 11V11.5Z"
            stroke="white"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </button>
    </div>
  );
}

/* ─── Header ──────────────────────────────────────────── */
function ChatHeader({
  showSearch,
  search,
  onSearch,
  onToggleSearch,
}: {
  showSearch: boolean;
  search: string;
  onSearch: (v: string) => void;
  onToggleSearch: (v: boolean) => void;
}) {
  const navigateTo = useNavigate();
  return (
    <header className="shrink-0 safe-area-top">
      {showSearch ? (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-[#075E54]">
          <button
            onClick={() => {
              onSearch("");
              onToggleSearch(false);
            }}
            className="w-10 h-10 flex items-center justify-center text-white/80 rounded-full active:bg-white/10 transition-colors"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 12H4M4 12L10 6M4 12L10 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            autoFocus
            className="flex-1 h-9 px-3 rounded-xl bg-white/15 text-[15px] text-white placeholder:text-white/50 outline-none"
          />
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-3.5 bg-[#075E54] text-white shadow-sm">
          <h1 className="text-[20px] font-bold tracking-tight">BizChat</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleSearch(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full active:bg-white/10 transition-colors"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" stroke="currentColor" />
                <path
                  d="M21 21L16.65 16.65"
                  stroke="currentColor"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button
              className="w-10 h-10 flex items-center justify-center rounded-full active:bg-white/10 transition-colors"
              onClick={() => navigateTo("/settings")}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
