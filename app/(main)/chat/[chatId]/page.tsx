'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useAuth } from '@/lib/auth-context';
import { listenToMessages, sendMessage, type ChatMessage } from '@/lib/chat';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import { ref, get } from 'firebase/database';
import { rtdb } from '@/lib/firebase';

export default function ChatRoomPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = use(params);
  const { profile } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [otherName, setOtherName] = useState('Chat');
  const bottomRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Get room info
    get(ref(rtdb, `chatRooms/${chatId}`)).then(snap => {
      if (snap.exists()) {
        const data = snap.val();
        const otherId = data.participants?.find((p: string) => p !== profile?.uid) || '';
        setOtherName(data.participantNames?.[otherId] || 'User');
      }
    });

    const unsub = listenToMessages(chatId, (msg) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    return unsub;
  }, [chatId, profile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !profile || sending) return;
    setSending(true);
    try {
      await sendMessage(chatId, profile.uid, profile.displayName, text.trim());
      setText('');
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div className="top-header">
        <button onClick={() => router.back()} className="btn-ghost" style={{ padding: 8 }}><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize: 16, fontWeight: 700 }}>{otherName}</h1>
        <div style={{ width: 36 }} />
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', paddingTop: 60 }}>
            <p>Start the conversation 👋</p>
          </div>
        )}
        {messages.map(msg => {
          const isMine = msg.senderId === profile?.uid;
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
              <div>
                <div className={`chat-bubble ${isMine ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
                  {msg.text}
                </div>
                <div className="chat-time" style={{ textAlign: isMine ? 'right' : 'left' }}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px', borderTop: '1px solid var(--border-color)',
        background: 'var(--surface)', display: 'flex', gap: 8,
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}>
        <input
          className="input-field"
          placeholder="Type a message..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          style={{ flex: 1 }}
        />
        <button onClick={handleSend} className="btn-primary" style={{ padding: '10px 14px' }} disabled={!text.trim() || sending}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
