import { useState } from "react";

const APP_URL = "https://max2guy.github.io/ministry-report-v2/";

function detectEnv() {
  const ua = navigator.userAgent;
  const isKakao    = /KAKAOTALK/i.test(ua);
  const isIOS      = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid  = /Android/i.test(ua);
  const isSafari   = /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|KAKAOTALK/i.test(ua);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true);
  return { isKakao, isIOS, isAndroid, isSafari, isStandalone };
}

const env = detectEnv();

// ── 카카오톡 인앱 브라우저 오버레이 ─────────────────────────────
function KakaoOverlay() {
  // Android: intent:// 로 크롬/삼성 브라우저 직접 열기
  const chromeIntent =
    `intent://${APP_URL.replace(/^https?:\/\//, "")}#Intent;scheme=https;` +
    `package=com.android.chrome;end`;
  const samsungIntent =
    `intent://${APP_URL.replace(/^https?:\/\//, "")}#Intent;scheme=https;` +
    `package=com.sec.android.app.sbrowser;end`;

  if (env.isAndroid) {
    return (
      <div className="install-overlay">
        <div className="install-overlay-box">
          <div className="install-overlay-icon">🌐</div>
          <h2 className="install-overlay-title">외부 브라우저에서 열어주세요</h2>
          <p className="install-overlay-desc">
            카카오톡 내부 브라우저에서는 앱 설치가 불가합니다.<br />
            아래 버튼을 눌러 브라우저에서 여세요.
          </p>
          <a href={chromeIntent} className="install-overlay-btn primary">
            크롬(Chrome)으로 열기
          </a>
          <a href={samsungIntent} className="install-overlay-btn secondary">
            삼성 인터넷으로 열기
          </a>
          <p className="install-overlay-hint">
            버튼이 작동하지 않으면 링크를 복사해 브라우저 주소창에 붙여넣으세요.
          </p>
          <button
            className="install-overlay-copy"
            onClick={() => navigator.clipboard?.writeText(APP_URL)}
          >
            링크 복사
          </button>
        </div>
      </div>
    );
  }

  // iOS: Safari로 열기 안내
  return (
    <div className="install-overlay">
      <div className="install-overlay-box">
        <div className="install-overlay-icon">🧭</div>
        <h2 className="install-overlay-title">Safari에서 열어주세요</h2>
        <p className="install-overlay-desc">
          카카오톡 내부 브라우저에서는 앱 설치가 불가합니다.
        </p>
        <ol className="install-overlay-steps">
          <li>화면 하단 <strong>···</strong> (더보기) 버튼 탭</li>
          <li><strong>Safari로 열기</strong> 선택</li>
          <li>Safari에서 하단 공유 버튼 <strong>⎙</strong> 탭</li>
          <li><strong>홈 화면에 추가</strong> 선택 후 추가</li>
        </ol>
        <button
          className="install-overlay-copy"
          onClick={() => navigator.clipboard?.writeText(APP_URL)}
        >
          링크 복사
        </button>
      </div>
    </div>
  );
}

// ── iOS Safari 하단 설치 안내 배너 ───────────────────────────────
function IosSafariBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="install-ios-banner">
      <div className="install-ios-banner-content">
        <span className="install-ios-banner-icon">⎙</span>
        <div>
          <strong>홈 화면에 추가</strong>하면 앱처럼 사용할 수 있어요
          <br />
          <span className="install-ios-banner-hint">
            하단 공유 버튼 → <strong>홈 화면에 추가</strong>
          </span>
        </div>
      </div>
      <button className="install-ios-banner-close" onClick={onDismiss} aria-label="닫기">
        ✕
      </button>
    </div>
  );
}

// ── localStorage 안전 래퍼 (iOS Safari 개인정보 보호 모드 대응) ─
function safeGetItem(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSetItem(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

// ── 메인 export ────────────────────────────────────────────────
const DISMISSED_KEY = "pwa-install-banner-dismissed";

export function InstallGuideBanner() {
  const [dismissed, setDismissed] = useState(
    () => !!safeGetItem(DISMISSED_KEY)
  );

  // 이미 설치됨 → 아무것도 표시 안 함
  if (env.isStandalone) return null;

  // 카카오톡 인앱 브라우저
  if (env.isKakao) return <KakaoOverlay />;

  // iOS Safari (설치 안내 배너, 한 번 닫으면 숨김)
  if (env.isIOS && env.isSafari && !dismissed) {
    return (
      <IosSafariBanner
        onDismiss={() => {
          safeSetItem(DISMISSED_KEY, "1");
          setDismissed(true);
        }}
      />
    );
  }

  return null;
}
