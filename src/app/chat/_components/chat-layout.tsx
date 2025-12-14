'use client';

import ChatWindow from './chat-window';
import Sidebar from './sidebar';

interface ChatLayoutProps {
  selectedFriendId: string | null;
  onSelectFriend: (friendId: string | null) => void;
}

export default function ChatLayout({
  selectedFriendId,
  onSelectFriend,
}: ChatLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar
        selectedFriendId={selectedFriendId}
        onSelectFriend={onSelectFriend}
      />
      <ChatWindow selectedFriendId={selectedFriendId} />
    </div>
  );
}
