import React, { useState, useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile } from '../types';
import {
  User,
  AtSign,
  Smile,
  Palette,
  Save,
  CheckCircle2,
  LogOut,
  Camera,
  Trash2,
  Image as ImageIcon,
  Users,
  Radio,
  Sparkles
} from 'lucide-react';

interface AccountTabProps {
  currentUserUid: string;
  myProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  friendsCount?: number;
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

export const AccountTab: React.FC<AccountTabProps> = ({
  currentUserUid,
  myProfile,
  onUpdateProfile,
  friendsCount = 0
}) => {
  const [chatName, setChatName] = useState(myProfile.chatName || '');
  const [handle, setHandle] = useState(myProfile.handle || '');
  const [statusMessage, setStatusMessage] = useState(myProfile.statusMessage || 'Available for calls');
  const [bio, setBio] = useState(myProfile.bio || '');
  const [avatarColor, setAvatarColor] = useState(myProfile.avatarColor || '#67e8c4');
  const [avatarEmoji, setAvatarEmoji] = useState(myProfile.avatarEmoji || '💡');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(myProfile.avatarUrl);
  const [favoriteManual, setFavoriteManual] = useState(myProfile.favoriteManual || 'Tech Tips & Shortcuts');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setChatName(myProfile.chatName || '');
    setHandle(myProfile.handle || '');
    setStatusMessage(myProfile.statusMessage || 'Available for calls');
    setBio(myProfile.bio || '');
    setAvatarColor(myProfile.avatarColor || '#67e8c4');
    setAvatarEmoji(myProfile.avatarEmoji || '💡');
    setAvatarUrl(myProfile.avatarUrl);
    setFavoriteManual(myProfile.favoriteManual || 'Tech Tips & Shortcuts');
  }, [myProfile]);

  // Handle image upload from device gallery
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file from your gallery.');
      return;
    }

    // Read and compress image with Canvas
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setImageError('Could not process image on this device.');
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Export as compressed WebP or JPEG
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setAvatarUrl(compressedDataUrl);
        } catch (err) {
          console.error('Image compression error:', err);
          setImageError('Error processing image. Please try another photo.');
        }
      };
      img.onerror = () => {
        setImageError('Failed to load the selected image.');
      };
      img.src = loadEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatName.trim()) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const formattedHandle = handle.trim().startsWith('@')
        ? handle.trim()
        : `@${handle.trim().replace(/\s+/g, '') || 'reader'}`;

      await onUpdateProfile({
        chatName: chatName.trim(),
        handle: formattedHandle,
        statusMessage: statusMessage.trim(),
        bio: bio.trim(),
        avatarColor,
        avatarEmoji,
        avatarUrl: avatarUrl || '',
        favoriteManual: favoriteManual.trim()
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Update profile error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d1625] text-white">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-[#213247] bg-[#111e30] shrink-0">
        <h2 className="text-lg font-extrabold text-white mb-0.5">Account &amp; Profile</h2>
        <p className="text-xs text-[#a6b5ca]">
          Customize your profile photo, handle, status message, and bio
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        
        {/* Profile Card Preview with live Active indicator */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#16273e] to-[#0e1a2b] border border-[#273d59] flex items-center gap-4 shadow-md">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={chatName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-lg border-2 border-[#67e8c4]"
              />
            ) : (
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2 border-white/20"
                style={{ backgroundColor: avatarColor }}
              >
                {avatarEmoji}
              </div>
            )}
            {/* Live Active Status indicator */}
            <span
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#16273e] shadow-sm shadow-emerald-400/80"
              title="Active now"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-lg sm:text-xl text-white truncate">
                {chatName || 'Your Name'}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                Active
              </span>
            </div>
            <p className="text-xs text-[#67e8c4] font-mono mt-0.5">
              {handle || '@handle'}
            </p>
            <p className="text-xs text-gray-300 italic truncate mt-1">
              "{statusMessage || 'Available for calls'}"
            </p>
            <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1.5">
              <Users className="w-3.5 h-3.5 text-[#67e8c4]" />
              <span>{friendsCount} mutual {friendsCount === 1 ? 'friend' : 'friends'}</span>
            </div>
          </div>
        </div>

        {/* Gallery Profile Picture Selector */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#122033] border border-[#233852] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#67e8c4]" />
              <span>Custom Profile Picture</span>
            </h4>
            <span className="text-[11px] text-gray-400">From phone gallery</span>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            Select a photo from your gallery. It will be compressed and visible to all other users in Inbox, Direct Chats, and Search!
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageFileSelect}
            accept="image/*"
            className="hidden"
          />

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1c324e] hover:bg-[#254267] border border-[#2d4d75] text-[#67e8c4] font-semibold text-xs transition active:scale-95 cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
              <span>{avatarUrl ? 'Change Photo from Gallery' : 'Select Photo from Gallery'}</span>
            </button>

            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition active:scale-95 cursor-pointer"
                title="Remove custom photo and use emoji avatar"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove</span>
              </button>
            )}
          </div>

          {imageError && (
            <p className="text-xs text-rose-400 font-medium">{imageError}</p>
          )}
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 rounded-3xl bg-[#122033] border border-[#233852] space-y-4">
          <h4 className="font-bold text-sm text-white flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-[#67e8c4]" />
            <span>Profile Details</span>
          </h4>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="accName">
              Display Name
            </label>
            <input
              id="accName"
              type="text"
              required
              maxLength={30}
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#091321] border border-[#283e58] text-sm text-white outline-none focus:border-[#67e8c4]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="accHandle">
              Username Handle
            </label>
            <div className="relative">
              <AtSign className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                id="accHandle"
                type="text"
                maxLength={20}
                value={handle.replace(/^@/, '')}
                onChange={(e) => setHandle(`@${e.target.value.replace(/[^a-zA-Z0-9_]/g, '')}`)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#091321] border border-[#283e58] text-sm text-white outline-none focus:border-[#67e8c4]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="accStatus">
              Status Message
            </label>
            <input
              id="accStatus"
              type="text"
              maxLength={60}
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="e.g. Active · Available for calls"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#091321] border border-[#283e58] text-sm text-white outline-none focus:border-[#67e8c4]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="accBio">
              About / Bio
            </label>
            <textarea
              id="accBio"
              rows={2}
              maxLength={160}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell friends about yourself…"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#091321] border border-[#283e58] text-sm text-white outline-none resize-none focus:border-[#67e8c4]"
            />
          </div>

          {/* Fallback Theme Color (used if no custom photo) */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#67e8c4]" />
              Avatar Theme Color {!avatarUrl ? '(Active)' : '(Fallback)'}
            </label>
            <div className="flex gap-2.5 flex-wrap">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  className={`w-7 h-7 rounded-full transition active:scale-90 ${
                    avatarColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#122033] scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Avatar Emoji Icon (used if no custom photo) */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-[#67e8c4]" />
              Avatar Emoji Icon {!avatarUrl ? '(Active)' : '(Fallback)'}
            </label>
            <div className="flex gap-2 flex-wrap">
              {EMOJI_PRESETS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatarEmoji(emoji)}
                  className={`w-8 h-8 rounded-xl text-base flex items-center justify-center transition ${
                    avatarEmoji === emoji ? 'bg-[#213752] border-2 border-[#67e8c4]' : 'bg-[#091321] hover:bg-[#1a2c42]'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Favorite manual */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="accManual">
              Favorite Quick Manual
            </label>
            <input
              id="accManual"
              type="text"
              maxLength={40}
              value={favoriteManual}
              onChange={(e) => setFavoriteManual(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#091321] border border-[#283e58] text-sm text-white outline-none focus:border-[#67e8c4]"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#67e8c4] hover:bg-[#52d6b1] text-[#09271f] font-bold text-sm shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving Changes…' : 'Save Profile Changes'}
          </button>

          {saveSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 justify-center font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Profile details saved successfully!</span>
            </div>
          )}
        </form>

        {/* Log out button */}
        <div className="pt-2 pb-6">
          <button
            onClick={() => signOut(auth)}
            className="w-full py-3 px-4 rounded-2xl bg-[#ff5570]/15 hover:bg-[#ff5570]/25 border border-[#ff5570]/30 text-[#ff8093] hover:text-white font-bold text-sm transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out &amp; Lock Camouflage</span>
          </button>
        </div>

      </div>
    </div>
  );
};
