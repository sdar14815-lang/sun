'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    OneSignalDeferred?: any[];
  }
}

export default function OneSignalInit() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!appId) {
      console.warn("OneSignal App ID is missing. Set NEXT_PUBLIC_ONESIGNAL_APP_ID in .env.local");
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];

    if (!document.getElementById('onesignal-sdk')) {
      const script = document.createElement('script');
      script.id = 'onesignal-sdk';
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.defer = true;
      document.head.appendChild(script);
    }

    window.OneSignalDeferred.push(async (OneSignal: any) => {
      await OneSignal.init({
        appId: appId,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: false, // Set to false to design a custom premium subscribe trigger, or true for a simple bell.
        },
        welcomeNotification: {
          title: "دار شمس التعافي ☀️",
          message: "أهلاً بك! تم تفعيل التنبيهات بنجاح لمتابعة حالة ذويكم.",
        }
      });
      
      console.log("OneSignal initialized successfully.");
    });
  }, []);

  return null;
}
