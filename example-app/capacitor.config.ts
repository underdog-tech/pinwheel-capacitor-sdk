import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.pinwheel.capacitordemo',
  appName: 'capacitor-sdk-example',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
    // Route fetch/XHR through native HTTP on iOS/Android (avoids WKWebView CORS blocks).
    CapacitorHttp: {
      enabled: true,
    },
  },
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: true,
        },
      }
    : {}),
};

export default config;
