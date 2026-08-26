import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.grabit.vendor',
  appName: 'GRABIT Vendor',
  webDir: 'www',
  appendUserAgent: 'CapacitorApp/GrabItVendor',
  server: {
    url: 'https://grabit.ventures/vendor/auth?next=%2Fvendor',
    cleartext: false,
  },
  android: {
    backgroundColor: '#0a0a0a',
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
