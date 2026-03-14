"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import {
  queryDocuments,
  getDocument,
  addDocument,
  updateDocument,
  subscribeToCollection,
  where,
  orderBy,
  serverTimestamp,
} from "@/lib/firebase/db";
import { Chat, Message, UserProfile, CURRENCY_SYMBOL } from "@/types";
import { ArrowLeft, Send, Plus, MapPin, Camera, DollarSign, MoreHorizontal } from "lucide-react";

export default function ChatPageWrapper() {
  return (
    <Suspense fallback={<div className="loading-screen"><div className="spinner" /></div>}>
      <ChatPage />
    </Suspense>
  );
}

function ChatPage() {
  const { user, profile } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserName, setOtherUserName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user's chats
  useEffect(() => {
    if (!user) return;

    const unsub = subscribeToCollection(
      "chats",
      [where("participants", "array-contains", user.uid), orderBy("lastUpdated", "desc")],
      (docs) => {
        setChats(docs as Chat[]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  // Auto-open chat from URL params
  useEffect(() => {
    const chatId = searchParams.get("id");
    if (chatId && chats.length > 0) {
      const chat = chats.find((c) => c.id === chatId);
      if (chat) setActiveChat(chat);
    }
  }, [searchParams, chats]);

  // Fetch other participant's name when activeChat changes
  useEffect(() => {
    if (!activeChat || !user) {
      setOtherUserName("");
      return;
    }

    const otherUid = activeChat.participants.find((p) => p !== user.uid);
    if (!otherUid) {
      setOtherUserName("Chat");
      return;
    }

    getDocument<UserProfile>("users", otherUid)
      .then((userProfile) => {
        setOtherUserName(userProfile?.name || "User");
      })
      .catch(() => {
        setOtherUserName("User");
      });
  }, [activeChat, user]);

  // Subscribe to messages when a chat is active + reset unread count
  useEffect(() => {
    if (!activeChat || !user) return;

    // Reset current user's unread count when opening the chat
    const currentUnread = activeChat.unreadCount?.[user.uid] || 0;
    if (currentUnread > 0) {
      updateDocument("chats", activeChat.id, {
        [`unreadCount.${user.uid}`]: 0,
      }).catch((err) => console.error("Failed to reset unread count:", err));
    }

    const unsub = subscribeToCollection(
      "messages",
      [where("chatId", "==", activeChat.id), orderBy("timestamp", "asc")],
      (docs) => {
        setMessages(docs as Message[]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    );

    return () => unsub();
  }, [activeChat, user]);

  async function handleSend() {
    if (!newMessage.trim() || !activeChat || !user || sending) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setSending(true);

    // Optimistic message for instant display
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      chatId: activeChat.id,
      senderId: user.uid,
      message: messageText,
      timestamp: { toDate: () => new Date() } as any,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    try {
      // Determine the other participant for unread count
      const otherUid = activeChat.participants.find((p) => p !== user.uid);

      await addDocument("messages", {
        chatId: activeChat.id,
        senderId: user.uid,
        message: messageText,
        timestamp: serverTimestamp(),
      });

      // Build update object for chat metadata
      const chatUpdate: Record<string, any> = {
        lastMessage: messageText,
        lastUpdated: serverTimestamp(),
      };

      // Increment the other user's unread count
      if (otherUid) {
        const currentChat = chats.find((c) => c.id === activeChat.id);
        const currentUnread = currentChat?.unreadCount?.[otherUid] || 0;
        chatUpdate[`unreadCount.${otherUid}`] = currentUnread + 1;
      }

      await updateDocument("chats", activeChat.id, chatUpdate);
    } catch (err: any) {
      console.error("Failed to send message:", err);
      // Remove optimistic message on failure and restore input
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function formatTime(timestamp: any): string {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(timestamp: any): string {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  // Chat Detail View
  if (activeChat) {
    const displayName = otherUserName || activeChat.itemTitle || "Chat";

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - var(--bottom-nav-height))",
          maxWidth: 480,
          margin: "0 auto",
        }}
      >
        {/* Chat Header */}
        <div className="flex items-center gap-3" style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg)",
        }}>
          <button className="btn-ghost" onClick={() => setActiveChat(null)} style={{ padding: 4 }}>
            <ArrowLeft size={22} />
          </button>
          <div className="chat-avatar" style={{
            background: "var(--primary-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--primary-dark)",
            fontWeight: 700,
            fontSize: 18,
          }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div className="chat-name">{displayName}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {activeChat.itemTitle ? `Re: ${activeChat.itemTitle}` : "Usually replies within 1 hour"}
            </div>
          </div>
          <button className="btn-ghost" style={{ padding: 6 }}>
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Item Banner */}
        {activeChat.itemImage && (
          <div className="chat-item-banner">
            <img src={activeChat.itemImage} alt={activeChat.itemTitle} />
            <div className="chat-item-banner-info">
              <div className="chat-item-banner-title">{activeChat.itemTitle}</div>
              <div className="chat-item-banner-price">
                {CURRENCY_SYMBOL}{activeChat.itemPrice}
              </div>
              <div className="chat-item-banner-detail">
                <MapPin size={10} style={{ display: "inline" }} /> Available
              </div>
            </div>
            <ArrowLeft size={18} style={{ transform: "rotate(180deg)", color: "var(--text-muted)" }} />
          </div>
        )}

        {/* Messages */}
        <div className="messages-container">
          {messages.map((msg) => {
            const isSent = msg.senderId === user?.uid;
            return (
              <div key={msg.id}>
                <div className={`message-bubble ${isSent ? "message-sent" : "message-received"}`}>
                  {msg.message}
                </div>
                <div className="message-time"
                  style={{ textAlign: isSent ? "right" : "left", paddingLeft: isSent ? 0 : 8, paddingRight: isSent ? 8 : 0 }}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 justify-center" style={{
          padding: "8px 16px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg)",
        }}>
          <button className="flex flex-col items-center gap-1 btn-ghost" style={{ padding: "6px 16px", fontSize: 11 }}>
            <MapPin size={18} />
            Share Location
          </button>
          <button className="flex flex-col items-center gap-1 btn-ghost" style={{ padding: "6px 16px", fontSize: 11 }}>
            <DollarSign size={18} />
            Make Offer
          </button>
          <button className="flex flex-col items-center gap-1 btn-ghost" style={{ padding: "6px 16px", fontSize: 11 }}>
            <Camera size={18} />
            Send Photo
          </button>
        </div>

        {/* Chat Input */}
        <div className="chat-input-bar">
          <button className="btn-ghost" style={{ padding: 6 }}>
            <Plus size={22} />
          </button>
          <input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={sending}
          />
          <button className="chat-send-btn" onClick={handleSend} disabled={sending} style={{ opacity: sending ? 0.6 : 1 }}>
            <Send size={18} />
          </button>
        </div>
      </div>
    );
  }

  // Chat List View
  return (
    <div className="container page">
      <h1 className="header-title mb-4">Messages</h1>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: "40vh" }}>
          <div className="spinner" />
        </div>
      ) : chats.length === 0 ? (
        <div className="empty-state">
          <Send size={48} />
          <p>No messages yet</p>
          <p className="text-sm">Start a conversation by contacting a seller</p>
        </div>
      ) : (
        chats.map((chat) => (
          <div
            key={chat.id}
            className="chat-list-item"
            onClick={() => setActiveChat(chat)}
          >
            <div className="chat-avatar" style={{
              background: "var(--primary-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary-dark)",
              fontWeight: 700,
              fontSize: 18,
            }}>
              {(chat.itemTitle || "C").charAt(0).toUpperCase()}
            </div>
            <div className="chat-info">
              <div className="chat-name">{chat.itemTitle || "Chat"}</div>
              <div className="chat-last-msg">{chat.lastMessage}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="chat-time">{formatDate(chat.lastUpdated)}</div>
              {chat.unreadCount && user && chat.unreadCount[user.uid] > 0 && (
                <div className="chat-unread" style={{ marginTop: 4, marginLeft: "auto" }}>
                  {chat.unreadCount[user.uid]}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
