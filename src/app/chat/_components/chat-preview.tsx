'use client';

import { Friend } from './sidebar';

interface ChatPreviewProps {
  friend: Friend;
  isSelected: boolean;
  isOnline: boolean;
  onClick: () => void;
}

export default function ChatPreview({
  friend,
  isSelected,
  isOnline,
  onClick,
}: ChatPreviewProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 border-b border-sidebar-border flex items-center gap-3 hover:bg-sidebar-accent transition-colors ${
        isSelected ? 'bg-sidebar-accent' : ''
      }`}
    >
      {/* Avatar with online indicator */}
      <div className="relative shrink-0">
        <img
          src={friend.image || `https://avatar.vercel.sh/${friend.email}`}
          alt={friend.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-sidebar" />
        )}
      </div>

      {/* Chat Info */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-medium text-sidebar-foreground truncate font-inter">
            {friend.name}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {isOnline ? 'Online' : 'Offline'}
        </p>
      </div>
    </button>
  );
}
