'use client';

interface MessageBubbleProps {
  message: {
    _id: string;
    sender: {
      _id: string;
      name: string;
      image?: string;
    };
    receiver: {
      _id: string;
      name: string;
      image?: string;
    };
    content: string;
    read: boolean;
    readAt?: Date;
    createdAt: Date;
  };
  isOwn: boolean;
  currentUserId: string;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} gap-3`}>
      {!isOwn && (
        <img
          src={
            message.sender.image ||
            `https://avatar.vercel.sh/${message.sender.name}`
          }
          alt={message.sender.name}
          className="w-8 h-8 rounded-full"
        />
      )}

      <div
        className={`max-w-xs lg:max-w-md flex flex-col ${
          isOwn ? 'items-end' : 'items-start'
        }`}
      >
        {!isOwn && (
          <p className="text-xs text-muted-foreground mb-1 px-3">
            {message.sender.name}
          </p>
        )}
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-none'
              : 'bg-muted text-card-foreground rounded-bl-none'
          }`}
        >
          <p className="text-sm wrap-break-word">{message.content}</p>
        </div>
        <div className="flex items-center gap-1 mt-1 px-3">
          <p className="text-xs text-muted-foreground">
            {formatTime(message.createdAt)}
          </p>
          {isOwn && (
            <span className="text-xs text-muted-foreground">
              {message.read ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>

      {isOwn && (
        <img
          src={
            message.sender.image ||
            `https://avatar.vercel.sh/${message.sender.name}`
          }
          alt={message.sender.name}
          className="w-8 h-8 rounded-full"
        />
      )}
    </div>
  );
}
