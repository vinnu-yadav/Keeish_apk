import React, { useState, useEffect } from 'react';
import { X, UserCheck } from 'lucide-react';

interface NameModalProps {
  isOpen: boolean;
  initialName: string;
  isFirstTime: boolean;
  onSave: (name: string) => Promise<void>;
  onClose: () => void;
}

export const NameModal: React.FC<NameModalProps> = ({
  isOpen,
  initialName,
  isFirstTime,
  onSave,
  onClose
}) => {
  const [name, setName] = useState(initialName);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(initialName);
    setErrorMsg('');
  }, [initialName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (trimmed.length < 2 || trimmed.length > 30) {
      setErrorMsg('Name must contain 2 to 30 characters.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      await onSave(trimmed);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not save your name. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-[#111e30] border border-[#354860] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-white text-base">
            {isFirstTime ? 'Choose your chatting name' : 'Edit your chatting name'}
          </h3>
          {!isFirstTime && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2c42] transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-xs text-[#a6b5ca] mb-4">
          This name will be visible to other members.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#c8d3e2] mb-1.5" htmlFor="chatName">
              Chatting name
            </label>
            <input
              id="chatName"
              type="text"
              maxLength={30}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              autoFocus
              className="w-full px-3.5 py-3 rounded-[13px] bg-[#0b1525] border border-[#35465e] text-white text-sm outline-none focus:border-[#67e8c4] focus:ring-2 focus:ring-[#67e8c4]/20 transition"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-[#ffb4b4] leading-normal">{errorMsg}</p>
          )}

          <div className="flex gap-2.5 pt-2">
            {!isFirstTime && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#25364e] hover:bg-[#324866] text-white text-xs font-semibold transition"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#67e8c4] hover:bg-[#52d6b1] text-[#09271f] text-xs font-bold transition disabled:opacity-50"
            >
              <UserCheck className="w-3.5 h-3.5" />
              {isSaving ? 'Saving…' : 'Save name'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
