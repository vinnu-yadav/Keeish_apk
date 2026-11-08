import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  UserCheck,
  Clock,
  Check,
  X,
  Phone,
  Video,
  User,
  Sparkles,
  Heart
} from 'lucide-react';
import { UserPresence, FollowRequest, UserProfile } from '../types';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserUid: string;
  users: UserPresence[];
  followRequests: FollowRequest[];
  followingUids: Set<string>;
  onSendFollowRequest: (targetUid: string, targetName: string) => Promise<void>;
  onAcceptFollowRequest: (request: FollowRequest) => Promise<void>;
  onDeclineFollowRequest: (requestId: string) => Promise<void>;
  onUnfollow: (targetUid: string) => Promise<void>;
  onViewProfile: (profile: UserProfile) => void;
  onStartCall: (partnerUid: string, partnerName: string, type: 'audio' | 'video') => void;
}

export const UserSearchModal: React.FC<UserSearchModalProps> = ({
  isOpen,
  onClose,
  currentUserUid,
  users,
  followRequests,
  followingUids,
  onSendFollowRequest,
  onAcceptFollowRequest,
  onDeclineFollowRequest,
  onUnfollow,
  onViewProfile,
  onStartCall
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'following' | 'requests'>('search');
  const [pendingActionUid, setPendingActionUid] = useState<string | null>(null);

  if (!isOpen) return null;

  const incomingPending = followRequests.filter(r => r.status === 'pending');

  // Filter users based on query
  const filteredUsers = users.filter((u) => {
    if (u.uid === currentUserUid) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = u.name.toLowerCase().includes(q);
    const handleMatch = (u.handle || '').toLowerCase().includes(q);
    const bioMatch = (u.bio || '').toLowerCase().includes(q);
    return nameMatch || handleMatch || bioMatch;
  });

  const followingUsers = users.filter(u => u.uid !== currentUserUid && followingUids.has(u.uid));

  const handleFollowClick = async (user: UserPresence) => {
    setPendingActionUid(user.uid);
    try {
      if (followingUids.has(user.uid)) {
        await onUnfollow(user.uid);
      } else {
        await onSendFollowRequest(user.uid, user.name);
      }
    } finally {
      setPendingActionUid(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg max-h-[90dvh] flex flex-col rounded-3xl bg-[#101b2c] border border-[#2b3e56] shadow-2xl overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#203248] bg-[#0c1624]">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2 text-white">
              <Search className="w-4 h-4 text-[#67e8c4]" />
              Find Members &amp; Connections
            </h3>
            <p className="text-xs text-[#a6b5ca] mt-0.5">
              Search users, send follow requests, and view profiles
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2c42] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#203248] bg-[#0c1524] px-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('search')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'search'
                ? 'border-[#67e8c4] text-[#67e8c4]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Search ({filteredUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'following'
                ? 'border-[#67e8c4] text-[#67e8c4]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Following ({followingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 relative ${
              activeTab === 'requests'
                ? 'border-[#67e8c4] text-[#67e8c4]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Requests
            {incomingPending.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold text-[10px] animate-pulse">
                {incomingPending.length}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar (shown in Search tab) */}
        {activeTab === 'search' && (
          <div className="p-4 border-b border-[#203248] bg-[#0f1a29]">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, @handle, or bio…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08121f] border border-[#2b3e56] text-sm text-white placeholder-gray-500 outline-none focus:border-[#67e8c4]"
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
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {activeTab === 'search' && (
            <>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#a6b5ca]">
                  {searchQuery ? `No members found matching "${searchQuery}"` : 'No other members found.'}
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isFollowing = followingUids.has(user.uid);
                  const isPending = user.hasPendingRequest;

                  return (
                    <div
                      key={user.uid}
                      className="p-3.5 rounded-2xl bg-[#142338] border border-[#213752] flex items-center justify-between gap-3 hover:border-[#2f4f78] transition"
                    >
                      {/* User Info with Avatar */}
                      <div
                        onClick={() => onViewProfile({
                          uid: user.uid,
                          chatName: user.name,
                          handle: user.handle,
                          bio: user.bio,
                          statusMessage: user.statusMessage,
                          avatarColor: user.avatarColor,
                          avatarEmoji: user.avatarEmoji,
                          favoriteManual: user.favoriteManual
                        })}
                        className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                      >
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-md shrink-0 border border-white/10"
                          style={{ backgroundColor: user.avatarColor || '#1f344d' }}
                        >
                          {user.avatarEmoji || user.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-white truncate">{user.name}</span>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${user.online ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                          </div>
                          {user.handle && (
                            <p className="text-xs text-[#67e8c4] font-mono truncate">{user.handle}</p>
                          )}
                          {user.bio && (
                            <p className="text-[11px] text-gray-400 truncate mt-0.5">{user.bio}</p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Call icons if online */}
                        {user.online && (
                          <>
                            <button
                              onClick={() => onStartCall(user.uid, user.name, 'audio')}
                              className="p-2 rounded-xl bg-[#25364e] hover:bg-[#344a69] text-[#67e8c4] transition"
                              title="Audio Call"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onStartCall(user.uid, user.name, 'video')}
                              className="p-2 rounded-xl bg-[#25364e] hover:bg-[#344a69] text-[#67e8c4] transition"
                              title="Video Call"
                            >
                              <Video className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {/* Follow Button */}
                        <button
                          onClick={() => handleFollowClick(user)}
                          disabled={pendingActionUid === user.uid || isPending}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                            isFollowing
                              ? 'bg-[#1e3857] text-[#67e8c4] border border-[#2b4c73] hover:bg-rose-500/20 hover:text-rose-300'
                              : isPending
                              ? 'bg-[#25364e] text-amber-300 border border-amber-500/30'
                              : 'bg-[#67e8c4] hover:bg-[#52d6b1] text-[#09271f]'
                          }`}
                        >
                          {isFollowing ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Following</span>
                            </>
                          ) : isPending ? (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              <span>Requested</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Follow</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'following' && (
            <>
              {followingUsers.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#a6b5ca]">
                  You aren't following any members yet. Search above to connect!
                </div>
              ) : (
                followingUsers.map((user) => (
                  <div
                    key={user.uid}
                    className="p-3.5 rounded-2xl bg-[#142338] border border-[#213752] flex items-center justify-between gap-3"
                  >
                    <div
                      onClick={() => onViewProfile({
                        uid: user.uid,
                        chatName: user.name,
                        handle: user.handle,
                        bio: user.bio,
                        statusMessage: user.statusMessage,
                        avatarColor: user.avatarColor,
                        avatarEmoji: user.avatarEmoji,
                        favoriteManual: user.favoriteManual
                      })}
                      className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow shrink-0"
                        style={{ backgroundColor: user.avatarColor || '#1f344d' }}
                      >
                        {user.avatarEmoji || user.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-white truncate">{user.name}</div>
                        {user.handle && <p className="text-xs text-[#67e8c4] font-mono">{user.handle}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {user.online && (
                        <button
                          onClick={() => onStartCall(user.uid, user.name, 'video')}
                          className="p-2 rounded-xl bg-[#25364e] hover:bg-[#344a69] text-[#67e8c4] transition"
                        >
                          <Video className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onUnfollow(user.uid)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#20334a] hover:bg-rose-500/20 text-gray-300 hover:text-rose-300 text-xs font-semibold transition"
                      >
                        Unfollow
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'requests' && (
            <>
              {incomingPending.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#a6b5ca]">
                  No pending follow requests right now.
                </div>
              ) : (
                incomingPending.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-2xl bg-[#142338] border border-[#213752] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow shrink-0"
                        style={{ backgroundColor: req.fromAvatarColor || '#233954' }}
                      >
                        {req.fromAvatarEmoji || req.fromName.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-white truncate">{req.fromName}</div>
                        {req.fromHandle && <p className="text-xs text-[#67e8c4] font-mono">{req.fromHandle}</p>}
                        <p className="text-[10px] text-gray-400 mt-0.5">Sent a follow request</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onAcceptFollowRequest(req)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#67e8c4] hover:bg-[#52d6b1] text-[#09271f] font-bold text-xs transition active:scale-95 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => onDeclineFollowRequest(req.id)}
                        className="p-1.5 rounded-xl bg-[#25364e] hover:bg-rose-500/20 text-gray-300 hover:text-rose-300 transition cursor-pointer"
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

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#203248] bg-[#0c1624] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#25364e] hover:bg-[#344a69] text-white text-xs font-semibold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
