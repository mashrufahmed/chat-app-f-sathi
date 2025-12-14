'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import useDebounce from '@/hooks/useDebounce';
import { signOut, useSession } from '@/lib/auth-client';
import axiosInstance from '@/lib/axios-instance';
import isFriendStatus from '@/lib/isFriendStatus';
import { useSocket } from '@/lib/SocketProvider';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CirclePlusIcon,
  CircleXIcon,
  ClockCheck,
  LoaderIcon,
  LogOutIcon,
  MessageCirclePlus,
  MessageCircleQuestionMarkIcon,
  Search,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import ChatPreview from './chat-preview';

interface SidebarProps {
  selectedFriendId: string | null;
  onSelectFriend: (friendId: string | null) => void;
}

export interface Friend {
  _id: string;
  name: string;
  email: string;
  image: string;
  createdAt: string;
}

export interface UserFriendsData {
  _id: string;
  userId: string;
  friends: Friend[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export default function Sidebar({
  selectedFriendId,
  onSelectFriend,
}: SidebarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [ownProfileOpen, setOwnProfileOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { data } = useSession();
  const { isConnected, onlineUsers } = useSocket();

  const { data: friendsData, isLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: async (): Promise<UserFriendsData | null> => {
      const res = await axiosInstance.get('/api/users/get-own-friends');
      return res.data;
    },
  });

  // Get friends array safely
  const friends = friendsData?.friends || [];

  // Filter friends based on search
  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const signOutBTN = () => {
    startTransition(async () => {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success('Sign out successful.');
            router.push('/');
          },
          onError: (error) => {
            toast.error('Sign out failed.', {
              description: error.error.message,
            });
          },
        },
      });
    });
  };

  return (
    <div className="w-full md:w-80 flex flex-col bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-sidebar-foreground">
            Messages
          </h1>
          <div className="flex gap-x-3 items-center">
            <div className="relative">
              <button
                onClick={() => setRequestOpen(true)}
                className="p-2 border border-sidebar-accent rounded-full transition-colors cursor-pointer"
              >
                <MessageCircleQuestionMarkIcon
                  size={20}
                  className="text-sidebar-foreground"
                />
              </button>
              {/* <Badge className="absolute top-0 -right-3 h-5 min-w-5 rounded-full px-0.5 font-mono tabular-nums text-xs">
                +9
              </Badge> */}
            </div>
            <button
              onClick={() => setOpen(true)}
              className="p-2 hover:bg-sidebar-accent rounded-full transition-colors"
            >
              <MessageCirclePlus
                size={20}
                className="text-sidebar-foreground"
              />
            </button>
          </div>
          <FriendRequestsDialog open={requestOpen} setOpen={setRequestOpen} />
          <UserProfileDialog open={open} setOpen={setOpen} />
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-sidebar-accent text-sidebar-foreground placeholder-muted-foreground rounded-full focus:outline-none focus:ring-2 focus:ring-sidebar-primary transition-all"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Spinner />
          </div>
        ) : !friendsData ? (
          <div className="p-4 text-center text-muted-foreground">
            <p>No friends yet. Start adding friends!</p>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p>
              {searchQuery
                ? `No friends found matching "${searchQuery}"`
                : 'No friends yet'}
            </p>
          </div>
        ) : (
          filteredFriends.map((friend) => (
            <ChatPreview
              key={friend._id}
              friend={friend}
              isSelected={selectedFriendId === friend._id}
              isOnline={onlineUsers.includes(friend._id)}
              onClick={() => onSelectFriend(friend._id)}
            />
          ))
        )}
      </div>

      {/* User Profile Footer */}
      <div className="flex items-center justify-between p-2 hover:bg-muted/40 transition-all border-t">
        <div
          className="flex items-center gap-x-3 w-full cursor-pointer"
          onClick={() => setOwnProfileOpen(true)}
        >
          <Avatar>
            <AvatarImage
              src={
                data?.user.image ||
                `https://avatar.vercel.sh/${data?.user.email}`
              }
              alt="@shadcn"
            />
            <AvatarFallback>
              {data?.user.name
                ? data.user.name.charAt(0)
                : data?.user.email.split('@')[0].charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col leading-tight">
            <p className="font-medium text-sm text-foreground">
              {data?.user.name}{' '}
              <span
                className={cn(
                  'h-2 w-2 rounded-full inline-block',
                  isConnected ? 'bg-green-600' : 'bg-red-600'
                )}
              />
            </p>
            <p className="text-xs text-muted-foreground">{data?.user.email}</p>
          </div>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={isPending}
              onClick={signOutBTN}
              variant="ghost"
              size={'icon'}
              className="rounded-full cursor-pointer"
            >
              {isPending ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <LogOutIcon />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Log Out</TooltipContent>
        </Tooltip>
      </div>
      <OwnProfileDialog open={ownProfileOpen} setOpen={setOwnProfileOpen} />
    </div>
  );
}

// User Profile Dialog Component
interface UserProfileDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface UserType {
  _id: string;
  name: string;
  email: string;
  image: string;
  friendStatus: string;
}

export const UserProfileDialog = ({
  open,
  setOpen,
}: UserProfileDialogProps) => {
  const [search, setSearch] = useState('');
  const [requestData, setRequestData] = useState('');

  const searchValue = useDebounce(search, 500);

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['search-user', searchValue],
    queryFn: async (): Promise<UserType[]> => {
      if (!searchValue.trim()) return [];
      try {
        const res = await axiosInstance.get(
          `/api/users/search-user?name=${encodeURIComponent(searchValue)}`,
          { withCredentials: true }
        );
        return res.data;
      } catch (error) {
        throw error;
      }
    },
    enabled: !!searchValue.trim(),
    staleTime: 5 * 60 * 1000,
  });

  const { mutate: sendRequest, isPending: isSending } = useMutation({
    mutationFn: async (userId: string) => {
      const res = await axiosInstance.post(
        '/api/users/send-friend-request',
        { receiverId: userId },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: (data) => {
      setRequestData(data.status);
      toast.success('Friend request sent!');
    },
    onError: (err) => {
      toast.error('Failed to send request.');
    },
  });

  const handleSendRequest = (user?: UserType, type?: string) => {
    if (type === 'send-request') {
      if (!user) return;
      sendRequest(user?._id);
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            Connect Your Friends
          </DialogTitle>
          <DialogDescription className="text-center">
            Enter the name or email of the person you want to add to your friend
            list.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div className="rounded-lg">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-full focus:ring-0 outline-none font-inter"
            />

            <div className="max-h-64 overflow-y-auto">
              {isLoading && searchValue ? (
                <div className="flex h-32 items-center justify-center text-sm">
                  <div className="flex items-center justify-center">
                    <Spinner className="h-4 w-4" />
                    <span className="ml-2">Searching...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="flex h-32 items-center justify-center text-sm text-destructive">
                  Error searching users. Please try again.
                </div>
              ) : !searchValue ? (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  Start typing to search for users
                </div>
              ) : users.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  No users found.
                </div>
              ) : (
                users.map((user) => {
                  return (
                    <div
                      key={user._id}
                      className="flex cursor-pointer items-center justify-between px-3 py-2 transition bg-accent/20 border border-primary rounded-full my-4"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={
                              user.image ||
                              `https://avatar.vercel.sh/${user.email}`
                            }
                            alt={user.name}
                          />
                          <AvatarFallback className="text-xs">
                            {user.name?.[0]?.toUpperCase() ?? 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {user.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </div>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="secondary"
                            className={`h-8 w-8 rounded-full p-0`}
                            disabled={
                              isSending ||
                              isFriendStatus(
                                requestData,
                                user.friendStatus,
                                'pending'
                              ) ||
                              isFriendStatus(
                                requestData,
                                user.friendStatus,
                                'accepted'
                              ) ||
                              isFriendStatus(
                                requestData,
                                user.friendStatus,
                                'rejected'
                              )
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendRequest(user, 'send-request');
                            }}
                          >
                            {isFriendStatus(
                              requestData,
                              user.friendStatus,
                              'pending'
                            ) && <ClockCheck />}
                            {isFriendStatus(
                              requestData,
                              user.friendStatus,
                              'accepted'
                            ) && <UserCheck />}
                            {isFriendStatus(
                              requestData,
                              user.friendStatus,
                              'rejected'
                            ) && <UserX />}
                            {!requestData && !user.friendStatus && (
                              <CirclePlusIcon />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isFriendStatus(
                            requestData,
                            user.friendStatus,
                            'pending'
                          ) && 'Pending'}
                          {isFriendStatus(
                            requestData,
                            user.friendStatus,
                            'accepted'
                          ) && 'You are friends'}
                          {isFriendStatus(
                            requestData,
                            user.friendStatus,
                            'rejected'
                          ) && 'Rejected'}
                          {!requestData && !user.friendStatus && 'Add Friend'}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Friend Requests Dialog
interface FriendRequestsDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export interface IFriendRequestWithReceiver {
  _id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'block' | 'unblock';
  sender: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
}

const FriendRequestsDialog = ({ open, setOpen }: FriendRequestsDialogProps) => {
  const queryClient = useQueryClient();

  const { data: requestData = [], isLoading } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: async (): Promise<IFriendRequestWithReceiver[]> => {
      const res = await axiosInstance.get('/api/users/get-friend-request');
      return res.data;
    },
  });

  type FriendMutationData = { status: string; id: string };

  const handleRequests = useMutation({
    mutationKey: ['friend-requests'],
    mutationFn: async ({ status, id }: FriendMutationData) => {
      const res = await axiosInstance.post(
        `/api/users/handle-friend-request/${id}`,
        { userStatus: status },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === 'accept'
          ? 'Friend request accepted'
          : 'Friend request rejected'
      );
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center font-inter text-2xl">
            Friend Requests
          </DialogTitle>
          <DialogDescription className="text-center font-inter">
            See who wants to connect with you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-3">
          {isLoading ? (
            <div className="flex justify-center">
              <Spinner />
            </div>
          ) : requestData.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No friend requests
            </p>
          ) : (
            requestData.map((req: IFriendRequestWithReceiver) => (
              <div
                key={req._id}
                className="flex justify-between items-center bg-sidebar-accent/25 p-2 rounded-full"
              >
                {/* USER INFO */}
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={
                        req.sender.image ||
                        `https://avatar.vercel.sh/${req.sender.email}`
                      }
                      alt={req.sender.name}
                    />
                    <AvatarFallback>{req.sender.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm text-sidebar-foreground">
                    {req.sender.name}
                  </span>
                </div>

                {/* BUTTONS */}
                <div className="flex gap-2">
                  {req.status === 'pending' && (
                    <>
                      <Button
                        onClick={() =>
                          handleRequests.mutate({
                            status: 'accept',
                            id: req._id,
                          })
                        }
                        size="icon"
                        variant="ghost"
                        disabled={handleRequests.isPending}
                        className="h-8 w-8 rounded-full bg-primary/20"
                      >
                        {handleRequests.isPending ? (
                          <Spinner className="size-4" />
                        ) : (
                          <CirclePlusIcon className="size-4 text-green-600" />
                        )}
                      </Button>

                      <Button
                        onClick={() =>
                          handleRequests.mutate({
                            status: 'reject',
                            id: req._id,
                          })
                        }
                        size="icon"
                        variant="ghost"
                        disabled={handleRequests.isPending}
                        className="h-8 w-8 rounded-full bg-red-600/20"
                      >
                        {handleRequests.isPending ? (
                          <Spinner className="size-4" />
                        ) : (
                          <CircleXIcon className="size-4 text-red-500" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Own Profile Dialog
interface OwnProfileDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const OwnProfileDialog = ({ open, setOpen }: OwnProfileDialogProps) => {
  const { data } = useSession();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center font-inter text-2xl">
            Your Profile
          </DialogTitle>
          <DialogDescription className="text-center font-inter">
            View your profile information
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <Avatar className="h-24 w-24">
            <AvatarImage
              src={
                data?.user.image ||
                `https://avatar.vercel.sh/${data?.user.email}`
              }
            />
            <AvatarFallback className="text-2xl">
              {data?.user.name?.charAt(0) ||
                data?.user.email.split('@')[0].charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h3 className="text-xl font-semibold">{data?.user.name}</h3>
            <p className="text-sm text-muted-foreground">{data?.user.email}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
