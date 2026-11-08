import React, { useState, useEffect } from 'react';
import { ref, set, update } from 'firebase/database';
import { db, BASE } from '../firebase';
import { UserProfile } from '../types';
import {
  X,
  User,
  AtSign,
  Smile,
  Palette,
  FileText,
  Save,
  CheckCircle2,
  Sparkles,
  Phone,
  Video,
  UserCheck,
  UserPlus
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserUid: string;
  // If inspecting another user's profile, pass targetProfile; if null, user is editing own profile
  targetProfile?: UserProfile | null;
  onStartCall?: (partnerUid: string, partnerName: string, type: 'audio' | 'video') => void;
  isFollowing?: boolean;
  hasPendingRequest?: boolean;
  onSendFollowRequest?: (targetUid: string, targetName: string) => void;
}

const AVATAR_COLORS = [
  '#67e8c4', // Emerald / Teal
  '#38bdf8', // Sky Blue
  '#818cf8', // Indigo
  '#f472b6', // Pink
  '#fbbf24', // Amber
  '#a78bfa', // Purple
  '#f87171'  // Coral
];

const EMOJI_PRESETS = ['💡', '❤️', '🚀', '🌟', '⚡', '🍀', '🎧', '🛡️', '☕', '🐱'];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUserUid,
  targetProfile,
  onStartCall,
  isFollowing,
  hasPendingRequest,
  onSendFollowRequest
}) => {
  const isSelf = !targetProfile || targetProfile.uid === currentUserUid;

  // Form states
  const [chatName, setChatName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [statusMessage, setStatusMessage] = useState('Available for calls');
  const [avatarColor, setAvatarColor] = useState('#67e8c4');
  const [avatarEmoji, setAvatarEmoji] = useState('💡');
  const [favoriteManual, setFavoriteManual] = useState('Tech Tips & Shortcuts');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (targetProfile) {
      setChatName(targetProfile.chatName || '');
      setHandle(targetProfile.handle || '');
      setBio(targetProfile.bio || '');
      setStatusMessage(targetProfile.statusMessage || 'Available for calls');
      setAvatarColor(targetProfile.avatarColor || '#67e8c4');
      setAvatarEmoji(targetProfile.avatarEmoji || '💡');
      setFavoriteManual(targetProfile.favoriteManual || 'Tech Tips & Shortcuts');
    }
  }, [targetProfile, isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatName.trim() || !currentUserUid) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const profileData: Partial<UserProfile> = {
        chatName: chatName.trim(),
        handle: handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim().replace(/\s+/g, '') || 'reader'}`,
        bio: bio.trim(),
        statusMessage: statusMessage.trim(),
        avatarColor,
        avatarEmoji,
        favoriteManual: favoriteManual.trim()
      };

      await update(ref(db, `${BASE}/users/${currentUserUid}`), profileData);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Save profile error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md max-h-[90dvh] flex flex-col rounded-3xl bg-[#101b2c] border border-[#2b3e56] shadow-2xl overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#203248] bg-[#0c1624]">
          <h3 className="font-bold text-base flex items-center gap-2">
            <User className="w-4 h-4 text-[#67e8c4]" />
            {isSelf ? 'My Profile Details' : `${chatName || 'Member'}'s Profile`}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2c42] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Preview */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#16273e] to-[#0e1a2b] border border-[#273d59] flex items-center gap-4">
            {targetProfile?.avatarUrl ? (
              <img
                src={targetProfile.avatarUrl}
                alt={chatName}
                className="w-16 h-16 rounded-2xl object-cover shadow-lg shrink-0 border-2 border-white/20"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0 border-2 border-white/20"
                style={{ backgroundColor: avatarColor }}
              >
                {avatarEmoji}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-black text-lg text-white truncate">
                {chatName || 'Your Name'}
              </h4>
              <p className="text-xs text-[#67e8c4] font-mono">
                {handle || '@handle'}
              </p>
              <p className="text-[11px] text-gray-300 mt-1 italic truncate">
                "{statusMessage || 'Available'}"
              </p>
            </div>
          </div>

          {/* If viewing another user's profile */}
          {!isSelf && targetProfile && (
            <div className="space-y-4">
              {bio && (
                <div className="p-3.5 rounded-xl bg-[#0c1726] border border-[#203248] text-xs">
                  <div className="text-gray-400 font-semibold mb-1">About</div>
                  <p className="text-gray-200 leading-relaxed">{bio}</p>
                </div>
              )}

              {favoriteManual && (
                <div className="p-3.5 rounded-xl bg-[#0c1726] border border-[#203248] text-xs">
                  <div className="text-gray-400 font-semibold mb-1">Favorite Quick Manual</div>
                  <p className="text-[#fbbf24] font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {favoriteManual}
                  </p>
                </div>
              )}

              {/* Action buttons for other user */}
              <div className="flex gap-2.5 pt-2">
                {onSendFollowRequest && (
                  <button
                    onClick={() => onSendFollowRequest(targetProfile.uid, chatName)}
                    disabled={isFollowing || hasPendingRequest}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition active:scale-95 ${
                      isFollowing
                        ? 'bg-[#1e344f] text-emerald-300'
                        : hasPendingRequest
                        ? 'bg-[#25364e] text-amber-300'
                        : 'bg-[#67e8c4] hover:bg-[#52d6b1] text-[#09271f]'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        Following
                      </>
                    ) : hasPendingRequest ? (
                      <>Requested ⏳</>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Send Follow Request
                      </>
                    )}
                  </button>
                )}

                {onStartCall && (
                  <>
                    <button
                      onClick={() => {
                        onClose();
                        onStartCall(targetProfile.uid, chatName, 'audio');
                      }}
                      className="p-2.5 rounded-xl bg-[#25364e] hover:bg-[#344a69] text-[#67e8c4] transition"
                      title="Audio Call"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onStartCall(targetProfile.uid, chatName, 'video');
                      }}
                      className="p-2.5 rounded-xl bg-[#25364e] hover:bg-[#344a69] text-[#67e8c4] transition"
                      title="Video Call"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* If editing own profile */}
          {isSelf && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="pName">
                  Display name
                </label>
                <input
                  id="pName"
                  type="text"
                  required
                  maxLength={30}
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
                  placeholder="Your display name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b1525] border border-[#2b3e56] text-sm text-white outline-none focus:border-[#67e8c4]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="pHandle">
                  User handle
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    id="pHandle"
                    type="text"
                    maxLength={20}
                    value={handle.replace(/^@/, '')}
                    onChange={(e) => setHandle(`@${e.target.value.replace(/[^a-zA-Z0-9_]/g, '')}`)}
                    placeholder="handle"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#0b1525] border border-[#2b3e56] text-sm text-white outline-none focus:border-[#67e8c4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="pStatus">
                  Status message
                </label>
                <input
                  id="pStatus"
                  type="text"
                  maxLength={50}
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  placeholder="e.g. Available for calls"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b1525] border border-[#2b3e56] text-sm text-white outline-none focus:border-[#67e8c4]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="pBio">
                  About you / Bio
                </label>
                <textarea
                  id="pBio"
                  rows={2}
                  maxLength={160}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a short bio with members…"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b1525] border border-[#2b3e56] text-sm text-white outline-none resize-none focus:border-[#67e8c4]"
                />
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#67e8c4]" />
                  Avatar theme color
                </label>
                <div className="flex gap-2.5 flex-wrap">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarColor(c)}
                      className={`w-7 h-7 rounded-full transition active:scale-90 ${
                        avatarColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#101b2c] scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Avatar Emoji Picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-[#67e8c4]" />
                  Avatar symbol
                </label>
                <div className="flex gap-2 flex-wrap">
                  {EMOJI_PRESETS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatarEmoji(emoji)}
                      className={`w-8 h-8 rounded-xl text-base flex items-center justify-center transition ${
                        avatarEmoji === emoji ? 'bg-[#223956] border-2 border-[#67e8c4]' : 'bg-[#0d1827] hover:bg-[#192b42]'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Favorite Manual */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="pManual">
                  Favorite quick manual (disguise profile)
                </label>
                <input
                  id="pManual"
                  type="text"
                  maxLength={40}
                  value={favoriteManual}
                  onChange={(e) => setFavoriteManual(e.target.value)}
                  placeholder="e.g. Keyboard Shortcuts"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b1525] border border-[#2b3e56] text-sm text-white outline-none focus:border-[#67e8c4]"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#67e8c4] hover:bg-[#52d6b1] text-[#09271f] font-bold text-sm shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving Profile…' : 'Save Profile Changes'}
              </button>

              {saveSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Profile updated successfully!
                </div>
              )}
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
