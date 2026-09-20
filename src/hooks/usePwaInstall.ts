import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __pwaDeferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

// Global variable to capture event
let globalDeferredPrompt: BeforeInstallPromptEvent | null =
  typeof window !== "undefined" && window.__pwaDeferredPrompt
    ? window.__pwaDeferredPrompt
    : null;

// Global modal state broadcaster so Header, Hero, and Footer remain in sync
const modalSubscribers = new Set<(open: boolean) => void>();
let globalModalOpen = false;

const setGlobalModalOpen = (open: boolean) => {
  globalModalOpen = open;
  modalSubscribers.forEach((cb) => cb(open));
};

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    window.__pwaDeferredPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent("pwa-prompt-ready"));
  });
}

export const usePwaInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => (typeof window !== "undefined" ? window.__pwaDeferredPrompt || globalDeferredPrompt : null)
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isModalOpen, setLocalModalOpen] = useState(globalModalOpen);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [browserName, setBrowserName] = useState("Browser");

  // Sync modal state
  const setIsModalOpen = useCallback((open: boolean) => {
    setGlobalModalOpen(open);
  }, []);

  useEffect(() => {
    modalSubscribers.add(setLocalModalOpen);
    return () => {
      modalSubscribers.delete(setLocalModalOpen);
    };
  }, []);

  useEffect(() => {
    // Check standalone mode / installed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    setIsInstalled(isStandalone);

    // Device and Browser detection
    const ua = window.navigator.userAgent || "";
    const lowerUa = ua.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(lowerUa);
    const isAndroidDevice = /android/.test(lowerUa);
    const isMobileDevice = isIosDevice || isAndroidDevice || /mobile|tablet|phone/.test(lowerUa);

    setIsIos(isIosDevice);
    setIsAndroid(isAndroidDevice);
    setIsMobile(isMobileDevice);

    // In-App browser check (WhatsApp, FB, Instagram, Telegram, Twitter, TikTok, etc.)
    const inApp =
      /fban|fbav|instagram|whatsapp|telegram|line|snapchat|micromessenger|tiktok|bytedance/i.test(
        lowerUa
      ) || /wv|webview/i.test(lowerUa);
    setIsInAppBrowser(inApp);

    // Friendly browser name
    if (inApp) {
      setBrowserName("In-App Browser");
    } else if (/samsungbrowser/i.test(lowerUa)) {
      setBrowserName("Samsung Internet");
    } else if (/edg([ea]|ios)?/i.test(lowerUa)) {
      setBrowserName("Edge");
    } else if (/firefox|fxios/i.test(lowerUa)) {
      setBrowserName("Firefox");
    } else if (/chrome|crios/i.test(lowerUa)) {
      setBrowserName("Chrome");
    } else if (/safari/i.test(lowerUa) && !/chrome|crios/i.test(lowerUa)) {
      setBrowserName("Safari");
    } else {
      setBrowserName("Browser");
    }

    // Refresh prompt from window if available
    const prompt = window.__pwaDeferredPrompt || globalDeferredPrompt;
    if (prompt) {
      setDeferredPrompt(prompt);
    }

    const handlePromptReady = () => {
      const p = window.__pwaDeferredPrompt || globalDeferredPrompt;
      setDeferredPrompt(p);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      globalDeferredPrompt = null;
      if (typeof window !== "undefined") {
        window.__pwaDeferredPrompt = null;
      }
      setIsModalOpen(false);
    };

    window.addEventListener("pwa-prompt-ready", handlePromptReady);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("pwa-prompt-ready", handlePromptReady);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [setIsModalOpen]);

  const promptInstall = async () => {
    const activePrompt = deferredPrompt || window.__pwaDeferredPrompt || globalDeferredPrompt;

    // If we have native browser prompt (Android Chrome, Edge, etc.)
    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const choiceResult = await activePrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          setIsInstalled(true);
          setIsModalOpen(false);
        }
        setDeferredPrompt(null);
        globalDeferredPrompt = null;
        if (typeof window !== "undefined") {
          window.__pwaDeferredPrompt = null;
        }
      } catch (err) {
        console.error("Install prompt error:", err);
        setIsModalOpen(true);
      }
    } else {
      // If iOS, unsupported, or beforeinstallprompt pending heuristics
      setIsModalOpen(true);
    }
  };

  return {
    canInstall: !isInstalled,
    isInstalled,
    isIos,
    isAndroid,
    isMobile,
    isInAppBrowser,
    browserName,
    hasNativePrompt: !!(deferredPrompt || window.__pwaDeferredPrompt || globalDeferredPrompt),
    isModalOpen,
    setIsModalOpen,
    promptInstall,
  };
};
