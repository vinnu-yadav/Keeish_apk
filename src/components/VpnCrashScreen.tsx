import React from 'react';
import { ShieldAlert, AlertOctagon, Terminal } from 'lucide-react';

interface VpnCrashScreenProps {
  reason?: string;
  ip?: string;
}

export const VpnCrashScreen: React.FC<VpnCrashScreenProps> = ({ reason, ip }) => {
  return (
    <div className="fixed inset-0 z-[999999] bg-[#05060a] text-red-500 font-mono flex flex-col items-center justify-center p-6 select-none cursor-not-allowed">
      <div className="w-full max-w-xl p-8 rounded-2xl bg-[#0d0f17] border-2 border-red-600/70 shadow-[0_0_80px_rgba(239,68,68,0.35)] space-y-6">
        
        <div className="flex items-center gap-4 border-b border-red-900/60 pb-5">
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-600/50 text-red-400 animate-pulse">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-red-400 tracking-wider">
              FATAL SECURITY VIOLATION
            </h1>
            <p className="text-xs text-red-500/80 uppercase tracking-widest mt-0.5">
              KERNEL CODE: 0xDEAD_VPN_DETECTED
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black/60 border border-red-900/40 text-xs text-red-300 space-y-2 leading-relaxed">
          <div className="flex items-center gap-2 text-red-400 font-bold">
            <Terminal className="w-4 h-4" />
            <span>SESSION_HALTED_BY_SECURITY_POLICY</span>
          </div>
          <p>
            An active Virtual Private Network (VPN), tunneling proxy, or data-center relay has been identified on your connection.
          </p>
          {reason && (
            <div className="p-2.5 rounded bg-red-950/40 border border-red-800/40 text-[11px] text-red-200">
              <span className="font-bold">DETECTION_RULE: </span> {reason}
            </div>
          )}
          {ip && (
            <div className="text-[11px] text-red-400/80">
              <span className="font-bold">RECORDED_IP: </span> {ip}
            </div>
          )}
        </div>

        <div className="space-y-2 text-xs text-gray-400">
          <p className="text-red-400 font-semibold">ENFORCED ACTIONS:</p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-300">
            <li>All network sockets &amp; Realtime Database connections severed.</li>
            <li>Local WebRTC audio/video feeds immediately terminated.</li>
            <li>Authentication tokens and reader persistent state purged.</li>
            <li>Application thread execution halted permanently.</li>
          </ul>
        </div>

        <div className="pt-4 border-t border-red-900/40 flex items-center justify-between text-[11px] text-red-500/80">
          <span>STATUS: HARDWARE_LOCKDOWN</span>
          <span>DISCONNECT VPN TO RESTORE</span>
        </div>

      </div>
    </div>
  );
};
