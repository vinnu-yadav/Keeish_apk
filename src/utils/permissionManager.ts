export interface PermissionStatusSummary {
  notifications: 'granted' | 'denied' | 'default';
  camera: 'granted' | 'denied' | 'prompt';
  microphone: 'granted' | 'denied' | 'prompt';
}

/**
 * Checks current browser permissions
 */
export async function getPermissionsStatus(): Promise<PermissionStatusSummary> {
  const result: PermissionStatusSummary = {
    notifications: (typeof Notification !== 'undefined' ? Notification.permission : 'default') as any,
    camera: 'prompt',
    microphone: 'prompt'
  };

  try {
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const cam = await navigator.permissions.query({ name: 'camera' as PermissionName });
        result.camera = cam.state as any;
      } catch {}

      try {
        const mic = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        result.microphone = mic.state as any;
      } catch {}
    }
  } catch {}

  return result;
}

/**
 * Requests Notification permission
 */
export async function requestNotificationAccess(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  try {
    const res = await Notification.requestPermission();
    return res === 'granted';
  } catch {
    return false;
  }
}

/**
 * Requests Camera and Microphone permissions via getUserMedia
 */
export async function requestMediaAccess(): Promise<{ camera: boolean; microphone: boolean }> {
  let cameraGranted = false;
  let micGranted = false;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    cameraGranted = true;
    micGranted = true;
    // Release immediately after granting
    stream.getTracks().forEach((track) => track.stop());
  } catch (err: any) {
    // If combined fails, try audio only
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micGranted = true;
      audioStream.getTracks().forEach((t) => t.stop());
    } catch {}

    // And video only
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraGranted = true;
      videoStream.getTracks().forEach((t) => t.stop());
    } catch {}
  }

  return { camera: cameraGranted, microphone: micGranted };
}

/**
 * Request all required access in one sequence
 */
export async function requestAllPermissions(): Promise<{
  notifications: boolean;
  camera: boolean;
  microphone: boolean;
}> {
  const notif = await requestNotificationAccess();
  const media = await requestMediaAccess();
  return {
    notifications: notif,
    camera: media.camera,
    microphone: media.microphone
  };
}

/**
 * Sends a background/system notification for a message if the app is hidden or blurred
 */
export function sendBackgroundMessageNotification(senderName: string, text: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return;
  }

  const title = `Message from ${senderName || 'Member'}`;
  const options: any = {
    body: text,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: `msg-${Date.now()}`,
    vibrate: [200, 100, 200],
    silent: false
  };

  // If Service Worker registration is active, use it for persistent background notification
  if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, options).catch(() => {
        try {
          new Notification(title, options);
        } catch {}
      });
    }).catch(() => {
      try {
        new Notification(title, options);
      } catch {}
    });
  } else {
    try {
      const notif = new Notification(title, options);
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch {}
  }
}
