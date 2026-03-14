'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getUserChatRooms, type ChatRoom } from '@/lib/chat';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ChatListPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.uid) loadRooms();
  }, [profile]);

  const loadRooms = async () => {
    if (!profile) return;
    try {
      const r = await getUserChatRooms(profile.uid);
      setRooms(r);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getOtherUser = (room: ChatRoom) => {
    const otherId = room.participants.find(p => p !== profile?.uid) || '';
    return {
      name: room.participantNames?.[otherId] || 'User',
      avatar: room.participantAvatars?.[otherId] || '',
    };
  };

  return (
    <div>
      <div className="top-header"><h1 style={{ fontSize: 20, fontWeight: 800 }}>Messages</h1></div>
      <div className="page-container">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-lg" /></div>
        ) : rooms.length === 0 ? (
          <div className="empty-state">
            <MessageCircle size={48} />
            <h3>No conversations yet</h3>
            <p>Chat with sellers when you find something you like</p>
          </div>
        ) : (
          rooms.map(room => {
            const other = getOtherUser(room);
            return (
              <div key={room.id} className="glass-card" style={{ padding: 14, marginBottom: 10, display: 'flex', gap: 12, cursor: 'pointer', alignItems: 'center' }} onClick={() => router.push(`/chat/${room.id}`)}>
                <img src={other.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(other.name)}&background=7c3aed&color=fff`} alt="" className="avatar" />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{other.name}</div>
                  {room.productTitle && <div style={{ fontSize: 11, color: 'var(--primary-light)' }}>Re: {room.productTitle}</div>}
                  <div style={{ fontSize: 13, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {room.lastMessage || 'No messages yet'}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                  {room.lastMessageTime ? formatDistanceToNow(new Date(room.lastMessageTime), { addSuffix: true }) : ''}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
