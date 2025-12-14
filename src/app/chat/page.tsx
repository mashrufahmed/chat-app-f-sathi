'use client';

import ChatLayout from '@/app/chat/_components/chat-layout';
import { useState } from 'react';

export default function ChatPage() {
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  return (
    <ChatLayout
      selectedFriendId={selectedFriendId}
      onSelectFriend={setSelectedFriendId}
    />
  );
}
