import React, { useState } from 'react';
import {
  Search,
  MessageSquare,
  UserPlus,
  UserCheck,
  Clock,
  Check,
  X,
  Phone,
  Video,
  Heart,
  Users,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { UserPresence, FollowRequest, UserProfile } from '../types';

interface SearchTabProps {
  currentUserUid: string;
  users: UserPresence[];
  followRequests: FollowRequest[];
  onOpenDirectChat: (partner: UserPresence) => void;
  onSendFollowRequest: (targetUid: string, targetName: string) => Promise<void>;
  onAcceptFollowRequest: (request: FollowRequest) => Promise<void>;
  onDeclineFollowRequest: (requestId: string) => Promise<void>;
  onUnfriend: (targetUid: string) => Promise<void>;
  onViewProfile: (profile: UserProfile) => void;
  onStartCall: (partnerUid: string, partnerName: string, type: 'audio' | 'video') => void;
}

export const SearchTab: React.FC<SearchTabProps> = ({
  currentUserUid,
  users,
  followRequests,
  onOpenDirectChat,
  onSendFollowRequest,
  onAcceptFollowRequest,
  onDeclineFollowRequest,
  onUnfriend,
  onViewProfile,
  onStartCall
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [subTab, setSubTab] = useState<'all' | 'requests'>('all');
  const [pendingActionUid, setPendingActionUid] = useState<string | null>(null);

  const incomingPending = followRequests.filter((r) => r.status === 'pending');

  // Filter users by search query
  const filteredUsers = users.filter((u) => {
    if (u.uid === currentUserUid) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      (u.handle || '').toLowerCase().includes(q) ||
      (u.bio || '').toLowerCase().includes(q)
    );
  });

  const handleSendRequest = async (user: UserPresence) => {
    setPendingActionUid(user.uid);
    try {
      await onSendFollowRequest(user.uid, user.name);
    } finally {
      setPendingActionUid(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d1625] text-white">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-[#213247] bg-[#111e30] shrink-0">
        <h2 className="text-lg font-extrabold text-white mb-0.5">Find &amp; Add Friends</h2>
        <p className="text-xs text-[#a6b5ca] mb-3">
          Search for users by name to send a friend request. Once accepted, you can message!
        </p>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or @handle…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08121f] border border-[#273a52] text-sm text-white placeholder-gray-500 outline-none focus:border-[#67e8c4] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 p-0.5 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-2 mt-3 text-xs font-semibold">
          <button
            onClick={() => setSubTab('all')}
            className={`py-1.5 px-3 rounded-xl transition ${
              subTab === 'all'
                ? 'bg-[#67e8c4] text-[#09271f]'
                : 'bg-[#1b2b40] text-gray-300 hover:text-white'
            }`}
          >
            All Users ({filteredUsers.length})
          </button>
          <button
            onClick={() => setSubTab('requests')}
            className={`py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition ${
              subTab === 'requests'
                ? 'bg-[#67e8c4] text-[#09271f]'
                : 'bg-[#1b2b40] text-gray-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Friend Requests
            {incomingPending.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold text-[10px]">
                {incomingPending.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
        {subTab === 'all' && (
          <>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-14 px-4 rounded-2xl bg-[#0f1b2c] border border-[#1e2f44]">
                <Search className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-300">
                  {searchQuery ? `No user found matching "${searchQuery}"` : 'No other members found'}
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                  Type the exact name or handle of the person you want to find.
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isFriend = Boolean(user.isFriend);
                const isPending = Boolean(user.hasPendingRequest);
                const hasIncoming = Boolean(user.hasIncomingRequest);

                return (
                  <div
                    key={user.uid}
                    className="p-3.5 rounded-2xl bg-[#142338] border border-[#213752] hover:border-[#2f4f78] flex items-center justify-between gap-3 shadow-sm transition"
                  >
                    {/* User profile preview */}
                    <div
                      onClick={() =>
                        onViewProfile({
                          uid: user.uid,
                          chatName: user.name,
                          handle: user.handle,
                          bio: user.bio,
                          statusMessage: user.statusMessage,
                          avatarColor: user.avatarColor,
                          avatarEmoji: user.avatarEmoji,
                          avatarUrl: user.avatarUrl,
                          favoriteManual: user.favoriteManual
                        })
                      }
                      className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                    >
                      <div className="relative shrink-0">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-11 h-11 rounded-2xl object-cover shadow-md border border-white/10"
                          />
                        ) : (
                          <div
                            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-md border border-white/10"
                            style={{ backgroundColor: user.avatarColor || '#1f354f' }}
                          >
                            {user.avatarEmoji || user.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}

                        {/* Online / Offline Status Dot */}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#142338] ${
                            user.online ? 'bg-emerald-400' : 'bg-gray-500'
                          }`}
                          title={user.online ? 'Active' : 'Offline'}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-white truncate">{user.name}</h4>
                          <span
                            className={`text-[10px] font-medium ${
                              user.online ? 'text-emerald-400' : 'text-gray-400'
                            }`}
                          >
                            {user.online ? '· Active' : '· Offline'}
                          </span>
                        </div>
                        {user.handle && (
                          <p className="text-xs text-[#67e8c4] font-mono truncate">{user.handle}</p>
                        )}
                        {user.bio ? (
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">{user.bio}</p>
                        ) : (
                          <p className="text-[11px] text-gray-400 italic truncate mt-0.5">
                            {user.statusMessage || 'Available'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Friend & Messaging Gating Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isFriend ? (
                        <>
                          {/* If mutual friends: unlock Direct Chat! */}
                          <button
                            onClick={() => onOpenDirectChat(user)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#67e8c4] hover:bg-[#52d6b1] text-[#09271f] font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                            title={`Chat with ${user.name}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Chat</span>
                          </button>

                          {/* Quick audio/video call if friend is online */}
                          {user.online && (
                            <>
                              <button
                                onClick={() => onStartCall(user.uid, user.name, 'audio')}
                                className="p-2 rounded-xl bg-[#20334d] hover:bg-[#2c476c] text-[#67e8c4] transition cursor-pointer"
                                title="Audio Call"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onStartCall(user.uid, user.name, 'video')}
                                className="p-2 rounded-xl bg-[#20334d] hover:bg-[#2c476c] text-[#67e8c4] transition cursor-pointer"
                                title="Video Call"
                              >
                                <Video className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </>
                      ) : isPending ? (
                        /* Request sent: waiting for acceptance */
                        <button
                          disabled
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#23354c] text-amber-300 font-semibold text-xs border border-amber-500/30 cursor-not-allowed opacity-90"
                          title="Friend request sent, waiting for them to accept"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Request Sent ⏳</span>
                        </button>
                      ) : hasIncoming ? (
                        /* This user requested you: show Accept button */
                        <button
                          onClick={() => {
                            const req = followRequests.find((r) => r.fromUid === user.uid);
                            if (req) onAcceptFollowRequest(req);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#67e8c4] hover:bg-[#52d6b1] text-[#09271f] font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept Request</span>
                        </button>
                      ) : (
                        /* Not friends: Send Friend Request button */
                        <button
                          onClick={() => handleSendRequest(user)}
                          disabled={pendingActionUid === user.uid}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1d324d] hover:bg-[#274366] text-[#67e8c4] border border-[#2f4d75] font-semibold text-xs transition active:scale-95 cursor-pointer"
                          title="Send friend request to connect"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Add Friend</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {subTab === 'requests' && (
          <>
            {incomingPending.length === 0 ? (
              <div className="text-center py-14 px-4 rounded-2xl bg-[#0f1b2c] border border-[#1e2f44]">
                <Users className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-300">No pending friend requests</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                  When someone searches your name and sends a friend request, it will appear here for you to accept.
                </p>
              </div>
            ) : (
              incomingPending.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-2xl bg-[#142338] border border-[#213752] flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {req.fromAvatarUrl ? (
                      <img
                        src={req.fromAvatarUrl}
                        alt={req.fromName}
                        className="w-11 h-11 rounded-2xl object-cover shadow border border-white/10"
                      />
                    ) : (
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg shadow shrink-0 border border-white/10"
                        style={{ backgroundColor: req.fromAvatarColor || '#233954' }}
                      >
                        {req.fromAvatarEmoji || req.fromName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white truncate">{req.fromName}</h4>
                      {req.fromHandle && (
                        <p className="text-xs text-[#67e8c4] font-mono">{req.fromHandle}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-0.5">Wants to become friends with you</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onAcceptFollowRequest(req)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#67e8c4] hover:bg-[#52d6b1] text-[#09271f] font-bold text-xs transition active:scale-95 cursor-pointer shadow-md"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => onDeclineFollowRequest(req.id)}
                      className="p-1.5 rounded-xl bg-[#20334d] hover:bg-rose-500/20 text-gray-300 hover:text-rose-300 transition cursor-pointer"
                      title="Decline request"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};
