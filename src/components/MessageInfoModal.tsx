import React, { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { db, BASE } from '../firebase';
import { MessageItem } from '../types';
import { X, Clock, Eye, MessageSquare, User } from 'lucide-react';

interface MessageInfoModalProps {
  message: MessageItem | null;
  onClose: () => void;
  currentUid: string;
}

export const MessageInfoModal: React.FC<MessageInfoModalProps> = ({
  message,
  onClose,
  currentUid
}) => {
  const [seenTimeStr, setSeenTimeStr] = useState('Loading…');

  useEffect(() => {
    if (!message) return;

    setSeenTimeStr('Loading…');
    get(ref(db, `${BASE}/messageSeen/${message.id}`))
      .then((snapshot) => {
        if (!snapshot.exists()) {
          setSeenTimeStr('Not seen yet');
          return;
        }

        const values = Object.values(snapshot.val() || {})
          .filter((v): v is number => typeof v === 'number')
          .sort((a, b) => b - a);

        if (values.length > 0) {
          setSeenTimeStr(
            new Date(values[0]).toLocaleString([], {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          );
        } else {
          setSeenTimeStr('Not seen yet');
        }
      })
      .catch(() => {
        setSeenTimeStr('Not available');
      });
  }, [message]);

  if (!message) return null;

  const sentTimeStr = message.createdAt
    ? new Date(message.createdAt).toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Not available';

  const isMine = message.uid === currentUid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-[#111e30] border border-[#354860] p-5 shadow-2xl overflow-hidden">
        
        <div className="flex items-center justify-between pb-3 border-b border-[#25364e] mb-4">
          <h3 className="font-bold text-white text-base">Message details</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2c42] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          <div className="p-3 rounded-xl bg-[#162538] border border-[#233852]">
            <div className="flex items-center gap-1.5 text-gray-400 font-medium mb-1">
              <User className="w-3.5 h-3.5 text-[#67e8c4]" />
              <span>Sender</span>
            </div>
            <div className="text-white font-semibold text-sm">
              {isMine ? 'You' : message.senderName || 'Unknown member'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#162538] border border-[#233852]">
            <div className="flex items-center gap-1.5 text-gray-400 font-medium mb-1">
              <MessageSquare className="w-3.5 h-3.5 text-[#67e8c4]" />
              <span>Message</span>
            </div>
            <div className="text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
              {message.text}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-[#162538] border border-[#233852]">
              <div className="flex items-center gap-1.5 text-gray-400 font-medium mb-1">
                <Clock className="w-3.5 h-3.5 text-[#67e8c4]" />
                <span>Sent</span>
              </div>
              <div className="text-white font-medium">{sentTimeStr}</div>
            </div>

            <div className="p-3 rounded-xl bg-[#162538] border border-[#233852]">
              <div className="flex items-center gap-1.5 text-gray-400 font-medium mb-1">
                <Eye className="w-3.5 h-3.5 text-[#67e8c4]" />
                <span>Seen</span>
              </div>
              <div className="text-white font-medium">{seenTimeStr}</div>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-[#25364e] flex justify-end">
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
