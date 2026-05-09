import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** 이미 standalone(설치됨) 상태인지 확인 */
function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

export type InstallState =
  | "unavailable"   // beforeinstallprompt 미지원 (iOS 등)
  | "ready"         // 설치 가능 (버튼 표시)
  | "installed";    // 이미 설치됨

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<InstallState>(
    isStandalone() ? "installed" : "unavailable",
  );

  useEffect(() => {
    if (isStandalone()) {
      setState("installed");
      return;
    }

    function onBeforeInstall(e: Event) {
      e.preventDefault(); // 브라우저 기본 미니 배너 억제
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setState("ready");
    }

    function onAppInstalled() {
      setDeferredPrompt(null);
      setState("installed");
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function triggerInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setState("installed");
    }
  }

  return { state, triggerInstall };
}
