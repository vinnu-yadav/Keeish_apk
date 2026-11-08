import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, db, BASE } from './firebase';
import { TipsCamouflage } from './components/TipsCamouflage';
import { HeartTransitionOverlay } from './components/HeartTransitionOverlay';
import { KeeishChat } from './components/KeeishChat';
import { NameModal } from './components/NameModal';
import { ApkExportModal } from './components/ApkExportModal';
import { VpnCrashScreen } from './components/VpnCrashScreen';
import { detectVpnOrProxy, terminateAndCrash } from './utils/vpnDetector';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [chatName, setChatName] = useState<string>('');
  const [isRevealing, setIsRevealing] = useState<boolean>(false);
  const [heartExpanding, setHeartExpanding] = useState<boolean>(false);
  const [heartFadingOut, setHeartFadingOut] = useState<boolean>(false);
  const [hasEnteredChat, setHasEnteredChat] = useState<boolean>(false);
  const [showFirstTimeNameModal, setShowFirstTimeNameModal] = useState<boolean>(false);
  const [showApkCenter, setShowApkCenter] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // VPN lockdown state
  const [vpnCrash, setVpnCrash] = useState<{ isVpn: boolean; reason?: string; ip?: string } | null>(null);

  // VPN and Proxy Detection Watcher
  useEffect(() => {
    let isMounted = true;

    const performVpnCheck = async () => {
      try {
        const result = await detectVpnOrProxy();
        if (result.isVpn && isMounted) {
          terminateAndCrash(result.reason || 'VPN tunnel identified');
          setVpnCrash({
            isVpn: true,
            reason: result.reason,
            ip: result.ip
          });
        }
      } catch (err) {
        // Silent catch for resilience
      }
    };

    performVpnCheck();

    // Re-check periodically and on network status change
    const interval = setInterval(performVpnCheck, 45000);
    window.addEventListener('online', performVpnCheck);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('online', performVpnCheck);
    };
  }, []);

  // Connectivity listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) {
        // Reset disguise
        setIsRevealing(false);
        setHeartExpanding(false);
        setHeartFadingOut(false);
        setHasEnteredChat(false);
        setChatName('');
        setShowFirstTimeNameModal(false);
        document.title = "Tips — Manuals & Quick Guides";
      }
    });

    return () => unsub();
  }, []);

  // The 4-second sequence when login is successful
  const handleLoginSuccess = async () => {
    if (isRevealing) return;
    setIsRevealing(true);

    try {
      // 1. Keep on login card for 2 seconds
      await new Promise((r) => setTimeout(r, 2000));
      const startTime = Date.now();

      // Confetti burst on successful authentication
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#ff4d6d', '#67e8c4', '#fbbf24']
        });
      } catch {}

      // 2. Allow user to view the heart morph and reveal banner for 1100ms
      await new Promise((r) => setTimeout(r, 1100));

      // 3. Stage 2: Enlarge heart to full screen
      setHeartExpanding(true);

      // Wait 1400ms for heart growth
      await new Promise((r) => setTimeout(r, 1400));

      // 4. Switch to chat in background
      document.title = "Keeish Chat";
      setHasEnteredChat(true);

      // 5. Stage 4: Gently fade out the full screen heart overlay
      setHeartFadingOut(true);

      // Load or query chat name from RTDB
      if (auth.currentUser) {
        const snap = await get(ref(db, `${BASE}/users/${auth.currentUser.uid}/chatName`));
        if (snap.exists() && String(snap.val()).trim()) {
          setChatName(String(snap.val()).trim());
        } else {
          setShowFirstTimeNameModal(true);
        }
      }

      // Ensure total elapsed time from transition start is precisely 4 seconds
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, 4000 - elapsed);
      await new Promise((r) => setTimeout(r, remainingTime));

      setHeartExpanding(false);
      setHeartFadingOut(false);
      setIsRevealing(false);
    } catch (err) {
      console.error('Transition error:', err);
      setIsRevealing(false);
      setHeartExpanding(false);
      setHeartFadingOut(false);
    }
  };

  const handleUpdateChatName = async (newName: string) => {
    if (!currentUser) return;
    await set(ref(db, `${BASE}/users/${currentUser.uid}/chatName`), newName);
    setChatName(newName);
    setShowFirstTimeNameModal(false);
  };

  // If VPN is detected, halt everything and render the fatal crash lockdown
  if (vpnCrash?.isVpn) {
    return <VpnCrashScreen reason={vpnCrash.reason} ip={vpnCrash.ip} />;
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#080f1d] text-[#edf2fc]">
      {/* Offline Toast */}
      {!isOnline && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-amber-500/90 text-[#091523] text-xs font-bold shadow-lg flex items-center gap-2 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>Offline mode — Waiting for network connection</span>
        </div>
      )}

      {/* Screen 1: Tips Camouflage (clean, APK Center removed) */}
      {(!currentUser || !hasEnteredChat) && (
        <TipsCamouflage
          onLoginSuccess={handleLoginSuccess}
          isRevealing={isRevealing}
        />
      )}

      {/* Screen 2: Keeish Chat Screen */}
      {currentUser && hasEnteredChat && (
        <KeeishChat
          currentUser={currentUser}
          chatName={chatName}
          onUpdateChatName={handleUpdateChatName}
          onOpenApkCenter={() => setShowApkCenter(true)}
        />
      )}

      {/* Heart Full-Screen Expanding Transition Overlay */}
      <HeartTransitionOverlay
        isExpanding={heartExpanding}
        isFadingOut={heartFadingOut}
      />

      {/* First-time Chat Name Setup Modal */}
      <NameModal
        isOpen={showFirstTimeNameModal}
        initialName=""
        isFirstTime={true}
        onSave={handleUpdateChatName}
        onClose={() => setShowFirstTimeNameModal(false)}
      />

      {/* Compilable APK & Android Build Center Modal */}
      <ApkExportModal
        isOpen={showApkCenter}
        onClose={() => setShowApkCenter(false)}
      />
    </div>
  );
}
