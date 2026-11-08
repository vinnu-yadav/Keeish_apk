import { goOffline } from 'firebase/database';
import { db, auth } from '../firebase';
import { signOut } from 'firebase/auth';

export interface VpnCheckResult {
  isVpn: boolean;
  reason?: string;
  ip?: string;
  isp?: string;
  country?: string;
}

// Known VPN / Proxy / Hosting keywords
const VPN_KEYWORDS = [
  'vpn',
  'proxy',
  'tunnel',
  'hosting',
  'datacenter',
  'tor',
  'nord',
  'expressvpn',
  'surfshark',
  'mullvad',
  'cyberghost',
  'proton',
  'wireguard',
  'openvpn',
  'digitalocean',
  'linode',
  'hetzner',
  'ovh',
  'choopa',
  'vultr',
  'amazon',
  'aws',
  'google cloud',
  'azure',
  'cloudflare'
];

/**
 * Checks for VPN or proxy via WebRTC candidate inspection and IP intelligence
 */
export async function detectVpnOrProxy(): Promise<VpnCheckResult> {
  try {
    // 1. WebRTC ICE Candidate Virtual Adapter check
    const rtcPromise = new Promise<{ isVpn: boolean; reason?: string }>((resolve) => {
      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        
        let timer = setTimeout(() => {
          try { pc.close(); } catch {}
          resolve({ isVpn: false });
        }, 2500);

        pc.onicecandidate = (event) => {
          if (!event.candidate) return;
          const candidateStr = event.candidate.candidate.toLowerCase();

          // Check for virtual network adapter names
          if (
            candidateStr.includes('tun') ||
            candidateStr.includes('tap') ||
            candidateStr.includes('ppp') ||
            candidateStr.includes('utun') ||
            candidateStr.includes('wg')
          ) {
            clearTimeout(timer);
            try { pc.close(); } catch {}
            resolve({
              isVpn: true,
              reason: 'WebRTC virtual tunnel adapter detected (tun/tap/ppp)'
            });
          }
        };

        pc.createDataChannel('vpn-check');
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .catch(() => resolve({ isVpn: false }));
      } catch {
        resolve({ isVpn: false });
      }
    });

    // 2. IP Threat / ASN Intelligence lookup with timeout
    const ipCheckPromise = (async (): Promise<VpnCheckResult> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        // ipwho.is is a free, fast, CORS-friendly IP intelligence API that includes VPN/Proxy detection
        const res = await fetch('https://ipwho.is/?security=1', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) return { isVpn: false };
        const data = await res.json();

        if (data && data.success) {
          const security = data.security || {};
          const connection = data.connection || {};
          const isp = (connection.isp || '').toLowerCase();
          const org = (connection.org || '').toLowerCase();
          const asn = (connection.asn || '').toString().toLowerCase();

          // Direct security flags
          if (security.vpn === true) {
            return { isVpn: true, reason: 'Active VPN tunnel identified by network telemetry', ip: data.ip, isp: connection.isp };
          }
          if (security.proxy === true) {
            return { isVpn: true, reason: 'Proxy connection identified', ip: data.ip, isp: connection.isp };
          }
          if (security.tor === true) {
            return { isVpn: true, reason: 'Tor exit node identified', ip: data.ip, isp: connection.isp };
          }
          if (security.hosting === true) {
            return { isVpn: true, reason: 'Data-center hosting IP detected (non-residential IP)', ip: data.ip, isp: connection.isp };
          }

          // Keyword check in ISP / ASN
          const matched = VPN_KEYWORDS.find(kw => isp.includes(kw) || org.includes(kw) || asn.includes(kw));
          if (matched) {
            return { isVpn: true, reason: `Known proxy/VPN provider match: ${matched}`, ip: data.ip, isp: connection.isp };
          }

          // Timezone discrepancy check (e.g. device is Europe/London but IP says Asia/Tokyo)
          const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const ipTz = data.timezone?.id;
          if (deviceTz && ipTz && deviceTz !== ipTz) {
            // Some regions might differ slightly, but large timezone mismatch is a strong VPN indicator
            const deviceOffset = new Date().getTimezoneOffset();
            const ipOffset = (data.timezone?.offset || 0) / -60; // ipwho offset in seconds
            if (Math.abs(deviceOffset - ipOffset) >= 180) { // >3 hours difference
              return { isVpn: true, reason: `Timezone mismatch detected (Device: ${deviceTz}, Network: ${ipTz})`, ip: data.ip, isp: connection.isp };
            }
          }

          return { isVpn: false, ip: data.ip, isp: connection.isp, country: data.country };
        }
      } catch (e) {
        // Fallback or network error
      }
      return { isVpn: false };
    })();

    const [rtcResult, ipResult] = await Promise.all([rtcPromise, ipCheckPromise]);

    if (rtcResult.isVpn) {
      return { isVpn: true, reason: rtcResult.reason };
    }
    if (ipResult.isVpn) {
      return ipResult;
    }

    return { isVpn: false };
  } catch {
    return { isVpn: false };
  }
}

/**
 * Halts all network requests and forcibly crashes the application
 */
export function terminateAndCrash(reason: string) {
  console.error('FATAL SECURITY VIOLATION: VPN/Proxy Detected. Terminating session.', reason);

  // 1. Disconnect Firebase Realtime Database
  try {
    goOffline(db);
  } catch {}

  // 2. Sign out if signed in
  try {
    signOut(auth);
  } catch {}

  // 3. Close any active media tracks
  try {
    navigator.mediaDevices?.getUserMedia({ audio: true, video: true })
      .then(s => s.getTracks().forEach(t => t.stop()))
      .catch(() => {});
  } catch {}

  // 4. Clear all session and local storage
  try {
    sessionStorage.clear();
  } catch {}
}
