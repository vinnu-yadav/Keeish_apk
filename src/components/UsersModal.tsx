import React from 'react';
import { Phone, Video, X, User } from 'lucide-react';
import { UserPresence } from '../types';

interface UsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserPresence[];
  currentUid: string;
  onStartCall: (partnerUid: string, partnerName: string, type: 'audio' | 'video') => void;
}

export const UsersModal: React.FC<UsersModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUid,
  onStartCall
}) => {
  if (!isOpen) return null;

  const activeCount = users.filter((u) => u.online).length;
  const inactiveCount = users.length - activeCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md max-h-[85dvh] flex flex-col rounded-2xl bg-[#111e30] border border-[#354860] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#25364d]">
          <div>
            <h3 className="font-bold text-white text-base">Chat members</h3>
            <p className="text-xs text-[#a6b5ca] mt-0.5">
              {activeCount} active · {inactiveCount} inactive · {users.length} total
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2c42] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User list */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {users.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#a6b5ca]">
              No members registered yet.
            </div>
          ) : (
            users.map((user) => {
              const isSelf = user.uid === currentUid;
              return (
                <div
                  key={user.uid}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#192a40] border border-[#233852]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-[#273b54] text-white flex items-center justify-center text-xs font-bold">
                        {(user.name || 'Member').slice(0, 2).toUpperCase()}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#192a40] ${
                          user.online ? 'bg-emerald-400' : 'bg-gray-500'
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">
                        {user.name} {isSelf && <span className="text-xs text-[#67e8c4] font-normal">(You)</span>}
                      </div>
                      <div className="text-[11px] text-[#a6b5ca]">
                        {user.online ? (
                          <span className="text-[#67e8c4]">Active now</span>
                        ) : (
                          'Inactive'
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onStartCall(user.uid, user.name, 'audio')}
                      disabled={isSelf || !user.online}
                      title={!user.online ? 'User is offline' : 'Audio call'}
                      className="p-2 rounded-lg bg-[#25364e] hover:bg-[#344a69] text-[#67e8c4] disabled:opacity-35 disabled:cursor-not-allowed transition"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onStartCall(user.uid, user.name, 'video')}
                      disabled={isSelf || !user.online}
                      title={!user.online ? 'User is offline' : 'Video call'}
                      className="p-2 rounded-lg bg-[#25364e] hover:bg-[#344a69] text-[#67e8c4] disabled:opacity-35 disabled:cursor-not-allowed transition"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#25364d] bg-[#0d1726] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#25364e] hover:bg-[#344a69] text-white text-xs font-medium transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
