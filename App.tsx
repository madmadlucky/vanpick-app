import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { type ElementRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';

import {
  APP_SCHEME,
  EXTERNAL_APP_SCHEMES,
  INTERNAL_WEBVIEW_HOSTS,
  VANPICK_WEB_URL,
  WEBVIEW_FLOW_HOSTS,
} from './src/config';

type WebViewRef = ElementRef<typeof WebView>;

function parseUrlParts(url: string) {
  const match = /^([a-z][a-z0-9+.-]*):(?:\/\/)?([^/?#:]*)/i.exec(url.trim());

  return {
    scheme: match?.[1]?.toLowerCase() ?? '',
    hostname: match?.[2]?.toLowerCase() ?? '',
  };
}

function getUrlDecision(url: string) {
  const { scheme, hostname } = parseUrlParts(url);
  const isVanPickHost = INTERNAL_WEBVIEW_HOSTS.has(hostname);
  const isKnownFlowHost =
    WEBVIEW_FLOW_HOSTS.has(hostname) ||
    hostname.endsWith('.supabase.co') ||
    hostname.endsWith('.tosspayments.com') ||
    hostname.endsWith('.kakao.com');

  if (scheme === 'http' || scheme === 'https') {
    return {
      action: isVanPickHost || isKnownFlowHost ? ('allow' as const) : ('external-browser' as const),
    };
  }

  if (scheme === APP_SCHEME || scheme === 'about') {
    return {
      action: 'allow' as const,
    };
  }

  if (EXTERNAL_APP_SCHEMES.has(scheme) || (scheme.startsWith('kakao') && scheme !== APP_SCHEME)) {
    return {
      action: 'external-app' as const,
    };
  }

  return {
    action: 'external-browser' as const,
  };
}

function getIntentFallbackUrl(url: string) {
  const fallbackMatch = /(?:^|;)S\.browser_fallback_url=([^;]+)/.exec(url);

  if (!fallbackMatch?.[1]) {
    return null;
  }

  try {
    return decodeURIComponent(fallbackMatch[1]);
  } catch {
    return fallbackMatch[1];
  }
}

function getNavigationLogLabel(url: string) {
  const { scheme, hostname } = parseUrlParts(url);

  if (scheme === 'http' || scheme === 'https') {
    const pathMatch = /^[a-z][a-z0-9+.-]*:\/\/[^/?#:]*(\/[^?#]*)?/i.exec(url.trim());
    return `${scheme}://${hostname}${pathMatch?.[1] ?? ''}`;
  }

  return `${scheme || 'unknown'}://`;
}

export default function App() {
  const webViewRef = useRef<WebViewRef>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const source = useMemo(() => ({ uri: VANPICK_WEB_URL }), []);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack) {
        webViewRef.current?.goBack();
        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [canGoBack]);

  const handleNavigationStateChange = useCallback((navigationState: WebViewNavigation) => {
    setCanGoBack(navigationState.canGoBack);
    console.log('[VanPick WebView] navigation:', getNavigationLogLabel(navigationState.url));
  }, []);

  const handleShouldStartLoad = useCallback((request: WebViewNavigation) => {
    const decision = getUrlDecision(request.url);

    console.log('[VanPick WebView] request:', decision.action, getNavigationLogLabel(request.url));

    if (decision.action === 'allow') {
      return true;
    }

    void Linking.openURL(request.url).catch(() => {
      const fallbackUrl = getIntentFallbackUrl(request.url);

      if (fallbackUrl) {
        void Linking.openURL(fallbackUrl).catch(() => {
          setErrorMessage('외부 브라우저로 링크를 열 수 없습니다.');
        });
        return;
      }

      if (decision.action === 'external-browser') {
        setErrorMessage('외부 브라우저로 링크를 열 수 없습니다.');
      }
    });

    return false;
  }, []);

  const retry = useCallback(() => {
    setErrorMessage(null);
    setIsLoading(true);
    setWebViewKey((currentKey) => currentKey + 1);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <WebView
          key={webViewKey}
          ref={webViewRef}
          source={source}
          style={styles.webView}
          originWhitelist={['*']}
          allowsBackForwardNavigationGestures
          allowsInlineMediaPlayback
          javaScriptEnabled
          domStorageEnabled
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="compatibility"
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          setSupportMultipleWindows={false}
          startInLoadingState
          renderLoading={() => <LoadingScreen />}
          renderError={() => <ErrorScreen message={errorMessage} onRetry={retry} />}
          onLoadStart={() => {
            setErrorMessage(null);
            setIsLoading(true);
          }}
          onLoadEnd={() => setIsLoading(false)}
          onError={(event) => {
            setErrorMessage(event.nativeEvent.description || '네트워크 연결을 확인해 주세요.');
            setIsLoading(false);
          }}
          onHttpError={(event) => {
            const { statusCode } = event.nativeEvent;
            if (statusCode >= 500) {
              setErrorMessage(`서버 응답이 원활하지 않습니다. (${statusCode})`);
            }
          }}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
        />
        {isLoading ? <LoadingOverlay /> : null}
      </View>
    </SafeAreaView>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.centerScreen}>
      <ActivityIndicator color="#0F766E" size="small" />
      <Text style={styles.brandText}>VanPick</Text>
      <Text style={styles.mutedText}>안전하게 연결하는 중입니다.</Text>
    </View>
  );
}

function LoadingOverlay() {
  return (
    <View pointerEvents="none" style={styles.loadingOverlay}>
      <ActivityIndicator color="#0F766E" size="small" />
    </View>
  );
}

function ErrorScreen({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <View style={styles.centerScreen}>
      <Text style={styles.brandText}>VanPick</Text>
      <Text style={styles.errorTitle}>페이지를 불러오지 못했습니다.</Text>
      <Text style={styles.mutedText}>{message ?? '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryButtonText}>다시 시도</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAF8',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7FAF8',
  },
  webView: {
    flex: 1,
    backgroundColor: '#F7FAF8',
  },
  centerScreen: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#F7FAF8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    minHeight: 32,
    minWidth: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(247, 250, 248, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    marginTop: 14,
    color: '#10211D',
    fontSize: 22,
    fontWeight: '700',
  },
  errorTitle: {
    marginTop: 18,
    color: '#10211D',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  mutedText: {
    marginTop: 8,
    color: '#52615C',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 22,
    minHeight: 44,
    minWidth: 112,
    borderRadius: 8,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
