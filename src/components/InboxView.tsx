import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  Users,
  UserPlus,
  Phone,
  Video,
  ChevronRight,
  ShieldCheck,
  Plus,
  HeartHandshake
} from 'lucide-react';
import { UserPresence, ConversationThread } from '../types';

interface InboxViewProps {
  currentUserUid: string;
  chatName: string;
  users: UserPresence[];
  conversations: Record<string, { lastText?: string; lastTime?: number; unread?: number }>;
  onOpenDirectChat: (partner: UserPresence) => void;
  onOpenLoungeChat: () => void;
  onGoToSearch: () => void;
  onStartCall: (partnerUid: string, partnerName: string, type: 'audio' | 'video') => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  currentUserUid,
  chatName,
  users,
  conversations,
  onOpenDirectChat,
  onOpenLoungeChat,
  onGoToSearch,
  onStartCall
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  // Only display users who are accepted mutual friends!
  const friendUsers = users.filter((u) => u.uid !== currentUserUid && u.isFriend);

  // Filter friends by search input inside inbox
  const filteredFriends = friendUsers.filter((u) => {
    const q = filterQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      (u.handle || '').toLowerCase().includes(q) ||
      (u.statusMessage || '').toLowerCase().includes(q)
    );
  });

  const activeFriendsCount = friendUsers.filter((u) => u.online).length;

  const formatRelativeTime = (ts?: number) => {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d1625] text-white">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-[#213247] bg-[#111e30] shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#67e8c4] to-[#2563eb] text-[#09271f] font-black text-xl flex items-center justify-center shadow-md">
              k
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white leading-tight">Inbox</h2>
              <p className="text-xs text-[#a6b5ca]">
                {friendUsers.length === 0 ? (
                  <span>Connect with friends to start chatting</span>
                ) : (
                  <span>
                    <span className="text-[#67e8c4] font-semibold">{activeFriendsCount} active</span> · {friendUsers.length} {friendUsers.length === 1 ? 'friend' : 'friends'}
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onGoToSearch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b2f48] hover:bg-[#284469] border border-[#2b4b75] text-[#67e8c4] text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Find Friends</span>
          </button>
        </div>

        {/* Search input in inbox (active if user has friends) */}
        {friendUsers.length > 0 && (
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search your friends…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08121f] border border-[#253950] text-sm text-white placeholder-gray-500 outline-none focus:border-[#67e8c4] transition"
            />
          </div>
        )}
      </div>

      {/* Conversations & Friends List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
        
        {/* Keeish Lounge Community Room Card */}
        <div
          onClick={onOpenLoungeChat}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-[#14263b] to-[#101d2d] border border-[#233852] hover:border-[#67e8c4]/50 flex items-center justify-between gap-3 cursor-pointer transition active:scale-[0.99] shadow-sm group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#67e8c4] to-[#0ea5e9] text-[#09271f] flex items-center justify-center font-bold text-lg shadow-md shrink-0">
              <Users className="w-6 h-6 text-[#09271f]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-white group-hover:text-[#67e8c4] transition">
                  Keeish Community Lounge
                </h4>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                  Public Lounge
                </span>
              </div>
              <p className="text-xs text-[#a6b5ca] truncate mt-0.5">
                Open public space to meet other members and discover friends
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition shrink-0" />
        </div>

        {/* Section title */}
        <div className="pt-2 px-1 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
          <span>Friends &amp; Direct Chats</span>
          <span>{friendUsers.length} {friendUsers.length === 1 ? 'friend' : 'friends'}</span>
        </div>

        {/* If user has NO friends yet: Show prompt to search and send request */}
        {friendUsers.length === 0 ? (
          <div className="text-center py-12 px-5 rounded-2xl bg-[#0f1b2c] border border-[#1e2f44] space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#18293d] border border-[#283e5a] text-[#67e8c4] flex items-center justify-center mx-auto shadow-md">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No Friends Added Yet</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">
                To start direct messaging, search for a user by name or handle and send them a friend request. Once they accept, they will appear here so you can chat!
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={onGoToSearch}
                className="px-5 py-2.5 rounded-xl bg-[#67e8c4] hover:bg-[#52d6b1] text-[#09271f] font-bold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-2 mx-auto"
              >
                <Search className="w-4 h-4" />
                <span>Search Users &amp; Add Friends</span>
              </button>
            </div>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-2xl bg-[#0f1b2c] border border-[#1e2f44]">
            <Search className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-300">
              No friend matching "{filterQuery}"
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Check the spelling or search all users in the Search tab.
            </p>
          </div>
        ) : (
          filteredFriends.map((friend) => {
            const chatId = [currentUserUid, friend.uid].sort().join('__');
            const conv = conversations[chatId] || {};
            const hasMessages = Boolean(conv.lastText);

            return (
              <div
                key={friend.uid}
                onClick={() => onOpenDirectChat(friend)}
                className="p-3.5 rounded-2xl bg-[#142338] border border-[#213752] hover:border-[#2f4f78] flex items-center justify-between gap-3 cursor-pointer transition active:scale-[0.99] shadow-sm group"
              >
                {/* Avatar with custom gallery photo or emoji + live active/offline dot */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    {friend.avatarUrl ? (
                      <img
                        src={friend.avatarUrl}
                        alt={friend.name}
                        className="w-12 h-12 rounded-2xl object-cover shadow-md border border-white/10"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-md border border-white/10"
                        style={{ backgroundColor: friend.avatarColor || '#1f354f' }}
                      >
                        {friend.avatarEmoji || friend.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}

                    {/* Online / Offline Status Dot */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#142338] ${
                        friend.online
                          ? 'bg-emerald-400 shadow-sm shadow-emerald-400/80'
                          : 'bg-gray-500'
                      }`}
                      title={friend.online ? 'Active' : 'Offline'}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="font-bold text-sm text-white group-hover:text-[#67e8c4] transition truncate">
                          {friend.name}
                        </h4>
                        {/* Explicit Active / Offline label */}
                        <span
                          className={`text-[10px] font-medium shrink-0 ${
                            friend.online ? 'text-emerald-400' : 'text-gray-400'
                          }`}
                        >
                          {friend.online ? 'Active' : 'Offline'}
                        </span>
                      </div>
                      {conv.lastTime && (
                        <span className="text-[11px] text-gray-400 shrink-0">
                          {formatRelativeTime(conv.lastTime)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-xs text-gray-300 truncate">
                        {hasMessages ? conv.lastText : friend.statusMessage || 'Tap to message'}
                      </p>
                      {friend.handle && (
                        <span className="text-[10px] font-mono text-gray-400 shrink-0 hidden sm:inline">
                          {friend.handle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Call Actions if friend is online */}
                <div
                  className="flex items-center gap-1.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {friend.online && (
                    <>
                      <button
                        onClick={() => onStartCall(friend.uid, friend.name, 'audio')}
                        className="p-2 rounded-xl bg-[#20334d] hover:bg-[#2d486e] text-[#67e8c4] transition cursor-pointer"
                        title="Voice Call"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onStartCall(friend.uid, friend.name, 'video')}
                        className="p-2 rounded-xl bg-[#20334d] hover:bg-[#2d486e] text-[#67e8c4] transition cursor-pointer"
                        title="Video Call"
                      >
                        <Video className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition ml-1" />
                </div>
              </div>
            );
          })
        )}

      </div>
    </div>
  );
};
