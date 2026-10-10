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

const STORAGE_KEY = "terras_pwa_installed";

// Global variable to capture event early
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

const checkIsInstalledInitial = (): boolean => {
  if (typeof window === "undefined") return false;

  // 1. Standalone display mode (PWA window)
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://");

  if (isStandalone) return true;

  // 2. Launched via PWA start_url parameter
  if (
    window.location.search.includes("source=pwa") ||
    window.location.search.includes("mode=pwa")
  ) {
    return true;
  }

  // 3. Persistent flag from previous installation
  try {
    if (localStorage.getItem(STORAGE_KEY) === "true") {
      return true;
    }
  } catch (_) {}

  return false;
};

export const usePwaInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => (typeof window !== "undefined" ? window.__pwaDeferredPrompt || globalDeferredPrompt : null)
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(checkIsInstalledInitial);
  const [isModalOpen, setLocalModalOpen] = useState(globalModalOpen);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [browserName, setBrowserName] = useState("Browser");

  // Sync modal state across multiple component instances
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
    // Check initial installation indicators
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://") ||
      window.location.search.includes("source=pwa") ||
      window.location.search.includes("mode=pwa");

    let storedInstalled = false;
    try {
      storedInstalled = localStorage.getItem(STORAGE_KEY) === "true";
    } catch (_) {}

    if (isStandalone || storedInstalled) {
      setIsInstalled(true);
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch (_) {}
    }

    // Query navigator.getInstalledRelatedApps (supported on Chromium / Android)
    if (typeof navigator !== "undefined" && "getInstalledRelatedApps" in navigator) {
      try {
        (navigator as any)
          .getInstalledRelatedApps()
          .then((relatedApps: any[]) => {
            if (Array.isArray(relatedApps) && relatedApps.length > 0) {
              setIsInstalled(true);
              try {
                localStorage.setItem(STORAGE_KEY, "true");
              } catch (_) {}
            }
          })
          .catch(() => {});
      } catch (_) {}
    }

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
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch (_) {}
      setDeferredPrompt(null);
      globalDeferredPrompt = null;
      if (typeof window !== "undefined") {
        window.__pwaDeferredPrompt = null;
      }
      setIsModalOpen(false);
    };

    // Watch for display-mode changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        try {
          localStorage.setItem(STORAGE_KEY, "true");
        } catch (_) {}
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange);
    }

    window.addEventListener("pwa-prompt-ready", handlePromptReady);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      }
      window.removeEventListener("pwa-prompt-ready", handlePromptReady);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [setIsModalOpen]);

  const promptInstall = async () => {
    // If already installed, open modal showing installed status with open option
    if (isInstalled) {
      setIsModalOpen(true);
      return;
    }

    const activePrompt = deferredPrompt || window.__pwaDeferredPrompt || globalDeferredPrompt;

    // If we have native browser prompt (Android Chrome, Edge, etc.)
    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const choiceResult = await activePrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          setIsInstalled(true);
          try {
            localStorage.setItem(STORAGE_KEY, "true");
          } catch (_) {}
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
      // If iOS, in-app browser, or beforeinstallprompt pending heuristics
      setIsModalOpen(true);
    }
  };

  const resetInstalledStatus = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
    setIsInstalled(false);
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
    resetInstalledStatus,
  };
};
