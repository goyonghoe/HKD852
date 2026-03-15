/**
 * KakaoTalk JavaScript SDK helper.
 * Dynamically loads the SDK and provides a share function.
 */

declare global {
  interface Window {
    Kakao?: {
      init: (appKey: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (params: KakaoShareParams) => void;
      };
    };
  }
}

interface KakaoShareParams {
  objectType: "feed";
  content: {
    title: string;
    description: string;
    imageUrl: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  };
  buttons: Array<{
    title: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  }>;
}

const KAKAO_SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";

let sdkLoadPromise: Promise<void> | null = null;

/**
 * Load the Kakao JS SDK script into the page.
 * Returns immediately if already loaded.
 */
function loadKakaoSdk(): Promise<void> {
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Kakao SDK can only be loaded in the browser"));
      return;
    }

    if (window.Kakao) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = KAKAO_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      sdkLoadPromise = null;
      reject(new Error("Failed to load Kakao SDK"));
    };
    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

/**
 * Ensure the Kakao SDK is loaded and initialized.
 * Safe to call multiple times -- only initializes once.
 */
export async function ensureKakaoLoaded(): Promise<void> {
  await loadKakaoSdk();

  const kakao = window.Kakao;
  if (!kakao) {
    throw new Error("Kakao SDK not available after loading");
  }

  if (!kakao.isInitialized()) {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (!appKey) {
      throw new Error("NEXT_PUBLIC_KAKAO_JS_KEY is not set");
    }
    kakao.init(appKey);
  }
}

interface ShareToKakaoOptions {
  title: string;
  description: string;
  imageUrl: string;
  webUrl: string;
  buttonTitle?: string;
}

/**
 * Share content via KakaoTalk feed template.
 */
export async function shareToKakao({
  title,
  description,
  imageUrl,
  webUrl,
  buttonTitle = "나도 해보기",
}: ShareToKakaoOptions): Promise<void> {
  await ensureKakaoLoaded();

  const kakao = window.Kakao;
  if (!kakao) {
    throw new Error("Kakao SDK not available");
  }

  kakao.Share.sendDefault({
    objectType: "feed",
    content: {
      title,
      description,
      imageUrl,
      link: {
        mobileWebUrl: webUrl,
        webUrl,
      },
    },
    buttons: [
      {
        title: buttonTitle,
        link: {
          mobileWebUrl: webUrl,
          webUrl,
        },
      },
    ],
  });
}
