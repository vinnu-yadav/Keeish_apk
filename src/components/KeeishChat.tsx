import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  ref,
  push,
  set,
  get,
  update,
  remove,
  onValue,
  onDisconnect,
  serverTimestamp
} from 'firebase/database';
import { db, BASE } from '../firebase';
import {
  MessageItem,
  UserPresence,
  CallSignal,
  UserProfile,
  FollowRequest
} from '../types';
import { InboxView } from './InboxView';
import { DirectChatView } from './DirectChatView';
import { SearchTab } from './SearchTab';
import { AccountTab } from './AccountTab';
import { ProfileModal } from './ProfileModal';
import { CallModal } from './CallModal';
import { PermissionsBanner } from './PermissionsBanner';
import {
  MessageSquare,
  Search,
  User as UserIcon,
  Phone,
  Video
} from 'lucide-react';

interface KeeishChatProps {
  currentUser: FirebaseUser;
  chatName: string;
  onUpdateChatName: (name: string) => Promise<void>;
  onOpenApkCenter: () => void;
}

const rtcConfiguration: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export const KeeishChat: React.FC<KeeishChatProps> = ({
  currentUser,
  chatName,
  onUpdateChatName,
  onOpenApkCenter
}) => {
  // Navigation: 'inbox' (default landing) | 'search' | 'account' | 'directChat'
  const [currentView, setCurrentView] = useState<'inbox' | 'search' | 'account' | 'directChat'>('inbox');
  const [activePartner, setActivePartner] = useState<UserPresence | null>(null);
  const [isLoungeChat, setIsLoungeChat] = useState<boolean>(false);

  // Users, Presence, and Mutual Friends
  const [registeredUsers, setRegisteredUsers] = useState<Record<string, UserProfile>>({});
  const [presenceData, setPresenceData] = useState<Record<string, any>>({});
  const [friendUids, setFriendUids] = useState<Set<string>>(new Set());
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [outgoingPendingUids, setOutgoingPendingUids] = useState<Set<string>>(new Set());
  const [conversationSnippets, setConversationSnippets] = useState<
    Record<string, { lastText?: string; lastTime?: number; unread?: number }>
  >({});

  // Modals & Profile view
  const [inspectedProfile, setInspectedProfile] = useState<UserProfile | null>(null);

  // Calling state
  const [incomingCall, setIncomingCall] = useState<CallSignal | null>(null);
  const [activeCall, setActiveCall] = useState<{
    id: string;
    partnerUid: string;
    partnerName: string;
    partnerHandle?: string;
    partnerAvatarUrl?: string;
    type: 'audio' | 'video';
    status: string;
  } | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callNotice, setCallNotice] = useState<string | null>(null);

  // References
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callListenersRef = useRef<Array<() => void>>([]);
  const ringtoneCtxRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Current user's profile
  const myProfile: UserProfile = registeredUsers[currentUser.uid] || {
    uid: currentUser.uid,
    chatName: chatName || 'Member',
    handle: `@${chatName.toLowerCase().replace(/\s+/g, '') || 'reader'}`,
    statusMessage: 'Available for calls',
    avatarColor: '#67e8c4',
    avatarEmoji: '💡'
  };

  // 1. Setup Live Presence with Firebase connection detection and onDisconnect
  useEffect(() => {
    if (!currentUser || !chatName) return;

    const presenceRef = ref(db, `${BASE}/presence/${currentUser.uid}`);
    const connectedRef = ref(db, '.info/connected');

    const connectedUnsub = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // When client disconnects or closes tab, set online: false in Firebase RTDB
        onDisconnect(presenceRef).set({
          online: false,
          lastActive: serverTimestamp(),
          chatName,
          avatarUrl: myProfile.avatarUrl || ''
        }).catch(() => {});

        // User is currently active
        set(presenceRef, {
          online: true,
          lastActive: serverTimestamp(),
          chatName,
          avatarUrl: myProfile.avatarUrl || ''
        }).catch(() => {});
      }
    });

    const handleWindowOffline = () => {
      update(presenceRef, { online: false, lastActive: serverTimestamp() }).catch(() => {});
    };

    const handleWindowOnline = () => {
      update(presenceRef, { online: true, lastActive: serverTimestamp() }).catch(() => {});
    };

    window.addEventListener('offline', handleWindowOffline);
    window.addEventListener('online', handleWindowOnline);

    return () => {
      connectedUnsub();
      window.removeEventListener('offline', handleWindowOffline);
      window.removeEventListener('online', handleWindowOnline);
      // Clean up on component unmount (logout / app exit)
      onDisconnect(presenceRef).cancel().catch(() => {});
      set(presenceRef, {
        online: false,
        lastActive: serverTimestamp(),
        chatName
      }).catch(() => {});
    };
  }, [currentUser, chatName, myProfile.avatarUrl]);

  // 2. Listen to registered users, presence, friends, and friend requests
  useEffect(() => {
    const usersUnsub = onValue(ref(db, `${BASE}/users`), (snap) => {
      setRegisteredUsers(snap.val() || {});
    });

    const presenceUnsub = onValue(ref(db, `${BASE}/presence`), (snap) => {
      setPresenceData(snap.val() || {});
    });

    // Listen to mutual friends
    const friendsUnsub = onValue(ref(db, `${BASE}/friends/${currentUser.uid}`), (snap) => {
      const val = snap.val() || {};
      setFriendUids(new Set(Object.keys(val)));
    });

    // Incoming friend requests
    const requestsUnsub = onValue(ref(db, `${BASE}/friendRequests/${currentUser.uid}`), (snap) => {
      const list: FollowRequest[] = [];
      snap.forEach((child) => {
        const val = child.val();
        list.push({ id: child.key as string, ...val });
      });
      setFollowRequests(list);
    });

    // Outgoing pending friend requests
    const outgoingUnsub = onValue(ref(db, `${BASE}/outgoingRequests/${currentUser.uid}`), (snap) => {
      const val = snap.val() || {};
      setOutgoingPendingUids(new Set(Object.keys(val)));
    });

    return () => {
      usersUnsub();
      presenceUnsub();
      friendsUnsub();
      requestsUnsub();
      outgoingUnsub();
    };
  }, [currentUser.uid]);

  // 3. User List computation with active/offline status and friend status
  const userList: UserPresence[] = useMemo(() => {
    const ids = new Set([
      ...Object.keys(registeredUsers),
      ...Object.keys(presenceData)
    ]);

    return Array.from(ids)
      .map((uid) => {
        const saved = registeredUsers[uid] || {};
        const presence = presenceData[uid] || {};
        const isOnline = presence.online === true;

        return {
          uid,
          name: saved.chatName || presence.chatName || 'User',
          online: isOnline,
          handle: saved.handle,
          bio: saved.bio,
          statusMessage: saved.statusMessage,
          avatarColor: saved.avatarColor,
          avatarEmoji: saved.avatarEmoji,
          avatarUrl: saved.avatarUrl || presence.avatarUrl || '',
          favoriteManual: saved.favoriteManual,
          isFriend: friendUids.has(uid),
          hasPendingRequest: outgoingPendingUids.has(uid),
          hasIncomingRequest: followRequests.some((r) => r.fromUid === uid && r.status === 'pending')
        };
      })
      .filter((u) => u.name.trim().length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [registeredUsers, presenceData, friendUids, outgoingPendingUids, followRequests]);

  // Keep activePartner in sync with live userList data (e.g. online/offline or avatar updates)
  useEffect(() => {
    if (activePartner) {
      const updated = userList.find((u) => u.uid === activePartner.uid);
      if (updated && (updated.online !== activePartner.online || updated.avatarUrl !== activePartner.avatarUrl || updated.isFriend !== activePartner.isFriend)) {
        setActivePartner(updated);
      }
    }
  }, [userList, activePartner]);

  // 4. Update snippet when conversation receives message
  const handleUpdateConversationSnippet = (chatId: string, lastText: string, lastTime: number) => {
    setConversationSnippets((prev) => ({
      ...prev,
      [chatId]: { lastText, lastTime }
    }));
  };

  // 5. Friend Request Actions ("if not user searches and sent request to user2 and user2 accept that then they can make messages")
  const handleSendFollowRequest = async (targetUid: string, targetName: string) => {
    try {
      const requestPayload: Partial<FollowRequest> = {
        fromUid: currentUser.uid,
        fromName: chatName,
        fromHandle: myProfile.handle || `@${chatName.toLowerCase().replace(/\s+/g, '')}`,
        fromAvatarUrl: myProfile.avatarUrl || '',
        fromAvatarColor: myProfile.avatarColor || '#67e8c4',
        fromAvatarEmoji: myProfile.avatarEmoji || '💡',
        targetUid,
        status: 'pending',
        createdAt: Date.now()
      };

      await set(ref(db, `${BASE}/friendRequests/${targetUid}/${currentUser.uid}`), requestPayload);
      await set(ref(db, `${BASE}/outgoingRequests/${currentUser.uid}/${targetUid}`), true);
    } catch (err) {
      console.error('Send friend request error:', err);
    }
  };

  const handleAcceptFollowRequest = async (request: FollowRequest) => {
    try {
      // Establish mutual friendship
      await set(ref(db, `${BASE}/friends/${currentUser.uid}/${request.fromUid}`), true);
      await set(ref(db, `${BASE}/friends/${request.fromUid}/${currentUser.uid}`), true);

      // Clean up requests
      await remove(ref(db, `${BASE}/friendRequests/${currentUser.uid}/${request.fromUid}`));
      await remove(ref(db, `${BASE}/outgoingRequests/${request.fromUid}/${currentUser.uid}`)).catch(() => {});
    } catch (err) {
      console.error('Accept friend request error:', err);
    }
  };

  const handleDeclineFollowRequest = async (fromUid: string) => {
    try {
      await remove(ref(db, `${BASE}/friendRequests/${currentUser.uid}/${fromUid}`));
      await remove(ref(db, `${BASE}/outgoingRequests/${fromUid}/${currentUser.uid}`)).catch(() => {});
    } catch (err) {
      console.error('Decline friend request error:', err);
    }
  };

  const handleUnfriend = async (targetUid: string) => {
    try {
      await remove(ref(db, `${BASE}/friends/${currentUser.uid}/${targetUid}`));
      await remove(ref(db, `${BASE}/friends/${targetUid}/${currentUser.uid}`));
      await remove(ref(db, `${BASE}/friendRequests/${targetUid}/${currentUser.uid}`)).catch(() => {});
      await remove(ref(db, `${BASE}/outgoingRequests/${currentUser.uid}/${targetUid}`)).catch(() => {});
    } catch (err) {
      console.error('Unfriend error:', err);
    }
  };

  // 6. Incoming calls watcher
  useEffect(() => {
    if (!currentUser) return;

    const unsub = onValue(ref(db, `${BASE}/calls`), (snapshot) => {
      if (activeCall) return;

      let ringingCall: CallSignal | null = null;
      snapshot.forEach((child) => {
        const c = child.val();
        if (c && c.receiverUid === currentUser.uid && c.status === 'ringing') {
          ringingCall = { id: child.key as string, ...c };
        }
      });

      if (ringingCall) {
        setIncomingCall(ringingCall);
        startRingtone();
      } else {
        setIncomingCall((prev) => {
          if (prev) stopRingtone();
          return null;
        });
      }
    });

    return () => unsub();
  }, [currentUser, activeCall]);

  const startRingtone = () => {
    stopRingtone();
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      ringtoneCtxRef.current = new AudioContextClass();

      const playBeep = () => {
        if (!ringtoneCtxRef.current) return;
        const ctx = ringtoneCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = 720;

        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.7);
      };

      ringtoneCtxRef.current.resume().then(() => {
        playBeep();
        ringtoneIntervalRef.current = setInterval(playBeep, 1400);
      });
    } catch (e) {
      console.warn('Ringtone error:', e);
    }
  };

  const stopRingtone = () => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    if (ringtoneCtxRef.current) {
      ringtoneCtxRef.current.close().catch(() => {});
      ringtoneCtxRef.current = null;
    }
  };

  const cleanupCall = async (removeSignal = true) => {
    stopRingtone();

    callListenersRef.current.forEach((stop) => {
      try {
        stop();
      } catch {}
    });
    callListenersRef.current = [];

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);

    const endedCall = activeCall;
    setActiveCall(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsSpeakerOn(true);

    if (removeSignal && endedCall?.id) {
      await update(ref(db, `${BASE}/calls/${endedCall.id}`), {
        status: 'ended',
        endedAt: serverTimestamp()
      }).catch(() => {});
      await remove(ref(db, `${BASE}/calls/${endedCall.id}`)).catch(() => {});
    }
  };

  const createPeerConnection = (callId: string, partnerUid: string) => {
    const pc = new RTCPeerConnection(rtcConfiguration);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      const candRef = push(ref(db, `${BASE}/calls/${callId}/candidates/${currentUser.uid}`));
      set(candRef, event.candidate.toJSON()).catch(() => {});
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setActiveCall((prev) => (prev ? { ...prev, status: 'Connected' } : null));
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setActiveCall((prev) => (prev ? { ...prev, status: 'Connection lost' } : null));
      }
    };

    const candUnsub = onValue(ref(db, `${BASE}/calls/${callId}/candidates/${partnerUid}`), (snapshot) => {
      snapshot.forEach((child) => {
        const c = child.val();
        if (c && pc) {
          pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
        }
      });
    });
    callListenersRef.current.push(candUnsub);

    let callNodeSeen = false;
    const statusUnsub = onValue(ref(db, `${BASE}/calls/${callId}`), (snapshot) => {
      if (!snapshot.exists()) {
        if (callNodeSeen) {
          cleanupCall(false);
        }
        return;
      }
      callNodeSeen = true;
      const status = snapshot.val()?.status;
      if (status === 'ended' || status === 'rejected') {
        cleanupCall(true);
      }
    });
    callListenersRef.current.push(statusUnsub);

    return pc;
  };

  const startCall = async (partnerUid: string, partnerName: string, type: 'audio' | 'video') => {
    if (!currentUser || activeCall) return;

    try {
      const callId = `${currentUser.uid}_${partnerUid}_${Date.now()}`;
      const partnerProfile = registeredUsers[partnerUid];

      setActiveCall({
        id: callId,
        partnerUid,
        partnerName,
        partnerHandle: partnerProfile?.handle,
        partnerAvatarUrl: partnerProfile?.avatarUrl,
        type,
        status: 'Calling…'
      });

      const stream = await navigator.mediaDevices.getUserMedia(
        type === 'video'
          ? { audio: true, video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } }
          : { audio: true, video: false }
      );
      setLocalStream(stream);

      const pc = createPeerConnection(callId, partnerUid);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await set(ref(db, `${BASE}/calls/${callId}`), {
        callerUid: currentUser.uid,
        callerName: chatName,
        callerAvatarUrl: myProfile.avatarUrl || '',
        receiverUid: partnerUid,
        callType: type,
        status: 'ringing',
        offer: { type: offer.type, sdp: offer.sdp },
        createdAt: serverTimestamp()
      });

      const answerUnsub = onValue(ref(db, `${BASE}/calls/${callId}/answer`), async (snapshot) => {
        const answer = snapshot.val();
        if (answer && pc && !pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          setActiveCall((prev) => (prev ? { ...prev, status: 'Connected' } : null));
        }
      });
      callListenersRef.current.push(answerUnsub);
    } catch (err: any) {
      setCallNotice(err?.name === 'NotAllowedError' 
        ? 'Microphone or camera permission was denied.' 
        : 'Could not access audio/video devices on this browser.');
      setTimeout(() => setCallNotice(null), 5000);
      cleanupCall(false);
    }
  };

  const acceptIncomingCall = async () => {
    stopRingtone();
    if (!incomingCall || !currentUser) return;

    const inc = incomingCall;
    try {
      const partnerProfile = registeredUsers[inc.callerUid];
      setActiveCall({
        id: inc.id,
        partnerUid: inc.callerUid,
        partnerName: inc.callerName || 'Unknown member',
        partnerHandle: partnerProfile?.handle,
        partnerAvatarUrl: inc.callerAvatarUrl || partnerProfile?.avatarUrl,
        type: inc.callType,
        status: 'Connecting…'
      });
      setIncomingCall(null);

      const stream = await navigator.mediaDevices.getUserMedia(
        inc.callType === 'video'
          ? { audio: true, video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } }
          : { audio: true, video: false }
      );
      setLocalStream(stream);

      const pc = createPeerConnection(inc.id, inc.callerUid);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      if (inc.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(inc.offer));
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await update(ref(db, `${BASE}/calls/${inc.id}`), {
        status: 'accepted',
        answer: { type: answer.type, sdp: answer.sdp }
      });
    } catch (err: any) {
      setCallNotice('Could not connect audio/video call.');
      setTimeout(() => setCallNotice(null), 5000);
      cleanupCall(false);
    }
  };

  const rejectIncomingCall = async () => {
    stopRingtone();
    if (incomingCall) {
      await update(ref(db, `${BASE}/calls/${incomingCall.id}`), {
        status: 'rejected'
      }).catch(() => {});
    }
    setIncomingCall(null);
  };

  // Navigation handlers
  const handleOpenDirectChat = (partner: UserPresence) => {
    setActivePartner(partner);
    setIsLoungeChat(false);
    setCurrentView('directChat');
  };

  const handleOpenLoungeChat = () => {
    setActivePartner(null);
    setIsLoungeChat(true);
    setCurrentView('directChat');
  };

  const handleBackToInbox = () => {
    setCurrentView('inbox');
    setActivePartner(null);
    setIsLoungeChat(false);
  };

  const handleSaveProfileChanges = async (updated: Partial<UserProfile>) => {
    await update(ref(db, `${BASE}/users/${currentUser.uid}`), updated);
    if (updated.avatarUrl !== undefined) {
      await update(ref(db, `${BASE}/presence/${currentUser.uid}`), {
        avatarUrl: updated.avatarUrl
      }).catch(() => {});
    }
    if (updated.chatName) {
      await onUpdateChatName(updated.chatName);
    }
  };

  return (
    <div className="w-full max-w-4xl h-[100dvh] mx-auto flex flex-col bg-[#0d1625] border-x border-[#273447] text-white overflow-hidden shadow-2xl animate-in fade-in duration-300">
      
      {/* Permission Setup Banner */}
      <PermissionsBanner />

      {/* Call Notice Alert */}
      {callNotice && (
        <div className="py-2 px-3 bg-rose-500/15 border-b border-rose-500/30 text-rose-300 text-center text-xs font-semibold shrink-0 animate-in slide-in-from-top-2">
          {callNotice}
        </div>
      )}

      {/* Screen Views */}
      {currentView === 'inbox' && (
        <InboxView
          currentUserUid={currentUser.uid}
          chatName={chatName}
          users={userList}
          conversations={conversationSnippets}
          onOpenDirectChat={handleOpenDirectChat}
          onOpenLoungeChat={handleOpenLoungeChat}
          onGoToSearch={() => setCurrentView('search')}
          onStartCall={startCall}
        />
      )}

      {currentView === 'search' && (
        <SearchTab
          currentUserUid={currentUser.uid}
          users={userList}
          followRequests={followRequests}
          onOpenDirectChat={handleOpenDirectChat}
          onSendFollowRequest={handleSendFollowRequest}
          onAcceptFollowRequest={handleAcceptFollowRequest}
          onDeclineFollowRequest={handleDeclineFollowRequest}
          onUnfriend={handleUnfriend}
          onViewProfile={(profile) => setInspectedProfile(profile)}
          onStartCall={startCall}
        />
      )}

      {currentView === 'account' && (
        <AccountTab
          currentUserUid={currentUser.uid}
          myProfile={myProfile}
          onUpdateProfile={handleSaveProfileChanges}
          friendsCount={friendUids.size}
        />
      )}

      {currentView === 'directChat' && (
        <DirectChatView
          currentUserUid={currentUser.uid}
          currentUserName={chatName}
          partner={activePartner}
          isLounge={isLoungeChat}
          onBackToInbox={handleBackToInbox}
          onStartCall={startCall}
          onViewProfile={(profile) => setInspectedProfile(profile)}
          onSendFollowRequest={handleSendFollowRequest}
          onUpdateConversationSnippet={handleUpdateConversationSnippet}
        />
      )}

      {/* Bottom Navigation Bar (Visible in Inbox, Search, and Account views) */}
      {currentView !== 'directChat' && (
        <nav className="h-16 bg-[#111e30] border-t border-[#23354c] flex items-center justify-around px-4 shrink-0 select-none z-40">
          
          {/* Inbox Tab Button */}
          <button
            onClick={() => setCurrentView('inbox')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition cursor-pointer ${
              currentView === 'inbox' ? 'text-[#67e8c4]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[11px] font-bold">Inbox</span>
          </button>

          {/* Search Tab Button */}
          <button
            onClick={() => setCurrentView('search')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition cursor-pointer relative ${
              currentView === 'search' ? 'text-[#67e8c4]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[11px] font-bold">Search</span>
            {followRequests.filter((r) => r.status === 'pending').length > 0 && (
              <span className="absolute top-0 right-3 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {/* Account Tab Button */}
          <button
            onClick={() => setCurrentView('account')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition cursor-pointer ${
              currentView === 'account' ? 'text-[#67e8c4]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[11px] font-bold">Account</span>
          </button>

        </nav>
      )}

      {/* Full-Screen Audio & Video Call Modal */}
      <CallModal
        incomingCall={incomingCall}
        onAcceptIncoming={acceptIncomingCall}
        onRejectIncoming={rejectIncomingCall}
        activeCall={activeCall}
        localStream={localStream}
        remoteStream={remoteStream}
        onEndCall={() => cleanupCall(true)}
        isMuted={isMuted}
        onToggleMute={() => {
          if (localStream) {
            const track = localStream.getAudioTracks()[0];
            if (track) {
              track.enabled = !track.enabled;
              setIsMuted(!track.enabled);
            }
          }
        }}
        isCameraOff={isCameraOff}
        onToggleCamera={() => {
          if (localStream) {
            const track = localStream.getVideoTracks()[0];
            if (track) {
              track.enabled = !track.enabled;
              setIsCameraOff(!track.enabled);
            }
          }
        }}
        isSpeakerOn={isSpeakerOn}
        onToggleSpeaker={() => setIsSpeakerOn(!isSpeakerOn)}
      />

      {/* Profile Details Modal */}
      <ProfileModal
        isOpen={Boolean(inspectedProfile)}
        onClose={() => setInspectedProfile(null)}
        currentUserUid={currentUser.uid}
        targetProfile={inspectedProfile}
        onStartCall={startCall}
        isFollowing={inspectedProfile ? friendUids.has(inspectedProfile.uid) : false}
        hasPendingRequest={inspectedProfile ? outgoingPendingUids.has(inspectedProfile.uid) : false}
        onSendFollowRequest={handleSendFollowRequest}
      />

    </div>
  );
};
