import { ref, push, set, onChildAdded, off, get, serverTimestamp, query, orderByChild } from 'firebase/database';
import { rtdb } from './firebase';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantAvatars: Record<string, string>;
  lastMessage: string;
  lastMessageTime: number;
  productId?: string;
  productTitle?: string;
}

export function getChatRoomId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

export async function createOrGetChatRoom(
  uid1: string, uid2: string,
  name1: string, name2: string,
  avatar1: string, avatar2: string,
  productId?: string, productTitle?: string
): Promise<string> {
  const roomId = getChatRoomId(uid1, uid2);
  const roomRef = ref(rtdb, `chatRooms/${roomId}`);
  const snap = await get(roomRef);
  
  if (!snap.exists()) {
    await set(roomRef, {
      participants: [uid1, uid2],
      participantNames: { [uid1]: name1, [uid2]: name2 },
      participantAvatars: { [uid1]: avatar1, [uid2]: avatar2 },
      lastMessage: '',
      lastMessageTime: Date.now(),
      productId: productId || '',
      productTitle: productTitle || '',
    });
  }
  return roomId;
}

export async function sendMessage(roomId: string, senderId: string, senderName: string, text: string): Promise<void> {
  const msgRef = push(ref(rtdb, `messages/${roomId}`));
  await set(msgRef, {
    senderId,
    senderName,
    text,
    timestamp: Date.now(),
  });
  // Update last message
  await set(ref(rtdb, `chatRooms/${roomId}/lastMessage`), text);
  await set(ref(rtdb, `chatRooms/${roomId}/lastMessageTime`), Date.now());
}

export function listenToMessages(roomId: string, callback: (msg: ChatMessage) => void): () => void {
  const msgsRef = ref(rtdb, `messages/${roomId}`);
  const handler = onChildAdded(msgsRef, (snap) => {
    const data = snap.val();
    callback({
      id: snap.key || '',
      ...data,
    });
  });
  return () => off(msgsRef, 'child_added');
}

export async function getUserChatRooms(userId: string): Promise<ChatRoom[]> {
  const roomsRef = ref(rtdb, 'chatRooms');
  const snap = await get(roomsRef);
  if (!snap.exists()) return [];
  
  const rooms: ChatRoom[] = [];
  snap.forEach((child) => {
    const data = child.val();
    if (data.participants && data.participants.includes(userId)) {
      rooms.push({ id: child.key || '', ...data });
    }
  });
  return rooms.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
}
