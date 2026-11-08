import React, { useState, useEffect } from 'react';
import {
  Bell,
  Camera,
  Mic,
  ShieldCheck,
  CheckCircle2,
  X
} from 'lucide-react';
import {
  getPermissionsStatus,
  requestAllPermissions,
  PermissionStatusSummary
} from '../utils/permissionManager';

interface PermissionsBannerProps {
  onPermissionsUpdated?: () => void;
}

export const PermissionsBanner: React.FC<PermissionsBannerProps> = ({
  onPermissionsUpdated
}) => {
  const [status, setStatus] = useState<PermissionStatusSummary | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    getPermissionsStatus().then(setStatus);
  }, []);

  if (isDismissed || !status) return null;

  const needsNotif = status.notifications !== 'granted';
  const needsCam = status.camera !== 'granted';
  const needsMic = status.microphone !== 'granted';

  // If all are already granted, don't show
  if (!needsNotif && !needsCam && !needsMic) {
    return null;
  }

  const handleGrantAll = async () => {
    setIsRequesting(true);
    await requestAllPermissions();
    const updated = await getPermissionsStatus();
    setStatus(updated);
    setIsRequesting(false);
    if (onPermissionsUpdated) onPermissionsUpdated();
  };

  return (
    <div className="relative mx-3 mt-2 mb-1 p-3 rounded-2xl bg-gradient-to-r from-[#11243b] to-[#0d1e33] border border-[#234268] text-white shadow-lg animate-in slide-in-from-top-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-[#67e8c4]/15 text-[#67e8c4] border border-[#67e8c4]/30 shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              Permissions Setup
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                Recommended
              </span>
            </h4>
            <p className="text-[11px] text-gray-300 leading-relaxed mt-0.5">
              Allow Notifications to receive messages when the app is closed, and allow Camera/Mic for incoming calls.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${needsNotif ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/15 text-emerald-300'}`}>
                <Bell className="w-3 h-3" />
                {needsNotif ? 'Notifications needed' : 'Notifications allowed'}
              </span>
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${needsCam ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/15 text-emerald-300'}`}>
                <Camera className="w-3 h-3" />
                {needsCam ? 'Camera' : 'Camera allowed'}
              </span>
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${needsMic ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/15 text-emerald-300'}`}>
                <Mic className="w-3 h-3" />
                {needsMic ? 'Mic' : 'Mic allowed'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleGrantAll}
            disabled={isRequesting}
            className="px-3 py-1.5 rounded-xl bg-[#67e8c4] hover:bg-[#52d9b2] text-[#09271f] font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isRequesting ? 'Requesting…' : 'Grant All'}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg transition"
            title="Dismiss for now"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
