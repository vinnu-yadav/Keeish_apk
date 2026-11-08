import React, { useEffect, useRef, useState } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  Volume1,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Signal
} from 'lucide-react';
import { CallSignal } from '../types';

interface CallModalProps {
  incomingCall: CallSignal | null;
  onAcceptIncoming: () => void;
  onRejectIncoming: () => void;
  activeCall: {
    partnerName: string;
    partnerHandle?: string;
    partnerAvatarUrl?: string;
    type: 'audio' | 'video';
    status: string;
  } | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onEndCall: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isCameraOff: boolean;
  onToggleCamera: () => void;
  isSpeakerOn: boolean;
  onToggleSpeaker: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  incomingCall,
  onAcceptIncoming,
  onRejectIncoming,
  activeCall,
  localStream,
  remoteStream,
  onEndCall,
  isMuted,
  onToggleMute,
  isCameraOff,
  onToggleCamera,
  isSpeakerOn,
  onToggleSpeaker
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Call duration counter
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (activeCall?.status === 'Connected') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeCall?.status]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle browser native fullscreen
  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Incoming call prompt
  if (incomingCall && !activeCall) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
        <div className="w-full max-w-sm p-6 text-center rounded-3xl bg-[#101b2c] border border-[#273a52] shadow-2xl">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full bg-[#67e8c4]/30 animate-ping" />
            {incomingCall.callerAvatarUrl ? (
              <img
                src={incomingCall.callerAvatarUrl}
                alt={incomingCall.callerName}
                className="relative w-20 h-20 rounded-full object-cover shadow-lg border-2 border-[#67e8c4]"
              />
            ) : (
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#67e8c4] to-[#2563eb] text-[#09271f] flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Phone className="w-9 h-9" />
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold text-white mb-1">
            {incomingCall.callerName || 'Someone'}
          </h3>

          <p className="text-xs text-[#a6b5ca] mb-6 flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {incomingCall.callType === 'video' ? 'Incoming full-screen video call' : 'Incoming full-screen voice call'}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onAcceptIncoming}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#67e8c4] hover:bg-[#54deb4] text-[#09271f] font-bold text-sm shadow-md transition active:scale-95 cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              Accept
            </button>
            <button
              onClick={onRejectIncoming}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#ff5570] hover:bg-[#ff3b5b] text-white font-bold text-sm shadow-md transition active:scale-95 cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              Decline
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active full-screen call screen
  if (activeCall) {
    const isVideo = activeCall.type === 'video';

    return (
      <div className="fixed inset-0 z-[100] w-screen h-[100dvh] bg-[#050912] flex flex-col justify-between overflow-hidden select-none">
        
        {/* Full-Screen Video Background */}
        {isVideo ? (
          <div className="absolute inset-0 w-full h-full bg-[#050912]">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Dark gradient overlays for controls readability */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

            {/* Local PIP Video */}
            <div className="absolute top-16 right-4 sm:top-20 sm:right-6 w-28 sm:w-44 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[#67e8c4] shadow-2xl bg-[#091523] z-20">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${isCameraOff ? 'hidden' : 'block'}`}
              />
              {isCameraOff && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#0d1827] text-gray-400 text-xs gap-1">
                  <VideoOff className="w-6 h-6 text-gray-500" />
                  <span>Camera off</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Full-Screen Audio Call Ambient Canvas */
          <div className="absolute inset-0 w-full h-full bg-radial from-[#12283a] via-[#09121f] to-[#040812] flex flex-col items-center justify-center pointer-events-none">
            <audio ref={remoteAudioRef} autoPlay />

            {/* Pulsing Concentric Audio Rings */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-72 h-72 rounded-full border border-emerald-500/20 animate-ping duration-1000" />
              <div className="absolute w-56 h-56 rounded-full border border-cyan-500/25 animate-pulse" />
              
              {activeCall.partnerAvatarUrl ? (
                <img
                  src={activeCall.partnerAvatarUrl}
                  alt={activeCall.partnerName}
                  className="relative w-36 h-36 rounded-full object-cover border-2 border-[#67e8c4] shadow-[0_0_50px_rgba(103,232,196,0.35)]"
                />
              ) : (
                <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-[#1b3d4f] to-[#0d2232] border-2 border-[#67e8c4] shadow-[0_0_50px_rgba(103,232,196,0.35)] flex items-center justify-center text-4xl font-black text-white">
                  {activeCall.partnerName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="mt-8 text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
                {activeCall.partnerName}
              </h2>
              {activeCall.partnerHandle && (
                <p className="text-sm text-[#67e8c4] mt-0.5 font-mono">
                  {activeCall.partnerHandle}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encrypted P2P Voice Call</span>
              </p>
            </div>
          </div>
        )}

        {/* Top Header Bar */}
        <div className="relative z-30 flex items-center justify-between p-4 sm:p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-sm sm:text-base drop-shadow-md">
                  {activeCall.partnerName}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-emerald-300 backdrop-blur-md">
                  {activeCall.status}
                </span>
              </div>
              <div className="text-xs font-mono text-gray-300 mt-0.5 drop-shadow-sm flex items-center gap-1.5">
                <span>{activeCall.status === 'Connected' ? formatDuration(callDuration) : 'Connecting…'}</span>
                <span>·</span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <Signal className="w-3 h-3" /> HD Quality
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={toggleBrowserFullscreen}
            className="p-2.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/15 text-white backdrop-blur-md transition active:scale-95"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Bottom Floating Control Dock */}
        <div className="relative z-30 flex items-center justify-center gap-3 sm:gap-5 pb-8 sm:pb-12 px-4">
          <div className="flex items-center gap-3 sm:gap-4 p-3 rounded-2xl bg-black/60 border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            
            {/* Mute Button */}
            <button
              onClick={onToggleMute}
              className={`p-3.5 sm:p-4 rounded-xl transition active:scale-90 flex flex-col items-center gap-1 cursor-pointer ${
                isMuted
                  ? 'bg-rose-500/80 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-white/10 text-gray-200 hover:bg-white/20'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
              <span className="text-[10px] font-medium">{isMuted ? 'Muted' : 'Mute'}</span>
            </button>

            {/* Video Camera Toggle (for video calls) */}
            {isVideo && (
              <button
                onClick={onToggleCamera}
                className={`p-3.5 sm:p-4 rounded-xl transition active:scale-90 flex flex-col items-center gap-1 cursor-pointer ${
                  isCameraOff
                    ? 'bg-rose-500/80 text-white shadow-lg shadow-rose-500/30'
                    : 'bg-white/10 text-gray-200 hover:bg-white/20'
                }`}
                title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
              >
                {isCameraOff ? <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6" />}
                <span className="text-[10px] font-medium">{isCameraOff ? 'Camera Off' : 'Camera On'}</span>
              </button>
            )}

            {/* Speaker Toggle */}
            <button
              onClick={onToggleSpeaker}
              className={`p-3.5 sm:p-4 rounded-xl transition active:scale-90 flex flex-col items-center gap-1 cursor-pointer ${
                isSpeakerOn
                  ? 'bg-white/10 text-emerald-300 hover:bg-white/20'
                  : 'bg-white/5 text-gray-400 hover:bg-white/15'
              }`}
              title={isSpeakerOn ? 'Switch to earpiece' : 'Switch to loudspeaker'}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#67e8c4]" /> : <Volume1 className="w-5 h-5 sm:w-6 sm:h-6" />}
              <span className="text-[10px] font-medium">{isSpeakerOn ? 'Speaker' : 'Earpiece'}</span>
            </button>

            {/* End Call Button */}
            <button
              onClick={onEndCall}
              className="px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl bg-gradient-to-r from-[#ff4d6d] to-[#e11d48] text-white font-bold transition active:scale-90 shadow-xl shadow-rose-600/40 flex items-center gap-2 cursor-pointer"
            >
              <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm uppercase tracking-wider font-extrabold">End Call</span>
            </button>

          </div>
        </div>

      </div>
    );
  }

  return null;
};
