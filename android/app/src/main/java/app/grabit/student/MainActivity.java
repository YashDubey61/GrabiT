package app.grabit.student;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "GrabitMainActivity";
    private static final String ORDERS_CHANNEL_ID = "grabit_orders_channel_v1";
    private static final String PREFS_NAME = "grabit_app_prefs";
    private static final String KEY_LAST_WORKING_URL = "last_working_url";

    private static final String DEFAULT_PRODUCTION_URL = "https://grabit.ventures/customer";
    private static final String[] CANDIDATE_URLS = new String[] {
        DEFAULT_PRODUCTION_URL
    };

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final AtomicBoolean isReconnecting = new AtomicBoolean(false);
    private Runnable autoRetryRunnable;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeGoogleAuthPlugin.class);
        registerPlugin(NativeSettingsPlugin.class);
        super.onCreate(savedInstanceState);
        createOrdersNotificationChannel();

        Bridge bridge = getBridge();
        WebView webView = bridge.getWebView();
        webView.addJavascriptInterface(new AndroidOfflineBridge(webView), "AndroidOfflineBridge");
        webView.setWebViewClient(new GrabitWebViewClient(bridge));
        webView.setVerticalScrollBarEnabled(true);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setOverScrollMode(android.view.View.OVER_SCROLL_IF_CONTENT_SCROLLS);
        webView.setNestedScrollingEnabled(false);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopAutoRetry();
        executor.shutdown();
    }

    private void createOrdersNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(
            ORDERS_CHANNEL_ID,
            "GRABIT Orders",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Order status updates — prepared, ready for pickup, picked up.");
        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.createNotificationChannel(channel);
    }

    public class AndroidOfflineBridge {
        private final WebView webView;

        AndroidOfflineBridge(WebView webView) {
            this.webView = webView;
        }

        @JavascriptInterface
        public void retry(String preferredTarget) {
            Log.d(TAG, "AndroidOfflineBridge.retry triggered with target: " + preferredTarget);
            mainHandler.post(() -> performProbeAndReconnect(webView, preferredTarget));
        }
    }

    private void startAutoRetry(WebView webView, String preferredTarget) {
        stopAutoRetry();
        autoRetryRunnable = new Runnable() {
            @Override
            public void run() {
                performProbeAndReconnect(webView, preferredTarget);
                mainHandler.postDelayed(this, 2000);
            }
        };
        mainHandler.postDelayed(autoRetryRunnable, 1200);
    }

    private void stopAutoRetry() {
        if (autoRetryRunnable != null) {
            mainHandler.removeCallbacks(autoRetryRunnable);
            autoRetryRunnable = null;
        }
    }

    private void performProbeAndReconnect(WebView webView, String preferredTarget) {
        if (isReconnecting.get()) return;
        isReconnecting.set(true);

        executor.execute(() -> {
            try {
                // Priority order: 1) preferredTarget, 2) SharedPreferences last working URL, 3) Candidate list
                SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                String lastSaved = prefs.getString(KEY_LAST_WORKING_URL, null);
                if (lastSaved != null && (lastSaved.contains("192.168.") || lastSaved.contains("localhost") || lastSaved.contains("127.0.0.1"))) {
                    lastSaved = null;
                }

                String cleanPreferred = (preferredTarget != null && !preferredTarget.contains("192.168.") && !preferredTarget.contains("localhost")) ? preferredTarget : null;

                String[] targetsToTest = new String[] {
                    cleanPreferred,
                    DEFAULT_PRODUCTION_URL,
                    lastSaved
                };

                String foundWorkingUrl = null;
                for (String candidate : targetsToTest) {
                    if (candidate == null || candidate.trim().isEmpty() || candidate.contains("offline.html")) {
                        continue;
                    }
                    if (probeUrl(candidate)) {
                        foundWorkingUrl = candidate;
                        break;
                    }
                }

                if (foundWorkingUrl != null) {
                    final String targetToLoad = foundWorkingUrl;
                    Log.i(TAG, "Server connection verified online: " + targetToLoad + ". Reloading WebView...");
                    stopAutoRetry();
                    mainHandler.post(() -> {
                        webView.loadUrl(targetToLoad);
                    });
                }
            } finally {
                isReconnecting.set(false);
            }
        });
    }

    private boolean probeUrl(String urlString) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(urlString);
            conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(1200);
            conn.setReadTimeout(1200);
            conn.setRequestMethod("GET");
            conn.setInstanceFollowRedirects(true);
            int responseCode = conn.getResponseCode();
            // Any response code < 500 (200 OK, 307 redirect, 401 auth, etc.) confirms the server is UP!
            return responseCode > 0 && responseCode < 500;
        } catch (Exception e) {
            return false;
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    private class GrabitWebViewClient extends BridgeWebViewClient {
        GrabitWebViewClient(Bridge bridge) {
            super(bridge);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            if (url != null && !url.contains("offline.html") && url.startsWith("http")) {
                stopAutoRetry();
                getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                    .edit()
                    .putString(KEY_LAST_WORKING_URL, url)
                    .apply();
                Log.d(TAG, "Saved active working URL: " + url);
            }
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame() && isConnectivityError(error.getErrorCode())) {
                String target = request.getUrl() != null ? request.getUrl().toString() : "";
                if (target.contains("offline.html")) {
                    return;
                }
                view.loadUrl(offlineUrl("network", target));
                startAutoRetry(view, target);
                return;
            }
            super.onReceivedError(view, request, error);
        }

        @Override
        public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
            if (request.isForMainFrame() && errorResponse.getStatusCode() >= 500) {
                String target = request.getUrl() != null ? request.getUrl().toString() : "";
                view.loadUrl(offlineUrl("server", target));
                startAutoRetry(view, target);
                return;
            }
            super.onReceivedHttpError(view, request, errorResponse);
        }

        private boolean isConnectivityError(int errorCode) {
            switch (errorCode) {
                case WebViewClient.ERROR_HOST_LOOKUP:
                case WebViewClient.ERROR_CONNECT:
                case WebViewClient.ERROR_TIMEOUT:
                case WebViewClient.ERROR_IO:
                case WebViewClient.ERROR_UNKNOWN:
                    return true;
                default:
                    return false;
            }
        }

        private String offlineUrl(String reason, String target) {
            return "file:///android_asset/public/offline.html?reason=" + reason
                + "&target=" + android.net.Uri.encode(target);
        }
    }
}

