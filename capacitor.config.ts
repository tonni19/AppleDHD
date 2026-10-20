import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // NOTE: this is permanent once the app is published — a store listing is tied
  // to its id forever. Change it before the first submission if you want a
  // different domain.
  appId: 'com.appledhd.planner',
  appName: 'appledhd',

  // `next build` with output: 'export' writes here.
  webDir: 'out',

  // The app draws its own background behind the status bar and home indicator;
  // the CSS safe-area insets keep content clear of them.
  android: {
    backgroundColor: '#f8a988',
  },

  ios: {
    backgroundColor: '#f8a988',
    contentInset: 'never',
  },

  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#f8a988',
      showSpinner: false,
    },
    Media: {
      // Without this the plugin writes to MediaStore's INTERNAL collection,
      // which never shows in Photos. Gallery mode targets the shared external
      // collection — the only place an image is actually "in your gallery".
      androidGalleryMode: true,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#e0503a',
    },
  },
};

export default config;
