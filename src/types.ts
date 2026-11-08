export interface MessageItem {
  id: string;
  uid: string;
  senderName: string;
  text: string;
  createdAt: number | null;
}

export interface UserProfile {
  uid: string;
  chatName: string;
  handle?: string;
  bio?: string;
  statusMessage?: string;
  avatarColor?: string;
  avatarEmoji?: string;
  avatarUrl?: string; // Custom profile photo from device gallery (data URL)
  favoriteManual?: string;
  joinedAt?: number;
}

export interface UserPresence {
  uid: string;
  name: string;
  online: boolean;
  lastActive?: number;
  handle?: string;
  bio?: string;
  statusMessage?: string;
  avatarColor?: string;
  avatarEmoji?: string;
  avatarUrl?: string; // Custom profile photo from device gallery
  favoriteManual?: string;
  isFriend?: boolean;
  isFollowing?: boolean;
  hasPendingRequest?: boolean;
  hasIncomingRequest?: boolean;
}

export interface ConversationThread {
  chatId: string;
  isGroup?: boolean;
  groupName?: string;
  partnerUid?: string;
  partnerName: string;
  partnerHandle?: string;
  partnerAvatarColor?: string;
  partnerAvatarEmoji?: string;
  partnerAvatarUrl?: string;
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount?: number;
  online?: boolean;
}

export interface FollowRequest {
  id: string;
  fromUid: string;
  fromName: string;
  fromHandle?: string;
  fromAvatarColor?: string;
  fromAvatarEmoji?: string;
  fromAvatarUrl?: string;
  targetUid: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface CallSignal {
  id: string;
  callerUid: string;
  callerName: string;
  callerAvatarUrl?: string;
  receiverUid: string;
  callType: 'audio' | 'video';
  status: 'ringing' | 'accepted' | 'rejected' | 'ended';
  offer?: {
    type: RTCSdpType;
    sdp: string;
  };
  answer?: {
    type: RTCSdpType;
    sdp: string;
  };
  createdAt?: number;
}
