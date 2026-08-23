package app.grabit.student;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    /** Single stable channel for all order-status pushes — must match
     * AndroidManifest's default_notification_channel_id and the
     * android_channel_id sent in the FCM payload (see
     * lib/notifications/student_push_service.ts) so every code path
     * (foreground JS listener, background/terminated system tray) posts
     * to the same channel instead of Android creating duplicates. */
    private static final String ORDERS_CHANNEL_ID = "grabit_orders_channel_v1";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeGoogleAuthPlugin.class);
        registerPlugin(NativeSettingsPlugin.class);
        super.onCreate(savedInstanceState);
        // Deliberately no manual WindowInsets padding here — Capacitor 8's
        // built-in SystemBars plugin (see node_modules/@capacitor/android's
        // SystemBars.java, auto-registered, default insetsHandling="css")
        // already injects --safe-area-inset-top/right/bottom/left as CSS
        // variables exactly once. A second native setPadding() on the root
        // content view here previously double-applied the top inset: once
        // as real view padding pushing the whole WebView down, then again
        // as CSS padding-top on every <header> (app/globals.css) reading
        // that same injected variable — producing the oversized gap between
        // the status bar and the app's top navigation.
        createOrdersNotificationChannel();

        Bridge bridge = getBridge();
        bridge.getWebView().setWebViewClient(new GrabitWebViewClient(bridge));
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
        // createNotificationChannel is a safe no-op if a channel with this
        // id already exists, so calling it on every launch never creates
        // a duplicate channel.
        manager.createNotificationChannel(channel);
    }

    /**
     * Wraps Capacitor's default client to show a branded GRABIT recovery
     * screen only for genuine connectivity loss (main-frame DNS/connect/
     * timeout failures) and real 5xx outages. 4xx responses, non-main-frame
     * failures, and anything else are left untouched so real server,
     * auth, or payment-callback errors are never hidden behind a fake
     * "offline" screen.
     */
    private static class GrabitWebViewClient extends BridgeWebViewClient {
        GrabitWebViewClient(Bridge bridge) {
            super(bridge);
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame() && isConnectivityError(error.getErrorCode())) {
                view.loadUrl(offlineUrl("network", request.getUrl().toString()));
                return;
            }
            super.onReceivedError(view, request, error);
        }

        @Override
        public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
            if (request.isForMainFrame() && errorResponse.getStatusCode() >= 500) {
                view.loadUrl(offlineUrl("server", request.getUrl().toString()));
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
