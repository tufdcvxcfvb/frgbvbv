import { useEffect, useRef, useState } from 'react';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';

// Helper to get or generate a persistent device ID
export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem('learn_platform_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('learn_platform_device_id', deviceId);
  }
  return deviceId;
}

// Parse user agent for browser, OS, and platform information
export function getDeviceDetails() {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let platform = 'Unknown Platform';

  if (ua.indexOf('Firefox') > -1) browser = 'Mozilla Firefox';
  else if (ua.indexOf('SamsungBrowser') > -1) browser = 'Samsung Internet';
  else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera';
  else if (ua.indexOf('Trident') > -1) browser = 'Internet Explorer';
  else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) browser = 'Microsoft Edge';
  else if (ua.indexOf('Chrome') > -1) browser = 'Google Chrome';
  else if (ua.indexOf('Safari') > -1) browser = 'Apple Safari';

  if (ua.indexOf('Windows NT 10.0') > -1) os = 'Windows 10/11';
  else if (ua.indexOf('Windows NT 6.2') > -1) os = 'Windows 8';
  else if (ua.indexOf('Windows NT 6.1') > -1) os = 'Windows 7';
  else if (ua.indexOf('Macintosh') > -1) os = 'macOS';
  else if (ua.indexOf('X11') > -1) os = 'UNIX';
  else if (ua.indexOf('Linux') > -1) os = 'Linux';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';

  if (/Windows|Macintosh|Linux|X11/.test(ua)) platform = 'Desktop';
  else if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) platform = 'Mobile';

  return {
    browser,
    os,
    platform,
    userAgent: ua,
    screenSize: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language
  };
}

export function useDevToolsDetector(currentUser: UserProfile | null) {
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const currentLogIdRef = useRef<string | null>(null);
  const openTimeRef = useRef<number | null>(null);
  const heartbeatIntervalRef = useRef<any>(null);
  const devToolsOpenRef = useRef(false);

  useEffect(() => {
    if (!currentUser) return;

    const deviceId = getOrCreateDeviceId();
    const details = getDeviceDetails();

    const reportDevToolsOpen = async () => {
      if (devToolsOpenRef.current) return; // Already reported
      devToolsOpenRef.current = true;
      setIsDevToolsOpen(true);
      
      const openedAt = new Date().toISOString();
      openTimeRef.current = Date.now();

      try {
        // Increment DevTool open count on user
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
          devToolOpenCount: increment(1),
          lastSeen: openedAt
        });

        // Add Device Log entry
        const logData = {
          uid: currentUser.uid,
          deviceId,
          openedAt,
          closedAt: '',
          duration: 0,
          browser: details.browser,
          os: details.os,
          platform: details.platform,
          userAgent: details.userAgent,
          screenSize: details.screenSize,
          timestamp: openedAt
        };

        const logsCol = collection(db, 'deviceLogs');
        const docRef = await addDoc(logsCol, logData);
        currentLogIdRef.current = docRef.id;

        // Start Heartbeat every 10 seconds
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = setInterval(async () => {
          if (!currentUser.uid) return;
          const currentTimestamp = new Date().toISOString();
          const elapsedSecs = openTimeRef.current ? Math.round((Date.now() - openTimeRef.current) / 1000) : 10;

          // Update devToolTotalTime on user profile
          await updateDoc(doc(db, 'users', currentUser.uid), {
            devToolTotalTime: increment(10),
            lastSeen: currentTimestamp
          });

          // Update active duration in log
          if (currentLogIdRef.current) {
            await updateDoc(doc(db, 'deviceLogs', currentLogIdRef.current), {
              duration: elapsedSecs,
              lastSeenHeartbeat: currentTimestamp
            });
          }
        }, 10000);

      } catch (err) {
        console.error('Error reporting devtools open:', err);
      }
    };

    const reportDevToolsClosed = async () => {
      if (!devToolsOpenRef.current) return;
      devToolsOpenRef.current = false;
      setIsDevToolsOpen(false);

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      const closedAt = new Date().toISOString();
      const finalDuration = openTimeRef.current ? Math.round((Date.now() - openTimeRef.current) / 1000) : 0;

      try {
        if (currentLogIdRef.current) {
          await updateDoc(doc(db, 'deviceLogs', currentLogIdRef.current), {
            closedAt,
            duration: finalDuration
          });
        }
        currentLogIdRef.current = null;
        openTimeRef.current = null;
      } catch (err) {
        console.error('Error reporting devtools closed:', err);
      }
    };

    // Technique 1: Detection via Threshold of size difference
    // Note: This matches when side-docked or bottom-docked devtools are opened
    const checkSize = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      
      const isOpen = widthDiff > threshold || heightDiff > threshold;
      
      if (isOpen) {
        reportDevToolsOpen();
      } else {
        reportDevToolsClosed();
      }
    };

    // Technique 2: Debugger performance timing loop
    const checkDebugger = () => {
      const startTime = performance.now();
      // eslint-disable-next-line no-debugger
      debugger; 
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // If debugger is paused, duration is extremely long (usually > 100ms)
      if (duration > 100) {
        reportDevToolsOpen();
      }
    };

    // Technique 3: DevTools element style console inspection
    // If we format or evaluate an object with custom getters, we can catch DevTools opening
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: () => {
        reportDevToolsOpen();
        return 'dev-detector';
      }
    });

    const sizeInterval = setInterval(checkSize, 1000);
    const debuggerInterval = setInterval(checkDebugger, 1500);

    // Keep console inspect active
    const consoleInterval = setInterval(() => {
      console.log(element);
      console.clear();
    }, 2000);

    // Technique 4: Keyboard shortcuts detection
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 key
      if (e.key === 'F12') {
        reportDevToolsOpen();
      }
      // Ctrl+Shift+I or Ctrl+Shift+J or Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        reportDevToolsOpen();
      }
      // Cmd+Opt+I (Mac)
      if (e.metaKey && e.altKey && e.key === 'i') {
        reportDevToolsOpen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', checkSize);

    // Initial check
    checkSize();

    return () => {
      clearInterval(sizeInterval);
      clearInterval(debuggerInterval);
      clearInterval(consoleInterval);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', checkSize);
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [currentUser]);

  return { isDevToolsOpen };
}
